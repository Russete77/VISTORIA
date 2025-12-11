-- Migration: Add estimated_repair_cost to photo_problems
-- Created: 2025-12-10
-- Purpose: Add cost estimation field to problems for better PDF reports

-- Add estimated_repair_cost column to photo_problems table
ALTER TABLE photo_problems
ADD COLUMN IF NOT EXISTS estimated_repair_cost NUMERIC(10, 2) DEFAULT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN photo_problems.estimated_repair_cost IS 'Estimated cost to repair this problem in BRL. Can be automatically calculated or manually set.';

-- Create index for queries that filter by cost
CREATE INDEX IF NOT EXISTS idx_photo_problems_estimated_cost
ON photo_problems(estimated_repair_cost)
WHERE estimated_repair_cost IS NOT NULL;

-- Update existing problems with estimated costs based on severity (optional initial values)
-- You can remove this if you prefer to start with NULL values
UPDATE photo_problems
SET estimated_repair_cost = CASE
    WHEN severity = 'urgent' THEN 1000.00  -- R$ 1,000 average for urgent
    WHEN severity = 'high' THEN 500.00     -- R$ 500 average for high
    WHEN severity = 'medium' THEN 200.00   -- R$ 200 average for medium
    WHEN severity = 'low' THEN 50.00       -- R$ 50 average for low
    ELSE NULL
END
WHERE estimated_repair_cost IS NULL
AND manual_cost IS NULL;  -- Don't override manual costs

-- Create helper function to calculate total repair cost for an inspection
CREATE OR REPLACE FUNCTION get_inspection_total_repair_cost(inspection_uuid UUID)
RETURNS NUMERIC AS $$
    SELECT COALESCE(SUM(
        COALESCE(pp.manual_cost, pp.estimated_repair_cost, 0) * COALESCE(pp.quantity, 1)
    ), 0)
    FROM photo_problems pp
    WHERE pp.inspection_id = inspection_uuid
    AND pp.user_dismissed = FALSE;
$$ LANGUAGE SQL STABLE;

COMMENT ON FUNCTION get_inspection_total_repair_cost IS 'Calculate total estimated repair cost for an inspection, using manual_cost if available, otherwise estimated_repair_cost';

-- Create helper view for inspection costs summary
CREATE OR REPLACE VIEW inspection_costs_summary AS
SELECT
    i.id AS inspection_id,
    i.property_id,
    i.user_id,
    COUNT(pp.id) AS total_problems,
    COUNT(CASE WHEN pp.severity = 'urgent' THEN 1 END) AS urgent_problems,
    COUNT(CASE WHEN pp.severity = 'high' THEN 1 END) AS high_problems,
    COUNT(CASE WHEN pp.severity = 'medium' THEN 1 END) AS medium_problems,
    COUNT(CASE WHEN pp.severity = 'low' THEN 1 END) AS low_problems,
    COALESCE(SUM(
        COALESCE(pp.manual_cost, pp.estimated_repair_cost, 0) * COALESCE(pp.quantity, 1)
    ), 0) AS total_estimated_cost,
    COALESCE(SUM(
        CASE WHEN pp.manual_cost IS NOT NULL
        THEN pp.manual_cost * COALESCE(pp.quantity, 1)
        ELSE 0 END
    ), 0) AS total_manual_cost,
    COALESCE(SUM(
        CASE WHEN pp.manual_cost IS NULL AND pp.estimated_repair_cost IS NOT NULL
        THEN pp.estimated_repair_cost * COALESCE(pp.quantity, 1)
        ELSE 0 END
    ), 0) AS total_auto_estimated_cost
FROM inspections i
LEFT JOIN inspection_photos ip ON ip.inspection_id = i.id AND ip.deleted_at IS NULL
LEFT JOIN photo_problems pp ON pp.photo_id = ip.id AND pp.user_dismissed = FALSE
WHERE i.deleted_at IS NULL
GROUP BY i.id, i.property_id, i.user_id;

COMMENT ON VIEW inspection_costs_summary IS 'Summary view of inspection costs and problem counts';

-- Grant permissions (adjust based on your RLS policies)
-- GRANT SELECT ON inspection_costs_summary TO authenticated;
-- GRANT EXECUTE ON FUNCTION get_inspection_total_repair_cost TO authenticated;
