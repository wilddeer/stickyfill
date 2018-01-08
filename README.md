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
    - ~~works with table cells~~ removed for consistency until Firefox [makes a native implementation](https://bugzilla.mozilla.org/show_bug.cgi?id=975644)

## What it doesn't

- doesn't support left, right, bottom or combined stickies,
- doesn't work in overflowed blocks,
- doesn't parse your CSS! Launch it manually.

## Installation

### NPM

```
npm install stickyfilljs --save
```

### Yarn

```
yarn add stickyfilljs
```

### Raw ES6 module

[stickyfill.es6.js](https://raw.github.com/wilddeer/stickyfill/master/dist/stickyfill.es6.js)

### Old fashioned

Download minified production ES5 script:

[stickyfill.min.js](https://raw.github.com/wilddeer/stickyfill/master/dist/stickyfill.min.js)

Include it on your page:

```html
<script src="path/to/stickyfill.min.js"></script>
```

## Usage

First things first, make sure your stickies work in the [browsers that support them natively](http://caniuse.com/#feat=css-sticky), e.g.:

```html
<div class="sticky">
    ...
</div>
```

```css
.sticky {
    position: -webkit-sticky;
    position: sticky;
    top: 0;
}
```

Then apply the polyfill:

JS:

```js
var elements = document.querySelectorAll('.sticky');
Stickyfill.add(elements);
```

or JS + jQuery:

```js
var elements = $('.sticky');
Stickyfill.add(elements);
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
- Any non-default value (not `visible`) for `overflow`, `overflow-x`, or `overflow-y` on any of the ancestor elements anchors the sticky to the overflow context of that ancestor. Simply put, scrolling the ancestor will cause the sticky to stick, scrolling the window will not. This is expected with `overflow: auto` and `overflow: scroll`, but often causes confusion with `overflow: hidden`. Keep this in mind, folks!

Check out [the test page](http://wilddeer.github.io/stickyfill/test/) to understand stickies better.

## API

### `Stickyfill`

#### `Stickyfill.addOne(element)`

`element` – `HTMLElement` or iterable element list ([`NodeList`](https://developer.mozilla.org/en/docs/Web/API/NodeList), jQuery collection, etc.). First element of the list is used.

Adds the element as a sticky. Returns new [Sticky](#stickyfillsticky) instance associated with the element.

If there’s a sticky associated with the element, returns existing [Sticky](#stickyfillsticky) instance instead.

#### `Stickyfill.add(elementList)`

`elementList` – iterable element list ([`NodeList`](https://developer.mozilla.org/en/docs/Web/API/NodeList), jQuery collection, etc.) or single `HTMLElement`.

Adds the elements as stickies. Skips the elements that have stickies associated with them.

Returns an array of [Sticky](#stickyfillsticky) instances associated with the elements (both existing and new ones).

#### `Stickyfill.refreshAll()`

Refreshes all existing stickies, updates their parameters and positions.

All stickies are automatically refreshed after window resizes and device orientations changes.

There’s also a fast but not very accurate layout change detection that triggers this method. Call this method manually in case automatic detection fails.

#### `Stickyfill.removeOne(element)`

`element` – `HTMLElement` or iterable element list ([`NodeList`](https://developer.mozilla.org/en/docs/Web/API/NodeList), jQuery collection, etc.). First element of the list is used.

Removes sticky associated with the element.

#### `Stickyfill.remove(elementList)`

`elementList` – iterable element list ([`NodeList`](https://developer.mozilla.org/en/docs/Web/API/NodeList), jQuery collection, etc.) or single `HTMLElement`.

Removes stickies associated with the elements in the list.

#### `Stickyfill.removeAll()`

Removes all existing stickies.

#### `Stickyfill.stickies`

Array of existing [Sticky](#Stickyfill.Sticky) instances.

### `Stickyfill.Sticky`

Sticky class. You can use it directly if you want:

```js
const sticky = new Stickyfill.Sticky(element);
```

Throws an error if there’s a sticky already bound to the element.

#### `Sticky.refresh()`

Refreshes the sticky, updates its parameters and position.

#### `Sticky.remove()`

Removes the sticky. Restores the element to its original state.

## Feature requests

### TL;DR

These features will never be implemented in Stickyfill:

- Callbacks for sticky state changes
- Switching classes between different sticky states
- Other features that add non-standard functionality

If your request isn’t about one of these, you are welcome to [create an issue](https://github.com/wilddeer/stickyfill/issues/new). Please check [existing issues](https://github.com/wilddeer/stickyfill/issues) before creating new one.

### Some reasoning

Stickyfill is a [polyfill](https://en.wikipedia.org/wiki/Polyfill). This means that it implements a feature (sticky positioning in this case) that already exists in some browsers natively, and allows to use this feature in the browsers that don’t support it yet and older versions of the browsers that didn’t support it at the time. This is its only purpose.

This also means that Stickyfill does nothing in the browsers that _do_ support sticky positioning. Which, in turn, means that those browsers won’t support any additional non-standard features.

## Bug reports

Check [existing issues](https://github.com/wilddeer/stickyfill/issues) before creating new one. **Please provide a live reproduction of a bug.**

## Contributing

### Prerequisites

- Install Git 😱
- Install [node](https://nodejs.org/en/)
- Install [grunt-cli](http://gruntjs.com/getting-started#installing-the-cli)
- Clone the repo, `cd` into the repo folder, run `npm install` (or `yarn` if you are fancy).

Ok, you are all set.

### Building and testing

`cd` into the repo folder and run `grunt`. It will build the project from `/src/strickyfill.js` into `/dist` and run the watcher that will rebuild the project every time you change something in the source file.

Make changes to the source file. Stick to ES6 syntax.

Open `/test/index.html` in a browser that [doesn’t support](http://caniuse.com/#feat=css-sticky) `position: sticky` to check that everything works as expected. Compare the results to the same page in a browser that supports `position: sticky`.

Commit the changes. **DO NOT** commit the files in the `/dist` folder. **DO NOT** change the version in `package.json`.

Make a pull request 👍

### Adding / removing / updating npm packages

Use [Yarn](https://yarnpkg.com/), dont’t forget to commit `yarn.lock`.

## Using Stickyfill?

🍻 [Buy me a beer](https://www.paypal.me/wilddeer/0usd)

## License

[MIT license](LICENSE).
