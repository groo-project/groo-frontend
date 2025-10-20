import { defineStore } from 'pinia'

export const useAlertStore = defineStore('alert', {
  state: () => ({
    message: '',
    duration: 1500,
    key: 0
  }),
  actions: {
    show(message, duration = 1500) {
      if (this.message === message) {
        this.message = ''
        setTimeout(() => {
          this.message = message
          this.duration = duration
          this.key++
        }, 10)
      } else {
        this.message = message
        this.duration = duration
        this.key++
      }
    },
    clear() {
      this.message = ''
    }
  },
})