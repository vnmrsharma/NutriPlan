/*
  # Add DELETE policy for diet_plans table

  1. Security Changes
    - Add RLS policy for DELETE operations on `diet_plans` table
    - Allow authenticated users to delete their own diet plans where `auth.uid() = user_id`

  This fixes the issue where diet plan deletions were silently failing due to missing DELETE permissions in Row Level Security.
*/

-- Add DELETE policy for diet_plans table
CREATE POLICY "Users can delete own diet plans"
  ON diet_plans
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);