import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Clock,
  DollarSign,
  TrendingDown,
  Sparkles,
  Share2,
  Calculator,
  Hourglass,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRef } from "react";

// Component for manifesto text that highlights as one whole unit on scroll
const ManifestoText = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.85", "start 0.15"],
  });

  const paragraphs = [
    {
      text: "Every dollar you spend represents time you traded from your life. Hours at work, energy given, moments that will never return.",
      highlights: ["time you traded", "never return"],
    },
    {
      text: "TimeCost makes this visible.",
      highlights: ["TimeCost"],
      isAccent: true,
    },
    {
      text: "By converting purchases into life-hours, you see what things truly cost. Not in abstract currency, but in the irreplaceable hours of your existence.",
      highlights: ["life-hours", "truly cost"],
    },
    {
      text: "Know exactly how much life you have left. Spend it wisely.",
      highlights: ["wisely"],
      hasCircle: "wisely",
    },
  ];

  const allElements: {
    word: string;
    isBreak?: boolean;
    isHighlight?: boolean;
    hasCircle?: boolean;
    isAccent?: boolean;
  }[] = [];

  paragraphs.forEach((para, pIndex) => {
    const words = para.text.split(" ");
    words.forEach((word) => {
      const isHighlight = para.highlights.some(
        (h) => para.text.indexOf(h) !== -1 && h.split(" ").includes(word.replace(/[.,!?—]/g, "")),
      );
      const hasCircle = para.hasCircle && para.hasCircle.split(" ").includes(word.replace(/[.,!?—]/g, ""));
      allElements.push({
        word,
        isHighlight,
        hasCircle,
        isAccent: para.isAccent,
      });
    });
    if (pIndex < paragraphs.length - 1) {
      allElements.push({ word: "", isBreak: true });
    }
  });

  const wordCount = allElements.filter((e) => !e.isBreak).length;
  let wordIndex = 0;

  return (
    <div
      ref={ref}
      className="text-2xl md:text-3xl lg:text-4xl font-cormorant italic font-light leading-relaxed text-center space-y-8"
    >
      {paragraphs.map((para, pIndex) => {
        const words = para.text.split(" ");
        const startIdx = wordIndex;
        wordIndex += words.length;

        return (
          <p key={pIndex} className={`${para.isAccent ? "text-3xl md:text-4xl lg:text-5xl font-normal" : ""}`}>
            {words.map((word, wIndex) => {
              const globalIdx = startIdx + wIndex;
              const start = globalIdx / wordCount;
              const end = start + 1 / wordCount;
              const isHighlight = para.highlights.some((h) => h.split(" ").includes(word.replace(/[.,!?—]/g, "")));
              const hasCircle = para.hasCircle && para.hasCircle.split(" ").includes(word.replace(/[.,!?—]/g, ""));

              return (
                <ManifestoWord
                  key={wIndex}
                  range={[start, end]}
                  progress={scrollYProgress}
                  isHighlight={isHighlight}
                  hasCircle={hasCircle}
                  isAccent={para.isAccent}
                >
                  {word}
                </ManifestoWord>
              );
            })}
          </p>
        );
      })}
    </div>
  );
};

const ManifestoWord = ({
  children,
  range,
  progress,
  isHighlight,
  hasCircle,
  isAccent,
}: {
  children: string;
  range: [number, number];
  progress: any;
  isHighlight?: boolean;
  hasCircle?: boolean;
  isAccent?: boolean;
}) => {
  const opacity = useTransform(progress, range, [0.2, 1]);
  const color = useTransform(
    progress,
    range,
    isAccent
      ? ["hsl(45 50% 40%)", "hsl(45 80% 65%)"]
      : isHighlight
        ? ["hsl(0 0% 50%)", "hsl(237 45% 70%)"]
        : ["hsl(0 0% 50%)", "hsl(35 25% 90%)"],
  );

  return (
    <motion.span
      style={{ opacity, color }}
      className={`inline-block mr-[0.25em] relative ${isHighlight ? "font-normal" : ""}`}
    >
      {children}
      {hasCircle && (
        <motion.span
          className="absolute -inset-x-2 -inset-y-1 border-2 border-accent/50 rounded-full pointer-events-none"
          style={{ opacity }}
        />
      )}
    </motion.span>
  );
};

