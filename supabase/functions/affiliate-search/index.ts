import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Categories for affiliate products
const affiliateCategories = [
  { id: "tech", query: "best tech gadgets affiliate deals", keywords: ["laptop", "phone", "headphones", "tablet", "camera"] },
  { id: "travel", query: "best travel deals affiliate booking", keywords: ["flights", "hotels", "vacation", "trips", "tours"] },
  { id: "fitness", query: "best fitness equipment affiliate deals", keywords: ["gym", "workout", "exercise", "health", "supplements"] },
  { id: "learning", query: "best online courses affiliate", keywords: ["courses", "bootcamp", "certification", "training", "education"] },
  { id: "lifestyle", query: "best lifestyle products affiliate deals", keywords: ["home", "kitchen", "furniture", "accessories"] }
];

// Search for affiliate products using Exa
async function searchAffiliateProducts(category: string): Promise<any[]> {
  const EXA_API_KEY = Deno.env.get("exa_API_key");
  if (!EXA_API_KEY) {
    throw new Error("Exa API key not configured");
  }

  const categoryConfig = affiliateCategories.find(c => c.id === category) || affiliateCategories[0];
  
  console.log(`Searching affiliate products for: ${category}`);

  const response = await fetch("https://api.exa.ai/search", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${EXA_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `${categoryConfig.query} 2024 2025 best recommendations buy`,
      type: "neural",
      useAutoprompt: true,
      numResults: 10,
      contents: {
        text: { maxCharacters: 1500 }
      }
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Exa API error: ${response.status} - ${errorText}`);
    throw new Error(`Exa API error: ${response.status}`);
  }

  const data = await response.json();
  console.log(`Exa returned ${data.results?.length || 0} results`);
  
  return data.results || [];
}

// Use AI to extract products with affiliate potential from search results
async function extractAffiliateProducts(results: any[], category: string): Promise<any[]> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    throw new Error("LOVABLE_API_KEY not configured");
  }

  const context = results.slice(0, 8).map((r, i) => {
    return `[${i}] URL: ${r.url}
Title: ${r.title}
Text: ${r.text?.substring(0, 1000) || ""}`;
  }).join("\n\n---\n\n");

  const systemPrompt = `You are extracting product recommendations from search results for the "${category}" category.

For each product found, extract:
- title: Product name
- price: Estimated price in USD (be realistic based on current 2024-2025 market prices)
- description: Brief description (max 100 chars)
- affiliateUrl: The URL from the search result (we'll use this for affiliate tracking)
- roi: Return on investment description (e.g., "High - productivity boost", "Medium - lifestyle upgrade")
- image: null (will be handled by frontend)
- resultIndex: Which search result (0-7)

Search Results:
${context}

Return a JSON array of 6-10 products with realistic prices.
Format: [{"title": "...", "price": number, "description": "...", "affiliateUrl": "...", "roi": "...", "resultIndex": 0}, ...]

IMPORTANT:
- Only include products with clear prices or that you can estimate accurately
- Prefer products from reputable affiliate-friendly sites (Amazon, Best Buy, REI, Booking.com, Udemy, etc.)
- Sort by price from highest to lowest
- Be realistic with pricing!`;

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
        { role: "user", content: `Extract affiliate products for ${category}` }
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`AI gateway error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  
  try {
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }
    const arrayMatch = jsonStr.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      jsonStr = arrayMatch[0];
    }
    
    const products = JSON.parse(jsonStr);
    
    // Enrich with source data
    return products.map((product: any) => {
      const sourceResult = results[product.resultIndex] || results[0];
      return {
        ...product,
        source: new URL(sourceResult?.url || "https://example.com").hostname.replace("www.", ""),
        affiliateUrl: sourceResult?.url || product.affiliateUrl,
        category
      };
    });
  } catch (e) {
    console.error("Failed to parse AI response:", content, e);
    return [];
  }
}

// Fallback: Generate curated affiliate products using AI
async function generateAffiliateProducts(category: string): Promise<any[]> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    throw new Error("LOVABLE_API_KEY not configured");
  }

  const categoryPrompts: Record<string, string> = {
    tech: "Generate 8 popular tech products with current 2024-2025 prices (laptops, phones, headphones, tablets, cameras, smart home devices)",
    travel: "Generate 8 travel experiences/products with realistic prices (vacation packages, luggage, travel gear, flight upgrades, hotel stays)",
    fitness: "Generate 8 fitness products/services with current prices (gym memberships, equipment, supplements, wearables, training programs)",
    learning: "Generate 8 educational products with prices (online courses, bootcamps, certifications, books, subscriptions)",
    lifestyle: "Generate 8 lifestyle products with prices (furniture, kitchen appliances, home office setup, accessories)"
  };

  const systemPrompt = `${categoryPrompts[category] || categoryPrompts.tech}

Return a JSON array with realistic current market prices:
[{"title": "Product Name", "price": number_in_USD, "description": "Brief description", "affiliateUrl": "https://example.com/product", "roi": "High/Medium/Low - reason", "source": "Store name"}, ...]

Sort from highest to lowest price. Use real product names and realistic 2024-2025 pricing!`;

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
        { role: "user", content: `Generate affiliate products for ${category}` }
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`AI gateway error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  
  try {
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }
    const arrayMatch = jsonStr.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      jsonStr = arrayMatch[0];
    }
    
    return JSON.parse(jsonStr).map((p: any) => ({ ...p, category }));
  } catch {
    console.error("Failed to parse AI response:", content);
    return [];
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { category = "tech" } = await req.json();
    
    console.log(`Fetching affiliate products for: ${category}`);
    
    let products: any[] = [];
    
    // Try Exa search first
    try {
      const results = await searchAffiliateProducts(category);
      if (results.length > 0) {
        products = await extractAffiliateProducts(results, category);
      }
    } catch (exaError) {
      console.error("Exa search failed:", exaError);
    }
    
    // Fallback to AI generation
    if (products.length === 0) {
      products = await generateAffiliateProducts(category);
    }
    
    // Sort by price descending
    products.sort((a: any, b: any) => b.price - a.price);
    
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
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
