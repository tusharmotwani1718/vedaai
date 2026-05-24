import { create } from "zustand";
import axios from "axios";
import type { AssignmentInputStorage } from "../types/assignment.types";


interface AssignmentStore {
    assignments: AssignmentInputStorage[];
    loading: boolean;
    error: string | null;
    isInitialized: boolean;

    fetchAssignments: () => Promise<void>;
    updateStatus: (assignmentId: string, status: 'failed' | 'completed') => Promise<void>;
}

export const useAssignmentStore = create<AssignmentStore>((set) => ({
    assignments: [],
    loading: false,
    error: null,
    isInitialized: false,

    fetchAssignments: async () => {
        try {
            set({ loading: true, error: null });

            const response = await axios.get(`/api/assignments/fetch-assignments`);

            console.log(response);


            const data = response.data?.data || [];

            set({
                assignments: data.assignments,
                loading: false,
                isInitialized: true
            })

        } catch (error) {
            set({
                error: error instanceof Error ? error.message : "Something went wrong",
                loading: false,
                isInitialized: true
            });
        }
    },
    updateStatus: async (assignmentId: string, status: 'failed' | 'completed') => {
        set((state) => ({
            assignments: state.assignments.map((assignment) => {
                if (assignment._id === assignmentId) {
                    return { ...assignment, status: status };
                }
                return assignment;
            })
        }))
    }
}));