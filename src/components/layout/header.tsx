import { LogOut, Menu, X, User, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/SimpleAuthProvider';
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


            <AccessibilityProvider />

            {/* User Profile Dropdown */}
            <div className="dropdown dropdown-end">
              <div
                tabIndex={0}
                role="button"
                className="btn btn-ghost btn-circle avatar"
              >
                <div className="h-8 w-8 rounded-full">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="Profile"
                      className="rounded-full"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-primary/20">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                  )}
                </div>
              </div>
              <ul
                tabIndex={0}
                className="menu dropdown-content menu-sm z-[1] mt-3 w-52 rounded-box border bg-base-100 p-2 shadow"
              >
                <li className="menu-title">
                  <span className="text-xs">
                    {profile?.full_name || user?.email || 'User'}
                    {profile?.username && (
                      <span className="text-base-content/60">
                        @{profile.username}
                      </span>
                    )}
                  </span>
                </li>
                <li>
                  <button
                    onClick={() => navigate('/profile')}
                    className="flex items-center"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Account Settings
                  </button>
                </li>
                <li>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center text-error"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
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
            <div className="mb-2 flex items-center space-x-3 border-b border-base-200 p-2">
              <div className="h-10 w-10 rounded-full">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Profile"
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-primary/20">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  {profile?.full_name || user?.email || 'User'}
                </span>
                {profile?.username && (
                  <span className="text-base-content/60 text-xs">
                    @{profile.username}
                  </span>
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
              className="w-full justify-start border-error text-error hover:bg-error hover:text-error-content"
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
