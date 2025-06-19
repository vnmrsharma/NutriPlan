/*
  # Add INSERT policy for recipes table

  1. Security Changes
    - Add policy to allow authenticated users to insert recipes
    - This enables the diet plan generation feature to create custom recipes
    
  2. Notes
    - The existing SELECT policy allows anyone to read recipes
    - This new policy allows authenticated users to create recipes
    - Recipes created by users can be used in their diet plans
*/

-- Add policy to allow authenticated users to insert recipes
CREATE POLICY "Authenticated users can insert recipes"
  ON recipes
  FOR INSERT
  TO authenticated
  WITH CHECK (true);