import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Categories that need special handling with web search
const categoryPatterns: { keywords: string[]; category: string }[] = [
  { 
    keywords: ["house", "apartment", "flat", "villa", "condo", "property", "real estate", "home for sale", "home for rent"],
    category: "real_estate"
  },
  { 
    keywords: ["vacation", "trip", "travel", "holiday", "getaway", "tour", "flight", "hotel", "resort", "cruise", "weeks in", "week in", "days in", "night in", "nights in", "visit"],
    category: "travel"
  },
  {
    keywords: ["car for sale", "used car", "new car", "buy car", "lease car", "tesla", "bmw", "mercedes", "porsche", "ferrari", "lamborghini"],
    category: "automotive"
  },
  {
    keywords: ["course", "bootcamp", "degree", "certification", "training program", "class", "online course", "mba program", "university"],
    category: "education"
  }
];

function detectCategory(query: string): string {
  const lowerQuery = query.toLowerCase();
  
  for (const pattern of categoryPatterns) {
    if (pattern.keywords.some(keyword => lowerQuery.includes(keyword))) {
      return pattern.category;
    }
  }
  
  return "product";
}

// Use Exa API for real web search - returns multiple results with images
async function searchWithExa(query: string, category: string): Promise<{ results: any[]; success: boolean }> {
  const EXA_API_KEY = Deno.env.get("exa_API_key");
  if (!EXA_API_KEY) {
    console.error("exa_API_key not configured");
    throw new Error("Exa API key not configured");
  }

  console.log(`Searching Exa for: ${query} (category: ${category})`);
  
  // Build optimized search query based on category
  let searchQuery = query;
  if (category === "real_estate") {
    searchQuery = `${query} property listing for sale price`;
  } else if (category === "travel") {
    searchQuery = `${query} booking price per night cost`;
  } else if (category === "automotive") {
    searchQuery = `${query} for sale price listing`;
  } else {
    searchQuery = `${query} buy price`;
  }

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
  
  return { results: data.results || [], success: true };
}

