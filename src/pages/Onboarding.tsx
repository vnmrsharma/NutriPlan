import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardHeader, CardBody } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { profileAPI, preferencesAPI, UserProfile, UserPreferences } from '../lib/supabase'
import { 
  User, 
  Target, 
  Heart, 
  Utensils, 
  Clock,
  ChevronRight,
  ChevronLeft,
  CheckCircle
} from 'lucide-react'

interface OnboardingData {
  profile: Partial<UserProfile>
  preferences: Partial<UserPreferences>
}

export const Onboarding: React.FC = () => {
  const { user, checkProfile } = useAuth()
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [checkingProfile, setCheckingProfile] = useState(true)
  const [data, setData] = useState<OnboardingData>({
    profile: {
      user_id: user?.id || '',
      sleep_hours: 8,
      stress_level: 'moderate'
    },
    preferences: {
      user_id: user?.id || '',
      meals_per_day: 3,
      water_goal: 8,
      preferred_meal_times: {
        breakfast: '08:00',
        lunch: '13:00',
        dinner: '19:00'
      }
    }
  })

  const totalSteps = 5

  // Check if user already has a profile
  useEffect(() => {
    const checkExistingProfile = async () => {
      if (!user) return

      try {
        const existingProfile = await profileAPI.getProfile(user.id)
        if (existingProfile) {
          // User already has a profile, redirect to dashboard
          navigate('/dashboard')
          return
        }
      } catch (error) {
        // Profile doesn't exist, which is expected for onboarding
        console.log('No existing profile found, proceeding with onboarding')
      } finally {
        setCheckingProfile(false)
      }
    }

    checkExistingProfile()
  }, [user, navigate])

  const updateProfile = (updates: Partial<UserProfile>) => {
    setData(prev => ({
      ...prev,
      profile: { ...prev.profile, ...updates }
    }))
  }

  const updatePreferences = (updates: Partial<UserPreferences>) => {
    setData(prev => ({
      ...prev,
      preferences: { ...prev.preferences, ...updates }
    }))
  }

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Create user profile
      await profileAPI.createProfile({
        ...data.profile,
        user_id: user.id
      } as Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>)

      // Create user preferences
      await preferencesAPI.createPreferences({
        ...data.preferences,
        user_id: user.id
      } as Omit<UserPreferences, 'id' | 'created_at' | 'updated_at'>)

      // Update the auth context to reflect that user now has a profile
      await checkProfile()

      // Navigate to dashboard
      navigate('/dashboard')
    } catch (error) {
      console.error('Failed to save onboarding data:', error)
      alert('Failed to save your information. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Show loading while checking for existing profile
  if (checkingProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking your profile...</p>
        </div>
      </div>
    )
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <h2 className="text-2xl font-bold flex items-center">
                <User className="w-6 h-6 mr-3 text-emerald-500" />
                Personal Information
              </h2>
              <p className="text-gray-600">Tell us about yourself to create your personalized plan</p>
            </CardHeader>
            <CardBody className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Age"
                  type="number"
                  value={data.profile.age || ''}
                  onChange={(e) => updateProfile({ age: parseInt(e.target.value) })}
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender
                  </label>
                  <select
                    value={data.profile.gender || ''}
                    onChange={(e) => updateProfile({ gender: e.target.value as any })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <Input
                  label="Height (cm)"
                  type="number"
                  value={data.profile.height || ''}
                  onChange={(e) => updateProfile({ height: parseInt(e.target.value) })}
                  required
                />
                <Input
                  label="Current Weight (kg)"
                  type="number"
                  step="0.1"
                  value={data.profile.weight || ''}
                  onChange={(e) => updateProfile({ weight: parseFloat(e.target.value) })}
                  required
                />
                <Input
                  label="Target Weight (kg)"
                  type="number"
                  step="0.1"
                  value={data.profile.target_weight || ''}
                  onChange={(e) => updateProfile({ target_weight: parseFloat(e.target.value) })}
                  required
                />
                <Input
                  label="Timeline (weeks)"
                  type="number"
                  value={data.profile.timeline_weeks || ''}
                  onChange={(e) => updateProfile({ timeline_weeks: parseInt(e.target.value) })}
                  helpText="How many weeks to reach your goal?"
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
              <h2 className="text-2xl font-bold flex items-center">
                <Target className="w-6 h-6 mr-3 text-emerald-500" />
                Goals & Activity
              </h2>
              <p className="text-gray-600">Define your fitness goals and activity level</p>
            </CardHeader>
            <CardBody className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Primary Goal
                  </label>
                  <select
                    value={data.profile.goal || ''}
                    onChange={(e) => updateProfile({ goal: e.target.value as any })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  >
                    <option value="">Select your goal</option>
                    <option value="weight_loss">Weight Loss</option>
                    <option value="muscle_gain">Muscle Gain</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="health">General Health</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Activity Level
                  </label>
                  <select
                    value={data.profile.activity_level || ''}
                    onChange={(e) => updateProfile({ activity_level: e.target.value as any })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  >
                    <option value="">Select activity level</option>
                    <option value="sedentary">Sedentary (Little to no exercise)</option>
                    <option value="light">Light (1-3 days/week)</option>
                    <option value="moderate">Moderate (3-5 days/week)</option>
                    <option value="active">Active (6-7 days/week)</option>
                    <option value="very_active">Very Active (2x/day or intense)</option>
                  </select>
                </div>
                <Input
                  label="Sleep Hours per Night"
                  type="number"
                  min="4"
                  max="12"
                  value={data.profile.sleep_hours || 8}
                  onChange={(e) => updateProfile({ sleep_hours: parseInt(e.target.value) })}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stress Level
                  </label>
                  <select
                    value={data.profile.stress_level || 'moderate'}
                    onChange={(e) => updateProfile({ stress_level: e.target.value as any })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="low">Low</option>
                    <option value="moderate">Moderate</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
            </CardBody>
          </Card>
        )

      case 3:
        return (
          <Card>
            <CardHeader>
              <h2 className="text-2xl font-bold flex items-center">
                <Heart className="w-6 h-6 mr-3 text-emerald-500" />
                Health Information
              </h2>
              <p className="text-gray-600">Help us understand your health needs</p>
            </CardHeader>
            <CardBody className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Medical Conditions
                </label>
                <textarea
                  value={data.profile.medical_conditions?.join(', ') || ''}
                  onChange={(e) => updateProfile({ 
                    medical_conditions: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  })}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="e.g., diabetes, hypertension (leave blank if none)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Allergies
                </label>
                <textarea
                  value={data.profile.allergies?.join(', ') || ''}
                  onChange={(e) => updateProfile({ 
                    allergies: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  })}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="e.g., nuts, dairy, gluten"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Medications
                </label>
                <textarea
                  value={data.profile.medications?.join(', ') || ''}
                  onChange={(e) => updateProfile({ 
                    medications: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  })}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="List any medications you're currently taking"
                />
              </div>
            </CardBody>
          </Card>
        )

      case 4:
        return (
          <Card>
            <CardHeader>
              <h2 className="text-2xl font-bold flex items-center">
                <Utensils className="w-6 h-6 mr-3 text-emerald-500" />
                Dietary Preferences
              </h2>
              <p className="text-gray-600">Tell us about your food preferences</p>
            </CardHeader>
            <CardBody className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Diet Type
                  </label>
                  <select
                    value={data.preferences.diet_type || ''}
                    onChange={(e) => updatePreferences({ diet_type: e.target.value as any })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  >
                    <option value="">Select diet type</option>
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
                  value={data.preferences.meals_per_day || 3}
                  onChange={(e) => updatePreferences({ meals_per_day: parseInt(e.target.value) })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Cuisine Preferences
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['Italian', 'Mediterranean', 'Indian', 'Chinese', 'Thai', 'Mexican', 'American', 'Japanese'].map((cuisine) => (
                    <label key={cuisine} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={data.preferences.cuisine_preferences?.includes(cuisine.toLowerCase()) || false}
                        onChange={(e) => {
                          const current = data.preferences.cuisine_preferences || []
                          const newPreferences = e.target.checked
                            ? [...current, cuisine.toLowerCase()]
                            : current.filter(c => c !== cuisine.toLowerCase())
                          updatePreferences({ cuisine_preferences: newPreferences })
                        }}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-sm text-gray-700">{cuisine}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Taste Preferences
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['Spicy', 'Mild', 'Sweet', 'Savory', 'Tangy', 'Bitter'].map((taste) => (
                    <label key={taste} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={data.preferences.taste_preferences?.includes(taste.toLowerCase()) || false}
                        onChange={(e) => {
                          const current = data.preferences.taste_preferences || []
                          const newPreferences = e.target.checked
                            ? [...current, taste.toLowerCase()]
                            : current.filter(t => t !== taste.toLowerCase())
                          updatePreferences({ taste_preferences: newPreferences })
                        }}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-sm text-gray-700">{taste}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Food Restrictions
                </label>
                <textarea
                  value={data.preferences.food_restrictions?.join(', ') || ''}
                  onChange={(e) => updatePreferences({ 
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

      case 5:
        return (
          <Card>
            <CardHeader>
              <h2 className="text-2xl font-bold flex items-center">
                <Clock className="w-6 h-6 mr-3 text-emerald-500" />
                Meal Timing & Final Details
              </h2>
              <p className="text-gray-600">Set your preferred meal times and water goals</p>
            </CardHeader>
            <CardBody className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Input
                  label="Breakfast Time"
                  type="time"
                  value={data.preferences.preferred_meal_times?.breakfast || '08:00'}
                  onChange={(e) => updatePreferences({ 
                    preferred_meal_times: {
                      ...data.preferences.preferred_meal_times,
                      breakfast: e.target.value
                    }
                  })}
                />
                <Input
                  label="Lunch Time"
                  type="time"
                  value={data.preferences.preferred_meal_times?.lunch || '13:00'}
                  onChange={(e) => updatePreferences({ 
                    preferred_meal_times: {
                      ...data.preferences.preferred_meal_times,
                      lunch: e.target.value
                    }
                  })}
                />
                <Input
                  label="Dinner Time"
                  type="time"
                  value={data.preferences.preferred_meal_times?.dinner || '19:00'}
                  onChange={(e) => updatePreferences({ 
                    preferred_meal_times: {
                      ...data.preferences.preferred_meal_times,
                      dinner: e.target.value
                    }
                  })}
                />
              </div>

              <Input
                label="Daily Water Goal (glasses)"
                type="number"
                min="6"
                max="15"
                value={data.preferences.water_goal || 8}
                onChange={(e) => updatePreferences({ water_goal: parseInt(e.target.value) })}
                helpText="Recommended: 8 glasses per day"
              />

              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
                <div className="flex items-center mb-4">
                  <CheckCircle className="w-6 h-6 text-emerald-600 mr-3" />
                  <h3 className="text-lg font-semibold text-emerald-800">Ready to Start!</h3>
                </div>
                <p className="text-emerald-700 mb-4">
                  You're all set! We'll use this information to create your personalized diet plan using AI.
                </p>
                <ul className="text-sm text-emerald-600 space-y-1">
                  <li>• Personalized meal plans based on your goals</li>
                  <li>• Recipes tailored to your preferences</li>
                  <li>• Progress tracking and adjustments</li>
                  <li>• Smart cooking assistance</li>
                </ul>
              </div>
            </CardBody>
          </Card>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Complete Your Profile</h1>
            <span className="text-sm text-gray-500">Step {currentStep} of {totalSteps}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        {renderStep()}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            icon={ChevronLeft}
          >
            Previous
          </Button>

          {currentStep === totalSteps ? (
            <Button
              variant="primary"
              onClick={handleSubmit}
              loading={loading}
              icon={CheckCircle}
            >
              Complete Setup
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleNext}
              icon={ChevronRight}
            >
              Next
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}