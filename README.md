#`position: sticky` polyfill

The most accurate sticky polyfill out in the wild -- [check out different test cases](http://wilddeer.github.io/stickyfill/test/).

###What it does

- supports top-positioned stickies,
- works in IE9+,
- disables in older IEs and in browsers with native `position: sticky` support.
- Mimics original `position: sticky` behavior:

	- uses parent node as a boundary box,
	- behaves nicely with horizontal page scrolling,
	- only works on elements with specified `top`,
	- mimics native `top` and `margin-bottom` behavior,
	- works with table cells, but not with table rows.

###What it doesn't

- doesn't support left, right, bottom or combined stickies,
- doesn't support stacking of table cell stickies,
- doesn't work in overflowed blocks,
- doesn't parse your CSS! Launch it manually.

###Usage

JS:

```js
var stickyElements = document.getElementsByClassName('sticky');

for (var i = stickyElements.length - 1; i >= 0; i--) {
    Stickyfill.add(stickyElements[i]);
}
```

or JS + jQuery:

```js
$('.sticky').Stickyfill();
```

CSS:

```css
.sticky {
    position: -webkit-sticky;
    position: sticky;
    top: 0;
}
```

Also worth having:

```css
.sticky:before,
.sticky:after {
    content: '';
    display: table;
}
```

###Pro tips

- `top` specifies sticky's position relatively to the top edge of the viewport. It accepts negative values, too.
- Despite common misconception, sticky's bottom limit is defined by its parent node's bottom boundary (or table's bottom boundary in case of table cells). It has nothing to do with `offsetParent` (closest relatively positioned parent). This, however, can be changed in the future.
- You can push sticky's bottom limit up or down by specifying `margin-bottom`.

Check out [the test page](http://wilddeer.github.io/stickyfill/test/) to understand stickies better.

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

Disable stickies and erase `Stickyfill.stickies`.

####`Stickyfill.init()`

Attach event listeners and start watching for stickies in `Stickyfill.stickies`.

####`Stickyfill.stickies`

Array of parametric objects for all added stickies.

###License

[MIT license](http://opensource.org/licenses/MIT).
