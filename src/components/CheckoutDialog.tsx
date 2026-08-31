import { X } from "lucide-react";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";

interface CheckoutDialogProps {
  priceId: string;
  customerEmail?: string;
  userId?: string;
  onClose: () => void;
  closeLabel?: string;
}

/**
 * Full-screen glass overlay hosting the embedded payment form. Kept separate
 * from the paywall so checkout can be reused from other surfaces later.
 */
export function CheckoutDialog({
  priceId,
  customerEmail,
  userId,
  onClose,
  closeLabel = "Close",
}: CheckoutDialogProps) {
  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-background/95 backdrop-blur-xl">
      <PaymentTestModeBanner />
      <div className="mx-auto w-full max-w-[560px] px-4 pb-16 pt-4">
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted/50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="rounded-2xl bg-card p-2">
          <StripeEmbeddedCheckout
            priceId={priceId}
            customerEmail={customerEmail}
            userId={userId}
            returnUrl={`${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`}
          />
        </div>
      </div>
    </div>
  );
}

export default CheckoutDialog;
