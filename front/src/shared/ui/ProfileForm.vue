<script setup lang="ts">
import { computed, ref } from 'vue';
import AppIcon from './AppIcon.vue';
import AvatarIcon from './AvatarIcon.vue';
import NameTag from './NameTag.vue';
import { t } from '../i18n/i18n';
import type { MessageKey } from '../i18n/en';
import type { Profile } from '../../features/auth/user.types';
import {
	AVATAR_BASES,
	AVATAR_CATEGORIES,
	AVATAR_FACES,
	AVATAR_HATS,
	AVATAR_ITEMS,
	NAME_STYLES,
	TAG_SHAPES,
	TAG_COLORS,
	formatAvatar,
	parseAvatar,
	randomAvatar,
	type AvatarCategory,
	type AvatarValue,
} from '../avatars';

type Step = 'base' | 'hat' | 'face' | 'item' | 'tag';

const model = defineModel<Profile>({ required: true });

// Each step has its own decorative colour (bubble tint); selection itself stays on --accent.
const STEPS: { value: Step; icon: string; color: string }[] = [
	{ value: 'base', icon: 'fox', color: 'var(--color-2)' },
	{ value: 'hat', icon: 'tophat', color: 'var(--color-1)' },
	{ value: 'face', icon: 'shades', color: 'var(--color-4)' },
	{ value: 'item', icon: 'wand', color: 'var(--color-5)' },
	{ value: 'tag', icon: 'tag', color: 'var(--color-3)' },
];
const CATEGORY_ICONS: Record<AvatarCategory, string> = { animals: 'paw', food: 'donut', sea: 'puffer', creatures: 'monster' };
const CATEGORY_COLORS: Record<AvatarCategory, string> = { animals: 'var(--color-4)', food: 'var(--color-1)', sea: 'var(--color-2)', creatures: 'var(--color-5)' };

// Unique per instance: the form can be on the page twice (join form + edit popup).
const uid = Math.random().toString(36).slice(2, 8);

const current = computed<AvatarValue>(() => parseAvatar(model.value.avatar) ?? { base: '', hat: '', face: '', color: '', style: '', item: '', shape: '' });
// Old emoji avatars have no base: options are previewed (and saved) on the first character.
const now = computed<AvatarValue>(() => ({ ...current.value, base: current.value.base || AVATAR_BASES[0].id }));
const step = ref<Step>('base');
const displayName = computed(() => model.value.nickname.trim() || t('pf.nicknamePh'));

const partName = (id: string): string => t(id ? `av.${id}` as MessageKey : 'av.none');
const colorName = (id: string): string => t(`tag.color.${id || 'classic'}` as MessageKey);
const styleName = (id: string): string => t(`tag.style.${id || 'classic'}` as MessageKey);
const shapeName = (id: string): string => t(`tag.shape.${id || 'pill'}` as MessageKey);

const stepValue = (value: Step): string =>
	value === 'tag'
		? [colorName(current.value.color), current.value.shape && shapeName(current.value.shape), styleName(current.value.style)].filter(Boolean).join(' · ')
		: partName(current.value[value]);
const stepEmpty = (value: Step): boolean => (value === 'hat' || value === 'face' || value === 'item') && !current.value[value];

// Every option is previewed on the current avatar, so a hat is shown on your own character.
// The character step lists every family at once; hat and face are one group with "None" first.
const groups = computed(() => {
	if (step.value === 'tag') {
		return [];
	}
	if (step.value === 'base') {
		return AVATAR_CATEGORIES.map((category) => ({
			category,
			options: AVATAR_BASES.filter((base) => base.category === category).map((base) => ({
				id: base.id,
				value: formatAvatar({ ...now.value, base: base.id }),
				selected: current.value.base === base.id,
			})),
		}));
	}
	const slot = step.value;
	return [{
		category: null,
		options: ['', ...{ hat: AVATAR_HATS, face: AVATAR_FACES, item: AVATAR_ITEMS }[slot].map((part) => part.id)].map((id) => ({
			id,
			value: formatAvatar({ ...now.value, [slot]: id }),
			selected: current.value.base !== '' && current.value[slot] === id,
		})),
	}];
});

const nextStep = computed(() => STEPS[STEPS.findIndex((entry) => entry.value === step.value) + 1]);

const choose = (value: string): void => {
	model.value.avatar = value;
};

