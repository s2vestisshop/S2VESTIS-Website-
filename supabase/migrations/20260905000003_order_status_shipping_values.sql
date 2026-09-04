-- 0018 (2026-09-05) — order_status gains granular shipping states.
-- Deliberately ISOLATED in its own file with nothing else: a brand-new enum
-- value can't be referenced in the same transaction that adds it, so any
-- code using 'shipped'/'out_for_delivery'/'delivered' has to live in a
-- later migration file (see 20260905000005_functions_shipping.sql).
alter type order_status add value if not exists 'shipped';
alter type order_status add value if not exists 'out_for_delivery';
alter type order_status add value if not exists 'delivered';
