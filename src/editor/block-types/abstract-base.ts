import type CollectionBlock from './collection';

/* eslint-disable @typescript-eslint/no-unused-vars */
export default abstract class Block<T = undefined> {
	#root: HTMLElement;
	#parent: CollectionBlock | null = null;

	constructor(tag = 'div') {
		this.#root = document.createElement(tag);
	}

	/**
	 * Root element of this block. Insert it anywhere to make this block interactive.
	 */
	get element() {
		return this.#root;
	}

	/**
	 * Get parent collection block.
	 */
	set parent(parent: CollectionBlock<unknown> | null) {
		this.#parent = parent;
	}

	/**
	 * Set parent collection block.
	 */
	get parent() {
		return this.#parent;
	}

	/**
	 * Get the element able to be edited by other blocks.
	 * Can be used to merge this block with another one.
	 */
	get defaultEditableElement(): HTMLElement | null {
		// for overriding
		return null;
	}

	/**
	 * Called just after block creation and before inserting it into the DOM.
	 */
	configure(config: T) {
		// for overriding, no default implementation
	}

	/**
	 * Called after this block is removed from blocks collection.
	 */
	destroy() {
		// for overriding, no default implementation
	}
}
