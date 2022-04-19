import CollectionBlock from './block-types/collection';
import type Block from './block-types/abstract-base';

type BlocksDefinition = { [name: string]: { Ctor: { new (): Block<unknown> }; args?: unknown } };

interface IEditorConfig {
	defaultType?: string;
	class?: string[];
}

export default class Editor extends CollectionBlock<IEditorConfig> {
	#types: BlocksDefinition = {};
	#typeSelector = document.createElement('div');
	#childrenRoot = document.createElement('div');
	#defaultType = '';
	#currentBlockIndex = -1;

	protected get childrenRoot(): HTMLElement {
		return this.#childrenRoot;
	}

	constructor(config?: IEditorConfig) {
		super();
		this.#typeSelector.classList.add('editor-block-type-selector');
		this.#typeSelector.style.position = 'absolute';
		this.#typeSelector.style.display = 'none';
		this.#childrenRoot.classList.add('editor-blocks-root');
		this.element.style.position = 'relative';
		this.element.append(this.#typeSelector);
		this.element.append(this.#childrenRoot);
		this.onChildMouseEnter = this.onChildMouseEnter.bind(this);
		this.onMouseLeave = this.onMouseLeave.bind(this);
		this.element.addEventListener('mouseleave', this.onMouseLeave);
		if (config) {
			this.configure(config);
		}
	}

	configure(config: IEditorConfig): void {
		this.#defaultType = config?.defaultType || '';
		if (config.class) {
			this.element.classList.add(...config.class);
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
		this.#typeSelector.append(btn);
	}

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

	onEmpty(): void {
		this.appendBlock(this.createBlockByType(this.#defaultType));
	}

	onChildMouseEnter(event: MouseEvent) {
		const block = this.getBlockByElement(event.target as HTMLElement);
		if (!block) {
			return;
		}
		this.#typeSelector.style.removeProperty('display');
		this.#typeSelector.style.top = `${block.element.offsetTop}px`;
		this.#typeSelector.style.right = '100%';
		this.#currentBlockIndex = this.getBlockIndex(block);
	}

	onMouseLeave() {
		this.#typeSelector.style.removeProperty('top');
		this.#typeSelector.style.display = 'none';
	}

	beforeBlockInsert(block: Block<unknown>): void {
		block.element.addEventListener('mouseenter', this.onChildMouseEnter);
	}

	onItemEmptyEnter(block: Block<unknown>): void {
		if (this.#types[this.#defaultType] && block instanceof this.#types[this.#defaultType].Ctor) {
			return;
		}
		const newBlock = this.createBlockByType(this.#defaultType);
		this.insertBlock(this.getBlockIndex(block), newBlock);
		newBlock.defaultEditableElement?.focus();
	}

	onItemSplit(block: Block<unknown>, cutFragment: () => DocumentFragment): void {
		const newBlock = this.createBlockByType(this.#defaultType);
		this.insertBlock(this.getBlockIndex(block), newBlock);
		if (newBlock.defaultEditableElement) {
			newBlock.defaultEditableElement.append(cutFragment());
			newBlock.defaultEditableElement.normalize();
			newBlock.defaultEditableElement?.focus();
		}
	}

	convertTo(block: Block<unknown>, type: string): void {
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
