export function getCaretRect(element: HTMLElement) {
	if (element.ownerDocument.activeElement !== element) {
		return null;
	}

	const selection = element.ownerDocument.defaultView?.getSelection();
	if (!selection?.rangeCount) {
		return null;
	}

	const originalCaretRange = selection.getRangeAt(0);
	if (originalCaretRange.toString().length > 0) {
		return null;
	}

	return originalCaretRange.getBoundingClientRect();
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
