/*
  # Fix Diet Plan Deletion Issues

  1. Problem Analysis
    - Foreign key constraint prevents diet plan deletion
    - meal_logs table references meals table
    - meals table references diet_plans table
    - Missing CASCADE delete behavior

  2. Solution
    - Add CASCADE delete behavior to meal_logs foreign key
    - This will automatically delete meal logs when meals are deleted
    - Meals already have CASCADE delete when diet plans are deleted

  3. Changes
    - Drop existing foreign key constraint on meal_logs
    - Recreate with ON DELETE CASCADE
*/

-- Drop the existing foreign key constraint on meal_logs
ALTER TABLE meal_logs DROP CONSTRAINT IF EXISTS meal_logs_meal_id_fkey;

-- Recreate the foreign key constraint with CASCADE delete
ALTER TABLE meal_logs ADD CONSTRAINT meal_logs_meal_id_fkey 
  FOREIGN KEY (meal_id) REFERENCES meals(id) ON DELETE CASCADE;

-- Verify the constraint exists and has CASCADE behavior
-- This will ensure that when a meal is deleted, all related meal logs are also deleted
-- And when a diet plan is deleted, all related meals (and their logs) are deleted