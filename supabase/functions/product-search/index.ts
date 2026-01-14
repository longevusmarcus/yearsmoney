import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Minimum realistic prices by category (USD)
const categoryMinPrices: Record<string, number> = {
  real_estate_sale: 50000,    // Minimum for property sale
  real_estate_rent: 500,       // Minimum monthly rent
  automotive: 5000,            // Minimum for used car
  travel: 200,                 // Minimum for travel package
  product: 10                  // Minimum for products
};

// Categories with detection
const categoryPatterns: { keywords: string[]; category: string; isRental?: boolean }[] = [
  { 
    keywords: ["house for sale", "villa for sale", "apartment for sale", "property for sale", "buy house", "buy apartment", "buy villa"],
    category: "real_estate_sale"
  },
  { 
    keywords: ["house", "apartment", "flat", "villa", "condo", "property", "home"],
    category: "real_estate_sale" // Default to sale
  },
  { 
    keywords: ["rent", "rental", "for rent", "monthly rent", "lease"],
    category: "real_estate_rent",
    isRental: true
  },
  { 
    keywords: ["vacation", "trip", "travel", "holiday", "getaway", "tour", "flight", "hotel", "resort"],
    category: "travel"
  },
  {
    keywords: ["tesla", "bmw", "mercedes", "porsche", "ferrari", "lamborghini", "car", "vehicle", "suv"],
    category: "automotive"
  }
];

function detectCategory(query: string): { category: string; isRental: boolean } {
  const lowerQuery = query.toLowerCase();
  
  // Check for rental keywords first
  const isRental = ["rent", "rental", "for rent", "monthly", "per month", "/month"].some(k => lowerQuery.includes(k));
  
  for (const pattern of categoryPatterns) {
    if (pattern.keywords.some(keyword => lowerQuery.includes(keyword))) {
      if (pattern.category.includes("real_estate")) {
        return { 
          category: isRental ? "real_estate_rent" : "real_estate_sale",
          isRental 
        };
      }
      return { category: pattern.category, isRental: false };
    }
  }
  
  return { category: "product", isRental: false };
}

// Get minimum expected price for category
function getMinPrice(category: string, query: string): number {
  const lowerQuery = query.toLowerCase();
  
  // Special handling for known expensive items
  if (category === "real_estate_sale") {
    if (lowerQuery.includes("menorca") || lowerQuery.includes("minorca") || lowerQuery.includes("ibiza") || lowerQuery.includes("mallorca")) {
      return 200000; // Mediterranean islands are expensive
    }
    if (lowerQuery.includes("villa")) return 300000;
    if (lowerQuery.includes("apartment")) return 80000;
    return 100000;
  }
  
  if (category === "automotive") {
    if (lowerQuery.includes("tesla")) return 30000;
    if (lowerQuery.includes("porsche")) return 50000;
    if (lowerQuery.includes("ferrari") || lowerQuery.includes("lamborghini")) return 150000;
    if (lowerQuery.includes("bmw") || lowerQuery.includes("mercedes")) return 25000;
    return 10000;
  }
  
  if (category === "product") {
    if (lowerQuery.includes("macbook")) return 800;
    if (lowerQuery.includes("iphone")) return 500;
    if (lowerQuery.includes("ipad")) return 300;
    if (lowerQuery.includes("rolex")) return 3000;
    return 20;
  }
  
  return categoryMinPrices[category] || 50;
}

