/**
 * Get a range within the element if there is any.
 * @param element element
 */
export function getCaretRange(element: HTMLElement): Range | null {
	if (element.ownerDocument.activeElement !== element) {
		return null;
	}
	return element.ownerDocument.defaultView?.getSelection()?.getRangeAt(0) || null;
}

/**
 * Get a rectangle object representing a range within the element if there is any.
 * @param element element
 */
export function getCaretRect(element: HTMLElement): DOMRect | null {
	return getCaretRange(element)?.getBoundingClientRect() || null;
}

/**
 * Create a range with all the contents of the element selected.
 * @param element element
 */
export function createFillingRange(element: HTMLElement): Range {
	const range = element.ownerDocument.createRange();
	range.selectNodeContents(element);
	return range;
}

/**
 * Get a rectangle object representing the first line of the element.
 * @param element element
 */
export function getFirstLineRect(element: HTMLElement): DOMRect | null {
	return createFillingRange(element).getClientRects()[0];
}

/**
 * Get a rectangle object representing the last line of the element.
 * @param element element
 */
export function getLastLineRect(element: HTMLElement): DOMRect | null {
	const lineRects = createFillingRange(element).getClientRects();
	return lineRects[lineRects.length - 1];
}

/**
 * Determine if caret is somewhere in the first line of the element.
 * @param element element
 */
export function isCaretOnFirstLine(element: HTMLElement): boolean {
	const caretRect = getCaretRect(element);
	if (!caretRect) {
		return false;
	}
	const firstLineRect = getFirstLineRect(element);
	return !firstLineRect || caretRect.top === firstLineRect.top;
}

/**
 * Determine if caret is somewhere in the last line of the element.
 * @param element element
 */
export function isCaretOnLastLine(element: HTMLElement): boolean {
	const caretRect = getCaretRect(element);
	if (!caretRect) {
		return false;
	}
	const lastLineRect = getLastLineRect(element);
	return !lastLineRect || caretRect.bottom === lastLineRect.bottom;
}

/**
 * Determine if caret is at the start of the element.
 * @param element element
 */
export function isCaretOnStart(element: HTMLElement): boolean {
	const range = getCaretRange(element);
	if (!range) {
		return false;
	}
	const preCaretRange = range.cloneRange();
	preCaretRange.selectNodeContents(element);
	preCaretRange.setEnd(range.endContainer, range.endOffset);
	return preCaretRange.toString().length === 0;
}

/**
 * Determine if caret is at the end of the element.
 * @param element element
 */
export function isCaretOnEnd(element: HTMLElement): boolean {
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

/**
 * Get deepest first element of the parent.
 * @param parent parent element
 */
function getDeepFirstChild(parent: Node): Node {
	let child = parent;
	while (child.firstChild) {
		child = child.firstChild;
	}
	return child;
}

/**
 * Get deepest last element of the parent.
 * @param parent parent element
 */
function getDeepLastChild(parent: Node): Node {
	let child = parent;
	while (child.lastChild) {
		child = child.lastChild;
	}
	return child;
}

/**
 * Get previous deepest element of a previous sibling if there is any.
 * @param element the element to get a sibling of
 */
function getDeepPrevSibling(element: Node): Node | null {
	let res: Node | null = element;
	while (res && !res.previousSibling) {
		res = res?.parentNode;
	}
	return res?.previousSibling ? getDeepLastChild(res.previousSibling) : null;
}

/**
 * Get next deepest element of a next sibling if there is any.
 * @param element the element to get a sibling of
 */
function getDeepNextSibling(element: Node): Node | null {
	let res: Node | null = element;
	while (res && !res.nextSibling) {
		res = res?.parentNode;
	}
	return res?.nextSibling ? getDeepLastChild(res.nextSibling) : null;
}

/**
 * Move caret to the start of the element. Try to adjust caret position horizontally if left offset is provided.
 * @param element editable element
 * @param leftOffsetPx left offset in px
 */
export function setCaretToStart(element: HTMLElement, leftOffsetPx?: number): void {
	if (!leftOffsetPx) {
		element.focus();
		return;
	}
	// move caret to match offset
	const selection = element.ownerDocument.defaultView?.getSelection();
	if (!selection) {
		return;
	}
	element.normalize();
	const range = element.ownerDocument.createRange();
	range.selectNodeContents(getDeepFirstChild(element));

	// first line top position is used to prevent caret from moving up to the previous line
	const firstLineTop = getFirstLineRect(element)?.top ?? element.getBoundingClientRect().top;
	let offset = range.getBoundingClientRect().left;
	// max offset for a current endContainer
	let maxOffset = range.endOffset;
	range.collapse(true);
	// move caret right until it reaches the offset
	while (offset < leftOffsetPx) {
		const oldContainer = range.endContainer;
		const oldOffset = range.endOffset;
		if (range.endOffset < maxOffset) {
			range.setStart(range.endContainer, range.endOffset + 1);
		}
		else {
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

/**
 * Move caret to the end of the element. Try to adjust caret position horizontally if left offset is provided.
 * @param element editable element
 * @param leftOffsetPx left offset in px
 */
export function setCaretToEnd(element: HTMLElement, leftOffsetPx?: number): void {
	const selection = element.ownerDocument.defaultView?.getSelection();
	if (!selection) {
		return;
	}
	element.normalize();
	const range = element.ownerDocument.createRange();
	range.selectNodeContents(getDeepLastChild(element));
	range.collapse(false);
	// move caret to match offset
	if (leftOffsetPx) {
		// last line top position is used to prevent caret from moving to the next line
		const lastLineTop = getLastLineRect(element)?.top ?? element.getBoundingClientRect().top;
		let offset = range.getBoundingClientRect().left;
		// move caret left until it reaches the offset
		while (offset > leftOffsetPx) {
			const oldContainer = range.endContainer;
			const oldOffset = range.endOffset;
			if (range.endOffset > 0) {
				range.setEnd(range.endContainer, range.endOffset - 1);
			}
			else {
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
