'use strict';

module.exports = function(callback) {
    let timeout = null;
    let touchStart = {};

    function triggerCallback() {
        document.documentElement.removeEventListener('mouseleave', onMouseLeave);
        document.documentElement.removeEventListener('mouseenter', onMouseEnter);
        document.documentElement.removeEventListener('click', clearTimeout);
        window.removeEventListener('touchstart', onTouchStart);
        window.removeEventListener('touchend', onTouchEnd);
        callback();
    }

    function clearTimeout() {
        if (timeout === null) {
            return;
        }

        window.clearTimeout(timeout);
        timeout = null;
    }

    function onMouseEnter(evt) {
        clearTimeout();
    }

    function getAddressBarY() {
        if (document.documentMode || /Edge\//.test(navigator.userAgent)) {
            return 5;
        }

        return 0;
    }

    function onMouseLeave(evt) {
        clearTimeout();

        // did mouse leave at top of window?
        // add small exception space in the top-right corner
        if( evt.clientY <= getAddressBarY() && evt.clientX < ( 0.80 * window.innerWidth)) {
            timeout = window.setTimeout(triggerCallback, 400);
        }
    }

    function onTouchStart(evt) {
        clearTimeout();
        touchStart = {
            timestamp: performance.now(),
            scrollY: window.scrollY,
            windowHeight: window.innerHeight,
        };
    }

    function onTouchEnd(evt) {
        clearTimeout();

        // did address bar appear?
        if (window.innerHeight > touchStart.windowHeight) {
            return;
        }

        // allow a tiny tiny margin for error, to not fire on clicks
        if ((window.scrollY + 20) >= touchStart.scrollY) {
            return;
        }

        if (performance.now() - touchStart.timestamp > 300) {
            return;
        }

        if (['A', 'INPUT', 'BUTTON'].indexOf(evt.target.tagName) > -1) {
            return;
        }

        timeout = window.setTimeout(triggerCallback, 800);
    }

    window.addEventListener('touchstart', onTouchStart);
    window.addEventListener('touchend', onTouchEnd);
    document.documentElement.addEventListener('mouseenter', onMouseEnter);
    document.documentElement.addEventListener('mouseleave', onMouseLeave);
    document.documentElement.addEventListener('click', clearTimeout);
};