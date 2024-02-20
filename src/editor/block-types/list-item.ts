import { isCaretOnStart } from '../../caret-utils';
import TextBlock from './text';

export default class ListItemBlock extends TextBlock {
	#depth = 0;

	set depth(v: number) {
		this.#depth = v > 0 ? v : 0;
		this.element.dataset.level = this.#depth.toString();
	}

	get depth() {
		return this.#depth;
	}

	constructor(private listeners?: { onGoDeeper: (item: ListItemBlock) => unknown; onGoUpper: (item: ListItemBlock) => unknown }) {
		super('li');
		this.depth = 0;
		this.defaultEditableElement.addEventListener('keydown', (event) => {
			if (this.listeners && event.key === 'Tab') {
				event.preventDefault();
				if (event.shiftKey) {
					this.listeners.onGoUpper(this);
				} else if (isCaretOnStart(this.defaultEditableElement)) {
					this.listeners.onGoDeeper(this);
				}
			}
		});
	}
}
