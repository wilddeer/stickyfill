/*
 * Check if the browser supports `position: sticky` natively or is too old to run the polyfill.
 * If one of these is the case, key features of the polyfill are disabled, but the API remains
 * functional to avoid breaking things.
 */
let seppuku = false;

// If `getComputedStyle` is not supported
if (!window.getComputedStyle) seppuku = true;
// Dont’t get in a way if the browser supports
else {
    const prefixes = ['', '-webkit-', '-moz-', '-ms-'];
    const testNode = document.createElement('div');

    seppuku = prefixes.some(prefix => {
        try {
            testNode.style.position = prefix + 'sticky';
        }
        catch(e) {}

        return (testNode.style.position != '');
    });
}

/*
 * 2. “Global” vars used both in Sticky class and Sti
 */
const scroll = {
    top: null,
    left: null,
    update() {
        this.top = window.pageYOffset;
        this.left = window.pageXOffset;
    }
};

const stickies = [];

/*
 * 1. Utility functions
 */
function extend(targetObj, sourceObject) {
    for (var key in sourceObject) {
        if (sourceObject.hasOwnProperty(key)) {
            targetObj[key] = sourceObject[key];
        }
    }
}

function parseNumeric(val) {
    return parseFloat(val) || 0;
}

function getDocOffsetTop(node) {
    let docOffsetTop = 0;

    while (node) {
        docOffsetTop += node.offsetTop;
        node = node.offsetParent;
    }

    return docOffsetTop;
}



