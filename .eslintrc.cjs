/* eslint-disable filenames/match-regex,@typescript-eslint/naming-convention */
module.exports = {
	root: true,
	parser: '@typescript-eslint/parser',
	parserOptions: {
		ecmaVersion: 2020,
		sourceType: 'module',
		ecmaFeatures: {
			impliedStrict: true,
			experimentalDecorators: true,
		},
	},
	plugins: ['prettier', '@typescript-eslint', 'filenames'],
	extends: ['airbnb-base', 'prettier', 'plugin:@typescript-eslint/recommended'],
	ignorePatterns: ['**/coverage/*', 'dist/', 'node_modules/', 'src/third-party/'],
	env: {
		browser: true,
		amd: true,
		node: true,
		es6: true,
	},
	rules: {
		'prettier/prettier': 2,

		'filenames/match-regex': [2, '^([a-z0-9]+[-.])*[a-z0-9]+$', true],

		'default-param-last': 0,
		'no-restricted-syntax': 0,

		'import/no-unresolved': 0,
		'import/no-extraneous-dependencies': 0,
		'import/extensions': 0,
		'import/no-anonymous-default-export': [
			2,
			{
				allowArray: true,
				allowLiteral: true,
				allowObject: true,
			},
		],
		'import/no-duplicates': 2,

		indent: 0,
		'no-shadow': 0,
		'no-param-reassign': [2, { props: false }],
		'no-unused-expressions': 0,
		'no-use-before-define': 0,
		'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 0,
		'prefer-destructuring': 0,
		curly: [2, 'all'],
		'class-methods-use-this': 0,
		'lines-between-class-members': [2, 'always', { exceptAfterSingleLine: true }],
		'no-duplicate-imports': 0,

		'@typescript-eslint/no-shadow': 2,
		'@typescript-eslint/array-type': [2, { default: 'array' }],
		'@typescript-eslint/indent': 0,
		'@typescript-eslint/consistent-type-imports': 2,
		'@typescript-eslint/member-delimiter-style': [
			2,
			{
				multiline: {
					delimiter: 'semi',
					requireLast: true,
				},
				singleline: {
					delimiter: 'semi',
					requireLast: false,
				},
			},
		],
		'@typescript-eslint/naming-convention': [
			2,
			{
				selector: 'default',
				format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
			},
			{
				selector: 'property',
				format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
				leadingUnderscore: 'allow',
			},
			{
				selector: 'enum',
				format: ['PascalCase'],
			},
			{
				selector: 'enumMember',
				format: ['PascalCase'],
			},
			{
				selector: 'typeAlias',
				format: ['PascalCase'],
			},
			{
				selector: 'typeParameter',
				format: ['PascalCase'],
			},
			{
				selector: 'class',
				format: ['PascalCase'],
			},
			{
				selector: 'interface',
				format: ['PascalCase'],
				prefix: ['I'],
			},
		],
		'@typescript-eslint/no-array-constructor': 2,
		'@typescript-eslint/no-extraneous-class': 2,
		'@typescript-eslint/no-misused-new': 2,
		'@typescript-eslint/no-unused-vars': 2,
		'@typescript-eslint/no-use-before-define': [
			2,
			{
				functions: false,
				classes: true,
				variables: true,
				ignoreTypeReferences: true,
			},
		],
		'@typescript-eslint/no-useless-constructor': 2,
		'@typescript-eslint/no-var-requires': 0,
		'@typescript-eslint/ban-ts-comment': 1,
		'@typescript-eslint/default-param-last': 2,
	},
	overrides: [
		{
			files: ['*.ts'],
			rules: {
				'no-empty-function': 0,
				'no-useless-constructor': 0,
				'no-unused-vars': 0,
				quotes: [2, 'single'],
			},
		},
	],
};
