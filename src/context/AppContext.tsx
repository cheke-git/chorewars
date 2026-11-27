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
  FortMemberDTO,
  FortStateDTO,
  FortSummaryDTO,
  HomeType,
  MembershipRole,
  RecurrenceType,
  SessionPayloadDTO,
  UserDTO,
} from '@/shared/types';

export interface SetupFortPayload {
  name: string;
  homeType: HomeType;
  bedroomCount: number;
  bathroomCount: number;
  hasKitchen: boolean;
  hasYard: boolean;
  hasPets: boolean;
  cochName?: string;
  cochAvatarKey?: string;
  cochPin?: string;
  supervisedMembers: {
    existingUserId?: string;
    name: string;
    role: 'reviewer' | 'recruit';
    isAdult: boolean;
    avatarKey: string;
  }[];
  starterReward?: {
    title?: string;
    targetXp: number;
    excludeAdults: boolean;
  };
}

export interface CreateTaskPayload {
  title: string;
  areaId: string | null;
  categoryKey?: string;
  xp: number;
  recurrenceType: RecurrenceType;
  cooldownDays?: number | null;
  assignedUserId?: string | null;
}

export interface UpdateTaskPayload {
  title?: string;
  areaId?: string | null;
  categoryKey?: string;
  xp?: number;
  recurrenceType?: RecurrenceType;
  cooldownDays?: number | null;
  assignedUserId?: string | null;
}

export interface CreateRewardPayload {
  title?: string;
  targetXp: number;
  excludedUserIds: string[];
}

export interface UpdateRewardPayload {
  title?: string | null;
  targetXp?: number;
  excludedUserIds?: string[];
}

interface AuthResponse {
  token: string;
  session: SessionPayloadDTO;
}

interface FortMutationResponse {
  fortState: FortStateDTO | null;
  session: SessionPayloadDTO;
}

