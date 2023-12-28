import Block from './abstract-base';
import type { IBlockEvents } from '../editable-block';
import EditableBlock from '../editable-block';
import type InlineToolbox from '../inline-toolbox';
import CollectionBlock from './collection';

export interface IConfig {
	inlineToolbox?: InlineToolbox;
	class?: string[];
	tag?: string;
	ulBlockType?: string;
	olBlockType?: string;
}

const NUM_CHAR_CODES = ['0'.charCodeAt(0), '9'.charCodeAt(0)];

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
	#convertBlockTypes = {
		ul: '',
		ol: '',
	};

	constructor(private tag = 'div') {
		super(tag);
		this.#editableBlock = new EditableBlock(document.createElement('div'));
		this.element.append(this.#editableBlock.element);
		// bind listener methods so they will have access to this
		this.updateToolboxRange = this.updateToolboxRange.bind(this);
		this.onInput = this.onInput.bind(this);
		this.onSplit = this.onSplit.bind(this);
		this.onEmptyEnter = this.onEmptyEnter.bind(this);
		this.onMergeWithPrevious = this.onMergeWithPrevious.bind(this);
		this.onFocusMove = this.onFocusMove.bind(this);
		this.#editableBlock.element.addEventListener('input', this.onInput as (e: Event) => void);
		this.#editableBlock.on('split', this.onSplit);
		this.#editableBlock.on('emptyEnter', this.onEmptyEnter);
		this.#editableBlock.on('mergeWithPrevious', this.onMergeWithPrevious);
		this.#editableBlock.on('focusMove', this.onFocusMove);
	}

	override configure(config: IConfig): void {
		super.configure(config);
		if (config.class?.length) {
			this.element.classList.add(...config.class);
		}
		if (config.tag) {
			// here we can make an additional tag to make it look like paragraph, h1, h2, etc.
			const element = document.createElement(config.tag);
			element.append(this.#editableBlock.element);
			this.element.append(element);
		}
		this.#convertBlockTypes.ul = config.ulBlockType || '';
		this.#convertBlockTypes.ol = config.olBlockType || '';
		this.inlineToolbox = config.inlineToolbox;
	}

	override get defaultEditableElement(): HTMLElement {
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

	private onInput(event: InputEvent) {
		const el = this.#editableBlock.element;
		// when only first 2 or 3 symbols are typed and the last one is a space character...
		if (this.parent && event.data === ' ' && el.firstChild instanceof Text) {
			const text = el.firstChild.textContent;
			if (!text?.length) {
				return;
			}
			// ...convert '* ' to UL
			if (this.#convertBlockTypes.ul && ['*\u00a0', '-\u00a0'].includes(text)) {
				this.parent.convertTo(this, this.#convertBlockTypes.ul);
			}
			// ...convert 1. to OL
			else if (this.#convertBlockTypes.ol) {
				const firstCharCode = text.charCodeAt(0);
				if (
					// first char is numeric
					firstCharCode >= NUM_CHAR_CODES[0] &&
					firstCharCode <= NUM_CHAR_CODES[1] &&
					['.', ')'].includes(text.charAt(1)) &&
					text.charAt(2) === '\u00a0'
				) {
					this.parent.convertTo(this, this.#convertBlockTypes.ol);
				}
			}
		}
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

	private onFocusMove({ direction }: IBlockEvents['focusMove']) {
		let currentParent = this.parent;
		if (!currentParent) {
			return;
		}
		let thisIndex = currentParent.getBlockIndex(this);
		let newIndex = direction === 'previous' ? thisIndex - 1 : thisIndex + 1;
		while (currentParent?.parent && (newIndex === -1 || newIndex >= currentParent.length)) {
			thisIndex = currentParent.parent.getBlockIndex(currentParent);
			newIndex = direction === 'previous' ? thisIndex - 1 : thisIndex + 1;
			currentParent = currentParent.parent;
		}
		const newBlock = currentParent?.getBlock(newIndex);
		if (!newBlock) {
			return;
		}
		if (newBlock instanceof CollectionBlock) {
			(direction === 'previous' ? newBlock.lastEditableElement : newBlock.firstEditableElement)?.focus();
		} else {
			newBlock.defaultEditableElement?.focus();
		}
	}
}
