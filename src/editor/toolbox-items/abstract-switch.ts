import Base from './abstract-base';

export default abstract class InlineToolboxSwitch extends Base {
	protected activeClass = '_active';
	protected abstract checkNode(node: Node): boolean;

	rangeChanged() {
		let rangeNode: Node | null = this.range?.commonAncestorContainer || null;
		this.element.classList.remove(this.activeClass);
		while (rangeNode && rangeNode !== this.toolbox?.block?.element) {
			if (this.checkNode(rangeNode)) {
				this.element.classList.add(this.activeClass);
				return;
			}
			rangeNode = rangeNode.parentElement;
		}
	}
}
