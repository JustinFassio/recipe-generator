import { createDaisyUIButtonClasses } from '@/lib/button-migration';
import { ChefHat, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useLocation, useNavigate } from 'react-router-dom';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="navbar border-b bg-base-100 shadow-sm">
      <div className="navbar-start">
        <div className="flex items-center space-x-4">
          <ChefHat className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold text-base-content">
            Recipe Generator
          </h1>
        </div>
      </div>

      <div className="navbar-end">
        <nav className="flex items-center space-x-4">
          <button
            className={createDaisyUIButtonClasses(
              location.pathname === '/' ? 'default' : 'ghost'
            )}
            onClick={() => navigate('/')}
          >
            Recipes
          </button>
          <button
            className={`${createDaisyUIButtonClasses(location.pathname === '/chat-recipe' ? 'default' : 'ghost')} ${
              location.pathname === '/chat-recipe'
                ? ''
                : 'bg-orange-500 text-white hover:bg-orange-600'
            }`}
            onClick={() => navigate('/chat-recipe')}
          >
            AI Recipe Creator
          </button>
          <ThemeToggle />
          <button
            className={`${createDaisyUIButtonClasses('outline', 'sm')} ml-4`}
            onClick={handleSignOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </button>
        </nav>
      </div>
    </header>
  );
}
