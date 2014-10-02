#`position: sticky` polyfill

The most accurate sticky polyfill out in the wild.

Check out [the demo](http://wd.dizaina.net/en/scripts/stickyfill/) and [use cases test page](http://wilddeer.github.io/stickyfill/test/).

###What it does

- supports top-positioned stickies,
- works in IE9+,
- disables in older IEs and in browsers with native `position: sticky` support.
- Mimics original `position: sticky` behavior:

	- uses parent node as a boundary box,
	- behaves nicely with horizontal page scrolling,
	- only works on elements with specified `top`,
	- mimics native `top` and `margin-bottom` behavior,
	- 	~~works with table cells~~

		[Spec says](http://dev.w3.org/csswg/css-position/#sticky) that table cells are not eligible for `position: sticky`. Safari supports table cell sticky positioning, but Firefox followed the spec and rolled out the support for sticky positioning recently. We now have a nasty situation where we just can't properly polyfill table cell sticky positioning without sniffing due to difference in realisations. So I decided to remove the support for table cell stickies to make the polyfill more consistent across the board. Sorry, lads, no sticky table headers for you.

###What it doesn't

- doesn't support left, right, bottom or combined stickies,
- doesn't support stacking of table cell stickies,
- doesn't work in overflowed blocks,
- doesn't parse your CSS! Launch it manually.

###Installation

Download:

- [stickyfill.min.js](https://raw.github.com/wilddeer/stickyfill/master/dist/stickyfill.min.js) – minified production script
- [stickyfill.js](https://raw.github.com/wilddeer/stickyfill/master/dist/stickyfill.js) – full development script

Include it on your page:

```html
<script src="path/to/stickyfill.js"></script>
```

Also available in [Bower](http://bower.io):

```
bower install Stickyfill --save
```

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

Also worth having a clearfix:

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

####`Stickyfill.remove(HTMLNode)`

Remove sticky.

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

###Using Stickyfill?

Be sure to drop me a link &rarr; [:envelope: wd@dizaina.net](mailto:wd@dizaina.net). Wanna see it in action.

###License

[MIT license](http://opensource.org/licenses/MIT).
