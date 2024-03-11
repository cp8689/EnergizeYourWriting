# Boxzilla.js

Boxzilla.js is a simple lightweight JavaScript library for creating boxes which can pop-up or slide-in at predefined moments. It's just a single script coming in at 14kb (minified) with no other dependencies.

This is the script powering the [Boxzilla plugin for WordPress](https://boxzillaplugin.com/).


## Usage

First, include the script in your webpage.

```html
<script src="/dist/boxzilla.js"></script>
```

Then, call the `init` method on `Boxzilla` and create your box(es).

```html
<script>
Boxzilla.init();
Boxzilla.create( 'my-box', {
    content: "Well hello there.",
    trigger: {
        method: 'percentage',
        value: 50
    },
    position: "center"
});
</script>
```

Alternatively, you can load Boxzilla using [Browserify]((http://browserify.org/)).

```js
var Boxzilla = require('boxzilla');
```

### Config

The following configuration values are accepted as the second argument for the `Boxzilla.create` method.

```js
{
    'content': '',              // "Any string"
    'trigger': {                // false or object
        'method': 'percentage',       // "time_on_site", "time_on_page", "exit_intent", "element" or "percentage"
        'value':   65                 // integer or string selector
    },
    'icon': '&times',           // string, close icon character
    'animation': 'fade',        // "fade" or "slide"
    'cookie': {
        'dismissed': 24,        // hours that a box should stay hidden after being dismissed
        'triggered': 1          // hours that a box should stay hidden after being triggered
    },            // integer, number of days a box should be hidden when dismissed
    'screenWidthCondition' => { // null or object
      'condition' => 'larger',  // either "smaller" or "larger"
      'value' => 450,           // integer, box will only show on screens larger or smaller than this, depending on condition
    },
    'rehide': false,            // boolean, whether box should rehide when certain triggers are no longer met.
    'position': 'center',       // "center", "bottom-right", "top-left", etc.
    'testMode': false,          // boolean
    'closable': true            // boolean
}
```

_Example_

```js
Boxzilla.create( 'foo', {
    'animation': 'slide',
    'content': form.innerHTML,
    'trigger': {
        'method': 'time_on_site',
        'value': 120
    },
    'icon': '<i class="fa fa-cross"></i>',
    'position': 'center',
});
```



### Managing boxes

The `Boxzilla` object exposes the following methods.

```js
Boxzilla.show('my-box');
Boxzilla.hide('my-box');
Boxzilla.dismiss();             // all boxes
Boxzilla.dismiss('my-box');     // specific box
Boxzilla.on('box.show', callback);
```

### Events

Event listeners can be added or removed using `Boxzilla.on` and `Boxzilla.off`. For a full list of event methods, check the [Event Emitter API](https://github.com/Olical/EventEmitter/blob/master/docs/api.md).

```js
ready
box.show
box.hide
box.dismiss
```

_Example Usage_

```js
Boxzilla.on('box.show', function(box) {
    console.log("Showing box " + box.id);
});
```

### License

GPLv2
