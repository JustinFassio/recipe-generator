/**
 * Displays user profile data and preferences for AI assistants
 */

import React, { useState, useEffect } from 'react';
import { User, Shield, ChefHat, Clock, Globe, Zap } from 'lucide-react';
import { getUserDataForAI } from '@/lib/ai';
import type { UserPreferencesForAI } from '@/lib/ai';

interface UserProfileDisplayProps {
  userId: string;
  liveSelections?: {
    categories: string[];
    cuisines: string[];
    moods: string[];
  };
  className?: string;
}

export const UserProfileDisplay: React.FC<UserProfileDisplayProps> = ({ 
  userId, 
  liveSelections,
  className = '' 
}) => {
  const [userData, setUserData] = useState<UserPreferencesForAI | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        setIsLoading(true);
        const data = await getUserDataForAI(userId);
        setUserData(data);
      } catch (error) {
        console.warn('Failed to load user profile data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      loadUserData();
    }
  }, [userId]);

  if (isLoading) {
    return (
      <div className={`bg-base-200 p-4 rounded-lg ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-base-300 rounded w-1/4 mb-2"></div>
          <div className="h-3 bg-base-300 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!userData) {
    return null;
  }

  return (
    <div className={`bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 p-4 rounded-lg ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <User className="h-5 w-5 text-blue-600" />
        <h3 className="font-semibold text-blue-800">Your Profile</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        {/* Safety Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-red-500" />
            <span className="font-medium text-gray-700">Safety</span>
          </div>
          {userData.safety.allergies.length > 0 && (
            <div className="ml-6">
              <span className="text-red-600 font-medium">Allergies:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {userData.safety.allergies.map((allergy, index) => (
                  <span key={index} className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">
                    {allergy}
                  </span>
                ))}
              </div>
            </div>
          )}
          {userData.safety.dietary_restrictions.length > 0 && (
            <div className="ml-6">
              <span className="text-orange-600 font-medium">Restrictions:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {userData.safety.dietary_restrictions.map((restriction, index) => (
                  <span key={index} className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs">
                    {restriction}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Preferences Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <ChefHat className="h-4 w-4 text-green-500" />
            <span className="font-medium text-gray-700">Preferences</span>
          </div>
          <div className="ml-6 space-y-1">
            {userData.profile.skill_level && (
              <div className="flex items-center gap-2">
                <Zap className="h-3 w-3 text-green-500" />
                <span className="text-gray-600">Skill: <span className="font-medium">{userData.profile.skill_level}</span></span>
              </div>
            )}
            {userData.profile.time_per_meal && (
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3 text-blue-500" />
                <span className="text-gray-600">Time: <span className="font-medium">{userData.profile.time_per_meal} min</span></span>
              </div>
            )}
            {userData.cooking.preferred_cuisines.length > 0 && (
              <div className="flex items-center gap-2">
                <Globe className="h-3 w-3 text-purple-500" />
                <span className="text-gray-600">Cuisines: <span className="font-medium">{userData.cooking.preferred_cuisines.join(', ')}</span></span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Live Selection Overrides */}
      {liveSelections && (liveSelections.categories.length > 0 || liveSelections.cuisines.length > 0 || liveSelections.moods.length > 0) && (
        <div className="mt-3 pt-3 border-t border-orange-200">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-medium text-orange-700">Live Meal Overrides</span>
          </div>
          <div className="text-xs text-orange-600 space-y-1">
            {liveSelections.categories.length > 0 && (
              <p>🎯 <strong>Categories:</strong> {liveSelections.categories.join(', ')}</p>
            )}
            {liveSelections.cuisines.length > 0 && (
              <p>🌍 <strong>Cuisines:</strong> {liveSelections.cuisines.join(', ')} <span className="text-orange-500">(Override account preferences)</span></p>
            )}
            {liveSelections.moods.length > 0 && (
              <p>💫 <strong>Moods:</strong> {liveSelections.moods.join(', ')}</p>
            )}
            <p className="mt-2 font-medium">These selections override your account preferences for this specific meal!</p>
          </div>
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-blue-200">
        <p className="text-xs text-blue-600">
          💡 All AI assistants now have access to your profile and will provide personalized, safe recommendations!
        </p>
      </div>
    </div>
  );
};
