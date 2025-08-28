import { defineStore } from "pinia";

export const useMateForestStore = defineStore('mateForest', {
    state: () => ({
        currentMateForestId: null,
    }),
    actions: {
        setCurrentMateForestId(id) {
            this.currentMateForestId = id;
        },
        clearCurrentMateForestId() {
            this.currentMateForestId = null;
        }
    }
})