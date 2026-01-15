import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Settings } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  showActions?: boolean;
  titleClassName?: string;
  children?: React.ReactNode;
}

export const PageHeader = ({
  title,
  subtitle,
  showBackButton = false,
  showActions = true,
  titleClassName = "text-2xl font-light tracking-tight",
  children,
}: PageHeaderProps) => {
  const navigate = useNavigate();

  return (
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
  );
};

export default PageHeader;
