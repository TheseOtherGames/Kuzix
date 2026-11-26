<script setup lang="ts">
import AppIcon from '@/views/components/utils/image/AppIcon.vue';
import InfoTip from '@/views/components/utils/tooltip/InfoTip.vue';
import type { UserRole } from '@/interfaces/User/UserInterface';
import { roleTip } from '@/utils/Roles';
import { t } from '@/i18n';

// iconOnly: library cards show just the icon next to the name tag; the tooltip still names the role.
defineProps<{ role: UserRole; iconOnly?: boolean }>();
</script>

<template>
	<InfoTip :text="roleTip(role)" :label="t('roles.badgeLabel', { name: role.name })">
		<span class="role" :class="{ 'icon-only': iconOnly }" :style="{ '--role': role.color }">
			<AppIcon :name="role.icon" />
			<span v-if="!iconOnly">{{ role.name }}</span>
		</span>
	</InfoTip>
</template>

<style scoped>
/* The role colour only tints the pill: text stays in --text, so any colour an admin picks stays readable. */
.role {
	display: inline-flex;
	align-items: center;
	gap: 0.35rem;
	padding: 0.2rem 0.7rem 0.2rem 0.45rem;
	border: 2px solid var(--role);
	border-radius: 999px;
	background: color-mix(in srgb, var(--role) 20%, var(--surface));
	box-shadow: 0 0.18rem 0 color-mix(in srgb, var(--role) 55%, black);
	color: var(--text);
	font-size: 0.85rem;
	font-weight: 700;
	line-height: 1.2;
	white-space: nowrap;
	transition: transform 0.15s;
}

.role.icon-only {
	padding: 0.2rem;
}

.role:hover {
	transform: translateY(-1px) rotate(-4deg);
}
</style>
