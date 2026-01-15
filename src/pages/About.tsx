import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Clock,
  Shield,
  TrendingUp,
  Sparkles,
  Hourglass,
  Layers,
  Eye,
  Home,
  Search,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRef } from "react";

// App screenshots
import appHome from "@/assets/app-home.png";
import appPurchase from "@/assets/app-purchase.png";
import appRisks from "@/assets/app-risks.png";
import appOptional from "@/assets/app-optional.png";

// Component for manifesto text that highlights as one whole unit on scroll
const ManifestoText = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.85", "start 0.15"],
  });

  const paragraphs = [
    {
      text: "Money is not wealth. Time is wealth. Every dollar you accumulate is simply stored time—hours you can choose not to work.",
      highlights: ["Time is wealth", "stored time"],
    },
    {
      text: "Years makes this visible.",
      highlights: ["Years"],
      isAccent: true,
    },
    {
      text: "Your buffer is not your net worth. It is how long you could exist without being forced into action. It is not philosophical. It is arithmetic.",
      highlights: ["forced into action", "arithmetic"],
    },
    {
      text: "Once visible, time cannot be ignored for long.",
      highlights: ["cannot be ignored"],
      hasCircle: "ignored",
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
      icon: Shield,
      title: "Life Buffer Zero",
      subtitle: "Survival time",
      description:
        "How long could you exist if all income stopped today? Net worth divided by monthly costs. This is your runway.",
      gradient: "from-primary/20 to-primary/10",
    },
    {
      icon: TrendingUp,
      title: "Life Buffer One",
      subtitle: "Optional time",
      description:
        "How much future life can you accumulate beyond survival? This buffer is not about enduring. It is about choice.",
      gradient: "from-secondary/20 to-secondary/10",
    },
    {
      icon: Eye,
      title: "Visibility",
      subtitle: "See the invisible",
      description:
        "People sense buffers as anxiety or confidence, but they are not named, not visible. We make inequality legible.",
      gradient: "from-accent/20 to-accent/10",
    },
    {
      icon: Sparkles,
      title: "Time Advisor",
      subtitle: "Temporal decisions",
      description:
        "Every purchase delays or accelerates your optional life. See exactly how many hours each decision costs.",
      gradient: "from-success/20 to-success/10",
    },
  ];

  const howItWorks = [
    {
      title: "Enter Your Numbers",
      description: "Monthly income, expenses, and net worth—the raw materials of time",
    },
    {
      title: "See Your Buffers",
      description: "Discover how many months of optional life you currently possess",
    },
    {
      title: "Project Forward",
      description: "See where you'll be in 1, 5, or 20 years—with or without income",
    },
    {
      title: "Analyze Purchases",
      description: "Convert any price into life-hours at your personal rate",
    },
    {
      title: "Optimize Time",
      description: "Stop optimizing for income. Start optimizing for life runway.",
    },
  ];

  const floatingCards = [
    {
      title: "Life Buffer",
      text: "6.2 years of optional life",
      delay: 0,
      position: "left-1 md:left-4 lg:left-12 top-24 md:top-32 lg:top-36",
      icon: Hourglass,
      iconColor: "text-accent",
      iconBg: "bg-accent/20",
    },
    {
      title: "If You Stop",
      text: "18 months runway remaining",
      delay: 0.2,
      position: "right-1 md:right-4 lg:right-12 top-40 md:top-48 lg:top-52",
      icon: Shield,
      iconColor: "text-primary",
      iconBg: "bg-primary/20",
    },
    {
      title: "This Month",
      text: "+720 hours of optional life",
      delay: 0.4,
      position: "left-1 md:left-4 lg:left-20 bottom-24 md:bottom-32 lg:bottom-36",
      icon: TrendingUp,
      iconColor: "text-success",
      iconBg: "bg-success/20",
    },
    {
      title: "That Laptop",
      text: "Costs 432 hours of future life",
      delay: 0.6,
      position: "right-1 md:right-4 lg:right-20 bottom-40 md:bottom-48 lg:bottom-52",
      icon: Clock,
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
              className="text-xl font-cursive italic tracking-wide bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent"
            >
              Years
            </Link>
            <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#manifesto" className="hover:text-foreground transition-colors">
                Philosophy
              </a>
              <a href="#how-it-works" className="hover:text-foreground transition-colors">
                How It Works
              </a>
              <a href="#features" className="hover:text-foreground transition-colors">
                Buffers
              </a>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button asChild size="sm" className="rounded-full bg-primary hover:bg-primary/90">
              <Link to="/home">
                Enter <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
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
            <Hourglass className="h-3 w-3 md:h-4 md:w-4 text-foreground" />
            <span className="text-[10px] md:text-sm text-muted-foreground whitespace-nowrap">
              A financial app for the AI age
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="text-3xl md:text-6xl lg:text-7xl text-foreground mb-6 md:mb-8 leading-tight"
          >
            <span className="font-light block md:inline">Turn your money</span>
            <br className="hidden md:block" />
            <span className="font-cormorant italic font-light text-3xl md:text-6xl lg:text-7xl block md:inline whitespace-nowrap">
              into time (yes, time)
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12"
          >
            Understand your financial runway, see what every expense really costs, and know how many years of freedom
            your money buys.
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
              <Link to="/home">
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

      {/* The Shift Section */}
      <section className="py-24 px-6 bg-muted/20">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-8 text-lg text-muted-foreground font-light leading-relaxed"
          >
            <p>
              Under the current system, life buffers exist but they are hidden. People sense them vaguely as anxiety or
              confidence, but they are not named, not visible, and therefore not consciously managed.
            </p>
            <p className="text-foreground text-xl">
              When survival is no longer conditional on work, money loses its most powerful function: coercion. What
              remains is a quieter, more precise role. Money becomes a mechanism for allocating something else.{" "}
              <span className="font-cursive italic text-2xl">Time.</span>
            </p>
            <p>
              To understand this transition, we need a new unit of wealth. Not income. Not net worth. But buffers of
              time.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Your Life Buffer OS Section */}
      <section className="py-32 px-6 bg-gradient-to-b from-background via-muted/10 to-background overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-6xl text-foreground mb-6">
              <span className="font-cormorant italic">Your</span> <span className="font-light">Life Buffer OS</span>
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto font-light leading-relaxed">
              Redefining wealth with time-based visualization, personalized projections, and temporal decision-making—so
              you can optimize with clarity, purpose, and freedom.
            </p>
          </motion.div>

          {/* App Screenshots Grid with Parallax */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
            {[
              {
                image: appHome,
                title: "Buffer",
                subtitle: "See your runway in time",
                icon: Home,
                parallaxOffset: 40,
              },
              {
                image: appPurchase,
                title: "Purchase",
                subtitle: "Price things in life hours",
                icon: Search,
                parallaxOffset: -30,
              },
              {
                image: appRisks,
                title: "Risks",
                subtitle: "Measure volatility temporally",
                icon: AlertTriangle,
                parallaxOffset: 50,
              },
              {
                image: appOptional,
                title: "Ideas",
                subtitle: "Explore what time could buy",
                icon: Sparkles,
                parallaxOffset: -20,
              },
            ].map((screen, index) => {
              const ref = useRef<HTMLDivElement>(null);
              const { scrollYProgress } = useScroll({
                target: ref,
                offset: ["start end", "end start"],
              });
              const y = useTransform(scrollYProgress, [0, 1], [screen.parallaxOffset, -screen.parallaxOffset]);

              return (
                <motion.div
                  key={index}
                  ref={ref}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.6, ease: "easeOut" }}
                  className="group relative"
                >
                  {/* Phone Frame with Parallax */}
                  <motion.div
                    style={{ y }}
                    className="relative bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl shadow-background/50 transition-all duration-500 group-hover:scale-[1.02] group-hover:shadow-primary/10"
                  >
                    {/* Top Bar */}
                    <div className="flex items-center justify-between px-3 md:px-4 py-2 md:py-3 border-b border-border/30">
                      <span className="text-[10px] md:text-xs text-muted-foreground font-light tracking-wide">
                        {screen.title.toLowerCase()}
                      </span>
                      <div className="flex items-center gap-1.5 md:gap-2">
                        <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-muted-foreground/30" />
                        <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-muted-foreground/30" />
                        <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-muted-foreground/30" />
                      </div>
                    </div>

                    {/* Screenshot */}
                    <div className="aspect-[9/16] overflow-hidden">
                      <img
                        src={screen.image}
                        alt={`${screen.title} screen`}
                        className="w-full h-full object-cover object-top"
                      />
                    </div>
                  </motion.div>

                  {/* Label */}
                  <div className="mt-4 md:mt-6 flex items-center gap-2 md:gap-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-card border border-border/50 flex items-center justify-center">
                      <screen.icon className="w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h3 className="text-sm md:text-base font-light text-foreground">{screen.title}</h3>
                      <p className="text-[10px] md:text-xs text-muted-foreground font-light">{screen.subtitle}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
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
              How It Works
            </span>
            <h2 className="text-3xl md:text-5xl font-light text-foreground mb-4">From money to time</h2>
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
              The Buffers
            </span>
            <h2 className="text-3xl md:text-5xl font-light text-foreground mb-4">Two measures of freedom</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Time is the one resource no one can print, borrow, or refinance. Every system eventually collapses into
              it.
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
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                />
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

      {/* Big Number Demo Section */}
      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-muted-foreground mb-4 text-lg">
              The consequence of not earning optional time is not death...
            </p>
            <h2 className="text-5xl md:text-7xl font-light text-foreground mb-4">it is the absence of</h2>
            <p className="text-5xl md:text-7xl font-cursive italic text-foreground">optionality</p>
            <p className="text-muted-foreground mt-8 max-w-lg mx-auto">
              People stop optimizing for income and start optimizing for life runway. Status signaling weakens when the
              cost is framed as personal life depletion.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Quote Section */}
      <section className="py-24 px-6 bg-muted/20">
        <div className="max-w-3xl mx-auto text-center">
          <motion.blockquote
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-2xl md:text-3xl font-cormorant italic font-light text-foreground leading-relaxed"
          >
            "Inequality does not vanish. But it becomes human-scaled. Instead of invisible capital structures, people
            see time differentials. Some individuals have months of buffer. Others have decades. The comparison becomes
            tangible, uncomfortable, but honest."
          </motion.blockquote>
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
            <h2 className="text-3xl md:text-4xl font-light text-foreground mb-4">Once life buffers are visible</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              People are no longer trapped by money. They are confronted by time. And time, unlike money, cannot be
              ignored for long.
            </p>
            <Button asChild size="lg" className="rounded-full text-base px-8 py-6 bg-primary hover:bg-primary/90">
              <Link to="/home">
                See Your Buffer <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border/50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-muted-foreground text-sm">© 2025 Years. Time is the only currency that matters.</div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/ubi" className="hover:text-foreground transition-colors">
              UBI
            </Link>
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
