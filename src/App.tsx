import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthWrapper } from '@/components/auth/auth-wrapper';
import { Header } from '@/components/layout/header';
import { RecipesPage } from '@/pages/recipes-page';
import { AddRecipePage } from '@/pages/add-recipe-page';
import { RecipeViewPage } from '@/pages/recipe-view-page';
import { ChatRecipePage } from '@/pages/chat-recipe-page';
import { CardMigrationTestPage } from '@/pages/card-migration-test-page';

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
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<RecipesPage />} />
          <Route path="/add" element={<AddRecipePage />} />
          <Route path="/chat-recipe" element={<ChatRecipePage />} />
          <Route path="/recipe/:id" element={<RecipeViewPage />} />
          <Route path="/card-test" element={<CardMigrationTestPage />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthWrapper>
          <AppContent />
        </AuthWrapper>
        <Toaster />
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
