<script setup lang="ts">
import BaseCard from '@/views/components/utils/card/BaseCard.vue';
import ProfileForm from '@/views/components/profile/ProfileForm.vue';
import SaveBar from '@/views/components/utils/form/SaveBar.vue';
import type { Profile } from '@/interfaces/User/UserInterface';
import { t, tp } from '@/i18n';

defineProps<{
	nickname: string;
	playersCount: number;
	underBanner: boolean;
	dirty: boolean;
	saving: boolean;
	saved: boolean;
}>();

const draft = defineModel<Profile>({ required: true });
const emit = defineEmits<{ save: []; undo: [] }>();
</script>

<template>
	<section class="lobby" :class="{ 'under-banner': underBanner }">
		<header class="head">
			<h1>{{ t('play.youreIn', { name: nickname }) }}</h1>
			<p class="muted">{{ tp('play.lobby', playersCount) }}</p>
		</header>
		<BaseCard accent="var(--accent)" class="card">
			<h2 class="title">{{ t('play.lookTitle') }}</h2>
			<form class="form" @submit.prevent="emit('save')">
				<ProfileForm v-model="draft" />
				<SaveBar :dirty="dirty" :saving="saving" :saved="saved" @undo="emit('undo')" />
			</form>
		</BaseCard>
	</section>
</template>

<style scoped>
.lobby {
	display: flex;
	flex: 1;
	flex-direction: column;
	align-items: center;
	gap: 1rem;
	padding: 1rem clamp(0.75rem, 3vw, 2rem) 1.5rem;
}

.lobby.under-banner {
	padding-top: 5.5rem;
}

.head {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.25rem;
	text-align: center;
	animation: pop 0.35s ease-out;
}

.head h1,
.head p {
	margin: 0;
}

.card {
	width: min(100%, 72rem);
}

.title {
	margin-top: 0;
}

.form {
	display: flex;
	flex-direction: column;
	gap: 1.25rem;
}

@keyframes pop {
	from {
		transform: scale(0.85);
		opacity: 0;
	}
}
</style>
