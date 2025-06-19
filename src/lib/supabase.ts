import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'demo-url'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'demo-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database Types
export interface UserProfile {
  id: string
  user_id: string
  age: number
  gender: 'male' | 'female' | 'other'
  height: number
  weight: number
  target_weight: number
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
  goal: 'weight_loss' | 'muscle_gain' | 'maintenance' | 'health'
  medical_conditions: string[]
  allergies: string[]
  medications: string[]
  sleep_hours: number
  stress_level: 'low' | 'moderate' | 'high'
  timeline_weeks: number
  created_at: string
  updated_at: string
}

export interface UserPreferences {
  id: string
  user_id: string
  diet_type: 'vegetarian' | 'vegan' | 'non_vegetarian' | 'pescatarian' | 'keto' | 'paleo'
  cuisine_preferences: string[]
  taste_preferences: string[]
  food_restrictions: string[]
  meals_per_day: number
  preferred_meal_times: Record<string, string>
  water_goal: number
  created_at: string
  updated_at: string
}

export interface DietPlan {
  id: string
  user_id: string
  name: string
  description: string
  total_calories: number
  duration_weeks: number
  start_date: string
  end_date: string
  status: 'active' | 'completed' | 'paused'
  ai_generated: boolean
  created_at: string
  updated_at: string
}

export interface Recipe {
  id: string
  name: string
  description: string
  cuisine_type: string
  diet_type: string
  prep_time: number
  cook_time: number
  servings: number
  difficulty: 'easy' | 'medium' | 'hard'
  calories_per_serving: number
  protein_per_serving: number
  carbs_per_serving: number
  fat_per_serving: number
  ingredients: Array<{
    name: string
    amount: string
    unit: string
  }>
  instructions: Array<{
    step: number
    instruction: string
  }>
  tags: string[]
  image_url: string
  created_at: string
  // Extended fields for detailed recipes
  detailed_instructions?: Array<{
    step: number
    instruction: string
    tips?: string
    time_estimate?: number
  }>
  nutritional_benefits?: string[]
  cooking_tips?: string[]
  storage_instructions?: string
  variations?: string[]
  personalized_benefits?: string[]
  health_score?: number
}

export interface Meal {
  id: string
  diet_plan_id: string
  recipe_id: string
  day_number: number
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  meal_time: string
  portion_size: number
  calories: number
  protein: number
  carbs: number
  fat: number
  created_at: string
  recipe?: Recipe
}

export interface ProgressEntry {
  id: string
  user_id: string
  date: string
  weight: number
  body_fat_percentage?: number
  muscle_mass?: number
  notes?: string
  photo_url?: string
  created_at: string
}

export interface MealLog {
  id: string
  user_id: string
  meal_id: string
  date: string
  consumed: boolean
  portion_consumed: number
  notes?: string
  created_at: string
  meal?: Meal
}

export interface WaterIntake {
  id: string
  user_id: string
  date: string
  glasses_consumed: number
  goal_glasses: number
  created_at: string
}

// API Functions
export const profileAPI = {
  async getProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    
    if (error) throw error
    return data
  },

  async createProfile(profile: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert(profile)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}

