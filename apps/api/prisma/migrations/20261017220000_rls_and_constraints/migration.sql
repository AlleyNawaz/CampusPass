-- The application inherits this NOLOGIN role. Production must connect through a
-- separate LOGIN role that is only a member of campuspass_app.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'campuspass_app') THEN
    CREATE ROLE campuspass_app NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
  END IF;
END
$$;

REVOKE CREATE ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO campuspass_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO campuspass_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO campuspass_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO campuspass_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO campuspass_app;

CREATE SCHEMA IF NOT EXISTS app_security;
REVOKE ALL ON SCHEMA app_security FROM PUBLIC;
GRANT USAGE ON SCHEMA app_security TO campuspass_app;

CREATE OR REPLACE FUNCTION app_security.current_tenant_id()
RETURNS UUID
LANGUAGE sql
STABLE
SET search_path = pg_catalog
AS $$
  SELECT NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
$$;

REVOKE ALL ON FUNCTION app_security.current_tenant_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_security.current_tenant_id() TO campuspass_app;

DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'campuses', 'societies', 'venues', 'venue_gates', 'events',
    'ticket_types', 'ticket_inventory', 'orders', 'order_items', 'tickets',
    'ticket_credentials', 'event_staff', 'scan_sessions', 'admissions',
    'scan_attempts', 'idempotency_keys'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', table_name);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I USING (university_id = app_security.current_tenant_id()) WITH CHECK (university_id = app_security.current_tenant_id())',
      table_name
    );
  END LOOP;
END
$$;

ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON audit_events
  USING (university_id = app_security.current_tenant_id())
  WITH CHECK (university_id = app_security.current_tenant_id());

ALTER TABLE outbox_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE outbox_events FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON outbox_events
  USING (university_id = app_security.current_tenant_id())
  WITH CHECK (university_id = app_security.current_tenant_id());

-- Anonymous catalog reads are intentionally limited to published public events
-- and the minimum related society/ticket-type rows required by that endpoint.
CREATE POLICY public_events_read ON events FOR SELECT
  USING (status = 'PUBLISHED' AND visibility = 'PUBLIC');
CREATE POLICY public_event_societies_read ON societies FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM events
    WHERE events.society_id = societies.id
      AND events.status = 'PUBLISHED'
      AND events.visibility = 'PUBLIC'
  ));
CREATE POLICY public_event_ticket_types_read ON ticket_types FOR SELECT
  USING (active AND EXISTS (
    SELECT 1 FROM events
    WHERE events.id = ticket_types.event_id
      AND events.status = 'PUBLISHED'
      AND events.visibility = 'PUBLIC'
  ));

ALTER TABLE events ADD CONSTRAINT events_time_order_check CHECK (ends_at > starts_at);
ALTER TABLE events ADD CONSTRAINT events_capacity_positive_check CHECK (capacity > 0);
ALTER TABLE venues ADD CONSTRAINT venues_capacity_positive_check CHECK (capacity > 0);
ALTER TABLE ticket_types ADD CONSTRAINT ticket_types_price_nonnegative_check CHECK (price_minor >= 0);
ALTER TABLE ticket_types ADD CONSTRAINT ticket_types_limit_positive_check CHECK (per_user_limit > 0);
ALTER TABLE ticket_types ADD CONSTRAINT ticket_types_sales_order_check CHECK (sales_end > sales_start);
ALTER TABLE ticket_inventory ADD CONSTRAINT ticket_inventory_counts_check
  CHECK (capacity >= 0 AND reserved >= 0 AND issued >= 0 AND reserved + issued <= capacity);
ALTER TABLE order_items ADD CONSTRAINT order_items_amounts_check
  CHECK (quantity > 0 AND unit_price_minor >= 0 AND fee_minor >= 0 AND tax_minor >= 0);
ALTER TABLE orders ADD CONSTRAINT orders_amounts_check
  CHECK (subtotal_minor >= 0 AND fee_minor >= 0 AND tax_minor >= 0 AND total_minor >= 0);
