import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Categories that need special handling with web search
const categoryPatterns: { keywords: string[]; category: string; searchSites: string[] }[] = [
  { 
    keywords: ["house", "apartment", "flat", "villa", "condo", "property", "real estate", "home for sale", "home for rent"],
    category: "real_estate",
    searchSites: ["zillow.com", "realtor.com", "redfin.com", "trulia.com", "rightmove.co.uk", "idealista.com", "immobiliare.it", "kyero.com", "fotocasa.es"]
  },
  { 
    keywords: ["vacation", "trip", "travel", "holiday", "getaway", "tour", "flight", "hotel", "resort", "cruise", "weeks in", "week in", "days in", "night in", "nights in", "visit"],
    category: "travel",
    searchSites: ["booking.com", "expedia.com", "airbnb.com", "hotels.com", "tripadvisor.com", "kayak.com", "skyscanner.com"]
  },
  {
    keywords: ["car for sale", "used car", "new car", "buy car", "lease car"],
    category: "automotive",
    searchSites: ["autotrader.com", "cargurus.com", "cars.com", "carmax.com", "edmunds.com"]
  },
  {
    keywords: ["course", "bootcamp", "degree", "certification", "training program", "class", "online course", "mba program", "university"],
    category: "education",
    searchSites: ["coursera.org", "udemy.com", "edx.org", "linkedin.com/learning", "skillshare.com"]
  }
];

// Location keywords for better search context
const locationKeywords = ["minorca", "menorca", "ibiza", "mallorca", "majorca", "marbella", "barcelona", "madrid", "london", "paris", "new york", "miami", "los angeles", "bali", "tokyo", "singapore", "dubai", "rome", "milan", "florence", "sardinia", "sicily", "costa brava", "canary islands", "algarve", "lisbon", "porto"];

function detectCategory(query: string): { category: string; searchSites: string[] } {
  const lowerQuery = query.toLowerCase();
  
  for (const pattern of categoryPatterns) {
    if (pattern.keywords.some(keyword => lowerQuery.includes(keyword))) {
      return { category: pattern.category, searchSites: pattern.searchSites };
    }
  }
  
  return { category: "product", searchSites: [] };
}

function hasLocation(query: string): string | null {
  const lowerQuery = query.toLowerCase();
  for (const loc of locationKeywords) {
    if (lowerQuery.includes(loc)) {
      return loc;
    }
  }
  return null;
}

