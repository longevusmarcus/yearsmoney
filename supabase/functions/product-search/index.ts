import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireUser } from "../_shared/auth.ts";

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

// ---- Query normalization: short/ambiguous inputs get expanded so the
// ---- shopping engine understands them immediately ("mac" -> MacBook laptop).
const queryAliases: Record<string, string> = {
  mac: "Apple MacBook laptop",
  macbook: "Apple MacBook laptop",
  imac: "Apple iMac desktop computer",
  ipad: "Apple iPad tablet",
  iphone: "Apple iPhone smartphone",
  airpods: "Apple AirPods wireless earbuds",
  watch: "smartwatch",
  ps5: "Sony PlayStation 5 console",
  ps4: "Sony PlayStation 4 console",
  xbox: "Xbox Series X console",
  switch: "Nintendo Switch console",
  tesla: "Tesla electric car",
  rolex: "Rolex watch",
  vespa: "Vespa scooter",
  bici: "bicicletta bike",
  moto: "motorcycle motorbike",
  auto: "car automobile",
  casa: "house property for sale",
  pc: "desktop computer PC",
  laptop: "laptop notebook computer",
  tv: "television TV smart tv",
  drone: "drone camera",
  camera: "digital camera",
  cuffie: "headphones",
  telefono: "smartphone",
  computer: "laptop computer",
};

function normalizeQuery(raw: string): string {
  const q = (raw || "").trim();
  const lower = q.toLowerCase();
  if (queryAliases[lower]) return queryAliases[lower];
  // single short token: expand if we know it as a prefix alias
  const words = lower.split(/\s+/);
  if (words.length <= 2) {
    const hit = words.map((w) => queryAliases[w]).find(Boolean);
    if (hit) return `${q} ${hit}`;
  }
  return q;
}

// Simple in-memory cache (per isolate) so repeated searches are instant
const cache = new Map<string, { at: number; payload: string }>();
const CACHE_TTL = 10 * 60 * 1000;

function fetchWithTimeout(url: string, init: RequestInit = {}, ms = 6000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { ...init, signal: ctrl.signal }).finally(() => clearTimeout(t));
}

// Categories with detection (travel is checked first: "casa vacanza" is a trip, not a property)
const categoryPatterns: { keywords: string[]; category: string }[] = [
  {
    keywords: [
      "vacation", "trip", "travel", "holiday", "getaway", "tour", "flight", "hotel", "resort",
      "cruise", "safari", "honeymoon", "weekend", "city break", "island",
      "viaggio", "viaggi", "vacanza", "vacanze", "volo", "voli", "crociera", "soggiorno",
      "escursione", "ferie", "ponte", "luna di miele", "isola",
    ],
    category: "travel",
  },
  { 
    keywords: ["house", "apartment", "flat", "villa", "condo", "property", "home", "casa", "appartamento"],
    category: "real_estate_sale"
  },
  {
    keywords: [
      "spa", "wedding", "matrimonio", "concert", "concerto", "festival", "gym", "palestra",
      "ristorante", "restaurant", "cena", "party", "evento", "event", "lifestyle",
      "arredare", "arredamento", "furniture", "kitchen renovation", "ristrutturare",
      "corso", "course", "abbonamento", "subscription", "membership",
    ],
    category: "lifestyle",
  },
  {
    keywords: ["tesla", "bmw", "mercedes", "porsche", "ferrari", "lamborghini", "car", "vehicle", "suv", "auto", "automobile"],
    category: "automotive"
  }
];


