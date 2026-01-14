import { useNavigate } from "react-router-dom";
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
    <div className="px-6 pt-6 pb-4">
      {showBackButton && (
        <button onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
      )}
      
      <div className="flex justify-between items-start">
        <div className="flex-1">
          {children || (
            <>
              <h1 className={titleClassName}>{title}</h1>
              {subtitle && (
                <p className="text-muted-foreground text-sm font-light mt-1">{subtitle}</p>
              )}
            </>
          )}
        </div>
        
        {showActions && (
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <button
              onClick={() => navigate("/settings")}
              className="p-1 hover:opacity-70 transition-opacity"
            >
              <Settings className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
