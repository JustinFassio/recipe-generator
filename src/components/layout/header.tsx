import {
  LogOut,
  Menu,
  X,
  User,
  Settings,
  ShoppingCart,
  Sparkles,
  BookOpen,
  Compass,
  ChefHat,
  Heart,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthProvider';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useHasPremiumAccess } from '@/hooks/useSubscription';

export function Header() {
  const { user, profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { hasAccess, isInTrial } = useHasPremiumAccess();

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
        <div className="navbar-start flex-shrink-0">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <img
              src="/recipe-generator-logo.png"
              alt="Recipe Generator Logo"
              className="h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 lg:h-24 lg:w-24 xl:h-28 xl:w-28 rounded-lg object-contain flex-shrink-0"
            />
            <div className="text-accent hidden sm:block font-bold responsive-title">
              <div>Recipe</div>
              <div>Generator</div>
            </div>
          </div>
        </div>

        {/* Centered Navigation */}
        <div className="absolute left-1/2 transform -translate-x-1/2 hidden md:flex">
          <nav className="flex items-center space-x-0">
            <Button
              variant={location.pathname === '/recipes' ? 'default' : 'ghost'}
              onClick={() => navigate('/recipes')}
              className={`${
                location.pathname === '/recipes'
                  ? 'bg-info text-info-content hover:bg-info/80'
                  : ''
              } px-2 py-1.5 sm:px-3 sm:py-2 md:px-3 md:py-2 lg:px-5 lg:py-3 flex items-center gap-1 sm:gap-1.5 md:gap-2 text-xs sm:text-sm md:text-base`}
              title="My Recipes"
            >
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
              <span className="hidden xl:inline">My Recipes</span>
            </Button>
            <Button
              variant={location.pathname === '/explore' ? 'default' : 'ghost'}
              onClick={() => navigate('/explore')}
              className="px-2 py-1.5 sm:px-3 sm:py-2 md:px-3 md:py-2 lg:px-5 lg:py-3 flex items-center gap-1 sm:gap-1.5 md:gap-2 text-xs sm:text-sm md:text-base"
              title="Explore Recipes"
            >
              <Compass className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
              <span className="hidden xl:inline">Explore</span>
            </Button>
            <Button
              variant={location.pathname === '/kitchen' ? 'default' : 'ghost'}
              onClick={() => navigate('/kitchen')}
              className={`${
                location.pathname === '/kitchen'
                  ? 'bg-success text-success-content hover:bg-success/80'
                  : ''
              } px-2 py-1.5 sm:px-3 sm:py-2 md:px-3 md:py-2 lg:px-5 lg:py-3 flex items-center gap-1 sm:gap-1.5 md:gap-2 text-xs sm:text-sm md:text-base`}
              title="My Kitchen"
            >
              <ChefHat className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
              <span className="hidden xl:inline">My Kitchen</span>
            </Button>
            <Button
              variant={location.pathname === '/cart' ? 'default' : 'ghost'}
              onClick={() => navigate('/cart')}
              className={`${
                location.pathname === '/cart'
                  ? 'bg-warning text-warning-content hover:bg-warning/80'
                  : ''
              } px-2 py-1.5 sm:px-3 sm:py-2 md:px-3 md:py-2 lg:px-5 lg:py-3 flex items-center gap-1 sm:gap-1.5 md:gap-2 text-xs sm:text-sm md:text-base`}
              title="Shopping Cart"
            >
              <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
              <span className="hidden xl:inline">Cart</span>
            </Button>
            <Button
              variant={
                location.pathname === '/evaluation-report' ? 'default' : 'ghost'
              }
              onClick={() => navigate('/evaluation-report')}
              className="px-2 py-1.5 sm:px-3 sm:py-2 md:px-3 md:py-2 lg:px-5 lg:py-3 flex items-center gap-1 sm:gap-1.5 md:gap-2 text-xs sm:text-sm md:text-base"
              title="Health Reports"
            >
              <Heart className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
              <span className="hidden xl:inline">Health Reports</span>
            </Button>
          </nav>
        </div>

        {/* Right Side - Upgrade and Account */}
        <div className="navbar-end flex-shrink-0">
          <div className="flex items-center space-x-0.5 sm:space-x-1">
            {/* Subscription Button */}
            {hasAccess ? (
              <Button
                variant="outline"
                onClick={() => navigate('/subscription')}
                className="border-primary text-primary hover:bg-primary/10 px-2 py-1.5 sm:px-3 sm:py-2 md:px-3 md:py-2 lg:px-5 lg:py-3 flex items-center gap-1 sm:gap-1.5 md:gap-2 text-xs sm:text-sm md:text-base"
                title={isInTrial ? 'Trial Active' : 'Premium Member'}
              >
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                <span className="hidden xl:inline">
                  {isInTrial ? 'Trial Active' : 'Premium Member'}
                </span>
              </Button>
            ) : (
              <Button
                variant="default"
                onClick={() => navigate('/subscription')}
                className="bg-gradient-to-r from-primary to-accent text-primary-content hover:opacity-90 px-2 py-1.5 sm:px-3 sm:py-2 md:px-3 md:py-2 lg:px-5 lg:py-3 flex items-center gap-1 sm:gap-1.5 md:gap-2 text-xs sm:text-sm md:text-base"
                title="Upgrade to Premium"
              >
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                <span className="hidden xl:inline">Upgrade to Premium</span>
              </Button>
            )}

            {/* User Profile Dropdown */}
            <div className="dropdown dropdown-end">
              <div
                tabIndex={0}
                role="button"
                className="btn btn-ghost btn-circle avatar"
              >
                <div className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-full">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="Profile"
                      className="rounded-full"
                    />
                  ) : (
                    <div className="bg-primary/20 flex h-full w-full items-center justify-center rounded-full">
                      <User className="text-primary h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
                    </div>
                  )}
                </div>
              </div>
              <ul
                tabIndex={0}
                className="menu dropdown-content menu-sm rounded-box bg-base-100 z-[100] mt-3 w-52 border p-2 shadow"
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
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="flex items-center space-x-2 md:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
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
              <BookOpen className="w-4 h-4 mr-2" />
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
              <Compass className="w-4 h-4 mr-2" />
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
              <ChefHat className="w-4 h-4 mr-2" />
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
              <Heart className="w-4 h-4 mr-2" />
              Health Reports
            </Button>

            {/* Subscription Button - Mobile */}
            {hasAccess ? (
              <Button
                variant="outline"
                onClick={() => {
                  navigate('/subscription');
                  closeMobileMenu();
                }}
                className="w-full justify-start border-primary text-primary hover:bg-primary/10"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {isInTrial ? 'Trial Active' : 'Premium Member'}
              </Button>
            ) : (
              <Button
                variant="default"
                onClick={() => {
                  navigate('/subscription');
                  closeMobileMenu();
                }}
                className="w-full justify-start bg-gradient-to-r from-primary to-accent text-primary-content hover:opacity-90"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Upgrade to Premium
              </Button>
            )}

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
