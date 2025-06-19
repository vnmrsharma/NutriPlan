import React from 'react'
import { Outlet } from 'react-router-dom'
import { Navigation } from './Navigation'
import { useAuth } from '../../contexts/AuthContext'

export const Layout: React.FC = () => {
  const { user } = useAuth()

  if (!user) {
    return <Outlet />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50">
      <Navigation />
      <main className="pt-16">
        <div className="min-h-[calc(100vh-4rem)]">
          <Outlet />
        </div>
        
        {/* Footer */}
        <footer className="bg-white/80 backdrop-blur-md border-t border-gray-200 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="col-span-1 md:col-span-2">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">N</span>
                  </div>
                  <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                    NutriPlan
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-4">
                  Transform your health journey with AI-powered personalized diet plans, 
                  smart cooking assistance, and comprehensive progress tracking.
                </p>
                <p className="text-gray-500 text-xs">
                  © 2024 NutriPlan. All rights reserved.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Features</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>AI Diet Planning</li>
                  <li>Recipe Collection</li>
                  <li>Progress Tracking</li>
                  <li>Health Insights</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Support</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>Help Center</li>
                  <li>Contact Us</li>
                  <li>Privacy Policy</li>
                  <li>Terms of Service</li>
                </ul>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}