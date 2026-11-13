<script setup lang="ts">
import { t } from '@/i18n';
import AppIcon from '@/views/components/utils/image/AppIcon.vue';
import LogoCard from '@/views/components/brand/LogoCard.vue';
import ColorsCard from '@/views/components/brand/ColorsCard.vue';
import TypeCard from '@/views/components/brand/TypeCard.vue';
import ShapesCard from '@/views/components/brand/ShapesCard.vue';
import RulesCard from '@/views/components/brand/RulesCard.vue';
</script>

<template>
	<div class="brand">
		<header class="intro">
			<h1><AppIcon name="palette" /> {{ t('brand.title') }}</h1>
			<p>{{ t('brand.intro') }}</p>
		</header>
		<LogoCard />
		<ColorsCard />
		<div class="duo">
			<TypeCard />
			<ShapesCard />
		</div>
		<RulesCard />
	</div>
</template>

<style scoped>
.brand {
	display: grid;
	gap: 1.5rem;
}

.intro p {
	color: var(--text-muted);
}

.duo {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr));
	gap: 1.5rem;
}
</style>
