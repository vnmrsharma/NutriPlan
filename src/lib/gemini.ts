// Gemini AI Integration for Diet Planning
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'demo-key'
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent'

export interface DietPlanRequest {
  userProfile: {
    age: number
    gender: string
    height: number
    weight: number
    targetWeight: number
    activityLevel: string
    goal: string
    medicalConditions: string[]
    allergies: string[]
    timelineWeeks: number
  }
  preferences: {
    dietType: string
    cuisinePreferences: string[]
    tastePreferences: string[]
    foodRestrictions: string[]
    mealsPerDay: number
    preferredMealTimes: Record<string, string>
  }
}

export interface GeneratedMeal {
  name: string
  description: string
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  mealTime: string
  calories: number
  protein: number
  carbs: number
  fat: number
  ingredients: Array<{
    name: string
    amount: string
    unit: string
  }>
  instructions: Array<{
    step: number
    instruction: string
  }>
  prepTime: number
  cookTime: number
  difficulty: 'easy' | 'medium' | 'hard'
  tags: string[]
  cuisineType: string
}

export interface GeneratedDietPlan {
  name: string
  description: string
  totalCalories: number
  durationWeeks: number
  meals: Array<{
    dayNumber: number
    dayName: string
    totalDayCalories: number
    meals: GeneratedMeal[]
  }>
}

export interface DetailedRecipeResponse {
  detailed_instructions: Array<{
    step: number
    instruction: string
    tips?: string
    time_estimate?: number
  }>
  nutritional_benefits: string[]
  cooking_tips: string[]
  storage_instructions: string
  variations: string[]
  personalized_benefits: string[]
  health_score: number
}

class GeminiAPI {
  private async makeRequest(prompt: string): Promise<any> {
    // Check if we have a valid API key
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'demo-key') {
      console.warn('=== NO VALID GEMINI API KEY ===')
      console.warn('API Key:', GEMINI_API_KEY)
      console.warn('Using fallback plan generation')
      throw new Error('API_KEY_MISSING')
    }

