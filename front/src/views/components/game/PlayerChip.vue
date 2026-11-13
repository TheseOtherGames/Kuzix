<script setup lang="ts">
import NameTag from '@/views/components/utils/badge/NameTag.vue';
import AvatarIcon from '@/views/components/utils/image/AvatarIcon.vue';
import { t } from '@/i18n';

defineProps<{
	avatar: string;
	nickname: string;
	dimmed?: boolean;
	badge?: string;
	removable?: boolean;
}>();

const emit = defineEmits<{ remove: [] }>();
</script>

<template>
	<span class="chip" :class="{ dimmed }">
		<span class="avatar" aria-hidden="true"><AvatarIcon :value="avatar" /></span>
		<NameTag class="name" :name="nickname" :look="avatar" />
		<span v-if="badge" class="badge">{{ badge }}</span>
		<button
			v-if="removable"
			type="button"
			class="remove"
			:title="t('host.kick', { name: nickname })"
			:aria-label="t('host.kick', { name: nickname })"
			@click="emit('remove')"
		>
			✕
		</button>
	</span>
</template>

<style scoped>
.chip {
	display: inline-flex;
	align-items: center;
	gap: 0.4rem;
	max-width: 100%;
	padding: 0.3rem 0.8rem 0.3rem 0.3rem;
	border-radius: 999px;
	background: var(--surface-2);
	animation: pop-in 0.3s ease-out;
}

.avatar {
	display: grid;
	place-items: center;
	width: 2rem;
	height: 2rem;
	border-radius: 50%;
	background: var(--surface);
	font-size: 1.2rem;
}

.name {
	overflow: hidden;
	font-weight: 600;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.badge {
	font-size: 0.85rem;
}

.dimmed {
	opacity: 0.45;
}

.remove {
	display: grid;
	place-items: center;
	width: 1.6em;
	height: 1.6em;
	margin-right: -0.4rem;
	padding: 0;
	border: none;
	border-radius: 50%;
	background: transparent;
	color: var(--text-muted);
	font-size: 0.8em;
	cursor: pointer;
	opacity: 0;
	transition: opacity 0.15s, background 0.15s, color 0.15s;
}

/* Shown on hover/focus; always visible on touch screens, which have no hover. */
.chip:hover .remove,
.remove:focus-visible {
	opacity: 1;
}

@media (hover: none) {
	.remove {
		opacity: 1;
	}
}

.remove:hover {
	background: var(--btn-danger);
	color: var(--on-color);
}

@keyframes pop-in {
	from {
		transform: scale(0.5);
		opacity: 0;
	}
}
</style>
