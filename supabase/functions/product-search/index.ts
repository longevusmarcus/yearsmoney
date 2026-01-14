import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Minimum realistic prices by category (USD) - more lenient
const categoryMinPrices: Record<string, number> = {
  real_estate_sale: 30000,     // Lower threshold, filter in AI
  real_estate_rent: 300,       
  automotive: 3000,            
  travel: 100,                 
  product: 5                   
};

// Categories with detection
const categoryPatterns: { keywords: string[]; category: string }[] = [
  { 
    keywords: ["house", "apartment", "flat", "villa", "condo", "property", "home"],
    category: "real_estate_sale"
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
  const isRental = ["rent", "rental", "for rent", "monthly", "per month"].some(k => lowerQuery.includes(k));
  
  for (const pattern of categoryPatterns) {
    if (pattern.keywords.some(keyword => lowerQuery.includes(keyword))) {
      if (pattern.category === "real_estate_sale") {
        return { category: isRental ? "real_estate_rent" : "real_estate_sale", isRental };
      }
      return { category: pattern.category, isRental: false };
    }
  }
  
  return { category: "product", isRental: false };
}

// Search with Exa - now includes image extraction
async function searchWithExa(query: string, category: string): Promise<any[]> {
  const EXA_API_KEY = Deno.env.get("exa_API_key");
  if (!EXA_API_KEY) return [];

  console.log(`[Exa] Searching: ${query}`);
  
  let searchQuery = query;
  if (category === "real_estate_sale") {
    searchQuery = `${query} for sale price listing property`;
  } else if (category === "automotive") {
    searchQuery = `${query} for sale price`;
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
        numResults: 15,
        contents: { 
          text: { maxCharacters: 2500 },
          highlights: true
        }
      }),
    });

    if (!response.ok) return [];
    const data = await response.json();
    console.log(`[Exa] Found ${data.results?.length || 0} results`);
    return data.results || [];
  } catch (e) {
    console.error("[Exa] Error:", e);
    return [];
  }
}

// Search for images using SerpAPI
async function searchImages(query: string): Promise<Record<string, string>> {
  const SERPAPI_KEY = Deno.env.get("SERPAPI_KEY");
  if (!SERPAPI_KEY) return {};

  try {
    const url = new URL("https://serpapi.com/search.json");
    url.searchParams.set("engine", "google_images");
    url.searchParams.set("q", query);
    url.searchParams.set("api_key", SERPAPI_KEY);
    url.searchParams.set("num", "10");

    const response = await fetch(url.toString());
    if (!response.ok) return {};

    const data = await response.json();
    const images = data.images_results || [];
    
    // Create a map of keywords to image URLs
    const imageMap: Record<string, string> = {};
    images.forEach((img: any, i: number) => {
      imageMap[`img_${i}`] = img.thumbnail || img.original;
    });
    
    console.log(`[SerpAPI Images] Found ${images.length} images`);
    return imageMap;
  } catch (e) {
    console.error("[SerpAPI Images] Error:", e);
    return {};
  }
}

// Search with SerpAPI
async function searchWithSerpAPI(query: string, category: string): Promise<any[]> {
  const SERPAPI_KEY = Deno.env.get("SERPAPI_KEY");
  if (!SERPAPI_KEY) return [];

  console.log(`[SerpAPI] Searching: ${query}`);

  try {
    const url = new URL("https://serpapi.com/search.json");
    
    if (category === "product") {
      url.searchParams.set("engine", "google_shopping");
      url.searchParams.set("q", query);
    } else {
      url.searchParams.set("engine", "google");
      url.searchParams.set("q", `${query} for sale price listing`);
    }
    
    url.searchParams.set("api_key", SERPAPI_KEY);
    url.searchParams.set("num", "15");

    const response = await fetch(url.toString());
    if (!response.ok) return [];

    const data = await response.json();
    
    if (category === "product") {
      const results = data.shopping_results || [];
      console.log(`[SerpAPI] Found ${results.length} products`);
      return results.map((item: any) => ({
        title: item.title,
        price: item.extracted_price || parseFloat(item.price?.replace(/[^0-9.]/g, "")) || 0,
        source: item.source,
        link: item.link,
        image: item.thumbnail
      }));
    } else {
      const results = data.organic_results || [];
      console.log(`[SerpAPI] Found ${results.length} organic results`);
      return results;
    }
  } catch (e) {
    console.error("[SerpAPI] Error:", e);
    return [];
  }
}

