import { LogOut, Menu, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useLocation, useNavigate } from 'react-router-dom';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { AppTitle } from '@/components/ui/app-title';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="relative">
      <header className="navbar border-b bg-base-100 shadow-sm">
        <div className="navbar-start">
          <div className="flex items-center space-x-4">
            <img
              src="/recipe-generator-logo.png"
              alt="Recipe Generator Logo"
              className="h-12 w-12 rounded-full object-cover"
            />
            <AppTitle size="sm" className="text-base-content" />
          </div>
        </div>

        <div className="navbar-end">
          {/* Desktop Navigation */}
          <nav className="hidden items-center space-x-4 md:flex">
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
              className={
                location.pathname === '/chat-recipe'
                  ? ''
                  : 'bg-orange-500 text-white hover:bg-orange-600'
              }
              onClick={() => navigate('/chat-recipe')}
            >
              AI Recipe Creator
            </Button>
            <ThemeToggle />
            <Button
              variant="outline"
              size="sm"
              className="ml-4"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </nav>

          {/* Mobile Navigation */}
          <div className="flex items-center space-x-2 md:hidden">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 top-16 z-50 border-b border-gray-200 bg-base-100 shadow-lg md:hidden">
          <nav className="flex flex-col space-y-2 p-4">
            <Button
              variant={location.pathname === '/' ? 'default' : 'ghost'}
              onClick={() => {
                navigate('/');
                closeMobileMenu();
              }}
              className="w-full justify-start"
            >
              Recipes
            </Button>
            <Button
              variant={
                location.pathname === '/chat-recipe' ? 'default' : 'ghost'
              }
              className={`w-full justify-start ${
                location.pathname === '/chat-recipe'
                  ? ''
                  : 'bg-orange-500 text-white hover:bg-orange-600'
              }`}
              onClick={() => {
                navigate('/chat-recipe');
                closeMobileMenu();
              }}
            >
              AI Recipe Creator
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                handleSignOut();
                closeMobileMenu();
              }}
              className="w-full justify-start"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </nav>
        </div>
      )}
    </div>
  );
}
