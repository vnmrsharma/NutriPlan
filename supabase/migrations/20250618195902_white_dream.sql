/*
  # Fix Diet Plan Deletion and RLS Policies

  1. Security
    - Ensure proper DELETE policy exists for diet_plans
    - Verify CASCADE behavior for related tables
    - Fix any RLS policy issues

  2. Changes
    - Add comprehensive DELETE policy for diet_plans
    - Ensure proper CASCADE relationships
    - Add debugging support for RLS
*/

-- Ensure DELETE policy exists for diet_plans
DO $$
BEGIN
  -- Drop existing DELETE policy if it exists
  DROP POLICY IF EXISTS "Users can delete own diet plans" ON diet_plans;
  
  -- Create comprehensive DELETE policy
  CREATE POLICY "Users can delete own diet plans"
    ON diet_plans
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);
    
  RAISE NOTICE 'DELETE policy for diet_plans created successfully';
END $$;

-- Verify and fix CASCADE relationships
DO $$
BEGIN
  -- Check if meal_logs foreign key has proper CASCADE
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.referential_constraints 
    WHERE constraint_name = 'meal_logs_meal_id_fkey' 
    AND delete_rule = 'CASCADE'
  ) THEN
    -- Drop and recreate with CASCADE
    ALTER TABLE meal_logs DROP CONSTRAINT IF EXISTS meal_logs_meal_id_fkey;
    ALTER TABLE meal_logs ADD CONSTRAINT meal_logs_meal_id_fkey 
      FOREIGN KEY (meal_id) REFERENCES meals(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'meal_logs foreign key updated with CASCADE';
  END IF;
  
  -- Verify meals table has CASCADE to diet_plans
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.referential_constraints 
    WHERE constraint_name = 'meals_diet_plan_id_fkey' 
    AND delete_rule = 'CASCADE'
  ) THEN
    -- Drop and recreate with CASCADE
    ALTER TABLE meals DROP CONSTRAINT IF EXISTS meals_diet_plan_id_fkey;
    ALTER TABLE meals ADD CONSTRAINT meals_diet_plan_id_fkey 
      FOREIGN KEY (diet_plan_id) REFERENCES diet_plans(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'meals foreign key updated with CASCADE';
  END IF;
END $$;

-- Add function to help debug RLS issues
CREATE OR REPLACE FUNCTION debug_diet_plan_access(plan_id uuid)
RETURNS TABLE(
  plan_exists boolean,
  user_matches boolean,
  current_user_id uuid,
  plan_user_id uuid
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    EXISTS(SELECT 1 FROM diet_plans WHERE id = plan_id) as plan_exists,
    EXISTS(SELECT 1 FROM diet_plans WHERE id = plan_id AND user_id = auth.uid()) as user_matches,
    auth.uid() as current_user_id,
    (SELECT user_id FROM diet_plans WHERE id = plan_id LIMIT 1) as plan_user_id;
END $$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION debug_diet_plan_access(uuid) TO authenticated;