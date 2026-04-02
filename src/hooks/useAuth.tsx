import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = "admin" | "suporte" | "franqueado" | "admin_empresa" | "suporte_empresa" | "master_admin" | "ceo" | null;

// Role hierarchy helpers
const ADMIN_ROLES: NonNullable<UserRole>[] = ["admin", "suporte", "master_admin", "ceo"];
const COMPANY_ADMIN_ROLES: NonNullable<UserRole>[] = ["admin", "suporte", "admin_empresa", "suporte_empresa", "master_admin", "ceo"];
const MASTER_ROLES: NonNullable<UserRole>[] = ["master_admin", "ceo"];
const SUPPORT_ROLES: NonNullable<UserRole>[] = ["suporte", "suporte_empresa", "master_admin", "ceo"];

export function isAdminLevel(role: UserRole): boolean {
  return role !== null && ADMIN_ROLES.includes(role);
}

export function isCompanyAdminLevel(role: UserRole): boolean {
  return role !== null && COMPANY_ADMIN_ROLES.includes(role);
}

export function isMasterLevel(role: UserRole): boolean {
  return role !== null && MASTER_ROLES.includes(role);
}

export function isSupportLevel(role: UserRole): boolean {
  return role !== null && SUPPORT_ROLES.includes(role);
}

export function isFranqueado(role: UserRole): boolean {
  return role === "franqueado";
}

/** Returns the default home route for a given role */
export function getHomeRouteForRole(role: UserRole): string {
  switch (role) {
    case "master_admin":
    case "ceo":
      return "/master";
    case "admin":
    case "suporte":
    case "admin_empresa":
    case "suporte_empresa":
      return "/admin";
    case "franqueado":
      return "/franqueado";
    default:
      return "/login";
  }
}

interface UserRoleData {
  role: UserRole;
  companyId: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: UserRole;
  userCompanyId: string | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [userCompanyId, setUserCompanyId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserRole = async (userId: string): Promise<UserRoleData> => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role, company_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching user role:", error);
      return { role: null, companyId: null };
    }

    return {
      role: (data?.role as UserRole) ?? null,
      companyId: (data?.company_id as string) ?? null,
    };
  };

  const applyRoleData = (data: UserRoleData) => {
    setUserRole(data.role);
    setUserCompanyId(data.companyId);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setTimeout(() => {
            fetchUserRole(session.user.id).then(applyRoleData);
          }, 0);
        } else {
          setUserRole(null);
          setUserCompanyId(null);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchUserRole(session.user.id).then((data) => {
          applyRoleData(data);
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUrl },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserRole(null);
    setUserCompanyId(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        userRole,
        userCompanyId,
        isLoading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
