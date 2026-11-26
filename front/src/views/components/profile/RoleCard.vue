<script setup lang="ts">
import BaseCard from '@/views/components/utils/card/BaseCard.vue';
import IconHeading from '@/views/components/utils/text/IconHeading.vue';
import RoleBadge from '@/views/components/utils/badge/RoleBadge.vue';
import { auth } from '@/utils/Auth';
import { rolePerks } from '@/utils/Roles';
import { t } from '@/i18n';
</script>

<template>
	<BaseCard accent="var(--color-6)" class="roles">
		<IconHeading id="setting-role" icon="tag" :title="t('roles.cardTitle')" :text="t('roles.cardText')" tint="var(--color-6)" level="h2" />
		<div v-if="auth.user?.role" class="mine">
			<p><strong>{{ t('roles.yours') }}</strong> <RoleBadge :role="auth.user.role" /></p>
			<ul v-if="rolePerks(auth.user.role).length">
				<li v-for="perk in rolePerks(auth.user.role)" :key="perk.key">{{ perk.text }}</li>
			</ul>
			<p v-else class="muted">{{ t('roles.noPerk') }}</p>
		</div>
		<p v-else class="muted none">{{ t('roles.none') }}</p>
	</BaseCard>
</template>

<style scoped>
.mine,
.none {
	margin-top: 1rem;
	padding-top: 1rem;
	border-top: 2px dashed var(--border);
}

.mine p {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.5rem;
	margin: 0;
}

.mine ul {
	margin: 0.6rem 0 0;
	padding-left: 1.2rem;
}

.muted {
	color: var(--text-muted);
}

.mine .muted {
	margin-top: 0.6rem;
}
</style>
