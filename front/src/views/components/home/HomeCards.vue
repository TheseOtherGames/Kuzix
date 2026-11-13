<script setup lang="ts">
import BaseButton from '@/views/components/utils/form/BaseButton.vue';
import BaseCard from '@/views/components/utils/card/BaseCard.vue';
import { ANSWER_COLORS } from '@/utils/Answers';
import { auth } from '@/utils/Auth';
import { t } from '@/i18n';
</script>

<template>
	<div class="cards">
		<BaseCard :accent="ANSWER_COLORS[1]">
			<h2>{{ t('home.createTitle') }}</h2>
			<p class="muted">{{ t('home.createText') }}</p>
			<BaseButton :to="auth.user ? '/quizzes/new' : '/register'" variant="secondary">
				{{ auth.user ? t('home.newQuiz') : t('common.createAccount') }}
			</BaseButton>
		</BaseCard>
		<BaseCard :accent="ANSWER_COLORS[2]">
			<h2>{{ t('home.trackTitle') }}</h2>
			<p class="muted">{{ t('home.trackText') }}</p>
			<BaseButton :to="auth.user ? '/profile' : '/login'" variant="ghost">
				{{ auth.user ? t('home.myProfile') : t('common.logIn') }}
			</BaseButton>
		</BaseCard>
	</div>
</template>

<style scoped>
.cards {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr));
	gap: 1.5rem;
}
</style>
