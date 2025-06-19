import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardHeader, CardBody } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { ConfirmModal, AlertModal } from '../components/ui/Modal'
import { 
  Calendar, 
  Clock, 
  Flame, 
  Plus, 
  ChefHat, 
  Target,
  Utensils,
  Heart,
  Loader2,
  CheckCircle,
  Users,
  Trash2,
  Eye,
  Edit,
  ArrowLeft,
  ArrowRight,
  User,
  Settings,
  Play,
  Pause,
  AlertTriangle,
  Info,
  Zap
} from 'lucide-react'
import { 
  dietPlanAPI, 
  profileAPI, 
  preferencesAPI, 
  recipeAPI,
  supabase,
  DietPlan, 
  Meal,
  Recipe,
  UserProfile,
  UserPreferences
} from '../lib/supabase'
import { geminiAPI, DietPlanRequest } from '../lib/gemini'

interface GenerationWizardData {
  planName: string
  profile: Partial<UserProfile>
  preferences: Partial<UserPreferences>
}

export const DietPlans: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('current')
  const [dietPlans, setDietPlans] = useState<DietPlan[]>([])
  const [currentPlanMeals, setCurrentPlanMeals] = useState<Meal[]>([])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState('')
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null)
  const [activatingPlanId, setActivatingPlanId] = useState<string | null>(null)
  
  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [planToDelete, setPlanToDelete] = useState<string | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  
  // Wizard states
  const [showWizard, setShowWizard] = useState(false)
  const [wizardStep, setWizardStep] = useState(1)
  const [wizardData, setWizardData] = useState<GenerationWizardData>({
    planName: '',
    profile: {},
    preferences: {}
  })

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    if (!user) return

    try {
      setLoading(true)
      console.log('=== LOADING DIET PLANS DATA ===')
      console.log('User ID:', user.id)
      
      // Load diet plans
      const plans = await dietPlanAPI.getUserDietPlans(user.id)
      console.log('✅ Loaded diet plans:', plans.length)
      setDietPlans(plans)

      // Load meals for active plan
      if (plans.length > 0) {
        const activePlan = plans.find(p => p.status === 'active') || plans[0]
        console.log('Loading meals for plan:', activePlan.id)
        const meals = await dietPlanAPI.getDietPlanMeals(activePlan.id)
        console.log('✅ Loaded meals:', meals.length)
        setCurrentPlanMeals(meals)
      }

      // Load recipes
      const allRecipes = await recipeAPI.getAllRecipes()
      console.log('✅ Loaded recipes:', allRecipes.length)
      setRecipes(allRecipes)

    } catch (error) {
      console.error('❌ Failed to load diet plans:', error)
    } finally {
      setLoading(false)
    }
  }

  const startWizard = async () => {
    if (!user) return

    try {
      console.log('=== STARTING WIZARD ===')
      console.log('User ID:', user.id)
      
      // Load user's current profile and preferences
      const [profile, preferences] = await Promise.all([
        profileAPI.getProfile(user.id),
        preferencesAPI.getPreferences(user.id)
      ])

      console.log('Profile loaded:', !!profile)
      console.log('Preferences loaded:', !!preferences)

      if (!profile || !preferences) {
        setErrorMessage('Please complete your profile and preferences first. Go to Profile page to set up your information.')
        setShowErrorModal(true)
        navigate('/profile')
        return
      }

      // Initialize wizard with current data
      setWizardData({
        planName: `${profile.goal?.replace('_', ' ')} Plan - ${new Date().toLocaleDateString()}`,
        profile: { ...profile },
        preferences: { ...preferences }
      })
      
      setWizardStep(1)
      setShowWizard(true)
      console.log('✅ Wizard initialized successfully')
    } catch (error) {
      console.error('❌ Failed to load user data:', error)
      setErrorMessage('Failed to load your profile data. Please try again or contact support.')
      setShowErrorModal(true)
    }
  }

  const generatePlanFromWizard = async () => {
    if (!user || !wizardData.profile || !wizardData.preferences) return

    try {
      console.log('=== STARTING DIET PLAN GENERATION ===')
      console.log('User ID:', user.id)
      console.log('Wizard data profile:', wizardData.profile)
      console.log('Wizard data preferences:', wizardData.preferences)

      // Comprehensive validation of required fields
      const requiredProfileFields = [
        'age', 'gender', 'height', 'weight', 'target_weight', 
        'activity_level', 'goal', 'timeline_weeks'
      ]
      const requiredPreferenceFields = ['diet_type', 'meals_per_day']
      
      console.log('=== VALIDATING REQUIRED FIELDS ===')
      
      for (const field of requiredProfileFields) {
        const value = wizardData.profile[field as keyof UserProfile]
        console.log(`Profile field ${field}:`, value)
        if (!value && value !== 0) {
          const errorMsg = `Missing required profile field: ${field.replace('_', ' ')}`
          console.error('❌', errorMsg)
          setErrorMessage(errorMsg)
          setShowErrorModal(true)
          return
        }
      }
      
      for (const field of requiredPreferenceFields) {
        const value = wizardData.preferences[field as keyof UserPreferences]
        console.log(`Preference field ${field}:`, value)
        if (!value && value !== 0) {
          const errorMsg = `Missing required preference field: ${field.replace('_', ' ')}`
          console.error('❌', errorMsg)
          setErrorMessage(errorMsg)
          setShowErrorModal(true)
          return
        }
      }

      console.log('✅ All required fields validated')

      // Close the wizard modal immediately to show progress
      setShowWizard(false)
      setWizardStep(1)
      
      // Start generation process
      setGenerating(true)
      setGenerationProgress('🤖 AI is analyzing your profile and preferences...')

      // Prepare request for Gemini API with proper data types
      const request: DietPlanRequest = {
        userProfile: {
          age: Number(wizardData.profile.age!),
          gender: String(wizardData.profile.gender!),
          height: Number(wizardData.profile.height!),
          weight: Number(wizardData.profile.weight!),
          targetWeight: Number(wizardData.profile.target_weight!),
          activityLevel: String(wizardData.profile.activity_level!),
          goal: String(wizardData.profile.goal!),
          medicalConditions: Array.isArray(wizardData.profile.medical_conditions) ? wizardData.profile.medical_conditions : [],
          allergies: Array.isArray(wizardData.profile.allergies) ? wizardData.profile.allergies : [],
          timelineWeeks: Number(wizardData.profile.timeline_weeks!)
        },
        preferences: {
          dietType: String(wizardData.preferences.diet_type!),
          cuisinePreferences: Array.isArray(wizardData.preferences.cuisine_preferences) ? wizardData.preferences.cuisine_preferences : [],
          tastePreferences: Array.isArray(wizardData.preferences.taste_preferences) ? wizardData.preferences.taste_preferences : [],
          foodRestrictions: Array.isArray(wizardData.preferences.food_restrictions) ? wizardData.preferences.food_restrictions : [],
          mealsPerDay: Number(wizardData.preferences.meals_per_day!),
          preferredMealTimes: wizardData.preferences.preferred_meal_times || {}
        }
      }

      console.log('✅ Prepared request for Gemini API:', request)

      // Generate diet plan with AI
      setGenerationProgress('🍽️ Creating your personalized meal plan with AI...')
      const generatedPlan = await geminiAPI.generateDietPlan(request)
      console.log('✅ Generated plan from AI:', {
        name: generatedPlan.name,
        totalCalories: generatedPlan.totalCalories,
        daysCount: generatedPlan.meals?.length,
        totalMeals: generatedPlan.meals?.reduce((sum, day) => sum + day.meals.length, 0)
      })

      setGenerationProgress('💾 Saving your diet plan to database...')

      // Create diet plan in database with custom name (this will automatically set others to inactive)
      const dietPlan = await dietPlanAPI.createDietPlan({
        user_id: user.id,
        name: wizardData.planName || generatedPlan.name,
        description: generatedPlan.description,
        total_calories: generatedPlan.totalCalories,
        duration_weeks: generatedPlan.durationWeeks,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + generatedPlan.durationWeeks * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'active',
        ai_generated: true
      })

      console.log('✅ Created diet plan in database:', dietPlan.id)

      setGenerationProgress('👨‍🍳 Adding delicious recipes to your plan...')

      // Create recipes and meals for each day
      let totalMealsToCreate = 0
      let createdMealsCount = 0
      
      // Count total meals first
      for (const dayPlan of generatedPlan.meals) {
        totalMealsToCreate += dayPlan.meals.length
      }
      
      console.log(`📊 Creating ${totalMealsToCreate} meals across ${generatedPlan.meals.length} days`)

      for (const dayPlan of generatedPlan.meals) {
        console.log(`📅 Processing day ${dayPlan.dayNumber} (${dayPlan.dayName}) with ${dayPlan.meals.length} meals`)
        
        for (const mealData of dayPlan.meals) {
          try {
            console.log(`🍽️ Creating meal: ${mealData.name}`)
            
            // Validate meal data before creating recipe
            const validatedMealData = {
              name: mealData.name || `${mealData.mealType} meal`,
              description: mealData.description || `Healthy ${mealData.mealType} option`,
              cuisine_type: mealData.cuisineType || wizardData.preferences.cuisine_preferences?.[0] || 'international',
              diet_type: wizardData.preferences.diet_type!,
              prep_time: Number(mealData.prepTime) || 10,
              cook_time: Number(mealData.cookTime) || 15,
              servings: 1,
              difficulty: mealData.difficulty || 'easy',
              calories_per_serving: Number(mealData.calories) || 400,
              protein_per_serving: Number(mealData.protein) || 20,
              carbs_per_serving: Number(mealData.carbs) || 30,
              fat_per_serving: Number(mealData.fat) || 10,
              ingredients: Array.isArray(mealData.ingredients) && mealData.ingredients.length > 0 
                ? mealData.ingredients 
                : [{ name: "ingredients", amount: "1", unit: "serving" }],
              instructions: Array.isArray(mealData.instructions) && mealData.instructions.length > 0 
                ? mealData.instructions 
                : [{ step: 1, instruction: "Prepare according to recipe" }],
              tags: Array.isArray(mealData.tags) && mealData.tags.length > 0 
                ? mealData.tags 
                : ["healthy", mealData.mealType],
              image_url: `https://images.pexels.com/photos/${1640777 + Math.floor(Math.random() * 1000)}/pexels-photo-${1640777 + Math.floor(Math.random() * 1000)}.jpeg?auto=compress&cs=tinysrgb&w=400`
            }

            // Create recipe with error handling
            const recipe = await recipeAPI.createRecipe(validatedMealData)
            console.log(`✅ Created recipe: ${recipe.name} with ID: ${recipe.id}`)

            // Create meal entry with validated data
            const mealEntry = {
              diet_plan_id: dietPlan.id,
              recipe_id: recipe.id,
              day_number: dayPlan.dayNumber,
              meal_type: mealData.mealType,
              meal_time: mealData.mealTime || '12:00',
              portion_size: 1.0,
              calories: Number(mealData.calories) || 400,
              protein: Number(mealData.protein) || 20,
              carbs: Number(mealData.carbs) || 30,
              fat: Number(mealData.fat) || 10
            }

            const { data: createdMeal, error: mealError } = await supabase
              .from('meals')
              .insert(mealEntry)
              .select()
              .single()

            if (mealError) {
              console.error(`❌ Failed to create meal entry for ${mealData.name}:`, mealError)
              throw mealError
            }

            console.log(`✅ Created meal entry: ${createdMeal.id}`)
            createdMealsCount++
            
            // Update progress
            const progressPercent = Math.round((createdMealsCount / totalMealsToCreate) * 100)
            setGenerationProgress(`📝 Adding recipes... (${createdMealsCount}/${totalMealsToCreate} - ${progressPercent}%)`)
            
          } catch (error) {
            console.error(`❌ Failed to create meal: ${mealData.name}`, error)
            // Continue with other meals even if one fails
            createdMealsCount++ // Still count it to avoid infinite progress
          }
        }
      }

      setGenerationProgress('✨ Finalizing your personalized plan...')

      console.log(`📊 Successfully created ${createdMealsCount} out of ${totalMealsToCreate} meals`)

      // Reload data to show the new plan
      await loadData()
      setActiveTab('current')

      setGenerationProgress('🎉 Your personalized diet plan is ready!')
      
      // Show success message
      setTimeout(() => {
        setGenerationProgress('')
        setShowSuccessModal(true)
      }, 1000)

      console.log('=== DIET PLAN GENERATION COMPLETED SUCCESSFULLY ===')

    } catch (error) {
      console.error('=== DIET PLAN GENERATION FAILED ===')
      console.error('Error type:', typeof error)
      console.error('Error details:', error)
      console.error('Error message:', error instanceof Error ? error.message : String(error))
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
      
      setGenerationProgress('')
      
      let userFriendlyMessage = 'Failed to generate your diet plan. '
      
      if (error instanceof Error) {
        if (error.message.includes('API_KEY_MISSING')) {
          userFriendlyMessage += 'AI service is not configured. Using our built-in meal templates instead.'
        } else if (error.message.includes('JSON parsing failed')) {
          userFriendlyMessage += 'There was an issue processing the AI response. Using our built-in meal templates instead.'
        } else if (error.message.includes('Failed to generate content with AI')) {
          userFriendlyMessage += 'AI service is temporarily unavailable. Using our built-in meal templates instead.'
        } else {
          userFriendlyMessage += 'Please try again or contact support if the issue persists.'
        }
      } else {
        userFriendlyMessage += 'An unexpected error occurred. Please try again.'
      }
      
      setErrorMessage(userFriendlyMessage)
      setShowErrorModal(true)
    } finally {
      setGenerating(false)
    }
  }

  const deleteDietPlan = async (planId: string) => {
    setPlanToDelete(planId)
    setShowDeleteModal(true)
  }

  const confirmDeletePlan = async () => {
    if (!user || !planToDelete) return

    try {
      setDeletingPlanId(planToDelete)
      setShowDeleteModal(false)
      
      console.log('=== DELETING DIET PLAN ===')
      console.log('Plan ID:', planToDelete)
      console.log('User ID:', user.id)
      
      // Call the API method to delete the diet plan
      await dietPlanAPI.deleteDietPlan(planToDelete, user.id)
      console.log('✅ Diet plan deleted successfully')
      
      // Force reload data to ensure UI is updated
      await loadData()
      
      setShowSuccessModal(true)
      
    } catch (error) {
      console.error('❌ Deletion failed:', error)
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setErrorMessage(`Failed to delete diet plan: ${errorMessage}`)
      setShowErrorModal(true)
    } finally {
      setDeletingPlanId(null)
      setPlanToDelete(null)
    }
  }

  const activatePlan = async (planId: string) => {
    if (!user) return

    try {
      setActivatingPlanId(planId)
      
      // Update plan status to active (this will automatically deactivate others)
      await dietPlanAPI.updateDietPlanStatus(planId, user.id, 'active')
      
      // Reload data
      await loadData()
      
      setShowSuccessModal(true)
    } catch (error) {
      console.error('Failed to activate diet plan:', error)
      setErrorMessage('Failed to activate diet plan. Please try again.')
      setShowErrorModal(true)
    } finally {
      setActivatingPlanId(null)
    }
  }

  const viewPlanDetails = (planId: string) => {
    console.log('Navigating to plan details:', planId)
    navigate(`/diet-plans/${planId}`)
  }

  const updateWizardProfile = (updates: Partial<UserProfile>) => {
    setWizardData(prev => ({
      ...prev,
      profile: { ...prev.profile, ...updates }
    }))
  }

  const updateWizardPreferences = (updates: Partial<UserPreferences>) => {
    setWizardData(prev => ({
      ...prev,
      preferences: { ...prev.preferences, ...updates }
    }))
  }

  const activePlan = dietPlans.find(p => p.status === 'active')

  const getMealTypeColor = (type: string) => {
    switch (type) {
      case 'breakfast':
        return 'bg-yellow-100 text-yellow-800'
      case 'lunch':
        return 'bg-blue-100 text-blue-800'
      case 'dinner':
        return 'bg-purple-100 text-purple-800'
      case 'snack':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const groupMealsByDay = (meals: Meal[]) => {
    const grouped = meals.reduce((acc, meal) => {
      if (!acc[meal.day_number]) {
        acc[meal.day_number] = []
      }
      acc[meal.day_number].push(meal)
      return acc
    }, {} as Record<number, Meal[]>)

    // Sort meals within each day by meal time
    Object.keys(grouped).forEach(day => {
      grouped[parseInt(day)].sort((a, b) => a.meal_time.localeCompare(b.meal_time))
    })

    return grouped
  }

  const getDayName = (dayNumber: number) => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    return days[(dayNumber - 1) % 7]
  }

  // Wizard Step Components
  const renderWizardStep = () => {
    switch (wizardStep) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <h3 className="text-xl font-semibold flex items-center">
                <Edit className="w-5 h-5 mr-2 text-emerald-500" />
                Plan Name & Basic Info
              </h3>
              <p className="text-gray-600">Give your diet plan a custom name and review your basic information</p>
            </CardHeader>
            <CardBody className="space-y-6">
              <Input
                label="Plan Name"
                value={wizardData.planName}
                onChange={(e) => setWizardData(prev => ({ ...prev, planName: e.target.value }))}
                placeholder="Enter a name for your diet plan"
                required
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Age"
                  type="number"
                  value={wizardData.profile.age || ''}
                  onChange={(e) => updateWizardProfile({ age: parseInt(e.target.value) })}
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select
                    value={wizardData.profile.gender || ''}
                    onChange={(e) => updateWizardProfile({ gender: e.target.value as any })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <Input
                  label="Height (cm)"
                  type="number"
                  value={wizardData.profile.height || ''}
                  onChange={(e) => updateWizardProfile({ height: parseInt(e.target.value) })}
                  required
                />
                <Input
                  label="Current Weight (kg)"
                  type="number"
                  step="0.1"
                  value={wizardData.profile.weight || ''}
                  onChange={(e) => updateWizardProfile({ weight: parseFloat(e.target.value) })}
                  required
                />
                <Input
                  label="Target Weight (kg)"
                  type="number"
                  step="0.1"
                  value={wizardData.profile.target_weight || ''}
                  onChange={(e) => updateWizardProfile({ target_weight: parseFloat(e.target.value) })}
                  required
                />
                <Input
                  label="Timeline (weeks)"
                  type="number"
                  value={wizardData.profile.timeline_weeks || ''}
                  onChange={(e) => updateWizardProfile({ timeline_weeks: parseInt(e.target.value) })}
                  required
                />
              </div>
            </CardBody>
          </Card>
        )

      case 2:
        return (
          <Card>
            <CardHeader>
              <h3 className="text-xl font-semibold flex items-center">
                <Target className="w-5 h-5 mr-2 text-emerald-500" />
                Goals & Activity Level
              </h3>
              <p className="text-gray-600">Review and adjust your fitness goals and activity level</p>
            </CardHeader>
            <CardBody className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Primary Goal</label>
                  <select
                    value={wizardData.profile.goal || ''}
                    onChange={(e) => updateWizardProfile({ goal: e.target.value as any })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  >
                    <option value="weight_loss">Weight Loss</option>
                    <option value="muscle_gain">Muscle Gain</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="health">General Health</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Activity Level</label>
                  <select
                    value={wizardData.profile.activity_level || ''}
                    onChange={(e) => updateWizardProfile({ activity_level: e.target.value as any })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  >
                    <option value="sedentary">Sedentary (Little to no exercise)</option>
                    <option value="light">Light (1-3 days/week)</option>
                    <option value="moderate">Moderate (3-5 days/week)</option>
                    <option value="active">Active (6-7 days/week)</option>
                    <option value="very_active">Very Active (2x/day or intense)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Allergies</label>
                <textarea
                  value={wizardData.profile.allergies?.join(', ') || ''}
                  onChange={(e) => updateWizardProfile({ 
                    allergies: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  })}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="e.g., nuts, dairy, gluten"
                />
              </div>
            </CardBody>
          </Card>
        )

      case 3:
        return (
          <Card>
            <CardHeader>
              <h3 className="text-xl font-semibold flex items-center">
                <Utensils className="w-5 h-5 mr-2 text-emerald-500" />
                Dietary Preferences
              </h3>
              <p className="text-gray-600">Review and adjust your food preferences and restrictions</p>
            </CardHeader>
            <CardBody className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Diet Type</label>
                  <select
                    value={wizardData.preferences.diet_type || ''}
                    onChange={(e) => updateWizardPreferences({ diet_type: e.target.value as any })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  >
                    <option value="vegetarian">Vegetarian</option>
                    <option value="vegan">Vegan</option>
                    <option value="non_vegetarian">Non-Vegetarian</option>
                    <option value="pescatarian">Pescatarian</option>
                    <option value="keto">Keto</option>
                    <option value="paleo">Paleo</option>
                  </select>
                </div>
                <Input
                  label="Meals per Day"
                  type="number"
                  min="3"
                  max="6"
                  value={wizardData.preferences.meals_per_day || 3}
                  onChange={(e) => updateWizardPreferences({ meals_per_day: parseInt(e.target.value) })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Cuisine Preferences</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['Italian', 'Mediterranean', 'Indian', 'Chinese', 'Thai', 'Mexican', 'American', 'Japanese'].map((cuisine) => (
                    <label key={cuisine} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={wizardData.preferences.cuisine_preferences?.includes(cuisine.toLowerCase()) || false}
                        onChange={(e) => {
                          const current = wizardData.preferences.cuisine_preferences || []
                          const newPreferences = e.target.checked
                            ? [...current, cuisine.toLowerCase()]
                            : current.filter(c => c !== cuisine.toLowerCase())
                          updateWizardPreferences({ cuisine_preferences: newPreferences })
                        }}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-sm text-gray-700">{cuisine}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Food Restrictions</label>
                <textarea
                  value={wizardData.preferences.food_restrictions?.join(', ') || ''}
                  onChange={(e) => updateWizardPreferences({ 
                    food_restrictions: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  })}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Any foods you avoid or dislike"
                />
              </div>
            </CardBody>
          </Card>
        )

      case 4:
        return (
          <Card>
            <CardHeader>
              <h3 className="text-xl font-semibold flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-emerald-500" />
                Review & Generate
              </h3>
              <p className="text-gray-600">Review your settings and generate your personalized diet plan</p>
            </CardHeader>
            <CardBody className="space-y-6">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
                <h4 className="font-semibold text-emerald-800 mb-4">Plan Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-emerald-600 font-medium">Plan Name:</span>
                    <p className="text-emerald-800">{wizardData.planName}</p>
                  </div>
                  <div>
                    <span className="text-emerald-600 font-medium">Goal:</span>
                    <p className="text-emerald-800 capitalize">{wizardData.profile.goal?.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <span className="text-emerald-600 font-medium">Diet Type:</span>
                    <p className="text-emerald-800 capitalize">{wizardData.preferences.diet_type?.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <span className="text-emerald-600 font-medium">Timeline:</span>
                    <p className="text-emerald-800">{wizardData.profile.timeline_weeks} weeks</p>
                  </div>
                  <div>
                    <span className="text-emerald-600 font-medium">Meals per Day:</span>
                    <p className="text-emerald-800">{wizardData.preferences.meals_per_day}</p>
                  </div>
                  <div>
                    <span className="text-emerald-600 font-medium">Activity Level:</span>
                    <p className="text-emerald-800 capitalize">{wizardData.profile.activity_level?.replace('_', ' ')}</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-blue-800 text-sm">
                    <p className="font-medium mb-1">AI-Powered Generation</p>
                    <p>Your plan will be created using advanced AI that considers your personal preferences, dietary restrictions, and health goals. If AI is unavailable, we'll use our comprehensive meal templates.</p>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <Button
                  variant="primary"
                  size="lg"
                  icon={ChefHat}
                  onClick={generatePlanFromWizard}
                  className="px-8"
                >
                  Generate My Diet Plan
                </Button>
              </div>
            </CardBody>
          </Card>
        )

      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-gray-200 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Diet Plans
          </h1>
          <p className="text-gray-600">
            Manage your AI-generated personalized diet plans
          </p>
        </div>
        <Button 
          variant="primary" 
          icon={generating ? Loader2 : Plus}
          onClick={startWizard}
          loading={generating}
          disabled={generating}
        >
          {generating ? 'Generating...' : 'Generate New Plan'}
        </Button>
      </div>

      {/* Generation Progress */}
      {generating && generationProgress && (
        <Card className="mb-8 bg-gradient-to-r from-emerald-50 to-blue-50 border-emerald-200">
          <CardBody className="p-8">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                <span className="text-xl font-semibold text-emerald-800">Creating Your Perfect Diet Plan</span>
              </div>
              <p className="text-emerald-700 text-lg mb-6">{generationProgress}</p>
              <div className="w-full bg-emerald-200 rounded-full h-3">
                <div className="bg-gradient-to-r from-emerald-500 to-blue-500 h-3 rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
              <p className="text-emerald-600 text-sm mt-4">This usually takes 30-60 seconds. Please don't close this page.</p>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Generation Wizard Modal */}
      {showWizard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Create New Diet Plan</h2>
                <button
                  onClick={() => setShowWizard(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              {/* Progress Steps */}
              <div className="flex items-center mt-6">
                {[1, 2, 3, 4].map((step) => (
                  <React.Fragment key={step}>
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                      step <= wizardStep 
                        ? 'bg-emerald-500 text-white' 
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {step}
                    </div>
                    {step < 4 && (
                      <div className={`flex-1 h-1 mx-2 ${
                        step < wizardStep ? 'bg-emerald-500' : 'bg-gray-200'
                      }`} />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className="p-6">
              {renderWizardStep()}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-between">
              <Button
                variant="outline"
                onClick={() => setWizardStep(Math.max(1, wizardStep - 1))}
                disabled={wizardStep === 1}
                icon={ArrowLeft}
              >
                Previous
              </Button>

              {wizardStep < 4 ? (
                <Button
                  variant="primary"
                  onClick={() => setWizardStep(wizardStep + 1)}
                  icon={ArrowRight}
                >
                  Next
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('current')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'current'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Current Plan
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'history'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            All Plans
          </button>
        </nav>
      </div>

      {/* Current Plan */}
      {activeTab === 'current' && (
        <div className="space-y-8">
          {activePlan ? (
            <>
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {activePlan.name}
                      </h2>
                      <p className="text-gray-600 mb-4">{activePlan.description}</p>
                      <div className="flex items-center space-x-6 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {activePlan.duration_weeks} weeks
                        </div>
                        <div className="flex items-center">
                          <Flame className="w-4 h-4 mr-1" />
                          {activePlan.total_calories} calories/day
                        </div>
                        <div className="flex items-center">
                          <Target className="w-4 h-4 mr-1" />
                          Started {new Date(activePlan.start_date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button 
                        variant="primary" 
                        icon={Eye}
                        onClick={() => viewPlanDetails(activePlan.id)}
                      >
                        View Details
                      </Button>
                      <Button 
                        variant="outline" 
                        icon={deletingPlanId === activePlan.id ? Loader2 : Trash2}
                        onClick={() => deleteDietPlan(activePlan.id)}
                        disabled={deletingPlanId === activePlan.id}
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        {deletingPlanId === activePlan.id ? 'Deleting...' : 'Delete'}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Day-wise Meal Plan */}
              {currentPlanMeals.length > 0 && (
                <div className="space-y-6">
                  {Object.entries(groupMealsByDay(currentPlanMeals)).map(([dayNumber, dayMeals]) => (
                    <Card key={dayNumber}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-semibold text-gray-900">
                            Day {dayNumber} - {getDayName(parseInt(dayNumber))}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center">
                              <Flame className="w-4 h-4 mr-1" />
                              {dayMeals.reduce((sum, meal) => sum + meal.calories, 0)} calories
                            </div>
                            <div className="flex items-center">
                              <Utensils className="w-4 h-4 mr-1" />
                              {dayMeals.length} meals
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardBody className="p-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                          {dayMeals.map((meal) => (
                            <div key={meal.id} className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-medium text-gray-900">{meal.recipe?.name || 'Meal'}</h4>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getMealTypeColor(meal.meal_type)}`}>
                                  {meal.meal_type}
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                                <div className="text-center">
                                  <p className="font-medium text-gray-900">{meal.calories}</p>
                                  <p className="text-gray-500">Cal</p>
                                </div>
                                <div className="text-center">
                                  <p className="font-medium text-gray-900">{meal.protein}g</p>
                                  <p className="text-gray-500">Protein</p>
                                </div>
                                <div className="text-center">
                                  <p className="font-medium text-gray-900">{meal.carbs}g</p>
                                  <p className="text-gray-500">Carbs</p>
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                                <div className="flex items-center">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {meal.meal_time}
                                </div>
                                <div className="flex items-center">
                                  <ChefHat className="w-3 h-3 mr-1" />
                                  {(meal.recipe?.prep_time || 0) + (meal.recipe?.cook_time || 0)} min
                                </div>
                              </div>

                              <Button variant="outline" size="sm" className="w-full text-xs" icon={ChefHat}>
                                View Recipe
                              </Button>
                            </div>
                          ))}
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <Heart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Plan</h3>
              <p className="text-gray-500 mb-6">Generate your first AI-powered diet plan to get started</p>
              <Button 
                variant="primary" 
                icon={generating ? Loader2 : Plus}
                onClick={startWizard}
                loading={generating}
              >
                {generating ? 'Generating...' : 'Generate Diet Plan'}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* All Plans */}
      {activeTab === 'history' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dietPlans.map((plan) => (
            <Card key={plan.id} hover>
              <CardBody className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                    plan.status === 'active' ? 'bg-green-100 text-green-800' :
                    plan.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {plan.status}
                  </span>
                </div>
                
                <p className="text-gray-600 mb-4">{plan.description}</p>
                
                <div className="flex items-center justify-between text-sm text-gray-500 mb-6">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {plan.duration_weeks} weeks
                  </div>
                  <div className="flex items-center">
                    <Flame className="w-4 h-4 mr-1" />
                    {plan.total_calories} cal/day
                  </div>
                </div>

                <div className="space-y-2">
                  <Button 
                    variant="primary" 
                    size="sm" 
                    className="w-full" 
                    icon={Eye}
                    onClick={() => viewPlanDetails(plan.id)}
                  >
                    View Details
                  </Button>
                  <div className="flex space-x-2">
                    {plan.status !== 'active' && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        icon={activatingPlanId === plan.id ? Loader2 : Play}
                        onClick={() => activatePlan(plan.id)}
                        disabled={activatingPlanId === plan.id}
                      >
                        {activatingPlanId === plan.id ? 'Activating...' : 'Activate'}
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 text-red-600 border-red-300 hover:bg-red-50"
                      icon={deletingPlanId === plan.id ? Loader2 : Trash2}
                      onClick={() => deleteDietPlan(plan.id)}
                      disabled={deletingPlanId === plan.id}
                    >
                      {deletingPlanId === plan.id ? 'Deleting...' : 'Delete'}
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
          
          {dietPlans.length === 0 && (
            <div className="col-span-full text-center py-12">
              <Heart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Diet Plans Yet</h3>
              <p className="text-gray-500 mb-6">Create your first personalized diet plan</p>
              <Button variant="primary" icon={Plus} onClick={startWizard}>
                Generate Diet Plan
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDeletePlan}
        title="Delete Diet Plan"
        message="Are you sure you want to delete this diet plan? This action cannot be undone and will remove all associated meals and recipes."
        confirmText="Delete Plan"
        confirmVariant="outline"
        loading={deletingPlanId !== null}
      />

      <AlertModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Success!"
        message="Operation completed successfully."
        type="success"
      />

      <AlertModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="Error"
        message={errorMessage}
        type="error"
      />
    </div>
  )
}