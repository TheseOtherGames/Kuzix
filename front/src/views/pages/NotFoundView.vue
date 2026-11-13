<script setup lang="ts">
import { t } from '@/i18n';
import AppIcon from '@/views/components/utils/image/AppIcon.vue';
import BaseButton from '@/views/components/utils/form/BaseButton.vue';
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
