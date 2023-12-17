import InlineToolbox from './editor/inline-toolbox';
import InlineBold from './editor/toolbox-items/bold';
import InlineItalic from './editor/toolbox-items/italic';
import InlineLink from './editor/toolbox-items/link';
import TextBlock from './editor/block-types/text';
import ListBlock from './editor/block-types/list';
import Editor from './editor';
import './text.styl';

const root = document.getElementById('app');

if (!root) {
	throw new Error('Nope');
}

const inlineToolbox = new InlineToolbox([new InlineBold(), new InlineItalic(), new InlineLink()]);
const editor = new Editor();
editor.registerBlockType('h2', TextBlock, {
	inlineToolbox,
	tag: 'h2',
});
editor.registerBlockType('h3', TextBlock, {
	inlineToolbox,
	tag: 'h3',
});
editor.registerBlockType('h4', TextBlock, {
	inlineToolbox,
	tag: 'h4',
});
editor.registerBlockType('ol', ListBlock, {
	inlineToolbox,
	ordered: true,
});
editor.registerBlockType('ul', ListBlock, {
	inlineToolbox,
	ordered: false,
});
editor.registerBlockType('p', TextBlock, {
	inlineToolbox,
	tag: 'p',
	// what block type to convert to on '* ' or '1. '
	olBlockType: 'ol',
	ulBlockType: 'ul',
});
editor.configure({
	defaultBlockType: 'p',
	rootClass: ['editor-root'],
});

editor.appendBlock('p');
editor.appendBlock('ul');
editor.appendBlock('ol');

root.append(editor.element);
