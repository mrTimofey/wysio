import CollectionBlock from './block-types/collection';
import type Block from './block-types/abstract-base';

type BlocksDefinition = { [name: string]: { Ctor: { new (): Block<unknown> }; args?: unknown } };

interface IEditorConfig {
	defaultBlockType?: string;
	rootClass?: string[];
}

export default class Editor extends CollectionBlock<IEditorConfig> {
	#types: BlocksDefinition = {};
	#blockTypeSelector = document.createElement('div');
	#childrenRoot = document.createElement('div');
	#defaultBlockType = '';
	#currentBlockIndex = -1;

	protected override get childrenRoot(): HTMLElement {
		return this.#childrenRoot;
	}

	constructor(config?: IEditorConfig) {
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
		if (config) {
			this.configure(config);
		}
	}

	override configure(config: IEditorConfig): void {
		super.configure(config);
		this.#defaultBlockType = config?.defaultBlockType || '';
		if (config.rootClass) {
			this.element.classList.add(...config.rootClass);
		}
	}

	/**
	 * Register a block type to make it accessible for a user to select from.
	 * @param name name used as a key for a block data
	 * @param ctor block class
	 * @param args block configuration
	 */
	registerBlockType<P, T extends Block<P>>(name: string, Ctor: { new (): T }, args?: P): void {
		this.#types[name] = { Ctor, args };
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
	override appendBlock(block: Block<unknown> | string) {
		super.appendBlock(typeof block === 'string' ? this.createBlockByType(block) : block);
	}

	/**
	 * Create a block based on the given typeName.
	 * @param typeName block type name
	 */
	createBlockByType(typeName: string): Block<unknown> {
		if (!this.#types[typeName]) {
			throw new Error(`Editor: type "${typeName}" is not registered`);
		}
		const { Ctor, args } = this.#types[typeName];
		const block = new Ctor();
		block.configure(args);
		return block;
	}

	insertBlockAfterCurrent(block: Block<unknown>): void {
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
		this.appendBlock(this.createBlockByType(this.#defaultBlockType));
	}

	override beforeBlockInsert(block: Block<unknown>): void {
		super.beforeBlockInsert(block);
		block.element.addEventListener('mouseenter', this.onChildMouseEnter);
	}

	override onItemEmptyEnter(block: Block<unknown>): void {
		super.onItemEmptyEnter(block);
		if (this.#types[this.#defaultBlockType] && block instanceof this.#types[this.#defaultBlockType].Ctor) {
			return;
		}
		const newBlock = this.createBlockByType(this.#defaultBlockType);
		this.insertBlock(this.getBlockIndex(block), newBlock);
		newBlock.defaultEditableElement?.focus();
	}

	override onItemSplit(block: Block<unknown>, cutFragment: () => DocumentFragment): void {
		super.onItemSplit(block, cutFragment);
		const newBlock = this.createBlockByType(this.#defaultBlockType);
		this.insertBlock(this.getBlockIndex(block), newBlock);
		if (newBlock.defaultEditableElement) {
			newBlock.defaultEditableElement.append(cutFragment());
			newBlock.defaultEditableElement.normalize();
			newBlock.defaultEditableElement?.focus();
		}
	}

	override convertTo(block: Block<unknown>, type: string): void {
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
