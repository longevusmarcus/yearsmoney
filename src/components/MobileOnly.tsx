import { useEffect, useState } from "react";
import { Smartphone, Hourglass } from "lucide-react";
import { motion } from "framer-motion";

const MobileOnly = ({ children }: { children: React.ReactNode }) => {
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const mobileKeywords = ['android', 'webos', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone'];
      const isMobileDevice = mobileKeywords.some(keyword => userAgent.includes(keyword));
      const isTabletOrMobile = window.innerWidth <= 1024;
      
      setIsMobile(isMobileDevice || isTabletOrMobile);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isMobile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-muted/30 via-background to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative max-w-lg text-center"
        >
          {/* Logo */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-cursive italic text-foreground tracking-wide">
              Years
            </h1>
          </motion.div>
          
          {/* Card */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="backdrop-blur-xl bg-card/60 border border-border/40 rounded-3xl p-10 shadow-2xl shadow-background/50"
          >
            {/* Icon */}
            <div className="mb-8 flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl" />
                <div className="relative p-5 rounded-2xl bg-card border border-border/50">
                  <Smartphone className="w-10 h-10 text-foreground" strokeWidth={1.5} />
                </div>
              </div>
            </div>
            
            <h2 className="text-2xl font-light text-foreground mb-3">
              Mobile Experience
            </h2>
            
            <p className="text-muted-foreground font-light leading-relaxed mb-8">
              Years is designed for mobile. Open this page on your phone to measure your wealth in time.
            </p>
            
            {/* Visual hint */}
            <div className="flex items-center justify-center gap-4 pt-6 border-t border-border/30">
              <div className="flex items-center gap-2 text-sm text-muted-foreground/70">
                <Hourglass className="w-4 h-4" />
                <span className="font-light">See your life buffer on mobile</span>
              </div>
            </div>
          </motion.div>
          
          {/* Decorative elements */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl"
          />
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
};

export default MobileOnly;
