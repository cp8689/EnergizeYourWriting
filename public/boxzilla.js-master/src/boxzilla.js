'use strict';

const EventEmitter = require('wolfy87-eventemitter');
const Timer = require('./timer.js');
const Boxzilla = Object.create(EventEmitter.prototype);
const Box = require('./box.js')(Boxzilla);
let boxes = [];
let overlay;
let scrollElement = window;
let siteTimer;
let pageTimer;
let pageViews;
let initialised = false;

const styles = require('./styles.js');
const ExitIntent = require('./triggers/exit-intent.js');

function throttle(fn, threshhold, scope) {
    threshhold || (threshhold = 250);
    var last,
        deferTimer;
    return function () {
        var context = scope || this;

        var now = +new Date,
            args = arguments;
        if (last && now < last + threshhold) {
            // hold on to it
            clearTimeout(deferTimer);
            deferTimer = setTimeout(function () {
                last = now;
                fn.apply(context, args);
            }, threshhold);
        } else {
            last = now;
            fn.apply(context, args);
        }
    };
}

// "keyup" listener
function onKeyUp(e) {
    if (e.keyCode === 27) {
        Boxzilla.dismiss();
    }
}

// check "pageviews" criteria for each box
function checkPageViewsCriteria() {

    // don't bother if another box is currently open
    if( isAnyBoxVisible() ) {
        return;
    }

    boxes.forEach(function(box) {
        if( ! box.mayAutoShow() ) {
            return;
        }

        if( box.config.trigger.method === 'pageviews' && pageViews >= box.config.trigger.value ) {
            box.trigger();
        }
    });
}

// check time trigger criteria for each box
function checkTimeCriteria() {
    // don't bother if another box is currently open
    if( isAnyBoxVisible() ) {
        return;
    }

    boxes.forEach(function(box) {
        if( ! box.mayAutoShow() ) {
            return;
        }

        // check "time on site" trigger
        if (box.config.trigger.method === 'time_on_site' && siteTimer.time >= box.config.trigger.value) {
            box.trigger();
        }

        // check "time on page" trigger
        if (box.config.trigger.method === 'time_on_page' && pageTimer.time >= box.config.trigger.value) {
            box.trigger();
        }
    });
}

// check triggerHeight criteria for all boxes
function checkHeightCriteria() {

  var scrollY = scrollElement.hasOwnProperty('pageYOffset') ? scrollElement.pageYOffset : scrollElement.scrollTop;
  scrollY = scrollY + window.innerHeight * 0.9;

  boxes.forEach(function(box) {
      if( ! box.mayAutoShow() || box.triggerHeight <= 0 ) {
          return;
      }

      if( scrollY > box.triggerHeight ) {
          // don't bother if another box is currently open
          if( isAnyBoxVisible() ) {
              return;
          }

          // trigger box
          box.trigger();
      } 
    
      // if box may auto-hide and scrollY is less than triggerHeight (with small margin of error), hide box
      if( box.mayRehide() && scrollY < ( box.triggerHeight - 5 ) ) {
          box.hide();
      }
  });
}

// recalculate heights and variables based on height
function recalculateHeights() {
    boxes.forEach(function(box) {
        box.onResize();
    });
}

function onOverlayClick(e) {
    var x = e.offsetX;
    var y = e.offsetY;

    // calculate if click was less than 40px outside box to avoid closing it by accident
    boxes.forEach(function(box) {
        var rect = box.element.getBoundingClientRect();
        var margin = 40;

        // if click was not anywhere near box, dismiss it.
        if( x < ( rect.left - margin ) || x > ( rect.right + margin ) || y < ( rect.top - margin ) || y > ( rect.bottom + margin ) ) {
            box.dismiss();
        }
    });
}

function showBoxesWithExitIntentTrigger() {
    // do nothing if already triggered OR another box is visible.
    if (isAnyBoxVisible() ) {
        return;
    }

    boxes.forEach(function(box) {
        if(box.mayAutoShow() && box.config.trigger.method === 'exit_intent' ) {
            box.trigger();
        }
    });

}

function isAnyBoxVisible() {
    return boxes.filter(b => b.visible).length > 0
}


