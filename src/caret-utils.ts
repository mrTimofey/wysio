export function getCaretRange(element: HTMLElement) {
	if (element.ownerDocument.activeElement !== element) {
		return null;
	}
	return element.ownerDocument.defaultView?.getSelection()?.getRangeAt(0) || null;
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
	const firstLineRect = getFillingRange(element).getClientRects()[0];
	return !firstLineRect || caretRect.top === firstLineRect.top;
}

export function isCaretOnLastLine(element: HTMLElement) {
	const caretRect = getCaretRect(element);
	if (!caretRect) {
		return false;
	}
	const lineRects = getFillingRange(element).getClientRects();
	const lastLineRect = lineRects[lineRects.length - 1];
	return !lastLineRect || caretRect.bottom === lastLineRect.bottom;
}

export function isCaretOnStart(element: HTMLElement) {
	const range = getCaretRange(element);
	if (!range) {
		return false;
	}
	const preCaretRange = range.cloneRange();
	preCaretRange.selectNodeContents(element);
	preCaretRange.setEnd(range.endContainer, range.endOffset);
	return preCaretRange.toString().length === 0;
}

export function isCaretOnEnd(element: HTMLElement) {
	const range = getCaretRange(element);
	if (!range || (range.endContainer.nodeValue && range.endOffset !== range.endContainer.nodeValue.length)) {
		return false;
	}
	let lastChild: Node | null = element;
	while (lastChild) {
		if (lastChild === range.endContainer) {
			return true;
		}
		lastChild = lastChild.lastChild;
	}
	return false;
}

export function setCaretToStart(element: HTMLElement) {
	element.focus();
}

export function setCaretToEnd(element: HTMLElement) {
	const selection = element.ownerDocument.defaultView?.getSelection();
	if (!selection) {
		return;
	}
	const range = element.ownerDocument.createRange();
	range.selectNodeContents(element.lastChild || element);
	range.collapse(false);
	selection.removeAllRanges();
	selection.addRange(range);
}
