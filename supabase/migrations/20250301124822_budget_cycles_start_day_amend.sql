BEGIN;

-- First drop the existing constraint
ALTER TABLE family_settings
DROP CONSTRAINT family_settings_budget_cycle_start_day_check;

-- Add the new constraint
ALTER TABLE family_settings
ADD CONSTRAINT family_settings_budget_cycle_start_day_check 
CHECK (budget_cycle_start_day BETWEEN 1 AND 31);

COMMIT;