// Use AI to extract listings - more lenient, get more results
async function extractListings(query: string, exaResults: any[], serpResults: any[], category: string): Promise<any[]> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

  const exaContext = exaResults.slice(0, 10).map((r, i) => 
    `[${i}] URL: ${r.url}\nTitle: ${r.title}\nText: ${r.text?.substring(0, 800) || ""}`
  ).join("\n\n---\n");
  
  const serpContext = serpResults.slice(0, 8).map((r, i) => 
    `[S${i}] ${r.title} | Price: ${r.price || "?"} | ${r.source || r.link}`
  ).join("\n");

  const categoryGuide: Record<string, string> = {
    real_estate_sale: `For Mediterranean islands (Menorca, Ibiza, Mallorca): apartments €150k-€500k, houses €300k-€1M, villas €500k-€3M. Convert EUR to USD (×1.10).`,
    automotive: `Use current market prices for vehicles. Include model year and condition details.`,
    travel: `Include full package costs or per-person pricing.`,
    product: `Use actual retail prices from the search results.`
  };
  
  const systemPrompt = `Extract 6-10 REAL listings from these search results for "${query}".

${categoryGuide[category] || "Use realistic current market prices."}

EXA RESULTS:
${exaContext || "None"}

SERP RESULTS:
${serpContext || "None"}

Return a JSON array with listings sorted by price from HIGHEST to LOWEST:
[{
  "title": "Name/description",
  "price": number_in_USD,
  "description": "Key features (2-3 sentences max)",
  "link": "URL",
  "source": "website name",
  "image": "image URL or null"
}]

IMPORTANT: 
- Extract AT LEAST 5-8 listings
- Include a RANGE of prices (luxury to affordable options)
- Use realistic prices for the category and location
- If exact price not found, estimate based on similar listings
- Sort from expensive to cheaper`;

  console.log(`[AI] Extracting listings...`);

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
        { role: "user", content: `Extract listings for: ${query}` }
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
    console.log(`[AI] Extracted ${listings.length} listings`);
    
    // Sort by price descending
    listings.sort((a: any, b: any) => (b.price || 0) - (a.price || 0));
    
    return listings;
  } catch (e) {
    console.error("[AI] Parse error:", e);
    return [];
  }
}

// Fallback: Generate realistic listings
async function generateListings(query: string, category: string): Promise<any[]> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

  const prompts: Record<string, string> = {
    real_estate_sale: `Generate 8 realistic property listings for "${query}" with 2024-2025 market prices. Include: luxury villa, modern house, apartment, studio. Mediterranean islands are expensive!`,
    automotive: `Generate 8 car listings for "${query}" from luxury to affordable options with current market prices.`,
    travel: `Generate 8 travel/vacation options for "${query}" from luxury to budget with realistic costs.`,
    product: `Generate 8 product options for "${query}" with current retail prices from expensive to affordable.`
  };

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { 
          role: "system", 
          content: `${prompts[category] || prompts.product}
          
Return JSON array sorted HIGH to LOW price:
[{"title": "...", "price": number_USD, "description": "...", "source": "Market estimate", "link": "", "image": null}]` 
        },
        { role: "user", content: query }
      ],
    }),
  });

  if (!response.ok) return [];

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  
  try {
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1].trim();
    const arrayMatch = jsonStr.match(/\[[\s\S]*\]/);
    if (arrayMatch) jsonStr = arrayMatch[0];
    
    const listings = JSON.parse(jsonStr);
    console.log(`[Fallback] Generated ${listings.length} listings`);
    return listings;
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
      console.log(`Category: ${category}`);

      // Search all sources in parallel - including images
      const [exaResults, serpResults, imageResults] = await Promise.all([
        searchWithExa(query, category),
        searchWithSerpAPI(query, category),
        searchImages(query)
      ]);
      
      // Get array of image URLs
      const imageUrls = Object.values(imageResults);
      
      let listings: any[] = [];
      
      // Extract from search results
      if (exaResults.length > 0 || serpResults.length > 0) {
        listings = await extractListings(query, exaResults, serpResults, category);
      }
      
      // Fallback if not enough listings
      if (listings.length < 3) {
        console.log("Not enough listings, generating fallback...");
        const fallback = await generateListings(query, category);
        listings = [...listings, ...fallback].slice(0, 10);
      }
      
      if (listings.length === 0) {
        throw new Error("Could not find listings for this search");
      }

      // Ensure sorted by price descending
      listings.sort((a: any, b: any) => (b.price || 0) - (a.price || 0));
      
      // Add images to listings that don't have them
      listings = listings.map((listing, index) => {
        if (!listing.image && imageUrls[index]) {
          return { ...listing, image: imageUrls[index] };
        }
        return listing;
      });

      return new Response(JSON.stringify({
        success: true,
        productName: query,
        price: listings[0].price,
        source: listings[0].source,
        description: listings[0].description,
        link: listings[0].link,
        image: listings[0].image,
        searchMethod: "Exa + SerpAPI",
        category,
        isRental,
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
