import { defineStore } from 'pinia'

export const useAlertStore = defineStore('alert', {
  state: () => ({
    message: '',
    duration: 1500,
  }),
  actions: {
    show(message, duration = 1500) {
      if (this.message === message) {
        console.log("same message")
        this.message = ''
        setTimeout(() => {
          this.message = message
          this.duration = duration
        }, 10)
      } else {
        this.message = message
        this.duration = duration
      }
    },
    clear() {
      this.message = ''
    }
  },
})