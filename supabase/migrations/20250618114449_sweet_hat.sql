/*
  # Add detailed recipe columns

  1. Schema Changes
    - Add columns for detailed recipe information
    - Add columns for personalized benefits and health scoring
    
  2. New Columns
    - `detailed_instructions` (jsonb) - Enhanced step-by-step instructions with tips
    - `nutritional_benefits` (text[]) - Array of nutritional benefits
    - `cooking_tips` (text[]) - Array of professional cooking tips
    - `storage_instructions` (text) - How to store the recipe
    - `variations` (text[]) - Recipe variations
    - `personalized_benefits` (text[]) - User-specific benefits
    - `health_score` (integer) - Health score from 1-100
*/

-- Add new columns to recipes table for detailed information
DO $$
BEGIN
  -- Add detailed_instructions column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recipes' AND column_name = 'detailed_instructions'
  ) THEN
    ALTER TABLE recipes ADD COLUMN detailed_instructions jsonb;
  END IF;

  -- Add nutritional_benefits column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recipes' AND column_name = 'nutritional_benefits'
  ) THEN
    ALTER TABLE recipes ADD COLUMN nutritional_benefits text[];
  END IF;

  -- Add cooking_tips column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recipes' AND column_name = 'cooking_tips'
  ) THEN
    ALTER TABLE recipes ADD COLUMN cooking_tips text[];
  END IF;

  -- Add storage_instructions column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recipes' AND column_name = 'storage_instructions'
  ) THEN
    ALTER TABLE recipes ADD COLUMN storage_instructions text;
  END IF;

  -- Add variations column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recipes' AND column_name = 'variations'
  ) THEN
    ALTER TABLE recipes ADD COLUMN variations text[];
  END IF;

  -- Add personalized_benefits column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recipes' AND column_name = 'personalized_benefits'
  ) THEN
    ALTER TABLE recipes ADD COLUMN personalized_benefits text[];
  END IF;

  -- Add health_score column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recipes' AND column_name = 'health_score'
  ) THEN
    ALTER TABLE recipes ADD COLUMN health_score integer CHECK (health_score >= 1 AND health_score <= 100);
  END IF;
END $$;