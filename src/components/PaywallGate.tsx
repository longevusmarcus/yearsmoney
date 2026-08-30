import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import { Sparkles, Target, Timer, LineChart, Trophy } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/i18n/I18nProvider";
import { SubscriptionScreen } from "@/components/ui/subscription-screen";
import bearMascot from "@/assets/bear-mascot.png";

/** In-app screens the paywall covers. */
const GATED_ROUTES = ["/home", "/purchase", "/risks", "/leaderboard", "/settings"];

const DELAY_MS = 4000;

/**
 * Shows the premium paywall four seconds after landing on any in-app screen.
 * Skipped for MSX users launched with full access (`msx_entitled`) and for
 * users who already purchased premium. Reappears on every visit until purchase.
 */
export function PaywallGate() {
  const { pathname } = useLocation();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  const gated = GATED_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`));

  useEffect(() => {
    if (!gated || open) return;
    if (localStorage.getItem("msx_entitled") === "true") return;
    if (localStorage.getItem("years_premium") === "true") return;

    const timer = window.setTimeout(() => {
      setOpen(true);
    }, DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [gated, open]);

  if (!gated) return null;

  const features = [
    { icon: <Sparkles className="h-4 w-4" strokeWidth={1.6} />, text: t("app.paywall.feature1") },
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

  return (
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
          onSubscribe={() => {
            toast(t("app.paywall.soonTitle"), { description: t("app.paywall.soonBody") });
            setOpen(false);
          }}
        />
      )}
    </AnimatePresence>
  );
}

export default PaywallGate;
