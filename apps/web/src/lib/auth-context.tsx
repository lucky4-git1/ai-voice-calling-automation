'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from './api';

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface OrganizationInfo {
  id: string;
  name: string;
  slug: string;
  role: string;
  plan: string;
}

interface AuthContextType {
  user: User | null;
  activeOrg: OrganizationInfo | null;
  organizations: OrganizationInfo[];
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, organizationName: string) => Promise<void>;
  switchOrg: (orgId: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [activeOrg, setActiveOrg] = useState<OrganizationInfo | null>(null);
  const [organizations, setOrganizations] = useState<OrganizationInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('callagent_token');
    const storedUser = localStorage.getItem('callagent_user');
    const storedOrg = localStorage.getItem('callagent_active_org');
    const storedOrgs = localStorage.getItem('callagent_organizations');

    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        if (storedOrg) setActiveOrg(JSON.parse(storedOrg));
        if (storedOrgs) setOrganizations(JSON.parse(storedOrgs));
      } catch (e) {
        console.error('Failed to parse cached auth session', e);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const res: any = await api.post('/auth/login', { email, password });
    localStorage.setItem('callagent_token', res.accessToken);
    localStorage.setItem('callagent_user', JSON.stringify(res.user));
    localStorage.setItem('callagent_organizations', JSON.stringify(res.organizations || []));

    setUser(res.user);
    setOrganizations(res.organizations || []);

    if (res.activeOrganization) {
      localStorage.setItem('callagent_active_org', JSON.stringify(res.activeOrganization));
      localStorage.setItem('callagent_active_org_id', res.activeOrganization.id);
      setActiveOrg(res.activeOrganization);
    }

    router.push('/dashboard');
  };

  const register = async (name: string, email: string, password: string, organizationName: string) => {
    const res: any = await api.post('/auth/register', { name, email, password, organizationName });
    localStorage.setItem('callagent_token', res.accessToken);
    localStorage.setItem('callagent_user', JSON.stringify(res.user));

    const orgInfo: OrganizationInfo = {
      id: res.organization.id,
      name: res.organization.name,
      slug: res.organization.slug,
      role: res.organization.role,
      plan: 'STARTER',
    };

    localStorage.setItem('callagent_active_org', JSON.stringify(orgInfo));
    localStorage.setItem('callagent_active_org_id', orgInfo.id);
    localStorage.setItem('callagent_organizations', JSON.stringify([orgInfo]));

    setUser(res.user);
    setActiveOrg(orgInfo);
    setOrganizations([orgInfo]);

    router.push('/onboarding');
  };

  const switchOrg = (orgId: string) => {
    const target = organizations.find((o) => o.id === orgId);
    if (target) {
      setActiveOrg(target);
      localStorage.setItem('callagent_active_org', JSON.stringify(target));
      localStorage.setItem('callagent_active_org_id', target.id);
      window.location.reload();
    }
  };

  const logout = () => {
    localStorage.removeItem('callagent_token');
    localStorage.removeItem('callagent_user');
    localStorage.removeItem('callagent_active_org');
    localStorage.removeItem('callagent_active_org_id');
    localStorage.removeItem('callagent_organizations');
    setUser(null);
    setActiveOrg(null);
    setOrganizations([]);
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        activeOrg,
        organizations,
        isLoading,
        login,
        register,
        switchOrg,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
