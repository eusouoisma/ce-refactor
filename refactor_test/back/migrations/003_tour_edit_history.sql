CREATE TABLE IF NOT EXISTS "tourEditHistory" (
  "id"         SERIAL PRIMARY KEY,
  "tourId"     INTEGER NOT NULL REFERENCES "tour"("id"),
  "type"       TEXT NOT NULL DEFAULT 'office',
  "fieldName"  TEXT NOT NULL DEFAULT '',
  "fieldLabel" TEXT NOT NULL DEFAULT '',
  "oldValue"   TEXT NOT NULL DEFAULT '',
  "newValue"   TEXT NOT NULL DEFAULT '',
  "editedBy"   TEXT NOT NULL DEFAULT '',
  "editedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_tour_edit_history_tour_id" ON "tourEditHistory"("tourId");
