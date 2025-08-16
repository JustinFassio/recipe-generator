import { LogOut, Menu, X, User, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/DebugAuthProvider';
import { useLocation, useNavigate } from 'react-router-dom';
import { AccessibilityProvider } from '@/components/ui/accessibility-provider';
import { AppTitle } from '@/components/ui/app-title';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export function Header() {
  const { user, profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth/signin');
    } catch (error) {
      console.error('Sign out error:', error);
    }
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
              variant={location.pathname === '/recipes' ? 'default' : 'ghost'}
              onClick={() => navigate('/recipes')}
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
            
            <AccessibilityProvider />
            
            {/* User Profile Dropdown */}
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
                <div className="w-8 h-8 rounded-full">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Profile" className="rounded-full" />
                  ) : (
                    <div className="bg-primary/20 flex items-center justify-center w-full h-full rounded-full">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                  )}
                </div>
              </div>
              <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52 border">
                <li className="menu-title">
                  <span className="text-xs">
                    {profile?.full_name || user?.email || 'User'}
                    {profile?.username && (
                      <span className="text-base-content/60">@{profile.username}</span>
                    )}
                  </span>
                </li>
                <li>
                  <button onClick={() => navigate('/profile')} className="flex items-center">
                    <Settings className="w-4 h-4 mr-2" />
                    Account Settings
                  </button>
                </li>
                <li>
                  <button onClick={handleSignOut} className="flex items-center text-error">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </button>
                </li>
              </ul>
            </div>
          </nav>

          {/* Mobile Navigation */}
          <div className="flex items-center space-x-2 md:hidden">
            <AccessibilityProvider />
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
            {/* User Info */}
            <div className="flex items-center space-x-3 p-2 border-b border-base-200 mb-2">
              <div className="w-10 h-10 rounded-full">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Profile" className="rounded-full w-full h-full object-cover" />
                ) : (
                  <div className="bg-primary/20 flex items-center justify-center w-full h-full rounded-full">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{profile?.full_name || user?.email || 'User'}</span>
                {profile?.username && (
                  <span className="text-xs text-base-content/60">@{profile.username}</span>
                )}
              </div>
            </div>

            <Button
              variant={location.pathname === '/recipes' ? 'default' : 'ghost'}
              onClick={() => {
                navigate('/recipes');
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
              variant="ghost"
              onClick={() => {
                navigate('/profile');
                closeMobileMenu();
              }}
              className="w-full justify-start"
            >
              <Settings className="mr-2 h-4 w-4" />
              Account Settings
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                handleSignOut();
                closeMobileMenu();
              }}
              className="w-full justify-start text-error border-error hover:bg-error hover:text-error-content"
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
