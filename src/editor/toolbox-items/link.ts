import Base from './abstract-base';

export default class InlineToolboxLink extends Base {
	activeClass = '_active';
	dialogEl = document.createElement('form');

	constructor() {
		super();
		this.element.classList.add('_link');
		this.createDialogForm();
	}

	protected createDialogForm() {
		const input = document.createElement('input');
		const btnApply = document.createElement('button');
		const btnCancel = document.createElement('button');
		btnApply.type = 'submit';
		btnCancel.type = 'button';
		input.classList.add('editor-inline-toolbox__text-input');
		input.name = 'href';
		input.addEventListener('keyup', (e) => {
			if (e.key === 'Escape') {
				this.resetAndHideForm();
			}
		});
		btnApply.classList.add('editor-inline-toolbox__button');
		btnApply.innerHTML =
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M173.898 439.404l-166.4-166.4c-9.997-9.997-9.997-26.206 0-36.204l36.203-36.204c9.997-9.998 26.207-9.998 36.204 0L192 312.69 432.095 72.596c9.997-9.997 26.207-9.997 36.204 0l36.203 36.204c9.997 9.997 9.997 26.206 0 36.204l-294.4 294.401c-9.998 9.997-26.207 9.997-36.204-.001z"/></svg>';
		btnCancel.classList.add('editor-inline-toolbox__button');
		btnCancel.innerHTML =
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 352 512"><path d="M242.72 256l100.07-100.07c12.28-12.28 12.28-32.19 0-44.48l-22.24-22.24c-12.28-12.28-32.19-12.28-44.48 0L176 189.28 75.93 89.21c-12.28-12.28-32.19-12.28-44.48 0L9.21 111.45c-12.28 12.28-12.28 32.19 0 44.48L109.28 256 9.21 356.07c-12.28 12.28-12.28 32.19 0 44.48l22.24 22.24c12.28 12.28 32.2 12.28 44.48 0L176 322.72l100.07 100.07c12.28 12.28 32.2 12.28 44.48 0l22.24-22.24c12.28-12.28 12.28-32.19 0-44.48L242.72 256z"/></svg>';
		this.dialogEl.addEventListener('submit', (e) => {
			e.preventDefault();
			const link = input.value.trim();
			if (!link) {
				return;
			}
			this.applyLink(link);
			this.resetAndHideForm();
		});
		btnCancel.addEventListener('click', (e) => {
			e.preventDefault();
			this.resetAndHideForm();
		});
		this.dialogEl.classList.add('editor-inline-toolbox__link-form');
		this.dialogEl.append(input, btnApply, btnCancel);
	}

