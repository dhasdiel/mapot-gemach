# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary user: the owner's mother, who runs a free tablecloth-lending gemach alone today. Mostly on her phone. Family members or helpers may join later — design for one trusted user now, but don't make sharing impossible. Standard text sizing is fine; no special accessibility requirement was identified.

## Product Purpose

Tracks a free tablecloth-lending operation: who borrowed which cloths, when they're due back, and what's in stock. It replaces memory/paper for two painful jobs: forgetting who took what, and chasing returns. Success means every cloth is accounted for and nothing goes unreturned.

## Operating Context

- Hebrew-only UI, RTL throughout.
- Used mostly on a phone, occasionally on a computer — mobile-first matters.
- Real-world ritual: people come to look at tablecloths before borrowing (tracked as "visitors" who may borrow next time).
- Loans run about a week; the Jewish calendar governs the rhythm — borrowing peaks before Shabbat and chagim, and people think in Hebrew dates ("after Sukkot"), not Gregorian ones.
- Follow-up happens over phone calls and WhatsApp — the app links out to both rather than messaging itself.

## Capabilities and Constraints

- Single shared-password gate; backend enforces auth on every query/mutation. No per-user accounts yet.
- Inventory tracked by type (size/color/quantity), not per physical cloth.
- Backend: Convex (cloud, realtime sync across devices). Frontend: React + Vite. Hosting: Vercel. MCP server exposes all operations to agents.
- Terminology is Hebrew; loan states: active, returned; people can be visitors.

## Product Principles

1. Phone-first for a non-technical user — every flow must be completable one-handed, in Hebrew.
2. Never lose track of a cloth — inventory and returns are the core job; nothing else may outrank them.
3. Meet the borrower where they are — call/WhatsApp links and Hebrew dates over in-app machinery.
4. The Jewish calendar is the calendar — chagim and Shabbat are first-class, not decorations.
