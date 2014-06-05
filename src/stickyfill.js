(function(doc, win) {
    
    var watchArray = [],
        scrollTop,
        recalcAllowed = true,
        initialized = false,
        docElem = doc.documentElement;

    function addEvent(el, event, func, bool) {
        if (!event) return;

        el.addEventListener? el.addEventListener(event, func, !!bool): el.attachEvent('on'+event, func);
    }

    function updateScrollPos() {
        scrollTop = docElem.scrollTop || document.body.scrollTop;

        //window.requestAnimationFrame(updateScrollPos);

        if (recalcAllowed) {
            recalcAllowed = false;
            //recalcPos();

            window.requestAnimationFrame? requestAnimationFrame(recalcPos): setTimeout(recalcPos, 15);
        }
    }

    function recalcPos() {
        for (var i = watchArray.length - 1; i >= 0; i--) {
            var currentMode = (scrollTop <= watchArray[i].top? 0: scrollTop >= watchArray[i].bottom? 2: 1);

            if (watchArray[i].mode != currentMode) {
                switchElementMode(watchArray[i], currentMode);
            }

            recalcAllowed = true;
        };
    }

    function switchElementMode(el, mode) {
        switch (mode) {
            case 0:
                if (el.clone) {
                    el.clone.parentNode.removeChild(el.clone);
                    el.clone = undefined;
                }
                el.node.style.position = el.node.style.top = el.node.style.width = '';
                break;
            case 1:
                if (!el.clone) {
                    el.clone = clone(el.node);
                    el.node.parentNode.insertBefore(el.clone, el.node);
                }
                el.node.style.position = 'fixed';
                el.node.style.top = 0;
                el.node.style.bottom = '';
                el.node.style.width = el.width + 'px';
                break;
            case 2:
                if (!el.clone) {
                    el.clone = clone(el.node);
                    el.node.parentNode.insertBefore(el.clone, el.node);
                }
                el.node.style.position = 'absolute';
                el.node.style.top = '';
                el.node.style.bottom = 0;
                el.node.style.width = el.width + 'px';
                break;
        }

        el.mode = mode;
    }

    function getElementParams(node) {
        if (!node.parentNode) return;

        var parent = node.parentNode,
            nodeOffset = getElementOffset(node),
            parentOffset = getElementOffset(parent);

        return {
            node: node,
            left: nodeOffset.left,
            top: nodeOffset.top,
            bottom: parentOffset.top + parent.clientHeight - node.offsetHeight,
            width: node.offsetWidth,
            mode: 0,
            clone: undefined
        }
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
                left: box.left + scroll.left - client.left,
                top: box.top + scroll.top - client.top
            };
    }

    function clone(node) {
        var clone = document.createElement('div');

        clone.style.height = node.offsetHeight + 'px';

        return clone;
    }

    function recalcAllParams() {
        for (var i = watchArray.length - 1; i >= 0; i--) {
            switchElementMode(watchArray[i], 0);
            watchArray[i] = getElementParams(watchArray[i].node);
        };
    }

    function reinit() {
        recalcAllParams();
        updateScrollPos();
    }

    function init() {
        updateScrollPos();
        addEvent(win, 'scroll', updateScrollPos);

        //watch for width changes
        addEvent(win, 'resize', reinit);
        addEvent(win, 'orientationchange', reinit);
    }

    win.Stickyfill = function(node) {
        watchArray.push(getElementParams(node));
        if (!initialized) init();

        return {
            reinit: reinit
        }
    }

})(document, window);