const surprise = (): void => {
	model.value.avatar = randomAvatar();
};

const onStepKey = (event: KeyboardEvent): void => {
	const offset = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
	if (!offset) {
		return;
	}
	const index = (STEPS.findIndex((entry) => entry.value === step.value) + offset + STEPS.length) % STEPS.length;
	step.value = STEPS[index].value;
	document.getElementById(`${uid}-step-${step.value}`)?.focus();
};
</script>

<template>
	<div class="profile-form">
		<div class="layout">
		<aside class="hero">
			<figure class="stage">
				<div :key="model.avatar" class="portrait" aria-hidden="true"><AvatarIcon :value="model.avatar" /></div>
				<figcaption class="nametag"><NameTag :name="displayName" :look="model.avatar" /></figcaption>
			</figure>
			<div class="hero-side">
				<div class="in-game" aria-hidden="true">
					<span class="in-game-label">{{ t('pf.inGame') }}</span>
					<span class="chip"><AvatarIcon :value="model.avatar" /><NameTag class="chip-name" :name="displayName" :look="model.avatar" /></span>
				</div>
				<label>
					{{ t('pf.nickname') }}
					<span class="char-count">{{ model.nickname.length }}/24</span>
					<input v-model="model.nickname" maxlength="24" required :placeholder="t('pf.nicknamePh')" />
				</label>
				<p class="intro">{{ t('pf.intro') }}</p>
				<button type="button" class="surprise" @click="surprise">
					<AppIcon class="dice" name="dice" />{{ t('pf.surprise') }}
				</button>
			</div>
		</aside>

		<div class="builder">
			<div class="steps" role="tablist" :aria-label="t('pf.customise')" @keydown="onStepKey">
				<button
					v-for="(entry, index) in STEPS"
					:id="`${uid}-step-${entry.value}`"
					:key="entry.value"
					type="button"
					role="tab"
					class="step"
					:style="{ '--step': entry.color }"
					:aria-selected="step === entry.value"
					:aria-controls="`${uid}-panel`"
					:tabindex="step === entry.value ? 0 : -1"
					@click="step = entry.value"
				>
					<span class="bubble" aria-hidden="true"><AppIcon :name="entry.icon" /><span class="num">{{ index + 1 }}</span></span>
					<span class="step-text">
						<span class="step-label">{{ t(`pf.step.${entry.value}` as MessageKey) }}</span>
						<strong class="step-value" :class="{ empty: stepEmpty(entry.value) }">{{ stepValue(entry.value) }}</strong>
					</span>
				</button>
			</div>

			<div :id="`${uid}-panel`" class="panel" role="tabpanel" :aria-labelledby="`${uid}-step-${step}`">
				<p class="hint">{{ t(`pf.hint.${step}` as MessageKey) }}</p>

				<template v-if="step === 'tag'">
					<section class="group">
						<h3 class="group-title" style="--tint: var(--color-5)"><span class="group-icon"><AppIcon name="palette" /></span> {{ t('pf.tagColor') }}</h3>
						<div class="grid" role="radiogroup" :aria-label="t('pf.tagColor')">
							<button
								v-for="color in TAG_COLORS"
								:key="color.id"
								type="button"
								role="radio"
								class="option"
								:class="{ active: current.color === color.id }"
								:aria-checked="current.color === color.id"
								@click="choose(formatAvatar({ ...now, color: color.id }))"
							>
								<span class="thumb" aria-hidden="true">
									<span class="swatch" :class="{ classic: !color.id }" :style="{ '--swatch': color.bg, color: color.ink }">Aa</span>
								</span>
								<span class="name">{{ colorName(color.id) }}</span>
							</button>
						</div>
					</section>
					<section class="group">
						<h3 class="group-title" style="--tint: var(--color-2)"><span class="group-icon"><AppIcon name="bookmark" /></span> {{ t('pf.tagShape') }}</h3>
						<div class="grid styles" role="radiogroup" :aria-label="t('pf.tagShape')">
							<button
								v-for="shape in TAG_SHAPES"
								:key="shape"
								type="button"
								role="radio"
								class="option"
								:class="{ active: current.shape === shape }"
								:aria-checked="current.shape === shape"
								@click="choose(formatAvatar({ ...now, shape }))"
							>
								<span class="style-sample" aria-hidden="true"><NameTag :name="displayName" :look="formatAvatar({ ...now, shape })" /></span>
								<span class="name">{{ shapeName(shape) }}</span>
							</button>
						</div>
					</section>
					<section class="group">
						<h3 class="group-title" style="--tint: var(--color-1)"><span class="group-icon"><AppIcon name="pencil" /></span> {{ t('pf.nameStyle') }}</h3>
						<div class="grid styles" role="radiogroup" :aria-label="t('pf.nameStyle')">
							<button
								v-for="style in NAME_STYLES"
								:key="style"
								type="button"
								role="radio"
								class="option"
								:class="{ active: current.style === style }"
								:aria-checked="current.style === style"
								@click="choose(formatAvatar({ ...now, style }))"
							>
								<span class="style-sample" aria-hidden="true"><NameTag :name="displayName" :look="formatAvatar({ ...now, style })" /></span>
								<span class="name">{{ styleName(style) }}</span>
							</button>
						</div>
					</section>
				</template>

				<section v-for="group in groups" :key="group.category ?? step" class="group">
					<h3 v-if="group.category" class="group-title" :style="{ '--tint': CATEGORY_COLORS[group.category] }">
						<span class="group-icon" aria-hidden="true"><AppIcon :name="CATEGORY_ICONS[group.category]" /></span>
						{{ t(`av.${group.category}` as MessageKey) }}
						<span class="count">{{ t('pf.familyCount', { n: group.options.length }) }}</span>
					</h3>
					<div class="grid" role="radiogroup" :aria-label="t(group.category ? `av.${group.category}` as MessageKey : `pf.step.${step}` as MessageKey)">
						<button
							v-for="option in group.options"
							:key="option.id"
							type="button"
							role="radio"
							class="option"
							:class="{ active: option.selected }"
							:aria-checked="option.selected"
							@click="choose(option.value)"
						>
							<span class="thumb" aria-hidden="true">
								<span v-if="!option.id" class="none">✕</span>
								<AvatarIcon v-else :value="option.value" />
							</span>
							<span class="name">{{ partName(option.id) }}</span>
						</button>
					</div>
				</section>

				<button v-if="nextStep" type="button" class="next" @click="step = nextStep.value">
					{{ t('pf.next', { step: t(`pf.step.${nextStep.value}` as MessageKey) }) }} <span aria-hidden="true">→</span>
				</button>
			</div>
		</div>
		</div>
	</div>
