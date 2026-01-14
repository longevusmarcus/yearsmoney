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
    const { query, type } = await req.json();
    
    const SERPAPI_KEY = Deno.env.get("SERPAPI_KEY");
    if (!SERPAPI_KEY) {
      console.error("SERPAPI_KEY is not configured");
      throw new Error("SERPAPI_KEY is not configured");
    }

    console.log(`Searching for: ${query}, type: ${type}`);

    if (type === "product") {
      // Search for product pricing using Google Shopping
      const shoppingUrl = new URL("https://serpapi.com/search.json");
      shoppingUrl.searchParams.set("engine", "google_shopping");
      shoppingUrl.searchParams.set("q", query);
      shoppingUrl.searchParams.set("api_key", SERPAPI_KEY);
      shoppingUrl.searchParams.set("num", "10");

      console.log("Fetching from SerpAPI Google Shopping...");
      const shoppingResponse = await fetch(shoppingUrl.toString());
      
      if (!shoppingResponse.ok) {
        console.error(`SerpAPI error: ${shoppingResponse.status}`);
        throw new Error(`SerpAPI error: ${shoppingResponse.status}`);
      }

      const shoppingData = await shoppingResponse.json();
      console.log(`Found ${shoppingData.shopping_results?.length || 0} shopping results`);

      const results = shoppingData.shopping_results || [];
      
      // Extract prices and find best deals
      const products = results.slice(0, 8).map((item: any) => {
        // Parse price - handle different formats
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

      // Main product = best match (usually first with reasonable price)
      const mainProduct = products.find((p: any) => 
        p.title.toLowerCase().includes(query.toLowerCase().split(" ")[0])
      ) || products[0];

      // Alternatives = cheaper options
      const alternatives = products
        .filter((p: any) => p !== mainProduct && p.price < (mainProduct?.price || Infinity) * 1.2)
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

    } else if (type === "ideas") {
      // Search for experience/travel pricing
      const searchUrl = new URL("https://serpapi.com/search.json");
      searchUrl.searchParams.set("engine", "google");
      searchUrl.searchParams.set("q", `${query} price cost USD`);
      searchUrl.searchParams.set("api_key", SERPAPI_KEY);
      searchUrl.searchParams.set("num", "10");

      console.log("Fetching from SerpAPI Google Search for ideas...");
      const searchResponse = await fetch(searchUrl.toString());
      
      if (!searchResponse.ok) {
        throw new Error(`SerpAPI error: ${searchResponse.status}`);
      }

      const searchData = await searchResponse.json();
      const results = searchData.organic_results || [];

      // Extract price mentions from snippets
      const priceMatches: number[] = [];
      results.forEach((result: any) => {
        const text = (result.snippet || "") + " " + (result.title || "");
        const matches = text.match(/\$[\d,]+(?:\.\d{2})?/g);
        if (matches) {
          matches.forEach((m: string) => {
            const price = parseFloat(m.replace(/[$,]/g, ""));
            if (price > 10 && price < 100000) {
              priceMatches.push(price);
            }
          });
        }
      });

      // Get average price
      const avgPrice = priceMatches.length > 0 
        ? priceMatches.reduce((a, b) => a + b, 0) / priceMatches.length 
        : 0;

      return new Response(JSON.stringify({
        success: true,
        query,
        estimatedPrice: Math.round(avgPrice),
        priceRange: priceMatches.length > 0 ? {
          min: Math.min(...priceMatches),
          max: Math.max(...priceMatches)
        } : null,
        sources: results.slice(0, 3).map((r: any) => ({
          title: r.title,
          snippet: r.snippet,
          link: r.link
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
