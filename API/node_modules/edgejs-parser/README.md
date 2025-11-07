# EdgeJS Parser

This is a small parser for HTML and EdgeJS.

Built using [Chevrotain](https://chevrotain.io/ "Chevrotain").

*Note: This will built specifically to build a prettier plugin for EdgeJS templates, so may not serve all purposes.*

## Installation

```bash
npm i edgejs-parser
```

## Usage

There is a single export `parser` that can be used and will return an AST.

```javascript
import edgeParser from "edgejs-parser";
```

If you want to see the format of the AST read the `visitor.js` file.

## Contributing

As with most open source projects my time is limited and I do the best I can.

If you spot an issue, feel free to open a Bug and I will get too it when I can, or even better yet feel free to open a PR.
