import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, messages, context, query, price, asset, amount, hourlyLifeCost, yearlyOptionalHours, income, expenses } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Different system prompts based on type
    let systemPrompt = "";
    let userPrompt = "";
    let shouldStream = false;

    switch (type) {
      case "general":
        shouldStream = true;
        systemPrompt = `You are a Time Advisor AI that helps users understand the true cost of their financial decisions in terms of life hours.

User's financial context:
${context}

Your role:
- Help users optimize their time and money decisions
- Always express costs in hours of life, not just dollars
- Be reflective and existential, but not preachy or guilt-inducing
- Provide actionable suggestions
- Keep responses concise and impactful

Remember: Every dollar they spend represents a portion of their finite life.`;
        break;

      case "purchase":
        systemPrompt = `You are a purchase analyzer. Given a product query, estimate its price and suggest alternatives.
Return JSON only with this structure:
{
  "productName": "Full product name",
  "price": estimated_price_number,
  "waitSuggestion": "When to wait for sales (e.g., 'Black Friday typically offers 20% off')" or null,
  "hoursSavedWaiting": estimated_hours_saved_number or null,
  "alternatives": [
    {"title": "Alternative name", "price": price_number, "source": "Amazon/eBay/etc"}
  ]
}`;
        userPrompt = `Analyze this purchase: "${query}"${price ? ` with estimated price $${price}` : ""}. Find cheaper alternatives.`;
        break;

      case "risk":
        systemPrompt = `You are an investment risk analyzer. Analyze the volatility and risk of an asset.
Return JSON only with this structure:
{
  "asset": "Asset name",
  "potentialGainPercent": realistic_gain_percentage,
  "potentialLossPercent": realistic_loss_percentage,
  "volatilityLevel": "low" | "medium" | "high",
  "recommendation": "Brief recommendation considering the time-value perspective"
}`;
        userPrompt = `Analyze the risk of investing $${amount} in ${asset}. Consider current market conditions and historical volatility.`;
        break;

      case "opportunities":
        systemPrompt = `You are a life optimization advisor. Suggest meaningful ways to spend optional life hours.
Return JSON only with this structure:
{
  "opportunities": [
    {
      "id": "unique_id",
      "category": "travel" | "tech" | "learning" | "fitness" | "experience",
      "title": "Opportunity title",
      "hours": estimated_hours_cost,
      "description": "Brief description",
      "icon": "travel" | "tech" | "learning" | "fitness" | "experience",
      "roi": "ROI description"
    }
  ]
}

Consider the user has ${yearlyOptionalHours} optional hours per year and each hour costs them ~$${hourlyLifeCost?.toFixed(2)}.`;
        userPrompt = `Suggest 6 meaningful opportunities for someone with ${yearlyOptionalHours} optional hours/year, earning $${income}/month with $${expenses}/month expenses. Include a mix of categories: travel, tech, learning, fitness, experiences.`;
        break;

      default:
        throw new Error("Invalid type");
    }

    if (shouldStream) {
      // Streaming response for chat
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            ...(messages || [])
          ],
          stream: true,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error(`AI gateway error: ${response.status}`);
      }

      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    } else {
      // Non-streaming JSON response
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error(`AI gateway error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      try {
        const parsed = JSON.parse(content);
        return new Response(JSON.stringify(parsed), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch {
        return new Response(JSON.stringify({ error: "Failed to parse AI response" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }
  } catch (error) {
    console.error("time-advisor error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
