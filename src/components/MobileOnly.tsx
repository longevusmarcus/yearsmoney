/**
 * MobileOnly (legacy name) — the desktop blocker was removed: the app is now
 * available on desktop as well as phones. On wide screens the app UI (which is
 * designed around a phone-width column) is centered in a comfortable frame.
 */
const MobileOnly = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen w-full bg-background">
      <div className="mx-auto w-full max-w-[560px] lg:max-w-[600px]">{children}</div>
    </div>
  );
};

export default MobileOnly;
