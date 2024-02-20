import type InlineToolbox from '../inline-toolbox';
import type Block from './abstract-base';
import CollectionBlock from './collection';
import ListItemBlock from './list-item';
import type { IConfig as ITextConfig } from './text';

export interface IConfig {
	inlineToolbox?: InlineToolbox;
	class?: string[];
	itemClass?: string[];
	ordered?: boolean;
	maxLevel?: number;
}

export default class ListBlock extends CollectionBlock<IConfig> {
	inlineToolbox: InlineToolbox | undefined = undefined;
	#listElement: HTMLUListElement | HTMLOListElement | null = null;
	#config?: IConfig;

	constructor(ordered = false, maxLevel: number = 0) {
		super();
		this.configure({
			ordered,
			maxLevel,
		});
	}

	protected override get childrenRoot(): HTMLElement {
		if (!this.#listElement) {
			this.#listElement = document.createElement(this.ordered ? 'ol' : 'ul');
			this.element.append(this.#listElement);
		}
		return this.#listElement;
	}

	// TODO different types for flat list with levels
	get ordered() {
		return this.#config?.ordered ?? false;
	}

	get itemConfig(): ITextConfig {
		return {
			inlineToolbox: this.#config?.inlineToolbox,
			class: this.#config?.itemClass,
		};
	}

	createListItem(): ListItemBlock {
		const li = new ListItemBlock({
			onGoDeeper: (item) => {
				const previousItem = this.getBlock(this.getBlockIndex(item) - 1);
				if (!(previousItem instanceof ListItemBlock) || item.depth > previousItem.depth) {
					return;
				}
				item.depth += 1;
			},
			onGoUpper: (item) => {
				item.depth -= 1;
			},
		});
		li.configure(this.itemConfig);
		return li;
	}

	override configure(config: IConfig): void {
		super.configure(config);
		this.#config = config;
		if (config.class?.length) {
			this.element.classList.add(...config.class);
		}
		this.appendBlock(this.createListItem());
	}

	override onEmpty(): void {
		super.onEmpty();
		if (!this.parent) {
			return;
		}
		this.parent.removeBlock(this);
		this.destroy();
	}

	override onItemEmptyEnter(block: Block<unknown>): void {
		super.onItemEmptyEnter(block);
		if (!this.parent || this.childrenRoot.lastElementChild !== block.element) {
			return;
		}
		if (this.parent instanceof ListBlock) {
			const li = this.createListItem();
			this.parent.insertBlock(this.parent.getBlockIndex(this), li);
			li.defaultEditableElement.focus();
		} else {
			this.parent.onItemEmptyEnter(this);
		}
		this.removeBlock(block);
	}

	override onItemSplit(block: Block<unknown>, cutFragment: () => DocumentFragment): void {
		super.onItemSplit(block, cutFragment);
		const li = this.createListItem();
		li.defaultEditableElement.append(cutFragment());
		li.defaultEditableElement.normalize();
		this.insertBlock(this.getBlockIndex(block), li);
		li.defaultEditableElement.focus();
	}
}
