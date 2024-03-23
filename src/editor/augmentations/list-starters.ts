import type TextBlock from '../block-types/text';

const NUM_CHAR_CODES = ['0'.charCodeAt(0), '9'.charCodeAt(0)];

/**
 * Convert block to ul/ol type based on typed starting text.
 * @param block block to be augmented
 * @param blockTypes ul/ol block type names used to convert block to
 * @returns function to remove this augmentation
 */
export default function addListStarters(blockTypes: { ul?: string; ol?: string } = { ul: 'ul', ol: 'ol' }): (block: TextBlock) => () => void {
	return (block: TextBlock) => {
		const el = block.textbox.element;
		const listener = ((event: InputEvent) => {
			// when only first 2 or 3 symbols are typed and the last one is a space character...
			if (block.parent && event.data === ' ' && el.firstChild instanceof Text) {
				const text = el.firstChild.textContent;
				if (!text?.length) {
					return;
				}
				// ...convert '* ' or '- ' to UL
				if (
					blockTypes.ul &&
					[
						// for Chromium and friends
						'*\u00a0',
						'-\u00a0',
						// for Firefox
						'* ',
						'- ',
					].includes(text)
				) {
					el.firstChild.textContent = '';
					block.parent.convertTo(block, blockTypes.ul);
				}
				// ...convert '1. ' or '1) ' to OL
				else if (blockTypes.ol) {
					const firstCharCode = text.charCodeAt(0);
					if (
						// first char is numeric
						firstCharCode >= NUM_CHAR_CODES[0] &&
						firstCharCode <= NUM_CHAR_CODES[1] &&
						['.', ')'].includes(text.charAt(1)) &&
						[
							// for Chromium and friends
							'\u00a0',
							// for Firefox
							' ',
						].includes(text.charAt(2))
					) {
						el.firstChild.textContent = '';
						block.parent.convertTo(block, blockTypes.ol);
					}
				}
			}
		}) as (event: Event) => void;
		el.addEventListener('input', listener);
		return () => {
			el.removeEventListener('input', listener);
		};
	};
}
