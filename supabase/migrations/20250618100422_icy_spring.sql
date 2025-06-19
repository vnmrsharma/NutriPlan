/*
  # Complete NutriPlan Database Schema

  1. New Tables
    - `user_profiles` - Complete user profile information
    - `diet_plans` - AI-generated diet plans
    - `meals` - Individual meals within diet plans
    - `recipes` - Recipe database with instructions
    - `progress_entries` - User progress tracking
    - `user_preferences` - Dietary preferences and restrictions
    - `meal_logs` - Daily meal consumption tracking

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data
*/

-- User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  age integer,
  gender text CHECK (gender IN ('male', 'female', 'other')),
  height integer, -- in cm
  weight numeric(5,2), -- current weight in kg
  target_weight numeric(5,2), -- target weight in kg
  activity_level text CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  goal text CHECK (goal IN ('weight_loss', 'muscle_gain', 'maintenance', 'health')),
  medical_conditions text[],
  allergies text[],
  medications text[],
  sleep_hours integer DEFAULT 8,
  stress_level text CHECK (stress_level IN ('low', 'moderate', 'high')),
  timeline_weeks integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- User Preferences Table
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  diet_type text CHECK (diet_type IN ('vegetarian', 'vegan', 'non_vegetarian', 'pescatarian', 'keto', 'paleo')),
  cuisine_preferences text[],
  taste_preferences text[],
  food_restrictions text[],
  meals_per_day integer DEFAULT 3,
  preferred_meal_times jsonb,
  water_goal integer DEFAULT 8,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Diet Plans Table
CREATE TABLE IF NOT EXISTS diet_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  total_calories integer,
  duration_weeks integer,
  start_date date,
  end_date date,
  status text CHECK (status IN ('active', 'completed', 'paused')) DEFAULT 'active',
  ai_generated boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Recipes Table
CREATE TABLE IF NOT EXISTS recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  cuisine_type text,
  diet_type text,
  prep_time integer, -- in minutes
  cook_time integer, -- in minutes
  servings integer,
  difficulty text CHECK (difficulty IN ('easy', 'medium', 'hard')),
  calories_per_serving integer,
  protein_per_serving numeric(5,2),
  carbs_per_serving numeric(5,2),
  fat_per_serving numeric(5,2),
  ingredients jsonb,
  instructions jsonb,
  tags text[],
  image_url text,
  created_at timestamptz DEFAULT now()
);

-- Meals Table
CREATE TABLE IF NOT EXISTS meals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  diet_plan_id uuid REFERENCES diet_plans(id) ON DELETE CASCADE,
  recipe_id uuid REFERENCES recipes(id),
  day_number integer,
  meal_type text CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  meal_time time,
  portion_size numeric(5,2) DEFAULT 1.0,
  calories integer,
  protein numeric(5,2),
  carbs numeric(5,2),
  fat numeric(5,2),
  created_at timestamptz DEFAULT now()
);

-- Progress Entries Table
CREATE TABLE IF NOT EXISTS progress_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  date date DEFAULT CURRENT_DATE,
  weight numeric(5,2),
  body_fat_percentage numeric(4,2),
  muscle_mass numeric(5,2),
  notes text,
  photo_url text,
  created_at timestamptz DEFAULT now()
);

-- Meal Logs Table
CREATE TABLE IF NOT EXISTS meal_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  meal_id uuid REFERENCES meals(id),
  date date DEFAULT CURRENT_DATE,
  consumed boolean DEFAULT false,
  portion_consumed numeric(3,2) DEFAULT 1.0,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Water Intake Table
CREATE TABLE IF NOT EXISTS water_intake (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  date date DEFAULT CURRENT_DATE,
  glasses_consumed integer DEFAULT 0,
  goal_glasses integer DEFAULT 8,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE diet_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_intake ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for user_preferences
CREATE POLICY "Users can read own preferences"
  ON user_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for diet_plans
CREATE POLICY "Users can read own diet plans"
  ON diet_plans
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own diet plans"
  ON diet_plans
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own diet plans"
  ON diet_plans
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for recipes (public read)
CREATE POLICY "Anyone can read recipes"
  ON recipes
  FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for meals
CREATE POLICY "Users can read meals from their diet plans"
  ON meals
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM diet_plans 
      WHERE diet_plans.id = meals.diet_plan_id 
      AND diet_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert meals to their diet plans"
  ON meals
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM diet_plans 
      WHERE diet_plans.id = meals.diet_plan_id 
      AND diet_plans.user_id = auth.uid()
    )
  );

