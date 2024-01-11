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
	#listElement: HTMLUListElement | HTMLOListElement | null = null;
	#config?: IConfig;

	protected override get childrenRoot(): HTMLElement {
		if (!this.#listElement) {
			this.#listElement = document.createElement(this.ordered ? 'ol' : 'ul');
			this.element.append(this.#listElement);
		}
		return this.#listElement;
	}

	get ordered() {
		return this.#config?.ordered ?? false;
	}

	get itemConfig(): ITextConfig {
		return {
			inlineToolbox: this.#config?.inlineToolbox,
			class: this.#config?.itemClass,
		};
	}

	get level() {
		let listParentCount = 0;
		const parent = this.parent;
		while (parent?.parent && parent.parent instanceof ListBlock) {
			listParentCount += 1;
		}
		return listParentCount;
	}

	createListItem(): ListItemBlock {
		const li = new ListItemBlock({
			onGoDeeper: (item) => {
				if (this.level >= (this.#config?.maxLevel ?? Infinity)) {
					return;
				}
				const previousListItemIdx = this.getBlockIndex(item);
				const previousListItem = (() => {
					if (previousListItemIdx > 0) {
						return this.getBlock(previousListItemIdx - 1)!;
					}
					const emptyItem = this.createListItem();
					this.appendBlock(emptyItem);
					return emptyItem;
				})();
				const sub = this.createSubList();
				previousListItem.element.append(sub.element);
				sub.appendBlock(item);
				// remove initial empty list item from the sub list
				sub.removeBlock(0);
				sub.defaultEditableElement?.focus();
			},
			onGoUpper: (item) => {
				if (!(this.parent instanceof ListBlock)) {
					return;
				}
				item.parent?.removeBlock(item);
				this.appendBlock(item);
			},
		});
		li.configure(this.itemConfig);
		return li;
	}

	appendListItem(): this {
		this.appendBlock(this.createListItem());
		return this;
	}

	createSubList(): ListBlock {
		const sub = new ListBlock();
		if (this.#config) {
			sub.configure(this.#config);
		}
		sub.parent = this;
		return sub;
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
		this.element.remove();
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
