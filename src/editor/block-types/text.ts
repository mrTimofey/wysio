import Block from './abstract-base';
import type { IBlockEvents } from '../editable-block';
import EditableBlock from '../editable-block';
import type InlineToolbox from '../inline-toolbox';
import CollectionBlock from './collection';

export interface IConfig {
	inlineToolbox?: InlineToolbox;
	class?: string[];
	tag?: string;
}

/**
 * Extract previous block within a parent chain.
 * If a passed block is not the first one just return previous. Otherwise, check next parent collection.
 */
function getPreviousEditableBlock(block: Block<unknown> | null): Block<unknown> | null {
	if (!(block?.parent instanceof CollectionBlock)) {
		return null;
	}
	const index = block.parent.getBlockIndex(block);
	return index > 0 ? block.parent.getBlock(index - 1) : getPreviousEditableBlock(block.parent);
}

export default class TextBlock extends Block<IConfig> {
	#inlineToolbox?: InlineToolbox;
	#editableBlock: EditableBlock;
	#defaultConfig: IConfig = {};

	constructor(private tag = 'div') {
		super(tag);
		this.#editableBlock = new EditableBlock(document.createElement('div'));
		this.element.append(this.#editableBlock.element);
		// bind listener methods so they will have access to this
		this.updateToolboxRange = this.updateToolboxRange.bind(this);
		this.onSplit = this.onSplit.bind(this);
		this.onEmptyEnter = this.onEmptyEnter.bind(this);
		this.onMergeWithPrevious = this.onMergeWithPrevious.bind(this);
		this.#editableBlock.on('split', this.onSplit);
		this.#editableBlock.on('emptyEnter', this.onEmptyEnter);
		this.#editableBlock.on('mergeWithPrevious', this.onMergeWithPrevious);
	}

	configure(config: IConfig): void {
		// we need to save the config to create similar blocks on split
		this.#defaultConfig = config;
		if (config.class?.length) {
			this.element.classList.add(...config.class);
		}
		if (config.tag) {
			// here we can make an additional tag to make it look like paragraph, h1, h2, etc.
			const element = document.createElement(config.tag);
			element.append(this.#editableBlock.element);
			this.element.append(element);
		}
		this.inlineToolbox = config.inlineToolbox;
	}

	get defaultEditableElement(): HTMLElement {
		return this.#editableBlock.element;
	}

	set inlineToolbox(toolbox: InlineToolbox | undefined) {
		if (this.#inlineToolbox) {
			this.#editableBlock.off('selectionChange', this.updateToolboxRange);
			this.#inlineToolbox = undefined;
		}
		if (!toolbox) {
			return;
		}
		this.#inlineToolbox = toolbox;
		this.#editableBlock.on('selectionChange', this.updateToolboxRange);
	}

	private updateToolboxRange({ range }: IBlockEvents['selectionChange']) {
		this.#inlineToolbox?.attachToRange(range, this.#editableBlock);
	}

	private onSplit({ cutFragment }: IBlockEvents['split']) {
		this.parent?.onItemSplit(this, cutFragment);
	}

	private onEmptyEnter() {
		this.parent?.onItemEmptyEnter(this);
	}

	private onMergeWithPrevious({ cutFragment }: IBlockEvents['mergeWithPrevious']) {
		if (!this.parent) {
			return;
		}
		const prevBlock = getPreviousEditableBlock(this);
		if (!prevBlock?.defaultEditableElement) {
			return;
		}
		const fragment = cutFragment();
		const rangeNode = fragment.firstChild;
		prevBlock.defaultEditableElement.append(fragment);
		const selection = window.getSelection();
		if (!selection) {
			return;
		}
		const range = document.createRange();
		if (rangeNode) {
			// start of the cut content
			range.setStart(rangeNode, 0);
			range.setEnd(rangeNode, 0);
		} else if (prevBlock.defaultEditableElement.lastChild) {
			// end of the previous element's editable content
			range.setStartAfter(prevBlock.defaultEditableElement.lastChild);
			range.setEndAfter(prevBlock.defaultEditableElement.lastChild);
		} else {
			// start of the previous element's editable content
			range.setStart(prevBlock.defaultEditableElement, 0);
			range.setEnd(prevBlock.defaultEditableElement, 0);
		}
		selection.removeAllRanges();
		selection.addRange(range);
		prevBlock.defaultEditableElement.normalize();
		this.parent.removeBlock(this);
	}
}
