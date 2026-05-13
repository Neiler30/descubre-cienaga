import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getSupabaseClient } from '@/template';
import { TouristPlace, TOURIST_PLACES, LEVELS } from '@/constants/places';
import {
  fetchPlaces,
  fetchUserProfile,
  upsertUserProfile,
  addPointsDB,
  markVisitDB,
  markQRScanDB,
  DBUserProfile,
} from '@/services/supabaseService';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  points: number;
  visitedPlaces: string[];
  scannedQRs: string[];
  unlockedBadges: string[];
  joinDate: string;
  isAdmin: boolean;
}

export interface AppContextType {
  user: UserProfile | null;
  authUser: any | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  updateUser: (updates: Partial<UserProfile>) => Promise<void>;
  addPoints: (points: number) => Promise<void>;
  markPlaceVisited: (placeId: string, points: number) => Promise<void>;
  markQRScanned: (qrCode: string, placeId: string, points: number) => Promise<{ alreadyScanned: boolean }>;
  unlockBadge: (badge: string) => void;
  isVisited: (placeId: string) => boolean;
  isQRScanned: (qrCode: string) => boolean;
  currentLevel: typeof LEVELS[0];
  nextLevel: typeof LEVELS[0] | null;
  progressToNextLevel: number;
  places: TouristPlace[];
  nearbyPlaces: TouristPlace[];
  setNearbyPlaces: (places: TouristPlace[]) => void;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

const supabase = getSupabaseClient();

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authUser, setAuthUser] = useState<any | null>(null);
  const [nearbyPlaces, setNearbyPlaces] = useState<TouristPlace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [places, setPlaces] = useState<TouristPlace[]>(TOURIST_PLACES);

  useEffect(() => {
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setAuthUser(session?.user ?? null);
      if (session?.user) {
        await loadProfile(session.user);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    // Load places from DB
    fetchPlaces().then((dbPlaces) => {
      if (dbPlaces.length > 0) setPlaces(dbPlaces);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (authU: any) => {
    setIsLoading(true);
    try {
      let profile = await fetchUserProfile(authU.id);
      if (!profile) {
        // Create profile for new user
        await upsertUserProfile(authU.id, {
          id: authU.id,
          email: authU.email || '',
          username: authU.user_metadata?.username || authU.email?.split('@')[0] || 'Explorador',
          points: 0,
          visited_places: [],
          scanned_qrs: [],
          unlocked_badges: [],
          join_date: new Date().toISOString(),
          avatar_url: `https://api.dicebear.com/7.x/adventurer/svg?seed=${authU.id}&backgroundColor=1A2035`,
          is_admin: false,
        });
        profile = await fetchUserProfile(authU.id);
      }
      if (profile) {
        setUser(mapProfileToUser(profile, authU));
      }
    } catch (e) {
      console.log('loadProfile error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = useCallback(async () => {
    if (!authUser) return;
    const profile = await fetchUserProfile(authUser.id);
    if (profile) setUser(mapProfileToUser(profile, authUser));
  }, [authUser]);

  const updateUser = useCallback(async (updates: Partial<UserProfile>) => {
    if (!authUser) return;
    setUser((prev) => (prev ? { ...prev, ...updates } : prev));
    await upsertUserProfile(authUser.id, {
      username: updates.name,
      avatar_url: updates.avatar,
    });
  }, [authUser]);

  const addPoints = useCallback(async (pts: number) => {
    if (!authUser) return;
    setUser((prev) => (prev ? { ...prev, points: prev.points + pts } : prev));
    await addPointsDB(authUser.id, pts);
  }, [authUser]);

  const markPlaceVisited = useCallback(async (placeId: string, pts: number) => {
    if (!authUser || !user) return;
    if (user.visitedPlaces.includes(placeId)) return;
    setUser((prev) =>
      prev ? { ...prev, visitedPlaces: [...prev.visitedPlaces, placeId], points: prev.points + pts } : prev
    );
    await markVisitDB(authUser.id, placeId, pts);
  }, [authUser, user]);

  const markQRScanned = useCallback(async (qrCode: string, placeId: string, pts: number) => {
    if (!authUser) return { alreadyScanned: false };
    const result = await markQRScanDB(authUser.id, qrCode, placeId, pts);
    await refreshProfile();
    return { alreadyScanned: result.alreadyScanned };
  }, [authUser, refreshProfile]);

  const unlockBadge = useCallback((badge: string) => {
    setUser((prev) => {
      if (!prev || prev.unlockedBadges.includes(badge)) return prev;
      return { ...prev, unlockedBadges: [...prev.unlockedBadges, badge] };
    });
  }, []);

  const isVisited = useCallback(
    (placeId: string) => user?.visitedPlaces.includes(placeId) ?? false,
    [user]
  );

  const isQRScanned = useCallback(
    (qrCode: string) => user?.scannedQRs.includes(qrCode) ?? false,
    [user]
  );

  const points = user?.points ?? 0;
  const currentLevel = LEVELS.reduce((prev, curr) => {
    return points >= curr.minPoints ? curr : prev;
  }, LEVELS[0]);

  const currentLevelIndex = LEVELS.indexOf(currentLevel);
  const nextLevel = currentLevelIndex < LEVELS.length - 1 ? LEVELS[currentLevelIndex + 1] : null;

  const progressToNextLevel = nextLevel
    ? ((points - currentLevel.minPoints) / (nextLevel.minPoints - currentLevel.minPoints)) * 100
    : 100;

  return (
    <AppContext.Provider
      value={{
        user,
        authUser,
        isAuthenticated: !!authUser,
        isAdmin: user?.isAdmin ?? false,
        updateUser,
        addPoints,
        markPlaceVisited,
        markQRScanned,
        unlockBadge,
        isVisited,
        isQRScanned,
        currentLevel,
        nextLevel,
        progressToNextLevel,
        places,
        nearbyPlaces,
        setNearbyPlaces,
        isLoading,
        refreshProfile,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

function mapProfileToUser(profile: DBUserProfile, authUser: any): UserProfile {
  return {
    id: profile.id,
    name: profile.username || authUser.email?.split('@')[0] || 'Explorador',
    email: profile.email || authUser.email || '',
    avatar:
      profile.avatar_url ||
      `https://api.dicebear.com/7.x/adventurer/svg?seed=${profile.id}&backgroundColor=1A2035`,
    points: profile.points || 0,
    visitedPlaces: profile.visited_places || [],
    scannedQRs: profile.scanned_qrs || [],
    unlockedBadges: profile.unlocked_badges || [],
    joinDate: profile.join_date || new Date().toISOString(),
    isAdmin: profile.is_admin || false,
  };
}
