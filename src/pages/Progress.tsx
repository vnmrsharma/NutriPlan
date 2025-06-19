import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardHeader, CardBody } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { progressAPI, profileAPI, ProgressEntry, UserProfile } from '../lib/supabase'
import { 
  TrendingUp, 
  Calendar, 
  Target, 
  Scale, 
  Plus,
  Award,
  BarChart3,
  Activity,
  Heart,
  AlertTriangle,
  CheckCircle,
  Info,
  AlertCircle
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export const Progress: React.FC = () => {
  const { user } = useAuth()
  const [showAddWeight, setShowAddWeight] = useState(false)
  const [newWeight, setNewWeight] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [progressEntries, setProgressEntries] = useState<ProgressEntry[]>([])
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [addingWeight, setAddingWeight] = useState(false)
  const [dateError, setDateError] = useState('')

  useEffect(() => {
    if (user) {
      loadProgressData()
    }
  }, [user])

  // Reset form when modal opens
  useEffect(() => {
    if (showAddWeight) {
      setNewWeight('')
      setSelectedDate(new Date().toISOString().split('T')[0])
      setDateError('')
    }
  }, [showAddWeight])

  const loadProgressData = async () => {
    if (!user) return

    try {
      setLoading(true)
      console.log('=== LOADING PROGRESS DATA ===')
      
      const [progress, profile] = await Promise.all([
        progressAPI.getUserProgress(user.id),
        profileAPI.getProfile(user.id)
      ])
      
      console.log('Progress entries loaded:', progress)
      console.log('User profile loaded:', profile)
      
      setProgressEntries(progress)
      setUserProfile(profile)
    } catch (error) {
      console.error('Failed to load progress data:', error)
    } finally {
      setLoading(false)
    }
  }

  const validateDate = (date: string) => {
    const selectedDateObj = new Date(date)
    const today = new Date()
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(today.getFullYear() - 1)

    // Check if date is in the future
    if (selectedDateObj > today) {
      return 'Cannot log weight for future dates'
    }

    // Check if date is too far in the past (more than 1 year)
    if (selectedDateObj < oneYearAgo) {
      return 'Cannot log weight for dates more than 1 year ago'
    }

    // Check if entry already exists for this date
    const existingEntry = progressEntries.find(entry => entry.date === date)
    if (existingEntry) {
      return `Weight already logged for ${new Date(date).toLocaleDateString()}. You can only log one weight entry per day.`
    }

    return ''
  }

  const handleDateChange = (date: string) => {
    setSelectedDate(date)
    const error = validateDate(date)
    setDateError(error)
  }

  const handleAddWeight = async () => {
    if (!newWeight || !user || !userProfile || !selectedDate) return

    // Final validation
    const dateValidationError = validateDate(selectedDate)
    if (dateValidationError) {
      setDateError(dateValidationError)
      return
    }

    try {
      setAddingWeight(true)
      console.log('=== ADDING NEW WEIGHT ENTRY ===')
      console.log('New weight:', newWeight)
      console.log('Selected date:', selectedDate)
      console.log('User ID:', user.id)
      
      // Add new progress entry with selected date
      const newEntry = await progressAPI.addProgressEntry({
        user_id: user.id,
        weight: parseFloat(newWeight),
        date: selectedDate
      })
      
      console.log('New progress entry created:', newEntry)
      
      // Update user profile with new current weight only if this is the most recent entry
      const isLatestEntry = !progressEntries.some(entry => new Date(entry.date) > new Date(selectedDate))
      
      if (isLatestEntry) {
        const updatedProfile = await profileAPI.updateProfile(user.id, {
          weight: parseFloat(newWeight)
        })
        console.log('Profile updated with new weight:', updatedProfile)
      }
      
      setNewWeight('')
      setSelectedDate(new Date().toISOString().split('T')[0])
      setDateError('')
      setShowAddWeight(false)
      
      // Reload data to get fresh calculations
      await loadProgressData()
      
    } catch (error) {
      console.error('Failed to add weight entry:', error)
      if (error instanceof Error && error.message.includes('duplicate')) {
        setDateError('A weight entry already exists for this date')
      } else {
        alert('Failed to add weight entry. Please try again.')
      }
    } finally {
      setAddingWeight(false)
    }
  }

  // Calculate BMI and get BMI category
  const calculateBMI = (weight: number, height: number) => {
    if (!weight || !height) return null
    return weight / Math.pow(height / 100, 2)
  }

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { category: 'Underweight', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: TrendingUp }
    if (bmi < 25) return { category: 'Normal', color: 'text-green-600', bgColor: 'bg-green-100', icon: CheckCircle }
    if (bmi < 30) return { category: 'Overweight', color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: AlertTriangle }
    return { category: 'Obese', color: 'text-red-600', bgColor: 'bg-red-100', icon: AlertTriangle }
  }

  const getBMIRecommendation = (bmi: number, goal: string) => {
    const category = getBMICategory(bmi)
    
    switch (category.category) {
      case 'Underweight':
        return 'Consider consulting a healthcare provider about healthy weight gain strategies.'
      case 'Normal':
        return goal === 'weight_loss' ? 'You\'re in a healthy range. Focus on maintaining or slight adjustments.' : 'Great! You\'re in the healthy BMI range.'
      case 'Overweight':
        return 'A modest weight loss of 5-10% can significantly improve your health.'
      case 'Obese':
        return 'Consider consulting a healthcare provider for a comprehensive weight management plan.'
      default:
        return 'Maintain a balanced diet and regular exercise routine.'
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // CORRECTED WEIGHT CALCULATIONS
  console.log('=== WEIGHT CALCULATION DEBUG ===')
  console.log('Progress entries count:', progressEntries.length)
  console.log('Progress entries:', progressEntries)
  console.log('User profile:', userProfile)

  // CRITICAL FIX: Current weight should be the LATEST progress entry weight
  // If no progress entries exist, fall back to profile weight
  const currentWeight = progressEntries.length > 0 ? progressEntries[0].weight : (userProfile?.weight || 0)
  
  // CRITICAL FIX: Starting weight should be the ORIGINAL profile weight
  // This represents the user's weight when they first created their profile
  const originalStartWeight = userProfile?.weight || 0
  
  // CRITICAL FIX: If we have progress entries, the starting weight should be the OLDEST entry
  // OR the original profile weight, whichever makes more sense
  let actualStartWeight = originalStartWeight
  
  // If we have multiple progress entries, we need to determine the true starting point
  if (progressEntries.length > 1) {
    // Get the oldest entry (last in array since sorted by date DESC)
    const oldestEntry = progressEntries[progressEntries.length - 1]
    // Use the oldest entry as the starting point for calculations
    actualStartWeight = oldestEntry.weight
  } else if (progressEntries.length === 1) {
    // If only one entry, use the original profile weight as start
    actualStartWeight = originalStartWeight
  }
  
  // Target weight from profile
  const targetWeight = userProfile?.target_weight || 0
  
  console.log('=== CALCULATED WEIGHTS ===')
  console.log('Current weight (latest entry):', currentWeight)
  console.log('Original profile weight:', originalStartWeight)
  console.log('Actual start weight for calculations:', actualStartWeight)
  console.log('Target weight:', targetWeight)
  
  // CORRECTED Weight change calculation
  // For the weight change display, we want to show change from the starting point
  const weightChange = currentWeight - actualStartWeight
  const weightChangeAbs = Math.abs(weightChange)
  const weightChangeDirection = weightChange < 0 ? 'lost' : weightChange > 0 ? 'gained' : 'no change'
  
  console.log('=== WEIGHT CHANGE CALCULATION ===')
  console.log('Weight change (current - start):', weightChange)
  console.log('Weight change absolute:', weightChangeAbs)
  console.log('Direction:', weightChangeDirection)
  
  // CORRECTED Progress percentage calculation
  let progressPercentage = 0
  if (targetWeight > 0 && actualStartWeight !== targetWeight) {
    if (userProfile?.goal === 'weight_loss') {
      // For weight loss: progress = (start - current) / (start - target) * 100
      const totalWeightToLose = actualStartWeight - targetWeight
      const weightLostSoFar = actualStartWeight - currentWeight
      progressPercentage = totalWeightToLose > 0 ? (weightLostSoFar / totalWeightToLose) * 100 : 0
    } else if (userProfile?.goal === 'muscle_gain') {
      // For muscle gain: progress = (current - start) / (target - start) * 100
      const totalWeightToGain = targetWeight - actualStartWeight
      const weightGainedSoFar = currentWeight - actualStartWeight
      progressPercentage = totalWeightToGain > 0 ? (weightGainedSoFar / totalWeightToGain) * 100 : 0
    } else {
      // For maintenance or other goals
      const totalDistance = Math.abs(actualStartWeight - targetWeight)
      const currentDistance = Math.abs(currentWeight - targetWeight)
      const progressDistance = totalDistance - currentDistance
      progressPercentage = totalDistance > 0 ? (progressDistance / totalDistance) * 100 : 0
    }
  }

  // Ensure progress percentage is between 0 and 100
  progressPercentage = Math.max(0, Math.min(100, progressPercentage))

  console.log('=== PROGRESS CALCULATION ===')
  console.log('Goal:', userProfile?.goal)
  console.log('Progress percentage:', progressPercentage)

  // Calculate BMI using current weight
  const currentBMI = userProfile?.height ? calculateBMI(currentWeight, userProfile.height) : null
  const bmiInfo = currentBMI ? getBMICategory(currentBMI) : null

  // Prepare chart data (reverse to show chronological order)
  const weightData = progressEntries
    .slice(0, 10)
    .reverse()
    .map(entry => ({
      date: entry.date,
      weight: entry.weight
    }))

  // Calculate real achievements based on actual data
  const calculateAchievements = () => {
    const achievements = []
    
    // First weight entry achievement
    if (progressEntries.length >= 1) {
      achievements.push({
        id: 1,
        title: 'Journey Started',
        description: 'Logged your first weight entry and started tracking progress',
        date: progressEntries[progressEntries.length - 1]?.date || new Date().toISOString().split('T')[0],
        icon: '🎯'
      })
    }

    // Weight loss milestone (only if actually lost weight and goal is weight loss)
    if (weightChange < 0 && userProfile?.goal === 'weight_loss') {
      achievements.push({
        id: 2,
        title: 'Weight Loss Milestone',
        description: `Lost ${weightChangeAbs.toFixed(1)}kg from your starting weight`,
        date: progressEntries[0]?.date || new Date().toISOString().split('T')[0],
        icon: '⚖️'
      })
    }

    // Weight gain milestone (if goal is muscle gain and weight increased)
    if (weightChange > 0 && userProfile?.goal === 'muscle_gain') {
      achievements.push({
        id: 7,
        title: 'Muscle Building Progress',
        description: `Gained ${weightChangeAbs.toFixed(1)}kg towards your muscle gain goal`,
        date: progressEntries[0]?.date || new Date().toISOString().split('T')[0],
        icon: '💪'
      })
    }

    // Consistency achievement (multiple entries)
    if (progressEntries.length >= 3) {
      achievements.push({
        id: 3,
        title: 'Consistency Champion',
        description: `${progressEntries.length} days of progress tracking - building healthy habits!`,
        date: progressEntries[2]?.date || new Date().toISOString().split('T')[0],
        icon: '🏆'
      })
    }

    // Weekly tracking achievement
    if (progressEntries.length >= 7) {
      achievements.push({
        id: 4,
        title: 'Week Warrior',
        description: 'Completed a full week of progress tracking',
        date: progressEntries[6]?.date || new Date().toISOString().split('T')[0],
        icon: '📅'
      })
    }

    // Goal progress achievement (if making good progress)
    if (progressPercentage >= 25 && progressPercentage < 100) {
      achievements.push({
        id: 5,
        title: 'Quarter Way There',
        description: `${Math.round(progressPercentage)}% progress towards your goal weight`,
        date: progressEntries[0]?.date || new Date().toISOString().split('T')[0],
        icon: '🎖️'
      })
    }

    // Goal achieved
    if (progressPercentage >= 100) {
      achievements.push({
        id: 6,
        title: 'Goal Achieved!',
        description: 'Congratulations! You\'ve reached your target weight',
        date: progressEntries[0]?.date || new Date().toISOString().split('T')[0],
        icon: '🏅'
      })
    }

    // BMI improvement achievement
    if (currentBMI && bmiInfo?.category === 'Normal' && progressEntries.length > 0) {
      achievements.push({
        id: 8,
        title: 'Healthy BMI Achieved',
        description: 'Your BMI is now in the healthy range!',
        date: progressEntries[0]?.date || new Date().toISOString().split('T')[0],
        icon: '❤️'
      })
    }

    return achievements
  }

  const achievements = calculateAchievements()

  // Get max date (today) and min date (1 year ago) for date input
  const today = new Date().toISOString().split('T')[0]
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
  const minDate = oneYearAgo.toISOString().split('T')[0]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Health Insights
        </h1>
        <p className="text-gray-600">
          Track your progress and celebrate your achievements on your health journey
        </p>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className={`bg-gradient-to-r ${
          weightChange === 0 ? 'from-gray-500 to-gray-600' :
          (weightChange < 0 && userProfile?.goal === 'weight_loss') || (weightChange > 0 && userProfile?.goal === 'muscle_gain') ? 'from-emerald-500 to-emerald-600' : 
          'from-blue-500 to-blue-600'
        } text-white`}>
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">Weight Change</p>
                <p className="text-2xl font-bold">
                  {weightChange === 0 ? '0.0 kg' : 
                   weightChange < 0 ? `-${weightChangeAbs.toFixed(1)} kg` : 
                   `+${weightChangeAbs.toFixed(1)} kg`}
                </p>
                <p className="text-white/80 text-xs capitalize">
                  {weightChange === 0 ? 'No change' : `${weightChangeAbs.toFixed(1)}kg ${weightChangeDirection}`}
                </p>
              </div>
              <Scale className="w-8 h-8 text-white/80" />
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Current Weight</p>
                <p className="text-2xl font-bold">{currentWeight.toFixed(1)} kg</p>
                <p className="text-blue-100 text-xs">
                  {progressEntries.length > 0 ? 'Latest entry' : 'From profile'}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-100" />
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Goal Progress</p>
                <p className="text-2xl font-bold">{Math.round(progressPercentage)}%</p>
                <p className="text-purple-100 text-xs">
                  {targetWeight ? `Target: ${targetWeight}kg` : 'Set target weight'}
                </p>
              </div>
              <Target className="w-8 h-8 text-purple-100" />
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Tracking Days</p>
                <p className="text-2xl font-bold">{progressEntries.length}</p>
                <p className="text-orange-100 text-xs">
                  {progressEntries.length > 0 ? 'Entries logged' : 'Start tracking'}
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-orange-100" />
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Weight Progress Chart */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-emerald-500" />
                  Weight Tracking
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  icon={Plus}
                  onClick={() => setShowAddWeight(true)}
                >
                  Log Weight
                </Button>
              </div>
            </CardHeader>
            <CardBody>
              {weightData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weightData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        domain={['dataMin - 1', 'dataMax + 1']}
                      />
                      <Tooltip 
                        formatter={(value) => [`${value} kg`, 'Weight']}
                        labelFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="weight" 
                        stroke="#10b981" 
                        strokeWidth={3}
                        dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Scale className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Start Your Weight Journey</h3>
                  <p className="text-gray-500 mb-6">Log your first weight entry to begin tracking your progress</p>
                  <Button variant="primary" icon={Plus} onClick={() => setShowAddWeight(true)}>
                    Log Your Weight
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* BMI Indicator */}
          {currentBMI && bmiInfo && userProfile && (
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold flex items-center">
                  <Heart className="w-5 h-5 mr-2 text-emerald-500" />
                  BMI Analysis
                </h2>
              </CardHeader>
              <CardBody>
                <div className="text-center mb-6">
                  <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${bmiInfo.bgColor} mb-4`}>
                    <bmiInfo.icon className={`w-8 h-8 ${bmiInfo.color}`} />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {currentBMI.toFixed(1)}
                  </div>
                  <div className={`text-lg font-semibold ${bmiInfo.color} mb-2`}>
                    {bmiInfo.category}
                  </div>
                  <div className="text-sm text-gray-500">
                    Body Mass Index
                  </div>
                </div>

                {/* BMI Scale */}
                <div className="mb-6">
                  <div className="text-sm font-medium text-gray-700 mb-2">BMI Scale</div>
                  <div className="relative">
                    <div className="flex h-4 rounded-full overflow-hidden">
                      <div className="bg-blue-400 flex-1"></div>
                      <div className="bg-green-400 flex-1"></div>
                      <div className="bg-yellow-400 flex-1"></div>
                      <div className="bg-red-400 flex-1"></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>18.5</span>
                      <span>25</span>
                      <span>30</span>
                      <span>35+</span>
                    </div>
                    {/* BMI Indicator */}
                    <div 
                      className="absolute top-0 w-1 h-4 bg-gray-800 rounded"
                      style={{ 
                        left: `${Math.min(Math.max((currentBMI - 15) / 25 * 100, 0), 100)}%`,
                        transform: 'translateX(-50%)'
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-2">
                    <span>Under</span>
                    <span>Normal</span>
                    <span>Over</span>
                    <span>Obese</span>
                  </div>
                </div>

                {/* BMI Recommendation */}
                <div className={`p-4 rounded-lg ${bmiInfo.bgColor} border border-opacity-20`}>
                  <div className="flex items-start space-x-2">
                    <Info className={`w-4 h-4 ${bmiInfo.color} mt-0.5 flex-shrink-0`} />
                    <div>
                      <div className={`text-sm font-medium ${bmiInfo.color} mb-1`}>
                        Recommendation
                      </div>
                      <div className={`text-sm ${bmiInfo.color.replace('600', '700')}`}>
                        {getBMIRecommendation(currentBMI, userProfile.goal || '')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* BMI Details */}
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Height:</span>
                    <span className="font-medium">{userProfile.height} cm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Weight:</span>
                    <span className="font-medium">{currentWeight.toFixed(1)} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Healthy Range:</span>
                    <span className="font-medium text-green-600">
                      {(18.5 * Math.pow(userProfile.height / 100, 2)).toFixed(1)} - {(24.9 * Math.pow(userProfile.height / 100, 2)).toFixed(1)} kg
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Achievements */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold flex items-center">
                <Award className="w-5 h-5 mr-2 text-emerald-500" />
                Your Achievements
              </h2>
            </CardHeader>
            <CardBody className="p-0">
              {achievements.length > 0 ? (
                <div className="space-y-0">
                  {achievements.map((achievement) => (
                    <div key={achievement.id} className="flex items-center space-x-4 p-4 border-b border-gray-100 last:border-b-0">
                      <div className="text-2xl">{achievement.icon}</div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{achievement.title}</h3>
                        <p className="text-sm text-gray-500">{achievement.description}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(achievement.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Award className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <h3 className="font-medium text-gray-900 mb-2">No Achievements Yet</h3>
                  <p className="text-sm text-gray-500">Start tracking your weight to unlock achievements!</p>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Goal Summary */}
          {userProfile && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Target className="w-5 h-5 mr-2 text-emerald-500" />
                  Goal Summary
                </h2>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Starting Weight</span>
                  <span className="font-medium">{actualStartWeight.toFixed(1)} kg</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Current Weight</span>
                  <span className="font-medium">{currentWeight.toFixed(1)} kg</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Target Weight</span>
                  <span className="font-medium">{userProfile.target_weight.toFixed(1)} kg</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Remaining</span>
                  <span className="font-medium text-emerald-600">
                    {Math.abs(currentWeight - userProfile.target_weight).toFixed(1)} kg
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Timeline</span>
                  <span className="font-medium">{userProfile.timeline_weeks} weeks</span>
                </div>
                
                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Progress</span>
                    <span>{Math.round(progressPercentage)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Health Metrics */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-emerald-500" />
                Health Metrics
              </h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Goal</span>
                <span className="font-medium capitalize">
                  {userProfile?.goal?.replace('_', ' ') || '--'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Activity Level</span>
                <span className="font-medium capitalize">
                  {userProfile?.activity_level?.replace('_', ' ') || '--'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Entries This Month</span>
                <span className="font-medium">
                  {progressEntries.filter(entry => {
                    const entryDate = new Date(entry.date)
                    const now = new Date()
                    return entryDate.getMonth() === now.getMonth() && 
                           entryDate.getFullYear() === now.getFullYear()
                  }).length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Entries</span>
                <span className="font-medium">{progressEntries.length}</span>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Enhanced Add Weight Modal */}
      {showAddWeight && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                <Scale className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Log Your Weight</h3>
                <p className="text-sm text-gray-500">Track your progress with a new weight entry</p>
              </div>
            </div>

            <div className="space-y-4">
              <Input
                label="Date"
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                min={minDate}
                max={today}
                error={dateError}
                helpText="Select the date for this weight entry"
              />

              <Input
                label="Weight (kg)"
                type="number"
                step="0.1"
                min="30"
                max="300"
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                placeholder="Enter your weight"
                error={!newWeight && newWeight !== '' ? 'Weight is required' : ''}
                helpText="Enter your weight in kilograms"
              />

              {/* Date validation warning */}
              {dateError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-red-700 text-sm">{dateError}</p>
                  </div>
                </div>
              )}

              {/* Info about single entry per date */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="text-blue-700 text-sm">
                    <p className="font-medium mb-1">One entry per date</p>
                    <p>You can only log one weight entry per day. Choose your date carefully.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowAddWeight(false)}
                disabled={addingWeight}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleAddWeight}
                disabled={!newWeight || !!dateError || addingWeight}
                loading={addingWeight}
                icon={addingWeight ? undefined : Scale}
              >
                {addingWeight ? 'Logging...' : 'Log Weight'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}