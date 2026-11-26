<script setup lang="ts">
import AvatarIcon from '@/views/components/utils/image/AvatarIcon.vue';
import NameTag from '@/views/components/utils/badge/NameTag.vue';
import RoleBadge from '@/views/components/utils/badge/RoleBadge.vue';
import type { PublicProfile } from '@/interfaces/Quiz/QuizInterface';
import { locale, t } from '@/i18n';

defineProps<{ profile: PublicProfile }>();
</script>

<template>
	<header class="creator">
		<span class="portrait"><AvatarIcon :value="profile.avatar" /></span>
		<div class="who">
			<div class="name">
				<h1><NameTag :name="profile.username" :look="profile.avatar" /></h1>
				<RoleBadge v-if="profile.role" :role="profile.role" />
			</div>
			<p class="muted">{{ t('creator.since', { date: new Date(profile.createdAt).toLocaleDateString(locale, { month: 'long', year: 'numeric' }) }) }}</p>
		</div>
	</header>
</template>

<style scoped>
.creator {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 1.25rem;
}

.portrait {
	display: inline-grid;
	flex-shrink: 0;
	place-items: center;
	width: 6.5rem;
	height: 6.5rem;
	border: 4px solid var(--accent-line);
	border-radius: 50%;
	background: var(--surface);
	box-shadow: 0 0.35rem 0 color-mix(in srgb, var(--accent) 55%, black);
	font-size: 3.6rem;
	animation: pop-in 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes pop-in {
	from {
		transform: scale(0.8);
	}
}

/* No overflow: hidden: NameTag draws its effects outside its box. */
.who {
	min-width: 0;
}

.name {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.5rem 0.75rem;
}

.who h1 {
	margin: 0;
	font-size: clamp(1.5rem, 5vw, 2.2rem);
}

.who p {
	margin: 0.4rem 0 0;
}
</style>
