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

            this._updateScrollPos();
            this._addListeners();
            this._turnOnAllStickies();
            this._turnedOn = true;
        },

        turnOff: function() {
            if (!this._turnedOn) return;

            this._removeListeners();
            this._turnOffAllStickies();
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
            win.addEventListener('scroll', _this._scrollListener = function() {
                _this._onScroll();
            });
            win.addEventListener('wheel', _this._wheelListener = function() {
                _this._onWheel();
            });

            //watch for width changes
            win.addEventListener('resize', _this._resizeListener = function() {
                _this.refresh();
            });
            win.addEventListener('orientationchange', _this._orientationchangeListener = function() {
                _this.refresh();
            });

            //watch for page visibility
            doc.addEventListener(visibilityChangeEventName, _this._visibilitychangeListener = function() {
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
        _dirtyCheck: function() {
            var _this = this;

            for (var i = this.watchArray.length - 1; i >= 0; i--) {
                _this.watchArray[i]._dirtyCheck();
            }
        },

        _recalcModeAllStickies: function() {
            var _this = this;

            for (var i = this.watchArray.length - 1; i >= 0; i--) {
                _this.watchArray[i]._recalcMode();
            }
        },

        _turnOnAllStickies: function() {
            var _this = this;

            for (var i = this.watchArray.length - 1; i >= 0; i--) {
                _this.watchArray[i].turnOn();
            }
        },

        _turnOffAllStickies: function() {
            var _this = this;

            for (var i = this.watchArray.length - 1; i >= 0; i--) {
                _this.watchArray[i].turnOff();
            }
        },

        _startFastCheckTimer: function() {
            var _this = this;

            this._checkTimer = setInterval(function() {
                _this._dirtyCheck();
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
                this._recalcModeAllStickies();
            }
        },

        //fixes flickering
        _onWheel: function(event) {
            var _this = this;

            setTimeout(function() {
                if (win.pageYOffset != scroll.top) {
                    _this._updateScrollPos();
                    _this._recalcModeAllStickies();
                }
            }, 0);
        },

        _handlePageVisibilityChange: function() {
            if (!this._turnedOn) return;

            if (document[hiddenPropertyName]) {
                this._stopFastCheckTimer();
            }
            else {
                this._startFastCheckTimer();
            }
        }
    };

    //Sticky constructor
    function Sticky(stickyfill, node) {
        this.stickyfill = stickyfill;
        this.node = node;
        this._turnedOn = false;
        this._getParams();
    }

    Sticky.prototype = {
        _getParams: function() {
            var node = this.node,
                computedStyle = getComputedStyle(node),
                parentNode = node.parentNode,
                parentComputedStyle = getComputedStyle(parentNode),
                cachedPosition = node.style.position,
                nodeOffset,
                parentOffset;

            node.style.position = 'relative';

            this._p = {};
            this._p.computed = {
                top: computedStyle.top,
                marginTop: computedStyle.marginTop,
                marginBottom: computedStyle.marginBottom,
                marginLeft: computedStyle.marginLeft,
                marginRight: computedStyle.marginRight,
                cssFloat: computedStyle.cssFloat
            };

            this._p.numeric = {
                top: parseNumeric(computedStyle.top),
                marginBottom: parseNumeric(computedStyle.marginBottom),
                paddingLeft: parseNumeric(computedStyle.paddingLeft),
                paddingRight: parseNumeric(computedStyle.paddingRight),
                borderLeftWidth: parseNumeric(computedStyle.borderLeftWidth),
                borderRightWidth: parseNumeric(computedStyle.borderRightWidth)
            };

            node.style.position = cachedPosition;

            this._p.css = {
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

            this._p.parent = {
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

            this._p.box = {
                left: nodeOffset.win.left,
                right: html.clientWidth - nodeOffset.win.right
            };

            this._p.offset = {
                top: nodeOffset.win.top - parentOffset.win.top - this._p.parent.numeric.borderTopWidth,
                left: nodeOffset.win.left - parentOffset.win.left - this._p.parent.numeric.borderLeftWidth,
                right: -nodeOffset.win.right + parentOffset.win.right - this._p.parent.numeric.borderRightWidth
            };

            this._p.width = nodeOffset.win.right - nodeOffset.win.left;
            this._p.height = nodeOffset.win.bottom - nodeOffset.win.top;

            this._isCell = computedStyle.display == 'table-cell';
            this._mode = -1;
            this._turnedOn = false;
            this._limit = {
                start: nodeOffset.doc.top - this._p.numeric.top,
                end: parentOffset.doc.top + parentNode.offsetHeight - this._p.parent.numeric.borderBottomWidth -
                     node.offsetHeight - this._p.numeric.top - this._p.numeric.marginBottom
            };
        },

        turnOn: function() {
            if (this._turnedOn) return;
            if (isNaN(parseFloat(this._p.computed.top)) || this._isCell) return;

            this._turnedOn = true;

            if (!this._clone) this._makeClone();
            if (this._p.parent.computed.position != 'absolute' &&
                this._p.parent.computed.position != 'relative') this._p.parent.node.style.position = 'relative';

            this._recalcMode();

            //getting this stuff after clone is in place to prevent browser box model
            //rounding errors to affect the calculations
            this._p.parent.height = this._p.parent.node.offsetHeight;
            this._p.docOffsetTop = getDocOffsetTop(this._clone);
        },

        turnOff: function() {
            if (!this._turnedOn) return;
            var _this = this,
                deinitParent = true;

            this._clone && this._killClone();
            mergeObjects(this.node.style, this._p.css);

            //check whether element's parent is used by other stickies
            for (var i = this.stickyfill.watchArray.length - 1; i >= 0; i--) {
                if (_this.stickyfill.watchArray[i].node !== _this.node && _this.stickyfill.watchArray[i]._p.parent.node === this._p.parent.node) {
                    deinitParent = false;
                    break;
                }
            };

            if (deinitParent) this._p.parent.node.style.position = this._p.parent.css.position;
            this._mode = -1;
            this._turnedOn = false;
        },

        refresh: function() {
            this.turnOff();
            this._getParams();
            this.turnOn();
        },

        _makeClone: function() {
            if (this._clone) this._killClone();

            var refElement = this.node.nextSibling || this.node;

            this._clone = document.createElement('div');

            mergeObjects(this._clone.style, {
                height: this._p.height + 'px',
                width: this._p.width + 'px',
                marginTop: this._p.computed.marginTop,
                marginBottom: this._p.computed.marginBottom,
                marginLeft: this._p.computed.marginLeft,
                marginRight: this._p.computed.marginRight,
                padding: 0,
                border: 0,
                borderSpacing: 0,
                fontSize: '1em',
                position: 'static',
                cssFloat: this._p.computed.cssFloat
            });

            this.node.parentNode.insertBefore(this._clone, refElement);
        },

        _killClone: function() {
            this._clone.parentNode.removeChild(this._clone);
            this._clone = undefined;
        },

        //get corresponding mode
        _recalcMode: function() {
            if (!this._turnedOn) return;

            var mode = (scroll.top <= this._limit.start? 0: scroll.top >= this._limit.end? 2: 1);

            if (this._mode === mode) return;

            switch (mode) {
                case 0:
                    mergeObjects(this.node.style, {
                        position: 'absolute',
                        left: this._p.offset.left + 'px',
                        right: this._p.offset.right + 'px',
                        top: this._p.offset.top + 'px',
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
                        left: this._p.box.left + 'px',
                        right: this._p.box.right + 'px',
                        top: this._p.css.top,
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
                        left: this._p.offset.left + 'px',
                        right: this._p.offset.right + 'px',
                        top: 'auto',
                        bottom: 0,
                        width: 'auto',
                        marginLeft: 0,
                        marginRight: 0
                    });

                    break;
            }

            this._mode = mode;
        },

        _dirtyCheck: function() {
            if (!this._turnedOn) return;

            var deltaTop = Math.abs(getDocOffsetTop(this._clone) - this._p.docOffsetTop),
                deltaHeight = Math.abs(this._p.parent.node.offsetHeight - this._p.parent.height);

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
