import Block from './abstract-base';
import RichTextbox, { type ITextboxEvents } from '../rich-textbox';
import CollectionBlock from './collection';
import { getCaretRect, setCaretToEnd, setCaretToStart } from '../../caret-utils';

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
	#textbox: RichTextbox;

	constructor(tag = 'div') {
		super(tag);
		this.#textbox = new RichTextbox(document.createElement('div'));
		this.element.append(this.#textbox.element);
		this.onSplit = this.onSplit.bind(this);
		this.onEmptyEnter = this.onEmptyEnter.bind(this);
		this.onMergeWithPrevious = this.onMergeWithPrevious.bind(this);
		this.onFocusMove = this.onFocusMove.bind(this);
		this.#textbox.on('split', this.onSplit);
		this.#textbox.on('emptyEnter', this.onEmptyEnter);
		this.#textbox.on('mergeWithPrevious', this.onMergeWithPrevious);
		this.#textbox.on('focusMove', this.onFocusMove);
	}

	override get defaultEditableElement(): HTMLElement {
		return this.#textbox.element;
	}

	get textbox() {
		return this.#textbox;
	}

	protected onSplit({ cutFragment }: ITextboxEvents['split']) {
		this.parent?.onItemSplit(this, cutFragment);
	}

	protected onEmptyEnter() {
		this.parent?.onItemEmptyEnter(this);
	}

	protected onMergeWithPrevious({ cutFragment }: ITextboxEvents['mergeWithPrevious']) {
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
		}
		else if (prevBlock.defaultEditableElement.lastChild) {
			// end of the previous element's editable content
			range.setStartAfter(prevBlock.defaultEditableElement.lastChild);
			range.setEndAfter(prevBlock.defaultEditableElement.lastChild);
		}
		else {
			// start of the previous element's editable content
			range.setStart(prevBlock.defaultEditableElement, 0);
			range.setEnd(prevBlock.defaultEditableElement, 0);
		}
		selection.removeAllRanges();
		selection.addRange(range);
		prevBlock.defaultEditableElement.normalize();
		this.parent.removeBlock(this);
	}

	protected onFocusMove({ direction }: ITextboxEvents['focusMove']) {
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
