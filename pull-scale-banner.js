/**
 * author: "oujizeng",
 * license: "MIT",
 * github: "https://github.com/yangyuji/pull-scale-banner",
 * name: "pull-scale-banner.js",
 * version: "1.0.0"
 */

(function (root, factory) {
    if (typeof module != 'undefined' && module.exports) {
        module.exports = factory();
    } else if (typeof define == 'function' && define.amd) {
        define(function () {
            return factory();
        });
    } else {
        root['pullScaleBanner'] = factory();
    }
}(this, function () {
    'use strict'

    var util = {
        getEle: function (str, scope) {
            var doc = scope || document;
            return doc.querySelector(str);
        },
        _translate: function (el, attr, val) {
            var vendors = ['', 'webkit', 'ms', 'Moz', 'O'],
                body = document.body || document.documentElement;

            [].forEach.call(vendors, function (vendor) {
                var styleAttr = vendor ? vendor + attr : attr.charAt(0).toLowerCase() + attr.substr(1);
                if (typeof body.style[styleAttr] === 'string') {
                    el.style[styleAttr] = val;
                }
            });
        },
        _transitionEnd: function (el, fun) {
            var vendors = ['webitTransitionEnd', 'transitionend'];
            var handler = function (e) {
                [].forEach.call(vendors, function (vendor) {
                    el.removeEventListener(vendor, handler, false);
                });
                fun.apply(el, arguments);
            };
            [].forEach.call(vendors, function (vendor) {
                el.addEventListener(vendor, handler, false);
            });
        }
    };

    function pullScaleBanner(opt) {
        this.moveCount = opt.moveCount || 50;               // 临界值

        // 执行完需要还原的值
        this.dragStart = 0;                              // 开始抓取标志位
        this.translateY = 0;                             // 滑动值，Y轴
        this.scale = 0;
        this.changeOneTimeFlag = 0;                      // 修改dom只执行1次标志位
        this.joinRefreshFlag = 0;                        // 进入下拉刷新状态标志位
        this.refreshFlag = 0;                            // 下拉刷新执行是控制页面假死标志位

        this.wrapper = util.getEle(opt.drager);          // 拖动区域
        this.banner = util.getEle(opt.scaler);
        this.text = util.getEle('.pull-message');
        this.bannerHeight = this.banner.offsetHeight;
        this.bannerText = this.text.textContent;

        // 采用事件驱动，不使用回调
        this._events = {};
        this._bindEvents();

        // 刷新成功监听
        this.on('success', function () {
            console.log('pull success');
            this._animateEnd(300);
        });
        // 刷新失败监听
        this.on('fail', function () {
            console.log('pull fail');
            this._animateEnd(300);
        });
    }

    pullScaleBanner.prototype = {
        destroy: function () {
            this._unbindEvents();
            this.off('before-pull');
            this.off('pull-down');
            this.off('refresh');
            this.off('success');
            this.off('fail');
        },
        _start: function (e) {
            // 正在异步操作
            if (this.refreshFlag) {
                e.preventDefault();
                return;
            }

            this.dragStart = e.touches[0].pageY;
            this.translateY = 0;
            this.scale = 0;
            util._translate(this.text, 'Transition', '');
            util._translate(this.wrapper, 'TransitionDuration', '0ms');
            util._translate(this.banner, 'TransitionDuration', '0ms');
        },
        _move: function (e) {
            // 从其他容器滑入
            if (this.dragStart === 0) {
                return;
            }
            // 正在异步操作
            if (this.refreshFlag) {
                e.preventDefault();
                return;
            }
            var moveY = (e.touches[0].pageY - this.dragStart);
            this.scale = (1 + moveY / (2 * this.bannerHeight)).toFixed(2);
            this.translateY = this.bannerHeight * (this.scale - 1);


            // 当scrolltop是0且往下滚动
            if (document.documentElement.scrollTop + document.body.scrollTop === 0
                && this.translateY > 0) {

                e.preventDefault(); // 必须

                if (!this.changeOneTimeFlag) {
                    this.emit('before-pull');
                    this.changeOneTimeFlag = 1;
                }
                this.joinRefreshFlag = 1;

                if (Math.abs(this.translateY) > this.moveCount) {
                    this.text.textContent = '松手跳转到页面';
                } else {
                    this.text.textContent = this.bannerText;
                }
                this.text.style.opacity = Math.abs(this.translateY) / this.moveCount;

                util._translate(this.wrapper, 'Transform', 'translate3d(0,' + this.translateY + 'px,0)');
                util._translate(this.banner, 'Transform', 'scale(' + this.scale + ', ' + this.scale + ')');

                this.emit('pull-down');
            }
        },
        _end: function (e) {
            if (this.translateY === 0) {
                return;
            }
            if (this.refreshFlag) {
                e.preventDefault();
                return;
            }

            // 超过刷新临界值
            if (Math.abs(this.translateY) > this.moveCount && this.joinRefreshFlag) {

                this.text.style.opacity = 1;

                util._translate(this.wrapper, 'TransitionDuration', '300ms');
                util._translate(this.wrapper, 'Transform', 'translate3d(0, '+ this.moveCount +'px,0)');

                this.scale = (1 + this.moveCount / (this.bannerHeight)).toFixed(2);
                util._translate(this.banner, 'TransitionDuration', '300ms');
                util._translate(this.banner, 'Transform', 'scale(' + this.scale + ', ' + this.scale + ')');

                // 进入下拉刷新状态
                this.refreshFlag = 1;
                this.text.textContent = '跳转成功';
                this.emit('refresh');

            } else {
                // 未超过刷新临界值
                if (this.joinRefreshFlag) {
                    this.text.textContent = '跳转取消';
                    this._animateEnd(0);
                }
            }
            // 恢复初始化状态
            this.changeOneTimeFlag = 0;
            this.joinRefreshFlag = 0;
            this.dragStart = 0;
            this.translateY = 0;
            this.scale = 0;
        },
        _cancel: function () {
            // 恢复初始化状态
            this.changeOneTimeFlag = 0;
            this.joinRefreshFlag = 0;
            this.dragStart = 0;
            this.translateY = 0;
            this.scale = 0;

            this.text.textContent = '跳转取消';
            this._animateEnd(300);
        },
        _animateEnd: function (timeout) {
            var _this = this;
            setTimeout(function () {
                util._translate(_this.text, 'Transition', 'opacity .3s');
                _this.text.style.opacity = 0;

                util._translate(_this.wrapper, 'TransitionDuration', '300ms');
                util._translate(_this.wrapper, 'Transform', 'translate3d(0,0,0)');

                util._translate(_this.banner, 'TransitionDuration', '300ms');
                util._translate(_this.banner, 'Transform', '');

                util._transitionEnd(_this.wrapper, function () {
                    _this.refreshFlag = 0;
                });
            }, timeout);
        },
        _bindEvents: function () {
            this.start = this._start.bind(this);
            this.move = this._move.bind(this);
            this.end = this._end.bind(this);
            this.cancel = this._cancel.bind(this);

            this.wrapper.addEventListener('touchstart', this.start, false);
            this.wrapper.addEventListener('touchmove', this.move, false);
            this.wrapper.addEventListener('touchend', this.end, false);
            this.wrapper.addEventListener('touchcancel', this.cancel, false);
        },
        _unbindEvents: function () {
            this.wrapper.removeEventListener('touchstart', this.start, false);
            this.wrapper.removeEventListener('touchmove', this.move, false);
            this.wrapper.removeEventListener('touchend', this.end, false);
            this.wrapper.removeEventListener('touchcancel', this.cancel, false);
        },
        // Event
        emit: function (type) {
            if (!this._events[type]) {
                return;
            }
            var i = 0,
                l = this._events[type].length;
            if (!l) {
                return;
            }
            for (; i < l; i++) {
                this._events[type][i].apply(this, [].slice.call(arguments, 1));
            }
        },
        on: function (type, fn) {
            if (!this._events[type]) {
                this._events[type] = [];
            }
            this._events[type].push(fn);
        },
        off: function (type, fn) {
            if (!this._events[type]) {
                return;
            }
            var index = this._events[type].indexOf(fn);
            if (index > -1) {
                this._events[type].splice(index, 1);
            }
        }
    };

    return pullScaleBanner;
}));