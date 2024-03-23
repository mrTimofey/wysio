import type CollectionBlock from './collection';

export default abstract class Block {
	#root: HTMLElement;
	#parent: CollectionBlock | null = null;
	#augmentationDestroyers: (() => void)[] = [];
	typeName?: string;

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
	set parent(parent: CollectionBlock | null) {
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
	 * Previous block in the parent collection.
	 */
	get prevBlock(): Block | null {
		if (!this.parent) {
			return null;
		}
		const idx = this.parent.getBlockIndex(this);
		return idx > 1 ? this.parent.getBlock(idx - 1) : null;
	}

	/**
	 * Next block in the parent collection.
	 */
	get nextBlock(): Block | null {
		if (!this.parent) {
			return null;
		}
		const idx = this.parent.getBlockIndex(this);
		return this.parent.getBlock(idx + 1);
	}

	/**
	 * Should this block be chained with similar blocks.
	 * Example 1: list items must stick together, so they are chainable.
	 * Example 2: headers are unique items and there is no need to create a new header just after another one, so headers are not chainable.
	 */
	get chainable() {
		return false;
	}

	/**
	 * Called after this block is removed from editor.
	 */
	destroy() {
		this.removeAugmentations();
	}

	augment(...augmentations: ((block: this) => () => void)[]): this {
		for (const augment of augmentations) {
			this.#augmentationDestroyers.push(augment(this));
		}
		return this;
	}

	removeAugmentations(): this {
		while (this.#augmentationDestroyers.length) {
			this.#augmentationDestroyers.pop()?.();
		}
		return this;
	}
}
