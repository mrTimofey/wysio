import InlineToolbox from './editor/inline-toolbox';
import InlineBold from './editor/toolbox-items/bold';
import InlineItalic from './editor/toolbox-items/italic';
import InlineLink from './editor/toolbox-items/link';
import TextBlock from './editor/block-types/text';
import ListBlock from './editor/block-types/list';
import Editor from './editor';
import './text.styl';
import type Block from './editor/block-types/abstract-base';

const root = document.getElementById('app');

if (!root) {
	throw new Error('Nope');
}

const editor = new Editor();
const inlineToolbox = new InlineToolbox([new InlineBold(), new InlineItalic(), new InlineLink()]);

function withToolbox<B extends Block & { set inlineToolbox(arg: InlineToolbox | undefined) }>(block: B): B {
	block.inlineToolbox = inlineToolbox;
	return block;
}

['h2', 'h3', 'h4'].forEach((tag) => {
	editor.registerBlockType(tag, (t) => withToolbox(new TextBlock(t)));
});
editor.registerBlockType('ul', () => withToolbox(new ListBlock()));
editor.registerBlockType('ol', () => withToolbox(new ListBlock(true)));
editor.registerBlockType('p', () => {
	const block = withToolbox(new TextBlock('p'));
	block.ulBlockTypeName = 'ul';
	block.olBlockTypeName = 'ol';
	return block;
});

editor.defaultBlockType = 'p';
editor.element.classList.add('editor-root');

editor.appendBlock('p');

root.append(editor.element);
