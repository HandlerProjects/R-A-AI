import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UserName = "alejandro" | "rut";

interface UserStore {
  activeUser: UserName | null;
  userId: string | null;
  setUser: (user: UserName, id: string) => void;
  clearUser: () => void;
}

// UUID válido: 36 caracteres con guiones
function isUUID(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      activeUser: null,
      userId: null,
      setUser: (user, id) => set((state) => ({
        activeUser: user,
        // Solo actualiza userId si el nuevo id es un UUID real,
        // o si aún no hay userId guardado
        userId: isUUID(id) ? id : (isUUID(state.userId ?? "") ? state.userId : id),
      })),
      clearUser: () => set({ activeUser: null, userId: null }),
    }),
    {
      name: "ra-active-user",
    }
  )
);
