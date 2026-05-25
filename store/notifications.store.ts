import { create } from "zustand";
import {
  persist,
  createJSONStorage,
} from "zustand/middleware";

interface NotificationStore {
  hasNewNotification: boolean;

  setHasNewNotification: (
    value: boolean
  ) => void;
}

export const useNotificationsStore =
  create<NotificationStore>()(
    persist(
      (set) => ({
        hasNewNotification: false,

        setHasNewNotification: (
          value: boolean
        ) =>
          set({
            hasNewNotification: value,
          }),
      }),
      {
        name: "notifications-store",

        storage: createJSONStorage(
          () => localStorage
        ),
      }
    )
  );