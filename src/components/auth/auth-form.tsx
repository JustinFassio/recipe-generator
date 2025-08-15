import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { createDaisyUIButtonClasses } from '@/lib/button-migration';
import { createDaisyUIInputClasses } from '@/lib/input-migration';
import { createDaisyUILabelClasses } from '@/lib/label-migration';
import {
  createDaisyUICardClasses,
  createDaisyUICardTitleClasses,
} from '@/lib/card-migration';
import {
  createDaisyUITabsClasses,
  createDaisyUITabClasses,
  createDaisyUITabContentClasses,
} from '@/lib/tabs-migration';
import { ChefHat } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export function AuthForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
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
    }

    setLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }

    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50 to-teal-50 p-4">
      <div
        className={`${createDaisyUICardClasses('bordered')} w-full max-w-md`}
      >
        <div className="card-body text-center">
          <div className="mb-4 flex items-center justify-center">
            <ChefHat className="h-12 w-12 text-orange-500" />
          </div>
          <h3
            className={`${createDaisyUICardTitleClasses()} text-2xl font-bold`}
          >
            Recipe Generator
          </h3>
          <p className="text-sm opacity-70">
            Your digital cookbook for collecting and organizing recipes
          </p>
        </div>
        <div className="card-body">
          <div className={createDaisyUITabsClasses('bordered', 'md', 'w-full')}>
            <a
              className={createDaisyUITabClasses('tab-active')}
              onClick={() => setActiveTab('signin')}
            >
              Sign In
            </a>
            <a
              className={createDaisyUITabClasses()}
              onClick={() => setActiveTab('signup')}
            >
              Sign Up
            </a>
          </div>

          <div className={createDaisyUITabContentClasses()}>
            {activeTab === 'signin' && (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className={createDaisyUILabelClasses()}
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEmail(e.target.value)
                    }
                    className={createDaisyUIInputClasses('bordered')}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="password"
                    className={createDaisyUILabelClasses()}
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPassword(e.target.value)
                    }
                    className={createDaisyUIInputClasses('bordered')}
                    autoComplete="current-password"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className={`${createDaisyUIButtonClasses('default')} w-full`}
                  disabled={loading}
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </button>
              </form>
            )}

            {activeTab === 'signup' && (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor="signup-email"
                    className={createDaisyUILabelClasses()}
                  >
                    Email
                  </label>
                  <input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEmail(e.target.value)
                    }
                    className={createDaisyUIInputClasses('bordered')}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="signup-password"
                    className={createDaisyUILabelClasses()}
                  >
                    Password
                  </label>
                  <input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPassword(e.target.value)
                    }
                    className={createDaisyUIInputClasses('bordered')}
                    autoComplete="new-password"
                    required
                    minLength={6}
                  />
                </div>
                <button
                  type="submit"
                  className={`${createDaisyUIButtonClasses('default')} w-full`}
                  disabled={loading}
                >
                  {loading ? 'Creating Account...' : 'Sign Up'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