</template>

<style scoped>
.profile-form {
	container-type: inline-size;
}

.layout {
	display: grid;
	gap: 1.25rem;
}

/* Preview + nickname: stacked on phones, side by side in a card, a sticky column on wide screens. */
.hero {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 1rem;
}

@container (min-width: 30rem) {
	.hero {
		flex-flow: row wrap;
		gap: 1.5rem;
	}

	.surprise {
		align-self: flex-start;
	}
}

@container (min-width: 56rem) {
	.layout {
		grid-template-columns: minmax(18rem, 22rem) minmax(0, 1fr);
		align-items: start;
		gap: 1.75rem;
	}

	.hero {
		position: sticky;
		top: calc(var(--header-height) + 1rem);
		flex-direction: column;
		align-items: stretch;
		padding: 1.5rem;
		border-radius: var(--radius);
		background: var(--surface-2);
	}

	.stage {
		align-self: center;
	}

	.portrait {
		width: 12rem;
		height: 12rem;
		font-size: 7rem;
	}

	.surprise {
		align-self: stretch;
		justify-content: center;
	}

	.grid {
		grid-template-columns: repeat(auto-fill, minmax(5.4rem, 1fr));
	}

	.thumb {
		width: 4rem;
		height: 4rem;
		font-size: 3.1rem;
	}
}

.in-game {
	display: flex;
	align-items: center;
	gap: 0.5rem;
}

.in-game-label {
	color: var(--text-muted);
	font-size: 0.75rem;
	font-weight: 700;
	letter-spacing: 0.04em;
	text-transform: uppercase;
}

.chip {
	display: inline-flex;
	align-items: center;
	gap: 0.4rem;
	min-width: 0;
	padding: 0.2rem 0.8rem 0.2rem 0.3rem;
	border-radius: 999px;
	background: var(--surface);
	box-shadow: var(--shadow);
	font-size: 1.3rem;
}

.chip-name {
	font-size: 0.9rem;
}

