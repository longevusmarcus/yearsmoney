import { useState } from "react";
import { Search, TrendingDown, Loader2, Info, ExternalLink, ArrowDown, Home, Car, Plane, ShoppingBag, ImageOff, Clock, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import BottomNav from "@/components/BottomNav";
import { PageHeader } from "@/components/PageHeader";
import MobileOnly from "@/components/MobileOnly";
import { useSearchHistory } from "@/hooks/useSearchHistory";

interface Listing {
  title: string;
  price: number;
  description?: string;
  source: string;
  link?: string;
  image?: string | null;
  hoursCost?: number;
  workingDays?: number;
}

interface AnalysisResult {
  productName: string;
  price: number;
  hoursCost: number;
  workingDays: number;
  source?: string;
  link?: string;
  image?: string | null;
  searchMethod?: string;
  category?: string;
  allListings: Listing[];
}

// Category icons
const categoryIcons: Record<string, React.ReactNode> = {
  real_estate: <Home className="w-4 h-4" />,
  automotive: <Car className="w-4 h-4" />,
  travel: <Plane className="w-4 h-4" />,
  product: <ShoppingBag className="w-4 h-4" />
};

const Purchase = () => {
  const [query, setQuery] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  
  const { history, addSearchToHistory, deleteFromHistory, isLoggedIn } = useSearchHistory();

  // Get financial data from Home (localStorage)
  const income = Number(localStorage.getItem("tc_income")) || 0;
  const expenses = Number(localStorage.getItem("tc_expenses")) || 0;
  const netWorth = Number(localStorage.getItem("tc_networth")) || 0;
  
  const freeCash = income - expenses;
  const hasData = income > 0 && expenses > 0;
  const hasNetWorth = netWorth > 0;

  // CORE CALCULATION: Life Buffer
  const currentBufferMonths = expenses > 0 ? netWorth / expenses : 0;
  const currentBufferYears = currentBufferMonths / 12;

  const WORKING_HOURS_PER_MONTH = 176;
  const WORKING_DAYS_PER_MONTH = 22;

  const dollarPerHour = freeCash > 0 ? freeCash / WORKING_HOURS_PER_MONTH : 0;

  const calculateWorkingDays = (priceValue: number) => {
    if (freeCash <= 0) {
      return expenses > 0 ? (priceValue / expenses) * WORKING_DAYS_PER_MONTH : 0;
    }
    return (priceValue / freeCash) * WORKING_DAYS_PER_MONTH;
  };

  const calculateBufferImpact = (priceValue: number) => {
    const newNetWorth = netWorth - priceValue;
    const newBufferMonths = expenses > 0 ? newNetWorth / expenses : 0;
    const bufferDecrease = currentBufferMonths - newBufferMonths;
    const percentageOfBuffer = netWorth > 0 ? (priceValue / netWorth) * 100 : 0;
    
    return {
      newBufferMonths,
      bufferDecrease,
      percentageOfBuffer
    };
  };

  const analyze = async () => {
    if (!query) return;
    
    setIsAnalyzing(true);
    setError(null);

    try {
      console.log("Searching for:", query);
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/product-search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          query,
          type: "product"
        }),
      });

      const data = await response.json();
      console.log("Search result:", data);

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Could not find price for this item");
      }
      
      if (!data.price || data.price === 0) {
        throw new Error("No price found - try being more specific");
      }
      
      const productPrice = data.price;
      const days = calculateWorkingDays(productPrice);
      
      // Process all listings with working days calculation
      const allListings: Listing[] = (data.allListings || []).map((listing: any) => {
        const listingDays = calculateWorkingDays(listing.price);
        return {
          ...listing,
          workingDays: listingDays,
          hoursCost: listingDays * 8
        };
      });
      
      const analysisResult: AnalysisResult = {
        productName: data.productName || query,
        price: productPrice,
        hoursCost: days * 8,
        workingDays: days,
        source: data.source,
        link: data.link,
        image: data.image,
        searchMethod: data.searchMethod,
        category: data.category,
        allListings
      };
      
      setResult(analysisResult);
      
      // Save to search history if logged in
      if (isLoggedIn) {
        await addSearchToHistory(query, "purchase", {
          productName: analysisResult.productName,
          price: analysisResult.price,
          workingDays: analysisResult.workingDays,
          category: data.category,
        });
      }
    } catch (err) {
      console.error("Search error:", err);
      setError(err instanceof Error ? err.message : "Failed to find price. Try a more specific search.");
    }
    
    setIsAnalyzing(false);
  };

  const reset = () => {
    setQuery("");
    setResult(null);
    setError(null);
  };

  // Image component with fallback
  const ListingImage = ({ src, alt, category }: { src?: string | null; alt: string; category?: string }) => {
    const [imgError, setImgError] = useState(false);
    
    if (!src || imgError) {
      return (
        <div className="w-full h-full bg-muted flex items-center justify-center">
          {categoryIcons[category || "product"] || <ImageOff className="w-6 h-6 text-muted-foreground" />}
        </div>
      );
    }
    
    return (
      <img 
        src={src} 
        alt={alt}
        className="w-full h-full object-cover"
        onError={() => setImgError(true)}
      />
    );
  };

  return (
    <MobileOnly>
    <div className="min-h-screen bg-background text-foreground pb-28">
      {/* Header */}
      <PageHeader 
        title="Purchase" 
        subtitle="See the true cost in hours of life" 
      />

      {/* Warning if no data */}
      {!hasData && (
        <div className="px-6 mb-4">
          <div className="bg-muted/30 border border-border rounded-2xl p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground font-light">
              Add your income and expenses on the Home page for accurate life-cost calculations.
            </p>
          </div>
        </div>
      )}

      {/* Your rate info */}
      {hasData && !result && (
        <div className="px-6 mb-6">
          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Your time-cost rate</p>
            <p className="text-lg font-light text-foreground">
              ${dollarPerHour.toFixed(2)}/hour earned
            </p>
            <p className="text-xs text-muted-foreground font-light mt-1">
              Each ${Math.round(freeCash / WORKING_DAYS_PER_MONTH)} spent = 1 working day to earn back
            </p>
          </div>
        </div>
      )}

      {!result ? (
        /* Search Form */
        <div className="px-6 space-y-4">
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider">What do you want to buy?</label>
            <div className="relative mt-2">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setError(null);
                }}
                onKeyDown={(e) => e.key === "Enter" && analyze()}
                placeholder="House in Minorca, Tesla Model S, Bali vacation..."
                className="w-full bg-card border border-border rounded-xl pl-11 pr-4 py-3.5 text-sm font-light focus:outline-none focus:ring-1 focus:ring-foreground/20"
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 font-light">
              We'll find real listings from the web
            </p>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3">
              <p className="text-xs text-destructive font-light">{error}</p>
            </div>
          )}

          <button
            onClick={analyze}
            disabled={isAnalyzing || !query}
            className="w-full bg-foreground text-background py-3.5 rounded-xl font-light disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Searching the web...
              </>
            ) : (
              "Find & Calculate"
            )}
          </button>

          {/* Quick examples */}
          <div className="pt-4">
            <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider">Try these</p>
            <div className="flex flex-wrap gap-2">
              {["House in Minorca", "Tesla Model S", "MacBook Pro M3", "Vacation in Bali", "Porsche 911", "iPhone 16 Pro"].map(item => (
                <button
                  key={item}
                  onClick={() => {
                    setQuery(item);
                    setError(null);
                  }}
                  className="px-3 py-1.5 bg-card border border-border rounded-full text-xs font-light hover:bg-muted/50 transition-colors"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Search History */}
          {isLoggedIn && history.length > 0 && (
            <div className="pt-6">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider mb-3 hover:text-foreground transition-colors"
              >
                <Clock className="w-3 h-3" />
                Your searches ({history.length})
              </button>
              
              <AnimatePresence>
                {showHistory && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-2">
                      {history.slice(0, 10).map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between bg-card border border-border rounded-xl p-3"
                        >
                          <button
                            onClick={() => {
                              setQuery(item.search_query);
                              setError(null);
                              setShowHistory(false);
                            }}
                            className="flex-1 text-left"
                          >
                            <p className="text-sm font-light text-foreground">{item.search_query}</p>
                            {item.result_data && (
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                ${item.result_data.price?.toLocaleString()} • {item.result_data.workingDays?.toFixed(1)} days
                              </p>
                            )}
                          </button>
                          <button
                            onClick={() => deleteFromHistory(item.id)}
                            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      ) : (
        /* Results */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-6"
        >
          {/* Search info badge */}
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-muted rounded-full text-xs text-muted-foreground">
              {categoryIcons[result.category || "product"]}
              {result.category?.replace("_", " ") || "product"}
            </span>
            <span className="text-xs text-muted-foreground">via {result.searchMethod}</span>
          </div>

          {/* Gallery of listings */}
          {result.allListings.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xs text-muted-foreground mb-3 uppercase tracking-wider flex items-center gap-2">
                <TrendingDown className="w-3 h-3" />
                {result.allListings.length} listings found (expensive → cheaper)
              </h3>
              
              <div className="space-y-3">
                {result.allListings.map((listing, i) => {
                  const bufferImpact = calculateBufferImpact(listing.price);
                  const isFirst = i === 0;
                  
                  return (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`bg-card border rounded-2xl overflow-hidden ${isFirst ? "border-primary/50" : "border-border"}`}
                    >
                      {/* Image */}
                      <div className="h-40 w-full bg-muted relative">
                        <ListingImage 
                          src={listing.image} 
                          alt={listing.title}
                          category={result.category}
                        />
                        {isFirst && (
                          <span className="absolute top-2 left-2 px-2 py-0.5 bg-primary text-primary-foreground text-[10px] rounded-full">
                            Most expensive
                          </span>
                        )}
                        <span className="absolute top-2 right-2 px-2 py-1 bg-background/90 backdrop-blur text-foreground text-sm font-medium rounded-lg">
                          ${listing.price.toLocaleString()}
                        </span>
                      </div>
                      
                      {/* Details */}
                      <div className="p-4">
                        <h4 className="font-medium text-sm line-clamp-2">{listing.title}</h4>
                        {listing.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{listing.description}</p>
                        )}
                        
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                          <div>
                            <p className="text-2xl font-light">{listing.workingDays?.toFixed(1)}<span className="text-sm text-muted-foreground ml-1">days</span></p>
                            <p className="text-[10px] text-muted-foreground">to earn back</p>
                          </div>
                          
                          {hasNetWorth && (
                            <div className="text-right">
                              <p className="text-sm text-destructive">−{bufferImpact.percentageOfBuffer.toFixed(1)}%</p>
                              <p className="text-[10px] text-muted-foreground">of buffer</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-[10px] text-muted-foreground">{listing.source}</span>
                          {listing.link && (
                            <a 
                              href={listing.link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-primary"
                            >
                              View listing <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Buffer Impact Summary (for most expensive) */}
          {hasNetWorth && result.allListings.length > 0 && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-2xl p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <ArrowDown className="w-4 h-4 text-destructive" />
                <p className="text-xs font-medium text-destructive uppercase tracking-wider">
                  Buffer Impact (Most Expensive)
                </p>
              </div>
              
              {(() => {
                const impact = calculateBufferImpact(result.allListings[0].price);
                return (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase">Current Buffer</p>
                        <p className="text-lg font-light">{currentBufferMonths.toFixed(1)} mo</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase">After Purchase</p>
                        <p className="text-lg font-light text-destructive">{impact.newBufferMonths.toFixed(1)} mo</p>
                      </div>
                    </div>
                    <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-destructive rounded-full transition-all"
                        style={{ width: `${Math.min(impact.percentageOfBuffer, 100)}%` }}
                      />
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* Explanation */}
          <div className="bg-card border border-border rounded-2xl p-4 mb-4">
            <p className="text-xs text-muted-foreground font-light">
              At your rate of ${dollarPerHour.toFixed(2)}/hour, prices above are converted to working days needed to earn them back.
            </p>
          </div>

          <button
            onClick={reset}
            className="w-full mt-4 py-3.5 border border-border rounded-xl font-light"
          >
            Search for something else
          </button>
        </motion.div>
      )}

      <BottomNav />
    </div>
    </MobileOnly>
  );
};

export default Purchase;
