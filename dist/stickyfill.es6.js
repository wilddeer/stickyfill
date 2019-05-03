/*!
  * Stickyfill – `position: sticky` polyfill
  * v. 2.1.0 | https://github.com/wilddeer/stickyfill
  * MIT License
  */

'use strict';

/*
 * 1. Check if the browser supports `position: sticky` natively or is too old to run the polyfill.
 *    If either of these is the case set `seppuku` flag. It will be checked later to disable key features
 *    of the polyfill, but the API will remain functional to avoid breaking things.
 */
let seppuku = false;

const isWindowDefined = typeof window !== 'undefined';

// The polyfill can’t function properly without `window` or `window.getComputedStyle`.
if (!isWindowDefined || !window.getComputedStyle) seppuku = true;
// Dont’t get in a way if the browser supports `position: sticky` natively.
else {
    const testNode = document.createElement('div');

    if (
        ['', '-webkit-', '-moz-', '-ms-'].some(prefix => {
            try {
                testNode.style.position = prefix + 'sticky';
            }
            catch(e) {}

            return testNode.style.position != '';
        })
    ) seppuku = true;
}


/*
 * 2. “Global” vars used across the polyfill
 */
let isInitialized = false;

// Check if Shadow Root constructor exists to make further checks simpler
const shadowRootExists = typeof ShadowRoot !== 'undefined';

// Last saved scroll position
const scroll = {
    top: null,
    left: null
};

// Array of created Sticky instances
const stickies = [];


/*
 * 3. Utility functions
 */
function extend (targetObj, sourceObject) {
    for (var key in sourceObject) {
        if (sourceObject.hasOwnProperty(key)) {
            targetObj[key] = sourceObject[key];
        }
    }
}

function parseNumeric (val) {
    return parseFloat(val) || 0;
}

function getDocOffsetTop (node) {
    let docOffsetTop = 0;

    while (node) {
        docOffsetTop += node.offsetTop;
        node = node.offsetParent;
    }

    return docOffsetTop;
}


/*
 * 4. Sticky class
 */
class Sticky {
    constructor (node) {
        if (!(node instanceof HTMLElement))
            throw new Error('First argument must be HTMLElement');
        if (stickies.some(sticky => sticky._node === node))
            throw new Error('Stickyfill is already applied to this node');

        this._node = node;
        this._stickyMode = null;
        this._active = false;

        stickies.push(this);

        this.refresh();
    }

    refresh () {
        if (seppuku || this._removed) return;
        if (this._active) this._deactivate();

        const node = this._node;

        /*
         * 1. Save node computed props
         */
        const nodeComputedStyle = getComputedStyle(node);
        const nodeComputedProps = {
            position: nodeComputedStyle.position,
            top: nodeComputedStyle.top,
            display: nodeComputedStyle.display,
            marginTop: nodeComputedStyle.marginTop,
            marginBottom: nodeComputedStyle.marginBottom,
            marginLeft: nodeComputedStyle.marginLeft,
            marginRight: nodeComputedStyle.marginRight,
            cssFloat: nodeComputedStyle.cssFloat
        };

        /*
         * 2. Check if the node can be activated
         */
        if (
            isNaN(parseFloat(nodeComputedProps.top)) ||
            nodeComputedProps.display == 'table-cell' ||
            nodeComputedProps.display == 'none'
        ) return;

        this._active = true;

        /*
         * 3. Check if the current node position is `sticky`. If it is, it means that the browser supports sticky positioning,
         *    but the polyfill was force-enabled. We set the node’s position to `static` before continuing, so that the node
         *    is in it’s initial position when we gather its params.
         */
        const originalPosition = node.style.position;
        if (nodeComputedStyle.position == 'sticky' || nodeComputedStyle.position == '-webkit-sticky')
            node.style.position = 'static';

        /*
         * 4. Get necessary node parameters
         */
        const referenceNode = node.parentNode;
        const parentNode = shadowRootExists && referenceNode instanceof ShadowRoot? referenceNode.host: referenceNode;
        const nodeWinOffset = node.getBoundingClientRect();
        const parentWinOffset = parentNode.getBoundingClientRect();
        const parentComputedStyle = getComputedStyle(parentNode);

        this._parent = {
            node: parentNode,
            styles: {
                position: parentNode.style.position
            },
            offsetHeight: parentNode.offsetHeight
        };
        this._offsetToWindow = {
            left: nodeWinOffset.left,
            right: document.documentElement.clientWidth - nodeWinOffset.right
        };
        this._offsetToParent = {
            top: nodeWinOffset.top - parentWinOffset.top - parseNumeric(parentComputedStyle.borderTopWidth),
            left: nodeWinOffset.left - parentWinOffset.left - parseNumeric(parentComputedStyle.borderLeftWidth),
            right: -nodeWinOffset.right + parentWinOffset.right - parseNumeric(parentComputedStyle.borderRightWidth)
        };
        this._styles = {
            position: originalPosition,
            top: node.style.top,
            bottom: node.style.bottom,
            left: node.style.left,
            right: node.style.right,
            width: node.style.width,
            marginTop: node.style.marginTop,
            marginLeft: node.style.marginLeft,
            marginRight: node.style.marginRight
        };

        const nodeTopValue = parseNumeric(nodeComputedProps.top);
        this._limits = {
            start: nodeWinOffset.top + window.pageYOffset - nodeTopValue,
            end: parentWinOffset.top + window.pageYOffset + parentNode.offsetHeight -
                parseNumeric(parentComputedStyle.borderBottomWidth) - node.offsetHeight -
                nodeTopValue - parseNumeric(nodeComputedProps.marginBottom)
        };

        /*
         * 5. Ensure that the node will be positioned relatively to the parent node
         */
        const parentPosition = parentComputedStyle.position;

        if (
            parentPosition != 'absolute' &&
            parentPosition != 'relative'
        ) {
            parentNode.style.position = 'relative';
        }

        /*
         * 6. Recalc node position.
         *    It’s important to do this before clone injection to avoid scrolling bug in Chrome.
         */
        this._recalcPosition();

        /*
         * 7. Create a clone
         */
        const clone = this._clone = {};
        clone.node = document.createElement('div');

        // Apply styles to the clone
        extend(clone.node.style, {
            width: nodeWinOffset.right - nodeWinOffset.left + 'px',
            height: nodeWinOffset.bottom - nodeWinOffset.top + 'px',
            marginTop: nodeComputedProps.marginTop,
            marginBottom: nodeComputedProps.marginBottom,
            marginLeft: nodeComputedProps.marginLeft,
            marginRight: nodeComputedProps.marginRight,
            cssFloat: nodeComputedProps.cssFloat,
            padding: 0,
            border: 0,
            borderSpacing: 0,
            fontSize: '1em',
            position: 'static'
        });

        referenceNode.insertBefore(clone.node, node);
        clone.docOffsetTop = getDocOffsetTop(clone.node);
    }

