<script setup lang="ts">
import BaseCard from '@/views/components/utils/card/BaseCard.vue';
import InfoTip from '@/views/components/utils/tooltip/InfoTip.vue';
import ProfileForm from '@/views/components/profile/ProfileForm.vue';
import SaveBar from '@/views/components/utils/form/SaveBar.vue';
import type { Profile } from '@/interfaces/User/UserInterface';
import { t } from '@/i18n';

defineProps<{ dirty: boolean; saving: boolean; saved: boolean }>();
const profile = defineModel<Profile>({ required: true });
const emit = defineEmits<{ save: []; undo: [] }>();
</script>

<template>
	<BaseCard accent="var(--accent)">
		<h2 class="card-title">
			{{ t('profile.appearance') }}<InfoTip :text="t('profile.appearanceInfo')" />
			<span v-if="dirty" class="unsaved-pill">{{ t('pf.unsaved') }}</span>
		</h2>
		<form class="form" @submit.prevent="emit('save')">
			<ProfileForm v-model="profile" />
			<SaveBar :dirty="dirty" :saving="saving" :saved="saved" @undo="emit('undo')" />
		</form>
	</BaseCard>
</template>

<style scoped>
.form {
	display: flex;
	flex-direction: column;
	gap: 1.25rem;
}

.card-title {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.4rem;
}

.unsaved-pill {
	padding: 0.15rem 0.7rem;
	border-radius: 999px;
	background: var(--color-3);
	color: #1e2230;
	font-size: 0.8rem;
	animation: pop 0.3s cubic-bezier(0.3, 1.6, 0.5, 1);
}

@keyframes pop {
	from {
		transform: scale(0.6);
	}
}
</style>
