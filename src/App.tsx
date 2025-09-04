import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthProvider';
import { ProtectedRoute, PublicRoute } from '@/components/auth/ProtectedRoute';
import { Header } from '@/components/layout/header';
import { RecipesPage } from '@/pages/recipes-page';
import { AddRecipePage } from '@/pages/add-recipe-page';
import { RecipeViewPage } from '@/pages/recipe-view-page';
import { ChatRecipePage } from '@/pages/chat-recipe-page';
import ProfilePage from '@/pages/profile-page';
import AuthCallbackPage from '@/pages/auth-callback-page';
import ExplorePage from '@/pages/explore-page';
import { AuthForm } from '@/components/auth/auth-form';
import { ThemeProvider } from '@/components/ui/theme-provider';
import Phase4Demo from '@/components/demo/Phase4Demo';
import { SelectionProvider } from '@/contexts/SelectionContext';

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
            <div className="bg-base-100 min-h-screen">
              <Header />
              <main>
                <RecipesPage />
              </main>
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/explore"
        element={
          <ProtectedRoute>
            <div className="bg-base-100 min-h-screen">
              <Header />
              <main>
                <ExplorePage />
              </main>
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/add"
        element={
          <ProtectedRoute>
            <div className="bg-base-100 min-h-screen">
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
            <div className="bg-base-100 min-h-screen">
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
            <div className="bg-base-100 min-h-screen">
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
            <div className="bg-base-100 min-h-screen">
              <Header />
              <main>
                <ProfilePage />
              </main>
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/phase4-demo"
        element={
          <ProtectedRoute>
            <div className="bg-base-100 min-h-screen">
              <Header />
              <main>
                <Phase4Demo />
              </main>
            </div>
          </ProtectedRoute>
        }
      />

      {/* Default redirects */}
      <Route path="/" element={<Navigate to="/recipes" replace />} />
      <Route path="*" element={<Navigate to="/recipes" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <AuthProvider>
            <SelectionProvider>
              <AppContent />
            </SelectionProvider>
          </AuthProvider>
          <Toaster />
        </BrowserRouter>
        <ReactQueryDevtools initialIsOpen={false} />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
