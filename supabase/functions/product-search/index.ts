import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Categories that need special handling (not Google Shopping)
const categoryPatterns: { keywords: string[]; category: string }[] = [
  { 
    keywords: ["house", "apartment", "flat", "villa", "condo", "property", "real estate", "home", "rent", "buy"],
    category: "real_estate"
  },
  { 
    keywords: ["vacation", "trip", "travel", "holiday", "getaway", "tour", "flight", "hotel", "resort", "cruise", "week", "weeks", "days", "night", "nights", "visit"],
    category: "travel"
  },
  {
    keywords: ["car", "vehicle", "tesla", "bmw", "mercedes", "audi", "porsche", "ferrari", "lamborghini", "toyota", "honda", "ford", "chevrolet"],
    category: "automotive"
  },
  {
    keywords: ["course", "bootcamp", "degree", "certification", "training", "class", "lesson", "tutor", "education", "mba", "university"],
    category: "education"
  },
  {
    keywords: ["surgery", "treatment", "therapy", "medical", "dental", "lasik", "procedure"],
    category: "medical"
  }
];

// Location keywords
const locationKeywords = ["minorca", "menorca", "ibiza", "mallorca", "majorca", "marbella", "barcelona", "madrid", "london", "paris", "new york", "miami", "los angeles", "bali", "tokyo", "singapore", "dubai"];

function detectCategory(query: string): string {
  const lowerQuery = query.toLowerCase();
  
  for (const pattern of categoryPatterns) {
    if (pattern.keywords.some(keyword => lowerQuery.includes(keyword))) {
      return pattern.category;
    }
  }
  
  return "product"; // Default to Google Shopping
}

function hasLocation(query: string): boolean {
  const lowerQuery = query.toLowerCase();
  return locationKeywords.some(loc => lowerQuery.includes(loc));
}

// Use Lovable AI to get intelligent price estimates
async function getAIPriceEstimate(query: string, category: string): Promise<{ price: number; description: string; source: string }> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    throw new Error("LOVABLE_API_KEY not configured");
  }

  const categoryPrompts: Record<string, string> = {
    real_estate: `You are a real estate pricing expert. Estimate the current market price for: "${query}". 
Consider location, property type, and current market conditions.
Return ONLY a JSON object: {"price": number_in_USD, "description": "brief description", "source": "Real estate estimate"}`,
    
    travel: `You are a travel pricing expert. Estimate the total cost per person for: "${query}".
Include flights, accommodation, food, and activities.
Return ONLY a JSON object: {"price": number_in_USD, "description": "what's included", "source": "Travel estimate"}`,
    
    automotive: `You are an automotive pricing expert. Estimate the current market price for: "${query}".
Consider whether it's new or used, model year, and trim level.
Return ONLY a JSON object: {"price": number_in_USD, "description": "model details", "source": "Automotive estimate"}`,
    
    education: `You are an education pricing expert. Estimate the total cost for: "${query}".
Include tuition, materials, and any typical fees.
Return ONLY a JSON object: {"price": number_in_USD, "description": "what's included", "source": "Education estimate"}`,
    
    medical: `You are a medical pricing expert. Estimate the typical cost for: "${query}" in the US.
Consider typical insurance and out-of-pocket costs.
Return ONLY a JSON object: {"price": number_in_USD, "description": "procedure details", "source": "Medical estimate"}`
  };

  const systemPrompt = categoryPrompts[category] || `Estimate the current market price in USD for: "${query}". Return ONLY a JSON object: {"price": number, "description": "brief description", "source": "Price estimate"}`;

  console.log(`Using Lovable AI for ${category} price estimate`);

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
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    console.error(`AI gateway error: ${response.status}`);
    throw new Error(`AI gateway error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  
  try {
    const parsed = JSON.parse(content);
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
    
    const SERPAPI_KEY = Deno.env.get("SERPAPI_KEY");
    
    console.log(`Searching for: ${query}, type: ${type}`);

    if (type === "product") {
      const category = detectCategory(query);
      console.log(`Detected category: ${category}`);
      
      // For non-product categories, use AI to estimate price
      if (category !== "product") {
        try {
          const estimate = await getAIPriceEstimate(query, category);
          
          return new Response(JSON.stringify({
            success: true,
            productName: query,
            price: Math.round(estimate.price),
            source: estimate.source,
            description: estimate.description,
            link: "",
            alternatives: []
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } catch (aiError) {
          console.error("AI estimation failed, falling back to web search:", aiError);
        }
      }
      
      // For regular products, use Google Shopping
      if (!SERPAPI_KEY) {
        console.error("SERPAPI_KEY is not configured");
        throw new Error("SERPAPI_KEY is not configured");
      }

      // For products, use Google Shopping
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
      let minExpectedPrice = 50; // Default minimum
      
      // Set minimum price thresholds for known expensive products
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
      
      // Extract prices and filter by minimum expected price
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
      
      // If no products meet minimum price, use all results but warn
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

      // Sort by price - find median price for main product
      validProducts.sort((a: any, b: any) => a.price - b.price);
      
      // Try to find the main product by matching query words in title
      const queryWords: string[] = query.toLowerCase().split(" ").filter((w: string) => w.length > 2);
      const keyWords = queryWords.filter((w: string) => !["the", "and", "for", "new", "with"].includes(w));
      
      let mainProduct = validProducts.find((p: any) => {
        const titleLower = p.title.toLowerCase();
        const matchCount = keyWords.filter((word: string) => titleLower.includes(word)).length;
        // Require more matches for better accuracy
        return matchCount >= Math.ceil(keyWords.length * 0.6);
      });
      
      // Fallback to product closest to median price (more likely to be the actual product)
      if (!mainProduct && validProducts.length > 0) {
        const midIndex = Math.floor(validProducts.length / 2);
        mainProduct = validProducts[midIndex];
      }

      // Alternatives = other options within 50% of main product price
      const alternatives = validProducts
        .filter((p: any) => p !== mainProduct && mainProduct && p.price <= mainProduct.price * 1.5)
        .slice(0, 4);

      return new Response(JSON.stringify({
        success: true,
        productName: mainProduct?.title || query,
        price: mainProduct?.price || 0,
        source: mainProduct?.source || "",
        link: mainProduct?.link || "",
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