    try {
      console.log('=== MAKING GEMINI API REQUEST ===')
      console.log('API URL:', GEMINI_API_URL)
      console.log('API Key (first 10 chars):', GEMINI_API_KEY.substring(0, 10) + '...')
      console.log('Prompt length:', prompt.length)
      
      const requestBody = {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.1, // Very low temperature for consistent JSON
          topK: 1,
          topP: 0.1,
          maxOutputTokens: 8192,
          candidateCount: 1
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_NONE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH", 
            threshold: "BLOCK_NONE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_NONE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_NONE"
          }
        ]
      }

      console.log('Request body prepared, making API call...')
      
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      console.log('Response received, status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('=== GEMINI API ERROR ===')
        console.error('Status:', response.status)
        console.error('Error response:', errorText)
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log('Response parsed successfully')
      
      // Robust checks for the expected response structure
      if (!data || !data.candidates || !Array.isArray(data.candidates) || data.candidates.length === 0) {
        console.error('=== INVALID API RESPONSE STRUCTURE ===')
        console.error('Full response:', JSON.stringify(data, null, 2))
        throw new Error('Unexpected response format: missing candidates array')
      }

      const candidate = data.candidates[0]
      if (!candidate || !candidate.content || !candidate.content.parts || !Array.isArray(candidate.content.parts) || candidate.content.parts.length === 0) {
        console.error('=== INVALID CANDIDATE STRUCTURE ===')
        console.error('Candidate:', JSON.stringify(candidate, null, 2))
        throw new Error('Unexpected response format: missing content or parts')
      }

      const part = candidate.content.parts[0]
      if (!part || typeof part.text !== 'string') {
        console.error('=== INVALID PART STRUCTURE ===')
        console.error('Part:', JSON.stringify(part, null, 2))
        throw new Error('Unexpected response format: missing or invalid text content')
      }

      console.log('Raw response text length:', part.text.length)
      console.log('=== API REQUEST SUCCESSFUL ===')
      
      return part.text
    } catch (error) {
      console.error('=== GEMINI API REQUEST FAILED ===')
      console.error('Error type:', typeof error)
      console.error('Error message:', error instanceof Error ? error.message : String(error))
      
      if (error instanceof Error) {
        if (error.message === 'API_KEY_MISSING') {
          throw error
        }
        if (error.message.includes('Unexpected response format')) {
          throw error
        }
      }
      throw new Error('Failed to generate content with AI')
    }
  }

  private extractJsonFromText(text: string): string {
    console.log('=== EXTRACTING JSON FROM TEXT ===')
    console.log('Input text length:', text.length)
    
    // Strategy 1: Look for complete JSON object with proper brace matching
    let braceCount = 0
    let startIndex = -1
    let endIndex = -1
    let inString = false
    let escapeNext = false
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i]
      
      if (escapeNext) {
        escapeNext = false
        continue
      }
      
      if (char === '\\') {
        escapeNext = true
        continue
      }
      
      if (char === '"' && !escapeNext) {
        inString = !inString
        continue
      }
      
      if (!inString) {
        if (char === '{') {
          if (braceCount === 0) {
            startIndex = i
          }
          braceCount++
        } else if (char === '}') {
          braceCount--
          if (braceCount === 0 && startIndex !== -1) {
            endIndex = i
            break
          }
        }
      }
    }
    
    if (startIndex !== -1 && endIndex !== -1) {
      const extractedJson = text.substring(startIndex, endIndex + 1)
      console.log('Successfully extracted JSON using brace matching')
      console.log('Extracted JSON length:', extractedJson.length)
      return extractedJson
    }
    
    // Strategy 2: Fallback to simple boundary detection
    const jsonStart = text.indexOf('{')
    const jsonEnd = text.lastIndexOf('}')
    
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonStart < jsonEnd) {
      const extractedJson = text.substring(jsonStart, jsonEnd + 1)
      console.log('Fallback extraction using simple boundaries')
      console.log('Extracted JSON length:', extractedJson.length)
      return extractedJson
    }
    
    console.log('No valid JSON boundaries found, returning original text')
    return text
  }

  private cleanJsonResponse(response: string): string {
    console.log('=== CLEANING JSON RESPONSE ===')
    console.log('Original response length:', response.length)
    
    let cleanedResponse = response.trim()
    
    // Remove markdown formatting
    if (cleanedResponse.startsWith('```json')) {
      console.log('Removing ```json markdown')
      cleanedResponse = cleanedResponse.replace(/```json\s*/, '').replace(/\s*```$/, '')
    } else if (cleanedResponse.startsWith('```')) {
      console.log('Removing ``` markdown')
      cleanedResponse = cleanedResponse.replace(/```\s*/, '').replace(/\s*```$/, '')
    }

    // Extract JSON from the text
    cleanedResponse = this.extractJsonFromText(cleanedResponse)

    // Remove comments and fix common JSON issues
    cleanedResponse = cleanedResponse
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove C-style comments
      .replace(/\/\/.*$/gm, '') // Remove single-line comments
      .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
      .trim()

    console.log('Cleaned response length:', cleanedResponse.length)
    console.log('=== CLEANING COMPLETE ===')
    
    return cleanedResponse
  }

  private validateAndParseJson(jsonString: string): any {
    console.log('=== VALIDATING AND PARSING JSON ===')
    console.log('JSON string length:', jsonString.length)
    
    try {
      // First attempt: direct parsing
      const parsed = JSON.parse(jsonString)
      console.log('✅ Direct JSON parsing successful')
      console.log('Parsed object keys:', Object.keys(parsed))
      return parsed
    } catch (directError) {
      console.log('❌ Direct parsing failed:', directError.message)
      
      // Second attempt: try to fix common JSON issues
      let fixedJson = jsonString
      
      try {
        // More aggressive JSON fixing
        console.log('Attempting to fix JSON...')
        
        // Ensure we have proper object boundaries
        if (!fixedJson.startsWith('{')) {
          const firstBrace = fixedJson.indexOf('{')
          if (firstBrace > 0) {
            fixedJson = fixedJson.substring(firstBrace)
          }
        }
        
        if (!fixedJson.endsWith('}')) {
          const lastBrace = fixedJson.lastIndexOf('}')
          if (lastBrace !== -1) {
            fixedJson = fixedJson.substring(0, lastBrace + 1)
          }
        }
        
        // Fix incomplete structures
        if (fixedJson.endsWith(',')) {
          fixedJson = fixedJson.slice(0, -1)
        }
        
        // Try to balance braces
        const openBraces = (fixedJson.match(/\{/g) || []).length
        const closeBraces = (fixedJson.match(/\}/g) || []).length
        
        if (openBraces > closeBraces) {
          fixedJson += '}'.repeat(openBraces - closeBraces)
          console.log(`Added ${openBraces - closeBraces} closing braces`)
        }
        
        // Try to balance brackets
        const openBrackets = (fixedJson.match(/\[/g) || []).length
        const closeBrackets = (fixedJson.match(/\]/g) || []).length
        
        if (openBrackets > closeBrackets) {
          fixedJson += ']'.repeat(openBrackets - closeBrackets)
          console.log(`Added ${openBrackets - closeBrackets} closing brackets`)
        }
        
        console.log('Attempting to parse fixed JSON...')
        const parsed = JSON.parse(fixedJson)
        console.log('✅ Fixed JSON parsing successful')
        console.log('Parsed object keys:', Object.keys(parsed))
        return parsed
      } catch (fixedError) {
        console.log('❌ Fixed parsing also failed:', fixedError.message)
        
        // Log the problematic JSON for debugging
        console.log('=== PROBLEMATIC JSON ===')
        console.log('Fixed JSON length:', fixedJson.length)
        console.log('Fixed JSON content:', fixedJson)
        console.log('=== END PROBLEMATIC JSON ===')
        
        // Throw the original error with more context
        throw new Error(`JSON parsing failed: ${directError.message}`)
      }
    }
  }

  async generateDietPlan(request: DietPlanRequest): Promise<GeneratedDietPlan> {
    const { userProfile, preferences } = request

    console.log('=== STARTING DIET PLAN GENERATION ===')
    console.log('User profile:', JSON.stringify(userProfile, null, 2))
    console.log('Preferences:', JSON.stringify(preferences, null, 2))

    // Calculate BMR and daily calorie needs
    const bmr = this.calculateBMR(userProfile)
    const dailyCalories = this.calculateDailyCalories(bmr, userProfile.activityLevel, userProfile.goal)

    console.log('Calculated BMR:', bmr)
    console.log('Calculated daily calories:', dailyCalories)

    try {
      // Create a comprehensive prompt that ensures 7 days are generated
      const prompt = `Create a complete 7-day diet plan as valid JSON. You MUST include all 7 days (Monday through Sunday).

USER PROFILE:
- Age: ${userProfile.age} years
- Gender: ${userProfile.gender}
- Goal: ${userProfile.goal}
- Diet Type: ${preferences.dietType}
- Daily Calories: ${dailyCalories}
- Meals per Day: ${preferences.mealsPerDay}
- Allergies: ${userProfile.allergies.join(', ') || 'none'}
- Activity Level: ${userProfile.activityLevel}

CRITICAL REQUIREMENTS:
1. Generate EXACTLY 7 days (Monday through Sunday)
2. Each day must have EXACTLY ${preferences.mealsPerDay} meals
3. Use ${preferences.dietType} ingredients only
4. Avoid all allergies: ${userProfile.allergies.join(', ') || 'none'}
5. Target ${dailyCalories} calories per day
6. Return ONLY valid JSON with no extra text

JSON STRUCTURE (MANDATORY):
{
  "name": "7-Day ${userProfile.goal.replace('_', ' ')} Diet Plan",
  "description": "Complete weekly meal plan for ${userProfile.goal}",
  "totalCalories": ${dailyCalories},
  "durationWeeks": 1,
  "meals": [
    {
      "dayNumber": 1,
      "dayName": "Monday",
      "totalDayCalories": ${dailyCalories},
      "meals": [
        {
          "name": "Breakfast Name",
          "description": "Meal description",
          "mealType": "breakfast",
          "mealTime": "${preferences.preferredMealTimes?.breakfast || '08:00'}",
          "calories": ${Math.round(dailyCalories / preferences.mealsPerDay)},
          "protein": 25,
          "carbs": 45,
          "fat": 15,
          "ingredients": [{"name": "ingredient", "amount": "1", "unit": "cup"}],
          "instructions": [{"step": 1, "instruction": "cooking instruction"}],
          "prepTime": 10,
          "cookTime": 15,
          "difficulty": "easy",
          "tags": ["healthy", "${preferences.dietType}"],
          "cuisineType": "${preferences.cuisinePreferences[0] || 'international'}"
        }
      ]
    }
  ]
}

Generate ALL 7 DAYS with this exact structure. Each day (Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday) must have ${preferences.mealsPerDay} complete meals. Return ONLY the JSON object.`

      console.log('=== SENDING PROMPT TO GEMINI ===')
      
      const response = await this.makeRequest(prompt)
      
      console.log('=== PROCESSING GEMINI RESPONSE ===')
      
      // Clean and parse the response
      const cleanedResponse = this.cleanJsonResponse(response)
      console.log('Response cleaned, attempting to parse...')
      
      let dietPlan: GeneratedDietPlan
      try {
        dietPlan = this.validateAndParseJson(cleanedResponse)
        console.log('✅ JSON parsing successful')
      } catch (parseError) {
        console.error('=== JSON PARSING FAILED ===')
        console.error('Parse error:', parseError)
        console.error('Cleaned response that failed to parse:')
        console.error(cleanedResponse.substring(0, 1000) + '...')
        console.error('=== END PARSE ERROR ===')
        
        // Use fallback instead of throwing error
        console.log('🔄 Using fallback diet plan due to JSON parsing failure')
        return this.getComprehensiveFallbackDietPlan(dailyCalories, preferences, userProfile)
      }
      
      // Validate the structure
      if (!this.validateDietPlanStructure(dietPlan)) {
        console.log('❌ Diet plan structure validation failed, using fallback')
        return this.getComprehensiveFallbackDietPlan(dailyCalories, preferences, userProfile)
      }

      console.log('✅ Diet plan validation successful')
      console.log('Generated plan summary:', {
        name: dietPlan.name,
        totalCalories: dietPlan.totalCalories,
        daysCount: dietPlan.meals?.length,
        firstDayMealsCount: dietPlan.meals?.[0]?.meals?.length
      })
      
      console.log('=== DIET PLAN GENERATION COMPLETED SUCCESSFULLY ===')
      return dietPlan
    } catch (error) {
      console.error('=== DIET PLAN GENERATION FAILED ===')
      console.error('Error type:', typeof error)
      console.error('Error details:', error)
      console.error('Error message:', error instanceof Error ? error.message : String(error))
      console.error('=== END GENERATION ERROR ===')
      
      // Always use fallback for any error to ensure the app continues working
      console.log('🔄 Using fallback diet plan generation due to error')
      return this.getComprehensiveFallbackDietPlan(dailyCalories, preferences, userProfile)
    }
  }

  private validateDietPlanStructure(dietPlan: any): boolean {
    console.log('=== VALIDATING DIET PLAN STRUCTURE ===')
    
    if (!dietPlan || typeof dietPlan !== 'object') {
      console.error('❌ Invalid diet plan: not an object')
      return false
    }

    console.log('✅ Diet plan is an object')

    if (!dietPlan.meals || !Array.isArray(dietPlan.meals)) {
      console.error('❌ Invalid diet plan structure: missing or invalid meals array')
      console.error('Meals value:', dietPlan.meals)
      console.error('Meals type:', typeof dietPlan.meals)
      return false
    }

    console.log('✅ Meals array exists, length:', dietPlan.meals.length)

    // CRITICAL: Must have exactly 7 days
    if (dietPlan.meals.length !== 7) {
      console.error(`❌ Diet plan must have exactly 7 days, but has ${dietPlan.meals.length}`)
      return false
    }

    console.log('✅ Diet plan has exactly 7 days')

    // Validate each day has the required structure
    for (let i = 0; i < dietPlan.meals.length; i++) {
      const day = dietPlan.meals[i]
      console.log(`Validating day ${i + 1}:`, {
        dayNumber: day?.dayNumber,
        dayName: day?.dayName,
        hasMeals: !!day?.meals,
        mealsIsArray: Array.isArray(day?.meals),
        mealsLength: day?.meals?.length
      })
      
      if (!day || !day.meals || !Array.isArray(day.meals) || day.meals.length === 0) {
        console.error(`❌ Invalid day ${i + 1} structure`)
        console.error('Day object:', day)
        return false
      }
      
      // Validate each meal in the day
      for (let j = 0; j < day.meals.length; j++) {
        const meal = day.meals[j]
        console.log(`Validating day ${i + 1}, meal ${j + 1}:`, {
          name: meal?.name,
          mealType: meal?.mealType,
          calories: meal?.calories,
          hasIngredients: !!meal?.ingredients,
          hasInstructions: !!meal?.instructions
        })
        
        if (!meal || !meal.name || !meal.mealType || typeof meal.calories !== 'number') {
          console.error(`❌ Invalid meal structure in day ${i + 1}, meal ${j + 1}`)
          console.error('Meal object:', meal)
          return false
        }
      }
    }

    console.log('✅ Diet plan structure validation passed')
    return true
  }

  async generateRecipe(mealType: string, dietType: string, calories: number, cuisineType?: string): Promise<GeneratedMeal> {
    const prompt = `Generate a ${mealType} recipe as JSON:
- Diet: ${dietType}
- Calories: ${calories}
- Cuisine: ${cuisineType || 'any'}

Return ONLY this JSON with NO additional text:
{
  "name": "Recipe Name",
  "description": "Brief description",
  "mealType": "${mealType}",
  "mealTime": "12:00",
  "calories": ${calories},
  "protein": 20,
  "carbs": 30,
  "fat": 10,
  "ingredients": [{"name": "ingredient", "amount": "1", "unit": "cup"}],
  "instructions": [{"step": 1, "instruction": "Cook ingredient"}],
  "prepTime": 10,
  "cookTime": 15,
  "difficulty": "easy",
  "tags": ["healthy"],
  "cuisineType": "${cuisineType || 'international'}"
}`

    try {
      const response = await this.makeRequest(prompt)
      const cleanedResponse = this.cleanJsonResponse(response)
      return this.validateAndParseJson(cleanedResponse)
    } catch (error) {
      console.error('Failed to generate recipe:', error)
      throw new Error('Failed to generate recipe')
    }
  }

  async generateRecipeDetails(prompt: string): Promise<DetailedRecipeResponse> {
    try {
      const response = await this.makeRequest(prompt)
      const cleanedResponse = this.cleanJsonResponse(response)
      return this.validateAndParseJson(cleanedResponse)
    } catch (error) {
      console.error('Failed to generate recipe details:', error)
      throw new Error('Failed to generate recipe details')
    }
  }

  private calculateBMR(profile: any): number {
    // Mifflin-St Jeor Equation
    if (profile.gender === 'male') {
      return 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5
    } else {
      return 10 * profile.weight + 6.25 * profile.height - 5 * profile.age - 161
    }
  }

  private calculateDailyCalories(bmr: number, activityLevel: string, goal: string): number {
    // Activity multipliers
    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9
    }

    const tdee = bmr * (activityMultipliers[activityLevel as keyof typeof activityMultipliers] || 1.2)

    // Adjust for goal
    switch (goal) {
      case 'weight_loss':
        return Math.round(tdee - 500) // 500 calorie deficit
      case 'muscle_gain':
        return Math.round(tdee + 300) // 300 calorie surplus
      case 'maintenance':
      case 'health':
      default:
        return Math.round(tdee)
    }
  }

  // ENHANCED fallback method that GUARANTEES 7 days
  getComprehensiveFallbackDietPlan(dailyCalories: number, preferences: any, userProfile: any): GeneratedDietPlan {
    console.log('=== GENERATING COMPREHENSIVE FALLBACK DIET PLAN ===')
    console.log('Daily calories:', dailyCalories)
    console.log('Preferences:', preferences)
    console.log('User profile goal:', userProfile.goal)
    
    // CRITICAL: Ensure exactly 7 days
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    
    // Determine meal types based on meals per day
    const mealTypes = ['breakfast', 'lunch', 'dinner']
    if (preferences.mealsPerDay > 3) {
      mealTypes.push('snack')
    }
    if (preferences.mealsPerDay > 4) {
      mealTypes.push('snack') // Add second snack if needed
    }

    const caloriesPerMeal = Math.round(dailyCalories / preferences.mealsPerDay)

    // Comprehensive meal templates with enough variety for 7 days
    const mealTemplates = {
      breakfast: [
        {
          name: "Nutritious Oatmeal Bowl",
          description: "Steel-cut oats with fresh seasonal fruits, nuts, and a drizzle of honey",
          ingredients: [
            { name: "steel-cut oats", amount: "1/2", unit: "cup" },
            { name: "almond milk", amount: "1", unit: "cup" },
            { name: "fresh banana", amount: "1", unit: "medium" },
            { name: "mixed berries", amount: "1/2", unit: "cup" },
            { name: "chopped almonds", amount: "2", unit: "tbsp" },
            { name: "honey", amount: "1", unit: "tsp" }
          ],
          instructions: [
            { step: 1, instruction: "Bring almond milk to a gentle boil in a saucepan" },
            { step: 2, instruction: "Add steel-cut oats and reduce heat to low, simmer for 15-20 minutes" },
            { step: 3, instruction: "Stir occasionally until oats are creamy and tender" },
            { step: 4, instruction: "Top with sliced banana, berries, and chopped almonds" },
            { step: 5, instruction: "Drizzle with honey and serve warm" }
          ]
        },
        {
          name: "Avocado Toast Supreme",
          description: "Multigrain toast topped with creamy avocado, cherry tomatoes, and microgreens",
          ingredients: [
            { name: "multigrain bread", amount: "2", unit: "slices" },
            { name: "ripe avocado", amount: "1", unit: "large" },
            { name: "cherry tomatoes", amount: "6", unit: "pieces" },
            { name: "microgreens", amount: "1", unit: "handful" },
            { name: "lemon juice", amount: "1", unit: "tbsp" },
            { name: "sea salt", amount: "1/4", unit: "tsp" },
            { name: "black pepper", amount: "1/4", unit: "tsp" }
          ],
          instructions: [
            { step: 1, instruction: "Toast bread slices until golden and crispy" },
            { step: 2, instruction: "Mash avocado with lemon juice, salt, and pepper" },
            { step: 3, instruction: "Spread avocado mixture generously on toast" },
            { step: 4, instruction: "Top with halved cherry tomatoes and microgreens" },
            { step: 5, instruction: "Serve immediately while toast is still warm" }
          ]
        },
        {
          name: "Greek Yogurt Parfait",
          description: "Protein-rich Greek yogurt layered with homemade granola and fresh fruits",
          ingredients: [
            { name: "Greek yogurt", amount: "1", unit: "cup" },
            { name: "homemade granola", amount: "1/3", unit: "cup" },
            { name: "fresh strawberries", amount: "1/2", unit: "cup" },
            { name: "blueberries", amount: "1/4", unit: "cup" },
            { name: "raw honey", amount: "1", unit: "tbsp" },
            { name: "chia seeds", amount: "1", unit: "tsp" }
          ],
          instructions: [
            { step: 1, instruction: "Layer half the yogurt in a glass or bowl" },
            { step: 2, instruction: "Add half the granola and berries" },
            { step: 3, instruction: "Repeat layers with remaining ingredients" },
            { step: 4, instruction: "Drizzle with honey and sprinkle chia seeds on top" },
            { step: 5, instruction: "Serve immediately for best texture" }
          ]
        },
        {
          name: "Smoothie Bowl Delight",
          description: "Thick smoothie bowl topped with fresh fruits, nuts, and seeds",
          ingredients: [
            { name: "frozen mango", amount: "1", unit: "cup" },
            { name: "banana", amount: "1", unit: "medium" },
            { name: "coconut milk", amount: "1/2", unit: "cup" },
            { name: "spinach", amount: "1", unit: "handful" },
            { name: "coconut flakes", amount: "2", unit: "tbsp" },
            { name: "pumpkin seeds", amount: "1", unit: "tbsp" }
          ],
          instructions: [
            { step: 1, instruction: "Blend frozen mango, banana, coconut milk, and spinach until thick" },
            { step: 2, instruction: "Pour into a bowl" },
            { step: 3, instruction: "Top with coconut flakes and pumpkin seeds" },
            { step: 4, instruction: "Serve immediately" }
          ]
        },
        {
          name: "Protein Pancakes",
          description: "Fluffy protein-packed pancakes with fresh berries",
          ingredients: [
            { name: "protein powder", amount: "1", unit: "scoop" },
            { name: "banana", amount: "1", unit: "medium" },
            { name: "eggs", amount: "2", unit: "large" },
            { name: "oats", amount: "1/4", unit: "cup" },
            { name: "berries", amount: "1/2", unit: "cup" },
            { name: "maple syrup", amount: "1", unit: "tbsp" }
          ],
          instructions: [
            { step: 1, instruction: "Blend all ingredients except berries until smooth" },
            { step: 2, instruction: "Cook pancakes in a non-stick pan" },
            { step: 3, instruction: "Top with fresh berries and maple syrup" }
          ]
        },
        {
          name: "Breakfast Quinoa Bowl",
          description: "Warm quinoa with nuts, seeds, and fresh fruit",
          ingredients: [
            { name: "quinoa", amount: "1/2", unit: "cup" },
            { name: "almond milk", amount: "1", unit: "cup" },
            { name: "cinnamon", amount: "1/2", unit: "tsp" },
            { name: "walnuts", amount: "2", unit: "tbsp" },
            { name: "apple", amount: "1", unit: "medium" },
            { name: "honey", amount: "1", unit: "tsp" }
          ],
          instructions: [
            { step: 1, instruction: "Cook quinoa in almond milk with cinnamon" },
            { step: 2, instruction: "Top with chopped apple and walnuts" },
            { step: 3, instruction: "Drizzle with honey" }
          ]
        },
        {
          name: "Veggie Scramble",
          description: "Scrambled eggs with colorful vegetables and herbs",
          ingredients: [
            { name: "eggs", amount: "3", unit: "large" },
            { name: "bell pepper", amount: "1/2", unit: "medium" },
            { name: "spinach", amount: "1", unit: "cup" },
            { name: "mushrooms", amount: "1/2", unit: "cup" },
            { name: "cheese", amount: "2", unit: "tbsp" },
            { name: "herbs", amount: "1", unit: "tbsp" }
          ],
          instructions: [
            { step: 1, instruction: "Sauté vegetables until tender" },
            { step: 2, instruction: "Add beaten eggs and scramble" },
            { step: 3, instruction: "Top with cheese and herbs" }
          ]
        }
      ],
      lunch: [
        {
          name: "Mediterranean Quinoa Power Bowl",
          description: "Protein-packed quinoa with roasted vegetables, feta, and tahini dressing",
          ingredients: [
            { name: "tri-color quinoa", amount: "1/2", unit: "cup" },
            { name: "cucumber", amount: "1", unit: "medium" },
            { name: "cherry tomatoes", amount: "1", unit: "cup" },
            { name: "red bell pepper", amount: "1/2", unit: "medium" },
            { name: "feta cheese", amount: "1/4", unit: "cup" },
            { name: "kalamata olives", amount: "8", unit: "pieces" },
            { name: "extra virgin olive oil", amount: "2", unit: "tbsp" },
            { name: "lemon juice", amount: "1", unit: "tbsp" }
          ],
          instructions: [
            { step: 1, instruction: "Rinse quinoa and cook according to package directions" },
            { step: 2, instruction: "Dice cucumber, tomatoes, and bell pepper" },
            { step: 3, instruction: "Let quinoa cool to room temperature" },
            { step: 4, instruction: "Combine quinoa with vegetables and olives" },
            { step: 5, instruction: "Whisk olive oil and lemon juice, toss with salad" },
            { step: 6, instruction: "Top with crumbled feta and serve" }
          ]
        },
        {
          name: "Grilled Chicken & Hummus Wrap",
          description: "Lean grilled chicken with fresh vegetables and creamy hummus in a whole wheat wrap",
          ingredients: [
            { name: "whole wheat tortilla", amount: "1", unit: "large" },
            { name: "grilled chicken breast", amount: "4", unit: "oz" },
            { name: "romaine lettuce", amount: "2", unit: "cups" },
            { name: "roma tomato", amount: "1", unit: "medium" },
            { name: "red onion", amount: "2", unit: "tbsp" },
            { name: "hummus", amount: "3", unit: "tbsp" },
            { name: "cucumber", amount: "1/4", unit: "cup" }
          ],
          instructions: [
            { step: 1, instruction: "Warm tortilla in a dry pan for 30 seconds each side" },
            { step: 2, instruction: "Spread hummus evenly across the tortilla" },
            { step: 3, instruction: "Layer lettuce, sliced chicken, tomato, and cucumber" },
            { step: 4, instruction: "Add red onion and any desired seasonings" },
            { step: 5, instruction: "Roll tightly, tucking in sides as you go" },
            { step: 6, instruction: "Cut in half diagonally and serve" }
          ]
        },
        {
          name: "Rainbow Buddha Bowl",
          description: "Colorful bowl with brown rice, roasted vegetables, and tahini dressing",
          ingredients: [
            { name: "brown rice", amount: "1/2", unit: "cup" },
            { name: "roasted sweet potato", amount: "1/2", unit: "cup" },
            { name: "steamed broccoli", amount: "1/2", unit: "cup" },
            { name: "shredded purple cabbage", amount: "1/4", unit: "cup" },
            { name: "chickpeas", amount: "1/2", unit: "cup" },
            { name: "tahini", amount: "2", unit: "tbsp" },
            { name: "lemon juice", amount: "1", unit: "tbsp" },
            { name: "pumpkin seeds", amount: "1", unit: "tbsp" }
          ],
          instructions: [
            { step: 1, instruction: "Cook brown rice according to package directions" },
            { step: 2, instruction: "Roast sweet potato cubes at 400°F for 25 minutes" },
            { step: 3, instruction: "Steam broccoli until tender-crisp" },
            { step: 4, instruction: "Arrange all ingredients in a bowl" },
            { step: 5, instruction: "Whisk tahini with lemon juice and water to thin" },
            { step: 6, instruction: "Drizzle dressing over bowl and sprinkle with seeds" }
          ]
        },
        {
          name: "Asian Lettuce Wraps",
          description: "Fresh lettuce cups filled with seasoned protein and vegetables",
          ingredients: [
            { name: "butter lettuce", amount: "8", unit: "leaves" },
            { name: "ground turkey", amount: "4", unit: "oz" },
            { name: "water chestnuts", amount: "1/4", unit: "cup" },
            { name: "carrots", amount: "1/4", unit: "cup" },
            { name: "soy sauce", amount: "2", unit: "tbsp" },
            { name: "sesame oil", amount: "1", unit: "tsp" },
            { name: "green onions", amount: "2", unit: "stalks" }
          ],
          instructions: [
            { step: 1, instruction: "Cook ground turkey until browned" },
            { step: 2, instruction: "Add diced vegetables and seasonings" },
            { step: 3, instruction: "Serve mixture in lettuce cups" },
            { step: 4, instruction: "Garnish with green onions" }
          ]
        },
        {
          name: "Lentil Soup",
          description: "Hearty and nutritious lentil soup with vegetables",
          ingredients: [
            { name: "red lentils", amount: "1/2", unit: "cup" },
            { name: "vegetable broth", amount: "2", unit: "cups" },
            { name: "carrots", amount: "1", unit: "medium" },
            { name: "celery", amount: "2", unit: "stalks" },
            { name: "onion", amount: "1/2", unit: "medium" },
            { name: "garlic", amount: "2", unit: "cloves" },
            { name: "herbs", amount: "1", unit: "tsp" }
          ],
          instructions: [
            { step: 1, instruction: "Sauté onion, carrots, and celery" },
            { step: 2, instruction: "Add lentils and broth" },
            { step: 3, instruction: "Simmer until lentils are tender" },
            { step: 4, instruction: "Season with herbs and serve" }
          ]
        },
        {
          name: "Caprese Salad",
          description: "Fresh mozzarella, tomatoes, and basil with balsamic glaze",
          ingredients: [
            { name: "fresh mozzarella", amount: "4", unit: "oz" },
            { name: "tomatoes", amount: "2", unit: "large" },
            { name: "fresh basil", amount: "1/4", unit: "cup" },
            { name: "balsamic vinegar", amount: "2", unit: "tbsp" },
            { name: "olive oil", amount: "1", unit: "tbsp" },
            { name: "salt", amount: "1/4", unit: "tsp" }
          ],
          instructions: [
            { step: 1, instruction: "Slice tomatoes and mozzarella" },
            { step: 2, instruction: "Arrange with basil leaves" },
            { step: 3, instruction: "Drizzle with oil and balsamic" },
            { step: 4, instruction: "Season with salt" }
          ]
        },
        {
          name: "Tuna Salad Bowl",
          description: "Protein-rich tuna salad with mixed greens and vegetables",
          ingredients: [
            { name: "canned tuna", amount: "1", unit: "can" },
            { name: "mixed greens", amount: "2", unit: "cups" },
            { name: "cherry tomatoes", amount: "1/2", unit: "cup" },
            { name: "cucumber", amount: "1/2", unit: "medium" },
            { name: "avocado", amount: "1/2", unit: "medium" },
            { name: "olive oil", amount: "1", unit: "tbsp" },
            { name: "lemon juice", amount: "1", unit: "tbsp" }
          ],
          instructions: [
            { step: 1, instruction: "Drain and flake tuna" },
            { step: 2, instruction: "Arrange greens and vegetables in bowl" },
            { step: 3, instruction: "Top with tuna and avocado" },
            { step: 4, instruction: "Dress with oil and lemon" }
          ]
        }
      ],
      dinner: [
        {
          name: "Herb-Crusted Baked Salmon",
          description: "Fresh Atlantic salmon with herb crust, served with roasted seasonal vegetables",
          ingredients: [
            { name: "salmon fillet", amount: "6", unit: "oz" },
            { name: "fresh dill", amount: "2", unit: "tbsp" },
            { name: "fresh parsley", amount: "2", unit: "tbsp" },
            { name: "garlic", amount: "2", unit: "cloves" },
            { name: "lemon zest", amount: "1", unit: "tsp" },
            { name: "asparagus", amount: "8", unit: "spears" },
            { name: "baby potatoes", amount: "6", unit: "small" },
            { name: "olive oil", amount: "2", unit: "tbsp" }
          ],
          instructions: [
            { step: 1, instruction: "Preheat oven to 425°F" },
            { step: 2, instruction: "Mix herbs, minced garlic, and lemon zest" },
            { step: 3, instruction: "Rub herb mixture on salmon fillet" },
            { step: 4, instruction: "Toss vegetables with olive oil and seasonings" },
            { step: 5, instruction: "Bake salmon and vegetables for 18-20 minutes" },
            { step: 6, instruction: "Let rest 5 minutes before serving" }
          ]
        },
        {
          name: "Vegetable Curry with Coconut Rice",
          description: "Aromatic mixed vegetable curry served over fragrant coconut basmati rice",
          ingredients: [
            { name: "basmati rice", amount: "1/2", unit: "cup" },
            { name: "coconut milk", amount: "1/2", unit: "cup" },
            { name: "mixed vegetables", amount: "2", unit: "cups" },
            { name: "curry powder", amount: "2", unit: "tsp" },
            { name: "ginger", amount: "1", unit: "tbsp" },
            { name: "onion", amount: "1", unit: "medium" },
            { name: "garlic", amount: "3", unit: "cloves" },
            { name: "vegetable broth", amount: "1", unit: "cup" }
          ],
          instructions: [
            { step: 1, instruction: "Cook rice with half coconut milk and water" },
            { step: 2, instruction: "Sauté onion, garlic, and ginger until fragrant" },
            { step: 3, instruction: "Add curry powder and cook for 1 minute" },
            { step: 4, instruction: "Add vegetables and broth, simmer 15 minutes" },
            { step: 5, instruction: "Stir in remaining coconut milk" },
            { step: 6, instruction: "Serve curry over coconut rice" }
          ]
        },
        {
          name: "Lean Turkey Meatballs with Zucchini Noodles",
          description: "Healthy turkey meatballs in marinara sauce over spiralized zucchini noodles",
          ingredients: [
            { name: "ground turkey", amount: "5", unit: "oz" },
            { name: "zucchini", amount: "2", unit: "medium" },
            { name: "marinara sauce", amount: "1/2", unit: "cup" },
            { name: "whole wheat breadcrumbs", amount: "1/4", unit: "cup" },
            { name: "egg", amount: "1", unit: "large" },
            { name: "Italian herbs", amount: "1", unit: "tsp" },
            { name: "parmesan cheese", amount: "2", unit: "tbsp" }
          ],
          instructions: [
            { step: 1, instruction: "Mix turkey, breadcrumbs, egg, and herbs" },
            { step: 2, instruction: "Form into 8-10 small meatballs" },
            { step: 3, instruction: "Bake meatballs at 375°F for 20 minutes" },
            { step: 4, instruction: "Spiralize zucchini into noodles" },
            { step: 5, instruction: "Heat marinara and add cooked meatballs" },
            { step: 6, instruction: "Serve over zucchini noodles with parmesan" }
          ]
        },
        {
          name: "Stuffed Bell Peppers",
          description: "Colorful bell peppers stuffed with quinoa, vegetables, and herbs",
          ingredients: [
            { name: "bell peppers", amount: "2", unit: "large" },
            { name: "quinoa", amount: "1/2", unit: "cup" },
            { name: "black beans", amount: "1/2", unit: "cup" },
            { name: "corn", amount: "1/4", unit: "cup" },
            { name: "tomatoes", amount: "1/2", unit: "cup" },
            { name: "cheese", amount: "1/4", unit: "cup" },
            { name: "herbs", amount: "1", unit: "tbsp" }
          ],
          instructions: [
            { step: 1, instruction: "Cut tops off peppers and remove seeds" },
            { step: 2, instruction: "Cook quinoa and mix with vegetables" },
            { step: 3, instruction: "Stuff peppers with quinoa mixture" },
            { step: 4, instruction: "Top with cheese and bake 25 minutes" }
          ]
        },
        {
          name: "Grilled Chicken with Sweet Potato",
          description: "Marinated grilled chicken breast with roasted sweet potato wedges",
          ingredients: [
            { name: "chicken breast", amount: "6", unit: "oz" },
            { name: "sweet potato", amount: "1", unit: "large" },
            { name: "olive oil", amount: "2", unit: "tbsp" },
            { name: "herbs", amount: "1", unit: "tbsp" },
            { name: "garlic", amount: "2", unit: "cloves" },
            { name: "lemon", amount: "1/2", unit: "medium" },
            { name: "green beans", amount: "1", unit: "cup" }
          ],
          instructions: [
            { step: 1, instruction: "Marinate chicken with herbs and garlic" },
            { step: 2, instruction: "Cut sweet potato into wedges" },
            { step: 3, instruction: "Grill chicken and roast sweet potato" },
            { step: 4, instruction: "Steam green beans until tender" },
            { step: 5, instruction: "Serve with lemon wedges" }
          ]
        },
        {
          name: "Fish Tacos",
          description: "Grilled fish tacos with cabbage slaw and avocado",
          ingredients: [
            { name: "white fish", amount: "5", unit: "oz" },
            { name: "corn tortillas", amount: "3", unit: "small" },
            { name: "cabbage", amount: "1", unit: "cup" },
            { name: "avocado", amount: "1/2", unit: "medium" },
            { name: "lime", amount: "1", unit: "medium" },
            { name: "cilantro", amount: "2", unit: "tbsp" },
            { name: "yogurt", amount: "2", unit: "tbsp" }
          ],
          instructions: [
            { step: 1, instruction: "Season and grill fish until flaky" },
            { step: 2, instruction: "Make slaw with cabbage and lime" },
            { step: 3, instruction: "Warm tortillas" },
            { step: 4, instruction: "Assemble tacos with fish, slaw, and avocado" }
          ]
        },
        {
          name: "Eggplant Parmesan",
          description: "Baked eggplant layered with marinara and cheese",
          ingredients: [
            { name: "eggplant", amount: "1", unit: "medium" },
            { name: "marinara sauce", amount: "1", unit: "cup" },
            { name: "mozzarella cheese", amount: "1/2", unit: "cup" },
            { name: "parmesan cheese", amount: "1/4", unit: "cup" },
            { name: "breadcrumbs", amount: "1/4", unit: "cup" },
            { name: "basil", amount: "2", unit: "tbsp" },
            { name: "olive oil", amount: "2", unit: "tbsp" }
          ],
          instructions: [
            { step: 1, instruction: "Slice eggplant and brush with oil" },
            { step: 2, instruction: "Bake eggplant until tender" },
            { step: 3, instruction: "Layer with sauce and cheese" },
            { step: 4, instruction: "Bake until cheese melts" }
          ]
        }
      ],
      snack: [
        {
          name: "Greek Yogurt Berry Bowl",
          description: "Protein-rich Greek yogurt with antioxidant-packed mixed berries",
          ingredients: [
            { name: "Greek yogurt", amount: "3/4", unit: "cup" },
            { name: "mixed berries", amount: "1/2", unit: "cup" },
            { name: "honey", amount: "1", unit: "tsp" },
            { name: "chopped walnuts", amount: "1", unit: "tbsp" }
          ],
          instructions: [
            { step: 1, instruction: "Place yogurt in a serving bowl" },
            { step: 2, instruction: "Top with fresh mixed berries" },
            { step: 3, instruction: "Drizzle with honey and sprinkle nuts" }
          ]
        },
        {
          name: "Energy Trail Mix",
          description: "Homemade mix of nuts, seeds, and dried fruit for sustained energy",
          ingredients: [
            { name: "almonds", amount: "2", unit: "tbsp" },
            { name: "walnuts", amount: "1", unit: "tbsp" },
            { name: "pumpkin seeds", amount: "1", unit: "tbsp" },
            { name: "dried cranberries", amount: "1", unit: "tbsp" }
          ],
          instructions: [
            { step: 1, instruction: "Mix all ingredients in a small bowl" },
            { step: 2, instruction: "Store in airtight container for freshness" }
          ]
        },
        {
          name: "Apple with Almond Butter",
          description: "Crisp apple slices with creamy almond butter",
          ingredients: [
            { name: "apple", amount: "1", unit: "medium" },
            { name: "almond butter", amount: "2", unit: "tbsp" },
            { name: "cinnamon", amount: "1/4", unit: "tsp" }
          ],
          instructions: [
            { step: 1, instruction: "Slice apple into wedges" },
            { step: 2, instruction: "Serve with almond butter and cinnamon" }
          ]
        },
        {
          name: "Hummus and Veggies",
          description: "Fresh vegetables with protein-rich hummus",
          ingredients: [
            { name: "hummus", amount: "1/4", unit: "cup" },
            { name: "carrots", amount: "1", unit: "medium" },
            { name: "cucumber", amount: "1/2", unit: "medium" },
            { name: "bell pepper", amount: "1/2", unit: "medium" }
          ],
          instructions: [
            { step: 1, instruction: "Cut vegetables into sticks" },
            { step: 2, instruction: "Serve with hummus for dipping" }
          ]
        },
        {
          name: "Protein Smoothie",
          description: "Refreshing protein smoothie with fruits and vegetables",
          ingredients: [
            { name: "protein powder", amount: "1", unit: "scoop" },
            { name: "banana", amount: "1/2", unit: "medium" },
            { name: "spinach", amount: "1", unit: "handful" },
            { name: "almond milk", amount: "1", unit: "cup" },
            { name: "berries", amount: "1/4", unit: "cup" }
          ],
          instructions: [
            { step: 1, instruction: "Blend all ingredients until smooth" },
            { step: 2, instruction: "Serve immediately" }
          ]
        }
      ]
    }

    // CRITICAL: Create the fallback plan with EXACTLY 7 days guaranteed
    const fallbackPlan: GeneratedDietPlan = {
      name: `Personalized ${userProfile.goal?.replace('_', ' ') || 'Wellness'} Diet Plan`,
      description: "A comprehensive, balanced 7-day diet plan designed with whole foods and proper nutrition to help you achieve your health goals while enjoying delicious, varied meals throughout the week.",
      totalCalories: dailyCalories,
      durationWeeks: userProfile.timelineWeeks || 4,
      meals: days.map((dayName, dayIndex) => {
        console.log(`Creating day ${dayIndex + 1}: ${dayName}`)
        
        return {
          dayNumber: dayIndex + 1,
          dayName,
          totalDayCalories: dailyCalories,
          meals: mealTypes.slice(0, preferences.mealsPerDay).map((mealType, mealIndex) => {
            const templates = mealTemplates[mealType as keyof typeof mealTemplates] || mealTemplates.breakfast
            // Use different template for each day to ensure variety
            const template = templates[dayIndex % templates.length]
            
            console.log(`  Creating ${mealType} meal: ${template.name}`)
            
            return {
              name: template.name,
              description: template.description,
              mealType: mealType as any,
              mealTime: preferences.preferredMealTimes?.[mealType] || 
                       (mealType === 'breakfast' ? '08:00' : 
                        mealType === 'lunch' ? '13:00' : 
                        mealType === 'dinner' ? '19:00' : '15:00'),
              calories: caloriesPerMeal,
              protein: Math.round(caloriesPerMeal * 0.25 / 4), // 25% protein calories / 4 cal per gram
              carbs: Math.round(caloriesPerMeal * 0.45 / 4), // 45% carb calories / 4 cal per gram
              fat: Math.round(caloriesPerMeal * 0.30 / 9), // 30% fat calories / 9 cal per gram
              ingredients: template.ingredients,
              instructions: template.instructions,
              prepTime: 15,
              cookTime: 20,
              difficulty: "easy" as any,
              tags: ["healthy", "balanced", mealType, preferences.dietType || 'nutritious'],
              cuisineType: preferences.cuisinePreferences?.[0] || 'international'
            }
          })
        }
      })
    }

    console.log('✅ Fallback plan generated successfully:', {
      name: fallbackPlan.name,
      totalCalories: fallbackPlan.totalCalories,
      daysCount: fallbackPlan.meals.length,
      totalMealsCount: fallbackPlan.meals.reduce((sum, day) => sum + day.meals.length, 0),
      daysBreakdown: fallbackPlan.meals.map(day => ({
        dayNumber: day.dayNumber,
        dayName: day.dayName,
        mealsCount: day.meals.length
      }))
    })
    
    // CRITICAL: Validate the fallback plan structure
    if (!this.validateDietPlanStructure(fallbackPlan)) {
      console.error('❌ CRITICAL: Fallback plan failed validation!')
      throw new Error('Fallback diet plan generation failed - this should never happen')
    }
    
    console.log('✅ Fallback plan validation passed')
    console.log('=== END FALLBACK GENERATION ===')
    return fallbackPlan
  }
}

export const geminiAPI = new GeminiAPI()