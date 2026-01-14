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
