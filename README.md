# v 2.0 is in early development, use [current version from master branch](https://github.com/wilddeer/stickyfill), lads!

# Polyfill for CSS `position: sticky`

The most accurate sticky polyfill out in the wild.

Check out [the demo](http://wd.dizaina.net/en/scripts/stickyfill/) and [use cases test page](http://wilddeer.github.io/stickyfill/test/).

## What it does

- supports top-positioned stickies,
- works in IE9+,
- disables itself in older IEs and in browsers with native `position: sticky` support,
- mimics original `position: sticky` behavior:

	- uses parent node as a boundary box,
	- behaves nicely with horizontal page scrolling,
	- only works on elements with specified `top`,
	- mimics native `top` and `margin-bottom` behavior,
	- ~~works with table cells~~ disabled until Firefox [makes a native implementation](https://bugzilla.mozilla.org/show_bug.cgi?id=975644)

## What it doesn't

- doesn't support left, right, bottom or combined stickies,
- doesn't work in overflowed blocks,
- doesn't parse your CSS! Launch it manually.

## Installation

Download:

- [stickyfill.min.js](https://raw.github.com/wilddeer/stickyfill/master/dist/stickyfill.min.js) – minified production script
- [stickyfill.js](https://raw.github.com/wilddeer/stickyfill/master/dist/stickyfill.js) – full development script

Include it on your page:

```html
<script src="path/to/stickyfill.js"></script>
```

## Usage

JS:

```js
Stickyfill.add(document.querySelectorAll('.sticky'));
```

or JS + jQuery:

```js
Stickyfill.add($('.sticky'));
```

CSS:

```css
.sticky {
    position: -webkit-sticky;
    position: sticky;
    top: 0;
}
```

Also worth having a clearfix:

```css
.sticky:before,
.sticky:after {
    content: '';
    display: table;
}
```

## Pro tips

- `top` specifies sticky’s position relatively to the top edge of the viewport. It accepts negative values, too.
- You can push sticky’s bottom limit up or down by specifying positive or negative `margin-bottom`.
- Any non-default value (not `visible`) for `overflow`, `overflow-x`, or `overflow-y` on any of the predecessor elements anchors the sticky to the overflow context of that predecessor. Simply put, scrolling the predecessor will cause the sticky to stick, scrolling the window will not. This is expected with `overflow: auto` and `overflow: scroll`, but often causes confusion with `overflow: hidden`. Keep this in mind, folks!

Check out [the test page](http://wilddeer.github.io/stickyfill/test/) to understand stickies better.

## API

### `Stickyfill.add(nodeList)`

_nodeList_ – [NodeList](https://developer.mozilla.org/en/docs/Web/API/NodeList), jQuery collection or any other iterable list of HTML elements.

Adds elements from the list as stickies. Returns an array of created stickies.

### `Stickyfill.addOne(node)`

_node_ – HTML element.

Adds and element as a sticky. Returns an instance of `Stickyfill.Sticky`.

### `Stickyfill.remove(nodeList)`

Remove stickies.

### `Stickyfill.removeOne(nodeList)`

Removes a sticky.

### `Stickyfill.removeAll()`

Removes all stickies.

### `Stickyfill.refreshAll()`

Recalc all metrics and update stickies' positions.

Call it after layout changes. Launches automatically after window resizes and device orientations changes.

### `Stickyfill.stickies`

Array of added stickies.

### `Stickyfill.Sticky`

### `Sticky.refresh()`

### `Sticky.remove()`


## Using Stickyfill?

Be sure to drop me a link &rarr; [:envelope: wd@dizaina.net](mailto:wd@dizaina.net). Wanna see it in action.

## License

[MIT license](http://opensource.org/licenses/MIT).