class Sticky {
    constructor(node) {
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

    refresh() {
        if (seppuku) return;
        if (this._active) this._deactivate();

        const node = this._node;

        /*
         * 1. Check if the node can be activated
         */
        const nodeComputedStyle = getComputedStyle(node);

        if (
            isNaN(parseFloat(nodeComputedStyle.top)) ||
            nodeComputedStyle.display == 'table-cell' ||
            nodeComputedStyle.display == 'none'
        ) return;

        this._active = true;

        /*
         * 2. Get necessary node parameters
         */
        const parentNode = node.parentNode;
        const cachedPosition = node.style.position;
        const nodeWinOffset = node.getBoundingClientRect();
        const parentWinOffset = parentNode.getBoundingClientRect();

        node.style.position = 'relative';

        this._computedStyles = {
            top: nodeComputedStyle.top,
            marginTop: nodeComputedStyle.marginTop,
            marginBottom: nodeComputedStyle.marginBottom,
            marginLeft: nodeComputedStyle.marginLeft,
            marginRight: nodeComputedStyle.marginRight,
            cssFloat: nodeComputedStyle.cssFloat,
            display: nodeComputedStyle.display
        };
        this._numericValues = {
            top: parseNumeric(nodeComputedStyle.top),
            marginBottom: parseNumeric(nodeComputedStyle.marginBottom),
            paddingLeft: parseNumeric(nodeComputedStyle.paddingLeft),
            paddingRight: parseNumeric(nodeComputedStyle.paddingRight),
            borderLeftWidth: parseNumeric(nodeComputedStyle.borderLeftWidth),
            borderRightWidth: parseNumeric(nodeComputedStyle.borderRightWidth)
        };

        node.style.position = cachedPosition;

        const parentComputedStyle = getComputedStyle(parentNode);
        this._parent = {
            node: parentNode,
            styles: {
                position: parentNode.style.position
            },
            computedStyles: {
                position: parentComputedStyle.position
            },
            numericValues: {
                borderLeftWidth: parseNumeric(parentComputedStyle.borderLeftWidth),
                borderRightWidth: parseNumeric(parentComputedStyle.borderRightWidth),
                borderTopWidth: parseNumeric(parentComputedStyle.borderTopWidth),
                borderBottomWidth: parseNumeric(parentComputedStyle.borderBottomWidth)
            },
            height: parentNode.offsetHeight
        };
        this._winOffset = {
            left: nodeWinOffset.left,
            right: document.documentElement.clientWidth - nodeWinOffset.right
        };
        this._docOffset = {
            top: nodeWinOffset.top - parentWinOffset.top - this._parent.numericValues.borderTopWidth,
            left: nodeWinOffset.left - parentWinOffset.left - this._parent.numericValues.borderLeftWidth,
            right: -nodeWinOffset.right + parentWinOffset.right - this._parent.numericValues.borderRightWidth
        };
        this._styles = {
            position: cachedPosition,
            top: node.style.top,
            bottom: node.style.bottom,
            left: node.style.left,
            right: node.style.right,
            width: node.style.width,
            marginTop: node.style.marginTop,
            marginLeft: node.style.marginLeft,
            marginRight: node.style.marginRight
        };

        this._width = nodeWinOffset.right - nodeWinOffset.left;
        this._height = nodeWinOffset.bottom - nodeWinOffset.top;
        this._limits = {
            start: nodeWinOffset.top + window.pageYOffset - this._numericValues.top,
            end: parentWinOffset.top + window.pageYOffset + parentNode.offsetHeight -
                this._parent.numericValues.borderBottomWidth - node.offsetHeight -
                this._numericValues.top - this._numericValues.marginBottom
        };

        /*
         * 3. Create a clone
         */
        this._clone = document.createElement('div');

        // Apply styles to the clone
        extend(this._clone.style, {
            height: this._height + 'px',
            width: this._width + 'px',
            marginTop: this._computedStyles.marginTop,
            marginBottom: this._computedStyles.marginBottom,
            marginLeft: this._computedStyles.marginLeft,
            marginRight: this._computedStyles.marginRight,
            padding: 0,
            border: 0,
            borderSpacing: 0,
            fontSize: '1em',
            position: 'static',
            cssFloat: this._computedStyles.cssFloat
        });

        this._parent.node.appendChild(this._clone);
        this._cloneOffsetTop = getDocOffsetTop(this._clone);

        /*
         * 4. Ensure that the node will be positioned relatively to the parent node
         */
        if (
            this._parent.computedStyles.position != 'absolute' &&
            this._parent.computedStyles.position != 'relative'
        ) {
            this._parent.node.style.position = 'relative';
        }

        this._recalcPosition();
    }

    _recalcPosition() {
        if (!this._active) return;

        const stickyMode = scroll.top <= this._limits.start? 'start': scroll.top >= this._limits.end? 'end': 'middle';

        if (this._stickyMode == stickyMode) return;

        switch (stickyMode) {
            case 'start':
                extend(this._node.style, {
                    position: 'absolute',
                    left: this._docOffset.left + 'px',
                    right: this._docOffset.right + 'px',
                    top: this._docOffset.top + 'px',
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
                    left: this._winOffset.left + 'px',
                    right: this._winOffset.right + 'px',
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
                    left: this._docOffset.left + 'px',
                    right: this._docOffset.right + 'px',
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

    _fastCheck() {
        if (!this._active) return true;

        if (Math.abs(getDocOffsetTop(this._clone) - this._cloneOffsetTop) >= 2) return false;
        if (Math.abs(this._parent.node.offsetHeight - this._parent.height) >= 2) return false;

        return true;
    }

    _deactivate() {
        if (!this._active) return;

        this._clone.parentNode.removeChild(this._clone);
        delete this._clone;

        extend(this._node.style, this._styles);

        // Check whether element’s parent node is used by other stickies.
        // If not, restore parent node’s styles.
        if (!stickies.some(sticky => sticky !== this && sticky._parent && sticky._parent.node === this._parent.node))
            extend(this._parent.node.style, this._parent.styles);

        this._stickyMode = null;
        this._active = false;
    }

    kill() {
        this._deactivate();

        stickies.every((sticky, index) => {
            if (sticky._node === this._node) {
                stickies.splice(index, 1);
                return false;
            }
        });
    }
}

const Stickyfill = {
    stickies,
    Sticky,
    add(nodeList) {
        if (nodeList instanceof HTMLElement) nodeList = [nodeList];
        if (!nodeList[0] || !nodeList.length) return;

        const addedStickies = [];

        for (let i = 0; i < nodeList.length; i++) {
            let node = nodeList[i];
            if (!(node instanceof HTMLElement)) continue;

            //check if Stickyfill is already applied to the node
            if (stickies.every(sticky => sticky._node !== node))
                addedStickies.push(new Sticky(node));
        }

        return addedStickies;
    },
    addOne(node) {
        if (node[0]) node = node[0];
        if (!(node instanceof HTMLElement)) return;

        //check if Stickyfill is already applied to the node
        if (stickies.some(sticky => sticky._node === node)) return;

        return new Sticky(node);
    },
    remove(node) {
        stickies.some((sticky, index) => {
            if (sticky._node === node) {
                sticky.kill();
                return true;
            }
        });
    },
    refreshAll() {
        stickies.forEach(sticky => sticky.refresh());
    },
    removeAll() {
        stickies.forEach(sticky => sticky.kill());
    }
};

function recalcAll() {
    stickies.forEach(sticky => sticky._recalcPosition());
}

function init() {
    /*
     * 1. Check scroll position and trigger recalc/refresh if needed
     */
    function checkScroll() {
        if (window.pageXOffset != scroll.left) {
            scroll.update();
            Stickyfill.refreshAll();
        }
        else if (window.pageYOffset != scroll.top) {
            scroll.update();
            recalcAll();
        }
    }
    checkScroll();

    window.addEventListener('scroll', checkScroll);
    window.addEventListener('wheel', () => {
        setTimeout(checkScroll, 0);
    });

    /*
     * 2. Watch for resizes and trigger refresh
     */
    window.addEventListener('resize', Stickyfill.refreshAll);
    window.addEventListener('orientationchange', Stickyfill.refreshAll);

    /*
     * 3. Fast dirty check for layout changes every 500ms
     */
    let fastCheckTimer;

    function fastCheck() {
        return stickies.every(sticky => sticky._fastCheck());
    }

    function startFastCheckTimer() {
        fastCheckTimer = setInterval(function() {
            if (!fastCheck()) Stickyfill.refreshAll();
        }, 500);
    }

    function stopFastCheckTimer() {
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
 * 4. Expose Stickyfill
 */
if (typeof(module) != 'undefined' && module.exports) {
    module.exports = Stickyfill;
}
else {
    window.Stickyfill = Stickyfill;
}
