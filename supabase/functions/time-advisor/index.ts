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
    const { type, messages, lang = "it", context, query, price, asset, amount, hourlyLifeCost, yearlyOptionalHours, income, expenses, netWorth, goalYears, seed } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Different system prompts based on type
    let systemPrompt = "";
    let userPrompt = "";
    let shouldStream = false;

    switch (type) {
      case "chat":
      case "general":
        shouldStream = true;
        systemPrompt = `You are a Time Advisor AI that helps users understand the true cost of their financial decisions in terms of life hours.

${context ? `User's financial context:\n${context}` : ""}

Your role:
- Help users optimize their time and money decisions
- Always express costs in hours of life, not just dollars
- Be reflective and existential, but not preachy or guilt-inducing
- Provide actionable suggestions
- Keep responses concise and impactful (2-3 paragraphs max)

Remember: Every dollar they spend represents a portion of their finite life. Time is the ultimate currency.`;
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

      case "scenarios": {
        const g = Number(goalYears) || 10;
        systemPrompt = `You are a financial freedom planner. The user measures wealth in "years of freedom" = net worth / yearly expenses.
Create 4 DIFFERENT, concrete and realistic scenarios that would let the user reach their goal of ${g} years of freedom.
Each scenario changes the ratio between income, expenses and net worth with a distinct lever. You MUST include at least one scenario whose main lever is NET WORTH / assets (investing existing capital, compounding returns ~5-7% real per year, selling or reallocating an asset) where income and expenses stay close to current values, and at least one "mix" scenario that changes all three (income, expenses and net worth).
Return JSON only with this structure:
{
  "scenarios": [
    {
      "title": "Short scenario name",
      "lever": "income" | "expenses" | "assets" | "mix",
      "monthlyIncome": number,
      "monthlyExpenses": number,
      "netWorth": number,
      "yearsToGoal": number,
      "description": "1-2 sentences explaining the trade-off in terms of time, concrete and actionable"
    }
  ]
}
Rules: numbers must be plausible deltas from the current situation (no more than ~2.5x income, no expenses below ~45% of current), and yearsToGoal is how many years of effort before reaching ${g} years of freedom. Vary the scenarios each time (variation seed: ${seed ?? Math.random()}).`;
        userPrompt = `Current situation: monthly income ${income}, monthly expenses ${expenses}, net worth ${netWorth}. Goal: ${g} years of freedom. Give 3 fresh scenarios.`;
        break;
      }

      default:
        throw new Error("Invalid type");

    }

    const langName = lang === "en" ? "English" : "Italian";
    systemPrompt += `

IMPORTANT: Write ALL user-facing text (including any JSON string values such as recommendations, titles, descriptions) in ${langName}. Never answer in another language.`;

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
      // Deterministic fallback for scenarios so the UI never dead-ends on AI hiccups
      const fallbackScenarios = () => {
        const g = Number(goalYears) || 10;
        const inc = Number(income) || 0;
        const exp = Number(expenses) || 0;
        const nw = Number(netWorth) || 0;
        const it = lang !== "en";
        const build = (
          title: string,
          lever: string,
          mi: number,
          me: number,
          description: string,
          nwOverride?: number,
        ) => {
          const target = me * 12 * g;
          const startNw = nwOverride ?? nw;
          const monthlySave = mi - me;
          const yearsToGoal = startNw >= target
            ? 0
            : monthlySave > 0
              ? Math.max(0, (target - startNw) / (monthlySave * 12))
              : 99;
          return {
            title,
            lever,
            monthlyIncome: Math.round(mi),
            monthlyExpenses: Math.round(me),
            netWorth: Math.round(Math.max(startNw, target)),
            yearsToGoal: Math.round(yearsToGoal * 10) / 10,
            description,
          };
        };
        return [
          build(
            it ? "Spendi meno" : "Spend less",
            "expenses",
            inc,
            Math.max(1, exp * 0.7),
            it
              ? "Taglia il 30% delle spese: abbassi il capitale necessario e liberi risparmio ogni mese."
              : "Cut 30% of expenses: you lower the capital needed and free up monthly savings.",
          ),
          build(
            it ? "Guadagna di più" : "Earn more",
            "income",
            inc * 1.6,
            exp,
            it
              ? "Aumenta le entrate del 60% mantenendo lo stesso stile di vita."
              : "Grow income by 60% while keeping the same lifestyle.",
          ),
          build(
            it ? "Fai crescere il patrimonio" : "Grow your assets",
            "assets",
            inc,
            exp,
            it
              ? "Stesso stile di vita, ma il patrimonio investito cresce (~6% l'anno reale): il capitale lavora al posto tuo."
              : "Same lifestyle, but your invested net worth compounds (~6% real per year): capital works for you.",
            Math.max(nw * 1.35, nw + exp * 12),
          ),
          build(
            it ? "Equilibrio" : "Balanced",
            "mix",
            inc * 1.3,
            Math.max(1, exp * 0.85),
            it
              ? "Un mix realistico: +30% entrate, -15% spese e patrimonio investito."
              : "A realistic mix: +30% income, -15% expenses and invested assets.",
            Math.max(nw * 1.15, nw),
          ),
        ];

      };

      // Non-streaming JSON response
      let response: Response | null = null;
      try {
        response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
      } catch (fetchErr) {
        console.error("gateway fetch failed:", fetchErr);
      }

      if (!response || !response.ok) {
        const status = response?.status ?? 0;
        console.error("gateway error status:", status, response ? await response.text() : "no response");
        if (type === "scenarios") {
          return new Response(JSON.stringify({ scenarios: fallbackScenarios(), fallback: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error(`AI gateway error: ${status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      try {
        const parsed = JSON.parse(content);
        if (type === "scenarios" && !Array.isArray(parsed?.scenarios)) {
          return new Response(JSON.stringify({ scenarios: fallbackScenarios(), fallback: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify(parsed), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch {
        if (type === "scenarios") {
          return new Response(JSON.stringify({ scenarios: fallbackScenarios(), fallback: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
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
