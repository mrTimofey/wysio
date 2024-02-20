import InlineToolbox from './editor/inline-toolbox';
import InlineBold from './editor/toolbox-items/bold';
import InlineItalic from './editor/toolbox-items/italic';
import InlineLink from './editor/toolbox-items/link';
import TextBlock from './editor/block-types/text';
import ListBlock from './editor/block-types/list';
import Editor from './editor';
import withListStarters from './editor/augmentations/list-starters';
import withInlineToolbox from './editor/augmentations/inline-toolbox';
import './text.styl';

const root = document.getElementById('app');

if (!root) {
	throw new Error('Nope');
}

const editor = new Editor();
const toolbox = withInlineToolbox(new InlineToolbox([new InlineBold(), new InlineItalic(), new InlineLink()]));

['h2', 'h3', 'h4'].forEach((tag) => {
	editor.registerBlockType(tag, (t) => new TextBlock(t).augment(toolbox));
});
editor.registerBlockType('ul', () => new ListBlock().augmentListItems(toolbox));
editor.registerBlockType('ol', () => new ListBlock(true).augmentListItems(toolbox));
editor.registerBlockType('p', () => new TextBlock('p').augment(toolbox, withListStarters()));

editor.defaultBlockType = 'p';
editor.element.classList.add('editor-root');

editor.appendBlock('p');

root.append(editor.element);
