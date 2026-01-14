import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Clock, Shield, TrendingUp, Sparkles, Hourglass, Layers, Eye } from "lucide-react";
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
              <a href="#features" className="hover:text-foreground transition-colors">
                Buffers
              </a>
              <a href="#how-it-works" className="hover:text-foreground transition-colors">
                How It Works
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
            <span className="font-light block md:inline">See your wealth</span>
            <br className="hidden md:block" />
            <span className="font-cormorant italic font-light text-3xl md:text-6xl lg:text-7xl block md:inline whitespace-nowrap">
              in units of time
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12"
          >
            Measure your real freedom: how long can you live without being forced into action? What can your time buy?
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

      {/* UBI Section */}
      <section id="ubi" className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="inline-block bg-card/80 backdrop-blur-sm border border-border/50 rounded-full px-5 py-2.5 text-sm text-muted-foreground mb-6">
              The Future
            </span>
            <h2 className="text-3xl md:text-5xl font-light text-foreground mb-4">Universal Basic Income</h2>
            <p className="text-lg text-muted-foreground">
              Why UBI is inevitable, and what it means for time
            </p>
          </motion.div>

          <div className="space-y-12">
            {/* The Transition */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <p className="text-lg text-muted-foreground font-light leading-relaxed">
                The transition to Universal Basic Income will not happen because society becomes generous. It will happen
                because the existing system becomes mathematically unstable.
              </p>
              <p className="text-lg text-muted-foreground font-light leading-relaxed">
                As automation expands and productivity decouples from human labor, the link between work and survival
                weakens. Fewer people are required to produce the same output. At the same time, the political cost of
                leaving large populations without income rises beyond what states can tolerate.
              </p>
              <p className="text-xl text-foreground font-light leading-relaxed">
                UBI emerges not as an idealistic reform, but as a stabilizer: a way to ensure social continuity when
                labor is no longer the primary distribution mechanism.
              </p>
            </motion.div>

            {/* The Deeper Shift */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-card/50 border border-border/50 rounded-2xl p-8 space-y-6"
            >
              <p className="text-lg text-muted-foreground font-light leading-relaxed">
                But once income is guaranteed, a deeper shift begins—one that is rarely discussed.
              </p>
              <p className="text-xl text-foreground leading-relaxed">
                When survival is no longer conditional on work, money loses its most powerful function:{" "}
                <span className="font-medium">coercion</span>. What remains is a quieter, more precise role.
              </p>
              <p className="text-2xl md:text-3xl font-cormorant italic text-center py-4">
                Money becomes a mechanism for allocating <span className="text-primary">Time</span>.
              </p>
            </motion.div>

            {/* Life Buffers Explained */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="space-y-6"
            >
              <h3 className="text-2xl font-light text-foreground">A New Unit of Wealth</h3>
              <p className="text-lg text-muted-foreground font-light leading-relaxed">
                To understand this transition, we need a new unit of wealth. Not income. Not net worth. But{" "}
                <span className="text-foreground">buffers of time</span>.
              </p>
              <p className="text-lg text-muted-foreground font-light leading-relaxed">
                A life buffer is a measure of how long a person can exist without being forced into action. It is not
                philosophical. It is arithmetic.
              </p>

              <div className="grid md:grid-cols-2 gap-6 mt-8">
                <div className="bg-muted/30 border border-border/50 rounded-xl p-6">
                  <h4 className="text-lg font-medium text-foreground mb-2">Life Buffer Zero</h4>
                  <p className="text-sm text-muted-foreground font-light leading-relaxed">
                    Measures <span className="text-foreground">survival time</span>. If all income stopped today, how
                    long could you continue to live? Net worth divided by monthly costs.
                  </p>
                </div>
                <div className="bg-muted/30 border border-border/50 rounded-xl p-6">
                  <h4 className="text-lg font-medium text-foreground mb-2">Life Buffer One</h4>
                  <p className="text-sm text-muted-foreground font-light leading-relaxed">
                    Measures <span className="text-foreground">optional time</span>. How much future life can you
                    accumulate beyond survival? This buffer is about choice.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* UBI Changes Everything */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="space-y-6"
            >
              <h3 className="text-2xl font-light text-foreground">UBI Changes Everything</h3>
              <p className="text-lg text-muted-foreground font-light leading-relaxed">
                By design, UBI aligns monthly income with basic living costs. Survival time becomes guaranteed. Life
                Buffer Zero becomes socially provisioned. No one is required to sell their time simply to remain alive.
              </p>
              <p className="text-xl text-foreground font-light leading-relaxed">
                This is not abundance. It is sufficiency. What disappears is <span className="italic">desperation</span>.
              </p>
              <p className="text-lg text-muted-foreground font-light leading-relaxed">
                What emerges, slowly and inevitably, is an economy of optional life.
              </p>
            </motion.div>

            {/* The Optional Economy */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-gradient-to-br from-primary/5 to-transparent border border-border/50 rounded-2xl p-8 space-y-6"
            >
              <h3 className="text-2xl font-light text-foreground">The Economy of Optional Life</h3>
              <p className="text-lg text-muted-foreground font-light leading-relaxed">
                Once survival is guaranteed, the remaining economy reorganizes itself around{" "}
                <span className="text-foreground">access rather than necessity</span>. Basic goods—food, shelter,
                healthcare, participation—sit inside the guaranteed buffer. Everything beyond that exists outside it.
              </p>
              <p className="text-lg text-muted-foreground font-light leading-relaxed">
                Larger spaces. Travel. Speed. Privacy. Premium tools. Education beyond the baseline. Experiences that
                compress or expand time. These things do not disappear in a UBI world. They become explicitly optional.
              </p>
              <p className="text-xl text-foreground font-light leading-relaxed text-center py-4">
                And optional things must be paid for—not morally, not punitively, but{" "}
                <span className="font-cormorant italic text-2xl">temporally</span>.
              </p>
            </motion.div>

            {/* Time-Based Pricing */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="space-y-6"
            >
              <h3 className="text-2xl font-light text-foreground">Priced in Future Life</h3>
              <p className="text-lg text-muted-foreground font-light leading-relaxed">
                In a time-based economy, optional goods and experiences are priced in future life. Not because they are
                frivolous, but because they consume capacity that could have been used elsewhere.
              </p>
              <p className="text-lg text-muted-foreground font-light leading-relaxed">
                A long vacation is not expensive because it is indulgent; it is expensive because it occupies time that
                could have been allocated differently. A premium device is not costly because it is unnecessary; it is
                costly because it accelerates certain outcomes while closing others.
              </p>
              <p className="text-xl text-foreground font-light leading-relaxed">
                When a person chooses an optional good, they are not punished. They are simply spending future optional
                life.
              </p>
            </motion.div>

            {/* The Return of Work */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="space-y-6"
            >
              <h3 className="text-2xl font-light text-foreground">Optional Labor</h3>
              <p className="text-lg text-muted-foreground font-light leading-relaxed">
                To access optional layers of life, a person must accumulate optional time. And optional time can only be
                accumulated by creating surplus value. Work returns, but in a different form.
              </p>
              <p className="text-xl text-foreground font-light leading-relaxed">
                No longer as survival labor, but as optional labor. People work not to live, but to expand the range of
                their future choices.
              </p>
              <p className="text-lg text-muted-foreground font-light leading-relaxed">
                If someone chooses not to create surplus, nothing breaks. They remain alive. Supported. Legitimate. They
                simply remain within the baseline. The system does not shame them. It does not compel them. It simply
                closes the optional gates.
              </p>
            </motion.div>

            {/* Critical Distinction */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-card border border-border rounded-2xl p-8 space-y-6"
            >
              <h3 className="text-2xl font-light text-foreground">Not Dystopia</h3>
              <p className="text-lg text-muted-foreground font-light leading-relaxed">
                This is the critical distinction from dystopian interpretations. No one is forced to run. No one dies
                when a counter reaches zero. The consequence of not earning optional time is not death—it is the{" "}
                <span className="text-foreground">absence of optionality</span>.
              </p>
              <p className="text-xl text-foreground font-light leading-relaxed">
                And optionality, once visible, becomes deeply motivating.
              </p>
              <p className="text-lg text-muted-foreground font-light leading-relaxed">
                Life Buffer One can grow, but it can also shrink. If a person continues to consume optional goods
                without replenishing their surplus, their buffer erodes. They do not collapse. They descend gently back
                to the baseline. The system absorbs them without punishment.
              </p>
              <p className="text-lg text-muted-foreground font-light leading-relaxed">
                Burnout, debt, and regret—pathologies of the current system—become measurable long before they become
                catastrophic.
              </p>
            </motion.div>

            {/* Behavioral Change */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="space-y-6"
            >
              <h3 className="text-2xl font-light text-foreground">What Changes Most</h3>
              <p className="text-lg text-muted-foreground font-light leading-relaxed">
                People stop optimizing for income and start optimizing for life runway. They stop asking whether
                something is affordable and start asking whether it is worth the future it consumes.
              </p>
              <p className="text-lg text-muted-foreground font-light leading-relaxed">
                Accumulation loses its abstract appeal. Hoarding becomes unintelligible. Status signaling weakens when
                the cost is framed as personal life depletion rather than symbolic value.
              </p>
              <p className="text-xl text-foreground font-light leading-relaxed">
                The system does not make people equal. It makes inequality legible.
              </p>
            </motion.div>

            {/* Closing */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-muted/30 border border-border/50 rounded-2xl p-8 text-center space-y-6"
            >
              <p className="text-lg text-muted-foreground font-light leading-relaxed">
                Most importantly, the economy becomes aligned with reality. Time is the one resource no one can print,
                borrow, or refinance. Every system eventually collapses into it.
              </p>
              <p className="text-2xl md:text-3xl font-cormorant italic text-foreground leading-relaxed">
                UBI is not the end of work. It is the end of compulsory time liquidation.
              </p>
              <p className="text-lg text-muted-foreground font-light leading-relaxed">
                What replaces it is something quieter and more demanding: responsibility for one's future self.
              </p>
            </motion.div>
          </div>
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
          <div className="text-muted-foreground text-sm">
            © 2025 Years. Time is the only currency that matters.
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
