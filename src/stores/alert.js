import { defineStore } from 'pinia'

export const useAlertStore = defineStore('alert', {
  state: () => ({
    message: '',
    duration: 1500,
  }),
  actions: {
    show(message, duration = 1500) {
      this.message = message
      this.duration = duration
    },
    clear() {
      this.message = ''
    }
  },
})