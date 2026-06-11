-- ============================================================
-- TABLA: reservations
-- ============================================================
CREATE TABLE IF NOT EXISTS reservations (
  id                 UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id         UUID         NOT NULL UNIQUE REFERENCES requests(id) ON DELETE CASCADE,
  reservation_number INTEGER      NOT NULL UNIQUE,
  verification_code  TEXT         NOT NULL UNIQUE,
  qr_url             TEXT,
  approved_by        UUID         REFERENCES users(id) ON DELETE SET NULL,
  approved_by_name   TEXT,
  approved_at        TIMESTAMPTZ  DEFAULT now(),
  status             TEXT         NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled')),
  created_at         TIMESTAMPTZ  DEFAULT now()
);

-- ============================================================
-- TABLA: reservation_counter
-- Single-row table to track last used reservation number atomically
-- ============================================================
CREATE TABLE IF NOT EXISTS reservation_counter (
  id          INTEGER  PRIMARY KEY DEFAULT 1,
  last_number INTEGER  NOT NULL DEFAULT 4055,
  CONSTRAINT single_row_only CHECK (id = 1)
);

-- Seed the counter: last used = 4055, so next generated = 4056
INSERT INTO reservation_counter (id, last_number)
VALUES (1, 4055)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_reservations_request_id
  ON reservations(request_id);

CREATE INDEX IF NOT EXISTS idx_reservations_number
  ON reservations(reservation_number);

CREATE INDEX IF NOT EXISTS idx_reservations_code
  ON reservations(verification_code);

-- ============================================================
-- ROW LEVEL SECURITY (same open pattern as other tables)
-- ============================================================
ALTER TABLE reservations        ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_counter ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_reservations" ON reservations;
DROP POLICY IF EXISTS "public_insert_reservations" ON reservations;
DROP POLICY IF EXISTS "public_update_reservations" ON reservations;
DROP POLICY IF EXISTS "public_delete_reservations" ON reservations;

CREATE POLICY "public_select_reservations" ON reservations
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_insert_reservations" ON reservations
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "public_update_reservations" ON reservations
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "public_delete_reservations" ON reservations
  FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_select_counter" ON reservation_counter;
DROP POLICY IF EXISTS "public_update_counter" ON reservation_counter;

CREATE POLICY "public_select_counter" ON reservation_counter
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_update_counter" ON reservation_counter
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- FUNCIÓN RPC: get_next_reservation_number
-- Atomically increments and returns the next reservation number.
-- SECURITY DEFINER ensures the update runs even with RLS.
-- ============================================================
CREATE OR REPLACE FUNCTION get_next_reservation_number()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_num INTEGER;
BEGIN
  UPDATE reservation_counter
  SET last_number = last_number + 1
  WHERE id = 1
  RETURNING last_number INTO next_num;
  RETURN next_num;
END;
$$;
