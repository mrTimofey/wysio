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

export function getFirstLineRect(element: HTMLElement) {
	return getFillingRange(element).getClientRects()[0];
}

export function getLastLineRect(element: HTMLElement) {
	const lineRects = getFillingRange(element).getClientRects();
	return lineRects[lineRects.length - 1];
}

export function isCaretOnFirstLine(element: HTMLElement) {
	const caretRect = getCaretRect(element);
	if (!caretRect) {
		return false;
	}
	const firstLineRect = getFirstLineRect(element);
	return !firstLineRect || caretRect.top === firstLineRect.top;
}

export function isCaretOnLastLine(element: HTMLElement) {
	const caretRect = getCaretRect(element);
	if (!caretRect) {
		return false;
	}
	const lastLineRect = getLastLineRect(element);
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

function getDeepFirstChild(element: Node): Node {
	let child = element;
	while (child.firstChild) {
		child = child.firstChild;
	}
	return child;
}

function getDeepLastChild(element: Node): Node {
	let child = element;
	while (child.lastChild) {
		child = child.lastChild;
	}
	return child;
}

function getDeepPrevSibling(element: Node): Node | null {
	let res: Node | null = element;
	while (res && !res.previousSibling) {
		res = res?.parentNode;
	}
	return res?.previousSibling ? getDeepLastChild(res.previousSibling) : null;
}

function getDeepNextSibling(element: Node): Node | null {
	let res: Node | null = element;
	while (res && !res.nextSibling) {
		res = res?.parentNode;
	}
	return res?.nextSibling ? getDeepLastChild(res.nextSibling) : null;
}

export function setCaretToStart(element: HTMLElement, leftOffsetPx?: number) {
	if (!leftOffsetPx) {
		element.focus();
		return;
	}
	const selection = element.ownerDocument.defaultView?.getSelection();
	if (!selection) {
		return;
	}
	element.normalize();
	const range = element.ownerDocument.createRange();
	range.selectNodeContents(getDeepFirstChild(element));

	const firstLineTop = getFirstLineRect(element)?.top ?? element.getBoundingClientRect().top;
	let offset = range.getBoundingClientRect().left;
	let maxOffset = range.endOffset;
	range.collapse(true);
	while (offset < leftOffsetPx) {
		const oldContainer = range.endContainer;
		const oldOffset = range.endOffset;
		if (range.endOffset < maxOffset) {
			range.setStart(range.endContainer, range.endOffset + 1);
		} else {
			const next = getDeepNextSibling(range.endContainer);
			if (!next) {
				break;
			}
			range.selectNodeContents(next);
			maxOffset = range.endOffset;
			range.collapse(true);
		}
		if (range.getBoundingClientRect().top !== firstLineTop) {
			range.setStart(oldContainer, oldOffset);
			range.setEnd(oldContainer, oldOffset);
			break;
		}
		offset = range.getBoundingClientRect().left;
	}

	selection.removeAllRanges();
	selection.addRange(range);
}

export function setCaretToEnd(element: HTMLElement, leftOffsetPx?: number) {
	const selection = element.ownerDocument.defaultView?.getSelection();
	if (!selection) {
		return;
	}
	element.normalize();
	const range = element.ownerDocument.createRange();
	range.selectNodeContents(getDeepLastChild(element));
	range.collapse(false);
	// move caret left until it reaches the offset
	if (leftOffsetPx) {
		const lastLineTop = getLastLineRect(element)?.top ?? element.getBoundingClientRect().top;
		let offset = range.getBoundingClientRect().left;
		while (offset > leftOffsetPx) {
			const oldContainer = range.endContainer;
			const oldOffset = range.endOffset;
			if (range.endOffset > 0) {
				range.setEnd(range.endContainer, range.endOffset - 1);
			} else {
				const prev = getDeepPrevSibling(range.endContainer);
				if (!prev) {
					break;
				}
				range.selectNodeContents(prev);
				range.collapse(false);
			}
			if (range.getBoundingClientRect().top !== lastLineTop) {
				range.setStart(oldContainer, oldOffset);
				range.setEnd(oldContainer, oldOffset);
				break;
			}
			offset = range.getBoundingClientRect().left;
		}
	}
	selection.removeAllRanges();
	selection.addRange(range);
}
