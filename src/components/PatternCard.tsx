import { Card } from "@/components/ui/card";
import { ChevronDown, Lightbulb, MessageCircle } from "lucide-react";
import { useState } from "react";

interface PatternCardProps {
  title: string;
  observation: string;
  intuitionGuide: string;
  relatedEntries?: string[];
  questions?: string[];
  icon: React.ReactNode;
  accentColor?: string;
}

export const PatternCard = ({
  title,
  observation,
  intuitionGuide,
  relatedEntries = [],
  questions = [],
  icon,
  accentColor = "primary"
}: PatternCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const bgColor = accentColor === "accent" ? "bg-accent/5" : "bg-primary/5";
  const iconBgColor = accentColor === "accent" ? "bg-accent/10" : "bg-primary/10";
  const dotColor = accentColor === "accent" ? "bg-accent" : "bg-primary";

  return (
    <Card 
      className={`overflow-hidden transition-all duration-300 border-border/50 ${
        isExpanded ? 'shadow-md' : 'hover:shadow-sm'
      }`}
    >
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full p-6 flex items-start gap-4 text-left transition-all duration-200 ${
          isExpanded ? bgColor : 'hover:bg-accent/5'
        }`}
      >
        <div className={`flex-shrink-0 w-12 h-12 rounded-2xl ${iconBgColor} flex items-center justify-center`}>
          {icon}
        </div>
        
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-medium text-foreground leading-snug">
              {title}
            </h3>
            <ChevronDown 
              className={`w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform duration-300 mt-0.5 ${
                isExpanded ? 'rotate-180' : ''
              }`}
            />
          </div>
          
          <p className={`text-sm text-muted-foreground font-light leading-relaxed ${
            isExpanded ? '' : 'line-clamp-2'
          }`}>
            {observation}
          </p>
        </div>
      </button>
      
      {/* Expanded Content */}
      <div 
        className={`transition-all duration-300 ease-in-out ${
          isExpanded 
            ? 'max-h-[1000px] opacity-100' 
            : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-6 pb-6 space-y-5">
          {/* Divider */}
          <div className="h-px bg-border/30" />
          
          {/* Actionable Guidance */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Lightbulb className={`w-4 h-4 ${accentColor === "accent" ? "text-accent" : "text-primary"}`} />
              <h4 className="text-sm font-semibold text-foreground">
                What to Do About It
              </h4>
            </div>
            <p className="text-sm text-foreground/90 font-light leading-relaxed pl-6">
              {intuitionGuide}
            </p>
          </div>

          {/* Reflection Questions */}
          {questions && questions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MessageCircle className={`w-4 h-4 ${accentColor === "accent" ? "text-accent" : "text-primary"}`} />
                <h4 className="text-sm font-semibold text-foreground">
                  Questions to Consider
                </h4>
              </div>
              <ul className="space-y-2.5 pl-6">
                {questions.map((q, idx) => (
                  <li key={idx} className="text-sm text-foreground/80 font-light leading-relaxed flex items-start gap-2">
                    <span className={`${dotColor} w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0`} />
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Examples from entries */}
          {relatedEntries && relatedEntries.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border/30">
              <p className="text-xs text-muted-foreground font-light mb-3">
                Based on your recent check-ins
              </p>
              <div className="space-y-2">
                {relatedEntries.slice(0, 2).map((entry, idx) => (
                  <div key={idx} className={`${bgColor} rounded-xl p-3`}>
                    <p className="text-xs text-foreground/70 font-light italic leading-relaxed">
                      "{entry.length > 120 ? entry.substring(0, 120) + '...' : entry}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
