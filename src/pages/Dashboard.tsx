import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardHeader, CardBody } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { 
  Calendar, 
  Target, 
  BarChart3, 
  ChefHat, 
  Clock, 
  Flame,
  Droplets,
  Activity,
  Plus,
  Eye,
  Check,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Users,
  Star,
  Zap
} from 'lucide-react'
import { 
  dietPlanAPI, 
  progressAPI, 
  waterAPI, 
  mealLogAPI,
  DietPlan, 
  ProgressEntry, 
  WaterIntake,
  Meal,
  MealLog
} from '../lib/supabase'

export const Dashboard: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [dietPlans, setDietPlans] = useState<DietPlan[]>([])
  const [todayMeals, setTodayMeals] = useState<Meal[]>([])
  const [mealLogs, setMealLogs] = useState<MealLog[]>([])
  const [recentProgress, setRecentProgress] = useState<ProgressEntry[]>([])
  const [waterIntake, setWaterIntake] = useState<WaterIntake | null>(null)
  const [loading, setLoading] = useState(true)
  const [consumingMealId, setConsumingMealId] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user])

  const loadDashboardData = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      // Load user's diet plans
      const plans = await dietPlanAPI.getUserDietPlans(user.id)
      setDietPlans(plans)

      // Load today's meals from active plan
      if (plans.length > 0) {
        const activePlan = plans.find(p => p.status === 'active') || plans[0]
        const meals = await dietPlanAPI.getDietPlanMeals(activePlan.id)
        
        // Get current day of week (1 = Monday, 7 = Sunday)
        const today = new Date()
        const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay() // Convert Sunday from 0 to 7
        
        // Filter meals for today's day of the week
        const todaysMeals = meals.filter(meal => meal.day_number === dayOfWeek)
        setTodayMeals(todaysMeals)
      }

      // Load today's meal logs
      const logs = await mealLogAPI.getTodayMealLogs(user.id)
      setMealLogs(logs)

      // Load recent progress
      const progress = await progressAPI.getUserProgress(user.id)
      setRecentProgress(progress.slice(0, 5))

      // Load today's water intake
      const water = await waterAPI.getTodayWaterIntake(user.id)
      setWaterIntake(water)

    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateWaterIntake = async (glasses: number) => {
    if (!user) return

    try {
      const updated = await waterAPI.updateWaterIntake(user.id, glasses)
      setWaterIntake(updated)
    } catch (error) {
      console.error('Failed to update water intake:', error)
    }
  }

  const toggleMealConsumption = async (mealId: string, currentlyConsumed: boolean) => {
    if (!user) return

    try {
      setConsumingMealId(mealId)
      
      const newConsumedState = !currentlyConsumed
      await mealLogAPI.logMealConsumption(user.id, mealId, newConsumedState, 1.0)
      
      // Reload meal logs to update the UI
      const updatedLogs = await mealLogAPI.getTodayMealLogs(user.id)
      setMealLogs(updatedLogs)
      
    } catch (error) {
      console.error('Failed to update meal consumption:', error)
      alert('Failed to update meal status. Please try again.')
    } finally {
      setConsumingMealId(null)
    }
  }

  const getMealConsumptionStatus = (mealId: string) => {
    const log = mealLogs.find(log => log.meal_id === mealId)
    return log?.consumed || false
  }

  const viewRecipe = (recipeId: string) => {
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

  const isUpcomingMeal = (mealTime: string) => {
    const now = new Date()
    const currentTime = now.getHours() * 60 + now.getMinutes()
    const [hours, minutes] = mealTime.split(':').map(Number)
    const mealTimeMinutes = hours * 60 + minutes
    
    // Consider a meal "upcoming" if it's within the next 2 hours and hasn't been consumed
    return mealTimeMinutes > currentTime && mealTimeMinutes <= currentTime + 120
  }

  const navigateToDietPlans = () => {
    navigate('/diet-plans')
  }

  const navigateToRecipes = () => {
    navigate('/recipes')
  }

  const navigateToInsights = () => {
    navigate('/insights')
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Calculate stats
  const activePlan = dietPlans.find(p => p.status === 'active')
  const consumedMeals = mealLogs.filter(log => log.consumed)
  const consumedCalories = consumedMeals.reduce((sum, log) => {
    return sum + (log.meal?.calories || 0) * log.portion_consumed
  }, 0)
  const targetCalories = activePlan?.total_calories || 2000
  const currentWeight = recentProgress[0]?.weight || 0
  const waterGoal = waterIntake?.goal_glasses || 8
  const waterConsumed = waterIntake?.glasses_consumed || 0

  const calorieProgress = targetCalories > 0 ? (consumedCalories / targetCalories) * 100 : 0
  const waterProgress = (waterConsumed / waterGoal) * 100

  const getCurrentDate = () => {
    const today = new Date()
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }
    return today.toLocaleDateString('en-US', options)
  }

  const getDayName = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    return days[new Date().getDay()]
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Welcome back! 👋
            </h1>
            <p className="text-gray-600 text-lg">
              {activePlan ? `Here's your meal plan for ${getCurrentDate()}. Keep up the great work!` : "Ready to start your health journey? Let's create your first diet plan!"}
            </p>
          </div>
          
          {/* Quick Action */}
          {!activePlan && (
            <div className="hidden md:block">
              <Button 
                variant="primary" 
                icon={Plus}
                onClick={navigateToDietPlans}
                className="px-6 py-3"
              >
                Create Diet Plan
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:shadow-xl transition-shadow">
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">Calories Today</p>
                <p className="text-3xl font-bold">{Math.round(consumedCalories)}</p>
                <p className="text-emerald-100 text-sm">of {targetCalories} goal</p>
              </div>
              <div className="bg-white/20 p-3 rounded-full">
                <Flame className="w-8 h-8" />
              </div>
            </div>
            <div className="mt-4 bg-white/20 rounded-full h-2">
              <div 
                className="bg-white h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(calorieProgress, 100)}%` }}
              />
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-xl transition-shadow">
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Water Intake</p>
                <p className="text-3xl font-bold">{waterConsumed}</p>
                <p className="text-blue-100 text-sm">of {waterGoal} glasses</p>
              </div>
              <div className="bg-white/20 p-3 rounded-full">
                <Droplets className="w-8 h-8" />
              </div>
            </div>
            <div className="mt-4 bg-white/20 rounded-full h-2">
              <div 
                className="bg-white h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(waterProgress, 100)}%` }}
              />
            </div>
            <div className="mt-3 flex space-x-1">
              {[...Array(waterGoal)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => updateWaterIntake(i + 1)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    i < waterConsumed ? 'bg-white' : 'bg-white/30'
                  }`}
                />
              ))}
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:shadow-xl transition-shadow">
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Current Weight</p>
                <p className="text-3xl font-bold">{currentWeight || '--'}</p>
                <p className="text-purple-100 text-sm">kg</p>
              </div>
              <div className="bg-white/20 p-3 rounded-full">
                <Activity className="w-8 h-8" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Today's Meals */}
        <div className="lg:col-span-2">
          <Card className="shadow-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold flex items-center">
                    <Clock className="w-6 h-6 mr-3 text-emerald-500" />
                    Today's Meals
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">{getCurrentDate()}</p>
                </div>
                {activePlan && (
                  <Button variant="outline" size="sm" icon={Eye} onClick={navigateToDietPlans}>
                    View Full Plan
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardBody className="p-0">
              {todayMeals.length > 0 ? (
                <div className="space-y-0">
                  {todayMeals
                    .sort((a, b) => a.meal_time.localeCompare(b.meal_time))
                    .map((meal, index) => {
                      const isConsumed = getMealConsumptionStatus(meal.id)
                      const isUpcoming = isUpcomingMeal(meal.meal_time) && !isConsumed
                      const isLoading = consumingMealId === meal.id
                      
                      return (
                        <div 
                          key={meal.id} 
                          className={`flex items-center justify-between p-6 border-b border-gray-100 last:border-b-0 transition-all duration-200 ${
                            isUpcoming ? 'bg-emerald-50 border-l-4 border-l-emerald-500' : 
                            isConsumed ? 'bg-gray-50' : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center space-x-4">
                            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                              isConsumed ? 'bg-green-100' : 'bg-gradient-to-r from-emerald-100 to-blue-100'
                            }`}>
                              {isConsumed ? (
                                <CheckCircle2 className="w-7 h-7 text-green-600" />
                              ) : (
                                <ChefHat className="w-7 h-7 text-emerald-600" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <h3 className={`font-semibold text-lg ${isConsumed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                                  {meal.recipe?.name || 'Meal'}
                                </h3>
                                {isUpcoming && (
                                  <span className="flex items-center text-xs text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    Upcoming
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mb-1">{meal.meal_time} • {meal.calories} calories</p>
                              <p className="text-xs text-gray-500">
                                {meal.protein}g protein • {meal.carbs}g carbs • {meal.fat}g fat
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getMealTypeColor(meal.meal_type)}`}>
                              {meal.meal_type}
                            </span>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              icon={Eye}
                              onClick={() => meal.recipe_id && viewRecipe(meal.recipe_id)}
                              disabled={!meal.recipe_id}
                            >
                              Recipe
                            </Button>
                            <Button 
                              variant={isConsumed ? "outline" : "primary"}
                              size="sm" 
                              icon={isLoading ? undefined : (isConsumed ? CheckCircle2 : Check)}
                              onClick={() => toggleMealConsumption(meal.id, isConsumed)}
                              disabled={isLoading}
                              className={isConsumed ? "text-green-600 border-green-300" : ""}
                            >
                              {isLoading ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                isConsumed ? 'Done' : 'Mark Done'
                              )}
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                </div>
              ) : (
                <div className="text-center py-16">
                  <ChefHat className="w-20 h-20 mx-auto text-gray-300 mb-6" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">No meals planned for today</h3>
                  <p className="text-gray-500 mb-8 max-w-md mx-auto">
                    {activePlan 
                      ? "Your meal plan might not have meals for today's day of the week" 
                      : "Create your first diet plan to get started with personalized meal recommendations"
                    }
                  </p>
                  <Button variant="primary" icon={Plus} onClick={navigateToDietPlans} className="px-8 py-3">
                    {activePlan ? 'View Diet Plan' : 'Generate Diet Plan'}
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="shadow-lg">
            <CardHeader>
              <h2 className="text-xl font-semibold flex items-center">
                <Zap className="w-5 h-5 mr-2 text-emerald-500" />
                Quick Actions
              </h2>
            </CardHeader>
            <CardBody className="space-y-3">
              <Button variant="primary" className="w-full" icon={Calendar} onClick={navigateToDietPlans}>
                Generate New Plan
              </Button>
              <Button variant="outline" className="w-full" icon={ChefHat} onClick={navigateToRecipes}>
                Browse Recipes
              </Button>
              <Button variant="outline" className="w-full" icon={BarChart3} onClick={navigateToInsights}>
                View Insights
              </Button>
            </CardBody>
          </Card>

          {/* Today's Progress Summary */}
          <Card className="shadow-lg">
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Target className="w-5 h-5 mr-2 text-emerald-500" />
                Today's Progress
              </h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Meals Completed</span>
                  <span className="font-semibold text-gray-900">
                    {consumedMeals.length} / {todayMeals.length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Calories Consumed</span>
                  <span className="font-semibold text-gray-900">{Math.round(consumedCalories)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Remaining Calories</span>
                  <span className="font-semibold text-emerald-600">
                    {Math.max(0, targetCalories - consumedCalories).toFixed(0)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-emerald-500 to-blue-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(calorieProgress, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 text-center">
                  {calorieProgress.toFixed(0)}% of daily goal achieved
                </p>
              </div>
            </CardBody>
          </Card>

          {/* Recent Progress */}
          {recentProgress.length > 0 && (
            <Card className="shadow-lg">
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-emerald-500" />
                  Recent Progress
                </h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  {recentProgress.slice(0, 3).map((entry) => (
                    <div key={entry.id} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        {new Date(entry.date).toLocaleDateString()}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {entry.weight} kg
                      </span>
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" className="w-full mt-4" onClick={navigateToInsights}>
                  View All Progress
                </Button>
              </CardBody>
            </Card>
          )}

          {/* Active Plan Info */}
          {activePlan && (
            <Card className="shadow-lg">
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Star className="w-5 h-5 mr-2 text-emerald-500" />
                  Active Plan
                </h2>
              </CardHeader>
              <CardBody>
                <h3 className="font-semibold text-gray-900 mb-2">{activePlan.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{activePlan.description}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration</span>
                    <span className="font-medium">{activePlan.duration_weeks} weeks</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Daily Calories</span>
                    <span className="font-medium">{activePlan.total_calories}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status</span>
                    <span className="font-medium text-green-600 capitalize">{activePlan.status}</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-4" icon={Eye} onClick={navigateToDietPlans}>
                  View Details
                </Button>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}