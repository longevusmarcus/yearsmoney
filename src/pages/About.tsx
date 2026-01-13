import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Brain,
  Flame,
  Lightbulb,
  CircleCheck,
  Award,
  Heart,
  LineChart,
  Check,
  Mic,
  Sparkles,
  TrendingUp,
  Star,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRef } from "react";
import haraMascot from "@/assets/hara-mascot.png";
import screenshotHome from "@/assets/screenshot-home.png";
import screenshotTimeline from "@/assets/screenshot-timeline.png";
import screenshotInsights from "@/assets/screenshot-insights.png";
import screenshotCoach from "@/assets/screenshot-coach.png";
import showcaseIntrusive from "@/assets/showcase-intrusive.png";
import showcaseHome from "@/assets/showcase-home.png";
import showcaseScience from "@/assets/showcase-science.png";
import testimonial1 from "@/assets/testimonial-1.png";
import testimonial2 from "@/assets/testimonial-2.jpeg";
import testimonial3 from "@/assets/testimonial-3.jpeg";

// Component for manifesto text that highlights as one whole unit on scroll
const ManifestoText = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.85", "start 0.15"],
  });

  const paragraphs = [
    {
      text: "For too long, we've struggled to trust our gut when it matters most, unsure whether to follow instinct or override it, unable to tell if a signal comes from intuition, fear, conditioning, or exhaustion.",
      highlights: ["trust our gut", "intuition"],
    },
    {
      text: "Hara changes that.",
      highlights: ["Hara"],
      isAccent: true,
    },
    {
      text: "By tracking your intuition, reflecting on outcomes, and discovering patterns in your inner wisdom, Hara helps you reconnect with the quiet voice that knows what's right for you.",
      highlights: ["inner wisdom", "what's right"],
    },
    {
      text: "Hara isn't just an app, it's your journey back to trusting yourself.",
      highlights: ["trusting yourself"],
      hasCircle: "trusting yourself",
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
      icon: Mic,
      title: "Voice Check-ins",
      subtitle: "Speak your truth",
      description:
        "Record your gut feelings through simple voice notes. Capture the moment when intuition speaks to you.",
      gradient: "from-primary/20 to-primary/10",
      image: screenshotHome,
    },
    {
      icon: LineChart,
      title: "Pattern Insights",
      subtitle: "Discover your wisdom",
      description: "AI-powered analysis reveals when your gut is most accurate and what triggers your best decisions.",
      gradient: "from-secondary/20 to-secondary/10",
      image: screenshotInsights,
    },
    {
      icon: Heart,
      title: "Outcome Tracking",
      subtitle: "Learn from results",
      description: "Log what happened after you followed (or ignored) your gut. Build evidence for your inner wisdom.",
      gradient: "from-accent/20 to-accent/10",
      image: screenshotTimeline,
    },
    {
      icon: Sparkles,
      title: "AI Coach",
      subtitle: "Personalized guidance",
      description: "Get thoughtful reflections and actionable insights from your personal gut-instinct coach.",
      gradient: "from-success/20 to-success/10",
      image: screenshotCoach,
    },
  ];

  const journeySteps = [
    {
      title: "Check In",
      description: "Record what your gut is telling you about a decision or situation",
    },
    {
      title: "Honor or Ignore",
      description: "Note whether you followed your intuition or went against it",
    },
    {
      title: "Track Outcomes",
      description: "Log what actually happened to build your evidence base",
    },
    {
      title: "Discover Patterns",
      description: "Uncover when and where your gut is most reliable",
    },
    {
      title: "Trust Yourself",
      description: "Build unshakeable confidence in your inner wisdom",
    },
  ];

  const comparisonFeatures = [
    { feature: "Gut feeling tracking", hara: "check", journal: "none", meditation: "none" },
    { feature: "Outcome correlation", hara: "check", journal: "none", meditation: "none" },
    { feature: "AI pattern analysis", hara: "check", journal: "none", meditation: "partial" },
    { feature: "Voice-first experience", hara: "check", journal: "none", meditation: "partial" },
    { feature: "Intuition confidence score", hara: "check", journal: "none", meditation: "none" },
  ];

  const floatingCards = [
    {
      title: "Gut Check",
      text: "Something feels off about this job offer. Trust noted.",
      delay: 0,
      position: "left-1 md:left-4 lg:left-12 top-24 md:top-32 lg:top-36",
      icon: Heart,
      time: "2m ago",
      iconColor: "text-accent",
      iconBg: "bg-accent/20",
    },
    {
      title: "Pattern Found",
      text: "Your gut is 85% accurate on relationship decisions.",
      delay: 0.2,
      position: "right-1 md:right-4 lg:right-12 top-40 md:top-48 lg:top-52",
      icon: Lightbulb,
      time: "15m ago",
      iconColor: "text-primary",
      iconBg: "bg-primary/20",
    },
    {
      title: "Outcome Logged",
      text: "Turned down the offer. Found a better fit 2 weeks later!",
      delay: 0.4,
      position: "left-1 md:left-4 lg:left-20 bottom-24 md:bottom-32 lg:bottom-36",
      icon: CircleCheck,
      time: "1h ago",
      iconColor: "text-success",
      iconBg: "bg-success/20",
    },
    {
      title: "Streak Milestone",
      text: "7-day check-in streak! You're building a powerful habit.",
      delay: 0.6,
      position: "right-1 md:right-4 lg:right-20 bottom-40 md:bottom-48 lg:bottom-52",
      icon: Flame,
      time: "3h ago",
      iconColor: "text-destructive",
      iconBg: "bg-destructive/20",
    },
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-5xl">
        <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-full px-6 py-3 flex items-center justify-between shadow-lg shadow-background/20">
          <div className="flex items-center gap-8">
            <Link
              to="/auth"
              className="text-xl font-light tracking-wide bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent"
            >
              Hara
            </Link>
            <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#manifesto" className="hover:text-foreground transition-colors">
                Manifesto
              </a>
              <a href="#features" className="hover:text-foreground transition-colors">
                Features
              </a>
              <a href="#journey" className="hover:text-foreground transition-colors">
                Why Hara
              </a>
              <a href="#testimonials" className="hover:text-foreground transition-colors">
                Stories
              </a>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/auth"
              className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Login
            </Link>
            <Button asChild size="sm" className="rounded-full bg-primary hover:bg-primary/90">
              <Link to="/auth">
                Start Free <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
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
                      <span className="text-[7px] md:text-[10px] lg:text-xs text-muted-foreground shrink-0 hidden md:inline">
                        {card.time}
                      </span>
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
            <Brain className="h-3 w-3 md:h-4 md:w-4 text-foreground" />
            <span className="text-[10px] md:text-sm text-muted-foreground whitespace-nowrap">
              Trusted by leading entrepreneurs and top-tier professionals
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="text-3xl md:text-6xl lg:text-7xl text-foreground mb-6 md:mb-8 leading-tight"
          >
            <span className="font-light block md:inline">Build trust in your gut</span>
            <br className="hidden md:block" />
            <span className="font-cormorant italic font-light text-3xl md:text-6xl lg:text-7xl block md:inline whitespace-nowrap">
              to make faster, better decisions
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12"
          >
            Hara helps you listen to your intuition, notice the patterns shaping your life, and deeply trust the wisdom
            you already have.
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
              <Link to="/auth">
                Join 300+ Early Members <ArrowRight className="ml-2 h-5 w-5" />
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
              Manifesto
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
            className="bg-gradient-to-br from-primary/10 via-secondary/20 to-accent/10 backdrop-blur-sm border border-border/30 rounded-[2.5rem] p-8 md:p-12 lg:p-16"
          >
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl text-foreground mb-6">
                <span className="font-light">Your </span>
                <span className="italic font-light text-4xl md:text-6xl text-accent">intuition OS</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                A complete system for understanding, tracking, and trusting your gut instincts, backed by AI and your
                own evidence.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  className="group relative"
                >
                  <div className="relative bg-card/80 border border-border/40 rounded-2xl overflow-hidden hover:border-border/80 transition-all duration-500 hover:shadow-xl hover:shadow-background/30 h-full flex flex-col">
                    {/* Gradient overlay on hover */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl`}
                    />

                    {/* Image section */}
                    <div className="relative z-10 aspect-[9/16] md:max-h-64 overflow-hidden bg-muted/30 rounded-t-xl flex items-center justify-center">
                      <img
                        src={feature.image}
                        alt={feature.title}
                        className="w-full h-full object-cover object-top opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
                    </div>

                    <div className="relative z-10 p-6 flex-1">
                      {/* Icon */}
                      <div className="relative w-10 h-10 mb-4 -mt-10">
                        <div className="absolute inset-0 rounded-xl bg-card border border-border/50 shadow-lg" />
                        <div className="absolute inset-[2px] rounded-[10px] bg-card flex items-center justify-center">
                          <feature.icon
                            className="h-4 w-4 text-foreground group-hover:scale-110 transition-transform duration-300"
                            strokeWidth={1.5}
                          />
                        </div>
                      </div>

                      <h3 className="text-lg font-medium text-foreground mb-1">{feature.title}</h3>
                      <p className="text-xs text-muted-foreground mb-3 italic">{feature.subtitle}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Journey Steps */}
            <div className="text-center mb-12">
              <h3 className="text-2xl md:text-4xl text-foreground mb-4">
                <span className="font-light">The path to </span>
                <span className="italic font-light text-3xl md:text-5xl text-accent">self-trust</span>
              </h3>
              <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto">
                Build evidence-based confidence in your intuition, one check-in at a time.
              </p>
            </div>

            {/* Desktop Journey Steps - Arrow flow */}
            <div className="hidden lg:flex flex-row items-stretch gap-0">
              {journeySteps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="flex-1 relative"
                >
                  <div
                    className="relative bg-muted/40 h-full min-h-[130px] flex flex-col justify-start p-5 pr-8"
                    style={{
                      clipPath:
                        index === journeySteps.length - 1
                          ? "polygon(0 0, 100% 0, 100% 100%, 0 100%, 8% 50%)"
                          : "polygon(0 0, 92% 0, 100% 50%, 92% 100%, 0 100%, 8% 50%)",
                      marginLeft: index === 0 ? "0" : "-12px",
                    }}
                  >
                    <h4 className="text-sm font-medium text-foreground mb-2 pl-2">{step.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed pl-2">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Mobile Journey Steps - Stacked cards */}
            <div className="lg:hidden grid grid-cols-1 gap-4">
              {journeySteps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08, duration: 0.5 }}
                  className="relative"
                >
                  <div className="relative bg-card/60 border border-border/40 rounded-2xl p-5 backdrop-blur-sm">
                    <div className="absolute -top-3 -left-2 w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                      <span className="text-xs font-medium text-primary">{index + 1}</span>
                    </div>

                    {index < journeySteps.length - 1 && (
                      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 z-10">
                        <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-border/60" />
                      </div>
                    )}

                    <h4 className="text-base font-medium text-foreground mb-2 ml-4">{step.title}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed ml-4">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Showcase Images */}
            {/* Showcase Images */}
            <div className="relative mt-16">
              <div className="flex flex-col md:flex-row justify-center items-center gap-6 md:gap-4 lg:gap-6">
                {/* Left image - tilted */}
                <motion.div
                  initial={{ opacity: 0, x: -40, rotate: -8 }}
                  whileInView={{ opacity: 1, x: 0, rotate: -6 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  whileHover={{ rotate: 0, scale: 1.02, y: -8 }}
                  className="relative w-full max-w-[320px] sm:max-w-[360px] md:w-56 md:max-w-none lg:w-64 shrink-0"
                >
                  <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-background/50 border border-border/30">
                    <img
                      src={showcaseIntrusive}
                      alt="Intrusive thoughts vs gut feelings"
                      className="block w-full h-auto"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent pointer-events-none" />
                  </div>
                </motion.div>

                {/* Center image - larger, straight */}
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
                  whileHover={{ scale: 1.03, y: -10 }}
                  className="relative w-full max-w-[360px] sm:max-w-[420px] md:w-72 md:max-w-none lg:w-80 shrink-0 z-10"
                >
                  <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-background/60 border border-border/40">
                    <img src={showcaseHome} alt="Hara home screen" className="block w-full h-auto" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent pointer-events-none" />
                  </div>
                </motion.div>

                {/* Right image - tilted opposite */}
                <motion.div
                  initial={{ opacity: 0, x: 40, rotate: 8 }}
                  whileInView={{ opacity: 1, x: 0, rotate: 6 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                  whileHover={{ rotate: 0, scale: 1.02, y: -8 }}
                  className="relative w-full max-w-[320px] sm:max-w-[360px] md:w-56 md:max-w-none lg:w-64 shrink-0"
                >
                  <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-background/50 border border-border/30">
                    <img src={showcaseScience} alt="Science of intuition" className="block w-full h-auto" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent pointer-events-none" />
                  </div>
                </motion.div>
              </div>

              {/* Subtle glow behind center */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Why Hara Section */}
      <section id="journey" className="py-24 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="bg-background backdrop-blur-sm border border-border/50 rounded-3xl overflow-hidden">
              <div className="text-center pt-10 pb-6 px-6">
                <h2 className="text-3xl md:text-5xl text-foreground mb-3">
                  <span className="font-light">Hara is </span>
                  <span className="italic font-light text-4xl md:text-6xl text-accent">intuition-first</span>
                </h2>
                <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto">
                  Built to help you trust yourself, not just track habits.
                </p>
              </div>

              {/* Comparison Table */}
              <div className="grid grid-cols-4 border-t border-b border-border/50">
                <div className="p-2 md:p-6" />
                <div className="p-2 md:p-6 text-center">
                  <span className="text-xs md:text-base font-medium text-foreground">Hara</span>
                </div>
                <div className="p-2 md:p-6 text-center">
                  <span className="text-xs md:text-base font-medium text-muted-foreground leading-tight block">
                    <span className="hidden md:inline">Other Journaling Apps</span>
                    <span className="md:hidden">Other Journaling Apps</span>
                  </span>
                </div>
                <div className="p-2 md:p-6 text-center">
                  <span className="text-xs md:text-base font-medium text-muted-foreground leading-tight block">
                    <span className="hidden md:inline">Other Meditation Apps</span>
                    <span className="md:hidden">Other Meditation Apps</span>
                  </span>
                </div>
              </div>

              {comparisonFeatures.map((row, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05, duration: 0.4 }}
                  className={`grid grid-cols-4 ${index !== comparisonFeatures.length - 1 ? "border-b border-border/30" : ""}`}
                >
                  <div className="p-2 md:p-6 flex items-center">
                    <span className="text-xs md:text-base text-foreground leading-tight">{row.feature}</span>
                  </div>
                  <div className="p-2 md:p-6 flex items-center justify-center">
                    {row.hara === "check" ? (
                      <Check className="h-4 w-4 md:h-5 md:w-5 text-success" strokeWidth={2.5} />
                    ) : (
                      <span className="text-xs md:text-sm text-muted-foreground">{row.hara}</span>
                    )}
                  </div>
                  <div className="p-2 md:p-6 flex items-center justify-center">
                    {row.journal === "check" ? (
                      <Check className="h-4 w-4 md:h-5 md:w-5 text-success" strokeWidth={2.5} />
                    ) : row.journal === "partial" ? (
                      <span className="text-muted-foreground text-xs md:text-base">△</span>
                    ) : (
                      <span className="text-muted-foreground/50 text-xs md:text-base">–</span>
                    )}
                  </div>
                  <div className="p-2 md:p-6 flex items-center justify-center">
                    {row.meditation === "check" ? (
                      <Check className="h-4 w-4 md:h-5 md:w-5 text-success" strokeWidth={2.5} />
                    ) : row.meditation === "partial" ? (
                      <span className="text-muted-foreground text-xs md:text-base">△</span>
                    ) : (
                      <span className="text-muted-foreground/50 text-xs md:text-base">–</span>
                    )}
                  </div>
                </motion.div>
              ))}

              {/* Legend */}
              <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground py-6 border-t border-border/30">
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-success" strokeWidth={2.5} />
                  <span>built-in</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>△</span>
                  <span>partial</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>–</span>
                  <span>not offered</span>
                </div>
              </div>

              {/* What makes Hara different */}
              <div className="border-t border-border/30 p-8 md:p-10">
                <h4 className="text-lg md:text-xl font-medium text-foreground text-center mb-8">
                  What makes Hara different
                </h4>
                <div className="space-y-4 max-w-2xl mx-auto">
                  {[
                    "Voice-first experience—capture gut feelings in the moment, naturally",
                    "Evidence-based trust building through outcome tracking and pattern analysis",
                    "AI coach that learns your unique intuition patterns over time",
                    "Gamified progress with XP, streaks, and achievements to keep you engaged",
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + index * 0.08, duration: 0.4 }}
                      className="flex items-start gap-4"
                    >
                      <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="h-3 w-3 text-primary" strokeWidth={2.5} />
                      </div>
                      <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{item}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl text-foreground mb-6">
              <span className="font-light">Stories of </span>
              <span className="italic font-light text-4xl md:text-6xl text-accent">trust</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Real people who learned to trust their gut with Hara.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {[
              {
                quote:
                  "As a founder, I used to overthink every decision until I was paralyzed. Hara showed me my gut was right 85% of the time on hiring. Now I move fast and trust myself.",
                name: "M B",
                role: "Founder & CEO, Stealth Startup",
                image: testimonial1,
              },
              {
                quote:
                  "The pattern insights changed how I run my company. I discovered my intuition peaks in the morning—so I make all critical decisions before noon. Game changer.",
                name: "Halina S",
                role: "Founder, Seed HealthTech",
                image: testimonial2,
              },
              {
                quote:
                  "I recommend Hara to my patients dealing with decision anxiety. The data-driven approach helps them build evidence for their intuition instead of dismissing it.",
                name: "Dr. James Wright",
                role: "Clinical Psychologist",
                image: testimonial3,
              },
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="bg-secondary/30 backdrop-blur-sm border border-border/30 rounded-3xl p-8 flex flex-col"
              >
                <div className="flex gap-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-foreground/90 mb-8 flex-grow leading-relaxed">"{testimonial.quote}"</p>
                <div className="flex items-center gap-4">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover border border-border/50"
                  />
                  <div>
                    <p className="font-medium text-foreground">
                      {testimonial.name
                        .split(" ")
                        .map((n) => n[0])
                        .join(".")}
                    </p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-gradient-to-br from-primary/10 via-secondary/20 to-accent/10 backdrop-blur-sm border border-border/30 rounded-3xl p-10 md:p-14 text-center"
          >
            <h3 className="text-2xl md:text-4xl text-foreground mb-6">
              <span className="font-light">Ready to trust </span>
              <span className="italic font-light text-3xl md:text-5xl text-accent">your gut</span>
              <span className="font-light">?</span>
            </h3>

            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Start building evidence-based confidence in your intuition today.
            </p>

            <div className="flex justify-center">
              <Button
                asChild
                size="lg"
                className="rounded-full text-base px-8 py-6 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-shadow"
              >
                <Link to="/auth">
                  Begin Your Journey <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 bg-muted/20 border-t border-border/30">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            <div className="md:col-span-2">
              <div className="text-2xl font-light tracking-wide bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent mb-4">
                Hara
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mb-6">
                Learn to trust your gut and make decisions that feel right. Track your intuition, discover patterns, and
                build unshakeable confidence in yourself.
              </p>
              <Button asChild variant="outline" size="sm" className="rounded-full">
                <Link to="/auth">
                  Start Free <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>

            <div>
              <h4 className="text-sm font-medium text-foreground mb-4">Product</h4>
              <div className="flex flex-col gap-3 text-sm text-muted-foreground">
                <a href="#features" className="hover:text-foreground transition-colors">
                  Features
                </a>
                <a href="#testimonials" className="hover:text-foreground transition-colors">
                  Stories
                </a>
                <a href="#journey" className="hover:text-foreground transition-colors">
                  Why Hara
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-foreground mb-4">Legal</h4>
              <div className="flex flex-col gap-3 text-sm text-muted-foreground">
                <Link to="/terms" className="hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
                <Link to="/privacy" className="hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
                <Link to="/cookie" className="hover:text-foreground transition-colors">
                  Cookie Policy
                </Link>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-border/30 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">© 2025 Hara. All rights reserved.</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground/70">
              <span>Built for those who want to trust their gut more often</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default About;
