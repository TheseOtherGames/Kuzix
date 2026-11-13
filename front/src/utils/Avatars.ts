// SVG avatar art. Each part is a standalone file in ./avatar-parts/<folder>/<id>.svg (folder = base category,
// `hats`, `faces` or `items`; the file name is the id). An avatar is stored as one string,
// "<base>.<hat>.<face>.<tag colour>.<name style>.<item>.<tag shape>" (empty slots allowed: "fox", "fox.crown",
// "fox..shades", "fox...pink.glow", "fox.....wand"). New segments always go last so older strings stay valid.
// The name tag look rides in the avatar string so it reaches every screen with no new column or protocol field;
// split it out if it ever needs to be queried on its own.
// Unknown strings (old emoji avatars) are shown as text.
// How to draw new parts: .claude/skills/avatar-art/SKILL.md

export type AvatarCategory = 'animals' | 'food' | 'creatures' | 'sea';
export type AvatarSlot = 'hat' | 'face' | 'item';

export interface AvatarPart {
	id: string;
	svg: string;
	/** Faces only (`data-anchor`): 'mouth' parts (beard, mustache…) follow the mouth instead of the eyes. */
	anchor: 'eyes' | 'mouth';
}

export interface AvatarBase extends AvatarPart {
	category: AvatarCategory;
	/** y of the eye line (`data-eye-y`, default 54); face accessories are shifted to it. */
	eyeY: number;
	/** y of the top of the head (`data-top`, default 27); hats are shifted to it. */
	top: number;
	/** y of the mouth (`data-mouth-y`, default eyeY + 10); mouth-anchored faces are shifted to it. */
	mouthY: number;
}

export interface AvatarValue {
	base: string;
	hat: string;
	face: string;
	color: string;
	style: string;
	item: string;
	shape: string;
}

export interface TagColor {
	id: string;
	bg: string;
	ink: string;
	/** White text on a bright gradient: NameTag adds a dark text shadow to keep it readable. */
	shade?: boolean;
}

// '' = classic (theme surface). Dark ink on light fills, white on the rest (≥ 4.5:1); bright gradients get `shade`.
export const TAG_COLORS: TagColor[] = [
	{ id: '', bg: 'var(--surface)', ink: 'var(--text)' },
	{ id: 'purple', bg: '#8a45f5', ink: '#ffffff' },
	{ id: 'pink', bg: '#e5245a', ink: '#ffffff' },
	{ id: 'orange', bg: '#c2410c', ink: '#ffffff' },
	{ id: 'yellow', bg: '#ffb800', ink: '#1e2230' },
	{ id: 'green', bg: '#15834b', ink: '#ffffff' },
	{ id: 'teal', bg: '#2ec4b6', ink: '#1e2230' },
	{ id: 'blue', bg: '#2f6fe0', ink: '#ffffff' },
	{ id: 'ink', bg: '#2a2238', ink: '#ffffff' },
	{ id: 'mint', bg: '#5ee6b5', ink: '#1e2230' },
	{ id: 'silver', bg: 'linear-gradient(135deg, #f1f4f9, #b8c4d6 55%, #e6ebf2)', ink: '#1e2230' },
	{ id: 'gold', bg: 'linear-gradient(135deg, #ffe680, #ffb800 50%, #ffd23f)', ink: '#1e2230' },
	{
		id: 'sunset', bg: 'linear-gradient(90deg, #ff7a2f, #ff3d71)', ink: '#ffffff', shade: true,
	},
	{
		id: 'candy', bg: 'linear-gradient(90deg, #ff6fae, #9b5cff)', ink: '#ffffff', shade: true,
	},
	{
		id: 'ocean', bg: 'linear-gradient(90deg, #2f6fe0, #2ec4b6)', ink: '#ffffff', shade: true,
	},
	{
		id: 'fire', bg: 'linear-gradient(90deg, #e5245a, #ff7a2f, #ffb800)', ink: '#ffffff', shade: true,
	},
	{
		id: 'galaxy',
		bg: 'radial-gradient(circle at 6% 30%, #fff 0 0.06em, transparent 0.09em), radial-gradient(circle at 10% 76%, #ffd23f 0 0.05em, transparent 0.08em), radial-gradient(circle at 93% 70%, #fff 0 0.06em, transparent 0.09em), radial-gradient(circle at 90% 24%, #fff 0 0.04em, transparent 0.07em), linear-gradient(90deg, #2a2238, #5b2a86, #2f6fe0)',
		ink: '#ffffff',
	},
	{
		id: 'rainbow', bg: 'linear-gradient(90deg, #ff3d71, #ff7a2f, #ffb800, #1fc96f, #3d8bff, #9b5cff)', ink: '#ffffff', shade: true,
	},
];

// Drawn by NameTag.vue (one CSS class per id). '' = classic. Text effects first, then animations.
export const NAME_STYLES = [
	'',
	'caps',
	'italic',
	'mono',
	'glow',
	'pop',
	'wave',
	'sparkle',
	'shimmer',
	'pulse',
	'jelly',
	'flicker',
	'hue',
];

// Tag outline, drawn by NameTag.vue (`design-<id>`). '' = pill.
export const TAG_SHAPES = [
	'',
	'sticker',
	'ribbon',
	'label',
	'pixel',
	'outline',
];

