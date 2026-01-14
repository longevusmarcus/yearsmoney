import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Category-specific search queries
const categoryQueries: Record<string, { query: string; examples: string }> = {
  tech: {
    query: "best tech gadgets 2024 2025 buy recommended",
    examples: "laptops, phones, headphones, tablets, smartwatches, cameras"
  },
  travel: {
    query: "best travel deals vacation packages 2024 2025",
    examples: "vacation packages, flights, hotels, cruises, travel gear, luggage"
  },
  fitness: {
    query: "best fitness equipment home gym 2024 2025",
    examples: "gym equipment, workout gear, fitness trackers, supplements, yoga mats"
  },
  learning: {
    query: "best online courses certifications 2024 2025",
    examples: "online courses, bootcamps, certifications, subscriptions, books"
  },
  lifestyle: {
    query: "best home products lifestyle 2024 2025",
    examples: "home decor, kitchen appliances, furniture, smart home devices"
  }
};

// Search with Exa
async function searchWithExa(category: string): Promise<any[]> {
  const EXA_API_KEY = Deno.env.get("exa_API_key");
  if (!EXA_API_KEY) {
    console.log("[Exa] No API key");
    return [];
  }

  const config = categoryQueries[category] || categoryQueries.tech;
  console.log(`[Exa] Searching for ${category}: ${config.query}`);

  try {
    const response = await fetch("https://api.exa.ai/search", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${EXA_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: config.query,
        type: "neural",
        useAutoprompt: true,
        numResults: 12,
        contents: { text: { maxCharacters: 2000 } }
      }),
    });

    if (!response.ok) {
      console.error(`[Exa] Error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    console.log(`[Exa] Found ${data.results?.length || 0} results`);
    return data.results || [];
  } catch (e) {
    console.error("[Exa] Error:", e);
    return [];
  }
}

// Extract products with AI
async function extractProducts(category: string, exaResults: any[]): Promise<any[]> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

  const config = categoryQueries[category] || categoryQueries.tech;
  
  const context = exaResults.slice(0, 10).map((r, i) => 
    `[${i}] ${r.title}\nURL: ${r.url}\n${r.text?.substring(0, 600) || ""}`
  ).join("\n\n---\n");

  const systemPrompt = `Extract 8-10 ${category.toUpperCase()} products/services from these search results.

Category: ${category}
Examples: ${config.examples}

Search Results:
${context}

Return a JSON array of products with realistic 2024-2025 prices, sorted HIGH to LOW:
[{
  "title": "Product name",
  "price": number_in_USD,
  "description": "Brief description (1-2 sentences)",
  "affiliateUrl": "URL from search results",
  "roi": "High/Medium/Low - brief reason",
  "source": "website name"
}]

IMPORTANT:
- Extract EXACTLY 8 products for this ${category} category
- Use realistic current retail/market prices
- Include a MIX of premium and affordable options
- All products must be relevant to ${category}
- Sort by price from highest to lowest`;

  console.log(`[AI] Extracting ${category} products...`);

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Extract ${category} products from the search results` }
        ],
      }),
    });

    if (!response.ok) {
      console.error(`[AI] Error: ${response.status}`);
      throw new Error(`AI error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1].trim();
    const arrayMatch = jsonStr.match(/\[[\s\S]*\]/);
    if (arrayMatch) jsonStr = arrayMatch[0];
    
    const products = JSON.parse(jsonStr);
    console.log(`[AI] Extracted ${products.length} ${category} products`);
    
    // Sort by price descending and add category
    return products
      .map((p: any) => ({ ...p, category }))
      .sort((a: any, b: any) => (b.price || 0) - (a.price || 0));
  } catch (e) {
    console.error("[AI] Extract error:", e);
    return [];
  }
}

// Generate products when search fails
async function generateProducts(category: string): Promise<any[]> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

  const config = categoryQueries[category] || categoryQueries.tech;
  
  const systemPrompt = `Generate 8 realistic ${category} products/services with current 2024-2025 prices.

Category: ${category}
Examples: ${config.examples}

Return a JSON array sorted by price HIGH to LOW:
[{
  "title": "Product name",
  "price": number_in_USD,
  "description": "Brief description",
  "affiliateUrl": "https://example.com",
  "roi": "High/Medium/Low - reason",
  "source": "Store name",
  "category": "${category}"
}]

Include a mix of premium (expensive) and affordable options. Use realistic prices!`;

  console.log(`[AI] Generating ${category} products...`);

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate ${category} product recommendations` }
        ],
      }),
    });

    if (!response.ok) throw new Error(`AI error: ${response.status}`);

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1].trim();
    const arrayMatch = jsonStr.match(/\[[\s\S]*\]/);
    if (arrayMatch) jsonStr = arrayMatch[0];
    
    const products = JSON.parse(jsonStr);
    console.log(`[AI] Generated ${products.length} ${category} products`);
    
    return products.sort((a: any, b: any) => (b.price || 0) - (a.price || 0));
  } catch (e) {
    console.error("[AI] Generate error:", e);
    return [];
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { category = "tech" } = await req.json();
    console.log(`\n=== Affiliate Search: ${category} ===`);
    
    let products: any[] = [];
    
    // Try Exa search first
    const exaResults = await searchWithExa(category);
    
    if (exaResults.length > 0) {
      products = await extractProducts(category, exaResults);
    }
    
    // Fallback to generation if not enough products
    if (products.length < 5) {
      console.log(`Only ${products.length} products, generating more...`);
      const generated = await generateProducts(category);
      products = [...products, ...generated].slice(0, 10);
    }
    
    // Ensure all products have the category
    products = products.map(p => ({ ...p, category }));
    
    // Sort by price descending
    products.sort((a: any, b: any) => (b.price || 0) - (a.price || 0));
    
    console.log(`Returning ${products.length} ${category} products`);
    
    return new Response(JSON.stringify({
      success: true,
      category,
      products
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("affiliate-search error:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error",
      products: []
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
