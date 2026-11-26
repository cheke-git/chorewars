import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { apiRequest } from '@/lib/api';
import {
  STORAGE_KEYS,
  deleteStoredValue,
  getStoredValue,
  setStoredValue,
} from '@/lib/storage';
import type {
  AccountDTO,
  FortStateDTO,
  HomeType,
  ProfileDTO,
  ProfileRole,
  RecurrenceType,
} from '@/shared/types';

export interface SetupFortPayload {
  name: string;
  homeType: HomeType;
  bedroomCount: number;
  bathroomCount: number;
  hasKitchen: boolean;
  hasYard: boolean;
  hasPets: boolean;
  cochPin: string;
  members: {
    name: string;
    role: ProfileRole;
    isAdult: boolean;
    avatarKey: string;
  }[];
  starterReward?: {
    title?: string;
    targetXp: number;
    excludeAdults: boolean;
  };
}

interface CreateTaskPayload {
  title: string;
  areaId: string | null;
  xp: number;
  recurrenceType: RecurrenceType;
  cooldownDays?: number | null;
  assignedProfileId?: string | null;
}

interface CreateRewardPayload {
  title?: string;
  targetXp: number;
  excludedProfileIds: string[];
}

interface AppContextValue {
  isHydrating: boolean;
  token: string | null;
  account: AccountDTO | null;
  fortState: FortStateDTO | null;
  activeProfile: ProfileDTO | null;
  lockedProfileId: string | null;
  cochUnlocked: boolean;
  login: (email: string, password: string) => Promise<{ hasFort: boolean }>;
  register: (email: string, password: string) => Promise<{ hasFort: boolean }>;
  logout: () => Promise<void>;
  setupFort: (payload: SetupFortPayload) => Promise<FortStateDTO>;
  refreshFort: () => Promise<void>;
  selectProfile: (profileId: string, lockDevice?: boolean) => Promise<void>;
  unlockDevice: () => Promise<void>;
  verifyCochPin: (pin: string) => Promise<void>;
  lockCoch: () => void;
  startTask: (taskId: string) => Promise<void>;
  completeTask: (taskId: string, comment?: string) => Promise<void>;
  cancelTask: (taskId: string) => Promise<void>;
  createArea: (name: string, defaultXp: number) => Promise<void>;
  createTask: (payload: CreateTaskPayload) => Promise<void>;
  createProfile: (payload: {
    name: string;
    role: ProfileRole;
    isAdult: boolean;
    avatarKey: string;
  }) => Promise<void>;
  createReward: (payload: CreateRewardPayload) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

interface AuthResponse {
  token: string;
  account: AccountDTO;
  hasFort: boolean;
}

interface MeResponse {
  account: AccountDTO;
  hasFort: boolean;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [isHydrating, setIsHydrating] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [account, setAccount] = useState<AccountDTO | null>(null);
  const [fortState, setFortState] = useState<FortStateDTO | null>(null);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [lockedProfileId, setLockedProfileId] = useState<string | null>(null);
  const [cochUnlocked, setCochUnlocked] = useState(false);

  const loadFortForToken = useCallback(
    async (authToken: string, preferredProfileId?: string | null) => {
      const state = await apiRequest<FortStateDTO>('/api/forts/current', { token: authToken });
      setFortState(state);

      if (preferredProfileId && state.profiles.some((p) => p.id === preferredProfileId)) {
        setActiveProfileId(preferredProfileId);
      }
      return state;
    },
    []
  );

  useEffect(() => {
    let mounted = true;

    async function hydrate() {
      try {
        const [savedToken, savedLockedId, savedActiveId] = await Promise.all([
          getStoredValue(STORAGE_KEYS.AUTH_TOKEN),
          getStoredValue(STORAGE_KEYS.LOCKED_PROFILE_ID),
          getStoredValue(STORAGE_KEYS.ACTIVE_PROFILE_ID),
        ]);

        if (!mounted) return;
        if (savedLockedId) {
          setLockedProfileId(savedLockedId);
        }

        if (!savedToken) {
          return;
        }

        const me = await apiRequest<MeResponse>('/api/auth/me', { token: savedToken });
        if (!mounted) return;

        setToken(savedToken);
        setAccount(me.account);

        if (me.hasFort) {
          await loadFortForToken(savedToken, savedLockedId ?? savedActiveId);
        }
      } catch {
        await deleteStoredValue(STORAGE_KEYS.AUTH_TOKEN);
        if (mounted) {
          setToken(null);
          setAccount(null);
          setFortState(null);
        }
      } finally {
        if (mounted) {
          setIsHydrating(false);
        }
      }
    }

    hydrate();
    return () => {
      mounted = false;
    };
  }, [loadFortForToken]);

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await apiRequest<AuthResponse>('/api/auth/login', {
        method: 'POST',
        body: { email, password },
      });

      await setStoredValue(STORAGE_KEYS.AUTH_TOKEN, result.token);
      setToken(result.token);
      setAccount(result.account);
      setCochUnlocked(false);

      if (result.hasFort) {
        await loadFortForToken(result.token, lockedProfileId);
      } else {
        setFortState(null);
      }

