import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { ApiError } from '@/services/api';
import {
  getCurrentEmployee,
  login as loginRequest,
  logout as logoutRequest,
} from '@/services/auth';
import type { Employee } from '@/services/employees';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'error';

type AuthContextValue = {
  status: AuthStatus;
  employee: Employee | null;
  error: Error | null;
  signIn: (email: string, password: string) => Promise<Employee>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const currentEmployee = await getCurrentEmployee();
      setEmployee(currentEmployee);
      setStatus('authenticated');
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) {
        setEmployee(null);
        setStatus('unauthenticated');
        return;
      }
      const requestError =
        cause instanceof Error ? cause : new Error('Falha ao validar a sessão.');
      setEmployee(null);
      setError(requestError);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    let active = true;
    getCurrentEmployee()
      .then((currentEmployee) => {
        if (active) {
          setEmployee(currentEmployee);
          setStatus('authenticated');
        }
      })
      .catch((cause: unknown) => {
        if (!active) {
          return;
        }
        if (cause instanceof ApiError && cause.status === 401) {
          setEmployee(null);
          setStatus('unauthenticated');
          return;
        }
        setEmployee(null);
        setError(
          cause instanceof Error ? cause : new Error('Falha ao validar a sessão.'),
        );
        setStatus('error');
      });
    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    await loginRequest(email, password);
    const currentEmployee = await getCurrentEmployee();
    setEmployee(currentEmployee);
    setError(null);
    setStatus('authenticated');
    return currentEmployee;
  }, []);

  const signOut = useCallback(async () => {
    await logoutRequest();
    setEmployee(null);
    setError(null);
    setStatus('unauthenticated');
  }, []);

  const value = useMemo(
    () => ({ status, employee, error, signIn, signOut, refresh }),
    [status, employee, error, signIn, signOut, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth precisa estar dentro de AuthProvider.');
  }
  return context;
}