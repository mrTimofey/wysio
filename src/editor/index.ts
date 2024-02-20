import CollectionBlock from './block-types/collection';
import type Block from './block-types/abstract-base';

export default class Editor extends CollectionBlock {
	#typeFactoryFns: { [name: string]: (name: string) => Block } = {};
	#blockTypeSelector = document.createElement('div');
	#childrenRoot = document.createElement('div');
	#currentBlockIndex = -1;

	defaultBlockType = '';

	protected override get childrenRoot(): HTMLElement {
		return this.#childrenRoot;
	}

	constructor() {
		super();
		this.#blockTypeSelector.classList.add('editor-block-type-selector');
		this.#blockTypeSelector.style.position = 'absolute';
		this.#blockTypeSelector.style.display = 'none';
		this.#childrenRoot.classList.add('editor-blocks-root');
		this.element.style.position = 'relative';
		this.element.append(this.#blockTypeSelector);
		this.element.append(this.#childrenRoot);
		this.onChildMouseEnter = this.onChildMouseEnter.bind(this);
		this.onMouseLeave = this.onMouseLeave.bind(this);
		this.element.addEventListener('mouseleave', this.onMouseLeave);
	}

	/**
	 * Register a block type to make it accessible for a user to select from.
	 * @param name name used as a key for a block data
	 * @param factoryFn block factory function
	 */
	registerBlockType<N extends string, T extends Block>(name: N, factoryFn: (name: N) => T) {
		this.#typeFactoryFns[name] = factoryFn as (name: string) => T;
		const btn = document.createElement('button');
		btn.classList.add('editor-block-type-selector__item');
		btn.type = 'button';
		btn.innerHTML = name;
		btn.addEventListener('click', (e) => {
			e.preventDefault();
			this.insertBlockAfterCurrent(this.createBlockByType(name));
		});
		this.#blockTypeSelector.append(btn);
	}

	/**
	 * Add a block to the end of this collection. If block is a string - create a block by type.
	 * @param block block instance or block type name
	 */
	override appendBlock<T extends Block>(block: T | string): T {
		const blockObj = typeof block === 'string' ? this.createBlockByType(block) : block;
		super.appendBlock(blockObj);
		return blockObj as T;
	}

	/**
	 * Create a block based on the given typeName.
	 * @param typeName block type name
	 */
	createBlockByType(typeName: string): Block {
		if (!this.#typeFactoryFns[typeName]) {
			throw new Error(`Editor: type "${typeName}" is not registered`);
		}
		const block = this.#typeFactoryFns[typeName](typeName);
		block.typeName = typeName;
		return block;
	}

	insertBlockAfterCurrent(block: Block): void {
		this.insertBlock(this.#currentBlockIndex, block);
	}

	onChildMouseEnter(event: MouseEvent) {
		const block = this.getBlockByElement(event.target as HTMLElement);
		if (!block) {
			return;
		}
		this.#blockTypeSelector.style.removeProperty('display');
		this.#blockTypeSelector.style.top = `${block.element.offsetTop}px`;
		this.#blockTypeSelector.style.right = '100%';
		this.#currentBlockIndex = this.getBlockIndex(block);
	}

	onMouseLeave() {
		this.#blockTypeSelector.style.removeProperty('top');
		this.#blockTypeSelector.style.display = 'none';
	}

	override onEmpty(): void {
		super.onEmpty();
		// TODO: let user create element for empty editor instead
		this.appendBlock(this.createBlockByType(this.defaultBlockType));
	}

	override beforeBlockInsert(block: Block): void {
		super.beforeBlockInsert(block);
		block.element.addEventListener('mouseenter', this.onChildMouseEnter);
	}

	override onItemEmptyEnter(block: Block): void {
		super.onItemEmptyEnter(block);
		if (block.typeName === this.defaultBlockType) {
			return;
		}
		const newBlock = this.createBlockByType(this.defaultBlockType);
		this.insertBlock(this.getBlockIndex(block), newBlock);
		newBlock.defaultEditableElement?.focus();
	}

	override onItemSplit(block: Block, cutFragment: () => DocumentFragment): void {
		super.onItemSplit(block, cutFragment);
		const newBlock = this.createBlockByType(this.defaultBlockType);
		this.insertBlock(this.getBlockIndex(block), newBlock);
		if (newBlock.defaultEditableElement) {
			newBlock.defaultEditableElement.append(cutFragment());
			newBlock.defaultEditableElement.normalize();
			newBlock.defaultEditableElement?.focus();
		}
	}

	override convertTo(block: Block, type: string): void {
		const contents = block.defaultEditableElement?.children;
		if (!contents) {
			return;
		}
		const replacement = this.createBlockByType(type);
		this.insertBlock(this.getBlockIndex(block), replacement);
		this.removeBlock(block);
		if (!replacement.defaultEditableElement) {
			return;
		}
		replacement.defaultEditableElement.append(...Array.from(contents));
		replacement.defaultEditableElement.focus();
	}
}
