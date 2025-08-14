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
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <ChefHat className="h-8 w-8 text-orange-500" />
            <h1 className="text-2xl font-bold text-gray-900">Recipe Rolodex</h1>
          </div>
          
          <nav className="flex items-center space-x-4">
            <Button
              variant={location.pathname === '/' ? 'default' : 'ghost'}
              onClick={() => navigate('/')}
            >
              Recipes
            </Button>
            <Button
              variant={location.pathname === '/chat-recipe' ? 'default' : 'ghost'}
              onClick={() => navigate('/chat-recipe')}
              className={location.pathname === '/chat-recipe' ? '' : 'bg-orange-500 hover:bg-orange-600 text-white'}
            >
              AI Recipe Creator
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="ml-4"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}