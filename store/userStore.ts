import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UserName = "alejandro" | "rut";

interface UserStore {
  activeUser: UserName | null;
  userId: string | null;
  setUser: (user: UserName, id: string) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      activeUser: null,
      userId: null,
      setUser: (user, id) => set({ activeUser: user, userId: id }),
      clearUser: () => set({ activeUser: null, userId: null }),
    }),
    {
      name: "ra-active-user",
    }
  )
);
