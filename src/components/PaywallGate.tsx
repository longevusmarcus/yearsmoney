import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { Crown, Target, Timer, LineChart, Trophy } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/i18n/I18nProvider";
import { SubscriptionScreen } from "@/components/ui/subscription-screen";
import { CheckoutDialog } from "@/components/CheckoutDialog";
import { useAuthUser } from "@/hooks/useAuthUser";
import { useSubscription } from "@/hooks/useSubscription";
import { isPaymentsConfigured } from "@/lib/stripe";
import bearMascot from "@/assets/bear-mascot.png";

/** In-app screens the paywall covers. */
const GATED_ROUTES = ["/home", "/purchase", "/risks", "/leaderboard", "/settings"];

const DELAY_MS = 2000;

/** Paywall plan ids mapped to the payment catalog price ids. */
const PRICE_IDS: Record<string, string> = {
  monthly: "premium_monthly",
  yearly: "premium_yearly",
  lifetime: "premium_lifetime",
};

/**
 * Shows the premium paywall two seconds after landing on any in-app screen.
 * Skipped for MSX users launched with full access (`msx_entitled`) and for
 * users who already purchased premium. Reappears on every visit until purchase.
 */
export function PaywallGate() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { user } = useAuthUser();
  const { isPremium } = useSubscription();
  const [open, setOpen] = useState(false);
  const [checkoutPriceId, setCheckoutPriceId] = useState<string | null>(null);

  const gated = GATED_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`));

  useEffect(() => {
    if (!gated || open || checkoutPriceId) return;
    if (localStorage.getItem("msx_entitled") === "true") return;
    if (isPremium) return;

    const timer = window.setTimeout(() => {
      setOpen(true);
    }, DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [gated, open, checkoutPriceId, isPremium]);

  if (!gated) return null;

  const features = [
    { icon: <Crown className="h-4 w-4" strokeWidth={1.6} />, text: t("app.paywall.feature1") },
    { icon: <Target className="h-4 w-4" strokeWidth={1.6} />, text: t("app.paywall.feature2") },
    { icon: <Timer className="h-4 w-4" strokeWidth={1.6} />, text: t("app.paywall.feature3") },
    { icon: <LineChart className="h-4 w-4" strokeWidth={1.6} />, text: t("app.paywall.feature4") },
    { icon: <Trophy className="h-4 w-4" strokeWidth={1.6} />, text: t("app.paywall.feature5") },
  ];

  const pricingOptions = [
    { id: "monthly", price: "$3.99", period: `${t("app.paywall.monthly")} · /mo` },
    { id: "yearly", price: "$39", period: t("app.paywall.yearly"), badge: t("app.paywall.badgeYearly") },
    { id: "lifetime", price: "$49", period: t("app.paywall.lifetime"), badge: t("app.paywall.badgeLifetime") },
  ];

  const handleSubscribe = (planId?: string) => {
    const priceId = PRICE_IDS[planId ?? "yearly"] ?? PRICE_IDS.yearly;

    if (!isPaymentsConfigured()) {
      toast(t("app.paywall.errorTitle"), { description: t("app.paywall.errorBody") });
      return;
    }
    if (!user) {
      setOpen(false);
      toast(t("app.paywall.signInTitle"), { description: t("app.paywall.signInBody") });
      navigate("/auth");
      return;
    }

    setOpen(false);
    setCheckoutPriceId(priceId);
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <SubscriptionScreen
            headerImageSrc={bearMascot}
            appName={t("app.paywall.appName")}
            planType={t("app.paywall.planType")}
            title={t("app.paywall.title")}
            features={features}
            pricingOptions={pricingOptions}
            defaultPlanId="yearly"
            subscribeButtonText={t("app.paywall.subscribe")}
            footerText={t("app.paywall.footer")}
            closeLabel={t("app.paywall.close")}
            onClose={() => setOpen(false)}
            onSubscribe={handleSubscribe}
          />
        )}
      </AnimatePresence>

      {checkoutPriceId && (
        <CheckoutDialog
          priceId={checkoutPriceId}
          userId={user?.id}
          customerEmail={user?.email ?? undefined}
          closeLabel={t("app.paywall.close")}
          onClose={() => setCheckoutPriceId(null)}
        />
      )}
    </>
  );
}

export default PaywallGate;
