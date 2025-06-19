import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardHeader, CardBody } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { 
  ArrowLeft,
  Clock, 
  Users, 
  ChefHat, 
  Heart,
  Bookmark,
  Star,
  Flame,
  Target,
  Activity,
  Shield,
  Zap,
  TrendingUp,
  CheckCircle,
  User,
  Loader2,
  Calendar
} from 'lucide-react'
import { 
  recipeAPI, 
  profileAPI,
  Recipe, 
  UserProfile
} from '../lib/supabase'
import { geminiAPI } from '../lib/gemini'

interface DetailedRecipe extends Recipe {
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

export const RecipeDetails: React.FC = () => {
  const { recipeId } = useParams<{ recipeId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [recipe, setRecipe] = useState<DetailedRecipe | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [activeStep, setActiveStep] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user && recipeId) {
      loadRecipeDetails()
    }
  }, [user, recipeId])

  const loadRecipeDetails = async () => {
    if (!user || !recipeId) return

    try {
      setLoading(true)
      setError(null)
      
      // Load recipe and user profile
      const [recipeData, profileData] = await Promise.all([
        recipeAPI.getRecipe(recipeId),
        profileAPI.getProfile(user.id)
      ])
      
      if (!recipeData) {
        setError('Recipe not found')
        return
      }

      setRecipe(recipeData)
      setUserProfile(profileData)

      console.log('Recipe loaded:', {
        hasDetailedInstructions: !!recipeData.detailed_instructions,
        hasPersonalizedBenefits: !!recipeData.personalized_benefits,
        hasHealthScore: !!recipeData.health_score
      })

      // Check if recipe needs detailed generation (only if not already generated)
      const needsGeneration = !recipeData.detailed_instructions || 
                             !recipeData.personalized_benefits || 
                             !recipeData.health_score

      if (needsGeneration && profileData) {
        console.log('Recipe needs detailed generation, starting...')
        await generateDetailedRecipe(recipeData, profileData)
      } else {
        console.log('Recipe already has detailed information, skipping generation')
      }

    } catch (error) {
      console.error('Failed to load recipe details:', error)
      setError('Failed to load recipe details. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const generateDetailedRecipe = async (baseRecipe: Recipe, profile: UserProfile) => {
    try {
      setGenerating(true)
      console.log('Starting recipe detail generation for:', baseRecipe.name)

      const prompt = `
Generate comprehensive recipe details and personalized health benefits for the following recipe:

RECIPE INFORMATION:
- Name: ${baseRecipe.name}
- Description: ${baseRecipe.description}
- Cuisine: ${baseRecipe.cuisine_type}
- Diet Type: ${baseRecipe.diet_type}
- Difficulty: ${baseRecipe.difficulty}
- Prep Time: ${baseRecipe.prep_time} minutes
- Cook Time: ${baseRecipe.cook_time} minutes
- Servings: ${baseRecipe.servings}
- Calories per serving: ${baseRecipe.calories_per_serving}
- Protein: ${baseRecipe.protein_per_serving}g
- Carbs: ${baseRecipe.carbs_per_serving}g
- Fat: ${baseRecipe.fat_per_serving}g
- Current Ingredients: ${JSON.stringify(baseRecipe.ingredients)}
- Current Instructions: ${JSON.stringify(baseRecipe.instructions)}

USER PROFILE:
- Age: ${profile.age}
- Gender: ${profile.gender}
- Goal: ${profile.goal}
- Activity Level: ${profile.activity_level}
- Medical Conditions: ${profile.medical_conditions?.join(', ') || 'None'}
- Allergies: ${profile.allergies?.join(', ') || 'None'}
- Current Weight: ${profile.weight}kg
- Target Weight: ${profile.target_weight}kg

Please generate a comprehensive recipe enhancement with personalized benefits. Return ONLY a JSON object with this exact structure:

{
  "detailed_instructions": [
    {
      "step": 1,
      "instruction": "Detailed step-by-step instruction with professional techniques",
      "tips": "Professional cooking tip for this step",
      "time_estimate": 5
    }
  ],
  "nutritional_benefits": [
    "General nutritional benefit 1",
    "General nutritional benefit 2",
    "General nutritional benefit 3"
  ],
  "cooking_tips": [
    "Professional cooking tip 1",
    "Professional cooking tip 2",
    "Professional cooking tip 3"
  ],
  "storage_instructions": "How to properly store leftovers and for how long",
  "variations": [
    "Recipe variation 1",
    "Recipe variation 2"
  ],
  "personalized_benefits": [
    "Specific benefit for this user's ${profile.goal} goal",
    "Benefit related to their ${profile.activity_level} activity level",
    "Nutritional advantage for their age group (${profile.age} years old)",
    "Additional personalized benefit based on their profile"
  ],
  "health_score": 85
}

REQUIREMENTS:
1. Make detailed_instructions more comprehensive than the basic instructions with professional techniques
2. Include specific cooking techniques, timing, and professional tips for each step
3. Personalized_benefits must be specifically tailored to the user's profile, goals, and health needs
4. Health_score should be 1-100 based on nutritional value and alignment with user goals
5. Consider any medical conditions or allergies in the personalized benefits
6. Make storage_instructions practical and food-safe
7. Suggest variations that align with the user's diet type and preferences
8. Ensure all benefits are scientifically accurate and relevant
9. Provide at least 3-4 items for each array field
10. Make instructions more detailed than the original with professional cooking techniques

Return ONLY the JSON object, no additional text or formatting.
`

      console.log('Calling Gemini API for recipe details...')
      const response = await geminiAPI.generateRecipeDetails(prompt)
      console.log('Gemini API response received:', response)
      
      // Update the recipe in the database with detailed information
      console.log('Updating recipe in database...')
      const updatedRecipe = await recipeAPI.updateRecipe(baseRecipe.id, {
        detailed_instructions: response.detailed_instructions,
        nutritional_benefits: response.nutritional_benefits,
        cooking_tips: response.cooking_tips,
        storage_instructions: response.storage_instructions,
        variations: response.variations,
        personalized_benefits: response.personalized_benefits,
        health_score: response.health_score
      })

      console.log('Recipe updated successfully in database')

      // Update local state with the updated recipe
      setRecipe(updatedRecipe)

    } catch (error) {
      console.error('Failed to generate detailed recipe:', error)
      
      // If generation fails, create fallback detailed content
      const fallbackDetails = createFallbackDetails(baseRecipe, profile)
      
      try {
        console.log('Using fallback details and saving to database...')
        const updatedRecipe = await recipeAPI.updateRecipe(baseRecipe.id, fallbackDetails)
        setRecipe(updatedRecipe)
      } catch (updateError) {
        console.error('Failed to save fallback details:', updateError)
        // Continue with basic recipe if both generation and fallback fail
        // Don't throw error here, just log it and continue with basic recipe
      }
    } finally {
      setGenerating(false)
    }
  }

  const createFallbackDetails = (baseRecipe: Recipe, profile: UserProfile) => {
    // Create enhanced instructions from basic ones
    const enhancedInstructions = (baseRecipe.instructions || []).map((instruction: any, index: number) => ({
      step: instruction.step || index + 1,
      instruction: instruction.instruction || `Step ${index + 1}`,
      tips: `Professional tip for step ${index + 1}: Take your time and ensure proper technique.`,
      time_estimate: Math.ceil((baseRecipe.prep_time + baseRecipe.cook_time) / (baseRecipe.instructions?.length || 1))
    }))

    // Create personalized benefits based on user profile
    const personalizedBenefits = [
      `This recipe supports your ${profile.goal?.replace('_', ' ')} goal with ${baseRecipe.calories_per_serving} calories per serving.`,
      `Perfect for your ${profile.activity_level?.replace('_', ' ')} lifestyle with ${baseRecipe.protein_per_serving}g of protein.`,
      `Nutritionally balanced for someone in their ${Math.floor((profile.age || 30) / 10) * 10}s with essential macronutrients.`,
      `Aligns with your dietary preferences and provides sustained energy for your daily activities.`
    ]

    return {
      detailed_instructions: enhancedInstructions,
      nutritional_benefits: [
        `Provides ${baseRecipe.protein_per_serving}g of protein for muscle maintenance`,
        `Contains ${baseRecipe.carbs_per_serving}g of carbohydrates for energy`,
        `Includes healthy fats for nutrient absorption`,
        `Balanced macronutrient profile for optimal nutrition`
      ],
      cooking_tips: [
        "Prepare all ingredients before starting (mise en place)",
        "Use proper knife techniques for even cuts",
        "Control heat carefully to prevent burning",
        "Taste and adjust seasoning throughout cooking"
      ],
      storage_instructions: "Store leftovers in the refrigerator for up to 3-4 days in airtight containers. Reheat gently to maintain texture and flavor.",
      variations: [
        "Try different herbs and spices to change the flavor profile",
        "Substitute ingredients based on seasonal availability",
        "Adjust portion sizes to meet your caloric needs",
        "Add extra vegetables for increased nutrition"
      ],
      personalized_benefits: personalizedBenefits,
      health_score: Math.min(95, Math.max(60, 
        Math.round(
          (baseRecipe.protein_per_serving || 0) * 2 + 
          (baseRecipe.calories_per_serving || 0) / 10 + 
          (profile.goal === 'weight_loss' ? 10 : 0) +
          (profile.goal === 'muscle_gain' ? 15 : 0) +
          (profile.activity_level === 'active' || profile.activity_level === 'very_active' ? 10 : 0)
        )
      ))
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'hard':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-96 bg-gray-200 rounded-2xl"></div>
        </div>
      </div>
    )
  }

  if (error || !recipe) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {error || 'Recipe Not Found'}
          </h3>
          <p className="text-gray-500 mb-6">
            {error || "The recipe you're looking for doesn't exist."}
          </p>
          <Button variant="primary" onClick={() => navigate('/recipes')}>
            Back to Recipes
          </Button>
        </div>
      </div>
    )
  }

  const instructions = recipe.detailed_instructions || recipe.instructions || []

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button 
          variant="ghost" 
          icon={ArrowLeft} 
          onClick={() => navigate('/recipes')}
          className="mb-4"
        >
          Back to Recipes
        </Button>
      </div>

      {/* Generation Progress */}
      {generating && (
        <Card className="mb-8 bg-emerald-50 border-emerald-200">
          <CardBody className="p-6">
            <div className="flex items-center space-x-3">
              <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />
              <span className="text-emerald-800 font-medium">
                Generating personalized recipe details just for you...
              </span>
            </div>
          </CardBody>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Recipe Header */}
          <Card>
            <div className="relative">
              <img
                src={recipe.image_url}
                alt={recipe.name}
                className="w-full h-64 object-cover rounded-t-2xl"
              />
              <div className="absolute top-4 right-4 flex space-x-2">
                <button className="p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors">
                  <Heart className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors">
                  <Bookmark className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              <div className="absolute bottom-4 left-4 flex space-x-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getDifficultyColor(recipe.difficulty)}`}>
                  {recipe.difficulty}
                </span>
                {recipe.health_score && (
                  <span className={`px-3 py-1 rounded-full text-sm font-medium bg-white/90 ${getHealthScoreColor(recipe.health_score)}`}>
                    Health Score: {recipe.health_score}/100
                  </span>
                )}
              </div>
            </div>
            
            <CardBody className="p-8">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-3xl font-bold text-gray-900">{recipe.name}</h1>
                <div className="flex items-center space-x-1">
                  <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  <span className="text-lg font-medium text-gray-700">4.8</span>
                </div>
              </div>
              
              <p className="text-gray-600 text-lg mb-6">{recipe.description}</p>
              
              <div className="grid grid-cols-4 gap-6 mb-6">
                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-full mb-2 mx-auto">
                    <Clock className="w-6 h-6 text-emerald-600" />
                  </div>
                  <p className="text-sm text-gray-500">Total Time</p>
                  <p className="font-semibold text-gray-900">{recipe.prep_time + recipe.cook_time} min</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-2 mx-auto">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="text-sm text-gray-500">Servings</p>
                  <p className="font-semibold text-gray-900">{recipe.servings}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mb-2 mx-auto">
                    <Flame className="w-6 h-6 text-orange-600" />
                  </div>
                  <p className="text-sm text-gray-500">Calories</p>
                  <p className="font-semibold text-gray-900">{recipe.calories_per_serving}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-2 mx-auto">
                    <ChefHat className="w-6 h-6 text-purple-600" />
                  </div>
                  <p className="text-sm text-gray-500">Difficulty</p>
                  <p className="font-semibold text-gray-900 capitalize">{recipe.difficulty}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {recipe.tags.map((tag, index) => (
                  <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Personalized Benefits */}
          {userProfile && recipe.personalized_benefits && recipe.personalized_benefits.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold flex items-center">
                  <User className="w-5 h-5 mr-2 text-emerald-500" />
                  Personalized Benefits for You
                  {generating && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                </h2>
                <p className="text-gray-600">Based on your profile and health goals</p>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    {recipe.personalized_benefits.map((benefit, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center mt-0.5">
                          {index === 0 && <Target className="w-4 h-4 text-emerald-600" />}
                          {index === 1 && <Activity className="w-4 h-4 text-emerald-600" />}
                          {index === 2 && <Shield className="w-4 h-4 text-emerald-600" />}
                          {index > 2 && <Zap className="w-4 h-4 text-emerald-600" />}
                        </div>
                        <p className="text-gray-700">{benefit}</p>
                      </div>
                    ))}
                  </div>
                  
                  <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl p-6">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2 text-emerald-600" />
                      Your Health Goals
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Primary Goal:</span>
                        <span className="font-medium text-gray-900 capitalize">
                          {userProfile.goal?.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Activity Level:</span>
                        <span className="font-medium text-gray-900 capitalize">
                          {userProfile.activity_level?.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Target Weight:</span>
                        <span className="font-medium text-gray-900">{userProfile.target_weight}kg</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Instructions */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold flex items-center">
                <ChefHat className="w-5 h-5 mr-2 text-emerald-500" />
                Cooking Instructions
              </h2>
            </CardHeader>
            <CardBody className="p-0">
              <div className="space-y-0">
                {instructions.map((instruction: any, index: number) => (
                  <div 
                    key={index} 
                    className={`p-6 border-b border-gray-100 last:border-b-0 transition-colors ${
                      activeStep === index ? 'bg-emerald-50 border-l-4 border-l-emerald-500' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start space-x-4">
                      <button
                        onClick={() => setActiveStep(activeStep === index ? -1 : index)}
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                          activeStep === index 
                            ? 'bg-emerald-500 text-white' 
                            : 'bg-gray-200 text-gray-600 hover:bg-emerald-100'
                        }`}
                      >
                        {activeStep === index ? <CheckCircle className="w-4 h-4" /> : instruction.step}
                      </button>
                      <div className="flex-1">
                        <p className="text-gray-900 font-medium mb-2">
                          Step {instruction.step}
                          {instruction.time_estimate && (
                            <span className="text-sm text-gray-500 ml-2">
                              (~{instruction.time_estimate} min)
                            </span>
                          )}
                        </p>
                        <p className="text-gray-700 mb-3">{instruction.instruction}</p>
                        {instruction.tips && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-blue-800 text-sm">
                              <strong>Pro Tip:</strong> {instruction.tips}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Additional Tips */}
          {recipe.cooking_tips && recipe.cooking_tips.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-emerald-500" />
                  Professional Tips
                </h2>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recipe.cooking_tips.map((tip, index) => (
                    <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-yellow-800 text-sm">{tip}</p>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Nutrition Facts */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">Nutrition Facts</h2>
              <p className="text-sm text-gray-500">Per serving</p>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Calories</span>
                  <span className="font-semibold text-gray-900">{recipe.calories_per_serving}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Protein</span>
                  <span className="font-semibold text-gray-900">{recipe.protein_per_serving}g</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Carbohydrates</span>
                  <span className="font-semibold text-gray-900">{recipe.carbs_per_serving}g</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Fat</span>
                  <span className="font-semibold text-gray-900">{recipe.fat_per_serving}g</span>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Ingredients */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">Ingredients</h2>
            </CardHeader>
            <CardBody className="p-0">
              <div className="space-y-0">
                {recipe.ingredients.map((ingredient: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-4 border-b border-gray-100 last:border-b-0">
                    <span className="text-gray-900">{ingredient.name}</span>
                    <span className="text-gray-600 text-sm">
                      {ingredient.amount} {ingredient.unit}
                    </span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Nutritional Benefits */}
          {recipe.nutritional_benefits && recipe.nutritional_benefits.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">Health Benefits</h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  {recipe.nutritional_benefits.map((benefit, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">{benefit}</span>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Storage Instructions */}
          {recipe.storage_instructions && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">Storage</h2>
              </CardHeader>
              <CardBody>
                <p className="text-gray-700 text-sm">{recipe.storage_instructions}</p>
              </CardBody>
            </Card>
          )}

          {/* Recipe Variations */}
          {recipe.variations && recipe.variations.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">Try These Variations</h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  {recipe.variations.map((variation, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-3">
                      <p className="text-gray-700 text-sm">{variation}</p>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button variant="primary" className="w-full" icon={ChefHat}>
              Start Cooking
            </Button>
            <Button variant="outline" className="w-full" icon={Calendar}>
              Add to Meal Plan
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}