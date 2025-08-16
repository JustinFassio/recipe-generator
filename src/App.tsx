import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/DebugAuthProvider';
import { ProtectedRoute, PublicRoute } from '@/components/auth/ProtectedRoute';
import { Header } from '@/components/layout/header';
import { RecipesPage } from '@/pages/recipes-page';
import { AddRecipePage } from '@/pages/add-recipe-page';
import { RecipeViewPage } from '@/pages/recipe-view-page';
import { ChatRecipePage } from '@/pages/chat-recipe-page';
import ProfilePage from '@/pages/profile-page';
import AuthCallbackPage from '@/pages/auth-callback-page';
import { AuthForm } from '@/components/auth/auth-form';
import { ThemeProvider } from '@/components/ui/theme-provider';

import { Toaster } from '@/components/ui/toaster';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppContent() {
  return (
<<<<<<< Updated upstream
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<RecipesPage />} />
          <Route path="/add" element={<AddRecipePage />} />
          <Route path="/chat-recipe" element={<ChatRecipePage />} />
          <Route path="/recipe/:id" element={<RecipeViewPage />} />
        </Routes>
      </main>
    </div>
=======
    <Routes>
      {/* Public routes - redirect to /recipes if authenticated */}
      <Route 
        path="/auth/signin" 
        element={
          <PublicRoute>
            <AuthForm />
          </PublicRoute>
        } 
      />
      <Route 
        path="/auth/signup" 
        element={
          <PublicRoute>
            <AuthForm />
          </PublicRoute>
        } 
      />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />

      {/* Protected routes - require authentication */}
      <Route 
        path="/recipes" 
        element={
          <ProtectedRoute>
            <div className="min-h-screen bg-base-100">
              <Header />
              <main>
                <RecipesPage />
              </main>
            </div>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/add" 
        element={
          <ProtectedRoute>
            <div className="min-h-screen bg-base-100">
              <Header />
              <main>
                <AddRecipePage />
              </main>
            </div>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/chat-recipe" 
        element={
          <ProtectedRoute>
            <div className="min-h-screen bg-base-100">
              <Header />
              <main>
                <ChatRecipePage />
              </main>
            </div>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/recipe/:id" 
        element={
          <ProtectedRoute>
            <div className="min-h-screen bg-base-100">
              <Header />
              <main>
                <RecipeViewPage />
              </main>
            </div>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <div className="min-h-screen bg-base-100">
              <Header />
              <main>
                <ProfilePage />
              </main>
            </div>
          </ProtectedRoute>
        } 
      />

      {/* Default redirects */}
      <Route path="/" element={<Navigate to="/recipes" replace />} />
      <Route path="*" element={<Navigate to="/recipes" replace />} />
    </Routes>
>>>>>>> Stashed changes
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
<<<<<<< Updated upstream
      <BrowserRouter>
        <AuthWrapper>
          <AppContent />
        </AuthWrapper>
        <Toaster />
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
=======
      <ThemeProvider>
        <BrowserRouter>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
          <Toaster />
        </BrowserRouter>
        <ReactQueryDevtools initialIsOpen={false} />
      </ThemeProvider>
>>>>>>> Stashed changes
    </QueryClientProvider>
  );
}

export default App;
