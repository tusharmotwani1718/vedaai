import { create } from "zustand";
import { persist, createJSONStorage } from 'zustand/middleware'

export const useSidebarStore = create(
    persist(
        (set) => ({
            isSidebarOpen: false,
            toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

            /** Name of the currently active nav tab (e.g. "Home", "Assignments") */
            activeTabName: "Home",
            setActiveTab: (name) => set({ activeTabName: name }),
        }),
        {
            name: "sidebar",
            // activeTabName is intentionally excluded – it is re-synced from the URL on mount
            partialize: (state) => ({ isSidebarOpen: state.isSidebarOpen }),
            storage: createJSONStorage(() => sessionStorage)
        }
    )
)
