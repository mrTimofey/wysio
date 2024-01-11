import { isCaretOnStart } from '../../caret-utils';
import TextBlock from './text';

export default class ListItemBlock extends TextBlock {
	constructor(private listeners?: { onGoDeeper: (item: ListItemBlock, listTarget: HTMLElement) => unknown; onGoUpper: (item: ListItemBlock) => unknown }) {
		super('li');
		this.defaultEditableElement.addEventListener('keydown', (event) => {
			if (this.listeners && event.key === 'Tab') {
				event.preventDefault();
				if (event.shiftKey) {
					this.listeners.onGoUpper(this);
				} else if (isCaretOnStart(this.defaultEditableElement)) {
					this.listeners.onGoDeeper(this, this.element);
				}
			}
		});
	}
}
