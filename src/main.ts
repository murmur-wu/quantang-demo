import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import App from './App.vue'
import router from './router'
import { perm } from './directives/perm'
import './style.css'

// Remove the stage-one persisted JWT, if present.
localStorage.removeItem('auth')
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

createApp(App).use(pinia).use(router).directive('perm', perm).mount('#app')
