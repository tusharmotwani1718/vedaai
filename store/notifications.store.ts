import { create } from "zustand";


interface NotificationStore {
    IsAnyNewNotification: boolean;
    setNewNotification: () => void
}

export const useNotificationsStore = create<NotificationStore>((set) => ({
    IsAnyNewNotification: false,

    setNewNotification: () => set((state) => ({ IsAnyNewNotification: !state.IsAnyNewNotification }))
}))