      return { hasFort: result.hasFort };
    },
    [loadFortForToken, lockedProfileId]
  );

  const register = useCallback(async (email: string, password: string) => {
    const result = await apiRequest<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: { email, password },
    });

    await setStoredValue(STORAGE_KEYS.AUTH_TOKEN, result.token);
    setToken(result.token);
    setAccount(result.account);
    setFortState(null);
    setActiveProfileId(null);
    setCochUnlocked(false);

    return { hasFort: false };
  }, []);

  const logout = useCallback(async () => {
    await Promise.all([
      deleteStoredValue(STORAGE_KEYS.AUTH_TOKEN),
      deleteStoredValue(STORAGE_KEYS.ACTIVE_PROFILE_ID),
      deleteStoredValue(STORAGE_KEYS.LOCKED_PROFILE_ID),
    ]);
    setToken(null);
    setAccount(null);
    setFortState(null);
    setActiveProfileId(null);
    setLockedProfileId(null);
    setCochUnlocked(false);
  }, []);

  const setupFort = useCallback(
    async (payload: SetupFortPayload) => {
      if (!token) throw new Error('Not authenticated.');
      const state = await apiRequest<FortStateDTO>('/api/forts/setup', {
        method: 'POST',
        body: payload,
        token,
      });
      setFortState(state);
      const firstProfile = state.profiles[0] ?? null;
      if (firstProfile) {
        setActiveProfileId(firstProfile.id);
        await setStoredValue(STORAGE_KEYS.ACTIVE_PROFILE_ID, firstProfile.id);
      }
      return state;
    },
    [token]
  );

  const refreshFort = useCallback(async () => {
    if (!token) return;
    await loadFortForToken(token, lockedProfileId ?? activeProfileId);
  }, [activeProfileId, loadFortForToken, lockedProfileId, token]);

  const selectProfile = useCallback(async (profileId: string, lockDevice = false) => {
    setActiveProfileId(profileId);
    setCochUnlocked(false);
    await setStoredValue(STORAGE_KEYS.ACTIVE_PROFILE_ID, profileId);
    if (lockDevice) {
      setLockedProfileId(profileId);
      await setStoredValue(STORAGE_KEYS.LOCKED_PROFILE_ID, profileId);
    }
  }, []);

  const unlockDevice = useCallback(async () => {
    setLockedProfileId(null);
    await deleteStoredValue(STORAGE_KEYS.LOCKED_PROFILE_ID);
  }, []);

  const verifyCochPin = useCallback(
    async (pin: string) => {
      if (!token) throw new Error('Not authenticated.');
      await apiRequest<{ valid: boolean }>('/api/forts/verify-pin', {
        method: 'POST',
        body: { pin },
        token,
      });
      setCochUnlocked(true);
    },
    [token]
  );

  const lockCoch = useCallback(() => {
    setCochUnlocked(false);
  }, []);

  const activeProfile = useMemo(() => {
    if (!fortState || !activeProfileId) return null;
    return fortState.profiles.find((p) => p.id === activeProfileId) ?? null;
  }, [activeProfileId, fortState]);

  const startTask = useCallback(
    async (taskId: string) => {
      if (!token || !activeProfile) throw new Error('Select a Character profile first.');
      const state = await apiRequest<FortStateDTO>(`/api/tasks/${taskId}/start`, {
        method: 'POST',
        body: { profileId: activeProfile.id },
        token,
      });
      setFortState(state);
    },
    [activeProfile, token]
  );

  const completeTask = useCallback(
    async (taskId: string, comment?: string) => {
      if (!token || !activeProfile) throw new Error('Select a Character profile first.');
      const state = await apiRequest<FortStateDTO>(`/api/tasks/${taskId}/complete`, {
        method: 'POST',
        body: { profileId: activeProfile.id, comment },
        token,
      });
      setFortState(state);
    },
    [activeProfile, token]
  );

  const cancelTask = useCallback(
    async (taskId: string) => {
      if (!token) throw new Error('Not authenticated.');
      const state = await apiRequest<FortStateDTO>(`/api/tasks/${taskId}/cancel`, {
        method: 'POST',
        token,
      });
      setFortState(state);
    },
    [token]
  );

  const createArea = useCallback(
    async (name: string, defaultXp: number) => {
      if (!token) throw new Error('Not authenticated.');
      const state = await apiRequest<FortStateDTO>('/api/areas', {
        method: 'POST',
        body: { name, defaultXp },
        token,
      });
      setFortState(state);
    },
    [token]
  );

  const createTask = useCallback(
    async (payload: CreateTaskPayload) => {
      if (!token) throw new Error('Not authenticated.');
      const state = await apiRequest<FortStateDTO>('/api/tasks', {
        method: 'POST',
        body: payload,
        token,
      });
      setFortState(state);
    },
    [token]
  );

  const createProfile = useCallback(
    async (payload: { name: string; role: ProfileRole; isAdult: boolean; avatarKey: string }) => {
      if (!token) throw new Error('Not authenticated.');
      const state = await apiRequest<FortStateDTO>('/api/profiles', {
        method: 'POST',
        body: payload,
        token,
      });
      setFortState(state);
    },
    [token]
  );

  const createReward = useCallback(
    async (payload: CreateRewardPayload) => {
      if (!token) throw new Error('Not authenticated.');
      const state = await apiRequest<FortStateDTO>('/api/rewards', {
        method: 'POST',
        body: payload,
        token,
      });
      setFortState(state);
    },
    [token]
  );

  const value = useMemo<AppContextValue>(
    () => ({
      isHydrating,
      token,
      account,
      fortState,
      activeProfile,
      lockedProfileId,
      cochUnlocked,
      login,
      register,
      logout,
      setupFort,
      refreshFort,
      selectProfile,
      unlockDevice,
      verifyCochPin,
      lockCoch,
      startTask,
      completeTask,
      cancelTask,
      createArea,
      createTask,
      createProfile,
      createReward,
    }),
    [
      isHydrating,
      token,
      account,
      fortState,
      activeProfile,
      lockedProfileId,
      cochUnlocked,
      login,
      register,
      logout,
      setupFort,
      refreshFort,
      selectProfile,
      unlockDevice,
      verifyCochPin,
      lockCoch,
      startTask,
      completeTask,
      cancelTask,
      createArea,
      createTask,
      createProfile,
      createReward,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used inside AppProvider.');
  }
  return ctx;
}
