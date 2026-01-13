import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import VoiceBubbleLogo from "@/components/VoiceBubbleLogo";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What is Hara?",
    answer: "Hara is a personal intuition tracking app that helps you learn to trust your gut feelings. By logging your intuitions and tracking their outcomes, you develop a deeper understanding of when to trust your instincts and make better decisions."
  },
  {
    question: "What does 'Hara' mean?",
    answer: "Hara (腹) is a Japanese concept referring to the center of one's being, located in the belly area. It's associated with intuition, inner wisdom, and authentic decision-making. In Japanese culture, this is where true feelings and instincts originate."
  },
  {
    question: "How does gut feeling tracking work?",
    answer: "Simply log your gut feelings when they arise, note the situation and your decision (whether you followed your intuition or ignored it), then record the outcome later. Over time, Hara reveals patterns in when your gut is most reliable."
  },
  {
    question: "Is my data private and secure?",
    answer: "Absolutely. Your check-ins and personal insights are encrypted and stored securely. We never sell your data to third parties. You can export or delete your data at any time from your profile settings."
  },
  {
    question: "What's the difference between gut feelings and anxiety?",
    answer: "Gut feelings tend to be calm, clear, and grounded—they feel like knowing rather than fearing. Anxiety-driven thoughts are typically repetitive, obsessive, and accompanied by physical tension. Hara's onboarding helps you learn to distinguish between the two."
  },
  {
    question: "How is Hara different from other journaling apps?",
    answer: "Unlike general journaling apps, Hara is specifically designed to track intuition and decision outcomes. We provide AI-powered pattern recognition, gamification to build consistent habits, and personalized insights based on your unique intuition patterns."
  },
  {
    question: "Can I use voice to log my check-ins?",
    answer: "Yes! Hara supports voice recording for check-ins. Simply tap the microphone icon and speak your thoughts. Our AI will transcribe and analyze your entry automatically."
  },
  {
    question: "What are streaks and XP?",
    answer: "Streaks track consecutive days of check-ins to build your habit. XP (experience points) rewards you for engaging with your intuition—you earn more when you follow your gut and it leads to good outcomes. These features help make intuition development fun and consistent."
  },
  {
    question: "Is there a free version?",
    answer: "Hara offers a free tier with core tracking features. Premium features like advanced AI insights, unlimited voice transcription, and detailed analytics are available with a subscription."
  },
  {
    question: "How do I contact support?",
    answer: "For any questions, feedback, or support needs, email us at privacy@rocketminds.co. We typically respond within 24-48 hours."
  }
];

const FAQ = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link 
          to="/auth" 
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to sign in
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <VoiceBubbleLogo size="sm" />
          <h1 className="text-3xl font-cursive text-foreground">Frequently Asked Questions</h1>
        </div>

        <div className="space-y-4">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-border/40">
                <AccordionTrigger className="text-left text-foreground hover:text-primary">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="mt-12 pt-6 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Still have questions? Contact us at{" "}
            <a href="mailto:privacy@rocketminds.co" className="text-primary hover:underline">
              privacy@rocketminds.co
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
