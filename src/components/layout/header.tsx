import { LogOut, Menu, X, User, Settings, ShoppingCart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthProvider';
import { useLocation, useNavigate } from 'react-router-dom';
// AccessibilityProvider removed to prevent duplicate theme application
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
      <header className="navbar bg-base-300 text-base-content border-b shadow-sm">
        <div className="navbar-start">
          <div className="flex items-center space-x-4">
            <img
              src="/recipe-generator-logo.png"
              alt="Recipe Generator Logo"
              className="h-18 w-18 rounded-lg object-contain"
            />
            <AppTitle size="sm" className="text-accent" />
          </div>
        </div>

        <div className="navbar-end">
          {/* Desktop Navigation */}
          <nav className="hidden items-center space-x-4 md:flex">
            <Button
              variant={location.pathname === '/recipes' ? 'default' : 'ghost'}
              onClick={() => navigate('/recipes')}
              className={
                location.pathname === '/recipes'
                  ? 'bg-info text-info-content hover:bg-info/80'
                  : ''
              }
            >
              My Recipes
            </Button>
            <Button
              variant={location.pathname === '/explore' ? 'default' : 'ghost'}
              onClick={() => navigate('/explore')}
            >
              Explore
            </Button>
            <Button
              variant={location.pathname === '/kitchen' ? 'default' : 'ghost'}
              onClick={() => navigate('/kitchen')}
              className={
                location.pathname === '/kitchen'
                  ? 'bg-success text-success-content hover:bg-success/80'
                  : ''
              }
            >
              My Kitchen
            </Button>
            <Button
              variant={location.pathname === '/cart' ? 'default' : 'ghost'}
              onClick={() => navigate('/cart')}
              className={
                location.pathname === '/cart'
                  ? 'bg-warning text-warning-content hover:bg-warning/80'
                  : ''
              }
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Cart
            </Button>
            <Button
              variant={
                location.pathname === '/evaluation-report' ? 'default' : 'ghost'
              }
              onClick={() => navigate('/evaluation-report')}
            >
              Health Reports
            </Button>

            {/* AccessibilityProvider removed to prevent duplicate theme application */}

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
                    <div className="bg-primary/20 flex h-full w-full items-center justify-center rounded-full">
                      <User className="text-primary h-4 w-4" />
                    </div>
                  )}
                </div>
              </div>
              <ul
                tabIndex={0}
                className="menu dropdown-content menu-sm rounded-box bg-base-100 z-[1] mt-3 w-52 border p-2 shadow"
              >
                <li className="menu-title">
                  <span className="text-xs">
                    {profile?.username ? (
                      <span className="text-base-content/60">
                        @{profile.username}
                      </span>
                    ) : profile?.full_name ? (
                      profile.full_name
                    ) : (
                      user?.email || 'User'
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
                    className="text-error flex items-center"
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
            {/* AccessibilityProvider removed to prevent duplicate theme application */}
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
        <div className="bg-base-100 fixed inset-0 top-16 z-50 border-b border-gray-200 shadow-lg md:hidden">
          <nav className="flex flex-col space-y-2 p-4">
            {/* User Info */}
            <div className="border-base-200 mb-2 flex items-center space-x-3 border-b p-2">
              <div className="h-10 w-10 rounded-full">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Profile"
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <div className="bg-primary/20 flex h-full w-full items-center justify-center rounded-full">
                    <User className="text-primary h-5 w-5" />
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  {profile?.username ? (
                    <span className="text-base-content/60">
                      @{profile.username}
                    </span>
                  ) : profile?.full_name ? (
                    profile.full_name
                  ) : (
                    user?.email || 'User'
                  )}
                </span>
              </div>
            </div>

            <Button
              variant={location.pathname === '/recipes' ? 'default' : 'ghost'}
              onClick={() => {
                navigate('/recipes');
                closeMobileMenu();
              }}
              className={`w-full justify-start ${location.pathname === '/recipes' ? 'bg-success text-success-content hover:bg-success/80' : ''}`}
            >
              My Recipes
            </Button>
            <Button
              variant={location.pathname === '/explore' ? 'default' : 'ghost'}
              onClick={() => {
                navigate('/explore');
                closeMobileMenu();
              }}
              className="w-full justify-start"
            >
              Explore
            </Button>
            <Button
              variant={location.pathname === '/kitchen' ? 'default' : 'ghost'}
              onClick={() => {
                navigate('/kitchen');
                closeMobileMenu();
              }}
              className={`w-full justify-start ${location.pathname === '/kitchen' ? 'bg-success text-success-content hover:bg-success/80' : ''}`}
            >
              My Kitchen
            </Button>
            <Button
              variant={location.pathname === '/cart' ? 'default' : 'ghost'}
              onClick={() => {
                navigate('/cart');
                closeMobileMenu();
              }}
              className={`w-full justify-start ${location.pathname === '/cart' ? 'bg-warning text-warning-content hover:bg-warning/80' : ''}`}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Shopping Cart
            </Button>
            <Button
              variant={
                location.pathname === '/evaluation-report' ? 'default' : 'ghost'
              }
              onClick={() => {
                navigate('/evaluation-report');
                closeMobileMenu();
              }}
              className="w-full justify-start"
            >
              Health Reports
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
              className="border-error text-error hover:bg-error hover:text-error-content w-full justify-start"
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
