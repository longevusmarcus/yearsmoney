import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PriceData {
  symbol: string;
  name: string;
  currentPrice: number;
  change24h: number;
  changePercent24h: number;
}

// Warm-instance cache: repeated visits to the Risks page answer instantly
// instead of waiting on a fresh AI round-trip every time.
const priceCache = new Map<string, { at: number; payload: unknown }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { assets, warmup } = await req.json().catch(() => ({ assets: null }));

    // Cheap ping used by the app to boot the function before it is needed.
    if (warmup) {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!assets || !Array.isArray(assets) || assets.length === 0) {
      return new Response(JSON.stringify({ error: "No assets provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cacheKey = assets.map((a: string) => String(a).trim().toLowerCase()).join("|");
    const cached = priceCache.get(cacheKey);
    if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
      return new Response(JSON.stringify(cached.payload), {
        headers: { ...corsHeaders, "Content-Type": "application/json", "X-Cache": "hit" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Resolve fuzzy / misspelled / partial tickers into canonical assets
    const aliasMap: Record<string, string> = {
      spcx: "SpaceX (private, SPCX)",
      spacex: "SpaceX (private, SPCX)",
      tsla: "Tesla Inc (TSLA)",
      tesla: "Tesla Inc (TSLA)",
      appl: "Apple Inc (AAPL)",
      aapl: "Apple Inc (AAPL)",
      apple: "Apple Inc (AAPL)",
      nvda: "NVIDIA Corp (NVDA)",
      nvidia: "NVIDIA Corp (NVDA)",
      msft: "Microsoft Corp (MSFT)",
      googl: "Alphabet Inc (GOOGL)",
      google: "Alphabet Inc (GOOGL)",
      amzn: "Amazon.com Inc (AMZN)",
      meta: "Meta Platforms Inc (META)",
      btc: "Bitcoin (BTC)",
      bitcoin: "Bitcoin (BTC)",
      eth: "Ethereum (ETH)",
      ethereum: "Ethereum (ETH)",
      sol: "Solana (SOL)",
      vwce: "Vanguard FTSE All-World UCITS ETF (VWCE)",
      swda: "iShares Core MSCI World UCITS ETF (SWDA)",
      spy: "SPDR S&P 500 ETF Trust (SPY)",
      voo: "Vanguard S&P 500 ETF (VOO)",
      qqq: "Invesco QQQ Trust (QQQ)",
      oro: "Gold (XAU)",
      gold: "Gold (XAU)",
    };

    const resolvedAssets = assets.map((a: string) => {
      const key = String(a).trim().toLowerCase();
      return aliasMap[key] ? `${a} => ${aliasMap[key]}` : a;
    });

    // Use AI to get current price data for the assets
    const systemPrompt = `You are a financial data provider and ticker resolver.
The user input may be a ticker, a partial ticker, a misspelling, an abbreviation, or a company/crypto name in any language (e.g. "SPCX" means SpaceX, "appl" means Apple/AAPL, "oro" means Gold).
For EACH input string, infer the most likely real-world asset (stock, ETF, crypto, commodity) and return its canonical ticker symbol and full name.
Return JSON only with this exact structure:
{
  "prices": [
    {
      "query": "the original input string, unchanged",
      "symbol": "canonical ticker symbol (uppercase)",
      "name": "full asset name",
      "currentPrice": current_price_number,
      "change24h": dollar_change_today,
      "changePercent24h": percentage_change_today
    }
  ],
  "lastUpdated": "ISO timestamp"
}

Rules:
- Always return exactly one entry per input, in the same order, with "query" equal to the original input string.
- Never say you cannot resolve it: pick the single most probable asset.
- For private companies with no public listing (e.g. SpaceX), use the latest known secondary-market / tender-offer share price estimate.
- Use USD prices. Use realistic current market prices; estimate from recent market data if unsure.`;

    const userPrompt = `Resolve and get current prices for these assets (one entry each, "X => Y" means X likely refers to Y): ${resolvedAssets.join(" | ")}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    try {
      const parsed = JSON.parse(content);
      // Ensure "query" always matches the original user input (by index)
      if (Array.isArray(parsed?.prices)) {
        parsed.prices = parsed.prices.map((p: Record<string, unknown>, i: number) => ({
          ...p,
          query: typeof assets[i] === "string" ? assets[i] : p.query,
        }));
      }
      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch {
      return new Response(JSON.stringify({ error: "Failed to parse price data" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("investment-prices error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
