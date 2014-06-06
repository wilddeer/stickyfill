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

    function updateScrollPos() {
        var currentScroll = {
                top: docElem.scrollTop || document.body.scrollTop,
                left: docElem.scrollLeft || document.body.scrollLeft
            }

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
                el.node.style.position = el.css.position;
                el.node.style.width = el.css.width;
                el.node.style.top = el.css.top;
                el.node.style.bottom = el.css.bottom;
                el.node.style.left = el.css.left;
                el.node.style.marginTop = el.css.marginTop;
                /*el.node.style.WebkitBoxSizing = el.css.WebkitBoxSizing;
                el.node.style.MozBoxSizing = el.css.MozBoxSizing;
                el.node.style.boxSizing = el.css.boxSizing;*/
                el.parent.node.style.position = el.parent.css.position;
                break;

            case 1:
                if (!el.clone) {
                    clone(el);
                }
                el.node.style.position = 'fixed';
                el.node.style.left = el.box.left + 'px';
                el.node.style.top = el.computed.top;
                el.node.style.bottom = 'auto';
                el.node.style.width = el.width + 'px';
                el.node.style.marginTop = 0;
                /*el.node.style.boxSizing = el.node.style.WebkitBoxSizing =
                    el.node.style.MozBoxSizing = 'border-box';*/
                break;

            case 2:
                if (!el.clone) {
                    clone(el);
                }
                el.node.style.position = 'absolute';
                el.node.style.left = 'auto';
                el.node.style.top = 'auto';
                el.node.style.bottom = 0;
                el.node.style.width = el.width + 'px';
                /*el.node.style.boxSizing = el.node.style.WebkitBoxSizing =
                    el.node.style.MozBoxSizing = 'border-box';*/
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
        el.clone.style.paddingTop = el.clone.style.paddingRight =
            el.clone.style.paddingBottom = el.clone.style.paddingLeft = 0;

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

        var parent = node.offsetParent,
            nodeOffset = getElementOffset(node),
            parentOffset = getElementOffset(parent);

        var el = {
            node: node,
            box: nodeOffset.win,
            css: {
                position: node.style.position,
                top: node.style.top,
                bottom: node.style.bottom,
                left: node.style.left,
                right: node.style.right,
                width: node.style.width,
                marginTop: node.style.marginTop,
                marginBottom: node.style.marginBottom/*,
                boxSizing: node.style.boxSizing,
                WebkitBoxSizing: node.style.WebkitBoxSizing,
                MozBoxSizing: node.style.MozBoxSizing*/
            },
            cell: getComputedStyle(node).display == 'table-cell',
            computed: getElementStyleProps(node, 'top marginTop marginBottom'),
            width: node.offsetWidth,
            height: node.offsetHeight,
            mode: 0,
            parent: {
                node: parent,
                css: {
                    position: parent.style.position
                }
            },
            clone: undefined
        };

        var numericTop = parseFloat(el.computed.top) || 0,
            numericMarginBottom = parseFloat(el.computed.marginBottom) || 0,
            numericParentBorderBottomWidth = parseFloat(getElementStyleProps(parent, 'borderBottomWidth')) || 0;

        el.limit = {
            start: nodeOffset.doc.top - numericTop,
            end: parentOffset.doc.top + parent.offsetHeight - numericParentBorderBottomWidth - node.offsetHeight - numericTop - numericMarginBottom
        }

        el.cell = getComputedStyle(node).display == 'table-cell';

        return el;
    }

    function getElementStyleProps(node, props) {
        var absProps = (!!window.opera || getComputedStyle(node).display == 'table-cell'),
            result = {};

        props = props.split(' ');

        absProps && (node.style.position = 'absolute');
        for (var i = props.length - 1; i >= 0; i--) {
            result[props[i]] = getComputedStyle(node)[props[i]];
        }
        absProps && (node.style.position = '');

        return props.length > 1? result: result[props[0]];
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
