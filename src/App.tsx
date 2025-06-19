import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { AuthGuard } from './components/auth/AuthGuard'
import { Layout } from './components/layout/Layout'

// Pages
import { Auth } from './pages/Auth'
import { Onboarding } from './pages/Onboarding'
import { Dashboard } from './pages/Dashboard'
import { Profile } from './pages/Profile'
import { DietPlans } from './pages/DietPlans'
import { DietPlanDetails } from './pages/DietPlanDetails'
import { Recipes } from './pages/Recipes'
import { RecipeDetails } from './pages/RecipeDetails'
import { Progress } from './pages/Progress'
import { Settings } from './pages/Settings'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/onboarding" element={
            <AuthGuard requireProfile={false}>
              <Onboarding />
            </AuthGuard>
          } />
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={
              <AuthGuard>
                <Dashboard />
              </AuthGuard>
            } />
            <Route path="profile" element={
              <AuthGuard>
                <Profile />
              </AuthGuard>
            } />
            <Route path="diet-plans" element={
              <AuthGuard>
                <DietPlans />
              </AuthGuard>
            } />
            <Route path="diet-plans/:planId" element={
              <AuthGuard>
                <DietPlanDetails />
              </AuthGuard>
            } />
            <Route path="recipes" element={
              <AuthGuard>
                <Recipes />
              </AuthGuard>
            } />
            <Route path="recipes/:recipeId" element={
              <AuthGuard>
                <RecipeDetails />
              </AuthGuard>
            } />
            <Route path="insights" element={
              <AuthGuard>
                <Progress />
              </AuthGuard>
            } />
            <Route path="settings" element={
              <AuthGuard>
                <Settings />
              </AuthGuard>
            } />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App