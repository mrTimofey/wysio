import { isCaretOnStart } from '../../caret-utils';
import TextBlock from './text';

export default class ListItemBlock extends TextBlock {
	#depth = 0;
	#ordered = false;

	protected set depth(v: number) {
		this.#depth = v > 0 ? v : 0;
		this.element.dataset.depth = this.#depth.toString();
		this.element.style.setProperty('--depth', this.#depth.toString());
	}

	get depth() {
		return this.#depth;
	}

	set ordered(v: boolean) {
		this.#ordered = v;
		this.element.dataset.ordered = this.#ordered.toString();
	}

	get ordered() {
		return this.#ordered;
	}

	override get chainable() {
		return true;
	}

	/**
	 * Create new list item block.
	 * @param ordered is this an ordered list item
	 * @param maxDepth max depth level
	 * @param shiftZeroBlockType block type name to convert to when user shifts list item to zero level
	 */
	constructor(
		ordered = false,
		public maxDepth = 100,
		public shiftZeroBlockType: string | null = 'p',
	) {
		super();
		this.depth = 0;
		this.ordered = ordered;
		this.element.dataset.listItem = 'true';
		this.defaultEditableElement.addEventListener('keydown', (event) => {
			if (event.key !== 'Tab') {
				return;
			}
			event.preventDefault();
			if (event.shiftKey) {
				this.shiftUpper();
			} else if (isCaretOnStart(this.defaultEditableElement)) {
				this.shiftDeeper();
			}
		});
	}

	shiftDeeper() {
		if (!(this.prevBlock instanceof ListItemBlock) || this.depth > this.prevBlock.depth || this.depth >= this.maxDepth) {
			return;
		}
		this.depth += 1;
	}

	shiftUpper() {
		if (this.depth > 0) {
			this.depth -= 1;
		} else if (this.parent && this.shiftZeroBlockType) {
			this.parent.convertTo(this, this.shiftZeroBlockType);
		}
	}

	protected override onSplit(arg: { cutFragment: () => DocumentFragment }): void {
		super.onSplit(arg);
		if (!(this.nextBlock instanceof ListItemBlock)) {
			return;
		}
		// set same depth for a just inserted list block
		this.nextBlock.depth = this.depth;
	}
}
