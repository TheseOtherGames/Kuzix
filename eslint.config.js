import stylistic from '@stylistic/eslint-plugin';
import tseslint from 'typescript-eslint';
import vueParser from 'vue-eslint-parser';

// Lists of 4+ items go one per line; shorter ones may stay inline. Imports and exports never unfold.
const big = {
	multiline: true,
	minItems: 4,
};
const bigObject = {
	minProperties: 4,
	consistent: true,
};

export default [
	{ ignores: ['**/dist/**', '**/node_modules/**'] },
	{
		files: ['**/*.ts', '**/*.js'],
		languageOptions: { parser: tseslint.parser },
	},
	{
		files: ['**/*.vue'],
		languageOptions: {
			parser: vueParser,
			parserOptions: { parser: tseslint.parser },
		},
	},
	{
		files: ['**/*.ts', '**/*.js', '**/*.vue'],
		plugins: { '@stylistic': stylistic },
		rules: {
			'@stylistic/no-trailing-spaces': 'error',
			'@stylistic/indent': ['error', 'tab'],
			'@stylistic/no-multiple-empty-lines': ['error', { max: 1 }],
			'@stylistic/padding-line-between-statements': [
				'error',
				{
					blankLine: 'always',
					prev: '*',
					next: [
						'return',
						'throw',
						'break',
						'continue',
					],
				},
			],
			'@stylistic/object-curly-newline': [
				'error',
				{
					ObjectExpression: bigObject,
					ObjectPattern: bigObject,
					ImportDeclaration: 'never',
					ExportDeclaration: 'never',
				},
			],
			'@stylistic/object-property-newline': ['error', { allowAllPropertiesOnSameLine: true }],
			'@stylistic/array-bracket-newline': ['error', big],
			'@stylistic/array-element-newline': ['error', big],
			'@stylistic/comma-dangle': ['error', 'always-multiline'],
		},
	},
];
