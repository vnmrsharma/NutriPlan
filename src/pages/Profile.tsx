import React, { useState } from 'react'
import { Card, CardHeader, CardBody } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { User, Target, Heart, Utensils, Save } from 'lucide-react'

export const Profile: React.FC = () => {
  const [profile, setProfile] = useState({
    age: 28,
    gender: 'female',
    height: 165,
    weight: 68,
    targetWeight: 62,
    activityLevel: 'moderate',
    goal: 'weight-loss',
    medicalConditions: [''],
    allergies: ['nuts'],
    dietType: 'vegetarian',
    cuisinePreferences: ['italian', 'mediterranean', 'indian'],
    mealsPerDay: 5,
    waterGoal: 8
  })

  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setLoading(false)
    // Show success message
  }

  const handleInputChange = (field: string, value: any) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Profile Settings
        </h1>
        <p className="text-gray-600">
          Update your personal information to get more accurate diet plans
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold flex items-center">
              <User className="w-5 h-5 mr-2 text-emerald-500" />
              Personal Information
            </h2>
          </CardHeader>
          <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Age"
              type="number"
              value={profile.age}
              onChange={(e) => handleInputChange('age', parseInt(e.target.value))}
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gender
              </label>
              <select
                value={profile.gender}
                onChange={(e) => handleInputChange('gender', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
            </div>
            <Input
              label="Height (cm)"
              type="number"
              value={profile.height}
              onChange={(e) => handleInputChange('height', parseInt(e.target.value))}
              required
            />
            <Input
              label="Current Weight (kg)"
              type="number"
              value={profile.weight}
              onChange={(e) => handleInputChange('weight', parseInt(e.target.value))}
              required
            />
          </CardBody>
        </Card>

        {/* Goals & Preferences */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold flex items-center">
              <Target className="w-5 h-5 mr-2 text-emerald-500" />
              Goals & Activity
            </h2>
          </CardHeader>
          <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Target Weight (kg)"
              type="number"
              value={profile.targetWeight}
              onChange={(e) => handleInputChange('targetWeight', parseInt(e.target.value))}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Primary Goal
              </label>
              <select
                value={profile.goal}
                onChange={(e) => handleInputChange('goal', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="weight-loss">Weight Loss</option>
                <option value="muscle-gain">Muscle Gain</option>
                <option value="maintenance">Maintenance</option>
                <option value="health">General Health</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Activity Level
              </label>
              <select
                value={profile.activityLevel}
                onChange={(e) => handleInputChange('activityLevel', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="sedentary">Sedentary (Little to no exercise)</option>
                <option value="light">Light (1-3 days/week)</option>
                <option value="moderate">Moderate (3-5 days/week)</option>
                <option value="active">Active (6-7 days/week)</option>
                <option value="very-active">Very Active (2x/day or intense)</option>
              </select>
            </div>
            <Input
              label="Daily Water Goal (glasses)"
              type="number"
              value={profile.waterGoal}
              onChange={(e) => handleInputChange('waterGoal', parseInt(e.target.value))}
            />
          </CardBody>
        </Card>

        {/* Health Information */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold flex items-center">
              <Heart className="w-5 h-5 mr-2 text-emerald-500" />
              Health Information
            </h2>
          </CardHeader>
          <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Medical Conditions
              </label>
              <textarea
                value={profile.medicalConditions.join(', ')}
                onChange={(e) => handleInputChange('medicalConditions', e.target.value.split(', ').filter(Boolean))}
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
                value={profile.allergies.join(', ')}
                onChange={(e) => handleInputChange('allergies', e.target.value.split(', ').filter(Boolean))}
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="e.g., nuts, dairy, gluten"
              />
            </div>
          </CardBody>
        </Card>

        {/* Dietary Preferences */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold flex items-center">
              <Utensils className="w-5 h-5 mr-2 text-emerald-500" />
              Dietary Preferences
            </h2>
          </CardHeader>
          <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Diet Type
              </label>
              <select
                value={profile.dietType}
                onChange={(e) => handleInputChange('dietType', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="vegetarian">Vegetarian</option>
                <option value="vegan">Vegan</option>
                <option value="non-vegetarian">Non-Vegetarian</option>
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
              value={profile.mealsPerDay}
              onChange={(e) => handleInputChange('mealsPerDay', parseInt(e.target.value))}
            />
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cuisine Preferences
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                {['italian', 'mediterranean', 'indian', 'chinese', 'thai', 'mexican', 'american', 'japanese'].map((cuisine) => (
                  <label key={cuisine} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={profile.cuisinePreferences.includes(cuisine)}
                      onChange={(e) => {
                        const newPreferences = e.target.checked
                          ? [...profile.cuisinePreferences, cuisine]
                          : profile.cuisinePreferences.filter(c => c !== cuisine)
                        handleInputChange('cuisinePreferences', newPreferences)
                      }}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm text-gray-700 capitalize">{cuisine}</span>
                  </label>
                ))}
              </div>
            </div>
          </CardBody>
        </Card>

        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            icon={Save}
            className="px-8"
          >
            Save Profile
          </Button>
        </div>
      </form>
    </div>
  )
}