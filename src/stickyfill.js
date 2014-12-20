(function(doc, win) {
    var html = doc.documentElement,
        noop = function() {},
        scroll,

        //visibility API strings
        hiddenPropertyName = 'hidden',
        visibilityChangeEventName = 'visibilitychange';

    /* feature checks */

    //fallback to prefixed names in old webkit browsers
    if (doc.webkitHidden !== undefined) {
        hiddenPropertyName = 'webkitHidden';
        visibilityChangeEventName = 'webkitvisibilitychange';
    }

    //test getComputedStyle
    if (!win.getComputedStyle) {
        seppuku();
    }

    //test for native support
    (function() {
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
    })();

    /* utility functions */

    //simple merge
    function mergeObjects(targetObj, sourceObject) {
        for (key in sourceObject) {
            if (sourceObject.hasOwnProperty(key)) {
                targetObj[key] = sourceObject[key];
            }
        }
    }

    //parses float, returns 0 if the `val` is empty
    function parseNumeric(val) {
        return parseFloat(val) || 0;
    }

    function getDocOffsetTop(node) {
        var docOffsetTop = 0;

        while (node) {
            docOffsetTop += node.offsetTop;
            node = node.offsetParent;
        }

        return docOffsetTop;
    }

    function getElementOffset(node) {
        var box = node.getBoundingClientRect();

        return {
            doc: {
                top: box.top + win.pageYOffset,
                left: box.left + win.pageXOffset
            },
            win: box
        };
    }


    //Stickyfill constructor
    function Stickyfill() {
        this.watchArray = [];
        this._turnedOn = false;
        this._updateScrollPos();
        this.turnOn();
    }

    Stickyfill.prototype = {
        refresh: function() {
            var _this = this;

            for (var i = this.watchArray.length - 1; i >= 0; i--) {
                _this.watchArray[i].refresh();
            }
        },

        turnOn: function() {
            if (this._turnedOn) return;

            this._addListeners();
            this._turnOnAll();
            this._turnedOn = true;
        },

        turnOff: function() {
            if (!this._turnedOn) return;

            this._removeListeners();
            this._turnOffAll();
            this._turnedOn = false;
        },

        kill: function() {
            var _this = this;

            this.turnOff();

            //empty the array without loosing the references,
            //the most performant method according to http://jsperf.com/empty-javascript-array
            while (this.watchArray.length) {
                _this.watchArray.pop();
            }
        },

        add: function(node) {
            var _this = this;

            //check if Stickyfill is already applied to the node
            for (var i = this.watchArray.length - 1; i >= 0; i--) {
                if (_this.watchArray[i].node === node) return;
            }

            var el = new Sticky(this, node);

            this.watchArray.push(el);

            el.turnOn();

            if (this.watchArray.length === 1) this.turnOn();
        },

        remove: function(node) {
            var _this = this;

            for (var i = this.watchArray.length - 1; i >= 0; i--) {
                if (_this.watchArray[i].node === node) {
                    _this.watchArray[i].turnOff();
                    _this.watchArray.splice(i, 1);
                }
            }

            if (!this.watchArray.length) this.turnOff();
        },

        seppuku: function() {
            for (var method in this) {
                if (this.hasOwnProperty(method) && typeof method == 'function') {
                    method = noop;
                }
            }
        },

        _addListeners: function() {
            var _this = this;
            win.addEventListener('scroll', function() {
                _this._scrollListener = arguments.calee;
                _this._onScroll();
            });
            win.addEventListener('wheel', function() {
                _this._wheelListener = arguments.calee;
                _this._onWheel();
            });

            //watch for width changes
            win.addEventListener('resize', function() {
                _this._resizeListener = arguments.calee;
                _this.refresh();
            });
            win.addEventListener('orientationchange', function() {
                _this._orientationchangeListener = arguments.calee;
                _this.refresh();
            });

            //watch for page visibility
            doc.addEventListener(visibilityChangeEventName, function() {
                _this._visibilitychangeListener = arguments.calee;
                _this._handlePageVisibilityChange();
            });

            this._startFastCheckTimer();
        },

        _removeListeners: function() {
            win.removeEventListener('scroll', this._scrollListener);
            win.removeEventListener('wheel', this._wheelListener);
            win.removeEventListener('resize', this._resizeListener);
            win.removeEventListener('orientationchange', this._orientationchangeListener);
            doc.removeEventListener(visibilityChangeEventName, this._visibilitychangeListener);

            this._stopFastCheckTimer();
        },

        //checks whether stickies start or stop positions have changed
        _fastCheck: function() {
            var _this = this;

            for (var i = this.watchArray.length - 1; i >= 0; i--) {
                _this.watchArray[i]._fastCheck();
            }
        },

        _recalcModeAll: function() {
            var _this = this;

            for (var i = this.watchArray.length - 1; i >= 0; i--) {
                _this.watchArray[i]._recalcMode();
            }
        },

        _turnOnAll: function() {
            var _this = this;

            for (var i = this.watchArray.length - 1; i >= 0; i--) {
                _this.watchArray[i].turnOn();
            }
        },

        _turnOffAll: function() {
            var _this = this;

            for (var i = this.watchArray.length - 1; i >= 0; i--) {
                _this.watchArray[i].turnOff();
            }
        },

        _startFastCheckTimer: function() {
            var _this = this;

            this._checkTimer = setInterval(function() {
                _this._fastCheck();
            }, 500);
        },

        _stopFastCheckTimer: function() {
            clearInterval(this._checkTimer);
        },

        _updateScrollPos: function() {
            scroll = {
                top: win.pageYOffset,
                left: win.pageXOffset
            };
        },

        _onScroll: function() {
            if (win.pageXOffset != scroll.left) {
                this._updateScrollPos();
                this.refresh();
                return;
            }

            if (win.pageYOffset != scroll.top) {
                this._updateScrollPos();
                this._recalcModeAll();
            }
        },

        //fixes flickering
        _onWheel: function(event) {
            var _this = this;

            setTimeout(function() {
                if (win.pageYOffset != scroll.top) {
                    _this._updateScrollPos();
                    _this._recalcModeAll();
                }
            }, 0);
        },

        _handlePageVisibilityChange: function() {
            if (!this._turnedOn) return;

            if (document[hiddenPropertyName]) {
                stopFastCheckTimer();
            }
            else {
                startFastCheckTimer();
            }
        }
    };

    //Sticky constructor
    function Sticky(stickyfill, node) {
        this.stickyfill = stickyfill;
        this.node = node;
        this.init();
    }

    Sticky.prototype = {
        init: function() {
            var node = this.node,
                computedStyle = getComputedStyle(node),
                parentNode = node.parentNode,
                parentComputedStyle = getComputedStyle(parentNode),
                cachedPosition = node.style.position,
                nodeOffset,
                parentOffset;

            node.style.position = 'relative';

            this.computed = {
                top: computedStyle.top,
                marginTop: computedStyle.marginTop,
                marginBottom: computedStyle.marginBottom,
                marginLeft: computedStyle.marginLeft,
                marginRight: computedStyle.marginRight,
                cssFloat: computedStyle.cssFloat
            };

            this.numeric = {
                top: parseNumeric(computedStyle.top),
                marginBottom: parseNumeric(computedStyle.marginBottom),
                paddingLeft: parseNumeric(computedStyle.paddingLeft),
                paddingRight: parseNumeric(computedStyle.paddingRight),
                borderLeftWidth: parseNumeric(computedStyle.borderLeftWidth),
                borderRightWidth: parseNumeric(computedStyle.borderRightWidth)
            };

            node.style.position = cachedPosition;

            this.css = {
                position: node.style.position,
                top: node.style.top,
                bottom: node.style.bottom,
                left: node.style.left,
                right: node.style.right,
                width: node.style.width,
                marginTop: node.style.marginTop,
                marginLeft: node.style.marginLeft,
                marginRight: node.style.marginRight
            };

            nodeOffset = getElementOffset(node);
            parentOffset = getElementOffset(parentNode);

            this.parent = {
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
            };

            this.box = {
                left: nodeOffset.win.left,
                right: html.clientWidth - nodeOffset.win.right
            };

            this.offset = {
                top: nodeOffset.win.top - parentOffset.win.top - this.parent.numeric.borderTopWidth,
                left: nodeOffset.win.left - parentOffset.win.left - this.parent.numeric.borderLeftWidth,
                right: -nodeOffset.win.right + parentOffset.win.right - this.parent.numeric.borderRightWidth
            };

            this.isCell = computedStyle.display == 'table-cell';
            this.width = nodeOffset.win.right - nodeOffset.win.left;
            this.height = nodeOffset.win.bottom - nodeOffset.win.top;
            this.mode = -1;
            this.turnedOn = false;
            this.limit = {
                start: nodeOffset.doc.top - this.numeric.top,
                end: parentOffset.doc.top + parentNode.offsetHeight - this.parent.numeric.borderBottomWidth -
                     node.offsetHeight - this.numeric.top - this.numeric.marginBottom
            };
        },

        turnOn: function() {
            if (isNaN(parseFloat(this.computed.top)) || this.isCell) return;

            this.turnedOn = true;

            if (!this.clone) this._makeClone();
            if (this.parent.computed.position != 'absolute' &&
                this.parent.computed.position != 'relative') this.parent.node.style.position = 'relative';

            this._recalcMode();

            //getting this stuff after clone is in place to prevent browser box model
            //rounding errors to affect the calculations
            this.parent.height = this.parent.node.offsetHeight;
            this.docOffsetTop = getDocOffsetTop(this.clone);
        },

        turnOff: function() {
            var _this = this,
                deinitParent = true;

            this.clone && this._killClone();
            mergeObjects(this.node.style, this.css);

            //check whether element's parent is used by other stickies
            for (var i = this.stickyfill.watchArray.length - 1; i >= 0; i--) {
                if (_this.stickyfill.watchArray[i].node !== _this.node && _this.stickyfill.watchArray[i].parent.node === this.parent.node) {
                    deinitParent = false;
                    break;
                }
            };

            if (deinitParent) this.parent.node.style.position = this.parent.css.position;
            this.mode = -1;
            this.turnedOn = false;
        },

        refresh: function() {
            this.turnOff();
            this.init();
            this.turnOn();
        },

        _makeClone: function() {
            if (this.clone) this.killClone();

            var refElement = this.node.nextSibling || this.node;

            this.clone = document.createElement('div');

            mergeObjects(this.clone.style, {
                height: this.height + 'px',
                width: this.width + 'px',
                marginTop: this.computed.marginTop,
                marginBottom: this.computed.marginBottom,
                marginLeft: this.computed.marginLeft,
                marginRight: this.computed.marginRight,
                padding: 0,
                border: 0,
                borderSpacing: 0,
                fontSize: '1em',
                position: 'static',
                cssFloat: this.computed.cssFloat
            });

            this.node.parentNode.insertBefore(this.clone, refElement);
        },

        _killClone: function() {
            this.clone.parentNode.removeChild(this.clone);
            this.clone = undefined;
        },

        //get corresponding mode
        _recalcMode: function() {
            if (!this.turnedOn) return;

            var mode = (scroll.top <= this.limit.start? 0: scroll.top >= this.limit.end? 2: 1);

            if (this.mode === mode) return;

            switch (mode) {
                case 0:
                    mergeObjects(this.node.style, {
                        position: 'absolute',
                        left: this.offset.left + 'px',
                        right: this.offset.right + 'px',
                        top: this.offset.top + 'px',
                        bottom: 'auto',
                        width: 'auto',
                        marginLeft: 0,
                        marginRight: 0,
                        marginTop: 0
                    });

                    break;

                case 1:
                    mergeObjects(this.node.style, {
                        position: 'fixed',
                        left: this.box.left + 'px',
                        right: this.box.right + 'px',
                        top: this.css.top,
                        bottom: 'auto',
                        width: 'auto',
                        marginLeft: 0,
                        marginRight: 0,
                        marginTop: 0
                    });

                    break;

                case 2:
                    mergeObjects(this.node.style, {
                        position: 'absolute',
                        left: this.offset.left + 'px',
                        right: this.offset.right + 'px',
                        top: 'auto',
                        bottom: 0,
                        width: 'auto',
                        marginLeft: 0,
                        marginRight: 0
                    });

                    break;
            }

            this.mode = mode;
        },

        _fastCheck: function() {
            if (!this.turnedOn) return;

            var deltaTop = Math.abs(getDocOffsetTop(this.clone) - this.docOffsetTop),
                deltaHeight = Math.abs(this.parent.node.offsetHeight - this.parent.height);

            if (deltaTop >= 2 || deltaHeight >= 2) this.refresh();
        }
    };

    win.Stickyfill = new Stickyfill;
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