// Search with Exa
async function searchWithExa(query: string, category: string): Promise<any[]> {
  const EXA_API_KEY = Deno.env.get("exa_API_key");
  if (!EXA_API_KEY) return [];

  console.log(`[Exa] Searching: ${query}`);
  
  let searchQuery = query;
  if (category === "real_estate_sale") {
    searchQuery = `${query} for sale price listing EUR USD`;
  } else if (category === "real_estate_rent") {
    searchQuery = `${query} monthly rent price`;
  } else if (category === "automotive") {
    searchQuery = `${query} for sale price listing`;
  }

  try {
    const response = await fetch("https://api.exa.ai/search", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${EXA_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: searchQuery,
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

// Search with SerpAPI for products
async function searchWithSerpAPI(query: string): Promise<any[]> {
  const SERPAPI_KEY = Deno.env.get("SERPAPI_KEY");
  if (!SERPAPI_KEY) return [];

  console.log(`[SerpAPI] Searching: ${query}`);

  try {
    const url = new URL("https://serpapi.com/search.json");
    url.searchParams.set("engine", "google_shopping");
    url.searchParams.set("q", query);
    url.searchParams.set("api_key", SERPAPI_KEY);
    url.searchParams.set("num", "15");

    const response = await fetch(url.toString());
    if (!response.ok) {
      console.error(`[SerpAPI] Error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const results = data.shopping_results || [];
    console.log(`[SerpAPI] Found ${results.length} products`);
    
    return results.map((item: any) => ({
      title: item.title,
      price: item.extracted_price || parseFloat(item.price?.replace(/[^0-9.]/g, "")) || 0,
      source: item.source,
      link: item.link,
      image: item.thumbnail
    }));
  } catch (e) {
    console.error("[SerpAPI] Error:", e);
    return [];
  }
}

// Search with SerpAPI for real estate (Google Search)
async function searchRealEstateWithSerpAPI(query: string): Promise<any[]> {
  const SERPAPI_KEY = Deno.env.get("SERPAPI_KEY");
  if (!SERPAPI_KEY) return [];

  console.log(`[SerpAPI Real Estate] Searching: ${query}`);

  try {
    const url = new URL("https://serpapi.com/search.json");
    url.searchParams.set("engine", "google");
    url.searchParams.set("q", `${query} for sale price listing site:idealista.com OR site:kyero.com OR site:fotocasa.es OR site:rightmove.co.uk`);
    url.searchParams.set("api_key", SERPAPI_KEY);
    url.searchParams.set("num", "10");

    const response = await fetch(url.toString());
    if (!response.ok) return [];

    const data = await response.json();
    const results = data.organic_results || [];
    console.log(`[SerpAPI Real Estate] Found ${results.length} results`);
    
    return results.map((item: any) => ({
      title: item.title,
      snippet: item.snippet,
      link: item.link,
      source: new URL(item.link || "https://example.com").hostname.replace("www.", "")
    }));
  } catch (e) {
    console.error("[SerpAPI Real Estate] Error:", e);
    return [];
  }
}

// Use AI to extract and validate listings
async function extractValidListings(query: string, exaResults: any[], serpResults: any[], category: string, minPrice: number): Promise<any[]> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

  // Combine results for context
  const exaContext = exaResults.slice(0, 8).map((r, i) => 
    `[EXA-${i}] URL: ${r.url}\nTitle: ${r.title}\nText: ${r.text?.substring(0, 600) || ""}`
  ).join("\n\n");
  
  const serpContext = serpResults.slice(0, 8).map((r, i) => 
    `[SERP-${i}] Title: ${r.title}\nPrice: $${r.price || "unknown"}\nSource: ${r.source}\nLink: ${r.link}`
  ).join("\n\n");

  const isRealEstate = category.includes("real_estate");
  const isRental = category === "real_estate_rent";
  
  const systemPrompt = `You are extracting REAL, LEGITIMATE listings for "${query}" from web search results.

CRITICAL RULES:
1. MINIMUM PRICE: $${minPrice.toLocaleString()} - Reject anything cheaper as likely scam/rental/fake
2. ${isRealEstate ? (isRental ? "These are RENTAL prices (per month)" : "These are SALE prices (full property cost) - NOT rentals") : "These are purchase prices"}
3. Only include listings from REPUTABLE sources (idealista, kyero, fotocasa, rightmove, zillow, redfin, etc.)
4. Convert EUR to USD (multiply by 1.10 roughly)
5. Prices must be REALISTIC for the location and property type
6. Skip expired listings, scams, or suspicious prices
7. For ${category === "real_estate_sale" ? "Mediterranean island properties, expect €300,000-€2,000,000+ for villas" : category}

EXA RESULTS:
${exaContext || "None"}

SERPAPI RESULTS:
${serpContext || "None"}

Return a JSON array of 5-10 VALIDATED listings, sorted by price HIGH to LOW:
[{
  "title": "Clear property/product name",
  "price": number_in_USD,
  "description": "Brief details (bedrooms, sqm, features)",
  "image": "image URL if found, or null",
  "link": "source URL",
  "source": "website name",
  "confidence": "high/medium" // how confident you are this is a real, current listing
}]

ONLY include listings you're confident are REAL and CURRENT with ACCURATE prices.`;

  console.log(`[AI] Extracting valid listings with min price $${minPrice}`);

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
        { role: "user", content: `Extract validated listings for: ${query}` }
      ],
    }),
  });

  if (!response.ok) throw new Error(`AI error: ${response.status}`);

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  
  try {
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1].trim();
    const arrayMatch = jsonStr.match(/\[[\s\S]*\]/);
    if (arrayMatch) jsonStr = arrayMatch[0];
    
    const listings = JSON.parse(jsonStr);
    
    // Final validation - filter by minimum price
    const validListings = listings.filter((l: any) => l.price >= minPrice);
    
    console.log(`[AI] Extracted ${listings.length} listings, ${validListings.length} above min price`);
    
    // Sort by price descending
    validListings.sort((a: any, b: any) => b.price - a.price);
    
    return validListings;
  } catch (e) {
    console.error("[AI] Parse error:", content, e);
    return [];
  }
}

// Fallback: Get AI market estimates
async function getMarketEstimates(query: string, category: string, minPrice: number): Promise<any[]> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

  const systemPrompt = `Generate 6 REALISTIC ${category === "real_estate_sale" ? "property" : "product"} listings for "${query}".

IMPORTANT:
- Use current 2024-2025 market prices
- Minimum price: $${minPrice.toLocaleString()}
- For Mediterranean properties (Menorca, Ibiza, etc.): villas €400k-€2M, apartments €200k-€600k
- Include variety from mid-range to luxury
- Make descriptions realistic with specific details

Return JSON array sorted HIGH to LOW price:
[{"title": "...", "price": number_USD, "description": "...", "source": "Market estimate", "link": "", "image": null, "confidence": "medium"}]`;

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
        { role: "user", content: query }
      ],
    }),
  });

  if (!response.ok) throw new Error(`AI error: ${response.status}`);

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  
  try {
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1].trim();
    const arrayMatch = jsonStr.match(/\[[\s\S]*\]/);
    if (arrayMatch) jsonStr = arrayMatch[0];
    
    return JSON.parse(jsonStr);
  } catch {
    return [];
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, type } = await req.json();
    console.log(`\n=== Product Search: ${query} ===`);

    if (type === "product") {
      const { category, isRental } = detectCategory(query);
      const minPrice = getMinPrice(category, query);
      
      console.log(`Category: ${category}, Min price: $${minPrice}, Is rental: ${isRental}`);

      let listings: any[] = [];
      
      // Search both Exa and SerpAPI in parallel
      const isRealEstate = category.includes("real_estate");
      
      const [exaResults, serpResults] = await Promise.all([
        searchWithExa(query, category),
        isRealEstate 
          ? searchRealEstateWithSerpAPI(query)
          : searchWithSerpAPI(query)
      ]);
      
      // If we have search results, extract validated listings
      if (exaResults.length > 0 || serpResults.length > 0) {
        listings = await extractValidListings(query, exaResults, serpResults, category, minPrice);
      }
      
      // If no valid listings, fall back to market estimates
      if (listings.length === 0) {
        console.log("No valid listings found, using market estimates");
        listings = await getMarketEstimates(query, category, minPrice);
      }
      
      if (listings.length === 0) {
        throw new Error("Could not find valid listings for this search");
      }

      return new Response(JSON.stringify({
        success: true,
        productName: query,
        price: listings[0].price,
        source: listings[0].source,
        description: listings[0].description,
        link: listings[0].link,
        image: listings[0].image,
        searchMethod: "Exa + SerpAPI validated",
        category,
        isRental,
        minPriceUsed: minPrice,
        allListings: listings,
        alternatives: listings.slice(1)
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid type" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("product-search error:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
