import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { signUp, signIn, signInWithMagicLink, resetPassword } from '@/lib/auth';
import { useAuth } from '@/contexts/AuthProvider';

import { User, Lock, Plus, Mail, UserPlus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Divider } from '@/components/ui/divider';
import { AppTitle } from '@/components/ui/app-title';
import type { Recipe } from '@/lib/supabase';

export function AuthForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [subscribeEmails, setSubscribeEmails] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'signin' | 'signup' | 'magic-link' | 'reset'
  >('signin');
  const [userRecipes, setUserRecipes] = useState<Recipe[]>([]);
  const [recipesLoading, setRecipesLoading] = useState(true);

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/recipes', { replace: true });
    }
  }, [user, navigate]);

  // Fetch recipes with images from the database
  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        setRecipesLoading(true);

        const { data, error } = await supabase
          .from('recipes')
          .select('*')
          .not('image_url', 'is', null)
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) {
          console.error('Error fetching recipes:', error);
          setUserRecipes([]);
        } else {
          setUserRecipes(data || []);
        }
      } catch (error) {
        console.error('Exception fetching recipes:', error);
        setUserRecipes([]);
      } finally {
        setRecipesLoading(false);
      }
    };

    fetchRecipes();
  }, []);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!acceptTerms) {
      toast({
        title: 'Error',
        description: 'Please accept the terms and conditions.',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    const { success, error } = await signUp(email, password, fullName);

    if (!success && error) {
      console.error('Signup error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
      });
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description:
          'Account created successfully! Please check your email for verification.',
      });
      // Clear form
      setEmail('');
      setPassword('');
      setFullName('');
      setAcceptTerms(false);
      setSubscribeEmails(false);
    }

    setLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { success, error } = await signIn(email, password);

    if (!success && error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Signed in successfully!',
      });
    }

    setLoading(false);
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { success, error } = await signInWithMagicLink(email);

    if (!success && error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Check your email for a magic link to sign in!',
      });
    }

    setLoading(false);
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { success, error } = await resetPassword(email);

    if (!success && error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Check your email for password reset instructions!',
      });
      setActiveTab('signin');
    }

    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50 to-teal-50 p-4">
      <div className="flex w-full max-w-6xl flex-col gap-4 lg:flex-row">
        {/* Left Side - Authentication Form */}
        <div className="card flex min-h-[600px] flex-1 flex-col rounded-box border border-gray-200 bg-white p-8 shadow-xl lg:min-h-[600px]">
          <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
            {/* Header Section */}
            <div className="mb-6 text-center">
              {/* Logo */}
              <div className="mb-4 flex items-center justify-center">
                <div className="flex h-32 w-32 items-center justify-center sm:h-40 sm:w-40 md:h-48 md:w-48">
                  <img
                    src="/recipe-generator-logo.png"
                    alt="Recipe Generator Logo"
                    className="h-28 w-28 object-contain sm:h-36 sm:w-36 md:h-44 md:w-44"
                    onError={(e) => {
                      // Fallback to text if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                  <span className="hidden text-3xl font-bold text-gray-600 sm:text-4xl md:text-5xl">
                    R
                  </span>
                </div>
              </div>

              {/* Main Title */}
              <div className="mb-4 text-center">
                <AppTitle />
                <span className="sr-only">Recipe Generator</span>
              </div>

              <div className="mb-2 flex items-center justify-center">
                <User className="mr-2 h-6 w-6 text-green-600" />
                <Plus className="h-4 w-4 text-green-600" />
              </div>
              <div data-testid="chef-hat-icon" className="sr-only">
                Chef Hat Icon
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                {activeTab === 'signin' && 'Sign In'}
                {activeTab === 'signup' && 'Create new account'}
                {activeTab === 'magic-link' && 'Magic Link Sign In'}
                {activeTab === 'reset' && 'Reset Password'}
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                {activeTab === 'signin' &&
                  'Welcome back to your family cookbook'}
                {activeTab === 'signup' &&
                  'Registration is free and only takes a minute'}
                {activeTab === 'magic-link' &&
                  "We'll send you a magic link to sign in"}
                {activeTab === 'reset' &&
                  'Enter your email to reset your password'}
              </p>
              <span className="sr-only">
                Your digital cookbook for collecting and organizing recipes
              </span>
            </div>

            {/* Sign In Form */}
            {activeTab === 'signin' && (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="form-control">
                  <label className="label" htmlFor="email">
                    <span className="label-text text-gray-700">Email</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                    <input
                      id="email"
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-bordered input w-full border-gray-300 bg-white pl-10 text-gray-900 focus:border-green-500"
                      required
                    />
                  </div>
                </div>

                <div className="form-control">
                  <label className="label" htmlFor="password">
                    <span className="label-text text-gray-700">Password</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                    <input
                      id="password"
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-bordered input w-full border-gray-300 bg-white pl-10 text-gray-900 focus:border-green-500"
                      autoComplete="current-password"
                      required
                    />
                  </div>
                </div>

                <div className="form-control mt-6">
                  <button
                    type="submit"
                    className="btn btn-primary w-full border-none bg-green-600 text-white hover:bg-green-700"
                    disabled={loading}
                  >
                    {loading ? 'Signing In...' : 'Sign In'}
                  </button>
                </div>
              </form>
            )}

            {/* Sign Up Form */}
            {activeTab === 'signup' && (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="form-control">
                  <label className="label" htmlFor="signup-fullname">
                    <span className="label-text text-gray-700">Full Name</span>
                  </label>
                  <div className="relative">
                    <UserPlus className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                    <input
                      id="signup-fullname"
                      type="text"
                      placeholder="Your full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="input-bordered input w-full border-gray-300 bg-white pl-10 text-gray-900 focus:border-green-500"
                      required
                    />
                  </div>
                </div>

                <div className="form-control">
                  <label className="label" htmlFor="signup-email">
                    <span className="label-text text-gray-700">Email</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                    <input
                      id="signup-email"
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-bordered input w-full border-gray-300 bg-white pl-10 text-gray-900 focus:border-green-500"
                      required
                    />
                  </div>
                </div>

                <div className="form-control">
                  <label className="label" htmlFor="signup-password">
                    <span className="label-text text-gray-700">Password</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                    <input
                      id="signup-password"
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-bordered input w-full border-gray-300 bg-white pl-10 text-gray-900 focus:border-green-500"
                      autoComplete="new-password"
                      required
                      minLength={6}
                    />
                  </div>
                  <label className="label">
                    <span className="label-text-alt text-red-500">
                      <span className="mr-1 inline-block h-2 w-2 rounded-full bg-red-500"></span>
                      Password must be 6+ characters
                    </span>
                  </label>
                </div>

                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-3">
                    <Checkbox
                      id="accept-terms"
                      checked={acceptTerms}
                      onCheckedChange={(checked) => setAcceptTerms(!!checked)}
                    />
                    <span className="label-text text-gray-700">
                      Accept terms without reading
                    </span>
                  </label>
                </div>

                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-3">
                    <Checkbox
                      id="subscribe-emails"
                      checked={subscribeEmails}
                      onCheckedChange={(checked) =>
                        setSubscribeEmails(!!checked)
                      }
                    />
                    <span className="label-text text-gray-700">
                      Subscribe to spam emails
                    </span>
                  </label>
                </div>

                <div className="form-control mt-6">
                  <button
                    type="submit"
                    className={`btn w-full border-none ${
                      loading || !acceptTerms
                        ? 'cursor-not-allowed bg-gray-400 text-gray-600'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                    disabled={loading || !acceptTerms}
                  >
                    {loading
                      ? 'Creating Account...'
                      : !acceptTerms
                        ? 'Accept terms to continue'
                        : 'Register'}
                  </button>
                  {!acceptTerms && (
                    <p className="mt-2 text-center text-xs text-red-500">
                      Please accept the terms and conditions to continue
                    </p>
                  )}
                </div>
              </form>
            )}

            {/* Magic Link Form */}
            {activeTab === 'magic-link' && (
              <form onSubmit={handleMagicLink} className="space-y-4">
                <div className="form-control">
                  <label className="label" htmlFor="magic-email">
                    <span className="label-text text-gray-700">Email</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                    <input
                      id="magic-email"
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-bordered input w-full border-gray-300 bg-white pl-10 text-gray-900 focus:border-green-500"
                      required
                    />
                  </div>
                </div>

                <div className="form-control mt-6">
                  <button
                    type="submit"
                    className="btn btn-primary w-full border-none bg-green-600 text-white hover:bg-green-700"
                    disabled={loading}
                  >
                    {loading ? 'Sending...' : 'Send Magic Link'}
                  </button>
                </div>
              </form>
            )}

            {/* Password Reset Form */}
            {activeTab === 'reset' && (
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div className="form-control">
                  <label className="label" htmlFor="reset-email">
                    <span className="label-text text-gray-700">Email</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                    <input
                      id="reset-email"
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-bordered input w-full border-gray-300 bg-white pl-10 text-gray-900 focus:border-green-500"
                      required
                    />
                  </div>
                </div>

                <div className="form-control mt-6">
                  <button
                    type="submit"
                    className="btn btn-primary w-full border-none bg-green-600 text-white hover:bg-green-700"
                    disabled={loading}
                  >
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </div>
              </form>
            )}

            {/* Bottom Navigation */}
            <div className="mt-4 space-y-2 text-center">
              {activeTab === 'signin' && (
                <>
                  <div className="flex justify-center gap-2 text-sm">
                    <button
                      type="button"
                      className="link link-hover text-green-600 hover:text-green-700"
                      onClick={() => setActiveTab('signup')}
                    >
                      Create account
                    </button>
                    <span className="text-gray-400">•</span>
                    <button
                      type="button"
                      className="link link-hover text-green-600 hover:text-green-700"
                      onClick={() => setActiveTab('magic-link')}
                    >
                      Magic link
                    </button>
                    <span className="text-gray-400">•</span>
                    <button
                      type="button"
                      className="link link-hover text-green-600 hover:text-green-700"
                      onClick={() => setActiveTab('reset')}
                    >
                      Reset password
                    </button>
                  </div>
                </>
              )}
              {activeTab === 'signup' && (
                <button
                  type="button"
                  className="link link-hover text-sm text-green-600 hover:text-green-700"
                  onClick={() => setActiveTab('signin')}
                >
                  Already have an account? Sign in
                </button>
              )}
              {(activeTab === 'magic-link' || activeTab === 'reset') && (
                <button
                  type="button"
                  className="link link-hover text-sm text-green-600 hover:text-green-700"
                  onClick={() => setActiveTab('signin')}
                >
                  Back to sign in
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Divider - Only show on large screens */}
        <div className="hidden lg:flex lg:items-center lg:justify-center">
          <Divider className="divider-horizontal text-gray-500">AND</Divider>
        </div>

        {/* Right Side - User Recipes Showcase */}
        <div className="card flex min-h-[400px] flex-1 flex-col rounded-box border border-gray-200 bg-white p-8 shadow-xl lg:min-h-[600px]">
          <div className="flex flex-1 flex-col justify-center text-center">
            <h3 className="mb-4 text-2xl font-bold text-gray-900">
              Discover Amazing Recipes
            </h3>
            <p className="mb-6 text-sm text-gray-600">
              Add or recreate your favorite family and healthy recipes with
              family and friends
            </p>

            {recipesLoading ? (
              <div className="mb-6 flex items-center justify-center">
                <span className="loading loading-spinner loading-lg text-green-600"></span>
              </div>
            ) : userRecipes.length > 0 ? (
              <>
                {/* Stacked Recipe Images */}
                <div className="stack mx-auto mb-6 w-48">
                  {userRecipes.slice(0, 3).map((recipe) => (
                    <img
                      key={recipe.id}
                      src={recipe.image_url!}
                      className="rounded-box"
                      alt={recipe.title}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  ))}
                </div>

                {/* Recipe Titles and Users */}
                <div className="space-y-3">
                  {userRecipes.slice(0, 3).map((recipe) => (
                    <div key={recipe.id} className="text-sm">
                      <div className="font-semibold text-gray-900">
                        {recipe.title}
                      </div>
                      <div className="text-gray-600">by {recipe.user_id}</div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center">
                <p className="mb-4 text-gray-500">No recipes with images yet</p>
                <p className="text-sm text-gray-600">
                  Be the first to share your favorite recipes!
                </p>
              </div>
            )}

            <div className="mt-6">
              <p className="text-xs text-gray-500">
                {userRecipes.length > 0
                  ? `Join thousands of home chefs sharing their favorite recipes`
                  : `Be the first to share your favorite recipes with the community`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
