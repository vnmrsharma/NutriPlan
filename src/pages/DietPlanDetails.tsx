import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardHeader, CardBody } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { 
  ArrowLeft,
  Calendar, 
  Clock, 
  Flame, 
  ChefHat, 
  Target,
  Utensils,
  Users,
  Star,
  BookOpen,
  Timer,
  Edit,
  Trash2,
  Play,
  Pause,
  Eye
} from 'lucide-react'
import { 
  dietPlanAPI, 
  supabase,
  DietPlan, 
  Meal
} from '../lib/supabase'

export const DietPlanDetails: React.FC = () => {
  const { planId } = useParams<{ planId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [dietPlan, setDietPlan] = useState<DietPlan | null>(null)
  const [meals, setMeals] = useState<Meal[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState(1)

  useEffect(() => {
    if (user && planId) {
      loadDietPlanDetails()
    }
  }, [user, planId])

  const loadDietPlanDetails = async () => {
    if (!user || !planId) return

    try {
      setLoading(true)
      
      // Load diet plan details
      const { data: plan, error: planError } = await supabase
        .from('diet_plans')
        .select('*')
        .eq('id', planId)
        .eq('user_id', user.id)
        .single()

      if (planError) throw planError
      setDietPlan(plan)

      // Load meals for this plan
      const planMeals = await dietPlanAPI.getDietPlanMeals(planId)
      setMeals(planMeals)

    } catch (error) {
      console.error('Failed to load diet plan details:', error)
      navigate('/diet-plans')
    } finally {
      setLoading(false)
    }
  }

  const updatePlanStatus = async (status: 'active' | 'paused' | 'completed') => {
    if (!dietPlan) return

    try {
      const { error } = await supabase
        .from('diet_plans')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', dietPlan.id)

      if (error) throw error

      setDietPlan({ ...dietPlan, status })
    } catch (error) {
      console.error('Failed to update plan status:', error)
      alert('Failed to update plan status. Please try again.')
    }
  }

  const deletePlan = async () => {
    if (!dietPlan || !confirm('Are you sure you want to delete this diet plan? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('diet_plans')
        .delete()
        .eq('id', dietPlan.id)

      if (error) throw error

      navigate('/diet-plans')
    } catch (error) {
      console.error('Failed to delete diet plan:', error)
      alert('Failed to delete diet plan. Please try again.')
    }
  }

  const viewRecipe = (recipeId: string) => {
    console.log('Navigating to recipe:', recipeId) // Debug log
    navigate(`/recipes/${recipeId}`)
  }

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'paused':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded-2xl"></div>
        </div>
      </div>
    )
  }

  if (!dietPlan) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Diet Plan Not Found</h3>
          <p className="text-gray-500 mb-6">The diet plan you're looking for doesn't exist or you don't have access to it.</p>
          <Button variant="primary" onClick={() => navigate('/diet-plans')}>
            Back to Diet Plans
          </Button>
        </div>
      </div>
    )
  }

  const groupedMeals = groupMealsByDay(meals)
  const availableDays = Object.keys(groupedMeals).map(Number).sort()
  const selectedDayMeals = groupedMeals[selectedDay] || []

  // Calculate nutrition totals for selected day
  const dayTotals = selectedDayMeals.reduce(
    (totals, meal) => ({
      calories: totals.calories + meal.calories,
      protein: totals.protein + meal.protein,
      carbs: totals.carbs + meal.carbs,
      fat: totals.fat + meal.fat
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button 
          variant="ghost" 
          icon={ArrowLeft} 
          onClick={() => navigate('/diet-plans')}
          className="mb-4"
        >
          Back to Diet Plans
        </Button>
        
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{dietPlan.name}</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(dietPlan.status)}`}>
                {dietPlan.status}
              </span>
            </div>
            <p className="text-gray-600 mb-4">{dietPlan.description}</p>
            <div className="flex items-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                {dietPlan.duration_weeks} weeks
              </div>
              <div className="flex items-center">
                <Flame className="w-4 h-4 mr-1" />
                {dietPlan.total_calories} calories/day
              </div>
              <div className="flex items-center">
                <Target className="w-4 h-4 mr-1" />
                Started {new Date(dietPlan.start_date).toLocaleDateString()}
              </div>
              {dietPlan.ai_generated && (
                <div className="flex items-center">
                  <Star className="w-4 h-4 mr-1" />
                  AI Generated
                </div>
              )}
            </div>
          </div>
          
          <div className="flex space-x-2">
            {dietPlan.status === 'active' ? (
              <Button variant="outline" icon={Pause} onClick={() => updatePlanStatus('paused')}>
                Pause Plan
              </Button>
            ) : dietPlan.status === 'paused' ? (
              <Button variant="outline" icon={Play} onClick={() => updatePlanStatus('active')}>
                Resume Plan
              </Button>
            ) : null}
            
            <Button variant="outline" icon={Edit}>
              Edit Plan
            </Button>
            
            <Button 
              variant="outline" 
              icon={Trash2}
              onClick={deletePlan}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              Delete
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Day Selector */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">Select Day</h2>
            </CardHeader>
            <CardBody className="p-0">
              <div className="space-y-0">
                {availableDays.map((day) => (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`w-full text-left px-6 py-4 border-b border-gray-100 last:border-b-0 transition-colors ${
                      selectedDay === day
                        ? 'bg-emerald-50 text-emerald-700 border-r-4 border-r-emerald-500'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium">Day {day}</div>
                    <div className="text-sm text-gray-500">{getDayName(day)}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {groupedMeals[day]?.length || 0} meals
                    </div>
                  </button>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Day Summary */}
          <Card className="mt-6">
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">
                Day {selectedDay} Summary
              </h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Calories</span>
                  <span className="font-medium text-gray-900">{dayTotals.calories}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Protein</span>
                  <span className="font-medium text-gray-900">{dayTotals.protein.toFixed(1)}g</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Carbs</span>
                  <span className="font-medium text-gray-900">{dayTotals.carbs.toFixed(1)}g</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Fat</span>
                  <span className="font-medium text-gray-900">{dayTotals.fat.toFixed(1)}g</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Meals</span>
                  <span className="font-medium text-gray-900">{selectedDayMeals.length}</span>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Meals for Selected Day */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-900">
                {getDayName(selectedDay)} - Day {selectedDay} Meals
              </h2>
            </CardHeader>
            <CardBody className="p-0">
              {selectedDayMeals.length > 0 ? (
                <div className="space-y-0">
                  {selectedDayMeals.map((meal, index) => (
                    <div key={meal.id} className="p-6 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {meal.recipe?.name || 'Meal'}
                            </h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getMealTypeColor(meal.meal_type)}`}>
                              {meal.meal_type}
                            </span>
                            <div className="flex items-center text-sm text-gray-500">
                              <Clock className="w-4 h-4 mr-1" />
                              {meal.meal_time}
                            </div>
                          </div>
                          
                          <p className="text-gray-600 mb-4">{meal.recipe?.description}</p>
                          
                          <div className="grid grid-cols-4 gap-6 mb-4">
                            <div className="text-center">
                              <p className="text-lg font-semibold text-gray-900">{meal.calories}</p>
                              <p className="text-sm text-gray-500">Calories</p>
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-semibold text-gray-900">{meal.protein}g</p>
                              <p className="text-sm text-gray-500">Protein</p>
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-semibold text-gray-900">{meal.carbs}g</p>
                              <p className="text-sm text-gray-500">Carbs</p>
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-semibold text-gray-900">{meal.fat}g</p>
                              <p className="text-sm text-gray-500">Fat</p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-6 text-sm text-gray-500 mb-4">
                            <div className="flex items-center">
                              <Timer className="w-4 h-4 mr-1" />
                              Prep: {meal.recipe?.prep_time || 0} min
                            </div>
                            <div className="flex items-center">
                              <ChefHat className="w-4 h-4 mr-1" />
                              Cook: {meal.recipe?.cook_time || 0} min
                            </div>
                            <div className="flex items-center">
                              <Users className="w-4 h-4 mr-1" />
                              Serves: {meal.recipe?.servings || 1}
                            </div>
                            <div className="flex items-center">
                              <Target className="w-4 h-4 mr-1" />
                              {meal.recipe?.difficulty || 'Easy'}
                            </div>
                          </div>

                          {meal.recipe?.tags && meal.recipe.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {meal.recipe.tags.map((tag, tagIndex) => (
                                <span key={tagIndex} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="ml-6 flex-shrink-0">
                          <img
                            src={meal.recipe?.image_url || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=300'}
                            alt={meal.recipe?.name || 'Meal'}
                            className="w-32 h-32 object-cover rounded-lg"
                          />
                        </div>
                      </div>

                      <div className="flex space-x-3 mt-4">
                        <Button 
                          variant="primary" 
                          size="sm" 
                          icon={Eye}
                          onClick={() => meal.recipe_id && viewRecipe(meal.recipe_id)}
                          disabled={!meal.recipe_id}
                        >
                          View Recipe
                        </Button>
                        <Button variant="outline" size="sm" icon={ChefHat}>
                          Start Cooking
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Utensils className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No meals for this day</h3>
                  <p className="text-gray-500">This day doesn't have any meals planned yet.</p>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}