export function getCaretRange(element: HTMLElement) {
	if (element.ownerDocument.activeElement !== element) {
		return null;
	}

	const selection = element.ownerDocument.defaultView?.getSelection();
	if (!selection?.rangeCount) {
		return null;
	}

	const range = selection.getRangeAt(0);
	if (!range || range.toString().length > 0) {
		return null;
	}

	return range;
}

export function getCaretRect(element: HTMLElement) {
	return getCaretRange(element)?.getBoundingClientRect() || null;
}

export function getFillingRange(element: HTMLElement) {
	const range = element.ownerDocument.createRange();
	range.selectNodeContents(element);
	return range;
}

export function isCaretOnFirstLine(element: HTMLElement) {
	const caretRect = getCaretRect(element);
	if (!caretRect) {
		return false;
	}

	const elementRange = getFillingRange(element);
	let startContainer = elementRange.startContainer;
	while (startContainer.firstChild && !(startContainer instanceof Text)) {
		startContainer = startContainer.firstChild;
	}

	elementRange.setStart(startContainer, 0);
	elementRange.setEnd(startContainer, 0);
	const startOfElementRect = elementRange.getBoundingClientRect();

	return caretRect.top === startOfElementRect.top;
}

export function isCaretOnLastLine(element: HTMLElement) {
	// fix when there is an empty text node
	element.normalize();
	const caretRect = getCaretRect(element);
	if (!caretRect) {
		return false;
	}

	const elementRange = getFillingRange(element);
	let endContainer = elementRange.endContainer;
	while (endContainer.lastChild && !(endContainer instanceof Text)) {
		endContainer = endContainer.lastChild;
	}

	const offset = (endContainer instanceof Text && endContainer.length) || 0;
	elementRange.setStart(endContainer, offset);
	elementRange.setEnd(endContainer, offset);
	const endOfElementRect = elementRange.getBoundingClientRect();

	return caretRect.bottom === endOfElementRect.bottom;
}

export function isCaretOnStart(element: HTMLElement) {
	const range = getCaretRange(element);
	// handle empty element, in this case startOffset can be 1 (idk, looks like a bug)
	if (!element.textContent) {
		return true;
	}
	if (!range || range.startOffset !== 0) {
		return false;
	}
	let firstChild: Node | null = element;
	while (firstChild && firstChild !== range.startContainer) {
		firstChild = firstChild.firstChild;
	}
	return !!firstChild;
}

export function isCaretOnEnd(element: HTMLElement) {
	// fix when there is an empty text node
	element.normalize();
	const range = getCaretRange(element);
	if (!range || (range.endContainer.nodeValue && range.endOffset !== range.endContainer.nodeValue.length)) {
		return false;
	}
	let lastChild: Node | null = element;
	while (lastChild && lastChild !== range.endContainer) {
		lastChild = lastChild.lastChild;
	}
	return !!lastChild;
}

export function setCaretToEnd(element: HTMLElement) {
	const selection = element.ownerDocument.defaultView?.getSelection();
	if (!selection) {
		return;
	}
	const range = element.ownerDocument.createRange();
	range.selectNodeContents(element);
	range.collapse(false);
	selection.removeAllRanges();
	selection.addRange(range);
}
