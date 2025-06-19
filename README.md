# NutriPlan 🥗

An AI-powered diet planning application that creates personalized meal plans and recipes tailored to your health goals, tastes, and dietary needs.

![NutriPlan Dashboard](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![React](https://img.shields.io/badge/React-18.3.1-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-blue)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-orange)
![Gemini AI](https://img.shields.io/badge/Gemini%20AI-1.5%20Pro-purple)

## 🌟 Features

### 🤖 AI-Powered Diet Planning
- **Personalized Meal Plans**: Generate custom diet plans based on your profile, preferences, and health goals
- **Smart Calorie Calculation**: Uses BMR and activity level for accurate daily calorie targets
- **Intelligent Recipe Generation**: AI creates diverse, nutritionally balanced meals
- **Dietary Restriction Support**: Accommodates vegetarian, vegan, keto, paleo, and other dietary preferences

### 📊 Comprehensive Health Tracking
- **Weight Progress Monitoring**: Track your weight journey with detailed analytics
- **BMI Calculation**: Automatic BMI calculation with health category assessment
- **Meal Consumption Logging**: Mark meals as consumed and track daily adherence
- **Water Intake Tracking**: Monitor daily hydration goals
- **Achievement System**: Celebrate milestones and stay motivated

### 🍳 Recipe Management
- **Curated Recipe Database**: Extensive collection of healthy, delicious recipes
- **Detailed Instructions**: Step-by-step cooking guidance with tips and variations
- **Nutritional Information**: Complete macro and micronutrient breakdown
- **Search & Filter**: Find recipes by diet type, cuisine, difficulty, and more
- **Recipe Ratings**: Community-driven recipe recommendations

### 👤 User Experience
- **Multi-Step Onboarding**: Comprehensive profile setup process
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Real-time Updates**: Live data synchronization across devices
- **Intuitive Navigation**: Clean, modern interface with easy-to-use controls

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern React with hooks and functional components
- **TypeScript** - Type-safe development with comprehensive interfaces
- **Tailwind CSS** - Utility-first CSS framework with custom design system
- **React Router DOM** - Client-side routing and navigation
- **Recharts** - Data visualization and progress charts
- **Lucide React** - Beautiful, customizable icons

### Backend & Services
- **Supabase** - Backend-as-a-Service with PostgreSQL database
- **Supabase Auth** - Secure authentication and user management
- **Row Level Security (RLS)** - Database-level security policies
- **Real-time Subscriptions** - Live data updates

### AI Integration
- **Google Gemini AI** - Advanced AI model for diet plan generation
- **Custom Prompt Engineering** - Optimized prompts for consistent, structured responses
- **Fallback System** - Offline meal plans when AI is unavailable

### Development Tools
- **Vite** - Fast build tool and development server
- **ESLint** - Code quality and consistency
- **PostCSS** - CSS processing and optimization

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- Google Gemini API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/nutriplan.git
   cd nutriplan
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Database Setup**
   - Create a new Supabase project
   - Run the migration files in `supabase/migrations/` to set up the database schema
   - Enable Row Level Security (RLS) on all tables

5. **Start Development Server**
   ```bash
   npm run dev
   ```

6. **Build for Production**
   ```bash
   npm run build
   ```

## 📁 Project Structure

```
NutriPlan/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── auth/           # Authentication components
│   │   ├── layout/         # Layout and navigation
│   │   └── ui/             # Base UI components
│   ├── contexts/           # React contexts
│   ├── lib/                # Utility libraries and API
│   ├── pages/              # Main application pages
│   └── main.tsx           # Application entry point
├── supabase/
│   └── migrations/         # Database migration files
├── public/                 # Static assets
└── package.json           # Dependencies and scripts
```

## 🗄️ Database Schema

### Core Tables
- **`user_profiles`** - Personal health information and goals
- **`user_preferences`** - Dietary preferences and restrictions
- **`diet_plans`** - AI-generated meal plans
- **`meals`** - Individual meals within diet plans
- **`recipes`** - Recipe database with detailed instructions
- **`progress_entries`** - Weight and health tracking
- **`meal_logs`** - Daily meal consumption tracking
- **`water_intake`** - Hydration tracking

## 🔐 Security Features

- **Row Level Security (RLS)** - Users can only access their own data
- **Secure Authentication** - Supabase Auth with email/password
- **Data Validation** - Client and server-side validation
- **Type Safety** - Comprehensive TypeScript interfaces

## 🎨 Design System

- **Color Palette**: Emerald and blue gradient theme
- **Typography**: Clean, modern font hierarchy
- **Components**: Reusable UI components with consistent styling
- **Responsive Design**: Mobile-first approach
- **Accessibility**: WCAG compliant design patterns

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🙏 Acknowledgments

### Development Tools
- **Cursor** - This project was developed with the assistance of Cursor, an AI-powered code editor. While Cursor helped increase development speed by providing code suggestions and autocompletion, the core development, architecture decisions, debugging, and final implementation were done manually. The AI-generated code often required significant rewriting and optimization to meet production standards. Cursor served as a development accelerator rather than the primary developer.

### Open Source Libraries
- React and the React ecosystem
- Supabase for backend services
- Tailwind CSS for styling
- Lucide React for icons
- Recharts for data visualization

### AI Services
- Google Gemini AI for intelligent meal plan generation

## 📞 Support

For support, email vinamrasharma5@gmail.com or create an issue in this repository.

## 🔮 Roadmap

- [ ] Social features and community sharing
- [ ] Advanced analytics and health insights
- [ ] Fitness tracker integration
- [ ] Push notifications and meal reminders
- [ ] Enhanced offline functionality
- [ ] Multi-language support
- [ ] Recipe sharing and collaboration

---

**Made with ❤️ for better health and nutrition**
