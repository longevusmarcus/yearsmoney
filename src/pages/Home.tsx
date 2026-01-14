import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Send, X, TrendingUp, TrendingDown, Landmark, CreditCard, Coins, Building2, Settings } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import AuthModal from "@/components/AuthModal";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell, LineChart, Line, Legend } from "recharts";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const Home = () => {
  const navigate = useNavigate();
  // Auth state
  const [user, setUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Financial inputs
  const [monthlyIncome, setMonthlyIncome] = useState(() => 
    Number(localStorage.getItem("tc_income")) || 0
  );
  const [monthlyExpenses, setMonthlyExpenses] = useState(() => 
    Number(localStorage.getItem("tc_expenses")) || 0
  );
  const [netWorth, setNetWorth] = useState(() => 
    Number(localStorage.getItem("tc_networth")) || 0
  );

  // UI state
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [displayMode, setDisplayMode] = useState<'years' | 'months' | 'days'>('years');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check auth state
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("tc_income", String(monthlyIncome));
    localStorage.setItem("tc_expenses", String(monthlyExpenses));
    localStorage.setItem("tc_networth", String(netWorth));
  }, [monthlyIncome, monthlyExpenses, netWorth]);

  // Handle input focus - show auth modal if not logged in
  const handleInputFocus = () => {
    if (!user) {
      setShowAuthModal(true);
    }
  };

  // Calculations
  const freeCash = monthlyIncome - monthlyExpenses;
  const isNegative = freeCash < 0;

  // Monthly savings rate
  const monthlySavings = Math.max(0, freeCash);

  // Life buffer WITHOUT income (only net worth / expenses) - current runway
  const lifeBufferWithoutIncome = monthlyExpenses > 0 
    ? netWorth / monthlyExpenses 
    : 0;

  // Calculate projections for both scenarios
  // Without income: just current net worth depleting over time (stays same - no growth)
  // With income: net worth grows with savings
  const calculateProjectionWithIncome = (years: number) => {
    if (monthlyExpenses <= 0) return 0;
    const futureNetWorth = netWorth + (monthlySavings * years * 12);
    return futureNetWorth / monthlyExpenses;
  };

  // Life buffer WITH income at current moment
  // This shows total runway if you keep earning at current rate
  const lifeBufferWithIncome = monthlyExpenses > 0 
    ? lifeBufferWithoutIncome + (monthlySavings > 0 ? (monthlySavings * 12 / monthlyExpenses) : 0)
    : 0;

  const projectionData = [
    { 
      label: "Now", 
      withIncome: Math.round(lifeBufferWithoutIncome),
      withoutIncome: Math.round(lifeBufferWithoutIncome),
    },
    { 
      label: "1 yr", 
      withIncome: Math.round(calculateProjectionWithIncome(1)),
      withoutIncome: Math.round(lifeBufferWithoutIncome), // stays same - no earning
    },
    { 
      label: "5 yrs", 
      withIncome: Math.round(calculateProjectionWithIncome(5)),
      withoutIncome: Math.round(lifeBufferWithoutIncome),
    },
    { 
      label: "20 yrs", 
      withIncome: Math.round(calculateProjectionWithIncome(20)),
      withoutIncome: Math.round(lifeBufferWithoutIncome),
    },
  ];

  // Format display based on mode
  const formatLifeBuffer = (months: number) => {
    if (displayMode === 'days') {
      const days = Math.round(months * 30);
      return `${days.toLocaleString()}d`;
    } else if (displayMode === 'months') {
      return `${Math.round(months)}mo`;
    } else {
      const years = Math.floor(months / 12);
      const remainingMonths = Math.round(months % 12);
      if (years > 0 && remainingMonths > 0) {
        return `${years}y ${remainingMonths}m`;
      } else if (years > 0) {
        return `${years} years`;
      } else {
        return `${remainingMonths} months`;
      }
    }
  };

  const cycleDisplayMode = () => {
    setDisplayMode(prev => prev === 'years' ? 'months' : prev === 'months' ? 'days' : 'years');
  };

  // Hours gained/lost this month
  const hoursGainedOrLost = freeCash > 0 && monthlyExpenses > 0
    ? Math.round((freeCash / monthlyExpenses) * 30 * 24)
    : freeCash < 0 && monthlyExpenses > 0
    ? Math.round((freeCash / monthlyExpenses) * 30 * 24)
    : 0;

  // Chat scroll
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = { role: "user", content: text };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const context = `User's financial context:
- Monthly Income: $${monthlyIncome}
- Monthly Expenses: $${monthlyExpenses}
- Net Worth: $${netWorth}
- Free Cash: $${freeCash}/month
- Current optional life (runway): ${formatLifeBuffer(lifeBufferWithoutIncome)}
- In 1 year: ${formatLifeBuffer(calculateProjectionWithIncome(1))}
- In 5 years: ${formatLifeBuffer(calculateProjectionWithIncome(5))}
- In 20 years: ${formatLifeBuffer(calculateProjectionWithIncome(20))}
- Hours ${hoursGainedOrLost >= 0 ? 'gained' : 'lost'} this month: ${Math.abs(hoursGainedOrLost)} hours`;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/time-advisor`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: newMessages,
            type: "chat",
            context
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to get response");
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (let line of lines) {
          line = line.trim();
          if (!line || line.startsWith(":")) continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") continue;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantMessage += content;
              setMessages([...newMessages, { role: "assistant", content: assistantMessage }]);
            }
          } catch (e) {
            console.error("Error parsing:", e);
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="p-6 flex justify-between items-center">
        <h1 className="text-2xl text-foreground tracking-tight">
          <span className="font-light">Welcome to </span>
          <span className="font-cursive italic">Years</span>
        </h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => navigate("/settings")}
            className="p-2 rounded-full hover:bg-muted/50 transition-colors"
          >
            <Settings className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Input Fields */}
      <div className="px-6 mb-4 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Income/mo</label>
            <input
              type="number"
              value={monthlyIncome || ""}
              onChange={(e) => setMonthlyIncome(Number(e.target.value))}
              onFocus={handleInputFocus}
              placeholder="0"
              className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm font-light focus:outline-none focus:ring-1 focus:ring-foreground/20"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Costs/mo</label>
            <input
              type="number"
              value={monthlyExpenses || ""}
              onChange={(e) => setMonthlyExpenses(Number(e.target.value))}
              onFocus={handleInputFocus}
              placeholder="0"
              className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm font-light focus:outline-none focus:ring-1 focus:ring-foreground/20"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Net Worth</label>
            <input
              type="number"
              value={netWorth || ""}
              onChange={(e) => setNetWorth(Number(e.target.value))}
              onFocus={handleInputFocus}
              placeholder="0"
              className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm font-light focus:outline-none focus:ring-1 focus:ring-foreground/20"
            />
          </div>
        </div>
      </div>

      {/* Connect Accounts - Coming Soon */}
      <div className="px-6 mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[10px] uppercase tracking-wider text-muted-foreground">sync accounts</h2>
          <span className="text-[9px] uppercase tracking-widest text-muted-foreground/50">soon</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: Building2, label: "Schwab" },
            { icon: CreditCard, label: "Stripe" },
            { icon: Landmark, label: "Bank" },
            { icon: Coins, label: "Crypto" },
          ].map((item, idx) => (
            <button
              key={idx}
              disabled
              className="group flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border/50 bg-card/30 opacity-40 cursor-not-allowed transition-opacity"
            >
              <item.icon className="w-4 h-4 text-muted-foreground" />
              <span className="text-[9px] text-muted-foreground font-light">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Life Buffer Cards - Both scenarios */}
      <div className="px-6 mb-6">
        <div className="grid grid-cols-2 gap-3">
          {/* Without Income */}
          <button
            onClick={cycleDisplayMode}
            className="bg-card border border-border rounded-2xl p-4 text-left hover:border-foreground/20 transition-colors active:scale-[0.98] duration-150"
          >
            <div className="flex items-center gap-1 mb-2">
              <TrendingDown className="w-3 h-3 text-muted-foreground" />
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground">if you stop</span>
            </div>
            <p 
              key={displayMode + '-without'}
              className="text-3xl font-light text-foreground tracking-tight animate-fade-in"
            >
              {formatLifeBuffer(lifeBufferWithoutIncome)}
            </p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-[10px] text-muted-foreground font-light">runway now</p>
              <span className="text-[8px] text-muted-foreground/50 uppercase tracking-wider">{displayMode}</span>
            </div>
          </button>

          {/* With Income - 1 year projection */}
          <button
            onClick={cycleDisplayMode}
            className="bg-card border border-border rounded-2xl p-4 text-left hover:border-foreground/20 transition-colors active:scale-[0.98] duration-150"
          >
            <div className="flex items-center gap-1 mb-2">
              <TrendingUp className="w-3 h-3 text-muted-foreground" />
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground">keep earning</span>
            </div>
            <p 
              key={displayMode + '-with'}
              className="text-3xl font-light text-foreground tracking-tight animate-fade-in"
            >
              {formatLifeBuffer(calculateProjectionWithIncome(1))}
            </p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-[10px] text-muted-foreground font-light">in 1 year</p>
              <span className="text-[8px] text-muted-foreground/50 uppercase tracking-wider">{displayMode}</span>
            </div>
          </button>
        </div>

        {/* Hours Gained/Lost */}
        <div className={`mt-3 rounded-2xl p-4 border ${
          isNegative 
            ? 'bg-destructive/10 border-destructive/20' 
            : 'bg-card border-border'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-light">this month</span>
            <span className={`text-xl font-light ${isNegative ? 'text-destructive' : 'text-foreground'}`}>
              {isNegative ? '' : '+'}{hoursGainedOrLost.toLocaleString()} hours
            </span>
          </div>
          {isNegative && (
            <p className="text-xs text-destructive/80 font-light mt-1">
              You're trading future life
            </p>
          )}
        </div>
      </div>

      {/* Projection Chart */}
      <div className="px-6 mb-6">
        <h2 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3">future projection</h2>
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={projectionData}>
                <XAxis 
                  dataKey="label" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ 
                    background: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    fontSize: '12px',
                    padding: '8px 12px'
                  }}
                  formatter={(value: number, name: string) => [
                    formatLifeBuffer(value), 
                    name === 'withIncome' ? 'With income' : 'Without income'
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="withIncome" 
                  stroke="hsl(var(--foreground))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--foreground))', strokeWidth: 0, r: 3 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="withoutIncome" 
                  stroke="hsl(var(--muted-foreground))" 
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={{ fill: 'hsl(var(--muted-foreground))', strokeWidth: 0, r: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          {/* Legend */}
          <div className="flex justify-center gap-6 mt-3 pt-3 border-t border-border/50">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-0.5 bg-foreground rounded-full" />
              <span className="text-[10px] text-muted-foreground">keep earning</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-0.5 bg-muted-foreground rounded-full opacity-60" />
              <span className="text-[10px] text-muted-foreground">stop earning</span>
            </div>
          </div>

          {/* Projection Values */}
          <div className="grid grid-cols-4 gap-2 mt-3">
            {projectionData.map((item, idx) => (
              <div key={idx} className="text-center">
                <p className="text-sm font-light text-foreground">
                  {formatLifeBuffer(item.withIncome)}
                </p>
                <p className="text-[10px] text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Insight */}
      {monthlyExpenses > 0 && monthlySavings > 0 && (
        <div className="px-6 mb-6">
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-light text-foreground">
                  Every month you save ${monthlySavings.toLocaleString()}, you gain{" "}
                  <span className="font-medium">
                    {Math.round((monthlySavings / monthlyExpenses) * 30 * 24).toLocaleString()} hours
                  </span>{" "}
                  of optional life.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Button */}
      <button
        onClick={() => setShowChat(true)}
        className="fixed bottom-24 right-6 w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center shadow-lg"
      >
        <MessageCircle className="w-5 h-5" />
      </button>

      {/* Chat Modal */}
      {showChat && (
        <div className="fixed inset-0 bg-background z-[60] flex flex-col">
          <div className="p-4 flex items-center justify-between border-b border-border">
            <h2 className="text-lg font-light">Time Advisor</h2>
            <button onClick={() => setShowChat(false)} className="text-muted-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground font-light">Ask me anything about optimizing your time</p>
              </div>
            )}
            {messages.map((msg, idx) => (
              <div key={idx} className={msg.role === "user" ? "text-right" : "text-left"}>
                <div className={`inline-block px-4 py-2 rounded-2xl max-w-[85%] ${
                  msg.role === "user" ? "bg-foreground text-background" : "bg-card text-foreground"
                }`}>
                  <p className="text-sm font-light whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="text-left">
                <div className="inline-block px-4 py-2 rounded-2xl bg-card">
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-border flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendMessage(input)}
              placeholder="Ask about your time..."
              className="flex-1 px-4 py-2 bg-card border-0 rounded-full text-sm font-light placeholder:text-muted-foreground focus:outline-none"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={isLoading || !input.trim()}
              className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <BottomNav />

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => setShowAuthModal(false)}
      />
    </div>
  );
};

export default Home;
