/*
  # Add UPDATE policy for recipes table

  1. Security
    - Add policy for authenticated users to update recipes
    - This allows the recipe detail enhancement feature to work properly
*/

-- Add UPDATE policy for recipes table
CREATE POLICY "Authenticated users can update recipes"
  ON recipes
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);