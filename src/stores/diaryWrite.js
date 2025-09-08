import { defineStore } from "pinia";

export const useDiaryWriteStore = defineStore('diaryWrite', {
    state: () => ({
        writeDate: null,
    }),
    actions: {
        setWriteDiaryDate(date) {
            this.writeDate = date;
        },
        clearWriteDiaryDate() {
            this.writeDate = null;
        }
    }
})