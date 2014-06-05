#`position: sticky` polyfill

Work in progress, folks!

- Currently supports top-positioned stickies.
- Takes into account element's `width`, `height`, `margin-top`, `margin-bottom` and `top`.
- Doesn't look for borders and `bottom` yet.
- Works in IE9+.
- Disables in older IEs and in browsers with native `position: sticky` support.

Mimics original `position: sticky` behavior:

- lookes for closest `offsetParent`,
- behaves nicely with horizontal scrolls,
- only works on elements with specified `top`.

Doesn't parse your CSS! Launch it manually:

```js
var stickyElements = document.getElementsByClassName('sticky'),
    stickies;

for (var i = stickyElements.length - 1; i >= 0; i--) {
    stickies = Stickyfill(stickyElements[i]);
}
```

Also consider this CSS:

```css
.sticky {
	position: -webkit-sticky;
	position: sticky;
	top: 0;
	-webkit-box-sizing: border-box;
	-moz-box-sizing: border-box;
	box-sizing: border-box;
}
```

Returns an object:

```js
{
    elements: Array, //informations gathered on all the sticky blocks passed to `Stickyfill`
    reinit: function //recalc everything
}
```