export const preferencesAPI = {
  async getPreferences(userId: string): Promise<UserPreferences | null> {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    
    if (error) throw error
    return data
  },

  async createPreferences(preferences: Omit<UserPreferences, 'id' | 'created_at' | 'updated_at'>): Promise<UserPreferences> {
    const { data, error } = await supabase
      .from('user_preferences')
      .insert(preferences)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updatePreferences(userId: string, updates: Partial<UserPreferences>): Promise<UserPreferences> {
    const { data, error } = await supabase
      .from('user_preferences')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}

export const dietPlanAPI = {
  async getUserDietPlans(userId: string): Promise<DietPlan[]> {
    console.log('Fetching diet plans for user:', userId)
    
    const { data, error } = await supabase
      .from('diet_plans')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching diet plans:', error)
      throw error
    }
    
    console.log('Diet plans fetched:', data?.length || 0)
    return data || []
  },

  async createDietPlan(plan: Omit<DietPlan, 'id' | 'created_at' | 'updated_at'>): Promise<DietPlan> {
    // First, set all existing plans to inactive if creating an active plan
    if (plan.status === 'active') {
      await supabase
        .from('diet_plans')
        .update({ status: 'paused', updated_at: new Date().toISOString() })
        .eq('user_id', plan.user_id)
        .eq('status', 'active')
    }

    const { data, error } = await supabase
      .from('diet_plans')
      .insert(plan)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updateDietPlanStatus(planId: string, userId: string, status: 'active' | 'paused' | 'completed'): Promise<DietPlan> {
    // If setting to active, first deactivate all other plans
    if (status === 'active') {
      await supabase
        .from('diet_plans')
        .update({ status: 'paused', updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('status', 'active')
        .neq('id', planId)
    }

    const { data, error } = await supabase
      .from('diet_plans')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', planId)
      .eq('user_id', userId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async deleteDietPlan(planId: string, userId: string): Promise<void> {
    console.log('=== STARTING DIET PLAN DELETION ===')
    console.log('Plan ID:', planId)
    console.log('User ID:', userId)
    
    try {
      // Step 1: Verify the plan exists and belongs to the user
      console.log('Step 1: Verifying plan exists...')
      const { data: existingPlan, error: fetchError } = await supabase
        .from('diet_plans')
        .select('id, name, user_id')
        .eq('id', planId)
        .eq('user_id', userId)
        .single()
      
      if (fetchError) {
        console.error('Error fetching plan for verification:', fetchError)
        throw new Error(`Plan not found or access denied: ${fetchError.message}`)
      }
      
      if (!existingPlan) {
        console.error('Plan not found or does not belong to user')
        throw new Error('Diet plan not found or you do not have permission to delete it')
      }
      
      console.log('Plan verified:', existingPlan.name)
      
      // Step 2: Get count of related records before deletion
      console.log('Step 2: Checking related records...')
      
      const { data: meals, error: mealsError } = await supabase
        .from('meals')
        .select('id')
        .eq('diet_plan_id', planId)
      
      if (mealsError) {
        console.warn('Error checking meals:', mealsError)
      } else {
        console.log('Found meals to be deleted:', meals?.length || 0)
      }
      
      // Step 3: Delete the diet plan with improved error handling
      console.log('Step 3: Deleting diet plan...')
      const { data: deletedData, error: deleteError, count } = await supabase
        .from('diet_plans')
        .delete({ count: 'exact' })
        .eq('id', planId)
        .eq('user_id', userId)
        .select()
      
      console.log('Delete operation result:', {
        error: deleteError,
        deletedCount: count,
        deletedData: deletedData
      })
      
      if (deleteError) {
        console.error('Error during deletion:', deleteError)
        throw new Error(`Failed to delete diet plan: ${deleteError.message}`)
      }
      
      // Check if any rows were actually deleted
      if (count === 0) {
        console.error('No rows were deleted - this indicates an RLS policy issue')
        throw new Error('Failed to delete diet plan: No rows were affected. This may be due to insufficient permissions or Row Level Security policies.')
      }
      
      console.log('Diet plan deleted successfully from database')
      
      // Step 4: Verify deletion was successful (optional verification)
      console.log('Step 4: Verifying deletion...')
      const { data: verifyPlan, error: verifyError } = await supabase
        .from('diet_plans')
        .select('id')
        .eq('id', planId)
        .maybeSingle()
      
      if (verifyError) {
        console.warn('Error during verification (this is not critical):', verifyError)
      } else if (verifyPlan) {
        console.error('Plan still exists after deletion attempt!')
        throw new Error('Diet plan deletion failed - plan still exists')
      } else {
        console.log('Deletion verified - plan no longer exists')
      }
      
      console.log('=== DIET PLAN DELETION COMPLETED SUCCESSFULLY ===')
      
    } catch (error) {
      console.error('=== DIET PLAN DELETION FAILED ===')
      console.error('Error details:', error)
      
      if (error instanceof Error) {
        throw error
      } else {
        throw new Error(`Failed to delete diet plan: ${String(error)}`)
      }
    }
  },

  async getDietPlanMeals(planId: string): Promise<Meal[]> {
    const { data, error } = await supabase
      .from('meals')
      .select(`
        *,
        recipe:recipes(*)
      `)
      .eq('diet_plan_id', planId)
      .order('day_number', { ascending: true })
      .order('meal_time', { ascending: true })
    
    if (error) throw error
    return data || []
  }
}

export const recipeAPI = {
  async getAllRecipes(): Promise<Recipe[]> {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async getRecipe(recipeId: string): Promise<Recipe | null> {
    console.log('Fetching recipe from database:', recipeId)
    
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('id', recipeId)
      .maybeSingle()
    
    if (error) {
      console.error('Error fetching recipe:', error)
      throw error
    }
    
    if (!data) {
      console.log('Recipe not found:', recipeId)
      return null
    }
    
    console.log('Recipe fetched successfully:', {
      id: data?.id,
      name: data?.name,
      hasDetailedInstructions: !!data?.detailed_instructions,
      hasPersonalizedBenefits: !!data?.personalized_benefits
    })
    
    return data
  },

  async getRecipesByDietType(dietType: string): Promise<Recipe[]> {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('diet_type', dietType)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async createRecipe(recipe: Omit<Recipe, 'id' | 'created_at'>): Promise<Recipe> {
    const { data, error } = await supabase
      .from('recipes')
      .insert(recipe)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updateRecipe(recipeId: string, updates: Partial<Recipe>): Promise<Recipe> {
    console.log('Updating recipe in database:', recipeId, updates)
    
    // First check if the recipe exists
    const existingRecipe = await this.getRecipe(recipeId)
    if (!existingRecipe) {
      throw new Error(`Recipe with ID ${recipeId} not found`)
    }
    
    const { data, error } = await supabase
      .from('recipes')
      .update(updates)
      .eq('id', recipeId)
      .select()
    
    if (error) {
      console.error('Error updating recipe:', error)
      throw error
    }
    
    if (!data || data.length === 0) {
      throw new Error(`Failed to update recipe with ID ${recipeId}. Recipe may not exist or you may not have permission to update it.`)
    }
    
    const updatedRecipe = data[0]
    
    console.log('Recipe updated successfully:', {
      id: updatedRecipe?.id,
      name: updatedRecipe?.name,
      hasDetailedInstructions: !!updatedRecipe?.detailed_instructions,
      hasPersonalizedBenefits: !!updatedRecipe?.personalized_benefits,
      healthScore: updatedRecipe?.health_score
    })
    
    return updatedRecipe
  }
}

export const progressAPI = {
  async getUserProgress(userId: string): Promise<ProgressEntry[]> {
    const { data, error } = await supabase
      .from('progress_entries')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async addProgressEntry(entry: Omit<ProgressEntry, 'id' | 'created_at'>): Promise<ProgressEntry> {
    const { data, error } = await supabase
      .from('progress_entries')
      .insert(entry)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}

export const mealLogAPI = {
  async getTodayMealLogs(userId: string): Promise<MealLog[]> {
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('meal_logs')
      .select(`
        *,
        meal:meals(
          *,
          recipe:recipes(*)
        )
      `)
      .eq('user_id', userId)
      .eq('date', today)
    
    if (error) throw error
    return data || []
  },

  async logMealConsumption(userId: string, mealId: string, consumed: boolean, portionConsumed: number = 1.0): Promise<MealLog> {
    const today = new Date().toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('meal_logs')
      .upsert({
        user_id: userId,
        meal_id: mealId,
        date: today,
        consumed,
        portion_consumed: portionConsumed
      })
      .select(`
        *,
        meal:meals(
          *,
          recipe:recipes(*)
        )
      `)
      .single()
    
    if (error) throw error
    return data
  },

  async getMealLogsByDateRange(userId: string, startDate: string, endDate: string): Promise<MealLog[]> {
    const { data, error } = await supabase
      .from('meal_logs')
      .select(`
        *,
        meal:meals(
          *,
          recipe:recipes(*)
        )
      `)
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false })
    
    if (error) throw error
    return data || []
  }
}

export const waterAPI = {
  async getTodayWaterIntake(userId: string): Promise<WaterIntake | null> {
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('water_intake')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle()
    
    if (error) throw error
    return data
  },

  async updateWaterIntake(userId: string, glasses: number): Promise<WaterIntake> {
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('water_intake')
      .upsert({
        user_id: userId,
        date: today,
        glasses_consumed: glasses,
        goal_glasses: 8
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}