.swatch {
	display: grid;
	place-items: center;
	width: 2.8rem;
	height: 2.8rem;
	border: 3px solid var(--surface);
	border-radius: 50%;
	background: var(--swatch);
	box-shadow: 0 0.2rem 0 rgba(0, 0, 0, 0.25);
	font-size: 0.95rem;
	font-weight: 700;
}

.swatch.classic {
	color: var(--text);
	box-shadow: inset 0 0 0 1.5px var(--border), 0 0.2rem 0 rgba(0, 0, 0, 0.25);
}

.grid.styles {
	grid-template-columns: repeat(auto-fill, minmax(8.5rem, 1fr));
}

.style-sample {
	display: grid;
	place-items: center;
	width: 100%;
	min-height: 3.4rem;
	padding-inline: 0.3rem;
	font-size: 1.05rem;
}

.stage {
	display: flex;
	flex: none;
	flex-direction: column;
	align-items: center;
	margin: 0;
}

.portrait {
	display: grid;
	place-items: center;
	width: 8.5rem;
	height: 8.5rem;
	border: 4px solid var(--accent-line);
	border-radius: 50%;
	background:
		radial-gradient(circle at 30% 25%, color-mix(in srgb, var(--color-3) 30%, transparent), transparent 55%),
		radial-gradient(circle at 75% 80%, color-mix(in srgb, var(--color-2) 30%, transparent), transparent 55%),
		var(--surface-2);
	box-shadow: 0 0.3rem 0 color-mix(in srgb, var(--accent) 55%, black);
	font-size: 4.8rem;
	animation: pop 0.35s cubic-bezier(0.3, 1.6, 0.5, 1);
}

.nametag {
	z-index: 1;
	max-width: 12rem;
	margin-top: -0.9rem;
	font-size: 1.05rem;
}

.nametag :deep(.name-tag) {
	padding: 0.3em 0.9em;
	box-shadow: 0 0.2rem 0 rgba(0, 0, 0, 0.3);
}

.hero-side {
	display: flex;
	flex: 1;
	flex-direction: column;
	gap: 0.6rem;
	width: 100%;
}

.intro {
	margin: 0;
	color: var(--text-muted);
	font-size: 0.9rem;
	line-height: 1.4;
}

.surprise {
	display: inline-flex;
	align-items: center;
	gap: 0.4rem;
	align-self: center;
	padding: 0.45rem 1rem;
	border: 2px dashed var(--accent-line);
	border-radius: 999px;
	background: none;
	color: var(--accent-text);
	font: inherit;
	font-weight: 700;
	cursor: pointer;
	transition: background 0.15s;
}

.surprise:hover {
	background: color-mix(in srgb, var(--color-5) 15%, transparent);
}

.dice {
	display: inline-block;
	transition: transform 0.3s;
}

.surprise:hover .dice {
	transform: rotate(180deg);
}

/* Steps */
.builder {
	display: flex;
	flex-direction: column;
	border-radius: var(--radius);
	background: var(--surface-2);
}

.steps {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(7rem, 1fr));
	gap: 0.4rem;
	padding: 0.5rem;
}

.step {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.35rem;
	min-width: 0;
	padding: 0.6rem 0.4rem 0.5rem;
	border: 2px solid transparent;
	border-radius: calc(var(--radius) - 0.2rem);
	background: none;
	color: var(--text);
	font: inherit;
	text-align: center;
	cursor: pointer;
	transition: background 0.15s, transform 0.15s, border-color 0.15s;
}

.step:hover {
	transform: translateY(-2px);
	background: color-mix(in srgb, var(--surface) 60%, transparent);
	border-color: color-mix(in srgb, var(--step) 45%, transparent);
}

.step[aria-selected='true'] {
	border-color: var(--accent-line);
	background: var(--surface);
	box-shadow: 0 0.25rem 0 color-mix(in srgb, var(--accent) 55%, black);
}

.bubble {
	position: relative;
	display: grid;
	place-items: center;
	width: 2.8rem;
	height: 2.8rem;
	border-radius: 50%;
	background: color-mix(in srgb, var(--step) 22%, var(--surface));
	box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--step) 60%, transparent);
	font-size: 1.45rem;
	transition: transform 0.2s cubic-bezier(0.3, 1.6, 0.5, 1);
}

.step:hover .bubble,
.step[aria-selected='true'] .bubble {
	transform: scale(1.08) rotate(-6deg);
}