const EYE_Y = 54;
const TOP = 27;
const MOUTH_Y = 64;

export const AVATAR_CATEGORIES: AvatarCategory[] = [
	'animals',
	'food',
	'sea',
	'creatures',
];

const files = import.meta.glob<string>('@/shared/avatar-parts/*/*.svg', { query: '?raw', import: 'default', eager: true });

const parts = Object.entries(files).map(([path, source]) => {
	const [, folder, id] = path.match(/\/([^/]+)\/([^/]+)\.svg$/)!;
	const root = source.match(/<svg[^>]*>/)![0];
	const attr = (name: string): number | undefined => {
		const value = root.match(new RegExp(`${name}="([\\d.]+)"`))?.[1];

		return value === undefined ? undefined : Number(value);
	};

	return {
		folder,
		id,
		svg: source.slice(source.indexOf(root) + root.length, source.lastIndexOf('</svg>')),
		eyeY: attr('data-eye-y') ?? EYE_Y,
		top: attr('data-top') ?? TOP,
		mouthY: attr('data-mouth-y') ?? (attr('data-eye-y') ?? EYE_Y) + MOUTH_Y - EYE_Y,
		anchor: root.includes('data-anchor="mouth"') ? 'mouth' as const : 'eyes' as const,
	};
});

export const AVATAR_BASES: AvatarBase[] = AVATAR_CATEGORIES.flatMap((category) => parts
	.filter((part) => part.folder === category)
	.map(({
		id, svg, eyeY, top, mouthY, anchor,
	}) => ({
		id, svg, category, eyeY, top, mouthY, anchor,
	})));
export const AVATAR_HATS: AvatarPart[] = parts.filter((part) => part.folder === 'hats');
export const AVATAR_FACES: AvatarPart[] = parts.filter((part) => part.folder === 'faces');
// Held items are drawn at a fixed spot (lower right), no anchor.
export const AVATAR_ITEMS: AvatarPart[] = parts.filter((part) => part.folder === 'items');

// Emoji avatars saved before the SVG set existed.
const LEGACY: Record<string, string> = {
	'🦊': 'fox', '🐼': 'panda', '🐸': 'frog', '🦖': 'dino', '👾': 'monster', '🤖': 'robot', '🌵': 'cactus',
};

const byId = <T extends { id: string }>(list: T[], id: string | undefined): T | undefined =>
	list.find((part) => part.id === id);

export const parseAvatar = (value: string): AvatarValue | null => {
	const [
		base,
		hat = '',
		face = '',
		color = '',
		style = '',
		item = '',
		shape = '',
	] = (LEGACY[value] ?? value).split('.');
	if (!byId(AVATAR_BASES, base)) {
		return null;
	}

	return {
		base,
		hat: byId(AVATAR_HATS, hat) ? hat : '',
		face: byId(AVATAR_FACES, face) ? face : '',
		color: byId(TAG_COLORS, color) ? color : '',
		style: NAME_STYLES.includes(style) ? style : '',
		item: byId(AVATAR_ITEMS, item) ? item : '',
		shape: TAG_SHAPES.includes(shape) ? shape : '',
	};
};

export const formatAvatar = ({
	base, hat, face, color, style, item, shape,
}: AvatarValue): string =>
	[
		base,
		hat,
		face,
		color,
		style,
		item,
		shape,
	].join('.').replace(/\.+$/, '');

/** Name tag look of an avatar string; old emoji avatars get the classic tag. */
export const tagLook = (value: string): { color: TagColor; style: string; shape: string } => {
	const parsed = parseAvatar(value);

	return { color: byId(TAG_COLORS, parsed?.color) ?? TAG_COLORS[0], style: parsed?.style ?? '', shape: parsed?.shape ?? '' };
};

/** Inner SVG markup (viewBox 0 0 100 100), or null when the value is not an SVG avatar. */
export const avatarSvg = (value: string): string | null => {
	const parsed = parseAvatar(value);
	if (!parsed) {
		return null;
	}
	const base = byId(AVATAR_BASES, parsed.base)!;
	const hat = byId(AVATAR_HATS, parsed.hat);
	const face = byId(AVATAR_FACES, parsed.face);
	const item = byId(AVATAR_ITEMS, parsed.item);

	return base.svg
		+ (face ? `<g transform="translate(0 ${face.anchor === 'mouth' ? base.mouthY - MOUTH_Y : base.eyeY - EYE_Y})">${face.svg}</g>` : '')
		+ (hat ? `<g transform="translate(0 ${base.top - TOP})">${hat.svg}</g>` : '')
		+ (item?.svg ?? '');
};

const pick = <T>(list: T[]): T => list[Math.floor(Math.random() * list.length)];

/** Random character only: no accessories, classic name tag (guest default). */
export const randomBase = (): string => pick(AVATAR_BASES).id;

export const randomAvatar = (): string => formatAvatar({
	base: pick(AVATAR_BASES).id,
	hat: Math.random() < 0.5 ? pick(AVATAR_HATS).id : '',
	face: Math.random() < 0.4 ? pick(AVATAR_FACES).id : '',
	color: pick(TAG_COLORS).id,
	style: pick(NAME_STYLES),
	item: Math.random() < 0.35 ? pick(AVATAR_ITEMS).id : '',
	shape: pick(TAG_SHAPES),
});
