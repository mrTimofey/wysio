import type CollectionBlock from './collection';

export default abstract class Block {
	#root: HTMLElement;
	#parent: CollectionBlock | null = null;
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
	 * Called after this block is removed from editor.
	 */
	destroy() {
		this.element.remove();
	}

	augment(...augmentations: ((block: this) => () => void)[]): this {
		for (const augment of augmentations) {
			augment(this);
		}
		return this;
	}
}
