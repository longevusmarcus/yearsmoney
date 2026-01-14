import { useState, useEffect, useRef } from "react";
import { MessageCircle, Send, X, TrendingUp, TrendingDown } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const Home = () => {
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("tc_income", String(monthlyIncome));
    localStorage.setItem("tc_expenses", String(monthlyExpenses));
    localStorage.setItem("tc_networth", String(netWorth));
  }, [monthlyIncome, monthlyExpenses, netWorth]);

  // Calculations
  const freeCash = monthlyIncome - monthlyExpenses;
  const isNegative = freeCash < 0;

  // Monthly savings rate
  const monthlySavings = Math.max(0, freeCash);

  // Life buffer WITHOUT income (only net worth / expenses) - current runway
  const lifeBufferWithoutIncome = monthlyExpenses > 0 
    ? netWorth / monthlyExpenses 
    : 0;

  // Calculate projections for 1, 5, 20 years
  const calculateProjection = (years: number) => {
    if (monthlyExpenses <= 0) return 0;
    
    // Future net worth = current + (monthly savings * months)
    const futureNetWorth = netWorth + (monthlySavings * years * 12);
    
    // Life buffer in months = future net worth / monthly expenses
    const lifeBufferMonths = futureNetWorth / monthlyExpenses;
    
    return lifeBufferMonths;
  };

  const projectionData = [
    { 
      label: "Now", 
      months: Math.round(lifeBufferWithoutIncome),
      years: lifeBufferWithoutIncome / 12
    },
    { 
      label: "1 yr", 
      months: Math.round(calculateProjection(1)),
      years: calculateProjection(1) / 12
    },
    { 
      label: "5 yrs", 
      months: Math.round(calculateProjection(5)),
      years: calculateProjection(5) / 12
    },
    { 
      label: "20 yrs", 
      months: Math.round(calculateProjection(20)),
      years: calculateProjection(20) / 12
    },
  ];

  // Format display
  const formatLifeBuffer = (months: number) => {
    const years = Math.floor(months / 12);
    const remainingMonths = Math.round(months % 12);
    if (years > 0 && remainingMonths > 0) {
      return `${years}y ${remainingMonths}m`;
    } else if (years > 0) {
      return `${years} years`;
    } else {
      return `${remainingMonths} months`;
    }
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
- In 1 year: ${formatLifeBuffer(calculateProjection(1))}
- In 5 years: ${formatLifeBuffer(calculateProjection(5))}
- In 20 years: ${formatLifeBuffer(calculateProjection(20))}
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
        <h1 className="text-2xl font-light text-foreground tracking-tight">TimeCost</h1>
        <ThemeToggle />
      </div>

      {/* Input Fields */}
      <div className="px-6 mb-8 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Income/mo</label>
            <input
              type="number"
              value={monthlyIncome || ""}
              onChange={(e) => setMonthlyIncome(Number(e.target.value))}
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
              placeholder="0"
              className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm font-light focus:outline-none focus:ring-1 focus:ring-foreground/20"
            />
          </div>
        </div>
      </div>

      {/* Current Life Buffer */}
      <div className="px-6 mb-6">
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingDown className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">current optional life</span>
          </div>
          <p className="text-4xl font-light text-foreground tracking-tight">
            {formatLifeBuffer(lifeBufferWithoutIncome)}
          </p>
          <p className="text-xs text-muted-foreground font-light mt-1">if you stopped earning today</p>
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
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectionData} barCategoryGap="20%">
                <XAxis 
                  dataKey="label" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: 'hsl(var(--muted) / 0.3)' }}
                  contentStyle={{ 
                    background: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    fontSize: '12px',
                    padding: '8px 12px'
                  }}
                  formatter={(value: number) => [formatLifeBuffer(value), 'Optional Life']}
                />
                <Bar 
                  dataKey="months" 
                  radius={[8, 8, 0, 0]}
                >
                  {projectionData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={index === 0 ? 'hsl(var(--muted-foreground))' : 'hsl(var(--foreground))'}
                      opacity={index === 0 ? 0.5 : 0.3 + (index * 0.2)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Projection Labels */}
          <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-border/50">
            {projectionData.map((item, idx) => (
              <div key={idx} className="text-center">
                <p className="text-lg font-light text-foreground">
                  {item.years >= 1 
                    ? `${Math.round(item.years * 10) / 10}y` 
                    : `${item.months}m`
                  }
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
        <div className="fixed inset-0 bg-background z-50 flex flex-col">
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
    </div>
  );
};

export default Home;