// Use Lovable AI to extract multiple listings with prices from search results
async function extractListingsFromResults(query: string, results: any[], category: string): Promise<any[]> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    throw new Error("LOVABLE_API_KEY not configured");
  }

  // Prepare context from search results
  const context = results.slice(0, 12).map((r, i) => {
    return `[${i}] URL: ${r.url}
Title: ${r.title}
Text: ${r.text?.substring(0, 800) || "No text"}`;
  }).join("\n\n");

  const systemPrompt = `You are analyzing search results to extract MULTIPLE listings/products for "${query}".

For each valid listing found, extract:
- title: A clear name for the listing
- price: The price in USD (convert from other currencies if needed)
- description: Brief description (property size, features, etc.)
- image: Look for image URLs in the text or infer from the website (use a realistic placeholder if none found)
- resultIndex: Which search result this came from (0-11)

Search Results:
${context}

Return a JSON array of listings found. Extract AS MANY VALID LISTINGS AS POSSIBLE (aim for 5-10).
Format: [{"title": "...", "price": number, "description": "...", "image": "url or null", "resultIndex": 0}, ...]

IMPORTANT: 
- Only include listings with actual prices found
- For real estate, extract each property separately
- For products, extract each product variant
- Sort by price from HIGHEST to LOWEST`;

  console.log(`Using AI to extract listings from ${results.length} Exa results`);

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
        { role: "user", content: `Extract all listings with prices for: ${query}` }
      ],
    }),
  });

  if (!response.ok) {
    console.error(`AI gateway error: ${response.status}`);
    throw new Error(`AI gateway error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  
  try {
    // Extract JSON array from response
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }
    
    // Try to find array in response
    const arrayMatch = jsonStr.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      jsonStr = arrayMatch[0];
    }
    
    const listings = JSON.parse(jsonStr);
    
    // Enrich with source URLs
    const enrichedListings = listings.map((listing: any) => {
      const sourceResult = results[listing.resultIndex] || results[0];
      return {
        ...listing,
        source: sourceResult?.title?.split(" - ")[0] || "Web",
        link: sourceResult?.url || "",
        // Try to get image from result if not found
        image: listing.image || getImageFromUrl(sourceResult?.url)
      };
    });
    
    // Sort by price descending (expensive first)
    enrichedListings.sort((a: any, b: any) => b.price - a.price);
    
    console.log(`Extracted ${enrichedListings.length} listings`);
    return enrichedListings;
  } catch (e) {
    console.error("Failed to parse AI response:", content, e);
    return [];
  }
}

// Helper to generate placeholder image based on URL
function getImageFromUrl(url: string): string | null {
  if (!url) return null;
  
  // Return null - we'll use placeholders in the frontend
  return null;
}

// Fallback: Use AI for estimation when web search fails
async function getAIEstimates(query: string, category: string): Promise<any[]> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    throw new Error("LOVABLE_API_KEY not configured");
  }

  const categoryPrompts: Record<string, string> = {
    real_estate: `Generate 5 realistic property listings for "${query}" with varying prices. Include different property types and sizes.`,
    travel: `Generate 5 vacation/travel options for "${query}" at different price points (budget to luxury).`,
    automotive: `Generate 5 car listings for "${query}" at different price points (used to new, base to premium).`,
    product: `Generate 5 product options related to "${query}" at different price points.`
  };

  const systemPrompt = `You are a pricing expert. ${categoryPrompts[category] || categoryPrompts.product}

Return a JSON array with realistic current market prices (2024-2025):
[{"title": "...", "price": number_in_USD, "description": "...", "image": null}, ...]

Sort from HIGHEST to LOWEST price. Be realistic with pricing!`;

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
    
    const listings = JSON.parse(jsonStr);
    return listings.map((l: any) => ({
      ...l,
      source: "AI Estimate",
      link: ""
    }));
  } catch {
    console.error("Failed to parse AI estimates:", content);
    return [];
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, type } = await req.json();
    
    console.log(`Searching for: ${query}, type: ${type}`);

    if (type === "product") {
      const category = detectCategory(query);
      console.log(`Detected category: ${category}`);
      
      let listings: any[] = [];
      let searchMethod = "unknown";
      
      // Try Exa web search first
      try {
        const { results, success } = await searchWithExa(query, category);
        
        if (success && results.length > 0) {
          listings = await extractListingsFromResults(query, results, category);
          searchMethod = "Exa web search";
        }
      } catch (exaError) {
        console.error("Exa search failed:", exaError);
      }
      
      // Fallback to AI estimation if no listings found
      if (listings.length === 0) {
        try {
          listings = await getAIEstimates(query, category);
          searchMethod = "AI estimation";
        } catch (aiError) {
          console.error("AI estimation failed:", aiError);
        }
      }
      
      // If we still have listings, format response
      if (listings.length > 0) {
        const mainListing = listings[0]; // Most expensive
        const alternatives = listings.slice(1);
        
        return new Response(JSON.stringify({
          success: true,
          productName: query,
          price: Math.round(mainListing.price),
          source: mainListing.source,
          description: mainListing.description,
          link: mainListing.link,
          image: mainListing.image,
          searchMethod,
          category,
          // Return all listings for gallery view
          allListings: listings.map((l: any) => ({
            title: l.title,
            price: Math.round(l.price),
            description: l.description,
            source: l.source,
            link: l.link,
            image: l.image
          })),
          alternatives: alternatives.map((alt: any) => ({
            title: alt.title,
            price: Math.round(alt.price),
            description: alt.description,
            source: alt.source,
            link: alt.link,
            image: alt.image
          }))
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      // Last resort: try Google Shopping for products
      const SERPAPI_KEY = Deno.env.get("SERPAPI_KEY");
      if (SERPAPI_KEY && category === "product") {
        console.log("Falling back to Google Shopping");
        const shoppingUrl = new URL("https://serpapi.com/search.json");
        shoppingUrl.searchParams.set("engine", "google_shopping");
        shoppingUrl.searchParams.set("q", query);
        shoppingUrl.searchParams.set("api_key", SERPAPI_KEY);
        shoppingUrl.searchParams.set("num", "20");

        const shoppingResponse = await fetch(shoppingUrl.toString());
        
        if (shoppingResponse.ok) {
          const shoppingData = await shoppingResponse.json();
          const results = shoppingData.shopping_results || [];
          
          const products = results.map((item: any) => {
            let price = item.extracted_price || 0;
            if (!price && item.price) {
              price = parseFloat(item.price.replace(/[^0-9.]/g, "")) || 0;
            }
            return {
              title: item.title,
              price,
              description: item.snippet || "",
              source: item.source || "Google Shopping",
              link: item.link || "",
              image: item.thumbnail || null
            };
          }).filter((p: any) => p.price > 0);
          
          // Sort by price descending
          products.sort((a: any, b: any) => b.price - a.price);
          
          if (products.length > 0) {
            return new Response(JSON.stringify({
              success: true,
              productName: products[0].title || query,
              price: products[0].price,
              source: products[0].source,
              link: products[0].link,
              image: products[0].image,
              searchMethod: "Google Shopping",
              category: "product",
              allListings: products,
              alternatives: products.slice(1, 10)
            }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }
      }
      
      throw new Error("Could not find any listings for this search");
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
