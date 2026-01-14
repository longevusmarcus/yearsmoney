import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const UBI = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Back Navigation */}
      <div className="fixed top-6 left-6 z-50">
        <Link
          to="/about"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
      </div>

      {/* Hero */}
      <section className="pt-24 pb-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-block bg-card/80 backdrop-blur-sm border border-border/50 rounded-full px-5 py-2.5 text-sm text-muted-foreground mb-6"
          >
            The Future
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-6xl font-light text-foreground mb-6"
          >
            Universal Basic Income
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-muted-foreground"
          >
            Why UBI is inevitable, and what it means for time
          </motion.p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 px-6">
        <div className="max-w-3xl mx-auto space-y-12">
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
            <h2 className="text-2xl font-light text-foreground">A New Unit of Wealth</h2>
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
                <h3 className="text-lg font-medium text-foreground mb-2">Life Buffer Zero</h3>
                <p className="text-sm text-muted-foreground font-light leading-relaxed">
                  Measures <span className="text-foreground">survival time</span>. If all income stopped today, how
                  long could you continue to live? Net worth divided by monthly costs.
                </p>
              </div>
              <div className="bg-muted/30 border border-border/50 rounded-xl p-6">
                <h3 className="text-lg font-medium text-foreground mb-2">Life Buffer One</h3>
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
            <h2 className="text-2xl font-light text-foreground">UBI Changes Everything</h2>
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
            <h2 className="text-2xl font-light text-foreground">The Economy of Optional Life</h2>
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
            <h2 className="text-2xl font-light text-foreground">Priced in Future Life</h2>
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
            <h2 className="text-2xl font-light text-foreground">Optional Labor</h2>
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
            <h2 className="text-2xl font-light text-foreground">Not Dystopia</h2>
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
            <h2 className="text-2xl font-light text-foreground">What Changes Most</h2>
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
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border/50 mt-12">
        <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
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

export default UBI;
