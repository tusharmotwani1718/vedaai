import { create } from "zustand";
import { persist, createJSONStorage } from 'zustand/middleware'

export const useSidebarStore = create(
    persist(
        (set) => ({
            isSidebarOpen: false,
            toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen }))
        }),
        {
            name: "sidebar",
            partialize: (state) => ({ isSidebarOpen: state.isSidebarOpen }),
            storage: createJSONStorage(() => sessionStorage)
        }
    )
)