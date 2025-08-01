import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

const savedStyles = []

const app = createApp(App)

app.use(router)

app.provide('savedStyles', savedStyles)

app.mount('#app')
