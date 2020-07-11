import { schema } from './noteSchema';
import { defaultMarkdownParser, defaultMarkdownSerializer } from './markdownParser';
import { exitCode,baseKeymap } from 'prosemirror-commands';
import { undo, redo, history } from 'prosemirror-history';
import { keymap } from 'prosemirror-keymap';
import { EditorState, Selection, TextSelection, Plugin } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { imageUploader } from 'prosemirror-image-uploader'

import { dropCursor } from 'prosemirror-dropcursor';
import { gapCursor } from 'prosemirror-gapcursor';
import { buildInputRules } from './inputrules';
import { buildKeymap } from './keymap';

import markdownit from 'markdown-it';
import CodeMirror from 'codemirror';
import './codeBlockMode';

const mark = require('markdown-it-mark');
const emoji = require('markdown-it-emoji');
const ins = require('markdown-it-ins');
const hashtag = require('./markdownItHashtag');



function computeChange(oldVal, newVal) {
  if (oldVal === newVal) return null;
  let start = 0; let oldEnd = oldVal.length; let newEnd = newVal.length;
  while (start < oldEnd && oldVal.charCodeAt(start) === newVal.charCodeAt(start)) {
    ++start;
  }
  while (oldEnd > start && newEnd > start
    && oldVal.charCodeAt(oldEnd - 1) === newVal.charCodeAt(newEnd - 1)) {
    oldEnd--;
    newEnd--;
  }
  return { from: start, to: oldEnd, text: newVal.slice(start, newEnd) };
}

class CodeBlockView {
  constructor(node, view, getPos) {
    // Store for later
    this.node = node;
    this.view = view;
    this.getPos = getPos;
    this.incomingChanges = false;

    // Create a CodeMirror instance
    this.cm = new CodeMirror(null, {
      value: this.node.textContent,
      mode: node.attrs.params,
      lineNumbers: false,
      extraKeys: this.codeMirrorKeymap(),
      scrollbarStyle: null,
      lineWrapping: true,
    });

    // The editor's outer node is our DOM representation
    this.dom = this.cm.getWrapperElement();
    // CodeMirror needs to be in the DOM to properly initialize, so
    // schedule it to update itself
    setTimeout(() => this.cm.refresh(), 20);

    // This flag is used to avoid an update loop between the outer and
    // inner editor
    this.updating = false;
    // Track whether changes are have been made but not yet propagated
    this.cm.on('beforeChange', () => { this.incomingChanges = true; });
    // Propagate updates from the code editor to ProseMirror
    this.cm.on('cursorActivity', () => {
      if (!this.updating && !this.incomingChanges) this.forwardSelection();
    });
    this.cm.on('changes', () => {
      if (!this.updating) {
        this.valueChanged();
        this.forwardSelection();
      }
      this.incomingChanges = false;
    });
    this.cm.on('focus', () => this.forwardSelection());
  }

  forwardSelection() {
    if (!this.cm.hasFocus()) return;
    const { state } = this.view;
    const selection = this.asProseMirrorSelection(state.doc);
    if (!selection.eq(state.selection)) {
      this.view.dispatch(state.tr.setSelection(selection));
    }
  }

  asProseMirrorSelection(doc) {
    const offset = this.getPos() + 1;
    const anchor = this.cm.indexFromPos(this.cm.getCursor('anchor')) + offset;
    const head = this.cm.indexFromPos(this.cm.getCursor('head')) + offset;
    return TextSelection.create(doc, anchor, head);
  }

  setSelection(anchor, head) {
    this.cm.focus();
    this.updating = true;
    this.cm.setSelection(this.cm.posFromIndex(anchor),
      this.cm.posFromIndex(head));
    this.updating = false;
  }

  valueChanged() {
    const change = computeChange(this.node.textContent, this.cm.getValue());
    if (change) {
      const start = this.getPos() + 1;
      const tr = this.view.state.tr.replaceWith(
        start + change.from, start + change.to,
        change.text ? schema.text(change.text) : null,
      );
      this.view.dispatch(tr);
    }
  }

  codeMirrorKeymap() {
    const { view } = this;
    const mod = /Mac/.test(navigator.platform) ? 'Cmd' : 'Ctrl';
    return CodeMirror.normalizeKeyMap({
      Up: () => this.maybeEscape('line', -1),
      Left: () => this.maybeEscape('char', -1),
      Down: () => this.maybeEscape('line', 1),
      Right: () => this.maybeEscape('char', 1),
      [`${mod}-Z`]: () => undo(view.state, view.dispatch),
      [`Shift-${mod}-Z`]: () => redo(view.state, view.dispatch),
      [`${mod}-Y`]: () => redo(view.state, view.dispatch),
      'Ctrl-Enter': () => {
        if (exitCode(view.state, view.dispatch)) view.focus();
      },
    });
  }

