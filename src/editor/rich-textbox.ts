import { isCaretOnFirstLine, isCaretOnLastLine, isCaretOnStart, isCaretOnEnd } from '../caret-utils';

export interface ITextboxEvents {
	// user pressed enter somewhere within editable block content cutting it into 2 slices
	split: { cutFragment: () => DocumentFragment };
	// user pressed enter on empty editable block
	emptyEnter: undefined;
	// user pressed backspace when cursor is at the beginning of an editable block
	mergeWithPrevious: { cutFragment: () => DocumentFragment };
	// cursor position or selection range is changed
	selectionChange: { range: Range | null };
	// user pressed arrow keys with an intention to move to a sibling block
	focusMove: { direction: 'up' | 'down' | 'left' | 'right' };
}

export default class RichTextbox {
	#listeners: {
		[event: string]: Set<(arg: unknown) => unknown>;
	} = {};

	#selectionTrackingTimeout: ReturnType<Window['setTimeout']> | undefined;
	#selectionRectangle: DOMRect | null = null;

	constructor(private el: HTMLElement) {
		el.contentEditable = 'true';
		el.role = 'textbox';
		el.ariaMultiLine = 'true';
		el.addEventListener('keypress', (event) => this.onKeyPress(event));
		el.addEventListener('keydown', (event) => this.onKeyDown(event));
		el.addEventListener('focus', () => this.startSelectionTracking());
		el.addEventListener('blur', () => {
			this.emit('selectionChange', { range: null });
			this.stopSelectionTracking();
		});
	}

	public get element() {
		return this.el;
	}

	public get data() {
		return {
			content: this.el.innerHTML,
		};
	}

	public set data(data: { content: string }) {
		this.el.innerHTML = data.content;
	}

	public on<T extends keyof ITextboxEvents = keyof ITextboxEvents>(event: T, listener: (arg: ITextboxEvents[T]) => unknown) {
		if (!this.#listeners[event]) {
			this.#listeners[event] = new Set();
		}
		this.#listeners[event].add(listener as (arg: unknown) => unknown);
	}

	public off<T extends keyof ITextboxEvents = keyof ITextboxEvents>(event: T, listener: (arg: ITextboxEvents[T]) => unknown) {
		if (!this.#listeners[event]) {
			return;
		}
		this.#listeners[event].delete(listener as (arg: unknown) => unknown);
	}

	public emit<T extends keyof ITextboxEvents = keyof ITextboxEvents>(event: T, arg: ITextboxEvents[T]) {
		this.#listeners[event]?.forEach((fn) => fn(arg));
	}

	protected insertLineBreak() {
		document.execCommand('insertLineBreak');
	}

	protected cutFragmentAfterCursor(): DocumentFragment {
		const range = window.getSelection()?.getRangeAt(0);
		if (!range) {
			return document.createDocumentFragment();
		}
		range.deleteContents();
		const cutRange = range.cloneRange();
		cutRange.selectNodeContents(this.el);
		cutRange.setStart(range.endContainer, range.endOffset);
		return cutRange.extractContents();
	}

	protected onKeyPress(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			if (event.shiftKey || event.ctrlKey) {
				this.insertLineBreak();
			} else if (this.el.textContent?.trim()) {
				this.emit('split', { cutFragment: () => this.cutFragmentAfterCursor() });
			} else {
				this.emit('emptyEnter', undefined);
			}
		}
	}

	protected onKeyDown(event: KeyboardEvent) {
		// eslint-disable-next-line default-case
		switch (event.key) {
			case 'Backspace':
				this.onBackspace(event);
				break;
			case 'ArrowUp':
				if (isCaretOnFirstLine(this.el)) {
					event.preventDefault();
					this.emit('focusMove', { direction: 'up' });
				}
				break;
			case 'ArrowDown':
				if (isCaretOnLastLine(this.el)) {
					event.preventDefault();
					this.emit('focusMove', { direction: 'down' });
				}
				break;
			case 'ArrowLeft':
				if (isCaretOnStart(this.el)) {
					event.preventDefault();
					this.emit('focusMove', { direction: 'left' });
				}
				break;
			case 'ArrowRight':
				if (isCaretOnEnd(this.el)) {
					event.preventDefault();
					this.emit('focusMove', { direction: 'right' });
				}
				break;
		}
	}

	protected onBackspace(event: KeyboardEvent) {
		const range = window.getSelection()?.getRangeAt(0);
		if (!range || !range.collapsed || range.startOffset > 0) {
			return;
		}
		// detect if the range starts on zero position within a contenteditable element
		let current: Node | null = range.startContainer;
		while (current && current !== this.el) {
			if (current.previousSibling) {
				return;
			}
			current = current.parentNode;
		}
		event.preventDefault();
		this.emit('mergeWithPrevious', {
			cutFragment: () => {
				const fragment = document.createDocumentFragment();
				fragment.append(...Array.from(this.el.childNodes));
				return fragment;
			},
		});
	}

	protected checkSelection() {
		const range = window.getSelection()?.getRangeAt(0) || null;
		if (!range) {
			if (this.#selectionRectangle) {
				this.#selectionRectangle = null;
				this.emit('selectionChange', { range });
			}
			return;
		}
		const rect = range.getBoundingClientRect();
		if (
			this.#selectionRectangle &&
			rect.x === this.#selectionRectangle.x &&
			rect.y === this.#selectionRectangle.y &&
			rect.width === this.#selectionRectangle.width &&
			rect.height === this.#selectionRectangle.height
		) {
			return;
		}
		this.#selectionRectangle = rect;
		this.emit('selectionChange', { range });
	}

	protected startSelectionTracking() {
		this.#selectionTrackingTimeout = window.setTimeout(() => {
			if (document.activeElement === this.el || document.activeElement?.contains(this.el)) {
				this.checkSelection();
				this.startSelectionTracking();
			}
		}, 100);
	}

	protected stopSelectionTracking() {
		window.clearTimeout(this.#selectionTrackingTimeout);
	}

	public destroy() {
		this.stopSelectionTracking();
		this.el.remove();
	}
}
