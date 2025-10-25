# Recipe Generator 🍳

A modern, full-stack recipe management application built with React, TypeScript, and Supabase. Create, organize, and discover delicious recipes with AI-powered assistance.

## ✨ Features

### 🍽️ Recipe Management

- **Create & Edit Recipes**: Add new recipes with ingredients, instructions, and notes
- **Recipe Parsing**: Paste recipe text and automatically parse into structured format
- **Image Upload**: Add photos to your recipes with cloud storage
- **Search & Filter**: Find recipes by title, ingredients, or instructions
- **Responsive Design**: Beautiful UI that works on desktop and mobile

### 🤖 AI-Powered Features

- **AI Recipe Creator**: Chat with an AI assistant to generate custom recipes
- **Smart Parsing**: Automatically extract recipe components from text
- **Conversational Interface**: Natural language recipe creation

### 🔐 Authentication & Security

- **User Authentication**: Secure login with Supabase Auth
- **Row-Level Security**: Users can only access their own recipes
- **Protected Routes**: Automatic authentication checks

### 🎨 Modern UI/UX

- **Shadcn/ui Components**: Beautiful, accessible UI components
- **Tailwind CSS**: Modern styling with utility classes
- **Responsive Layout**: Works seamlessly across all devices
- **Loading States**: Smooth user experience with skeleton loaders
- **Toast Notifications**: User-friendly feedback system

## 🛠️ Tech Stack

### Frontend

- **React 18** - Modern React with hooks and functional components
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and development server
- **React Router DOM** - Client-side routing
- **TanStack Query** - Server state management and caching
- **React Hook Form** - Form handling with validation
- **Zod** - Schema validation

### Testing & Quality

- **Vitest** - Fast unit testing framework
- **React Testing Library** - Component testing utilities
- **Prettier** - Code formatting
- **ESLint** - Code linting and quality checks
- **Husky** - Git hooks for pre-commit verification

### UI & Styling

- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/ui** - High-quality React components
- **Radix UI** - Accessible component primitives
- **Lucide React** - Beautiful icons
- **Tailwind CSS Animate** - Smooth animations

### Backend & Database

- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Real-time subscriptions
  - Row-level security
  - File storage
  - Authentication

### Development Tools

- **ESLint** - Code linting
- **TypeScript ESLint** - TypeScript-specific linting rules
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixing

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── auth/           # Authentication components
│   ├── chat/           # AI chat interface
│   ├── layout/         # Layout components (header, etc.)
│   ├── recipes/        # Recipe-specific components
│   └── ui/             # Shadcn/ui components
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries and configurations
├── pages/              # Page components
└── main.tsx           # Application entry point
```

## 🌐 Live Application

**Recipe Generator is now live!** 🎉

- **Production URL**: [https://recipegenerator.app](https://recipegenerator.app)
- **Status**: ✅ Active and fully functional
- **Deployment**: Vercel with automatic deployments from GitHub

### Production Features

- **AI Recipe Creation**: Chat with AI assistants to generate custom recipes
- **Recipe Management**: Create, edit, and organize your digital cookbook
- **Smart Parsing**: Automatically extract recipes from text or AI conversations
- **User Authentication**: Secure login with Supabase Auth
- **Cloud Storage**: Recipe images stored securely in Supabase
- **Responsive Design**: Works perfectly on desktop and mobile devices

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Quality Assurance

This project includes a comprehensive Pre-PR Verification System that ensures code quality:

- **Automated Testing**: 26 tests covering components, hooks, and utilities
- **Code Formatting**: Prettier with Tailwind CSS plugin
- **Linting**: ESLint with TypeScript and React rules
- **Type Safety**: Full TypeScript strict mode
- **Git Hooks**: Pre-commit and pre-push verification
- **CI/CD**: GitHub Actions for automated verification

For detailed information, see [Quality Assurance Documentation](docs/quality-assurance/README.md).

### For AI Agents

If you're an AI agent working on this project, please refer to:

- **[AI Agent Quick Reference](docs/quality-assurance/AI-AGENT-QUICK-REFERENCE.md)** - Essential commands and patterns
- **[Pre-PR Verification Checklist](docs/quality-assurance/PRE-PR-VERIFICATION-CHECKLIST.md)** - Comprehensive diagnostic checklist

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd recipe-generator
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project
   - Run the database migration in `supabase/migrations/20250814153425_maroon_salad.sql`
   - Create a storage bucket named `recipe-images`

4. **Environment Variables**
   Create a `.env` file in the root directory:

   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

   # OpenAI Configuration (for AI Recipe Creator)
   # Note: OPENAI_API_KEY is configured server-side only for security
   VITE_OPENAI_MODEL=gpt-4-turbo-preview
   ```

