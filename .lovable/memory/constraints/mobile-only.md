---
name: Desktop access allowed
description: The old mobile-only desktop blocker was removed; app works on desktop and mobile
type: constraint
---
The desktop blocker page was removed (Aug 2026). `src/components/MobileOnly.tsx` is now a
passthrough that centers the phone-width app column on wide screens. Do not re-add a
desktop blocker or QR-code "open on your phone" screen.