interface AppContextValue {
  isHydrating: boolean;
  token: string | null;
  session: SessionPayloadDTO | null;
  fortState: FortStateDTO | null;
  activeFortId: string | null;
  activeUser: UserDTO | null;
  activeMember: FortMemberDTO | null;
  availableFortsForActiveUser: FortSummaryDTO[];
  isCochOfCurrentFort: boolean;
  lockedUserId: string | null;
  cochUnlocked: boolean;
  login: (email: string, password: string) => Promise<SessionPayloadDTO>;
  register: (
    email: string,
    password: string,
    options?: { name?: string; avatarKey?: string }
  ) => Promise<SessionPayloadDTO>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<SessionPayloadDTO | null>;
  refreshFort: () => Promise<void>;
  selectFort: (fortId: string) => Promise<void>;
  selectActiveUser: (userId: string, lockDevice?: boolean) => Promise<void>;
  unlockDevice: () => Promise<void>;
  verifyGuardianPin: (pin: string) => Promise<void>;
  lockCoch: () => void;
  updateMe: (payload: {
    name?: string;
    avatarKey?: string;
    isAdult?: boolean;
    guardianPin?: string;
  }) => Promise<void>;
  createSupervisedUser: (payload: {
    name: string;
    avatarKey: string;
    isAdult: boolean;
    fortId?: string;
    role?: 'reviewer' | 'recruit';
  }) => Promise<void>;
  updateUser: (
    userId: string,
    payload: { name?: string; avatarKey?: string; isAdult?: boolean }
  ) => Promise<void>;
  deleteSupervisedUser: (userId: string) => Promise<void>;
  setupFort: (payload: SetupFortPayload) => Promise<FortStateDTO>;
  joinFort: (inviteCode: string, userIds?: string[]) => Promise<FortStateDTO>;
  leaveFort: (fortId: string, userId?: string) => Promise<void>;
  updateFort: (
    fortId: string,
    payload: { name?: string; regenerateInviteCode?: boolean; isArchived?: boolean }
  ) => Promise<void>;
  updateMemberRole: (fortId: string, userId: string, role: MembershipRole) => Promise<void>;
  sendInvitation: (
    fortId: string,
    payload: { targetEmail: string; role: MembershipRole; note?: string }
  ) => Promise<void>;
  revokeInvitation: (inviteId: string) => Promise<void>;
  respondToInvitation: (
    inviteId: string,
    action: 'accept' | 'decline',
    userIds?: string[]
  ) => Promise<void>;
  startTask: (taskId: string) => Promise<void>;
  completeTask: (taskId: string, comment?: string) => Promise<void>;
  cancelTask: (taskId: string) => Promise<void>;
  undoTask: (taskId: string) => Promise<void>;
  createArea: (name: string, defaultXp: number, categoryKey?: string) => Promise<void>;
  updateArea: (
    areaId: string,
    payload: { name?: string; defaultXp?: number; categoryKey?: string }
  ) => Promise<void>;
  deleteArea: (areaId: string) => Promise<void>;
  createTask: (payload: CreateTaskPayload) => Promise<void>;
  updateTask: (taskId: string, payload: UpdateTaskPayload) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  createReward: (payload: CreateRewardPayload) => Promise<void>;
  updateReward: (rewardId: string, payload: UpdateRewardPayload) => Promise<void>;
  deleteReward: (rewardId: string) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

function getFamilyUsers(session: SessionPayloadDTO | null): UserDTO[] {
  if (!session) return [];
  return [session.user, ...session.supervisedUsers];
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [isHydrating, setIsHydrating] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [session, setSession] = useState<SessionPayloadDTO | null>(null);
  const [fortState, setFortState] = useState<FortStateDTO | null>(null);
  const [activeFortId, setActiveFortId] = useState<string | null>(null);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [lockedUserId, setLockedUserId] = useState<string | null>(null);
  const [cochUnlocked, setCochUnlocked] = useState(false);
  const [verifiedPin, setVerifiedPin] = useState<string | null>(null);

  const loadFortById = useCallback(async (authToken: string, fortId: string) => {
    const state = await apiRequest<FortStateDTO>(`/api/forts/${fortId}`, { token: authToken });
    setFortState(state);
    setActiveFortId(fortId);
    await setStoredValue(STORAGE_KEYS.ACTIVE_FORT_ID, fortId);
    return state;
  }, []);

  const syncSelectionAfterSession = useCallback(
    async (
      authToken: string,
      nextSession: SessionPayloadDTO,
      preferredUserId?: string | null,
      preferredFortId?: string | null
    ) => {
      const family = getFamilyUsers(nextSession);
      const resolvedUserId =
        preferredUserId && family.some((u) => u.id === preferredUserId)
          ? preferredUserId
          : nextSession.user.id;
      setActiveUserId(resolvedUserId);

      const fortsForUser = nextSession.forts.filter((f) =>
        f.memberUserIds.includes(resolvedUserId)
      );
      const candidateForts = fortsForUser.length > 0 ? fortsForUser : nextSession.forts;

      if (candidateForts.length === 0) {
        setFortState(null);
        setActiveFortId(null);
        return;
      }

      const chosenFortId =
        preferredFortId && candidateForts.some((f) => f.id === preferredFortId)
          ? preferredFortId
          : candidateForts[0].id;

      await loadFortById(authToken, chosenFortId);
    },
    [loadFortById]
  );

  useEffect(() => {
    let mounted = true;

    async function hydrate() {
      try {
        const [savedToken, savedLockedId, savedUserId, savedFortId] = await Promise.all([
          getStoredValue(STORAGE_KEYS.AUTH_TOKEN),
          getStoredValue(STORAGE_KEYS.LOCKED_USER_ID),
          getStoredValue(STORAGE_KEYS.ACTIVE_USER_ID),
          getStoredValue(STORAGE_KEYS.ACTIVE_FORT_ID),
        ]);

        if (!mounted) return;
        if (savedLockedId) {
          setLockedUserId(savedLockedId);
        }

        if (!savedToken) {
          return;
        }

        const nextSession = await apiRequest<SessionPayloadDTO>('/api/auth/me', {
          token: savedToken,
        });
        if (!mounted) return;

        setToken(savedToken);
        setSession(nextSession);

        await syncSelectionAfterSession(
          savedToken,
          nextSession,
          savedLockedId ?? savedUserId,
          savedFortId
        );
      } catch {
        await deleteStoredValue(STORAGE_KEYS.AUTH_TOKEN);
        if (mounted) {
          setToken(null);
          setSession(null);
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
  }, [syncSelectionAfterSession]);

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await apiRequest<AuthResponse>('/api/auth/login', {
        method: 'POST',
        body: { email, password },
      });

      await setStoredValue(STORAGE_KEYS.AUTH_TOKEN, result.token);
      await syncSelectionAfterSession(result.token, result.session, lockedUserId, null);
      setToken(result.token);
      setSession(result.session);
      setCochUnlocked(false);

      return result.session;
    },
    [lockedUserId, syncSelectionAfterSession]
  );

  const register = useCallback(
    async (email: string, password: string, options?: { name?: string; avatarKey?: string }) => {
      const result = await apiRequest<AuthResponse>('/api/auth/register', {
        method: 'POST',
        body: { email, password, ...options },
      });

      await setStoredValue(STORAGE_KEYS.AUTH_TOKEN, result.token);
      setToken(result.token);
      setSession(result.session);
      setActiveUserId(result.session.user.id);
      setFortState(null);
      setActiveFortId(null);
      setCochUnlocked(false);

      return result.session;
    },
    []
  );

  const logout = useCallback(async () => {
    await Promise.all([
      deleteStoredValue(STORAGE_KEYS.AUTH_TOKEN),
      deleteStoredValue(STORAGE_KEYS.ACTIVE_USER_ID),
      deleteStoredValue(STORAGE_KEYS.ACTIVE_FORT_ID),
      deleteStoredValue(STORAGE_KEYS.LOCKED_USER_ID),
    ]);
    setToken(null);
    setSession(null);
    setFortState(null);
    setActiveFortId(null);
    setActiveUserId(null);
    setLockedUserId(null);
    setCochUnlocked(false);
    setVerifiedPin(null);
  }, []);

  const refreshSession = useCallback(async () => {
    if (!token) return null;
    const nextSession = await apiRequest<SessionPayloadDTO>('/api/auth/me', { token });
    setSession(nextSession);
    return nextSession;
  }, [token]);

  const refreshFort = useCallback(async () => {
    if (!token) return;
    const nextSession = await apiRequest<SessionPayloadDTO>('/api/auth/me', { token });
    setSession(nextSession);
    if (activeFortId && nextSession.forts.some((f) => f.id === activeFortId)) {
      await loadFortById(token, activeFortId);
    } else {
      await syncSelectionAfterSession(token, nextSession, activeUserId, null);
    }
  }, [activeFortId, activeUserId, loadFortById, syncSelectionAfterSession, token]);

  const selectFort = useCallback(
    async (fortId: string) => {
      if (!token) return;
      await loadFortById(token, fortId);
    },
    [loadFortById, token]
  );

  const selectActiveUser = useCallback(
    async (userId: string, lockDevice = false) => {
      setActiveUserId(userId);
      setCochUnlocked(false);
      setVerifiedPin(null);
      await setStoredValue(STORAGE_KEYS.ACTIVE_USER_ID, userId);
      if (lockDevice) {
        setLockedUserId(userId);
        await setStoredValue(STORAGE_KEYS.LOCKED_USER_ID, userId);
      }

      if (token && session) {
        const fortsForUser = session.forts.filter((f) => f.memberUserIds.includes(userId));
        if (fortsForUser.length > 0 && !fortsForUser.some((f) => f.id === activeFortId)) {
          await loadFortById(token, fortsForUser[0].id);
        }
      }
    },
    [activeFortId, loadFortById, session, token]
  );

  const unlockDevice = useCallback(async () => {
    setLockedUserId(null);
    await deleteStoredValue(STORAGE_KEYS.LOCKED_USER_ID);
  }, []);

  const verifyGuardianPin = useCallback(
    async (pin: string) => {
      if (!token) throw new Error('Not authenticated.');
      await apiRequest<{ valid: boolean }>('/api/users/verify-pin', {
        method: 'POST',
        body: { pin },
        token,
      });
      setVerifiedPin(pin);
      setCochUnlocked(true);
    },
    [token]
  );

  const lockCoch = useCallback(() => {
    setCochUnlocked(false);
    setVerifiedPin(null);
  }, []);

  const updateMe = useCallback(
    async (payload: {
      name?: string;
      avatarKey?: string;
      isAdult?: boolean;
      guardianPin?: string;
    }) => {
      if (!token) throw new Error('Not authenticated.');
      const nextSession = await apiRequest<SessionPayloadDTO>('/api/users/me', {
        method: 'PATCH',
        body: {
          ...payload,
          ...(payload.guardianPin && verifiedPin ? { currentPin: verifiedPin } : {}),
        },
        token,
      });
      if (payload.guardianPin) {
        setVerifiedPin(payload.guardianPin);
      }
      setSession(nextSession);
      if (activeFortId) {
        await loadFortById(token, activeFortId);
      }
    },
    [activeFortId, loadFortById, token, verifiedPin]
  );

  const createSupervisedUser = useCallback(
    async (payload: {
      name: string;
      avatarKey: string;
      isAdult: boolean;
      fortId?: string;
      role?: 'reviewer' | 'recruit';
    }) => {
      if (!token) throw new Error('Not authenticated.');
      const result = await apiRequest<FortMutationResponse>('/api/users/supervised', {
        method: 'POST',
        body: payload,
        token,
      });
      setSession(result.session);
      if (result.fortState) {
        setFortState(result.fortState);
      }
    },
    [token]
  );

  const updateUser = useCallback(
    async (userId: string, payload: { name?: string; avatarKey?: string; isAdult?: boolean }) => {
      if (!token) throw new Error('Not authenticated.');
      const nextSession = await apiRequest<SessionPayloadDTO>(`/api/users/${userId}`, {
        method: 'PATCH',
        body: payload,
        token,
      });
      setSession(nextSession);
      if (activeFortId) {
        await loadFortById(token, activeFortId);
      }
    },
    [activeFortId, loadFortById, token]
  );

  const deleteSupervisedUser = useCallback(
    async (userId: string) => {
      if (!token) throw new Error('Not authenticated.');
      const nextSession = await apiRequest<SessionPayloadDTO>(`/api/users/${userId}`, {
        method: 'DELETE',
        token,
      });
      setSession(nextSession);
      if (lockedUserId === userId) {
        await unlockDevice();
      }
      if (activeUserId === userId) {
        setActiveUserId(nextSession.user.id);
      }
      if (activeFortId) {
        await loadFortById(token, activeFortId);
      }
    },
    [activeFortId, activeUserId, loadFortById, lockedUserId, token, unlockDevice]
  );

  const setupFort = useCallback(
    async (payload: SetupFortPayload) => {
      if (!token) throw new Error('Not authenticated.');
      const result = await apiRequest<{ fortState: FortStateDTO; session: SessionPayloadDTO }>(
        '/api/forts/setup',
        {
          method: 'POST',
          body: payload,
          token,
        }
      );
      setSession(result.session);
      setFortState(result.fortState);
      setActiveFortId(result.fortState.fort.id);
      setActiveUserId(result.session.user.id);
      await Promise.all([
        setStoredValue(STORAGE_KEYS.ACTIVE_FORT_ID, result.fortState.fort.id),
        setStoredValue(STORAGE_KEYS.ACTIVE_USER_ID, result.session.user.id),
      ]);
      return result.fortState;
    },
    [token]
  );

  const joinFort = useCallback(
    async (inviteCode: string, userIds?: string[]) => {
      if (!token) throw new Error('Not authenticated.');
      const result = await apiRequest<{ fortState: FortStateDTO; session: SessionPayloadDTO }>(
        '/api/forts/join',
        {
          method: 'POST',
          body: { inviteCode, userIds },
          token,
        }
      );
      setSession(result.session);
      setFortState(result.fortState);
      setActiveFortId(result.fortState.fort.id);
      await setStoredValue(STORAGE_KEYS.ACTIVE_FORT_ID, result.fortState.fort.id);
      return result.fortState;
    },
    [token]
  );

  const leaveFort = useCallback(
    async (fortId: string, userId?: string) => {
      if (!token) throw new Error('Not authenticated.');
      const result = await apiRequest<FortMutationResponse>(`/api/forts/${fortId}/leave`, {
        method: 'POST',
        body: userId ? { userId } : {},
        token,
      });
      setSession(result.session);
      if (fortId === activeFortId) {
        if (result.fortState) {
          setFortState(result.fortState);
        } else {
          await syncSelectionAfterSession(token, result.session, activeUserId, null);
        }
      }
    },
    [activeFortId, activeUserId, syncSelectionAfterSession, token]
  );

  const updateFort = useCallback(
    async (
      fortId: string,
      payload: { name?: string; regenerateInviteCode?: boolean; isArchived?: boolean }
    ) => {
      if (!token) throw new Error('Not authenticated.');
      const result = await apiRequest<FortMutationResponse>(`/api/forts/${fortId}`, {
        method: 'PATCH',
        body: payload,
        token,
      });
      setSession(result.session);
      if (result.fortState) {
        setFortState(result.fortState);
      } else {
        await syncSelectionAfterSession(token, result.session, activeUserId, null);
      }
    },
    [activeUserId, syncSelectionAfterSession, token]
  );

  const updateMemberRole = useCallback(
    async (fortId: string, userId: string, role: MembershipRole) => {
      if (!token) throw new Error('Not authenticated.');
      const result = await apiRequest<FortMutationResponse>(
        `/api/forts/${fortId}/members/${userId}`,
        {
          method: 'PATCH',
          body: { role },
          token,
        }
      );
      setSession(result.session);
      if (result.fortState) {
        setFortState(result.fortState);
      }
    },
    [token]
  );

  const sendInvitation = useCallback(
    async (fortId: string, payload: { targetEmail: string; role: MembershipRole; note?: string }) => {
      if (!token) throw new Error('Not authenticated.');
      const state = await apiRequest<FortStateDTO>(`/api/forts/${fortId}/invitations`, {
        method: 'POST',
        body: payload,
        token,
      });
      setFortState(state);
    },
    [token]
  );

  const revokeInvitation = useCallback(
    async (inviteId: string) => {
      if (!token) throw new Error('Not authenticated.');
      const state = await apiRequest<FortStateDTO>(`/api/invitations/${inviteId}`, {
        method: 'DELETE',
        token,
      });
      setFortState(state);
    },
    [token]
  );

  const respondToInvitation = useCallback(
    async (inviteId: string, action: 'accept' | 'decline', userIds?: string[]) => {
      if (!token) throw new Error('Not authenticated.');
      const result = await apiRequest<FortMutationResponse>(
        `/api/invitations/${inviteId}/respond`,
        {
          method: 'POST',
          body: { action, userIds },
          token,
        }
      );
      setSession(result.session);
      if (result.fortState) {
        setFortState(result.fortState);
        setActiveFortId(result.fortState.fort.id);
        await setStoredValue(STORAGE_KEYS.ACTIVE_FORT_ID, result.fortState.fort.id);
      }
    },
    [token]
  );

  const activeUser = useMemo(() => {
    const family = getFamilyUsers(session);
    if (family.length === 0) return null;
    return family.find((u) => u.id === activeUserId) ?? session?.user ?? null;
  }, [activeUserId, session]);

  const activeMember = useMemo(() => {
    if (!fortState || !activeUser) return null;
    return fortState.members.find((m) => m.id === activeUser.id) ?? null;
  }, [activeUser, fortState]);

  const availableFortsForActiveUser = useMemo(() => {
    if (!session) return [];
    if (!activeUser) return session.forts;
    const filtered = session.forts.filter((f) => f.memberUserIds.includes(activeUser.id));
    return filtered.length > 0 ? filtered : session.forts;
  }, [activeUser, session]);

  const isCochOfCurrentFort = useMemo(() => {
    if (!fortState || !session) return false;
    const myMembership = fortState.members.find((m) => m.id === session.user.id);
    return myMembership?.role === 'coch';
  }, [fortState, session]);

  const startTask = useCallback(
    async (taskId: string) => {
      if (!token || !activeUser) throw new Error('Select a Character first.');
      const state = await apiRequest<FortStateDTO>(`/api/tasks/${taskId}/start`, {
        method: 'POST',
        body: { userId: activeUser.id },
        token,
      });
      setFortState(state);
    },
    [activeUser, token]
  );

  const completeTask = useCallback(
    async (taskId: string, comment?: string) => {
      if (!token || !activeUser) throw new Error('Select a Character first.');
      const result = await apiRequest<{ fortState: FortStateDTO; session: SessionPayloadDTO }>(
        `/api/tasks/${taskId}/complete`,
        {
          method: 'POST',
          body: { userId: activeUser.id, comment },
          token,
        }
      );
      setFortState(result.fortState);
      setSession(result.session);
    },
    [activeUser, token]
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

  const undoTask = useCallback(
    async (taskId: string) => {
      if (!token || !activeUser) throw new Error('Select a Character first.');
      const result = await apiRequest<{ fortState: FortStateDTO; session: SessionPayloadDTO }>(
        `/api/tasks/${taskId}/undo`,
        {
          method: 'POST',
          body: { actingUserId: activeUser.id },
          token,
        }
      );
      setFortState(result.fortState);
      setSession(result.session);
    },
    [activeUser, token]
  );

  const createArea = useCallback(
    async (name: string, defaultXp: number, categoryKey = 'custom') => {
      if (!token || !activeFortId) throw new Error('Select a Fort first.');
      const state = await apiRequest<FortStateDTO>('/api/areas', {
        method: 'POST',
        body: { fortId: activeFortId, name, defaultXp, categoryKey },
        token,
      });
      setFortState(state);
    },
    [activeFortId, token]
  );

  const updateArea = useCallback(
    async (
      areaId: string,
      payload: { name?: string; defaultXp?: number; categoryKey?: string }
    ) => {
      if (!token) throw new Error('Not authenticated.');
      const state = await apiRequest<FortStateDTO>(`/api/areas/${areaId}`, {
        method: 'PATCH',
        body: payload,
        token,
      });
      setFortState(state);
    },
    [token]
  );

  const deleteArea = useCallback(
    async (areaId: string) => {
      if (!token) throw new Error('Not authenticated.');
      const state = await apiRequest<FortStateDTO>(`/api/areas/${areaId}`, {
        method: 'DELETE',
        token,
      });
      setFortState(state);
    },
    [token]
  );

  const createTask = useCallback(
    async (payload: CreateTaskPayload) => {
      if (!token || !activeFortId) throw new Error('Select a Fort first.');
      const state = await apiRequest<FortStateDTO>('/api/tasks', {
        method: 'POST',
        body: { fortId: activeFortId, ...payload },
        token,
      });
      setFortState(state);
    },
    [activeFortId, token]
  );

  const updateTask = useCallback(
    async (taskId: string, payload: UpdateTaskPayload) => {
      if (!token) throw new Error('Not authenticated.');
      const state = await apiRequest<FortStateDTO>(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        body: payload,
        token,
      });
      setFortState(state);
    },
    [token]
  );

  const deleteTask = useCallback(
    async (taskId: string) => {
      if (!token) throw new Error('Not authenticated.');
      const state = await apiRequest<FortStateDTO>(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        token,
      });
      setFortState(state);
    },
    [token]
  );

  const createReward = useCallback(
    async (payload: CreateRewardPayload) => {
      if (!token || !activeFortId) throw new Error('Select a Fort first.');
      const state = await apiRequest<FortStateDTO>('/api/rewards', {
        method: 'POST',
        body: { fortId: activeFortId, ...payload },
        token,
      });
      setFortState(state);
    },
    [activeFortId, token]
  );

  const updateReward = useCallback(
    async (rewardId: string, payload: UpdateRewardPayload) => {
      if (!token) throw new Error('Not authenticated.');
      const state = await apiRequest<FortStateDTO>(`/api/rewards/${rewardId}`, {
        method: 'PATCH',
        body: payload,
        token,
      });
      setFortState(state);
    },
    [token]
  );

  const deleteReward = useCallback(
    async (rewardId: string) => {
      if (!token) throw new Error('Not authenticated.');
      const state = await apiRequest<FortStateDTO>(`/api/rewards/${rewardId}`, {
        method: 'DELETE',
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
      session,
      fortState,
      activeFortId,
      activeUser,
      activeMember,
      availableFortsForActiveUser,
      isCochOfCurrentFort,
      lockedUserId,
      cochUnlocked,
      login,
      register,
      logout,
      refreshSession,
      refreshFort,
      selectFort,
      selectActiveUser,
      unlockDevice,
      verifyGuardianPin,
      lockCoch,
      updateMe,
      createSupervisedUser,
      updateUser,
      deleteSupervisedUser,
      setupFort,
      joinFort,
      leaveFort,
      updateFort,
      updateMemberRole,
      sendInvitation,
      revokeInvitation,
      respondToInvitation,
      startTask,
      completeTask,
      cancelTask,
      undoTask,
      createArea,
      updateArea,
      deleteArea,
      createTask,
      updateTask,
      deleteTask,
      createReward,
      updateReward,
      deleteReward,
    }),
    [
      isHydrating,
      token,
      session,
      fortState,
      activeFortId,
      activeUser,
      activeMember,
      availableFortsForActiveUser,
      isCochOfCurrentFort,
      lockedUserId,
      cochUnlocked,
      login,
      register,
      logout,
      refreshSession,
      refreshFort,
      selectFort,
      selectActiveUser,
      unlockDevice,
      verifyGuardianPin,
      lockCoch,
      updateMe,
      createSupervisedUser,
      updateUser,
      deleteSupervisedUser,
      setupFort,
      joinFort,
      leaveFort,
      updateFort,
      updateMemberRole,
      sendInvitation,
      revokeInvitation,
      respondToInvitation,
      startTask,
      completeTask,
      cancelTask,
      undoTask,
      createArea,
      updateArea,
      deleteArea,
      createTask,
      updateTask,
      deleteTask,
      createReward,
      updateReward,
      deleteReward,
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