    _recalcPosition () {
        if (!this._active || this._removed) return;

        const stickyMode = scroll.top <= this._limits.start? 'start': scroll.top >= this._limits.end? 'end': 'middle';

        if (this._stickyMode == stickyMode) return;

        switch (stickyMode) {
            case 'start':
                extend(this._node.style, {
                    position: 'absolute',
                    left: this._offsetToParent.left + 'px',
                    right: this._offsetToParent.right + 'px',
                    top: this._offsetToParent.top + 'px',
                    bottom: 'auto',
                    width: 'auto',
                    marginLeft: 0,
                    marginRight: 0,
                    marginTop: 0
                });
                break;

            case 'middle':
                extend(this._node.style, {
                    position: 'fixed',
                    left: this._offsetToWindow.left + 'px',
                    right: this._offsetToWindow.right + 'px',
                    top: this._styles.top,
                    bottom: 'auto',
                    width: 'auto',
                    marginLeft: 0,
                    marginRight: 0,
                    marginTop: 0
                });
                break;

            case 'end':
                extend(this._node.style, {
                    position: 'absolute',
                    left: this._offsetToParent.left + 'px',
                    right: this._offsetToParent.right + 'px',
                    top: 'auto',
                    bottom: 0,
                    width: 'auto',
                    marginLeft: 0,
                    marginRight: 0
                });
                break;
        }

        this._stickyMode = stickyMode;
    }

    _fastCheck () {
        if (!this._active || this._removed) return;

        if (
            Math.abs(getDocOffsetTop(this._clone.node) - this._clone.docOffsetTop) > 1 ||
            Math.abs(this._parent.node.offsetHeight - this._parent.offsetHeight) > 1
        ) this.refresh();
    }

    _deactivate () {
        if (!this._active || this._removed) return;

        this._clone.node.parentNode.removeChild(this._clone.node);
        delete this._clone;

        extend(this._node.style, this._styles);
        delete this._styles;

        // Check whether element’s parent node is used by other stickies.
        // If not, restore parent node’s styles.
        if (!stickies.some(sticky => sticky !== this && sticky._parent && sticky._parent.node === this._parent.node)) {
            extend(this._parent.node.style, this._parent.styles);
        }
        delete this._parent;

        this._stickyMode = null;
        this._active = false;

        delete this._offsetToWindow;
        delete this._offsetToParent;
        delete this._limits;
    }

    remove () {
        this._deactivate();

        stickies.some((sticky, index) => {
            if (sticky._node === this._node) {
                stickies.splice(index, 1);
                return true;
            }
        });

        this._removed = true;
    }
}


/*
 * 5. Stickyfill API
 */
