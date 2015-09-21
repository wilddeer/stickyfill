/*!
 * Stickyfill -- `position: sticky` polyfill
 * v. 1.1.2 | https://github.com/wilddeer/stickyfill
 * Copyright Oleg Korsunsky | http://wd.dizaina.net/
 *
 * MIT License
 */
//This fork of the original stickyfill (https://github.com/wilddeer/stickyfill) lib comes from
// https://github.com/google/ggrc-core/blob/develop/src/ggrc/assets/vendor/javascripts/stickyfill.js
//It has been converted to work as a module and several jshint warnings were removed.
//Also of note: React rendering during testing uses a detached DOM node. This was causing issues with stickyfill
//because in 2 places (lines 314 and 549) the DOM is traversed upwards until the document is reached. In a detached
//DOM node, the document is never reached. In these instances I manually jump to the body to continue traversal.

// Modified killClone to guard against the parent node not existing anymore - this is most likely a bandaid rather
// than the proper solution, but it would seem to make sense that the clone's parent could be swooped from underneath
// it because of React / Morearty.

'use strict';

module.exports = (function(doc, _win) {

  if (!doc) {
    doc = document;
  }
  if (!_win) {
    _win = window;
  }


    var watchArray = [],
        boundingElements = [{node: _win}],
        initialized = false,
        html = doc.documentElement,
        noop = function() {},
        checkTimer,

    //visibility API strings
        hiddenPropertyName = 'hidden',
        visibilityChangeEventName = 'visibilitychange';

    // This fixes an issue in Chrome on Mac Retina screens
    // sticky elements have to be forcefully redrawn,
    // otherwise they are there, but invisible
    function forceRedraw(el) {
        var display = el.node.style.display;
        el.node.style.display = 'none';
        el.node.offsetHeight; // this is important
        el.node.style.display = display;
    }

    //fallback to prefixed names in old webkit browsers
    if (doc.webkitHidden !== undefined) {
        hiddenPropertyName = 'webkitHidden';
        visibilityChangeEventName = 'webkitvisibilitychange';
    }

    //test getComputedStyle
    if (!_win.getComputedStyle) {
        seppuku();
    }

    //test for native support
    var prefixes = ['', '-webkit-', '-moz-', '-ms-'],
        block = document.createElement('div');

    for (var i = prefixes.length - 1; i >= 0; i--) {
        try {
            block.style.position = prefixes[i] + 'sticky';
        }
        catch(e) {}
        if (block.style.position != '') {
            seppuku();
        }
    }

    updateScrollPos();

    //commit seppuku!
    function seppuku() {
        init = add = rebuild = pause = stop = kill = noop;
    }

    function mergeObjects(targetObj, sourceObject) {
        for (var key in sourceObject) {
            if (sourceObject.hasOwnProperty(key)) {
                targetObj[key] = sourceObject[key];
            }
        }
    }

    function parseNumeric(val) {
        return parseFloat(val) || 0;
    }

    function getOffset(el) {
        return {top: el.pageYOffset || el.scrollTop || 0,
            left: el.pageXOffset || el.scrollLeft || 0};
    }

    function updateScrollPos() {
        boundingElements = boundingElements.map(function (el) {
            el.scroll = getOffset(el.node);
            return el;
        });
    }

    function getBoundingElement(el) {
        return boundingElements.filter(function (b) {
            return b.node === el;
        })[0];
    }

    function onScroll(event) {
        var el = event.currentTarget,
            cached = getBoundingElement(el);

        if (getOffset(el).left != cached.scroll.left) {
            updateScrollPos();
            rebuild();
            return;
        }

        if (getOffset(el).top != cached.scroll.top) {
            updateScrollPos();
            recalcAllPos();
        }

        watchArray.forEach(forceRedraw);
    }

    //fixes flickering
    function onWheel(event) {
        var el = event.currentTarget,
            cached = getBoundingElement(el);

        setTimeout(function() {
            if (getOffset(el).top != cached.scroll.top) {
                cached.scroll.top = getOffset(el).top;
                recalcAllPos();
            }
        }, 0);
    }

    function recalcAllPos() {
        for (var i = watchArray.length - 1; i >= 0; i--) {
            recalcElementPos(watchArray[i]);
        }
    }

    function getBoundingBox(node) {
        if (node === window) {
            return {
                top: 0,
                left: 0,
                bottom: 0,
                width: window.innerWidth || window.clientWidth,
                height: window.innerHeight || window.clientHeight
            };
        }else{
            return node.getBoundingClientRect();
        }
    }

    function recalcElementPos(el) {
        if (!el.inited) return;

        var boundingElement = findBoundingElement(el.node),
            edge = boundingElement.scroll.top+getBoundingBox(boundingElement.node).top;

        var currentMode = (edge <= el.limit.start? 0: edge >= el.limit.end? 2: 1);

        if (el.mode != currentMode) {
            switchElementMode(el, currentMode);
        }
    }

    //checks whether stickies start or stop positions have changed
    function fastCheck() {
        for (var i = watchArray.length - 1; i >= 0; i--) {
            if (!watchArray[i].inited) continue;

            var deltaTop = Math.abs(getDocOffsetTop(watchArray[i].clone) - watchArray[i].docOffsetTop),
                deltaHeight = Math.abs(watchArray[i].parent.node.offsetHeight - watchArray[i].parent.height);

            if (deltaTop >= 2 || deltaHeight >= 2) return false;
        }
        return true;
    }

    function initElement(el) {
        if (isNaN(parseFloat(el.computed.top)) || el.isCell) return;

        el.inited = true;

        if (!el.clone) clone(el);
        if (el.parent.computed.position != 'absolute' &&
            el.parent.computed.position != 'relative') el.parent.node.style.position = 'relative';

        recalcElementPos(el);

        el.parent.height = el.parent.node.offsetHeight;
        el.docOffsetTop = getDocOffsetTop(el.clone);
    }

    function deinitElement(el) {
        var deinitParent = true;

        if(el.clone) {
          killClone(el);
        }
        mergeObjects(el.node.style, el.css);

        //check whether element's parent is used by other stickies
        for (var i = watchArray.length - 1; i >= 0; i--) {
            if (watchArray[i].node !== el.node && watchArray[i].parent.node === el.parent.node) {
                deinitParent = false;
                break;
            }
        };

        if (deinitParent) el.parent.node.style.position = el.parent.css.position;
        el.mode = -1;
    }

    function initAll() {
        for (var i = watchArray.length - 1; i >= 0; i--) {
            initElement(watchArray[i]);
        }
    }

    function deinitAll() {
        for (var i = watchArray.length - 1; i >= 0; i--) {
            deinitElement(watchArray[i]);
        }
    }

    function switchElementMode(el, mode) {
        var nodeStyle = el.node.style,
            winBounds = getBoundingBox(findBoundingElement(el.node).node);

        switch (mode) {
            case 0:
                nodeStyle.position = 'absolute';
                nodeStyle.left = el.offset.left + 'px';
                nodeStyle.right = el.offset.right + 'px';
                nodeStyle.top = el.offset.top + 'px';
                nodeStyle.bottom = 'auto';
                nodeStyle.width = 'auto';
                nodeStyle.marginLeft = 0;
                nodeStyle.marginRight = 0;
                nodeStyle.marginTop = 0;
                break;

            case 1:
                nodeStyle.position = 'fixed';
                nodeStyle.left = el.box.left + 'px';
                nodeStyle.right = el.box.right + 'px';
                nodeStyle.top = el.numeric.top + winBounds.top + 'px';
                nodeStyle.bottom = 'auto';
                nodeStyle.width = el.computed.width;
                nodeStyle.marginLeft = 0;
                nodeStyle.marginRight = 0;
                nodeStyle.marginTop = 0;
                break;

            case 2:
                nodeStyle.position = 'absolute';
                nodeStyle.left = el.offset.left + 'px';
                nodeStyle.right = el.offset.right + 'px';
                nodeStyle.top = 'auto';
                nodeStyle.bottom = 0;
                nodeStyle.width = 'auto';
                nodeStyle.marginLeft = 0;
                nodeStyle.marginRight = 0;
                break;
        }

        el.mode = mode;
    }

    function clone(el) {
        el.clone = document.createElement('div');

        var refElement = el.node.nextSibling || el.node,
            cloneStyle = el.clone.style;

        cloneStyle.height = el.height + 'px';
        cloneStyle.width = el.width + 'px';
        cloneStyle.marginTop = el.computed.marginTop;
        cloneStyle.marginBottom = el.computed.marginBottom;
        cloneStyle.marginLeft = el.computed.marginLeft;
        cloneStyle.marginRight = el.computed.marginRight;
        cloneStyle.padding = cloneStyle.border = cloneStyle.borderSpacing = 0;
        cloneStyle.fontSize = '1em';
        cloneStyle.position = 'static';
        cloneStyle.cssFloat = el.computed.cssFloat;

        el.node.parentNode.insertBefore(el.clone, refElement);
    }

      function killClone(el) {
        if (el.clone.parentNode) {
          el.clone.parentNode.removeChild(el.clone);
        }
        el.clone = undefined;
      }

    function findBoundingElement(node) {
        if (node == document) {
            node = window;
        }

        var el;

        for (var i = 0; i < boundingElements.length; i++) {
            el = boundingElements[i];

          if (el.node === node) {
            return el;
          }
        }
        //For React rendering during tests. React is rendering in a detached DOM node
        //So during rendering we can land here without the proper path up to the document (a DIV with no parent)
        return findBoundingElement(node.parentNode ? node.parentNode : document.getElementsByTagName('body')[0]);
  }

    function getElementParams(node) {
        var computedStyle = getComputedStyle(node),
            parentNode = node.parentNode,
            parentComputedStyle = getComputedStyle(parentNode),
            cachedPosition = node.style.position,
            boundingElement = findBoundingElement(node),
            boundingOffset = getOffset(boundingElement.node);

        node.style.position = 'relative';

        var computed = {
                top: computedStyle.top,
                width: computedStyle.width,
                marginTop: computedStyle.marginTop,
                marginBottom: computedStyle.marginBottom,
                marginLeft: computedStyle.marginLeft,
                marginRight: computedStyle.marginRight,
                cssFloat: computedStyle.cssFloat
            },
            numeric = {
                top: parseNumeric(computedStyle.top),
                marginBottom: parseNumeric(computedStyle.marginBottom),
                paddingLeft: parseNumeric(computedStyle.paddingLeft),
                paddingRight: parseNumeric(computedStyle.paddingRight),
                borderLeftWidth: parseNumeric(computedStyle.borderLeftWidth),
                borderRightWidth: parseNumeric(computedStyle.borderRightWidth)
            };

        node.style.position = cachedPosition;

        var css = {
                position: node.style.position,
                top: node.style.top,
                bottom: node.style.bottom,
                left: node.style.left,
                right: node.style.right,
                width: node.style.width,
                marginTop: node.style.marginTop,
                marginLeft: node.style.marginLeft,
                marginRight: node.style.marginRight
            },
            nodeOffset = getElementOffset(node),
            parentOffset = getElementOffset(parentNode),

            parent = {
                node: parentNode,
                css: {
                    position: parentNode.style.position
                },
                computed: {
                    position: parentComputedStyle.position
                },
                numeric: {
                    borderLeftWidth: parseNumeric(parentComputedStyle.borderLeftWidth),
                    borderRightWidth: parseNumeric(parentComputedStyle.borderRightWidth),
                    borderTopWidth: parseNumeric(parentComputedStyle.borderTopWidth),
                    borderBottomWidth: parseNumeric(parentComputedStyle.borderBottomWidth)
                }
            },

            el = {
                node: node,
                box: {
                    left: nodeOffset.win.left,
                    right: html.clientWidth - nodeOffset.win.right
                },
                offset: {
                    top: nodeOffset.win.top - parentOffset.win.top - parent.numeric.borderTopWidth,
                    left: nodeOffset.win.left - parentOffset.win.left - parent.numeric.borderLeftWidth,
                    right: -nodeOffset.win.right + parentOffset.win.right - parent.numeric.borderRightWidth
                },
                css: css,
                isCell: computedStyle.display == 'table-cell',
                computed: computed,
                numeric: numeric,
                width: nodeOffset.win.right - nodeOffset.win.left,
                height: nodeOffset.win.bottom - nodeOffset.win.top,
                mode: -1,
                inited: false,
                parent: parent,
                limit: {
                    start: nodeOffset.doc.top - numeric.top + boundingOffset.top,
                    end: parentOffset.doc.top + parentNode.offsetHeight - parent.numeric.borderBottomWidth -
                    node.offsetHeight - numeric.top - numeric.marginBottom + boundingOffset.top
                }
            };

        return el;
    }

    function getDocOffsetTop(node) {
        var docOffsetTop = 0,
            boundingBox = {top: 0};

        while (node) {
            docOffsetTop += node.offsetTop;
            node = node.offsetParent;
        }

        if (node) {
            boundingBox = getBoundingBox(findBoundingElement(node).node);
        }

        return docOffsetTop+boundingBox.top;
    }

    function getElementOffset(node) {
        var box = getBoundingBox(node);

        return {
            doc: {
                top: box.top + getOffset(node).top,
                left: box.left + getOffset(node).left
            },
            win: box
        };
    }

    function startFastCheckTimer() {
        checkTimer = setInterval(function() {
            if(!fastCheck()) {
                rebuild();
            }
        }, 500);
    }

    function stopFastCheckTimer() {
        clearInterval(checkTimer);
    }

    function handlePageVisibilityChange() {
        if (!initialized) return;

        if (document[hiddenPropertyName]) {
            stopFastCheckTimer();
        }
        else {
            startFastCheckTimer();
        }
    }

    function init() {
        if (initialized) return;

        updateScrollPos();
        initAll();

        boundingElements.map(function (el) {
            el.node.addEventListener('scroll', onScroll);
            el.node.addEventListener('wheel', onWheel);

            //watch for width changes
            el.node.addEventListener('resize', rebuild);
            el.node.addEventListener('orientationchange', rebuild);
        });

        //watch for page visibility
        doc.addEventListener(visibilityChangeEventName, handlePageVisibilityChange);

        startFastCheckTimer();

        initialized = true;
    }

    function rebuild() {
        if (!initialized) return;

        deinitAll();

        for (var i = watchArray.length - 1; i >= 0; i--) {
            watchArray[i] = getElementParams(watchArray[i].node);
        }

        initAll();
    }

    function pause() {
        boundingElements.map(function (el) {
            el.node.removeEventListener('scroll', onScroll);
            el.node.removeEventListener('wheel', onWheel);
            el.node.removeEventListener('resize', rebuild);
            el.node.removeEventListener('orientationchange', rebuild);
        });
        doc.removeEventListener(visibilityChangeEventName, handlePageVisibilityChange);

        stopFastCheckTimer();

        initialized = false;
    }

    function stop() {
        pause();
        deinitAll();
    }

    function kill() {
        stop();

        //empty the array without loosing the references,
        //the most performant method according to http://jsperf.com/empty-javascript-array
        while (watchArray.length) {
            watchArray.pop();
        }
    }

    function isOverflown(node) {
        var computed = getComputedStyle(node),
            overflows = ["auto", "scroll"];


        return ["overflow", "overflow-y", "overflow-x"]
                .map(function (key) {
                    return overflows.indexOf(computed[key]) > -1;
                })
                .indexOf(true) > -1;
    }

    function addBoundingElements(node) {
        var parent = node.parentNode;

        while (parent != document) {
            if (isOverflown(parent)) {
                // only add once
                for (var i = 0; i < boundingElements.length; i++) {
                    if (boundingElements[i].node === parent) return;
                }

            boundingElements.push({node: parent,
              scroll: getOffset(parent)});
          }
          //For React rendering during tests. React is rendering in a detached DOM node
          //So during rendering we can land here without the proper path up to the document (a DIV with no parent)
          parent = parent.parentNode ? parent.parentNode : document.getElementsByTagName('body')[0];
        }
    }

    function add(node) {
        //check if Stickyfill is already applied to the node
        for (var i = watchArray.length - 1; i >= 0; i--) {
            if (watchArray[i].node === node) return;
        }

        var el = getElementParams(node);

        watchArray.push(el);
        addBoundingElements(node);

        if (!initialized) {
            init();
        }
        else {
            initElement(el);
        }
    }

    function remove(node) {
        for (var i = watchArray.length - 1; i >= 0; i--) {
            if (watchArray[i].node === node) {
                deinitElement(watchArray[i]);
                watchArray.splice(i, 1);
            }
        };
    }
    

    //expose Stickyfill
    var Stickyfill = {
        stickies: watchArray,
        add: add,
        remove: remove,
        init: init,
        rebuild: rebuild,
        pause: pause,
        stop: stop,
        kill: kill
    };
    //if jQuery is available -- create a plugin
    if (_win.jQuery) {
        (function($) {
            $.fn.Stickyfill = function(options) {
                this.each(function() {
                    Stickyfill.add(this);
                });

                return this;
            };
        })(_win.jQuery);
    }
    return Stickyfill;
});

