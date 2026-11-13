import { createApp } from 'vue';
import App from './app/App.vue';
import { router } from './app/router';
import { loadUser } from './features/auth/auth.store';
import './shared/theme.store';
import './shared/buttonTitles';
import './app/global.css';

const { VITE_UMAMI_URL, VITE_UMAMI_WEBSITE_ID } = import.meta.env;
if (VITE_UMAMI_URL && VITE_UMAMI_WEBSITE_ID) {
	const script = document.createElement('script');
	script.defer = true;
	script.src = `${VITE_UMAMI_URL}/script.js`;
	script.dataset.websiteId = VITE_UMAMI_WEBSITE_ID;
	document.head.appendChild(script);
}

await loadUser();
createApp(App).use(router).mount('#app');