const Stickyfill = {
    stickies,
    Sticky,

    forceSticky () {
        seppuku = false;
        init();

        this.refreshAll();
    },

    addOne (node) {
        // Check whether it’s a node
        if (!(node instanceof HTMLElement)) {
            // Maybe it’s a node list of some sort?
            // Take first node from the list then
            if (node.length && node[0]) node = node[0];
            else return;
        }

        // Check if Stickyfill is already applied to the node
        // and return existing sticky
        for (var i = 0; i < stickies.length; i++) {
            if (stickies[i]._node === node) return stickies[i];
        }

        // Create and return new sticky
        return new Sticky(node);
    },

    add (nodeList) {
        // If it’s a node make an array of one node
        if (nodeList instanceof HTMLElement) nodeList = [nodeList];
        // Check if the argument is an iterable of some sort
        if (!nodeList.length) return;

        // Add every element as a sticky and return an array of created Sticky instances
        const addedStickies = [];

        for (let i = 0; i < nodeList.length; i++) {
            const node = nodeList[i];

            // If it’s not an HTMLElement – create an empty element to preserve 1-to-1
            // correlation with input list
            if (!(node instanceof HTMLElement)) {
                addedStickies.push(void 0);
                continue;
            }

            // If Stickyfill is already applied to the node
            // add existing sticky
            if (stickies.some(sticky => {
                if (sticky._node === node) {
                    addedStickies.push(sticky);
                    return true;
                }
            })) continue;

            // Create and add new sticky
            addedStickies.push(new Sticky(node));
        }

        return addedStickies;
    },

    refreshAll () {
        stickies.forEach(sticky => sticky.refresh());
    },

    removeOne (node) {
        // Check whether it’s a node
        if (!(node instanceof HTMLElement)) {
            // Maybe it’s a node list of some sort?
            // Take first node from the list then
            if (node.length && node[0]) node = node[0];
            else return;
        }

        // Remove the stickies bound to the nodes in the list
        stickies.some(sticky => {
            if (sticky._node === node) {
                sticky.remove();
                return true;
            }
        });
    },

    remove (nodeList) {
        // If it’s a node make an array of one node
        if (nodeList instanceof HTMLElement) nodeList = [nodeList];
        // Check if the argument is an iterable of some sort
        if (!nodeList.length) return;

        // Remove the stickies bound to the nodes in the list
        for (let i = 0; i < nodeList.length; i++) {
            const node = nodeList[i];

            stickies.some(sticky => {
                if (sticky._node === node) {
                    sticky.remove();
                    return true;
                }
            });
        }
    },

    removeAll () {
        while (stickies.length) stickies[0].remove();
    }
};


/*
 * 6. Setup events (unless the polyfill was disabled)
 */
function init () {
    if (isInitialized) {
        return;
    }

    isInitialized = true;

    // Watch for scroll position changes and trigger recalc/refresh if needed
    function checkScroll () {
        if (window.pageXOffset != scroll.left) {
            scroll.top = window.pageYOffset;
            scroll.left = window.pageXOffset;

            Stickyfill.refreshAll();
        }
        else if (window.pageYOffset != scroll.top) {
            scroll.top = window.pageYOffset;
            scroll.left = window.pageXOffset;

            // recalc position for all stickies
            stickies.forEach(sticky => sticky._recalcPosition());
        }
    }

    checkScroll();
    window.addEventListener('scroll', checkScroll);

    // Watch for window resizes and device orientation changes and trigger refresh
    window.addEventListener('resize', Stickyfill.refreshAll);
    window.addEventListener('orientationchange', Stickyfill.refreshAll);

    //Fast dirty check for layout changes every 500ms
    let fastCheckTimer;

    function startFastCheckTimer () {
        fastCheckTimer = setInterval(function () {
            stickies.forEach(sticky => sticky._fastCheck());
        }, 500);
    }

    function stopFastCheckTimer () {
        clearInterval(fastCheckTimer);
    }

    let docHiddenKey;
    let visibilityChangeEventName;

    if ('hidden' in document) {
        docHiddenKey = 'hidden';
        visibilityChangeEventName = 'visibilitychange';
    }
    else if ('webkitHidden' in document) {
        docHiddenKey = 'webkitHidden';
        visibilityChangeEventName = 'webkitvisibilitychange';
    }

    if (visibilityChangeEventName) {
        if (!document[docHiddenKey]) startFastCheckTimer();

        document.addEventListener(visibilityChangeEventName, () => {
            if (document[docHiddenKey]) {
                stopFastCheckTimer();
            }
            else {
                startFastCheckTimer();
            }
        });
    }
    else startFastCheckTimer();
}

if (!seppuku) init();


/*
 * 7. Expose Stickyfill
 */
if (typeof module != 'undefined' && module.exports) {
    module.exports = Stickyfill;
}
else if (isWindowDefined) {
    window.Stickyfill = Stickyfill;
}