// Use Exa API for real web search
async function searchWithExa(query: string, category: string): Promise<{ results: any[]; success: boolean }> {
  const EXA_API_KEY = Deno.env.get("exa_API_key");
  if (!EXA_API_KEY) {
    console.error("exa_API_key not configured");
    throw new Error("Exa API key not configured");
  }

  console.log(`Searching Exa for: ${query} (category: ${category})`);
  
  // Build search query based on category
  let searchQuery = query;
  if (category === "real_estate") {
    searchQuery = `${query} price listing for sale`;
  } else if (category === "travel") {
    searchQuery = `${query} cost price per person booking`;
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
      numResults: 10,
      contents: {
        text: { maxCharacters: 2000 },
        highlights: { numSentences: 3 }
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

// Use Lovable AI to extract price from search results
async function extractPriceFromResults(query: string, results: any[], category: string): Promise<{ price: number; description: string; source: string; link: string }> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    throw new Error("LOVABLE_API_KEY not configured");
  }

  // Prepare context from search results
  const context = results.slice(0, 5).map((r, i) => {
    return `Result ${i + 1}:
URL: ${r.url}
Title: ${r.title}
Text: ${r.text?.substring(0, 500) || "No text"}
Highlights: ${r.highlights?.join(" ") || "No highlights"}`;
  }).join("\n\n");

  const categoryPrompts: Record<string, string> = {
    real_estate: `You are analyzing real estate listings. Based on the search results below, find the most relevant property listing for "${query}" and extract:
1. The actual listing price (in USD, convert if needed)
2. A brief description of the property
3. The source website

Search Results:
${context}

Return ONLY a JSON object: {"price": number_in_USD, "description": "property details", "source": "website name", "resultIndex": 0-4}`,
    
    travel: `You are analyzing travel/vacation listings. Based on the search results below, estimate the total cost per person for "${query}":
1. Look for actual prices mentioned in the results
2. Include accommodation and typical travel costs
3. Note the source

Search Results:
${context}

Return ONLY a JSON object: {"price": number_in_USD, "description": "what's included", "source": "website name", "resultIndex": 0-4}`,
    
    automotive: `You are analyzing car listings. Based on the search results below, find the price for "${query}":

Search Results:
${context}

Return ONLY a JSON object: {"price": number_in_USD, "description": "vehicle details", "source": "website name", "resultIndex": 0-4}`,
    
    education: `You are analyzing education/course listings. Based on the search results below, find the cost for "${query}":

Search Results:
${context}

Return ONLY a JSON object: {"price": number_in_USD, "description": "course details", "source": "website name", "resultIndex": 0-4}`
  };

  const systemPrompt = categoryPrompts[category] || `Analyze these search results and extract the price for "${query}". Return ONLY JSON: {"price": number, "description": "details", "source": "source", "resultIndex": 0-4}`;

  console.log(`Using AI to extract price from ${results.length} Exa results`);

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
        { role: "user", content: `Find the price for: ${query}` }
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
    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }
    
    const parsed = JSON.parse(jsonStr);
    const resultIndex = parsed.resultIndex || 0;
    const sourceResult = results[resultIndex];
    
    console.log(`Extracted price: $${parsed.price} from ${parsed.source}`);
    return {
      price: parsed.price || 0,
      description: parsed.description || query,
      source: parsed.source || sourceResult?.title || "Web search",
      link: sourceResult?.url || ""
    };
  } catch (e) {
    console.error("Failed to parse AI response:", content);
    // Try to extract any number that looks like a price
    const priceMatch = content.match(/\$?([\d,]+(?:\.\d{2})?)/);
    if (priceMatch) {
      const price = parseFloat(priceMatch[1].replace(/,/g, ""));
      return {
        price,
        description: query,
        source: "Web search",
        link: results[0]?.url || ""
      };
    }
    throw new Error("Failed to parse price from search results");
  }
}

