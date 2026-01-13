import { ArrowLeft, MessageCircle, Book, Mail, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const Help = () => {
  const navigate = useNavigate();

  const faqs = [
    {
      question: "What is gut intuition?",
      answer: "Your gut intuition is your body's way of processing information faster than your conscious mind. It manifests as physical sensations—like a tight chest, dropped stomach, or warm expansiveness—that signal alignment or misalignment with your true self."
    },
    {
      question: "How do I know if it's my gut or just anxiety?",
      answer: "Gut feelings tend to be calm and clear, even if they're uncomfortable. Anxiety is usually racing, repetitive thoughts. Your gut says 'no' once; anxiety says 'no' a hundred times. Use the body sensation tracking to learn your unique signals."
    },
    {
      question: "What if I can't feel anything in my body?",
      answer: "That's completely normal! Start by noticing any sensation at all—warmth, coolness, tightness, relaxation. The more you check in, the more you'll develop this awareness. Even noticing numbness is progress."
    },
    {
      question: "How often should I check in?",
      answer: "Whenever you face a decision or notice a body sensation. There's no right amount—some days you might check in once, other days multiple times. Consistency matters more than frequency."
    },
    {
      question: "Why track whether I ignore my gut?",
      answer: "Tracking helps you see patterns. You might notice you ignore your gut more in certain situations or with certain people. This awareness is the first step to honoring it more often."
    },
    {
      question: "What's the difference between tap and voice mode?",
      answer: "Tap mode is quick and structured—great for fast check-ins. Voice mode captures more nuance and emotion. Use tap when you're clear on what you're feeling, voice when you need to process out loud."
    },
    {
      question: "How does the AI coach help?",
      answer: "The AI coach analyzes your patterns and asks reflective questions to help you understand your intuition better. It's not giving advice—it's helping you listen to yourself more clearly."
    },
    {
      question: "Is my data private?",
      answer: "Yes. All your check-ins are stored locally on your device. Your conversations with the AI coach are processed securely and not stored long-term."
    }
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="p-6 space-y-6">
        <button onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>

        <div className="space-y-2">
          <h1 className="text-4xl font-cursive text-foreground tracking-tight">Help & Support</h1>
          <p className="text-base text-muted-foreground font-light">
            Learn how to use Hara effectively
          </p>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <Card className="bg-card border-border p-4 rounded-[1.25rem] flex items-center gap-4 cursor-pointer hover:bg-card/80 transition-colors">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Book className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-base font-light text-foreground">Getting started guide</p>
              <p className="text-sm text-muted-foreground font-light">Learn the basics</p>
            </div>
            <ExternalLink className="w-4 h-4 text-muted-foreground" />
          </Card>

          <Card className="bg-card border-border p-4 rounded-[1.25rem] flex items-center gap-4 cursor-pointer hover:bg-card/80 transition-colors">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-base font-light text-foreground">Community</p>
              <p className="text-sm text-muted-foreground font-light">Connect with others</p>
            </div>
            <ExternalLink className="w-4 h-4 text-muted-foreground" />
          </Card>

          <Card className="bg-card border-border p-4 rounded-[1.25rem] flex items-center gap-4 cursor-pointer hover:bg-card/80 transition-colors">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-base font-light text-foreground">Contact support</p>
              <p className="text-sm text-muted-foreground font-light">support@hara.app</p>
            </div>
            <ExternalLink className="w-4 h-4 text-muted-foreground" />
          </Card>
        </div>

        {/* FAQs */}
        <div className="space-y-3">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-light">
            frequently asked
          </h2>
          
          <Card className="bg-card border-border rounded-[1.25rem] overflow-hidden">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, idx) => (
                <AccordionItem key={idx} value={`item-${idx}`} className="border-border">
                  <AccordionTrigger className="px-4 py-4 text-left hover:no-underline">
                    <span className="text-base font-light text-foreground">{faq.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <p className="text-sm text-muted-foreground font-light leading-relaxed">
                      {faq.answer}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Card>
        </div>

        {/* Tips */}
        <div className="space-y-3">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-light">
            pro tips
          </h2>
          
          <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-border p-5 rounded-[1.25rem]">
            <ul className="space-y-3 text-sm text-foreground font-light">
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>Check in right when you notice a body sensation—don't wait</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>Track decisions to build trust in your gut over time</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>Review your Inner Map weekly to spot patterns</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>Use voice mode when you need to process complex feelings</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>Don't judge yourself for ignoring your gut—awareness is the first step</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Help;