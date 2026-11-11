import { createApp } from 'vue';
import App from './app/App.vue';
import { router } from './app/router';
import { loadUser } from './features/auth/auth.store';
import './shared/theme.store';
import './app/global.css';

await loadUser();
createApp(App).use(router).mount('#app');