function detectCategory(query: string): { category: string; isRental: boolean } {
  const lowerQuery = query.toLowerCase();
  const isRental = ["rent", "rental", "for rent", "monthly", "per month", "affitto"].some(k => lowerQuery.includes(k));
  
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
    const response = await fetchWithTimeout("https://api.exa.ai/search", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${EXA_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: searchQuery,
        type: "auto",
        numResults: 6,
        contents: {
          text: { maxCharacters: 700 }
        }
      }),
    }, 12000);


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
    url.searchParams.set("num", "8");


    const response = await fetchWithTimeout(url.toString(), {}, 12000);

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
    url.searchParams.set("num", "12");

    const response = await fetchWithTimeout(url.toString(), {}, 15000);

    if (!response.ok) return [];

    const data = await response.json();
    
    if (category === "product") {
      const results = data.shopping_results || [];
      console.log(`[SerpAPI] Found ${results.length} products`);
      return results.map((item: any) => ({
        title: item.title,
        price: item.extracted_price || parseFloat(item.price?.replace(/[^0-9.]/g, "")) || 0,
        source: item.source,
        link: item.product_link || item.link,
        image: item.thumbnail,
        description: item.snippet || item.source || ""
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
async function extractListings(query: string, exaResults: any[], serpResults: any[], category: string, lang: string = "it"): Promise<any[]> {
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
- Sort from expensive to cheaper
- Write every "title" and "description" in ${lang === "en" ? "English" : "Italian"}, regardless of the source language`;

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

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error(`[AI] gateway error ${response.status}: ${detail.slice(0, 500)}`);
    throw new Error(`AI error: ${response.status}`);
  }

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

// ============================================================
// TRAVEL / LIFESTYLE BUNDLE
// Instead of random blog posts, build the full "cost of the
// experience": flights, stay, transport, activities, food...
// Each item links to a real booking/marketplace deep link.
// ============================================================

type BookingBuilder = (dest: string, q: string) => string;

const bookingLinks: Record<string, BookingBuilder> = {
  flight: (d) => `https://www.skyscanner.net/transport/flights-to/${encodeURIComponent(d)}/`,
  stay: (d) => `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(d)}`,
  apartment: (d) => `https://www.airbnb.com/s/${encodeURIComponent(d)}/homes`,
  transport: (d) => `https://www.rentalcars.com/SearchResults.do?locationName=${encodeURIComponent(d)}`,
  activity: (d) => `https://www.getyourguide.com/s/?q=${encodeURIComponent(d)}`,
  food: (d) => `https://www.thefork.com/search?cityName=${encodeURIComponent(d)}`,
  insurance: () => `https://www.worldnomads.com/travel-insurance`,
  gear: (_d, q) => `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(q)}`,
  ticket: (_d, q) => `https://www.ticketmaster.com/search?q=${encodeURIComponent(q)}`,
  service: (_d, q) => `https://www.google.com/search?q=${encodeURIComponent(q)}`,
};

function bundleLink(type: string, dest: string, query: string, aiLink?: string): string {
  const trusted =
    /booking\.com|airbnb\.|skyscanner|kayak|expedia|getyourguide|viator|tripadvisor|rentalcars|omio|trainline|thefork|hostelworld|agoda|ryanair|easyjet|ita\.|marriott|hilton|klook|ticketmaster|amazon\.|decathlon|zalando/i;
  if (aiLink && /^https?:\/\//i.test(aiLink) && trusted.test(aiLink)) return aiLink;
  const typeAliases: Record<string, string> = {
    hotel: "stay", accommodation: "stay", alloggio: "stay", lodging: "stay", resort: "stay",
    airbnb: "apartment", rental: "apartment", flights: "flight", volo: "flight", voli: "flight",
    car: "transport", "car rental": "transport", train: "transport", trasporti: "transport",
    excursion: "activity", activities: "activity", tour: "activity", attivita: "activity",
    meals: "food", restaurant: "food", dining: "food", cibo: "food",
    tickets: "ticket", equipment: "gear", assicurazione: "insurance",
  };
  const key = typeAliases[(type || "").toLowerCase()] || (type || "").toLowerCase();
  const builder = bookingLinks[key] || bookingLinks.service;

  return builder(dest || query, `${query} ${type}`);
}

async function buildExperienceBundle(query: string, category: string, lang: string): Promise<any[]> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

  // Real web context so prices/names aren't invented out of thin air
  const serpResults = await searchWithSerpAPI(query, category).catch(() => []);
  const serpContext = serpResults
    .slice(0, 8)
    .map((r: any, i: number) => `[S${i}] ${r.title} | ${r.snippet || ""} | ${r.link || r.source || ""}`)
    .join("\n");

  const isTravel = category === "travel";
  const allowedTypes = isTravel
    ? `"flight", "stay", "apartment", "transport", "activity", "food", "insurance", "gear"`
    : `"ticket", "service", "gear", "food", "stay", "transport", "activity"`;

  const systemPrompt = `You are a travel & lifestyle cost planner for "${query}".

Break the experience down into the REAL components someone must actually pay for.
${isTravel
  ? `For a trip include (when relevant): return flights, accommodation (hotel AND apartment option), local transport / car rental, 2-3 signature activities or excursions, food budget, travel insurance, and any needed gear.`
  : `For a lifestyle purchase/experience include tickets or booking fees, the main service, add-on services, gear/equipment, food & drinks, and travel/stay if the event requires it.`}

WEB CONTEXT (use for real names, seasons and price anchors):
${serpContext || "None"}

Rules:
- 7 to 9 items, each a DIFFERENT component (never two generic "blog" items).
- Prices in USD, total cost for the whole experience for 2 people unless the query says otherwise.
- "destination" = the city/region/place of the experience (empty string if none).
- Never invent a URL: leave "link" empty unless it is a real booking site URL you saw in the web context.
- Write "title" and "description" in ${lang === "en" ? "English" : "Italian"}.

Return ONLY JSON:
{"destination":"...","items":[{"type":one of ${allowedTypes},"title":"...","price":number,"description":"what it covers, 1-2 sentences","link":"","source":"Booking.com|Skyscanner|GetYourGuide|..."}]}`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: query },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error(`[Bundle] AI error ${response.status}: ${detail.slice(0, 300)}`);
    return [];
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";
  let parsed: any = null;
  try {
    let jsonStr = content;
    const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenced) jsonStr = fenced[1].trim();
    const objMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (objMatch) jsonStr = objMatch[0];
    parsed = JSON.parse(jsonStr);
  } catch (e) {
    console.error("[Bundle] parse error", e);
    return [];
  }

  const destination: string = parsed?.destination || "";
  const items: any[] = Array.isArray(parsed?.items) ? parsed.items : [];
  if (items.length === 0) return [];

  // Real photos per component
  const imageMap = await searchImages(`${destination || query} ${isTravel ? "travel" : ""}`.trim()).catch(() => ({}));
  const imageUrls = Object.values(imageMap);

  const listings = items.map((item: any, i: number) => ({
    title: item.title,
    price: Number(item.price) || 0,
    description: item.description || "",
    link: bundleLink(item.type, destination, `${destination || query} ${item.title || ""}`.trim(), item.link),
    source: item.source || destination || "Booking",
    component: item.type,
    image: imageUrls[i] ?? imageUrls[0] ?? null,
  }));

  // Total cost of the whole experience as the headline item
  const total = listings.reduce((sum, l) => sum + (l.price || 0), 0);
  if (total > 0) {
    listings.unshift({
      title: lang === "en" ? `Full experience: ${query}` : `Esperienza completa: ${query}`,
      price: total,
      description:
        lang === "en"
          ? `Estimated total of all ${listings.length} components below (flights, stay, transport, activities, food).`
          : `Totale stimato di tutte le ${listings.length} voci qui sotto (voli, alloggio, trasporti, attività, cibo).`,
      link: bundleLink("stay", destination, query),
      source: destination || "Years",
      component: "total",
      image: imageUrls[0] ?? null,
    });
  }

  console.log(`[Bundle] ${listings.length} components for ${category} / ${destination}`);
  return listings;
}


serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const auth = await requireUser(req, corsHeaders);
  if ("response" in auth) return auth.response;

  try {
    const { query: rawQuery, type, lang = "it" } = await req.json();
    const query = normalizeQuery(rawQuery);
    console.log(`\n=== Product Search: ${rawQuery} -> ${query} ===`);

    if (type === "product") {
      const cacheKey = `${query.toLowerCase()}|${lang}`;
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.at < CACHE_TTL) {
        console.log("[cache] hit");
        return new Response(cached.payload, {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { category, isRental } = detectCategory(query);
      console.log(`Category: ${category}`);

      let listings: any[] = [];

      if (category === "travel" || category === "lifestyle") {
        // Full experience breakdown with real booking deep links
        listings = await buildExperienceBundle(query, category, lang);
      }

      if (category === "product") {
        // FAST PATH: Google Shopping already returns structured products
        // (title, price, image, link) — no AI round-trip needed.
        const serpResults = await searchWithSerpAPI(query, category);
        listings = serpResults
          .filter((r: any) => r.price > 0 && r.title)
          .slice(0, 10);
      }

      if (listings.length < 3) {

        // Slow path: enrich with Exa + AI extraction only when needed
        const [exaResults, serpResults] = await Promise.all([
          searchWithExa(query, category),
          listings.length > 0 ? Promise.resolve(listings) : searchWithSerpAPI(query, category),
        ]);

        if (exaResults.length > 0 || serpResults.length > 0) {
          listings = await extractListings(query, exaResults, serpResults, category, lang);
        }

        if (listings.length < 3) {
          console.log("Not enough listings, generating fallback...");
          const fallback = await generateListings(query, category);
          listings = [...listings, ...fallback].slice(0, 10);
        }

        // Attach real images from Google Images for listings missing one
        const missingImages = listings.filter((l: any) => !l.image).length;
        if (missingImages > 0) {
          const imageUrls = Object.values(await searchImages(query));
          let imgIdx = 0;
          listings = listings.map((listing: any) =>
            listing.image
              ? listing
              : { ...listing, image: imageUrls[imgIdx++] ?? null }
          );
        }
      }

      // Always guarantee a working link so users can reach the real listing
      listings = listings.map((listing: any) => ({
        ...listing,
        link:
          listing.link &&
          /^https?:\/\//i.test(listing.link) &&
          !/example\.(com|org|net)|placeholder|localhost/i.test(listing.link)
            ? listing.link
            : `https://www.google.com/search?q=${encodeURIComponent(`${listing.title || query}`)}`,
      }));

      if (listings.length === 0) {
        throw new Error("Could not find listings for this search");
      }


      // Ensure sorted by price descending
      listings.sort((a: any, b: any) => (b.price || 0) - (a.price || 0));

      const payload = JSON.stringify({
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
      });

      cache.set(cacheKey, { at: Date.now(), payload });

      return new Response(payload, {
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