5. **Start the development server**

   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:5173`

## 🗄️ Database Schema

### Recipes Table

```sql
CREATE TABLE recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  ingredients text[] DEFAULT '{}',
  instructions text DEFAULT '',
  notes text DEFAULT '',
  image_url text,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### Security Policies

- Users can only view, create, update, and delete their own recipes
- Recipe images are stored in user-specific folders
- Row-level security is enabled on all tables

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run test` - Run tests in watch mode
- `npm run test:run` - Run tests once
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:ui` - Run tests with UI interface
- `npm run verify` - Run full verification suite
- `npm run verify:quick` - Quick verification (skip format check)

## 🚀 Deployment

### Production Deployment

Recipe Generator is deployed on **Vercel** with the following configuration:

- **Framework**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variables**: Configured for Supabase and OpenAI integration
- **Custom Domain**: [recipegenerator.app](https://recipegenerator.app)
- **Auto-Deploy**: Enabled from GitHub main branch

### Environment Variables (Production)

The following environment variables are configured in Vercel:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
# Note: OPENAI_API_KEY is configured server-side only for security
VITE_OPENAI_MODEL=gpt-4o-mini
```

## 🎯 Key Features Explained

### Recipe Parsing

The app includes intelligent recipe parsing that can handle:

- JSON format recipes (from external APIs)
- Markdown-style text recipes
- Complex nested ingredient structures
- Multiple instruction sections

### AI Chat Interface

The AI recipe creator provides:

- **Multiple Personas**: Choose from Chef Marco (Italian expert), Dr. Sarah (nutritionist), or Aunt Jenny (home cook)
- **Conversational Recipe Generation**: Natural language recipe creation with context awareness
- **Structured Output**: Automatically generates properly formatted recipes
- **Persona-Specific Guidance**: Each assistant provides specialized cooking advice and tips
- **Recipe Saving and Editing**: Seamless integration with the recipe management system

### Image Management

- Secure file uploads to Supabase Storage
- User-specific storage folders
- Public URL generation for images
- Automatic cleanup on recipe deletion

## 🔒 Security Features

- **Authentication**: Supabase Auth with email/password
- **Authorization**: Row-level security policies
- **Data Validation**: Zod schemas for all user inputs
- **Secure Storage**: User-specific file storage with proper permissions

## 🎨 UI/UX Highlights

- **Modern Design**: Clean, intuitive interface
- **Responsive**: Works on all screen sizes
- **Accessible**: Built with accessibility in mind
- **Loading States**: Smooth user experience
- **Error Handling**: User-friendly error messages
- **Toast Notifications**: Real-time feedback

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Shadcn/ui](https://ui.shadcn.com/) for beautiful components
- [Supabase](https://supabase.com/) for the backend infrastructure
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Vite](https://vitejs.dev/) for the build tool

## 📊 Project Status

### ✅ Production Ready Features

- **Core Recipe Management**: ✅ Complete and tested
- **AI Recipe Creation**: ✅ Fully functional with multiple personas
- **User Authentication**: ✅ Secure Supabase integration
- **Image Upload**: ✅ Cloud storage with user isolation
- **Recipe Parsing**: ✅ Smart JSON and markdown parsing
- **Responsive Design**: ✅ Mobile and desktop optimized
- **Database Security**: ✅ Row-level security policies
- **Error Handling**: ✅ Comprehensive error recovery
- **Performance**: ✅ Optimized build and loading

### 🎯 Recent Improvements

- **Enhanced Recipe Parsing**: Fixed issues with AI-generated JSON recipes
- **Smart Content Detection**: Distinguishes recipes from meal planning advice
- **Markdown Code Block Support**: Handles JSON wrapped in markdown
- **Flexible Field Validation**: Supports both "title" and "name" fields
- **Improved User Experience**: Better error messages and guidance

---

**Recipe Generator** - Your digital cookbook companion 🍳

**Live at**: [https://recipegenerator.app](https://recipegenerator.app)

# Environment validation test - Mon Sep 15 13:38:19 PDT 2025

# Trigger CI
