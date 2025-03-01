BEGIN;

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE budget_cycles
ADD CONSTRAINT no_overlapping_cycles 
EXCLUDE USING gist (
    family_id WITH =,
    daterange(start_date, end_date, '[]') WITH &&
);

COMMIT;
