import { createApp } from 'vue';
import App from '@/App.vue';
import { router } from '@/Router';
import { loadUser } from '@/utils/Auth';
import '@/utils/Theme';
import '@/utils/ButtonTitles';
import '@/assets/styles/main.css';

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
