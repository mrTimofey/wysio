import type InlineToolbox from '../inline-toolbox';
import type Block from './abstract-base';
import CollectionBlock from './collection';
import ListItemBlock from './list-item';

export default class ListBlock extends CollectionBlock {
	inlineToolbox: InlineToolbox | undefined = undefined;
	#listElement: HTMLUListElement | HTMLOListElement | null = null;

	constructor(
		// TODO different types for flat list with levels
		public ordered = false,
		public maxLevel: number = 0,
	) {
		super();
		this.appendBlock(this.createListItem());
	}

	protected override get childrenRoot(): HTMLElement {
		if (!this.#listElement) {
			this.#listElement = document.createElement(this.ordered ? 'ol' : 'ul');
			this.element.append(this.#listElement);
		}
		return this.#listElement;
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
		li.inlineToolbox = this.inlineToolbox;
		return li;
	}

	override onEmpty(): void {
		super.onEmpty();
		if (!this.parent) {
			return;
		}
		this.parent.removeBlock(this);
		this.destroy();
	}

	override onItemEmptyEnter(block: Block): void {
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

	override onItemSplit(block: Block, cutFragment: () => DocumentFragment): void {
		super.onItemSplit(block, cutFragment);
		const li = this.createListItem();
		li.defaultEditableElement.append(cutFragment());
		li.defaultEditableElement.normalize();
		this.insertBlock(this.getBlockIndex(block), li);
		li.defaultEditableElement.focus();
	}
}
