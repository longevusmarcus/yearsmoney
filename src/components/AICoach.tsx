import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AICoachProps {
  initialPrompt?: string;
}

export const AICoach = ({ initialPrompt }: AICoachProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (initialPrompt && messages.length === 0) {
      sendMessage(initialPrompt, true);
    }
  }, [initialPrompt]);

  useEffect(() => {
    if (messages.length > 0 && messages[messages.length - 1].role === "assistant") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const sendMessage = async (text: string, isInitial = false) => {
    if (!text.trim() && !isInitial) return;

    const userMessage: Message = { role: "user", content: text };
    const newMessages = isInitial ? [userMessage] : [...messages, userMessage];
    
    if (!isInitial) {
      setMessages(newMessages);
      setInput("");
    }
    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gut-coach`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: newMessages,
            type: "daily",
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to get response");
      }

      if (!response.body) {
        throw new Error("No response body");
      }

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
            console.error("Error parsing JSON:", e);
          }
        }
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to get AI response",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[400px]">
      <div className="flex-1 overflow-y-auto space-y-2 mb-3 px-1">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`${
              msg.role === "user" ? "text-right" : "text-left"
            }`}
          >
            <div
              className={`inline-block px-4 py-2 rounded-2xl max-w-[85%] ${
                msg.role === "user"
                  ? "bg-foreground text-background"
                  : "bg-card text-foreground"
              }`}
            >
              <p className="text-sm font-light whitespace-pre-wrap leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}

        {isLoading && messages.length > 0 && messages[messages.length - 1].role === "user" && (
          <div className="text-left">
            <div className="inline-block px-4 py-2 rounded-2xl bg-card">
              <div className="flex space-x-1">
                <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-2 items-end flex-shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              sendMessage(input);
            }
          }}
          placeholder="Type here..."
          className="flex-1 px-4 py-2 bg-card border-0 rounded-full text-sm font-light placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20"
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={isLoading || !input.trim()}
          className="w-9 h-9 rounded-full bg-foreground text-background flex items-center justify-center disabled:opacity-50 transition-opacity hover:opacity-90"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};