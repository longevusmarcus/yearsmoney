import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useI18n } from "@/i18n/I18nProvider";

const NotFound = () => {
  const location = useLocation();
  const { t } = useI18n();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-transparent">
      <div className="text-center">
        <h1 className="mb-4 font-display text-5xl">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">{t("app.notFound.title")}</p>
        <a href="/" className="text-sm text-foreground underline hover:no-underline">
          {t("app.notFound.back")}
        </a>
      </div>
    </div>
  );
};

export default NotFound;
