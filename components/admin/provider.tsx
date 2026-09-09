"use client";
import { createContext, useContext, useState } from "react";
import { useStore } from "zustand";
import { createAdminStore, type AdminState } from "@/lib/admin-store";
const Context = createContext<ReturnType<typeof createAdminStore> | null>(null);
export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [store] = useState(createAdminStore);
  return <Context.Provider value={store}>{children}</Context.Provider>;
}
export function useAdmin<T>(selector: (state: AdminState) => T) {
  const store = useContext(Context);
  if (!store) throw new Error("AdminProvider is required");
  return useStore(store, selector);
}
