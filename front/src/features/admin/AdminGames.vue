<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import AppIcon from '../../shared/ui/AppIcon.vue';
import BaseButton from '../../shared/ui/BaseButton.vue';
import BaseModal from '../../shared/ui/BaseModal.vue';
import type { AdminLiveGame } from './admin.types';
import type { MessageKey } from '../../shared/i18n/en';
import { api } from '../../shared/api';
import { t } from '../../shared/i18n/i18n';
import { toast } from '../../shared/toast.store';

const games = ref<AdminLiveGame[] | null>(null);
const closing = ref<AdminLiveGame | null>(null);
const saving = ref(false);

const load = async (): Promise<void> => {
	try {
		games.value = await api<AdminLiveGame[]>('/admin/games');
	} catch (error) {
		toast.error((error as Error).message);
	}
};

// ponytail: polling, a socket feed if admins ever need real-time.
const interval = setInterval(load, 5000);
onMounted(load);
onBeforeUnmount(() => clearInterval(interval));

const closeGame = async (): Promise<void> => {
	saving.value = true;
	try {
		await api(`/admin/quizzes/${closing.value!.quizId}/close`, 'POST');
		toast.success(t('admin.closed'));
		closing.value = null;
		await load();
	} catch (error) {
		toast.error((error as Error).message);
	} finally {
		saving.value = false;
	}
};
</script>

<template>
	<header class="admin-head">
		<div>
			<h1>{{ t('admin.games') }}</h1>
			<p>{{ t('admin.gamesHint') }}</p>
		</div>
		<BaseButton size="sm" variant="ghost" @click="load"><AppIcon name="refresh" /> {{ t('admin.refresh') }}</BaseButton>
	</header>
	<div class="admin-panel">
		<p v-if="!games" class="admin-empty">{{ t('common.loading') }}</p>
		<p v-else-if="!games.length" class="admin-empty">{{ t('admin.noGames') }}</p>
		<div v-else class="table-scroll">
			<table class="admin-table">
				<thead>
					<tr>
						<th>{{ t('admin.col.quiz') }}</th>
						<th>{{ t('admin.col.code') }}</th>
						<th>{{ t('admin.col.phase') }}</th>
						<th>{{ t('admin.col.host') }}</th>
						<th>{{ t('admin.col.players') }}</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="game in games" :key="game.quizId">
						<td class="title">{{ game.title }}</td>
						<td class="code selectable">{{ game.code ?? '—' }}</td>
						<td><span class="badge accent">{{ t(`admin.phase.${game.phase}` as MessageKey) }}</span></td>
						<td>
							<span class="badge" :class="game.hostConnected ? 'good' : 'bad'">{{ t(game.hostConnected ? 'admin.host.on' : 'admin.host.off') }}</span>
						</td>
						<td class="muted">{{ t('admin.online', { n: game.connected, total: game.players }) }}</td>
						<td class="num">
							<BaseButton size="sm" variant="danger" @click="closing = game"><AppIcon name="stop" /> {{ t('admin.close') }}</BaseButton>
						</td>
					</tr>
				</tbody>
			</table>
		</div>
	</div>

	<BaseModal :open="Boolean(closing)" :title="closing ? t('admin.closeTitle', { title: closing.title }) : ''" @close="closing = null">
		<p>{{ t('admin.closeText') }}</p>
		<template #actions>
			<BaseButton variant="ghost" @click="closing = null">{{ t('common.cancel') }}</BaseButton>
			<BaseButton variant="danger" :loading="saving" @click="closeGame">{{ t('admin.close') }}</BaseButton>
		</template>
	</BaseModal>
</template>

<style scoped>
.title {
	max-width: 20rem;
	overflow: hidden;
	font-weight: 600;
	text-overflow: ellipsis;
}
</style>
