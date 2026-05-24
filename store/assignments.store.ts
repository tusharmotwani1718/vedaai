import {create} from "zustand";
import axios from "axios";
import type { AssignmentInputStorage } from "../types/assignment.types";


interface AssignmentStore {
    assignments: AssignmentInputStorage[];
    loading: boolean;
    error: string | null;

    fetchAssignments: () => Promise<void>;
}

export const useAssignmentStore = create<AssignmentStore>((set) => ({
    assignments: [],
    loading: false,
    error: null,

    fetchAssignments: async () => {
        try {
            set({ loading: true, error: null });

            // replace with your real API
            const response = await axios.get(`/api/assignments/fetch-assignments`);

            console.log(response);


            const data = response.data?.data?.assignments || [];

            set({
                assignments: data,
                loading: false,
            });

        } catch (error) {
            set({
                error: error instanceof Error ? error.message : "Something went wrong",
                loading: false,
            });
        }
    },
}));