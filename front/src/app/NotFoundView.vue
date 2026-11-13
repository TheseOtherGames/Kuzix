<script setup lang="ts">
import { t } from '@/shared/i18n/i18n';
import AppIcon from '@/shared/ui/AppIcon.vue';
import BaseButton from '@/shared/ui/BaseButton.vue';
</script>

<template>
	<div class="not-found">
		<p class="emoji"><AppIcon name="search" /></p>
		<h1>{{ t('notFound.title') }}</h1>
		<BaseButton to="/">{{ t('common.backHome') }}</BaseButton>
	</div>
</template>

<style scoped>
.not-found {
	padding-top: 3rem;
	text-align: center;
}

.emoji {
	font-size: 4rem;
}
</style>
