import type InlineToolbox from '../inline-toolbox';
import type Block from './abstract-base';
import CollectionBlock from './collection';
import type { IConfig as ITextConfig } from './text';
import TextBlock from './text';

export interface IConfig {
	inlineToolbox?: InlineToolbox;
	class?: string[];
	itemClass?: string[];
	ordered?: boolean;
}

export default class ListBlock extends CollectionBlock<IConfig> {
	#listElement: HTMLUListElement | HTMLOListElement | null = null;
	#itemConfig: ITextConfig = {};
	#ordered = false;

	protected get childrenRoot(): HTMLElement {
		if (!this.#listElement) {
			this.#listElement = document.createElement(this.#ordered ? 'ol' : 'ul');
			this.element.append(this.#listElement);
		}
		return this.#listElement;
	}

	get ordered() {
		return this.#ordered;
	}

	createListItem(): TextBlock {
		const li = new TextBlock('li');
		li.configure(this.#itemConfig);
		return li;
	}

	configure(config: IConfig): void {
		this.#ordered = !!config.ordered;
		this.#itemConfig = {
			inlineToolbox: config.inlineToolbox,
			class: config.itemClass,
		};
		if (config.class?.length) {
			this.element.classList.add(...config.class);
		}
		this.appendBlock(this.createListItem());
	}

	onEmpty(): void {
		if (!this.parent) {
			return;
		}
		this.element.remove();
		this.destroy();
	}

	onItemEmptyEnter(block: Block<unknown>): void {
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

	onItemSplit(block: Block<unknown>, cutFragment: () => DocumentFragment): void {
		const li = this.createListItem();
		li.defaultEditableElement.append(cutFragment());
		li.defaultEditableElement.normalize();
		this.insertBlock(this.getBlockIndex(block), li);
		li.defaultEditableElement.focus();
	}
}
