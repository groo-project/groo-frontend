import { defineStore } from "pinia";

export const useDiaryWriteStore = defineStore('diaryWrite', {
    state: () => ({
        writeDate: null,
        savedDiaryId: null,
    }),
    actions: {
        setWriteDiaryDate(date) {
            this.writeDate = date;
        },
        clearWriteDiaryDate() {
            this.writeDate = null;
        },
        setSavedDiaryId(id) {
            this.savedDiaryId = id;
        },
        clearSavedDiaryId() {
            this.savedDiaryId = null;
        }
    }
})