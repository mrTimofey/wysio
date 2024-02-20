import type TextBlock from '../block-types/text';
import type InlineToolbox from '../inline-toolbox';
import type { ITextboxEvents } from '../rich-textbox';

/**
 * Add the toolbox for inline text formatting.
 * @param block block to be augmented
 * @param toolbox InlineToolbox instance
 * @returns augmenting function, returns function to remove this augmentation
 */
export default function augment(toolbox: InlineToolbox): (block: TextBlock) => () => void {
	return (block: TextBlock) => {
		const updateToolboxRange = ({ range }: ITextboxEvents['selectionChange']) => {
			toolbox.attachToRange(range, block.textbox);
		};
		block.textbox.on('selectionChange', updateToolboxRange);
		return () => {
			block.textbox.off('selectionChange', updateToolboxRange);
		};
	};
}
