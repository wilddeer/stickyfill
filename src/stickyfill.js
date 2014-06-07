(function(doc, win) {
    var watchArray = [],
        scroll = {
            top: 0,
            left: 0
        },
        initialized = false,
        docElem = doc.documentElement,
        noop = function() {};

    //test getComputedStyle
    if (!window.getComputedStyle) {
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

    //commit seppuku!
    function seppuku() {
        init = add = rebuild = pause = stop = kill = noop;
    }

    function mergeObjects(targetObj, sourceObject) {
        for (key in sourceObject) {
            if (sourceObject.hasOwnProperty(key)) {
                targetObj[key] = sourceObject[key];
            }
        }
    }

    function parseNumeric(val) {
        return parseFloat(val) || 0;
    }

    function updateScrollPos() {
        var currentScroll = {
                top: docElem.scrollTop || document.body.scrollTop,
                left: docElem.scrollLeft || document.body.scrollLeft
            };

        if (currentScroll.left != scroll.left) {
            scroll = currentScroll;
            rebuild();
        }
        else {
            scroll = currentScroll;
            recalcAllPos();
        }
    }

    function recalcAllPos() {
        for (var i = watchArray.length - 1; i >= 0; i--) {
            recalcElementPos(watchArray[i]);
        }
    }

    function recalcElementPos(el) {
        var currentMode = (scroll.top <= el.limit.start || isNaN(parseFloat(el.computed.top))? 0: scroll.top >= el.limit.end? 2: 1);

        if (el.mode != currentMode) {
            switchElementMode(el, currentMode);
        }
    }

    function switchElementMode(el, mode) {
        switch (mode) {
            case 0:
                if (el.clone) {
                    killClone(el);
                }

                mergeObjects(el.node.style, el.css);

                el.parent.node.style.position = el.parent.css.position;
                break;

            case 1:
                if (!el.clone) {
                    clone(el);
                }
                el.node.style.position = 'fixed';
                el.node.style.left = el.box.left + 'px';
                el.node.style.top = el.css.top;
                el.node.style.bottom = 'auto';
                el.node.style.width = el.computed.width;
                el.node.style.marginTop = 0;
                break;

            case 2:
                if (!el.clone) {
                    clone(el);
                }
                el.node.style.position = 'absolute';
                el.node.style.left = 'auto';
                el.node.style.top = 'auto';
                el.node.style.bottom = 0;
                el.node.style.width = el.computed.width;
                if (el.cell) el.parent.node.style.position = 'relative';
                break;
        }

        el.mode = mode;
    }

    function clone(el) {
        var refElement = el.node.nextSibling || el.node;

        el.clone = document.createElement(el.node.tagName);

        el.clone.style.height = el.height + 'px';
        el.clone.style.width = el.width + 'px';
        el.clone.style.marginTop = el.computed.marginTop;
        el.clone.style.marginBottom = el.computed.marginBottom;
        el.clone.style.padding = el.clone.style.border = 0;

        el.node.parentNode.insertBefore(el.clone, refElement);

        if (el.cell) el.clone.appendChild(el.node);
    }

    function killClone(el) {
        if (el.cell) el.clone.parentNode.insertBefore(el.node, el.clone);
        el.clone.parentNode.removeChild(el.clone);
        el.clone = undefined;
    }

    function getElementParams(node) {
        if (!node.parentNode) return;

        var computedStyle = getComputedStyle(node),
            isCell = computedStyle.display == 'table-cell',
            cachePosition = node.style.position;

        if (win.opera || isCell) node.style.position = 'absolute';

        var computed = {
                width: computedStyle.width,
                top: computedStyle.top,
                marginTop: computedStyle.marginTop,
                marginBottom: computedStyle.marginBottom
            },
            numeric = {
                top: parseNumeric(computedStyle.top),
                marginBottom: parseNumeric(computedStyle.marginBottom),
                paddingLeft: parseNumeric(computedStyle.paddingLeft),
                paddingRight: parseNumeric(computedStyle.paddingRight),
                borderLeftWidth: parseNumeric(computedStyle.borderLeftWidth),
                borderRightWidth: parseNumeric(computedStyle.borderRightWidth)
            };

        if (win.opera || isCell) node.style.position = cachePosition;

        var css = {
                position: node.style.position,
                top: node.style.top,
                bottom: node.style.bottom,
                left: node.style.left,
                width: node.style.width,
                marginTop: node.style.marginTop
            },
            parentNode = node.offsetParent,
            nodeOffset = getElementOffset(node),
            parentOffset = getElementOffset(parentNode),
            
            parent = {
                node: parentNode,
                css: {
                    position: parentNode.style.position
                },
                numeric: {
                    borderBottomWidth: parseFloat(getComputedStyle(parentNode).borderBottomWidth) || 0
                }
            },

            el = {
                node: node,
                box: nodeOffset.win,
                css: css,
                cell: isCell,
                computed: computed,
                numeric: numeric,
                width: node.offsetWidth,
                height: node.offsetHeight,
                mode: 0,
                parent: parent,
                clone: undefined,
                limit: {
                    start: nodeOffset.doc.top - numeric.top,
                    end: parentOffset.doc.top + parentNode.offsetHeight - parent.numeric.borderBottomWidth -
                        node.offsetHeight - numeric.top - numeric.marginBottom
            }
        };

        return el;
    }

    function getElementOffset(node) {
        var client = {
                top: document.documentElement.clientTop || document.body.clientTop || 0,
                left: document.documentElement.clientLeft || document.body.clientLeft || 0
            },
            scroll = {
                top: win.pageYOffset || docElem.scrollTop,
                left: win.pageXOffset || docElem.scrollLeft
            },
            box = node.getBoundingClientRect();

            return {
                doc: {
                    left: box.left + scroll.left - client.left,
                    top: box.top + scroll.top - client.top
                },
                win: box
            };
    }

    function recalcAllParams() {
        for (var i = watchArray.length - 1; i >= 0; i--) {
            switchElementMode(watchArray[i], 0);
            watchArray[i] = getElementParams(watchArray[i].node);
        }
    }  

    function init() {
        if (initialized) return;

        updateScrollPos();
        win.addEventListener('scroll', updateScrollPos);

        //watch for width changes
        win.addEventListener('resize', rebuild);
        win.addEventListener('orientationchange', rebuild);

        initialized = true;
    }

    function rebuild() {
        recalcAllParams();
        updateScrollPos();
    }

    function pause() {
        win.removeEventListener('scroll', updateScrollPos);
        win.removeEventListener('resize', rebuild);
        win.removeEventListener('orientationchange', rebuild);

        initialized = false;
    }

    function stop() {
        pause();
        for (var i = watchArray.length - 1; i >= 0; i--) {
            switchElementMode(watchArray[i], 0);
        }   
    }

    function kill() {
        stop();
        watchArray = [];
    }

    function add(node) {
        watchArray.push(getElementParams(node));
        if (!initialized) {
            init();
        }
        else {
            recalcElementPos(watchArray[watchArray.length - 1]);
        }
    }

    //expose Stickyfill
    win.Stickyfill = {
        stickies: watchArray,
        add: add,
        init: init,
        rebuild: rebuild,
        pause: pause,
        stop: stop,
        kill: kill
    };
})(document, window);


//if jQuery is available -- create a plugin
if (window.jQuery) {
    (function($) {
        $.fn.Stickyfill = function(options) {
            this.each(function() {
                Stickyfill.add(this);
            });

            return this;
        };
    })(window.jQuery);
}
