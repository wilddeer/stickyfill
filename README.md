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
Stickyfill.addAll(document.querySelectorAll('.sticky'));
```

or JS + jQuery:

```js
Stickyfill.addAll($('.sticky'));
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

### `Stickyfill`

#### `Stickyfill.add(element)`

`node` – `HTMLElement` or iterable element list ([`NodeList`](https://developer.mozilla.org/en/docs/Web/API/NodeList), jQuery collection, etc.). First element of the list is taken.

Adds the element as a sticky. Returns new [Sticky](#stickyfillsticky) instance associated with the element.

If there’s a sticky associated with the element, returns existing [Sticky](#stickyfillsticky) instance instead.

#### `Stickyfill.addAll(elementList)`

`elementList` – iterable element list ([`NodeList`](https://developer.mozilla.org/en/docs/Web/API/NodeList), jQuery collection, etc.) or single `HTMLElement`.

Adds the elements as stickies. Skips the elements that have stickies associated with the them.

Returns an array of [Sticky](#stickyfillsticky) instances associated with the lements (both existing and new ones).

#### `Stickyfill.refreshAll()`

Refreshes all existing stickies, updates their parameters and positions.

All stickies are automatically refreshed after window resizes and device orientations changes.

There’s also a fast but not very accurate layout change detection that triggers this method. If it failes to do so in your case, call this method manually.

#### `Stickyfill.remove(elementList)`

`elementList` – iterable element list ([`NodeList`](https://developer.mozilla.org/en/docs/Web/API/NodeList), jQuery collection, etc.) or single `HTMLElement`.

Removes stickies associated with the elements in the list.

#### `Stickyfill.removeAll()`

Removes all existing stickies.

#### `Stickyfill.stickies`

Array of existing [Sticky](#Stickyfill.Sticky) instances.

### `Stickyfill.Sticky`

Sticky class. You can call it directly:

```js
const sticky = new Stickyfill.Sticky(element);
```

It will throw an error if there’s a sticky bound to the passed element.

#### `Sticky.refresh()`

Refreshes the sticky, updates its parameters and position.

#### `Sticky.remove()`

Removes the sticky.

## Bug reports

## Contributing

### Prerequisites

- Install [node](https://nodejs.org/en/),
- install [`grunt-cli`](http://gruntjs.com/getting-started#installing-the-cli).

## Using Stickyfill?

Be sure to drop me a link &rarr; [:envelope: wd@dizaina.net](mailto:wd@dizaina.net). Wanna see it in action.

## License

[MIT license](http://opensource.org/licenses/MIT).