  maybeEscape(unit, dir) {
    const pos = this.cm.getCursor();
    if (this.cm.somethingSelected()
          || pos.line !== (dir < 0 ? this.cm.firstLine() : this.cm.lastLine())
          || (unit === 'char'
           && pos.ch !== (dir < 0 ? 0 : this.cm.getLine(pos.line).length))) return CodeMirror.Pass;
    this.view.focus();
    const targetPos = this.getPos() + (dir < 0 ? 0 : this.node.nodeSize);
    const selection = Selection.near(this.view.state.doc.resolve(targetPos), dir);
    this.view.dispatch(this.view.state.tr.setSelection(selection).scrollIntoView());
    this.view.focus();
  }

  update(node) {
    if (node.type !== this.node.type) return false;
    this.node = node;
    const change = computeChange(this.cm.getValue(), node.textContent);
    if (change) {
      this.updating = true;
      this.cm.replaceRange(change.text, this.cm.posFromIndex(change.from),
        this.cm.posFromIndex(change.to));
      this.updating = false;
    }
    return true;
  }

  selectNode() { this.cm.focus(); }

  stopEvent() { return true; }
}

function arrowHandler(dir) {
  return (state, dispatch, view) => {
    if (state.selection.empty && view.endOfTextblock(dir)) {
      const side = dir === 'left' || dir === 'up' ? -1 : 1;
      const { $head } = state.selection;
      const nextPos = Selection.near(state.doc.resolve(side > 0 ? $head.after() : $head.before()), side);
      if (nextPos.$head && nextPos.$head.parent.type.name === 'code_block') {
        dispatch(state.tr.setSelection(nextPos));
        return true;
      }
    }
    return false;
  };
}

const arrowHandlers = keymap({
  ArrowLeft: arrowHandler('left'),
  ArrowRight: arrowHandler('right'),
  ArrowUp: arrowHandler('up'),
  ArrowDown: arrowHandler('down'),
});

class MarkdownView {
  constructor(target, content) {
    this.textarea = target.appendChild(document.createElement('textarea'));
    this.cm = CodeMirror.fromTextArea(this.textarea, {
      mode: 'markdown',
      lineNumbers: true,
      scrollbarStyle: null,
      lineWrapping: true,
    });
    this.cm.getDoc().setValue(content);
    this.textarea.value = content;
  }

  get content() {
    this.cm.toTextArea();
    return this.textarea.value;
  }

  focus() { this.textarea.focus(); }

  destroy() {
    this.textarea.remove();
  }
}

class ProseMirrorView {
  constructor(target, content) {
    console.log(markdownit('default', { html: false, typographer: true, linkify: true })
    .use(mark).use(emoji).use(ins).use(hashtag).parse(content));
    const pmView = new EditorView(target, {
      state: EditorState.create({
        doc: defaultMarkdownParser.parse(content),
        plugins: [
          buildInputRules(schema),
          keymap(buildKeymap(schema, {})),
          keymap(baseKeymap),
          dropCursor(),
          gapCursor(),
          history(),
          arrowHandlers,
          imageUploader({
            async upload(fileOrUrl, view) {
              if (typeof fileOrUrl === 'string') {
                return fileOrUrl;
              } else {
                const formData = new FormData();
                formData.append('image', fileOrUrl);
                const url = fetch('http://localhost:5000/api/1.0/editor/image', {
                method: 'POST',
                body: formData
                })
                  .then(res => res.json())
                  .then(body => {
                    return (body.url);
                  });
                console.log(url);
                return url;
              }
            }
          }),
          // new Plugin({
          //   props: {
          //     attributes: {class: 'ProseMirror-example-setup-style'}
          //   }
          // })
        ],
      }),
      nodeViews: { code_block: (node, view, getPos) => new CodeBlockView(node, view, getPos) },
      dispatchTransaction(transaction) {
        console.log('Document size went from', transaction.before.content.size,
          'to', transaction.doc.content.size);
        const newState = pmView.state.apply(transaction);
        pmView.updateState(newState);
      },

    });
    this.view = pmView;
  }

  get content() {
    return defaultMarkdownSerializer.serialize(this.view.state.doc);
  }

  focus() { this.view.focus(); }

  destroy() { this.view.destroy(); }
}

const place = document.querySelector('#editor');
let view = new ProseMirrorView(place, document.querySelector('#content').value);
const btn = document.querySelector('#view-source-btn');

btn.addEventListener('click', (e) => {
  if (btn.textContent === 'View Source') {
    btn.textContent = 'View Style';
    const View = MarkdownView;
    const { content } = view;
    view.destroy();
    view = new View(place, content);
    view.focus();
  } else {
    btn.textContent = 'View Source';
    const View = ProseMirrorView;
    const { content } = view;
    view.destroy();
    view = new View(place, content);
    view.focus();
  }
});