// Fallback: Use AI alone for estimation when web search fails
async function getAIPriceEstimate(query: string, category: string): Promise<{ price: number; description: string; source: string }> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    throw new Error("LOVABLE_API_KEY not configured");
  }

  const categoryPrompts: Record<string, string> = {
    real_estate: `You are a real estate pricing expert. Estimate the current market price for: "${query}". 
Consider location, property type, and current market conditions (2024-2025 prices).
Return ONLY a JSON object: {"price": number_in_USD, "description": "brief description", "source": "AI estimate based on market data"}`,
    
    travel: `You are a travel pricing expert. Estimate the total cost per person for: "${query}".
Include flights, accommodation (mid-range), food, and activities.
Return ONLY a JSON object: {"price": number_in_USD, "description": "what's included", "source": "AI travel estimate"}`,
    
    automotive: `You are an automotive pricing expert. Estimate the current market price for: "${query}".
Consider whether it's new or used, model year, and trim level.
Return ONLY a JSON object: {"price": number_in_USD, "description": "model details", "source": "AI automotive estimate"}`,
    
    education: `You are an education pricing expert. Estimate the total cost for: "${query}".
Include tuition, materials, and any typical fees.
Return ONLY a JSON object: {"price": number_in_USD, "description": "what's included", "source": "AI education estimate"}`,
    
    product: `You are a product pricing expert. Estimate the current retail price for: "${query}".
Return ONLY a JSON object: {"price": number_in_USD, "description": "product details", "source": "AI price estimate"}`
  };

  const systemPrompt = categoryPrompts[category] || categoryPrompts.product;

  console.log(`Using AI estimation for ${category}: ${query}`);

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
    console.error(`AI gateway error: ${response.status}`);
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
    
    const parsed = JSON.parse(jsonStr);
    console.log(`AI price estimate: $${parsed.price}`);
    return {
      price: parsed.price || 0,
      description: parsed.description || query,
      source: parsed.source || "AI estimate"
    };
  } catch {
    console.error("Failed to parse AI response:", content);
    throw new Error("Failed to parse AI price estimate");
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
      const { category, searchSites } = detectCategory(query);
      const location = hasLocation(query);
      
      console.log(`Detected category: ${category}, location: ${location || "none"}`);
      
      // For specialized categories, use Exa web search first
      if (category !== "product") {
        try {
          // Try Exa search first
          const { results, success } = await searchWithExa(query, category);
          
          if (success && results.length > 0) {
            const extracted = await extractPriceFromResults(query, results, category);
            
            return new Response(JSON.stringify({
              success: true,
              productName: query,
              price: Math.round(extracted.price),
              source: extracted.source,
              description: extracted.description,
              link: extracted.link,
              searchMethod: "Exa web search",
              alternatives: []
            }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        } catch (exaError) {
          console.error("Exa search failed:", exaError);
        }
        
        // Fallback to AI estimation
        try {
          const estimate = await getAIPriceEstimate(query, category);
          
          return new Response(JSON.stringify({
            success: true,
            productName: query,
            price: Math.round(estimate.price),
            source: estimate.source,
            description: estimate.description,
            link: "",
            searchMethod: "AI estimation",
            alternatives: []
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } catch (aiError) {
          console.error("AI estimation also failed:", aiError);
        }
      }
      
      // For regular products, use Google Shopping via SerpAPI
      const SERPAPI_KEY = Deno.env.get("SERPAPI_KEY");
      if (!SERPAPI_KEY) {
        // Try Exa as fallback for products too
        try {
          const { results } = await searchWithExa(`${query} price buy`, "product");
          if (results.length > 0) {
            const extracted = await extractPriceFromResults(query, results, "product");
            return new Response(JSON.stringify({
              success: true,
              productName: query,
              price: Math.round(extracted.price),
              source: extracted.source,
              link: extracted.link,
              searchMethod: "Exa web search",
              alternatives: []
            }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        } catch (e) {
          console.error("Exa fallback failed:", e);
        }
        
        // Final fallback to AI
        const estimate = await getAIPriceEstimate(query, "product");
        return new Response(JSON.stringify({
          success: true,
          productName: query,
          price: Math.round(estimate.price),
          source: estimate.source,
          searchMethod: "AI estimation",
          alternatives: []
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Use Google Shopping for products
      console.log("Using Google Shopping for product search");
      const shoppingUrl = new URL("https://serpapi.com/search.json");
      shoppingUrl.searchParams.set("engine", "google_shopping");
      shoppingUrl.searchParams.set("q", query);
      shoppingUrl.searchParams.set("api_key", SERPAPI_KEY);
      shoppingUrl.searchParams.set("num", "20");

      const shoppingResponse = await fetch(shoppingUrl.toString());
      
      if (!shoppingResponse.ok) {
        console.error(`SerpAPI error: ${shoppingResponse.status}`);
        throw new Error(`SerpAPI error: ${shoppingResponse.status}`);
      }

      const shoppingData = await shoppingResponse.json();
      console.log(`Found ${shoppingData.shopping_results?.length || 0} shopping results`);

      const results = shoppingData.shopping_results || [];
      
      // Determine minimum expected price based on product keywords
      const lowerQuery = query.toLowerCase();
      let minExpectedPrice = 50;
      
      if (lowerQuery.includes("iphone")) {
        minExpectedPrice = lowerQuery.includes("pro") ? 900 : 600;
      } else if (lowerQuery.includes("macbook")) {
        minExpectedPrice = lowerQuery.includes("pro") ? 1500 : 900;
      } else if (lowerQuery.includes("tesla")) {
        minExpectedPrice = 25000;
      } else if (lowerQuery.includes("ps5") || lowerQuery.includes("playstation 5")) {
        minExpectedPrice = 350;
      } else if (lowerQuery.includes("xbox")) {
        minExpectedPrice = 300;
      } else if (lowerQuery.includes("airpods")) {
        minExpectedPrice = lowerQuery.includes("pro") ? 180 : 100;
      } else if (lowerQuery.includes("ipad")) {
        minExpectedPrice = lowerQuery.includes("pro") ? 700 : 300;
      } else if (lowerQuery.includes("apple watch")) {
        minExpectedPrice = 250;
      } else if (lowerQuery.includes("samsung") && lowerQuery.includes("galaxy")) {
        minExpectedPrice = 500;
      } else if (lowerQuery.includes("rolex") || lowerQuery.includes("omega")) {
        minExpectedPrice = 3000;
      } else if (lowerQuery.includes("laptop") || lowerQuery.includes("computer")) {
        minExpectedPrice = 300;
      } else if (lowerQuery.includes("tv") || lowerQuery.includes("television")) {
        minExpectedPrice = 200;
      } else if (lowerQuery.includes("camera")) {
        minExpectedPrice = 200;
      }
      
      console.log(`Minimum expected price for "${query}": $${minExpectedPrice}`);
      
      const products = results.map((item: any) => {
        let price = 0;
        if (item.extracted_price) {
          price = item.extracted_price;
        } else if (item.price) {
          const priceStr = item.price.replace(/[^0-9.]/g, "");
          price = parseFloat(priceStr) || 0;
        }
        
        return {
          title: item.title || "Unknown Product",
          price,
          source: item.source || "Unknown",
          link: item.link || "",
          thumbnail: item.thumbnail || ""
        };
      }).filter((p: any) => p.price >= minExpectedPrice);

      console.log(`Products after filtering: ${products.length}`);
      
      let validProducts = products;
      if (products.length === 0) {
        console.log("No products met minimum price threshold, using unfiltered results");
        validProducts = results.map((item: any) => {
          let price = 0;
          if (item.extracted_price) {
            price = item.extracted_price;
          } else if (item.price) {
            const priceStr = item.price.replace(/[^0-9.]/g, "");
            price = parseFloat(priceStr) || 0;
          }
          return {
            title: item.title || "Unknown Product",
            price,
            source: item.source || "Unknown",
            link: item.link || "",
          };
        }).filter((p: any) => p.price > 0);
      }

      validProducts.sort((a: any, b: any) => a.price - b.price);
      
      const queryWords: string[] = query.toLowerCase().split(" ").filter((w: string) => w.length > 2);
      const keyWords = queryWords.filter((w: string) => !["the", "and", "for", "new", "with"].includes(w));
      
      let mainProduct = validProducts.find((p: any) => {
        const titleLower = p.title.toLowerCase();
        const matchCount = keyWords.filter((word: string) => titleLower.includes(word)).length;
        return matchCount >= Math.ceil(keyWords.length * 0.6);
      });
      
      if (!mainProduct && validProducts.length > 0) {
        const midIndex = Math.floor(validProducts.length / 2);
        mainProduct = validProducts[midIndex];
      }

      const alternatives = validProducts
        .filter((p: any) => p !== mainProduct && mainProduct && p.price <= mainProduct.price * 1.5)
        .slice(0, 4);

      return new Response(JSON.stringify({
        success: true,
        productName: mainProduct?.title || query,
        price: mainProduct?.price || 0,
        source: mainProduct?.source || "",
        link: mainProduct?.link || "",
        searchMethod: "Google Shopping",
        alternatives: alternatives.map((alt: any) => ({
          title: alt.title,
          price: alt.price,
          source: alt.source,
          link: alt.link
        }))
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
