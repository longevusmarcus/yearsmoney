import { useState, useEffect, useRef } from "react";
import { MessageCircle, Send, Target, Plus, X, TrendingUp, TrendingDown } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface TimeGoal {
  id: string;
  title: string;
  hoursTarget: number;
  hoursAchieved: number;
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
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [goals, setGoals] = useState<TimeGoal[]>(() => 
    JSON.parse(localStorage.getItem("tc_goals") || "[]")
  );
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalHours, setNewGoalHours] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // History for chart
  const [history, setHistory] = useState<Array<{ month: string; withIncome: number; withoutIncome: number }>>(() => 
    JSON.parse(localStorage.getItem("tc_history") || "[]")
  );

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("tc_income", String(monthlyIncome));
    localStorage.setItem("tc_expenses", String(monthlyExpenses));
    localStorage.setItem("tc_networth", String(netWorth));
    localStorage.setItem("tc_goals", JSON.stringify(goals));
  }, [monthlyIncome, monthlyExpenses, netWorth, goals]);

  // Calculations
  const freeCash = monthlyIncome - monthlyExpenses;
  const isNegative = freeCash < 0;

  // Life buffer WITH income (sustainable months based on free cash + net worth)
  const lifeBufferWithIncome = monthlyExpenses > 0 
    ? (netWorth / monthlyExpenses) + (freeCash > 0 ? (freeCash * 12 / monthlyExpenses) : 0)
    : 0;

  // Life buffer WITHOUT income (only net worth / expenses)
  const lifeBufferWithoutIncome = monthlyExpenses > 0 
    ? netWorth / monthlyExpenses 
    : 0;

  // Convert to years and months
  const formatLifeBuffer = (months: number) => {
    const years = Math.floor(months / 12);
    const remainingMonths = Math.round(months % 12);
    if (years > 0 && remainingMonths > 0) {
      return { years, months: remainingMonths, display: `${years}y ${remainingMonths}m` };
    } else if (years > 0) {
      return { years, months: 0, display: `${years} years` };
    } else {
      return { years: 0, months: remainingMonths, display: `${remainingMonths} months` };
    }
  };

  const withIncomeFormatted = formatLifeBuffer(lifeBufferWithIncome);
  const withoutIncomeFormatted = formatLifeBuffer(lifeBufferWithoutIncome);

  // Hours gained/lost this month
  const hoursGainedOrLost = freeCash > 0 && monthlyExpenses > 0
    ? Math.round((freeCash / monthlyExpenses) * 30 * 24)
    : freeCash < 0 && monthlyExpenses > 0
    ? Math.round((freeCash / monthlyExpenses) * 30 * 24)
    : 0;

  // Update history monthly
  useEffect(() => {
    const currentMonth = new Date().toLocaleDateString('en-US', { month: 'short' });
    const existingIndex = history.findIndex(h => h.month === currentMonth);
    
    if (monthlyExpenses > 0) {
      const newEntry = {
        month: currentMonth,
        withIncome: Math.round(lifeBufferWithIncome * 10) / 10,
        withoutIncome: Math.round(lifeBufferWithoutIncome * 10) / 10
      };

      let newHistory;
      if (existingIndex >= 0) {
        newHistory = [...history];
        newHistory[existingIndex] = newEntry;
      } else {
        newHistory = [...history.slice(-5), newEntry];
      }
      
      setHistory(newHistory);
      localStorage.setItem("tc_history", JSON.stringify(newHistory));
    }
  }, [lifeBufferWithIncome, lifeBufferWithoutIncome]);

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
- Life Buffer (with income): ${withIncomeFormatted.display}
- Life Buffer (without income): ${withoutIncomeFormatted.display}
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

  const addGoal = () => {
    if (!newGoalTitle.trim() || !newGoalHours) return;
    const newGoal: TimeGoal = {
      id: Date.now().toString(),
      title: newGoalTitle,
      hoursTarget: Number(newGoalHours),
      hoursAchieved: 0
    };
    setGoals([...goals, newGoal]);
    setNewGoalTitle("");
    setNewGoalHours("");
    setShowGoalModal(false);
  };

  const deleteGoal = (id: string) => {
    setGoals(goals.filter(g => g.id !== id));
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

      {/* Life Buffer Cards */}
      <div className="px-6 mb-6">
        <div className="grid grid-cols-2 gap-3">
          {/* With Income */}
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingUp className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">with income</span>
            </div>
            <p className="text-3xl font-light text-foreground tracking-tight">
              {withIncomeFormatted.display}
            </p>
            <p className="text-xs text-muted-foreground font-light mt-1">optional life</p>
          </div>

          {/* Without Income */}
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingDown className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">without income</span>
            </div>
            <p className="text-3xl font-light text-foreground tracking-tight">
              {withoutIncomeFormatted.display}
            </p>
            <p className="text-xs text-muted-foreground font-light mt-1">runway left</p>
          </div>
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

      {/* Progress Chart */}
      {history.length > 1 && (
        <div className="px-6 mb-6">
          <h2 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3">progress</h2>
          <div className="bg-card border border-border rounded-2xl p-4 h-32">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ 
                    background: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                  formatter={(value: number) => [`${value} months`, '']}
                />
                <Line 
                  type="monotone" 
                  dataKey="withIncome" 
                  stroke="hsl(var(--foreground))" 
                  strokeWidth={2}
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="withoutIncome" 
                  stroke="hsl(var(--muted-foreground))" 
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-2">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-0.5 bg-foreground rounded-full" />
              <span className="text-[10px] text-muted-foreground">with income</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-0.5 bg-muted-foreground rounded-full border-dashed" style={{ borderTop: '1px dashed' }} />
              <span className="text-[10px] text-muted-foreground">without</span>
            </div>
          </div>
        </div>
      )}

      {/* Time Goals */}
      <div className="px-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[10px] uppercase tracking-wider text-muted-foreground">time goals</h2>
          <button 
            onClick={() => setShowGoalModal(true)}
            className="w-6 h-6 rounded-full bg-foreground text-background flex items-center justify-center"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>

        {goals.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-6 text-center">
            <Target className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground font-light">Set time-based goals</p>
            <p className="text-xs text-muted-foreground/60 font-light">e.g. "Save 500 hours for a vacation"</p>
          </div>
        ) : (
          <div className="space-y-2">
            {goals.map(goal => (
              <div key={goal.id} className="bg-card border border-border rounded-xl p-3 flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-light text-foreground">{goal.title}</p>
                  <p className="text-xs text-muted-foreground">{goal.hoursTarget} hours</p>
                </div>
                <button 
                  onClick={() => deleteGoal(goal.id)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

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

      {/* Goal Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-end">
          <div className="w-full bg-card border-t border-border rounded-t-3xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-light">New Time Goal</h2>
              <button onClick={() => setShowGoalModal(false)}>
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground">Goal title</label>
                <input
                  type="text"
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  placeholder="e.g. Vacation to Japan"
                  className="w-full mt-1 px-4 py-3 bg-background border border-border rounded-xl text-sm font-light focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Hours needed</label>
                <input
                  type="number"
                  value={newGoalHours}
                  onChange={(e) => setNewGoalHours(e.target.value)}
                  placeholder="e.g. 400"
                  className="w-full mt-1 px-4 py-3 bg-background border border-border rounded-xl text-sm font-light focus:outline-none"
                />
              </div>
              <button
                onClick={addGoal}
                disabled={!newGoalTitle.trim() || !newGoalHours}
                className="w-full py-3 bg-foreground text-background rounded-xl text-sm font-light disabled:opacity-50"
              >
                Add Goal
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default Home;
