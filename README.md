#`position: sticky` polyfill

What it does:

- supports top-positioned stickies,
- works in IE9+,
- disables in older IEs and in browsers with native `position: sticky` support.

Mimics original `position: sticky` behavior:

- lookes for closest relatively positioned parent,
- behaves nicely with horizontal scrolls,
- only works on elements with specified `top`,
- `top` and `margin-bottom` mimic native behavior,
- works with `TH` and `TD` elements, but not `TR`s.

What it doesn't:

- doesn't support left, right, bottom or combined stickies,
- doesn't support stacking of table cell stickies,
- doesn't parse your CSS! Launch it manually.

###Usage

JS:

```js
var stickyElements = document.getElementsByClassName('sticky');

for (var i = stickyElements.length - 1; i >= 0; i--) {
    Stickyfill.add(stickyElements[i]);
}
```

CSS:

```css
.sticky {
	position: -webkit-sticky;
	position: sticky;
	top: 0;
}
```

###API

####`Stickyfill.add(HTMLNode)`

Add new sticky and `init()`, if necessary.

####`Stickyfill.rebuild()`

Recalc all metrics and update stickies' positions.

Call it after layout changes. Launches automatically after window resizes and device orientations changes.

####`Stickyfill.pause()`

Remove event listeners.

Usefull for debugging. Use `Stickyfill.init()` to get stuff running again.

####`Stickyfill.stop()`

Disable stickies.

Use `Stickyfill.init()` to enable them again.

####`Stickyfill.kill()`

Disable stiskies and erase `Stickyfill.elements`.

####`Stickyfill.init()`

Attach event listeners and start watching for stickies in `Stickyfill.elements`.

####`Stickyfill.stickies`

Array of parameter objects for all added stickies.
