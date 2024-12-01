import type RichTextbox from './rich-textbox';
import type InlineToolboxItem from './toolbox-items/abstract-base';
import './toolbox.styl';

export default class InlineToolbox {
	#el: HTMLElement;
	#fakeRangeEl = document.createElement('div');
	#currentRange: Range | null = null;
	#currentTextbox: RichTextbox | null = null;

	get element() {
		return this.#el;
	}

	get range() {
		return this.#currentRange;
	}

	get textbox() {
		return this.#currentTextbox;
	}

	constructor(
		private items: InlineToolboxItem[] = [],
		el?: HTMLElement,
	) {
		if (el) {
			this.#el = el;
		}
		else {
			const newEl = document.createElement('div');
			document.body.append(newEl);
			this.#el = newEl;
		}
		const innerDiv = document.createElement('div');
		innerDiv.classList.add('editor-inline-toolbox__box');
		const itemGroup = document.createElement('div');
		itemGroup.classList.add('editor-inline-toolbox__items');
		this.#el.style.position = 'absolute';
		this.#el.classList.add('editor-inline-toolbox');
		this.#el.append(innerDiv);
		innerDiv.append(itemGroup);
		this.#fakeRangeEl.classList.add('editor-fake-range');
		this.hide();
		for (const item of items) {
			itemGroup.append(item.element);
			item.setToolbox(this);
		}
	}

	/**
	 * Show fake selection (and keep a real one) when user focuses an element within the toolbox.
	 */
	#showFakeRange(): void {
		if (!this.range) {
			return;
		}
		for (const rect of Array.from(this.range.getClientRects())) {
			const rectEl = document.createElement('div');
			rectEl.style.top = `${rect.top}px`;
			rectEl.style.left = `${rect.left}px`;
			rectEl.style.width = `${rect.width}px`;
			rectEl.style.height = `${rect.height}px`;
			this.#fakeRangeEl.append(rectEl);
		}
		document.body.append(this.#fakeRangeEl);
	}

	#hideFakeRange() {
		this.#fakeRangeEl.innerHTML = '';
		this.#fakeRangeEl.remove();
	}

	hide() {
		this.#el.style.display = 'none';
		this.#hideFakeRange();
	}

	show() {
		this.#el.style.removeProperty('display');
	}

	restoreRange() {
		this.#hideFakeRange();
		if (!this.#currentRange) {
			return;
		}
		const selection = window.getSelection();
		if (!selection) {
			return;
		}
		selection.removeAllRanges();
		selection.addRange(this.#currentRange);
	}

	#hideOnClickOutside() {
		const onClick = (e: MouseEvent) => {
			const target = e.target as Node;
			if (target && (this.#el === target || this.#el.contains(target))) {
				return;
			}
			this.hide();
			window.removeEventListener('mousedown', onClick);
		};
		window.addEventListener('mousedown', onClick);
	}

	attachToRange(range: Range | null, textbox: RichTextbox) {
		if (!range || range.collapsed) {
			// wait for a focus change
			setTimeout(() => {
				// if user interacts with the toolbox
				if (this.#el === document.activeElement || this.#el.contains(document.activeElement)) {
					this.#hideOnClickOutside();
					// a range within a contenteditable element is lost so draw a fake range so user can still see it
					this.#showFakeRange();
					return;
				}
				this.hide();
				this.#currentRange = null;
				this.#currentTextbox = null;
			});
			return;
		}
		this.#currentRange = range;
		this.#currentTextbox = textbox;
		const rect = range.getBoundingClientRect();
		this.#el.style.top = `${rect.bottom}px`;
		this.#el.style.left = `${rect.left}px`;
		this.#el.style.width = `${rect.width}px`;
		for (const item of this.items) {
			item.rangeChanged();
		}
		this.show();
	}
}
