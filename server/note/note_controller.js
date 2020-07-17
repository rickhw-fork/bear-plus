const models = require('../models');
const response = require('../response');

const testContent = `
---
__Advertisement :)__

- __[pica](https://nodeca.github.io/pica/demo/)__ - high quality and fast image resize in browser.
- __[babelfish](https://github.com/nodeca/babelfish/)__ - developer friendly in with plurals support and easy syntax.

You will like those projects!
---

# h1 Heading 8-)
## h2 Heading
### h3 Heading
#### h4 Heading
##### h5 Heading
###### h6 Heading
#tag/tagg/taggg

## Horizontal Rules

___

---

***

## Typographic replacements

Enable typographer option to see result.

(c) (C) (r) (R) (tm) (TM) (p) (P) +-

test.. test... test..... test?..... test!....

!!!!!! ???? ,,  -- ---

"Smartypants, double quotes" and 'single quotes'

## Emphasis

**This is bold text**

__This is bold text__

*This is italic text*

_This is italic text_

~~Strikethrough~~

## Blockquotes

> Blockquotes can also be nested...
>> ...by using additional greater-than signs right next to each other...
>>> ...or with spaces between arrows.

## Lists

Unordered

+ Create a list by starting a line with \`+\`, \`-\`, or \`*\`
+ Sub-lists are made by indenting 2 spaces:
- Marker character change forces new list start:
* Ac tristique libero volutpat at
+ Facilisis in pretium nisl aliquet
- Nulla volutpat aliquam velit
+ Very easy!

Ordered

1. Lorem ipsum dolor sit amet
2. Consectetur adipiscing elit
3. Integer molestie lorem at massa

1. You can use sequential numbers...
1. ...or keep all the numbers as \`1.\`

Start numbering with offset:

57. foo
1. bar


## Code

Inline \`code\`

Indented code
    // Some comments
    line 1 of code
    line 2 of code
    line 3 of code

Block code "fences"
\`\`\`
Sample text here...
\`\`\`

Syntax highlighting
\`\`\`javascript
var foo = function (bar) {
return bar++;
};

console.log(foo(5));
\`\`\`

## Links

[link text](http://dev.nodeca.com)

[link with title](http://nodeca.github.io/pica/demo/ "title text!")

Autoconverted link https://github.com/nodeca/pica (enable linkify to see)


## Images

![Minion](https://octodex.github.com/images/minion.png)
![Stormtroopocat](https://octodex.github.com/images/stormtroopocat.jpg "The Stormtroopocat")

## Plugins

The killer feature of \`markdown-it\` is very effective support of
[syntax plugins](https://www.npmjs.org/browse/keyword/markdown-it-plugin).


### [Emojies](https://github.com/markdown-it/markdown-it-emoji)

> Classic markup: :wink: :crush: :cry: :tear: :laughing: :yum:
>
> Shortcuts (emoticons): :-) :-( 8-) ;)

see [how to change output](https://github.com/markdown-it/markdown-it-emoji#change-output) with twemoji.

### [<mark>](https://github.com/markdown-it/markdown-it-mark)

==Marked text==

### [<ins>](https://github.com/markdown-it/markdown-it-ins)

++Inserted text++`;

const uploadImage = async (req, res) => {
  const url = req.files.image[0].location;
  res.json({ url });
};


const createNewNote = (req, res) => {
  if (!req.isAuthenticated()) {
    return response.errorForbidden(req, res);
  }
  models.Note.create({
    ownerId: req.user.id,
    content: ''
  }).then((note) => {
    res.json({ noteId: note.id, noteUrl: note.shortid });
  }).catch((err) => {
    console.log(err);
    response.errorInternalError(req, res);
  });
};

module.exports = {
  createNewNote,
  uploadImage
};