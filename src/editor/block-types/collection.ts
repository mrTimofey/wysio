/* eslint-disable @typescript-eslint/no-unused-vars */
import Block from './abstract-base';

export default class CollectionBlock<T = undefined> extends Block<T> {
	#blocks: Map<HTMLElement, Block>;

	constructor() {
		super();
		this.#blocks = new Map();
	}

	/**
	 * Return HTMLCollection representing this collection block elements.
	 */
	protected get childrenRoot(): HTMLElement {
		return this.element;
	}

	/**
	 * Returns last element's defaultEditableElement.
	 */
	get defaultEditableElement(): HTMLElement | null {
		const block = this.#blocks.get(this.childrenRoot.lastElementChild as HTMLElement);
		return block?.defaultEditableElement || null;
	}

	/**
	 * Add a block to the end of this collection.
	 */
	appendBlock(block: Block<unknown>) {
		this.beforeBlockInsert(block);
		this.#blocks.set(block.element, block);
		this.childrenRoot.append(block.element);
		block.parent = this;
	}

	/**
	 * Insert a block after afterIndex.
	 */
	insertBlock(afterIndex: number, block: Block<unknown>): void {
		this.beforeBlockInsert(block);
		this.#blocks.set(block.element, block);
		this.childrenRoot.children[afterIndex].after(block.element);
		block.parent = this;
	}

	/**
	 * Remove and destroy block by its index or by block itself.
	 * If collection becomes empty - delete the collection itself.
	 */
	removeBlock(indexOrBlock: number | Block<unknown>): void {
		const block = typeof indexOrBlock === 'number' ? this.#blocks.get(this.childrenRoot.children[indexOrBlock] as HTMLElement) : indexOrBlock;
		if (!block) {
			return;
		}
		block.element.remove();
		block.destroy();
		this.#blocks.delete(block.element);
		if (this.#blocks.size === 0) {
			this.onEmpty();
		}
	}

	/**
	 * Move a block to another position.
	 */
	moveBlock(from: number, afterIndex: number): void {
		if (from === afterIndex) {
			return;
		}
		const block = this.#blocks.get(this.childrenRoot.children[from] as HTMLElement);
		if (!block) {
			return;
		}
		this.childrenRoot.children[afterIndex].after(block.element);
	}

	/**
	 * Get block by index.
	 */
	getBlock(index: number): Block<unknown> | null {
		return this.#blocks.get(this.childrenRoot.children[index] as HTMLElement) || null;
	}

	/**
	 * Get block index.
	 */
	getBlockIndex(block: Block<unknown>): number {
		for (let i = 0; i < this.childrenRoot.children.length; i += 1) {
			if (this.childrenRoot.children[i] === block.element) {
				return i;
			}
		}
		return -1;
	}

	getBlockByElement(el: HTMLElement): Block<unknown> | null {
		return this.#blocks.get(el) || null;
	}

	onEmpty(): void {
		// for overriding
	}

	beforeBlockInsert(block: Block<unknown>): void {
		// for overriding
	}

	onItemEmptyEnter(block: Block<unknown>): void {
		// for overriding
	}

	onItemSplit(block: Block<unknown>, cutFragment: () => DocumentFragment): void {
		// for overriding
	}
}
