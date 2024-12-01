import type TextBlock from '../block-types/text';

const NUM_CHAR_CODES = ['0'.charCodeAt(0), '9'.charCodeAt(0)];
const SPACE_CHARS = [
	// for Firefox
	' ',
	// for Chromium and friends
	'\u00a0',
];

function isNumericCharCode(charCode: number) {
	return charCode >= NUM_CHAR_CODES[0] &&
		charCode <= NUM_CHAR_CODES[1];
}

/**
 * Convert block to a particular type based on input event.
 * @param blockType target type
 * @param predicate condition
 * @returns augmentation fn
 */
export default function withBlockConverter(
	blockType: string,
	predicate: (block: TextBlock, event: InputEvent) => boolean
): (block: TextBlock) => () => void {
	return (block) => {
		const el = block.textbox.element;
		const listener = ((event: InputEvent) => {
			if (!block.parent || !predicate(block, event)) {
				return;
			}
			if (el.firstChild) {
				el.textContent = '';
			}
			block.parent.convertTo(block, blockType);
		}) as (event: Event) => void;
		el.addEventListener('input', listener);
		return () => {
			el.removeEventListener('input', listener);
		};
	};
}

/**
 * Adds bullet list block starter ('* ', '- ').
 * @param blockType bullet list block type
 * @returns augmentation fn
 */
export function withBulletListStarters(blockType = 'ul') {
	const checks = [
		...SPACE_CHARS.map(space => `*${space}`),
		...SPACE_CHARS.map(space => `-${space}`),
	];
	return withBlockConverter(blockType, (block) => {
		const text = block.textbox.element.firstChild?.textContent;
		return text ? checks.includes(text) : false;
	});
}

/**
 * Adds ordered list block starter ('[0-9]. ', '[0-9]) ').
 * @param blockType ordered list block type
 * @returns augmentation fn
 */
export function withOrderedListStarters(blockType = 'ol') {
	return withBlockConverter(blockType, (block) => {
		const text = block.textbox.element.firstChild?.textContent;
		if (!text) {
			return false;
		}
		return isNumericCharCode(text.charCodeAt(0)) &&
			['.', ')'].includes(text.charAt(1)) &&
			SPACE_CHARS.includes(text.charAt(2));
	});
}

/**
 * Adds header starter ('##' => h2, '###' => h3, etc.).
 * @param level count of entered '#'
 * @param blockType header block type
 * @returns augmentation fn
 */
export function withHeaderStarter(level: 1 | 2 | 3 | 4 | 5 | 6 | 7, blockType = `h${level}`) {
	const headerStarter = Array(level).fill('#').join('');
	const checks = SPACE_CHARS.map(space => `${headerStarter}${space}`);
	return withBlockConverter(blockType, (block) => {
		const text = block.textbox.element.firstChild?.textContent;
		return text ? checks.includes(text) : false;
	});
}
