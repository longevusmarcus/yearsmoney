/** Shared editorial black ground; landing media stays scoped to its own sections. */
export function AppBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-background" />
  );
}

export default AppBackground;
