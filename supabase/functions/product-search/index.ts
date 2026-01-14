import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Keywords that indicate this is a travel/experience search, not a product
const experienceKeywords = [
  "vacation", "trip", "travel", "holiday", "getaway", "tour",
  "flight", "hotel", "resort", "cruise", "week", "weeks",
  "days", "night", "nights", "visit", "bali", "japan", "europe",
  "thailand", "mexico", "hawaii", "paris", "italy", "spain"
];

function isExperienceSearch(query: string): boolean {
  const lowerQuery = query.toLowerCase();
  return experienceKeywords.some(keyword => lowerQuery.includes(keyword));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, type } = await req.json();
    
    const SERPAPI_KEY = Deno.env.get("SERPAPI_KEY");
    if (!SERPAPI_KEY) {
      console.error("SERPAPI_KEY is not configured");
      throw new Error("SERPAPI_KEY is not configured");
    }

    console.log(`Searching for: ${query}, type: ${type}`);

    if (type === "product") {
      // Check if this is a travel/experience query
      if (isExperienceSearch(query)) {
        console.log("Detected experience/travel query, using Google Search");
        
        // Use regular Google Search for experiences
        const searchUrl = new URL("https://serpapi.com/search.json");
        searchUrl.searchParams.set("engine", "google");
        searchUrl.searchParams.set("q", `${query} cost budget USD total price per person`);
        searchUrl.searchParams.set("api_key", SERPAPI_KEY);
        searchUrl.searchParams.set("num", "15");

        const searchResponse = await fetch(searchUrl.toString());
        
        if (!searchResponse.ok) {
          throw new Error(`SerpAPI error: ${searchResponse.status}`);
        }

        const searchData = await searchResponse.json();
        const results = searchData.organic_results || [];
        
        // Extract price mentions from snippets - look for realistic travel prices
        const priceMatches: number[] = [];
        const patterns = [
          /\$[\d,]+(?:\.\d{2})?/g,  // $1,500 or $1500.00
          /USD\s*[\d,]+/gi,         // USD 1500
          /[\d,]+\s*(?:USD|dollars)/gi  // 1500 USD or 1500 dollars
        ];
        
        results.forEach((result: any) => {
          const text = (result.snippet || "") + " " + (result.title || "");
          patterns.forEach(pattern => {
            const matches = text.match(pattern);
            if (matches) {
              matches.forEach((m: string) => {
                const price = parseFloat(m.replace(/[^0-9.]/g, ""));
                // Filter for realistic travel prices (between $200 and $20000)
                if (price >= 200 && price <= 20000) {
                  priceMatches.push(price);
                }
              });
            }
          });
        });

        console.log(`Found ${priceMatches.length} price mentions:`, priceMatches);

        // Calculate median price (more robust than average)
        let estimatedPrice = 0;
        if (priceMatches.length > 0) {
          priceMatches.sort((a, b) => a - b);
          const mid = Math.floor(priceMatches.length / 2);
          estimatedPrice = priceMatches.length % 2 === 0
            ? (priceMatches[mid - 1] + priceMatches[mid]) / 2
            : priceMatches[mid];
        } else {
          // Default estimates based on query keywords
          if (query.toLowerCase().includes("bali")) estimatedPrice = 2500;
          else if (query.toLowerCase().includes("japan")) estimatedPrice = 4000;
          else if (query.toLowerCase().includes("europe")) estimatedPrice = 3500;
          else if (query.toLowerCase().includes("hawaii")) estimatedPrice = 3000;
          else estimatedPrice = 2000; // Generic vacation estimate
          
          console.log("Using default estimate for travel:", estimatedPrice);
        }

        return new Response(JSON.stringify({
          success: true,
          productName: query,
          price: Math.round(estimatedPrice),
          source: "Travel estimate",
          link: results[0]?.link || "",
          alternatives: []
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // For products, use Google Shopping
      console.log("Using Google Shopping for product search");
      const shoppingUrl = new URL("https://serpapi.com/search.json");
      shoppingUrl.searchParams.set("engine", "google_shopping");
      shoppingUrl.searchParams.set("q", query);
      shoppingUrl.searchParams.set("api_key", SERPAPI_KEY);
      shoppingUrl.searchParams.set("num", "15");

      const shoppingResponse = await fetch(shoppingUrl.toString());
      
      if (!shoppingResponse.ok) {
        console.error(`SerpAPI error: ${shoppingResponse.status}`);
        throw new Error(`SerpAPI error: ${shoppingResponse.status}`);
      }

      const shoppingData = await shoppingResponse.json();
      console.log(`Found ${shoppingData.shopping_results?.length || 0} shopping results`);

      const results = shoppingData.shopping_results || [];
      
      // Extract prices and find best deals
      const products = results.slice(0, 10).map((item: any) => {
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
      }).filter((p: any) => p.price > 0);

      // Sort by price ascending
      products.sort((a: any, b: any) => a.price - b.price);

      // Try to find the main product (best match by title similarity)
      const queryWords: string[] = query.toLowerCase().split(" ").filter((w: string) => w.length > 2);
      let mainProduct = products.find((p: any) => {
        const titleLower = p.title.toLowerCase();
        const matchCount = queryWords.filter((word: string) => titleLower.includes(word)).length;
        return matchCount >= Math.min(2, queryWords.length);
      });
      
      // Fallback to first result with reasonable price
      if (!mainProduct) {
        mainProduct = products[0];
      }

      // Alternatives = other options (cheaper or similar price)
      const alternatives = products
        .filter((p: any) => p !== mainProduct)
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
