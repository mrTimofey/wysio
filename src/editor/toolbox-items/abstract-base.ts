import type InlineToolbox from '../inline-toolbox';

export default abstract class InlineToolboxItem {
	#el: HTMLButtonElement = document.createElement('button');
	#toolbox: InlineToolbox | null = null;

	get element() {
		return this.#el;
	}

	protected get toolbox() {
		return this.#toolbox;
	}

	protected get range() {
		return this.toolbox?.range || null;
	}

	public abstract triggerAction(): void;

	protected abstract createButtonContents(): Element;

	public abstract rangeChanged(): void;

	constructor() {
		this.element.classList.add('editor-inline-toolbox__button');
		this.element.type = 'button';
		this.element.addEventListener('click', (e) => {
			e.preventDefault();
			this.triggerAction();
		});
		this.element.append(this.createButtonContents());
	}

	setToolbox(toolbox: InlineToolbox) {
		this.#toolbox = toolbox;
	}
}