const About = () => {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress: heroScrollProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const features = [
    {
      icon: Calculator,
      title: "Life Buffer",
      subtitle: "Know your runway",
      description:
        "See exactly how many months or years of optional life you have based on your net worth and expenses.",
      gradient: "from-primary/20 to-primary/10",
    },
    {
      icon: Clock,
      title: "Purchase Cost",
      subtitle: "Hours, not dollars",
      description:
        "Convert any purchase into life-hours. See the true cost of that laptop, vacation, or daily coffee.",
      gradient: "from-secondary/20 to-secondary/10",
    },
    {
      icon: TrendingDown,
      title: "Find Alternatives",
      subtitle: "Save your hours",
      description:
        "Discover cheaper options and see exactly how many life-hours you'd save with each alternative.",
      gradient: "from-accent/20 to-accent/10",
    },
    {
      icon: Sparkles,
      title: "AI Advisor",
      subtitle: "Time-smart decisions",
      description:
        "Get personalized insights on when to buy, sell, or wait—all calculated in life-hours at risk or saved.",
      gradient: "from-success/20 to-success/10",
    },
  ];

  const howItWorks = [
    {
      title: "Enter Your Numbers",
      description: "Monthly income, expenses, and net worth—that's all we need",
    },
    {
      title: "See Your Life Buffer",
      description: "Discover how many months of optional life you currently have",
    },
    {
      title: "Analyze Purchases",
      description: "Convert any price into life-hours with one click",
    },
    {
      title: "Compare & Save",
      description: "Find alternatives and see exactly how many hours you'd reclaim",
    },
    {
      title: "Share Your Truth",
      description: "Generate a powerful share card showing the real cost of things",
    },
  ];

  const floatingCards = [
    {
      title: "Life Buffer",
      text: "You have 6.2 years of optional life",
      delay: 0,
      position: "left-1 md:left-4 lg:left-12 top-24 md:top-32 lg:top-36",
      icon: Hourglass,
      iconColor: "text-accent",
      iconBg: "bg-accent/20",
    },
    {
      title: "MacBook Pro",
      text: "This costs 432 hours of your life",
      delay: 0.2,
      position: "right-1 md:right-4 lg:right-12 top-40 md:top-48 lg:top-52",
      icon: Clock,
      iconColor: "text-primary",
      iconBg: "bg-primary/20",
    },
    {
      title: "Alternative Found",
      text: "Refurbished: Save 218 hours of life",
      delay: 0.4,
      position: "left-1 md:left-4 lg:left-20 bottom-24 md:bottom-32 lg:bottom-36",
      icon: TrendingDown,
      iconColor: "text-success",
      iconBg: "bg-success/20",
    },
    {
      title: "AI Insight",
      text: "Wait 2 weeks: 15% price drop predicted",
      delay: 0.6,
      position: "right-1 md:right-4 lg:right-20 bottom-40 md:bottom-48 lg:bottom-52",
      icon: Sparkles,
      iconColor: "text-secondary",
      iconBg: "bg-secondary/20",
    },
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-5xl">
        <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-full px-6 py-3 flex items-center justify-between shadow-lg shadow-background/20">
          <div className="flex items-center gap-8">
            <Link
              to="/about"
              className="text-xl font-light tracking-wide bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent"
            >
              TimeCost
            </Link>
            <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#manifesto" className="hover:text-foreground transition-colors">
                Philosophy
              </a>
              <a href="#features" className="hover:text-foreground transition-colors">
                Features
              </a>
              <a href="#how-it-works" className="hover:text-foreground transition-colors">
                How It Works
              </a>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button asChild size="sm" className="rounded-full bg-primary hover:bg-primary/90">
              <Link to="/calculator">
                Calculate <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-muted/50 via-background to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_center,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />

        {/* Floating Cards */}
        {floatingCards.map((card, index) => {
          const isLeft = index % 2 === 0;
          const cardY = useTransform(heroScrollProgress, [0, 0.5], [0, 200]);
          const cardOpacity = useTransform(heroScrollProgress, [0, 0.3, 0.5], [1, 0.6, 0]);
          const cardScale = useTransform(heroScrollProgress, [0, 0.5], [1, 0.4]);
          const cardX = useTransform(heroScrollProgress, [0, 0.5], [0, isLeft ? 150 : -150]);

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: card.delay + 0.6, duration: 0.7, ease: "easeOut" }}
              style={{
                y: cardY,
                opacity: cardOpacity,
                scale: cardScale,
                x: cardX,
              }}
              className={`absolute ${card.position} max-w-[130px] md:max-w-[200px] lg:max-w-[300px] z-20`}
            >
              <div className="bg-card/95 backdrop-blur-md border border-border/60 rounded-lg md:rounded-xl lg:rounded-2xl p-1.5 md:p-2.5 lg:p-4 shadow-xl shadow-background/30">
                <div className="flex items-start gap-1 md:gap-2 lg:gap-3">
                  <div
                    className={`w-5 h-5 md:w-7 md:h-7 lg:w-10 lg:h-10 rounded-md md:rounded-lg lg:rounded-xl ${card.iconBg} flex items-center justify-center shrink-0`}
                  >
                    <card.icon
                      className={`h-2.5 w-2.5 md:h-3.5 md:w-3.5 lg:h-5 lg:w-5 ${card.iconColor}`}
                      strokeWidth={1.5}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 md:gap-2 mb-0 md:mb-0.5 lg:mb-1">
                      <span className="text-[9px] md:text-xs lg:text-sm font-medium text-foreground">{card.title}</span>
                    </div>
                    <p className="text-[8px] md:text-[10px] lg:text-xs text-muted-foreground leading-tight line-clamp-2">
                      {card.text}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* Hero Content */}
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto pt-16 md:pt-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-1.5 md:gap-2 bg-card/60 backdrop-blur-sm border border-border/50 rounded-full px-3 md:px-5 py-1.5 md:py-2.5 mb-6 md:mb-10"
          >
            <Clock className="h-3 w-3 md:h-4 md:w-4 text-foreground" />
            <span className="text-[10px] md:text-sm text-muted-foreground whitespace-nowrap">
              See what things really cost
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="text-3xl md:text-6xl lg:text-7xl text-foreground mb-6 md:mb-8 leading-tight"
          >
            <span className="font-light block md:inline">See how much of your life</span>
            <br className="hidden md:block" />
            <span className="font-cormorant italic font-light text-3xl md:text-6xl lg:text-7xl block md:inline whitespace-nowrap">
              you trade for the things you buy
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12"
          >
            Convert purchases into life-hours. Know your buffer. Spend your time on what truly matters.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="flex justify-center"
          >
            <Button
              asChild
              size="lg"
              className="rounded-full text-base px-8 py-6 bg-primary hover:bg-primary/90 shadow-[0_0_30px_hsl(var(--primary)/0.5),0_0_60px_hsl(var(--primary)/0.3)] hover:shadow-[0_0_40px_hsl(var(--primary)/0.6),0_0_80px_hsl(var(--primary)/0.4)] transition-all duration-300"
            >
              <Link to="/calculator">
                Calculate Your Life Buffer <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Manifesto Section */}
      <section id="manifesto" className="py-32 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="inline-block bg-card/80 backdrop-blur-sm border border-border/50 rounded-full px-5 py-2.5 text-sm text-muted-foreground">
              Philosophy
            </span>
          </motion.div>

          <ManifestoText />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="inline-block bg-card/80 backdrop-blur-sm border border-border/50 rounded-full px-5 py-2.5 text-sm text-muted-foreground mb-6">
              Features
            </span>
            <h2 className="text-3xl md:text-5xl font-light text-foreground mb-4">
              Time is your only true currency
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Simple tools to understand the real cost of your financial decisions.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                className="relative group"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <div className="relative bg-card/60 backdrop-blur-sm border border-border/50 rounded-3xl p-8 h-full">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                    <feature.icon className="h-7 w-7 text-primary" strokeWidth={1.5} />
                  </div>
                  <span className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">
                    {feature.subtitle}
                  </span>
                  <h3 className="text-2xl font-light text-foreground mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 px-6 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="inline-block bg-card/80 backdrop-blur-sm border border-border/50 rounded-full px-5 py-2.5 text-sm text-muted-foreground mb-6">
              How It Works
            </span>
            <h2 className="text-3xl md:text-5xl font-light text-foreground mb-4">
              Five steps to clarity
            </h2>
          </motion.div>

          <div className="space-y-6">
            {howItWorks.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                className="flex items-start gap-6 bg-card/60 backdrop-blur-sm border border-border/50 rounded-2xl p-6"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-primary font-light">{index + 1}</span>
                </div>
                <div>
                  <h3 className="text-xl font-light text-foreground mb-1">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Big Number Demo Section */}
      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-muted-foreground mb-4 text-lg">That new iPhone?</p>
            <h2 className="text-7xl md:text-9xl font-light text-foreground mb-4">
              432
            </h2>
            <p className="text-2xl md:text-3xl text-muted-foreground font-light">
              hours of your life
            </p>
            <p className="text-muted-foreground mt-8 max-w-md mx-auto">
              That's 18 full days. Almost 3 weeks of your existence. Is it worth it?
            </p>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-br from-card via-card to-primary/5 border border-border/50 rounded-3xl p-12 text-center"
          >
            <h2 className="text-3xl md:text-4xl font-light text-foreground mb-4">
              Ready to see the truth?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              No account needed. No data stored. Just one calculation that might change how you see everything.
            </p>
            <Button
              asChild
              size="lg"
              className="rounded-full text-base px-8 py-6 bg-primary hover:bg-primary/90"
            >
              <Link to="/calculator">
                Calculate Now <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border/50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-muted-foreground text-sm">
            © 2025 TimeCost. Time is the only currency that matters.
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default About;
