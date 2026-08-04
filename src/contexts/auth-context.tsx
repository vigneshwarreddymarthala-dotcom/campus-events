"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";

export type UserRole = "admin" | "student";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  department?: string;
  year?: string;
  phone?: string;
};

type AuthContextType = {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
};

type RegisterData = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  department?: string;
  year?: string;
  phone?: string;
};

const MOCK_USERS: (User & { password: string })[] = [
  {
    id: "u1",
    name: "Dr. Rajesh Kumar",
    email: "admin@college.edu",
    password: "admin123",
    role: "admin",
    avatar: "",
    department: "Computer Science",
  },
  {
    id: "u2",
    name: "Priya Menon",
    email: "student@college.edu",
    password: "student123",
    role: "student",
    avatar: "",
    department: "Computer Science",
    year: "3rd Year",
    phone: "9876543210",
  },
];

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("campus_user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {}
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    await new Promise((r) => setTimeout(r, 800));
    const found = MOCK_USERS.find((u) => u.email === email && u.password === password);
    if (!found) return { success: false, error: "Invalid email or password." };
    const { password: _, ...safeUser } = found;
    setUser(safeUser);
    localStorage.setItem("campus_user", JSON.stringify(safeUser));
    return { success: true };
  };

  const register = async (data: RegisterData) => {
    await new Promise((r) => setTimeout(r, 800));
    const exists = MOCK_USERS.find((u) => u.email === data.email);
    if (exists) return { success: false, error: "An account with this email already exists." };
    const newUser: User = {
      id: `u${Date.now()}`,
      name: data.name,
      email: data.email,
      role: data.role,
      department: data.department,
      year: data.year,
      phone: data.phone,
    };
    MOCK_USERS.push({ ...newUser, password: data.password });
    setUser(newUser);
    localStorage.setItem("campus_user", JSON.stringify(newUser));
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("campus_user");
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
