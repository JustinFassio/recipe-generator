import { Button } from '@/components/ui/button';
import { ChefHat, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useLocation, useNavigate } from 'react-router-dom';

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="border-b bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <ChefHat className="h-8 w-8 text-orange-500" />
            <h1 className="text-2xl font-bold text-gray-900">
              Recipe Generator
            </h1>
          </div>

          <nav className="flex items-center space-x-4">
            <Button
              variant={location.pathname === '/' ? 'default' : 'ghost'}
              onClick={() => navigate('/')}
            >
              Recipes
            </Button>
            <Button
              variant={
                location.pathname === '/chat-recipe' ? 'default' : 'ghost'
              }
              onClick={() => navigate('/chat-recipe')}
              className={
                location.pathname === '/chat-recipe'
                  ? ''
                  : 'bg-orange-500 text-white hover:bg-orange-600'
              }
            >
              AI Recipe Creator
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="ml-4"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