-- RLS Policies for progress_entries
CREATE POLICY "Users can read own progress"
  ON progress_entries
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON progress_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON progress_entries
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for meal_logs
CREATE POLICY "Users can read own meal logs"
  ON meal_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meal logs"
  ON meal_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal logs"
  ON meal_logs
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for water_intake
CREATE POLICY "Users can read own water intake"
  ON water_intake
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own water intake"
  ON water_intake
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own water intake"
  ON water_intake
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Insert some sample recipes
INSERT INTO recipes (name, description, cuisine_type, diet_type, prep_time, cook_time, servings, difficulty, calories_per_serving, protein_per_serving, carbs_per_serving, fat_per_serving, ingredients, instructions, tags, image_url) VALUES
('Mediterranean Quinoa Bowl', 'A healthy bowl packed with quinoa, fresh vegetables, and Mediterranean flavors.', 'mediterranean', 'vegetarian', 15, 20, 4, 'easy', 420, 18, 52, 12, 
'[{"name": "quinoa", "amount": "1 cup", "unit": "cup"}, {"name": "cherry tomatoes", "amount": "200", "unit": "g"}, {"name": "cucumber", "amount": "1", "unit": "medium"}, {"name": "red onion", "amount": "1/4", "unit": "cup"}, {"name": "feta cheese", "amount": "100", "unit": "g"}, {"name": "olives", "amount": "1/4", "unit": "cup"}, {"name": "olive oil", "amount": "2", "unit": "tbsp"}, {"name": "lemon", "amount": "1", "unit": "medium"}]',
'[{"step": 1, "instruction": "Rinse quinoa and cook according to package instructions"}, {"step": 2, "instruction": "Dice tomatoes, cucumber, and red onion"}, {"step": 3, "instruction": "Combine cooked quinoa with vegetables"}, {"step": 4, "instruction": "Add crumbled feta and olives"}, {"step": 5, "instruction": "Dress with olive oil and lemon juice"}]',
'{"vegetarian", "gluten-free", "mediterranean"}', 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg'),

('Grilled Salmon with Asparagus', 'Perfectly grilled salmon with a side of roasted asparagus and lemon butter.', 'american', 'non_vegetarian', 10, 15, 2, 'medium', 380, 35, 8, 22,
'[{"name": "salmon fillet", "amount": "300", "unit": "g"}, {"name": "asparagus", "amount": "200", "unit": "g"}, {"name": "lemon", "amount": "1", "unit": "medium"}, {"name": "butter", "amount": "2", "unit": "tbsp"}, {"name": "garlic", "amount": "2", "unit": "cloves"}, {"name": "herbs", "amount": "1", "unit": "tbsp"}]',
'[{"step": 1, "instruction": "Preheat grill to medium-high heat"}, {"step": 2, "instruction": "Season salmon with salt and pepper"}, {"step": 3, "instruction": "Grill salmon for 4-5 minutes per side"}, {"step": 4, "instruction": "Roast asparagus with garlic and herbs"}, {"step": 5, "instruction": "Serve with lemon butter sauce"}]',
'{"keto", "low-carb", "high-protein"}', 'https://images.pexels.com/photos/1516415/pexels-photo-1516415.jpeg'),

('Avocado Toast with Poached Egg', 'Creamy avocado on toasted sourdough topped with a perfectly poached egg.', 'american', 'vegetarian', 10, 5, 1, 'easy', 320, 15, 25, 18,
'[{"name": "sourdough bread", "amount": "2", "unit": "slices"}, {"name": "avocado", "amount": "1", "unit": "medium"}, {"name": "egg", "amount": "1", "unit": "large"}, {"name": "lime", "amount": "1/2", "unit": "medium"}, {"name": "salt", "amount": "1/4", "unit": "tsp"}, {"name": "pepper", "amount": "1/4", "unit": "tsp"}, {"name": "chili flakes", "amount": "1/4", "unit": "tsp"}]',
'[{"step": 1, "instruction": "Toast bread slices until golden"}, {"step": 2, "instruction": "Mash avocado with lime, salt, and pepper"}, {"step": 3, "instruction": "Poach egg in simmering water"}, {"step": 4, "instruction": "Spread avocado on toast"}, {"step": 5, "instruction": "Top with poached egg and chili flakes"}]',
'{"vegetarian", "healthy", "breakfast"}', 'https://images.pexels.com/photos/1351238/pexels-photo-1351238.jpeg');