import { useEffect, useState } from "react";
import { Smartphone } from "lucide-react";
import haraQr from "@/assets/hara-qr.png";

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
        <div className="max-w-md text-center">
          {/* Purple glowing bubble */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 opacity-80 blur-sm absolute inset-0" />
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-300 via-purple-400 to-purple-500 relative flex items-center justify-center shadow-[0_0_60px_20px_rgba(168,85,247,0.4)]">
                <div className="w-2 h-2 bg-white/40 rounded-full absolute top-8 left-10" />
                <div className="w-1 h-1 bg-white/30 rounded-full absolute top-12 right-10" />
              </div>
            </div>
          </div>
          
          <div className="backdrop-blur-xl bg-card/40 border border-border/30 rounded-[1.5rem] p-8 shadow-2xl">
            <div className="mb-6 flex justify-center">
              <div className="p-4 rounded-full bg-purple-500/10">
                <Smartphone className="w-12 h-12 text-purple-400" />
              </div>
            </div>
            
            <h1 className="text-3xl font-cursive italic text-foreground mb-4">
              Years
            </h1>
            
            <p className="text-lg text-foreground mb-3">
              Mobile experience only
            </p>
            
            <p className="text-sm text-muted-foreground font-light leading-relaxed mb-6">
              Years is designed for your mobile device. Scan the QR code below to open on your phone.
            </p>
            
            <div className="flex justify-center">
              <img 
                src={haraQr} 
                alt="Scan to open Years on mobile" 
                className="w-32 h-32 rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default MobileOnly;
