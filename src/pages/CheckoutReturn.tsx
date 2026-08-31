import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, AlertCircle } from "lucide-react";
import MobileOnly from "@/components/MobileOnly";
import { useI18n } from "@/i18n/I18nProvider";
import { useSubscription } from "@/hooks/useSubscription";

const CheckoutReturn = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { t } = useI18n();
  const { refresh } = useSubscription();

  // The webhook writes access asynchronously; poll briefly so the app
  // reflects the purchase without a manual reload.
  useEffect(() => {
    if (!sessionId) return;
    let attempts = 0;
    const id = window.setInterval(() => {
      attempts += 1;
      refresh();
      if (attempts >= 5) window.clearInterval(id);
    }, 2000);
    return () => window.clearInterval(id);
  }, [sessionId, refresh]);

  return (
    <MobileOnly>
      <div className="flex min-h-screen flex-col items-center justify-center px-8 text-center">
        {sessionId ? (
          <>
            <CheckCircle2 className="mb-6 h-12 w-12 text-foreground" strokeWidth={1.2} />
            <h1 className="font-cursive text-3xl italic text-foreground">
              {t("app.checkout.successTitle")}
            </h1>
            <p className="mt-3 text-sm font-light text-muted-foreground">
              {t("app.checkout.successBody")}
            </p>
          </>
        ) : (
          <>
            <AlertCircle className="mb-6 h-12 w-12 text-muted-foreground" strokeWidth={1.2} />
            <h1 className="font-cursive text-3xl italic text-foreground">
              {t("app.checkout.missingTitle")}
            </h1>
            <p className="mt-3 text-sm font-light text-muted-foreground">
              {t("app.checkout.missingBody")}
            </p>
          </>
        )}
        <Link
          to="/home"
          className="mt-8 rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background"
        >
          {t("app.checkout.backToApp")}
        </Link>
      </div>
    </MobileOnly>
  );
};

export default CheckoutReturn;
