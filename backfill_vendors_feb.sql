-- ============================================================
-- NEW VENDORS: February 2026
-- ============================================================

INSERT INTO "Vendors" (tenant_id, name, address, tin, is_vat_registered, is_deleted, created_at, updated_at)
VALUES
((SELECT id FROM "Tenants" LIMIT 1), 'Kingson Construction Supply', 'El Nido, Palawan', '336-182-316-00000', true, false, now(), now()),
((SELECT id FROM "Tenants" LIMIT 1), 'Narra Narra Food Corp.', 'El Nido, Palawan', '649-402-043-00001', true, false, now(), now()),
((SELECT id FROM "Tenants" LIMIT 1), 'Prism Puff Pastry Corp.', 'El Nido, Palawan', '010-029-278-00000', true, false, now(), now()),
((SELECT id FROM "Tenants" LIMIT 1), 'Unity Asia Petroleum Products Inc.', 'El Nido, Palawan', '008-258-679-00003', true, false, now(), now()),
((SELECT id FROM "Tenants" LIMIT 1), 'Isla Estante', 'El Nido, Palawan', '', false, false, now(), now()),
((SELECT id FROM "Tenants" LIMIT 1), 'Welding Shop', 'El Nido, Palawan', '', false, false, now(), now()),
((SELECT id FROM "Tenants" LIMIT 1), 'William Tan Enterprises Corp.', 'Villa Libertad, El Nido', '007-793-938-00022', true, false, now(), now()),
((SELECT id FROM "Tenants" LIMIT 1), 'William Tan Enterprises Corp.', 'Bucana, El Nido', '007-793-938-00024', true, false, now(), now())
ON CONFLICT DO NOTHING;