function onElementClick(e) {
  // find <a> element in up to 3 parent elements
  var el = e.target || e.srcElement;
  var depth = 3
  for(var i=0; i<=depth; i++) {
    if(!el || el.tagName === 'A') {
      break;
    }

    el = el.parentElement;
  }

  if( ! el || el.tagName !== 'A' || ! el.getAttribute('href') ) {
    return;
  }

  const href = el.getAttribute('href').toLowerCase();
  const match = href.match(/[#&]boxzilla-(\d+)/);

  if( match && match.length > 1) {
      const boxId = match[1];
      Boxzilla.toggle(boxId);
  }
}

const timers = {
    start: function() {
        try{
          var sessionTime = sessionStorage.getItem('boxzilla_timer');
          if( sessionTime ) siteTimer.time = sessionTime;
        } catch(e) {}
        siteTimer.start();
        pageTimer.start();
    },
    stop: function() {
        sessionStorage.setItem('boxzilla_timer', siteTimer.time);
        siteTimer.stop();
        pageTimer.stop();
    }
};

// initialise & add event listeners
Boxzilla.init = function() {
    if (initialised) {
        return;
    }

    document.body.addEventListener('click', onElementClick, true);

    try{
      pageViews = sessionStorage.getItem('boxzilla_pageviews') || 0;
    } catch(e) {
      pageViews = 0;
    }

    siteTimer = new Timer(0);
    pageTimer = new Timer(0);

    // insert styles into DOM
    var styleElement = document.createElement('style');
    styleElement.setAttribute("type", "text/css");
    styleElement.innerHTML = styles;
    document.head.appendChild(styleElement);

    // add overlay element to dom
    overlay = document.createElement('div');
    overlay.style.display = 'none';
    overlay.id = 'boxzilla-overlay';
    document.body.appendChild(overlay);

    // init exit intent trigger
    new ExitIntent(showBoxesWithExitIntentTrigger)

    scrollElement.addEventListener('touchstart', throttle(checkHeightCriteria), true );
    scrollElement.addEventListener('scroll', throttle(checkHeightCriteria), true );
    window.addEventListener('resize', throttle(recalculateHeights));
    window.addEventListener('load', recalculateHeights );
    overlay.addEventListener('click', onOverlayClick);
    window.setInterval(checkTimeCriteria, 1000);
    window.setTimeout(checkPageViewsCriteria, 1000 );
    document.addEventListener('keyup', onKeyUp);

    timers.start();
    window.addEventListener('focus', timers.start);
    window.addEventListener('beforeunload', function() {
        timers.stop();
        sessionStorage.setItem('boxzilla_pageviews', ++pageViews);
    });
    window.addEventListener('blur', timers.stop);

    Boxzilla.trigger('ready');
    initialised = true; // ensure this function doesn't run again
};

/**
 * Create a new Box
 *
 * @param string id
 * @param object opts
 *
 * @returns Box
 */
Boxzilla.create = function(id, opts) {

    // preserve backwards compat for minimumScreenWidth option
    if( typeof(opts.minimumScreenWidth) !== "undefined") {
      opts.screenWidthCondition = {
        condition: "larger",
        value: opts.minimumScreenWidth,
      }
    }

    var box = new Box(id, opts);
    boxes.push(box);
    return box;
};

Boxzilla.get = function(id) {
    for( var i=0; i<boxes.length; i++) {
        var box = boxes[i];
        if( box.id == id ) {
            return box;
        }
    }

    throw new Error("No box exists with ID " + id);
}


// dismiss a single box (or all by omitting id param)
Boxzilla.dismiss = function(id, animate) {
    // if no id given, dismiss all current open boxes
    if(id) {
        Boxzilla.get(id).dismiss(animate);
    } else {
        boxes.forEach(function(box) { box.dismiss(animate); });
    }
};

Boxzilla.hide = function(id, animate) {
    if(id) {
        Boxzilla.get(id).hide(animate);
    } else {
        boxes.forEach(function(box) { box.hide(animate); });
    }
};

Boxzilla.show = function(id, animate) {
    if(id) {
        Boxzilla.get(id).show(animate);
    } else {
        boxes.forEach(function(box) { box.show(animate); });
    }
};

Boxzilla.toggle = function(id, animate) {
    if(id) {
        Boxzilla.get(id).toggle(animate);
    } else {
        boxes.forEach(function(box) { box.toggle(animate); });
    }
};

// expose each individual box.
Boxzilla.boxes = boxes;

// expose boxzilla object
window.Boxzilla = Boxzilla;

if ( typeof module !== 'undefined' && module.exports ) {
    module.exports = Boxzilla;
}
