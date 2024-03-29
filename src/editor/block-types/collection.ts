/* eslint-disable @typescript-eslint/no-unused-vars */
import Block from './abstract-base';

export default abstract class CollectionBlock extends Block {
	#blocks: Map<HTMLElement, Block>;

	constructor() {
		super();
		this.#blocks = new Map();
	}

	[Symbol.iterator](): IterableIterator<Block> {
		return this.#blocks.values();
	}

	/**
	 * HTMLCollection representing this collection block elements.
	 */
	protected get childrenRoot(): HTMLElement {
		return this.element;
	}

	/**
	 * Number of blocks in this collection.
	 */
	get length() {
		return this.#blocks.size;
	}

	/**
	 * First element's defaultEditableElement.
	 */
	get firstEditableElement(): HTMLElement | null {
		const block = this.#blocks.get(this.childrenRoot.firstElementChild as HTMLElement);
		return block?.defaultEditableElement || null;
	}

	/**
	 * Last element's defaultEditableElement.
	 */
	get lastEditableElement(): HTMLElement | null {
		const block = this.#blocks.get(this.childrenRoot.lastElementChild as HTMLElement);
		return block?.defaultEditableElement || null;
	}

	/**
	 * Last element's defaultEditableElement.
	 */
	override get defaultEditableElement(): HTMLElement | null {
		return this.lastEditableElement;
	}

	/**
	 * Add a block to the end of this collection.
	 * @param block block instance
	 */
	appendBlock(block: Block) {
		this.beforeBlockInsert(block);
		this.childrenRoot.append(block.element);
	}

	/**
	 * Insert a block after afterIndex.
	 * @param afterIndex index to insert after
	 * @param block block instance
	 */
	insertBlock(afterIndex: number, block: Block): void {
		this.beforeBlockInsert(block);
		this.childrenRoot.children[afterIndex].after(block.element);
	}

	/**
	 * Remove and destroy block by its index or by block itself.
	 * If collection becomes empty - delete the collection itself.
	 * @param indexOrBlock block index or instance
	 */
	removeBlock(indexOrBlock: number | Block): void {
		const block = typeof indexOrBlock === 'number' ? this.#blocks.get(this.childrenRoot.children[indexOrBlock] as HTMLElement) : indexOrBlock;
		if (!block) {
			return;
		}
		block.element.remove();
		this.#blocks.delete(block.element);
		if (this.#blocks.size === 0) {
			this.onEmpty();
		}
		block.destroy();
	}

	/**
	 * Move a block to another position.
	 * @param from moving block index
	 * @param afterIndex index to insert after
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
	 * @param index block index
	 */
	getBlock(index: number): Block | null {
		return this.#blocks.get(this.childrenRoot.children[index] as HTMLElement) || null;
	}

	/**
	 * Get block index.
	 * @param block block instance
	 */
	getBlockIndex(block: Block): number {
		for (let i = 0; i < this.childrenRoot.children.length; i += 1) {
			if (this.childrenRoot.children[i] === block.element) {
				return i;
			}
		}
		return -1;
	}

	/**
	 * Returns the block associated with the given HTML element.
	 * @param el HTML element to find the block for
	 */
	getBlockByElement(el: HTMLElement): Block | null {
		return this.#blocks.get(el) || null;
	}

	onEmpty(): void {
		// for overriding
	}

	beforeBlockInsert(block: Block): void {
		this.#blocks.set(block.element, block);
		block.parent = this;
	}

	onItemEmptyEnter(block: Block): void {
		// for overriding
	}

	onItemSplit(block: Block, cutFragment: () => DocumentFragment): void {
		// for overriding
	}

	convertTo(block: Block, type: string): void {
		// for overriding
	}
}