	protected createButtonContents() {
		const icon = document.createElement('span');
		icon.innerHTML =
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><path d="M172.5 131.1C228.1 75.51 320.5 75.51 376.1 131.1C426.1 181.1 433.5 260.8 392.4 318.3L391.3 319.9C381 334.2 361 337.6 346.7 327.3C332.3 317 328.9 297 339.2 282.7L340.3 281.1C363.2 249 359.6 205.1 331.7 177.2C300.3 145.8 249.2 145.8 217.7 177.2L105.5 289.5C73.99 320.1 73.99 372 105.5 403.5C133.3 431.4 177.3 435 209.3 412.1L210.9 410.1C225.3 400.7 245.3 404 255.5 418.4C265.8 432.8 262.5 452.8 248.1 463.1L246.5 464.2C188.1 505.3 110.2 498.7 60.21 448.8C3.741 392.3 3.741 300.7 60.21 244.3L172.5 131.1zM467.5 380C411 436.5 319.5 436.5 263 380C213 330 206.5 251.2 247.6 193.7L248.7 192.1C258.1 177.8 278.1 174.4 293.3 184.7C307.7 194.1 311.1 214.1 300.8 229.3L299.7 230.9C276.8 262.1 280.4 306.9 308.3 334.8C339.7 366.2 390.8 366.2 422.3 334.8L534.5 222.5C566 191 566 139.1 534.5 108.5C506.7 80.63 462.7 76.99 430.7 99.9L429.1 101C414.7 111.3 394.7 107.1 384.5 93.58C374.2 79.2 377.5 59.21 391.9 48.94L393.5 47.82C451 6.731 529.8 13.25 579.8 63.24C636.3 119.7 636.3 211.3 579.8 267.7L467.5 380z"/></svg>' +
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><path d="M185.7 120.3C242.5 75.82 324.7 79.73 376.1 131.1C420.1 175.1 430.9 239.6 406.7 293.5L438.6 318.4L534.5 222.5C566 191 566 139.1 534.5 108.5C506.7 80.63 462.7 76.1 430.7 99.9L429.1 101C414.7 111.3 394.7 107.1 384.5 93.58C374.2 79.2 377.5 59.21 391.9 48.94L393.5 47.82C451 6.732 529.8 13.25 579.8 63.24C636.3 119.7 636.3 211.3 579.8 267.7L489.3 358.2L630.8 469.1C641.2 477.3 643.1 492.4 634.9 502.8C626.7 513.2 611.6 515.1 601.2 506.9L9.196 42.89C-1.236 34.71-3.065 19.63 5.112 9.196C13.29-1.236 28.37-3.065 38.81 5.112L185.7 120.3zM238.1 161.1L353.4 251.7C359.3 225.5 351.7 197.2 331.7 177.2C306.6 152.1 269.1 147 238.1 161.1V161.1zM263 380C233.1 350.1 218.7 309.8 220.9 270L406.6 416.4C357.4 431 301.9 418.9 263 380V380zM116.6 187.9L167.2 227.8L105.5 289.5C73.99 320.1 73.99 372 105.5 403.5C133.3 431.4 177.3 435 209.3 412.1L210.9 410.1C225.3 400.7 245.3 404 255.5 418.4C265.8 432.8 262.5 452.8 248.1 463.1L246.5 464.2C188.1 505.3 110.2 498.7 60.21 448.8C3.741 392.3 3.741 300.7 60.21 244.3L116.6 187.9z"/></svg>';
		return icon;
	}

	openForm() {
		this.element.parentElement?.after(this.dialogEl);
		setTimeout(() => {
			this.dialogEl.querySelector('input')?.focus();
		});
	}

	resetAndHideForm() {
		this.dialogEl.reset();
		this.dialogEl.remove();
	}

	private checkNode(node: Node): node is HTMLAnchorElement {
		return node instanceof HTMLAnchorElement;
	}

	rangeChanged() {
		let rangeNode: Node | null = this.range?.commonAncestorContainer || null;
		this.element.classList.remove(this.activeClass);
		this.resetAndHideForm();
		while (rangeNode && rangeNode !== this.toolbox?.block?.element) {
			if (this.checkNode(rangeNode)) {
				this.element.classList.add(this.activeClass);
				return;
			}
			rangeNode = rangeNode.parentElement;
		}
	}

	triggerAction() {
		// remove link if selection contains any
		if (this.element.classList.contains(this.activeClass)) {
			this.removeLink();
			this.element.classList.remove(this.activeClass);
			return;
		}
		if (!this.element.parentElement) {
			return;
		}
		// hide form if it is opened
		if (this.element.parentElement.nextSibling === this.dialogEl) {
			this.resetAndHideForm();
			return;
		}
		this.openForm();
	}

	applyLink(link: string) {
		if (!this.range) {
			return;
		}
		const a = document.createElement('a');
		a.setAttribute('href', link);
		a.target = '_blank';
		const rangeContents = this.range.extractContents();
		// replace inner <a> elements with their children
		rangeContents.querySelectorAll('a').forEach((innerA) => {
			innerA.replaceWith(...Array.from(innerA.childNodes));
		});
		a.append(rangeContents);
		this.range.insertNode(a);
		this.toolbox?.block?.element.normalize();
	}

	removeLink() {
		if (!this.range) {
			return;
		}
		let rangeNode: Node | null = this.range?.commonAncestorContainer || null;
		while (rangeNode && rangeNode !== this.toolbox?.block?.element) {
			if (this.checkNode(rangeNode)) {
				rangeNode.replaceWith(...Array.from(rangeNode.childNodes));
				this.toolbox?.block?.element.normalize();
				return;
			}
			rangeNode = rangeNode.parentElement;
		}
	}
}
