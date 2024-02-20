import Block from './abstract-base';
import type { ITextboxEvents } from '../rich-textbox';
import RichTextbox from '../rich-textbox';
import type InlineToolbox from '../inline-toolbox';
import CollectionBlock from './collection';
import { getCaretRect, setCaretToEnd, setCaretToStart } from '../../caret-utils';

const NUM_CHAR_CODES = ['0'.charCodeAt(0), '9'.charCodeAt(0)];

/**
 * Extract previous block within a parent chain.
 * If a passed block is not the first one just return previous. Otherwise, check next parent collection.
 */
function getPreviousEditableBlock(block: Block | null): Block | null {
	if (!(block?.parent instanceof CollectionBlock)) {
		return null;
	}
	const index = block.parent.getBlockIndex(block);
	return index > 0 ? block.parent.getBlock(index - 1) : getPreviousEditableBlock(block.parent);
}

export default class TextBlock extends Block {
	#inlineToolbox?: InlineToolbox;
	#textbox: RichTextbox;
	// TODO move to its own module
	ulBlockTypeName = '';
	olBlockTypeName = '';

	constructor(tag = 'div') {
		super(tag);
		this.#textbox = new RichTextbox(document.createElement('div'));
		this.element.append(this.#textbox.element);
		// bind listener methods so they will have access to this
		this.updateToolboxRange = this.updateToolboxRange.bind(this);
		this.onInput = this.onInput.bind(this);
		this.onSplit = this.onSplit.bind(this);
		this.onEmptyEnter = this.onEmptyEnter.bind(this);
		this.onMergeWithPrevious = this.onMergeWithPrevious.bind(this);
		this.onFocusMove = this.onFocusMove.bind(this);
		this.#textbox.element.addEventListener('input', this.onInput as (e: Event) => void);
		this.#textbox.on('split', this.onSplit);
		this.#textbox.on('emptyEnter', this.onEmptyEnter);
		this.#textbox.on('mergeWithPrevious', this.onMergeWithPrevious);
		this.#textbox.on('focusMove', this.onFocusMove);
	}

	override get defaultEditableElement(): HTMLElement {
		return this.#textbox.element;
	}

	set inlineToolbox(toolbox: InlineToolbox | undefined) {
		if (this.#inlineToolbox) {
			this.#textbox.off('selectionChange', this.updateToolboxRange);
			this.#inlineToolbox = undefined;
		}
		if (!toolbox) {
			return;
		}
		this.#inlineToolbox = toolbox;
		this.#textbox.on('selectionChange', this.updateToolboxRange);
	}

	get inlineToolbox() {
		return this.#inlineToolbox;
	}

	private updateToolboxRange({ range }: ITextboxEvents['selectionChange']) {
		this.#inlineToolbox?.attachToRange(range, this.#textbox);
	}

	private onInput(event: InputEvent) {
		const el = this.#textbox.element;
		// when only first 2 or 3 symbols are typed and the last one is a space character...
		if (this.parent && event.data === ' ' && el.firstChild instanceof Text) {
			const text = el.firstChild.textContent;
			if (!text?.length) {
				return;
			}
			// ...convert '* ' or '- ' to UL
			if (
				this.ulBlockTypeName &&
				[
					// for Chromium and friends
					'*\u00a0',
					'-\u00a0',
					// for Firefox
					'* ',
					'- ',
				].includes(text)
			) {
				this.parent.convertTo(this, this.ulBlockTypeName);
			}
			// ...convert '1. ' or '1) ' to OL
			else if (this.olBlockTypeName) {
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
					this.parent.convertTo(this, this.olBlockTypeName);
				}
			}
		}
	}

	private onSplit({ cutFragment }: ITextboxEvents['split']) {
		this.parent?.onItemSplit(this, cutFragment);
	}

	private onEmptyEnter() {
		this.parent?.onItemEmptyEnter(this);
	}

	private onMergeWithPrevious({ cutFragment }: ITextboxEvents['mergeWithPrevious']) {
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

	private onFocusMove({ direction }: ITextboxEvents['focusMove']) {
		let currentParent = this.parent;
		if (!currentParent) {
			return;
		}
		const isPrevious = ['up', 'left'].includes(direction);
		let thisIndex = currentParent.getBlockIndex(this);
		let newIndex = isPrevious ? thisIndex - 1 : thisIndex + 1;
		while (currentParent?.parent && (newIndex === -1 || newIndex >= currentParent.length)) {
			thisIndex = currentParent.parent.getBlockIndex(currentParent);
			newIndex = isPrevious ? thisIndex - 1 : thisIndex + 1;
			currentParent = currentParent.parent;
		}
		const newBlock = currentParent?.getBlock(newIndex);
		if (!newBlock) {
			return;
		}
		const elementToFocus = (() => {
			if (newBlock instanceof CollectionBlock) {
				return isPrevious ? newBlock.lastEditableElement : newBlock.firstEditableElement;
			}
			return newBlock.defaultEditableElement;
		})();
		if (!elementToFocus) {
			return;
		}
		switch (direction) {
			case 'left':
				setCaretToEnd(elementToFocus);
				break;
			case 'up':
				setCaretToEnd(elementToFocus, getCaretRect(this.defaultEditableElement)?.left);
				break;
			case 'down':
				setCaretToStart(elementToFocus, getCaretRect(this.defaultEditableElement)?.left);
				break;
			default:
				setCaretToStart(elementToFocus);
				break;
		}
	}
}