.step[aria-selected='true'] .bubble {
	background: color-mix(in srgb, var(--step) 40%, var(--surface));
}

.num {
	position: absolute;
	right: -0.35rem;
	bottom: -0.2rem;
	display: grid;
	place-items: center;
	width: 1.25rem;
	height: 1.25rem;
	border: 2px solid var(--surface-2);
	border-radius: 50%;
	background: var(--border);
	color: var(--text-muted);
	font-size: 0.7rem;
	font-weight: 700;
	transform: rotate(6deg);
}

.step[aria-selected='true'] .num {
	border-color: var(--surface);
	background: var(--accent);
	color: var(--on-accent);
}

.step-text {
	display: flex;
	flex-direction: column;
	width: 100%;
	min-width: 0;
	line-height: 1.2;
}

.step-label {
	color: var(--text-muted);
	font-size: 0.75rem;
	font-weight: 700;
	letter-spacing: 0.03em;
	text-transform: uppercase;
	white-space: nowrap;
}

.step-value {
	overflow: hidden;
	font-size: 0.9rem;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.step-value.empty {
	color: var(--text-muted);
	font-weight: 500;
}

.panel {
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
	padding: 0.5rem 0.9rem 0.9rem;
}

.hint {
	margin: 0;
	color: var(--text-muted);
	font-size: 0.9rem;
}

.group {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
}

.group-title {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	margin: 0.4rem 0 0;
	font-size: 1rem;
}

/* Dashed rule fills the rest of the line so each family reads as its own section. */
.group-title::after {
	content: '';
	flex: 1;
	border-top: 2px dashed var(--border);
}

.group-icon {
	display: grid;
	flex: none;
	place-items: center;
	width: 1.9rem;
	height: 1.9rem;
	border-radius: 50%;
	background: color-mix(in srgb, var(--tint) 25%, var(--surface));
	box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--tint) 55%, transparent);
	font-size: 1rem;
}

.count {
	flex: none;
	padding: 0.1rem 0.55rem;
	border-radius: 999px;
	background: var(--surface);
	color: var(--text-muted);
	font-size: 0.75rem;
	font-weight: 700;
	white-space: nowrap;
}

.grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(4.4rem, 1fr));
	gap: 0.5rem;
}

.option {
	position: relative;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.3rem;
	padding: 0.5rem 0.25rem 0.4rem;
	border: 2px solid transparent;
	border-radius: var(--radius-sm);
	background: var(--surface);
	color: var(--text);
	font: inherit;
	cursor: pointer;
	transition: transform 0.15s, border-color 0.15s;
}

.option:hover {
	transform: translateY(-2px);
	border-color: color-mix(in srgb, var(--color-5) 50%, transparent);
}

.option.active {
	border-color: var(--accent-line);
	background: color-mix(in srgb, var(--color-5) 18%, var(--surface));
}

.option.active::after {
	content: '✓';
	position: absolute;
	top: -0.45rem;
	right: -0.45rem;
	display: grid;
	place-items: center;
	width: 1.3rem;
	height: 1.3rem;
	border: 2px solid var(--surface);
	border-radius: 50%;
	background: var(--accent);
	color: var(--on-accent);
	font-size: 0.75rem;
	font-weight: 700;
	animation: pop 0.3s cubic-bezier(0.3, 1.6, 0.5, 1);
}

.thumb {
	display: grid;
	place-items: center;
	width: 3.4rem;
	height: 3.4rem;
	font-size: 2.6rem;
}

.none {
	display: grid;
	place-items: center;
	width: 2.4rem;
	height: 2.4rem;
	border: 2px dashed var(--border);
	border-radius: 50%;
	color: var(--text-muted);
	font-size: 1rem;
	font-weight: 700;
}

.name {
	max-width: 100%;
	overflow: hidden;
	font-size: 0.75rem;
	font-weight: 600;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.next {
	align-self: flex-end;
	padding: 0.35rem 0.9rem;
	border: none;
	border-radius: 999px;
	background: none;
	color: var(--accent-text);
	font: inherit;
	font-weight: 700;
	cursor: pointer;
}

.next:hover {
	background: color-mix(in srgb, var(--color-5) 15%, transparent);
}

@keyframes pop {
	from {
		transform: scale(0.85);
	}
}
</style>
