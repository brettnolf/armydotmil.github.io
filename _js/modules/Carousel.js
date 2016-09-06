/*jshint esversion: 6*/ /* ignore unnecessary semicolon */

var Helper = require('./Helper');

// const max container width
const MAX_CONTAINER_W = 1020;

// const short transition
const SHORT_TRANSITION = 40;

/**
 * Carousel
 */
class Carousel {

    /**
     * Carousel constructor
     * @param {obj} carousel - default to objects with classname 'carousel'
     */
    constructor(carousel = document.getElementsByClassName('carousel')[0]) {
        this.carousel = carousel;
        this.items = carousel.getElementsByTagName('li');
        this.itemWidth = 0;
        this.translate = {
            'x': 0,
            'y': 0
        };
        this.doEdgeTransition = false;
        this.events = {};
        this.supportsTouch = false;

        // add click listener to left/right buttons
        this.addOnClick();

        // find width of items
        this.getWidth();

        // set width of main carousel container to items width * number of items
        this.setWidth();

        // set total amount of clicks to reach the end
        this.maxClicks = Math.ceil(
            (this.carouselW - this.containerW) /
            this.itemWidth
        );
        this.clicks = 0;

        // resize function to set the size of container
        this.onResize();

        // detect browser support for translate3d and touch
        this.caniuse();
    }

    addOnClick() {
        var controls = document.getElementsByClassName('controls')[0],
            controlBtns = controls.getElementsByTagName('a'),
            i,
            len;

        // add event listeners to control buttons
        for (i = 0, len = controlBtns.length; i < len; i++) {
            this.onBtnClick(controlBtns[i]);
        }
    }

    getWidth() {
        var i,
            len;

        // use maxwidth of all the items for amount to move carousel
        for (i = 0, len = this.items.length; i < len; i++) {
            if (this.items[i].clientWidth > this.itemWidth)
                this.itemWidth = this.items[i].clientWidth;
        }
    }

    setWidth() {
        // set width of carousel to total width of all items
        this.carouselW = this.itemWidth * this.items.length;
        this.carousel.style.width = `${this.carouselW}px`;

        // set container size
        this.containerW = window.innerWidth >= MAX_CONTAINER_W ?
            MAX_CONTAINER_W :
            window.innerWidth;
    }

    caniuse() {
        var el = document.createElement('div'),
            supports3d;

        this.setStyle(
            el,
            'transform',
            'translate3d(0px, 0px, 0px)'
        );

        supports3d = el.style.cssText.match(/translate3d\(0px, 0px, 0px\)/g);

        this.supports3d = (supports3d && supports3d.length === 1);
    }

    // add css prefixes
    setStyle(el, prop, val) {
        var uc = prop.substr(0, 1).toUpperCase() + prop.substr(1);
        el.style['Webkit' + uc] = val;
        el.style['Moz' + uc] = val;
        el.style['MS' + uc] = val;
        el.style['o' + uc] = val;
        el.style[prop] = val;
    }

    // either set translate3d value or left value
    // depending on browser support
    setTranslate(val) {
        if (this.supports3d) {
            this.setStyle(
                this.carousel,
                'transform',
                `translate3d(${val}px, 0, 0)`
            );
        } else {
            this.carousel.style.left = `${val}px`;
        }
    }

    move() {
        var _this = this;

        if (_this.doEdgeTransition) {
            Helper.addClass(_this.carousel, 'quick');

            // move carousel
            _this.setTranslate(_this.translate.x);

            // setTimeout for cool effect
            setTimeout(function() {
                _this.translate.x = _this.clicks === 0 ?
                    _this.translate.x - SHORT_TRANSITION :
                    _this.translate.x + SHORT_TRANSITION;

                // move carousel
                _this.setTranslate(_this.translate.x);

                Helper.removeClass(_this.carousel, 'quick');
                _this.doEdgeTransition = false;
            }, 150);

        } else {
            // move carousel
            _this.setTranslate(_this.translate.x);
        }

        _this.disableBtn();
    }

    onBtnClick(el) {
        var _this = this;

        el.addEventListener(
            'click',
            function() {

                if (Helper.hasClass(this, 'right')) {
                    _this.next();
                } else {
                    _this.prev();
                }

                _this.move();

                return false;
            },
            false
        );
    }

    swipe(pos) {

        if (pos < 0) {
            this.next();
        } else {
            this.prev();
        }

        this.move();

        return false;
    }

    // TODO add ability to attach these functions to whatever buttons you want
    next() {

        if (this.clicks < this.maxClicks) {
            this.clicks++;

            // if we are at the end of the carousel, set translate differently
            if (this.clicks === this.maxClicks) {

                // set translate to carousel width - container width
                this.translate.x = -(this.carouselW - this.containerW);
            } else {

                // set instance translate value to clicks * item width
                this.translate.x = -(this.clicks * this.itemWidth);
            }

        } else {
            this.translate.x -= SHORT_TRANSITION;
            this.doEdgeTransition = true;
        }

    }

    prev() {

        if (this.clicks > 0) {
            this.clicks--;
            this.translate.x = -(this.clicks * this.itemWidth);
        } else {
            this.translate.x += SHORT_TRANSITION;
            this.doEdgeTransition = true;
        }

    }

    // TODO disable both buttons if there arent enough items to fill container
    // or maybe do it the other way
    // only enable the buttons if there are enough items to fill container
    // many ways to skin a cat :P
    disableBtn() {
        var btnToDisable,
            controls = document.getElementsByClassName('controls')[0],
            controlBtns = controls.getElementsByTagName('a'),
            disabled,
            i;

        // disable left button if at 0 clicks
        if (this.clicks === 0) {
            disabled = 1;
            btnToDisable = controlBtns[0];

            // disable right button if at max clicks
        } else if (this.clicks === this.maxClicks) {
            disabled = 1;
            btnToDisable = controlBtns[1];

            // else dont disable anything
        } else {
            disabled = 0;
        }

        for (i = controlBtns.length - 1; i >= 0; i--) {
            Helper.removeClass(controlBtns[i], 'disabled');
        }

        if (disabled) Helper.addClass(btnToDisable, 'disabled');
    }

    // TODO fix position of carousel on resize
    onResize() {
        var _this = this;

        window.onresize = function() {
            _this.containerW = this.innerWidth >= MAX_CONTAINER_W ?
                MAX_CONTAINER_W :
                this.innerWidth;

            // reset total amount of clicks to reach the end
            _this.maxClicks = Math.ceil(
                (_this.carouselW - _this.containerW) /
                _this.itemWidth
            );

            _this.disableBtn();
        };
    }

};

export default Carousel;
