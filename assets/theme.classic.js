(function (factory) {
  typeof define === 'function' && define.amd ? define(factory) :
  factory();
}((function () { 'use strict';

  var SECTION_ID_ATTR$1 = 'data-section-id';

  function Section(container, properties) {
    this.container = validateContainerElement(container);
    this.id = container.getAttribute(SECTION_ID_ATTR$1);
    this.extensions = [];

    // eslint-disable-next-line es5/no-es6-static-methods
    Object.assign(this, validatePropertiesObject(properties));

    this.onLoad();
  }

  Section.prototype = {
    onLoad: Function.prototype,
    onUnload: Function.prototype,
    onSelect: Function.prototype,
    onDeselect: Function.prototype,
    onBlockSelect: Function.prototype,
    onBlockDeselect: Function.prototype,

    extend: function extend(extension) {
      this.extensions.push(extension); // Save original extension

      // eslint-disable-next-line es5/no-es6-static-methods
      var extensionClone = Object.assign({}, extension);
      delete extensionClone.init; // Remove init function before assigning extension properties

      // eslint-disable-next-line es5/no-es6-static-methods
      Object.assign(this, extensionClone);

      if (typeof extension.init === 'function') {
        extension.init.apply(this);
      }
    }
  };

  function validateContainerElement(container) {
    if (!(container instanceof Element)) {
      throw new TypeError(
        'Theme Sections: Attempted to load section. The section container provided is not a DOM element.'
      );
    }
    if (container.getAttribute(SECTION_ID_ATTR$1) === null) {
      throw new Error(
        'Theme Sections: The section container provided does not have an id assigned to the ' +
          SECTION_ID_ATTR$1 +
          ' attribute.'
      );
    }

    return container;
  }

  function validatePropertiesObject(value) {
    if (
      (typeof value !== 'undefined' && typeof value !== 'object') ||
      value === null
    ) {
      throw new TypeError(
        'Theme Sections: The properties object provided is not a valid'
      );
    }

    return value;
  }

  // Object.assign() polyfill from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign#Polyfill
  if (typeof Object.assign != 'function') {
    // Must be writable: true, enumerable: false, configurable: true
    Object.defineProperty(Object, 'assign', {
      value: function assign(target) {
        if (target == null) {
          // TypeError if undefined or null
          throw new TypeError('Cannot convert undefined or null to object');
        }

        var to = Object(target);

        for (var index = 1; index < arguments.length; index++) {
          var nextSource = arguments[index];

          if (nextSource != null) {
            // Skip over if undefined or null
            for (var nextKey in nextSource) {
              // Avoid bugs when hasOwnProperty is shadowed
              if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                to[nextKey] = nextSource[nextKey];
              }
            }
          }
        }
        return to;
      },
      writable: true,
      configurable: true
    });
  }

  /*
   * @shopify/theme-sections
   * -----------------------------------------------------------------------------
   *
   * A framework to provide structure to your Shopify sections and a load and unload
   * lifecycle. The lifecycle is automatically connected to theme editor events so
   * that your sections load and unload as the editor changes the content and
   * settings of your sections.
   */

  var SECTION_TYPE_ATTR = 'data-section-type';
  var SECTION_ID_ATTR = 'data-section-id';

  window.Shopify = window.Shopify || {};
  window.Shopify.theme = window.Shopify.theme || {};
  window.Shopify.theme.sections = window.Shopify.theme.sections || {};

  var registered = (window.Shopify.theme.sections.registered =
    window.Shopify.theme.sections.registered || {});
  var instances = (window.Shopify.theme.sections.instances =
    window.Shopify.theme.sections.instances || []);

  function register(type, properties) {
    if (typeof type !== 'string') {
      throw new TypeError(
        'Theme Sections: The first argument for .register must be a string that specifies the type of the section being registered'
      );
    }

    if (typeof registered[type] !== 'undefined') {
      throw new Error(
        'Theme Sections: A section of type "' +
          type +
          '" has already been registered. You cannot register the same section type twice'
      );
    }

    function TypedSection(container) {
      Section.call(this, container, properties);
    }

    TypedSection.constructor = Section;
    TypedSection.prototype = Object.create(Section.prototype);
    TypedSection.prototype.type = type;

    return (registered[type] = TypedSection);
  }

  function load(types, containers) {
    types = normalizeType(types);

    if (typeof containers === 'undefined') {
      containers = document.querySelectorAll('[' + SECTION_TYPE_ATTR + ']');
    }

    containers = normalizeContainers(containers);

    types.forEach(function(type) {
      var TypedSection = registered[type];

      if (typeof TypedSection === 'undefined') {
        return;
      }

      containers = containers.filter(function(container) {
        // Filter from list of containers because container already has an instance loaded
        if (isInstance(container)) {
          return false;
        }

        // Filter from list of containers because container doesn't have data-section-type attribute
        if (container.getAttribute(SECTION_TYPE_ATTR) === null) {
          return false;
        }

        // Keep in list of containers because current type doesn't match
        if (container.getAttribute(SECTION_TYPE_ATTR) !== type) {
          return true;
        }

        instances.push(new TypedSection(container));

        // Filter from list of containers because container now has an instance loaded
        return false;
      });
    });
  }

  function unload(selector) {
    var instancesToUnload = getInstances(selector);

    instancesToUnload.forEach(function(instance) {
      var index = instances
        .map(function(e) {
          return e.id;
        })
        .indexOf(instance.id);
      instances.splice(index, 1);
      instance.onUnload();
    });
  }

  function getInstances(selector) {
    var filteredInstances = [];

    // Fetch first element if its an array
    if (NodeList.prototype.isPrototypeOf(selector) || Array.isArray(selector)) {
      var firstElement = selector[0];
    }

    // If selector element is DOM element
    if (selector instanceof Element || firstElement instanceof Element) {
      var containers = normalizeContainers(selector);

      containers.forEach(function(container) {
        filteredInstances = filteredInstances.concat(
          instances.filter(function(instance) {
            return instance.container === container;
          })
        );
      });

      // If select is type string
    } else if (typeof selector === 'string' || typeof firstElement === 'string') {
      var types = normalizeType(selector);

      types.forEach(function(type) {
        filteredInstances = filteredInstances.concat(
          instances.filter(function(instance) {
            return instance.type === type;
          })
        );
      });
    }

    return filteredInstances;
  }

  function getInstanceById(id) {
    var instance;

    for (var i = 0; i < instances.length; i++) {
      if (instances[i].id === id) {
        instance = instances[i];
        break;
      }
    }
    return instance;
  }

  function isInstance(selector) {
    return getInstances(selector).length > 0;
  }

  function normalizeType(types) {
    // If '*' then fetch all registered section types
    if (types === '*') {
      types = Object.keys(registered);

      // If a single section type string is passed, put it in an array
    } else if (typeof types === 'string') {
      types = [types];

      // If single section constructor is passed, transform to array with section
      // type string
    } else if (types.constructor === Section) {
      types = [types.prototype.type];

      // If array of typed section constructors is passed, transform the array to
      // type strings
    } else if (Array.isArray(types) && types[0].constructor === Section) {
      types = types.map(function(TypedSection) {
        return TypedSection.prototype.type;
      });
    }

    types = types.map(function(type) {
      return type.toLowerCase();
    });

    return types;
  }

  function normalizeContainers(containers) {
    // Nodelist with entries
    if (NodeList.prototype.isPrototypeOf(containers) && containers.length > 0) {
      containers = Array.prototype.slice.call(containers);

      // Empty Nodelist
    } else if (
      NodeList.prototype.isPrototypeOf(containers) &&
      containers.length === 0
    ) {
      containers = [];

      // Handle null (document.querySelector() returns null with no match)
    } else if (containers === null) {
      containers = [];

      // Single DOM element
    } else if (!Array.isArray(containers) && containers instanceof Element) {
      containers = [containers];
    }

    return containers;
  }

  if (window.Shopify.designMode) {
    document.addEventListener('shopify:section:load', function(event) {
      var id = event.detail.sectionId;
      var container = event.target.querySelector(
        '[' + SECTION_ID_ATTR + '="' + id + '"]'
      );

      if (container !== null) {
        load(container.getAttribute(SECTION_TYPE_ATTR), container);
      }
    });

    document.addEventListener('shopify:section:unload', function(event) {
      var id = event.detail.sectionId;
      var container = event.target.querySelector(
        '[' + SECTION_ID_ATTR + '="' + id + '"]'
      );
      var instance = getInstances(container)[0];

      if (typeof instance === 'object') {
        unload(container);
      }
    });

    document.addEventListener('shopify:section:select', function(event) {
      var instance = getInstanceById(event.detail.sectionId);

      if (typeof instance === 'object') {
        instance.onSelect(event);
      }
    });

    document.addEventListener('shopify:section:deselect', function(event) {
      var instance = getInstanceById(event.detail.sectionId);

      if (typeof instance === 'object') {
        instance.onDeselect(event);
      }
    });

    document.addEventListener('shopify:block:select', function(event) {
      var instance = getInstanceById(event.detail.sectionId);

      if (typeof instance === 'object') {
        instance.onBlockSelect(event);
      }
    });

    document.addEventListener('shopify:block:deselect', function(event) {
      var instance = getInstanceById(event.detail.sectionId);

      if (typeof instance === 'object') {
        instance.onBlockDeselect(event);
      }
    });
  }

  function n$1(n,t){return void 0===t&&(t=document),t.querySelector(n)}function t$3(n,t){return void 0===t&&(t=document),[].slice.call(t.querySelectorAll(n))}function c$1(n,t){return Array.isArray(n)?n.forEach(t):t(n)}function r$3(n){return function(t,r,e){return c$1(t,function(t){return t[n+"EventListener"](r,e)})}}function e$2(n,t,c){return r$3("add")(n,t,c),function(){return r$3("remove")(n,t,c)}}function o$1(n){return function(t){var r=arguments;return c$1(t,function(t){var c;return (c=t.classList)[n].apply(c,[].slice.call(r,1))})}}function u(n){o$1("add").apply(void 0,[n].concat([].slice.call(arguments,1)));}function i(n){o$1("remove").apply(void 0,[n].concat([].slice.call(arguments,1)));}function l(n){o$1("toggle").apply(void 0,[n].concat([].slice.call(arguments,1)));}function a$1(n,t){return n.classList.contains(t)}

  var commonjsGlobal$1 = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

  function getDefaultExportFromCjs (x) {
  	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
  }

  var isMobile$2 = {exports: {}};

  isMobile$2.exports = isMobile;
  isMobile$2.exports.isMobile = isMobile;
  isMobile$2.exports.default = isMobile;

  var mobileRE = /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series[46]0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i;

  var tabletRE = /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series[46]0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino|android|ipad|playbook|silk/i;

  function isMobile (opts) {
    if (!opts) opts = {};
    var ua = opts.ua;
    if (!ua && typeof navigator !== 'undefined') ua = navigator.userAgent;
    if (ua && ua.headers && typeof ua.headers['user-agent'] === 'string') {
      ua = ua.headers['user-agent'];
    }
    if (typeof ua !== 'string') return false

    var result = opts.tablet ? tabletRE.test(ua) : mobileRE.test(ua);

    if (
      !result &&
      opts.tablet &&
      opts.featureDetect &&
      navigator &&
      navigator.maxTouchPoints > 1 &&
      ua.indexOf('Macintosh') !== -1 &&
      ua.indexOf('Safari') !== -1
    ) {
      result = true;
    }

    return result
  }

  var isMobile$1 = isMobile$2.exports;

  var browser$1 = {exports: {}};

  (function (module, exports) {

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = void 0;

  /**
   * DOM event delegator
   *
   * The delegator will listen
   * for events that bubble up
   * to the root node.
   *
   * @constructor
   * @param {Node|string} [root] The root node or a selector string matching the root node
   */
  function Delegate(root) {
    /**
     * Maintain a map of listener
     * lists, keyed by event name.
     *
     * @type Object
     */
    this.listenerMap = [{}, {}];

    if (root) {
      this.root(root);
    }
    /** @type function() */


    this.handle = Delegate.prototype.handle.bind(this); // Cache of event listeners removed during an event cycle

    this._removedListeners = [];
  }
  /**
   * Start listening for events
   * on the provided DOM element
   *
   * @param  {Node|string} [root] The root node or a selector string matching the root node
   * @returns {Delegate} This method is chainable
   */


  Delegate.prototype.root = function (root) {
    var listenerMap = this.listenerMap;
    var eventType; // Remove master event listeners

    if (this.rootElement) {
      for (eventType in listenerMap[1]) {
        if (listenerMap[1].hasOwnProperty(eventType)) {
          this.rootElement.removeEventListener(eventType, this.handle, true);
        }
      }

      for (eventType in listenerMap[0]) {
        if (listenerMap[0].hasOwnProperty(eventType)) {
          this.rootElement.removeEventListener(eventType, this.handle, false);
        }
      }
    } // If no root or root is not
    // a dom node, then remove internal
    // root reference and exit here


    if (!root || !root.addEventListener) {
      if (this.rootElement) {
        delete this.rootElement;
      }

      return this;
    }
    /**
     * The root node at which
     * listeners are attached.
     *
     * @type Node
     */


    this.rootElement = root; // Set up master event listeners

    for (eventType in listenerMap[1]) {
      if (listenerMap[1].hasOwnProperty(eventType)) {
        this.rootElement.addEventListener(eventType, this.handle, true);
      }
    }

    for (eventType in listenerMap[0]) {
      if (listenerMap[0].hasOwnProperty(eventType)) {
        this.rootElement.addEventListener(eventType, this.handle, false);
      }
    }

    return this;
  };
  /**
   * @param {string} eventType
   * @returns boolean
   */


  Delegate.prototype.captureForType = function (eventType) {
    return ['blur', 'error', 'focus', 'load', 'resize', 'scroll'].indexOf(eventType) !== -1;
  };
  /**
   * Attach a handler to one
   * event for all elements
   * that match the selector,
   * now or in the future
   *
   * The handler function receives
   * three arguments: the DOM event
   * object, the node that matched
   * the selector while the event
   * was bubbling and a reference
   * to itself. Within the handler,
   * 'this' is equal to the second
   * argument.
   *
   * The node that actually received
   * the event can be accessed via
   * 'event.target'.
   *
   * @param {string} eventType Listen for these events
   * @param {string|undefined} selector Only handle events on elements matching this selector, if undefined match root element
   * @param {function()} handler Handler function - event data passed here will be in event.data
   * @param {boolean} [useCapture] see 'useCapture' in <https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener>
   * @returns {Delegate} This method is chainable
   */


  Delegate.prototype.on = function (eventType, selector, handler, useCapture) {
    var root;
    var listenerMap;
    var matcher;
    var matcherParam;

    if (!eventType) {
      throw new TypeError('Invalid event type: ' + eventType);
    } // handler can be passed as
    // the second or third argument


    if (typeof selector === 'function') {
      useCapture = handler;
      handler = selector;
      selector = null;
    } // Fallback to sensible defaults
    // if useCapture not set


    if (useCapture === undefined) {
      useCapture = this.captureForType(eventType);
    }

    if (typeof handler !== 'function') {
      throw new TypeError('Handler must be a type of Function');
    }

    root = this.rootElement;
    listenerMap = this.listenerMap[useCapture ? 1 : 0]; // Add master handler for type if not created yet

    if (!listenerMap[eventType]) {
      if (root) {
        root.addEventListener(eventType, this.handle, useCapture);
      }

      listenerMap[eventType] = [];
    }

    if (!selector) {
      matcherParam = null; // COMPLEX - matchesRoot needs to have access to
      // this.rootElement, so bind the function to this.

      matcher = matchesRoot.bind(this); // Compile a matcher for the given selector
    } else if (/^[a-z]+$/i.test(selector)) {
      matcherParam = selector;
      matcher = matchesTag;
    } else if (/^#[a-z0-9\-_]+$/i.test(selector)) {
      matcherParam = selector.slice(1);
      matcher = matchesId;
    } else {
      matcherParam = selector;
      matcher = Element.prototype.matches;
    } // Add to the list of listeners


    listenerMap[eventType].push({
      selector: selector,
      handler: handler,
      matcher: matcher,
      matcherParam: matcherParam
    });
    return this;
  };
  /**
   * Remove an event handler
   * for elements that match
   * the selector, forever
   *
   * @param {string} [eventType] Remove handlers for events matching this type, considering the other parameters
   * @param {string} [selector] If this parameter is omitted, only handlers which match the other two will be removed
   * @param {function()} [handler] If this parameter is omitted, only handlers which match the previous two will be removed
   * @returns {Delegate} This method is chainable
   */


  Delegate.prototype.off = function (eventType, selector, handler, useCapture) {
    var i;
    var listener;
    var listenerMap;
    var listenerList;
    var singleEventType; // Handler can be passed as
    // the second or third argument

    if (typeof selector === 'function') {
      useCapture = handler;
      handler = selector;
      selector = null;
    } // If useCapture not set, remove
    // all event listeners


    if (useCapture === undefined) {
      this.off(eventType, selector, handler, true);
      this.off(eventType, selector, handler, false);
      return this;
    }

    listenerMap = this.listenerMap[useCapture ? 1 : 0];

    if (!eventType) {
      for (singleEventType in listenerMap) {
        if (listenerMap.hasOwnProperty(singleEventType)) {
          this.off(singleEventType, selector, handler);
        }
      }

      return this;
    }

    listenerList = listenerMap[eventType];

    if (!listenerList || !listenerList.length) {
      return this;
    } // Remove only parameter matches
    // if specified


    for (i = listenerList.length - 1; i >= 0; i--) {
      listener = listenerList[i];

      if ((!selector || selector === listener.selector) && (!handler || handler === listener.handler)) {
        this._removedListeners.push(listener);

        listenerList.splice(i, 1);
      }
    } // All listeners removed


    if (!listenerList.length) {
      delete listenerMap[eventType]; // Remove the main handler

      if (this.rootElement) {
        this.rootElement.removeEventListener(eventType, this.handle, useCapture);
      }
    }

    return this;
  };
  /**
   * Handle an arbitrary event.
   *
   * @param {Event} event
   */


  Delegate.prototype.handle = function (event) {
    var i;
    var l;
    var type = event.type;
    var root;
    var phase;
    var listener;
    var returned;
    var listenerList = [];
    var target;
    var eventIgnore = 'ftLabsDelegateIgnore';

    if (event[eventIgnore] === true) {
      return;
    }

    target = event.target; // Hardcode value of Node.TEXT_NODE
    // as not defined in IE8

    if (target.nodeType === 3) {
      target = target.parentNode;
    } // Handle SVG <use> elements in IE


    if (target.correspondingUseElement) {
      target = target.correspondingUseElement;
    }

    root = this.rootElement;
    phase = event.eventPhase || (event.target !== event.currentTarget ? 3 : 2); // eslint-disable-next-line default-case

    switch (phase) {
      case 1:
        //Event.CAPTURING_PHASE:
        listenerList = this.listenerMap[1][type];
        break;

      case 2:
        //Event.AT_TARGET:
        if (this.listenerMap[0] && this.listenerMap[0][type]) {
          listenerList = listenerList.concat(this.listenerMap[0][type]);
        }

        if (this.listenerMap[1] && this.listenerMap[1][type]) {
          listenerList = listenerList.concat(this.listenerMap[1][type]);
        }

        break;

      case 3:
        //Event.BUBBLING_PHASE:
        listenerList = this.listenerMap[0][type];
        break;
    }

    var toFire = []; // Need to continuously check
    // that the specific list is
    // still populated in case one
    // of the callbacks actually
    // causes the list to be destroyed.

    l = listenerList.length;

    while (target && l) {
      for (i = 0; i < l; i++) {
        listener = listenerList[i]; // Bail from this loop if
        // the length changed and
        // no more listeners are
        // defined between i and l.

        if (!listener) {
          break;
        }

        if (target.tagName && ["button", "input", "select", "textarea"].indexOf(target.tagName.toLowerCase()) > -1 && target.hasAttribute("disabled")) {
          // Remove things that have previously fired
          toFire = [];
        } // Check for match and fire
        // the event if there's one
        //
        // TODO:MCG:20120117: Need a way
        // to check if event#stopImmediatePropagation
        // was called. If so, break both loops.
        else if (listener.matcher.call(target, listener.matcherParam, target)) {
            toFire.push([event, target, listener]);
          }
      } // TODO:MCG:20120117: Need a way to
      // check if event#stopPropagation
      // was called. If so, break looping
      // through the DOM. Stop if the
      // delegation root has been reached


      if (target === root) {
        break;
      }

      l = listenerList.length; // Fall back to parentNode since SVG children have no parentElement in IE

      target = target.parentElement || target.parentNode; // Do not traverse up to document root when using parentNode, though

      if (target instanceof HTMLDocument) {
        break;
      }
    }

    var ret;

    for (i = 0; i < toFire.length; i++) {
      // Has it been removed during while the event function was fired
      if (this._removedListeners.indexOf(toFire[i][2]) > -1) {
        continue;
      }

      returned = this.fire.apply(this, toFire[i]); // Stop propagation to subsequent
      // callbacks if the callback returned
      // false

      if (returned === false) {
        toFire[i][0][eventIgnore] = true;
        toFire[i][0].preventDefault();
        ret = false;
        break;
      }
    }

    return ret;
  };
  /**
   * Fire a listener on a target.
   *
   * @param {Event} event
   * @param {Node} target
   * @param {Object} listener
   * @returns {boolean}
   */


  Delegate.prototype.fire = function (event, target, listener) {
    return listener.handler.call(target, event, target);
  };
  /**
   * Check whether an element
   * matches a tag selector.
   *
   * Tags are NOT case-sensitive,
   * except in XML (and XML-based
   * languages such as XHTML).
   *
   * @param {string} tagName The tag name to test against
   * @param {Element} element The element to test with
   * @returns boolean
   */


  function matchesTag(tagName, element) {
    return tagName.toLowerCase() === element.tagName.toLowerCase();
  }
  /**
   * Check whether an element
   * matches the root.
   *
   * @param {?String} selector In this case this is always passed through as null and not used
   * @param {Element} element The element to test with
   * @returns boolean
   */


  function matchesRoot(selector, element) {
    if (this.rootElement === window) {
      return (// Match the outer document (dispatched from document)
        element === document || // The <html> element (dispatched from document.body or document.documentElement)
        element === document.documentElement || // Or the window itself (dispatched from window)
        element === window
      );
    }

    return this.rootElement === element;
  }
  /**
   * Check whether the ID of
   * the element in 'this'
   * matches the given ID.
   *
   * IDs are case-sensitive.
   *
   * @param {string} id The ID to test against
   * @param {Element} element The element to test with
   * @returns boolean
   */


  function matchesId(id, element) {
    return id === element.id;
  }
  /**
   * Short hand for off()
   * and root(), ie both
   * with no parameters
   *
   * @return void
   */


  Delegate.prototype.destroy = function () {
    this.off();
    this.root();
  };

  var _default = Delegate;
  exports.default = _default;
  module.exports = exports.default;
  }(browser$1, browser$1.exports));

  var Delegate = /*@__PURE__*/getDefaultExportFromCjs(browser$1.exports);

  var pageTransition = (() => {
    const pageTransitionElement = document.querySelector('.page-transition');

    if (pageTransitionElement) {
      Object.assign(pageTransitionElement.style, {
        opacity: 0,
        pointerEvents: 'none'
      });
      setTimeout(() => {
        // Prevent the theme editor from seeing this
        pageTransitionElement.style.visibility = 'hidden';
      }, 300);
      const delegate = new Delegate(document.body);
      delegate.on('click', 'a[href]:not([href^="#"]):not(.no-transition):not([href^="mailto:"]):not([href^="tel:"]):not([target="_blank"])', onLeave);

      window.onpageshow = function (e) {
        if (e.persisted) {
          Object.assign(pageTransitionElement.style, {
            opacity: 0,
            pointerEvents: 'none'
          });
        }
      };
    }

    function onLeave(evt, target) {
      evt.preventDefault();

      function transitionedOut(e) {
        if (e.propertyName === 'opacity') {
          pageTransitionElement.removeEventListener('transitionend', transitionedOut);
          window.location.href = target.href;
        }
      }

      pageTransitionElement.addEventListener('transitionend', transitionedOut);
      Object.assign(pageTransitionElement.style, {
        opacity: 1,
        pointerEvents: 'all',
        visibility: 'visible'
      });
    }
  });

  /*!
  * tabbable 5.2.0
  * @license MIT, https://github.com/focus-trap/tabbable/blob/master/LICENSE
  */
  var candidateSelectors = ['input', 'select', 'textarea', 'a[href]', 'button', '[tabindex]', 'audio[controls]', 'video[controls]', '[contenteditable]:not([contenteditable="false"])', 'details>summary:first-of-type', 'details'];
  var candidateSelector = /* #__PURE__ */candidateSelectors.join(',');
  var matches = typeof Element === 'undefined' ? function () {} : Element.prototype.matches || Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;

  var getCandidates = function getCandidates(el, includeContainer, filter) {
    var candidates = Array.prototype.slice.apply(el.querySelectorAll(candidateSelector));

    if (includeContainer && matches.call(el, candidateSelector)) {
      candidates.unshift(el);
    }

    candidates = candidates.filter(filter);
    return candidates;
  };

  var isContentEditable = function isContentEditable(node) {
    return node.contentEditable === 'true';
  };

  var getTabindex = function getTabindex(node) {
    var tabindexAttr = parseInt(node.getAttribute('tabindex'), 10);

    if (!isNaN(tabindexAttr)) {
      return tabindexAttr;
    } // Browsers do not return `tabIndex` correctly for contentEditable nodes;
    // so if they don't have a tabindex attribute specifically set, assume it's 0.


    if (isContentEditable(node)) {
      return 0;
    } // in Chrome, <details/>, <audio controls/> and <video controls/> elements get a default
    //  `tabIndex` of -1 when the 'tabindex' attribute isn't specified in the DOM,
    //  yet they are still part of the regular tab order; in FF, they get a default
    //  `tabIndex` of 0; since Chrome still puts those elements in the regular tab
    //  order, consider their tab index to be 0.


    if ((node.nodeName === 'AUDIO' || node.nodeName === 'VIDEO' || node.nodeName === 'DETAILS') && node.getAttribute('tabindex') === null) {
      return 0;
    }

    return node.tabIndex;
  };

  var sortOrderedTabbables = function sortOrderedTabbables(a, b) {
    return a.tabIndex === b.tabIndex ? a.documentOrder - b.documentOrder : a.tabIndex - b.tabIndex;
  };

  var isInput = function isInput(node) {
    return node.tagName === 'INPUT';
  };

  var isHiddenInput = function isHiddenInput(node) {
    return isInput(node) && node.type === 'hidden';
  };

  var isDetailsWithSummary = function isDetailsWithSummary(node) {
    var r = node.tagName === 'DETAILS' && Array.prototype.slice.apply(node.children).some(function (child) {
      return child.tagName === 'SUMMARY';
    });
    return r;
  };

  var getCheckedRadio = function getCheckedRadio(nodes, form) {
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].checked && nodes[i].form === form) {
        return nodes[i];
      }
    }
  };

  var isTabbableRadio = function isTabbableRadio(node) {
    if (!node.name) {
      return true;
    }

    var radioScope = node.form || node.ownerDocument;

    var queryRadios = function queryRadios(name) {
      return radioScope.querySelectorAll('input[type="radio"][name="' + name + '"]');
    };

    var radioSet;

    if (typeof window !== 'undefined' && typeof window.CSS !== 'undefined' && typeof window.CSS.escape === 'function') {
      radioSet = queryRadios(window.CSS.escape(node.name));
    } else {
      try {
        radioSet = queryRadios(node.name);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Looks like you have a radio button with a name attribute containing invalid CSS selector characters and need the CSS.escape polyfill: %s', err.message);
        return false;
      }
    }

    var checked = getCheckedRadio(radioSet, node.form);
    return !checked || checked === node;
  };

  var isRadio = function isRadio(node) {
    return isInput(node) && node.type === 'radio';
  };

  var isNonTabbableRadio = function isNonTabbableRadio(node) {
    return isRadio(node) && !isTabbableRadio(node);
  };

  var isHidden = function isHidden(node, displayCheck) {
    if (getComputedStyle(node).visibility === 'hidden') {
      return true;
    }

    var isDirectSummary = matches.call(node, 'details>summary:first-of-type');
    var nodeUnderDetails = isDirectSummary ? node.parentElement : node;

    if (matches.call(nodeUnderDetails, 'details:not([open]) *')) {
      return true;
    }

    if (!displayCheck || displayCheck === 'full') {
      while (node) {
        if (getComputedStyle(node).display === 'none') {
          return true;
        }

        node = node.parentElement;
      }
    } else if (displayCheck === 'non-zero-area') {
      var _node$getBoundingClie = node.getBoundingClientRect(),
          width = _node$getBoundingClie.width,
          height = _node$getBoundingClie.height;

      return width === 0 && height === 0;
    }

    return false;
  };

  var isNodeMatchingSelectorFocusable = function isNodeMatchingSelectorFocusable(options, node) {
    if (node.disabled || isHiddenInput(node) || isHidden(node, options.displayCheck) ||
    /* For a details element with a summary, the summary element gets the focused  */
    isDetailsWithSummary(node)) {
      return false;
    }

    return true;
  };

  var isNodeMatchingSelectorTabbable = function isNodeMatchingSelectorTabbable(options, node) {
    if (!isNodeMatchingSelectorFocusable(options, node) || isNonTabbableRadio(node) || getTabindex(node) < 0) {
      return false;
    }

    return true;
  };

  var tabbable = function tabbable(el, options) {
    options = options || {};
    var regularTabbables = [];
    var orderedTabbables = [];
    var candidates = getCandidates(el, options.includeContainer, isNodeMatchingSelectorTabbable.bind(null, options));
    candidates.forEach(function (candidate, i) {
      var candidateTabindex = getTabindex(candidate);

      if (candidateTabindex === 0) {
        regularTabbables.push(candidate);
      } else {
        orderedTabbables.push({
          documentOrder: i,
          tabIndex: candidateTabindex,
          node: candidate
        });
      }
    });
    var tabbableNodes = orderedTabbables.sort(sortOrderedTabbables).map(function (a) {
      return a.node;
    }).concat(regularTabbables);
    return tabbableNodes;
  };

  var focusableCandidateSelector = /* #__PURE__ */candidateSelectors.concat('iframe').join(',');

  var isFocusable = function isFocusable(node, options) {
    options = options || {};

    if (!node) {
      throw new Error('No node provided');
    }

    if (matches.call(node, focusableCandidateSelector) === false) {
      return false;
    }

    return isNodeMatchingSelectorFocusable(options, node);
  };

  /*!
  * focus-trap 6.6.0
  * @license MIT, https://github.com/focus-trap/focus-trap/blob/master/LICENSE
  */

  function ownKeys(object, enumerableOnly) {
    var keys = Object.keys(object);

    if (Object.getOwnPropertySymbols) {
      var symbols = Object.getOwnPropertySymbols(object);

      if (enumerableOnly) {
        symbols = symbols.filter(function (sym) {
          return Object.getOwnPropertyDescriptor(object, sym).enumerable;
        });
      }

      keys.push.apply(keys, symbols);
    }

    return keys;
  }

  function _objectSpread2(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i] != null ? arguments[i] : {};

      if (i % 2) {
        ownKeys(Object(source), true).forEach(function (key) {
          _defineProperty(target, key, source[key]);
        });
      } else if (Object.getOwnPropertyDescriptors) {
        Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
      } else {
        ownKeys(Object(source)).forEach(function (key) {
          Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
      }
    }

    return target;
  }

  function _defineProperty(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = value;
    }

    return obj;
  }

  var activeFocusTraps = function () {
    var trapQueue = [];
    return {
      activateTrap: function activateTrap(trap) {
        if (trapQueue.length > 0) {
          var activeTrap = trapQueue[trapQueue.length - 1];

          if (activeTrap !== trap) {
            activeTrap.pause();
          }
        }

        var trapIndex = trapQueue.indexOf(trap);

        if (trapIndex === -1) {
          trapQueue.push(trap);
        } else {
          // move this existing trap to the front of the queue
          trapQueue.splice(trapIndex, 1);
          trapQueue.push(trap);
        }
      },
      deactivateTrap: function deactivateTrap(trap) {
        var trapIndex = trapQueue.indexOf(trap);

        if (trapIndex !== -1) {
          trapQueue.splice(trapIndex, 1);
        }

        if (trapQueue.length > 0) {
          trapQueue[trapQueue.length - 1].unpause();
        }
      }
    };
  }();

  var isSelectableInput = function isSelectableInput(node) {
    return node.tagName && node.tagName.toLowerCase() === 'input' && typeof node.select === 'function';
  };

  var isEscapeEvent = function isEscapeEvent(e) {
    return e.key === 'Escape' || e.key === 'Esc' || e.keyCode === 27;
  };

  var isTabEvent = function isTabEvent(e) {
    return e.key === 'Tab' || e.keyCode === 9;
  };

  var delay = function delay(fn) {
    return setTimeout(fn, 0);
  }; // Array.find/findIndex() are not supported on IE; this replicates enough
  //  of Array.findIndex() for our needs


  var findIndex = function findIndex(arr, fn) {
    var idx = -1;
    arr.every(function (value, i) {
      if (fn(value)) {
        idx = i;
        return false; // break
      }

      return true; // next
    });
    return idx;
  };
  /**
   * Get an option's value when it could be a plain value, or a handler that provides
   *  the value.
   * @param {*} value Option's value to check.
   * @param {...*} [params] Any parameters to pass to the handler, if `value` is a function.
   * @returns {*} The `value`, or the handler's returned value.
   */


  var valueOrHandler = function valueOrHandler(value) {
    for (var _len = arguments.length, params = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      params[_key - 1] = arguments[_key];
    }

    return typeof value === 'function' ? value.apply(void 0, params) : value;
  };

  var createFocusTrap = function createFocusTrap(elements, userOptions) {
    var doc = document;

    var config = _objectSpread2({
      returnFocusOnDeactivate: true,
      escapeDeactivates: true,
      delayInitialFocus: true
    }, userOptions);

    var state = {
      // @type {Array<HTMLElement>}
      containers: [],
      // list of objects identifying the first and last tabbable nodes in all containers/groups in
      //  the trap
      // NOTE: it's possible that a group has no tabbable nodes if nodes get removed while the trap
      //  is active, but the trap should never get to a state where there isn't at least one group
      //  with at least one tabbable node in it (that would lead to an error condition that would
      //  result in an error being thrown)
      // @type {Array<{ container: HTMLElement, firstTabbableNode: HTMLElement|null, lastTabbableNode: HTMLElement|null }>}
      tabbableGroups: [],
      nodeFocusedBeforeActivation: null,
      mostRecentlyFocusedNode: null,
      active: false,
      paused: false,
      // timer ID for when delayInitialFocus is true and initial focus in this trap
      //  has been delayed during activation
      delayInitialFocusTimer: undefined
    };
    var trap; // eslint-disable-line prefer-const -- some private functions reference it, and its methods reference private functions, so we must declare here and define later

    var getOption = function getOption(configOverrideOptions, optionName, configOptionName) {
      return configOverrideOptions && configOverrideOptions[optionName] !== undefined ? configOverrideOptions[optionName] : config[configOptionName || optionName];
    };

    var containersContain = function containersContain(element) {
      return state.containers.some(function (container) {
        return container.contains(element);
      });
    };

    var getNodeForOption = function getNodeForOption(optionName) {
      var optionValue = config[optionName];

      if (!optionValue) {
        return null;
      }

      var node = optionValue;

      if (typeof optionValue === 'string') {
        node = doc.querySelector(optionValue);

        if (!node) {
          throw new Error("`".concat(optionName, "` refers to no known node"));
        }
      }

      if (typeof optionValue === 'function') {
        node = optionValue();

        if (!node) {
          throw new Error("`".concat(optionName, "` did not return a node"));
        }
      }

      return node;
    };

    var getInitialFocusNode = function getInitialFocusNode() {
      var node; // false indicates we want no initialFocus at all

      if (getOption({}, 'initialFocus') === false) {
        return false;
      }

      if (getNodeForOption('initialFocus') !== null) {
        node = getNodeForOption('initialFocus');
      } else if (containersContain(doc.activeElement)) {
        node = doc.activeElement;
      } else {
        var firstTabbableGroup = state.tabbableGroups[0];
        var firstTabbableNode = firstTabbableGroup && firstTabbableGroup.firstTabbableNode;
        node = firstTabbableNode || getNodeForOption('fallbackFocus');
      }

      if (!node) {
        throw new Error('Your focus-trap needs to have at least one focusable element');
      }

      return node;
    };

    var updateTabbableNodes = function updateTabbableNodes() {
      state.tabbableGroups = state.containers.map(function (container) {
        var tabbableNodes = tabbable(container);

        if (tabbableNodes.length > 0) {
          return {
            container: container,
            firstTabbableNode: tabbableNodes[0],
            lastTabbableNode: tabbableNodes[tabbableNodes.length - 1]
          };
        }

        return undefined;
      }).filter(function (group) {
        return !!group;
      }); // remove groups with no tabbable nodes
      // throw if no groups have tabbable nodes and we don't have a fallback focus node either

      if (state.tabbableGroups.length <= 0 && !getNodeForOption('fallbackFocus')) {
        throw new Error('Your focus-trap must have at least one container with at least one tabbable node in it at all times');
      }
    };

    var tryFocus = function tryFocus(node) {
      if (node === false) {
        return;
      }

      if (node === doc.activeElement) {
        return;
      }

      if (!node || !node.focus) {
        tryFocus(getInitialFocusNode());
        return;
      }

      node.focus({
        preventScroll: !!config.preventScroll
      });
      state.mostRecentlyFocusedNode = node;

      if (isSelectableInput(node)) {
        node.select();
      }
    };

    var getReturnFocusNode = function getReturnFocusNode(previousActiveElement) {
      var node = getNodeForOption('setReturnFocus');
      return node ? node : previousActiveElement;
    }; // This needs to be done on mousedown and touchstart instead of click
    // so that it precedes the focus event.


    var checkPointerDown = function checkPointerDown(e) {
      if (containersContain(e.target)) {
        // allow the click since it ocurred inside the trap
        return;
      }

      if (valueOrHandler(config.clickOutsideDeactivates, e)) {
        // immediately deactivate the trap
        trap.deactivate({
          // if, on deactivation, we should return focus to the node originally-focused
          //  when the trap was activated (or the configured `setReturnFocus` node),
          //  then assume it's also OK to return focus to the outside node that was
          //  just clicked, causing deactivation, as long as that node is focusable;
          //  if it isn't focusable, then return focus to the original node focused
          //  on activation (or the configured `setReturnFocus` node)
          // NOTE: by setting `returnFocus: false`, deactivate() will do nothing,
          //  which will result in the outside click setting focus to the node
          //  that was clicked, whether it's focusable or not; by setting
          //  `returnFocus: true`, we'll attempt to re-focus the node originally-focused
          //  on activation (or the configured `setReturnFocus` node)
          returnFocus: config.returnFocusOnDeactivate && !isFocusable(e.target)
        });
        return;
      } // This is needed for mobile devices.
      // (If we'll only let `click` events through,
      // then on mobile they will be blocked anyways if `touchstart` is blocked.)


      if (valueOrHandler(config.allowOutsideClick, e)) {
        // allow the click outside the trap to take place
        return;
      } // otherwise, prevent the click


      e.preventDefault();
    }; // In case focus escapes the trap for some strange reason, pull it back in.


    var checkFocusIn = function checkFocusIn(e) {
      var targetContained = containersContain(e.target); // In Firefox when you Tab out of an iframe the Document is briefly focused.

      if (targetContained || e.target instanceof Document) {
        if (targetContained) {
          state.mostRecentlyFocusedNode = e.target;
        }
      } else {
        // escaped! pull it back in to where it just left
        e.stopImmediatePropagation();
        tryFocus(state.mostRecentlyFocusedNode || getInitialFocusNode());
      }
    }; // Hijack Tab events on the first and last focusable nodes of the trap,
    // in order to prevent focus from escaping. If it escapes for even a
    // moment it can end up scrolling the page and causing confusion so we
    // kind of need to capture the action at the keydown phase.


    var checkTab = function checkTab(e) {
      updateTabbableNodes();
      var destinationNode = null;

      if (state.tabbableGroups.length > 0) {
        // make sure the target is actually contained in a group
        // NOTE: the target may also be the container itself if it's tabbable
        //  with tabIndex='-1' and was given initial focus
        var containerIndex = findIndex(state.tabbableGroups, function (_ref) {
          var container = _ref.container;
          return container.contains(e.target);
        });

        if (containerIndex < 0) {
          // target not found in any group: quite possible focus has escaped the trap,
          //  so bring it back in to...
          if (e.shiftKey) {
            // ...the last node in the last group
            destinationNode = state.tabbableGroups[state.tabbableGroups.length - 1].lastTabbableNode;
          } else {
            // ...the first node in the first group
            destinationNode = state.tabbableGroups[0].firstTabbableNode;
          }
        } else if (e.shiftKey) {
          // REVERSE
          // is the target the first tabbable node in a group?
          var startOfGroupIndex = findIndex(state.tabbableGroups, function (_ref2) {
            var firstTabbableNode = _ref2.firstTabbableNode;
            return e.target === firstTabbableNode;
          });

          if (startOfGroupIndex < 0 && state.tabbableGroups[containerIndex].container === e.target) {
            // an exception case where the target is the container itself, in which
            //  case, we should handle shift+tab as if focus were on the container's
            //  first tabbable node, and go to the last tabbable node of the LAST group
            startOfGroupIndex = containerIndex;
          }

          if (startOfGroupIndex >= 0) {
            // YES: then shift+tab should go to the last tabbable node in the
            //  previous group (and wrap around to the last tabbable node of
            //  the LAST group if it's the first tabbable node of the FIRST group)
            var destinationGroupIndex = startOfGroupIndex === 0 ? state.tabbableGroups.length - 1 : startOfGroupIndex - 1;
            var destinationGroup = state.tabbableGroups[destinationGroupIndex];
            destinationNode = destinationGroup.lastTabbableNode;
          }
        } else {
          // FORWARD
          // is the target the last tabbable node in a group?
          var lastOfGroupIndex = findIndex(state.tabbableGroups, function (_ref3) {
            var lastTabbableNode = _ref3.lastTabbableNode;
            return e.target === lastTabbableNode;
          });

          if (lastOfGroupIndex < 0 && state.tabbableGroups[containerIndex].container === e.target) {
            // an exception case where the target is the container itself, in which
            //  case, we should handle tab as if focus were on the container's
            //  last tabbable node, and go to the first tabbable node of the FIRST group
            lastOfGroupIndex = containerIndex;
          }

          if (lastOfGroupIndex >= 0) {
            // YES: then tab should go to the first tabbable node in the next
            //  group (and wrap around to the first tabbable node of the FIRST
            //  group if it's the last tabbable node of the LAST group)
            var _destinationGroupIndex = lastOfGroupIndex === state.tabbableGroups.length - 1 ? 0 : lastOfGroupIndex + 1;

            var _destinationGroup = state.tabbableGroups[_destinationGroupIndex];
            destinationNode = _destinationGroup.firstTabbableNode;
          }
        }
      } else {
        destinationNode = getNodeForOption('fallbackFocus');
      }

      if (destinationNode) {
        e.preventDefault();
        tryFocus(destinationNode);
      } // else, let the browser take care of [shift+]tab and move the focus

    };

    var checkKey = function checkKey(e) {
      if (isEscapeEvent(e) && valueOrHandler(config.escapeDeactivates) !== false) {
        e.preventDefault();
        trap.deactivate();
        return;
      }

      if (isTabEvent(e)) {
        checkTab(e);
        return;
      }
    };

    var checkClick = function checkClick(e) {
      if (valueOrHandler(config.clickOutsideDeactivates, e)) {
        return;
      }

      if (containersContain(e.target)) {
        return;
      }

      if (valueOrHandler(config.allowOutsideClick, e)) {
        return;
      }

      e.preventDefault();
      e.stopImmediatePropagation();
    }; //
    // EVENT LISTENERS
    //


    var addListeners = function addListeners() {
      if (!state.active) {
        return;
      } // There can be only one listening focus trap at a time


      activeFocusTraps.activateTrap(trap); // Delay ensures that the focused element doesn't capture the event
      // that caused the focus trap activation.

      state.delayInitialFocusTimer = config.delayInitialFocus ? delay(function () {
        tryFocus(getInitialFocusNode());
      }) : tryFocus(getInitialFocusNode());
      doc.addEventListener('focusin', checkFocusIn, true);
      doc.addEventListener('mousedown', checkPointerDown, {
        capture: true,
        passive: false
      });
      doc.addEventListener('touchstart', checkPointerDown, {
        capture: true,
        passive: false
      });
      doc.addEventListener('click', checkClick, {
        capture: true,
        passive: false
      });
      doc.addEventListener('keydown', checkKey, {
        capture: true,
        passive: false
      });
      return trap;
    };

    var removeListeners = function removeListeners() {
      if (!state.active) {
        return;
      }

      doc.removeEventListener('focusin', checkFocusIn, true);
      doc.removeEventListener('mousedown', checkPointerDown, true);
      doc.removeEventListener('touchstart', checkPointerDown, true);
      doc.removeEventListener('click', checkClick, true);
      doc.removeEventListener('keydown', checkKey, true);
      return trap;
    }; //
    // TRAP DEFINITION
    //


    trap = {
      activate: function activate(activateOptions) {
        if (state.active) {
          return this;
        }

        var onActivate = getOption(activateOptions, 'onActivate');
        var onPostActivate = getOption(activateOptions, 'onPostActivate');
        var checkCanFocusTrap = getOption(activateOptions, 'checkCanFocusTrap');

        if (!checkCanFocusTrap) {
          updateTabbableNodes();
        }

        state.active = true;
        state.paused = false;
        state.nodeFocusedBeforeActivation = doc.activeElement;

        if (onActivate) {
          onActivate();
        }

        var finishActivation = function finishActivation() {
          if (checkCanFocusTrap) {
            updateTabbableNodes();
          }

          addListeners();

          if (onPostActivate) {
            onPostActivate();
          }
        };

        if (checkCanFocusTrap) {
          checkCanFocusTrap(state.containers.concat()).then(finishActivation, finishActivation);
          return this;
        }

        finishActivation();
        return this;
      },
      deactivate: function deactivate(deactivateOptions) {
        if (!state.active) {
          return this;
        }

        clearTimeout(state.delayInitialFocusTimer); // noop if undefined

        state.delayInitialFocusTimer = undefined;
        removeListeners();
        state.active = false;
        state.paused = false;
        activeFocusTraps.deactivateTrap(trap);
        var onDeactivate = getOption(deactivateOptions, 'onDeactivate');
        var onPostDeactivate = getOption(deactivateOptions, 'onPostDeactivate');
        var checkCanReturnFocus = getOption(deactivateOptions, 'checkCanReturnFocus');

        if (onDeactivate) {
          onDeactivate();
        }

        var returnFocus = getOption(deactivateOptions, 'returnFocus', 'returnFocusOnDeactivate');

        var finishDeactivation = function finishDeactivation() {
          delay(function () {
            if (returnFocus) {
              tryFocus(getReturnFocusNode(state.nodeFocusedBeforeActivation));
            }

            if (onPostDeactivate) {
              onPostDeactivate();
            }
          });
        };

        if (returnFocus && checkCanReturnFocus) {
          checkCanReturnFocus(getReturnFocusNode(state.nodeFocusedBeforeActivation)).then(finishDeactivation, finishDeactivation);
          return this;
        }

        finishDeactivation();
        return this;
      },
      pause: function pause() {
        if (state.paused || !state.active) {
          return this;
        }

        state.paused = true;
        removeListeners();
        return this;
      },
      unpause: function unpause() {
        if (!state.paused || !state.active) {
          return this;
        }

        state.paused = false;
        updateTabbableNodes();
        addListeners();
        return this;
      },
      updateContainerElements: function updateContainerElements(containerElements) {
        var elementsAsArray = [].concat(containerElements).filter(Boolean);
        state.containers = elementsAsArray.map(function (element) {
          return typeof element === 'string' ? doc.querySelector(element) : element;
        });

        if (state.active) {
          updateTabbableNodes();
        }

        return this;
      }
    }; // initialize container elements

    trap.updateContainerElements(elements);
    return trap;
  };

  function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

  // Older browsers don't support event options, feature detect it.

  // Adopted and modified solution from Bohdan Didukh (2017)
  // https://stackoverflow.com/questions/41594997/ios-10-safari-prevent-scrolling-behind-a-fixed-overlay-and-maintain-scroll-posi

  var hasPassiveEvents = false;
  if (typeof window !== 'undefined') {
    var passiveTestOptions = {
      get passive() {
        hasPassiveEvents = true;
        return undefined;
      }
    };
    window.addEventListener('testPassive', null, passiveTestOptions);
    window.removeEventListener('testPassive', null, passiveTestOptions);
  }

  var isIosDevice = typeof window !== 'undefined' && window.navigator && window.navigator.platform && (/iP(ad|hone|od)/.test(window.navigator.platform) || window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);


  var locks = [];
  var documentListenerAdded = false;
  var initialClientY = -1;
  var previousBodyOverflowSetting = void 0;
  var previousBodyPaddingRight = void 0;

  // returns true if `el` should be allowed to receive touchmove events.
  var allowTouchMove = function allowTouchMove(el) {
    return locks.some(function (lock) {
      if (lock.options.allowTouchMove && lock.options.allowTouchMove(el)) {
        return true;
      }

      return false;
    });
  };

  var preventDefault$1 = function preventDefault(rawEvent) {
    var e = rawEvent || window.event;

    // For the case whereby consumers adds a touchmove event listener to document.
    // Recall that we do document.addEventListener('touchmove', preventDefault, { passive: false })
    // in disableBodyScroll - so if we provide this opportunity to allowTouchMove, then
    // the touchmove event on document will break.
    if (allowTouchMove(e.target)) {
      return true;
    }

    // Do not prevent if the event has more than one touch (usually meaning this is a multi touch gesture like pinch to zoom).
    if (e.touches.length > 1) return true;

    if (e.preventDefault) e.preventDefault();

    return false;
  };

  var setOverflowHidden = function setOverflowHidden(options) {
    // If previousBodyPaddingRight is already set, don't set it again.
    if (previousBodyPaddingRight === undefined) {
      var _reserveScrollBarGap = !!options && options.reserveScrollBarGap === true;
      var scrollBarGap = window.innerWidth - document.documentElement.clientWidth;

      if (_reserveScrollBarGap && scrollBarGap > 0) {
        previousBodyPaddingRight = document.body.style.paddingRight;
        document.body.style.paddingRight = scrollBarGap + 'px';
      }
    }

    // If previousBodyOverflowSetting is already set, don't set it again.
    if (previousBodyOverflowSetting === undefined) {
      previousBodyOverflowSetting = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
  };

  var restoreOverflowSetting = function restoreOverflowSetting() {
    if (previousBodyPaddingRight !== undefined) {
      document.body.style.paddingRight = previousBodyPaddingRight;

      // Restore previousBodyPaddingRight to undefined so setOverflowHidden knows it
      // can be set again.
      previousBodyPaddingRight = undefined;
    }

    if (previousBodyOverflowSetting !== undefined) {
      document.body.style.overflow = previousBodyOverflowSetting;

      // Restore previousBodyOverflowSetting to undefined
      // so setOverflowHidden knows it can be set again.
      previousBodyOverflowSetting = undefined;
    }
  };

  // https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollHeight#Problems_and_solutions
  var isTargetElementTotallyScrolled = function isTargetElementTotallyScrolled(targetElement) {
    return targetElement ? targetElement.scrollHeight - targetElement.scrollTop <= targetElement.clientHeight : false;
  };

  var handleScroll = function handleScroll(event, targetElement) {
    var clientY = event.targetTouches[0].clientY - initialClientY;

    if (allowTouchMove(event.target)) {
      return false;
    }

    if (targetElement && targetElement.scrollTop === 0 && clientY > 0) {
      // element is at the top of its scroll.
      return preventDefault$1(event);
    }

    if (isTargetElementTotallyScrolled(targetElement) && clientY < 0) {
      // element is at the bottom of its scroll.
      return preventDefault$1(event);
    }

    event.stopPropagation();
    return true;
  };

  var disableBodyScroll = function disableBodyScroll(targetElement, options) {
    // targetElement must be provided
    if (!targetElement) {
      // eslint-disable-next-line no-console
      console.error('disableBodyScroll unsuccessful - targetElement must be provided when calling disableBodyScroll on IOS devices.');
      return;
    }

    // disableBodyScroll must not have been called on this targetElement before
    if (locks.some(function (lock) {
      return lock.targetElement === targetElement;
    })) {
      return;
    }

    var lock = {
      targetElement: targetElement,
      options: options || {}
    };

    locks = [].concat(_toConsumableArray(locks), [lock]);

    if (isIosDevice) {
      targetElement.ontouchstart = function (event) {
        if (event.targetTouches.length === 1) {
          // detect single touch.
          initialClientY = event.targetTouches[0].clientY;
        }
      };
      targetElement.ontouchmove = function (event) {
        if (event.targetTouches.length === 1) {
          // detect single touch.
          handleScroll(event, targetElement);
        }
      };

      if (!documentListenerAdded) {
        document.addEventListener('touchmove', preventDefault$1, hasPassiveEvents ? { passive: false } : undefined);
        documentListenerAdded = true;
      }
    } else {
      setOverflowHidden(options);
    }
  };

  var enableBodyScroll = function enableBodyScroll(targetElement) {
    if (!targetElement) {
      // eslint-disable-next-line no-console
      console.error('enableBodyScroll unsuccessful - targetElement must be provided when calling enableBodyScroll on IOS devices.');
      return;
    }

    locks = locks.filter(function (lock) {
      return lock.targetElement !== targetElement;
    });

    if (isIosDevice) {
      targetElement.ontouchstart = null;
      targetElement.ontouchmove = null;

      if (documentListenerAdded && locks.length === 0) {
        document.removeEventListener('touchmove', preventDefault$1, hasPassiveEvents ? { passive: false } : undefined);
        documentListenerAdded = false;
      }
    } else if (!locks.length) {
      restoreOverflowSetting();
    }
  };

  var n=function(n){if("object"!=typeof(t=n)||Array.isArray(t))throw "state should be an object";var t;},t$2=function(n,t,e,c){return (r=n,r.reduce(function(n,t,e){return n.indexOf(t)>-1?n:n.concat(t)},[])).reduce(function(n,e){return n.concat(t[e]||[])},[]).map(function(n){return n(e,c)});var r;},e$1=a(),c=e$1.on,r$2=e$1.emit,o=e$1.hydrate;e$1.getState;function a(e){void 0===e&&(e={});var c={};return {getState:function(){return Object.assign({},e)},hydrate:function(r){return n(r),Object.assign(e,r),function(){var n=["*"].concat(Object.keys(r));t$2(n,c,e);}},on:function(n,t){return (n=[].concat(n)).map(function(n){return c[n]=(c[n]||[]).concat(t)}),function(){return n.map(function(n){return c[n].splice(c[n].indexOf(t),1)})}},emit:function(r,o,u){var a=("*"===r?[]:["*"]).concat(r);(o="function"==typeof o?o(e):o)&&(n(o),Object.assign(e,o),a=a.concat(Object.keys(o))),t$2(a,c,e,u);}}}

  /*!
   * slide-anim
   * https://github.com/yomotsu/slide-anim
   * (c) 2017 @yomotsu
   * Released under the MIT License.
   */
  var global$2 = window;
  var isPromiseSuppoted = typeof global$2.Promise === 'function';
  var PromiseLike = isPromiseSuppoted ? global$2.Promise : (function () {
      function PromiseLike(executor) {
          var callback = function () { };
          var resolve = function () {
              callback();
          };
          executor(resolve);
          return {
              then: function (_callback) {
                  callback = _callback;
              }
          };
      }
      return PromiseLike;
  }());

  var pool = [];
  var inAnimItems = {
      add: function (el, defaultStyle, timeoutId, onCancelled) {
          var inAnimItem = { el: el, defaultStyle: defaultStyle, timeoutId: timeoutId, onCancelled: onCancelled };
          this.remove(el);
          pool.push(inAnimItem);
      },
      remove: function (el) {
          var index = inAnimItems.findIndex(el);
          if (index === -1)
              return;
          var inAnimItem = pool[index];
          clearTimeout(inAnimItem.timeoutId);
          inAnimItem.onCancelled();
          pool.splice(index, 1);
      },
      find: function (el) {
          return pool[inAnimItems.findIndex(el)];
      },
      findIndex: function (el) {
          var index = -1;
          pool.some(function (item, i) {
              if (item.el === el) {
                  index = i;
                  return true;
              }
              return false;
          });
          return index;
      }
  };

  var CSS_EASEOUT_EXPO = 'cubic-bezier( 0.19, 1, 0.22, 1 )';
  function slideDown(el, options) {
      if (options === void 0) { options = {}; }
      return new PromiseLike(function (resolve) {
          if (inAnimItems.findIndex(el) !== -1)
              return;
          var _isVisible = isVisible(el);
          var hasEndHeight = typeof options.endHeight === 'number';
          var display = options.display || 'block';
          var duration = options.duration || 400;
          var onCancelled = options.onCancelled || function () { };
          var defaultStyle = el.getAttribute('style') || '';
          var style = window.getComputedStyle(el);
          var defaultStyles = getDefaultStyles(el, display);
          var isBorderBox = /border-box/.test(style.getPropertyValue('box-sizing'));
          var contentHeight = defaultStyles.height;
          var minHeight = defaultStyles.minHeight;
          var paddingTop = defaultStyles.paddingTop;
          var paddingBottom = defaultStyles.paddingBottom;
          var borderTop = defaultStyles.borderTop;
          var borderBottom = defaultStyles.borderBottom;
          var cssDuration = duration + "ms";
          var cssEasing = CSS_EASEOUT_EXPO;
          var cssTransition = [
              "height " + cssDuration + " " + cssEasing,
              "min-height " + cssDuration + " " + cssEasing,
              "padding " + cssDuration + " " + cssEasing,
              "border-width " + cssDuration + " " + cssEasing
          ].join();
          var startHeight = _isVisible ? style.height : '0px';
          var startMinHeight = _isVisible ? style.minHeight : '0px';
          var startPaddingTop = _isVisible ? style.paddingTop : '0px';
          var startPaddingBottom = _isVisible ? style.paddingBottom : '0px';
          var startBorderTopWidth = _isVisible ? style.borderTopWidth : '0px';
          var startBorderBottomWidth = _isVisible ? style.borderBottomWidth : '0px';
          var endHeight = (function () {
              if (hasEndHeight)
                  return options.endHeight + "px";
              return !isBorderBox ?
                  contentHeight - paddingTop - paddingBottom + "px" :
                  contentHeight + borderTop + borderBottom + "px";
          })();
          var endMinHeight = minHeight + "px";
          var endPaddingTop = paddingTop + "px";
          var endPaddingBottom = paddingBottom + "px";
          var endBorderTopWidth = borderTop + "px";
          var endBorderBottomWidth = borderBottom + "px";
          if (startHeight === endHeight &&
              startPaddingTop === endPaddingTop &&
              startPaddingBottom === endPaddingBottom &&
              startBorderTopWidth === endBorderTopWidth &&
              startBorderBottomWidth === endBorderBottomWidth) {
              resolve();
              return;
          }
          requestAnimationFrame(function () {
              el.style.height = startHeight;
              el.style.minHeight = startMinHeight;
              el.style.paddingTop = startPaddingTop;
              el.style.paddingBottom = startPaddingBottom;
              el.style.borderTopWidth = startBorderTopWidth;
              el.style.borderBottomWidth = startBorderBottomWidth;
              el.style.display = display;
              el.style.overflow = 'hidden';
              el.style.visibility = 'visible';
              el.style.transition = cssTransition;
              el.style.webkitTransition = cssTransition;
              requestAnimationFrame(function () {
                  el.style.height = endHeight;
                  el.style.minHeight = endMinHeight;
                  el.style.paddingTop = endPaddingTop;
                  el.style.paddingBottom = endPaddingBottom;
                  el.style.borderTopWidth = endBorderTopWidth;
                  el.style.borderBottomWidth = endBorderBottomWidth;
              });
          });
          var timeoutId = setTimeout(function () {
              resetStyle(el);
              el.style.display = display;
              if (hasEndHeight) {
                  el.style.height = options.endHeight + "px";
                  el.style.overflow = "hidden";
              }
              inAnimItems.remove(el);
              resolve();
          }, duration);
          inAnimItems.add(el, defaultStyle, timeoutId, onCancelled);
      });
  }
  function slideUp(el, options) {
      if (options === void 0) { options = {}; }
      return new PromiseLike(function (resolve) {
          if (inAnimItems.findIndex(el) !== -1)
              return;
          var _isVisible = isVisible(el);
          var display = options.display || 'block';
          var duration = options.duration || 400;
          var onCancelled = options.onCancelled || function () { };
          if (!_isVisible) {
              resolve();
              return;
          }
          var defaultStyle = el.getAttribute('style') || '';
          var style = window.getComputedStyle(el);
          var isBorderBox = /border-box/.test(style.getPropertyValue('box-sizing'));
          var minHeight = pxToNumber(style.getPropertyValue('min-height'));
          var paddingTop = pxToNumber(style.getPropertyValue('padding-top'));
          var paddingBottom = pxToNumber(style.getPropertyValue('padding-bottom'));
          var borderTop = pxToNumber(style.getPropertyValue('border-top-width'));
          var borderBottom = pxToNumber(style.getPropertyValue('border-bottom-width'));
          var contentHeight = el.scrollHeight;
          var cssDuration = duration + 'ms';
          var cssEasing = CSS_EASEOUT_EXPO;
          var cssTransition = [
              "height " + cssDuration + " " + cssEasing,
              "padding " + cssDuration + " " + cssEasing,
              "border-width " + cssDuration + " " + cssEasing
          ].join();
          var startHeight = !isBorderBox ?
              contentHeight - paddingTop - paddingBottom + "px" :
              contentHeight + borderTop + borderBottom + "px";
          var startMinHeight = minHeight + "px";
          var startPaddingTop = paddingTop + "px";
          var startPaddingBottom = paddingBottom + "px";
          var startBorderTopWidth = borderTop + "px";
          var startBorderBottomWidth = borderBottom + "px";
          requestAnimationFrame(function () {
              el.style.height = startHeight;
              el.style.minHeight = startMinHeight;
              el.style.paddingTop = startPaddingTop;
              el.style.paddingBottom = startPaddingBottom;
              el.style.borderTopWidth = startBorderTopWidth;
              el.style.borderBottomWidth = startBorderBottomWidth;
              el.style.display = display;
              el.style.overflow = 'hidden';
              el.style.transition = cssTransition;
              el.style.webkitTransition = cssTransition;
              requestAnimationFrame(function () {
                  el.style.height = '0';
                  el.style.minHeight = '0';
                  el.style.paddingTop = '0';
                  el.style.paddingBottom = '0';
                  el.style.borderTopWidth = '0';
                  el.style.borderBottomWidth = '0';
              });
          });
          var timeoutId = setTimeout(function () {
              resetStyle(el);
              el.style.display = 'none';
              inAnimItems.remove(el);
              resolve();
          }, duration);
          inAnimItems.add(el, defaultStyle, timeoutId, onCancelled);
      });
  }
  function slideStop(el) {
      var elementObject = inAnimItems.find(el);
      if (!elementObject)
          return;
      var style = window.getComputedStyle(el);
      var height = style.height;
      var paddingTop = style.paddingTop;
      var paddingBottom = style.paddingBottom;
      var borderTopWidth = style.borderTopWidth;
      var borderBottomWidth = style.borderBottomWidth;
      resetStyle(el);
      el.style.height = height;
      el.style.paddingTop = paddingTop;
      el.style.paddingBottom = paddingBottom;
      el.style.borderTopWidth = borderTopWidth;
      el.style.borderBottomWidth = borderBottomWidth;
      el.style.overflow = 'hidden';
      inAnimItems.remove(el);
  }
  function isVisible(el) {
      return el.offsetHeight !== 0;
  }
  function resetStyle(el) {
      el.style.visibility = '';
      el.style.height = '';
      el.style.minHeight = '';
      el.style.paddingTop = '';
      el.style.paddingBottom = '';
      el.style.borderTopWidth = '';
      el.style.borderBottomWidth = '';
      el.style.overflow = '';
      el.style.transition = '';
      el.style.webkitTransition = '';
  }
  function getDefaultStyles(el, defaultDisplay) {
      if (defaultDisplay === void 0) { defaultDisplay = 'block'; }
      var defaultStyle = el.getAttribute('style') || '';
      var style = window.getComputedStyle(el);
      el.style.visibility = 'hidden';
      el.style.display = defaultDisplay;
      var width = pxToNumber(style.getPropertyValue('width'));
      el.style.position = 'absolute';
      el.style.width = width + "px";
      el.style.height = '';
      el.style.minHeight = '';
      el.style.paddingTop = '';
      el.style.paddingBottom = '';
      el.style.borderTopWidth = '';
      el.style.borderBottomWidth = '';
      var minHeight = pxToNumber(style.getPropertyValue('min-height'));
      var paddingTop = pxToNumber(style.getPropertyValue('padding-top'));
      var paddingBottom = pxToNumber(style.getPropertyValue('padding-bottom'));
      var borderTop = pxToNumber(style.getPropertyValue('border-top-width'));
      var borderBottom = pxToNumber(style.getPropertyValue('border-bottom-width'));
      var height = el.scrollHeight;
      el.setAttribute('style', defaultStyle);
      return {
          height: height,
          minHeight: minHeight,
          paddingTop: paddingTop,
          paddingBottom: paddingBottom,
          borderTop: borderTop,
          borderBottom: borderBottom
      };
  }
  function pxToNumber(px) {
      return +px.replace(/px/, '');
  }

  function accordion(node, options) {
    const labels = t$3('.accordion__label', node);
    const text = t$3('.accordion__text', node); // Make it accessible by keyboard

    labels.forEach(label => {
      label.href = '#';
      const existingIcon = n$1('.icon', label);

      if (!existingIcon) {
        const icon = document.createElement('div');
        icon.classList.add('icon', 'icon-accordion');
        icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 24 24"><path d="M7 10L12 15L17 10H7Z" fill="currentColor"/></svg>`;
        label.append(icon);
      }
    });
    text.forEach(t => u(t, 'measure'));
    const labelClick = e$2(labels, 'click', e => {
      e.preventDefault();
      const label = e.currentTarget;
      const {
        parentNode: group,
        nextElementSibling: content
      } = label;
      slideStop(content);

      if (isVisible(content)) {
        _close(label, group, content);
      } else {
        _open(label, group, content);
      }
    });

    function _open(label, group, content) {
      slideDown(content);
      group.setAttribute('data-open', true);
      label.setAttribute('aria-expanded', true);
      content.setAttribute('aria-hidden', false);
    }

    function _close(label, group, content) {
      slideUp(content);
      group.setAttribute('data-open', false);
      label.setAttribute('aria-expanded', false);
      content.setAttribute('aria-hidden', true);
    }

    if (options.firstOpen) {
      // Open first accordion label
      const {
        parentNode: group,
        nextElementSibling: content
      } = labels[0];

      _open(labels[0], group, content);
    }

    function destroy() {
      return () => labelClick();
    }

    return {
      destroy
    };
  }

  function Accordions(elements, options = {}) {
    if (Array.isArray(elements) && !elements.length) return;
    const defaultOptions = {
      firstOpen: true
    };
    const opts = Object.assign(defaultOptions, options);
    let accordions = [];

    if (elements.length) {
      accordions = elements.map(node => accordion(node, opts));
    } else {
      accordions.push(accordion(elements, opts));
    }

    function unload() {
      accordions.forEach(accordion => accordion.destroy());
    }

    return {
      unload
    };
  }

  const classes$f = {
    visible: 'is-visible',
    active: 'active',
    fixed: 'is-fixed'
  };
  const selectors$u = {
    closeBtn: '[data-modal-close]',
    wash: '.modal__wash',
    modalContent: '.modal__content',
    accordion: '.accordion'
  };

  const modal = node => {
    const focusTrap = createFocusTrap(node, {
      allowOutsideClick: true
    });
    const wash = n$1(selectors$u.wash, node.parentNode);
    const modalContent = n$1(selectors$u.modalContent, node);
    let accordion = null;
    const events = [e$2([n$1(selectors$u.closeBtn, node), wash], 'click', e => {
      e.preventDefault();

      _close();
    }), e$2(node, 'keydown', ({
      keyCode
    }) => {
      if (keyCode === 27) _close();
    }), c('modal:open', (state, {
      modalContent,
      narrow = false
    }) => {
      l(node, 'modal--narrow', narrow);

      _renderModalContent(modalContent);

      _open();
    })];

    const _renderModalContent = content => {
      const clonedContent = content.cloneNode(true);
      modalContent.innerHTML = '';
      modalContent.appendChild(clonedContent);

      _initAccordion();
    };

    const _initAccordion = () => {
      accordion = Accordions(t$3('.accordion', node));
    };

    const _open = () => {
      // Due to this component being shared between templates we have to
      // animate around it being fixed to the window
      u(node, classes$f.fixed);
      setTimeout(() => {
        u(node, classes$f.visible);
        u(node, classes$f.active);
      }, 50);
      focusTrap.activate();
      disableBodyScroll(node, {
        allowTouchMove: el => {
          while (el && el !== document.body) {
            if (el.getAttribute('data-scroll-lock-ignore') !== null) {
              return true;
            }

            el = el.parentNode;
          }
        },
        reserveScrollBarGap: true
      });
    };

    const _close = () => {
      focusTrap.deactivate();
      i(node, classes$f.visible);
      i(node, classes$f.active);
      enableBodyScroll(node);
      setTimeout(() => {
        i(node, classes$f.fixed);
        modalContent.innerHTML = '';
      }, 300);
    };

    const unload = () => {
      events.forEach(unsubscribe => unsubscribe());
      accordion.unload();
    };

    return {
      unload
    };
  };

  function t$1(){try{return localStorage.setItem("test","test"),localStorage.removeItem("test"),!0}catch(t){return !1}}function e(e){if(t$1())return JSON.parse(localStorage.getItem("neon_"+e))}function r$1(e,r){if(t$1())return localStorage.setItem("neon_"+e,r)}

  const routes$1 = window.theme.routes.cart || {};
  const paths = {
    base: `${routes$1.base || '/cart'}.js`,
    add: `${routes$1.add || '/cart/add'}.js`,
    change: `${routes$1.change || '/cart/change'}.js`,
    clear: `${routes$1.clear || '/cart/clear'}.js`
  }; // Add a `sorted` key that orders line items
  // in the order the customer added them if possible

  function sortCart(cart) {
    const order = e('cart_order') || [];

    if (order.length) {
      cart.sorted = [...cart.items].sort((a, b) => order.indexOf(a.variant_id) - order.indexOf(b.variant_id));
      return cart;
    }

    cart.sorted = cart.items;
    return cart;
  }

  function addVariant(variant, quantity) {
    const numAvailable = variant.inventory_policy === 'deny' && variant.inventory_management === 'shopify' ? variant.inventory_quantity : null; // null means they can add as many as they want

    return get().then(({
      items
    }) => {
      const existing = items.filter(item => item.id === variant.id)[0] || {};
      const numRequested = (existing.quantity || 0) + quantity;

      if (numAvailable !== null && numRequested > numAvailable) {
        const err = `There are only ${numAvailable} of that product available, requested ${numRequested}.`;
        throw new Error(err);
      } else {
        return addItemById(variant.id, quantity);
      }
    });
  }

  function updateItem(id, quantity) {
    return get().then(({
      items
    }) => {
      for (let i = 0; i < items.length; i++) {
        if (items[i].variant_id === parseInt(id)) {
          return changeItem(i + 1, quantity); // shopify cart is a 1-based index
        }
      }
    });
  }

  function changeItem(line, quantity) {
    return fetch(paths.change, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        line,
        quantity
      })
    }).then(res => res.json()).then(cart => {
      r$2('cart:updated', {
        cart: sortCart(cart)
      });
      return sortCart(cart);
    });
  }

  function addItemById(id, quantity) {
    r$2('cart:updating');
    return fetch(paths.add, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id,
        quantity
      })
    }).then(r => r.json()).then(item => {
      return get().then(cart => {
        const order = e('cart_order') || [];
        const newOrder = [item.variant_id, ...order.filter(i => i !== item.variant_id)];
        r$1('cart_order', JSON.stringify(newOrder));
        r$2('cart:updated', {
          cart: sortCart(cart)
        });
        return {
          item,
          cart: sortCart(cart)
        };
      });
    });
  }

  function get() {
    return fetch(paths.base, {
      method: 'GET',
      credentials: 'include'
    }).then(res => res.json()).then(data => {
      return sortCart(data);
    });
  }

  function addItem(form) {
    r$2('cart:updating');
    return fetch(paths.add, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: serialize(form)
    }).then(r => r.json()).then(res => {
      if (res.status == '422') {
        const errorMessage = {
          code: 422,
          message: res.description
        };
        throw errorMessage;
      }

      return get().then(cart => {
        const order = e('cart_order') || [];
        const newOrder = [res.variant_id, ...order.filter(i => i !== res.variant_id)];
        r$1('cart_order', JSON.stringify(newOrder));
        r$2('cart:updated', {
          cart: sortCart(cart)
        });
        return {
          item: res,
          cart: sortCart(cart)
        };
      });
    });
  } // !
  //  Serialize all form data into a SearchParams string
  //  (c) 2020 Chris Ferdinandi, MIT License, https://gomakethings.com
  //  @param  {Node}   form The form to serialize
  //  @return {String}      The serialized form data
  //


  function serialize(form) {
    var arr = [];
    Array.prototype.slice.call(form.elements).forEach(function (field) {
      if (!field.name || field.disabled || ['file', 'reset', 'submit', 'button'].indexOf(field.type) > -1) {
        return;
      }

      if (field.type === 'select-multiple') {
        Array.prototype.slice.call(field.options).forEach(function (option) {
          if (!option.selected) return;
          arr.push(encodeURIComponent(field.name) + '=' + encodeURIComponent(option.value));
        });
        return;
      }

      if (['checkbox', 'radio'].indexOf(field.type) > -1 && !field.checked) {
        return;
      }

      arr.push(encodeURIComponent(field.name) + '=' + encodeURIComponent(field.value));
    });
    return arr.join('&');
  }

  var cart = {
    addItem,
    addItemById,
    addVariant,
    get,
    updateItem
  };

  /**
   * Currency Helpers
   * -----------------------------------------------------------------------------
   * A collection of useful functions that help with currency formatting
   *
   * Current contents
   * - formatMoney - Takes an amount in cents and returns it as a formatted dollar value.
   *
   */

  const moneyFormat = '${{amount}}';

  /**
   * Format money values based on your shop currency settings
   * @param  {Number|string} cents - value in cents or dollar amount e.g. 300 cents
   * or 3.00 dollars
   * @param  {String} format - shop money_format setting
   * @return {String} value - formatted value
   */
  function formatMoney$1(cents, format) {
    if (typeof cents === 'string') {
      cents = cents.replace('.', '');
    }
    let value = '';
    const placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
    const formatString = format || moneyFormat;

    function formatWithDelimiters(
      number,
      precision = 2,
      thousands = ',',
      decimal = '.'
    ) {
      if (isNaN(number) || number == null) {
        return 0;
      }

      number = (number / 100.0).toFixed(precision);

      const parts = number.split('.');
      const dollarsAmount = parts[0].replace(
        /(\d)(?=(\d\d\d)+(?!\d))/g,
        `$1${thousands}`
      );
      const centsAmount = parts[1] ? decimal + parts[1] : '';

      return dollarsAmount + centsAmount;
    }

    switch (formatString.match(placeholderRegex)[1]) {
      case 'amount':
        value = formatWithDelimiters(cents, 2);
        break;
      case 'amount_no_decimals':
        value = formatWithDelimiters(cents, 0);
        break;
      case 'amount_with_comma_separator':
        value = formatWithDelimiters(cents, 2, '.', ',');
        break;
      case 'amount_no_decimals_with_comma_separator':
        value = formatWithDelimiters(cents, 0, '.', ',');
        break;
    }

    return formatString.replace(placeholderRegex, value);
  }

  var formatMoney = (val => formatMoney$1(val, window.theme.moneyFormat || '${{amount}}'));

  // Fetch the product data from the .js endpoint because it includes
  // more data than the .json endpoint.
  var getProduct = (handle => cb => fetch(`${window.theme.routes.products}/${handle}.js`).then(res => res.json()).then(data => cb(data)).catch(err => console.log(err.message)));

  /**
   * Image Helper Functions
   * -----------------------------------------------------------------------------
   * A collection of functions that help with basic image operations.
   *
   */
  /**
   * Find the Shopify image attribute size
   *
   * @param {string} src
   * @returns {null}
   */

  function imageSize(src) {
    /* eslint-disable */
    var match = src.match(/.+_((?:pico|icon|thumb|small|compact|medium|large|grande)|\d{1,4}x\d{0,4}|x\d{1,4})[_\.@]/);
    /* esling-enable */

    if (match) {
      return match[1];
    } else {
      return null;
    }
  }
  /**
   * Adds a Shopify size attribute to a URL
   *
   * @param src
   * @param size
   * @returns {*}
   */

  function getSizedImageUrl$1(src, size) {
    if (size === null) {
      return src;
    }

    if (size === 'master') {
      return removeProtocol$1(src);
    }

    var match = src.match(/\.(jpg|jpeg|gif|png|bmp|bitmap|tiff|tif)(\?v=\d+)?$/i);

    if (match) {
      var prefix = src.split(match[0]);
      var suffix = match[0];
      return removeProtocol$1(prefix[0] + '_' + size + suffix);
    } else {
      return null;
    }
  }
  function removeProtocol$1(path) {
    return path.replace(/http(s)?:/, '');
  }

  const {
    strings: {
      products: strings$6
    }
  } = window.theme;
  const selectors$t = {
    unitPriceContainer: '[data-unit-price-container]',
    unitPrice: '[data-unit-price]',
    unitPriceBase: '[data-unit-base]'
  };
  const classes$e = {
    available: 'unit-price--available'
  };

  const updateUnitPrices = (container, variant) => {
    const unitPriceContainers = t$3(selectors$t.unitPriceContainer, container);
    const unitPrices = t$3(selectors$t.unitPrice, container);
    const unitPriceBases = t$3(selectors$t.unitPriceBase, container);
    const showUnitPricing = !variant || !variant.unit_price;
    l(unitPriceContainers, classes$e.available, !showUnitPricing);
    if (!variant || !variant.unit_price) return;

    _replaceText(unitPrices, formatMoney(variant.unit_price));

    _replaceText(unitPriceBases, _getBaseUnit(variant.unit_price_measurement));
  };

  const renderUnitPrice = (unitPrice, unitPriceMeasurement) => {
    if (unitPrice && unitPriceMeasurement) {
      const label = strings$6.product.unitPrice;
      return `
      <div class="unit-price ${classes$e.available}">
        <dt>
          <span class="visually-hidden visually-hidden--inline">${label}</span>
        </dt>
        <dd class="unit-price__price">
          <span data-unit-price>${formatMoney(unitPrice)}</span><span aria-hidden="true">/</span><span class="visually-hidden">${strings$6.product.unitPriceSeparator}&nbsp;</span><span data-unit-base>${_getBaseUnit(unitPriceMeasurement)}</span>
        </dd>
      </div>
    `;
    }

    return '';
  };

  const _getBaseUnit = unitPriceMeasurement => {
    return unitPriceMeasurement.reference_value === 1 ? unitPriceMeasurement.reference_unit : unitPriceMeasurement.reference_value + unitPriceMeasurement.reference_unit;
  };

  const _replaceText = (nodeList, replacementText) => {
    nodeList.forEach(node => node.innerText = replacementText);
  };

  const classes$d = {
    visible: 'is-visible',
    active: 'active',
    fixed: 'is-fixed'
  };
  const selectors$s = {
    closeBtn: '[data-store-availability-close]',
    productTitle: '[data-store-availability-product-title]',
    variantTitle: '[data-store-availability-variant-title]',
    productCard: '[data-store-availability-product]',
    storeListcontainer: '[data-store-list-container]',
    wash: '[data-store-availability-drawer-wash]'
  };

  const storeAvailabilityDrawer = node => {
    var focusTrap = createFocusTrap(node, {
      allowOutsideClick: true
    });
    const wash = n$1(selectors$s.wash, node.parentNode);
    const productCard = n$1(selectors$s.productCard, node);
    const storeListContainer = n$1(selectors$s.storeListcontainer, node);
    const events = [e$2([n$1(selectors$s.closeBtn, node), wash], 'click', e => {
      e.preventDefault();

      _close();
    }), e$2(node, 'keydown', ({
      keyCode
    }) => {
      if (keyCode === 27) _close();
    }), c('availability:showMore', ({
      product,
      variant,
      storeList,
      options
    }) => {
      productCard.innerHTML = _renderProductCard(product, variant, options);

      _renderAvailabilityList(storeList);

      _open();
    })];

    const _renderAvailabilityList = storeList => {
      storeListContainer.innerHTML = '';
      storeListContainer.appendChild(storeList);
    };

    const _renderProductCard = ({
      featured_image: image,
      title
    }, {
      title: variant_title,
      featured_image,
      price,
      unit_price,
      unit_price_measurement
    }, {
      hideVariantTitle
    }) => {
      let productImage = _getVariantImage(image, featured_image);

      return `
      <div class="store-availbility-drawer__product-card">
        ${productImage ? `
            <div class='store-availbility-drawer__product-card-image'>
              <img src='${productImage}' alt='${title}'/>
            </div>
          ` : ''}
        <div class='store-availbility-drawer__product-card-details'>
          <div>
            <h4 class="fs-body-bold">
              <span>${title}</span>
            </h4>
            <div class="store-availbility-drawer__product-price-wrapper">
              <span class="store-availbility-drawer__product-price">${formatMoney(price)}</span>
              ${renderUnitPrice(unit_price, unit_price_measurement)}
            </div>
            <div class="store-availbility-drawer__product-card-variant${hideVariantTitle ? ' hidden' : ''}">
              ${variant_title}
            </div>
          </div>
        </div>
      </div>
    `;
    };

    const _getVariantImage = (productImage, variantImage) => {
      if (!productImage && !variantImage) return '';

      if (variantImage) {
        return _updateImageSize(variantImage.src);
      }

      return _updateImageSize(productImage);
    };

    const _updateImageSize = imageUrl => {
      return getSizedImageUrl$1(imageUrl.replace('.' + imageSize(imageUrl), ''), '200x');
    };

    const _open = () => {
      // Due to this component being shared between templates we have to
      // animate around it being fixed to the window
      u(node, classes$d.fixed);
      setTimeout(() => {
        u(node, classes$d.visible);
        u(node, classes$d.active);
      }, 50);
      node.setAttribute('aria-hidden', 'false');
      focusTrap.activate();
      disableBodyScroll(node, {
        allowTouchMove: el => {
          while (el && el !== document.body) {
            if (el.getAttribute('data-scroll-lock-ignore') !== null) {
              return true;
            }

            el = el.parentNode;
          }
        },
        reserveScrollBarGap: true
      });
    };

    const _close = () => {
      focusTrap.deactivate();
      i(node, classes$d.active);
      i(node, classes$d.visible);
      node.setAttribute('aria-hidden', 'true');
      enableBodyScroll(node);
      setTimeout(() => {
        i(node, classes$d.fixed);
      }, 300);
    };

    const unload = () => {
      events.forEach(unsubscribe => unsubscribe());
    };

    return {
      unload
    };
  };

  const {
    strings: {
      accessibility: strings$5
    }
  } = window.theme;

  const handleTab = () => {
    let tabHandler = null;
    const formElments = ['INPUT', 'TEXTAREA', 'SELECT']; // Determine if the user is a mouse or keyboard user

    function handleFirstTab(e) {
      if (e.keyCode === 9 && !formElments.includes(document.activeElement.tagName)) {
        document.body.classList.add('user-is-tabbing');
        tabHandler();
        tabHandler = e$2(window, 'mousedown', handleMouseDownOnce);
      }
    }

    function handleMouseDownOnce() {
      document.body.classList.remove('user-is-tabbing');
      tabHandler();
      tabHandler = e$2(window, 'keydown', handleFirstTab);
    }

    tabHandler = e$2(window, 'keydown', handleFirstTab);
  };

  const focusFormStatus = node => {
    const formStatus = n$1('.form-status', node);
    if (!formStatus) return;
    const focusElement = n$1('[data-form-status]', formStatus);
    focusElement.focus();
  };

  function backgroundVideoHandler(container) {
    const pause = n$1('.video-pause', container);
    const video = container.getElementsByTagName('VIDEO')[0];
    if (!pause || !video) return;
    const pauseListener = e$2(pause, 'click', e => {
      e.preventDefault();

      if (video.paused) {
        video.play();
        pause.innerText = strings$5.pause_video;
      } else {
        video.pause();
        pause.innerText = strings$5.play_video;
      }
    });
    return () => pauseListener();
  }

  const classes$c = {
    contrast: 'section--contrast',
    parentContrast: 'shopify-section--contrast',
    parentContrastBeforeFooter: 'shoping-section--contrast-before-footer',
    logoList: 'logo-list',
    parentLogoList: 'shopify-section--logo-list',
    hidden: 'hidden'
  };
  var sectionClasses = (() => {
    function adjustClasses() {
      const sections = t$3('.main .shopify-section');
      sections.forEach((section, index) => {
        const {
          firstElementChild: child
        } = section; // Add contrast class to all parents of contrast sections

        if (child && child.classList.contains(classes$c.contrast)) {
          u(section, classes$c.parentContrast); // Add spacing class if last section is a contrast section

          if (index === sections.length - 1) {
            u(section, classes$c.parentContrastBeforeFooter);
          }
        } // Add logo list class to all parents of logo lists


        if (child && child.classList.contains(classes$c.logoList)) {
          u(section, classes$c.parentLogoList);
        } // Specific to recommended hidden products


        if (child && child.classList.contains(classes$c.hidden)) {
          u(section, classes$c.hidden);
        }
      });
    }

    adjustClasses();
    e$2(document, 'shopify:section:load', adjustClasses);
  });

  var ls_objectFit = {exports: {}};

  var lazysizes = {exports: {}};

  (function (module) {
  (function(window, factory) {
  	var lazySizes = factory(window, window.document, Date);
  	window.lazySizes = lazySizes;
  	if(module.exports){
  		module.exports = lazySizes;
  	}
  }(typeof window != 'undefined' ?
        window : {}, 
  /**
   * import("./types/global")
   * @typedef { import("./types/lazysizes-config").LazySizesConfigPartial } LazySizesConfigPartial
   */
  function l(window, document, Date) { // Pass in the window Date function also for SSR because the Date class can be lost
  	/*jshint eqnull:true */

  	var lazysizes,
  		/**
  		 * @type { LazySizesConfigPartial }
  		 */
  		lazySizesCfg;

  	(function(){
  		var prop;

  		var lazySizesDefaults = {
  			lazyClass: 'lazyload',
  			loadedClass: 'lazyloaded',
  			loadingClass: 'lazyloading',
  			preloadClass: 'lazypreload',
  			errorClass: 'lazyerror',
  			//strictClass: 'lazystrict',
  			autosizesClass: 'lazyautosizes',
  			fastLoadedClass: 'ls-is-cached',
  			iframeLoadMode: 0,
  			srcAttr: 'data-src',
  			srcsetAttr: 'data-srcset',
  			sizesAttr: 'data-sizes',
  			//preloadAfterLoad: false,
  			minSize: 40,
  			customMedia: {},
  			init: true,
  			expFactor: 1.5,
  			hFac: 0.8,
  			loadMode: 2,
  			loadHidden: true,
  			ricTimeout: 0,
  			throttleDelay: 125,
  		};

  		lazySizesCfg = window.lazySizesConfig || window.lazysizesConfig || {};

  		for(prop in lazySizesDefaults){
  			if(!(prop in lazySizesCfg)){
  				lazySizesCfg[prop] = lazySizesDefaults[prop];
  			}
  		}
  	})();

  	if (!document || !document.getElementsByClassName) {
  		return {
  			init: function () {},
  			/**
  			 * @type { LazySizesConfigPartial }
  			 */
  			cfg: lazySizesCfg,
  			/**
  			 * @type { true }
  			 */
  			noSupport: true,
  		};
  	}

  	var docElem = document.documentElement;

  	var supportPicture = window.HTMLPictureElement;

  	var _addEventListener = 'addEventListener';

  	var _getAttribute = 'getAttribute';

  	/**
  	 * Update to bind to window because 'this' becomes null during SSR
  	 * builds.
  	 */
  	var addEventListener = window[_addEventListener].bind(window);

  	var setTimeout = window.setTimeout;

  	var requestAnimationFrame = window.requestAnimationFrame || setTimeout;

  	var requestIdleCallback = window.requestIdleCallback;

  	var regPicture = /^picture$/i;

  	var loadEvents = ['load', 'error', 'lazyincluded', '_lazyloaded'];

  	var regClassCache = {};

  	var forEach = Array.prototype.forEach;

  	/**
  	 * @param ele {Element}
  	 * @param cls {string}
  	 */
  	var hasClass = function(ele, cls) {
  		if(!regClassCache[cls]){
  			regClassCache[cls] = new RegExp('(\\s|^)'+cls+'(\\s|$)');
  		}
  		return regClassCache[cls].test(ele[_getAttribute]('class') || '') && regClassCache[cls];
  	};

  	/**
  	 * @param ele {Element}
  	 * @param cls {string}
  	 */
  	var addClass = function(ele, cls) {
  		if (!hasClass(ele, cls)){
  			ele.setAttribute('class', (ele[_getAttribute]('class') || '').trim() + ' ' + cls);
  		}
  	};

  	/**
  	 * @param ele {Element}
  	 * @param cls {string}
  	 */
  	var removeClass = function(ele, cls) {
  		var reg;
  		if ((reg = hasClass(ele,cls))) {
  			ele.setAttribute('class', (ele[_getAttribute]('class') || '').replace(reg, ' '));
  		}
  	};

  	var addRemoveLoadEvents = function(dom, fn, add){
  		var action = add ? _addEventListener : 'removeEventListener';
  		if(add){
  			addRemoveLoadEvents(dom, fn);
  		}
  		loadEvents.forEach(function(evt){
  			dom[action](evt, fn);
  		});
  	};

  	/**
  	 * @param elem { Element }
  	 * @param name { string }
  	 * @param detail { any }
  	 * @param noBubbles { boolean }
  	 * @param noCancelable { boolean }
  	 * @returns { CustomEvent }
  	 */
  	var triggerEvent = function(elem, name, detail, noBubbles, noCancelable){
  		var event = document.createEvent('Event');

  		if(!detail){
  			detail = {};
  		}

  		detail.instance = lazysizes;

  		event.initEvent(name, !noBubbles, !noCancelable);

  		event.detail = detail;

  		elem.dispatchEvent(event);
  		return event;
  	};

  	var updatePolyfill = function (el, full){
  		var polyfill;
  		if( !supportPicture && ( polyfill = (window.picturefill || lazySizesCfg.pf) ) ){
  			if(full && full.src && !el[_getAttribute]('srcset')){
  				el.setAttribute('srcset', full.src);
  			}
  			polyfill({reevaluate: true, elements: [el]});
  		} else if(full && full.src){
  			el.src = full.src;
  		}
  	};

  	var getCSS = function (elem, style){
  		return (getComputedStyle(elem, null) || {})[style];
  	};

  	/**
  	 *
  	 * @param elem { Element }
  	 * @param parent { Element }
  	 * @param [width] {number}
  	 * @returns {number}
  	 */
  	var getWidth = function(elem, parent, width){
  		width = width || elem.offsetWidth;

  		while(width < lazySizesCfg.minSize && parent && !elem._lazysizesWidth){
  			width =  parent.offsetWidth;
  			parent = parent.parentNode;
  		}

  		return width;
  	};

  	var rAF = (function(){
  		var running, waiting;
  		var firstFns = [];
  		var secondFns = [];
  		var fns = firstFns;

  		var run = function(){
  			var runFns = fns;

  			fns = firstFns.length ? secondFns : firstFns;

  			running = true;
  			waiting = false;

  			while(runFns.length){
  				runFns.shift()();
  			}

  			running = false;
  		};

  		var rafBatch = function(fn, queue){
  			if(running && !queue){
  				fn.apply(this, arguments);
  			} else {
  				fns.push(fn);

  				if(!waiting){
  					waiting = true;
  					(document.hidden ? setTimeout : requestAnimationFrame)(run);
  				}
  			}
  		};

  		rafBatch._lsFlush = run;

  		return rafBatch;
  	})();

  	var rAFIt = function(fn, simple){
  		return simple ?
  			function() {
  				rAF(fn);
  			} :
  			function(){
  				var that = this;
  				var args = arguments;
  				rAF(function(){
  					fn.apply(that, args);
  				});
  			}
  		;
  	};

  	var throttle = function(fn){
  		var running;
  		var lastTime = 0;
  		var gDelay = lazySizesCfg.throttleDelay;
  		var rICTimeout = lazySizesCfg.ricTimeout;
  		var run = function(){
  			running = false;
  			lastTime = Date.now();
  			fn();
  		};
  		var idleCallback = requestIdleCallback && rICTimeout > 49 ?
  			function(){
  				requestIdleCallback(run, {timeout: rICTimeout});

  				if(rICTimeout !== lazySizesCfg.ricTimeout){
  					rICTimeout = lazySizesCfg.ricTimeout;
  				}
  			} :
  			rAFIt(function(){
  				setTimeout(run);
  			}, true)
  		;

  		return function(isPriority){
  			var delay;

  			if((isPriority = isPriority === true)){
  				rICTimeout = 33;
  			}

  			if(running){
  				return;
  			}

  			running =  true;

  			delay = gDelay - (Date.now() - lastTime);

  			if(delay < 0){
  				delay = 0;
  			}

  			if(isPriority || delay < 9){
  				idleCallback();
  			} else {
  				setTimeout(idleCallback, delay);
  			}
  		};
  	};

  	//based on http://modernjavascript.blogspot.de/2013/08/building-better-debounce.html
  	var debounce = function(func) {
  		var timeout, timestamp;
  		var wait = 99;
  		var run = function(){
  			timeout = null;
  			func();
  		};
  		var later = function() {
  			var last = Date.now() - timestamp;

  			if (last < wait) {
  				setTimeout(later, wait - last);
  			} else {
  				(requestIdleCallback || run)(run);
  			}
  		};

  		return function() {
  			timestamp = Date.now();

  			if (!timeout) {
  				timeout = setTimeout(later, wait);
  			}
  		};
  	};

  	var loader = (function(){
  		var preloadElems, isCompleted, resetPreloadingTimer, loadMode, started;

  		var eLvW, elvH, eLtop, eLleft, eLright, eLbottom, isBodyHidden;

  		var regImg = /^img$/i;
  		var regIframe = /^iframe$/i;

  		var supportScroll = ('onscroll' in window) && !(/(gle|ing)bot/.test(navigator.userAgent));

  		var shrinkExpand = 0;
  		var currentExpand = 0;

  		var isLoading = 0;
  		var lowRuns = -1;

  		var resetPreloading = function(e){
  			isLoading--;
  			if(!e || isLoading < 0 || !e.target){
  				isLoading = 0;
  			}
  		};

  		var isVisible = function (elem) {
  			if (isBodyHidden == null) {
  				isBodyHidden = getCSS(document.body, 'visibility') == 'hidden';
  			}

  			return isBodyHidden || !(getCSS(elem.parentNode, 'visibility') == 'hidden' && getCSS(elem, 'visibility') == 'hidden');
  		};

  		var isNestedVisible = function(elem, elemExpand){
  			var outerRect;
  			var parent = elem;
  			var visible = isVisible(elem);

  			eLtop -= elemExpand;
  			eLbottom += elemExpand;
  			eLleft -= elemExpand;
  			eLright += elemExpand;

  			while(visible && (parent = parent.offsetParent) && parent != document.body && parent != docElem){
  				visible = ((getCSS(parent, 'opacity') || 1) > 0);

  				if(visible && getCSS(parent, 'overflow') != 'visible'){
  					outerRect = parent.getBoundingClientRect();
  					visible = eLright > outerRect.left &&
  						eLleft < outerRect.right &&
  						eLbottom > outerRect.top - 1 &&
  						eLtop < outerRect.bottom + 1
  					;
  				}
  			}

  			return visible;
  		};

  		var checkElements = function() {
  			var eLlen, i, rect, autoLoadElem, loadedSomething, elemExpand, elemNegativeExpand, elemExpandVal,
  				beforeExpandVal, defaultExpand, preloadExpand, hFac;
  			var lazyloadElems = lazysizes.elements;

  			if((loadMode = lazySizesCfg.loadMode) && isLoading < 8 && (eLlen = lazyloadElems.length)){

  				i = 0;

  				lowRuns++;

  				for(; i < eLlen; i++){

  					if(!lazyloadElems[i] || lazyloadElems[i]._lazyRace){continue;}

  					if(!supportScroll || (lazysizes.prematureUnveil && lazysizes.prematureUnveil(lazyloadElems[i]))){unveilElement(lazyloadElems[i]);continue;}

  					if(!(elemExpandVal = lazyloadElems[i][_getAttribute]('data-expand')) || !(elemExpand = elemExpandVal * 1)){
  						elemExpand = currentExpand;
  					}

  					if (!defaultExpand) {
  						defaultExpand = (!lazySizesCfg.expand || lazySizesCfg.expand < 1) ?
  							docElem.clientHeight > 500 && docElem.clientWidth > 500 ? 500 : 370 :
  							lazySizesCfg.expand;

  						lazysizes._defEx = defaultExpand;

  						preloadExpand = defaultExpand * lazySizesCfg.expFactor;
  						hFac = lazySizesCfg.hFac;
  						isBodyHidden = null;

  						if(currentExpand < preloadExpand && isLoading < 1 && lowRuns > 2 && loadMode > 2 && !document.hidden){
  							currentExpand = preloadExpand;
  							lowRuns = 0;
  						} else if(loadMode > 1 && lowRuns > 1 && isLoading < 6){
  							currentExpand = defaultExpand;
  						} else {
  							currentExpand = shrinkExpand;
  						}
  					}

  					if(beforeExpandVal !== elemExpand){
  						eLvW = innerWidth + (elemExpand * hFac);
  						elvH = innerHeight + elemExpand;
  						elemNegativeExpand = elemExpand * -1;
  						beforeExpandVal = elemExpand;
  					}

  					rect = lazyloadElems[i].getBoundingClientRect();

  					if ((eLbottom = rect.bottom) >= elemNegativeExpand &&
  						(eLtop = rect.top) <= elvH &&
  						(eLright = rect.right) >= elemNegativeExpand * hFac &&
  						(eLleft = rect.left) <= eLvW &&
  						(eLbottom || eLright || eLleft || eLtop) &&
  						(lazySizesCfg.loadHidden || isVisible(lazyloadElems[i])) &&
  						((isCompleted && isLoading < 3 && !elemExpandVal && (loadMode < 3 || lowRuns < 4)) || isNestedVisible(lazyloadElems[i], elemExpand))){
  						unveilElement(lazyloadElems[i]);
  						loadedSomething = true;
  						if(isLoading > 9){break;}
  					} else if(!loadedSomething && isCompleted && !autoLoadElem &&
  						isLoading < 4 && lowRuns < 4 && loadMode > 2 &&
  						(preloadElems[0] || lazySizesCfg.preloadAfterLoad) &&
  						(preloadElems[0] || (!elemExpandVal && ((eLbottom || eLright || eLleft || eLtop) || lazyloadElems[i][_getAttribute](lazySizesCfg.sizesAttr) != 'auto')))){
  						autoLoadElem = preloadElems[0] || lazyloadElems[i];
  					}
  				}

  				if(autoLoadElem && !loadedSomething){
  					unveilElement(autoLoadElem);
  				}
  			}
  		};

  		var throttledCheckElements = throttle(checkElements);

  		var switchLoadingClass = function(e){
  			var elem = e.target;

  			if (elem._lazyCache) {
  				delete elem._lazyCache;
  				return;
  			}

  			resetPreloading(e);
  			addClass(elem, lazySizesCfg.loadedClass);
  			removeClass(elem, lazySizesCfg.loadingClass);
  			addRemoveLoadEvents(elem, rafSwitchLoadingClass);
  			triggerEvent(elem, 'lazyloaded');
  		};
  		var rafedSwitchLoadingClass = rAFIt(switchLoadingClass);
  		var rafSwitchLoadingClass = function(e){
  			rafedSwitchLoadingClass({target: e.target});
  		};

  		var changeIframeSrc = function(elem, src){
  			var loadMode = elem.getAttribute('data-load-mode') || lazySizesCfg.iframeLoadMode;

  			// loadMode can be also a string!
  			if (loadMode == 0) {
  				elem.contentWindow.location.replace(src);
  			} else if (loadMode == 1) {
  				elem.src = src;
  			}
  		};

  		var handleSources = function(source){
  			var customMedia;

  			var sourceSrcset = source[_getAttribute](lazySizesCfg.srcsetAttr);

  			if( (customMedia = lazySizesCfg.customMedia[source[_getAttribute]('data-media') || source[_getAttribute]('media')]) ){
  				source.setAttribute('media', customMedia);
  			}

  			if(sourceSrcset){
  				source.setAttribute('srcset', sourceSrcset);
  			}
  		};

  		var lazyUnveil = rAFIt(function (elem, detail, isAuto, sizes, isImg){
  			var src, srcset, parent, isPicture, event, firesLoad;

  			if(!(event = triggerEvent(elem, 'lazybeforeunveil', detail)).defaultPrevented){

  				if(sizes){
  					if(isAuto){
  						addClass(elem, lazySizesCfg.autosizesClass);
  					} else {
  						elem.setAttribute('sizes', sizes);
  					}
  				}

  				srcset = elem[_getAttribute](lazySizesCfg.srcsetAttr);
  				src = elem[_getAttribute](lazySizesCfg.srcAttr);

  				if(isImg) {
  					parent = elem.parentNode;
  					isPicture = parent && regPicture.test(parent.nodeName || '');
  				}

  				firesLoad = detail.firesLoad || (('src' in elem) && (srcset || src || isPicture));

  				event = {target: elem};

  				addClass(elem, lazySizesCfg.loadingClass);

  				if(firesLoad){
  					clearTimeout(resetPreloadingTimer);
  					resetPreloadingTimer = setTimeout(resetPreloading, 2500);
  					addRemoveLoadEvents(elem, rafSwitchLoadingClass, true);
  				}

  				if(isPicture){
  					forEach.call(parent.getElementsByTagName('source'), handleSources);
  				}

  				if(srcset){
  					elem.setAttribute('srcset', srcset);
  				} else if(src && !isPicture){
  					if(regIframe.test(elem.nodeName)){
  						changeIframeSrc(elem, src);
  					} else {
  						elem.src = src;
  					}
  				}

  				if(isImg && (srcset || isPicture)){
  					updatePolyfill(elem, {src: src});
  				}
  			}

  			if(elem._lazyRace){
  				delete elem._lazyRace;
  			}
  			removeClass(elem, lazySizesCfg.lazyClass);

  			rAF(function(){
  				// Part of this can be removed as soon as this fix is older: https://bugs.chromium.org/p/chromium/issues/detail?id=7731 (2015)
  				var isLoaded = elem.complete && elem.naturalWidth > 1;

  				if( !firesLoad || isLoaded){
  					if (isLoaded) {
  						addClass(elem, lazySizesCfg.fastLoadedClass);
  					}
  					switchLoadingClass(event);
  					elem._lazyCache = true;
  					setTimeout(function(){
  						if ('_lazyCache' in elem) {
  							delete elem._lazyCache;
  						}
  					}, 9);
  				}
  				if (elem.loading == 'lazy') {
  					isLoading--;
  				}
  			}, true);
  		});

  		/**
  		 *
  		 * @param elem { Element }
  		 */
  		var unveilElement = function (elem){
  			if (elem._lazyRace) {return;}
  			var detail;

  			var isImg = regImg.test(elem.nodeName);

  			//allow using sizes="auto", but don't use. it's invalid. Use data-sizes="auto" or a valid value for sizes instead (i.e.: sizes="80vw")
  			var sizes = isImg && (elem[_getAttribute](lazySizesCfg.sizesAttr) || elem[_getAttribute]('sizes'));
  			var isAuto = sizes == 'auto';

  			if( (isAuto || !isCompleted) && isImg && (elem[_getAttribute]('src') || elem.srcset) && !elem.complete && !hasClass(elem, lazySizesCfg.errorClass) && hasClass(elem, lazySizesCfg.lazyClass)){return;}

  			detail = triggerEvent(elem, 'lazyunveilread').detail;

  			if(isAuto){
  				 autoSizer.updateElem(elem, true, elem.offsetWidth);
  			}

  			elem._lazyRace = true;
  			isLoading++;

  			lazyUnveil(elem, detail, isAuto, sizes, isImg);
  		};

  		var afterScroll = debounce(function(){
  			lazySizesCfg.loadMode = 3;
  			throttledCheckElements();
  		});

  		var altLoadmodeScrollListner = function(){
  			if(lazySizesCfg.loadMode == 3){
  				lazySizesCfg.loadMode = 2;
  			}
  			afterScroll();
  		};

  		var onload = function(){
  			if(isCompleted){return;}
  			if(Date.now() - started < 999){
  				setTimeout(onload, 999);
  				return;
  			}


  			isCompleted = true;

  			lazySizesCfg.loadMode = 3;

  			throttledCheckElements();

  			addEventListener('scroll', altLoadmodeScrollListner, true);
  		};

  		return {
  			_: function(){
  				started = Date.now();

  				lazysizes.elements = document.getElementsByClassName(lazySizesCfg.lazyClass);
  				preloadElems = document.getElementsByClassName(lazySizesCfg.lazyClass + ' ' + lazySizesCfg.preloadClass);

  				addEventListener('scroll', throttledCheckElements, true);

  				addEventListener('resize', throttledCheckElements, true);

  				addEventListener('pageshow', function (e) {
  					if (e.persisted) {
  						var loadingElements = document.querySelectorAll('.' + lazySizesCfg.loadingClass);

  						if (loadingElements.length && loadingElements.forEach) {
  							requestAnimationFrame(function () {
  								loadingElements.forEach( function (img) {
  									if (img.complete) {
  										unveilElement(img);
  									}
  								});
  							});
  						}
  					}
  				});

  				if(window.MutationObserver){
  					new MutationObserver( throttledCheckElements ).observe( docElem, {childList: true, subtree: true, attributes: true} );
  				} else {
  					docElem[_addEventListener]('DOMNodeInserted', throttledCheckElements, true);
  					docElem[_addEventListener]('DOMAttrModified', throttledCheckElements, true);
  					setInterval(throttledCheckElements, 999);
  				}

  				addEventListener('hashchange', throttledCheckElements, true);

  				//, 'fullscreenchange'
  				['focus', 'mouseover', 'click', 'load', 'transitionend', 'animationend'].forEach(function(name){
  					document[_addEventListener](name, throttledCheckElements, true);
  				});

  				if((/d$|^c/.test(document.readyState))){
  					onload();
  				} else {
  					addEventListener('load', onload);
  					document[_addEventListener]('DOMContentLoaded', throttledCheckElements);
  					setTimeout(onload, 20000);
  				}

  				if(lazysizes.elements.length){
  					checkElements();
  					rAF._lsFlush();
  				} else {
  					throttledCheckElements();
  				}
  			},
  			checkElems: throttledCheckElements,
  			unveil: unveilElement,
  			_aLSL: altLoadmodeScrollListner,
  		};
  	})();


  	var autoSizer = (function(){
  		var autosizesElems;

  		var sizeElement = rAFIt(function(elem, parent, event, width){
  			var sources, i, len;
  			elem._lazysizesWidth = width;
  			width += 'px';

  			elem.setAttribute('sizes', width);

  			if(regPicture.test(parent.nodeName || '')){
  				sources = parent.getElementsByTagName('source');
  				for(i = 0, len = sources.length; i < len; i++){
  					sources[i].setAttribute('sizes', width);
  				}
  			}

  			if(!event.detail.dataAttr){
  				updatePolyfill(elem, event.detail);
  			}
  		});
  		/**
  		 *
  		 * @param elem {Element}
  		 * @param dataAttr
  		 * @param [width] { number }
  		 */
  		var getSizeElement = function (elem, dataAttr, width){
  			var event;
  			var parent = elem.parentNode;

  			if(parent){
  				width = getWidth(elem, parent, width);
  				event = triggerEvent(elem, 'lazybeforesizes', {width: width, dataAttr: !!dataAttr});

  				if(!event.defaultPrevented){
  					width = event.detail.width;

  					if(width && width !== elem._lazysizesWidth){
  						sizeElement(elem, parent, event, width);
  					}
  				}
  			}
  		};

  		var updateElementsSizes = function(){
  			var i;
  			var len = autosizesElems.length;
  			if(len){
  				i = 0;

  				for(; i < len; i++){
  					getSizeElement(autosizesElems[i]);
  				}
  			}
  		};

  		var debouncedUpdateElementsSizes = debounce(updateElementsSizes);

  		return {
  			_: function(){
  				autosizesElems = document.getElementsByClassName(lazySizesCfg.autosizesClass);
  				addEventListener('resize', debouncedUpdateElementsSizes);
  			},
  			checkElems: debouncedUpdateElementsSizes,
  			updateElem: getSizeElement
  		};
  	})();

  	var init = function(){
  		if(!init.i && document.getElementsByClassName){
  			init.i = true;
  			autoSizer._();
  			loader._();
  		}
  	};

  	setTimeout(function(){
  		if(lazySizesCfg.init){
  			init();
  		}
  	});

  	lazysizes = {
  		/**
  		 * @type { LazySizesConfigPartial }
  		 */
  		cfg: lazySizesCfg,
  		autoSizer: autoSizer,
  		loader: loader,
  		init: init,
  		uP: updatePolyfill,
  		aC: addClass,
  		rC: removeClass,
  		hC: hasClass,
  		fire: triggerEvent,
  		gW: getWidth,
  		rAF: rAF,
  	};

  	return lazysizes;
  }
  ));
  }(lazysizes));

  (function (module) {
  (function(window, factory) {
  	if(!window) {return;}
  	var globalInstall = function(initialEvent){
  		factory(window.lazySizes, initialEvent);
  		window.removeEventListener('lazyunveilread', globalInstall, true);
  	};

  	factory = factory.bind(null, window, window.document);

  	if(module.exports){
  		factory(lazysizes.exports);
  	} else if(window.lazySizes) {
  		globalInstall();
  	} else {
  		window.addEventListener('lazyunveilread', globalInstall, true);
  	}
  }(typeof window != 'undefined' ?
  	window : 0, function(window, document, lazySizes, initialEvent) {
  	var cloneElementClass;
  	var style = document.createElement('a').style;
  	var fitSupport = 'objectFit' in style;
  	var positionSupport = fitSupport && 'objectPosition' in style;
  	var regCssFit = /object-fit["']*\s*:\s*["']*(contain|cover)/;
  	var regCssPosition = /object-position["']*\s*:\s*["']*(.+?)(?=($|,|'|"|;))/;
  	var blankSrc = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
  	var regBgUrlEscape = /\(|\)|'/;
  	var positionDefaults = {
  		center: 'center',
  		'50% 50%': 'center',
  	};

  	function getObject(element){
  		var css = (getComputedStyle(element, null) || {});
  		var content = css.fontFamily || '';
  		var objectFit = content.match(regCssFit) || '';
  		var objectPosition = objectFit && content.match(regCssPosition) || '';

  		if(objectPosition){
  			objectPosition = objectPosition[1];
  		}

  		return {
  			fit: objectFit && objectFit[1] || '',
  			position: positionDefaults[objectPosition] || objectPosition || 'center',
  		};
  	}

  	function generateStyleClass() {
  		if (cloneElementClass) {
  			return;
  		}

  		var styleElement = document.createElement('style');

  		cloneElementClass = lazySizes.cfg.objectFitClass || 'lazysizes-display-clone';

  		document.querySelector('head').appendChild(styleElement);
  	}

  	function removePrevClone(element) {
  		var prev = element.previousElementSibling;

  		if (prev && lazySizes.hC(prev, cloneElementClass)) {
  			prev.parentNode.removeChild(prev);
  			element.style.position = prev.getAttribute('data-position') || '';
  			element.style.visibility = prev.getAttribute('data-visibility') || '';
  		}
  	}

  	function initFix(element, config){
  		var switchClassesAdded, addedSrc, styleElement, styleElementStyle;
  		var lazysizesCfg = lazySizes.cfg;

  		var onChange = function(){
  			var src = element.currentSrc || element.src;

  			if(src && addedSrc !== src){
  				addedSrc = src;
  				styleElementStyle.backgroundImage = 'url(' + (regBgUrlEscape.test(src) ? JSON.stringify(src) : src ) + ')';

  				if(!switchClassesAdded){
  					switchClassesAdded = true;
  					lazySizes.rC(styleElement, lazysizesCfg.loadingClass);
  					lazySizes.aC(styleElement, lazysizesCfg.loadedClass);
  				}
  			}
  		};
  		var rafedOnChange = function(){
  			lazySizes.rAF(onChange);
  		};

  		element._lazysizesParentFit = config.fit;

  		element.addEventListener('lazyloaded', rafedOnChange, true);
  		element.addEventListener('load', rafedOnChange, true);

  		lazySizes.rAF(function(){

  			var hideElement = element;
  			var container = element.parentNode;

  			if(container.nodeName.toUpperCase() == 'PICTURE'){
  				hideElement = container;
  				container = container.parentNode;
  			}

  			removePrevClone(hideElement);

  			if (!cloneElementClass) {
  				generateStyleClass();
  			}

  			styleElement = element.cloneNode(false);
  			styleElementStyle = styleElement.style;

  			styleElement.addEventListener('load', function(){
  				var curSrc = styleElement.currentSrc || styleElement.src;

  				if(curSrc && curSrc != blankSrc){
  					styleElement.src = blankSrc;
  					styleElement.srcset = '';
  				}
  			});

  			lazySizes.rC(styleElement, lazysizesCfg.loadedClass);
  			lazySizes.rC(styleElement, lazysizesCfg.lazyClass);
  			lazySizes.rC(styleElement, lazysizesCfg.autosizesClass);
  			lazySizes.aC(styleElement, lazysizesCfg.loadingClass);
  			lazySizes.aC(styleElement, cloneElementClass);

  			['data-parent-fit', 'data-parent-container', 'data-object-fit-polyfilled',
  				lazysizesCfg.srcsetAttr, lazysizesCfg.srcAttr].forEach(function(attr) {
  				styleElement.removeAttribute(attr);
  			});

  			styleElement.src = blankSrc;
  			styleElement.srcset = '';

  			styleElementStyle.backgroundRepeat = 'no-repeat';
  			styleElementStyle.backgroundPosition = config.position;
  			styleElementStyle.backgroundSize = config.fit;

  			styleElement.setAttribute('data-position', hideElement.style.position);
  			styleElement.setAttribute('data-visibility', hideElement.style.visibility);

  			hideElement.style.visibility = 'hidden';
  			hideElement.style.position = 'absolute';

  			element.setAttribute('data-parent-fit', config.fit);
  			element.setAttribute('data-parent-container', 'prev');
  			element.setAttribute('data-object-fit-polyfilled', '');
  			element._objectFitPolyfilledDisplay = styleElement;

  			container.insertBefore(styleElement, hideElement);

  			if(element._lazysizesParentFit){
  				delete element._lazysizesParentFit;
  			}

  			if(element.complete){
  				onChange();
  			}
  		});
  	}

  	if(!fitSupport || !positionSupport){
  		var onRead = function(e){
  			if(e.detail.instance != lazySizes){return;}

  			var element = e.target;
  			var obj = getObject(element);

  			if(obj.fit && (!fitSupport || (obj.position != 'center'))){
  				initFix(element, obj);
  				return true;
  			}

  			return false;
  		};

  		window.addEventListener('lazybeforesizes', function(e) {
  			if(e.detail.instance != lazySizes){return;}
  			var element = e.target;

  			if (element.getAttribute('data-object-fit-polyfilled') != null && !element._objectFitPolyfilledDisplay) {
  				if(!onRead(e)){
  					lazySizes.rAF(function () {
  						element.removeAttribute('data-object-fit-polyfilled');
  					});
  				}
  			}
  		});
  		window.addEventListener('lazyunveilread', onRead, true);

  		if(initialEvent && initialEvent.detail){
  			onRead(initialEvent);
  		}
  	}
  }));
  }(ls_objectFit));

  var ls_parentFit = {exports: {}};

  (function (module) {
  (function(window, factory) {
  	if(!window) {return;}
  	var globalInstall = function(){
  		factory(window.lazySizes);
  		window.removeEventListener('lazyunveilread', globalInstall, true);
  	};

  	factory = factory.bind(null, window, window.document);

  	if(module.exports){
  		factory(lazysizes.exports);
  	} else if(window.lazySizes) {
  		globalInstall();
  	} else {
  		window.addEventListener('lazyunveilread', globalInstall, true);
  	}
  }(typeof window != 'undefined' ?
  	window : 0, function(window, document, lazySizes) {

  	if(!window.addEventListener){return;}

  	var regDescriptors = /\s+(\d+)(w|h)\s+(\d+)(w|h)/;
  	var regCssFit = /parent-fit["']*\s*:\s*["']*(contain|cover|width)/;
  	var regCssObject = /parent-container["']*\s*:\s*["']*(.+?)(?=(\s|$|,|'|"|;))/;
  	var regPicture = /^picture$/i;
  	var cfg = lazySizes.cfg;

  	var getCSS = function (elem){
  		return (getComputedStyle(elem, null) || {});
  	};

  	var parentFit = {

  		getParent: function(element, parentSel){
  			var parent = element;
  			var parentNode = element.parentNode;

  			if((!parentSel || parentSel == 'prev') && parentNode && regPicture.test(parentNode.nodeName || '')){
  				parentNode = parentNode.parentNode;
  			}

  			if(parentSel != 'self'){
  				if(parentSel == 'prev'){
  					parent = element.previousElementSibling;
  				} else if(parentSel && (parentNode.closest || window.jQuery)){
  					parent = (parentNode.closest ?
  							parentNode.closest(parentSel) :
  							jQuery(parentNode).closest(parentSel)[0]) ||
  						parentNode
  					;
  				} else {
  					parent = parentNode;
  				}
  			}

  			return parent;
  		},

  		getFit: function(element){
  			var tmpMatch, parentObj;
  			var css = getCSS(element);
  			var content = css.content || css.fontFamily;
  			var obj = {
  				fit: element._lazysizesParentFit || element.getAttribute('data-parent-fit')
  			};

  			if(!obj.fit && content && (tmpMatch = content.match(regCssFit))){
  				obj.fit = tmpMatch[1];
  			}

  			if(obj.fit){
  				parentObj = element._lazysizesParentContainer || element.getAttribute('data-parent-container');

  				if(!parentObj && content && (tmpMatch = content.match(regCssObject))){
  					parentObj = tmpMatch[1];
  				}

  				obj.parent = parentFit.getParent(element, parentObj);


  			} else {
  				obj.fit = css.objectFit;
  			}

  			return obj;
  		},

  		getImageRatio: function(element){
  			var i, srcset, media, ratio, match, width, height;
  			var parent = element.parentNode;
  			var elements = parent && regPicture.test(parent.nodeName || '') ?
  					parent.querySelectorAll('source, img') :
  					[element]
  				;

  			for(i = 0; i < elements.length; i++){
  				element = elements[i];
  				srcset = element.getAttribute(cfg.srcsetAttr) || element.getAttribute('srcset') || element.getAttribute('data-pfsrcset') || element.getAttribute('data-risrcset') || '';
  				media = element._lsMedia || element.getAttribute('media');
  				media = cfg.customMedia[element.getAttribute('data-media') || media] || media;

  				if(srcset && (!media || (window.matchMedia && matchMedia(media) || {}).matches )){
  					ratio = parseFloat(element.getAttribute('data-aspectratio'));

  					if (!ratio) {
  						match = srcset.match(regDescriptors);

  						if (match) {
  							if(match[2] == 'w'){
  								width = match[1];
  								height = match[3];
  							} else {
  								width = match[3];
  								height = match[1];
  							}
  						} else {
  							width = element.getAttribute('width');
  							height = element.getAttribute('height');
  						}

  						ratio = width / height;
  					}

  					break;
  				}
  			}

  			return ratio;
  		},

  		calculateSize: function(element, width){
  			var displayRatio, height, imageRatio, retWidth;
  			var fitObj = this.getFit(element);
  			var fit = fitObj.fit;
  			var fitElem = fitObj.parent;

  			if(fit != 'width' && ((fit != 'contain' && fit != 'cover') || !(imageRatio = this.getImageRatio(element)))){
  				return width;
  			}

  			if(fitElem){
  				width = fitElem.clientWidth;
  			} else {
  				fitElem = element;
  			}

  			retWidth = width;

  			if(fit == 'width'){
  				retWidth = width;
  			} else {
  				height = fitElem.clientHeight;

  				if((displayRatio =  width / height) && ((fit == 'cover' && displayRatio < imageRatio) || (fit == 'contain' && displayRatio > imageRatio))){
  					retWidth = width * (imageRatio / displayRatio);
  				}
  			}

  			return retWidth;
  		}
  	};

  	lazySizes.parentFit = parentFit;

  	document.addEventListener('lazybeforesizes', function(e){
  		if(e.defaultPrevented || e.detail.instance != lazySizes){return;}

  		var element = e.target;
  		e.detail.width = parentFit.calculateSize(element, e.detail.width);
  	});
  }));
  }(ls_parentFit));

  var ls_rias = {exports: {}};

  (function (module) {
  (function(window, factory) {
  	var globalInstall = function(){
  		factory(window.lazySizes);
  		window.removeEventListener('lazyunveilread', globalInstall, true);
  	};

  	factory = factory.bind(null, window, window.document);

  	if(module.exports){
  		factory(lazysizes.exports);
  	} else if(window.lazySizes) {
  		globalInstall();
  	} else {
  		window.addEventListener('lazyunveilread', globalInstall, true);
  	}
  }(window, function(window, document, lazySizes) {

  	var config, riasCfg;
  	var lazySizesCfg = lazySizes.cfg;
  	var replaceTypes = {string: 1, number: 1};
  	var regNumber = /^\-*\+*\d+\.*\d*$/;
  	var regPicture = /^picture$/i;
  	var regWidth = /\s*\{\s*width\s*\}\s*/i;
  	var regHeight = /\s*\{\s*height\s*\}\s*/i;
  	var regPlaceholder = /\s*\{\s*([a-z0-9]+)\s*\}\s*/ig;
  	var regObj = /^\[.*\]|\{.*\}$/;
  	var regAllowedSizes = /^(?:auto|\d+(px)?)$/;
  	var anchor = document.createElement('a');
  	var img = document.createElement('img');
  	var buggySizes = ('srcset' in img) && !('sizes' in img);
  	var supportPicture = !!window.HTMLPictureElement && !buggySizes;

  	(function(){
  		var prop;
  		var noop = function(){};
  		var riasDefaults = {
  			prefix: '',
  			postfix: '',
  			srcAttr: 'data-src',
  			absUrl: false,
  			modifyOptions: noop,
  			widthmap: {},
  			ratio: false,
  			traditionalRatio: false,
  			aspectratio: false,
  		};

  		config = lazySizes && lazySizes.cfg;

  		if(!config.supportsType){
  			config.supportsType = function(type/*, elem*/){
  				return !type;
  			};
  		}

  		if(!config.rias){
  			config.rias = {};
  		}
  		riasCfg = config.rias;

  		if(!('widths' in riasCfg)){
  			riasCfg.widths = [];
  			(function (widths){
  				var width;
  				var i = 0;
  				while(!width || width < 3000){
  					i += 5;
  					if(i > 30){
  						i += 1;
  					}
  					width = (36 * i);
  					widths.push(width);
  				}
  			})(riasCfg.widths);
  		}

  		for(prop in riasDefaults){
  			if(!(prop in riasCfg)){
  				riasCfg[prop] = riasDefaults[prop];
  			}
  		}
  	})();

  	function getElementOptions(elem, src, options){
  		var attr, parent, setOption, prop, opts;
  		var elemStyles = window.getComputedStyle(elem);

  		if (!options) {
  			parent = elem.parentNode;

  			options = {
  				isPicture: !!(parent && regPicture.test(parent.nodeName || ''))
  			};
  		} else {
  			opts = {};

  			for (prop in options) {
  				opts[prop] = options[prop];
  			}

  			options = opts;
  		}

  		setOption = function(attr, run){
  			var attrVal = elem.getAttribute('data-'+ attr);

  			if (!attrVal) {
  				// no data- attr, get value from the CSS
  				var styles = elemStyles.getPropertyValue('--ls-' + attr);
  				// at least Safari 9 returns null rather than
  				// an empty string for getPropertyValue causing
  				// .trim() to fail
  				if (styles) {
  					attrVal = styles.trim();
  				}
  			}

  			if (attrVal) {
  				if(attrVal == 'true'){
  					attrVal = true;
  				} else if(attrVal == 'false'){
  					attrVal = false;
  				} else if(regNumber.test(attrVal)){
  					attrVal = parseFloat(attrVal);
  				} else if(typeof riasCfg[attr] == 'function'){
  					attrVal = riasCfg[attr](elem, attrVal);
  				} else if(regObj.test(attrVal)){
  					try {
  						attrVal = JSON.parse(attrVal);
  					} catch(e){}
  				}
  				options[attr] = attrVal;
  			} else if((attr in riasCfg) && typeof riasCfg[attr] != 'function' && !options[attr]){
  				options[attr] = riasCfg[attr];
  			} else if(run && typeof riasCfg[attr] == 'function'){
  				options[attr] = riasCfg[attr](elem, attrVal);
  			}
  		};

  		for(attr in riasCfg){
  			setOption(attr);
  		}
  		src.replace(regPlaceholder, function(full, match){
  			if(!(match in options)){
  				setOption(match, true);
  			}
  		});

  		return options;
  	}

  	function replaceUrlProps(url, options){
  		var candidates = [];
  		var replaceFn = function(full, match){
  			return (replaceTypes[typeof options[match]]) ? options[match] : full;
  		};
  		candidates.srcset = [];

  		if(options.absUrl){
  			anchor.setAttribute('href', url);
  			url = anchor.href;
  		}

  		url = ((options.prefix || '') + url + (options.postfix || '')).replace(regPlaceholder, replaceFn);

  		options.widths.forEach(function(width){
  			var widthAlias = options.widthmap[width] || width;
  			var ratio = options.aspectratio || options.ratio;
  			var traditionalRatio = !options.aspectratio && riasCfg.traditionalRatio;
  			var candidate = {
  				u: url.replace(regWidth, widthAlias)
  						.replace(regHeight, ratio ?
  							traditionalRatio ?
  								Math.round(width * ratio) :
  								Math.round(width / ratio)
  							: ''),
  				w: width
  			};

  			candidates.push(candidate);
  			candidates.srcset.push( (candidate.c = candidate.u + ' ' + width + 'w') );
  		});
  		return candidates;
  	}

  	function setSrc(src, opts, elem){
  		var elemW = 0;
  		var elemH = 0;
  		var sizeElement = elem;

  		if(!src){return;}

  		if (opts.ratio === 'container') {
  			// calculate image or parent ratio
  			elemW = sizeElement.scrollWidth;
  			elemH = sizeElement.scrollHeight;

  			while ((!elemW || !elemH) && sizeElement !== document) {
  				sizeElement = sizeElement.parentNode;
  				elemW = sizeElement.scrollWidth;
  				elemH = sizeElement.scrollHeight;
  			}
  			if (elemW && elemH) {
  				opts.ratio = opts.traditionalRatio ? elemH / elemW : elemW / elemH;
  			}
  		}

  		src = replaceUrlProps(src, opts);

  		src.isPicture = opts.isPicture;

  		if(buggySizes && elem.nodeName.toUpperCase() == 'IMG'){
  			elem.removeAttribute(config.srcsetAttr);
  		} else {
  			elem.setAttribute(config.srcsetAttr, src.srcset.join(', '));
  		}

  		Object.defineProperty(elem, '_lazyrias', {
  			value: src,
  			writable: true
  		});
  	}

  	function createAttrObject(elem, src){
  		var opts = getElementOptions(elem, src);

  		riasCfg.modifyOptions.call(elem, {target: elem, details: opts, detail: opts});

  		lazySizes.fire(elem, 'lazyriasmodifyoptions', opts);
  		return opts;
  	}

  	function getSrc(elem){
  		return elem.getAttribute( elem.getAttribute('data-srcattr') || riasCfg.srcAttr ) || elem.getAttribute(config.srcsetAttr) || elem.getAttribute(config.srcAttr) || elem.getAttribute('data-pfsrcset') || '';
  	}

  	addEventListener('lazybeforesizes', function(e){
  		if(e.detail.instance != lazySizes){return;}

  		var elem, src, elemOpts, sourceOpts, parent, sources, i, len, sourceSrc, sizes, detail, hasPlaceholder, modified, emptyList;
  		elem = e.target;

  		if(!e.detail.dataAttr || e.defaultPrevented || riasCfg.disabled || !((sizes = elem.getAttribute(config.sizesAttr) || elem.getAttribute('sizes')) && regAllowedSizes.test(sizes))){return;}

  		src = getSrc(elem);

  		elemOpts = createAttrObject(elem, src);

  		hasPlaceholder = regWidth.test(elemOpts.prefix) || regWidth.test(elemOpts.postfix);

  		if(elemOpts.isPicture && (parent = elem.parentNode)){
  			sources = parent.getElementsByTagName('source');
  			for(i = 0, len = sources.length; i < len; i++){
  				if ( hasPlaceholder || regWidth.test(sourceSrc = getSrc(sources[i])) ){
  					sourceOpts = getElementOptions(sources[i], sourceSrc, elemOpts);
  					setSrc(sourceSrc, sourceOpts, sources[i]);
  					modified = true;
  				}
  			}
  		}

  		if ( hasPlaceholder || regWidth.test(src) ){
  			setSrc(src, elemOpts, elem);
  			modified = true;
  		} else if (modified) {
  			emptyList = [];
  			emptyList.srcset = [];
  			emptyList.isPicture = true;
  			Object.defineProperty(elem, '_lazyrias', {
  				value: emptyList,
  				writable: true
  			});
  		}

  		if(modified){
  			if(supportPicture){
  				elem.removeAttribute(config.srcAttr);
  			} else if(sizes != 'auto') {
  				detail = {
  					width: parseInt(sizes, 10)
  				};
  				polyfill({
  					target: elem,
  					detail: detail
  				});
  			}
  		}
  	}, true);
  	// partial polyfill
  	var polyfill = (function(){
  		var ascendingSort = function( a, b ) {
  			return a.w - b.w;
  		};

  		var reduceCandidate = function (srces) {
  			var lowerCandidate, bonusFactor;
  			var len = srces.length;
  			var candidate = srces[len -1];
  			var i = 0;

  			for(i; i < len;i++){
  				candidate = srces[i];
  				candidate.d = candidate.w / srces.w;
  				if(candidate.d >= srces.d){
  					if(!candidate.cached && (lowerCandidate = srces[i - 1]) &&
  						lowerCandidate.d > srces.d - (0.13 * Math.pow(srces.d, 2.2))){

  						bonusFactor = Math.pow(lowerCandidate.d - 0.6, 1.6);

  						if(lowerCandidate.cached) {
  							lowerCandidate.d += 0.15 * bonusFactor;
  						}

  						if(lowerCandidate.d + ((candidate.d - srces.d) * bonusFactor) > srces.d){
  							candidate = lowerCandidate;
  						}
  					}
  					break;
  				}
  			}
  			return candidate;
  		};

  		var getWSet = function(elem, testPicture){
  			var src;
  			if(!elem._lazyrias && lazySizes.pWS && (src = lazySizes.pWS(elem.getAttribute(config.srcsetAttr || ''))).length){
  				Object.defineProperty(elem, '_lazyrias', {
  					value: src,
  					writable: true
  				});
  				if(testPicture && elem.parentNode){
  					src.isPicture = elem.parentNode.nodeName.toUpperCase() == 'PICTURE';
  				}
  			}
  			return elem._lazyrias;
  		};

  		var getX = function(elem){
  			var dpr = window.devicePixelRatio || 1;
  			var optimum = lazySizes.getX && lazySizes.getX(elem);
  			return Math.min(optimum || dpr, 2.4, dpr);
  		};

  		var getCandidate = function(elem, width){
  			var sources, i, len, media, srces, src;

  			srces = elem._lazyrias;

  			if(srces.isPicture && window.matchMedia){
  				for(i = 0, sources = elem.parentNode.getElementsByTagName('source'), len = sources.length; i < len; i++){
  					if(getWSet(sources[i]) && !sources[i].getAttribute('type') && ( !(media = sources[i].getAttribute('media')) || ((matchMedia(media) || {}).matches))){
  						srces = sources[i]._lazyrias;
  						break;
  					}
  				}
  			}

  			if(!srces.w || srces.w < width){
  				srces.w = width;
  				srces.d = getX(elem);
  				src = reduceCandidate(srces.sort(ascendingSort));
  			}

  			return src;
  		};

  		var polyfill = function(e){
  			if(e.detail.instance != lazySizes){return;}

  			var candidate;
  			var elem = e.target;

  			if(!buggySizes && (window.respimage || window.picturefill || lazySizesCfg.pf)){
  				document.removeEventListener('lazybeforesizes', polyfill);
  				return;
  			}

  			if(!('_lazyrias' in elem) && (!e.detail.dataAttr || !getWSet(elem, true))){
  				return;
  			}

  			candidate = getCandidate(elem, e.detail.width);

  			if(candidate && candidate.u && elem._lazyrias.cur != candidate.u){
  				elem._lazyrias.cur = candidate.u;
  				candidate.cached = true;
  				lazySizes.rAF(function(){
  					elem.setAttribute(config.srcAttr, candidate.u);
  					elem.setAttribute('src', candidate.u);
  				});
  			}
  		};

  		if(!supportPicture){
  			addEventListener('lazybeforesizes', polyfill);
  		} else {
  			polyfill = function(){};
  		}

  		return polyfill;

  	})();

  }));
  }(ls_rias));

  var ls_bgset = {exports: {}};

  (function (module) {
  (function(window, factory) {
  	var globalInstall = function(){
  		factory(window.lazySizes);
  		window.removeEventListener('lazyunveilread', globalInstall, true);
  	};

  	factory = factory.bind(null, window, window.document);

  	if(module.exports){
  		factory(lazysizes.exports);
  	} else if(window.lazySizes) {
  		globalInstall();
  	} else {
  		window.addEventListener('lazyunveilread', globalInstall, true);
  	}
  }(window, function(window, document, lazySizes) {
  	if(!window.addEventListener){return;}

  	var lazySizesCfg = lazySizes.cfg;
  	var regWhite = /\s+/g;
  	var regSplitSet = /\s*\|\s+|\s+\|\s*/g;
  	var regSource = /^(.+?)(?:\s+\[\s*(.+?)\s*\])(?:\s+\[\s*(.+?)\s*\])?$/;
  	var regType = /^\s*\(*\s*type\s*:\s*(.+?)\s*\)*\s*$/;
  	var regBgUrlEscape = /\(|\)|'/;
  	var allowedBackgroundSize = {contain: 1, cover: 1};
  	var proxyWidth = function(elem){
  		var width = lazySizes.gW(elem, elem.parentNode);

  		if(!elem._lazysizesWidth || width > elem._lazysizesWidth){
  			elem._lazysizesWidth = width;
  		}
  		return elem._lazysizesWidth;
  	};
  	var getBgSize = function(elem){
  		var bgSize;

  		bgSize = (getComputedStyle(elem) || {getPropertyValue: function(){}}).getPropertyValue('background-size');

  		if(!allowedBackgroundSize[bgSize] && allowedBackgroundSize[elem.style.backgroundSize]){
  			bgSize = elem.style.backgroundSize;
  		}

  		return bgSize;
  	};
  	var setTypeOrMedia = function(source, match){
  		if(match){
  			var typeMatch = match.match(regType);
  			if(typeMatch && typeMatch[1]){
  				source.setAttribute('type', typeMatch[1]);
  			} else {
  				source.setAttribute('media', lazySizesCfg.customMedia[match] || match);
  			}
  		}
  	};
  	var createPicture = function(sets, elem, img){
  		var picture = document.createElement('picture');
  		var sizes = elem.getAttribute(lazySizesCfg.sizesAttr);
  		var ratio = elem.getAttribute('data-ratio');
  		var optimumx = elem.getAttribute('data-optimumx');

  		if(elem._lazybgset && elem._lazybgset.parentNode == elem){
  			elem.removeChild(elem._lazybgset);
  		}

  		Object.defineProperty(img, '_lazybgset', {
  			value: elem,
  			writable: true
  		});
  		Object.defineProperty(elem, '_lazybgset', {
  			value: picture,
  			writable: true
  		});

  		sets = sets.replace(regWhite, ' ').split(regSplitSet);

  		picture.style.display = 'none';
  		img.className = lazySizesCfg.lazyClass;

  		if(sets.length == 1 && !sizes){
  			sizes = 'auto';
  		}

  		sets.forEach(function(set){
  			var match;
  			var source = document.createElement('source');

  			if(sizes && sizes != 'auto'){
  				source.setAttribute('sizes', sizes);
  			}

  			if((match = set.match(regSource))){
  				source.setAttribute(lazySizesCfg.srcsetAttr, match[1]);

  				setTypeOrMedia(source, match[2]);
  				setTypeOrMedia(source, match[3]);
  			} else {
  				source.setAttribute(lazySizesCfg.srcsetAttr, set);
  			}

  			picture.appendChild(source);
  		});

  		if(sizes){
  			img.setAttribute(lazySizesCfg.sizesAttr, sizes);
  			elem.removeAttribute(lazySizesCfg.sizesAttr);
  			elem.removeAttribute('sizes');
  		}
  		if(optimumx){
  			img.setAttribute('data-optimumx', optimumx);
  		}
  		if(ratio) {
  			img.setAttribute('data-ratio', ratio);
  		}

  		picture.appendChild(img);

  		elem.appendChild(picture);
  	};

  	var proxyLoad = function(e){
  		if(!e.target._lazybgset){return;}

  		var image = e.target;
  		var elem = image._lazybgset;
  		var bg = image.currentSrc || image.src;


  		if(bg){
  			var useSrc = regBgUrlEscape.test(bg) ? JSON.stringify(bg) : bg;
  			var event = lazySizes.fire(elem, 'bgsetproxy', {
  				src: bg,
  				useSrc: useSrc,
  				fullSrc: null,
  			});

  			if(!event.defaultPrevented){
  				elem.style.backgroundImage = event.detail.fullSrc || 'url(' + event.detail.useSrc + ')';
  			}
  		}

  		if(image._lazybgsetLoading){
  			lazySizes.fire(elem, '_lazyloaded', {}, false, true);
  			delete image._lazybgsetLoading;
  		}
  	};

  	addEventListener('lazybeforeunveil', function(e){
  		var set, image, elem;

  		if(e.defaultPrevented || !(set = e.target.getAttribute('data-bgset'))){return;}

  		elem = e.target;
  		image = document.createElement('img');

  		image.alt = '';

  		image._lazybgsetLoading = true;
  		e.detail.firesLoad = true;

  		createPicture(set, elem, image);

  		setTimeout(function(){
  			lazySizes.loader.unveil(image);

  			lazySizes.rAF(function(){
  				lazySizes.fire(image, '_lazyloaded', {}, true, true);
  				if(image.complete) {
  					proxyLoad({target: image});
  				}
  			});
  		});

  	});

  	document.addEventListener('load', proxyLoad, true);

  	window.addEventListener('lazybeforesizes', function(e){
  		if(e.detail.instance != lazySizes){return;}
  		if(e.target._lazybgset && e.detail.dataAttr){
  			var elem = e.target._lazybgset;
  			var bgSize = getBgSize(elem);

  			if(allowedBackgroundSize[bgSize]){
  				e.target._lazysizesParentFit = bgSize;

  				lazySizes.rAF(function(){
  					e.target.setAttribute('data-parent-fit', bgSize);
  					if(e.target._lazysizesParentFit){
  						delete e.target._lazysizesParentFit;
  					}
  				});
  			}
  		}
  	}, true);

  	document.documentElement.addEventListener('lazybeforesizes', function(e){
  		if(e.defaultPrevented || !e.target._lazybgset || e.detail.instance != lazySizes){return;}
  		e.detail.width = proxyWidth(e.target._lazybgset);
  	});
  }));
  }(ls_bgset));

  var ls_respimg = {exports: {}};

  (function (module) {
  (function(window, factory) {
  	if(!window) {return;}
  	var globalInstall = function(){
  		factory(window.lazySizes);
  		window.removeEventListener('lazyunveilread', globalInstall, true);
  	};

  	factory = factory.bind(null, window, window.document);

  	if(module.exports){
  		factory(lazysizes.exports);
  	} else if(window.lazySizes) {
  		globalInstall();
  	} else {
  		window.addEventListener('lazyunveilread', globalInstall, true);
  	}
  }(typeof window != 'undefined' ?
  	window : 0, function(window, document, lazySizes) {
  	var polyfill;
  	var lazySizesCfg = lazySizes.cfg;
  	var img = document.createElement('img');
  	var supportSrcset = ('sizes' in img) && ('srcset' in img);
  	var regHDesc = /\s+\d+h/g;
  	var fixEdgeHDescriptor = (function(){
  		var regDescriptors = /\s+(\d+)(w|h)\s+(\d+)(w|h)/;
  		var forEach = Array.prototype.forEach;

  		return function(){
  			var img = document.createElement('img');
  			var removeHDescriptors = function(source){
  				var ratio, match;
  				var srcset = source.getAttribute(lazySizesCfg.srcsetAttr);
  				if(srcset){
  					if((match = srcset.match(regDescriptors))){
  						if(match[2] == 'w'){
  							ratio = match[1] / match[3];
  						} else {
  							ratio = match[3] / match[1];
  						}

  						if(ratio){
  							source.setAttribute('data-aspectratio', ratio);
  						}
  						source.setAttribute(lazySizesCfg.srcsetAttr, srcset.replace(regHDesc, ''));
  					}
  				}
  			};
  			var handler = function(e){
  				if(e.detail.instance != lazySizes){return;}
  				var picture = e.target.parentNode;

  				if(picture && picture.nodeName == 'PICTURE'){
  					forEach.call(picture.getElementsByTagName('source'), removeHDescriptors);
  				}
  				removeHDescriptors(e.target);
  			};

  			var test = function(){
  				if(!!img.currentSrc){
  					document.removeEventListener('lazybeforeunveil', handler);
  				}
  			};

  			document.addEventListener('lazybeforeunveil', handler);

  			img.onload = test;
  			img.onerror = test;

  			img.srcset = 'data:,a 1w 1h';

  			if(img.complete){
  				test();
  			}
  		};
  	})();

  	if(!lazySizesCfg.supportsType){
  		lazySizesCfg.supportsType = function(type/*, elem*/){
  			return !type;
  		};
  	}

  	if (window.HTMLPictureElement && supportSrcset) {
  		if(!lazySizes.hasHDescriptorFix && document.msElementsFromPoint){
  			lazySizes.hasHDescriptorFix = true;
  			fixEdgeHDescriptor();
  		}
  		return;
  	}

  	if(window.picturefill || lazySizesCfg.pf){return;}

  	lazySizesCfg.pf = function(options){
  		var i, len;
  		if(window.picturefill){return;}
  		for(i = 0, len = options.elements.length; i < len; i++){
  			polyfill(options.elements[i]);
  		}
  	};

  	// partial polyfill
  	polyfill = (function(){
  		var ascendingSort = function( a, b ) {
  			return a.w - b.w;
  		};
  		var regPxLength = /^\s*\d+\.*\d*px\s*$/;
  		var reduceCandidate = function (srces) {
  			var lowerCandidate, bonusFactor;
  			var len = srces.length;
  			var candidate = srces[len -1];
  			var i = 0;

  			for(i; i < len;i++){
  				candidate = srces[i];
  				candidate.d = candidate.w / srces.w;

  				if(candidate.d >= srces.d){
  					if(!candidate.cached && (lowerCandidate = srces[i - 1]) &&
  						lowerCandidate.d > srces.d - (0.13 * Math.pow(srces.d, 2.2))){

  						bonusFactor = Math.pow(lowerCandidate.d - 0.6, 1.6);

  						if(lowerCandidate.cached) {
  							lowerCandidate.d += 0.15 * bonusFactor;
  						}

  						if(lowerCandidate.d + ((candidate.d - srces.d) * bonusFactor) > srces.d){
  							candidate = lowerCandidate;
  						}
  					}
  					break;
  				}
  			}
  			return candidate;
  		};

  		var parseWsrcset = (function(){
  			var candidates;
  			var regWCandidates = /(([^,\s].[^\s]+)\s+(\d+)w)/g;
  			var regMultiple = /\s/;
  			var addCandidate = function(match, candidate, url, wDescriptor){
  				candidates.push({
  					c: candidate,
  					u: url,
  					w: wDescriptor * 1
  				});
  			};

  			return function(input){
  				candidates = [];
  				input = input.trim();
  				input
  					.replace(regHDesc, '')
  					.replace(regWCandidates, addCandidate)
  				;

  				if(!candidates.length && input && !regMultiple.test(input)){
  					candidates.push({
  						c: input,
  						u: input,
  						w: 99
  					});
  				}

  				return candidates;
  			};
  		})();

  		var runMatchMedia = function(){
  			if(runMatchMedia.init){return;}

  			runMatchMedia.init = true;
  			addEventListener('resize', (function(){
  				var timer;
  				var matchMediaElems = document.getElementsByClassName('lazymatchmedia');
  				var run = function(){
  					var i, len;
  					for(i = 0, len = matchMediaElems.length; i < len; i++){
  						polyfill(matchMediaElems[i]);
  					}
  				};

  				return function(){
  					clearTimeout(timer);
  					timer = setTimeout(run, 66);
  				};
  			})());
  		};

  		var createSrcset = function(elem, isImage){
  			var parsedSet;
  			var srcSet = elem.getAttribute('srcset') || elem.getAttribute(lazySizesCfg.srcsetAttr);

  			if(!srcSet && isImage){
  				srcSet = !elem._lazypolyfill ?
  					(elem.getAttribute(lazySizesCfg.srcAttr) || elem.getAttribute('src')) :
  					elem._lazypolyfill._set
  				;
  			}

  			if(!elem._lazypolyfill || elem._lazypolyfill._set != srcSet){

  				parsedSet = parseWsrcset( srcSet || '' );
  				if(isImage && elem.parentNode){
  					parsedSet.isPicture = elem.parentNode.nodeName.toUpperCase() == 'PICTURE';

  					if(parsedSet.isPicture){
  						if(window.matchMedia){
  							lazySizes.aC(elem, 'lazymatchmedia');
  							runMatchMedia();
  						}
  					}
  				}

  				parsedSet._set = srcSet;
  				Object.defineProperty(elem, '_lazypolyfill', {
  					value: parsedSet,
  					writable: true
  				});
  			}
  		};

  		var getX = function(elem){
  			var dpr = window.devicePixelRatio || 1;
  			var optimum = lazySizes.getX && lazySizes.getX(elem);
  			return Math.min(optimum || dpr, 2.5, dpr);
  		};

  		var matchesMedia = function(media){
  			if(window.matchMedia){
  				matchesMedia = function(media){
  					return !media || (matchMedia(media) || {}).matches;
  				};
  			} else {
  				return !media;
  			}

  			return matchesMedia(media);
  		};

  		var getCandidate = function(elem){
  			var sources, i, len, source, srces, src, width;

  			source = elem;
  			createSrcset(source, true);
  			srces = source._lazypolyfill;

  			if(srces.isPicture){
  				for(i = 0, sources = elem.parentNode.getElementsByTagName('source'), len = sources.length; i < len; i++){
  					if( lazySizesCfg.supportsType(sources[i].getAttribute('type'), elem) && matchesMedia( sources[i].getAttribute('media')) ){
  						source = sources[i];
  						createSrcset(source);
  						srces = source._lazypolyfill;
  						break;
  					}
  				}
  			}

  			if(srces.length > 1){
  				width = source.getAttribute('sizes') || '';
  				width = regPxLength.test(width) && parseInt(width, 10) || lazySizes.gW(elem, elem.parentNode);
  				srces.d = getX(elem);
  				if(!srces.src || !srces.w || srces.w < width){
  					srces.w = width;
  					src = reduceCandidate(srces.sort(ascendingSort));
  					srces.src = src;
  				} else {
  					src = srces.src;
  				}
  			} else {
  				src = srces[0];
  			}

  			return src;
  		};

  		var p = function(elem){
  			if(supportSrcset && elem.parentNode && elem.parentNode.nodeName.toUpperCase() != 'PICTURE'){return;}
  			var candidate = getCandidate(elem);

  			if(candidate && candidate.u && elem._lazypolyfill.cur != candidate.u){
  				elem._lazypolyfill.cur = candidate.u;
  				candidate.cached = true;
  				elem.setAttribute(lazySizesCfg.srcAttr, candidate.u);
  				elem.setAttribute('src', candidate.u);
  			}
  		};

  		p.parse = parseWsrcset;

  		return p;
  	})();

  	if(lazySizesCfg.loadedClass && lazySizesCfg.loadingClass){
  		(function(){
  			var sels = [];
  			['img[sizes$="px"][srcset].', 'picture > img:not([srcset]).'].forEach(function(sel){
  				sels.push(sel + lazySizesCfg.loadedClass);
  				sels.push(sel + lazySizesCfg.loadingClass);
  			});
  			lazySizesCfg.pf({
  				elements: document.querySelectorAll(sels.join(', '))
  			});
  		})();

  	}
  }));
  }(ls_respimg));

  /**
   * A collection of shims that provide minimal functionality of the ES6 collections.
   *
   * These implementations are not meant to be used outside of the ResizeObserver
   * modules as they cover only a limited range of use cases.
   */
  /* eslint-disable require-jsdoc, valid-jsdoc */
  var MapShim = (function () {
      if (typeof Map !== 'undefined') {
          return Map;
      }
      /**
       * Returns index in provided array that matches the specified key.
       *
       * @param {Array<Array>} arr
       * @param {*} key
       * @returns {number}
       */
      function getIndex(arr, key) {
          var result = -1;
          arr.some(function (entry, index) {
              if (entry[0] === key) {
                  result = index;
                  return true;
              }
              return false;
          });
          return result;
      }
      return /** @class */ (function () {
          function class_1() {
              this.__entries__ = [];
          }
          Object.defineProperty(class_1.prototype, "size", {
              /**
               * @returns {boolean}
               */
              get: function () {
                  return this.__entries__.length;
              },
              enumerable: true,
              configurable: true
          });
          /**
           * @param {*} key
           * @returns {*}
           */
          class_1.prototype.get = function (key) {
              var index = getIndex(this.__entries__, key);
              var entry = this.__entries__[index];
              return entry && entry[1];
          };
          /**
           * @param {*} key
           * @param {*} value
           * @returns {void}
           */
          class_1.prototype.set = function (key, value) {
              var index = getIndex(this.__entries__, key);
              if (~index) {
                  this.__entries__[index][1] = value;
              }
              else {
                  this.__entries__.push([key, value]);
              }
          };
          /**
           * @param {*} key
           * @returns {void}
           */
          class_1.prototype.delete = function (key) {
              var entries = this.__entries__;
              var index = getIndex(entries, key);
              if (~index) {
                  entries.splice(index, 1);
              }
          };
          /**
           * @param {*} key
           * @returns {void}
           */
          class_1.prototype.has = function (key) {
              return !!~getIndex(this.__entries__, key);
          };
          /**
           * @returns {void}
           */
          class_1.prototype.clear = function () {
              this.__entries__.splice(0);
          };
          /**
           * @param {Function} callback
           * @param {*} [ctx=null]
           * @returns {void}
           */
          class_1.prototype.forEach = function (callback, ctx) {
              if (ctx === void 0) { ctx = null; }
              for (var _i = 0, _a = this.__entries__; _i < _a.length; _i++) {
                  var entry = _a[_i];
                  callback.call(ctx, entry[1], entry[0]);
              }
          };
          return class_1;
      }());
  })();

  /**
   * Detects whether window and document objects are available in current environment.
   */
  var isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined' && window.document === document;

  // Returns global object of a current environment.
  var global$1 = (function () {
      if (typeof global !== 'undefined' && global.Math === Math) {
          return global;
      }
      if (typeof self !== 'undefined' && self.Math === Math) {
          return self;
      }
      if (typeof window !== 'undefined' && window.Math === Math) {
          return window;
      }
      // eslint-disable-next-line no-new-func
      return Function('return this')();
  })();

  /**
   * A shim for the requestAnimationFrame which falls back to the setTimeout if
   * first one is not supported.
   *
   * @returns {number} Requests' identifier.
   */
  var requestAnimationFrame$1 = (function () {
      if (typeof requestAnimationFrame === 'function') {
          // It's required to use a bounded function because IE sometimes throws
          // an "Invalid calling object" error if rAF is invoked without the global
          // object on the left hand side.
          return requestAnimationFrame.bind(global$1);
      }
      return function (callback) { return setTimeout(function () { return callback(Date.now()); }, 1000 / 60); };
  })();

  // Defines minimum timeout before adding a trailing call.
  var trailingTimeout = 2;
  /**
   * Creates a wrapper function which ensures that provided callback will be
   * invoked only once during the specified delay period.
   *
   * @param {Function} callback - Function to be invoked after the delay period.
   * @param {number} delay - Delay after which to invoke callback.
   * @returns {Function}
   */
  function throttle (callback, delay) {
      var leadingCall = false, trailingCall = false, lastCallTime = 0;
      /**
       * Invokes the original callback function and schedules new invocation if
       * the "proxy" was called during current request.
       *
       * @returns {void}
       */
      function resolvePending() {
          if (leadingCall) {
              leadingCall = false;
              callback();
          }
          if (trailingCall) {
              proxy();
          }
      }
      /**
       * Callback invoked after the specified delay. It will further postpone
       * invocation of the original function delegating it to the
       * requestAnimationFrame.
       *
       * @returns {void}
       */
      function timeoutCallback() {
          requestAnimationFrame$1(resolvePending);
      }
      /**
       * Schedules invocation of the original function.
       *
       * @returns {void}
       */
      function proxy() {
          var timeStamp = Date.now();
          if (leadingCall) {
              // Reject immediately following calls.
              if (timeStamp - lastCallTime < trailingTimeout) {
                  return;
              }
              // Schedule new call to be in invoked when the pending one is resolved.
              // This is important for "transitions" which never actually start
              // immediately so there is a chance that we might miss one if change
              // happens amids the pending invocation.
              trailingCall = true;
          }
          else {
              leadingCall = true;
              trailingCall = false;
              setTimeout(timeoutCallback, delay);
          }
          lastCallTime = timeStamp;
      }
      return proxy;
  }

  // Minimum delay before invoking the update of observers.
  var REFRESH_DELAY = 20;
  // A list of substrings of CSS properties used to find transition events that
  // might affect dimensions of observed elements.
  var transitionKeys = ['top', 'right', 'bottom', 'left', 'width', 'height', 'size', 'weight'];
  // Check if MutationObserver is available.
  var mutationObserverSupported = typeof MutationObserver !== 'undefined';
  /**
   * Singleton controller class which handles updates of ResizeObserver instances.
   */
  var ResizeObserverController = /** @class */ (function () {
      /**
       * Creates a new instance of ResizeObserverController.
       *
       * @private
       */
      function ResizeObserverController() {
          /**
           * Indicates whether DOM listeners have been added.
           *
           * @private {boolean}
           */
          this.connected_ = false;
          /**
           * Tells that controller has subscribed for Mutation Events.
           *
           * @private {boolean}
           */
          this.mutationEventsAdded_ = false;
          /**
           * Keeps reference to the instance of MutationObserver.
           *
           * @private {MutationObserver}
           */
          this.mutationsObserver_ = null;
          /**
           * A list of connected observers.
           *
           * @private {Array<ResizeObserverSPI>}
           */
          this.observers_ = [];
          this.onTransitionEnd_ = this.onTransitionEnd_.bind(this);
          this.refresh = throttle(this.refresh.bind(this), REFRESH_DELAY);
      }
      /**
       * Adds observer to observers list.
       *
       * @param {ResizeObserverSPI} observer - Observer to be added.
       * @returns {void}
       */
      ResizeObserverController.prototype.addObserver = function (observer) {
          if (!~this.observers_.indexOf(observer)) {
              this.observers_.push(observer);
          }
          // Add listeners if they haven't been added yet.
          if (!this.connected_) {
              this.connect_();
          }
      };
      /**
       * Removes observer from observers list.
       *
       * @param {ResizeObserverSPI} observer - Observer to be removed.
       * @returns {void}
       */
      ResizeObserverController.prototype.removeObserver = function (observer) {
          var observers = this.observers_;
          var index = observers.indexOf(observer);
          // Remove observer if it's present in registry.
          if (~index) {
              observers.splice(index, 1);
          }
          // Remove listeners if controller has no connected observers.
          if (!observers.length && this.connected_) {
              this.disconnect_();
          }
      };
      /**
       * Invokes the update of observers. It will continue running updates insofar
       * it detects changes.
       *
       * @returns {void}
       */
      ResizeObserverController.prototype.refresh = function () {
          var changesDetected = this.updateObservers_();
          // Continue running updates if changes have been detected as there might
          // be future ones caused by CSS transitions.
          if (changesDetected) {
              this.refresh();
          }
      };
      /**
       * Updates every observer from observers list and notifies them of queued
       * entries.
       *
       * @private
       * @returns {boolean} Returns "true" if any observer has detected changes in
       *      dimensions of it's elements.
       */
      ResizeObserverController.prototype.updateObservers_ = function () {
          // Collect observers that have active observations.
          var activeObservers = this.observers_.filter(function (observer) {
              return observer.gatherActive(), observer.hasActive();
          });
          // Deliver notifications in a separate cycle in order to avoid any
          // collisions between observers, e.g. when multiple instances of
          // ResizeObserver are tracking the same element and the callback of one
          // of them changes content dimensions of the observed target. Sometimes
          // this may result in notifications being blocked for the rest of observers.
          activeObservers.forEach(function (observer) { return observer.broadcastActive(); });
          return activeObservers.length > 0;
      };
      /**
       * Initializes DOM listeners.
       *
       * @private
       * @returns {void}
       */
      ResizeObserverController.prototype.connect_ = function () {
          // Do nothing if running in a non-browser environment or if listeners
          // have been already added.
          if (!isBrowser || this.connected_) {
              return;
          }
          // Subscription to the "Transitionend" event is used as a workaround for
          // delayed transitions. This way it's possible to capture at least the
          // final state of an element.
          document.addEventListener('transitionend', this.onTransitionEnd_);
          window.addEventListener('resize', this.refresh);
          if (mutationObserverSupported) {
              this.mutationsObserver_ = new MutationObserver(this.refresh);
              this.mutationsObserver_.observe(document, {
                  attributes: true,
                  childList: true,
                  characterData: true,
                  subtree: true
              });
          }
          else {
              document.addEventListener('DOMSubtreeModified', this.refresh);
              this.mutationEventsAdded_ = true;
          }
          this.connected_ = true;
      };
      /**
       * Removes DOM listeners.
       *
       * @private
       * @returns {void}
       */
      ResizeObserverController.prototype.disconnect_ = function () {
          // Do nothing if running in a non-browser environment or if listeners
          // have been already removed.
          if (!isBrowser || !this.connected_) {
              return;
          }
          document.removeEventListener('transitionend', this.onTransitionEnd_);
          window.removeEventListener('resize', this.refresh);
          if (this.mutationsObserver_) {
              this.mutationsObserver_.disconnect();
          }
          if (this.mutationEventsAdded_) {
              document.removeEventListener('DOMSubtreeModified', this.refresh);
          }
          this.mutationsObserver_ = null;
          this.mutationEventsAdded_ = false;
          this.connected_ = false;
      };
      /**
       * "Transitionend" event handler.
       *
       * @private
       * @param {TransitionEvent} event
       * @returns {void}
       */
      ResizeObserverController.prototype.onTransitionEnd_ = function (_a) {
          var _b = _a.propertyName, propertyName = _b === void 0 ? '' : _b;
          // Detect whether transition may affect dimensions of an element.
          var isReflowProperty = transitionKeys.some(function (key) {
              return !!~propertyName.indexOf(key);
          });
          if (isReflowProperty) {
              this.refresh();
          }
      };
      /**
       * Returns instance of the ResizeObserverController.
       *
       * @returns {ResizeObserverController}
       */
      ResizeObserverController.getInstance = function () {
          if (!this.instance_) {
              this.instance_ = new ResizeObserverController();
          }
          return this.instance_;
      };
      /**
       * Holds reference to the controller's instance.
       *
       * @private {ResizeObserverController}
       */
      ResizeObserverController.instance_ = null;
      return ResizeObserverController;
  }());

  /**
   * Defines non-writable/enumerable properties of the provided target object.
   *
   * @param {Object} target - Object for which to define properties.
   * @param {Object} props - Properties to be defined.
   * @returns {Object} Target object.
   */
  var defineConfigurable = (function (target, props) {
      for (var _i = 0, _a = Object.keys(props); _i < _a.length; _i++) {
          var key = _a[_i];
          Object.defineProperty(target, key, {
              value: props[key],
              enumerable: false,
              writable: false,
              configurable: true
          });
      }
      return target;
  });

  /**
   * Returns the global object associated with provided element.
   *
   * @param {Object} target
   * @returns {Object}
   */
  var getWindowOf = (function (target) {
      // Assume that the element is an instance of Node, which means that it
      // has the "ownerDocument" property from which we can retrieve a
      // corresponding global object.
      var ownerGlobal = target && target.ownerDocument && target.ownerDocument.defaultView;
      // Return the local global object if it's not possible extract one from
      // provided element.
      return ownerGlobal || global$1;
  });

  // Placeholder of an empty content rectangle.
  var emptyRect = createRectInit(0, 0, 0, 0);
  /**
   * Converts provided string to a number.
   *
   * @param {number|string} value
   * @returns {number}
   */
  function toFloat(value) {
      return parseFloat(value) || 0;
  }
  /**
   * Extracts borders size from provided styles.
   *
   * @param {CSSStyleDeclaration} styles
   * @param {...string} positions - Borders positions (top, right, ...)
   * @returns {number}
   */
  function getBordersSize(styles) {
      var positions = [];
      for (var _i = 1; _i < arguments.length; _i++) {
          positions[_i - 1] = arguments[_i];
      }
      return positions.reduce(function (size, position) {
          var value = styles['border-' + position + '-width'];
          return size + toFloat(value);
      }, 0);
  }
  /**
   * Extracts paddings sizes from provided styles.
   *
   * @param {CSSStyleDeclaration} styles
   * @returns {Object} Paddings box.
   */
  function getPaddings(styles) {
      var positions = ['top', 'right', 'bottom', 'left'];
      var paddings = {};
      for (var _i = 0, positions_1 = positions; _i < positions_1.length; _i++) {
          var position = positions_1[_i];
          var value = styles['padding-' + position];
          paddings[position] = toFloat(value);
      }
      return paddings;
  }
  /**
   * Calculates content rectangle of provided SVG element.
   *
   * @param {SVGGraphicsElement} target - Element content rectangle of which needs
   *      to be calculated.
   * @returns {DOMRectInit}
   */
  function getSVGContentRect(target) {
      var bbox = target.getBBox();
      return createRectInit(0, 0, bbox.width, bbox.height);
  }
  /**
   * Calculates content rectangle of provided HTMLElement.
   *
   * @param {HTMLElement} target - Element for which to calculate the content rectangle.
   * @returns {DOMRectInit}
   */
  function getHTMLElementContentRect(target) {
      // Client width & height properties can't be
      // used exclusively as they provide rounded values.
      var clientWidth = target.clientWidth, clientHeight = target.clientHeight;
      // By this condition we can catch all non-replaced inline, hidden and
      // detached elements. Though elements with width & height properties less
      // than 0.5 will be discarded as well.
      //
      // Without it we would need to implement separate methods for each of
      // those cases and it's not possible to perform a precise and performance
      // effective test for hidden elements. E.g. even jQuery's ':visible' filter
      // gives wrong results for elements with width & height less than 0.5.
      if (!clientWidth && !clientHeight) {
          return emptyRect;
      }
      var styles = getWindowOf(target).getComputedStyle(target);
      var paddings = getPaddings(styles);
      var horizPad = paddings.left + paddings.right;
      var vertPad = paddings.top + paddings.bottom;
      // Computed styles of width & height are being used because they are the
      // only dimensions available to JS that contain non-rounded values. It could
      // be possible to utilize the getBoundingClientRect if only it's data wasn't
      // affected by CSS transformations let alone paddings, borders and scroll bars.
      var width = toFloat(styles.width), height = toFloat(styles.height);
      // Width & height include paddings and borders when the 'border-box' box
      // model is applied (except for IE).
      if (styles.boxSizing === 'border-box') {
          // Following conditions are required to handle Internet Explorer which
          // doesn't include paddings and borders to computed CSS dimensions.
          //
          // We can say that if CSS dimensions + paddings are equal to the "client"
          // properties then it's either IE, and thus we don't need to subtract
          // anything, or an element merely doesn't have paddings/borders styles.
          if (Math.round(width + horizPad) !== clientWidth) {
              width -= getBordersSize(styles, 'left', 'right') + horizPad;
          }
          if (Math.round(height + vertPad) !== clientHeight) {
              height -= getBordersSize(styles, 'top', 'bottom') + vertPad;
          }
      }
      // Following steps can't be applied to the document's root element as its
      // client[Width/Height] properties represent viewport area of the window.
      // Besides, it's as well not necessary as the <html> itself neither has
      // rendered scroll bars nor it can be clipped.
      if (!isDocumentElement(target)) {
          // In some browsers (only in Firefox, actually) CSS width & height
          // include scroll bars size which can be removed at this step as scroll
          // bars are the only difference between rounded dimensions + paddings
          // and "client" properties, though that is not always true in Chrome.
          var vertScrollbar = Math.round(width + horizPad) - clientWidth;
          var horizScrollbar = Math.round(height + vertPad) - clientHeight;
          // Chrome has a rather weird rounding of "client" properties.
          // E.g. for an element with content width of 314.2px it sometimes gives
          // the client width of 315px and for the width of 314.7px it may give
          // 314px. And it doesn't happen all the time. So just ignore this delta
          // as a non-relevant.
          if (Math.abs(vertScrollbar) !== 1) {
              width -= vertScrollbar;
          }
          if (Math.abs(horizScrollbar) !== 1) {
              height -= horizScrollbar;
          }
      }
      return createRectInit(paddings.left, paddings.top, width, height);
  }
  /**
   * Checks whether provided element is an instance of the SVGGraphicsElement.
   *
   * @param {Element} target - Element to be checked.
   * @returns {boolean}
   */
  var isSVGGraphicsElement = (function () {
      // Some browsers, namely IE and Edge, don't have the SVGGraphicsElement
      // interface.
      if (typeof SVGGraphicsElement !== 'undefined') {
          return function (target) { return target instanceof getWindowOf(target).SVGGraphicsElement; };
      }
      // If it's so, then check that element is at least an instance of the
      // SVGElement and that it has the "getBBox" method.
      // eslint-disable-next-line no-extra-parens
      return function (target) { return (target instanceof getWindowOf(target).SVGElement &&
          typeof target.getBBox === 'function'); };
  })();
  /**
   * Checks whether provided element is a document element (<html>).
   *
   * @param {Element} target - Element to be checked.
   * @returns {boolean}
   */
  function isDocumentElement(target) {
      return target === getWindowOf(target).document.documentElement;
  }
  /**
   * Calculates an appropriate content rectangle for provided html or svg element.
   *
   * @param {Element} target - Element content rectangle of which needs to be calculated.
   * @returns {DOMRectInit}
   */
  function getContentRect(target) {
      if (!isBrowser) {
          return emptyRect;
      }
      if (isSVGGraphicsElement(target)) {
          return getSVGContentRect(target);
      }
      return getHTMLElementContentRect(target);
  }
  /**
   * Creates rectangle with an interface of the DOMRectReadOnly.
   * Spec: https://drafts.fxtf.org/geometry/#domrectreadonly
   *
   * @param {DOMRectInit} rectInit - Object with rectangle's x/y coordinates and dimensions.
   * @returns {DOMRectReadOnly}
   */
  function createReadOnlyRect(_a) {
      var x = _a.x, y = _a.y, width = _a.width, height = _a.height;
      // If DOMRectReadOnly is available use it as a prototype for the rectangle.
      var Constr = typeof DOMRectReadOnly !== 'undefined' ? DOMRectReadOnly : Object;
      var rect = Object.create(Constr.prototype);
      // Rectangle's properties are not writable and non-enumerable.
      defineConfigurable(rect, {
          x: x, y: y, width: width, height: height,
          top: y,
          right: x + width,
          bottom: height + y,
          left: x
      });
      return rect;
  }
  /**
   * Creates DOMRectInit object based on the provided dimensions and the x/y coordinates.
   * Spec: https://drafts.fxtf.org/geometry/#dictdef-domrectinit
   *
   * @param {number} x - X coordinate.
   * @param {number} y - Y coordinate.
   * @param {number} width - Rectangle's width.
   * @param {number} height - Rectangle's height.
   * @returns {DOMRectInit}
   */
  function createRectInit(x, y, width, height) {
      return { x: x, y: y, width: width, height: height };
  }

  /**
   * Class that is responsible for computations of the content rectangle of
   * provided DOM element and for keeping track of it's changes.
   */
  var ResizeObservation = /** @class */ (function () {
      /**
       * Creates an instance of ResizeObservation.
       *
       * @param {Element} target - Element to be observed.
       */
      function ResizeObservation(target) {
          /**
           * Broadcasted width of content rectangle.
           *
           * @type {number}
           */
          this.broadcastWidth = 0;
          /**
           * Broadcasted height of content rectangle.
           *
           * @type {number}
           */
          this.broadcastHeight = 0;
          /**
           * Reference to the last observed content rectangle.
           *
           * @private {DOMRectInit}
           */
          this.contentRect_ = createRectInit(0, 0, 0, 0);
          this.target = target;
      }
      /**
       * Updates content rectangle and tells whether it's width or height properties
       * have changed since the last broadcast.
       *
       * @returns {boolean}
       */
      ResizeObservation.prototype.isActive = function () {
          var rect = getContentRect(this.target);
          this.contentRect_ = rect;
          return (rect.width !== this.broadcastWidth ||
              rect.height !== this.broadcastHeight);
      };
      /**
       * Updates 'broadcastWidth' and 'broadcastHeight' properties with a data
       * from the corresponding properties of the last observed content rectangle.
       *
       * @returns {DOMRectInit} Last observed content rectangle.
       */
      ResizeObservation.prototype.broadcastRect = function () {
          var rect = this.contentRect_;
          this.broadcastWidth = rect.width;
          this.broadcastHeight = rect.height;
          return rect;
      };
      return ResizeObservation;
  }());

  var ResizeObserverEntry = /** @class */ (function () {
      /**
       * Creates an instance of ResizeObserverEntry.
       *
       * @param {Element} target - Element that is being observed.
       * @param {DOMRectInit} rectInit - Data of the element's content rectangle.
       */
      function ResizeObserverEntry(target, rectInit) {
          var contentRect = createReadOnlyRect(rectInit);
          // According to the specification following properties are not writable
          // and are also not enumerable in the native implementation.
          //
          // Property accessors are not being used as they'd require to define a
          // private WeakMap storage which may cause memory leaks in browsers that
          // don't support this type of collections.
          defineConfigurable(this, { target: target, contentRect: contentRect });
      }
      return ResizeObserverEntry;
  }());

  var ResizeObserverSPI = /** @class */ (function () {
      /**
       * Creates a new instance of ResizeObserver.
       *
       * @param {ResizeObserverCallback} callback - Callback function that is invoked
       *      when one of the observed elements changes it's content dimensions.
       * @param {ResizeObserverController} controller - Controller instance which
       *      is responsible for the updates of observer.
       * @param {ResizeObserver} callbackCtx - Reference to the public
       *      ResizeObserver instance which will be passed to callback function.
       */
      function ResizeObserverSPI(callback, controller, callbackCtx) {
          /**
           * Collection of resize observations that have detected changes in dimensions
           * of elements.
           *
           * @private {Array<ResizeObservation>}
           */
          this.activeObservations_ = [];
          /**
           * Registry of the ResizeObservation instances.
           *
           * @private {Map<Element, ResizeObservation>}
           */
          this.observations_ = new MapShim();
          if (typeof callback !== 'function') {
              throw new TypeError('The callback provided as parameter 1 is not a function.');
          }
          this.callback_ = callback;
          this.controller_ = controller;
          this.callbackCtx_ = callbackCtx;
      }
      /**
       * Starts observing provided element.
       *
       * @param {Element} target - Element to be observed.
       * @returns {void}
       */
      ResizeObserverSPI.prototype.observe = function (target) {
          if (!arguments.length) {
              throw new TypeError('1 argument required, but only 0 present.');
          }
          // Do nothing if current environment doesn't have the Element interface.
          if (typeof Element === 'undefined' || !(Element instanceof Object)) {
              return;
          }
          if (!(target instanceof getWindowOf(target).Element)) {
              throw new TypeError('parameter 1 is not of type "Element".');
          }
          var observations = this.observations_;
          // Do nothing if element is already being observed.
          if (observations.has(target)) {
              return;
          }
          observations.set(target, new ResizeObservation(target));
          this.controller_.addObserver(this);
          // Force the update of observations.
          this.controller_.refresh();
      };
      /**
       * Stops observing provided element.
       *
       * @param {Element} target - Element to stop observing.
       * @returns {void}
       */
      ResizeObserverSPI.prototype.unobserve = function (target) {
          if (!arguments.length) {
              throw new TypeError('1 argument required, but only 0 present.');
          }
          // Do nothing if current environment doesn't have the Element interface.
          if (typeof Element === 'undefined' || !(Element instanceof Object)) {
              return;
          }
          if (!(target instanceof getWindowOf(target).Element)) {
              throw new TypeError('parameter 1 is not of type "Element".');
          }
          var observations = this.observations_;
          // Do nothing if element is not being observed.
          if (!observations.has(target)) {
              return;
          }
          observations.delete(target);
          if (!observations.size) {
              this.controller_.removeObserver(this);
          }
      };
      /**
       * Stops observing all elements.
       *
       * @returns {void}
       */
      ResizeObserverSPI.prototype.disconnect = function () {
          this.clearActive();
          this.observations_.clear();
          this.controller_.removeObserver(this);
      };
      /**
       * Collects observation instances the associated element of which has changed
       * it's content rectangle.
       *
       * @returns {void}
       */
      ResizeObserverSPI.prototype.gatherActive = function () {
          var _this = this;
          this.clearActive();
          this.observations_.forEach(function (observation) {
              if (observation.isActive()) {
                  _this.activeObservations_.push(observation);
              }
          });
      };
      /**
       * Invokes initial callback function with a list of ResizeObserverEntry
       * instances collected from active resize observations.
       *
       * @returns {void}
       */
      ResizeObserverSPI.prototype.broadcastActive = function () {
          // Do nothing if observer doesn't have active observations.
          if (!this.hasActive()) {
              return;
          }
          var ctx = this.callbackCtx_;
          // Create ResizeObserverEntry instance for every active observation.
          var entries = this.activeObservations_.map(function (observation) {
              return new ResizeObserverEntry(observation.target, observation.broadcastRect());
          });
          this.callback_.call(ctx, entries, ctx);
          this.clearActive();
      };
      /**
       * Clears the collection of active observations.
       *
       * @returns {void}
       */
      ResizeObserverSPI.prototype.clearActive = function () {
          this.activeObservations_.splice(0);
      };
      /**
       * Tells whether observer has active observations.
       *
       * @returns {boolean}
       */
      ResizeObserverSPI.prototype.hasActive = function () {
          return this.activeObservations_.length > 0;
      };
      return ResizeObserverSPI;
  }());

  // Registry of internal observers. If WeakMap is not available use current shim
  // for the Map collection as it has all required methods and because WeakMap
  // can't be fully polyfilled anyway.
  var observers = typeof WeakMap !== 'undefined' ? new WeakMap() : new MapShim();
  /**
   * ResizeObserver API. Encapsulates the ResizeObserver SPI implementation
   * exposing only those methods and properties that are defined in the spec.
   */
  var ResizeObserver = /** @class */ (function () {
      /**
       * Creates a new instance of ResizeObserver.
       *
       * @param {ResizeObserverCallback} callback - Callback that is invoked when
       *      dimensions of the observed elements change.
       */
      function ResizeObserver(callback) {
          if (!(this instanceof ResizeObserver)) {
              throw new TypeError('Cannot call a class as a function.');
          }
          if (!arguments.length) {
              throw new TypeError('1 argument required, but only 0 present.');
          }
          var controller = ResizeObserverController.getInstance();
          var observer = new ResizeObserverSPI(callback, controller, this);
          observers.set(this, observer);
      }
      return ResizeObserver;
  }());
  // Expose public methods of ResizeObserver.
  [
      'observe',
      'unobserve',
      'disconnect'
  ].forEach(function (method) {
      ResizeObserver.prototype[method] = function () {
          var _a;
          return (_a = observers.get(this))[method].apply(_a, arguments);
      };
  });

  var index$1 = (function () {
      // Export existing implementation if available.
      if (typeof global$1.ResizeObserver !== 'undefined') {
          return global$1.ResizeObserver;
      }
      return ResizeObserver;
  })();

  var preventDefault = (fn => e => {
    e.preventDefault();
    fn();
  });

  const selectors$r = {
    imageById: id => `[data-media-item-id='${id}']`,
    imageWrapper: '[data-product-media-wrapper]',
    inYourSpace: '[data-in-your-space]'
  };
  const classes$b = {
    hidden: 'hidden'
  };
  function switchImage (container, imageId) {
    const newImage = n$1(selectors$r.imageWrapper + selectors$r.imageById(imageId), container);
    const newImageMedia = n$1('.media', newImage);
    const otherImages = t$3(`${selectors$r.imageWrapper}:not(${selectors$r.imageById(imageId)})`, container);
    i(newImage, classes$b.hidden); // Update view in space button

    const inYourSpaceButton = n$1(selectors$r.inYourSpace, container);

    if (inYourSpaceButton) {
      if (newImageMedia.dataset.mediaType === 'model') {
        inYourSpaceButton.setAttribute('data-shopify-model3d-id', newImageMedia.dataset.mediaId);
      }
    }

    otherImages.forEach(image => u(image, classes$b.hidden));
  }

  /**
   * Image Helper Functions
   * -----------------------------------------------------------------------------
   * https://github.com/Shopify/slate.git.
   *
   */

  /**
   * Adds a Shopify size attribute to a URL
   *
   * @param src
   * @param size
   * @returns {*}
   */
  function getSizedImageUrl(src, size) {
    if (size === null) {
      return src;
    }

    if (size === 'master') {
      return removeProtocol(src);
    }

    const match = src.match(/\.(jpg|jpeg|gif|png|bmp|bitmap|tiff|tif)(\?v=\d+)?$/i);

    if (match) {
      const prefix = src.split(match[0]);
      const suffix = match[0];

      return removeProtocol(`${prefix[0]}_${size}${suffix}`);
    } else {
      return null;
    }
  }

  function removeProtocol(path) {
    return path.replace(/http(s)?:/, '');
  }

  var svg = {
    add: `
    <div class="icon">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <path fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" d="M12 5v14M5 12h14"/>
      </svg>
    </div>
  `,
    minus: `
    <div class="icon">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <path fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" d="M5 12h14"/>
      </svg>
    </div>
  `,
    remove: `
    <div class="icon">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <path fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
      </svg>
    </div>
  `
  };

  const {
    strings: strings$4
  } = window.theme;
  function QuickCart(node) {
    const delegate = new Delegate(node);
    const overlay = n$1('[data-overlay]', node);
    const cartTab = n$1('[data-cart]', node); // Cart

    const itemsContainer = n$1('[data-items]', node);
    const empty = n$1('[data-empty]', node);
    const buyNowButton = n$1('[data-buy-now-button]', node);
    const footer = n$1('[data-footer]', node);
    const discounts = n$1('[data-discounts]', footer);
    const subtotal = n$1('[data-subtotal]', footer);
    const closeButton = n$1('[data-close-icon]', node);
    delegate.on('click', 'button[data-decrease]', (_, target) => {
      const qty = parseInt(target.closest('.quick-cart__item').dataset.quantity) - 1;
      cart.updateItem(target.dataset.decrease, qty);
    });
    delegate.on('click', 'button[data-increase]', (_, target) => {
      const qty = parseInt(target.closest('.quick-cart__item').dataset.quantity) + 1;
      cart.updateItem(target.dataset.increase, qty);
    });
    delegate.on('click', 'button[data-remove]', (_, target) => {
      cart.updateItem(target.dataset.remove, 0);
    });
    const cartTrap = createFocusTrap(node, {
      allowOutsideClick: true
    }); // Initial cart fetch

    cart.get().then(renderCart); // On every update

    c('cart:updated', ({
      cart
    }) => renderCart(cart));
    const events = [e$2([overlay, closeButton], 'click', close), e$2(node, 'keydown', ({
      keyCode
    }) => {
      if (keyCode === 27) close();
    })];
    c('cart:open', (_, {
      flash
    }) => open());

    function open() {
      u(node, 'active');
      cartTrap.activate();
      setTimeout(() => {
        disableBodyScroll(node, {
          allowTouchMove: el => {
            while (el && el !== document.body) {
              if (el.getAttribute('data-scroll-lock-ignore') !== null) {
                return true;
              }

              el = el.parentNode;
            }
          },
          reserveScrollBarGap: true
        });
        u(node, 'visible');
        u(cartTab, 'visible');
      }, 50);
    }

    function close() {
      i(node, 'visible');
      setTimeout(() => {
        i(node, 'active');
        enableBodyScroll(node);
        u(cartTab, 'visible');
        cartTrap.deactivate();
      }, 350);
    }

    function renderCart(cart) {
      const {
        cart_level_discount_applications: cartDiscounts
      } = cart;
      itemsContainer.innerHTML = renderItems(cart);
      discounts.innerHTML = renderCartDiscounts(cartDiscounts);
      l(footer, 'visible', cart.sorted.length);
      l(empty, 'visible', !cart.sorted.length);
      l(discounts, 'visible', cartDiscounts.length);
      subtotal.innerHTML = formatMoney(cart.total_price);

      if (cart.sorted.length) {
        preloadBuyButton(cart);
      }
    }

    function renderItems({
      sorted
    }) {
      return r(sorted.length > 0, sorted.reduce((markup, item) => markup += createItem(item), ''));
    }

    function preloadBuyButton(cart) {
      let preloadURL = cart.items.reduce((acc, curr, i) => {
        const {
          variant_id,
          quantity
        } = curr;
        return acc = acc + `${variant_id}:${quantity}${i === cart.items.length - 1 ? '' : ','}`;
      }, '');
      buyNowButton.href = `${window.theme.routes.cart.base}/${preloadURL}`;
    }

    function destroy() {
      events.forEach(unsubscribe => unsubscribe());
    }

    return {
      open,
      close,
      destroy
    };
  }

  function createItem({
    line_level_discount_allocations: discounts,
    ...item
  }) {
    const imgSrc = item.featured_image ? item.featured_image.url : item.image;
    const imgAlt = item.featured_image ? item.featured_image.alt : '';
    const imgUrl = imgSrc && getSizedImageUrl(imgSrc, '240x');
    const image = r(imgSrc, `<img class="image__img lazyload" alt="${imgAlt}" data-src="${imgUrl}" />`);
    const sellingPlanName = item.selling_plan_allocation ? `<p class="fs-body-base c-subdued">${item.selling_plan_allocation.selling_plan.name}</p>` : ``;
    return `
    <div class="quick-cart__item ff-body fs-body-base" data-id="${item.variant_id}" data-quantity="${item.quantity}">
      <div class="quick-cart__item-left">
        <a href="${item.url}">
          <div class="quick-cart__image">${image}</div>
        </a>
      </div>
      <div class="quick-cart__item-middle">
        <h4 class="fs-body-bold"><a href="${item.url}">${item.product_title}</a></h4>
        <div>
          ${r(item.original_price > item.final_price, `<s class="qty">${formatMoney(item.original_price)}</s>`)}
          ${formatMoney(item.final_price)}
          ${r(item.quantity > 1, `<span class="c-subdued">x ${item.quantity}</span>`)}
        </div>
        ${renderUnitPrice(item.unit_price, item.unit_price_measurement)}
        ${renderOptions(item)}
        ${renderLineDiscounts(discounts)}
        ${sellingPlanName}
      </div>
      <div class="quick-cart__control">
        <div class="quick-cart__control-top">
          <button class="quick-cart__button quick-cart__button-increase" data-increase="${item.variant_id}" aria-label="${strings$4.quickCart.addProductQuantity}">
            ${svg.add}
          </button>
          <button class="quick-cart__button quick-cart__button-decrease" data-decrease="${item.variant_id}" aria-label="${strings$4.quickCart.removeProductQuantity}">
            ${svg.minus}
          </button>
          <button class="quick-cart__button quick-cart__button-remove" data-remove="${item.variant_id}" aria-label="${strings$4.quickCart.removeProduct}">
            ${svg.remove}
          </button>
        </div>
      </div>
    </div>
  `;
  }

  function renderOptions({
    options_with_values: options,
    variant_title
  }) {
    return r(options.length > 0 && variant_title, options.reduce((markup, {
      name,
      value
    }) => markup + `<div>${name}: ${value}</div>`, ''));
  }

  function renderCartDiscounts(discounts) {
    return r(Boolean(discounts.length), `
      <ul>
        ${discounts.map(({
    title,
    total_allocated_amount: value
  }) => `<div>${title} (-${formatMoney(value)})</div>`)}
      </ul>
    `);
  }

  function renderLineDiscounts(discounts) {
    const formatted_discounts = discounts.map(({
      amount,
      discount_application: {
        title
      }
    }) => {
      return `<li>${title} (-${formatMoney(amount)})</li>`;
    });
    return r(Boolean(discounts.length), `<ul class="quick-cart__item-discounts fs-body-small fs-body-base-ns c-subdued">${formatted_discounts}</ul>`);
  }

  function r(bool, whenTrue) {
    return bool ? whenTrue : ``;
  }

  function PredictiveSearch(resultsContainer) {
    const settings = n$1('[data-search-settings]', document);
    const {
      limit,
      show_articles,
      show_pages
    } = JSON.parse(settings.innerHTML);
    const cachedResults = {}; // Broken down highlightable elements

    const headingOpeningElement = `<div class="quick-search__result-heading">`;
    const headingClosingElement = `</div>`;
    const vendorsOpeningElement = '<span class="quick-search__result-vendor">';
    const vendorsClosingElement = '</span>'; // Build out type query string

    let types = 'product';

    if (show_articles) {
      types += ',article';
    }

    if (show_pages) {
      types += ',page';
    }

    function renderSearchResults(resultsMarkup) {
      resultsContainer.innerHTML = resultsMarkup;
    }

    function highlightQuery(searchTerm, searchResult) {
      const regexHeadings = new RegExp(`${headingOpeningElement}(.*?)${headingClosingElement}`, 'g');
      const regexVendors = new RegExp(`${vendorsOpeningElement}(.*?)${vendorsClosingElement}`, 'g');
      let highlightedResult = searchResult; // Highlight all instances of the search term in headings

      highlightedResult = highlightedResult.replaceAll(regexHeadings, match => {
        return highlightInner(searchTerm, match, {
          openingElement: headingOpeningElement,
          closingElement: headingClosingElement
        });
      }); // Highlight all instances of the search term in vendor -- specific to product results

      highlightedResult = highlightedResult.replaceAll(regexVendors, match => {
        return highlightInner(searchTerm, match, {
          openingElement: vendorsOpeningElement,
          closingElement: vendorsClosingElement
        });
      });
      return highlightedResult;
    }

    function highlightInner(searchTerm, matchedString, elements) {
      const regex = new RegExp(`(${searchTerm})`, 'gi');
      let highlightedSearch = matchedString; // Remove opening element

      highlightedSearch = highlightedSearch.replace(elements.openingElement, ''); // Remove closing element

      highlightedSearch = highlightedSearch.replace(elements.closingElement, ''); // Return all elements in proper order after adding highlight spans

      return elements.openingElement + highlightedSearch.replace(regex, '<mark class="hl">$1</mark>') + elements.closingElement;
    }

    function getSearchResults(searchTerm) {
      const queryKey = searchTerm.replace(' ', '-').toLowerCase(); // Render result if it appears within the cache

      if (cachedResults[`${queryKey}`]) {
        renderSearchResults(cachedResults[`${queryKey}`]);
        return;
      }

      fetch(`${window.theme.routes.predictive_search_url}?q=${encodeURIComponent(searchTerm)}&${encodeURIComponent('resources[type]')}=${types}&${encodeURIComponent('resources[limit]')}=${limit}&section_id=predictive-search`).then(response => {
        if (!response.ok) {
          const error = new Error(response.status);
          throw error;
        }

        return response.text();
      }).then(text => {
        let resultsMarkup = new DOMParser().parseFromString(text, 'text/html').querySelector('#shopify-section-predictive-search').innerHTML; // Highlight query

        resultsMarkup = highlightQuery(searchTerm, resultsMarkup); // Cache results

        cachedResults[queryKey] = resultsMarkup;
        renderSearchResults(resultsMarkup);
      }).catch(error => {
        throw error;
      });
    }

    return {
      getSearchResults
    };
  }

  const classes$a = {
    active: 'active',
    visible: 'visible'
  };
  function QuickSearch (node) {
    const overlay = n$1('[data-overlay]', node);
    const input = n$1('[data-input]', node);
    const clear = n$1('[data-clear]', node);
    const resultsContainer = n$1('[data-results]', node);
    const predictiveSearch = PredictiveSearch(resultsContainer);
    const closeButton = n$1('[data-close-icon]', node);
    const events = [e$2([overlay, closeButton], 'click', close), e$2(clear, 'click', reset), e$2(input, 'input', handleInput), e$2(node, 'keydown', ({
      keyCode
    }) => {
      if (keyCode === 27) close();
    })];
    const trap = createFocusTrap(node, {
      allowOutsideClick: true
    });

    function handleInput(e) {
      if (e.target.value === '') reset();
      l(clear, classes$a.visible, e.target.value !== '');
      l(input.parentNode, classes$a.active, e.target.value !== '');
      predictiveSearch.getSearchResults(e.target.value);
    } // Clear contents of the search input and hide results container


    function reset(e) {
      e && e.preventDefault();
      input.value = '';
      i(clear, classes$a.visible);
      i(input.parentNode, classes$a.active);
      resultsContainer.innerHTML = '';
      input.focus();
    }

    function open() {
      u(node, classes$a.active);
      trap.activate();
      setTimeout(() => {
        input.focus();
        disableBodyScroll(node, {
          reserveScrollBarGap: true
        });
        u(node, classes$a.visible);
      }, 50);
    }

    function close() {
      i(node, classes$a.visible);
      trap.deactivate();
      setTimeout(() => {
        i(node, classes$a.active);
        enableBodyScroll(node);
      }, 350);
    }

    function destroy() {
      close();
      events.forEach(unsubscribe => unsubscribe());
    }

    return {
      open,
      close,
      destroy
    };
  }

  function Navigation(node) {
    if (!node) return;
    const parents = t$3('[data-parent]', node);
    if (!parents) return;
    const delegate = new Delegate(document.body);
    delegate.on('click', '*', e => handleClick(e));
    const events = [e$2(parents, 'click', e => {
      e.preventDefault();
      toggleMenu(e.currentTarget.parentNode);
    }), e$2(node, 'keydown', ({
      keyCode
    }) => {
      if (keyCode === 27) closeAll();
    }), e$2(t$3('.header__links-list > li > a', node), 'focus', e => {
      if (!userIsUsingKeyboard()) return;
      closeAll();
    }), e$2(t$3('[data-link]', node), 'focus', e => {
      e.preventDefault();
      if (!userIsUsingKeyboard()) return;
      const link = e.currentTarget;

      if (link.hasAttribute('data-parent')) {
        toggleMenu(link.parentNode);
      }

      const siblings = t$3('[data-link]', link.parentNode.parentNode);
      siblings.forEach(el => l(t$3('[data-submenu]', el.parentNode), 'active', el === link));
    }), // Close everything when focus leaves the main menu
    e$2(t$3('[data-link]', node), 'focusout', e => {
      if (!userIsUsingKeyboard()) return;

      if (e.relatedTarget && !e.relatedTarget.hasAttribute('data-link')) {
        closeAll();
      }
    }), // Listen to horizontal scroll to offset inner menus
    e$2(node, 'scroll', () => {
      document.documentElement.style.setProperty('--navigation-menu-offet', `${node.scrollLeft}px`);
    })];

    function userIsUsingKeyboard() {
      return a$1(document.body, 'user-is-tabbing');
    }

    function toggleMenu(el) {
      const menu = n$1('[data-submenu]', el);
      const menuTrigger = n$1('[data-link]', el);

      if (!a$1(menu, 'active')) {
        // Make sure all lvl 2 submenus are closed before opening another
        if (el.parentNode.dataset.depth === '1') {
          closeAll(el.parentNode);
        } else {
          closeAll();
        }

        menuTrigger.setAttribute('aria-expanded', true);
        menu.setAttribute('aria-hidden', false);
        u(menu, 'active');
      } else {
        // If the toggle is closing the element from the parent close all internal
        if (a$1(el.parentNode, 'header__links-list')) {
          closeAll();
          return;
        }

        menuTrigger.setAttribute('aria-expanded', false);
        menu.setAttribute('aria-hidden', true);
        i(menu, 'active');
      }
    } // We want to close the menu when anything is clicked that isn't a submenu


    function handleClick(e) {
      if (!e.target.closest('[data-submenu-parent]')) {
        closeAll();
      }
    }

    function closeAll(target = node) {
      const subMenus = t$3('[data-submenu]', target);
      const parentTriggers = t$3('[data-parent]', target);
      i(subMenus, 'active');
      subMenus.forEach(sub => sub.setAttribute('aria-hidden', true));
      parentTriggers.forEach(trig => trig.setAttribute('aria-expanded', false));
    }

    function destroy() {
      delegate.off();
      events.forEach(evt => evt());
    }

    return {
      destroy
    };
  }

  const selectors$q = {
    clear: '[data-search-clear]',
    input: '[data-input]',
    results: '[data-search-results]',
    search: '[data-search-submit]'
  };
  function DrawerSearch(container) {
    // Elements
    const input = n$1(selectors$q.input, container);
    const resultsContainer = n$1(selectors$q.results, container);
    const clearButton = n$1(selectors$q.clear, container);
    const searchButton = n$1(selectors$q.search, container);
    const predictiveSearch = PredictiveSearch(resultsContainer); // Events

    const inputChange = e$2(input, 'input', handleInputChange);
    const clearClick = e$2(clearButton, 'click', reset);

    function handleInputChange({
      target: {
        value
      }
    }) {
      if (value === '') reset();
      l([clearButton, searchButton], 'visible', value !== '');
      l(input, 'active', value !== '');
      predictiveSearch.getSearchResults(value);
    }

    function reset(e) {
      e && e.preventDefault();
      clear();
      input.focus();
    }

    function clear() {
      input.value = '';
      i([resultsContainer, clearButton, searchButton], 'visible');
      i(input, 'active');
      resultsContainer.innerHTML = '';
    }

    function destroy() {
      inputChange();
      clearClick();
    }

    return {
      destroy,
      clear
    };
  }

  const sel$2 = {
    overlay: '[data-overlay]',
    listItem: '[data-list-item]',
    item: '[data-item]',
    allLinks: '[data-all-links]',
    main: '[data-main]',
    primary: '[data-primary-container]',
    // Cross border
    form: '.drawer-menu__form',
    localeInput: '[data-locale-input]',
    currencyInput: '[data-currency-input]'
  };
  const classes$9 = {
    active: 'active',
    visible: 'visible',
    childVisible: 'child-visible'
  }; // Extra space we add to the height of the inner container

  const formatHeight = h => h + 8 + 'px';

  const menu = node => {
    const focusTrap = createFocusTrap(node); // The individual link list the merchant selected

    let linksDepth = 0; // This is the element that holds the one we move left and right (primary)
    // We also need to assign its height initially so we get smooth transitions

    const main = n$1(sel$2.main, node); // Element that holds all the primary links and moves left and right

    const primary = n$1(sel$2.primary, node); // Cross border

    const form = n$1(sel$2.form, node);
    const localeInput = n$1(sel$2.localeInput, node);
    const currencyInput = n$1(sel$2.currencyInput, node);
    const search = DrawerSearch(node); // Nodes

    const overlay = n$1(sel$2.overlay, node);
    const parents = t$3('[data-item="parent"]', node);
    const parentBack = t$3('[data-item="back"]', node);
    const languages = t$3('[data-item="locale"]', node);
    const currencies = t$3('[data-item="currency"]', node);
    const closeButtons = t$3('[data-drawer-close]', node);
    const events = [// Click on overlay or close button
    e$2(overlay, 'click', close), e$2(closeButtons, 'click', close), // Esq pressed
    e$2(node, 'keydown', ({
      keyCode
    }) => {
      if (keyCode === 27) close();
    }), // Element that will navigate to child navigation list
    e$2(parents, 'click', clickParent), // Element that will navigate back up the tree
    e$2(parentBack, 'click', clickBack), // Individual language
    e$2(languages, 'click', e => handleCrossBorder(e, localeInput)), // // Individual currency
    e$2(currencies, 'click', e => handleCrossBorder(e, currencyInput))];

    function open() {
      u(node, classes$9.active);
      setTimeout(() => {
        u(node, classes$9.visible);
        focusTrap.activate();
        disableBodyScroll(node, {
          allowTouchMove: el => {
            while (el && el !== document.body) {
              if (el.getAttribute('data-scroll-lock-ignore') !== null) {
                return true;
              }

              el = el.parentNode;
            }
          },
          reserveScrollBarGap: true
        });

        if (linksDepth === 0) {
          main.style.height = formatHeight(primary.offsetHeight);
        }
      }, 50);
    }

    function close() {
      focusTrap.deactivate();
      i(node, classes$9.visible);
      setTimeout(() => {
        i(node, classes$9.active);
        enableBodyScroll(node);
      }, 350);
    }

    function clickParent(e) {
      e.preventDefault();
      const link = e.currentTarget;
      const childMenu = link.nextElementSibling;
      const firstFocusable = n$1('.drawer-menu__link', childMenu);
      u(childMenu, classes$9.visible);
      u(link.parentNode, classes$9.childVisible);

      if (childMenu.hasAttribute('data-search-menu')) {
        u(node, 'search-active');
      }

      main.style.height = formatHeight(childMenu.offsetHeight);
      navigate(linksDepth += 1);
      link.setAttribute('aria-expanded', true);
      childMenu.setAttribute('aria-hidden', false);
      setTimeout(() => {
        firstFocusable.focus();
      }, 50);
    }

    function navigate(depth) {
      linksDepth = depth;
      primary.setAttribute('data-depth', depth);
    }

    function clickBack(e) {
      e.preventDefault();
      const menuBefore = e.currentTarget.closest(sel$2.listItem).closest('ul');
      const firstFocusable = n$1('.drawer-menu__link', menuBefore);
      const menu = e.currentTarget.closest('ul');
      const parentLink = n$1('.drawer-menu__link', menu.parentNode);
      i(menu, classes$9.visible);
      i(parentLink.parentNode, classes$9.childVisible);
      navigate(linksDepth -= 1);
      parentLink.setAttribute('aria-expanded', false);
      menu.setAttribute('aria-hidden', true);
      main.style.height = formatHeight(menuBefore.offsetHeight);

      if (menu.hasAttribute('data-search-menu')) {
        search.clear();
        i(node, 'search-active');
      }

      setTimeout(() => {
        firstFocusable.focus();
      }, 50);
    }

    function handleCrossBorder(e, input) {
      const {
        value
      } = e.currentTarget.dataset;
      input.value = value;
      close();
      form.submit();
    }

    function destroy() {
      events.forEach(unsubscribe => unsubscribe());
      enableBodyScroll(node);
      search.destroy();
    }

    return {
      close,
      destroy,
      open
    };
  };

  function setHeaderHeightVar(height) {
    document.documentElement.style.setProperty('--height-header', height + 'px');
  }

  register('header', {
    onLoad() {
      const {
        enableStickyHeader
      } = this.container.dataset;
      const cartIcon = n$1('[data-js-cart-icon]', this.container);
      const cartIndicator = n$1('[data-js-cart-indicator]', cartIcon);
      const count = n$1('[data-js-cart-count]', this.container);
      const menuButtons = t$3('[data-js-menu-button]', this.container);
      const searchButtons = t$3('[data-search]', this.container);
      const space = n$1('[data-header-space]', document);
      const menu$1 = menu(n$1('[data-drawer-menu]'));
      const quickSearch = QuickSearch(n$1('[data-quick-search]', this.container));
      const quickCart = QuickCart(n$1('[data-quick-cart]', this.container));
      const navigation = Navigation(n$1('[data-navigation]', this.container)); // These all return a function for cleanup

      this.listeners = [c('cart:updated', ({
        cart
      }) => {
        i(cartIndicator, 'visible');
        setTimeout(() => u(cartIndicator, 'visible'), 500);
        count.innerHTML = cart.item_count;
      }), e$2(menuButtons, 'click', preventDefault(menu$1.open)), e$2(searchButtons, 'click', preventDefault(quickSearch.open)), e$2(cartIcon, 'click', preventDefault(quickCart.open))]; // Components return a destroy function for cleanup

      this.components = [menu$1, quickSearch, quickCart]; // navigation only exists if the header style is Inline links

      navigation && this.components.push(navigation);

      if (enableStickyHeader) {
        // Our header is always sticky (with position: sticky) however at some
        // point we want to adjust the styling (eg. box-shadow) so we toggle
        // the is-sticky class when our arbitrary space element (.header__space)
        // goes in and out of the viewport.
        this.io = new IntersectionObserver(([{
          isIntersecting: visible
        }]) => {
          l(this.container, 'is-sticky', !visible);
        });
        this.io.observe(space);
      } // This will watch the height of the header and update the --height-header
      // css variable when necessary. That var gets used for the negative top margin
      // to render the page body under the transparent header


      this.ro = new index$1(([{
        target
      }]) => {
        if (!a$1(target, 'is-sticky')) {
          setHeaderHeightVar(target.offsetHeight);
        }
      });
      this.ro.observe(this.container);
    },

    onUnload() {
      this.listeners.forEach(l => l());
      this.components.forEach(c => c.destroy());
      this.io && this.io.disconnect();
      this.ro.disconnect();
    }

  });

  const selectors$p = {
    form: '.selectors-form',
    list: '[data-disclosure-list]',
    toggle: '[data-disclosure-toggle]',
    input: '[data-disclosure-input]',
    option: '[data-disclosure-option]'
  };
  const classes$8 = {
    visible: 'disclosure-list--visible'
  };

  function has(list, selector) {
    return list.map(l => l.contains(selector)).filter(Boolean);
  }

  function Disclosure(node) {
    const form = node.closest(selectors$p.form);
    const list = n$1(selectors$p.list, node);
    const toggle = n$1(selectors$p.toggle, node);
    const input = n$1(selectors$p.input, node);
    const options = t$3(selectors$p.option, node);
    const events = [e$2(toggle, 'click', handleToggle), e$2(options, 'click', submitForm), e$2(document, 'click', handleBodyClick), e$2(toggle, 'focusout', handleToggleFocusOut), e$2(list, 'focusout', handleListFocusOut), e$2(node, 'keyup', handleKeyup)];

    function submitForm(evt) {
      evt.preventDefault();
      const {
        value
      } = evt.currentTarget.dataset;
      input.value = value;
      form.submit();
    }

    function handleToggleFocusOut(evt) {
      const disclosureLostFocus = has([node], evt.relatedTarget).length === 0;

      if (disclosureLostFocus) {
        hideList();
      }
    }

    function handleListFocusOut(evt) {
      const childInFocus = has([node], evt.relatedTarget).length > 0;
      const isVisible = list.classList.contains(classes$8.visible);

      if (isVisible && !childInFocus) {
        hideList();
      }
    }

    function handleKeyup(evt) {
      if (evt.which !== 27) return;
      hideList();
      toggle.focus();
    }

    function handleToggle(evt) {
      const ariaExpanded = evt.currentTarget.getAttribute('aria-expanded') === true;
      evt.currentTarget.setAttribute('aria-expanded', !ariaExpanded);
      list.classList.toggle(classes$8.visible);
    }

    function handleBodyClick(evt) {
      const isOption = has([node], evt.target).length > 0;
      const isVisible = list.classList.contains(classes$8.visible);

      if (isVisible && !isOption) {
        hideList();
      }
    }

    function hideList() {
      toggle.setAttribute('aria-expanded', false);
      list.classList.remove(classes$8.visible);
    }

    function unload() {
      events.forEach(evt => evt());
    }

    return {
      unload
    };
  }

  const selectors$o = {
    disclosure: '[data-disclosure]',
    header: '[data-header]'
  };
  register('footer', {
    crossBorder: {},

    onLoad() {
      const headers = t$3(selectors$o.header, this.container);
      this.headerClick = e$2(headers, 'click', handleHeaderClick);

      function handleHeaderClick({
        currentTarget
      }) {
        const {
          nextElementSibling: content
        } = currentTarget;
        l(currentTarget, 'open', !isVisible(content));
        slideStop(content);

        if (isVisible(content)) {
          slideUp(content);
        } else {
          slideDown(content);
        }
      } // Wire up Cross Border disclosures


      const cbSelectors = t$3(selectors$o.disclosure, this.container);

      if (cbSelectors) {
        cbSelectors.forEach(selector => {
          const {
            disclosure: d
          } = selector.dataset;
          this.crossBorder[d] = Disclosure(selector);
        });
      }
    },

    onUnload() {
      this.headerClick();
      Object.keys(this.crossBorder).forEach(t => this.crossBorder[t].unload());
    }

  });

  const storage$1 = {
    get: () => e('exit_intent'),
    set: val => r$1('exit_intent', val)
  };
  register('popup', {
    onLoad() {
      const closeBtn = n$1('[data-close]', this.container);
      const overlay = n$1('[data-overlay]', this.container);
      this.closeClick = e$2([closeBtn, overlay], 'click', e => {
        e.preventDefault();
        this.close();
      });

      this.bodyLeave = () => {};

      const {
        timeout
      } = this.container.dataset;

      const mouseleave = e => {
        if (!e.relatedTarget && !e.toElement) {
          this.open();
          this.bodyLeave();
        }
      };

      if (!storage$1.get() && isMobile$1()) {
        setTimeout(() => this.open(), parseInt(timeout));
      } else if (!storage$1.get()) {
        this.bodyLeave = e$2(document.body, 'mouseout', mouseleave);
      }
    },

    open() {
      u(this.container, 'visible');
    },

    close() {
      storage$1.set(true);
      i(this.container, 'visible');
    },

    onSelect() {
      this.open();
    },

    onDeselect() {
      this.close();
    },

    onUnload() {
      this.closeClick();
      this.bodyLeave();
    }

  });

  const slideshowOpts = {
    adaptiveHeight: false,
    draggable: false,
    fade: true,
    pageDots: false,
    prevNextButtons: false,
    wrapAround: true,
    pauseAutoPlayOnHover: !window.Shopify.designMode
  };
  const classes$7 = {
    active: 'is-active'
  };
  register('announcement-bar', {
    timer: null,
    listeners: [],

    onLoad() {
      const timing = parseInt(this.container.dataset.timing);
      const announcements = t$3('[data-announcement]', this.container);
      if (!announcements.length) return;
      document.documentElement.style.setProperty('--announcement-height', this.container.offsetHeight + 'px');

      if (announcements.length > 1) {
        Promise.resolve().then(function () { return index; }).then(({
          default: Flickity
        }) => {
          this.slideshow = new Flickity(this.container, { ...slideshowOpts,
            autoPlay: timing,
            on: {
              // Need to add a modifier to animate after the first slide has changed
              change(index) {
                announcements.forEach((el, i) => l(el, classes$7.active, index === i));
              }

            }
          });
          this.slideshow.on('pointerUp', () => this.handleRestart());
        });
        this.listeners.push(e$2(this.container, 'touchend', () => this.handleRestart()));
      } else {
        u(announcements[0], 'is-active', 'is-selected');
      }
    },

    handleRestart() {
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.slideshow.playPlayer(), 3500);
    },

    onBlockSelect({
      target
    }) {
      this.slideshow && this.slideshow.pausePlayer();
      this.slideshow && this.slideshow.select(target.dataset.index);
    },

    onBlockDeselect() {
      this.slideshow && this.slideshow.unpausePlayer();
    },

    onUnload() {
      this.slideshow && this.slideshow.destroy();
      this.listeners.forEach(l => l());
    }

  });

  const selectors$n = {
    slider: '[data-slider]',
    prev: '[data-prev]',
    next: '[data-next]'
  };
  var Carousel = ((node, opts = {}) => {
    const sliderElement = n$1(selectors$n.slider, node);
    const previousButton = n$1(selectors$n.prev, node);
    const nextButton = n$1(selectors$n.next, node);
    const defaultOpts = {
      adaptiveHeight: !window.matchMedia('(min-width: 45em)').matches,
      cellAlign: 'left',
      cellSelector: '[data-slide]',
      pageDots: false,
      prevNextButtons: false,
      contain: true,
      imagesLoaded: true,
      pauseAutoPlayOnHover: !window.Shopify.designMode,
      on: {
        ready: function () {
          _updateNavigationPosition();
        }
      }
    };
    const config = Object.assign({}, defaultOpts, opts);

    if (!config.wrapAround) {
      previousButton.disabled = true;
    }

    const _updateNavigationPosition = () => {
      const firstImage = n$1('.image__img, .placeholder-image', node);
      const firstImageHeight = firstImage.clientHeight;
      const buttonHeight = nextButton.clientHeight;
      const offset = firstImageHeight / 2 - buttonHeight / 2;
      nextButton.style.top = `${offset}px`;
      previousButton.style.top = `${offset}px`;
      i(nextButton, 'hidden');
      i(previousButton, 'hidden');
    };

    Promise.resolve().then(function () { return index; }).then(({
      default: Flickity
    }) => {
      const slider = new Flickity(sliderElement, config);

      if (!config.wrapAround) {
        slider.on('scroll', progress => {
          const progressScale = progress * 100; // https://github.com/metafizzy/flickity/issues/289

          previousButton.disabled = progressScale < 1;
          nextButton.disabled = progressScale > 99;
        });
      } // Account for page-transition links that can fire on flickity drag


      slider.on('dragStart', () => slider.slider.childNodes.forEach(slide => t$3('a[href]', slide).forEach(element => u(element, 'no-transition'))));
      slider.on('dragEnd', () => setTimeout(() => {
        slider.slider.childNodes.forEach(slide => t$3('a[href]', slide).forEach(element => i(element, 'no-transition')));
      }, 100));
      const prevClick = e$2(previousButton, 'click', () => slider.previous());
      const nextClick = e$2(nextButton, 'click', () => slider.next());
      return {
        destroy: () => {
          if ((slider.slides || {}).length > 1) {
            prevClick();
            nextClick();
          }

          slider.destroy();
        },
        select: index => slider.select(index)
      };
    });
  });

  register('featured-collection', {
    onLoad() {
      const carouselWraps = this.container.dataset.carouselWraps === 'true';
      this.carousel = Carousel(this.container, {
        wrapAround: carouselWraps
      });
    },

    onUnload() {
      this.carousel.destroy();
    }

  });

  register('featured-collection-row', {
    onLoad() {
      this.carousel = Carousel(this.container, {
        wrapAround: false,
        adaptiveHeight: false
      }); // Advance the slider due to inline text being hidden

      if (!window.matchMedia('(min-width: 45em)').matches) {
        this.carousel.select(1);
      }
    },

    onUnload() {
      this.carousel && this.carousel.destroy();
    }

  });

  /**
   * Returns a product JSON object when passed a product URL
   * @param {*} url
   */

  /**
   * Find a match in the project JSON (using a ID number) and return the variant (as an Object)
   * @param {Object} product Product JSON object
   * @param {Number} value Accepts Number (e.g. 6908023078973)
   * @returns {Object} The variant object once a match has been successful. Otherwise null will be return
   */
  function getVariantFromId(product, value) {
    _validateProductStructure(product);

    if (typeof value !== 'number') {
      throw new TypeError(value + ' is not a Number.');
    }

    var result = product.variants.filter(function(variant) {
      return variant.id === value;
    });

    return result[0] || null;
  }

  /**
   * Convert the Object (with 'name' and 'value' keys) into an Array of values, then find a match & return the variant (as an Object)
   * @param {Object} product Product JSON object
   * @param {Object} collection Object with 'name' and 'value' keys (e.g. [{ name: "Size", value: "36" }, { name: "Color", value: "Black" }])
   * @returns {Object || null} The variant object once a match has been successful. Otherwise null will be returned
   */
  function getVariantFromSerializedArray(product, collection) {
    _validateProductStructure(product);

    // If value is an array of options
    var optionArray = _createOptionArrayFromOptionCollection(product, collection);
    return getVariantFromOptionArray(product, optionArray);
  }

  /**
   * Find a match in the project JSON (using Array with option values) and return the variant (as an Object)
   * @param {Object} product Product JSON object
   * @param {Array} options List of submitted values (e.g. ['36', 'Black'])
   * @returns {Object || null} The variant object once a match has been successful. Otherwise null will be returned
   */
  function getVariantFromOptionArray(product, options) {
    _validateProductStructure(product);
    _validateOptionsArray(options);

    var result = product.variants.filter(function(variant) {
      return options.every(function(option, index) {
        return variant.options[index] === option;
      });
    });

    return result[0] || null;
  }

  /**
   * Creates an array of selected options from the object
   * Loops through the project.options and check if the "option name" exist (product.options.name) and matches the target
   * @param {Object} product Product JSON object
   * @param {Array} collection Array of object (e.g. [{ name: "Size", value: "36" }, { name: "Color", value: "Black" }])
   * @returns {Array} The result of the matched values. (e.g. ['36', 'Black'])
   */
  function _createOptionArrayFromOptionCollection(product, collection) {
    _validateProductStructure(product);
    _validateSerializedArray(collection);

    var optionArray = [];

    collection.forEach(function(option) {
      for (var i = 0; i < product.options.length; i++) {
        if (product.options[i].name.toLowerCase() === option.name.toLowerCase()) {
          optionArray[i] = option.value;
          break;
        }
      }
    });

    return optionArray;
  }

  /**
   * Check if the product data is a valid JS object
   * Error will be thrown if type is invalid
   * @param {object} product Product JSON object
   */
  function _validateProductStructure(product) {
    if (typeof product !== 'object') {
      throw new TypeError(product + ' is not an object.');
    }

    if (Object.keys(product).length === 0 && product.constructor === Object) {
      throw new Error(product + ' is empty.');
    }
  }

  /**
   * Validate the structure of the array
   * It must be formatted like jQuery's serializeArray()
   * @param {Array} collection Array of object [{ name: "Size", value: "36" }, { name: "Color", value: "Black" }]
   */
  function _validateSerializedArray(collection) {
    if (!Array.isArray(collection)) {
      throw new TypeError(collection + ' is not an array.');
    }

    if (collection.length === 0) {
      return [];
    }

    if (collection[0].hasOwnProperty('name')) {
      if (typeof collection[0].name !== 'string') {
        throw new TypeError(
          'Invalid value type passed for name of option ' +
            collection[0].name +
            '. Value should be string.'
        );
      }
    } else {
      throw new Error(collection[0] + 'does not contain name key.');
    }
  }

  /**
   * Validate the structure of the array
   * It must be formatted as list of values
   * @param {Array} collection Array of object (e.g. ['36', 'Black'])
   */
  function _validateOptionsArray(options) {
    if (Array.isArray(options) && typeof options[0] === 'object') {
      throw new Error(options + 'is not a valid array of options.');
    }
  }

  const selectors$m = {
    close: '[data-close]',
    slider: '[data-slider]',
    slide: '[data-slide]',
    imageById: id => `[data-id='${id}']`,
    navItem: '[data-nav-item]',
    wrapper: '.lightbox__images-wrapper',
    prevButton: '[data-prev]',
    nextButton: '[data-next]'
  };
  const classes$6 = {
    visible: 'visible',
    active: 'active',
    zoom: 'zoom'
  };
  function Lightbox(node) {
    if (!node) return;
    const trap = createFocusTrap(node);
    const navItems = t$3(selectors$m.navItem, node);
    const wrapper = n$1(selectors$m.wrapper, node);
    const images = t$3(selectors$m.slide, node);
    const previousButton = n$1(selectors$m.prevButton, node);
    const nextButton = n$1(selectors$m.nextButton, node);
    const sliderContainer = n$1(selectors$m.slider, node);
    let events, slider;
    Promise.resolve().then(function () { return index; }).then(({
      default: Flickity
    }) => {
      slider = new Flickity(sliderContainer, {
        adaptiveHeight: true,
        draggable: isMobile$1({
          tablet: true,
          featureDetect: true
        }),
        prevNextButtons: false,
        wrapAround: false,
        pageDots: false
      });

      if (images.length > 1) {
        slider.on('scroll', progress => {
          _resetZoom();

          const progressScale = progress * 100; // https://github.com/metafizzy/flickity/issues/289

          previousButton.disabled = progressScale < 1;
          nextButton.disabled = progressScale > 99;
        });
        slider.on('select', () => {
          navItems.forEach(item => i(item, classes$6.active));
          u(navItems[slider.selectedIndex], classes$6.active);
          navItems[slider.selectedIndex].scrollIntoView({
            behavior: 'smooth',
            inline: 'nearest'
          });
        });
      } else {
        u(previousButton, 'hidden');
        u(nextButton, 'hidden');
        previousButton.disabled = true;
        nextButton.disabled = true;
      }

      events = [e$2(n$1(selectors$m.close, node), 'click', e => {
        e.preventDefault();
        close();
      }), e$2(node, 'keydown', ({
        keyCode
      }) => {
        if (keyCode === 27) close();
      }), e$2(navItems, 'click', e => {
        e.preventDefault();
        const {
          index
        } = e.currentTarget.dataset;
        slider.select(index);
      }), e$2(images, 'click', e => {
        e.preventDefault();

        _handleZoom(e);
      }), e$2(previousButton, 'click', () => slider.previous()), e$2(nextButton, 'click', () => slider.next())];
    });

    function _handleZoom(event) {
      const image = event.currentTarget;
      const zoomed = image.classList.contains(classes$6.zoom);
      l(image, classes$6.zoom, !zoomed);

      if (zoomed) {
        _resetZoom(image);

        return;
      }

      const x = event.clientX;
      const y = event.clientY + wrapper.scrollTop - sliderContainer.offsetTop;
      const xDelta = (x - image.clientWidth / 2) * -1;
      const yDelta = (y - image.clientHeight / 2) * -1;
      image.style.transform = `translate3d(${xDelta}px, ${yDelta}px, 0) scale(2)`;
    }

    function _resetZoom(image) {
      if (image) {
        i(image, classes$6.zoom);
        image.style.transform = `translate3d(0px, 0px, 0) scale(1)`;
        return;
      }

      images.forEach(image => {
        i(image, classes$6.zoom);
        image.style.transform = `translate3d(0px, 0px, 0) scale(1)`;
      });
    }

    function open(id) {
      u(node, classes$6.active);
      setTimeout(() => {
        u(node, classes$6.visible);
        disableBodyScroll(node, {
          allowTouchMove: el => {
            while (el && el !== document.body) {
              if (el.getAttribute('data-scroll-lock-ignore') !== null) {
                return true;
              }

              el = el.parentNode;
            }
          },
          reserveScrollBarGap: true
        });
        trap.activate();
        const image = n$1(selectors$m.imageById(id), node);
        const {
          slideIndex
        } = image.dataset;
        slider && slider.select(slideIndex, false, true);
      }, 50);
    }

    function close() {
      _resetZoom();

      i(node, classes$6.visible);
      setTimeout(() => {
        i(node, classes$6.active);
        enableBodyScroll(node);
        trap.deactivate();
      }, 300);
    }

    function destroy() {
      events.forEach(unsubscribe => unsubscribe());
      slider && slider.destroy();
    }

    return {
      destroy,
      open
    };
  }

  function Media(node) {
    if (!node) return;
    const {
      Shopify,
      YT
    } = window;
    const elements = t$3('[data-interactive]', node);
    if (!elements.length) return;
    const acceptedTypes = ['video', 'model', 'external_video'];
    let activeMedia = null;
    let featuresLoaded = false;
    let instances = {};

    if (featuresLoaded) {
      elements.forEach(initElement);
    }

    window.Shopify.loadFeatures([{
      name: 'model-viewer-ui',
      version: '1.0'
    }, {
      name: 'shopify-xr',
      version: '1.0'
    }, {
      name: 'video-ui',
      version: '1.0'
    }], () => {
      featuresLoaded = true;

      if ('YT' in window && Boolean(YT.loaded)) {
        elements.forEach(initElement);
      } else {
        window.onYouTubeIframeAPIReady = function () {
          elements.forEach(initElement);
        };
      }
    });

    function initElement(el) {
      const {
        mediaId,
        mediaType
      } = el.dataset;
      if (!mediaType || !acceptedTypes.includes(mediaType)) return;
      if (Object.keys(instances).includes(mediaId)) return;
      let instance = {
        id: mediaId,
        type: mediaType,
        container: el,
        media: el.children[0]
      };

      switch (instance.type) {
        case 'video':
          instance.player = new Shopify.Plyr(instance.media, {
            loop: {
              active: el.dataset.loop == 'true'
            }
          });
          break;

        case 'external_video':
          instance.player = new YT.Player(instance.media);
          break;

        case 'model':
          instance.viewer = new Shopify.ModelViewerUI(n$1('model-viewer', el));
          e$2(n$1('.model-poster', el), 'click', e => {
            e.preventDefault();
            playModel(instance);
          });
          break;
      }

      instances[mediaId] = instance;

      if (instance.player) {
        if (instance.type === 'video') {
          instance.player.on('playing', () => {
            pauseActiveMedia(instance);
            activeMedia = instance;
          });
        } else if (instance.type === 'external_video') {
          instance.player.addEventListener('onStateChange', event => {
            if (event.data === 1) {
              pauseActiveMedia(instance);
              activeMedia = instance;
            }
          });
        }
      }
    }

    function playModel(instance) {
      pauseActiveMedia(instance);
      instance.viewer.play();
      u(instance.container, 'model-active');
      activeMedia = instance;
      setTimeout(() => {
        n$1('model-viewer', instance.container).focus();
      }, 300);
    }

    function pauseActiveMedia(instance) {
      if (!activeMedia || instance == activeMedia) return;

      if (activeMedia.player) {
        if (activeMedia.type === 'video') {
          activeMedia.player.pause();
        } else if (activeMedia.type === 'external_video') {
          activeMedia.player.pauseVideo();
        }

        activeMedia = null;
        return;
      }

      if (activeMedia.viewer) {
        i(activeMedia.container, 'model-active');
        activeMedia.viewer.pause();
        activeMedia = null;
      }
    }

    return {
      pauseActiveMedia
    };
  }

  const selectors$l = {
    idInput: '[name="id"]',
    optionInput: '[name^="options"]',
    quantityInput: '[data-quantity-input]',
    formQuantity: '[name="quantity"]',
    propertyInput: '[name^="properties"]'
  };
  function ProductForm(container, form, prod, config = {}) {
    const product = validateProductObject(prod);
    const listeners = [];

    const getOptions = () => {
      return _serializeOptionValues(optionInputs, function (item) {
        var regex = /(?:^(options\[))(.*?)(?:\])/;
        item.name = regex.exec(item.name)[2]; // Use just the value between 'options[' and ']'

        return item;
      });
    };

    const getVariant = () => {
      return getVariantFromSerializedArray(product, getOptions());
    };

    const getProperties = () => {
      const properties = _serializePropertyValues(propertyInputs, function (propertyName) {
        var regex = /(?:^(properties\[))(.*?)(?:\])/;
        var name = regex.exec(propertyName)[2]; // Use just the value between 'properties[' and ']'

        return name;
      });

      return Object.entries(properties).length === 0 ? null : properties;
    };

    const getQuantity = () => {
      return formQuantityInput[0] ? Number.parseInt(formQuantityInput[0].value, 10) : 1;
    };

    const getProductFormEventData = () => ({
      options: getOptions(),
      variant: getVariant(),
      properties: getProperties(),
      quantity: getQuantity()
    });

    const onFormEvent = cb => {
      if (typeof cb === 'undefined') return;
      return event => {
        event.dataset = getProductFormEventData();
        cb(event);
      };
    };

    const setIdInputValue = value => {
      let idInputElement = form.querySelector(selectors$l.idInput);

      if (!idInputElement) {
        idInputElement = document.createElement('input');
        idInputElement.type = 'hidden';
        idInputElement.name = 'id';
        form.appendChild(idInputElement);
      }

      idInputElement.value = value.toString();
    };

    const onSubmit = event => {
      event.dataset = getProductFormEventData();
      setIdInputValue(event.dataset.variant.id);

      if (config.onFormSubmit) {
        config.onFormSubmit(event);
      }
    };

    const initInputs = (selector, cb) => {
      const elements = [...container.querySelectorAll(selector)];
      return elements.map(element => {
        listeners.push(e$2(element, 'change', onFormEvent(cb)));
        return element;
      });
    };

    listeners.push(e$2(form, 'submit', onSubmit));
    const optionInputs = initInputs(selectors$l.optionInput, config.onOptionChange);
    initInputs(selectors$l.quantityInput, config.onQuantityChange);
    const formQuantityInput = initInputs(selectors$l.quantityInput, config.onQuantityChange);
    const propertyInputs = initInputs(selectors$l.propertyInput, config.onPropertyChange);

    const destroy = () => {
      listeners.forEach(unsubscribe => unsubscribe());
    };

    return {
      getVariant,
      destroy
    };
  }

  function validateProductObject(product) {
    if (typeof product !== 'object') {
      throw new TypeError(product + ' is not an object.');
    }

    if (typeof product.variants[0].options === 'undefined') {
      throw new TypeError('Product object is invalid. Make sure you use the product object that is output from {{ product | json }} or from the http://[your-product-url].js route');
    }

    return product;
  }

  function _serializeOptionValues(inputs, transform) {
    return inputs.reduce(function (options, input) {
      if (input.checked || // If input is a checked (means type radio or checkbox)
      input.type !== 'radio' && input.type !== 'checkbox' // Or if its any other type of input
      ) {
          options.push(transform({
            name: input.name,
            value: input.value
          }));
        }

      return options;
    }, []);
  }

  function _serializePropertyValues(inputs, transform) {
    return inputs.reduce(function (properties, input) {
      if (input.checked || // If input is a checked (means type radio or checkbox)
      input.type !== 'radio' && input.type !== 'checkbox' // Or if its any other type of input
      ) {
          properties[transform(input.name)] = input.value;
        }

      return properties;
    }, {});
  }

  function quantityInput (container) {
    const quantityWrapper = n$1('.product__quantity', container);
    if (!quantityWrapper) return;
    const quantityInput = n$1('[data-quantity-input]', quantityWrapper);
    const addQuantity = n$1('[data-add-quantity]', quantityWrapper);
    const subtractQuanity = n$1('[data-subtract-quantity]', quantityWrapper);

    const handleAddQuantity = () => {
      const currentValue = parseInt(quantityInput.value);
      const newValue = currentValue + 1;
      quantityInput.value = newValue;
      quantityInput.dispatchEvent(new Event('change'));
    };

    const handleSubtractQuantity = () => {
      const currentValue = parseInt(quantityInput.value);
      if (currentValue === 1) return;
      const newValue = currentValue - 1;
      quantityInput.value = newValue;
      quantityInput.dispatchEvent(new Event('change'));
    };

    const events = [e$2(addQuantity, 'click', handleAddQuantity), e$2(subtractQuanity, 'click', handleSubtractQuantity)];

    const unload = () => {
      events.forEach(unsubscribe => unsubscribe());
    };

    return {
      unload
    };
  }

  const selectors$k = {
    variantPopupTrigger: '[data-variant-popup-trigger]'
  };

  const variantPopup = node => {
    const delegate = new Delegate(node);

    const _variantPopupHandler = e => {
      e.preventDefault();
      const {
        modalContentId
      } = e.target.dataset;
      const content = n$1(`#${modalContentId}`, node);
      r$2('modal:open', null, {
        modalContent: content
      });
    };

    const unload = () => {
      delegate.destroy();
    };

    delegate.on('click', selectors$k.variantPopupTrigger, _variantPopupHandler);
    return {
      unload
    };
  };

  const {
    strings: {
      products: strings$3
    }
  } = window.theme;
  const selectors$j = {
    price: '[data-price]',
    comparePrice: '[data-compare-price]'
  };
  function updatePrices (container, variant) {
    const price = t$3(selectors$j.price, container);
    const comparePrice = t$3(selectors$j.comparePrice, container);
    const unavailableString = strings$3.product.unavailable;

    if (!variant) {
      price.forEach(el => el.innerHTML = unavailableString);
      comparePrice.forEach(el => el.innerHTML = '');
      return;
    }

    price.forEach(el => el.innerHTML = formatMoney(variant.price));
    comparePrice.forEach(el => el.innerHTML = variant.compare_at_price > variant.price ? formatMoney(variant.compare_at_price) : '');
  }

  const selectors$i = {
    productSku: '[data-product-sku]'
  };
  const {
    strings: {
      products: strings$2
    }
  } = window.theme;
  function updateSku (container, variant) {
    const skuElement = n$1(selectors$i.productSku, container);
    if (!skuElement) return;
    const {
      sku
    } = strings$2.product;

    const skuString = value => `${sku}: ${value}`;

    if (!variant || !variant.sku) {
      skuElement.innerText = '';
      return;
    }

    skuElement.innerText = skuString(variant.sku);
  }

  function updateBuyButton (btn, variant) {
    const text = n$1('[data-add-to-cart-text]', btn);
    const {
      langAvailable,
      langUnavailable,
      langSoldOut
    } = btn.dataset;

    if (!variant) {
      btn.setAttribute('disabled', 'disabled');
      text.textContent = langUnavailable;
    } else if (variant.available) {
      btn.removeAttribute('disabled');
      text.textContent = langAvailable;
    } else {
      btn.setAttribute('disabled', 'disabled');
      text.textContent = langSoldOut;
    }
  }

  const storage = {
    get: () => e('quick_purchase_bar'),
    set: val => r$1('quick_purchase_bar', val)
  };
  const selectors$h = {
    productBar: '[data-quick-purchase-bar]',
    purchaseButton: '[data-quick-purchase-button]',
    hideButton: '[data-mobile-hide]',
    productForm: '.product-form',
    productTop: '.product__top',
    productImage: '.quick-purchase-bar__product-image',
    barQuantity: '[data-bar-quantity]',
    barProductTitle: '[data-bar-product-title]'
  };
  const classes$5 = {
    active: 'active',
    loading: 'loading',
    hidden: 'is-hidden'
  };
  function quickPurchaseBar (container, variant) {
    const productForm = n$1(selectors$h.productForm, container);
    const productBar = n$1(selectors$h.productBar, container);
    const purchaseButton = n$1(selectors$h.purchaseButton, container);
    const hideButton = n$1(selectors$h.hideButton, container);
    const productImage = n$1(selectors$h.productImage, container);
    const barQuantity = n$1(selectors$h.barQuantity, container);
    const barProductTitle = n$1(selectors$h.barProductTitle, container);
    const productQuantity = n$1('input[name="quantity"]', container);
    const variantSelector = n$1('#variant-selector', container);
    barQuantity.innerHTML = `x ${parseInt(productQuantity.value, 10)}`;
    barProductTitle.innerHTML = variant.name;
    let observer = null;
    setOffset();

    if (storage.get()) {
      u(productBar, classes$5.hidden);
    } // Preload the quick buy button with currently selected variant


    preloadBuyButton(variantSelector.value, productQuantity.value);
    const events = [e$2(purchaseButton, 'click', e => {
      e.preventDefault();
    }), e$2(hideButton, 'click', e => {
      setOffset();
      l(productBar, classes$5.hidden);
      storage.set(a$1(productBar, classes$5.hidden));
    })];

    if (window.matchMedia('(min-width: 60em)').matches) {
      _intObserver();
    } else {
      setTimeout(() => {
        u(productBar, classes$5.active);
      }, 1000);
    }

    function setOffset() {
      productBar.style.setProperty('--quick-purchase-offset', `${productBar.clientHeight - 20}px`);
    }

    function _intObserver() {
      observer = new IntersectionObserver(([{
        isIntersecting: visible
      }]) => {
        l(productBar, classes$5.active, !visible);
      });
      observer.observe(productForm);
    }

    function preloadBuyButton(variantId, quantity) {
      purchaseButton.href = `${window.theme.routes.cart.base}/${variantId}:${quantity}`;
    }

    function update(variant) {
      // if the variant is not available do not update to a sold out product
      if (!variant.available) return;
      preloadBuyButton(variant.id, productQuantity.value);
      updatePrices(productBar, variant);
      barQuantity.innerHTML = '';
      barProductTitle.innerHTML = '';
      barQuantity.innerHTML = `x ${parseInt(productQuantity.value, 10)}`;
      barProductTitle.innerHTML = variant.name;

      if (variant.featured_media) {
        const img = `<img class="image__img lazyload" data-src="${getSizedImageUrl(variant.featured_media.preview_image.src, '120x')}" />`;
        productImage.innerHTML = img;
      }
    }

    const unload = () => {
      observer && observer.disconnect();
      events.forEach(unsubscribe => unsubscribe());
    };

    return {
      update,
      unload
    };
  }

  const {
    strings: {
      product: strings$1
    }
  } = theme;
  const selectors$g = {
    sprForm: '.spr-form',
    newReviewButton: '.spr-summary-actions-newreview',
    submitButton: '.spr-button',
    modalContent: '.modal__content',
    summery: '.spr-summary',
    starRating: '.spr-starrating',
    shopifySection: '.shopify-section'
  };
  function reviewsHandler () {
    const sprForm = n$1(selectors$g.sprForm, document);
    const wrappingContainer = sprForm.closest(selectors$g.shopifySection);
    const newReviewButton = n$1(selectors$g.newReviewButton, document);
    const modalContent = n$1(selectors$g.modalContent, document);
    const reviewsCaption = n$1(selectors$g.summery, document);
    const headingStars = n$1(selectors$g.starRating, reviewsCaption); // If reviews don't exist add empty stars to heading

    if (!headingStars) {
      const emptyStars = `
      <span class="spr-starrating spr-summary-starrating">
        <i class="spr-icon spr-icon-star-empty"></i>
        <i class="spr-icon spr-icon-star-empty"></i>
        <i class="spr-icon spr-icon-star-empty"></i>
        <i class="spr-icon spr-icon-star-empty"></i>
        <i class="spr-icon spr-icon-star-empty"></i>
      </span>
    `;
      reviewsCaption.insertAdjacentHTML('afterbegin', emptyStars);
    } // Add wrapping section classes


    if (wrappingContainer.parentNode.classList.contains('main')) {
      u(wrappingContainer, 'shopify-section--stackable', 'shopify-section--contrast'); // If last section before footer add appropriate class

      if (!wrappingContainer.nextElementSibling) {
        u(wrappingContainer, 'shoping-section--contrast-before-footer');
      }
    }

    const formListener = c('spr-form:updated', handleFormUpdate);
    addNewButton();

    function handleFormUpdate() {
      const sprForm = n$1(selectors$g.sprForm, document);
      const clonedForm = sprForm.cloneNode(true);
      modalContent.innerHTML = '';
      modalContent.appendChild(clonedForm);
    }

    function addNewButton() {
      const button = document.createElement('button');
      u(button, 'spr-summary-actions-newreview', 'active');
      button.innerText = strings$1.review;
      newReviewButton.parentNode.insertBefore(button, newReviewButton);
      e$2(button, 'click', e => {
        e.preventDefault();
        r$2('modal:open', null, {
          modalContent: sprForm,
          narrow: true
        });
      });
    }

    const unload = () => {
      formListener();
    };

    return {
      unload
    };
  }

  const selectors$f = {
    badgeText: '.spr-badge-caption',
    reviewsSection: '.shopify-product-reviews-wrapper'
  };
  function badgeHandler () {
    const reviewsBadgeText = n$1(selectors$f.badgeText, document);
    const reviewsSection = n$1(selectors$f.reviewsSection, document);
    const button = document.createElement('button');
    button.classList.add('reviews__anchor-trigger');
    reviewsBadgeText.parentNode.insertBefore(button, reviewsBadgeText);
    button.appendChild(reviewsBadgeText);
    button.tabIndex = '0';
    e$2(button, 'click', e => {
      e.preventDefault();
      reviewsSection && reviewsSection.scrollIntoView({
        behavior: 'smooth'
      });
    });
  }

  function OptionButtons(els) {
    const groups = els.map(createOptionGroup);

    function destroy() {
      groups && groups.forEach(group => group());
    }

    return {
      groups,
      destroy
    };
  }

  function createOptionGroup(el) {
    const select = n$1('select', el);
    const buttons = t$3('[data-button]', el);
    const buttonClick = e$2(buttons, 'click', e => {
      e.preventDefault();
      const {
        button
      } = e.currentTarget.dataset;
      buttons.forEach(btn => l(btn, 'selected', btn.dataset.button === button));
      const opt = n$1(`[value="${button}"]`, select);
      opt.selected = true;
      select.dispatchEvent(new Event('change'));
    });
    return () => buttonClick();
  }

  const selectors$e = {
    counterContainer: '[data-inventory-counter]',
    inventoryMessage: '.inventory-counter__message',
    countdownBar: '.inventory-counter__bar',
    progressBar: '.inventory-counter__bar-progress'
  };
  const classes$4 = {
    active: 'active',
    inventoryLow: 'inventory--low'
  };

  const inventoryCounter = (container, config) => {
    const variantsInventories = config.variantsInventories;
    const counterContainer = n$1(selectors$e.counterContainer, container);
    const inventoryMessageElement = n$1(selectors$e.inventoryMessage, container);
    const progressBar = n$1(selectors$e.progressBar, container);
    const {
      lowInventoryThreshold,
      stockCountdownMax
    } = counterContainer.dataset; // If the threshold or countdownmax contains anything but numbers abort

    if (!lowInventoryThreshold.match(/^[0-9]+$/) || !stockCountdownMax.match(/^[0-9]+$/)) {
      return;
    }

    const threshold = parseInt(lowInventoryThreshold, 10);
    const countDownMax = parseInt(stockCountdownMax, 10);
    l(counterContainer, classes$4.active, productIventoryValid(variantsInventories[config.id]));
    checkThreshold(variantsInventories[config.id]);
    setProgressBar(variantsInventories[config.id].inventory_quantity);
    setInventoryMessage(variantsInventories[config.id].inventory_message);

    function checkThreshold({
      inventory_policy,
      inventory_quantity,
      inventory_management
    }) {
      i(counterContainer, classes$4.inventoryLow);

      if (inventory_management !== null && inventory_policy === 'deny') {
        if (inventory_quantity <= threshold) {
          u(counterContainer, classes$4.inventoryLow);
        }
      }
    }

    function setProgressBar(inventoryQuantity) {
      if (inventoryQuantity <= 0) {
        progressBar.style.width = `${0}%`;
        return;
      }

      const progressValue = inventoryQuantity < countDownMax ? inventoryQuantity / countDownMax * 100 : 100;
      progressBar.style.width = `${progressValue}%`;
    }

    function setInventoryMessage(message) {
      inventoryMessageElement.innerText = message;
    }

    function productIventoryValid(product) {
      return product.inventory_message && product.inventory_policy === 'deny';
    }

    const update = variant => {
      l(counterContainer, classes$4.active, variant && productIventoryValid(variantsInventories[variant.id]));
      if (!variant) return;
      checkThreshold(variantsInventories[variant.id]);
      setProgressBar(variantsInventories[variant.id].inventory_quantity);
      setInventoryMessage(variantsInventories[variant.id].inventory_message);
    };

    return {
      update
    };
  };

  const selectors$d = {
    drawerTrigger: '[data-store-availability-drawer-trigger]',
    drawer: '[data-store-availability-drawer]',
    productTitle: '[data-store-availability-product-title]',
    storeList: '[data-store-availability-list-content]'
  };

  const storeAvailability = (container, product, variant, options) => {
    let storeList = null;
    let currentVariant = variant;
    const delegate = new Delegate(container);

    const _clickHandler = e => {
      e.preventDefault();
      r$2('availability:showMore', () => ({
        product,
        variant: currentVariant,
        storeList,
        options
      }));
    };

    const update = variant => {
      currentVariant = variant;
      const variantSectionUrl = `${container.dataset.baseUrl}/variants/${variant.id}/?section_id=store-availability`;
      container.innerHTML = '';
      fetch(variantSectionUrl).then(response => {
        return response.text();
      }).then(storeAvailabilityHTML => {
        if (storeAvailabilityHTML.trim() === '') return; // Remove section wrapper that throws nested sections error

        container.innerHTML = storeAvailabilityHTML.trim();
        container.innerHTML = container.firstElementChild.innerHTML;
        storeList = n$1(selectors$d.storeList, container);
      });
    }; // Intialize


    update(variant);
    delegate.on('click', selectors$d.drawerTrigger, _clickHandler);

    const unload = () => {
      container.innerHTML = '';
    };

    return {
      unload,
      update
    };
  };

  const selectors$c = {
    form: '[data-product-form]',
    addToCart: '[data-add-to-cart]',
    variantSelect: '[data-variant-select]',
    optionById: id => `[value='${id}']`,
    thumb: '[data-product-thumbnail]',
    shippingEstimatorButton: '[data-estimator-trigger]',
    storeAvailability: '[data-store-availability-container]',
    quantityError: '[data-quantity-error]'
  };
  register('featured-product', {
    productForm: null,
    events: [],
    accordions: [],

    onLoad() {
      const {
        placeholder,
        productHasOnlyDefaultVariant
      } = this.container.dataset;
      if (placeholder === 'true') return;
      this.formElement = n$1(selectors$c.form, this.container);
      this.images = t$3('[data-open]', this.container);
      this.quantityError = n$1(selectors$c.quantityError, this.container);
      const viewInYourSpace = n$1('[data-in-your-space]', this.container);
      viewInYourSpace && l(viewInYourSpace, 'visible', isMobile$1()); // Handle Surface pickup

      this.storeAvailabilityContainer = n$1(selectors$c.storeAvailability, this.container);
      this.availability = null;

      if (this.formElement) {
        const {
          productHandle,
          currentProductId
        } = this.formElement.dataset;
        const product = getProduct(productHandle);
        product(data => {
          const variant = getVariantFromId(data, parseInt(currentProductId));

          if (this.storeAvailabilityContainer && variant) {
            this.availability = storeAvailability(this.storeAvailabilityContainer, data, variant, {
              hideVariantTitle: productHasOnlyDefaultVariant === 'true'
            });
          }

          this.productForm = ProductForm(this.container, this.formElement, data, {
            onOptionChange: e => this.onOptionChange(e),
            onFormSubmit: e => this.onFormSubmit(e),
            onQuantityChange: e => this.onQuantityChange(e)
          });
          const productInventoryJson = n$1('[data-product-inventory-json]', this.container);

          if (productInventoryJson) {
            const jsonData = JSON.parse(productInventoryJson.innerHTML);
            const variantsInventories = jsonData.inventory;

            if (variantsInventories) {
              const config = {
                id: variant.id,
                variantsInventories
              };
              this.inventoryCounter = inventoryCounter(this.container, config);
            }
          }
        });
      }

      const accordionElements = t$3('.accordion', this.container);
      accordionElements.forEach(accordion => {
        const accordionOpen = accordion.classList.contains('accordion--open');
        this.accordions.push(Accordions(accordion, {
          firstOpen: accordionOpen
        }));
        const accordionParent = accordion.parentElement;

        if (accordionParent.classList.contains('rte--product') && !accordionParent.classList.contains('accordion accordion--product')) {
          accordion.classList.add('rte--product', 'accordion--product');
        }
      });
      this.lightbox = Lightbox(n$1('[data-lightbox]', this.container));
      this.media = Media(n$1('.featured-product__media-container', this.container));
      this.optionButtons = OptionButtons(t$3('[data-option-buttons]', this.container));
      this.quantityInput = quantityInput(this.container);
      this.variantPopup = variantPopup(this.container);
      this.socialButtons = t$3('[data-social-share]', this.container);

      this._initEvents();
    },

    _initEvents() {
      this.events.push(e$2(this.images, 'click', e => {
        e.preventDefault();
        this.lightbox.open(e.currentTarget.dataset.open);
      }));
      this.events.push(e$2(this.socialButtons, 'click', e => {
        l(e.target, 'active');
        const sub = n$1('.article__share-icons', e.target);
        sub.setAttribute('aria-hidden', !contains(e.target, 'active'));
      }));
    },

    // When the user changes a product option
    onOptionChange({
      dataset: {
        variant
      }
    }) {
      const buyButton = n$1(selectors$c.addToCart, this.container); // Update prices to reflect selected variant

      updatePrices(this.container, variant); // Update buy button

      updateBuyButton(buyButton, variant); // Update unit pricing

      updateUnitPrices(this.container, variant); // Update sku

      updateSku(this.container, variant);
      this.inventoryCounter && this.inventoryCounter.update(variant);

      if (!variant) {
        updateBuyButton(n$1('[data-add-to-cart]', this.container), false);
        this.availability && this.availability.unload();
        return;
      } // We need to set the id input manually so the Dynamic Checkout Button works


      const selectedVariantOpt = n$1(`${selectors$c.variantSelect} ${selectors$c.optionById(variant.id)}`, this.container);
      selectedVariantOpt.selected = true; // We need to dispatch an event so Shopify pay knows the form has changed

      this.formElement.dispatchEvent(new Event('change')); // Move screen or mobile slider to selected variants media

      if (variant.featured_media) {
        switchImage(this.container, variant.featured_media.id);
      } // Update product availability content


      this.availability && this.availability.update(variant);
    },

    // When user submits the product form
    onFormSubmit(e) {
      const {
        enableCartAjax
      } = document.body.dataset; // If a featured product section is on the cart page we will need to refresh
      // the cart to show a product has been added.

      const cartPage = document.body.classList.contains('template-cart');
      if (!enableCartAjax || cartPage) return;
      e.preventDefault();
      u(this.quantityError, 'hidden');
      const button = n$1(selectors$c.addToCart, this.container);
      u(button, 'loading');
      cart.addItem(this.formElement).then(({
        item
      }) => {
        i(button, 'loading');
        r$2('cart:open', null, {
          flash: item.variant_id
        });
      }).catch(() => {
        i(this.quantityError, 'hidden');
        const button = n$1(selectors$c.addToCart, this.container);
        i(button, 'loading');
      });
    },

    // When user updates quantity
    onQuantityChange({
      dataset: {
        quantity
      }
    }) {
      // Adjust the hidden quantity input within the form
      const quantityInputs = [...t$3('[name="quantity"]', this.formElement)];
      quantityInputs.forEach(quantityInput => {
        quantityInput.value = quantity;
      });
    },

    onBlockSelect({
      target
    }) {
      const label = n$1('.accordion__label', target);
      target.scrollIntoView({
        block: 'center',
        behavior: 'smooth'
      });
      if (!label) return;
      const {
        parentNode: group,
        nextElementSibling: content
      } = label;
      slideStop(content);
      slideDown(content);
      group.setAttribute('data-open', true);
      label.setAttribute('aria-expanded', true);
      content.setAttribute('aria-hidden', false);
    },

    onBlockDeselect({
      target
    }) {
      const label = n$1('.accordion__label', target);
      if (!label) return;
      const {
        parentNode: group,
        nextElementSibling: content
      } = label;
      slideStop(content);
      slideUp(content);
      group.setAttribute('data-open', false);
      label.setAttribute('aria-expanded', false);
      content.setAttribute('aria-hidden', true);
    },

    onUnload() {
      this.productForm.destroy();
      this.lightbox.destroy();
      this.optionButtons.destroy();
      this.quantityInput.unload();
      this.events.forEach(unsubscribe => unsubscribe());
      this.accordions.forEach(accordion => accordion.unload());
    }

  });

  register('newsletter', {
    onLoad() {
      focusFormStatus(this.container);
    },

    onUnload() {}

  });

  const selectors$b = {
    recommendations: '[data-recommendations]',
    slider: '[data-slider]'
  };
  register('recommended-products', {
    onLoad() {
      const {
        limit,
        productId: id,
        sectionId
      } = this.container.dataset;
      const content = n$1(selectors$b.recommendations, this.container);
      if (!content) return;
      const requestUrl = `${window.theme.routes.productRecommendations}?section_id=${sectionId}&limit=${limit}&product_id=${id}`;
      const request = new XMLHttpRequest();
      request.open('GET', requestUrl, true);

      request.onload = () => {
        if (request.status >= 200 && request.status < 300) {
          let container = document.createElement('div');
          container.innerHTML = request.response; // Check if the response includes a product item
          // and if it doesn't remove the entire section

          const item = n$1('.product-item', container);

          if (!item) {
            this.container.parentNode.removeChild(this.container);
            return;
          }

          content.innerHTML = n$1(selectors$b.recommendations, container).innerHTML;
          const carousel = n$1(selectors$b.slider, content);
          const carouselWraps = carousel.dataset.carouselWraps === 'true';

          if (carousel) {
            this.carousel = Carousel(content, {
              wrapAround: carouselWraps
            });
          }
        } else {
          // If request returns any errors remove the section markup
          this.container.parentNode.removeChild(this.container);
        }
      };

      request.send();
    },

    onUnload() {
      this.carousel.destroy();
    }

  });

  const selectors$a = {
    dots: '.navigation-dot'
  };

  const navigationDots = (container, slider) => {
    const navigationDots = t$3(selectors$a.dots, container);
    const events = [];
    navigationDots.forEach(dot => {
      events.push(e$2(dot, 'click', e => _handlePageDot(e)));
    });

    const _handlePageDot = e => {
      e.preventDefault();
      if (e.target.classList.contains('is-selected')) return;
      const {
        slideIndex
      } = e.target.dataset;
      slider.select(slideIndex);
      slider.pausePlayer();
    };

    const update = cellIndex => {
      const activeClass = 'is-selected';
      navigationDots.forEach(dot => i(dot, activeClass));
      u(navigationDots[cellIndex], activeClass);
    };

    const unload = () => {
      events.forEach(unsubscribe => unsubscribe());
    };

    return {
      update,
      unload
    };
  };

  const selectors$9 = {
    slider: '[data-slider]',
    slide: '.slideshow__cell',
    video: '.slideshow__video'
  };
  register('slideshow', {
    events: [],
    slideshow: null,
    dotNavigation: null,

    onLoad() {
      const slider = n$1(selectors$9.slider, this.container);
      const slides = t$3(selectors$9.slide, this.container);
      const {
        autoplay
      } = slider.dataset;
      Promise.resolve().then(function () { return anime_es; }); // load this before we need it 

      i(slider, 'is-hidden'); // trigger redraw for transition

      slider.offsetHeight; // Animate the first slide only when it is scrolled into view

      const observer = new IntersectionObserver(([{
        intersectionRatio: visible
      }]) => {
        if (visible) {
          this._animateSlide(slides[0]);

          this._unpause();

          observer.disconnect();
        }
      });

      if (slides.length > 1) {
        Promise.resolve().then(function () { return index; }).then(({
          default: Flickity
        }) => {
          this.slideshow = new Flickity(slider, {
            adaptiveHeight: true,
            autoPlay: Number(autoplay),
            draggable: true,
            prevNextButtons: false,
            wrapAround: true,
            pageDots: false,
            dragThreshold: 5,
            pauseAutoPlayOnHover: !window.Shopify.designMode,
            on: {
              ready: () => {
                observer.observe(this.container);
              }
            }
          }); // Pause player from playing while offscreen allowing text animation
          // when player intersects

          this._pause();

          this.dotNavigation = navigationDots(this.container, this.slideshow);
          this.slideshow.on('change', index => {
            const activeSlide = this.slideshow.cells[index].element;

            this._animateSlide(activeSlide);

            this.dotNavigation && this.dotNavigation.update(index);
          });
          slides.forEach(slide => {
            const videoWrapper = slide.querySelector(selectors$9.video);

            if (videoWrapper) {
              events.push(backgroundVideoHandler(slide));
            }
          });
        });
      } else if (slides.length) {
        u(slides[0], 'is-selected');

        this._animateSlide(slides[0]);
      }
    },

    _pause() {
      this.slideshow && this.slideshow.pausePlayer();
    },

    _unpause() {
      this.slideshow && this.slideshow.unpausePlayer();
    },

    _animateSlide(target) {
      Promise.resolve().then(function () { return anime_es; }).then(({
        default: anime
      }) => {
        anime({
          targets: t$3('.animate', target),
          easing: 'easeOutQuart',
          translateY: [{
            value: 40,
            duration: 0
          }, {
            value: 0,
            duration: 500
          }],
          opacity: [{
            value: 0,
            duration: 0
          }, {
            value: 1,
            duration: 500
          }],
          delay: anime.stagger(150, {
            start: 800
          })
        });
      });
    },

    onBlockSelect({
      target
    }) {
      this.slideshow && this.slideshow.select(target.dataset.index);

      this._pause();
    },

    onBlockDeselect() {
      this._unpause();
    },

    onUnload() {
      this.slideshow && this.slideshow.destroy();
      this.events.forEach(unsubscribe => unsubscribe());
      this.dotNavigation && this.dotNavigation.unload();
    }

  });

  const selectors$8 = {
    inner: '.video__inner',
    player: '[data-video-player]',
    button: '[data-play-button]',
    overlay: '[data-overlay]',
    image: '.video__image',
    iframe: 'iframe',
    videoWrapper: '.video__wrapper'
  };
  const classes$3 = {
    visible: 'visible'
  };
  register('video', {
    events: [],

    onLoad() {
      Promise.resolve().then(function () { return fluorescentVideo_es$1; }).then(({
        default: Video
      }) => {
        const videoWrapper = n$1(selectors$8.videoWrapper, this.container);
        const {
          videoId,
          videoType
        } = videoWrapper.dataset;
        if (!videoId || !videoType) return;
        const player = n$1(selectors$8.player, this.container);
        const button = n$1(selectors$8.button, this.container);
        const overlay = n$1(selectors$8.overlay, this.container);
        const image = n$1(selectors$8.image, this.container);
        const video = Video(this.container, {
          id: videoId,
          type: videoType,
          playerEl: player
        });
        video.on('play', () => {
          const iframe = n$1(selectors$8.iframe, this.container);
          iframe.taxindex = 0;
          iframe.focus();
          i(overlay, classes$3.visible);
          image && i(image, classes$3.visible);
        });
        this.events.push(e$2(button, 'click', () => {
          video.play();
        }));
      });
    },

    onUnload() {
      this.events.forEach(unsubscribe => unsubscribe());
    }

  });

  const autoPlay = videos => {
    if (!videos.length) return;
    const events = [e$2(window, 'click', () => _handleAutoPlay()), e$2(window, 'touchstart', () => _handleAutoPlay())]; // Force autoplay after device interaction if in low power mode

    function _handleAutoPlay() {
      videos.forEach(video => {
        if (!video.playing) {
          video.play();
        }
      });
      events.forEach(unsubscribe => unsubscribe());
    }
  };

  const selectors$7 = {
    video: '.video-hero__video'
  };
  register('video-hero', {
    videoHandler: null,

    onLoad() {
      Promise.resolve().then(function () { return anime_es; }).then(({
        default: anime
      }) => {
        const video = t$3(selectors$7.video, this.container);

        if (video.length) {
          this.videoHandler = backgroundVideoHandler(this.container);
          autoPlay(video);
        } // Animate the first slide only when it is scrolled into view


        const observer = new IntersectionObserver(([{
          intersectionRatio: visible
        }]) => {
          if (visible) {
            anime({
              targets: t$3('.animate', this.container),
              easing: 'easeOutQuart',
              translateY: [{
                value: 40,
                duration: 0
              }, {
                value: 0,
                duration: 500
              }],
              opacity: [{
                value: 0,
                duration: 0
              }, {
                value: 1,
                duration: 500
              }],
              delay: anime.stagger(150, {
                start: 800
              })
            });
            observer.disconnect();
          }
        });
        observer.observe(this.container);
      });
    },

    onUnload() {
      this.videoHandler && this.videoHandler();
    }

  });

  const selectors$6 = {
    question: '.questions__accordion-label'
  };
  register('questions', {
    onLoad() {
      this.questions = t$3(selectors$6.question, this.container);
      this.clickHandlers = e$2(this.questions, 'click', e => {
        e.preventDefault();
        const {
          parentNode: group,
          nextElementSibling: content
        } = e.currentTarget;

        if (isVisible(content)) {
          this._close(e.currentTarget, group, content);
        } else {
          this._open(e.currentTarget, group, content);
        }
      });
    },

    _open(label, group, content) {
      slideStop(content);
      slideDown(content);
      group.setAttribute('data-open', true);
      label.setAttribute('aria-expanded', true);
      content.setAttribute('aria-hidden', false);
    },

    _close(label, group, content) {
      slideStop(content);
      slideUp(content);
      group.setAttribute('data-open', false);
      label.setAttribute('aria-expanded', false);
      content.setAttribute('aria-hidden', true);
    },

    onBlockSelect({
      target
    }) {
      const label = n$1(selectors$6.question, target);
      const {
        parentNode: group,
        nextElementSibling: content
      } = label;

      this._open(label, group, content);
    },

    onUnload() {
      this.clickHandlers();
    }

  });

  register('social-proof', {
    onLoad() {
      const carouselWraps = this.container.dataset.carouselWraps === 'true';
      this.carousel = Carousel(this.container, {
        wrapAround: carouselWraps,
        adaptiveHeight: false
      });
    },

    onUnload() {
      this.carousel.destroy();
    },

    onBlockSelect({
      target: item
    }) {
      this.carousel.select(item.dataset.index);
    }

  });

  const selectors$5 = {
    slider: '[data-slider]',
    slide: '[data-slide]'
  };
  register('quote', {
    onLoad() {
      const sliderContainer = n$1(selectors$5.slider, this.container);
      const slides = t$3(selectors$5.slide, this.container);
      Promise.resolve().then(function () { return index; }).then(({
        default: Flickity
      }) => {
        this.slider = new Flickity(sliderContainer, {
          prevNextButtons: false,
          adaptiveHeight: false,
          wrapAround: true,
          pageDots: false,
          cellAlign: 'center',
          draggable: false,
          pauseAutoPlayOnHover: false,
          autoPlay: parseInt(sliderContainer.dataset.timer)
        });
        let dotNavigation = null;
        setTimeout(() => {
          this.slider.resize();
        }, 250);

        if (slides.length > 1) {
          dotNavigation = navigationDots(this.container, this.slider);
          this.slider.on('select', () => {
            dotNavigation.update(this.slider.selectedIndex);
          });
        }
      });
    },

    onBlockSelect({
      target: slide
    }) {
      this.slider.select(slide.dataset.index);
      this.slider.pausePlayer();
    },

    onBlockDeselect() {
      this.slider.unpausePlayer();
    },

    onUnload() {
      this.slider.destroy();
      this.dotNavigation && this.dotNavigation.unload();
    }

  });

  // do not edit .js files directly - edit src/index.jst



  var fastDeepEqual = function equal(a, b) {
    if (a === b) return true;

    if (a && b && typeof a == 'object' && typeof b == 'object') {
      if (a.constructor !== b.constructor) return false;

      var length, i, keys;
      if (Array.isArray(a)) {
        length = a.length;
        if (length != b.length) return false;
        for (i = length; i-- !== 0;)
          if (!equal(a[i], b[i])) return false;
        return true;
      }



      if (a.constructor === RegExp) return a.source === b.source && a.flags === b.flags;
      if (a.valueOf !== Object.prototype.valueOf) return a.valueOf() === b.valueOf();
      if (a.toString !== Object.prototype.toString) return a.toString() === b.toString();

      keys = Object.keys(a);
      length = keys.length;
      if (length !== Object.keys(b).length) return false;

      for (i = length; i-- !== 0;)
        if (!Object.prototype.hasOwnProperty.call(b, keys[i])) return false;

      for (i = length; i-- !== 0;) {
        var key = keys[i];

        if (!equal(a[key], b[key])) return false;
      }

      return true;
    }

    // true if both NaN, false otherwise
    return a!==a && b!==b;
  };

  /**
   * Copyright 2019 Google LLC. All Rights Reserved.
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at.
   *
   *      Http://www.apache.org/licenses/LICENSE-2.0.
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */
  const DEFAULT_ID = "__googleMapsScriptId";
  /**
   * [[Loader]] makes it easier to add Google Maps JavaScript API to your application
   * dynamically using
   * [Promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise).
   * It works by dynamically creating and appending a script node to the the
   * document head and wrapping the callback function so as to return a promise.
   *
   * ```
   * const loader = new Loader({
   *   apiKey: "",
   *   version: "weekly",
   *   libraries: ["places"]
   * });
   *
   * loader.load().then((google) => {
   *   const map = new google.maps.Map(...)
   * })
   * ```
   */
  class Loader {
      /**
       * Creates an instance of Loader using [[LoaderOptions]]. No defaults are set
       * using this library, instead the defaults are set by the Google Maps
       * JavaScript API server.
       *
       * ```
       * const loader = Loader({apiKey, version: 'weekly', libraries: ['places']});
       * ```
       */
      constructor({ apiKey, channel, client, id = DEFAULT_ID, libraries = [], language, region, version, mapIds, nonce, retries = 3, url = "https://maps.googleapis.com/maps/api/js", }) {
          this.CALLBACK = "__googleMapsCallback";
          this.callbacks = [];
          this.done = false;
          this.loading = false;
          this.errors = [];
          this.version = version;
          this.apiKey = apiKey;
          this.channel = channel;
          this.client = client;
          this.id = id || DEFAULT_ID; // Do not allow empty string
          this.libraries = libraries;
          this.language = language;
          this.region = region;
          this.mapIds = mapIds;
          this.nonce = nonce;
          this.retries = retries;
          this.url = url;
          if (Loader.instance) {
              if (!fastDeepEqual(this.options, Loader.instance.options)) {
                  throw new Error(`Loader must not be called again with different options. ${JSON.stringify(this.options)} !== ${JSON.stringify(Loader.instance.options)}`);
              }
              return Loader.instance;
          }
          Loader.instance = this;
      }
      get options() {
          return {
              version: this.version,
              apiKey: this.apiKey,
              channel: this.channel,
              client: this.client,
              id: this.id,
              libraries: this.libraries,
              language: this.language,
              region: this.region,
              mapIds: this.mapIds,
              nonce: this.nonce,
              url: this.url,
          };
      }
      get failed() {
          return this.done && !this.loading && this.errors.length >= this.retries + 1;
      }
      /**
       * CreateUrl returns the Google Maps JavaScript API script url given the [[LoaderOptions]].
       *
       * @ignore
       */
      createUrl() {
          let url = this.url;
          url += `?callback=${this.CALLBACK}`;
          if (this.apiKey) {
              url += `&key=${this.apiKey}`;
          }
          if (this.channel) {
              url += `&channel=${this.channel}`;
          }
          if (this.client) {
              url += `&client=${this.client}`;
          }
          if (this.libraries.length > 0) {
              url += `&libraries=${this.libraries.join(",")}`;
          }
          if (this.language) {
              url += `&language=${this.language}`;
          }
          if (this.region) {
              url += `&region=${this.region}`;
          }
          if (this.version) {
              url += `&v=${this.version}`;
          }
          if (this.mapIds) {
              url += `&map_ids=${this.mapIds.join(",")}`;
          }
          return url;
      }
      /**
       * Load the Google Maps JavaScript API script and return a Promise.
       */
      load() {
          return this.loadPromise();
      }
      /**
       * Load the Google Maps JavaScript API script and return a Promise.
       *
       * @ignore
       */
      loadPromise() {
          return new Promise((resolve, reject) => {
              this.loadCallback((err) => {
                  if (!err) {
                      resolve(window.google);
                  }
                  else {
                      reject(err);
                  }
              });
          });
      }
      /**
       * Load the Google Maps JavaScript API script with a callback.
       */
      loadCallback(fn) {
          this.callbacks.push(fn);
          this.execute();
      }
      /**
       * Set the script on document.
       */
      setScript() {
          if (document.getElementById(this.id)) {
              // TODO wrap onerror callback for cases where the script was loaded elsewhere
              this.callback();
              return;
          }
          const url = this.createUrl();
          const script = document.createElement("script");
          script.id = this.id;
          script.type = "text/javascript";
          script.src = url;
          script.onerror = this.loadErrorCallback.bind(this);
          script.defer = true;
          script.async = true;
          if (this.nonce) {
              script.nonce = this.nonce;
          }
          document.head.appendChild(script);
      }
      deleteScript() {
          const script = document.getElementById(this.id);
          if (script) {
              script.remove();
          }
      }
      /**
       * Reset the loader state.
       */
      reset() {
          this.deleteScript();
          this.done = false;
          this.loading = false;
          this.errors = [];
          this.onerrorEvent = null;
      }
      resetIfRetryingFailed() {
          if (this.failed) {
              this.reset();
          }
      }
      loadErrorCallback(e) {
          this.errors.push(e);
          if (this.errors.length <= this.retries) {
              const delay = this.errors.length * Math.pow(2, this.errors.length);
              console.log(`Failed to load Google Maps script, retrying in ${delay} ms.`);
              setTimeout(() => {
                  this.deleteScript();
                  this.setScript();
              }, delay);
          }
          else {
              this.onerrorEvent = e;
              this.callback();
          }
      }
      setCallback() {
          window.__googleMapsCallback = this.callback.bind(this);
      }
      callback() {
          this.done = true;
          this.loading = false;
          this.callbacks.forEach((cb) => {
              cb(this.onerrorEvent);
          });
          this.callbacks = [];
      }
      execute() {
          this.resetIfRetryingFailed();
          if (this.done) {
              this.callback();
          }
          else {
              // short circuit and warn if google.maps is already loaded
              if (window.google && window.google.maps && window.google.maps.version) {
                  console.warn("Google Maps already loaded outside @googlemaps/js-api-loader." +
                      "This may result in undesirable behavior as options and script parameters may not match.");
                  this.callback();
                  return;
              }
              if (this.loading) ;
              else {
                  this.loading = true;
                  this.setCallback();
                  this.setScript();
              }
          }
      }
  }

  const selectors$4 = {
    mapContainer: '.map__container',
    map: '.map__element',
    image: '.map__image'
  };
  const classes$2 = {
    hidden: 'hidden'
  };
  register('map', {
    onLoad() {
      const map = n$1(selectors$4.mapContainer, this.container);
      let geocoder = null;
      if (!map) return;
      const {
        apiKey,
        address
      } = map.dataset;
      const rawData = n$1('#map-styles', this.container).innerHTML;
      let styleData;

      if (rawData) {
        try {
          styleData = JSON.parse(rawData);
        } catch (e) {
          styleData = {};
          console.error(`Custom map JSON error: ${e}`);
        }
      }

      if (!apiKey || !address) return;

      const _setFailureHandler = () => {
        // Handle authetication errors
        window.gm_authFailure = function () {
          const maps = t$3(selectors$4.mapContainer, document);
          const mapImages = t$3(selectors$4.image, document);
          maps.forEach(map => {
            u(map, classes$2.hidden);
          });
          mapImages.forEach(img => {
            i(img, classes$2.hidden);
          });
        };
      };

      const _loadMap = () => {
        u(n$1(selectors$4.image, this.container), classes$2.hidden);
        geocoder = new google.maps.Geocoder();
        geocoder.geocode({
          address
        }, (res, _) => {
          const {
            location
          } = res[0].geometry;
          const latLong = {
            lat: location.lat(),
            lng: location.lng()
          };
          const map = new google.maps.Map(n$1(selectors$4.map, this.container), {
            center: latLong,
            zoom: 12,
            styles: styleData.styles
          });
          new google.maps.Marker({
            position: latLong,
            map
          });
        });
      };

      const _loadAPI = (apiKey, address, styleData) => {
        const loader = new Loader({
          apiKey,
          version: 'weekly'
        }); // Only load the api once

        if (!window.google) {
          loader.load().then(() => {
            _loadMap();
          });
        } else {
          _loadMap();
        }
      };

      _setFailureHandler();

      _loadAPI(apiKey);
    },

    onUnload() {}

  });

  register('cart', {
    onLoad() {
      const {
        enableCartAjax
      } = this.container.dataset;
      const ajaxEnabled = enableCartAjax === 'true';
      this.form = n$1('[data-form]', this.container);
      if (!this.form) return;
      const buttons = t$3('[data-change]', this.container);
      const quantityInput = n$1('[data-quantity-input]', this.container);
      this.timer;
      this.events = [e$2(buttons, 'click', e => {
        e.preventDefault();
        const {
          change
        } = e.currentTarget.dataset;
        const input = n$1('input', e.currentTarget.parentNode);

        if (change === 'increment') {
          input.value >= 0 && input.value++;
        } else if (change === 'decrement') {
          input.value > 0 && input.value--;
        }

        if (ajaxEnabled) this.handleTimeout();
      })];

      if (ajaxEnabled) {
        this.events.push(e$2(quantityInput, 'input', this.handleTimeout));
      }
    },

    handleTimeout() {
      clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        this.form.submit();
      }, 1000);
    },

    onUnload() {
      this.events.forEach(unsubscribe => unsubscribe());
    }

  });

  // Public Methods
  // -----------------------------------------------------------------------------

  /**
   * Returns a URL with a variant ID query parameter. Useful for updating window.history
   * with a new URL based on the currently select product variant.
   * @param {string} url - The URL you wish to append the variant ID to
   * @param {number} id  - The variant ID you wish to append to the URL
   * @returns {string} - The new url which includes the variant ID query parameter
   */

  function getUrlWithVariant(url, id) {
    if (/variant=/.test(url)) {
      return url.replace(/(variant=)[^&]+/, '$1' + id);
    } else if (/\?/.test(url)) {
      return url.concat('&variant=').concat(id);
    }

    return url.concat('?variant=').concat(id);
  }

  const routes = window.theme.routes.cart || {};
  const {
    strings
  } = window.theme;
  const selectors$3 = {
    productVariant: '[data-variant-select]',
    form: '[data-form]',
    country: '[data-address-country]',
    province: '[data-address-province]',
    provinceWrapper: '[data-address-province-wrapper]',
    zip: '[data-address-zip]',
    modal: '[data-estimator-modal]',
    wash: '[data-mobile-wash]',
    trigger: '[data-estimator-trigger]',
    estimateButton: '[data-estimator-button]',
    success: '[data-estimator-success]',
    error: '[data-estimator-error]',
    close: '[data-close-icon]'
  };
  const classes$1 = {
    active: 'active',
    hidden: 'hidden',
    visible: 'is-visible',
    fixed: 'is-fixed'
  };

  const ShippingEstimator = node => {
    const form = n$1(selectors$3.form, node);
    const productSelect = n$1(selectors$3.productVariant, document);
    const countrySelector = n$1(selectors$3.country, node);
    const provinceSelector = n$1(selectors$3.province, node);
    const provinceWrapper = n$1(selectors$3.provinceWrapper, node);
    const zipInput = n$1(selectors$3.zip, node);
    const modal = n$1(selectors$3.modal, node);
    const wash = n$1(selectors$3.wash, node);
    const trigger = n$1(selectors$3.trigger, node);
    const estimate = n$1(selectors$3.estimateButton, node);
    const successMessage = n$1(selectors$3.success, node);
    const errorMessage = n$1(selectors$3.error, node);
    let focusTrap = null;
    let cartCookie; // Add dummy placeholder option

    const firstCountryOption = n$1('option', countrySelector);
    firstCountryOption.setAttribute('selected', true);
    firstCountryOption.innerText = strings.product.country_placeholder;

    _checkForProvince();

    const events = [e$2(form, 'submit', e => {
      e.preventDefault();

      _estimateShipping();
    }), e$2(countrySelector, 'change', _checkForProvince), e$2(trigger, 'click', _open), e$2(wash, 'click', _close), e$2(n$1(selectors$3.close, node), 'click', _close), e$2(estimate, 'click', _estimateShipping), e$2(node, 'keydown', ({
      keyCode
    }) => {
      if (keyCode === 27) _close();
    })];
    /* get cookie by name */

    const getCookie = name => {
      const value = '; ' + document.cookie;
      const parts = value.split('; ' + name + '=');
      if (parts.length == 2) return parts.pop().split(';').shift();
    };
    /* update the cart cookie value */


    const updateCartCookie = a => {
      const date = new Date();
      date.setTime(date.getTime() + 14 * 86400000);
      const expires = '; expires=' + date.toGMTString();
      document.cookie = 'cart=' + a + expires + '; path=/';
    };
    /* reset the cart cookie value */


    const resetCartCookie = () => {
      updateCartCookie(cartCookie);
    };
    /* get the rates */


    const getRates = variantId => {
      u(estimate, 'loading');
      if (typeof variantId === 'undefined') return;
      const productQuantity = n$1('[data-quantity-input]', node);
      const quantity = productQuantity ? parseInt(productQuantity.value) : 1;
      const addData = {
        id: variantId,
        quantity: quantity
      };
      fetch(routes.add + '.js', {
        body: JSON.stringify(addData),
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'xmlhttprequest'
        },
        method: 'POST'
      }).then(response => {
        return response.json();
      }).then(() => {
        errorMessage.innerHTML = '';
        successMessage.innerHTML = '';
        i(successMessage, 'active');
        const countryQuery = `shipping_address%5Bcountry%5D=${countrySelector.value}`;
        const provinceQuery = `shipping_address%5Bprovince%5D=${provinceSelector.value}`;
        const zipQuery = `shipping_address%5Bzip%5D=${zipInput.value}`;
        const requestUrl = `${routes.shipping}.json?${countryQuery}&${provinceQuery}&${zipQuery}`;
        const request = new XMLHttpRequest();
        request.open('GET', requestUrl, true);

        request.onload = () => {
          const response = JSON.parse(request.response);

          if (request.status >= 200 && request.status < 300) {
            if (response.shipping_rates && response.shipping_rates.length) {
              u(successMessage, 'active');
              response.shipping_rates.forEach(rate => {
                const rateElement = `
                  <li class="shipping-estimator-modal__success-item">
                    <h4 class="ff-body fs-body-bold">${rate.name}</h4>
                    <span class="ff-body fs-body-small">${formatMoney(rate.price)}</span>
                  </li>
                `;
                successMessage.insertAdjacentHTML('beforeend', rateElement);
              });
            } else {
              const noRate = `
                <li class="shipping-estimator-modal__success-item">
                  <span class="ff-body fs-body-small">${strings.product.no_shipping_rates}</span>
                </li>
              `;
              successMessage.insertAdjacentHTML('beforeend', noRate);
            }
          } else {
            for (const [key, value] of Object.entries(response)) {
              const errorElement = `
              <li class="shipping-estimator-modal__error-item">
                <p class="ff-body fs-body-small"><span>${key}</span> ${value}</p>
              </li>
            `;
              errorMessage.insertAdjacentHTML('beforeend', errorElement);
            }
          }

          resetCartCookie();
          i(estimate, 'loading');
        };

        request.send();
      }).catch(() => {
        resetCartCookie();
        i(estimate, 'loading');
      });
    };

    function _checkForProvince() {
      const selected = n$1(`[value="${countrySelector.value}"]`, countrySelector);
      const provinces = JSON.parse(selected.dataset.provinces);
      l(provinceWrapper, classes$1.hidden, !provinces.length);
      provinceSelector.innerHTML = provinces.reduce((acc, curr) => {
        return acc + `<option value="${curr[0]}">${curr[0]}</option>`;
      }, '');
    }

    function _estimateShipping() {
      if (!productSelect.value.length) return;
      cartCookie = getCookie('cart');
      let tempCookieValue = 'temp-cart-cookie___' + Date.now();
      let fakeCookieValue = 'fake-cart-cookie___' + Date.now(); // If not found, make a new temp cookie

      if (!cartCookie) {
        updateCartCookie(tempCookieValue);
        cartCookie = getCookie('cart');
      } // If found but has a weird length, abort


      if (cartCookie.length < 32) return;
      /* Change the cookie value to a new 32 character value */

      updateCartCookie(fakeCookieValue);
      getRates(parseInt(productSelect.value));
    }

    function _open(e) {
      e.preventDefault();
      u(modal, classes$1.fixed);
      setTimeout(() => {
        u(modal, classes$1.visible, classes$1.active);
      }, 50);
      modal.setAttribute('aria-hidden', 'false');
      focusTrap = createFocusTrap(modal, {
        allowOutsideClick: true
      });
      focusTrap.activate();
      disableBodyScroll(node, {
        allowTouchMove: el => {
          while (el && el !== document.body) {
            if (el.getAttribute('data-scroll-lock-ignore') !== null) {
              return true;
            }

            el = el.parentNode;
          }
        },
        reserveScrollBarGap: true
      });
    }

    function _close(e) {
      e && e.preventDefault();
      i(modal, classes$1.visible, classes$1.active);
      focusTrap && focusTrap.deactivate();
      setTimeout(() => {
        i(modal, classes$1.fixed);
      }, 300);
      modal.setAttribute('aria-hidden', 'true');
      enableBodyScroll(node);
    }

    return () => {
      events.forEach(unsubscribe => unsubscribe());
    };
  };

  function wrapIframes (elements = []) {
    elements.forEach(el => {
      const wrapper = document.createElement('div');
      wrapper.classList.add('rte__iframe');
      el.parentNode.insertBefore(wrapper, el);
      wrapper.appendChild(el);
      el.src = el.src;
    });
  }

  function wrapTables (elements = []) {
    elements.forEach(el => {
      const wrapper = document.createElement('div');
      wrapper.classList.add('rte__table-wrapper');
      el.parentNode.insertBefore(wrapper, el);
      wrapper.appendChild(el);
    });
  }

  const selectors$2 = {
    form: '[data-product-form]',
    addToCart: '[data-add-to-cart]',
    variantSelect: '[data-variant-select]',
    optionById: id => `[value='${id}']`,
    thumb: '[data-product-thumbnail]',
    shippingEstimatorButton: '[data-estimator-trigger]',
    storeAvailability: '[data-store-availability-container]',
    quantityError: '[data-quantity-error]'
  };
  register('product', {
    productForm: null,
    reviewsHandler: null,
    accordions: [],

    onLoad() {
      const {
        productHasOnlyDefaultVariant
      } = this.container.dataset;
      this.formElement = n$1(selectors$2.form, this.container);
      this.images = t$3('[data-open]', this.container);
      this.quantityError = n$1(selectors$2.quantityError, this.container);
      const viewInYourSpace = n$1('[data-in-your-space]', this.container);
      viewInYourSpace && l(viewInYourSpace, 'visible', isMobile$1());
      this.productThumbs = t$3(selectors$2.thumb, this.container); // Handle Surface pickup

      this.storeAvailabilityContainer = n$1(selectors$2.storeAvailability, this.container);
      this.availability = null;
      window.SPRCallbacks = {};

      window.SPRCallbacks.onReviewsLoad = () => {
        if (!this.reviewsHandler) {
          this.reviewsHandler = reviewsHandler();
        }
      };

      window.SPRCallbacks.onBadgeLoad = () => {
        this.badgeHandler = badgeHandler();
      };

      window.SPRCallbacks.onFormFailure = () => {
        r$2('spr-form:updated');
      };

      window.SPRCallbacks.onFormSuccess = () => {
        r$2('spr-form:updated');
      };

      if (this.formElement) {
        const {
          productHandle,
          currentProductId
        } = this.formElement.dataset;
        const product = getProduct(productHandle);
        product(data => {
          const variant = getVariantFromId(data, parseInt(currentProductId));

          if (this.storeAvailabilityContainer && variant) {
            this.availability = storeAvailability(this.storeAvailabilityContainer, data, variant, {
              hideVariantTitle: productHasOnlyDefaultVariant === 'true'
            });
          }

          const quickPurchaseBarEnabled = n$1('[data-quick-purchase-bar]', this.container);

          if (quickPurchaseBarEnabled) {
            this.quickPurchaseBar = quickPurchaseBar(this.container, variant);
          }

          this.productForm = ProductForm(this.container, this.formElement, data, {
            onOptionChange: e => this.onOptionChange(e),
            onFormSubmit: e => this.onFormSubmit(e),
            onQuantityChange: e => this.onQuantityChange(e)
          });
          const productInventoryJson = n$1('[data-product-inventory-json]', this.container);

          if (productInventoryJson) {
            const jsonData = JSON.parse(productInventoryJson.innerHTML);
            const variantsInventories = jsonData.inventory;

            if (variantsInventories) {
              const config = {
                id: variant.id,
                variantsInventories
              };
              this.inventoryCounter = inventoryCounter(this.container, config);
            }
          }
        });
      }

      this.quantityInput = quantityInput(this.container);
      this.socialButtons = t$3('[data-social-share]', this.container);
      const accordionElements = t$3('.accordion', this.container);
      accordionElements.forEach(accordion => {
        const accordionOpen = accordion.classList.contains('accordion--open');
        this.accordions.push(Accordions(accordion, {
          firstOpen: accordionOpen
        }));
        const accordionParent = accordion.parentElement;

        if (accordionParent.classList.contains('rte--product') && !accordionParent.classList.contains('accordion accordion--product')) {
          accordion.classList.add('rte--product', 'accordion--product');
        }
      });
      this.lightbox = Lightbox(n$1('[data-lightbox]', this.container));
      this.media = Media(n$1('.product__media-container', this.container));
      this.optionButtons = OptionButtons(t$3('[data-option-buttons]', this.container));
      this.variantPopup = variantPopup(this.container);
      this.shippingEstimatorButtons = t$3(selectors$2.shippingEstimatorButton, this.container);
      this.shippingEstimator = this.shippingEstimatorButtons.map(button => ShippingEstimator(button.parentNode));
      const productDescriptionWrapper = n$1('.product__description', this.container);

      if (productDescriptionWrapper) {
        wrapIframes(t$3('iframe', productDescriptionWrapper));
        wrapTables(t$3('table', productDescriptionWrapper));
      }

      this._initEvents();
    },

    _initEvents() {
      this.events = [e$2(this.productThumbs, 'click', e => {
        e.preventDefault();
        const {
          currentTarget: {
            dataset
          }
        } = e;
        this.productThumbs.forEach(thumb => i(thumb, 'active'));
        u(e.currentTarget, 'active');
        switchImage(this.container, dataset.thumbnailId);
      }), e$2(this.images, 'click', e => {
        e.preventDefault();
        this.lightbox.open(e.currentTarget.dataset.open);
      }), e$2(this.socialButtons, 'click', e => {
        l(e.target, 'active');
        const sub = n$1('.article__share-icons', e.target);
        sub.setAttribute('aria-hidden', !a$1(e.target, 'active'));
      })];
    },

    // When the user changes a product option
    onOptionChange({
      dataset: {
        variant
      }
    }) {
      const buyButton = n$1(selectors$2.addToCart, this.container); // Update prices to reflect selected variant

      updatePrices(this.container, variant); // Update buy button

      updateBuyButton(buyButton, variant); // Update unit pricing

      updateUnitPrices(this.container, variant); // Update sku

      updateSku(this.container, variant);
      this.inventoryCounter && this.inventoryCounter.update(variant);

      if (!variant) {
        updateBuyButton(n$1('[data-add-to-cart]', this.container), false);
        this.shippingEstimatorButtons.forEach(btn => u(btn, 'hidden'));
        this.availability && this.availability.unload();
        return;
      }

      this.quickPurchaseBar && this.quickPurchaseBar.update(variant); // Update URL with selected variant

      const url = getUrlWithVariant(window.location.href, variant.id);
      window.history.replaceState({
        path: url
      }, '', url); // We need to set the id input manually so the Dynamic Checkout Button works

      const selectedVariantOpt = n$1(`${selectors$2.variantSelect} ${selectors$2.optionById(variant.id)}`, this.container);
      selectedVariantOpt.selected = true; // We need to dispatch an event so Shopify pay knows the form has changed

      this.formElement.dispatchEvent(new Event('change')); // Update selected variant image and thumb

      if (variant.featured_media) {
        switchImage(this.container, variant.featured_media.id);
        const thumb = n$1(`[data-thumbnail-id="${variant.featured_media.id}"]`, this.container);
        this.productThumbs.forEach(thumb => i(thumb, 'active'));
        u(thumb, 'active');
      } // Update product availability content


      this.availability && this.availability.update(variant);
      this.shippingEstimatorButtons.forEach(btn => i(btn, 'hidden'));
    },

    // When user updates quantity
    onQuantityChange({
      dataset: {
        variant,
        quantity
      }
    }) {
      // Adjust the hidden quantity input within the form
      const quantityInputs = [...t$3('[name="quantity"]', this.formElement)];
      quantityInputs.forEach(quantityInput => {
        quantityInput.value = quantity;
      });
      if (!variant) return;
      this.quickPurchaseBar && this.quickPurchaseBar.update(variant);
    },

    // When user submits the product form
    onFormSubmit(e) {
      const {
        enableCartAjax
      } = document.body.dataset;
      if (!enableCartAjax) return;
      e.preventDefault();
      u(this.quantityError, 'hidden');
      const button = n$1(selectors$2.addToCart, this.container);
      u(button, 'loading');
      cart.addItem(this.formElement).then(({
        item
      }) => {
        i(button, 'loading');
        r$2('cart:open', null, {
          flash: item.variant_id
        });
      }).catch(() => {
        i(this.quantityError, 'hidden');
        const button = n$1(selectors$2.addToCart, this.container);
        i(button, 'loading');
      });
    },

    onBlockSelect({
      target
    }) {
      const label = n$1('.accordion__label', target);
      target.scrollIntoView({
        block: 'center',
        behavior: 'smooth'
      });
      if (!label) return;
      const {
        parentNode: group,
        nextElementSibling: content
      } = label;
      slideStop(content);
      slideDown(content);
      group.setAttribute('data-open', true);
      label.setAttribute('aria-expanded', true);
      content.setAttribute('aria-hidden', false);
    },

    onBlockDeselect({
      target
    }) {
      const label = n$1('.accordion__label', target);
      if (!label) return;
      const {
        parentNode: group,
        nextElementSibling: content
      } = label;
      slideStop(content);
      slideUp(content);
      group.setAttribute('data-open', false);
      label.setAttribute('aria-expanded', false);
      content.setAttribute('aria-hidden', true);
    },

    onUnload() {
      this.productForm.destroy();
      this.lightbox.destroy();
      this.shippingEstimator.forEach(unsubscribe => unsubscribe());
      this.accordions.forEach(accordion => accordion.unload());
      this.optionButtons.destroy();
      this.quantityInput.unload();
      this.events.forEach(unsubscribe => unsubscribe());
      this.quickPurchaseBar && this.quickPurchaseBar.unload();
      this.reviewsHandler && this.reviewsHandler.unload();
    }

  });

  /* @preserve
   * https://github.com/Elkfox/Ajaxinate
   * Copyright (c) 2017 Elkfox Co Pty Ltd (elkfox.com)
   * MIT License (do not remove above copyright!)
   */

  /* Configurable options;
   *
   * method: scroll or click
   * container: selector of repeating content
   * pagination: selector of pagination container
   * offset: number of pixels before the bottom to start loading more on scroll
   * loadingText: 'Loading', The text shown during when appending new content
   * callback: null, callback function after new content is appended
   *
   * Usage;
   *
   * import {Ajaxinate} from 'ajaxinate';
   *
   * new Ajaxinate({
   *   offset: 5000,
   *   loadingText: 'Loading more...',
   * });
   */

  /* eslint-env browser */
  function Ajaxinate(config) {
    const settings = config || {};

    const defaults = {
      method: "scroll",
      container: "#AjaxinateContainer",
      pagination: "#AjaxinatePagination",
      offset: 0,
      loadingText: "Loading",
      callback: null,
    };

    // Merge custom configs with defaults
    this.settings = Object.assign(defaults, settings);

    // Functions
    this.addScrollListeners = this.addScrollListeners.bind(this);
    this.addClickListener = this.addClickListener.bind(this);
    this.checkIfPaginationInView = this.checkIfPaginationInView.bind(this);
    this.preventMultipleClicks = this.preventMultipleClicks.bind(this);
    this.removeClickListener = this.removeClickListener.bind(this);
    this.removeScrollListener = this.removeScrollListener.bind(this);
    this.removePaginationElement = this.removePaginationElement.bind(this);
    this.destroy = this.destroy.bind(this);

    // Selectors
    this.containerElement = document.querySelector(this.settings.container);
    this.paginationElement = document.querySelector(this.settings.pagination);
    this.initialize();
  }

  Ajaxinate.prototype.initialize = function initialize() {
    if (!this.containerElement) {
      return;
    }

    const initializers = {
      click: this.addClickListener,
      scroll: this.addScrollListeners,
    };

    initializers[this.settings.method]();
  };

  Ajaxinate.prototype.addScrollListeners = function addScrollListeners() {
    if (!this.paginationElement) {
      return;
    }

    document.addEventListener("scroll", this.checkIfPaginationInView);
    window.addEventListener("resize", this.checkIfPaginationInView);
    window.addEventListener("orientationchange", this.checkIfPaginationInView);
  };

  Ajaxinate.prototype.addClickListener = function addClickListener() {
    if (!this.paginationElement) {
      return;
    }

    this.nextPageLinkElement = this.paginationElement.querySelector("a");
    this.clickActive = true;

    if (
      typeof this.nextPageLinkElement !== "undefined" &&
      this.nextPageLinkElement !== null
    ) {
      this.nextPageLinkElement.addEventListener(
        "click",
        this.preventMultipleClicks
      );
    }
  };

  Ajaxinate.prototype.preventMultipleClicks = function preventMultipleClicks(
    event
  ) {
    event.preventDefault();

    if (!this.clickActive) {
      return;
    }

    this.nextPageLinkElement.innerText = this.settings.loadingText;
    this.nextPageUrl = this.nextPageLinkElement.href;
    this.clickActive = false;

    this.loadMore();
  };

  Ajaxinate.prototype.checkIfPaginationInView = function checkIfPaginationInView() {
    const top =
      this.paginationElement.getBoundingClientRect().top - this.settings.offset;
    const bottom =
      this.paginationElement.getBoundingClientRect().bottom +
      this.settings.offset;

    if (top <= window.innerHeight && bottom >= 0) {
      this.nextPageLinkElement = this.paginationElement.querySelector("a");
      this.removeScrollListener();

      if (this.nextPageLinkElement) {
        this.nextPageLinkElement.innerText = this.settings.loadingText;
        this.nextPageUrl = this.nextPageLinkElement.href;

        this.loadMore();
      }
    }
  };

  Ajaxinate.prototype.loadMore = function getTheHtmlOfTheNextPageWithAnAjaxRequest() {
    this.request = new XMLHttpRequest();
    this.request.onreadystatechange = function success() {
      if (this.request.readyState === 4 && this.request.status === 200) {
        var parser = new DOMParser();
        var htmlDoc = parser.parseFromString(
          this.request.responseText,
          "text/html"
        );
        var newContainer = htmlDoc.querySelectorAll(this.settings.container)[0];
        var newPagination = htmlDoc.querySelectorAll(this.settings.pagination)[0];
        this.containerElement.insertAdjacentHTML(
          "beforeend",
          newContainer.innerHTML
        );
        this.paginationElement.innerHTML = newPagination.innerHTML;
        if (
          this.settings.callback &&
          typeof this.settings.callback === "function"
        ) {
          this.settings.callback(this.request.responseXML);
        }
        this.initialize();
      }
    }.bind(this);
    this.request.open("GET", this.nextPageUrl, false);
    this.request.send();
  };

  Ajaxinate.prototype.removeClickListener = function removeClickListener() {
    this.nextPageLinkElement.removeEventListener(
      "click",
      this.preventMultipleClicks
    );
  };

  Ajaxinate.prototype.removePaginationElement = function removePaginationElement() {
    this.paginationElement.innerHTML = "";
    this.destroy();
  };

  Ajaxinate.prototype.removeScrollListener = function removeScrollListener() {
    document.removeEventListener("scroll", this.checkIfPaginationInView);
    window.removeEventListener("resize", this.checkIfPaginationInView);
    window.removeEventListener("orientationchange", this.checkIfPaginationInView);
  };

  Ajaxinate.prototype.destroy = function destroy() {
    const destroyers = {
      click: this.removeClickListener,
      scroll: this.removeScrollListener,
    };

    destroyers[this.settings.method]();

    return this;
  };

  const FILTERS_REMOVE = 'collection:filters:remove';
  const RANGE_REMOVE = 'collection:range:remove';
  const EVERYTHING_CLEAR = 'collection:clear';
  const FILTERS_UPDATE = 'collection:filters:update';
  const updateFilters = () => r$2(FILTERS_UPDATE);
  const clearAll = () => r$2(EVERYTHING_CLEAR);
  const removeFilters = target => r$2(FILTERS_REMOVE, null, {
    target
  });
  const removeRange = () => r$2(RANGE_REMOVE);
  const filtersUpdated = cb => c(FILTERS_UPDATE, cb);
  const filtersRemoved = cb => c(FILTERS_REMOVE, cb);
  const everythingCleared = cb => c(EVERYTHING_CLEAR, cb);
  const rangeRemoved = cb => c(RANGE_REMOVE, cb);

  const selectors$1 = {
    infiniteScrollContainer: '.collection__infinite-container',
    infiniteScrollTrigger: '.collection__infinite-trigger',
    partial: '[data-partial]'
  };
  register('collection', {
    infiniteScroll: null,

    onLoad() {
      const {
        collectionItemCount,
        paginationType
      } = this.container.dataset;
      if (!parseInt(collectionItemCount)) return;
      this.filterForm = n$1('[data-filter-form]', this.container);

      if (this.filterForm) {
        this._initFiltering();
      } // Ininite scroll


      this.paginationType = paginationType;
      this.paginated = this.paginationType === 'paginated';
      this.infiniteScrollTrigger = n$1(selectors$1.infiniteScrollTrigger, this.container);

      if (!this.paginated) {
        this._initInfiniteScroll();
      }
    },

    _initFiltering() {
      Promise.resolve().then(function () { return filtering$1; }).then(({
        default: filtering
      }) => {
        // collection filters
        this.filtering = filtering(this.filterForm, this.container); // Set initial evx state from collection url object

        o(this.filtering.getState());
        this.partial = n$1(selectors$1.partial, this.container);
        this.subscriptions = [filtersRemoved((_, {
          target
        }) => {
          this.filtering.removeFilters(target, data => {
            this._renderView(data.url);

            o(data)();
          });
        }), rangeRemoved(() => {
          this.filtering.removeRange(data => {
            this._renderView(data.url);

            o(data)();
          });
        }), filtersUpdated(() => {
          this.filtering.filtersUpdated(data => {
            this._renderView(data.url);

            o(data)();
          });
        }), everythingCleared(() => {
          this.filtering.clearAll(data => {
            this._renderView(data.url);

            o(data)();
          });
        })];
        this.delegate = new Delegate(this.partial);
        this.delegate.on('click', '[data-remove-filter]', e => {
          e.preventDefault();
          const {
            filter
          } = e.target.dataset;
          removeFilters(filter);
        });
        this.delegate.on('click', '[data-remove-range]', e => {
          e.preventDefault();
          removeRange();
        });
        this.delegate.on('click', '[data-clear]', e => {
          e.preventDefault();
          clearAll();
        });
      });
    },

    _initInfiniteScroll() {
      const infiniteScrollOptions = {
        container: selectors$1.infiniteScrollContainer,
        pagination: selectors$1.infiniteScrollTrigger,
        loadingText: 'Loading...',
        callback: () => r$2('collection:updated')
      };

      if (this.paginationType === 'click') {
        infiniteScrollOptions.method = 'click';
      }

      this.infiniteScroll = new Ajaxinate(infiniteScrollOptions);
    },

    _renderView(searchParams) {
      const url = `${window.location.pathname}?section_id=${this.container.dataset.sectionId}&${searchParams}`;
      const loading = n$1('.collection__loading', this.container);
      u(loading, 'is-active');
      fetch(url).then(res => res.text()).then(res => {
        this._updateURLHash(searchParams);

        const doc = new DOMParser().parseFromString(res, 'text/html');
        const contents = n$1(selectors$1.partial, doc).innerHTML;
        this.partial.innerHTML = contents;

        if (!this.paginated) {
          this.infiniteScrollTrigger.innerHTML = '';

          this._initInfiniteScroll();
        }

        i(loading, 'is-active');
        r$2('collection:updated');
      });
    },

    _updateURLHash(searchParams) {
      history.pushState({
        searchParams
      }, '', `${window.location.pathname}${searchParams && '?'.concat(searchParams)}`);
    },

    onUnload() {
      this.infiniteScroll && this.infiniteScroll.destroy();
      this.filtering && this.filtering.unload();
      this.delegate.off();
      this.subscriptions.forEach(unsubscribe => unsubscribe());
    }

  });

  register('login', {
    onLoad() {
      const main = n$1('[data-part="login"]', this.container);
      const reset = n$1('[data-part="reset"]', this.container);
      const toggles = t$3('[data-toggle]', this.container);
      const wrapper = n$1('.login__wrapper', this.container);
      const loginError = n$1('.login__error', this.container);
      const isSuccess = n$1('[data-success]', this.container);
      const successMessage = n$1('[data-success-message]', this.container);

      if (isSuccess) {
        u(successMessage, 'visible');
        u(wrapper, 'hide');
      }

      if (loginError) {
        toggleView();
      }

      function toggleView(e) {
        e && e.preventDefault();
        l([main, reset], 'hide');
        main.setAttribute('aria-hidden', a$1(main, 'hide'));
        reset.setAttribute('aria-hidden', a$1(reset, 'hide'));
      }

      this.toggleClick = e$2(toggles, 'click', toggleView);
    },

    onUnload() {
      this.toggleClick();
    }

  });

  register('addresses', {
    onLoad() {
      this.modals = t$3('[data-address-modal]', this.container);
      this.focusTrap = null;
      const overlays = t$3('[data-overlay]', this.container);
      const open = t$3('[data-open]', this.container);
      const close = t$3('[data-close]', this.container);
      const remove = t$3('[data-remove]', this.container);
      const countryOptions = t$3('[data-country-option]', this.container) || [];
      this.events = [e$2(open, 'click', e => this.openModal(e)), e$2([...close, ...overlays], 'click', e => this.closeModal(e)), e$2(remove, 'click', e => this.removeAddress(e)), e$2(this.modals, 'keydown', e => {
        if (e.keyCode === 27) this.closeModal(e);
      })];
      countryOptions.forEach(el => {
        const {
          formId
        } = el.dataset;
        const countrySelector = 'AddressCountry_' + formId;
        const provinceSelector = 'AddressProvince_' + formId;
        const containerSelector = 'AddressProvinceContainer_' + formId;
        new window.Shopify.CountryProvinceSelector(countrySelector, provinceSelector, {
          hideElement: containerSelector
        });
      });
    },

    onUnload() {
      this.events.forEach(unsubscribe => unsubscribe());
    },

    openModal(e) {
      e.preventDefault();
      const {
        open: which
      } = e.currentTarget.dataset;
      const modal = this.modals.find(el => el.dataset.addressModal == which);
      u(modal, 'active');
      this.focusTrap = createFocusTrap(modal, {
        allowOutsideClick: true
      });
      this.focusTrap.activate();
      disableBodyScroll(modal, {
        allowTouchMove: el => {
          while (el && el !== document.body) {
            if (el.getAttribute('data-scroll-lock-ignore') !== null) {
              return true;
            }

            el = el.parentNode;
          }
        },
        reserveScrollBarGap: true
      });
      setTimeout(() => {
        u(modal, 'visible');
      }, 50);
    },

    closeModal(e) {
      e.preventDefault();
      const modal = e.target.closest('.addresses__modal');
      enableBodyScroll(modal);
      this.focusTrap.deactivate();
      i(modal, 'visible');
      setTimeout(() => {
        i(modal, 'active');
      }, 350);
    },

    removeAddress(e) {
      const {
        confirmMessage,
        target
      } = e.currentTarget.dataset;

      if (confirm(confirmMessage) || 'Are you sure you wish to delete this address?') {
        window.Shopify.postLink(target, {
          parameters: {
            _method: 'delete'
          }
        });
      }
    }

  });

  register('article', {
    onLoad() {
      focusFormStatus(this.container);
      const socialButtons = t$3('[data-social-share]', this.container);
      this.events = [e$2(socialButtons, 'click', e => {
        l(e.target, 'active');
        const sub = n$1('.article__share-icons', e.target);
        sub.setAttribute('aria-hidden', !a$1(e.target, 'active'));
      })];
      wrapIframes(t$3('iframe', this.container));
      wrapTables(t$3('table', this.container));
    },

    onUnload() {
      this.events.forEach(unsubscribe => unsubscribe());
    }

  });

  const sel$1 = {
    toggle: '[data-js-toggle]',
    textToggle: '[data-text-toggle]'
  };
  register('password', {
    onLoad() {
      const toggleButton = n$1(sel$1.toggle, this.container);
      const textToggle = n$1(sel$1.textToggle, this.container);
      const socialButton = n$1('[data-social-share]', this.container);
      this.events = [e$2([toggleButton, textToggle], 'click', e => this.toggleView(e)), e$2(socialButton, 'click', e => {
        l(e.target, 'active');
        const sub = n$1('.password__share-icons', e.target);
        sub.setAttribute('aria-hidden', !a$1(e.target, 'active'));
      })];
    },

    toggleView() {
      l(this.container, 'welcome');
    },

    onUnload() {
      this.events.forEach(unsubscribe => unsubscribe());
    }

  });

  const selectors = {
    video: '.about__block-video'
  };
  register('page', {
    onLoad() {
      const videos = t$3(selectors.video, this.container);
      this.videoHandlers = [];

      if (videos.length) {
        videos.forEach(video => {
          this.videoHandlers.push(backgroundVideoHandler(video.parentNode));
        });
      }

      this.accordions = Accordions(t$3('.accordion', this.container));
      wrapIframes(t$3('iframe', this.container));
      wrapTables(t$3('table', this.container));
    },

    onUnload() {
      this.accordions.unload();
      this.videoHandlers.forEach(handler => handler());
    }

  });

  register('search', {
    onLoad() {
      const clearButton = n$1('[data-clear-search]', this.container);
      const searchButton = n$1('.search__submit', this.container);
      const searchInput = n$1('[data-search-input]', this.container);
      l([clearButton, searchButton], 'visible', searchInput.value !== '');
      this.events = [e$2(clearButton, 'click', () => {
        searchInput.value = '';
        l([clearButton, searchButton], 'visible', searchInput.value !== '');
      }), e$2(searchInput, 'input', e => l([clearButton, searchButton], 'visible', e.target.value !== ''))];
    },

    onUnload() {
      this.buttonHandler();
    }

  });

  register('contact', {
    onLoad() {
      this.accordions = Accordions(t$3('.accordion', this.container));
      wrapIframes(t$3('iframe', this.container));
      wrapTables(t$3('table', this.container));
    },

    onUnload() {
      this.accordions.unload();
    }

  });

  if (window.Shopify.designMode === true) {
    u(document.documentElement, 'theme-editor');
    document.documentElement.classList.add('theme-editor');
  } else {
    const el = n$1('.theme-editor-scroll-offset', document);
    el && el.parentNode.removeChild(el);
  } // Function to load all sections


  const loadSections = () => {
    load('*');
    o({
      SelectedProductSection: null
    });
  }; // Call above function either immediately or bind on loaded event


  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    loadSections();
  } else {
    e$2(document, 'DOMContentLoaded', loadSections);
  }

  if (isMobile$1({
    tablet: true,
    featureDetect: true
  })) {
    u(document.body, 'is-mobile');
  } // Page transitions


  pageTransition(); // a11y tab handler

  handleTab(); // Apply contrast classes

  sectionClasses(); // Setup modal

  const modalElement = n$1('[data-modal]', document);
  modal(modalElement); // Product availabilty drawer

  const availabilityDrawer = n$1('[data-store-availability-drawer]', document);
  storeAvailabilityDrawer(availabilityDrawer); // Make it easy to see exactly what theme version
  // this is by commit SHA

  window.SHA = 'eb270eea59';

  var js$1 = {exports: {}};

  var flickity = {exports: {}};

  var evEmitter = {exports: {}};

  /**
   * EvEmitter v1.1.0
   * Lil' event emitter
   * MIT License
   */

  (function (module) {
  /* jshint unused: true, undef: true, strict: true */

  ( function( global, factory ) {
    // universal module definition
    /* jshint strict: false */ /* globals define, module, window */
    if ( module.exports ) {
      // CommonJS - Browserify, Webpack
      module.exports = factory();
    } else {
      // Browser globals
      global.EvEmitter = factory();
    }

  }( typeof window != 'undefined' ? window : commonjsGlobal$1, function() {

  function EvEmitter() {}

  var proto = EvEmitter.prototype;

  proto.on = function( eventName, listener ) {
    if ( !eventName || !listener ) {
      return;
    }
    // set events hash
    var events = this._events = this._events || {};
    // set listeners array
    var listeners = events[ eventName ] = events[ eventName ] || [];
    // only add once
    if ( listeners.indexOf( listener ) == -1 ) {
      listeners.push( listener );
    }

    return this;
  };

  proto.once = function( eventName, listener ) {
    if ( !eventName || !listener ) {
      return;
    }
    // add event
    this.on( eventName, listener );
    // set once flag
    // set onceEvents hash
    var onceEvents = this._onceEvents = this._onceEvents || {};
    // set onceListeners object
    var onceListeners = onceEvents[ eventName ] = onceEvents[ eventName ] || {};
    // set flag
    onceListeners[ listener ] = true;

    return this;
  };

  proto.off = function( eventName, listener ) {
    var listeners = this._events && this._events[ eventName ];
    if ( !listeners || !listeners.length ) {
      return;
    }
    var index = listeners.indexOf( listener );
    if ( index != -1 ) {
      listeners.splice( index, 1 );
    }

    return this;
  };

  proto.emitEvent = function( eventName, args ) {
    var listeners = this._events && this._events[ eventName ];
    if ( !listeners || !listeners.length ) {
      return;
    }
    // copy over to avoid interference if .off() in listener
    listeners = listeners.slice(0);
    args = args || [];
    // once stuff
    var onceListeners = this._onceEvents && this._onceEvents[ eventName ];

    for ( var i=0; i < listeners.length; i++ ) {
      var listener = listeners[i];
      var isOnce = onceListeners && onceListeners[ listener ];
      if ( isOnce ) {
        // remove listener
        // remove before trigger to prevent recursion
        this.off( eventName, listener );
        // unset once flag
        delete onceListeners[ listener ];
      }
      // trigger listener
      listener.apply( this, args );
    }

    return this;
  };

  proto.allOff = function() {
    delete this._events;
    delete this._onceEvents;
  };

  return EvEmitter;

  }));
  }(evEmitter));

  var getSize = {exports: {}};

  /*!
   * getSize v2.0.3
   * measure size of elements
   * MIT license
   */

  (function (module) {
  /* jshint browser: true, strict: true, undef: true, unused: true */
  /* globals console: false */

  ( function( window, factory ) {
    /* jshint strict: false */ /* globals define, module */
    if ( module.exports ) {
      // CommonJS
      module.exports = factory();
    } else {
      // browser global
      window.getSize = factory();
    }

  })( window, function factory() {

  // -------------------------- helpers -------------------------- //

  // get a number from a string, not a percentage
  function getStyleSize( value ) {
    var num = parseFloat( value );
    // not a percent like '100%', and a number
    var isValid = value.indexOf('%') == -1 && !isNaN( num );
    return isValid && num;
  }

  function noop() {}

  var logError = typeof console == 'undefined' ? noop :
    function( message ) {
      console.error( message );
    };

  // -------------------------- measurements -------------------------- //

  var measurements = [
    'paddingLeft',
    'paddingRight',
    'paddingTop',
    'paddingBottom',
    'marginLeft',
    'marginRight',
    'marginTop',
    'marginBottom',
    'borderLeftWidth',
    'borderRightWidth',
    'borderTopWidth',
    'borderBottomWidth'
  ];

  var measurementsLength = measurements.length;

  function getZeroSize() {
    var size = {
      width: 0,
      height: 0,
      innerWidth: 0,
      innerHeight: 0,
      outerWidth: 0,
      outerHeight: 0
    };
    for ( var i=0; i < measurementsLength; i++ ) {
      var measurement = measurements[i];
      size[ measurement ] = 0;
    }
    return size;
  }

  // -------------------------- getStyle -------------------------- //

  /**
   * getStyle, get style of element, check for Firefox bug
   * https://bugzilla.mozilla.org/show_bug.cgi?id=548397
   */
  function getStyle( elem ) {
    var style = getComputedStyle( elem );
    if ( !style ) {
      logError( 'Style returned ' + style +
        '. Are you running this code in a hidden iframe on Firefox? ' +
        'See https://bit.ly/getsizebug1' );
    }
    return style;
  }

  // -------------------------- setup -------------------------- //

  var isSetup = false;

  var isBoxSizeOuter;

  /**
   * setup
   * check isBoxSizerOuter
   * do on first getSize() rather than on page load for Firefox bug
   */
  function setup() {
    // setup once
    if ( isSetup ) {
      return;
    }
    isSetup = true;

    // -------------------------- box sizing -------------------------- //

    /**
     * Chrome & Safari measure the outer-width on style.width on border-box elems
     * IE11 & Firefox<29 measures the inner-width
     */
    var div = document.createElement('div');
    div.style.width = '200px';
    div.style.padding = '1px 2px 3px 4px';
    div.style.borderStyle = 'solid';
    div.style.borderWidth = '1px 2px 3px 4px';
    div.style.boxSizing = 'border-box';

    var body = document.body || document.documentElement;
    body.appendChild( div );
    var style = getStyle( div );
    // round value for browser zoom. desandro/masonry#928
    isBoxSizeOuter = Math.round( getStyleSize( style.width ) ) == 200;
    getSize.isBoxSizeOuter = isBoxSizeOuter;

    body.removeChild( div );
  }

  // -------------------------- getSize -------------------------- //

  function getSize( elem ) {
    setup();

    // use querySeletor if elem is string
    if ( typeof elem == 'string' ) {
      elem = document.querySelector( elem );
    }

    // do not proceed on non-objects
    if ( !elem || typeof elem != 'object' || !elem.nodeType ) {
      return;
    }

    var style = getStyle( elem );

    // if hidden, everything is 0
    if ( style.display == 'none' ) {
      return getZeroSize();
    }

    var size = {};
    size.width = elem.offsetWidth;
    size.height = elem.offsetHeight;

    var isBorderBox = size.isBorderBox = style.boxSizing == 'border-box';

    // get all measurements
    for ( var i=0; i < measurementsLength; i++ ) {
      var measurement = measurements[i];
      var value = style[ measurement ];
      var num = parseFloat( value );
      // any 'auto', 'medium' value will be 0
      size[ measurement ] = !isNaN( num ) ? num : 0;
    }

    var paddingWidth = size.paddingLeft + size.paddingRight;
    var paddingHeight = size.paddingTop + size.paddingBottom;
    var marginWidth = size.marginLeft + size.marginRight;
    var marginHeight = size.marginTop + size.marginBottom;
    var borderWidth = size.borderLeftWidth + size.borderRightWidth;
    var borderHeight = size.borderTopWidth + size.borderBottomWidth;

    var isBorderBoxSizeOuter = isBorderBox && isBoxSizeOuter;

    // overwrite width and height if we can get it from style
    var styleWidth = getStyleSize( style.width );
    if ( styleWidth !== false ) {
      size.width = styleWidth +
        // add padding and border unless it's already including it
        ( isBorderBoxSizeOuter ? 0 : paddingWidth + borderWidth );
    }

    var styleHeight = getStyleSize( style.height );
    if ( styleHeight !== false ) {
      size.height = styleHeight +
        // add padding and border unless it's already including it
        ( isBorderBoxSizeOuter ? 0 : paddingHeight + borderHeight );
    }

    size.innerWidth = size.width - ( paddingWidth + borderWidth );
    size.innerHeight = size.height - ( paddingHeight + borderHeight );

    size.outerWidth = size.width + marginWidth;
    size.outerHeight = size.height + marginHeight;

    return size;
  }

  return getSize;

  });
  }(getSize));

  var utils = {exports: {}};

  var matchesSelector = {exports: {}};

  /**
   * matchesSelector v2.0.2
   * matchesSelector( element, '.selector' )
   * MIT license
   */

  (function (module) {
  /*jshint browser: true, strict: true, undef: true, unused: true */

  ( function( window, factory ) {
    // universal module definition
    if ( module.exports ) {
      // CommonJS
      module.exports = factory();
    } else {
      // browser global
      window.matchesSelector = factory();
    }

  }( window, function factory() {

    var matchesMethod = ( function() {
      var ElemProto = window.Element.prototype;
      // check for the standard method name first
      if ( ElemProto.matches ) {
        return 'matches';
      }
      // check un-prefixed
      if ( ElemProto.matchesSelector ) {
        return 'matchesSelector';
      }
      // check vendor prefixes
      var prefixes = [ 'webkit', 'moz', 'ms', 'o' ];

      for ( var i=0; i < prefixes.length; i++ ) {
        var prefix = prefixes[i];
        var method = prefix + 'MatchesSelector';
        if ( ElemProto[ method ] ) {
          return method;
        }
      }
    })();

    return function matchesSelector( elem, selector ) {
      return elem[ matchesMethod ]( selector );
    };

  }));
  }(matchesSelector));

  /**
   * Fizzy UI utils v2.0.7
   * MIT license
   */

  (function (module) {
  /*jshint browser: true, undef: true, unused: true, strict: true */

  ( function( window, factory ) {
    // universal module definition
    /*jshint strict: false */ /*globals define, module, require */

    if ( module.exports ) {
      // CommonJS
      module.exports = factory(
        window,
        matchesSelector.exports
      );
    } else {
      // browser global
      window.fizzyUIUtils = factory(
        window,
        window.matchesSelector
      );
    }

  }( window, function factory( window, matchesSelector ) {

  var utils = {};

  // ----- extend ----- //

  // extends objects
  utils.extend = function( a, b ) {
    for ( var prop in b ) {
      a[ prop ] = b[ prop ];
    }
    return a;
  };

  // ----- modulo ----- //

  utils.modulo = function( num, div ) {
    return ( ( num % div ) + div ) % div;
  };

  // ----- makeArray ----- //

  var arraySlice = Array.prototype.slice;

  // turn element or nodeList into an array
  utils.makeArray = function( obj ) {
    if ( Array.isArray( obj ) ) {
      // use object if already an array
      return obj;
    }
    // return empty array if undefined or null. #6
    if ( obj === null || obj === undefined ) {
      return [];
    }

    var isArrayLike = typeof obj == 'object' && typeof obj.length == 'number';
    if ( isArrayLike ) {
      // convert nodeList to array
      return arraySlice.call( obj );
    }

    // array of single index
    return [ obj ];
  };

  // ----- removeFrom ----- //

  utils.removeFrom = function( ary, obj ) {
    var index = ary.indexOf( obj );
    if ( index != -1 ) {
      ary.splice( index, 1 );
    }
  };

  // ----- getParent ----- //

  utils.getParent = function( elem, selector ) {
    while ( elem.parentNode && elem != document.body ) {
      elem = elem.parentNode;
      if ( matchesSelector( elem, selector ) ) {
        return elem;
      }
    }
  };

  // ----- getQueryElement ----- //

  // use element as selector string
  utils.getQueryElement = function( elem ) {
    if ( typeof elem == 'string' ) {
      return document.querySelector( elem );
    }
    return elem;
  };

  // ----- handleEvent ----- //

  // enable .ontype to trigger from .addEventListener( elem, 'type' )
  utils.handleEvent = function( event ) {
    var method = 'on' + event.type;
    if ( this[ method ] ) {
      this[ method ]( event );
    }
  };

  // ----- filterFindElements ----- //

  utils.filterFindElements = function( elems, selector ) {
    // make array of elems
    elems = utils.makeArray( elems );
    var ffElems = [];

    elems.forEach( function( elem ) {
      // check that elem is an actual element
      if ( !( elem instanceof HTMLElement ) ) {
        return;
      }
      // add elem if no selector
      if ( !selector ) {
        ffElems.push( elem );
        return;
      }
      // filter & find items if we have a selector
      // filter
      if ( matchesSelector( elem, selector ) ) {
        ffElems.push( elem );
      }
      // find children
      var childElems = elem.querySelectorAll( selector );
      // concat childElems to filterFound array
      for ( var i=0; i < childElems.length; i++ ) {
        ffElems.push( childElems[i] );
      }
    });

    return ffElems;
  };

  // ----- debounceMethod ----- //

  utils.debounceMethod = function( _class, methodName, threshold ) {
    threshold = threshold || 100;
    // original method
    var method = _class.prototype[ methodName ];
    var timeoutName = methodName + 'Timeout';

    _class.prototype[ methodName ] = function() {
      var timeout = this[ timeoutName ];
      clearTimeout( timeout );

      var args = arguments;
      var _this = this;
      this[ timeoutName ] = setTimeout( function() {
        method.apply( _this, args );
        delete _this[ timeoutName ];
      }, threshold );
    };
  };

  // ----- docReady ----- //

  utils.docReady = function( callback ) {
    var readyState = document.readyState;
    if ( readyState == 'complete' || readyState == 'interactive' ) {
      // do async to allow for other scripts to run. metafizzy/flickity#441
      setTimeout( callback );
    } else {
      document.addEventListener( 'DOMContentLoaded', callback );
    }
  };

  // ----- htmlInit ----- //

  // http://jamesroberts.name/blog/2010/02/22/string-functions-for-javascript-trim-to-camel-case-to-dashed-and-to-underscore/
  utils.toDashed = function( str ) {
    return str.replace( /(.)([A-Z])/g, function( match, $1, $2 ) {
      return $1 + '-' + $2;
    }).toLowerCase();
  };

  var console = window.console;
  /**
   * allow user to initialize classes via [data-namespace] or .js-namespace class
   * htmlInit( Widget, 'widgetName' )
   * options are parsed from data-namespace-options
   */
  utils.htmlInit = function( WidgetClass, namespace ) {
    utils.docReady( function() {
      var dashedNamespace = utils.toDashed( namespace );
      var dataAttr = 'data-' + dashedNamespace;
      var dataAttrElems = document.querySelectorAll( '[' + dataAttr + ']' );
      var jsDashElems = document.querySelectorAll( '.js-' + dashedNamespace );
      var elems = utils.makeArray( dataAttrElems )
        .concat( utils.makeArray( jsDashElems ) );
      var dataOptionsAttr = dataAttr + '-options';
      var jQuery = window.jQuery;

      elems.forEach( function( elem ) {
        var attr = elem.getAttribute( dataAttr ) ||
          elem.getAttribute( dataOptionsAttr );
        var options;
        try {
          options = attr && JSON.parse( attr );
        } catch ( error ) {
          // log error, do not initialize
          if ( console ) {
            console.error( 'Error parsing ' + dataAttr + ' on ' + elem.className +
            ': ' + error );
          }
          return;
        }
        // initialize
        var instance = new WidgetClass( elem, options );
        // make available via $().data('namespace')
        if ( jQuery ) {
          jQuery.data( elem, namespace, instance );
        }
      });

    });
  };

  // -----  ----- //

  return utils;

  }));
  }(utils));

  var cell = {exports: {}};

  (function (module) {
  // Flickity.Cell
  ( function( window, factory ) {
    // universal module definition
    if ( module.exports ) {
      // CommonJS
      module.exports = factory(
          window,
          getSize.exports
      );
    } else {
      // browser global
      window.Flickity = window.Flickity || {};
      window.Flickity.Cell = factory(
          window,
          window.getSize
      );
    }

  }( window, function factory( window, getSize ) {

  function Cell( elem, parent ) {
    this.element = elem;
    this.parent = parent;

    this.create();
  }

  var proto = Cell.prototype;

  proto.create = function() {
    this.element.style.position = 'absolute';
    this.element.setAttribute( 'aria-hidden', 'true' );
    this.x = 0;
    this.shift = 0;
  };

  proto.destroy = function() {
    // reset style
    this.unselect();
    this.element.style.position = '';
    var side = this.parent.originSide;
    this.element.style[ side ] = '';
    this.element.removeAttribute('aria-hidden');
  };

  proto.getSize = function() {
    this.size = getSize( this.element );
  };

  proto.setPosition = function( x ) {
    this.x = x;
    this.updateTarget();
    this.renderPosition( x );
  };

  // setDefaultTarget v1 method, backwards compatibility, remove in v3
  proto.updateTarget = proto.setDefaultTarget = function() {
    var marginProperty = this.parent.originSide == 'left' ? 'marginLeft' : 'marginRight';
    this.target = this.x + this.size[ marginProperty ] +
      this.size.width * this.parent.cellAlign;
  };

  proto.renderPosition = function( x ) {
    // render position of cell with in slider
    var side = this.parent.originSide;
    this.element.style[ side ] = this.parent.getPositionValue( x );
  };

  proto.select = function() {
    this.element.classList.add('is-selected');
    this.element.removeAttribute('aria-hidden');
  };

  proto.unselect = function() {
    this.element.classList.remove('is-selected');
    this.element.setAttribute( 'aria-hidden', 'true' );
  };

  /**
   * @param {Integer} shift - 0, 1, or -1
   */
  proto.wrapShift = function( shift ) {
    this.shift = shift;
    this.renderPosition( this.x + this.parent.slideableWidth * shift );
  };

  proto.remove = function() {
    this.element.parentNode.removeChild( this.element );
  };

  return Cell;

  } ) );
  }(cell));

  var slide = {exports: {}};

  (function (module) {
  // slide
  ( function( window, factory ) {
    // universal module definition
    if ( module.exports ) {
      // CommonJS
      module.exports = factory();
    } else {
      // browser global
      window.Flickity = window.Flickity || {};
      window.Flickity.Slide = factory();
    }

  }( window, function factory() {

  function Slide( parent ) {
    this.parent = parent;
    this.isOriginLeft = parent.originSide == 'left';
    this.cells = [];
    this.outerWidth = 0;
    this.height = 0;
  }

  var proto = Slide.prototype;

  proto.addCell = function( cell ) {
    this.cells.push( cell );
    this.outerWidth += cell.size.outerWidth;
    this.height = Math.max( cell.size.outerHeight, this.height );
    // first cell stuff
    if ( this.cells.length == 1 ) {
      this.x = cell.x; // x comes from first cell
      var beginMargin = this.isOriginLeft ? 'marginLeft' : 'marginRight';
      this.firstMargin = cell.size[ beginMargin ];
    }
  };

  proto.updateTarget = function() {
    var endMargin = this.isOriginLeft ? 'marginRight' : 'marginLeft';
    var lastCell = this.getLastCell();
    var lastMargin = lastCell ? lastCell.size[ endMargin ] : 0;
    var slideWidth = this.outerWidth - ( this.firstMargin + lastMargin );
    this.target = this.x + this.firstMargin + slideWidth * this.parent.cellAlign;
  };

  proto.getLastCell = function() {
    return this.cells[ this.cells.length - 1 ];
  };

  proto.select = function() {
    this.parent.checkVisibility();
    
    this.cells.forEach( function( cell ) {
      cell.select();
    } );
  };

  proto.unselect = function() {
    this.cells.forEach( function( cell ) {
      cell.unselect();
    } );
  };

  proto.getCellElements = function() {
    return this.cells.map( function( cell ) {
      return cell.element;
    } );
  };

  return Slide;

  } ) );
  }(slide));

  var animate = {exports: {}};

  (function (module) {
  // animate
  ( function( window, factory ) {
    // universal module definition
    if ( module.exports ) {
      // CommonJS
      module.exports = factory(
          window,
          utils.exports
      );
    } else {
      // browser global
      window.Flickity = window.Flickity || {};
      window.Flickity.animatePrototype = factory(
          window,
          window.fizzyUIUtils
      );
    }

  }( window, function factory( window, utils ) {

  // -------------------------- animate -------------------------- //

  var proto = {};

  proto.startAnimation = function() {
    if ( this.isAnimating ) {
      return;
    }

    this.isAnimating = true;
    this.restingFrames = 0;
    this.animate();
  };

  proto.animate = function() {
    this.applyDragForce();
    this.applySelectedAttraction();

    var previousX = this.x;

    this.integratePhysics();
    this.positionSlider();
    this.settle( previousX );
    // animate next frame
    if ( this.isAnimating ) {
      var _this = this;
      requestAnimationFrame( function animateFrame() {
        _this.animate();
      } );
    }
  };

  proto.positionSlider = function() {
    var x = this.x;
    // wrap position around
    if ( this.options.wrapAround && this.cells.length > 1 ) {
      x = utils.modulo( x, this.slideableWidth );
      x -= this.slideableWidth;
      this.shiftWrapCells( x );
    }

    this.setTranslateX( x, this.isAnimating );
    this.dispatchScrollEvent();
  };

  proto.setTranslateX = function( x, is3d ) {
    x += this.cursorPosition;
    // reverse if right-to-left and using transform
    x = this.options.rightToLeft ? -x : x;
    var translateX = this.getPositionValue( x );
    // use 3D transforms for hardware acceleration on iOS
    // but use 2D when settled, for better font-rendering
    this.slider.style.transform = is3d ?
      'translate3d(' + translateX + ',0,0)' : 'translateX(' + translateX + ')';
  };

  proto.dispatchScrollEvent = function() {
    var firstSlide = this.slides[0];
    if ( !firstSlide ) {
      return;
    }
    var positionX = -this.x - firstSlide.target;
    var progress = positionX / this.slidesWidth;
    this.dispatchEvent( 'scroll', null, [ progress, positionX ] );
  };

  proto.positionSliderAtSelected = function() {
    if ( !this.cells.length ) {
      return;
    }
    this.x = -this.selectedSlide.target;
    this.velocity = 0; // stop wobble
    this.positionSlider();
  };

  proto.getPositionValue = function( position ) {
    if ( this.options.percentPosition ) {
      // percent position, round to 2 digits, like 12.34%
      return ( Math.round( ( position / this.size.innerWidth ) * 10000 ) * 0.01 ) + '%';
    } else {
      // pixel positioning
      return Math.round( position ) + 'px';
    }
  };

  proto.settle = function( previousX ) {
    // keep track of frames where x hasn't moved
    var isResting = !this.isPointerDown &&
        Math.round( this.x * 100 ) == Math.round( previousX * 100 );
    if ( isResting ) {
      this.restingFrames++;
    }
    // stop animating if resting for 3 or more frames
    if ( this.restingFrames > 2 ) {
      this.isAnimating = false;
      delete this.isFreeScrolling;
      // render position with translateX when settled
      this.positionSlider();
      this.dispatchEvent( 'settle', null, [ this.selectedIndex ] );
    }

    this.checkVisibility();
  };

  proto.shiftWrapCells = function( x ) {
    // shift before cells
    var beforeGap = this.cursorPosition + x;
    this._shiftCells( this.beforeShiftCells, beforeGap, -1 );
    // shift after cells
    var afterGap = this.size.innerWidth - ( x + this.slideableWidth + this.cursorPosition );
    this._shiftCells( this.afterShiftCells, afterGap, 1 );
  };

  proto._shiftCells = function( cells, gap, shift ) {
    for ( var i = 0; i < cells.length; i++ ) {
      var cell = cells[i];
      var cellShift = gap > 0 ? shift : 0;
      cell.wrapShift( cellShift );
      gap -= cell.size.outerWidth;
    }
  };

  proto._unshiftCells = function( cells ) {
    if ( !cells || !cells.length ) {
      return;
    }
    for ( var i = 0; i < cells.length; i++ ) {
      cells[i].wrapShift( 0 );
    }
  };

  // -------------------------- physics -------------------------- //

  proto.integratePhysics = function() {
    this.x += this.velocity;
    this.velocity *= this.getFrictionFactor();
  };

  proto.applyForce = function( force ) {
    this.velocity += force;
  };

  proto.getFrictionFactor = function() {
    return 1 - this.options[ this.isFreeScrolling ? 'freeScrollFriction' : 'friction' ];
  };

  proto.getRestingPosition = function() {
    // my thanks to Steven Wittens, who simplified this math greatly
    return this.x + this.velocity / ( 1 - this.getFrictionFactor() );
  };

  proto.applyDragForce = function() {
    if ( !this.isDraggable || !this.isPointerDown ) {
      return;
    }
    // change the position to drag position by applying force
    var dragVelocity = this.dragX - this.x;
    var dragForce = dragVelocity - this.velocity;
    this.applyForce( dragForce );
  };

  proto.applySelectedAttraction = function() {
    // do not attract if pointer down or no slides
    var dragDown = this.isDraggable && this.isPointerDown;
    if ( dragDown || this.isFreeScrolling || !this.slides.length ) {
      return;
    }
    var distance = this.selectedSlide.target * -1 - this.x;
    var force = distance * this.options.selectedAttraction;
    this.applyForce( force );
  };

  return proto;

  } ) );
  }(animate));

  (function (module) {
  // Flickity main
  /* eslint-disable max-params */
  ( function( window, factory ) {
    // universal module definition
    if ( module.exports ) {
      // CommonJS
      module.exports = factory(
          window,
          evEmitter.exports,
          getSize.exports,
          utils.exports,
          cell.exports,
          slide.exports,
          animate.exports
      );
    } else {
      // browser global
      var _Flickity = window.Flickity;

      window.Flickity = factory(
          window,
          window.EvEmitter,
          window.getSize,
          window.fizzyUIUtils,
          _Flickity.Cell,
          _Flickity.Slide,
          _Flickity.animatePrototype
      );
    }

  }( window, function factory( window, EvEmitter, getSize,
      utils, Cell, Slide, animatePrototype ) {

  // vars
  var jQuery = window.jQuery;
  var getComputedStyle = window.getComputedStyle;
  var console = window.console;

  function moveElements( elems, toElem ) {
    elems = utils.makeArray( elems );
    while ( elems.length ) {
      toElem.appendChild( elems.shift() );
    }
  }

  // -------------------------- Flickity -------------------------- //

  // globally unique identifiers
  var GUID = 0;
  // internal store of all Flickity intances
  var instances = {};

  function Flickity( element, options ) {
    var queryElement = utils.getQueryElement( element );
    if ( !queryElement ) {
      if ( console ) {
        console.error( 'Bad element for Flickity: ' + ( queryElement || element ) );
      }
      return;
    }
    this.element = queryElement;
    // do not initialize twice on same element
    if ( this.element.flickityGUID ) {
      var instance = instances[ this.element.flickityGUID ];
      if ( instance ) instance.option( options );
      return instance;
    }

    // add jQuery
    if ( jQuery ) {
      this.$element = jQuery( this.element );
    }
    // options
    this.options = utils.extend( {}, this.constructor.defaults );
    this.option( options );

    // kick things off
    this._create();
  }

  Flickity.defaults = {
    accessibility: true,
    // adaptiveHeight: false,
    cellAlign: 'center',
    // cellSelector: undefined,
    // contain: false,
    freeScrollFriction: 0.075, // friction when free-scrolling
    friction: 0.28, // friction when selecting
    namespaceJQueryEvents: true,
    // initialIndex: 0,
    percentPosition: true,
    resize: true,
    selectedAttraction: 0.025,
    setGallerySize: true,
    // watchCSS: false,
    // wrapAround: false
  };

  // hash of methods triggered on _create()
  Flickity.createMethods = [];

  var proto = Flickity.prototype;
  // inherit EventEmitter
  utils.extend( proto, EvEmitter.prototype );

  proto._create = function() {
    // add id for Flickity.data
    var id = this.guid = ++GUID;
    this.element.flickityGUID = id; // expando
    instances[ id ] = this; // associate via id
    // initial properties
    this.selectedIndex = 0;
    // how many frames slider has been in same position
    this.restingFrames = 0;
    // initial physics properties
    this.x = 0;
    this.velocity = 0;
    this.originSide = this.options.rightToLeft ? 'right' : 'left';
    // create viewport & slider
    this.viewport = document.createElement('div');
    this.viewport.className = 'flickity-viewport';
    this._createSlider();

    if ( this.options.resize || this.options.watchCSS ) {
      window.addEventListener( 'resize', this );
    }

    // add listeners from on option
    for ( var eventName in this.options.on ) {
      var listener = this.options.on[ eventName ];
      this.on( eventName, listener );
    }

    Flickity.createMethods.forEach( function( method ) {
      this[ method ]();
    }, this );

    if ( this.options.watchCSS ) {
      this.watchCSS();
    } else {
      this.activate();
    }

  };

  /**
   * set options
   * @param {Object} opts - options to extend
   */
  proto.option = function( opts ) {
    utils.extend( this.options, opts );
  };

  proto.activate = function() {
    if ( this.isActive ) {
      return;
    }
    this.isActive = true;
    this.element.classList.add('flickity-enabled');
    if ( this.options.rightToLeft ) {
      this.element.classList.add('flickity-rtl');
    }

    this.getSize();
    // move initial cell elements so they can be loaded as cells
    var cellElems = this._filterFindCellElements( this.element.children );
    moveElements( cellElems, this.slider );
    this.viewport.appendChild( this.slider );
    this.element.appendChild( this.viewport );
    // get cells from children
    this.reloadCells();

    if ( this.options.accessibility ) {
      // allow element to focusable
      this.element.tabIndex = 0;
      // listen for key presses
      this.element.addEventListener( 'keydown', this );
    }

    this.emitEvent('activate');
    this.selectInitialIndex();
    // flag for initial activation, for using initialIndex
    this.isInitActivated = true;
    // ready event. #493
    this.dispatchEvent('ready');
  };

  // slider positions the cells
  proto._createSlider = function() {
    // slider element does all the positioning
    var slider = document.createElement('div');
    slider.className = 'flickity-slider';
    slider.style[ this.originSide ] = 0;
    this.slider = slider;
  };

  proto._filterFindCellElements = function( elems ) {
    return utils.filterFindElements( elems, this.options.cellSelector );
  };

  // goes through all children
  proto.reloadCells = function() {
    // collection of item elements
    this.cells = this._makeCells( this.slider.children );
    this.positionCells();
    this._getWrapShiftCells();
    this.setGallerySize();
  };

  /**
   * turn elements into Flickity.Cells
   * @param {[Array, NodeList, HTMLElement]} elems - elements to make into cells
   * @returns {Array} items - collection of new Flickity Cells
   */
  proto._makeCells = function( elems ) {
    var cellElems = this._filterFindCellElements( elems );

    // create new Flickity for collection
    var cells = cellElems.map( function( cellElem ) {
      return new Cell( cellElem, this );
    }, this );

    return cells;
  };

  proto.getLastCell = function() {
    return this.cells[ this.cells.length - 1 ];
  };

  proto.getLastSlide = function() {
    return this.slides[ this.slides.length - 1 ];
  };

  // positions all cells
  proto.positionCells = function() {
    // size all cells
    this._sizeCells( this.cells );
    // position all cells
    this._positionCells( 0 );
  };

  /**
   * position certain cells
   * @param {Integer} index - which cell to start with
   */
  proto._positionCells = function( index ) {
    index = index || 0;
    // also measure maxCellHeight
    // start 0 if positioning all cells
    this.maxCellHeight = index ? this.maxCellHeight || 0 : 0;
    var cellX = 0;
    // get cellX
    if ( index > 0 ) {
      var startCell = this.cells[ index - 1 ];
      cellX = startCell.x + startCell.size.outerWidth;
    }
    var len = this.cells.length;
    for ( var i = index; i < len; i++ ) {
      var cell = this.cells[i];
      cell.setPosition( cellX );
      cellX += cell.size.outerWidth;
      this.maxCellHeight = Math.max( cell.size.outerHeight, this.maxCellHeight );
    }
    // keep track of cellX for wrap-around
    this.slideableWidth = cellX;
    // slides
    this.updateSlides();
    // contain slides target
    this._containSlides();
    // update slidesWidth
    this.slidesWidth = len ? this.getLastSlide().target - this.slides[0].target : 0;
  };

  /**
   * cell.getSize() on multiple cells
   * @param {Array} cells - cells to size
   */
  proto._sizeCells = function( cells ) {
    cells.forEach( function( cell ) {
      cell.getSize();
    } );
  };

  // --------------------------  -------------------------- //

  proto.updateSlides = function() {
    this.slides = [];
    if ( !this.cells.length ) {
      return;
    }

    var slide = new Slide( this );
    this.slides.push( slide );
    var isOriginLeft = this.originSide == 'left';
    var nextMargin = isOriginLeft ? 'marginRight' : 'marginLeft';

    var canCellFit = this._getCanCellFit();

    this.cells.forEach( function( cell, i ) {
      // just add cell if first cell in slide
      if ( !slide.cells.length ) {
        slide.addCell( cell );
        return;
      }

      var slideWidth = ( slide.outerWidth - slide.firstMargin ) +
        ( cell.size.outerWidth - cell.size[ nextMargin ] );

      if ( canCellFit.call( this, i, slideWidth ) ) {
        slide.addCell( cell );
      } else {
        // doesn't fit, new slide
        slide.updateTarget();

        slide = new Slide( this );
        this.slides.push( slide );
        slide.addCell( cell );
      }
    }, this );
    // last slide
    slide.updateTarget();
    // update .selectedSlide
    this.updateSelectedSlide();
  };

  proto._getCanCellFit = function() {
    var groupCells = this.options.groupCells;
    if ( !groupCells ) {
      return function() {
        return false;
      };
    } else if ( typeof groupCells == 'number' ) {
      // group by number. 3 -> [0,1,2], [3,4,5], ...
      var number = parseInt( groupCells, 10 );
      return function( i ) {
        return ( i % number ) !== 0;
      };
    }
    // default, group by width of slide
    // parse '75%
    var percentMatch = typeof groupCells == 'string' &&
      groupCells.match( /^(\d+)%$/ );
    var percent = percentMatch ? parseInt( percentMatch[1], 10 ) / 100 : 1;
    return function( i, slideWidth ) {
      /* eslint-disable-next-line no-invalid-this */
      return slideWidth <= ( this.size.innerWidth + 1 ) * percent;
    };
  };

  // alias _init for jQuery plugin .flickity()
  proto._init =
  proto.reposition = function() {
    this.positionCells();
    this.positionSliderAtSelected();
  };

  proto.getSize = function() {
    this.size = getSize( this.element );
    this.setCellAlign();
    this.cursorPosition = this.size.innerWidth * this.cellAlign;
  };

  var cellAlignShorthands = {
    // cell align, then based on origin side
    center: {
      left: 0.5,
      right: 0.5,
    },
    left: {
      left: 0,
      right: 1,
    },
    right: {
      right: 0,
      left: 1,
    },
  };

  proto.setCellAlign = function() {
    var shorthand = cellAlignShorthands[ this.options.cellAlign ];
    this.cellAlign = shorthand ? shorthand[ this.originSide ] : this.options.cellAlign;
  };

  proto.setGallerySize = function() {
    if ( this.options.setGallerySize ) {
      var height = this.options.adaptiveHeight && this.selectedSlide ?
        this.selectedSlide.height : this.maxCellHeight;
      this.viewport.style.height = height + 'px';
    }
  };

  proto._getWrapShiftCells = function() {
    // only for wrap-around
    if ( !this.options.wrapAround ) {
      return;
    }
    // unshift previous cells
    this._unshiftCells( this.beforeShiftCells );
    this._unshiftCells( this.afterShiftCells );
    // get before cells
    // initial gap
    var gapX = this.cursorPosition;
    var cellIndex = this.cells.length - 1;
    this.beforeShiftCells = this._getGapCells( gapX, cellIndex, -1 );
    // get after cells
    // ending gap between last cell and end of gallery viewport
    gapX = this.size.innerWidth - this.cursorPosition;
    // start cloning at first cell, working forwards
    this.afterShiftCells = this._getGapCells( gapX, 0, 1 );
  };

  proto._getGapCells = function( gapX, cellIndex, increment ) {
    // keep adding cells until the cover the initial gap
    var cells = [];
    while ( gapX > 0 ) {
      var cell = this.cells[ cellIndex ];
      if ( !cell ) {
        break;
      }
      cells.push( cell );
      cellIndex += increment;
      gapX -= cell.size.outerWidth;
    }
    return cells;
  };

  // ----- contain ----- //

  // contain cell targets so no excess sliding
  proto._containSlides = function() {
    if ( !this.options.contain || this.options.wrapAround || !this.cells.length ) {
      return;
    }
    var isRightToLeft = this.options.rightToLeft;
    var beginMargin = isRightToLeft ? 'marginRight' : 'marginLeft';
    var endMargin = isRightToLeft ? 'marginLeft' : 'marginRight';
    var contentWidth = this.slideableWidth - this.getLastCell().size[ endMargin ];
    // content is less than gallery size
    var isContentSmaller = contentWidth < this.size.innerWidth;
    // bounds
    var beginBound = this.cursorPosition + this.cells[0].size[ beginMargin ];
    var endBound = contentWidth - this.size.innerWidth * ( 1 - this.cellAlign );
    // contain each cell target
    this.slides.forEach( function( slide ) {
      if ( isContentSmaller ) {
        // all cells fit inside gallery
        slide.target = contentWidth * this.cellAlign;
      } else {
        // contain to bounds
        slide.target = Math.max( slide.target, beginBound );
        slide.target = Math.min( slide.target, endBound );
      }
    }, this );
  };

  // -----  ----- //

  /**
   * emits events via eventEmitter and jQuery events
   * @param {String} type - name of event
   * @param {Event} event - original event
   * @param {Array} args - extra arguments
   */
  proto.dispatchEvent = function( type, event, args ) {
    var emitArgs = event ? [ event ].concat( args ) : args;
    this.emitEvent( type, emitArgs );

    if ( jQuery && this.$element ) {
      // default trigger with type if no event
      type += this.options.namespaceJQueryEvents ? '.flickity' : '';
      var $event = type;
      if ( event ) {
        // create jQuery event
        var jQEvent = new jQuery.Event( event );
        jQEvent.type = type;
        $event = jQEvent;
      }
      this.$element.trigger( $event, args );
    }
  };

  // -------------------------- select -------------------------- //

  /**
   * @param {Integer} index - index of the slide
   * @param {Boolean} isWrap - will wrap-around to last/first if at the end
   * @param {Boolean} isInstant - will immediately set position at selected cell
   */
  proto.select = function( index, isWrap, isInstant ) {
    if ( !this.isActive ) {
      return;
    }
    index = parseInt( index, 10 );
    this._wrapSelect( index );

    if ( this.options.wrapAround || isWrap ) {
      index = utils.modulo( index, this.slides.length );
    }
    // bail if invalid index
    if ( !this.slides[ index ] ) {
      return;
    }
    var prevIndex = this.selectedIndex;
    this.selectedIndex = index;
    this.updateSelectedSlide();
    if ( isInstant ) {
      this.positionSliderAtSelected();
    } else {
      this.startAnimation();
    }
    if ( this.options.adaptiveHeight ) {
      this.setGallerySize();
    }
    // events
    this.dispatchEvent( 'select', null, [ index ] );
    // change event if new index
    if ( index != prevIndex ) {
      this.dispatchEvent( 'change', null, [ index ] );
    }
    // old v1 event name, remove in v3
    this.dispatchEvent('cellSelect');
  };

  // wraps position for wrapAround, to move to closest slide. #113
  proto._wrapSelect = function( index ) {
    var len = this.slides.length;
    var isWrapping = this.options.wrapAround && len > 1;
    if ( !isWrapping ) {
      return index;
    }
    var wrapIndex = utils.modulo( index, len );
    // go to shortest
    var delta = Math.abs( wrapIndex - this.selectedIndex );
    var backWrapDelta = Math.abs( ( wrapIndex + len ) - this.selectedIndex );
    var forewardWrapDelta = Math.abs( ( wrapIndex - len ) - this.selectedIndex );
    if ( !this.isDragSelect && backWrapDelta < delta ) {
      index += len;
    } else if ( !this.isDragSelect && forewardWrapDelta < delta ) {
      index -= len;
    }
    // wrap position so slider is within normal area
    if ( index < 0 ) {
      this.x -= this.slideableWidth;
    } else if ( index >= len ) {
      this.x += this.slideableWidth;
    }
  };

  proto.previous = function( isWrap, isInstant ) {
    this.select( this.selectedIndex - 1, isWrap, isInstant );
  };

  proto.next = function( isWrap, isInstant ) {
    this.select( this.selectedIndex + 1, isWrap, isInstant );
  };

  proto.updateSelectedSlide = function() {
    var slide = this.slides[ this.selectedIndex ];
    // selectedIndex could be outside of slides, if triggered before resize()
    if ( !slide ) {
      return;
    }
    // unselect previous selected slide
    this.unselectSelectedSlide();
    // update new selected slide
    this.selectedSlide = slide;
    slide.select();
    this.selectedCells = slide.cells;
    this.selectedElements = slide.getCellElements();
    // HACK: selectedCell & selectedElement is first cell in slide, backwards compatibility
    // Remove in v3?
    this.selectedCell = slide.cells[0];
    this.selectedElement = this.selectedElements[0];
  };

  proto.unselectSelectedSlide = function() {
    if ( this.selectedSlide ) {
      this.selectedSlide.unselect();
    }
  };

  proto.selectInitialIndex = function() {
    var initialIndex = this.options.initialIndex;
    // already activated, select previous selectedIndex
    if ( this.isInitActivated ) {
      this.select( this.selectedIndex, false, true );
      return;
    }
    // select with selector string
    if ( initialIndex && typeof initialIndex == 'string' ) {
      var cell = this.queryCell( initialIndex );
      if ( cell ) {
        this.selectCell( initialIndex, false, true );
        return;
      }
    }

    var index = 0;
    // select with number
    if ( initialIndex && this.slides[ initialIndex ] ) {
      index = initialIndex;
    }
    // select instantly
    this.select( index, false, true );
  };

  /**
   * select slide from number or cell element
   * @param {[Element, Number]} value - zero-based index or element to select
   * @param {Boolean} isWrap - enables wrapping around for extra index
   * @param {Boolean} isInstant - disables slide animation
   */
  proto.selectCell = function( value, isWrap, isInstant ) {
    // get cell
    var cell = this.queryCell( value );
    if ( !cell ) {
      return;
    }

    var index = this.getCellSlideIndex( cell );
    this.select( index, isWrap, isInstant );
  };

  proto.getCellSlideIndex = function( cell ) {
    // get index of slides that has cell
    for ( var i = 0; i < this.slides.length; i++ ) {
      var slide = this.slides[i];
      var index = slide.cells.indexOf( cell );
      if ( index != -1 ) {
        return i;
      }
    }
  };

  // -------------------------- get cells -------------------------- //

  /**
   * get Flickity.Cell, given an Element
   * @param {Element} elem - matching cell element
   * @returns {Flickity.Cell} cell - matching cell
   */
  proto.getCell = function( elem ) {
    // loop through cells to get the one that matches
    for ( var i = 0; i < this.cells.length; i++ ) {
      var cell = this.cells[i];
      if ( cell.element == elem ) {
        return cell;
      }
    }
  };

  /**
   * get collection of Flickity.Cells, given Elements
   * @param {[Element, Array, NodeList]} elems - multiple elements
   * @returns {Array} cells - Flickity.Cells
   */
  proto.getCells = function( elems ) {
    elems = utils.makeArray( elems );
    var cells = [];
    elems.forEach( function( elem ) {
      var cell = this.getCell( elem );
      if ( cell ) {
        cells.push( cell );
      }
    }, this );
    return cells;
  };

  /**
   * get cell elements
   * @returns {Array} cellElems
   */
  proto.getCellElements = function() {
    return this.cells.map( function( cell ) {
      return cell.element;
    } );
  };

  /**
   * get parent cell from an element
   * @param {Element} elem - child element
   * @returns {Flickit.Cell} cell - parent cell
   */
  proto.getParentCell = function( elem ) {
    // first check if elem is cell
    var cell = this.getCell( elem );
    if ( cell ) {
      return cell;
    }
    // try to get parent cell elem
    elem = utils.getParent( elem, '.flickity-slider > *' );
    return this.getCell( elem );
  };

  /**
   * get cells adjacent to a slide
   * @param {Integer} adjCount - number of adjacent slides
   * @param {Integer} index - index of slide to start
   * @returns {Array} cells - array of Flickity.Cells
   */
  proto.getAdjacentCellElements = function( adjCount, index ) {
    if ( !adjCount ) {
      return this.selectedSlide.getCellElements();
    }
    index = index === undefined ? this.selectedIndex : index;

    var len = this.slides.length;
    if ( 1 + ( adjCount * 2 ) >= len ) {
      return this.getCellElements();
    }

    var cellElems = [];
    for ( var i = index - adjCount; i <= index + adjCount; i++ ) {
      var slideIndex = this.options.wrapAround ? utils.modulo( i, len ) : i;
      var slide = this.slides[ slideIndex ];
      if ( slide ) {
        cellElems = cellElems.concat( slide.getCellElements() );
      }
    }
    return cellElems;
  };

  /**
   * select slide from number or cell element
   * @param {[Element, String, Number]} selector - element, selector string, or index
   * @returns {Flickity.Cell} - matching cell
   */
  proto.queryCell = function( selector ) {
    if ( typeof selector == 'number' ) {
      // use number as index
      return this.cells[ selector ];
    }
    if ( typeof selector == 'string' ) {
      // do not select invalid selectors from hash: #123, #/. #791
      if ( selector.match( /^[#.]?[\d/]/ ) ) {
        return;
      }
      // use string as selector, get element
      selector = this.element.querySelector( selector );
    }
    // get cell from element
    return this.getCell( selector );
  };

  proto.checkVisibility = function() {
    var viewportX = this.viewport.getBoundingClientRect().x;
    var viewportWidth = this.viewport.offsetWidth;

    // Lorenza pulls content that should be out of the viewport in to
    // force slides on either side of the viewport. We need to offset
    // the viewport by the maximum amount it can be pulled in 4px.
    if (this.options.wrapAround) {
      viewportWidth = viewportWidth - 4;
    }

    this.cells.forEach(function (cell) {
      var cellX = cell.element.getBoundingClientRect().x - viewportX;
      var isVisible = (
          (cellX > -1 && cellX < 1) ||
          (cellX + cell.size.innerWidth > viewportX) && (cellX + cell.size.innerWidth < viewportWidth) ||
          (cellX > viewportX) && (cellX < viewportWidth)
      );

      if (isVisible) {
        cell.element.classList.add('is-visible');
        cell.element.removeAttribute('aria-hidden');
        const targetable =  cell.element.querySelectorAll('button, a');

        targetable.forEach(target => target.tabIndex = 0);

      } else {
        cell.element.classList.remove('is-visible');
        cell.element.setAttribute('aria-hidden', true);
        const targetable =  cell.element.querySelectorAll('button, a');

        targetable.forEach(target => target.tabIndex = -1);
      }
    });
  };

  // -------------------------- events -------------------------- //

  proto.uiChange = function() {
    this.emitEvent('uiChange');
  };

  // keep focus on element when child UI elements are clicked
  proto.childUIPointerDown = function( event ) {
    // HACK iOS does not allow touch events to bubble up?!
    if ( event.type != 'touchstart' ) {
      event.preventDefault();
    }
    this.focus();
  };

  // ----- resize ----- //

  proto.onresize = function() {
    this.watchCSS();
    this.resize();
  };

  utils.debounceMethod( Flickity, 'onresize', 150 );

  proto.resize = function() {
    if ( !this.isActive ) {
      return;
    }
    this.getSize();
    // wrap values
    if ( this.options.wrapAround ) {
      this.x = utils.modulo( this.x, this.slideableWidth );
    }
    this.positionCells();
    this._getWrapShiftCells();
    this.setGallerySize();
    this.emitEvent('resize');
    // update selected index for group slides, instant
    // TODO: position can be lost between groups of various numbers
    var selectedElement = this.selectedElements && this.selectedElements[0];
    this.selectCell( selectedElement, false, true );
  };

  // watches the :after property, activates/deactivates
  proto.watchCSS = function() {
    var watchOption = this.options.watchCSS;
    if ( !watchOption ) {
      return;
    }

    var afterContent = getComputedStyle( this.element, ':after' ).content;
    // activate if :after { content: 'flickity' }
    if ( afterContent.indexOf('flickity') != -1 ) {
      this.activate();
    } else {
      this.deactivate();
    }
  };

  // ----- keydown ----- //

  // go previous/next if left/right keys pressed
  proto.onkeydown = function( event ) {
    // only work if element is in focus
    var isNotFocused = document.activeElement && document.activeElement != this.element;
    if ( !this.options.accessibility || isNotFocused ) {
      return;
    }

    var handler = Flickity.keyboardHandlers[ event.keyCode ];
    if ( handler ) {
      handler.call( this );
    }
  };

  Flickity.keyboardHandlers = {
    // left arrow
    37: function() {
      var leftMethod = this.options.rightToLeft ? 'next' : 'previous';
      this.uiChange();
      this[ leftMethod ]();
    },
    // right arrow
    39: function() {
      var rightMethod = this.options.rightToLeft ? 'previous' : 'next';
      this.uiChange();
      this[ rightMethod ]();
    },
  };

  // ----- focus ----- //

  proto.focus = function() {
    // TODO remove scrollTo once focus options gets more support
    // https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus ...
    //    #Browser_compatibility
    var prevScrollY = window.pageYOffset;
    this.element.focus({ preventScroll: true });
    // hack to fix scroll jump after focus, #76
    if ( window.pageYOffset != prevScrollY ) {
      window.scrollTo( window.pageXOffset, prevScrollY );
    }
  };

  // -------------------------- destroy -------------------------- //

  // deactivate all Flickity functionality, but keep stuff available
  proto.deactivate = function() {
    if ( !this.isActive ) {
      return;
    }
    this.element.classList.remove('flickity-enabled');
    this.element.classList.remove('flickity-rtl');
    this.unselectSelectedSlide();
    // destroy cells
    this.cells.forEach( function( cell ) {
      cell.destroy();
    } );
    this.element.removeChild( this.viewport );
    // move child elements back into element
    moveElements( this.slider.children, this.element );
    if ( this.options.accessibility ) {
      this.element.removeAttribute('tabIndex');
      this.element.removeEventListener( 'keydown', this );
    }
    // set flags
    this.isActive = false;
    this.emitEvent('deactivate');
  };

  proto.destroy = function() {
    this.deactivate();
    window.removeEventListener( 'resize', this );
    this.allOff();
    this.emitEvent('destroy');
    if ( jQuery && this.$element ) {
      jQuery.removeData( this.element, 'flickity' );
    }
    delete this.element.flickityGUID;
    delete instances[ this.guid ];
  };

  // -------------------------- prototype -------------------------- //

  utils.extend( proto, animatePrototype );

  // -------------------------- extras -------------------------- //

  /**
   * get Flickity instance from element
   * @param {[Element, String]} elem - element or selector string
   * @returns {Flickity} - Flickity instance
   */
  Flickity.data = function( elem ) {
    elem = utils.getQueryElement( elem );
    var id = elem && elem.flickityGUID;
    return id && instances[ id ];
  };

  utils.htmlInit( Flickity, 'flickity' );

  if ( jQuery && jQuery.bridget ) {
    jQuery.bridget( 'flickity', Flickity );
  }

  // set internal jQuery, for Webpack + jQuery v3, #478
  Flickity.setJQuery = function( jq ) {
    jQuery = jq;
  };

  Flickity.Cell = Cell;
  Flickity.Slide = Slide;

  return Flickity;

  } ) );
  }(flickity));

  var drag = {exports: {}};

  var unidragger = {exports: {}};

  var unipointer = {exports: {}};

  /*!
   * Unipointer v2.3.0
   * base class for doing one thing with pointer event
   * MIT license
   */

  (function (module) {
  /*jshint browser: true, undef: true, unused: true, strict: true */

  ( function( window, factory ) {
    // universal module definition
    /* jshint strict: false */ /*global define, module, require */
    if ( module.exports ) {
      // CommonJS
      module.exports = factory(
        window,
        evEmitter.exports
      );
    } else {
      // browser global
      window.Unipointer = factory(
        window,
        window.EvEmitter
      );
    }

  }( window, function factory( window, EvEmitter ) {

  function noop() {}

  function Unipointer() {}

  // inherit EvEmitter
  var proto = Unipointer.prototype = Object.create( EvEmitter.prototype );

  proto.bindStartEvent = function( elem ) {
    this._bindStartEvent( elem, true );
  };

  proto.unbindStartEvent = function( elem ) {
    this._bindStartEvent( elem, false );
  };

  /**
   * Add or remove start event
   * @param {Boolean} isAdd - remove if falsey
   */
  proto._bindStartEvent = function( elem, isAdd ) {
    // munge isAdd, default to true
    isAdd = isAdd === undefined ? true : isAdd;
    var bindMethod = isAdd ? 'addEventListener' : 'removeEventListener';

    // default to mouse events
    var startEvent = 'mousedown';
    if ( window.PointerEvent ) {
      // Pointer Events
      startEvent = 'pointerdown';
    } else if ( 'ontouchstart' in window ) {
      // Touch Events. iOS Safari
      startEvent = 'touchstart';
    }
    elem[ bindMethod ]( startEvent, this );
  };

  // trigger handler methods for events
  proto.handleEvent = function( event ) {
    var method = 'on' + event.type;
    if ( this[ method ] ) {
      this[ method ]( event );
    }
  };

  // returns the touch that we're keeping track of
  proto.getTouch = function( touches ) {
    for ( var i=0; i < touches.length; i++ ) {
      var touch = touches[i];
      if ( touch.identifier == this.pointerIdentifier ) {
        return touch;
      }
    }
  };

  // ----- start event ----- //

  proto.onmousedown = function( event ) {
    // dismiss clicks from right or middle buttons
    var button = event.button;
    if ( button && ( button !== 0 && button !== 1 ) ) {
      return;
    }
    this._pointerDown( event, event );
  };

  proto.ontouchstart = function( event ) {
    this._pointerDown( event, event.changedTouches[0] );
  };

  proto.onpointerdown = function( event ) {
    this._pointerDown( event, event );
  };

  /**
   * pointer start
   * @param {Event} event
   * @param {Event or Touch} pointer
   */
  proto._pointerDown = function( event, pointer ) {
    // dismiss right click and other pointers
    // button = 0 is okay, 1-4 not
    if ( event.button || this.isPointerDown ) {
      return;
    }

    this.isPointerDown = true;
    // save pointer identifier to match up touch events
    this.pointerIdentifier = pointer.pointerId !== undefined ?
      // pointerId for pointer events, touch.indentifier for touch events
      pointer.pointerId : pointer.identifier;

    this.pointerDown( event, pointer );
  };

  proto.pointerDown = function( event, pointer ) {
    this._bindPostStartEvents( event );
    this.emitEvent( 'pointerDown', [ event, pointer ] );
  };

  // hash of events to be bound after start event
  var postStartEvents = {
    mousedown: [ 'mousemove', 'mouseup' ],
    touchstart: [ 'touchmove', 'touchend', 'touchcancel' ],
    pointerdown: [ 'pointermove', 'pointerup', 'pointercancel' ],
  };

  proto._bindPostStartEvents = function( event ) {
    if ( !event ) {
      return;
    }
    // get proper events to match start event
    var events = postStartEvents[ event.type ];
    // bind events to node
    events.forEach( function( eventName ) {
      window.addEventListener( eventName, this );
    }, this );
    // save these arguments
    this._boundPointerEvents = events;
  };

  proto._unbindPostStartEvents = function() {
    // check for _boundEvents, in case dragEnd triggered twice (old IE8 bug)
    if ( !this._boundPointerEvents ) {
      return;
    }
    this._boundPointerEvents.forEach( function( eventName ) {
      window.removeEventListener( eventName, this );
    }, this );

    delete this._boundPointerEvents;
  };

  // ----- move event ----- //

  proto.onmousemove = function( event ) {
    this._pointerMove( event, event );
  };

  proto.onpointermove = function( event ) {
    if ( event.pointerId == this.pointerIdentifier ) {
      this._pointerMove( event, event );
    }
  };

  proto.ontouchmove = function( event ) {
    var touch = this.getTouch( event.changedTouches );
    if ( touch ) {
      this._pointerMove( event, touch );
    }
  };

  /**
   * pointer move
   * @param {Event} event
   * @param {Event or Touch} pointer
   * @private
   */
  proto._pointerMove = function( event, pointer ) {
    this.pointerMove( event, pointer );
  };

  // public
  proto.pointerMove = function( event, pointer ) {
    this.emitEvent( 'pointerMove', [ event, pointer ] );
  };

  // ----- end event ----- //


  proto.onmouseup = function( event ) {
    this._pointerUp( event, event );
  };

  proto.onpointerup = function( event ) {
    if ( event.pointerId == this.pointerIdentifier ) {
      this._pointerUp( event, event );
    }
  };

  proto.ontouchend = function( event ) {
    var touch = this.getTouch( event.changedTouches );
    if ( touch ) {
      this._pointerUp( event, touch );
    }
  };

  /**
   * pointer up
   * @param {Event} event
   * @param {Event or Touch} pointer
   * @private
   */
  proto._pointerUp = function( event, pointer ) {
    this._pointerDone();
    this.pointerUp( event, pointer );
  };

  // public
  proto.pointerUp = function( event, pointer ) {
    this.emitEvent( 'pointerUp', [ event, pointer ] );
  };

  // ----- pointer done ----- //

  // triggered on pointer up & pointer cancel
  proto._pointerDone = function() {
    this._pointerReset();
    this._unbindPostStartEvents();
    this.pointerDone();
  };

  proto._pointerReset = function() {
    // reset properties
    this.isPointerDown = false;
    delete this.pointerIdentifier;
  };

  proto.pointerDone = noop;

  // ----- pointer cancel ----- //

  proto.onpointercancel = function( event ) {
    if ( event.pointerId == this.pointerIdentifier ) {
      this._pointerCancel( event, event );
    }
  };

  proto.ontouchcancel = function( event ) {
    var touch = this.getTouch( event.changedTouches );
    if ( touch ) {
      this._pointerCancel( event, touch );
    }
  };

  /**
   * pointer cancel
   * @param {Event} event
   * @param {Event or Touch} pointer
   * @private
   */
  proto._pointerCancel = function( event, pointer ) {
    this._pointerDone();
    this.pointerCancel( event, pointer );
  };

  // public
  proto.pointerCancel = function( event, pointer ) {
    this.emitEvent( 'pointerCancel', [ event, pointer ] );
  };

  // -----  ----- //

  // utility function for getting x/y coords from event
  Unipointer.getPointerPoint = function( pointer ) {
    return {
      x: pointer.pageX,
      y: pointer.pageY
    };
  };

  // -----  ----- //

  return Unipointer;

  }));
  }(unipointer));

  /*!
   * Unidragger v2.3.1
   * Draggable base class
   * MIT license
   */

  (function (module) {
  /*jshint browser: true, unused: true, undef: true, strict: true */

  ( function( window, factory ) {
    // universal module definition
    /*jshint strict: false */ /*globals define, module, require */

    if ( module.exports ) {
      // CommonJS
      module.exports = factory(
        window,
        unipointer.exports
      );
    } else {
      // browser global
      window.Unidragger = factory(
        window,
        window.Unipointer
      );
    }

  }( window, function factory( window, Unipointer ) {

  // -------------------------- Unidragger -------------------------- //

  function Unidragger() {}

  // inherit Unipointer & EvEmitter
  var proto = Unidragger.prototype = Object.create( Unipointer.prototype );

  // ----- bind start ----- //

  proto.bindHandles = function() {
    this._bindHandles( true );
  };

  proto.unbindHandles = function() {
    this._bindHandles( false );
  };

  /**
   * Add or remove start event
   * @param {Boolean} isAdd
   */
  proto._bindHandles = function( isAdd ) {
    // munge isAdd, default to true
    isAdd = isAdd === undefined ? true : isAdd;
    // bind each handle
    var bindMethod = isAdd ? 'addEventListener' : 'removeEventListener';
    var touchAction = isAdd ? this._touchActionValue : '';
    for ( var i=0; i < this.handles.length; i++ ) {
      var handle = this.handles[i];
      this._bindStartEvent( handle, isAdd );
      handle[ bindMethod ]( 'click', this );
      // touch-action: none to override browser touch gestures. metafizzy/flickity#540
      if ( window.PointerEvent ) {
        handle.style.touchAction = touchAction;
      }
    }
  };

  // prototype so it can be overwriteable by Flickity
  proto._touchActionValue = 'none';

  // ----- start event ----- //

  /**
   * pointer start
   * @param {Event} event
   * @param {Event or Touch} pointer
   */
  proto.pointerDown = function( event, pointer ) {
    var isOkay = this.okayPointerDown( event );
    if ( !isOkay ) {
      return;
    }
    // track start event position
    // Safari 9 overrides pageX and pageY. These values needs to be copied. flickity#842
    this.pointerDownPointer = {
      pageX: pointer.pageX,
      pageY: pointer.pageY,
    };

    event.preventDefault();
    this.pointerDownBlur();
    // bind move and end events
    this._bindPostStartEvents( event );
    this.emitEvent( 'pointerDown', [ event, pointer ] );
  };

  // nodes that have text fields
  var cursorNodes = {
    TEXTAREA: true,
    INPUT: true,
    SELECT: true,
    OPTION: true,
  };

  // input types that do not have text fields
  var clickTypes = {
    radio: true,
    checkbox: true,
    button: true,
    submit: true,
    image: true,
    file: true,
  };

  // dismiss inputs with text fields. flickity#403, flickity#404
  proto.okayPointerDown = function( event ) {
    var isCursorNode = cursorNodes[ event.target.nodeName ];
    var isClickType = clickTypes[ event.target.type ];
    var isOkay = !isCursorNode || isClickType;
    if ( !isOkay ) {
      this._pointerReset();
    }
    return isOkay;
  };

  // kludge to blur previously focused input
  proto.pointerDownBlur = function() {
    var focused = document.activeElement;
    // do not blur body for IE10, metafizzy/flickity#117
    var canBlur = focused && focused.blur && focused != document.body;
    if ( canBlur ) {
      focused.blur();
    }
  };

  // ----- move event ----- //

  /**
   * drag move
   * @param {Event} event
   * @param {Event or Touch} pointer
   */
  proto.pointerMove = function( event, pointer ) {
    var moveVector = this._dragPointerMove( event, pointer );
    this.emitEvent( 'pointerMove', [ event, pointer, moveVector ] );
    this._dragMove( event, pointer, moveVector );
  };

  // base pointer move logic
  proto._dragPointerMove = function( event, pointer ) {
    var moveVector = {
      x: pointer.pageX - this.pointerDownPointer.pageX,
      y: pointer.pageY - this.pointerDownPointer.pageY
    };
    // start drag if pointer has moved far enough to start drag
    if ( !this.isDragging && this.hasDragStarted( moveVector ) ) {
      this._dragStart( event, pointer );
    }
    return moveVector;
  };

  // condition if pointer has moved far enough to start drag
  proto.hasDragStarted = function( moveVector ) {
    return Math.abs( moveVector.x ) > 3 || Math.abs( moveVector.y ) > 3;
  };

  // ----- end event ----- //

  /**
   * pointer up
   * @param {Event} event
   * @param {Event or Touch} pointer
   */
  proto.pointerUp = function( event, pointer ) {
    this.emitEvent( 'pointerUp', [ event, pointer ] );
    this._dragPointerUp( event, pointer );
  };

  proto._dragPointerUp = function( event, pointer ) {
    if ( this.isDragging ) {
      this._dragEnd( event, pointer );
    } else {
      // pointer didn't move enough for drag to start
      this._staticClick( event, pointer );
    }
  };

  // -------------------------- drag -------------------------- //

  // dragStart
  proto._dragStart = function( event, pointer ) {
    this.isDragging = true;
    // prevent clicks
    this.isPreventingClicks = true;
    this.dragStart( event, pointer );
  };

  proto.dragStart = function( event, pointer ) {
    this.emitEvent( 'dragStart', [ event, pointer ] );
  };

  // dragMove
  proto._dragMove = function( event, pointer, moveVector ) {
    // do not drag if not dragging yet
    if ( !this.isDragging ) {
      return;
    }

    this.dragMove( event, pointer, moveVector );
  };

  proto.dragMove = function( event, pointer, moveVector ) {
    event.preventDefault();
    this.emitEvent( 'dragMove', [ event, pointer, moveVector ] );
  };

  // dragEnd
  proto._dragEnd = function( event, pointer ) {
    // set flags
    this.isDragging = false;
    // re-enable clicking async
    setTimeout( function() {
      delete this.isPreventingClicks;
    }.bind( this ) );

    this.dragEnd( event, pointer );
  };

  proto.dragEnd = function( event, pointer ) {
    this.emitEvent( 'dragEnd', [ event, pointer ] );
  };

  // ----- onclick ----- //

  // handle all clicks and prevent clicks when dragging
  proto.onclick = function( event ) {
    if ( this.isPreventingClicks ) {
      event.preventDefault();
    }
  };

  // ----- staticClick ----- //

  // triggered after pointer down & up with no/tiny movement
  proto._staticClick = function( event, pointer ) {
    // ignore emulated mouse up clicks
    if ( this.isIgnoringMouseUp && event.type == 'mouseup' ) {
      return;
    }

    this.staticClick( event, pointer );

    // set flag for emulated clicks 300ms after touchend
    if ( event.type != 'mouseup' ) {
      this.isIgnoringMouseUp = true;
      // reset flag after 300ms
      setTimeout( function() {
        delete this.isIgnoringMouseUp;
      }.bind( this ), 400 );
    }
  };

  proto.staticClick = function( event, pointer ) {
    this.emitEvent( 'staticClick', [ event, pointer ] );
  };

  // ----- utils ----- //

  Unidragger.getPointerPoint = Unipointer.getPointerPoint;

  // -----  ----- //

  return Unidragger;

  }));
  }(unidragger));

  (function (module) {
  // drag
  ( function( window, factory ) {
    // universal module definition
    if ( module.exports ) {
      // CommonJS
      module.exports = factory(
          window,
          flickity.exports,
          unidragger.exports,
          utils.exports
      );
    } else {
      // browser global
      window.Flickity = factory(
          window,
          window.Flickity,
          window.Unidragger,
          window.fizzyUIUtils
      );
    }

  }( window, function factory( window, Flickity, Unidragger, utils ) {

  // ----- defaults ----- //

  utils.extend( Flickity.defaults, {
    draggable: '>1',
    dragThreshold: 3,
  } );

  // ----- create ----- //

  Flickity.createMethods.push('_createDrag');

  // -------------------------- drag prototype -------------------------- //

  var proto = Flickity.prototype;
  utils.extend( proto, Unidragger.prototype );
  proto._touchActionValue = 'pan-y';

  // --------------------------  -------------------------- //

  var isTouch = 'createTouch' in document;
  var isTouchmoveScrollCanceled = false;

  proto._createDrag = function() {
    this.on( 'activate', this.onActivateDrag );
    this.on( 'uiChange', this._uiChangeDrag );
    this.on( 'deactivate', this.onDeactivateDrag );
    this.on( 'cellChange', this.updateDraggable );
    // TODO updateDraggable on resize? if groupCells & slides change
    // HACK - add seemingly innocuous handler to fix iOS 10 scroll behavior
    // #457, RubaXa/Sortable#973
    if ( isTouch && !isTouchmoveScrollCanceled ) {
      window.addEventListener( 'touchmove', function() {} );
      isTouchmoveScrollCanceled = true;
    }
  };

  proto.onActivateDrag = function() {
    this.handles = [ this.viewport ];
    this.bindHandles();
    this.updateDraggable();
  };

  proto.onDeactivateDrag = function() {
    this.unbindHandles();
    this.element.classList.remove('is-draggable');
  };

  proto.updateDraggable = function() {
    // disable dragging if less than 2 slides. #278
    if ( this.options.draggable == '>1' ) {
      this.isDraggable = this.slides.length > 1;
    } else if (this.options.draggable === 'onOverflow') {
      this.isDraggable = this.viewport.scrollWidth > this.viewport.offsetWidth;
    } else {
      this.isDraggable = this.options.draggable;
    }
    if ( this.isDraggable ) {
      this.element.classList.add('is-draggable');
    } else {
      this.element.classList.remove('is-draggable');
    }
  };

  // backwards compatibility
  proto.bindDrag = function() {
    this.options.draggable = true;
    this.updateDraggable();
  };

  proto.unbindDrag = function() {
    this.options.draggable = false;
    this.updateDraggable();
  };

  proto._uiChangeDrag = function() {
    delete this.isFreeScrolling;
  };

  // -------------------------- pointer events -------------------------- //

  proto.pointerDown = function( event, pointer ) {
    if ( !this.isDraggable ) {
      this._pointerDownDefault( event, pointer );
      return;
    }
    var isOkay = this.okayPointerDown( event );
    if ( !isOkay ) {
      return;
    }

    this._pointerDownPreventDefault( event );
    this.pointerDownFocus( event );
    // blur
    if ( document.activeElement != this.element ) {
      // do not blur if already focused
      this.pointerDownBlur();
    }

    // stop if it was moving
    this.dragX = this.x;
    this.viewport.classList.add('is-pointer-down');
    // track scrolling
    this.pointerDownScroll = getScrollPosition();
    window.addEventListener( 'scroll', this );

    this._pointerDownDefault( event, pointer );
  };

  // default pointerDown logic, used for staticClick
  proto._pointerDownDefault = function( event, pointer ) {
    // track start event position
    // Safari 9 overrides pageX and pageY. These values needs to be copied. #779
    this.pointerDownPointer = {
      pageX: pointer.pageX,
      pageY: pointer.pageY,
    };
    // bind move and end events
    this._bindPostStartEvents( event );
    this.dispatchEvent( 'pointerDown', event, [ pointer ] );
  };

  var focusNodes = {
    INPUT: true,
    TEXTAREA: true,
    SELECT: true,
  };

  proto.pointerDownFocus = function( event ) {
    var isFocusNode = focusNodes[ event.target.nodeName ];
    if ( !isFocusNode ) {
      this.focus();
    }
  };

  proto._pointerDownPreventDefault = function( event ) {
    var isTouchStart = event.type == 'touchstart';
    var isTouchPointer = event.pointerType == 'touch';
    var isFocusNode = focusNodes[ event.target.nodeName ];
    if ( !isTouchStart && !isTouchPointer && !isFocusNode ) {
      event.preventDefault();
    }
  };

  // ----- move ----- //

  proto.hasDragStarted = function( moveVector ) {
    return Math.abs( moveVector.x ) > this.options.dragThreshold;
  };

  // ----- up ----- //

  proto.pointerUp = function( event, pointer ) {
    delete this.isTouchScrolling;
    this.viewport.classList.remove('is-pointer-down');
    this.dispatchEvent( 'pointerUp', event, [ pointer ] );
    this._dragPointerUp( event, pointer );
  };

  proto.pointerDone = function() {
    window.removeEventListener( 'scroll', this );
    delete this.pointerDownScroll;
  };

  // -------------------------- dragging -------------------------- //

  proto.dragStart = function( event, pointer ) {
    if ( !this.isDraggable ) {
      return;
    }
    this.dragStartPosition = this.x;
    this.startAnimation();
    window.removeEventListener( 'scroll', this );
    this.dispatchEvent( 'dragStart', event, [ pointer ] );
  };

  proto.pointerMove = function( event, pointer ) {
    var moveVector = this._dragPointerMove( event, pointer );
    this.dispatchEvent( 'pointerMove', event, [ pointer, moveVector ] );
    this._dragMove( event, pointer, moveVector );
  };

  proto.dragMove = function( event, pointer, moveVector ) {
    if ( !this.isDraggable ) {
      return;
    }
    event.preventDefault();

    this.previousDragX = this.dragX;
    // reverse if right-to-left
    var direction = this.options.rightToLeft ? -1 : 1;
    if ( this.options.wrapAround ) {
      // wrap around move. #589
      moveVector.x %= this.slideableWidth;
    }
    var dragX = this.dragStartPosition + moveVector.x * direction;

    if ( !this.options.wrapAround && this.slides.length ) {
      // slow drag
      var originBound = Math.max( -this.slides[0].target, this.dragStartPosition );
      dragX = dragX > originBound ? ( dragX + originBound ) * 0.5 : dragX;
      var endBound = Math.min( -this.getLastSlide().target, this.dragStartPosition );
      dragX = dragX < endBound ? ( dragX + endBound ) * 0.5 : dragX;
    }

    this.dragX = dragX;

    this.dragMoveTime = new Date();
    this.dispatchEvent( 'dragMove', event, [ pointer, moveVector ] );
  };

  proto.dragEnd = function( event, pointer ) {
    if ( !this.isDraggable ) {
      return;
    }
    if ( this.options.freeScroll ) {
      this.isFreeScrolling = true;
    }
    // set selectedIndex based on where flick will end up
    var index = this.dragEndRestingSelect();

    if ( this.options.freeScroll && !this.options.wrapAround ) {
      // if free-scroll & not wrap around
      // do not free-scroll if going outside of bounding slides
      // so bounding slides can attract slider, and keep it in bounds
      var restingX = this.getRestingPosition();
      this.isFreeScrolling = -restingX > this.slides[0].target &&
        -restingX < this.getLastSlide().target;
    } else if ( !this.options.freeScroll && index == this.selectedIndex ) {
      // boost selection if selected index has not changed
      index += this.dragEndBoostSelect();
    }
    delete this.previousDragX;
    // apply selection
    // TODO refactor this, selecting here feels weird
    // HACK, set flag so dragging stays in correct direction
    this.isDragSelect = this.options.wrapAround;
    this.select( index );
    delete this.isDragSelect;
    this.dispatchEvent( 'dragEnd', event, [ pointer ] );
  };

  proto.dragEndRestingSelect = function() {
    var restingX = this.getRestingPosition();
    // how far away from selected slide
    var distance = Math.abs( this.getSlideDistance( -restingX, this.selectedIndex ) );
    // get closet resting going up and going down
    var positiveResting = this._getClosestResting( restingX, distance, 1 );
    var negativeResting = this._getClosestResting( restingX, distance, -1 );
    // use closer resting for wrap-around
    var index = positiveResting.distance < negativeResting.distance ?
      positiveResting.index : negativeResting.index;
    return index;
  };

  /**
   * given resting X and distance to selected cell
   * get the distance and index of the closest cell
   * @param {Number} restingX - estimated post-flick resting position
   * @param {Number} distance - distance to selected cell
   * @param {Integer} increment - +1 or -1, going up or down
   * @returns {Object} - { distance: {Number}, index: {Integer} }
   */
  proto._getClosestResting = function( restingX, distance, increment ) {
    var index = this.selectedIndex;
    var minDistance = Infinity;
    var condition = this.options.contain && !this.options.wrapAround ?
      // if contain, keep going if distance is equal to minDistance
      function( dist, minDist ) {
        return dist <= minDist;
      } : function( dist, minDist ) {
        return dist < minDist;
      };
    while ( condition( distance, minDistance ) ) {
      // measure distance to next cell
      index += increment;
      minDistance = distance;
      distance = this.getSlideDistance( -restingX, index );
      if ( distance === null ) {
        break;
      }
      distance = Math.abs( distance );
    }
    return {
      distance: minDistance,
      // selected was previous index
      index: index - increment,
    };
  };

  /**
   * measure distance between x and a slide target
   * @param {Number} x - horizontal position
   * @param {Integer} index - slide index
   * @returns {Number} - slide distance
   */
  proto.getSlideDistance = function( x, index ) {
    var len = this.slides.length;
    // wrap around if at least 2 slides
    var isWrapAround = this.options.wrapAround && len > 1;
    var slideIndex = isWrapAround ? utils.modulo( index, len ) : index;
    var slide = this.slides[ slideIndex ];
    if ( !slide ) {
      return null;
    }
    // add distance for wrap-around slides
    var wrap = isWrapAround ? this.slideableWidth * Math.floor( index/len ) : 0;
    return x - ( slide.target + wrap );
  };

  proto.dragEndBoostSelect = function() {
    // do not boost if no previousDragX or dragMoveTime
    if ( this.previousDragX === undefined || !this.dragMoveTime ||
      // or if drag was held for 100 ms
      new Date() - this.dragMoveTime > 100 ) {
      return 0;
    }

    var distance = this.getSlideDistance( -this.dragX, this.selectedIndex );
    var delta = this.previousDragX - this.dragX;
    if ( distance > 0 && delta > 0 ) {
      // boost to next if moving towards the right, and positive velocity
      return 1;
    } else if ( distance < 0 && delta < 0 ) {
      // boost to previous if moving towards the left, and negative velocity
      return -1;
    }
    return 0;
  };

  // ----- staticClick ----- //

  proto.staticClick = function( event, pointer ) {
    // get clickedCell, if cell was clicked
    var clickedCell = this.getParentCell( event.target );
    var cellElem = clickedCell && clickedCell.element;
    var cellIndex = clickedCell && this.cells.indexOf( clickedCell );
    this.dispatchEvent( 'staticClick', event, [ pointer, cellElem, cellIndex ] );
  };

  // ----- scroll ----- //

  proto.onscroll = function() {
    var scroll = getScrollPosition();
    var scrollMoveX = this.pointerDownScroll.x - scroll.x;
    var scrollMoveY = this.pointerDownScroll.y - scroll.y;
    // cancel click/tap if scroll is too much
    if ( Math.abs( scrollMoveX ) > 3 || Math.abs( scrollMoveY ) > 3 ) {
      this._pointerDone();
    }
  };

  // ----- utils ----- //

  function getScrollPosition() {
    return {
      x: window.pageXOffset,
      y: window.pageYOffset,
    };
  }

  // -----  ----- //

  return Flickity;

  } ) );
  }(drag));

  var prevNextButton = {exports: {}};

  (function (module) {
  // prev/next buttons
  ( function( window, factory ) {
    // universal module definition
    if ( module.exports ) {
      // CommonJS
      module.exports = factory(
          window,
          flickity.exports,
          unipointer.exports,
          utils.exports
      );
    } else {
      // browser global
      factory(
          window,
          window.Flickity,
          window.Unipointer,
          window.fizzyUIUtils
      );
    }

  }( window, function factory( window, Flickity, Unipointer, utils ) {

  var svgURI = 'http://www.w3.org/2000/svg';

  // -------------------------- PrevNextButton -------------------------- //

  function PrevNextButton( direction, parent ) {
    this.direction = direction;
    this.parent = parent;
    this._create();
  }

  PrevNextButton.prototype = Object.create( Unipointer.prototype );

  PrevNextButton.prototype._create = function() {
    // properties
    this.isEnabled = true;
    this.isPrevious = this.direction == -1;
    var leftDirection = this.parent.options.rightToLeft ? 1 : -1;
    this.isLeft = this.direction == leftDirection;

    var element = this.element = document.createElement('button');
    element.className = 'flickity-button flickity-prev-next-button';
    element.className += this.isPrevious ? ' previous' : ' next';
    // prevent button from submitting form http://stackoverflow.com/a/10836076/182183
    element.setAttribute( 'type', 'button' );
    // init as disabled
    this.disable();

    element.setAttribute( 'aria-label', this.isPrevious ? 'Previous' : 'Next' );

    // create arrow
    var svg = this.createSVG();
    element.appendChild( svg );
    // events
    this.parent.on( 'select', this.update.bind( this ) );
    this.on( 'pointerDown', this.parent.childUIPointerDown.bind( this.parent ) );
  };

  PrevNextButton.prototype.activate = function() {
    this.bindStartEvent( this.element );
    this.element.addEventListener( 'click', this );
    // add to DOM
    this.parent.element.appendChild( this.element );
  };

  PrevNextButton.prototype.deactivate = function() {
    // remove from DOM
    this.parent.element.removeChild( this.element );
    // click events
    this.unbindStartEvent( this.element );
    this.element.removeEventListener( 'click', this );
  };

  PrevNextButton.prototype.createSVG = function() {
    var svg = document.createElementNS( svgURI, 'svg' );
    svg.setAttribute( 'class', 'flickity-button-icon' );
    svg.setAttribute( 'viewBox', '0 0 100 100' );
    var path = document.createElementNS( svgURI, 'path' );
    var pathMovements = getArrowMovements( this.parent.options.arrowShape );
    path.setAttribute( 'd', pathMovements );
    path.setAttribute( 'class', 'arrow' );
    // rotate arrow
    if ( !this.isLeft ) {
      path.setAttribute( 'transform', 'translate(100, 100) rotate(180) ' );
    }
    svg.appendChild( path );
    return svg;
  };

  // get SVG path movmement
  function getArrowMovements( shape ) {
    // use shape as movement if string
    if ( typeof shape == 'string' ) {
      return shape;
    }
    // create movement string
    return 'M ' + shape.x0 + ',50' +
      ' L ' + shape.x1 + ',' + ( shape.y1 + 50 ) +
      ' L ' + shape.x2 + ',' + ( shape.y2 + 50 ) +
      ' L ' + shape.x3 + ',50 ' +
      ' L ' + shape.x2 + ',' + ( 50 - shape.y2 ) +
      ' L ' + shape.x1 + ',' + ( 50 - shape.y1 ) +
      ' Z';
  }

  PrevNextButton.prototype.handleEvent = utils.handleEvent;

  PrevNextButton.prototype.onclick = function() {
    if ( !this.isEnabled ) {
      return;
    }
    this.parent.uiChange();
    var method = this.isPrevious ? 'previous' : 'next';
    this.parent[ method ]();
  };

  // -----  ----- //

  PrevNextButton.prototype.enable = function() {
    if ( this.isEnabled ) {
      return;
    }
    this.element.disabled = false;
    this.isEnabled = true;
  };

  PrevNextButton.prototype.disable = function() {
    if ( !this.isEnabled ) {
      return;
    }
    this.element.disabled = true;
    this.isEnabled = false;
  };

  PrevNextButton.prototype.update = function() {
    // index of first or last slide, if previous or next
    var slides = this.parent.slides;
    // enable is wrapAround and at least 2 slides
    if ( this.parent.options.wrapAround && slides.length > 1 ) {
      this.enable();
      return;
    }
    var lastIndex = slides.length ? slides.length - 1 : 0;
    var boundIndex = this.isPrevious ? 0 : lastIndex;
    var method = this.parent.selectedIndex == boundIndex ? 'disable' : 'enable';
    this[ method ]();
  };

  PrevNextButton.prototype.destroy = function() {
    this.deactivate();
    this.allOff();
  };

  // -------------------------- Flickity prototype -------------------------- //

  utils.extend( Flickity.defaults, {
    prevNextButtons: true,
    arrowShape: {
      x0: 10,
      x1: 60, y1: 50,
      x2: 70, y2: 40,
      x3: 30,
    },
  } );

  Flickity.createMethods.push('_createPrevNextButtons');
  var proto = Flickity.prototype;

  proto._createPrevNextButtons = function() {
    if ( !this.options.prevNextButtons ) {
      return;
    }

    this.prevButton = new PrevNextButton( -1, this );
    this.nextButton = new PrevNextButton( 1, this );

    this.on( 'activate', this.activatePrevNextButtons );
  };

  proto.activatePrevNextButtons = function() {
    this.prevButton.activate();
    this.nextButton.activate();
    this.on( 'deactivate', this.deactivatePrevNextButtons );
  };

  proto.deactivatePrevNextButtons = function() {
    this.prevButton.deactivate();
    this.nextButton.deactivate();
    this.off( 'deactivate', this.deactivatePrevNextButtons );
  };

  // --------------------------  -------------------------- //

  Flickity.PrevNextButton = PrevNextButton;

  return Flickity;

  } ) );
  }(prevNextButton));

  var pageDots = {exports: {}};

  (function (module) {
  // page dots
  ( function( window, factory ) {
    // universal module definition
    if ( module.exports ) {
      // CommonJS
      module.exports = factory(
          window,
          flickity.exports,
          unipointer.exports,
          utils.exports
      );
    } else {
      // browser global
      factory(
          window,
          window.Flickity,
          window.Unipointer,
          window.fizzyUIUtils
      );
    }

  }( window, function factory( window, Flickity, Unipointer, utils ) {

  function PageDots( parent ) {
    this.parent = parent;
    this._create();
  }

  PageDots.prototype = Object.create( Unipointer.prototype );

  PageDots.prototype._create = function() {
    // create holder element
    this.holder = document.createElement('ol');
    this.holder.className = 'flickity-page-dots';
    // create dots, array of elements
    this.dots = [];
    // events
    this.handleClick = this.onClick.bind( this );
    this.on( 'pointerDown', this.parent.childUIPointerDown.bind( this.parent ) );
  };

  PageDots.prototype.activate = function() {
    this.setDots();
    this.holder.addEventListener( 'click', this.handleClick );
    this.bindStartEvent( this.holder );
    // add to DOM
    this.parent.element.appendChild( this.holder );
  };

  PageDots.prototype.deactivate = function() {
    this.holder.removeEventListener( 'click', this.handleClick );
    this.unbindStartEvent( this.holder );
    // remove from DOM
    this.parent.element.removeChild( this.holder );
  };

  PageDots.prototype.setDots = function() {
    // get difference between number of slides and number of dots
    var delta = this.parent.slides.length - this.dots.length;
    if ( delta > 0 ) {
      this.addDots( delta );
    } else if ( delta < 0 ) {
      this.removeDots( -delta );
    }
  };

  PageDots.prototype.addDots = function( count ) {
    var fragment = document.createDocumentFragment();
    var newDots = [];
    var length = this.dots.length;
    var max = length + count;

    for ( var i = length; i < max; i++ ) {
      var dot = document.createElement('li');
      dot.className = 'dot';
      dot.setAttribute( 'aria-label', 'Page dot ' + ( i + 1 ) );
      fragment.appendChild( dot );
      newDots.push( dot );
    }

    this.holder.appendChild( fragment );
    this.dots = this.dots.concat( newDots );
  };

  PageDots.prototype.removeDots = function( count ) {
    // remove from this.dots collection
    var removeDots = this.dots.splice( this.dots.length - count, count );
    // remove from DOM
    removeDots.forEach( function( dot ) {
      this.holder.removeChild( dot );
    }, this );
  };

  PageDots.prototype.updateSelected = function() {
    // remove selected class on previous
    if ( this.selectedDot ) {
      this.selectedDot.className = 'dot';
      this.selectedDot.removeAttribute('aria-current');
    }
    // don't proceed if no dots
    if ( !this.dots.length ) {
      return;
    }
    this.selectedDot = this.dots[ this.parent.selectedIndex ];
    this.selectedDot.className = 'dot is-selected';
    this.selectedDot.setAttribute( 'aria-current', 'step' );
  };

  PageDots.prototype.onTap = // old method name, backwards-compatible
  PageDots.prototype.onClick = function( event ) {
    var target = event.target;
    // only care about dot clicks
    if ( target.nodeName != 'LI' ) {
      return;
    }

    this.parent.uiChange();
    var index = this.dots.indexOf( target );
    this.parent.select( index );
  };

  PageDots.prototype.destroy = function() {
    this.deactivate();
    this.allOff();
  };

  Flickity.PageDots = PageDots;

  // -------------------------- Flickity -------------------------- //

  utils.extend( Flickity.defaults, {
    pageDots: true,
  } );

  Flickity.createMethods.push('_createPageDots');

  var proto = Flickity.prototype;

  proto._createPageDots = function() {
    if ( !this.options.pageDots ) {
      return;
    }
    this.pageDots = new PageDots( this );
    // events
    this.on( 'activate', this.activatePageDots );
    this.on( 'select', this.updateSelectedPageDots );
    this.on( 'cellChange', this.updatePageDots );
    this.on( 'resize', this.updatePageDots );
    this.on( 'deactivate', this.deactivatePageDots );
  };

  proto.activatePageDots = function() {
    this.pageDots.activate();
  };

  proto.updateSelectedPageDots = function() {
    this.pageDots.updateSelected();
  };

  proto.updatePageDots = function() {
    this.pageDots.setDots();
  };

  proto.deactivatePageDots = function() {
    this.pageDots.deactivate();
  };

  // -----  ----- //

  Flickity.PageDots = PageDots;

  return Flickity;

  } ) );
  }(pageDots));

  var player = {exports: {}};

  (function (module) {
  // player & autoPlay
  ( function( window, factory ) {
    // universal module definition
    if ( module.exports ) {
      // CommonJS
      module.exports = factory(
          evEmitter.exports,
          utils.exports,
          flickity.exports
      );
    } else {
      // browser global
      factory(
          window.EvEmitter,
          window.fizzyUIUtils,
          window.Flickity
      );
    }

  }( window, function factory( EvEmitter, utils, Flickity ) {

  // -------------------------- Player -------------------------- //

  function Player( parent ) {
    this.parent = parent;
    this.state = 'stopped';
    // visibility change event handler
    this.onVisibilityChange = this.visibilityChange.bind( this );
    this.onVisibilityPlay = this.visibilityPlay.bind( this );
  }

  Player.prototype = Object.create( EvEmitter.prototype );

  // start play
  Player.prototype.play = function() {
    if ( this.state == 'playing' ) {
      return;
    }
    // do not play if page is hidden, start playing when page is visible
    var isPageHidden = document.hidden;
    if ( isPageHidden ) {
      document.addEventListener( 'visibilitychange', this.onVisibilityPlay );
      return;
    }

    this.state = 'playing';
    // listen to visibility change
    document.addEventListener( 'visibilitychange', this.onVisibilityChange );
    // start ticking
    this.tick();
  };

  Player.prototype.tick = function() {
    // do not tick if not playing
    if ( this.state != 'playing' ) {
      return;
    }

    var time = this.parent.options.autoPlay;
    // default to 3 seconds
    time = typeof time == 'number' ? time : 3000;
    var _this = this;
    // HACK: reset ticks if stopped and started within interval
    this.clear();
    this.timeout = setTimeout( function() {
      _this.parent.next( true );
      _this.tick();
    }, time );
  };

  Player.prototype.stop = function() {
    this.state = 'stopped';
    this.clear();
    // remove visibility change event
    document.removeEventListener( 'visibilitychange', this.onVisibilityChange );
  };

  Player.prototype.clear = function() {
    clearTimeout( this.timeout );
  };

  Player.prototype.pause = function() {
    if ( this.state == 'playing' ) {
      this.state = 'paused';
      this.clear();
    }
  };

  Player.prototype.unpause = function() {
    // re-start play if paused
    if ( this.state == 'paused' ) {
      this.play();
    }
  };

  // pause if page visibility is hidden, unpause if visible
  Player.prototype.visibilityChange = function() {
    var isPageHidden = document.hidden;
    this[ isPageHidden ? 'pause' : 'unpause' ]();
  };

  Player.prototype.visibilityPlay = function() {
    this.play();
    document.removeEventListener( 'visibilitychange', this.onVisibilityPlay );
  };

  // -------------------------- Flickity -------------------------- //

  utils.extend( Flickity.defaults, {
    pauseAutoPlayOnHover: true,
  } );

  Flickity.createMethods.push('_createPlayer');
  var proto = Flickity.prototype;

  proto._createPlayer = function() {
    this.player = new Player( this );

    this.on( 'activate', this.activatePlayer );
    this.on( 'uiChange', this.stopPlayer );
    this.on( 'pointerDown', this.stopPlayer );
    this.on( 'deactivate', this.deactivatePlayer );
  };

  proto.activatePlayer = function() {
    if ( !this.options.autoPlay ) {
      return;
    }
    this.player.play();
    this.element.addEventListener( 'mouseenter', this );
  };

  // Player API, don't hate the ... thanks I know where the door is

  proto.playPlayer = function() {
    this.player.play();
  };

  proto.stopPlayer = function() {
    this.player.stop();
  };

  proto.pausePlayer = function() {
    this.player.pause();
  };

  proto.unpausePlayer = function() {
    this.player.unpause();
  };

  proto.deactivatePlayer = function() {
    this.player.stop();
    this.element.removeEventListener( 'mouseenter', this );
  };

  // ----- mouseenter/leave ----- //

  // pause auto-play on hover
  proto.onmouseenter = function() {
    if ( !this.options.pauseAutoPlayOnHover ) {
      return;
    }
    this.player.pause();
    this.element.addEventListener( 'mouseleave', this );
  };

  // resume auto-play on hover off
  proto.onmouseleave = function() {
    this.player.unpause();
    this.element.removeEventListener( 'mouseleave', this );
  };

  // -----  ----- //

  Flickity.Player = Player;

  return Flickity;

  } ) );
  }(player));

  var addRemoveCell = {exports: {}};

  (function (module) {
  // add, remove cell
  ( function( window, factory ) {
    // universal module definition
    if ( module.exports ) {
      // CommonJS
      module.exports = factory(
          window,
          flickity.exports,
          utils.exports
      );
    } else {
      // browser global
      factory(
          window,
          window.Flickity,
          window.fizzyUIUtils
      );
    }

  }( window, function factory( window, Flickity, utils ) {

  // append cells to a document fragment
  function getCellsFragment( cells ) {
    var fragment = document.createDocumentFragment();
    cells.forEach( function( cell ) {
      fragment.appendChild( cell.element );
    } );
    return fragment;
  }

  // -------------------------- add/remove cell prototype -------------------------- //

  var proto = Flickity.prototype;

  /**
   * Insert, prepend, or append cells
   * @param {[Element, Array, NodeList]} elems - Elements to insert
   * @param {Integer} index - Zero-based number to insert
   */
  proto.insert = function( elems, index ) {
    var cells = this._makeCells( elems );
    if ( !cells || !cells.length ) {
      return;
    }
    var len = this.cells.length;
    // default to append
    index = index === undefined ? len : index;
    // add cells with document fragment
    var fragment = getCellsFragment( cells );
    // append to slider
    var isAppend = index == len;
    if ( isAppend ) {
      this.slider.appendChild( fragment );
    } else {
      var insertCellElement = this.cells[ index ].element;
      this.slider.insertBefore( fragment, insertCellElement );
    }
    // add to this.cells
    if ( index === 0 ) {
      // prepend, add to start
      this.cells = cells.concat( this.cells );
    } else if ( isAppend ) {
      // append, add to end
      this.cells = this.cells.concat( cells );
    } else {
      // insert in this.cells
      var endCells = this.cells.splice( index, len - index );
      this.cells = this.cells.concat( cells ).concat( endCells );
    }

    this._sizeCells( cells );
    this.cellChange( index, true );
  };

  proto.append = function( elems ) {
    this.insert( elems, this.cells.length );
  };

  proto.prepend = function( elems ) {
    this.insert( elems, 0 );
  };

  /**
   * Remove cells
   * @param {[Element, Array, NodeList]} elems - ELements to remove
   */
  proto.remove = function( elems ) {
    var cells = this.getCells( elems );
    if ( !cells || !cells.length ) {
      return;
    }

    var minCellIndex = this.cells.length - 1;
    // remove cells from collection & DOM
    cells.forEach( function( cell ) {
      cell.remove();
      var index = this.cells.indexOf( cell );
      minCellIndex = Math.min( index, minCellIndex );
      utils.removeFrom( this.cells, cell );
    }, this );

    this.cellChange( minCellIndex, true );
  };

  /**
   * logic to be run after a cell's size changes
   * @param {Element} elem - cell's element
   */
  proto.cellSizeChange = function( elem ) {
    var cell = this.getCell( elem );
    if ( !cell ) {
      return;
    }
    cell.getSize();

    var index = this.cells.indexOf( cell );
    this.cellChange( index );
  };

  /**
   * logic any time a cell is changed: added, removed, or size changed
   * @param {Integer} changedCellIndex - index of the changed cell, optional
   * @param {Boolean} isPositioningSlider - Positions slider after selection
   */
  proto.cellChange = function( changedCellIndex, isPositioningSlider ) {
    var prevSelectedElem = this.selectedElement;
    this._positionCells( changedCellIndex );
    this._getWrapShiftCells();
    this.setGallerySize();
    // update selectedIndex
    // try to maintain position & select previous selected element
    var cell = this.getCell( prevSelectedElem );
    if ( cell ) {
      this.selectedIndex = this.getCellSlideIndex( cell );
    }
    this.selectedIndex = Math.min( this.slides.length - 1, this.selectedIndex );

    this.emitEvent( 'cellChange', [ changedCellIndex ] );
    // position slider
    this.select( this.selectedIndex );
    // do not position slider after lazy load
    if ( isPositioningSlider ) {
      this.positionSliderAtSelected();
    }
  };

  // -----  ----- //

  return Flickity;

  } ) );
  }(addRemoveCell));

  var lazyload = {exports: {}};

  (function (module) {
  // lazyload
  ( function( window, factory ) {
    // universal module definition
    if ( module.exports ) {
      // CommonJS
      module.exports = factory(
          window,
          flickity.exports,
          utils.exports
      );
    } else {
      // browser global
      factory(
          window,
          window.Flickity,
          window.fizzyUIUtils
      );
    }

  }( window, function factory( window, Flickity, utils ) {

  Flickity.createMethods.push('_createLazyload');
  var proto = Flickity.prototype;

  proto._createLazyload = function() {
    this.on( 'select', this.lazyLoad );
  };

  proto.lazyLoad = function() {
    var lazyLoad = this.options.lazyLoad;
    if ( !lazyLoad ) {
      return;
    }
    // get adjacent cells, use lazyLoad option for adjacent count
    var adjCount = typeof lazyLoad == 'number' ? lazyLoad : 0;
    var cellElems = this.getAdjacentCellElements( adjCount );
    // get lazy images in those cells
    var lazyImages = [];
    cellElems.forEach( function( cellElem ) {
      var lazyCellImages = getCellLazyImages( cellElem );
      lazyImages = lazyImages.concat( lazyCellImages );
    } );
    // load lazy images
    lazyImages.forEach( function( img ) {
      new LazyLoader( img, this );
    }, this );
  };

  function getCellLazyImages( cellElem ) {
    // check if cell element is lazy image
    if ( cellElem.nodeName == 'IMG' ) {
      var lazyloadAttr = cellElem.getAttribute('data-flickity-lazyload');
      var srcAttr = cellElem.getAttribute('data-flickity-lazyload-src');
      var srcsetAttr = cellElem.getAttribute('data-flickity-lazyload-srcset');
      if ( lazyloadAttr || srcAttr || srcsetAttr ) {
        return [ cellElem ];
      }
    }
    // select lazy images in cell
    var lazySelector = 'img[data-flickity-lazyload], ' +
      'img[data-flickity-lazyload-src], img[data-flickity-lazyload-srcset]';
    var imgs = cellElem.querySelectorAll( lazySelector );
    return utils.makeArray( imgs );
  }

  // -------------------------- LazyLoader -------------------------- //

  /**
   * class to handle loading images
   * @param {Image} img - Image element
   * @param {Flickity} flickity - Flickity instance
   */
  function LazyLoader( img, flickity ) {
    this.img = img;
    this.flickity = flickity;
    this.load();
  }

  LazyLoader.prototype.handleEvent = utils.handleEvent;

  LazyLoader.prototype.load = function() {
    this.img.addEventListener( 'load', this );
    this.img.addEventListener( 'error', this );
    // get src & srcset
    var src = this.img.getAttribute('data-flickity-lazyload') ||
      this.img.getAttribute('data-flickity-lazyload-src');
    var srcset = this.img.getAttribute('data-flickity-lazyload-srcset');
    // set src & serset
    this.img.src = src;
    if ( srcset ) {
      this.img.setAttribute( 'srcset', srcset );
    }
    // remove attr
    this.img.removeAttribute('data-flickity-lazyload');
    this.img.removeAttribute('data-flickity-lazyload-src');
    this.img.removeAttribute('data-flickity-lazyload-srcset');
  };

  LazyLoader.prototype.onload = function( event ) {
    this.complete( event, 'flickity-lazyloaded' );
  };

  LazyLoader.prototype.onerror = function( event ) {
    this.complete( event, 'flickity-lazyerror' );
  };

  LazyLoader.prototype.complete = function( event, className ) {
    // unbind events
    this.img.removeEventListener( 'load', this );
    this.img.removeEventListener( 'error', this );

    var cell = this.flickity.getParentCell( this.img );
    var cellElem = cell && cell.element;
    this.flickity.cellSizeChange( cellElem );

    this.img.classList.add( className );
    this.flickity.dispatchEvent( 'lazyLoad', event, cellElem );
  };

  // -----  ----- //

  Flickity.LazyLoader = LazyLoader;

  return Flickity;

  } ) );
  }(lazyload));

  /*!
   * Flickity v2.2.2
   * Touch, responsive, flickable carousels
   *
   * Licensed GPLv3 for open source use
   * or Flickity Commercial License for commercial use
   *
   * https://flickity.metafizzy.co
   * Copyright 2015-2021 Metafizzy
   */

  (function (module) {
  ( function( window, factory ) {
    // universal module definition
    if ( module.exports ) {
      // CommonJS
      module.exports = factory(
          flickity.exports,
          drag.exports,
          prevNextButton.exports,
          pageDots.exports,
          player.exports,
          addRemoveCell.exports,
          lazyload.exports
      );
    }

  } )( window, function factory( Flickity ) {
    return Flickity;
  } );
  }(js$1));

  var js = js$1.exports;

  var index = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.assign(/*#__PURE__*/Object.create(null), js$1.exports, {
    'default': js
  }));

  /*
   * anime.js v3.2.1
   * (c) 2020 Julian Garnier
   * Released under the MIT license
   * animejs.com
   */

  // Defaults

  var defaultInstanceSettings = {
    update: null,
    begin: null,
    loopBegin: null,
    changeBegin: null,
    change: null,
    changeComplete: null,
    loopComplete: null,
    complete: null,
    loop: 1,
    direction: 'normal',
    autoplay: true,
    timelineOffset: 0
  };

  var defaultTweenSettings = {
    duration: 1000,
    delay: 0,
    endDelay: 0,
    easing: 'easeOutElastic(1, .5)',
    round: 0
  };

  var validTransforms = ['translateX', 'translateY', 'translateZ', 'rotate', 'rotateX', 'rotateY', 'rotateZ', 'scale', 'scaleX', 'scaleY', 'scaleZ', 'skew', 'skewX', 'skewY', 'perspective', 'matrix', 'matrix3d'];

  // Caching

  var cache = {
    CSS: {},
    springs: {}
  };

  // Utils

  function minMax(val, min, max) {
    return Math.min(Math.max(val, min), max);
  }

  function stringContains(str, text) {
    return str.indexOf(text) > -1;
  }

  function applyArguments(func, args) {
    return func.apply(null, args);
  }

  var is = {
    arr: function (a) { return Array.isArray(a); },
    obj: function (a) { return stringContains(Object.prototype.toString.call(a), 'Object'); },
    pth: function (a) { return is.obj(a) && a.hasOwnProperty('totalLength'); },
    svg: function (a) { return a instanceof SVGElement; },
    inp: function (a) { return a instanceof HTMLInputElement; },
    dom: function (a) { return a.nodeType || is.svg(a); },
    str: function (a) { return typeof a === 'string'; },
    fnc: function (a) { return typeof a === 'function'; },
    und: function (a) { return typeof a === 'undefined'; },
    nil: function (a) { return is.und(a) || a === null; },
    hex: function (a) { return /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(a); },
    rgb: function (a) { return /^rgb/.test(a); },
    hsl: function (a) { return /^hsl/.test(a); },
    col: function (a) { return (is.hex(a) || is.rgb(a) || is.hsl(a)); },
    key: function (a) { return !defaultInstanceSettings.hasOwnProperty(a) && !defaultTweenSettings.hasOwnProperty(a) && a !== 'targets' && a !== 'keyframes'; },
  };

  // Easings

  function parseEasingParameters(string) {
    var match = /\(([^)]+)\)/.exec(string);
    return match ? match[1].split(',').map(function (p) { return parseFloat(p); }) : [];
  }

  // Spring solver inspired by Webkit Copyright © 2016 Apple Inc. All rights reserved. https://webkit.org/demos/spring/spring.js

  function spring(string, duration) {

    var params = parseEasingParameters(string);
    var mass = minMax(is.und(params[0]) ? 1 : params[0], .1, 100);
    var stiffness = minMax(is.und(params[1]) ? 100 : params[1], .1, 100);
    var damping = minMax(is.und(params[2]) ? 10 : params[2], .1, 100);
    var velocity =  minMax(is.und(params[3]) ? 0 : params[3], .1, 100);
    var w0 = Math.sqrt(stiffness / mass);
    var zeta = damping / (2 * Math.sqrt(stiffness * mass));
    var wd = zeta < 1 ? w0 * Math.sqrt(1 - zeta * zeta) : 0;
    var a = 1;
    var b = zeta < 1 ? (zeta * w0 + -velocity) / wd : -velocity + w0;

    function solver(t) {
      var progress = duration ? (duration * t) / 1000 : t;
      if (zeta < 1) {
        progress = Math.exp(-progress * zeta * w0) * (a * Math.cos(wd * progress) + b * Math.sin(wd * progress));
      } else {
        progress = (a + b * progress) * Math.exp(-progress * w0);
      }
      if (t === 0 || t === 1) { return t; }
      return 1 - progress;
    }

    function getDuration() {
      var cached = cache.springs[string];
      if (cached) { return cached; }
      var frame = 1/6;
      var elapsed = 0;
      var rest = 0;
      while(true) {
        elapsed += frame;
        if (solver(elapsed) === 1) {
          rest++;
          if (rest >= 16) { break; }
        } else {
          rest = 0;
        }
      }
      var duration = elapsed * frame * 1000;
      cache.springs[string] = duration;
      return duration;
    }

    return duration ? solver : getDuration;

  }

  // Basic steps easing implementation https://developer.mozilla.org/fr/docs/Web/CSS/transition-timing-function

  function steps(steps) {
    if ( steps === void 0 ) steps = 10;

    return function (t) { return Math.ceil((minMax(t, 0.000001, 1)) * steps) * (1 / steps); };
  }

  // BezierEasing https://github.com/gre/bezier-easing

  var bezier = (function () {

    var kSplineTableSize = 11;
    var kSampleStepSize = 1.0 / (kSplineTableSize - 1.0);

    function A(aA1, aA2) { return 1.0 - 3.0 * aA2 + 3.0 * aA1 }
    function B(aA1, aA2) { return 3.0 * aA2 - 6.0 * aA1 }
    function C(aA1)      { return 3.0 * aA1 }

    function calcBezier(aT, aA1, aA2) { return ((A(aA1, aA2) * aT + B(aA1, aA2)) * aT + C(aA1)) * aT }
    function getSlope(aT, aA1, aA2) { return 3.0 * A(aA1, aA2) * aT * aT + 2.0 * B(aA1, aA2) * aT + C(aA1) }

    function binarySubdivide(aX, aA, aB, mX1, mX2) {
      var currentX, currentT, i = 0;
      do {
        currentT = aA + (aB - aA) / 2.0;
        currentX = calcBezier(currentT, mX1, mX2) - aX;
        if (currentX > 0.0) { aB = currentT; } else { aA = currentT; }
      } while (Math.abs(currentX) > 0.0000001 && ++i < 10);
      return currentT;
    }

    function newtonRaphsonIterate(aX, aGuessT, mX1, mX2) {
      for (var i = 0; i < 4; ++i) {
        var currentSlope = getSlope(aGuessT, mX1, mX2);
        if (currentSlope === 0.0) { return aGuessT; }
        var currentX = calcBezier(aGuessT, mX1, mX2) - aX;
        aGuessT -= currentX / currentSlope;
      }
      return aGuessT;
    }

    function bezier(mX1, mY1, mX2, mY2) {

      if (!(0 <= mX1 && mX1 <= 1 && 0 <= mX2 && mX2 <= 1)) { return; }
      var sampleValues = new Float32Array(kSplineTableSize);

      if (mX1 !== mY1 || mX2 !== mY2) {
        for (var i = 0; i < kSplineTableSize; ++i) {
          sampleValues[i] = calcBezier(i * kSampleStepSize, mX1, mX2);
        }
      }

      function getTForX(aX) {

        var intervalStart = 0;
        var currentSample = 1;
        var lastSample = kSplineTableSize - 1;

        for (; currentSample !== lastSample && sampleValues[currentSample] <= aX; ++currentSample) {
          intervalStart += kSampleStepSize;
        }

        --currentSample;

        var dist = (aX - sampleValues[currentSample]) / (sampleValues[currentSample + 1] - sampleValues[currentSample]);
        var guessForT = intervalStart + dist * kSampleStepSize;
        var initialSlope = getSlope(guessForT, mX1, mX2);

        if (initialSlope >= 0.001) {
          return newtonRaphsonIterate(aX, guessForT, mX1, mX2);
        } else if (initialSlope === 0.0) {
          return guessForT;
        } else {
          return binarySubdivide(aX, intervalStart, intervalStart + kSampleStepSize, mX1, mX2);
        }

      }

      return function (x) {
        if (mX1 === mY1 && mX2 === mY2) { return x; }
        if (x === 0 || x === 1) { return x; }
        return calcBezier(getTForX(x), mY1, mY2);
      }

    }

    return bezier;

  })();

  var penner = (function () {

    // Based on jQuery UI's implemenation of easing equations from Robert Penner (http://www.robertpenner.com/easing)

    var eases = { linear: function () { return function (t) { return t; }; } };

    var functionEasings = {
      Sine: function () { return function (t) { return 1 - Math.cos(t * Math.PI / 2); }; },
      Circ: function () { return function (t) { return 1 - Math.sqrt(1 - t * t); }; },
      Back: function () { return function (t) { return t * t * (3 * t - 2); }; },
      Bounce: function () { return function (t) {
        var pow2, b = 4;
        while (t < (( pow2 = Math.pow(2, --b)) - 1) / 11) {}
        return 1 / Math.pow(4, 3 - b) - 7.5625 * Math.pow(( pow2 * 3 - 2 ) / 22 - t, 2)
      }; },
      Elastic: function (amplitude, period) {
        if ( amplitude === void 0 ) amplitude = 1;
        if ( period === void 0 ) period = .5;

        var a = minMax(amplitude, 1, 10);
        var p = minMax(period, .1, 2);
        return function (t) {
          return (t === 0 || t === 1) ? t : 
            -a * Math.pow(2, 10 * (t - 1)) * Math.sin((((t - 1) - (p / (Math.PI * 2) * Math.asin(1 / a))) * (Math.PI * 2)) / p);
        }
      }
    };

    var baseEasings = ['Quad', 'Cubic', 'Quart', 'Quint', 'Expo'];

    baseEasings.forEach(function (name, i) {
      functionEasings[name] = function () { return function (t) { return Math.pow(t, i + 2); }; };
    });

    Object.keys(functionEasings).forEach(function (name) {
      var easeIn = functionEasings[name];
      eases['easeIn' + name] = easeIn;
      eases['easeOut' + name] = function (a, b) { return function (t) { return 1 - easeIn(a, b)(1 - t); }; };
      eases['easeInOut' + name] = function (a, b) { return function (t) { return t < 0.5 ? easeIn(a, b)(t * 2) / 2 : 
        1 - easeIn(a, b)(t * -2 + 2) / 2; }; };
      eases['easeOutIn' + name] = function (a, b) { return function (t) { return t < 0.5 ? (1 - easeIn(a, b)(1 - t * 2)) / 2 : 
        (easeIn(a, b)(t * 2 - 1) + 1) / 2; }; };
    });

    return eases;

  })();

  function parseEasings(easing, duration) {
    if (is.fnc(easing)) { return easing; }
    var name = easing.split('(')[0];
    var ease = penner[name];
    var args = parseEasingParameters(easing);
    switch (name) {
      case 'spring' : return spring(easing, duration);
      case 'cubicBezier' : return applyArguments(bezier, args);
      case 'steps' : return applyArguments(steps, args);
      default : return applyArguments(ease, args);
    }
  }

  // Strings

  function selectString(str) {
    try {
      var nodes = document.querySelectorAll(str);
      return nodes;
    } catch(e) {
      return;
    }
  }

  // Arrays

  function filterArray(arr, callback) {
    var len = arr.length;
    var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
    var result = [];
    for (var i = 0; i < len; i++) {
      if (i in arr) {
        var val = arr[i];
        if (callback.call(thisArg, val, i, arr)) {
          result.push(val);
        }
      }
    }
    return result;
  }

  function flattenArray(arr) {
    return arr.reduce(function (a, b) { return a.concat(is.arr(b) ? flattenArray(b) : b); }, []);
  }

  function toArray(o) {
    if (is.arr(o)) { return o; }
    if (is.str(o)) { o = selectString(o) || o; }
    if (o instanceof NodeList || o instanceof HTMLCollection) { return [].slice.call(o); }
    return [o];
  }

  function arrayContains(arr, val) {
    return arr.some(function (a) { return a === val; });
  }

  // Objects

  function cloneObject(o) {
    var clone = {};
    for (var p in o) { clone[p] = o[p]; }
    return clone;
  }

  function replaceObjectProps(o1, o2) {
    var o = cloneObject(o1);
    for (var p in o1) { o[p] = o2.hasOwnProperty(p) ? o2[p] : o1[p]; }
    return o;
  }

  function mergeObjects(o1, o2) {
    var o = cloneObject(o1);
    for (var p in o2) { o[p] = is.und(o1[p]) ? o2[p] : o1[p]; }
    return o;
  }

  // Colors

  function rgbToRgba(rgbValue) {
    var rgb = /rgb\((\d+,\s*[\d]+,\s*[\d]+)\)/g.exec(rgbValue);
    return rgb ? ("rgba(" + (rgb[1]) + ",1)") : rgbValue;
  }

  function hexToRgba(hexValue) {
    var rgx = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    var hex = hexValue.replace(rgx, function (m, r, g, b) { return r + r + g + g + b + b; } );
    var rgb = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    var r = parseInt(rgb[1], 16);
    var g = parseInt(rgb[2], 16);
    var b = parseInt(rgb[3], 16);
    return ("rgba(" + r + "," + g + "," + b + ",1)");
  }

  function hslToRgba(hslValue) {
    var hsl = /hsl\((\d+),\s*([\d.]+)%,\s*([\d.]+)%\)/g.exec(hslValue) || /hsla\((\d+),\s*([\d.]+)%,\s*([\d.]+)%,\s*([\d.]+)\)/g.exec(hslValue);
    var h = parseInt(hsl[1], 10) / 360;
    var s = parseInt(hsl[2], 10) / 100;
    var l = parseInt(hsl[3], 10) / 100;
    var a = hsl[4] || 1;
    function hue2rgb(p, q, t) {
      if (t < 0) { t += 1; }
      if (t > 1) { t -= 1; }
      if (t < 1/6) { return p + (q - p) * 6 * t; }
      if (t < 1/2) { return q; }
      if (t < 2/3) { return p + (q - p) * (2/3 - t) * 6; }
      return p;
    }
    var r, g, b;
    if (s == 0) {
      r = g = b = l;
    } else {
      var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      var p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    return ("rgba(" + (r * 255) + "," + (g * 255) + "," + (b * 255) + "," + a + ")");
  }

  function colorToRgb(val) {
    if (is.rgb(val)) { return rgbToRgba(val); }
    if (is.hex(val)) { return hexToRgba(val); }
    if (is.hsl(val)) { return hslToRgba(val); }
  }

  // Units

  function getUnit(val) {
    var split = /[+-]?\d*\.?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?(%|px|pt|em|rem|in|cm|mm|ex|ch|pc|vw|vh|vmin|vmax|deg|rad|turn)?$/.exec(val);
    if (split) { return split[1]; }
  }

  function getTransformUnit(propName) {
    if (stringContains(propName, 'translate') || propName === 'perspective') { return 'px'; }
    if (stringContains(propName, 'rotate') || stringContains(propName, 'skew')) { return 'deg'; }
  }

  // Values

  function getFunctionValue(val, animatable) {
    if (!is.fnc(val)) { return val; }
    return val(animatable.target, animatable.id, animatable.total);
  }

  function getAttribute(el, prop) {
    return el.getAttribute(prop);
  }

  function convertPxToUnit(el, value, unit) {
    var valueUnit = getUnit(value);
    if (arrayContains([unit, 'deg', 'rad', 'turn'], valueUnit)) { return value; }
    var cached = cache.CSS[value + unit];
    if (!is.und(cached)) { return cached; }
    var baseline = 100;
    var tempEl = document.createElement(el.tagName);
    var parentEl = (el.parentNode && (el.parentNode !== document)) ? el.parentNode : document.body;
    parentEl.appendChild(tempEl);
    tempEl.style.position = 'absolute';
    tempEl.style.width = baseline + unit;
    var factor = baseline / tempEl.offsetWidth;
    parentEl.removeChild(tempEl);
    var convertedUnit = factor * parseFloat(value);
    cache.CSS[value + unit] = convertedUnit;
    return convertedUnit;
  }

  function getCSSValue(el, prop, unit) {
    if (prop in el.style) {
      var uppercasePropName = prop.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
      var value = el.style[prop] || getComputedStyle(el).getPropertyValue(uppercasePropName) || '0';
      return unit ? convertPxToUnit(el, value, unit) : value;
    }
  }

  function getAnimationType(el, prop) {
    if (is.dom(el) && !is.inp(el) && (!is.nil(getAttribute(el, prop)) || (is.svg(el) && el[prop]))) { return 'attribute'; }
    if (is.dom(el) && arrayContains(validTransforms, prop)) { return 'transform'; }
    if (is.dom(el) && (prop !== 'transform' && getCSSValue(el, prop))) { return 'css'; }
    if (el[prop] != null) { return 'object'; }
  }

  function getElementTransforms(el) {
    if (!is.dom(el)) { return; }
    var str = el.style.transform || '';
    var reg  = /(\w+)\(([^)]*)\)/g;
    var transforms = new Map();
    var m; while (m = reg.exec(str)) { transforms.set(m[1], m[2]); }
    return transforms;
  }

  function getTransformValue(el, propName, animatable, unit) {
    var defaultVal = stringContains(propName, 'scale') ? 1 : 0 + getTransformUnit(propName);
    var value = getElementTransforms(el).get(propName) || defaultVal;
    if (animatable) {
      animatable.transforms.list.set(propName, value);
      animatable.transforms['last'] = propName;
    }
    return unit ? convertPxToUnit(el, value, unit) : value;
  }

  function getOriginalTargetValue(target, propName, unit, animatable) {
    switch (getAnimationType(target, propName)) {
      case 'transform': return getTransformValue(target, propName, animatable, unit);
      case 'css': return getCSSValue(target, propName, unit);
      case 'attribute': return getAttribute(target, propName);
      default: return target[propName] || 0;
    }
  }

  function getRelativeValue(to, from) {
    var operator = /^(\*=|\+=|-=)/.exec(to);
    if (!operator) { return to; }
    var u = getUnit(to) || 0;
    var x = parseFloat(from);
    var y = parseFloat(to.replace(operator[0], ''));
    switch (operator[0][0]) {
      case '+': return x + y + u;
      case '-': return x - y + u;
      case '*': return x * y + u;
    }
  }

  function validateValue(val, unit) {
    if (is.col(val)) { return colorToRgb(val); }
    if (/\s/g.test(val)) { return val; }
    var originalUnit = getUnit(val);
    var unitLess = originalUnit ? val.substr(0, val.length - originalUnit.length) : val;
    if (unit) { return unitLess + unit; }
    return unitLess;
  }

  // getTotalLength() equivalent for circle, rect, polyline, polygon and line shapes
  // adapted from https://gist.github.com/SebLambla/3e0550c496c236709744

  function getDistance(p1, p2) {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  }

  function getCircleLength(el) {
    return Math.PI * 2 * getAttribute(el, 'r');
  }

  function getRectLength(el) {
    return (getAttribute(el, 'width') * 2) + (getAttribute(el, 'height') * 2);
  }

  function getLineLength(el) {
    return getDistance(
      {x: getAttribute(el, 'x1'), y: getAttribute(el, 'y1')}, 
      {x: getAttribute(el, 'x2'), y: getAttribute(el, 'y2')}
    );
  }

  function getPolylineLength(el) {
    var points = el.points;
    var totalLength = 0;
    var previousPos;
    for (var i = 0 ; i < points.numberOfItems; i++) {
      var currentPos = points.getItem(i);
      if (i > 0) { totalLength += getDistance(previousPos, currentPos); }
      previousPos = currentPos;
    }
    return totalLength;
  }

  function getPolygonLength(el) {
    var points = el.points;
    return getPolylineLength(el) + getDistance(points.getItem(points.numberOfItems - 1), points.getItem(0));
  }

  // Path animation

  function getTotalLength(el) {
    if (el.getTotalLength) { return el.getTotalLength(); }
    switch(el.tagName.toLowerCase()) {
      case 'circle': return getCircleLength(el);
      case 'rect': return getRectLength(el);
      case 'line': return getLineLength(el);
      case 'polyline': return getPolylineLength(el);
      case 'polygon': return getPolygonLength(el);
    }
  }

  function setDashoffset(el) {
    var pathLength = getTotalLength(el);
    el.setAttribute('stroke-dasharray', pathLength);
    return pathLength;
  }

  // Motion path

  function getParentSvgEl(el) {
    var parentEl = el.parentNode;
    while (is.svg(parentEl)) {
      if (!is.svg(parentEl.parentNode)) { break; }
      parentEl = parentEl.parentNode;
    }
    return parentEl;
  }

  function getParentSvg(pathEl, svgData) {
    var svg = svgData || {};
    var parentSvgEl = svg.el || getParentSvgEl(pathEl);
    var rect = parentSvgEl.getBoundingClientRect();
    var viewBoxAttr = getAttribute(parentSvgEl, 'viewBox');
    var width = rect.width;
    var height = rect.height;
    var viewBox = svg.viewBox || (viewBoxAttr ? viewBoxAttr.split(' ') : [0, 0, width, height]);
    return {
      el: parentSvgEl,
      viewBox: viewBox,
      x: viewBox[0] / 1,
      y: viewBox[1] / 1,
      w: width,
      h: height,
      vW: viewBox[2],
      vH: viewBox[3]
    }
  }

  function getPath(path, percent) {
    var pathEl = is.str(path) ? selectString(path)[0] : path;
    var p = percent || 100;
    return function(property) {
      return {
        property: property,
        el: pathEl,
        svg: getParentSvg(pathEl),
        totalLength: getTotalLength(pathEl) * (p / 100)
      }
    }
  }

  function getPathProgress(path, progress, isPathTargetInsideSVG) {
    function point(offset) {
      if ( offset === void 0 ) offset = 0;

      var l = progress + offset >= 1 ? progress + offset : 0;
      return path.el.getPointAtLength(l);
    }
    var svg = getParentSvg(path.el, path.svg);
    var p = point();
    var p0 = point(-1);
    var p1 = point(+1);
    var scaleX = isPathTargetInsideSVG ? 1 : svg.w / svg.vW;
    var scaleY = isPathTargetInsideSVG ? 1 : svg.h / svg.vH;
    switch (path.property) {
      case 'x': return (p.x - svg.x) * scaleX;
      case 'y': return (p.y - svg.y) * scaleY;
      case 'angle': return Math.atan2(p1.y - p0.y, p1.x - p0.x) * 180 / Math.PI;
    }
  }

  // Decompose value

  function decomposeValue(val, unit) {
    // const rgx = /-?\d*\.?\d+/g; // handles basic numbers
    // const rgx = /[+-]?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g; // handles exponents notation
    var rgx = /[+-]?\d*\.?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g; // handles exponents notation
    var value = validateValue((is.pth(val) ? val.totalLength : val), unit) + '';
    return {
      original: value,
      numbers: value.match(rgx) ? value.match(rgx).map(Number) : [0],
      strings: (is.str(val) || unit) ? value.split(rgx) : []
    }
  }

  // Animatables

  function parseTargets(targets) {
    var targetsArray = targets ? (flattenArray(is.arr(targets) ? targets.map(toArray) : toArray(targets))) : [];
    return filterArray(targetsArray, function (item, pos, self) { return self.indexOf(item) === pos; });
  }

  function getAnimatables(targets) {
    var parsed = parseTargets(targets);
    return parsed.map(function (t, i) {
      return {target: t, id: i, total: parsed.length, transforms: { list: getElementTransforms(t) } };
    });
  }

  // Properties

  function normalizePropertyTweens(prop, tweenSettings) {
    var settings = cloneObject(tweenSettings);
    // Override duration if easing is a spring
    if (/^spring/.test(settings.easing)) { settings.duration = spring(settings.easing); }
    if (is.arr(prop)) {
      var l = prop.length;
      var isFromTo = (l === 2 && !is.obj(prop[0]));
      if (!isFromTo) {
        // Duration divided by the number of tweens
        if (!is.fnc(tweenSettings.duration)) { settings.duration = tweenSettings.duration / l; }
      } else {
        // Transform [from, to] values shorthand to a valid tween value
        prop = {value: prop};
      }
    }
    var propArray = is.arr(prop) ? prop : [prop];
    return propArray.map(function (v, i) {
      var obj = (is.obj(v) && !is.pth(v)) ? v : {value: v};
      // Default delay value should only be applied to the first tween
      if (is.und(obj.delay)) { obj.delay = !i ? tweenSettings.delay : 0; }
      // Default endDelay value should only be applied to the last tween
      if (is.und(obj.endDelay)) { obj.endDelay = i === propArray.length - 1 ? tweenSettings.endDelay : 0; }
      return obj;
    }).map(function (k) { return mergeObjects(k, settings); });
  }


  function flattenKeyframes(keyframes) {
    var propertyNames = filterArray(flattenArray(keyframes.map(function (key) { return Object.keys(key); })), function (p) { return is.key(p); })
    .reduce(function (a,b) { if (a.indexOf(b) < 0) { a.push(b); } return a; }, []);
    var properties = {};
    var loop = function ( i ) {
      var propName = propertyNames[i];
      properties[propName] = keyframes.map(function (key) {
        var newKey = {};
        for (var p in key) {
          if (is.key(p)) {
            if (p == propName) { newKey.value = key[p]; }
          } else {
            newKey[p] = key[p];
          }
        }
        return newKey;
      });
    };

    for (var i = 0; i < propertyNames.length; i++) loop( i );
    return properties;
  }

  function getProperties(tweenSettings, params) {
    var properties = [];
    var keyframes = params.keyframes;
    if (keyframes) { params = mergeObjects(flattenKeyframes(keyframes), params); }
    for (var p in params) {
      if (is.key(p)) {
        properties.push({
          name: p,
          tweens: normalizePropertyTweens(params[p], tweenSettings)
        });
      }
    }
    return properties;
  }

  // Tweens

  function normalizeTweenValues(tween, animatable) {
    var t = {};
    for (var p in tween) {
      var value = getFunctionValue(tween[p], animatable);
      if (is.arr(value)) {
        value = value.map(function (v) { return getFunctionValue(v, animatable); });
        if (value.length === 1) { value = value[0]; }
      }
      t[p] = value;
    }
    t.duration = parseFloat(t.duration);
    t.delay = parseFloat(t.delay);
    return t;
  }

  function normalizeTweens(prop, animatable) {
    var previousTween;
    return prop.tweens.map(function (t) {
      var tween = normalizeTweenValues(t, animatable);
      var tweenValue = tween.value;
      var to = is.arr(tweenValue) ? tweenValue[1] : tweenValue;
      var toUnit = getUnit(to);
      var originalValue = getOriginalTargetValue(animatable.target, prop.name, toUnit, animatable);
      var previousValue = previousTween ? previousTween.to.original : originalValue;
      var from = is.arr(tweenValue) ? tweenValue[0] : previousValue;
      var fromUnit = getUnit(from) || getUnit(originalValue);
      var unit = toUnit || fromUnit;
      if (is.und(to)) { to = previousValue; }
      tween.from = decomposeValue(from, unit);
      tween.to = decomposeValue(getRelativeValue(to, from), unit);
      tween.start = previousTween ? previousTween.end : 0;
      tween.end = tween.start + tween.delay + tween.duration + tween.endDelay;
      tween.easing = parseEasings(tween.easing, tween.duration);
      tween.isPath = is.pth(tweenValue);
      tween.isPathTargetInsideSVG = tween.isPath && is.svg(animatable.target);
      tween.isColor = is.col(tween.from.original);
      if (tween.isColor) { tween.round = 1; }
      previousTween = tween;
      return tween;
    });
  }

  // Tween progress

  var setProgressValue = {
    css: function (t, p, v) { return t.style[p] = v; },
    attribute: function (t, p, v) { return t.setAttribute(p, v); },
    object: function (t, p, v) { return t[p] = v; },
    transform: function (t, p, v, transforms, manual) {
      transforms.list.set(p, v);
      if (p === transforms.last || manual) {
        var str = '';
        transforms.list.forEach(function (value, prop) { str += prop + "(" + value + ") "; });
        t.style.transform = str;
      }
    }
  };

  // Set Value helper

  function setTargetsValue(targets, properties) {
    var animatables = getAnimatables(targets);
    animatables.forEach(function (animatable) {
      for (var property in properties) {
        var value = getFunctionValue(properties[property], animatable);
        var target = animatable.target;
        var valueUnit = getUnit(value);
        var originalValue = getOriginalTargetValue(target, property, valueUnit, animatable);
        var unit = valueUnit || getUnit(originalValue);
        var to = getRelativeValue(validateValue(value, unit), originalValue);
        var animType = getAnimationType(target, property);
        setProgressValue[animType](target, property, to, animatable.transforms, true);
      }
    });
  }

  // Animations

  function createAnimation(animatable, prop) {
    var animType = getAnimationType(animatable.target, prop.name);
    if (animType) {
      var tweens = normalizeTweens(prop, animatable);
      var lastTween = tweens[tweens.length - 1];
      return {
        type: animType,
        property: prop.name,
        animatable: animatable,
        tweens: tweens,
        duration: lastTween.end,
        delay: tweens[0].delay,
        endDelay: lastTween.endDelay
      }
    }
  }

  function getAnimations(animatables, properties) {
    return filterArray(flattenArray(animatables.map(function (animatable) {
      return properties.map(function (prop) {
        return createAnimation(animatable, prop);
      });
    })), function (a) { return !is.und(a); });
  }

  // Create Instance

  function getInstanceTimings(animations, tweenSettings) {
    var animLength = animations.length;
    var getTlOffset = function (anim) { return anim.timelineOffset ? anim.timelineOffset : 0; };
    var timings = {};
    timings.duration = animLength ? Math.max.apply(Math, animations.map(function (anim) { return getTlOffset(anim) + anim.duration; })) : tweenSettings.duration;
    timings.delay = animLength ? Math.min.apply(Math, animations.map(function (anim) { return getTlOffset(anim) + anim.delay; })) : tweenSettings.delay;
    timings.endDelay = animLength ? timings.duration - Math.max.apply(Math, animations.map(function (anim) { return getTlOffset(anim) + anim.duration - anim.endDelay; })) : tweenSettings.endDelay;
    return timings;
  }

  var instanceID = 0;

  function createNewInstance(params) {
    var instanceSettings = replaceObjectProps(defaultInstanceSettings, params);
    var tweenSettings = replaceObjectProps(defaultTweenSettings, params);
    var properties = getProperties(tweenSettings, params);
    var animatables = getAnimatables(params.targets);
    var animations = getAnimations(animatables, properties);
    var timings = getInstanceTimings(animations, tweenSettings);
    var id = instanceID;
    instanceID++;
    return mergeObjects(instanceSettings, {
      id: id,
      children: [],
      animatables: animatables,
      animations: animations,
      duration: timings.duration,
      delay: timings.delay,
      endDelay: timings.endDelay
    });
  }

  // Core

  var activeInstances = [];

  var engine = (function () {
    var raf;

    function play() {
      if (!raf && (!isDocumentHidden() || !anime.suspendWhenDocumentHidden) && activeInstances.length > 0) {
        raf = requestAnimationFrame(step);
      }
    }
    function step(t) {
      // memo on algorithm issue:
      // dangerous iteration over mutable `activeInstances`
      // (that collection may be updated from within callbacks of `tick`-ed animation instances)
      var activeInstancesLength = activeInstances.length;
      var i = 0;
      while (i < activeInstancesLength) {
        var activeInstance = activeInstances[i];
        if (!activeInstance.paused) {
          activeInstance.tick(t);
          i++;
        } else {
          activeInstances.splice(i, 1);
          activeInstancesLength--;
        }
      }
      raf = i > 0 ? requestAnimationFrame(step) : undefined;
    }

    function handleVisibilityChange() {
      if (!anime.suspendWhenDocumentHidden) { return; }

      if (isDocumentHidden()) {
        // suspend ticks
        raf = cancelAnimationFrame(raf);
      } else { // is back to active tab
        // first adjust animations to consider the time that ticks were suspended
        activeInstances.forEach(
          function (instance) { return instance ._onDocumentVisibility(); }
        );
        engine();
      }
    }
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return play;
  })();

  function isDocumentHidden() {
    return !!document && document.hidden;
  }

  // Public Instance

  function anime(params) {
    if ( params === void 0 ) params = {};


    var startTime = 0, lastTime = 0, now = 0;
    var children, childrenLength = 0;
    var resolve = null;

    function makePromise(instance) {
      var promise = window.Promise && new Promise(function (_resolve) { return resolve = _resolve; });
      instance.finished = promise;
      return promise;
    }

    var instance = createNewInstance(params);
    makePromise(instance);

    function toggleInstanceDirection() {
      var direction = instance.direction;
      if (direction !== 'alternate') {
        instance.direction = direction !== 'normal' ? 'normal' : 'reverse';
      }
      instance.reversed = !instance.reversed;
      children.forEach(function (child) { return child.reversed = instance.reversed; });
    }

    function adjustTime(time) {
      return instance.reversed ? instance.duration - time : time;
    }

    function resetTime() {
      startTime = 0;
      lastTime = adjustTime(instance.currentTime) * (1 / anime.speed);
    }

    function seekChild(time, child) {
      if (child) { child.seek(time - child.timelineOffset); }
    }

    function syncInstanceChildren(time) {
      if (!instance.reversePlayback) {
        for (var i = 0; i < childrenLength; i++) { seekChild(time, children[i]); }
      } else {
        for (var i$1 = childrenLength; i$1--;) { seekChild(time, children[i$1]); }
      }
    }

    function setAnimationsProgress(insTime) {
      var i = 0;
      var animations = instance.animations;
      var animationsLength = animations.length;
      while (i < animationsLength) {
        var anim = animations[i];
        var animatable = anim.animatable;
        var tweens = anim.tweens;
        var tweenLength = tweens.length - 1;
        var tween = tweens[tweenLength];
        // Only check for keyframes if there is more than one tween
        if (tweenLength) { tween = filterArray(tweens, function (t) { return (insTime < t.end); })[0] || tween; }
        var elapsed = minMax(insTime - tween.start - tween.delay, 0, tween.duration) / tween.duration;
        var eased = isNaN(elapsed) ? 1 : tween.easing(elapsed);
        var strings = tween.to.strings;
        var round = tween.round;
        var numbers = [];
        var toNumbersLength = tween.to.numbers.length;
        var progress = (void 0);
        for (var n = 0; n < toNumbersLength; n++) {
          var value = (void 0);
          var toNumber = tween.to.numbers[n];
          var fromNumber = tween.from.numbers[n] || 0;
          if (!tween.isPath) {
            value = fromNumber + (eased * (toNumber - fromNumber));
          } else {
            value = getPathProgress(tween.value, eased * toNumber, tween.isPathTargetInsideSVG);
          }
          if (round) {
            if (!(tween.isColor && n > 2)) {
              value = Math.round(value * round) / round;
            }
          }
          numbers.push(value);
        }
        // Manual Array.reduce for better performances
        var stringsLength = strings.length;
        if (!stringsLength) {
          progress = numbers[0];
        } else {
          progress = strings[0];
          for (var s = 0; s < stringsLength; s++) {
            strings[s];
            var b = strings[s + 1];
            var n$1 = numbers[s];
            if (!isNaN(n$1)) {
              if (!b) {
                progress += n$1 + ' ';
              } else {
                progress += n$1 + b;
              }
            }
          }
        }
        setProgressValue[anim.type](animatable.target, anim.property, progress, animatable.transforms);
        anim.currentValue = progress;
        i++;
      }
    }

    function setCallback(cb) {
      if (instance[cb] && !instance.passThrough) { instance[cb](instance); }
    }

    function countIteration() {
      if (instance.remaining && instance.remaining !== true) {
        instance.remaining--;
      }
    }

    function setInstanceProgress(engineTime) {
      var insDuration = instance.duration;
      var insDelay = instance.delay;
      var insEndDelay = insDuration - instance.endDelay;
      var insTime = adjustTime(engineTime);
      instance.progress = minMax((insTime / insDuration) * 100, 0, 100);
      instance.reversePlayback = insTime < instance.currentTime;
      if (children) { syncInstanceChildren(insTime); }
      if (!instance.began && instance.currentTime > 0) {
        instance.began = true;
        setCallback('begin');
      }
      if (!instance.loopBegan && instance.currentTime > 0) {
        instance.loopBegan = true;
        setCallback('loopBegin');
      }
      if (insTime <= insDelay && instance.currentTime !== 0) {
        setAnimationsProgress(0);
      }
      if ((insTime >= insEndDelay && instance.currentTime !== insDuration) || !insDuration) {
        setAnimationsProgress(insDuration);
      }
      if (insTime > insDelay && insTime < insEndDelay) {
        if (!instance.changeBegan) {
          instance.changeBegan = true;
          instance.changeCompleted = false;
          setCallback('changeBegin');
        }
        setCallback('change');
        setAnimationsProgress(insTime);
      } else {
        if (instance.changeBegan) {
          instance.changeCompleted = true;
          instance.changeBegan = false;
          setCallback('changeComplete');
        }
      }
      instance.currentTime = minMax(insTime, 0, insDuration);
      if (instance.began) { setCallback('update'); }
      if (engineTime >= insDuration) {
        lastTime = 0;
        countIteration();
        if (!instance.remaining) {
          instance.paused = true;
          if (!instance.completed) {
            instance.completed = true;
            setCallback('loopComplete');
            setCallback('complete');
            if (!instance.passThrough && 'Promise' in window) {
              resolve();
              makePromise(instance);
            }
          }
        } else {
          startTime = now;
          setCallback('loopComplete');
          instance.loopBegan = false;
          if (instance.direction === 'alternate') {
            toggleInstanceDirection();
          }
        }
      }
    }

    instance.reset = function() {
      var direction = instance.direction;
      instance.passThrough = false;
      instance.currentTime = 0;
      instance.progress = 0;
      instance.paused = true;
      instance.began = false;
      instance.loopBegan = false;
      instance.changeBegan = false;
      instance.completed = false;
      instance.changeCompleted = false;
      instance.reversePlayback = false;
      instance.reversed = direction === 'reverse';
      instance.remaining = instance.loop;
      children = instance.children;
      childrenLength = children.length;
      for (var i = childrenLength; i--;) { instance.children[i].reset(); }
      if (instance.reversed && instance.loop !== true || (direction === 'alternate' && instance.loop === 1)) { instance.remaining++; }
      setAnimationsProgress(instance.reversed ? instance.duration : 0);
    };

    // internal method (for engine) to adjust animation timings before restoring engine ticks (rAF)
    instance._onDocumentVisibility = resetTime;

    // Set Value helper

    instance.set = function(targets, properties) {
      setTargetsValue(targets, properties);
      return instance;
    };

    instance.tick = function(t) {
      now = t;
      if (!startTime) { startTime = now; }
      setInstanceProgress((now + (lastTime - startTime)) * anime.speed);
    };

    instance.seek = function(time) {
      setInstanceProgress(adjustTime(time));
    };

    instance.pause = function() {
      instance.paused = true;
      resetTime();
    };

    instance.play = function() {
      if (!instance.paused) { return; }
      if (instance.completed) { instance.reset(); }
      instance.paused = false;
      activeInstances.push(instance);
      resetTime();
      engine();
    };

    instance.reverse = function() {
      toggleInstanceDirection();
      instance.completed = instance.reversed ? false : true;
      resetTime();
    };

    instance.restart = function() {
      instance.reset();
      instance.play();
    };

    instance.remove = function(targets) {
      var targetsArray = parseTargets(targets);
      removeTargetsFromInstance(targetsArray, instance);
    };

    instance.reset();

    if (instance.autoplay) { instance.play(); }

    return instance;

  }

  // Remove targets from animation

  function removeTargetsFromAnimations(targetsArray, animations) {
    for (var a = animations.length; a--;) {
      if (arrayContains(targetsArray, animations[a].animatable.target)) {
        animations.splice(a, 1);
      }
    }
  }

  function removeTargetsFromInstance(targetsArray, instance) {
    var animations = instance.animations;
    var children = instance.children;
    removeTargetsFromAnimations(targetsArray, animations);
    for (var c = children.length; c--;) {
      var child = children[c];
      var childAnimations = child.animations;
      removeTargetsFromAnimations(targetsArray, childAnimations);
      if (!childAnimations.length && !child.children.length) { children.splice(c, 1); }
    }
    if (!animations.length && !children.length) { instance.pause(); }
  }

  function removeTargetsFromActiveInstances(targets) {
    var targetsArray = parseTargets(targets);
    for (var i = activeInstances.length; i--;) {
      var instance = activeInstances[i];
      removeTargetsFromInstance(targetsArray, instance);
    }
  }

  // Stagger helpers

  function stagger(val, params) {
    if ( params === void 0 ) params = {};

    var direction = params.direction || 'normal';
    var easing = params.easing ? parseEasings(params.easing) : null;
    var grid = params.grid;
    var axis = params.axis;
    var fromIndex = params.from || 0;
    var fromFirst = fromIndex === 'first';
    var fromCenter = fromIndex === 'center';
    var fromLast = fromIndex === 'last';
    var isRange = is.arr(val);
    var val1 = isRange ? parseFloat(val[0]) : parseFloat(val);
    var val2 = isRange ? parseFloat(val[1]) : 0;
    var unit = getUnit(isRange ? val[1] : val) || 0;
    var start = params.start || 0 + (isRange ? val1 : 0);
    var values = [];
    var maxValue = 0;
    return function (el, i, t) {
      if (fromFirst) { fromIndex = 0; }
      if (fromCenter) { fromIndex = (t - 1) / 2; }
      if (fromLast) { fromIndex = t - 1; }
      if (!values.length) {
        for (var index = 0; index < t; index++) {
          if (!grid) {
            values.push(Math.abs(fromIndex - index));
          } else {
            var fromX = !fromCenter ? fromIndex%grid[0] : (grid[0]-1)/2;
            var fromY = !fromCenter ? Math.floor(fromIndex/grid[0]) : (grid[1]-1)/2;
            var toX = index%grid[0];
            var toY = Math.floor(index/grid[0]);
            var distanceX = fromX - toX;
            var distanceY = fromY - toY;
            var value = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
            if (axis === 'x') { value = -distanceX; }
            if (axis === 'y') { value = -distanceY; }
            values.push(value);
          }
          maxValue = Math.max.apply(Math, values);
        }
        if (easing) { values = values.map(function (val) { return easing(val / maxValue) * maxValue; }); }
        if (direction === 'reverse') { values = values.map(function (val) { return axis ? (val < 0) ? val * -1 : -val : Math.abs(maxValue - val); }); }
      }
      var spacing = isRange ? (val2 - val1) / maxValue : val1;
      return start + (spacing * (Math.round(values[i] * 100) / 100)) + unit;
    }
  }

  // Timeline

  function timeline(params) {
    if ( params === void 0 ) params = {};

    var tl = anime(params);
    tl.duration = 0;
    tl.add = function(instanceParams, timelineOffset) {
      var tlIndex = activeInstances.indexOf(tl);
      var children = tl.children;
      if (tlIndex > -1) { activeInstances.splice(tlIndex, 1); }
      function passThrough(ins) { ins.passThrough = true; }
      for (var i = 0; i < children.length; i++) { passThrough(children[i]); }
      var insParams = mergeObjects(instanceParams, replaceObjectProps(defaultTweenSettings, params));
      insParams.targets = insParams.targets || params.targets;
      var tlDuration = tl.duration;
      insParams.autoplay = false;
      insParams.direction = tl.direction;
      insParams.timelineOffset = is.und(timelineOffset) ? tlDuration : getRelativeValue(timelineOffset, tlDuration);
      passThrough(tl);
      tl.seek(insParams.timelineOffset);
      var ins = anime(insParams);
      passThrough(ins);
      children.push(ins);
      var timings = getInstanceTimings(children, params);
      tl.delay = timings.delay;
      tl.endDelay = timings.endDelay;
      tl.duration = timings.duration;
      tl.seek(0);
      tl.reset();
      if (tl.autoplay) { tl.play(); }
      return tl;
    };
    return tl;
  }

  anime.version = '3.2.1';
  anime.speed = 1;
  // TODO:#review: naming, documentation
  anime.suspendWhenDocumentHidden = true;
  anime.running = activeInstances;
  anime.remove = removeTargetsFromActiveInstances;
  anime.get = getOriginalTargetValue;
  anime.set = setTargetsValue;
  anime.convertPx = convertPxToUnit;
  anime.path = getPath;
  anime.setDashoffset = setDashoffset;
  anime.stagger = stagger;
  anime.timeline = timeline;
  anime.easing = parseEasings;
  anime.penner = penner;
  anime.random = function (min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; };

  var anime_es = /*#__PURE__*/Object.freeze({
    __proto__: null,
    'default': anime
  });

  var dist = {exports: {}};

  var Sister;

  /**
  * @link https://github.com/gajus/sister for the canonical source repository
  * @license https://github.com/gajus/sister/blob/master/LICENSE BSD 3-Clause
  */
  Sister = function () {
      var sister = {},
          events = {};

      /**
       * @name handler
       * @function
       * @param {Object} data Event data.
       */

      /**
       * @param {String} name Event name.
       * @param {handler} handler
       * @return {listener}
       */
      sister.on = function (name, handler) {
          var listener = {name: name, handler: handler};
          events[name] = events[name] || [];
          events[name].unshift(listener);
          return listener;
      };

      /**
       * @param {listener}
       */
      sister.off = function (listener) {
          var index = events[listener.name].indexOf(listener);

          if (index !== -1) {
              events[listener.name].splice(index, 1);
          }
      };

      /**
       * @param {String} name Event name.
       * @param {Object} data Event data.
       */
      sister.trigger = function (name, data) {
          var listeners = events[name],
              i;

          if (listeners) {
              i = listeners.length;
              while (i--) {
                  listeners[i].handler(data);
              }
          }
      };

      return sister;
  };

  var sister = Sister;

  var loadYouTubeIframeApi = {exports: {}};

  var loadScript = function load (src, opts, cb) {
    var head = document.head || document.getElementsByTagName('head')[0];
    var script = document.createElement('script');

    if (typeof opts === 'function') {
      cb = opts;
      opts = {};
    }

    opts = opts || {};
    cb = cb || function() {};

    script.type = opts.type || 'text/javascript';
    script.charset = opts.charset || 'utf8';
    script.async = 'async' in opts ? !!opts.async : true;
    script.src = src;

    if (opts.attrs) {
      setAttributes(script, opts.attrs);
    }

    if (opts.text) {
      script.text = '' + opts.text;
    }

    var onend = 'onload' in script ? stdOnEnd : ieOnEnd;
    onend(script, cb);

    // some good legacy browsers (firefox) fail the 'in' detection above
    // so as a fallback we always set onload
    // old IE will ignore this and new IE will set onload
    if (!script.onload) {
      stdOnEnd(script, cb);
    }

    head.appendChild(script);
  };

  function setAttributes(script, attrs) {
    for (var attr in attrs) {
      script.setAttribute(attr, attrs[attr]);
    }
  }

  function stdOnEnd (script, cb) {
    script.onload = function () {
      this.onerror = this.onload = null;
      cb(null, script);
    };
    script.onerror = function () {
      // this.onload = null here is necessary
      // because even IE9 works not like others
      this.onerror = this.onload = null;
      cb(new Error('Failed to load ' + this.src), script);
    };
  }

  function ieOnEnd (script, cb) {
    script.onreadystatechange = function () {
      if (this.readyState != 'complete' && this.readyState != 'loaded') return
      this.onreadystatechange = null;
      cb(null, script); // there is no way to catch loading errors in IE8
    };
  }

  (function (module, exports) {

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _loadScript = loadScript;

  var _loadScript2 = _interopRequireDefault(_loadScript);

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  exports.default = function (emitter) {
    /**
     * A promise that is resolved when window.onYouTubeIframeAPIReady is called.
     * The promise is resolved with a reference to window.YT object.
     */
    var iframeAPIReady = new Promise(function (resolve) {
      if (window.YT && window.YT.Player && window.YT.Player instanceof Function) {
        resolve(window.YT);

        return;
      } else {
        var protocol = window.location.protocol === 'http:' ? 'http:' : 'https:';

        (0, _loadScript2.default)(protocol + '//www.youtube.com/iframe_api', function (error) {
          if (error) {
            emitter.trigger('error', error);
          }
        });
      }

      var previous = window.onYouTubeIframeAPIReady;

      // The API will call this function when page has finished downloading
      // the JavaScript for the player API.
      window.onYouTubeIframeAPIReady = function () {
        if (previous) {
          previous();
        }

        resolve(window.YT);
      };
    });

    return iframeAPIReady;
  };

  module.exports = exports['default'];
  }(loadYouTubeIframeApi, loadYouTubeIframeApi.exports));

  var YouTubePlayer = {exports: {}};

  var browser = {exports: {}};

  var debug = {exports: {}};

  /**
   * Helpers.
   */

  var s = 1000;
  var m = s * 60;
  var h = m * 60;
  var d = h * 24;
  var y = d * 365.25;

  /**
   * Parse or format the given `val`.
   *
   * Options:
   *
   *  - `long` verbose formatting [false]
   *
   * @param {String|Number} val
   * @param {Object} [options]
   * @throws {Error} throw an error if val is not a non-empty string or a number
   * @return {String|Number}
   * @api public
   */

  var ms = function(val, options) {
    options = options || {};
    var type = typeof val;
    if (type === 'string' && val.length > 0) {
      return parse(val);
    } else if (type === 'number' && isNaN(val) === false) {
      return options.long ? fmtLong(val) : fmtShort(val);
    }
    throw new Error(
      'val is not a non-empty string or a valid number. val=' +
        JSON.stringify(val)
    );
  };

  /**
   * Parse the given `str` and return milliseconds.
   *
   * @param {String} str
   * @return {Number}
   * @api private
   */

  function parse(str) {
    str = String(str);
    if (str.length > 100) {
      return;
    }
    var match = /^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(
      str
    );
    if (!match) {
      return;
    }
    var n = parseFloat(match[1]);
    var type = (match[2] || 'ms').toLowerCase();
    switch (type) {
      case 'years':
      case 'year':
      case 'yrs':
      case 'yr':
      case 'y':
        return n * y;
      case 'days':
      case 'day':
      case 'd':
        return n * d;
      case 'hours':
      case 'hour':
      case 'hrs':
      case 'hr':
      case 'h':
        return n * h;
      case 'minutes':
      case 'minute':
      case 'mins':
      case 'min':
      case 'm':
        return n * m;
      case 'seconds':
      case 'second':
      case 'secs':
      case 'sec':
      case 's':
        return n * s;
      case 'milliseconds':
      case 'millisecond':
      case 'msecs':
      case 'msec':
      case 'ms':
        return n;
      default:
        return undefined;
    }
  }

  /**
   * Short format for `ms`.
   *
   * @param {Number} ms
   * @return {String}
   * @api private
   */

  function fmtShort(ms) {
    if (ms >= d) {
      return Math.round(ms / d) + 'd';
    }
    if (ms >= h) {
      return Math.round(ms / h) + 'h';
    }
    if (ms >= m) {
      return Math.round(ms / m) + 'm';
    }
    if (ms >= s) {
      return Math.round(ms / s) + 's';
    }
    return ms + 'ms';
  }

  /**
   * Long format for `ms`.
   *
   * @param {Number} ms
   * @return {String}
   * @api private
   */

  function fmtLong(ms) {
    return plural(ms, d, 'day') ||
      plural(ms, h, 'hour') ||
      plural(ms, m, 'minute') ||
      plural(ms, s, 'second') ||
      ms + ' ms';
  }

  /**
   * Pluralization helper.
   */

  function plural(ms, n, name) {
    if (ms < n) {
      return;
    }
    if (ms < n * 1.5) {
      return Math.floor(ms / n) + ' ' + name;
    }
    return Math.ceil(ms / n) + ' ' + name + 's';
  }

  (function (module, exports) {
  /**
   * This is the common logic for both the Node.js and web browser
   * implementations of `debug()`.
   *
   * Expose `debug()` as the module.
   */

  exports = module.exports = createDebug.debug = createDebug['default'] = createDebug;
  exports.coerce = coerce;
  exports.disable = disable;
  exports.enable = enable;
  exports.enabled = enabled;
  exports.humanize = ms;

  /**
   * The currently active debug mode names, and names to skip.
   */

  exports.names = [];
  exports.skips = [];

  /**
   * Map of special "%n" handling functions, for the debug "format" argument.
   *
   * Valid key names are a single, lower or upper-case letter, i.e. "n" and "N".
   */

  exports.formatters = {};

  /**
   * Previous log timestamp.
   */

  var prevTime;

  /**
   * Select a color.
   * @param {String} namespace
   * @return {Number}
   * @api private
   */

  function selectColor(namespace) {
    var hash = 0, i;

    for (i in namespace) {
      hash  = ((hash << 5) - hash) + namespace.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }

    return exports.colors[Math.abs(hash) % exports.colors.length];
  }

  /**
   * Create a debugger with the given `namespace`.
   *
   * @param {String} namespace
   * @return {Function}
   * @api public
   */

  function createDebug(namespace) {

    function debug() {
      // disabled?
      if (!debug.enabled) return;

      var self = debug;

      // set `diff` timestamp
      var curr = +new Date();
      var ms = curr - (prevTime || curr);
      self.diff = ms;
      self.prev = prevTime;
      self.curr = curr;
      prevTime = curr;

      // turn the `arguments` into a proper Array
      var args = new Array(arguments.length);
      for (var i = 0; i < args.length; i++) {
        args[i] = arguments[i];
      }

      args[0] = exports.coerce(args[0]);

      if ('string' !== typeof args[0]) {
        // anything else let's inspect with %O
        args.unshift('%O');
      }

      // apply any `formatters` transformations
      var index = 0;
      args[0] = args[0].replace(/%([a-zA-Z%])/g, function(match, format) {
        // if we encounter an escaped % then don't increase the array index
        if (match === '%%') return match;
        index++;
        var formatter = exports.formatters[format];
        if ('function' === typeof formatter) {
          var val = args[index];
          match = formatter.call(self, val);

          // now we need to remove `args[index]` since it's inlined in the `format`
          args.splice(index, 1);
          index--;
        }
        return match;
      });

      // apply env-specific formatting (colors, etc.)
      exports.formatArgs.call(self, args);

      var logFn = debug.log || exports.log || console.log.bind(console);
      logFn.apply(self, args);
    }

    debug.namespace = namespace;
    debug.enabled = exports.enabled(namespace);
    debug.useColors = exports.useColors();
    debug.color = selectColor(namespace);

    // env-specific initialization logic for debug instances
    if ('function' === typeof exports.init) {
      exports.init(debug);
    }

    return debug;
  }

  /**
   * Enables a debug mode by namespaces. This can include modes
   * separated by a colon and wildcards.
   *
   * @param {String} namespaces
   * @api public
   */

  function enable(namespaces) {
    exports.save(namespaces);

    exports.names = [];
    exports.skips = [];

    var split = (typeof namespaces === 'string' ? namespaces : '').split(/[\s,]+/);
    var len = split.length;

    for (var i = 0; i < len; i++) {
      if (!split[i]) continue; // ignore empty strings
      namespaces = split[i].replace(/\*/g, '.*?');
      if (namespaces[0] === '-') {
        exports.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
      } else {
        exports.names.push(new RegExp('^' + namespaces + '$'));
      }
    }
  }

  /**
   * Disable debug output.
   *
   * @api public
   */

  function disable() {
    exports.enable('');
  }

  /**
   * Returns true if the given mode name is enabled, false otherwise.
   *
   * @param {String} name
   * @return {Boolean}
   * @api public
   */

  function enabled(name) {
    var i, len;
    for (i = 0, len = exports.skips.length; i < len; i++) {
      if (exports.skips[i].test(name)) {
        return false;
      }
    }
    for (i = 0, len = exports.names.length; i < len; i++) {
      if (exports.names[i].test(name)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Coerce `val`.
   *
   * @param {Mixed} val
   * @return {Mixed}
   * @api private
   */

  function coerce(val) {
    if (val instanceof Error) return val.stack || val.message;
    return val;
  }
  }(debug, debug.exports));

  /**
   * This is the web browser implementation of `debug()`.
   *
   * Expose `debug()` as the module.
   */

  (function (module, exports) {
  exports = module.exports = debug.exports;
  exports.log = log;
  exports.formatArgs = formatArgs;
  exports.save = save;
  exports.load = load;
  exports.useColors = useColors;
  exports.storage = 'undefined' != typeof chrome
                 && 'undefined' != typeof chrome.storage
                    ? chrome.storage.local
                    : localstorage();

  /**
   * Colors.
   */

  exports.colors = [
    'lightseagreen',
    'forestgreen',
    'goldenrod',
    'dodgerblue',
    'darkorchid',
    'crimson'
  ];

  /**
   * Currently only WebKit-based Web Inspectors, Firefox >= v31,
   * and the Firebug extension (any Firefox version) are known
   * to support "%c" CSS customizations.
   *
   * TODO: add a `localStorage` variable to explicitly enable/disable colors
   */

  function useColors() {
    // NB: In an Electron preload script, document will be defined but not fully
    // initialized. Since we know we're in Chrome, we'll just detect this case
    // explicitly
    if (typeof window !== 'undefined' && window.process && window.process.type === 'renderer') {
      return true;
    }

    // is webkit? http://stackoverflow.com/a/16459606/376773
    // document is undefined in react-native: https://github.com/facebook/react-native/pull/1632
    return (typeof document !== 'undefined' && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance) ||
      // is firebug? http://stackoverflow.com/a/398120/376773
      (typeof window !== 'undefined' && window.console && (window.console.firebug || (window.console.exception && window.console.table))) ||
      // is firefox >= v31?
      // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
      (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31) ||
      // double check webkit in userAgent just in case we are in a worker
      (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/));
  }

  /**
   * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
   */

  exports.formatters.j = function(v) {
    try {
      return JSON.stringify(v);
    } catch (err) {
      return '[UnexpectedJSONParseError]: ' + err.message;
    }
  };


  /**
   * Colorize log arguments if enabled.
   *
   * @api public
   */

  function formatArgs(args) {
    var useColors = this.useColors;

    args[0] = (useColors ? '%c' : '')
      + this.namespace
      + (useColors ? ' %c' : ' ')
      + args[0]
      + (useColors ? '%c ' : ' ')
      + '+' + exports.humanize(this.diff);

    if (!useColors) return;

    var c = 'color: ' + this.color;
    args.splice(1, 0, c, 'color: inherit');

    // the final "%c" is somewhat tricky, because there could be other
    // arguments passed either before or after the %c, so we need to
    // figure out the correct index to insert the CSS into
    var index = 0;
    var lastC = 0;
    args[0].replace(/%[a-zA-Z%]/g, function(match) {
      if ('%%' === match) return;
      index++;
      if ('%c' === match) {
        // we only are interested in the *last* %c
        // (the user may have provided their own)
        lastC = index;
      }
    });

    args.splice(lastC, 0, c);
  }

  /**
   * Invokes `console.log()` when available.
   * No-op when `console.log` is not a "function".
   *
   * @api public
   */

  function log() {
    // this hackery is required for IE8/9, where
    // the `console.log` function doesn't have 'apply'
    return 'object' === typeof console
      && console.log
      && Function.prototype.apply.call(console.log, console, arguments);
  }

  /**
   * Save `namespaces`.
   *
   * @param {String} namespaces
   * @api private
   */

  function save(namespaces) {
    try {
      if (null == namespaces) {
        exports.storage.removeItem('debug');
      } else {
        exports.storage.debug = namespaces;
      }
    } catch(e) {}
  }

  /**
   * Load `namespaces`.
   *
   * @return {String} returns the previously persisted debug modes
   * @api private
   */

  function load() {
    var r;
    try {
      r = exports.storage.debug;
    } catch(e) {}

    // If debug isn't set in LS, and we're in Electron, try to load $DEBUG
    if (!r && typeof process !== 'undefined' && 'env' in process) {
      r = process.env.DEBUG;
    }

    return r;
  }

  /**
   * Enable namespaces listed in `localStorage.debug` initially.
   */

  exports.enable(load());

  /**
   * Localstorage attempts to return the localstorage.
   *
   * This is necessary because safari throws
   * when a user disables cookies/localstorage
   * and you attempt to access it.
   *
   * @return {LocalStorage}
   * @api private
   */

  function localstorage() {
    try {
      return window.localStorage;
    } catch (e) {}
  }
  }(browser, browser.exports));

  var functionNames = {exports: {}};

  (function (module, exports) {

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  /**
   * @see https://developers.google.com/youtube/iframe_api_reference#Functions
   */
  exports.default = ['cueVideoById', 'loadVideoById', 'cueVideoByUrl', 'loadVideoByUrl', 'playVideo', 'pauseVideo', 'stopVideo', 'getVideoLoadedFraction', 'cuePlaylist', 'loadPlaylist', 'nextVideo', 'previousVideo', 'playVideoAt', 'setShuffle', 'setLoop', 'getPlaylist', 'getPlaylistIndex', 'setOption', 'mute', 'unMute', 'isMuted', 'setVolume', 'getVolume', 'seekTo', 'getPlayerState', 'getPlaybackRate', 'setPlaybackRate', 'getAvailablePlaybackRates', 'getPlaybackQuality', 'setPlaybackQuality', 'getAvailableQualityLevels', 'getCurrentTime', 'getDuration', 'removeEventListener', 'getVideoUrl', 'getVideoEmbedCode', 'getOptions', 'getOption', 'addEventListener', 'destroy', 'setSize', 'getIframe'];
  module.exports = exports['default'];
  }(functionNames, functionNames.exports));

  var eventNames = {exports: {}};

  (function (module, exports) {

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  /**
   * @see https://developers.google.com/youtube/iframe_api_reference#Events
   * `volumeChange` is not officially supported but seems to work
   * it emits an object: `{volume: 82.6923076923077, muted: false}`
   */
  exports.default = ['ready', 'stateChange', 'playbackQualityChange', 'playbackRateChange', 'error', 'apiChange', 'volumeChange'];
  module.exports = exports['default'];
  }(eventNames, eventNames.exports));

  var FunctionStateMap = {exports: {}};

  var PlayerStates = {exports: {}};

  (function (module, exports) {

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    BUFFERING: 3,
    ENDED: 0,
    PAUSED: 2,
    PLAYING: 1,
    UNSTARTED: -1,
    VIDEO_CUED: 5
  };
  module.exports = exports["default"];
  }(PlayerStates, PlayerStates.exports));

  (function (module, exports) {

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _PlayerStates = PlayerStates.exports;

  var _PlayerStates2 = _interopRequireDefault(_PlayerStates);

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  exports.default = {
    pauseVideo: {
      acceptableStates: [_PlayerStates2.default.ENDED, _PlayerStates2.default.PAUSED],
      stateChangeRequired: false
    },
    playVideo: {
      acceptableStates: [_PlayerStates2.default.ENDED, _PlayerStates2.default.PLAYING],
      stateChangeRequired: false
    },
    seekTo: {
      acceptableStates: [_PlayerStates2.default.ENDED, _PlayerStates2.default.PLAYING, _PlayerStates2.default.PAUSED],
      stateChangeRequired: true,

      // TRICKY: `seekTo` may not cause a state change if no buffering is
      // required.
      timeout: 3000
    }
  };
  module.exports = exports['default'];
  }(FunctionStateMap, FunctionStateMap.exports));

  (function (module, exports) {

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _debug = browser.exports;

  var _debug2 = _interopRequireDefault(_debug);

  var _functionNames = functionNames.exports;

  var _functionNames2 = _interopRequireDefault(_functionNames);

  var _eventNames = eventNames.exports;

  var _eventNames2 = _interopRequireDefault(_eventNames);

  var _FunctionStateMap = FunctionStateMap.exports;

  var _FunctionStateMap2 = _interopRequireDefault(_FunctionStateMap);

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  /* eslint-disable promise/prefer-await-to-then */

  var debug = (0, _debug2.default)('youtube-player');

  var YouTubePlayer = {};

  /**
   * Construct an object that defines an event handler for all of the YouTube
   * player events. Proxy captured events through an event emitter.
   *
   * @todo Capture event parameters.
   * @see https://developers.google.com/youtube/iframe_api_reference#Events
   */
  YouTubePlayer.proxyEvents = function (emitter) {
    var events = {};

    var _loop = function _loop(eventName) {
      var onEventName = 'on' + eventName.slice(0, 1).toUpperCase() + eventName.slice(1);

      events[onEventName] = function (event) {
        debug('event "%s"', onEventName, event);

        emitter.trigger(eventName, event);
      };
    };

    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = _eventNames2.default[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var eventName = _step.value;

        _loop(eventName);
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }

    return events;
  };

  /**
   * Delays player API method execution until player state is ready.
   *
   * @todo Proxy all of the methods using Object.keys.
   * @todo See TRICKY below.
   * @param playerAPIReady Promise that resolves when player is ready.
   * @param strictState A flag designating whether or not to wait for
   * an acceptable state when calling supported functions.
   * @returns {Object}
   */
  YouTubePlayer.promisifyPlayer = function (playerAPIReady) {
    var strictState = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

    var functions = {};

    var _loop2 = function _loop2(functionName) {
      if (strictState && _FunctionStateMap2.default[functionName]) {
        functions[functionName] = function () {
          for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }

          return playerAPIReady.then(function (player) {
            var stateInfo = _FunctionStateMap2.default[functionName];
            var playerState = player.getPlayerState();

            // eslint-disable-next-line no-warning-comments
            // TODO: Just spread the args into the function once Babel is fixed:
            // https://github.com/babel/babel/issues/4270
            //
            // eslint-disable-next-line prefer-spread
            var value = player[functionName].apply(player, args);

            // TRICKY: For functions like `seekTo`, a change in state must be
            // triggered given that the resulting state could match the initial
            // state.
            if (stateInfo.stateChangeRequired ||

            // eslint-disable-next-line no-extra-parens
            Array.isArray(stateInfo.acceptableStates) && stateInfo.acceptableStates.indexOf(playerState) === -1) {
              return new Promise(function (resolve) {
                var onPlayerStateChange = function onPlayerStateChange() {
                  var playerStateAfterChange = player.getPlayerState();

                  var timeout = void 0;

                  if (typeof stateInfo.timeout === 'number') {
                    timeout = setTimeout(function () {
                      player.removeEventListener('onStateChange', onPlayerStateChange);

                      resolve();
                    }, stateInfo.timeout);
                  }

                  if (Array.isArray(stateInfo.acceptableStates) && stateInfo.acceptableStates.indexOf(playerStateAfterChange) !== -1) {
                    player.removeEventListener('onStateChange', onPlayerStateChange);

                    clearTimeout(timeout);

                    resolve();
                  }
                };

                player.addEventListener('onStateChange', onPlayerStateChange);
              }).then(function () {
                return value;
              });
            }

            return value;
          });
        };
      } else {
        functions[functionName] = function () {
          for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
            args[_key2] = arguments[_key2];
          }

          return playerAPIReady.then(function (player) {
            // eslint-disable-next-line no-warning-comments
            // TODO: Just spread the args into the function once Babel is fixed:
            // https://github.com/babel/babel/issues/4270
            //
            // eslint-disable-next-line prefer-spread
            return player[functionName].apply(player, args);
          });
        };
      }
    };

    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
      for (var _iterator2 = _functionNames2.default[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
        var functionName = _step2.value;

        _loop2(functionName);
      }
    } catch (err) {
      _didIteratorError2 = true;
      _iteratorError2 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion2 && _iterator2.return) {
          _iterator2.return();
        }
      } finally {
        if (_didIteratorError2) {
          throw _iteratorError2;
        }
      }
    }

    return functions;
  };

  exports.default = YouTubePlayer;
  module.exports = exports['default'];
  }(YouTubePlayer, YouTubePlayer.exports));

  (function (module, exports) {

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

  var _sister = sister;

  var _sister2 = _interopRequireDefault(_sister);

  var _loadYouTubeIframeApi = loadYouTubeIframeApi.exports;

  var _loadYouTubeIframeApi2 = _interopRequireDefault(_loadYouTubeIframeApi);

  var _YouTubePlayer = YouTubePlayer.exports;

  var _YouTubePlayer2 = _interopRequireDefault(_YouTubePlayer);

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  /**
   * @typedef YT.Player
   * @see https://developers.google.com/youtube/iframe_api_reference
   * */

  /**
   * @see https://developers.google.com/youtube/iframe_api_reference#Loading_a_Video_Player
   */
  var youtubeIframeAPI = void 0;

  /**
   * A factory function used to produce an instance of YT.Player and queue function calls and proxy events of the resulting object.
   *
   * @param maybeElementId Either An existing YT.Player instance,
   * the DOM element or the id of the HTML element where the API will insert an <iframe>.
   * @param options See `options` (Ignored when using an existing YT.Player instance).
   * @param strictState A flag designating whether or not to wait for
   * an acceptable state when calling supported functions. Default: `false`.
   * See `FunctionStateMap.js` for supported functions and acceptable states.
   */

  exports.default = function (maybeElementId) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var strictState = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

    var emitter = (0, _sister2.default)();

    if (!youtubeIframeAPI) {
      youtubeIframeAPI = (0, _loadYouTubeIframeApi2.default)(emitter);
    }

    if (options.events) {
      throw new Error('Event handlers cannot be overwritten.');
    }

    if (typeof maybeElementId === 'string' && !document.getElementById(maybeElementId)) {
      throw new Error('Element "' + maybeElementId + '" does not exist.');
    }

    options.events = _YouTubePlayer2.default.proxyEvents(emitter);

    var playerAPIReady = new Promise(function (resolve) {
      if ((typeof maybeElementId === 'undefined' ? 'undefined' : _typeof(maybeElementId)) === 'object' && maybeElementId.playVideo instanceof Function) {
        var player = maybeElementId;

        resolve(player);
      } else {
        // asume maybeElementId can be rendered inside
        // eslint-disable-next-line promise/catch-or-return
        youtubeIframeAPI.then(function (YT) {
          // eslint-disable-line promise/prefer-await-to-then
          var player = new YT.Player(maybeElementId, options);

          emitter.on('ready', function () {
            resolve(player);
          });

          return null;
        });
      }
    });

    var playerApi = _YouTubePlayer2.default.promisifyPlayer(playerAPIReady, strictState);

    playerApi.on = emitter.on;
    playerApi.off = emitter.off;

    return playerApi;
  };

  module.exports = exports['default'];
  }(dist, dist.exports));

  var t = /*@__PURE__*/getDefaultExportFromCjs(dist.exports);

  /*! @vimeo/player v2.15.3 | (c) 2021 Vimeo | MIT License | https://github.com/vimeo/player.js */
  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
  }

  /**
   * @module lib/functions
   */

  /**
   * Check to see this is a node environment.
   * @type {Boolean}
   */

  /* global global */
  var isNode = typeof global !== 'undefined' && {}.toString.call(global) === '[object global]';
  /**
   * Get the name of the method for a given getter or setter.
   *
   * @param {string} prop The name of the property.
   * @param {string} type Either “get” or “set”.
   * @return {string}
   */

  function getMethodName(prop, type) {
    if (prop.indexOf(type.toLowerCase()) === 0) {
      return prop;
    }

    return "".concat(type.toLowerCase()).concat(prop.substr(0, 1).toUpperCase()).concat(prop.substr(1));
  }
  /**
   * Check to see if the object is a DOM Element.
   *
   * @param {*} element The object to check.
   * @return {boolean}
   */

  function isDomElement(element) {
    return Boolean(element && element.nodeType === 1 && 'nodeName' in element && element.ownerDocument && element.ownerDocument.defaultView);
  }
  /**
   * Check to see whether the value is a number.
   *
   * @see http://dl.dropboxusercontent.com/u/35146/js/tests/isNumber.html
   * @param {*} value The value to check.
   * @param {boolean} integer Check if the value is an integer.
   * @return {boolean}
   */

  function isInteger(value) {
    // eslint-disable-next-line eqeqeq
    return !isNaN(parseFloat(value)) && isFinite(value) && Math.floor(value) == value;
  }
  /**
   * Check to see if the URL is a Vimeo url.
   *
   * @param {string} url The url string.
   * @return {boolean}
   */

  function isVimeoUrl(url) {
    return /^(https?:)?\/\/((player|www)\.)?vimeo\.com(?=$|\/)/.test(url);
  }
  /**
   * Get the Vimeo URL from an element.
   * The element must have either a data-vimeo-id or data-vimeo-url attribute.
   *
   * @param {object} oEmbedParameters The oEmbed parameters.
   * @return {string}
   */

  function getVimeoUrl() {
    var oEmbedParameters = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var id = oEmbedParameters.id;
    var url = oEmbedParameters.url;
    var idOrUrl = id || url;

    if (!idOrUrl) {
      throw new Error('An id or url must be passed, either in an options object or as a data-vimeo-id or data-vimeo-url attribute.');
    }

    if (isInteger(idOrUrl)) {
      return "https://vimeo.com/".concat(idOrUrl);
    }

    if (isVimeoUrl(idOrUrl)) {
      return idOrUrl.replace('http:', 'https:');
    }

    if (id) {
      throw new TypeError("\u201C".concat(id, "\u201D is not a valid video id."));
    }

    throw new TypeError("\u201C".concat(idOrUrl, "\u201D is not a vimeo.com url."));
  }

  var arrayIndexOfSupport = typeof Array.prototype.indexOf !== 'undefined';
  var postMessageSupport = typeof window !== 'undefined' && typeof window.postMessage !== 'undefined';

  if (!isNode && (!arrayIndexOfSupport || !postMessageSupport)) {
    throw new Error('Sorry, the Vimeo Player API is not available in this browser.');
  }

  var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

  function createCommonjsModule(fn, module) {
  	return module = { exports: {} }, fn(module, module.exports), module.exports;
  }

  /*!
   * weakmap-polyfill v2.0.1 - ECMAScript6 WeakMap polyfill
   * https://github.com/polygonplanet/weakmap-polyfill
   * Copyright (c) 2015-2020 Polygon Planet <polygon.planet.aqua@gmail.com>
   * @license MIT
   */
  (function (self) {

    if (self.WeakMap) {
      return;
    }

    var hasOwnProperty = Object.prototype.hasOwnProperty;

    var defineProperty = function (object, name, value) {
      if (Object.defineProperty) {
        Object.defineProperty(object, name, {
          configurable: true,
          writable: true,
          value: value
        });
      } else {
        object[name] = value;
      }
    };

    self.WeakMap = function () {
      // ECMA-262 23.3 WeakMap Objects
      function WeakMap() {
        if (this === void 0) {
          throw new TypeError("Constructor WeakMap requires 'new'");
        }

        defineProperty(this, '_id', genId('_WeakMap')); // ECMA-262 23.3.1.1 WeakMap([iterable])

        if (arguments.length > 0) {
          // Currently, WeakMap `iterable` argument is not supported
          throw new TypeError('WeakMap iterable is not supported');
        }
      } // ECMA-262 23.3.3.2 WeakMap.prototype.delete(key)


      defineProperty(WeakMap.prototype, 'delete', function (key) {
        checkInstance(this, 'delete');

        if (!isObject(key)) {
          return false;
        }

        var entry = key[this._id];

        if (entry && entry[0] === key) {
          delete key[this._id];
          return true;
        }

        return false;
      }); // ECMA-262 23.3.3.3 WeakMap.prototype.get(key)

      defineProperty(WeakMap.prototype, 'get', function (key) {
        checkInstance(this, 'get');

        if (!isObject(key)) {
          return void 0;
        }

        var entry = key[this._id];

        if (entry && entry[0] === key) {
          return entry[1];
        }

        return void 0;
      }); // ECMA-262 23.3.3.4 WeakMap.prototype.has(key)

      defineProperty(WeakMap.prototype, 'has', function (key) {
        checkInstance(this, 'has');

        if (!isObject(key)) {
          return false;
        }

        var entry = key[this._id];

        if (entry && entry[0] === key) {
          return true;
        }

        return false;
      }); // ECMA-262 23.3.3.5 WeakMap.prototype.set(key, value)

      defineProperty(WeakMap.prototype, 'set', function (key, value) {
        checkInstance(this, 'set');

        if (!isObject(key)) {
          throw new TypeError('Invalid value used as weak map key');
        }

        var entry = key[this._id];

        if (entry && entry[0] === key) {
          entry[1] = value;
          return this;
        }

        defineProperty(key, this._id, [key, value]);
        return this;
      });

      function checkInstance(x, methodName) {
        if (!isObject(x) || !hasOwnProperty.call(x, '_id')) {
          throw new TypeError(methodName + ' method called on incompatible receiver ' + typeof x);
        }
      }

      function genId(prefix) {
        return prefix + '_' + rand() + '.' + rand();
      }

      function rand() {
        return Math.random().toString().substring(2);
      }

      defineProperty(WeakMap, '_polyfill', true);
      return WeakMap;
    }();

    function isObject(x) {
      return Object(x) === x;
    }
  })(typeof self !== 'undefined' ? self : typeof window !== 'undefined' ? window : typeof commonjsGlobal !== 'undefined' ? commonjsGlobal : commonjsGlobal);

  var npo_src = createCommonjsModule(function (module) {
  /*! Native Promise Only
      v0.8.1 (c) Kyle Simpson
      MIT License: http://getify.mit-license.org
  */
  (function UMD(name, context, definition) {
    // special form of UMD for polyfilling across evironments
    context[name] = context[name] || definition();

    if ( module.exports) {
      module.exports = context[name];
    }
  })("Promise", typeof commonjsGlobal != "undefined" ? commonjsGlobal : commonjsGlobal, function DEF() {

    var builtInProp,
        cycle,
        scheduling_queue,
        ToString = Object.prototype.toString,
        timer = typeof setImmediate != "undefined" ? function timer(fn) {
      return setImmediate(fn);
    } : setTimeout; // dammit, IE8.

    try {
      Object.defineProperty({}, "x", {});

      builtInProp = function builtInProp(obj, name, val, config) {
        return Object.defineProperty(obj, name, {
          value: val,
          writable: true,
          configurable: config !== false
        });
      };
    } catch (err) {
      builtInProp = function builtInProp(obj, name, val) {
        obj[name] = val;
        return obj;
      };
    } // Note: using a queue instead of array for efficiency


    scheduling_queue = function Queue() {
      var first, last, item;

      function Item(fn, self) {
        this.fn = fn;
        this.self = self;
        this.next = void 0;
      }

      return {
        add: function add(fn, self) {
          item = new Item(fn, self);

          if (last) {
            last.next = item;
          } else {
            first = item;
          }

          last = item;
          item = void 0;
        },
        drain: function drain() {
          var f = first;
          first = last = cycle = void 0;

          while (f) {
            f.fn.call(f.self);
            f = f.next;
          }
        }
      };
    }();

    function schedule(fn, self) {
      scheduling_queue.add(fn, self);

      if (!cycle) {
        cycle = timer(scheduling_queue.drain);
      }
    } // promise duck typing


    function isThenable(o) {
      var _then,
          o_type = typeof o;

      if (o != null && (o_type == "object" || o_type == "function")) {
        _then = o.then;
      }

      return typeof _then == "function" ? _then : false;
    }

    function notify() {
      for (var i = 0; i < this.chain.length; i++) {
        notifyIsolated(this, this.state === 1 ? this.chain[i].success : this.chain[i].failure, this.chain[i]);
      }

      this.chain.length = 0;
    } // NOTE: This is a separate function to isolate
    // the `try..catch` so that other code can be
    // optimized better


    function notifyIsolated(self, cb, chain) {
      var ret, _then;

      try {
        if (cb === false) {
          chain.reject(self.msg);
        } else {
          if (cb === true) {
            ret = self.msg;
          } else {
            ret = cb.call(void 0, self.msg);
          }

          if (ret === chain.promise) {
            chain.reject(TypeError("Promise-chain cycle"));
          } else if (_then = isThenable(ret)) {
            _then.call(ret, chain.resolve, chain.reject);
          } else {
            chain.resolve(ret);
          }
        }
      } catch (err) {
        chain.reject(err);
      }
    }

    function resolve(msg) {
      var _then,
          self = this; // already triggered?


      if (self.triggered) {
        return;
      }

      self.triggered = true; // unwrap

      if (self.def) {
        self = self.def;
      }

      try {
        if (_then = isThenable(msg)) {
          schedule(function () {
            var def_wrapper = new MakeDefWrapper(self);

            try {
              _then.call(msg, function $resolve$() {
                resolve.apply(def_wrapper, arguments);
              }, function $reject$() {
                reject.apply(def_wrapper, arguments);
              });
            } catch (err) {
              reject.call(def_wrapper, err);
            }
          });
        } else {
          self.msg = msg;
          self.state = 1;

          if (self.chain.length > 0) {
            schedule(notify, self);
          }
        }
      } catch (err) {
        reject.call(new MakeDefWrapper(self), err);
      }
    }

    function reject(msg) {
      var self = this; // already triggered?

      if (self.triggered) {
        return;
      }

      self.triggered = true; // unwrap

      if (self.def) {
        self = self.def;
      }

      self.msg = msg;
      self.state = 2;

      if (self.chain.length > 0) {
        schedule(notify, self);
      }
    }

    function iteratePromises(Constructor, arr, resolver, rejecter) {
      for (var idx = 0; idx < arr.length; idx++) {
        (function IIFE(idx) {
          Constructor.resolve(arr[idx]).then(function $resolver$(msg) {
            resolver(idx, msg);
          }, rejecter);
        })(idx);
      }
    }

    function MakeDefWrapper(self) {
      this.def = self;
      this.triggered = false;
    }

    function MakeDef(self) {
      this.promise = self;
      this.state = 0;
      this.triggered = false;
      this.chain = [];
      this.msg = void 0;
    }

    function Promise(executor) {
      if (typeof executor != "function") {
        throw TypeError("Not a function");
      }

      if (this.__NPO__ !== 0) {
        throw TypeError("Not a promise");
      } // instance shadowing the inherited "brand"
      // to signal an already "initialized" promise


      this.__NPO__ = 1;
      var def = new MakeDef(this);

      this["then"] = function then(success, failure) {
        var o = {
          success: typeof success == "function" ? success : true,
          failure: typeof failure == "function" ? failure : false
        }; // Note: `then(..)` itself can be borrowed to be used against
        // a different promise constructor for making the chained promise,
        // by substituting a different `this` binding.

        o.promise = new this.constructor(function extractChain(resolve, reject) {
          if (typeof resolve != "function" || typeof reject != "function") {
            throw TypeError("Not a function");
          }

          o.resolve = resolve;
          o.reject = reject;
        });
        def.chain.push(o);

        if (def.state !== 0) {
          schedule(notify, def);
        }

        return o.promise;
      };

      this["catch"] = function $catch$(failure) {
        return this.then(void 0, failure);
      };

      try {
        executor.call(void 0, function publicResolve(msg) {
          resolve.call(def, msg);
        }, function publicReject(msg) {
          reject.call(def, msg);
        });
      } catch (err) {
        reject.call(def, err);
      }
    }

    var PromisePrototype = builtInProp({}, "constructor", Promise,
    /*configurable=*/
    false); // Note: Android 4 cannot use `Object.defineProperty(..)` here

    Promise.prototype = PromisePrototype; // built-in "brand" to signal an "uninitialized" promise

    builtInProp(PromisePrototype, "__NPO__", 0,
    /*configurable=*/
    false);
    builtInProp(Promise, "resolve", function Promise$resolve(msg) {
      var Constructor = this; // spec mandated checks
      // note: best "isPromise" check that's practical for now

      if (msg && typeof msg == "object" && msg.__NPO__ === 1) {
        return msg;
      }

      return new Constructor(function executor(resolve, reject) {
        if (typeof resolve != "function" || typeof reject != "function") {
          throw TypeError("Not a function");
        }

        resolve(msg);
      });
    });
    builtInProp(Promise, "reject", function Promise$reject(msg) {
      return new this(function executor(resolve, reject) {
        if (typeof resolve != "function" || typeof reject != "function") {
          throw TypeError("Not a function");
        }

        reject(msg);
      });
    });
    builtInProp(Promise, "all", function Promise$all(arr) {
      var Constructor = this; // spec mandated checks

      if (ToString.call(arr) != "[object Array]") {
        return Constructor.reject(TypeError("Not an array"));
      }

      if (arr.length === 0) {
        return Constructor.resolve([]);
      }

      return new Constructor(function executor(resolve, reject) {
        if (typeof resolve != "function" || typeof reject != "function") {
          throw TypeError("Not a function");
        }

        var len = arr.length,
            msgs = Array(len),
            count = 0;
        iteratePromises(Constructor, arr, function resolver(idx, msg) {
          msgs[idx] = msg;

          if (++count === len) {
            resolve(msgs);
          }
        }, reject);
      });
    });
    builtInProp(Promise, "race", function Promise$race(arr) {
      var Constructor = this; // spec mandated checks

      if (ToString.call(arr) != "[object Array]") {
        return Constructor.reject(TypeError("Not an array"));
      }

      return new Constructor(function executor(resolve, reject) {
        if (typeof resolve != "function" || typeof reject != "function") {
          throw TypeError("Not a function");
        }

        iteratePromises(Constructor, arr, function resolver(idx, msg) {
          resolve(msg);
        }, reject);
      });
    });
    return Promise;
  });
  });

  /**
   * @module lib/callbacks
   */
  var callbackMap = new WeakMap();
  /**
   * Store a callback for a method or event for a player.
   *
   * @param {Player} player The player object.
   * @param {string} name The method or event name.
   * @param {(function(this:Player, *): void|{resolve: function, reject: function})} callback
   *        The callback to call or an object with resolve and reject functions for a promise.
   * @return {void}
   */

  function storeCallback(player, name, callback) {
    var playerCallbacks = callbackMap.get(player.element) || {};

    if (!(name in playerCallbacks)) {
      playerCallbacks[name] = [];
    }

    playerCallbacks[name].push(callback);
    callbackMap.set(player.element, playerCallbacks);
  }
  /**
   * Get the callbacks for a player and event or method.
   *
   * @param {Player} player The player object.
   * @param {string} name The method or event name
   * @return {function[]}
   */

  function getCallbacks(player, name) {
    var playerCallbacks = callbackMap.get(player.element) || {};
    return playerCallbacks[name] || [];
  }
  /**
   * Remove a stored callback for a method or event for a player.
   *
   * @param {Player} player The player object.
   * @param {string} name The method or event name
   * @param {function} [callback] The specific callback to remove.
   * @return {boolean} Was this the last callback?
   */

  function removeCallback(player, name, callback) {
    var playerCallbacks = callbackMap.get(player.element) || {};

    if (!playerCallbacks[name]) {
      return true;
    } // If no callback is passed, remove all callbacks for the event


    if (!callback) {
      playerCallbacks[name] = [];
      callbackMap.set(player.element, playerCallbacks);
      return true;
    }

    var index = playerCallbacks[name].indexOf(callback);

    if (index !== -1) {
      playerCallbacks[name].splice(index, 1);
    }

    callbackMap.set(player.element, playerCallbacks);
    return playerCallbacks[name] && playerCallbacks[name].length === 0;
  }
  /**
   * Return the first stored callback for a player and event or method.
   *
   * @param {Player} player The player object.
   * @param {string} name The method or event name.
   * @return {function} The callback, or false if there were none
   */

  function shiftCallbacks(player, name) {
    var playerCallbacks = getCallbacks(player, name);

    if (playerCallbacks.length < 1) {
      return false;
    }

    var callback = playerCallbacks.shift();
    removeCallback(player, name, callback);
    return callback;
  }
  /**
   * Move callbacks associated with an element to another element.
   *
   * @param {HTMLElement} oldElement The old element.
   * @param {HTMLElement} newElement The new element.
   * @return {void}
   */

  function swapCallbacks(oldElement, newElement) {
    var playerCallbacks = callbackMap.get(oldElement);
    callbackMap.set(newElement, playerCallbacks);
    callbackMap.delete(oldElement);
  }

  /**
   * @module lib/embed
   */
  var oEmbedParameters = ['autopause', 'autoplay', 'background', 'byline', 'color', 'controls', 'dnt', 'height', 'id', 'loop', 'maxheight', 'maxwidth', 'muted', 'playsinline', 'portrait', 'responsive', 'speed', 'texttrack', 'title', 'transparent', 'url', 'width'];
  /**
   * Get the 'data-vimeo'-prefixed attributes from an element as an object.
   *
   * @param {HTMLElement} element The element.
   * @param {Object} [defaults={}] The default values to use.
   * @return {Object<string, string>}
   */

  function getOEmbedParameters(element) {
    var defaults = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    return oEmbedParameters.reduce(function (params, param) {
      var value = element.getAttribute("data-vimeo-".concat(param));

      if (value || value === '') {
        params[param] = value === '' ? 1 : value;
      }

      return params;
    }, defaults);
  }
  /**
   * Create an embed from oEmbed data inside an element.
   *
   * @param {object} data The oEmbed data.
   * @param {HTMLElement} element The element to put the iframe in.
   * @return {HTMLIFrameElement} The iframe embed.
   */

  function createEmbed(_ref, element) {
    var html = _ref.html;

    if (!element) {
      throw new TypeError('An element must be provided');
    }

    if (element.getAttribute('data-vimeo-initialized') !== null) {
      return element.querySelector('iframe');
    }

    var div = document.createElement('div');
    div.innerHTML = html;
    element.appendChild(div.firstChild);
    element.setAttribute('data-vimeo-initialized', 'true');
    return element.querySelector('iframe');
  }
  /**
   * Make an oEmbed call for the specified URL.
   *
   * @param {string} videoUrl The vimeo.com url for the video.
   * @param {Object} [params] Parameters to pass to oEmbed.
   * @param {HTMLElement} element The element.
   * @return {Promise}
   */

  function getOEmbedData(videoUrl) {
    var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var element = arguments.length > 2 ? arguments[2] : undefined;
    return new Promise(function (resolve, reject) {
      if (!isVimeoUrl(videoUrl)) {
        throw new TypeError("\u201C".concat(videoUrl, "\u201D is not a vimeo.com url."));
      }

      var url = "https://vimeo.com/api/oembed.json?url=".concat(encodeURIComponent(videoUrl));

      for (var param in params) {
        if (params.hasOwnProperty(param)) {
          url += "&".concat(param, "=").concat(encodeURIComponent(params[param]));
        }
      }

      var xhr = 'XDomainRequest' in window ? new XDomainRequest() : new XMLHttpRequest();
      xhr.open('GET', url, true);

      xhr.onload = function () {
        if (xhr.status === 404) {
          reject(new Error("\u201C".concat(videoUrl, "\u201D was not found.")));
          return;
        }

        if (xhr.status === 403) {
          reject(new Error("\u201C".concat(videoUrl, "\u201D is not embeddable.")));
          return;
        }

        try {
          var json = JSON.parse(xhr.responseText); // Check api response for 403 on oembed

          if (json.domain_status_code === 403) {
            // We still want to create the embed to give users visual feedback
            createEmbed(json, element);
            reject(new Error("\u201C".concat(videoUrl, "\u201D is not embeddable.")));
            return;
          }

          resolve(json);
        } catch (error) {
          reject(error);
        }
      };

      xhr.onerror = function () {
        var status = xhr.status ? " (".concat(xhr.status, ")") : '';
        reject(new Error("There was an error fetching the embed code from Vimeo".concat(status, ".")));
      };

      xhr.send();
    });
  }
  /**
   * Initialize all embeds within a specific element
   *
   * @param {HTMLElement} [parent=document] The parent element.
   * @return {void}
   */

  function initializeEmbeds() {
    var parent = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : document;
    var elements = [].slice.call(parent.querySelectorAll('[data-vimeo-id], [data-vimeo-url]'));

    var handleError = function handleError(error) {
      if ('console' in window && console.error) {
        console.error("There was an error creating an embed: ".concat(error));
      }
    };

    elements.forEach(function (element) {
      try {
        // Skip any that have data-vimeo-defer
        if (element.getAttribute('data-vimeo-defer') !== null) {
          return;
        }

        var params = getOEmbedParameters(element);
        var url = getVimeoUrl(params);
        getOEmbedData(url, params, element).then(function (data) {
          return createEmbed(data, element);
        }).catch(handleError);
      } catch (error) {
        handleError(error);
      }
    });
  }
  /**
   * Resize embeds when messaged by the player.
   *
   * @param {HTMLElement} [parent=document] The parent element.
   * @return {void}
   */

  function resizeEmbeds() {
    var parent = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : document;

    // Prevent execution if users include the player.js script multiple times.
    if (window.VimeoPlayerResizeEmbeds_) {
      return;
    }

    window.VimeoPlayerResizeEmbeds_ = true;

    var onMessage = function onMessage(event) {
      if (!isVimeoUrl(event.origin)) {
        return;
      } // 'spacechange' is fired only on embeds with cards


      if (!event.data || event.data.event !== 'spacechange') {
        return;
      }

      var iframes = parent.querySelectorAll('iframe');

      for (var i = 0; i < iframes.length; i++) {
        if (iframes[i].contentWindow !== event.source) {
          continue;
        } // Change padding-bottom of the enclosing div to accommodate
        // card carousel without distorting aspect ratio


        var space = iframes[i].parentElement;
        space.style.paddingBottom = "".concat(event.data.data[0].bottom, "px");
        break;
      }
    };

    window.addEventListener('message', onMessage);
  }

  /**
   * @module lib/postmessage
   */
  /**
   * Parse a message received from postMessage.
   *
   * @param {*} data The data received from postMessage.
   * @return {object}
   */

  function parseMessageData(data) {
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (error) {
        // If the message cannot be parsed, throw the error as a warning
        console.warn(error);
        return {};
      }
    }

    return data;
  }
  /**
   * Post a message to the specified target.
   *
   * @param {Player} player The player object to use.
   * @param {string} method The API method to call.
   * @param {object} params The parameters to send to the player.
   * @return {void}
   */

  function postMessage(player, method, params) {
    if (!player.element.contentWindow || !player.element.contentWindow.postMessage) {
      return;
    }

    var message = {
      method: method
    };

    if (params !== undefined) {
      message.value = params;
    } // IE 8 and 9 do not support passing messages, so stringify them


    var ieVersion = parseFloat(navigator.userAgent.toLowerCase().replace(/^.*msie (\d+).*$/, '$1'));

    if (ieVersion >= 8 && ieVersion < 10) {
      message = JSON.stringify(message);
    }

    player.element.contentWindow.postMessage(message, player.origin);
  }
  /**
   * Parse the data received from a message event.
   *
   * @param {Player} player The player that received the message.
   * @param {(Object|string)} data The message data. Strings will be parsed into JSON.
   * @return {void}
   */

  function processData(player, data) {
    data = parseMessageData(data);
    var callbacks = [];
    var param;

    if (data.event) {
      if (data.event === 'error') {
        var promises = getCallbacks(player, data.data.method);
        promises.forEach(function (promise) {
          var error = new Error(data.data.message);
          error.name = data.data.name;
          promise.reject(error);
          removeCallback(player, data.data.method, promise);
        });
      }

      callbacks = getCallbacks(player, "event:".concat(data.event));
      param = data.data;
    } else if (data.method) {
      var callback = shiftCallbacks(player, data.method);

      if (callback) {
        callbacks.push(callback);
        param = data.value;
      }
    }

    callbacks.forEach(function (callback) {
      try {
        if (typeof callback === 'function') {
          callback.call(player, param);
          return;
        }

        callback.resolve(param);
      } catch (e) {// empty
      }
    });
  }

  /* MIT License

  Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com)

  Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
  Terms */
  function initializeScreenfull() {
    var fn = function () {
      var val;
      var fnMap = [['requestFullscreen', 'exitFullscreen', 'fullscreenElement', 'fullscreenEnabled', 'fullscreenchange', 'fullscreenerror'], // New WebKit
      ['webkitRequestFullscreen', 'webkitExitFullscreen', 'webkitFullscreenElement', 'webkitFullscreenEnabled', 'webkitfullscreenchange', 'webkitfullscreenerror'], // Old WebKit
      ['webkitRequestFullScreen', 'webkitCancelFullScreen', 'webkitCurrentFullScreenElement', 'webkitCancelFullScreen', 'webkitfullscreenchange', 'webkitfullscreenerror'], ['mozRequestFullScreen', 'mozCancelFullScreen', 'mozFullScreenElement', 'mozFullScreenEnabled', 'mozfullscreenchange', 'mozfullscreenerror'], ['msRequestFullscreen', 'msExitFullscreen', 'msFullscreenElement', 'msFullscreenEnabled', 'MSFullscreenChange', 'MSFullscreenError']];
      var i = 0;
      var l = fnMap.length;
      var ret = {};

      for (; i < l; i++) {
        val = fnMap[i];

        if (val && val[1] in document) {
          for (i = 0; i < val.length; i++) {
            ret[fnMap[0][i]] = val[i];
          }

          return ret;
        }
      }

      return false;
    }();

    var eventNameMap = {
      fullscreenchange: fn.fullscreenchange,
      fullscreenerror: fn.fullscreenerror
    };
    var screenfull = {
      request: function request(element) {
        return new Promise(function (resolve, reject) {
          var onFullScreenEntered = function onFullScreenEntered() {
            screenfull.off('fullscreenchange', onFullScreenEntered);
            resolve();
          };

          screenfull.on('fullscreenchange', onFullScreenEntered);
          element = element || document.documentElement;
          var returnPromise = element[fn.requestFullscreen]();

          if (returnPromise instanceof Promise) {
            returnPromise.then(onFullScreenEntered).catch(reject);
          }
        });
      },
      exit: function exit() {
        return new Promise(function (resolve, reject) {
          if (!screenfull.isFullscreen) {
            resolve();
            return;
          }

          var onFullScreenExit = function onFullScreenExit() {
            screenfull.off('fullscreenchange', onFullScreenExit);
            resolve();
          };

          screenfull.on('fullscreenchange', onFullScreenExit);
          var returnPromise = document[fn.exitFullscreen]();

          if (returnPromise instanceof Promise) {
            returnPromise.then(onFullScreenExit).catch(reject);
          }
        });
      },
      on: function on(event, callback) {
        var eventName = eventNameMap[event];

        if (eventName) {
          document.addEventListener(eventName, callback);
        }
      },
      off: function off(event, callback) {
        var eventName = eventNameMap[event];

        if (eventName) {
          document.removeEventListener(eventName, callback);
        }
      }
    };
    Object.defineProperties(screenfull, {
      isFullscreen: {
        get: function get() {
          return Boolean(document[fn.fullscreenElement]);
        }
      },
      element: {
        enumerable: true,
        get: function get() {
          return document[fn.fullscreenElement];
        }
      },
      isEnabled: {
        enumerable: true,
        get: function get() {
          // Coerce to boolean in case of old WebKit
          return Boolean(document[fn.fullscreenEnabled]);
        }
      }
    });
    return screenfull;
  }

  var playerMap = new WeakMap();
  var readyMap = new WeakMap();
  var screenfull = {};

  var Player = /*#__PURE__*/function () {
    /**
     * Create a Player.
     *
     * @param {(HTMLIFrameElement|HTMLElement|string|jQuery)} element A reference to the Vimeo
     *        player iframe, and id, or a jQuery object.
     * @param {object} [options] oEmbed parameters to use when creating an embed in the element.
     * @return {Player}
     */
    function Player(element) {
      var _this = this;

      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      _classCallCheck(this, Player);

      /* global jQuery */
      if (window.jQuery && element instanceof jQuery) {
        if (element.length > 1 && window.console && console.warn) {
          console.warn('A jQuery object with multiple elements was passed, using the first element.');
        }

        element = element[0];
      } // Find an element by ID


      if (typeof document !== 'undefined' && typeof element === 'string') {
        element = document.getElementById(element);
      } // Not an element!


      if (!isDomElement(element)) {
        throw new TypeError('You must pass either a valid element or a valid id.');
      } // Already initialized an embed in this div, so grab the iframe


      if (element.nodeName !== 'IFRAME') {
        var iframe = element.querySelector('iframe');

        if (iframe) {
          element = iframe;
        }
      } // iframe url is not a Vimeo url


      if (element.nodeName === 'IFRAME' && !isVimeoUrl(element.getAttribute('src') || '')) {
        throw new Error('The player element passed isn’t a Vimeo embed.');
      } // If there is already a player object in the map, return that


      if (playerMap.has(element)) {
        return playerMap.get(element);
      }

      this._window = element.ownerDocument.defaultView;
      this.element = element;
      this.origin = '*';
      var readyPromise = new npo_src(function (resolve, reject) {
        _this._onMessage = function (event) {
          if (!isVimeoUrl(event.origin) || _this.element.contentWindow !== event.source) {
            return;
          }

          if (_this.origin === '*') {
            _this.origin = event.origin;
          }

          var data = parseMessageData(event.data);
          var isError = data && data.event === 'error';
          var isReadyError = isError && data.data && data.data.method === 'ready';

          if (isReadyError) {
            var error = new Error(data.data.message);
            error.name = data.data.name;
            reject(error);
            return;
          }

          var isReadyEvent = data && data.event === 'ready';
          var isPingResponse = data && data.method === 'ping';

          if (isReadyEvent || isPingResponse) {
            _this.element.setAttribute('data-ready', 'true');

            resolve();
            return;
          }

          processData(_this, data);
        };

        _this._window.addEventListener('message', _this._onMessage);

        if (_this.element.nodeName !== 'IFRAME') {
          var params = getOEmbedParameters(element, options);
          var url = getVimeoUrl(params);
          getOEmbedData(url, params, element).then(function (data) {
            var iframe = createEmbed(data, element); // Overwrite element with the new iframe,
            // but store reference to the original element

            _this.element = iframe;
            _this._originalElement = element;
            swapCallbacks(element, iframe);
            playerMap.set(_this.element, _this);
            return data;
          }).catch(reject);
        }
      }); // Store a copy of this Player in the map

      readyMap.set(this, readyPromise);
      playerMap.set(this.element, this); // Send a ping to the iframe so the ready promise will be resolved if
      // the player is already ready.

      if (this.element.nodeName === 'IFRAME') {
        postMessage(this, 'ping');
      }

      if (screenfull.isEnabled) {
        var exitFullscreen = function exitFullscreen() {
          return screenfull.exit();
        };

        screenfull.on('fullscreenchange', function () {
          if (screenfull.isFullscreen) {
            storeCallback(_this, 'event:exitFullscreen', exitFullscreen);
          } else {
            removeCallback(_this, 'event:exitFullscreen', exitFullscreen);
          } // eslint-disable-next-line


          _this.ready().then(function () {
            postMessage(_this, 'fullscreenchange', screenfull.isFullscreen);
          });
        });
      }

      return this;
    }
    /**
     * Get a promise for a method.
     *
     * @param {string} name The API method to call.
     * @param {Object} [args={}] Arguments to send via postMessage.
     * @return {Promise}
     */


    _createClass(Player, [{
      key: "callMethod",
      value: function callMethod(name) {
        var _this2 = this;

        var args = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
        return new npo_src(function (resolve, reject) {
          // We are storing the resolve/reject handlers to call later, so we
          // can’t return here.
          // eslint-disable-next-line promise/always-return
          return _this2.ready().then(function () {
            storeCallback(_this2, name, {
              resolve: resolve,
              reject: reject
            });
            postMessage(_this2, name, args);
          }).catch(reject);
        });
      }
      /**
       * Get a promise for the value of a player property.
       *
       * @param {string} name The property name
       * @return {Promise}
       */

    }, {
      key: "get",
      value: function get(name) {
        var _this3 = this;

        return new npo_src(function (resolve, reject) {
          name = getMethodName(name, 'get'); // We are storing the resolve/reject handlers to call later, so we
          // can’t return here.
          // eslint-disable-next-line promise/always-return

          return _this3.ready().then(function () {
            storeCallback(_this3, name, {
              resolve: resolve,
              reject: reject
            });
            postMessage(_this3, name);
          }).catch(reject);
        });
      }
      /**
       * Get a promise for setting the value of a player property.
       *
       * @param {string} name The API method to call.
       * @param {mixed} value The value to set.
       * @return {Promise}
       */

    }, {
      key: "set",
      value: function set(name, value) {
        var _this4 = this;

        return new npo_src(function (resolve, reject) {
          name = getMethodName(name, 'set');

          if (value === undefined || value === null) {
            throw new TypeError('There must be a value to set.');
          } // We are storing the resolve/reject handlers to call later, so we
          // can’t return here.
          // eslint-disable-next-line promise/always-return


          return _this4.ready().then(function () {
            storeCallback(_this4, name, {
              resolve: resolve,
              reject: reject
            });
            postMessage(_this4, name, value);
          }).catch(reject);
        });
      }
      /**
       * Add an event listener for the specified event. Will call the
       * callback with a single parameter, `data`, that contains the data for
       * that event.
       *
       * @param {string} eventName The name of the event.
       * @param {function(*)} callback The function to call when the event fires.
       * @return {void}
       */

    }, {
      key: "on",
      value: function on(eventName, callback) {
        if (!eventName) {
          throw new TypeError('You must pass an event name.');
        }

        if (!callback) {
          throw new TypeError('You must pass a callback function.');
        }

        if (typeof callback !== 'function') {
          throw new TypeError('The callback must be a function.');
        }

        var callbacks = getCallbacks(this, "event:".concat(eventName));

        if (callbacks.length === 0) {
          this.callMethod('addEventListener', eventName).catch(function () {// Ignore the error. There will be an error event fired that
            // will trigger the error callback if they are listening.
          });
        }

        storeCallback(this, "event:".concat(eventName), callback);
      }
      /**
       * Remove an event listener for the specified event. Will remove all
       * listeners for that event if a `callback` isn’t passed, or only that
       * specific callback if it is passed.
       *
       * @param {string} eventName The name of the event.
       * @param {function} [callback] The specific callback to remove.
       * @return {void}
       */

    }, {
      key: "off",
      value: function off(eventName, callback) {
        if (!eventName) {
          throw new TypeError('You must pass an event name.');
        }

        if (callback && typeof callback !== 'function') {
          throw new TypeError('The callback must be a function.');
        }

        var lastCallback = removeCallback(this, "event:".concat(eventName), callback); // If there are no callbacks left, remove the listener

        if (lastCallback) {
          this.callMethod('removeEventListener', eventName).catch(function (e) {// Ignore the error. There will be an error event fired that
            // will trigger the error callback if they are listening.
          });
        }
      }
      /**
       * A promise to load a new video.
       *
       * @promise LoadVideoPromise
       * @fulfill {number} The video with this id successfully loaded.
       * @reject {TypeError} The id was not a number.
       */

      /**
       * Load a new video into this embed. The promise will be resolved if
       * the video is successfully loaded, or it will be rejected if it could
       * not be loaded.
       *
       * @param {number|object} options The id of the video or an object with embed options.
       * @return {LoadVideoPromise}
       */

    }, {
      key: "loadVideo",
      value: function loadVideo(options) {
        return this.callMethod('loadVideo', options);
      }
      /**
       * A promise to perform an action when the Player is ready.
       *
       * @todo document errors
       * @promise LoadVideoPromise
       * @fulfill {void}
       */

      /**
       * Trigger a function when the player iframe has initialized. You do not
       * need to wait for `ready` to trigger to begin adding event listeners
       * or calling other methods.
       *
       * @return {ReadyPromise}
       */

    }, {
      key: "ready",
      value: function ready() {
        var readyPromise = readyMap.get(this) || new npo_src(function (resolve, reject) {
          reject(new Error('Unknown player. Probably unloaded.'));
        });
        return npo_src.resolve(readyPromise);
      }
      /**
       * A promise to add a cue point to the player.
       *
       * @promise AddCuePointPromise
       * @fulfill {string} The id of the cue point to use for removeCuePoint.
       * @reject {RangeError} the time was less than 0 or greater than the
       *         video’s duration.
       * @reject {UnsupportedError} Cue points are not supported with the current
       *         player or browser.
       */

      /**
       * Add a cue point to the player.
       *
       * @param {number} time The time for the cue point.
       * @param {object} [data] Arbitrary data to be returned with the cue point.
       * @return {AddCuePointPromise}
       */

    }, {
      key: "addCuePoint",
      value: function addCuePoint(time) {
        var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
        return this.callMethod('addCuePoint', {
          time: time,
          data: data
        });
      }
      /**
       * A promise to remove a cue point from the player.
       *
       * @promise AddCuePointPromise
       * @fulfill {string} The id of the cue point that was removed.
       * @reject {InvalidCuePoint} The cue point with the specified id was not
       *         found.
       * @reject {UnsupportedError} Cue points are not supported with the current
       *         player or browser.
       */

      /**
       * Remove a cue point from the video.
       *
       * @param {string} id The id of the cue point to remove.
       * @return {RemoveCuePointPromise}
       */

    }, {
      key: "removeCuePoint",
      value: function removeCuePoint(id) {
        return this.callMethod('removeCuePoint', id);
      }
      /**
       * A representation of a text track on a video.
       *
       * @typedef {Object} VimeoTextTrack
       * @property {string} language The ISO language code.
       * @property {string} kind The kind of track it is (captions or subtitles).
       * @property {string} label The human‐readable label for the track.
       */

      /**
       * A promise to enable a text track.
       *
       * @promise EnableTextTrackPromise
       * @fulfill {VimeoTextTrack} The text track that was enabled.
       * @reject {InvalidTrackLanguageError} No track was available with the
       *         specified language.
       * @reject {InvalidTrackError} No track was available with the specified
       *         language and kind.
       */

      /**
       * Enable the text track with the specified language, and optionally the
       * specified kind (captions or subtitles).
       *
       * When set via the API, the track language will not change the viewer’s
       * stored preference.
       *
       * @param {string} language The two‐letter language code.
       * @param {string} [kind] The kind of track to enable (captions or subtitles).
       * @return {EnableTextTrackPromise}
       */

    }, {
      key: "enableTextTrack",
      value: function enableTextTrack(language, kind) {
        if (!language) {
          throw new TypeError('You must pass a language.');
        }

        return this.callMethod('enableTextTrack', {
          language: language,
          kind: kind
        });
      }
      /**
       * A promise to disable the active text track.
       *
       * @promise DisableTextTrackPromise
       * @fulfill {void} The track was disabled.
       */

      /**
       * Disable the currently-active text track.
       *
       * @return {DisableTextTrackPromise}
       */

    }, {
      key: "disableTextTrack",
      value: function disableTextTrack() {
        return this.callMethod('disableTextTrack');
      }
      /**
       * A promise to pause the video.
       *
       * @promise PausePromise
       * @fulfill {void} The video was paused.
       */

      /**
       * Pause the video if it’s playing.
       *
       * @return {PausePromise}
       */

    }, {
      key: "pause",
      value: function pause() {
        return this.callMethod('pause');
      }
      /**
       * A promise to play the video.
       *
       * @promise PlayPromise
       * @fulfill {void} The video was played.
       */

      /**
       * Play the video if it’s paused. **Note:** on iOS and some other
       * mobile devices, you cannot programmatically trigger play. Once the
       * viewer has tapped on the play button in the player, however, you
       * will be able to use this function.
       *
       * @return {PlayPromise}
       */

    }, {
      key: "play",
      value: function play() {
        return this.callMethod('play');
      }
      /**
       * Request that the player enters fullscreen.
       * @return {Promise}
       */

    }, {
      key: "requestFullscreen",
      value: function requestFullscreen() {
        if (screenfull.isEnabled) {
          return screenfull.request(this.element);
        }

        return this.callMethod('requestFullscreen');
      }
      /**
       * Request that the player exits fullscreen.
       * @return {Promise}
       */

    }, {
      key: "exitFullscreen",
      value: function exitFullscreen() {
        if (screenfull.isEnabled) {
          return screenfull.exit();
        }

        return this.callMethod('exitFullscreen');
      }
      /**
       * Returns true if the player is currently fullscreen.
       * @return {Promise}
       */

    }, {
      key: "getFullscreen",
      value: function getFullscreen() {
        if (screenfull.isEnabled) {
          return npo_src.resolve(screenfull.isFullscreen);
        }

        return this.get('fullscreen');
      }
      /**
       * Request that the player enters picture-in-picture.
       * @return {Promise}
       */

    }, {
      key: "requestPictureInPicture",
      value: function requestPictureInPicture() {
        return this.callMethod('requestPictureInPicture');
      }
      /**
       * Request that the player exits picture-in-picture.
       * @return {Promise}
       */

    }, {
      key: "exitPictureInPicture",
      value: function exitPictureInPicture() {
        return this.callMethod('exitPictureInPicture');
      }
      /**
       * Returns true if the player is currently picture-in-picture.
       * @return {Promise}
       */

    }, {
      key: "getPictureInPicture",
      value: function getPictureInPicture() {
        return this.get('pictureInPicture');
      }
      /**
       * A promise to unload the video.
       *
       * @promise UnloadPromise
       * @fulfill {void} The video was unloaded.
       */

      /**
       * Return the player to its initial state.
       *
       * @return {UnloadPromise}
       */

    }, {
      key: "unload",
      value: function unload() {
        return this.callMethod('unload');
      }
      /**
       * Cleanup the player and remove it from the DOM
       *
       * It won't be usable and a new one should be constructed
       *  in order to do any operations.
       *
       * @return {Promise}
       */

    }, {
      key: "destroy",
      value: function destroy() {
        var _this5 = this;

        return new npo_src(function (resolve) {
          readyMap.delete(_this5);
          playerMap.delete(_this5.element);

          if (_this5._originalElement) {
            playerMap.delete(_this5._originalElement);

            _this5._originalElement.removeAttribute('data-vimeo-initialized');
          }

          if (_this5.element && _this5.element.nodeName === 'IFRAME' && _this5.element.parentNode) {
            // If we've added an additional wrapper div, remove that from the DOM.
            // If not, just remove the iframe element.
            if (_this5.element.parentNode.parentNode && _this5._originalElement && _this5._originalElement !== _this5.element.parentNode) {
              _this5.element.parentNode.parentNode.removeChild(_this5.element.parentNode);
            } else {
              _this5.element.parentNode.removeChild(_this5.element);
            }
          } // If the clip is private there is a case where the element stays the
          // div element. Destroy should reset the div and remove the iframe child.


          if (_this5.element && _this5.element.nodeName === 'DIV' && _this5.element.parentNode) {
            _this5.element.removeAttribute('data-vimeo-initialized');

            var iframe = _this5.element.querySelector('iframe');

            if (iframe && iframe.parentNode) {
              // If we've added an additional wrapper div, remove that from the DOM.
              // If not, just remove the iframe element.
              if (iframe.parentNode.parentNode && _this5._originalElement && _this5._originalElement !== iframe.parentNode) {
                iframe.parentNode.parentNode.removeChild(iframe.parentNode);
              } else {
                iframe.parentNode.removeChild(iframe);
              }
            }
          }

          _this5._window.removeEventListener('message', _this5._onMessage);

          resolve();
        });
      }
      /**
       * A promise to get the autopause behavior of the video.
       *
       * @promise GetAutopausePromise
       * @fulfill {boolean} Whether autopause is turned on or off.
       * @reject {UnsupportedError} Autopause is not supported with the current
       *         player or browser.
       */

      /**
       * Get the autopause behavior for this player.
       *
       * @return {GetAutopausePromise}
       */

    }, {
      key: "getAutopause",
      value: function getAutopause() {
        return this.get('autopause');
      }
      /**
       * A promise to set the autopause behavior of the video.
       *
       * @promise SetAutopausePromise
       * @fulfill {boolean} Whether autopause is turned on or off.
       * @reject {UnsupportedError} Autopause is not supported with the current
       *         player or browser.
       */

      /**
       * Enable or disable the autopause behavior of this player.
       *
       * By default, when another video is played in the same browser, this
       * player will automatically pause. Unless you have a specific reason
       * for doing so, we recommend that you leave autopause set to the
       * default (`true`).
       *
       * @param {boolean} autopause
       * @return {SetAutopausePromise}
       */

    }, {
      key: "setAutopause",
      value: function setAutopause(autopause) {
        return this.set('autopause', autopause);
      }
      /**
       * A promise to get the buffered property of the video.
       *
       * @promise GetBufferedPromise
       * @fulfill {Array} Buffered Timeranges converted to an Array.
       */

      /**
       * Get the buffered property of the video.
       *
       * @return {GetBufferedPromise}
       */

    }, {
      key: "getBuffered",
      value: function getBuffered() {
        return this.get('buffered');
      }
      /**
       * @typedef {Object} CameraProperties
       * @prop {number} props.yaw - Number between 0 and 360.
       * @prop {number} props.pitch - Number between -90 and 90.
       * @prop {number} props.roll - Number between -180 and 180.
       * @prop {number} props.fov - The field of view in degrees.
       */

      /**
       * A promise to get the camera properties of the player.
       *
       * @promise GetCameraPromise
       * @fulfill {CameraProperties} The camera properties.
       */

      /**
       * For 360° videos get the camera properties for this player.
       *
       * @return {GetCameraPromise}
       */

    }, {
      key: "getCameraProps",
      value: function getCameraProps() {
        return this.get('cameraProps');
      }
      /**
       * A promise to set the camera properties of the player.
       *
       * @promise SetCameraPromise
       * @fulfill {Object} The camera was successfully set.
       * @reject {RangeError} The range was out of bounds.
       */

      /**
       * For 360° videos set the camera properties for this player.
       *
       * @param {CameraProperties} camera The camera properties
       * @return {SetCameraPromise}
       */

    }, {
      key: "setCameraProps",
      value: function setCameraProps(camera) {
        return this.set('cameraProps', camera);
      }
      /**
       * A representation of a chapter.
       *
       * @typedef {Object} VimeoChapter
       * @property {number} startTime The start time of the chapter.
       * @property {object} title The title of the chapter.
       * @property {number} index The place in the order of Chapters. Starts at 1.
       */

      /**
       * A promise to get chapters for the video.
       *
       * @promise GetChaptersPromise
       * @fulfill {VimeoChapter[]} The chapters for the video.
       */

      /**
       * Get an array of all the chapters for the video.
       *
       * @return {GetChaptersPromise}
       */

    }, {
      key: "getChapters",
      value: function getChapters() {
        return this.get('chapters');
      }
      /**
       * A promise to get the currently active chapter.
       *
       * @promise GetCurrentChaptersPromise
       * @fulfill {VimeoChapter|undefined} The current chapter for the video.
       */

      /**
       * Get the currently active chapter for the video.
       *
       * @return {GetCurrentChaptersPromise}
       */

    }, {
      key: "getCurrentChapter",
      value: function getCurrentChapter() {
        return this.get('currentChapter');
      }
      /**
       * A promise to get the color of the player.
       *
       * @promise GetColorPromise
       * @fulfill {string} The hex color of the player.
       */

      /**
       * Get the color for this player.
       *
       * @return {GetColorPromise}
       */

    }, {
      key: "getColor",
      value: function getColor() {
        return this.get('color');
      }
      /**
       * A promise to set the color of the player.
       *
       * @promise SetColorPromise
       * @fulfill {string} The color was successfully set.
       * @reject {TypeError} The string was not a valid hex or rgb color.
       * @reject {ContrastError} The color was set, but the contrast is
       *         outside of the acceptable range.
       * @reject {EmbedSettingsError} The owner of the player has chosen to
       *         use a specific color.
       */

      /**
       * Set the color of this player to a hex or rgb string. Setting the
       * color may fail if the owner of the video has set their embed
       * preferences to force a specific color.
       *
       * @param {string} color The hex or rgb color string to set.
       * @return {SetColorPromise}
       */

    }, {
      key: "setColor",
      value: function setColor(color) {
        return this.set('color', color);
      }
      /**
       * A representation of a cue point.
       *
       * @typedef {Object} VimeoCuePoint
       * @property {number} time The time of the cue point.
       * @property {object} data The data passed when adding the cue point.
       * @property {string} id The unique id for use with removeCuePoint.
       */

      /**
       * A promise to get the cue points of a video.
       *
       * @promise GetCuePointsPromise
       * @fulfill {VimeoCuePoint[]} The cue points added to the video.
       * @reject {UnsupportedError} Cue points are not supported with the current
       *         player or browser.
       */

      /**
       * Get an array of the cue points added to the video.
       *
       * @return {GetCuePointsPromise}
       */

    }, {
      key: "getCuePoints",
      value: function getCuePoints() {
        return this.get('cuePoints');
      }
      /**
       * A promise to get the current time of the video.
       *
       * @promise GetCurrentTimePromise
       * @fulfill {number} The current time in seconds.
       */

      /**
       * Get the current playback position in seconds.
       *
       * @return {GetCurrentTimePromise}
       */

    }, {
      key: "getCurrentTime",
      value: function getCurrentTime() {
        return this.get('currentTime');
      }
      /**
       * A promise to set the current time of the video.
       *
       * @promise SetCurrentTimePromise
       * @fulfill {number} The actual current time that was set.
       * @reject {RangeError} the time was less than 0 or greater than the
       *         video’s duration.
       */

      /**
       * Set the current playback position in seconds. If the player was
       * paused, it will remain paused. Likewise, if the player was playing,
       * it will resume playing once the video has buffered.
       *
       * You can provide an accurate time and the player will attempt to seek
       * to as close to that time as possible. The exact time will be the
       * fulfilled value of the promise.
       *
       * @param {number} currentTime
       * @return {SetCurrentTimePromise}
       */

    }, {
      key: "setCurrentTime",
      value: function setCurrentTime(currentTime) {
        return this.set('currentTime', currentTime);
      }
      /**
       * A promise to get the duration of the video.
       *
       * @promise GetDurationPromise
       * @fulfill {number} The duration in seconds.
       */

      /**
       * Get the duration of the video in seconds. It will be rounded to the
       * nearest second before playback begins, and to the nearest thousandth
       * of a second after playback begins.
       *
       * @return {GetDurationPromise}
       */

    }, {
      key: "getDuration",
      value: function getDuration() {
        return this.get('duration');
      }
      /**
       * A promise to get the ended state of the video.
       *
       * @promise GetEndedPromise
       * @fulfill {boolean} Whether or not the video has ended.
       */

      /**
       * Get the ended state of the video. The video has ended if
       * `currentTime === duration`.
       *
       * @return {GetEndedPromise}
       */

    }, {
      key: "getEnded",
      value: function getEnded() {
        return this.get('ended');
      }
      /**
       * A promise to get the loop state of the player.
       *
       * @promise GetLoopPromise
       * @fulfill {boolean} Whether or not the player is set to loop.
       */

      /**
       * Get the loop state of the player.
       *
       * @return {GetLoopPromise}
       */

    }, {
      key: "getLoop",
      value: function getLoop() {
        return this.get('loop');
      }
      /**
       * A promise to set the loop state of the player.
       *
       * @promise SetLoopPromise
       * @fulfill {boolean} The loop state that was set.
       */

      /**
       * Set the loop state of the player. When set to `true`, the player
       * will start over immediately once playback ends.
       *
       * @param {boolean} loop
       * @return {SetLoopPromise}
       */

    }, {
      key: "setLoop",
      value: function setLoop(loop) {
        return this.set('loop', loop);
      }
      /**
       * A promise to set the muted state of the player.
       *
       * @promise SetMutedPromise
       * @fulfill {boolean} The muted state that was set.
       */

      /**
       * Set the muted state of the player. When set to `true`, the player
       * volume will be muted.
       *
       * @param {boolean} muted
       * @return {SetMutedPromise}
       */

    }, {
      key: "setMuted",
      value: function setMuted(muted) {
        return this.set('muted', muted);
      }
      /**
       * A promise to get the muted state of the player.
       *
       * @promise GetMutedPromise
       * @fulfill {boolean} Whether or not the player is muted.
       */

      /**
       * Get the muted state of the player.
       *
       * @return {GetMutedPromise}
       */

    }, {
      key: "getMuted",
      value: function getMuted() {
        return this.get('muted');
      }
      /**
       * A promise to get the paused state of the player.
       *
       * @promise GetLoopPromise
       * @fulfill {boolean} Whether or not the video is paused.
       */

      /**
       * Get the paused state of the player.
       *
       * @return {GetLoopPromise}
       */

    }, {
      key: "getPaused",
      value: function getPaused() {
        return this.get('paused');
      }
      /**
       * A promise to get the playback rate of the player.
       *
       * @promise GetPlaybackRatePromise
       * @fulfill {number} The playback rate of the player on a scale from 0.5 to 2.
       */

      /**
       * Get the playback rate of the player on a scale from `0.5` to `2`.
       *
       * @return {GetPlaybackRatePromise}
       */

    }, {
      key: "getPlaybackRate",
      value: function getPlaybackRate() {
        return this.get('playbackRate');
      }
      /**
       * A promise to set the playbackrate of the player.
       *
       * @promise SetPlaybackRatePromise
       * @fulfill {number} The playback rate was set.
       * @reject {RangeError} The playback rate was less than 0.5 or greater than 2.
       */

      /**
       * Set the playback rate of the player on a scale from `0.5` to `2`. When set
       * via the API, the playback rate will not be synchronized to other
       * players or stored as the viewer's preference.
       *
       * @param {number} playbackRate
       * @return {SetPlaybackRatePromise}
       */

    }, {
      key: "setPlaybackRate",
      value: function setPlaybackRate(playbackRate) {
        return this.set('playbackRate', playbackRate);
      }
      /**
       * A promise to get the played property of the video.
       *
       * @promise GetPlayedPromise
       * @fulfill {Array} Played Timeranges converted to an Array.
       */

      /**
       * Get the played property of the video.
       *
       * @return {GetPlayedPromise}
       */

    }, {
      key: "getPlayed",
      value: function getPlayed() {
        return this.get('played');
      }
      /**
       * A promise to get the qualities available of the current video.
       *
       * @promise GetQualitiesPromise
       * @fulfill {Array} The qualities of the video.
       */

      /**
       * Get the qualities of the current video.
       *
       * @return {GetQualitiesPromise}
       */

    }, {
      key: "getQualities",
      value: function getQualities() {
        return this.get('qualities');
      }
      /**
       * A promise to get the current set quality of the video.
       *
       * @promise GetQualityPromise
       * @fulfill {string} The current set quality.
       */

      /**
       * Get the current set quality of the video.
       *
       * @return {GetQualityPromise}
       */

    }, {
      key: "getQuality",
      value: function getQuality() {
        return this.get('quality');
      }
      /**
       * A promise to set the video quality.
       *
       * @promise SetQualityPromise
       * @fulfill {number} The quality was set.
       * @reject {RangeError} The quality is not available.
       */

      /**
       * Set a video quality.
       *
       * @param {string} quality
       * @return {SetQualityPromise}
       */

    }, {
      key: "setQuality",
      value: function setQuality(quality) {
        return this.set('quality', quality);
      }
      /**
       * A promise to get the seekable property of the video.
       *
       * @promise GetSeekablePromise
       * @fulfill {Array} Seekable Timeranges converted to an Array.
       */

      /**
       * Get the seekable property of the video.
       *
       * @return {GetSeekablePromise}
       */

    }, {
      key: "getSeekable",
      value: function getSeekable() {
        return this.get('seekable');
      }
      /**
       * A promise to get the seeking property of the player.
       *
       * @promise GetSeekingPromise
       * @fulfill {boolean} Whether or not the player is currently seeking.
       */

      /**
       * Get if the player is currently seeking.
       *
       * @return {GetSeekingPromise}
       */

    }, {
      key: "getSeeking",
      value: function getSeeking() {
        return this.get('seeking');
      }
      /**
       * A promise to get the text tracks of a video.
       *
       * @promise GetTextTracksPromise
       * @fulfill {VimeoTextTrack[]} The text tracks associated with the video.
       */

      /**
       * Get an array of the text tracks that exist for the video.
       *
       * @return {GetTextTracksPromise}
       */

    }, {
      key: "getTextTracks",
      value: function getTextTracks() {
        return this.get('textTracks');
      }
      /**
       * A promise to get the embed code for the video.
       *
       * @promise GetVideoEmbedCodePromise
       * @fulfill {string} The `<iframe>` embed code for the video.
       */

      /**
       * Get the `<iframe>` embed code for the video.
       *
       * @return {GetVideoEmbedCodePromise}
       */

    }, {
      key: "getVideoEmbedCode",
      value: function getVideoEmbedCode() {
        return this.get('videoEmbedCode');
      }
      /**
       * A promise to get the id of the video.
       *
       * @promise GetVideoIdPromise
       * @fulfill {number} The id of the video.
       */

      /**
       * Get the id of the video.
       *
       * @return {GetVideoIdPromise}
       */

    }, {
      key: "getVideoId",
      value: function getVideoId() {
        return this.get('videoId');
      }
      /**
       * A promise to get the title of the video.
       *
       * @promise GetVideoTitlePromise
       * @fulfill {number} The title of the video.
       */

      /**
       * Get the title of the video.
       *
       * @return {GetVideoTitlePromise}
       */

    }, {
      key: "getVideoTitle",
      value: function getVideoTitle() {
        return this.get('videoTitle');
      }
      /**
       * A promise to get the native width of the video.
       *
       * @promise GetVideoWidthPromise
       * @fulfill {number} The native width of the video.
       */

      /**
       * Get the native width of the currently‐playing video. The width of
       * the highest‐resolution available will be used before playback begins.
       *
       * @return {GetVideoWidthPromise}
       */

    }, {
      key: "getVideoWidth",
      value: function getVideoWidth() {
        return this.get('videoWidth');
      }
      /**
       * A promise to get the native height of the video.
       *
       * @promise GetVideoHeightPromise
       * @fulfill {number} The native height of the video.
       */

      /**
       * Get the native height of the currently‐playing video. The height of
       * the highest‐resolution available will be used before playback begins.
       *
       * @return {GetVideoHeightPromise}
       */

    }, {
      key: "getVideoHeight",
      value: function getVideoHeight() {
        return this.get('videoHeight');
      }
      /**
       * A promise to get the vimeo.com url for the video.
       *
       * @promise GetVideoUrlPromise
       * @fulfill {number} The vimeo.com url for the video.
       * @reject {PrivacyError} The url isn’t available because of the video’s privacy setting.
       */

      /**
       * Get the vimeo.com url for the video.
       *
       * @return {GetVideoUrlPromise}
       */

    }, {
      key: "getVideoUrl",
      value: function getVideoUrl() {
        return this.get('videoUrl');
      }
      /**
       * A promise to get the volume level of the player.
       *
       * @promise GetVolumePromise
       * @fulfill {number} The volume level of the player on a scale from 0 to 1.
       */

      /**
       * Get the current volume level of the player on a scale from `0` to `1`.
       *
       * Most mobile devices do not support an independent volume from the
       * system volume. In those cases, this method will always return `1`.
       *
       * @return {GetVolumePromise}
       */

    }, {
      key: "getVolume",
      value: function getVolume() {
        return this.get('volume');
      }
      /**
       * A promise to set the volume level of the player.
       *
       * @promise SetVolumePromise
       * @fulfill {number} The volume was set.
       * @reject {RangeError} The volume was less than 0 or greater than 1.
       */

      /**
       * Set the volume of the player on a scale from `0` to `1`. When set
       * via the API, the volume level will not be synchronized to other
       * players or stored as the viewer’s preference.
       *
       * Most mobile devices do not support setting the volume. An error will
       * *not* be triggered in that situation.
       *
       * @param {number} volume
       * @return {SetVolumePromise}
       */

    }, {
      key: "setVolume",
      value: function setVolume(volume) {
        return this.set('volume', volume);
      }
    }]);

    return Player;
  }(); // Setup embed only if this is not a node environment


  if (!isNode) {
    screenfull = initializeScreenfull();
    initializeEmbeds();
    resizeEmbeds();
  }

  function fluorescentVideo_es(a$1,n){void 0===n&&(n={});var u,r=n.id,d=n.playerEl,p=n.type;if(r&&p){var y=a(),f=y.on,l=y.emit;return "youtube"===p?((u=t(d)).loadVideoById({videoId:r,suggestedQuality:"large"}),u.stopVideo(),u.on("stateChange",function(e){1===e.data?l("play"):2===e.data&&l("pause");}),u.on("ready",function(){l("ready"),m();})):"vimeo"===p&&((u=new Player(d,{id:r})).on("play",function(){return l("play")}),u.on("pause",function(){return l("pause")}),u.ready().then(function(){l("ready"),m();})),{destroy:function(){},on:f,pause:function(){"youtube"===p?u.pauseVideo():"vimeo"===p&&u.pause();},play:function(){"youtube"===p?u.playVideo():"vimeo"===p&&u.play();}}}function m(){var o=n$1("iframe",a$1),t=o.height/o.width*100,i=o.parentNode;o.height="100%",o.width="100%","youtube"===p?i.style.paddingTop=t+"%":"vimeo"===p&&(i.parentNode.style.paddingTop=t+"%"),l("resized");}}

  var fluorescentVideo_es$1 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    'default': fluorescentVideo_es
  });

  var nouislider = {exports: {}};

  (function (module, exports) {
  (function (global, factory) {
      factory(exports) ;
  }(commonjsGlobal$1, (function (exports) {
      exports.PipsMode = void 0;
      (function (PipsMode) {
          PipsMode["Range"] = "range";
          PipsMode["Steps"] = "steps";
          PipsMode["Positions"] = "positions";
          PipsMode["Count"] = "count";
          PipsMode["Values"] = "values";
      })(exports.PipsMode || (exports.PipsMode = {}));
      exports.PipsType = void 0;
      (function (PipsType) {
          PipsType[PipsType["None"] = -1] = "None";
          PipsType[PipsType["NoValue"] = 0] = "NoValue";
          PipsType[PipsType["LargeValue"] = 1] = "LargeValue";
          PipsType[PipsType["SmallValue"] = 2] = "SmallValue";
      })(exports.PipsType || (exports.PipsType = {}));
      //region Helper Methods
      function isValidFormatter(entry) {
          return isValidPartialFormatter(entry) && typeof entry.from === "function";
      }
      function isValidPartialFormatter(entry) {
          // partial formatters only need a to function and not a from function
          return typeof entry === "object" && typeof entry.to === "function";
      }
      function removeElement(el) {
          el.parentElement.removeChild(el);
      }
      function isSet(value) {
          return value !== null && value !== undefined;
      }
      // Bindable version
      function preventDefault(e) {
          e.preventDefault();
      }
      // Removes duplicates from an array.
      function unique(array) {
          return array.filter(function (a) {
              return !this[a] ? (this[a] = true) : false;
          }, {});
      }
      // Round a value to the closest 'to'.
      function closest(value, to) {
          return Math.round(value / to) * to;
      }
      // Current position of an element relative to the document.
      function offset(elem, orientation) {
          var rect = elem.getBoundingClientRect();
          var doc = elem.ownerDocument;
          var docElem = doc.documentElement;
          var pageOffset = getPageOffset(doc);
          // getBoundingClientRect contains left scroll in Chrome on Android.
          // I haven't found a feature detection that proves this. Worst case
          // scenario on mis-match: the 'tap' feature on horizontal sliders breaks.
          if (/webkit.*Chrome.*Mobile/i.test(navigator.userAgent)) {
              pageOffset.x = 0;
          }
          return orientation ? rect.top + pageOffset.y - docElem.clientTop : rect.left + pageOffset.x - docElem.clientLeft;
      }
      // Checks whether a value is numerical.
      function isNumeric(a) {
          return typeof a === "number" && !isNaN(a) && isFinite(a);
      }
      // Sets a class and removes it after [duration] ms.
      function addClassFor(element, className, duration) {
          if (duration > 0) {
              addClass(element, className);
              setTimeout(function () {
                  removeClass(element, className);
              }, duration);
          }
      }
      // Limits a value to 0 - 100
      function limit(a) {
          return Math.max(Math.min(a, 100), 0);
      }
      // Wraps a variable as an array, if it isn't one yet.
      // Note that an input array is returned by reference!
      function asArray(a) {
          return Array.isArray(a) ? a : [a];
      }
      // Counts decimals
      function countDecimals(numStr) {
          numStr = String(numStr);
          var pieces = numStr.split(".");
          return pieces.length > 1 ? pieces[1].length : 0;
      }
      // http://youmightnotneedjquery.com/#add_class
      function addClass(el, className) {
          if (el.classList && !/\s/.test(className)) {
              el.classList.add(className);
          }
          else {
              el.className += " " + className;
          }
      }
      // http://youmightnotneedjquery.com/#remove_class
      function removeClass(el, className) {
          if (el.classList && !/\s/.test(className)) {
              el.classList.remove(className);
          }
          else {
              el.className = el.className.replace(new RegExp("(^|\\b)" + className.split(" ").join("|") + "(\\b|$)", "gi"), " ");
          }
      }
      // https://plainjs.com/javascript/attributes/adding-removing-and-testing-for-classes-9/
      function hasClass(el, className) {
          return el.classList ? el.classList.contains(className) : new RegExp("\\b" + className + "\\b").test(el.className);
      }
      // https://developer.mozilla.org/en-US/docs/Web/API/Window/scrollY#Notes
      function getPageOffset(doc) {
          var supportPageOffset = window.pageXOffset !== undefined;
          var isCSS1Compat = (doc.compatMode || "") === "CSS1Compat";
          var x = supportPageOffset
              ? window.pageXOffset
              : isCSS1Compat
                  ? doc.documentElement.scrollLeft
                  : doc.body.scrollLeft;
          var y = supportPageOffset
              ? window.pageYOffset
              : isCSS1Compat
                  ? doc.documentElement.scrollTop
                  : doc.body.scrollTop;
          return {
              x: x,
              y: y
          };
      }
      // we provide a function to compute constants instead
      // of accessing window.* as soon as the module needs it
      // so that we do not compute anything if not needed
      function getActions() {
          // Determine the events to bind. IE11 implements pointerEvents without
          // a prefix, which breaks compatibility with the IE10 implementation.
          return window.navigator.pointerEnabled
              ? {
                  start: "pointerdown",
                  move: "pointermove",
                  end: "pointerup"
              }
              : window.navigator.msPointerEnabled
                  ? {
                      start: "MSPointerDown",
                      move: "MSPointerMove",
                      end: "MSPointerUp"
                  }
                  : {
                      start: "mousedown touchstart",
                      move: "mousemove touchmove",
                      end: "mouseup touchend"
                  };
      }
      // https://github.com/WICG/EventListenerOptions/blob/gh-pages/explainer.md
      // Issue #785
      function getSupportsPassive() {
          var supportsPassive = false;
          /* eslint-disable */
          try {
              var opts = Object.defineProperty({}, "passive", {
                  get: function () {
                      supportsPassive = true;
                  }
              });
              // @ts-ignore
              window.addEventListener("test", null, opts);
          }
          catch (e) { }
          /* eslint-enable */
          return supportsPassive;
      }
      function getSupportsTouchActionNone() {
          return window.CSS && CSS.supports && CSS.supports("touch-action", "none");
      }
      //endregion
      //region Range Calculation
      // Determine the size of a sub-range in relation to a full range.
      function subRangeRatio(pa, pb) {
          return 100 / (pb - pa);
      }
      // (percentage) How many percent is this value of this range?
      function fromPercentage(range, value, startRange) {
          return (value * 100) / (range[startRange + 1] - range[startRange]);
      }
      // (percentage) Where is this value on this range?
      function toPercentage(range, value) {
          return fromPercentage(range, range[0] < 0 ? value + Math.abs(range[0]) : value - range[0], 0);
      }
      // (value) How much is this percentage on this range?
      function isPercentage(range, value) {
          return (value * (range[1] - range[0])) / 100 + range[0];
      }
      function getJ(value, arr) {
          var j = 1;
          while (value >= arr[j]) {
              j += 1;
          }
          return j;
      }
      // (percentage) Input a value, find where, on a scale of 0-100, it applies.
      function toStepping(xVal, xPct, value) {
          if (value >= xVal.slice(-1)[0]) {
              return 100;
          }
          var j = getJ(value, xVal);
          var va = xVal[j - 1];
          var vb = xVal[j];
          var pa = xPct[j - 1];
          var pb = xPct[j];
          return pa + toPercentage([va, vb], value) / subRangeRatio(pa, pb);
      }
      // (value) Input a percentage, find where it is on the specified range.
      function fromStepping(xVal, xPct, value) {
          // There is no range group that fits 100
          if (value >= 100) {
              return xVal.slice(-1)[0];
          }
          var j = getJ(value, xPct);
          var va = xVal[j - 1];
          var vb = xVal[j];
          var pa = xPct[j - 1];
          var pb = xPct[j];
          return isPercentage([va, vb], (value - pa) * subRangeRatio(pa, pb));
      }
      // (percentage) Get the step that applies at a certain value.
      function getStep(xPct, xSteps, snap, value) {
          if (value === 100) {
              return value;
          }
          var j = getJ(value, xPct);
          var a = xPct[j - 1];
          var b = xPct[j];
          // If 'snap' is set, steps are used as fixed points on the slider.
          if (snap) {
              // Find the closest position, a or b.
              if (value - a > (b - a) / 2) {
                  return b;
              }
              return a;
          }
          if (!xSteps[j - 1]) {
              return value;
          }
          return xPct[j - 1] + closest(value - xPct[j - 1], xSteps[j - 1]);
      }
      //endregion
      //region Spectrum
      var Spectrum = /** @class */ (function () {
          function Spectrum(entry, snap, singleStep) {
              this.xPct = [];
              this.xVal = [];
              this.xSteps = [];
              this.xNumSteps = [];
              this.xHighestCompleteStep = [];
              this.xSteps = [singleStep || false];
              this.xNumSteps = [false];
              this.snap = snap;
              var index;
              var ordered = [];
              // Map the object keys to an array.
              Object.keys(entry).forEach(function (index) {
                  ordered.push([asArray(entry[index]), index]);
              });
              // Sort all entries by value (numeric sort).
              ordered.sort(function (a, b) {
                  return a[0][0] - b[0][0];
              });
              // Convert all entries to subranges.
              for (index = 0; index < ordered.length; index++) {
                  this.handleEntryPoint(ordered[index][1], ordered[index][0]);
              }
              // Store the actual step values.
              // xSteps is sorted in the same order as xPct and xVal.
              this.xNumSteps = this.xSteps.slice(0);
              // Convert all numeric steps to the percentage of the subrange they represent.
              for (index = 0; index < this.xNumSteps.length; index++) {
                  this.handleStepPoint(index, this.xNumSteps[index]);
              }
          }
          Spectrum.prototype.getDistance = function (value) {
              var index;
              var distances = [];
              for (index = 0; index < this.xNumSteps.length - 1; index++) {
                  // last "range" can't contain step size as it is purely an endpoint.
                  var step = this.xNumSteps[index];
                  if (step && (value / step) % 1 !== 0) {
                      throw new Error("noUiSlider: 'limit', 'margin' and 'padding' of " +
                          this.xPct[index] +
                          "% range must be divisible by step.");
                  }
                  // Calculate percentual distance in current range of limit, margin or padding
                  distances[index] = fromPercentage(this.xVal, value, index);
              }
              return distances;
          };
          // Calculate the percentual distance over the whole scale of ranges.
          // direction: 0 = backwards / 1 = forwards
          Spectrum.prototype.getAbsoluteDistance = function (value, distances, direction) {
              var xPct_index = 0;
              // Calculate range where to start calculation
              if (value < this.xPct[this.xPct.length - 1]) {
                  while (value > this.xPct[xPct_index + 1]) {
                      xPct_index++;
                  }
              }
              else if (value === this.xPct[this.xPct.length - 1]) {
                  xPct_index = this.xPct.length - 2;
              }
              // If looking backwards and the value is exactly at a range separator then look one range further
              if (!direction && value === this.xPct[xPct_index + 1]) {
                  xPct_index++;
              }
              if (distances === null) {
                  distances = [];
              }
              var start_factor;
              var rest_factor = 1;
              var rest_rel_distance = distances[xPct_index];
              var range_pct = 0;
              var rel_range_distance = 0;
              var abs_distance_counter = 0;
              var range_counter = 0;
              // Calculate what part of the start range the value is
              if (direction) {
                  start_factor = (value - this.xPct[xPct_index]) / (this.xPct[xPct_index + 1] - this.xPct[xPct_index]);
              }
              else {
                  start_factor = (this.xPct[xPct_index + 1] - value) / (this.xPct[xPct_index + 1] - this.xPct[xPct_index]);
              }
              // Do until the complete distance across ranges is calculated
              while (rest_rel_distance > 0) {
                  // Calculate the percentage of total range
                  range_pct = this.xPct[xPct_index + 1 + range_counter] - this.xPct[xPct_index + range_counter];
                  // Detect if the margin, padding or limit is larger then the current range and calculate
                  if (distances[xPct_index + range_counter] * rest_factor + 100 - start_factor * 100 > 100) {
                      // If larger then take the percentual distance of the whole range
                      rel_range_distance = range_pct * start_factor;
                      // Rest factor of relative percentual distance still to be calculated
                      rest_factor = (rest_rel_distance - 100 * start_factor) / distances[xPct_index + range_counter];
                      // Set start factor to 1 as for next range it does not apply.
                      start_factor = 1;
                  }
                  else {
                      // If smaller or equal then take the percentual distance of the calculate percentual part of that range
                      rel_range_distance = ((distances[xPct_index + range_counter] * range_pct) / 100) * rest_factor;
                      // No rest left as the rest fits in current range
                      rest_factor = 0;
                  }
                  if (direction) {
                      abs_distance_counter = abs_distance_counter - rel_range_distance;
                      // Limit range to first range when distance becomes outside of minimum range
                      if (this.xPct.length + range_counter >= 1) {
                          range_counter--;
                      }
                  }
                  else {
                      abs_distance_counter = abs_distance_counter + rel_range_distance;
                      // Limit range to last range when distance becomes outside of maximum range
                      if (this.xPct.length - range_counter >= 1) {
                          range_counter++;
                      }
                  }
                  // Rest of relative percentual distance still to be calculated
                  rest_rel_distance = distances[xPct_index + range_counter] * rest_factor;
              }
              return value + abs_distance_counter;
          };
          Spectrum.prototype.toStepping = function (value) {
              value = toStepping(this.xVal, this.xPct, value);
              return value;
          };
          Spectrum.prototype.fromStepping = function (value) {
              return fromStepping(this.xVal, this.xPct, value);
          };
          Spectrum.prototype.getStep = function (value) {
              value = getStep(this.xPct, this.xSteps, this.snap, value);
              return value;
          };
          Spectrum.prototype.getDefaultStep = function (value, isDown, size) {
              var j = getJ(value, this.xPct);
              // When at the top or stepping down, look at the previous sub-range
              if (value === 100 || (isDown && value === this.xPct[j - 1])) {
                  j = Math.max(j - 1, 1);
              }
              return (this.xVal[j] - this.xVal[j - 1]) / size;
          };
          Spectrum.prototype.getNearbySteps = function (value) {
              var j = getJ(value, this.xPct);
              return {
                  stepBefore: {
                      startValue: this.xVal[j - 2],
                      step: this.xNumSteps[j - 2],
                      highestStep: this.xHighestCompleteStep[j - 2]
                  },
                  thisStep: {
                      startValue: this.xVal[j - 1],
                      step: this.xNumSteps[j - 1],
                      highestStep: this.xHighestCompleteStep[j - 1]
                  },
                  stepAfter: {
                      startValue: this.xVal[j],
                      step: this.xNumSteps[j],
                      highestStep: this.xHighestCompleteStep[j]
                  }
              };
          };
          Spectrum.prototype.countStepDecimals = function () {
              var stepDecimals = this.xNumSteps.map(countDecimals);
              return Math.max.apply(null, stepDecimals);
          };
          Spectrum.prototype.hasNoSize = function () {
              return this.xVal[0] === this.xVal[this.xVal.length - 1];
          };
          // Outside testing
          Spectrum.prototype.convert = function (value) {
              return this.getStep(this.toStepping(value));
          };
          Spectrum.prototype.handleEntryPoint = function (index, value) {
              var percentage;
              // Covert min/max syntax to 0 and 100.
              if (index === "min") {
                  percentage = 0;
              }
              else if (index === "max") {
                  percentage = 100;
              }
              else {
                  percentage = parseFloat(index);
              }
              // Check for correct input.
              if (!isNumeric(percentage) || !isNumeric(value[0])) {
                  throw new Error("noUiSlider: 'range' value isn't numeric.");
              }
              // Store values.
              this.xPct.push(percentage);
              this.xVal.push(value[0]);
              var value1 = Number(value[1]);
              // NaN will evaluate to false too, but to keep
              // logging clear, set step explicitly. Make sure
              // not to override the 'step' setting with false.
              if (!percentage) {
                  if (!isNaN(value1)) {
                      this.xSteps[0] = value1;
                  }
              }
              else {
                  this.xSteps.push(isNaN(value1) ? false : value1);
              }
              this.xHighestCompleteStep.push(0);
          };
          Spectrum.prototype.handleStepPoint = function (i, n) {
              // Ignore 'false' stepping.
              if (!n) {
                  return;
              }
              // Step over zero-length ranges (#948);
              if (this.xVal[i] === this.xVal[i + 1]) {
                  this.xSteps[i] = this.xHighestCompleteStep[i] = this.xVal[i];
                  return;
              }
              // Factor to range ratio
              this.xSteps[i] =
                  fromPercentage([this.xVal[i], this.xVal[i + 1]], n, 0) / subRangeRatio(this.xPct[i], this.xPct[i + 1]);
              var totalSteps = (this.xVal[i + 1] - this.xVal[i]) / this.xNumSteps[i];
              var highestStep = Math.ceil(Number(totalSteps.toFixed(3)) - 1);
              var step = this.xVal[i] + this.xNumSteps[i] * highestStep;
              this.xHighestCompleteStep[i] = step;
          };
          return Spectrum;
      }());
      //endregion
      //region Options
      /*	Every input option is tested and parsed. This will prevent
          endless validation in internal methods. These tests are
          structured with an item for every option available. An
          option can be marked as required by setting the 'r' flag.
          The testing function is provided with three arguments:
              - The provided value for the option;
              - A reference to the options object;
              - The name for the option;

          The testing function returns false when an error is detected,
          or true when everything is OK. It can also modify the option
          object, to make sure all values can be correctly looped elsewhere. */
      //region Defaults
      var defaultFormatter = {
          to: function (value) {
              return value === undefined ? "" : value.toFixed(2);
          },
          from: Number
      };
      var cssClasses = {
          target: "target",
          base: "base",
          origin: "origin",
          handle: "handle",
          handleLower: "handle-lower",
          handleUpper: "handle-upper",
          touchArea: "touch-area",
          horizontal: "horizontal",
          vertical: "vertical",
          background: "background",
          connect: "connect",
          connects: "connects",
          ltr: "ltr",
          rtl: "rtl",
          textDirectionLtr: "txt-dir-ltr",
          textDirectionRtl: "txt-dir-rtl",
          draggable: "draggable",
          drag: "state-drag",
          tap: "state-tap",
          active: "active",
          tooltip: "tooltip",
          pips: "pips",
          pipsHorizontal: "pips-horizontal",
          pipsVertical: "pips-vertical",
          marker: "marker",
          markerHorizontal: "marker-horizontal",
          markerVertical: "marker-vertical",
          markerNormal: "marker-normal",
          markerLarge: "marker-large",
          markerSub: "marker-sub",
          value: "value",
          valueHorizontal: "value-horizontal",
          valueVertical: "value-vertical",
          valueNormal: "value-normal",
          valueLarge: "value-large",
          valueSub: "value-sub"
      };
      // Namespaces of internal event listeners
      var INTERNAL_EVENT_NS = {
          tooltips: ".__tooltips",
          aria: ".__aria"
      };
      //endregion
      function testStep(parsed, entry) {
          if (!isNumeric(entry)) {
              throw new Error("noUiSlider: 'step' is not numeric.");
          }
          // The step option can still be used to set stepping
          // for linear sliders. Overwritten if set in 'range'.
          parsed.singleStep = entry;
      }
      function testKeyboardPageMultiplier(parsed, entry) {
          if (!isNumeric(entry)) {
              throw new Error("noUiSlider: 'keyboardPageMultiplier' is not numeric.");
          }
          parsed.keyboardPageMultiplier = entry;
      }
      function testKeyboardMultiplier(parsed, entry) {
          if (!isNumeric(entry)) {
              throw new Error("noUiSlider: 'keyboardMultiplier' is not numeric.");
          }
          parsed.keyboardMultiplier = entry;
      }
      function testKeyboardDefaultStep(parsed, entry) {
          if (!isNumeric(entry)) {
              throw new Error("noUiSlider: 'keyboardDefaultStep' is not numeric.");
          }
          parsed.keyboardDefaultStep = entry;
      }
      function testRange(parsed, entry) {
          // Filter incorrect input.
          if (typeof entry !== "object" || Array.isArray(entry)) {
              throw new Error("noUiSlider: 'range' is not an object.");
          }
          // Catch missing start or end.
          if (entry.min === undefined || entry.max === undefined) {
              throw new Error("noUiSlider: Missing 'min' or 'max' in 'range'.");
          }
          parsed.spectrum = new Spectrum(entry, parsed.snap || false, parsed.singleStep);
      }
      function testStart(parsed, entry) {
          entry = asArray(entry);
          // Validate input. Values aren't tested, as the public .val method
          // will always provide a valid location.
          if (!Array.isArray(entry) || !entry.length) {
              throw new Error("noUiSlider: 'start' option is incorrect.");
          }
          // Store the number of handles.
          parsed.handles = entry.length;
          // When the slider is initialized, the .val method will
          // be called with the start options.
          parsed.start = entry;
      }
      function testSnap(parsed, entry) {
          if (typeof entry !== "boolean") {
              throw new Error("noUiSlider: 'snap' option must be a boolean.");
          }
          // Enforce 100% stepping within subranges.
          parsed.snap = entry;
      }
      function testAnimate(parsed, entry) {
          if (typeof entry !== "boolean") {
              throw new Error("noUiSlider: 'animate' option must be a boolean.");
          }
          // Enforce 100% stepping within subranges.
          parsed.animate = entry;
      }
      function testAnimationDuration(parsed, entry) {
          if (typeof entry !== "number") {
              throw new Error("noUiSlider: 'animationDuration' option must be a number.");
          }
          parsed.animationDuration = entry;
      }
      function testConnect(parsed, entry) {
          var connect = [false];
          var i;
          // Map legacy options
          if (entry === "lower") {
              entry = [true, false];
          }
          else if (entry === "upper") {
              entry = [false, true];
          }
          // Handle boolean options
          if (entry === true || entry === false) {
              for (i = 1; i < parsed.handles; i++) {
                  connect.push(entry);
              }
              connect.push(false);
          }
          // Reject invalid input
          else if (!Array.isArray(entry) || !entry.length || entry.length !== parsed.handles + 1) {
              throw new Error("noUiSlider: 'connect' option doesn't match handle count.");
          }
          else {
              connect = entry;
          }
          parsed.connect = connect;
      }
      function testOrientation(parsed, entry) {
          // Set orientation to an a numerical value for easy
          // array selection.
          switch (entry) {
              case "horizontal":
                  parsed.ort = 0;
                  break;
              case "vertical":
                  parsed.ort = 1;
                  break;
              default:
                  throw new Error("noUiSlider: 'orientation' option is invalid.");
          }
      }
      function testMargin(parsed, entry) {
          if (!isNumeric(entry)) {
              throw new Error("noUiSlider: 'margin' option must be numeric.");
          }
          // Issue #582
          if (entry === 0) {
              return;
          }
          parsed.margin = parsed.spectrum.getDistance(entry);
      }
      function testLimit(parsed, entry) {
          if (!isNumeric(entry)) {
              throw new Error("noUiSlider: 'limit' option must be numeric.");
          }
          parsed.limit = parsed.spectrum.getDistance(entry);
          if (!parsed.limit || parsed.handles < 2) {
              throw new Error("noUiSlider: 'limit' option is only supported on linear sliders with 2 or more handles.");
          }
      }
      function testPadding(parsed, entry) {
          var index;
          if (!isNumeric(entry) && !Array.isArray(entry)) {
              throw new Error("noUiSlider: 'padding' option must be numeric or array of exactly 2 numbers.");
          }
          if (Array.isArray(entry) && !(entry.length === 2 || isNumeric(entry[0]) || isNumeric(entry[1]))) {
              throw new Error("noUiSlider: 'padding' option must be numeric or array of exactly 2 numbers.");
          }
          if (entry === 0) {
              return;
          }
          if (!Array.isArray(entry)) {
              entry = [entry, entry];
          }
          // 'getDistance' returns false for invalid values.
          parsed.padding = [parsed.spectrum.getDistance(entry[0]), parsed.spectrum.getDistance(entry[1])];
          for (index = 0; index < parsed.spectrum.xNumSteps.length - 1; index++) {
              // last "range" can't contain step size as it is purely an endpoint.
              if (parsed.padding[0][index] < 0 || parsed.padding[1][index] < 0) {
                  throw new Error("noUiSlider: 'padding' option must be a positive number(s).");
              }
          }
          var totalPadding = entry[0] + entry[1];
          var firstValue = parsed.spectrum.xVal[0];
          var lastValue = parsed.spectrum.xVal[parsed.spectrum.xVal.length - 1];
          if (totalPadding / (lastValue - firstValue) > 1) {
              throw new Error("noUiSlider: 'padding' option must not exceed 100% of the range.");
          }
      }
      function testDirection(parsed, entry) {
          // Set direction as a numerical value for easy parsing.
          // Invert connection for RTL sliders, so that the proper
          // handles get the connect/background classes.
          switch (entry) {
              case "ltr":
                  parsed.dir = 0;
                  break;
              case "rtl":
                  parsed.dir = 1;
                  break;
              default:
                  throw new Error("noUiSlider: 'direction' option was not recognized.");
          }
      }
      function testBehaviour(parsed, entry) {
          // Make sure the input is a string.
          if (typeof entry !== "string") {
              throw new Error("noUiSlider: 'behaviour' must be a string containing options.");
          }
          // Check if the string contains any keywords.
          // None are required.
          var tap = entry.indexOf("tap") >= 0;
          var drag = entry.indexOf("drag") >= 0;
          var fixed = entry.indexOf("fixed") >= 0;
          var snap = entry.indexOf("snap") >= 0;
          var hover = entry.indexOf("hover") >= 0;
          var unconstrained = entry.indexOf("unconstrained") >= 0;
          var dragAll = entry.indexOf("drag-all") >= 0;
          if (fixed) {
              if (parsed.handles !== 2) {
                  throw new Error("noUiSlider: 'fixed' behaviour must be used with 2 handles");
              }
              // Use margin to enforce fixed state
              testMargin(parsed, parsed.start[1] - parsed.start[0]);
          }
          if (unconstrained && (parsed.margin || parsed.limit)) {
              throw new Error("noUiSlider: 'unconstrained' behaviour cannot be used with margin or limit");
          }
          parsed.events = {
              tap: tap || snap,
              drag: drag,
              dragAll: dragAll,
              fixed: fixed,
              snap: snap,
              hover: hover,
              unconstrained: unconstrained
          };
      }
      function testTooltips(parsed, entry) {
          if (entry === false) {
              return;
          }
          if (entry === true || isValidPartialFormatter(entry)) {
              parsed.tooltips = [];
              for (var i = 0; i < parsed.handles; i++) {
                  parsed.tooltips.push(entry);
              }
          }
          else {
              entry = asArray(entry);
              if (entry.length !== parsed.handles) {
                  throw new Error("noUiSlider: must pass a formatter for all handles.");
              }
              entry.forEach(function (formatter) {
                  if (typeof formatter !== "boolean" && !isValidPartialFormatter(formatter)) {
                      throw new Error("noUiSlider: 'tooltips' must be passed a formatter or 'false'.");
                  }
              });
              parsed.tooltips = entry;
          }
      }
      function testHandleAttributes(parsed, entry) {
          if (entry.length !== parsed.handles) {
              throw new Error("noUiSlider: must pass a attributes for all handles.");
          }
          parsed.handleAttributes = entry;
      }
      function testAriaFormat(parsed, entry) {
          if (!isValidPartialFormatter(entry)) {
              throw new Error("noUiSlider: 'ariaFormat' requires 'to' method.");
          }
          parsed.ariaFormat = entry;
      }
      function testFormat(parsed, entry) {
          if (!isValidFormatter(entry)) {
              throw new Error("noUiSlider: 'format' requires 'to' and 'from' methods.");
          }
          parsed.format = entry;
      }
      function testKeyboardSupport(parsed, entry) {
          if (typeof entry !== "boolean") {
              throw new Error("noUiSlider: 'keyboardSupport' option must be a boolean.");
          }
          parsed.keyboardSupport = entry;
      }
      function testDocumentElement(parsed, entry) {
          // This is an advanced option. Passed values are used without validation.
          parsed.documentElement = entry;
      }
      function testCssPrefix(parsed, entry) {
          if (typeof entry !== "string" && entry !== false) {
              throw new Error("noUiSlider: 'cssPrefix' must be a string or `false`.");
          }
          parsed.cssPrefix = entry;
      }
      function testCssClasses(parsed, entry) {
          if (typeof entry !== "object") {
              throw new Error("noUiSlider: 'cssClasses' must be an object.");
          }
          if (typeof parsed.cssPrefix === "string") {
              parsed.cssClasses = {};
              Object.keys(entry).forEach(function (key) {
                  parsed.cssClasses[key] = parsed.cssPrefix + entry[key];
              });
          }
          else {
              parsed.cssClasses = entry;
          }
      }
      // Test all developer settings and parse to assumption-safe values.
      function testOptions(options) {
          // To prove a fix for #537, freeze options here.
          // If the object is modified, an error will be thrown.
          // Object.freeze(options);
          var parsed = {
              margin: null,
              limit: null,
              padding: null,
              animate: true,
              animationDuration: 300,
              ariaFormat: defaultFormatter,
              format: defaultFormatter
          };
          // Tests are executed in the order they are presented here.
          var tests = {
              step: { r: false, t: testStep },
              keyboardPageMultiplier: { r: false, t: testKeyboardPageMultiplier },
              keyboardMultiplier: { r: false, t: testKeyboardMultiplier },
              keyboardDefaultStep: { r: false, t: testKeyboardDefaultStep },
              start: { r: true, t: testStart },
              connect: { r: true, t: testConnect },
              direction: { r: true, t: testDirection },
              snap: { r: false, t: testSnap },
              animate: { r: false, t: testAnimate },
              animationDuration: { r: false, t: testAnimationDuration },
              range: { r: true, t: testRange },
              orientation: { r: false, t: testOrientation },
              margin: { r: false, t: testMargin },
              limit: { r: false, t: testLimit },
              padding: { r: false, t: testPadding },
              behaviour: { r: true, t: testBehaviour },
              ariaFormat: { r: false, t: testAriaFormat },
              format: { r: false, t: testFormat },
              tooltips: { r: false, t: testTooltips },
              keyboardSupport: { r: true, t: testKeyboardSupport },
              documentElement: { r: false, t: testDocumentElement },
              cssPrefix: { r: true, t: testCssPrefix },
              cssClasses: { r: true, t: testCssClasses },
              handleAttributes: { r: false, t: testHandleAttributes }
          };
          var defaults = {
              connect: false,
              direction: "ltr",
              behaviour: "tap",
              orientation: "horizontal",
              keyboardSupport: true,
              cssPrefix: "noUi-",
              cssClasses: cssClasses,
              keyboardPageMultiplier: 5,
              keyboardMultiplier: 1,
              keyboardDefaultStep: 10
          };
          // AriaFormat defaults to regular format, if any.
          if (options.format && !options.ariaFormat) {
              options.ariaFormat = options.format;
          }
          // Run all options through a testing mechanism to ensure correct
          // input. It should be noted that options might get modified to
          // be handled properly. E.g. wrapping integers in arrays.
          Object.keys(tests).forEach(function (name) {
              // If the option isn't set, but it is required, throw an error.
              if (!isSet(options[name]) && defaults[name] === undefined) {
                  if (tests[name].r) {
                      throw new Error("noUiSlider: '" + name + "' is required.");
                  }
                  return;
              }
              tests[name].t(parsed, !isSet(options[name]) ? defaults[name] : options[name]);
          });
          // Forward pips options
          parsed.pips = options.pips;
          // All recent browsers accept unprefixed transform.
          // We need -ms- for IE9 and -webkit- for older Android;
          // Assume use of -webkit- if unprefixed and -ms- are not supported.
          // https://caniuse.com/#feat=transforms2d
          var d = document.createElement("div");
          var msPrefix = d.style.msTransform !== undefined;
          var noPrefix = d.style.transform !== undefined;
          parsed.transformRule = noPrefix ? "transform" : msPrefix ? "msTransform" : "webkitTransform";
          // Pips don't move, so we can place them using left/top.
          var styles = [
              ["left", "top"],
              ["right", "bottom"]
          ];
          parsed.style = styles[parsed.dir][parsed.ort];
          return parsed;
      }
      //endregion
      function scope(target, options, originalOptions) {
          var actions = getActions();
          var supportsTouchActionNone = getSupportsTouchActionNone();
          var supportsPassive = supportsTouchActionNone && getSupportsPassive();
          // All variables local to 'scope' are prefixed with 'scope_'
          // Slider DOM Nodes
          var scope_Target = target;
          var scope_Base;
          var scope_Handles;
          var scope_Connects;
          var scope_Pips;
          var scope_Tooltips;
          // Slider state values
          var scope_Spectrum = options.spectrum;
          var scope_Values = [];
          var scope_Locations = [];
          var scope_HandleNumbers = [];
          var scope_ActiveHandlesCount = 0;
          var scope_Events = {};
          // Document Nodes
          var scope_Document = target.ownerDocument;
          var scope_DocumentElement = options.documentElement || scope_Document.documentElement;
          var scope_Body = scope_Document.body;
          // For horizontal sliders in standard ltr documents,
          // make .noUi-origin overflow to the left so the document doesn't scroll.
          var scope_DirOffset = scope_Document.dir === "rtl" || options.ort === 1 ? 0 : 100;
          // Creates a node, adds it to target, returns the new node.
          function addNodeTo(addTarget, className) {
              var div = scope_Document.createElement("div");
              if (className) {
                  addClass(div, className);
              }
              addTarget.appendChild(div);
              return div;
          }
          // Append a origin to the base
          function addOrigin(base, handleNumber) {
              var origin = addNodeTo(base, options.cssClasses.origin);
              var handle = addNodeTo(origin, options.cssClasses.handle);
              addNodeTo(handle, options.cssClasses.touchArea);
              handle.setAttribute("data-handle", String(handleNumber));
              if (options.keyboardSupport) {
                  // https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/tabindex
                  // 0 = focusable and reachable
                  handle.setAttribute("tabindex", "0");
                  handle.addEventListener("keydown", function (event) {
                      return eventKeydown(event, handleNumber);
                  });
              }
              if (options.handleAttributes !== undefined) {
                  var attributes_1 = options.handleAttributes[handleNumber];
                  Object.keys(attributes_1).forEach(function (attribute) {
                      handle.setAttribute(attribute, attributes_1[attribute]);
                  });
              }
              handle.setAttribute("role", "slider");
              handle.setAttribute("aria-orientation", options.ort ? "vertical" : "horizontal");
              if (handleNumber === 0) {
                  addClass(handle, options.cssClasses.handleLower);
              }
              else if (handleNumber === options.handles - 1) {
                  addClass(handle, options.cssClasses.handleUpper);
              }
              return origin;
          }
          // Insert nodes for connect elements
          function addConnect(base, add) {
              if (!add) {
                  return false;
              }
              return addNodeTo(base, options.cssClasses.connect);
          }
          // Add handles to the slider base.
          function addElements(connectOptions, base) {
              var connectBase = addNodeTo(base, options.cssClasses.connects);
              scope_Handles = [];
              scope_Connects = [];
              scope_Connects.push(addConnect(connectBase, connectOptions[0]));
              // [::::O====O====O====]
              // connectOptions = [0, 1, 1, 1]
              for (var i = 0; i < options.handles; i++) {
                  // Keep a list of all added handles.
                  scope_Handles.push(addOrigin(base, i));
                  scope_HandleNumbers[i] = i;
                  scope_Connects.push(addConnect(connectBase, connectOptions[i + 1]));
              }
          }
          // Initialize a single slider.
          function addSlider(addTarget) {
              // Apply classes and data to the target.
              addClass(addTarget, options.cssClasses.target);
              if (options.dir === 0) {
                  addClass(addTarget, options.cssClasses.ltr);
              }
              else {
                  addClass(addTarget, options.cssClasses.rtl);
              }
              if (options.ort === 0) {
                  addClass(addTarget, options.cssClasses.horizontal);
              }
              else {
                  addClass(addTarget, options.cssClasses.vertical);
              }
              var textDirection = getComputedStyle(addTarget).direction;
              if (textDirection === "rtl") {
                  addClass(addTarget, options.cssClasses.textDirectionRtl);
              }
              else {
                  addClass(addTarget, options.cssClasses.textDirectionLtr);
              }
              return addNodeTo(addTarget, options.cssClasses.base);
          }
          function addTooltip(handle, handleNumber) {
              if (!options.tooltips || !options.tooltips[handleNumber]) {
                  return false;
              }
              return addNodeTo(handle.firstChild, options.cssClasses.tooltip);
          }
          function isSliderDisabled() {
              return scope_Target.hasAttribute("disabled");
          }
          // Disable the slider dragging if any handle is disabled
          function isHandleDisabled(handleNumber) {
              var handleOrigin = scope_Handles[handleNumber];
              return handleOrigin.hasAttribute("disabled");
          }
          function removeTooltips() {
              if (scope_Tooltips) {
                  removeEvent("update" + INTERNAL_EVENT_NS.tooltips);
                  scope_Tooltips.forEach(function (tooltip) {
                      if (tooltip) {
                          removeElement(tooltip);
                      }
                  });
                  scope_Tooltips = null;
              }
          }
          // The tooltips option is a shorthand for using the 'update' event.
          function tooltips() {
              removeTooltips();
              // Tooltips are added with options.tooltips in original order.
              scope_Tooltips = scope_Handles.map(addTooltip);
              bindEvent("update" + INTERNAL_EVENT_NS.tooltips, function (values, handleNumber, unencoded) {
                  if (!scope_Tooltips || !options.tooltips) {
                      return;
                  }
                  if (scope_Tooltips[handleNumber] === false) {
                      return;
                  }
                  var formattedValue = values[handleNumber];
                  if (options.tooltips[handleNumber] !== true) {
                      formattedValue = options.tooltips[handleNumber].to(unencoded[handleNumber]);
                  }
                  scope_Tooltips[handleNumber].innerHTML = formattedValue;
              });
          }
          function aria() {
              removeEvent("update" + INTERNAL_EVENT_NS.aria);
              bindEvent("update" + INTERNAL_EVENT_NS.aria, function (values, handleNumber, unencoded, tap, positions) {
                  // Update Aria Values for all handles, as a change in one changes min and max values for the next.
                  scope_HandleNumbers.forEach(function (index) {
                      var handle = scope_Handles[index];
                      var min = checkHandlePosition(scope_Locations, index, 0, true, true, true);
                      var max = checkHandlePosition(scope_Locations, index, 100, true, true, true);
                      var now = positions[index];
                      // Formatted value for display
                      var text = String(options.ariaFormat.to(unencoded[index]));
                      // Map to slider range values
                      min = scope_Spectrum.fromStepping(min).toFixed(1);
                      max = scope_Spectrum.fromStepping(max).toFixed(1);
                      now = scope_Spectrum.fromStepping(now).toFixed(1);
                      handle.children[0].setAttribute("aria-valuemin", min);
                      handle.children[0].setAttribute("aria-valuemax", max);
                      handle.children[0].setAttribute("aria-valuenow", now);
                      handle.children[0].setAttribute("aria-valuetext", text);
                  });
              });
          }
          function getGroup(pips) {
              // Use the range.
              if (pips.mode === exports.PipsMode.Range || pips.mode === exports.PipsMode.Steps) {
                  return scope_Spectrum.xVal;
              }
              if (pips.mode === exports.PipsMode.Count) {
                  if (pips.values < 2) {
                      throw new Error("noUiSlider: 'values' (>= 2) required for mode 'count'.");
                  }
                  // Divide 0 - 100 in 'count' parts.
                  var interval = pips.values - 1;
                  var spread = 100 / interval;
                  var values = [];
                  // List these parts and have them handled as 'positions'.
                  while (interval--) {
                      values[interval] = interval * spread;
                  }
                  values.push(100);
                  return mapToRange(values, pips.stepped);
              }
              if (pips.mode === exports.PipsMode.Positions) {
                  // Map all percentages to on-range values.
                  return mapToRange(pips.values, pips.stepped);
              }
              if (pips.mode === exports.PipsMode.Values) {
                  // If the value must be stepped, it needs to be converted to a percentage first.
                  if (pips.stepped) {
                      return pips.values.map(function (value) {
                          // Convert to percentage, apply step, return to value.
                          return scope_Spectrum.fromStepping(scope_Spectrum.getStep(scope_Spectrum.toStepping(value)));
                      });
                  }
                  // Otherwise, we can simply use the values.
                  return pips.values;
              }
              return []; // pips.mode = never
          }
          function mapToRange(values, stepped) {
              return values.map(function (value) {
                  return scope_Spectrum.fromStepping(stepped ? scope_Spectrum.getStep(value) : value);
              });
          }
          function generateSpread(pips) {
              function safeIncrement(value, increment) {
                  // Avoid floating point variance by dropping the smallest decimal places.
                  return Number((value + increment).toFixed(7));
              }
              var group = getGroup(pips);
              var indexes = {};
              var firstInRange = scope_Spectrum.xVal[0];
              var lastInRange = scope_Spectrum.xVal[scope_Spectrum.xVal.length - 1];
              var ignoreFirst = false;
              var ignoreLast = false;
              var prevPct = 0;
              // Create a copy of the group, sort it and filter away all duplicates.
              group = unique(group.slice().sort(function (a, b) {
                  return a - b;
              }));
              // Make sure the range starts with the first element.
              if (group[0] !== firstInRange) {
                  group.unshift(firstInRange);
                  ignoreFirst = true;
              }
              // Likewise for the last one.
              if (group[group.length - 1] !== lastInRange) {
                  group.push(lastInRange);
                  ignoreLast = true;
              }
              group.forEach(function (current, index) {
                  // Get the current step and the lower + upper positions.
                  var step;
                  var i;
                  var q;
                  var low = current;
                  var high = group[index + 1];
                  var newPct;
                  var pctDifference;
                  var pctPos;
                  var type;
                  var steps;
                  var realSteps;
                  var stepSize;
                  var isSteps = pips.mode === exports.PipsMode.Steps;
                  // When using 'steps' mode, use the provided steps.
                  // Otherwise, we'll step on to the next subrange.
                  if (isSteps) {
                      step = scope_Spectrum.xNumSteps[index];
                  }
                  // Default to a 'full' step.
                  if (!step) {
                      step = high - low;
                  }
                  // If high is undefined we are at the last subrange. Make sure it iterates once (#1088)
                  if (high === undefined) {
                      high = low;
                  }
                  // Make sure step isn't 0, which would cause an infinite loop (#654)
                  step = Math.max(step, 0.0000001);
                  // Find all steps in the subrange.
                  for (i = low; i <= high; i = safeIncrement(i, step)) {
                      // Get the percentage value for the current step,
                      // calculate the size for the subrange.
                      newPct = scope_Spectrum.toStepping(i);
                      pctDifference = newPct - prevPct;
                      steps = pctDifference / (pips.density || 1);
                      realSteps = Math.round(steps);
                      // This ratio represents the amount of percentage-space a point indicates.
                      // For a density 1 the points/percentage = 1. For density 2, that percentage needs to be re-divided.
                      // Round the percentage offset to an even number, then divide by two
                      // to spread the offset on both sides of the range.
                      stepSize = pctDifference / realSteps;
                      // Divide all points evenly, adding the correct number to this subrange.
                      // Run up to <= so that 100% gets a point, event if ignoreLast is set.
                      for (q = 1; q <= realSteps; q += 1) {
                          // The ratio between the rounded value and the actual size might be ~1% off.
                          // Correct the percentage offset by the number of points
                          // per subrange. density = 1 will result in 100 points on the
                          // full range, 2 for 50, 4 for 25, etc.
                          pctPos = prevPct + q * stepSize;
                          indexes[pctPos.toFixed(5)] = [scope_Spectrum.fromStepping(pctPos), 0];
                      }
                      // Determine the point type.
                      type = group.indexOf(i) > -1 ? exports.PipsType.LargeValue : isSteps ? exports.PipsType.SmallValue : exports.PipsType.NoValue;
                      // Enforce the 'ignoreFirst' option by overwriting the type for 0.
                      if (!index && ignoreFirst && i !== high) {
                          type = 0;
                      }
                      if (!(i === high && ignoreLast)) {
                          // Mark the 'type' of this point. 0 = plain, 1 = real value, 2 = step value.
                          indexes[newPct.toFixed(5)] = [i, type];
                      }
                      // Update the percentage count.
                      prevPct = newPct;
                  }
              });
              return indexes;
          }
          function addMarking(spread, filterFunc, formatter) {
              var _a, _b;
              var element = scope_Document.createElement("div");
              var valueSizeClasses = (_a = {},
                  _a[exports.PipsType.None] = "",
                  _a[exports.PipsType.NoValue] = options.cssClasses.valueNormal,
                  _a[exports.PipsType.LargeValue] = options.cssClasses.valueLarge,
                  _a[exports.PipsType.SmallValue] = options.cssClasses.valueSub,
                  _a);
              var markerSizeClasses = (_b = {},
                  _b[exports.PipsType.None] = "",
                  _b[exports.PipsType.NoValue] = options.cssClasses.markerNormal,
                  _b[exports.PipsType.LargeValue] = options.cssClasses.markerLarge,
                  _b[exports.PipsType.SmallValue] = options.cssClasses.markerSub,
                  _b);
              var valueOrientationClasses = [options.cssClasses.valueHorizontal, options.cssClasses.valueVertical];
              var markerOrientationClasses = [options.cssClasses.markerHorizontal, options.cssClasses.markerVertical];
              addClass(element, options.cssClasses.pips);
              addClass(element, options.ort === 0 ? options.cssClasses.pipsHorizontal : options.cssClasses.pipsVertical);
              function getClasses(type, source) {
                  var a = source === options.cssClasses.value;
                  var orientationClasses = a ? valueOrientationClasses : markerOrientationClasses;
                  var sizeClasses = a ? valueSizeClasses : markerSizeClasses;
                  return source + " " + orientationClasses[options.ort] + " " + sizeClasses[type];
              }
              function addSpread(offset, value, type) {
                  // Apply the filter function, if it is set.
                  type = filterFunc ? filterFunc(value, type) : type;
                  if (type === exports.PipsType.None) {
                      return;
                  }
                  // Add a marker for every point
                  var node = addNodeTo(element, false);
                  node.className = getClasses(type, options.cssClasses.marker);
                  node.style[options.style] = offset + "%";
                  // Values are only appended for points marked '1' or '2'.
                  if (type > exports.PipsType.NoValue) {
                      node = addNodeTo(element, false);
                      node.className = getClasses(type, options.cssClasses.value);
                      node.setAttribute("data-value", String(value));
                      node.style[options.style] = offset + "%";
                      node.innerHTML = String(formatter.to(value));
                  }
              }
              // Append all points.
              Object.keys(spread).forEach(function (offset) {
                  addSpread(offset, spread[offset][0], spread[offset][1]);
              });
              return element;
          }
          function removePips() {
              if (scope_Pips) {
                  removeElement(scope_Pips);
                  scope_Pips = null;
              }
          }
          function pips(pips) {
              // Fix #669
              removePips();
              var spread = generateSpread(pips);
              var filter = pips.filter;
              var format = pips.format || {
                  to: function (value) {
                      return String(Math.round(value));
                  }
              };
              scope_Pips = scope_Target.appendChild(addMarking(spread, filter, format));
              return scope_Pips;
          }
          // Shorthand for base dimensions.
          function baseSize() {
              var rect = scope_Base.getBoundingClientRect();
              var alt = ("offset" + ["Width", "Height"][options.ort]);
              return options.ort === 0 ? rect.width || scope_Base[alt] : rect.height || scope_Base[alt];
          }
          // Handler for attaching events trough a proxy.
          function attachEvent(events, element, callback, data) {
              // This function can be used to 'filter' events to the slider.
              // element is a node, not a nodeList
              var method = function (event) {
                  var e = fixEvent(event, data.pageOffset, data.target || element);
                  // fixEvent returns false if this event has a different target
                  // when handling (multi-) touch events;
                  if (!e) {
                      return false;
                  }
                  // doNotReject is passed by all end events to make sure released touches
                  // are not rejected, leaving the slider "stuck" to the cursor;
                  if (isSliderDisabled() && !data.doNotReject) {
                      return false;
                  }
                  // Stop if an active 'tap' transition is taking place.
                  if (hasClass(scope_Target, options.cssClasses.tap) && !data.doNotReject) {
                      return false;
                  }
                  // Ignore right or middle clicks on start #454
                  if (events === actions.start && e.buttons !== undefined && e.buttons > 1) {
                      return false;
                  }
                  // Ignore right or middle clicks on start #454
                  if (data.hover && e.buttons) {
                      return false;
                  }
                  // 'supportsPassive' is only true if a browser also supports touch-action: none in CSS.
                  // iOS safari does not, so it doesn't get to benefit from passive scrolling. iOS does support
                  // touch-action: manipulation, but that allows panning, which breaks
                  // sliders after zooming/on non-responsive pages.
                  // See: https://bugs.webkit.org/show_bug.cgi?id=133112
                  if (!supportsPassive) {
                      e.preventDefault();
                  }
                  e.calcPoint = e.points[options.ort];
                  // Call the event handler with the event [ and additional data ].
                  callback(e, data);
                  return;
              };
              var methods = [];
              // Bind a closure on the target for every event type.
              events.split(" ").forEach(function (eventName) {
                  element.addEventListener(eventName, method, supportsPassive ? { passive: true } : false);
                  methods.push([eventName, method]);
              });
              return methods;
          }
          // Provide a clean event with standardized offset values.
          function fixEvent(e, pageOffset, eventTarget) {
              // Filter the event to register the type, which can be
              // touch, mouse or pointer. Offset changes need to be
              // made on an event specific basis.
              var touch = e.type.indexOf("touch") === 0;
              var mouse = e.type.indexOf("mouse") === 0;
              var pointer = e.type.indexOf("pointer") === 0;
              var x = 0;
              var y = 0;
              // IE10 implemented pointer events with a prefix;
              if (e.type.indexOf("MSPointer") === 0) {
                  pointer = true;
              }
              // Erroneous events seem to be passed in occasionally on iOS/iPadOS after user finishes interacting with
              // the slider. They appear to be of type MouseEvent, yet they don't have usual properties set. Ignore
              // events that have no touches or buttons associated with them. (#1057, #1079, #1095)
              if (e.type === "mousedown" && !e.buttons && !e.touches) {
                  return false;
              }
              // The only thing one handle should be concerned about is the touches that originated on top of it.
              if (touch) {
                  // Returns true if a touch originated on the target.
                  var isTouchOnTarget = function (checkTouch) {
                      var target = checkTouch.target;
                      return (target === eventTarget ||
                          eventTarget.contains(target) ||
                          (e.composed && e.composedPath().shift() === eventTarget));
                  };
                  // In the case of touchstart events, we need to make sure there is still no more than one
                  // touch on the target so we look amongst all touches.
                  if (e.type === "touchstart") {
                      var targetTouches = Array.prototype.filter.call(e.touches, isTouchOnTarget);
                      // Do not support more than one touch per handle.
                      if (targetTouches.length > 1) {
                          return false;
                      }
                      x = targetTouches[0].pageX;
                      y = targetTouches[0].pageY;
                  }
                  else {
                      // In the other cases, find on changedTouches is enough.
                      var targetTouch = Array.prototype.find.call(e.changedTouches, isTouchOnTarget);
                      // Cancel if the target touch has not moved.
                      if (!targetTouch) {
                          return false;
                      }
                      x = targetTouch.pageX;
                      y = targetTouch.pageY;
                  }
              }
              pageOffset = pageOffset || getPageOffset(scope_Document);
              if (mouse || pointer) {
                  x = e.clientX + pageOffset.x;
                  y = e.clientY + pageOffset.y;
              }
              e.pageOffset = pageOffset;
              e.points = [x, y];
              e.cursor = mouse || pointer; // Fix #435
              return e;
          }
          // Translate a coordinate in the document to a percentage on the slider
          function calcPointToPercentage(calcPoint) {
              var location = calcPoint - offset(scope_Base, options.ort);
              var proposal = (location * 100) / baseSize();
              // Clamp proposal between 0% and 100%
              // Out-of-bound coordinates may occur when .noUi-base pseudo-elements
              // are used (e.g. contained handles feature)
              proposal = limit(proposal);
              return options.dir ? 100 - proposal : proposal;
          }
          // Find handle closest to a certain percentage on the slider
          function getClosestHandle(clickedPosition) {
              var smallestDifference = 100;
              var handleNumber = false;
              scope_Handles.forEach(function (handle, index) {
                  // Disabled handles are ignored
                  if (isHandleDisabled(index)) {
                      return;
                  }
                  var handlePosition = scope_Locations[index];
                  var differenceWithThisHandle = Math.abs(handlePosition - clickedPosition);
                  // Initial state
                  var clickAtEdge = differenceWithThisHandle === 100 && smallestDifference === 100;
                  // Difference with this handle is smaller than the previously checked handle
                  var isCloser = differenceWithThisHandle < smallestDifference;
                  var isCloserAfter = differenceWithThisHandle <= smallestDifference && clickedPosition > handlePosition;
                  if (isCloser || isCloserAfter || clickAtEdge) {
                      handleNumber = index;
                      smallestDifference = differenceWithThisHandle;
                  }
              });
              return handleNumber;
          }
          // Fire 'end' when a mouse or pen leaves the document.
          function documentLeave(event, data) {
              if (event.type === "mouseout" &&
                  event.target.nodeName === "HTML" &&
                  event.relatedTarget === null) {
                  eventEnd(event, data);
              }
          }
          // Handle movement on document for handle and range drag.
          function eventMove(event, data) {
              // Fix #498
              // Check value of .buttons in 'start' to work around a bug in IE10 mobile (data.buttonsProperty).
              // https://connect.microsoft.com/IE/feedback/details/927005/mobile-ie10-windows-phone-buttons-property-of-pointermove-event-always-zero
              // IE9 has .buttons and .which zero on mousemove.
              // Firefox breaks the spec MDN defines.
              if (navigator.appVersion.indexOf("MSIE 9") === -1 && event.buttons === 0 && data.buttonsProperty !== 0) {
                  return eventEnd(event, data);
              }
              // Check if we are moving up or down
              var movement = (options.dir ? -1 : 1) * (event.calcPoint - data.startCalcPoint);
              // Convert the movement into a percentage of the slider width/height
              var proposal = (movement * 100) / data.baseSize;
              moveHandles(movement > 0, proposal, data.locations, data.handleNumbers, data.connect);
          }
          // Unbind move events on document, call callbacks.
          function eventEnd(event, data) {
              // The handle is no longer active, so remove the class.
              if (data.handle) {
                  removeClass(data.handle, options.cssClasses.active);
                  scope_ActiveHandlesCount -= 1;
              }
              // Unbind the move and end events, which are added on 'start'.
              data.listeners.forEach(function (c) {
                  scope_DocumentElement.removeEventListener(c[0], c[1]);
              });
              if (scope_ActiveHandlesCount === 0) {
                  // Remove dragging class.
                  removeClass(scope_Target, options.cssClasses.drag);
                  setZindex();
                  // Remove cursor styles and text-selection events bound to the body.
                  if (event.cursor) {
                      scope_Body.style.cursor = "";
                      scope_Body.removeEventListener("selectstart", preventDefault);
                  }
              }
              data.handleNumbers.forEach(function (handleNumber) {
                  fireEvent("change", handleNumber);
                  fireEvent("set", handleNumber);
                  fireEvent("end", handleNumber);
              });
          }
          // Bind move events on document.
          function eventStart(event, data) {
              // Ignore event if any handle is disabled
              if (data.handleNumbers.some(isHandleDisabled)) {
                  return;
              }
              var handle;
              if (data.handleNumbers.length === 1) {
                  var handleOrigin = scope_Handles[data.handleNumbers[0]];
                  handle = handleOrigin.children[0];
                  scope_ActiveHandlesCount += 1;
                  // Mark the handle as 'active' so it can be styled.
                  addClass(handle, options.cssClasses.active);
              }
              // A drag should never propagate up to the 'tap' event.
              event.stopPropagation();
              // Record the event listeners.
              var listeners = [];
              // Attach the move and end events.
              var moveEvent = attachEvent(actions.move, scope_DocumentElement, eventMove, {
                  // The event target has changed so we need to propagate the original one so that we keep
                  // relying on it to extract target touches.
                  target: event.target,
                  handle: handle,
                  connect: data.connect,
                  listeners: listeners,
                  startCalcPoint: event.calcPoint,
                  baseSize: baseSize(),
                  pageOffset: event.pageOffset,
                  handleNumbers: data.handleNumbers,
                  buttonsProperty: event.buttons,
                  locations: scope_Locations.slice()
              });
              var endEvent = attachEvent(actions.end, scope_DocumentElement, eventEnd, {
                  target: event.target,
                  handle: handle,
                  listeners: listeners,
                  doNotReject: true,
                  handleNumbers: data.handleNumbers
              });
              var outEvent = attachEvent("mouseout", scope_DocumentElement, documentLeave, {
                  target: event.target,
                  handle: handle,
                  listeners: listeners,
                  doNotReject: true,
                  handleNumbers: data.handleNumbers
              });
              // We want to make sure we pushed the listeners in the listener list rather than creating
              // a new one as it has already been passed to the event handlers.
              listeners.push.apply(listeners, moveEvent.concat(endEvent, outEvent));
              // Text selection isn't an issue on touch devices,
              // so adding cursor styles can be skipped.
              if (event.cursor) {
                  // Prevent the 'I' cursor and extend the range-drag cursor.
                  scope_Body.style.cursor = getComputedStyle(event.target).cursor;
                  // Mark the target with a dragging state.
                  if (scope_Handles.length > 1) {
                      addClass(scope_Target, options.cssClasses.drag);
                  }
                  // Prevent text selection when dragging the handles.
                  // In noUiSlider <= 9.2.0, this was handled by calling preventDefault on mouse/touch start/move,
                  // which is scroll blocking. The selectstart event is supported by FireFox starting from version 52,
                  // meaning the only holdout is iOS Safari. This doesn't matter: text selection isn't triggered there.
                  // The 'cursor' flag is false.
                  // See: http://caniuse.com/#search=selectstart
                  scope_Body.addEventListener("selectstart", preventDefault, false);
              }
              data.handleNumbers.forEach(function (handleNumber) {
                  fireEvent("start", handleNumber);
              });
          }
          // Move closest handle to tapped location.
          function eventTap(event) {
              // The tap event shouldn't propagate up
              event.stopPropagation();
              var proposal = calcPointToPercentage(event.calcPoint);
              var handleNumber = getClosestHandle(proposal);
              // Tackle the case that all handles are 'disabled'.
              if (handleNumber === false) {
                  return;
              }
              // Flag the slider as it is now in a transitional state.
              // Transition takes a configurable amount of ms (default 300). Re-enable the slider after that.
              if (!options.events.snap) {
                  addClassFor(scope_Target, options.cssClasses.tap, options.animationDuration);
              }
              setHandle(handleNumber, proposal, true, true);
              setZindex();
              fireEvent("slide", handleNumber, true);
              fireEvent("update", handleNumber, true);
              if (!options.events.snap) {
                  fireEvent("change", handleNumber, true);
                  fireEvent("set", handleNumber, true);
              }
              else {
                  eventStart(event, { handleNumbers: [handleNumber] });
              }
          }
          // Fires a 'hover' event for a hovered mouse/pen position.
          function eventHover(event) {
              var proposal = calcPointToPercentage(event.calcPoint);
              var to = scope_Spectrum.getStep(proposal);
              var value = scope_Spectrum.fromStepping(to);
              Object.keys(scope_Events).forEach(function (targetEvent) {
                  if ("hover" === targetEvent.split(".")[0]) {
                      scope_Events[targetEvent].forEach(function (callback) {
                          callback.call(scope_Self, value);
                      });
                  }
              });
          }
          // Handles keydown on focused handles
          // Don't move the document when pressing arrow keys on focused handles
          function eventKeydown(event, handleNumber) {
              if (isSliderDisabled() || isHandleDisabled(handleNumber)) {
                  return false;
              }
              var horizontalKeys = ["Left", "Right"];
              var verticalKeys = ["Down", "Up"];
              var largeStepKeys = ["PageDown", "PageUp"];
              var edgeKeys = ["Home", "End"];
              if (options.dir && !options.ort) {
                  // On an right-to-left slider, the left and right keys act inverted
                  horizontalKeys.reverse();
              }
              else if (options.ort && !options.dir) {
                  // On a top-to-bottom slider, the up and down keys act inverted
                  verticalKeys.reverse();
                  largeStepKeys.reverse();
              }
              // Strip "Arrow" for IE compatibility. https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key
              var key = event.key.replace("Arrow", "");
              var isLargeDown = key === largeStepKeys[0];
              var isLargeUp = key === largeStepKeys[1];
              var isDown = key === verticalKeys[0] || key === horizontalKeys[0] || isLargeDown;
              var isUp = key === verticalKeys[1] || key === horizontalKeys[1] || isLargeUp;
              var isMin = key === edgeKeys[0];
              var isMax = key === edgeKeys[1];
              if (!isDown && !isUp && !isMin && !isMax) {
                  return true;
              }
              event.preventDefault();
              var to;
              if (isUp || isDown) {
                  var direction = isDown ? 0 : 1;
                  var steps = getNextStepsForHandle(handleNumber);
                  var step = steps[direction];
                  // At the edge of a slider, do nothing
                  if (step === null) {
                      return false;
                  }
                  // No step set, use the default of 10% of the sub-range
                  if (step === false) {
                      step = scope_Spectrum.getDefaultStep(scope_Locations[handleNumber], isDown, options.keyboardDefaultStep);
                  }
                  if (isLargeUp || isLargeDown) {
                      step *= options.keyboardPageMultiplier;
                  }
                  else {
                      step *= options.keyboardMultiplier;
                  }
                  // Step over zero-length ranges (#948);
                  step = Math.max(step, 0.0000001);
                  // Decrement for down steps
                  step = (isDown ? -1 : 1) * step;
                  to = scope_Values[handleNumber] + step;
              }
              else if (isMax) {
                  // End key
                  to = options.spectrum.xVal[options.spectrum.xVal.length - 1];
              }
              else {
                  // Home key
                  to = options.spectrum.xVal[0];
              }
              setHandle(handleNumber, scope_Spectrum.toStepping(to), true, true);
              fireEvent("slide", handleNumber);
              fireEvent("update", handleNumber);
              fireEvent("change", handleNumber);
              fireEvent("set", handleNumber);
              return false;
          }
          // Attach events to several slider parts.
          function bindSliderEvents(behaviour) {
              // Attach the standard drag event to the handles.
              if (!behaviour.fixed) {
                  scope_Handles.forEach(function (handle, index) {
                      // These events are only bound to the visual handle
                      // element, not the 'real' origin element.
                      attachEvent(actions.start, handle.children[0], eventStart, {
                          handleNumbers: [index]
                      });
                  });
              }
              // Attach the tap event to the slider base.
              if (behaviour.tap) {
                  attachEvent(actions.start, scope_Base, eventTap, {});
              }
              // Fire hover events
              if (behaviour.hover) {
                  attachEvent(actions.move, scope_Base, eventHover, {
                      hover: true
                  });
              }
              // Make the range draggable.
              if (behaviour.drag) {
                  scope_Connects.forEach(function (connect, index) {
                      if (connect === false || index === 0 || index === scope_Connects.length - 1) {
                          return;
                      }
                      var handleBefore = scope_Handles[index - 1];
                      var handleAfter = scope_Handles[index];
                      var eventHolders = [connect];
                      var handlesToDrag = [handleBefore, handleAfter];
                      var handleNumbersToDrag = [index - 1, index];
                      addClass(connect, options.cssClasses.draggable);
                      // When the range is fixed, the entire range can
                      // be dragged by the handles. The handle in the first
                      // origin will propagate the start event upward,
                      // but it needs to be bound manually on the other.
                      if (behaviour.fixed) {
                          eventHolders.push(handleBefore.children[0]);
                          eventHolders.push(handleAfter.children[0]);
                      }
                      if (behaviour.dragAll) {
                          handlesToDrag = scope_Handles;
                          handleNumbersToDrag = scope_HandleNumbers;
                      }
                      eventHolders.forEach(function (eventHolder) {
                          attachEvent(actions.start, eventHolder, eventStart, {
                              handles: handlesToDrag,
                              handleNumbers: handleNumbersToDrag,
                              connect: connect
                          });
                      });
                  });
              }
          }
          // Attach an event to this slider, possibly including a namespace
          function bindEvent(namespacedEvent, callback) {
              scope_Events[namespacedEvent] = scope_Events[namespacedEvent] || [];
              scope_Events[namespacedEvent].push(callback);
              // If the event bound is 'update,' fire it immediately for all handles.
              if (namespacedEvent.split(".")[0] === "update") {
                  scope_Handles.forEach(function (a, index) {
                      fireEvent("update", index);
                  });
              }
          }
          function isInternalNamespace(namespace) {
              return namespace === INTERNAL_EVENT_NS.aria || namespace === INTERNAL_EVENT_NS.tooltips;
          }
          // Undo attachment of event
          function removeEvent(namespacedEvent) {
              var event = namespacedEvent && namespacedEvent.split(".")[0];
              var namespace = event ? namespacedEvent.substring(event.length) : namespacedEvent;
              Object.keys(scope_Events).forEach(function (bind) {
                  var tEvent = bind.split(".")[0];
                  var tNamespace = bind.substring(tEvent.length);
                  if ((!event || event === tEvent) && (!namespace || namespace === tNamespace)) {
                      // only delete protected internal event if intentional
                      if (!isInternalNamespace(tNamespace) || namespace === tNamespace) {
                          delete scope_Events[bind];
                      }
                  }
              });
          }
          // External event handling
          function fireEvent(eventName, handleNumber, tap) {
              Object.keys(scope_Events).forEach(function (targetEvent) {
                  var eventType = targetEvent.split(".")[0];
                  if (eventName === eventType) {
                      scope_Events[targetEvent].forEach(function (callback) {
                          callback.call(
                          // Use the slider public API as the scope ('this')
                          scope_Self, 
                          // Return values as array, so arg_1[arg_2] is always valid.
                          scope_Values.map(options.format.to), 
                          // Handle index, 0 or 1
                          handleNumber, 
                          // Un-formatted slider values
                          scope_Values.slice(), 
                          // Event is fired by tap, true or false
                          tap || false, 
                          // Left offset of the handle, in relation to the slider
                          scope_Locations.slice(), 
                          // add the slider public API to an accessible parameter when this is unavailable
                          scope_Self);
                      });
                  }
              });
          }
          // Split out the handle positioning logic so the Move event can use it, too
          function checkHandlePosition(reference, handleNumber, to, lookBackward, lookForward, getValue) {
              var distance;
              // For sliders with multiple handles, limit movement to the other handle.
              // Apply the margin option by adding it to the handle positions.
              if (scope_Handles.length > 1 && !options.events.unconstrained) {
                  if (lookBackward && handleNumber > 0) {
                      distance = scope_Spectrum.getAbsoluteDistance(reference[handleNumber - 1], options.margin, false);
                      to = Math.max(to, distance);
                  }
                  if (lookForward && handleNumber < scope_Handles.length - 1) {
                      distance = scope_Spectrum.getAbsoluteDistance(reference[handleNumber + 1], options.margin, true);
                      to = Math.min(to, distance);
                  }
              }
              // The limit option has the opposite effect, limiting handles to a
              // maximum distance from another. Limit must be > 0, as otherwise
              // handles would be unmovable.
              if (scope_Handles.length > 1 && options.limit) {
                  if (lookBackward && handleNumber > 0) {
                      distance = scope_Spectrum.getAbsoluteDistance(reference[handleNumber - 1], options.limit, false);
                      to = Math.min(to, distance);
                  }
                  if (lookForward && handleNumber < scope_Handles.length - 1) {
                      distance = scope_Spectrum.getAbsoluteDistance(reference[handleNumber + 1], options.limit, true);
                      to = Math.max(to, distance);
                  }
              }
              // The padding option keeps the handles a certain distance from the
              // edges of the slider. Padding must be > 0.
              if (options.padding) {
                  if (handleNumber === 0) {
                      distance = scope_Spectrum.getAbsoluteDistance(0, options.padding[0], false);
                      to = Math.max(to, distance);
                  }
                  if (handleNumber === scope_Handles.length - 1) {
                      distance = scope_Spectrum.getAbsoluteDistance(100, options.padding[1], true);
                      to = Math.min(to, distance);
                  }
              }
              to = scope_Spectrum.getStep(to);
              // Limit percentage to the 0 - 100 range
              to = limit(to);
              // Return false if handle can't move
              if (to === reference[handleNumber] && !getValue) {
                  return false;
              }
              return to;
          }
          // Uses slider orientation to create CSS rules. a = base value;
          function inRuleOrder(v, a) {
              var o = options.ort;
              return (o ? a : v) + ", " + (o ? v : a);
          }
          // Moves handle(s) by a percentage
          // (bool, % to move, [% where handle started, ...], [index in scope_Handles, ...])
          function moveHandles(upward, proposal, locations, handleNumbers, connect) {
              var proposals = locations.slice();
              // Store first handle now, so we still have it in case handleNumbers is reversed
              var firstHandle = handleNumbers[0];
              var b = [!upward, upward];
              var f = [upward, !upward];
              // Copy handleNumbers so we don't change the dataset
              handleNumbers = handleNumbers.slice();
              // Check to see which handle is 'leading'.
              // If that one can't move the second can't either.
              if (upward) {
                  handleNumbers.reverse();
              }
              // Step 1: get the maximum percentage that any of the handles can move
              if (handleNumbers.length > 1) {
                  handleNumbers.forEach(function (handleNumber, o) {
                      var to = checkHandlePosition(proposals, handleNumber, proposals[handleNumber] + proposal, b[o], f[o], false);
                      // Stop if one of the handles can't move.
                      if (to === false) {
                          proposal = 0;
                      }
                      else {
                          proposal = to - proposals[handleNumber];
                          proposals[handleNumber] = to;
                      }
                  });
              }
              // If using one handle, check backward AND forward
              else {
                  b = f = [true];
              }
              var state = false;
              // Step 2: Try to set the handles with the found percentage
              handleNumbers.forEach(function (handleNumber, o) {
                  state = setHandle(handleNumber, locations[handleNumber] + proposal, b[o], f[o]) || state;
              });
              // Step 3: If a handle moved, fire events
              if (state) {
                  handleNumbers.forEach(function (handleNumber) {
                      fireEvent("update", handleNumber);
                      fireEvent("slide", handleNumber);
                  });
                  // If target is a connect, then fire drag event
                  if (connect != undefined) {
                      fireEvent("drag", firstHandle);
                  }
              }
          }
          // Takes a base value and an offset. This offset is used for the connect bar size.
          // In the initial design for this feature, the origin element was 1% wide.
          // Unfortunately, a rounding bug in Chrome makes it impossible to implement this feature
          // in this manner: https://bugs.chromium.org/p/chromium/issues/detail?id=798223
          function transformDirection(a, b) {
              return options.dir ? 100 - a - b : a;
          }
          // Updates scope_Locations and scope_Values, updates visual state
          function updateHandlePosition(handleNumber, to) {
              // Update locations.
              scope_Locations[handleNumber] = to;
              // Convert the value to the slider stepping/range.
              scope_Values[handleNumber] = scope_Spectrum.fromStepping(to);
              var translation = 10 * (transformDirection(to, 0) - scope_DirOffset);
              var translateRule = "translate(" + inRuleOrder(translation + "%", "0") + ")";
              scope_Handles[handleNumber].style[options.transformRule] = translateRule;
              updateConnect(handleNumber);
              updateConnect(handleNumber + 1);
          }
          // Handles before the slider middle are stacked later = higher,
          // Handles after the middle later is lower
          // [[7] [8] .......... | .......... [5] [4]
          function setZindex() {
              scope_HandleNumbers.forEach(function (handleNumber) {
                  var dir = scope_Locations[handleNumber] > 50 ? -1 : 1;
                  var zIndex = 3 + (scope_Handles.length + dir * handleNumber);
                  scope_Handles[handleNumber].style.zIndex = String(zIndex);
              });
          }
          // Test suggested values and apply margin, step.
          // if exactInput is true, don't run checkHandlePosition, then the handle can be placed in between steps (#436)
          function setHandle(handleNumber, to, lookBackward, lookForward, exactInput) {
              if (!exactInput) {
                  to = checkHandlePosition(scope_Locations, handleNumber, to, lookBackward, lookForward, false);
              }
              if (to === false) {
                  return false;
              }
              updateHandlePosition(handleNumber, to);
              return true;
          }
          // Updates style attribute for connect nodes
          function updateConnect(index) {
              // Skip connects set to false
              if (!scope_Connects[index]) {
                  return;
              }
              var l = 0;
              var h = 100;
              if (index !== 0) {
                  l = scope_Locations[index - 1];
              }
              if (index !== scope_Connects.length - 1) {
                  h = scope_Locations[index];
              }
              // We use two rules:
              // 'translate' to change the left/top offset;
              // 'scale' to change the width of the element;
              // As the element has a width of 100%, a translation of 100% is equal to 100% of the parent (.noUi-base)
              var connectWidth = h - l;
              var translateRule = "translate(" + inRuleOrder(transformDirection(l, connectWidth) + "%", "0") + ")";
              var scaleRule = "scale(" + inRuleOrder(connectWidth / 100, "1") + ")";
              scope_Connects[index].style[options.transformRule] =
                  translateRule + " " + scaleRule;
          }
          // Parses value passed to .set method. Returns current value if not parse-able.
          function resolveToValue(to, handleNumber) {
              // Setting with null indicates an 'ignore'.
              // Inputting 'false' is invalid.
              if (to === null || to === false || to === undefined) {
                  return scope_Locations[handleNumber];
              }
              // If a formatted number was passed, attempt to decode it.
              if (typeof to === "number") {
                  to = String(to);
              }
              to = options.format.from(to);
              if (to !== false) {
                  to = scope_Spectrum.toStepping(to);
              }
              // If parsing the number failed, use the current value.
              if (to === false || isNaN(to)) {
                  return scope_Locations[handleNumber];
              }
              return to;
          }
          // Set the slider value.
          function valueSet(input, fireSetEvent, exactInput) {
              var values = asArray(input);
              var isInit = scope_Locations[0] === undefined;
              // Event fires by default
              fireSetEvent = fireSetEvent === undefined ? true : fireSetEvent;
              // Animation is optional.
              // Make sure the initial values were set before using animated placement.
              if (options.animate && !isInit) {
                  addClassFor(scope_Target, options.cssClasses.tap, options.animationDuration);
              }
              // First pass, without lookAhead but with lookBackward. Values are set from left to right.
              scope_HandleNumbers.forEach(function (handleNumber) {
                  setHandle(handleNumber, resolveToValue(values[handleNumber], handleNumber), true, false, exactInput);
              });
              var i = scope_HandleNumbers.length === 1 ? 0 : 1;
              // Spread handles evenly across the slider if the range has no size (min=max)
              if (isInit && scope_Spectrum.hasNoSize()) {
                  exactInput = true;
                  scope_Locations[0] = 0;
                  if (scope_HandleNumbers.length > 1) {
                      var space_1 = 100 / (scope_HandleNumbers.length - 1);
                      scope_HandleNumbers.forEach(function (handleNumber) {
                          scope_Locations[handleNumber] = handleNumber * space_1;
                      });
                  }
              }
              // Secondary passes. Now that all base values are set, apply constraints.
              // Iterate all handles to ensure constraints are applied for the entire slider (Issue #1009)
              for (; i < scope_HandleNumbers.length; ++i) {
                  scope_HandleNumbers.forEach(function (handleNumber) {
                      setHandle(handleNumber, scope_Locations[handleNumber], true, true, exactInput);
                  });
              }
              setZindex();
              scope_HandleNumbers.forEach(function (handleNumber) {
                  fireEvent("update", handleNumber);
                  // Fire the event only for handles that received a new value, as per #579
                  if (values[handleNumber] !== null && fireSetEvent) {
                      fireEvent("set", handleNumber);
                  }
              });
          }
          // Reset slider to initial values
          function valueReset(fireSetEvent) {
              valueSet(options.start, fireSetEvent);
          }
          // Set value for a single handle
          function valueSetHandle(handleNumber, value, fireSetEvent, exactInput) {
              // Ensure numeric input
              handleNumber = Number(handleNumber);
              if (!(handleNumber >= 0 && handleNumber < scope_HandleNumbers.length)) {
                  throw new Error("noUiSlider: invalid handle number, got: " + handleNumber);
              }
              // Look both backward and forward, since we don't want this handle to "push" other handles (#960);
              // The exactInput argument can be used to ignore slider stepping (#436)
              setHandle(handleNumber, resolveToValue(value, handleNumber), true, true, exactInput);
              fireEvent("update", handleNumber);
              if (fireSetEvent) {
                  fireEvent("set", handleNumber);
              }
          }
          // Get the slider value.
          function valueGet(unencoded) {
              if (unencoded === void 0) { unencoded = false; }
              if (unencoded) {
                  // return a copy of the raw values
                  return scope_Values.length === 1 ? scope_Values[0] : scope_Values.slice(0);
              }
              var values = scope_Values.map(options.format.to);
              // If only one handle is used, return a single value.
              if (values.length === 1) {
                  return values[0];
              }
              return values;
          }
          // Removes classes from the root and empties it.
          function destroy() {
              // remove protected internal listeners
              removeEvent(INTERNAL_EVENT_NS.aria);
              removeEvent(INTERNAL_EVENT_NS.tooltips);
              Object.keys(options.cssClasses).forEach(function (key) {
                  removeClass(scope_Target, options.cssClasses[key]);
              });
              while (scope_Target.firstChild) {
                  scope_Target.removeChild(scope_Target.firstChild);
              }
              delete scope_Target.noUiSlider;
          }
          function getNextStepsForHandle(handleNumber) {
              var location = scope_Locations[handleNumber];
              var nearbySteps = scope_Spectrum.getNearbySteps(location);
              var value = scope_Values[handleNumber];
              var increment = nearbySteps.thisStep.step;
              var decrement = null;
              // If snapped, directly use defined step value
              if (options.snap) {
                  return [
                      value - nearbySteps.stepBefore.startValue || null,
                      nearbySteps.stepAfter.startValue - value || null
                  ];
              }
              // If the next value in this step moves into the next step,
              // the increment is the start of the next step - the current value
              if (increment !== false) {
                  if (value + increment > nearbySteps.stepAfter.startValue) {
                      increment = nearbySteps.stepAfter.startValue - value;
                  }
              }
              // If the value is beyond the starting point
              if (value > nearbySteps.thisStep.startValue) {
                  decrement = nearbySteps.thisStep.step;
              }
              else if (nearbySteps.stepBefore.step === false) {
                  decrement = false;
              }
              // If a handle is at the start of a step, it always steps back into the previous step first
              else {
                  decrement = value - nearbySteps.stepBefore.highestStep;
              }
              // Now, if at the slider edges, there is no in/decrement
              if (location === 100) {
                  increment = null;
              }
              else if (location === 0) {
                  decrement = null;
              }
              // As per #391, the comparison for the decrement step can have some rounding issues.
              var stepDecimals = scope_Spectrum.countStepDecimals();
              // Round per #391
              if (increment !== null && increment !== false) {
                  increment = Number(increment.toFixed(stepDecimals));
              }
              if (decrement !== null && decrement !== false) {
                  decrement = Number(decrement.toFixed(stepDecimals));
              }
              return [decrement, increment];
          }
          // Get the current step size for the slider.
          function getNextSteps() {
              return scope_HandleNumbers.map(getNextStepsForHandle);
          }
          // Updatable: margin, limit, padding, step, range, animate, snap
          function updateOptions(optionsToUpdate, fireSetEvent) {
              // Spectrum is created using the range, snap, direction and step options.
              // 'snap' and 'step' can be updated.
              // If 'snap' and 'step' are not passed, they should remain unchanged.
              var v = valueGet();
              var updateAble = [
                  "margin",
                  "limit",
                  "padding",
                  "range",
                  "animate",
                  "snap",
                  "step",
                  "format",
                  "pips",
                  "tooltips"
              ];
              // Only change options that we're actually passed to update.
              updateAble.forEach(function (name) {
                  // Check for undefined. null removes the value.
                  if (optionsToUpdate[name] !== undefined) {
                      originalOptions[name] = optionsToUpdate[name];
                  }
              });
              var newOptions = testOptions(originalOptions);
              // Load new options into the slider state
              updateAble.forEach(function (name) {
                  if (optionsToUpdate[name] !== undefined) {
                      options[name] = newOptions[name];
                  }
              });
              scope_Spectrum = newOptions.spectrum;
              // Limit, margin and padding depend on the spectrum but are stored outside of it. (#677)
              options.margin = newOptions.margin;
              options.limit = newOptions.limit;
              options.padding = newOptions.padding;
              // Update pips, removes existing.
              if (options.pips) {
                  pips(options.pips);
              }
              else {
                  removePips();
              }
              // Update tooltips, removes existing.
              if (options.tooltips) {
                  tooltips();
              }
              else {
                  removeTooltips();
              }
              // Invalidate the current positioning so valueSet forces an update.
              scope_Locations = [];
              valueSet(isSet(optionsToUpdate.start) ? optionsToUpdate.start : v, fireSetEvent);
          }
          // Initialization steps
          function setupSlider() {
              // Create the base element, initialize HTML and set classes.
              // Add handles and connect elements.
              scope_Base = addSlider(scope_Target);
              addElements(options.connect, scope_Base);
              // Attach user events.
              bindSliderEvents(options.events);
              // Use the public value method to set the start values.
              valueSet(options.start);
              if (options.pips) {
                  pips(options.pips);
              }
              if (options.tooltips) {
                  tooltips();
              }
              aria();
          }
          setupSlider();
          var scope_Self = {
              destroy: destroy,
              steps: getNextSteps,
              on: bindEvent,
              off: removeEvent,
              get: valueGet,
              set: valueSet,
              setHandle: valueSetHandle,
              reset: valueReset,
              // Exposed for unit testing, don't use this in your application.
              __moveHandles: function (upward, proposal, handleNumbers) {
                  moveHandles(upward, proposal, scope_Locations, handleNumbers);
              },
              options: originalOptions,
              updateOptions: updateOptions,
              target: scope_Target,
              removePips: removePips,
              removeTooltips: removeTooltips,
              getPositions: function () {
                  return scope_Locations.slice();
              },
              getTooltips: function () {
                  return scope_Tooltips;
              },
              getOrigins: function () {
                  return scope_Handles;
              },
              pips: pips // Issue #594
          };
          return scope_Self;
      }
      // Run the standard initializer
      function initialize(target, originalOptions) {
          if (!target || !target.nodeName) {
              throw new Error("noUiSlider: create requires a single element, got: " + target);
          }
          // Throw an error if the slider was already initialized.
          if (target.noUiSlider) {
              throw new Error("noUiSlider: Slider was already initialized.");
          }
          // Test the options and create the slider environment;
          var options = testOptions(originalOptions);
          var api = scope(target, options, originalOptions);
          target.noUiSlider = api;
          return api;
      }
      var nouislider = {
          // Exposed for unit testing, don't use this in your application.
          __spectrum: Spectrum,
          // A reference to the default classes, allows global changes.
          // Use the cssClasses option for changes to one slider.
          cssClasses: cssClasses,
          create: initialize
      };

      exports.create = initialize;
      exports.cssClasses = cssClasses;
      exports['default'] = nouislider;

      Object.defineProperty(exports, '__esModule', { value: true });

  })));
  }(nouislider, nouislider.exports));

  var noUiSlider = /*@__PURE__*/getDefaultExportFromCjs(nouislider.exports);

  const priceRange = container => {
    const inputs = t$3('input', container);
    const minInput = inputs[0];
    const maxInput = inputs[1];
    const events = [e$2(inputs, 'change', onRangeChange)];
    const slider = n$1('[data-range-slider]');
    noUiSlider.create(slider, {
      start: [minInput.value ? minInput.value : minInput.getAttribute('min'), maxInput.value ? maxInput.value : maxInput.getAttribute('max')],
      connect: true,
      range: {
        'min': parseInt(minInput.getAttribute('min')),
        'max': parseInt(maxInput.getAttribute('max'))
      }
    });
    slider.noUiSlider.on('set', e => {
      let max, min;
      [min, max] = e;
      minInput.value = Math.floor(min);
      maxInput.value = Math.floor(max);
      fireChangeEvent();
      setMinAndMaxValues();
    });
    setMinAndMaxValues();

    function setMinAndMaxValues() {
      if (maxInput.value) minInput.setAttribute('max', maxInput.value);
      if (minInput.value) maxInput.setAttribute('min', minInput.value);
      if (minInput.value === '') maxInput.setAttribute('min', 0);
      if (maxInput.value === '') minInput.setAttribute('max', maxInput.getAttribute('max'));
    }

    function adjustToValidValues(input) {
      const value = Number(input.value);
      const min = Number(input.getAttribute('min'));
      const max = Number(input.getAttribute('max'));
      if (value < min) input.value = min;
      if (value > max) input.value = max;
    }

    function fireChangeEvent() {
      minInput.dispatchEvent(new Event('change', {
        bubbles: true
      }));
      maxInput.dispatchEvent(new Event('change', {
        bubbles: true
      }));
    }

    function onRangeChange(event) {
      adjustToValidValues(event.currentTarget);
      setMinAndMaxValues();
      if (minInput.value === '' && maxInput.value === '') return;
      let currentMax, currentMin;
      [currentMin, currentMax] = slider.noUiSlider.get();
      currentMin = Math.floor(currentMin);
      currentMax = Math.floor(currentMax);
      if (currentMin !== Math.floor(minInput.value)) slider.noUiSlider.set([minInput.value, null]);
      if (currentMax !== Math.floor(maxInput.value)) slider.noUiSlider.set([null, maxInput.value]);
    }

    function validateRange() {
      inputs.forEach(input => setMinAndMaxValues());
    }

    const reset = () => {
      slider.noUiSlider.set([minInput.getAttribute('min'), maxInput.getAttribute('max')]);
      minInput.value = '';
      maxInput.value = '';
      fireChangeEvent();
      setMinAndMaxValues();
    };

    const unload = () => {
      events.forEach(unsubscribe => unsubscribe());
    };

    return {
      unload,
      reset,
      validateRange
    };
  };

  const sel = {
    filter: '[data-filter]',
    filterTarget: '[data-filter-target]',
    flyouts: '[data-filter-modal]',
    button: '[data-button]',
    wash: '[data-drawer-wash]',
    sort: '[data-sort]',
    close: '[data-close-icon]',
    group: '.filter-drawer__group',
    panel: '.filter-drawer__panel',
    flyoutWrapper: '[data-filer-modal-wrapper]',
    priceRange: '[data-price-range]'
  };
  const classes = {
    active: 'active',
    activeFilters: 'active-filters',
    fixed: 'is-fixed'
  };

  const filterDrawer = node => {
    const flyouts = t$3(sel.flyouts, node);
    const flyoutContainer = n$1(sel.flyoutWrapper, node);
    const wash = n$1(sel.wash, node);
    const filters = t$3(sel.filter, node);
    const sortMethods = t$3(`[data-filter-modal="__sort"] ${sel.sort}`);
    const mobiletrigger = n$1('[data-mobile-trigger]', node);
    const mobileFilters = n$1('[data-mobile-filters]', node);
    const rangeInputs = t$3('[data-range-input]', node);
    let focusTrap = null;
    let range = null;
    const rangeContainer = n$1(sel.priceRange, node);

    if (rangeContainer) {
      range = priceRange(rangeContainer);
    }

    const events = [e$2(t$3(sel.filterTarget, node), 'click', clickFlyoutTrigger), e$2(filters, 'click', clickFilter), e$2(sortMethods, 'click', clickSort), e$2(wash, 'click', clickWash), e$2(t$3(sel.button, node), 'click', clickButton), e$2(t$3(sel.close, node), 'click', clickWash), e$2(node, 'keydown', ({
      keyCode
    }) => {
      if (keyCode === 27) clickWash();
    }), e$2(mobiletrigger, 'click', () => {
      mobileFilters.style.setProperty('--mobile-filters-offset', `${mobileFilters.clientHeight - 20}px`);
      l(mobileFilters, classes.active);
    }), e$2(rangeInputs, 'change', rangeChanged)];
    setActiveStates();

    function setActiveStates() {
      const panels = t$3(sel.panel, node);
      panels.forEach(panel => {
        const groups = t$3(sel.group, panel);

        if (groups.length) {
          groups.forEach(group => {
            if (containsCheckedInputs(t$3('input', group))) {
              u(group, classes.activeFilters);
            }
          });
        }

        l(panel, classes.activeFilters, containsCheckedInputs(t$3('input', panel)));
      });
    }

    function clickFlyoutTrigger(e) {
      e.preventDefault();
      const {
        filterTarget
      } = e.currentTarget.dataset;
      const modal = n$1(`[data-filter-modal="${filterTarget}"]`, node);
      focusTrap = createFocusTrap(modal, {
        allowOutsideClick: true
      });
      u(flyoutContainer, classes.fixed);
      setTimeout(() => {
        u(flyoutContainer, classes.active);
        u(modal, classes.active);
      }, 50);
      modal.setAttribute('aria-hidden', 'false');
      focusTrap.activate();
      disableBodyScroll(node, {
        allowTouchMove: el => {
          while (el && el !== document.body) {
            if (el.getAttribute('data-scroll-lock-ignore') !== null) {
              return true;
            }

            el = el.parentNode;
          }
        },
        reserveScrollBarGap: true
      });
    }

    function clickWash(e) {
      e && e.preventDefault();
      focusTrap && focusTrap.deactivate();
      i(flyouts, classes.active);
      i(flyoutContainer, classes.active);
      flyouts.forEach(flyout => flyout.setAttribute('aria-hidden', 'true'));
      enableBodyScroll(node);
      setTimeout(() => {
        i(flyoutContainer, classes.fixed);
      }, 300);
    }

    function clickFilter(e) {
      checkForActiveModalitems(e.currentTarget);
      const wrappingContainer = e.target.closest(sel.group);
      wrappingContainer && l(wrappingContainer, classes.activeFilters, containsCheckedInputs(t$3('input', wrappingContainer)));
    }

    function clickSort(e) {
      checkForActiveModalitems(e.target);
    }

    function rangeChanged(e) {
      checkForActiveModalitems(e.currentTarget);
      const wrappingContainer = e.target.closest(sel.group);
      wrappingContainer && l(wrappingContainer, classes.activeFilters, rangeInputsHaveValue());
    }

    function clickButton(e) {
      e.preventDefault();
      const {
        button
      } = e.currentTarget.dataset;
      const scope = e.currentTarget.closest(sel.flyouts);
      const {
        filterModal
      } = scope.dataset; // Sort flyouts

      if (filterModal === '__sort') {
        if (button === 'clear-all') {
          sortMethods.forEach(element => {
            n$1('input', element).checked = false;
          });
          i(e.currentTarget.closest(sel.panel), classes.activeFilters);
        }

        if (button === 'apply') {
          updateFilters();
          clickWash();
          return;
        }
      } else {
        // Regular filter flyout
        if (button === 'clear-all') {
          t$3('input', scope).forEach(input => {
            input.checked = false;
          });
          const panel = e.currentTarget.closest(sel.panel);
          i([...t$3(sel.group, panel), panel], classes.activeFilters);
          range && range.reset();
        }

        if (button === 'clear') {
          const wrappingContainer = e.target.closest(sel.group);
          t$3('input', wrappingContainer).forEach(input => {
            input.checked = false;
          });
          i(e.currentTarget.closest(sel.group), classes.activeFilters);
          checkForActiveModalitems(e.currentTarget);

          if (n$1('.filter-drawer__price-range', wrappingContainer)) {
            range.reset();
          }
        }

        if (button === 'apply') {
          range && range.validateRange();
          updateFilters();
          clickWash();
        }
      }
    }

    function containsCheckedInputs(items) {
      let isActive = false;
      items.forEach(input => {
        if (input.checked) {
          isActive = true;
        }
      });
      return isActive;
    }

    function rangeInputsHaveValue() {
      let hasValue = false;
      rangeInputs.forEach(input => {
        if (input.value !== '') hasValue = true;
      });
      return hasValue;
    }

    function checkForActiveModalitems(currentTarget) {
      const panel = currentTarget.closest(sel.panel);
      if (!panel) return;
      const activeItems = containsCheckedInputs(t$3('input', panel)) || rangeInputsHaveValue();
      l(panel, classes.activeFilters, activeItems);
    }

    function removeFilter(id) {
      const targetInput = n$1(`#${id}`, flyoutContainer);
      targetInput.checked = false;
      const group = targetInput.closest(sel.group);

      if (group) {
        if (!containsCheckedInputs(t$3('input', group))) i(group, classes.activeFilters);
      }

      checkForActiveModalitems(targetInput);
    }

    function clearAll() {
      t$3('input', flyoutContainer).forEach(input => {
        input.checked = false;
      });
      t$3('.active-filters', flyoutContainer).forEach(element => i(element, classes.activeFilters));
      range && range.reset();
    }

    function removeRange() {
      range && range.reset();
    }

    function unload() {
      events.forEach(unsubscribe => unsubscribe());
      range && range.unload();
    }

    return {
      removeFilter,
      clearAll,
      removeRange,
      unload
    };
  };

  const filtering = (filterForm, container) => {
    const drawer = filterDrawer(container);
    let formData, searchParams;
    setParams();

    function setParams() {
      formData = new FormData(filterForm);
      searchParams = new URLSearchParams(formData).toString();
    }

    return {
      getState() {
        return {
          url: searchParams
        };
      },

      filtersUpdated(cb) {
        setParams();
        return cb(this.getState());
      },

      removeFilters(target, cb) {
        drawer.removeFilter(target);
        setParams();
        return cb(this.getState());
      },

      removeRange(cb) {
        drawer.removeRange();
        setParams();
        return cb(this.getState());
      },

      clearAll(cb) {
        searchParams = '';
        drawer.clearAll();
        return cb(this.getState());
      },

      unload() {
        drawer();
      }

    };
  };

  var filtering$1 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    'default': filtering
  });

})));
