import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Settings } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import ShareableWidget from "@/components/ShareableWidget";
import bearMascot from "@/assets/bear-mascot.png";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  showActions?: boolean;
  titleClassName?: string;
  children?: React.ReactNode;
  rightAction?: React.ReactNode;
}

export const PageHeader = ({
  title,
  subtitle,
  showBackButton = false,
  showActions = true,
  titleClassName = "text-2xl font-light tracking-tight",
  children,
  rightAction,
}: PageHeaderProps) => {
  const navigate = useNavigate();
  const [showWidget, setShowWidget] = useState(false);

  // Get life buffer data from localStorage for the widget
  const monthlyExpenses = Number(localStorage.getItem("tc_expenses")) || 0;
  const netWorth = Number(localStorage.getItem("tc_networth")) || 0;
  const monthlyIncome = Number(localStorage.getItem("tc_income")) || 0;
  const monthlySavings = Math.max(0, monthlyIncome - monthlyExpenses);
  
  const lifeBufferWithoutIncome = monthlyExpenses > 0 ? netWorth / monthlyExpenses : 0;
  const monthlyBufferGain = monthlyExpenses > 0 ? monthlySavings / monthlyExpenses : 0;

  return (
    <>
      <motion.div 
        className="px-6 pt-6 pb-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {showBackButton && (
          <motion.button 
            onClick={() => navigate(-1)} 
            className="mb-4"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: 0.1 }}
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </motion.button>
        )}
        
        <div className="flex justify-between items-start">
          <motion.div 
            className="flex-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            {children || (
              <>
                <h1 className={titleClassName}>{title}</h1>
                {subtitle && (
                  <p className="text-muted-foreground text-sm font-light mt-1 whitespace-nowrap">{subtitle}</p>
                )}
              </>
            )}
          </motion.div>
          
          {showActions && (
            <motion.div 
              className="flex items-center gap-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              {rightAction}
              {lifeBufferWithoutIncome > 0 && (
                <button
                  onClick={() => setShowWidget(true)}
                  className="p-0.5 hover:opacity-70 transition-opacity"
                  aria-label="Share time wealth"
                >
                  <img src={bearMascot} alt="Share" className="w-6 h-6 object-contain" />
                </button>
              )}
              <ThemeToggle />
              <button
                onClick={() => navigate("/settings")}
                className="p-1 hover:opacity-70 transition-opacity"
              >
                <Settings className="w-4 h-4 text-muted-foreground" />
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Shareable Widget */}
      {showWidget && (
        <ShareableWidget
          lifeBuffer={lifeBufferWithoutIncome}
          monthlyGain={monthlyBufferGain}
          displayMode="years"
          onClose={() => setShowWidget(false)}
        />
      )}
    </>
  );
};

export default PageHeader;
