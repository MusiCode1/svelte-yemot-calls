
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function set_store_value(store, ret, value = ret) {
        store.set(value);
        return ret;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.38.2' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    var bind = function bind(fn, thisArg) {
      return function wrap() {
        var args = new Array(arguments.length);
        for (var i = 0; i < args.length; i++) {
          args[i] = arguments[i];
        }
        return fn.apply(thisArg, args);
      };
    };

    /*global toString:true*/

    // utils is a library of generic helper functions non-specific to axios

    var toString = Object.prototype.toString;

    /**
     * Determine if a value is an Array
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is an Array, otherwise false
     */
    function isArray$4(val) {
      return toString.call(val) === '[object Array]';
    }

    /**
     * Determine if a value is undefined
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if the value is undefined, otherwise false
     */
    function isUndefined(val) {
      return typeof val === 'undefined';
    }

    /**
     * Determine if a value is a Buffer
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Buffer, otherwise false
     */
    function isBuffer$1(val) {
      return val !== null && !isUndefined(val) && val.constructor !== null && !isUndefined(val.constructor)
        && typeof val.constructor.isBuffer === 'function' && val.constructor.isBuffer(val);
    }

    /**
     * Determine if a value is an ArrayBuffer
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is an ArrayBuffer, otherwise false
     */
    function isArrayBuffer(val) {
      return toString.call(val) === '[object ArrayBuffer]';
    }

    /**
     * Determine if a value is a FormData
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is an FormData, otherwise false
     */
    function isFormData(val) {
      return (typeof FormData !== 'undefined') && (val instanceof FormData);
    }

    /**
     * Determine if a value is a view on an ArrayBuffer
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a view on an ArrayBuffer, otherwise false
     */
    function isArrayBufferView(val) {
      var result;
      if ((typeof ArrayBuffer !== 'undefined') && (ArrayBuffer.isView)) {
        result = ArrayBuffer.isView(val);
      } else {
        result = (val) && (val.buffer) && (val.buffer instanceof ArrayBuffer);
      }
      return result;
    }

    /**
     * Determine if a value is a String
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a String, otherwise false
     */
    function isString$1(val) {
      return typeof val === 'string';
    }

    /**
     * Determine if a value is a Number
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Number, otherwise false
     */
    function isNumber$1(val) {
      return typeof val === 'number';
    }

    /**
     * Determine if a value is an Object
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is an Object, otherwise false
     */
    function isObject(val) {
      return val !== null && typeof val === 'object';
    }

    /**
     * Determine if a value is a plain Object
     *
     * @param {Object} val The value to test
     * @return {boolean} True if value is a plain Object, otherwise false
     */
    function isPlainObject(val) {
      if (toString.call(val) !== '[object Object]') {
        return false;
      }

      var prototype = Object.getPrototypeOf(val);
      return prototype === null || prototype === Object.prototype;
    }

    /**
     * Determine if a value is a Date
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Date, otherwise false
     */
    function isDate$1(val) {
      return toString.call(val) === '[object Date]';
    }

    /**
     * Determine if a value is a File
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a File, otherwise false
     */
    function isFile(val) {
      return toString.call(val) === '[object File]';
    }

    /**
     * Determine if a value is a Blob
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Blob, otherwise false
     */
    function isBlob(val) {
      return toString.call(val) === '[object Blob]';
    }

    /**
     * Determine if a value is a Function
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Function, otherwise false
     */
    function isFunction(val) {
      return toString.call(val) === '[object Function]';
    }

    /**
     * Determine if a value is a Stream
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Stream, otherwise false
     */
    function isStream(val) {
      return isObject(val) && isFunction(val.pipe);
    }

    /**
     * Determine if a value is a URLSearchParams object
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a URLSearchParams object, otherwise false
     */
    function isURLSearchParams(val) {
      return typeof URLSearchParams !== 'undefined' && val instanceof URLSearchParams;
    }

    /**
     * Trim excess whitespace off the beginning and end of a string
     *
     * @param {String} str The String to trim
     * @returns {String} The String freed of excess whitespace
     */
    function trim(str) {
      return str.replace(/^\s*/, '').replace(/\s*$/, '');
    }

    /**
     * Determine if we're running in a standard browser environment
     *
     * This allows axios to run in a web worker, and react-native.
     * Both environments support XMLHttpRequest, but not fully standard globals.
     *
     * web workers:
     *  typeof window -> undefined
     *  typeof document -> undefined
     *
     * react-native:
     *  navigator.product -> 'ReactNative'
     * nativescript
     *  navigator.product -> 'NativeScript' or 'NS'
     */
    function isStandardBrowserEnv() {
      if (typeof navigator !== 'undefined' && (navigator.product === 'ReactNative' ||
                                               navigator.product === 'NativeScript' ||
                                               navigator.product === 'NS')) {
        return false;
      }
      return (
        typeof window !== 'undefined' &&
        typeof document !== 'undefined'
      );
    }

    /**
     * Iterate over an Array or an Object invoking a function for each item.
     *
     * If `obj` is an Array callback will be called passing
     * the value, index, and complete array for each item.
     *
     * If 'obj' is an Object callback will be called passing
     * the value, key, and complete object for each property.
     *
     * @param {Object|Array} obj The object to iterate
     * @param {Function} fn The callback to invoke for each item
     */
    function forEach(obj, fn) {
      // Don't bother if no value provided
      if (obj === null || typeof obj === 'undefined') {
        return;
      }

      // Force an array if not already something iterable
      if (typeof obj !== 'object') {
        /*eslint no-param-reassign:0*/
        obj = [obj];
      }

      if (isArray$4(obj)) {
        // Iterate over array values
        for (var i = 0, l = obj.length; i < l; i++) {
          fn.call(null, obj[i], i, obj);
        }
      } else {
        // Iterate over object keys
        for (var key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            fn.call(null, obj[key], key, obj);
          }
        }
      }
    }

    /**
     * Accepts varargs expecting each argument to be an object, then
     * immutably merges the properties of each object and returns result.
     *
     * When multiple objects contain the same key the later object in
     * the arguments list will take precedence.
     *
     * Example:
     *
     * ```js
     * var result = merge({foo: 123}, {foo: 456});
     * console.log(result.foo); // outputs 456
     * ```
     *
     * @param {Object} obj1 Object to merge
     * @returns {Object} Result of all merge properties
     */
    function merge$1(/* obj1, obj2, obj3, ... */) {
      var result = {};
      function assignValue(val, key) {
        if (isPlainObject(result[key]) && isPlainObject(val)) {
          result[key] = merge$1(result[key], val);
        } else if (isPlainObject(val)) {
          result[key] = merge$1({}, val);
        } else if (isArray$4(val)) {
          result[key] = val.slice();
        } else {
          result[key] = val;
        }
      }

      for (var i = 0, l = arguments.length; i < l; i++) {
        forEach(arguments[i], assignValue);
      }
      return result;
    }

    /**
     * Extends object a by mutably adding to it the properties of object b.
     *
     * @param {Object} a The object to be extended
     * @param {Object} b The object to copy properties from
     * @param {Object} thisArg The object to bind function to
     * @return {Object} The resulting value of object a
     */
    function extend(a, b, thisArg) {
      forEach(b, function assignValue(val, key) {
        if (thisArg && typeof val === 'function') {
          a[key] = bind(val, thisArg);
        } else {
          a[key] = val;
        }
      });
      return a;
    }

    /**
     * Remove byte order marker. This catches EF BB BF (the UTF-8 BOM)
     *
     * @param {string} content with BOM
     * @return {string} content value without BOM
     */
    function stripBOM(content) {
      if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
      }
      return content;
    }

    var utils$1 = {
      isArray: isArray$4,
      isArrayBuffer: isArrayBuffer,
      isBuffer: isBuffer$1,
      isFormData: isFormData,
      isArrayBufferView: isArrayBufferView,
      isString: isString$1,
      isNumber: isNumber$1,
      isObject: isObject,
      isPlainObject: isPlainObject,
      isUndefined: isUndefined,
      isDate: isDate$1,
      isFile: isFile,
      isBlob: isBlob,
      isFunction: isFunction,
      isStream: isStream,
      isURLSearchParams: isURLSearchParams,
      isStandardBrowserEnv: isStandardBrowserEnv,
      forEach: forEach,
      merge: merge$1,
      extend: extend,
      trim: trim,
      stripBOM: stripBOM
    };

    function encode$1(val) {
      return encodeURIComponent(val).
        replace(/%3A/gi, ':').
        replace(/%24/g, '$').
        replace(/%2C/gi, ',').
        replace(/%20/g, '+').
        replace(/%5B/gi, '[').
        replace(/%5D/gi, ']');
    }

    /**
     * Build a URL by appending params to the end
     *
     * @param {string} url The base of the url (e.g., http://www.google.com)
     * @param {object} [params] The params to be appended
     * @returns {string} The formatted url
     */
    var buildURL = function buildURL(url, params, paramsSerializer) {
      /*eslint no-param-reassign:0*/
      if (!params) {
        return url;
      }

      var serializedParams;
      if (paramsSerializer) {
        serializedParams = paramsSerializer(params);
      } else if (utils$1.isURLSearchParams(params)) {
        serializedParams = params.toString();
      } else {
        var parts = [];

        utils$1.forEach(params, function serialize(val, key) {
          if (val === null || typeof val === 'undefined') {
            return;
          }

          if (utils$1.isArray(val)) {
            key = key + '[]';
          } else {
            val = [val];
          }

          utils$1.forEach(val, function parseValue(v) {
            if (utils$1.isDate(v)) {
              v = v.toISOString();
            } else if (utils$1.isObject(v)) {
              v = JSON.stringify(v);
            }
            parts.push(encode$1(key) + '=' + encode$1(v));
          });
        });

        serializedParams = parts.join('&');
      }

      if (serializedParams) {
        var hashmarkIndex = url.indexOf('#');
        if (hashmarkIndex !== -1) {
          url = url.slice(0, hashmarkIndex);
        }

        url += (url.indexOf('?') === -1 ? '?' : '&') + serializedParams;
      }

      return url;
    };

    function InterceptorManager() {
      this.handlers = [];
    }

    /**
     * Add a new interceptor to the stack
     *
     * @param {Function} fulfilled The function to handle `then` for a `Promise`
     * @param {Function} rejected The function to handle `reject` for a `Promise`
     *
     * @return {Number} An ID used to remove interceptor later
     */
    InterceptorManager.prototype.use = function use(fulfilled, rejected) {
      this.handlers.push({
        fulfilled: fulfilled,
        rejected: rejected
      });
      return this.handlers.length - 1;
    };

    /**
     * Remove an interceptor from the stack
     *
     * @param {Number} id The ID that was returned by `use`
     */
    InterceptorManager.prototype.eject = function eject(id) {
      if (this.handlers[id]) {
        this.handlers[id] = null;
      }
    };

    /**
     * Iterate over all the registered interceptors
     *
     * This method is particularly useful for skipping over any
     * interceptors that may have become `null` calling `eject`.
     *
     * @param {Function} fn The function to call for each interceptor
     */
    InterceptorManager.prototype.forEach = function forEach(fn) {
      utils$1.forEach(this.handlers, function forEachHandler(h) {
        if (h !== null) {
          fn(h);
        }
      });
    };

    var InterceptorManager_1 = InterceptorManager;

    /**
     * Transform the data for a request or a response
     *
     * @param {Object|String} data The data to be transformed
     * @param {Array} headers The headers for the request or response
     * @param {Array|Function} fns A single function or Array of functions
     * @returns {*} The resulting transformed data
     */
    var transformData = function transformData(data, headers, fns) {
      /*eslint no-param-reassign:0*/
      utils$1.forEach(fns, function transform(fn) {
        data = fn(data, headers);
      });

      return data;
    };

    var isCancel = function isCancel(value) {
      return !!(value && value.__CANCEL__);
    };

    var normalizeHeaderName = function normalizeHeaderName(headers, normalizedName) {
      utils$1.forEach(headers, function processHeader(value, name) {
        if (name !== normalizedName && name.toUpperCase() === normalizedName.toUpperCase()) {
          headers[normalizedName] = value;
          delete headers[name];
        }
      });
    };

    /**
     * Update an Error with the specified config, error code, and response.
     *
     * @param {Error} error The error to update.
     * @param {Object} config The config.
     * @param {string} [code] The error code (for example, 'ECONNABORTED').
     * @param {Object} [request] The request.
     * @param {Object} [response] The response.
     * @returns {Error} The error.
     */
    var enhanceError = function enhanceError(error, config, code, request, response) {
      error.config = config;
      if (code) {
        error.code = code;
      }

      error.request = request;
      error.response = response;
      error.isAxiosError = true;

      error.toJSON = function toJSON() {
        return {
          // Standard
          message: this.message,
          name: this.name,
          // Microsoft
          description: this.description,
          number: this.number,
          // Mozilla
          fileName: this.fileName,
          lineNumber: this.lineNumber,
          columnNumber: this.columnNumber,
          stack: this.stack,
          // Axios
          config: this.config,
          code: this.code
        };
      };
      return error;
    };

    /**
     * Create an Error with the specified message, config, error code, request and response.
     *
     * @param {string} message The error message.
     * @param {Object} config The config.
     * @param {string} [code] The error code (for example, 'ECONNABORTED').
     * @param {Object} [request] The request.
     * @param {Object} [response] The response.
     * @returns {Error} The created error.
     */
    var createError = function createError(message, config, code, request, response) {
      var error = new Error(message);
      return enhanceError(error, config, code, request, response);
    };

    /**
     * Resolve or reject a Promise based on response status.
     *
     * @param {Function} resolve A function that resolves the promise.
     * @param {Function} reject A function that rejects the promise.
     * @param {object} response The response.
     */
    var settle = function settle(resolve, reject, response) {
      var validateStatus = response.config.validateStatus;
      if (!response.status || !validateStatus || validateStatus(response.status)) {
        resolve(response);
      } else {
        reject(createError(
          'Request failed with status code ' + response.status,
          response.config,
          null,
          response.request,
          response
        ));
      }
    };

    var cookies = (
      utils$1.isStandardBrowserEnv() ?

      // Standard browser envs support document.cookie
        (function standardBrowserEnv() {
          return {
            write: function write(name, value, expires, path, domain, secure) {
              var cookie = [];
              cookie.push(name + '=' + encodeURIComponent(value));

              if (utils$1.isNumber(expires)) {
                cookie.push('expires=' + new Date(expires).toGMTString());
              }

              if (utils$1.isString(path)) {
                cookie.push('path=' + path);
              }

              if (utils$1.isString(domain)) {
                cookie.push('domain=' + domain);
              }

              if (secure === true) {
                cookie.push('secure');
              }

              document.cookie = cookie.join('; ');
            },

            read: function read(name) {
              var match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
              return (match ? decodeURIComponent(match[3]) : null);
            },

            remove: function remove(name) {
              this.write(name, '', Date.now() - 86400000);
            }
          };
        })() :

      // Non standard browser env (web workers, react-native) lack needed support.
        (function nonStandardBrowserEnv() {
          return {
            write: function write() {},
            read: function read() { return null; },
            remove: function remove() {}
          };
        })()
    );

    /**
     * Determines whether the specified URL is absolute
     *
     * @param {string} url The URL to test
     * @returns {boolean} True if the specified URL is absolute, otherwise false
     */
    var isAbsoluteURL = function isAbsoluteURL(url) {
      // A URL is considered absolute if it begins with "<scheme>://" or "//" (protocol-relative URL).
      // RFC 3986 defines scheme name as a sequence of characters beginning with a letter and followed
      // by any combination of letters, digits, plus, period, or hyphen.
      return /^([a-z][a-z\d\+\-\.]*:)?\/\//i.test(url);
    };

    /**
     * Creates a new URL by combining the specified URLs
     *
     * @param {string} baseURL The base URL
     * @param {string} relativeURL The relative URL
     * @returns {string} The combined URL
     */
    var combineURLs = function combineURLs(baseURL, relativeURL) {
      return relativeURL
        ? baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '')
        : baseURL;
    };

    /**
     * Creates a new URL by combining the baseURL with the requestedURL,
     * only when the requestedURL is not already an absolute URL.
     * If the requestURL is absolute, this function returns the requestedURL untouched.
     *
     * @param {string} baseURL The base URL
     * @param {string} requestedURL Absolute or relative URL to combine
     * @returns {string} The combined full path
     */
    var buildFullPath = function buildFullPath(baseURL, requestedURL) {
      if (baseURL && !isAbsoluteURL(requestedURL)) {
        return combineURLs(baseURL, requestedURL);
      }
      return requestedURL;
    };

    // Headers whose duplicates are ignored by node
    // c.f. https://nodejs.org/api/http.html#http_message_headers
    var ignoreDuplicateOf = [
      'age', 'authorization', 'content-length', 'content-type', 'etag',
      'expires', 'from', 'host', 'if-modified-since', 'if-unmodified-since',
      'last-modified', 'location', 'max-forwards', 'proxy-authorization',
      'referer', 'retry-after', 'user-agent'
    ];

    /**
     * Parse headers into an object
     *
     * ```
     * Date: Wed, 27 Aug 2014 08:58:49 GMT
     * Content-Type: application/json
     * Connection: keep-alive
     * Transfer-Encoding: chunked
     * ```
     *
     * @param {String} headers Headers needing to be parsed
     * @returns {Object} Headers parsed into an object
     */
    var parseHeaders = function parseHeaders(headers) {
      var parsed = {};
      var key;
      var val;
      var i;

      if (!headers) { return parsed; }

      utils$1.forEach(headers.split('\n'), function parser(line) {
        i = line.indexOf(':');
        key = utils$1.trim(line.substr(0, i)).toLowerCase();
        val = utils$1.trim(line.substr(i + 1));

        if (key) {
          if (parsed[key] && ignoreDuplicateOf.indexOf(key) >= 0) {
            return;
          }
          if (key === 'set-cookie') {
            parsed[key] = (parsed[key] ? parsed[key] : []).concat([val]);
          } else {
            parsed[key] = parsed[key] ? parsed[key] + ', ' + val : val;
          }
        }
      });

      return parsed;
    };

    var isURLSameOrigin = (
      utils$1.isStandardBrowserEnv() ?

      // Standard browser envs have full support of the APIs needed to test
      // whether the request URL is of the same origin as current location.
        (function standardBrowserEnv() {
          var msie = /(msie|trident)/i.test(navigator.userAgent);
          var urlParsingNode = document.createElement('a');
          var originURL;

          /**
        * Parse a URL to discover it's components
        *
        * @param {String} url The URL to be parsed
        * @returns {Object}
        */
          function resolveURL(url) {
            var href = url;

            if (msie) {
            // IE needs attribute set twice to normalize properties
              urlParsingNode.setAttribute('href', href);
              href = urlParsingNode.href;
            }

            urlParsingNode.setAttribute('href', href);

            // urlParsingNode provides the UrlUtils interface - http://url.spec.whatwg.org/#urlutils
            return {
              href: urlParsingNode.href,
              protocol: urlParsingNode.protocol ? urlParsingNode.protocol.replace(/:$/, '') : '',
              host: urlParsingNode.host,
              search: urlParsingNode.search ? urlParsingNode.search.replace(/^\?/, '') : '',
              hash: urlParsingNode.hash ? urlParsingNode.hash.replace(/^#/, '') : '',
              hostname: urlParsingNode.hostname,
              port: urlParsingNode.port,
              pathname: (urlParsingNode.pathname.charAt(0) === '/') ?
                urlParsingNode.pathname :
                '/' + urlParsingNode.pathname
            };
          }

          originURL = resolveURL(window.location.href);

          /**
        * Determine if a URL shares the same origin as the current location
        *
        * @param {String} requestURL The URL to test
        * @returns {boolean} True if URL shares the same origin, otherwise false
        */
          return function isURLSameOrigin(requestURL) {
            var parsed = (utils$1.isString(requestURL)) ? resolveURL(requestURL) : requestURL;
            return (parsed.protocol === originURL.protocol &&
                parsed.host === originURL.host);
          };
        })() :

      // Non standard browser envs (web workers, react-native) lack needed support.
        (function nonStandardBrowserEnv() {
          return function isURLSameOrigin() {
            return true;
          };
        })()
    );

    var xhr = function xhrAdapter(config) {
      return new Promise(function dispatchXhrRequest(resolve, reject) {
        var requestData = config.data;
        var requestHeaders = config.headers;

        if (utils$1.isFormData(requestData)) {
          delete requestHeaders['Content-Type']; // Let the browser set it
        }

        var request = new XMLHttpRequest();

        // HTTP basic authentication
        if (config.auth) {
          var username = config.auth.username || '';
          var password = config.auth.password ? unescape(encodeURIComponent(config.auth.password)) : '';
          requestHeaders.Authorization = 'Basic ' + btoa(username + ':' + password);
        }

        var fullPath = buildFullPath(config.baseURL, config.url);
        request.open(config.method.toUpperCase(), buildURL(fullPath, config.params, config.paramsSerializer), true);

        // Set the request timeout in MS
        request.timeout = config.timeout;

        // Listen for ready state
        request.onreadystatechange = function handleLoad() {
          if (!request || request.readyState !== 4) {
            return;
          }

          // The request errored out and we didn't get a response, this will be
          // handled by onerror instead
          // With one exception: request that using file: protocol, most browsers
          // will return status as 0 even though it's a successful request
          if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf('file:') === 0)) {
            return;
          }

          // Prepare the response
          var responseHeaders = 'getAllResponseHeaders' in request ? parseHeaders(request.getAllResponseHeaders()) : null;
          var responseData = !config.responseType || config.responseType === 'text' ? request.responseText : request.response;
          var response = {
            data: responseData,
            status: request.status,
            statusText: request.statusText,
            headers: responseHeaders,
            config: config,
            request: request
          };

          settle(resolve, reject, response);

          // Clean up request
          request = null;
        };

        // Handle browser request cancellation (as opposed to a manual cancellation)
        request.onabort = function handleAbort() {
          if (!request) {
            return;
          }

          reject(createError('Request aborted', config, 'ECONNABORTED', request));

          // Clean up request
          request = null;
        };

        // Handle low level network errors
        request.onerror = function handleError() {
          // Real errors are hidden from us by the browser
          // onerror should only fire if it's a network error
          reject(createError('Network Error', config, null, request));

          // Clean up request
          request = null;
        };

        // Handle timeout
        request.ontimeout = function handleTimeout() {
          var timeoutErrorMessage = 'timeout of ' + config.timeout + 'ms exceeded';
          if (config.timeoutErrorMessage) {
            timeoutErrorMessage = config.timeoutErrorMessage;
          }
          reject(createError(timeoutErrorMessage, config, 'ECONNABORTED',
            request));

          // Clean up request
          request = null;
        };

        // Add xsrf header
        // This is only done if running in a standard browser environment.
        // Specifically not if we're in a web worker, or react-native.
        if (utils$1.isStandardBrowserEnv()) {
          // Add xsrf header
          var xsrfValue = (config.withCredentials || isURLSameOrigin(fullPath)) && config.xsrfCookieName ?
            cookies.read(config.xsrfCookieName) :
            undefined;

          if (xsrfValue) {
            requestHeaders[config.xsrfHeaderName] = xsrfValue;
          }
        }

        // Add headers to the request
        if ('setRequestHeader' in request) {
          utils$1.forEach(requestHeaders, function setRequestHeader(val, key) {
            if (typeof requestData === 'undefined' && key.toLowerCase() === 'content-type') {
              // Remove Content-Type if data is undefined
              delete requestHeaders[key];
            } else {
              // Otherwise add header to the request
              request.setRequestHeader(key, val);
            }
          });
        }

        // Add withCredentials to request if needed
        if (!utils$1.isUndefined(config.withCredentials)) {
          request.withCredentials = !!config.withCredentials;
        }

        // Add responseType to request if needed
        if (config.responseType) {
          try {
            request.responseType = config.responseType;
          } catch (e) {
            // Expected DOMException thrown by browsers not compatible XMLHttpRequest Level 2.
            // But, this can be suppressed for 'json' type as it can be parsed by default 'transformResponse' function.
            if (config.responseType !== 'json') {
              throw e;
            }
          }
        }

        // Handle progress if needed
        if (typeof config.onDownloadProgress === 'function') {
          request.addEventListener('progress', config.onDownloadProgress);
        }

        // Not all browsers support upload events
        if (typeof config.onUploadProgress === 'function' && request.upload) {
          request.upload.addEventListener('progress', config.onUploadProgress);
        }

        if (config.cancelToken) {
          // Handle cancellation
          config.cancelToken.promise.then(function onCanceled(cancel) {
            if (!request) {
              return;
            }

            request.abort();
            reject(cancel);
            // Clean up request
            request = null;
          });
        }

        if (!requestData) {
          requestData = null;
        }

        // Send the request
        request.send(requestData);
      });
    };

    var DEFAULT_CONTENT_TYPE = {
      'Content-Type': 'application/x-www-form-urlencoded'
    };

    function setContentTypeIfUnset(headers, value) {
      if (!utils$1.isUndefined(headers) && utils$1.isUndefined(headers['Content-Type'])) {
        headers['Content-Type'] = value;
      }
    }

    function getDefaultAdapter() {
      var adapter;
      if (typeof XMLHttpRequest !== 'undefined') {
        // For browsers use XHR adapter
        adapter = xhr;
      } else if (typeof process !== 'undefined' && Object.prototype.toString.call(process) === '[object process]') {
        // For node use HTTP adapter
        adapter = xhr;
      }
      return adapter;
    }

    var defaults$2 = {
      adapter: getDefaultAdapter(),

      transformRequest: [function transformRequest(data, headers) {
        normalizeHeaderName(headers, 'Accept');
        normalizeHeaderName(headers, 'Content-Type');
        if (utils$1.isFormData(data) ||
          utils$1.isArrayBuffer(data) ||
          utils$1.isBuffer(data) ||
          utils$1.isStream(data) ||
          utils$1.isFile(data) ||
          utils$1.isBlob(data)
        ) {
          return data;
        }
        if (utils$1.isArrayBufferView(data)) {
          return data.buffer;
        }
        if (utils$1.isURLSearchParams(data)) {
          setContentTypeIfUnset(headers, 'application/x-www-form-urlencoded;charset=utf-8');
          return data.toString();
        }
        if (utils$1.isObject(data)) {
          setContentTypeIfUnset(headers, 'application/json;charset=utf-8');
          return JSON.stringify(data);
        }
        return data;
      }],

      transformResponse: [function transformResponse(data) {
        /*eslint no-param-reassign:0*/
        if (typeof data === 'string') {
          try {
            data = JSON.parse(data);
          } catch (e) { /* Ignore */ }
        }
        return data;
      }],

      /**
       * A timeout in milliseconds to abort a request. If set to 0 (default) a
       * timeout is not created.
       */
      timeout: 0,

      xsrfCookieName: 'XSRF-TOKEN',
      xsrfHeaderName: 'X-XSRF-TOKEN',

      maxContentLength: -1,
      maxBodyLength: -1,

      validateStatus: function validateStatus(status) {
        return status >= 200 && status < 300;
      }
    };

    defaults$2.headers = {
      common: {
        'Accept': 'application/json, text/plain, */*'
      }
    };

    utils$1.forEach(['delete', 'get', 'head'], function forEachMethodNoData(method) {
      defaults$2.headers[method] = {};
    });

    utils$1.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
      defaults$2.headers[method] = utils$1.merge(DEFAULT_CONTENT_TYPE);
    });

    var defaults_1 = defaults$2;

    /**
     * Throws a `Cancel` if cancellation has been requested.
     */
    function throwIfCancellationRequested(config) {
      if (config.cancelToken) {
        config.cancelToken.throwIfRequested();
      }
    }

    /**
     * Dispatch a request to the server using the configured adapter.
     *
     * @param {object} config The config that is to be used for the request
     * @returns {Promise} The Promise to be fulfilled
     */
    var dispatchRequest = function dispatchRequest(config) {
      throwIfCancellationRequested(config);

      // Ensure headers exist
      config.headers = config.headers || {};

      // Transform request data
      config.data = transformData(
        config.data,
        config.headers,
        config.transformRequest
      );

      // Flatten headers
      config.headers = utils$1.merge(
        config.headers.common || {},
        config.headers[config.method] || {},
        config.headers
      );

      utils$1.forEach(
        ['delete', 'get', 'head', 'post', 'put', 'patch', 'common'],
        function cleanHeaderConfig(method) {
          delete config.headers[method];
        }
      );

      var adapter = config.adapter || defaults_1.adapter;

      return adapter(config).then(function onAdapterResolution(response) {
        throwIfCancellationRequested(config);

        // Transform response data
        response.data = transformData(
          response.data,
          response.headers,
          config.transformResponse
        );

        return response;
      }, function onAdapterRejection(reason) {
        if (!isCancel(reason)) {
          throwIfCancellationRequested(config);

          // Transform response data
          if (reason && reason.response) {
            reason.response.data = transformData(
              reason.response.data,
              reason.response.headers,
              config.transformResponse
            );
          }
        }

        return Promise.reject(reason);
      });
    };

    /**
     * Config-specific merge-function which creates a new config-object
     * by merging two configuration objects together.
     *
     * @param {Object} config1
     * @param {Object} config2
     * @returns {Object} New object resulting from merging config2 to config1
     */
    var mergeConfig = function mergeConfig(config1, config2) {
      // eslint-disable-next-line no-param-reassign
      config2 = config2 || {};
      var config = {};

      var valueFromConfig2Keys = ['url', 'method', 'data'];
      var mergeDeepPropertiesKeys = ['headers', 'auth', 'proxy', 'params'];
      var defaultToConfig2Keys = [
        'baseURL', 'transformRequest', 'transformResponse', 'paramsSerializer',
        'timeout', 'timeoutMessage', 'withCredentials', 'adapter', 'responseType', 'xsrfCookieName',
        'xsrfHeaderName', 'onUploadProgress', 'onDownloadProgress', 'decompress',
        'maxContentLength', 'maxBodyLength', 'maxRedirects', 'transport', 'httpAgent',
        'httpsAgent', 'cancelToken', 'socketPath', 'responseEncoding'
      ];
      var directMergeKeys = ['validateStatus'];

      function getMergedValue(target, source) {
        if (utils$1.isPlainObject(target) && utils$1.isPlainObject(source)) {
          return utils$1.merge(target, source);
        } else if (utils$1.isPlainObject(source)) {
          return utils$1.merge({}, source);
        } else if (utils$1.isArray(source)) {
          return source.slice();
        }
        return source;
      }

      function mergeDeepProperties(prop) {
        if (!utils$1.isUndefined(config2[prop])) {
          config[prop] = getMergedValue(config1[prop], config2[prop]);
        } else if (!utils$1.isUndefined(config1[prop])) {
          config[prop] = getMergedValue(undefined, config1[prop]);
        }
      }

      utils$1.forEach(valueFromConfig2Keys, function valueFromConfig2(prop) {
        if (!utils$1.isUndefined(config2[prop])) {
          config[prop] = getMergedValue(undefined, config2[prop]);
        }
      });

      utils$1.forEach(mergeDeepPropertiesKeys, mergeDeepProperties);

      utils$1.forEach(defaultToConfig2Keys, function defaultToConfig2(prop) {
        if (!utils$1.isUndefined(config2[prop])) {
          config[prop] = getMergedValue(undefined, config2[prop]);
        } else if (!utils$1.isUndefined(config1[prop])) {
          config[prop] = getMergedValue(undefined, config1[prop]);
        }
      });

      utils$1.forEach(directMergeKeys, function merge(prop) {
        if (prop in config2) {
          config[prop] = getMergedValue(config1[prop], config2[prop]);
        } else if (prop in config1) {
          config[prop] = getMergedValue(undefined, config1[prop]);
        }
      });

      var axiosKeys = valueFromConfig2Keys
        .concat(mergeDeepPropertiesKeys)
        .concat(defaultToConfig2Keys)
        .concat(directMergeKeys);

      var otherKeys = Object
        .keys(config1)
        .concat(Object.keys(config2))
        .filter(function filterAxiosKeys(key) {
          return axiosKeys.indexOf(key) === -1;
        });

      utils$1.forEach(otherKeys, mergeDeepProperties);

      return config;
    };

    /**
     * Create a new instance of Axios
     *
     * @param {Object} instanceConfig The default config for the instance
     */
    function Axios(instanceConfig) {
      this.defaults = instanceConfig;
      this.interceptors = {
        request: new InterceptorManager_1(),
        response: new InterceptorManager_1()
      };
    }

    /**
     * Dispatch a request
     *
     * @param {Object} config The config specific for this request (merged with this.defaults)
     */
    Axios.prototype.request = function request(config) {
      /*eslint no-param-reassign:0*/
      // Allow for axios('example/url'[, config]) a la fetch API
      if (typeof config === 'string') {
        config = arguments[1] || {};
        config.url = arguments[0];
      } else {
        config = config || {};
      }

      config = mergeConfig(this.defaults, config);

      // Set config.method
      if (config.method) {
        config.method = config.method.toLowerCase();
      } else if (this.defaults.method) {
        config.method = this.defaults.method.toLowerCase();
      } else {
        config.method = 'get';
      }

      // Hook up interceptors middleware
      var chain = [dispatchRequest, undefined];
      var promise = Promise.resolve(config);

      this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
        chain.unshift(interceptor.fulfilled, interceptor.rejected);
      });

      this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
        chain.push(interceptor.fulfilled, interceptor.rejected);
      });

      while (chain.length) {
        promise = promise.then(chain.shift(), chain.shift());
      }

      return promise;
    };

    Axios.prototype.getUri = function getUri(config) {
      config = mergeConfig(this.defaults, config);
      return buildURL(config.url, config.params, config.paramsSerializer).replace(/^\?/, '');
    };

    // Provide aliases for supported request methods
    utils$1.forEach(['delete', 'get', 'head', 'options'], function forEachMethodNoData(method) {
      /*eslint func-names:0*/
      Axios.prototype[method] = function(url, config) {
        return this.request(mergeConfig(config || {}, {
          method: method,
          url: url,
          data: (config || {}).data
        }));
      };
    });

    utils$1.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
      /*eslint func-names:0*/
      Axios.prototype[method] = function(url, data, config) {
        return this.request(mergeConfig(config || {}, {
          method: method,
          url: url,
          data: data
        }));
      };
    });

    var Axios_1 = Axios;

    /**
     * A `Cancel` is an object that is thrown when an operation is canceled.
     *
     * @class
     * @param {string=} message The message.
     */
    function Cancel(message) {
      this.message = message;
    }

    Cancel.prototype.toString = function toString() {
      return 'Cancel' + (this.message ? ': ' + this.message : '');
    };

    Cancel.prototype.__CANCEL__ = true;

    var Cancel_1 = Cancel;

    /**
     * A `CancelToken` is an object that can be used to request cancellation of an operation.
     *
     * @class
     * @param {Function} executor The executor function.
     */
    function CancelToken(executor) {
      if (typeof executor !== 'function') {
        throw new TypeError('executor must be a function.');
      }

      var resolvePromise;
      this.promise = new Promise(function promiseExecutor(resolve) {
        resolvePromise = resolve;
      });

      var token = this;
      executor(function cancel(message) {
        if (token.reason) {
          // Cancellation has already been requested
          return;
        }

        token.reason = new Cancel_1(message);
        resolvePromise(token.reason);
      });
    }

    /**
     * Throws a `Cancel` if cancellation has been requested.
     */
    CancelToken.prototype.throwIfRequested = function throwIfRequested() {
      if (this.reason) {
        throw this.reason;
      }
    };

    /**
     * Returns an object that contains a new `CancelToken` and a function that, when called,
     * cancels the `CancelToken`.
     */
    CancelToken.source = function source() {
      var cancel;
      var token = new CancelToken(function executor(c) {
        cancel = c;
      });
      return {
        token: token,
        cancel: cancel
      };
    };

    var CancelToken_1 = CancelToken;

    /**
     * Syntactic sugar for invoking a function and expanding an array for arguments.
     *
     * Common use case would be to use `Function.prototype.apply`.
     *
     *  ```js
     *  function f(x, y, z) {}
     *  var args = [1, 2, 3];
     *  f.apply(null, args);
     *  ```
     *
     * With `spread` this example can be re-written.
     *
     *  ```js
     *  spread(function(x, y, z) {})([1, 2, 3]);
     *  ```
     *
     * @param {Function} callback
     * @returns {Function}
     */
    var spread = function spread(callback) {
      return function wrap(arr) {
        return callback.apply(null, arr);
      };
    };

    /**
     * Determines whether the payload is an error thrown by Axios
     *
     * @param {*} payload The value to test
     * @returns {boolean} True if the payload is an error thrown by Axios, otherwise false
     */
    var isAxiosError = function isAxiosError(payload) {
      return (typeof payload === 'object') && (payload.isAxiosError === true);
    };

    /**
     * Create an instance of Axios
     *
     * @param {Object} defaultConfig The default config for the instance
     * @return {Axios} A new instance of Axios
     */
    function createInstance(defaultConfig) {
      var context = new Axios_1(defaultConfig);
      var instance = bind(Axios_1.prototype.request, context);

      // Copy axios.prototype to instance
      utils$1.extend(instance, Axios_1.prototype, context);

      // Copy context to instance
      utils$1.extend(instance, context);

      return instance;
    }

    // Create the default instance to be exported
    var axios$2 = createInstance(defaults_1);

    // Expose Axios class to allow class inheritance
    axios$2.Axios = Axios_1;

    // Factory for creating new instances
    axios$2.create = function create(instanceConfig) {
      return createInstance(mergeConfig(axios$2.defaults, instanceConfig));
    };

    // Expose Cancel & CancelToken
    axios$2.Cancel = Cancel_1;
    axios$2.CancelToken = CancelToken_1;
    axios$2.isCancel = isCancel;

    // Expose all/spread
    axios$2.all = function all(promises) {
      return Promise.all(promises);
    };
    axios$2.spread = spread;

    // Expose isAxiosError
    axios$2.isAxiosError = isAxiosError;

    var axios_1 = axios$2;

    // Allow use of default import syntax in TypeScript
    var _default = axios$2;
    axios_1.default = _default;

    var axios$1 = axios_1;

    /* eslint complexity: [2, 18], max-statements: [2, 33] */
    var shams = function hasSymbols() {
    	if (typeof Symbol !== 'function' || typeof Object.getOwnPropertySymbols !== 'function') { return false; }
    	if (typeof Symbol.iterator === 'symbol') { return true; }

    	var obj = {};
    	var sym = Symbol('test');
    	var symObj = Object(sym);
    	if (typeof sym === 'string') { return false; }

    	if (Object.prototype.toString.call(sym) !== '[object Symbol]') { return false; }
    	if (Object.prototype.toString.call(symObj) !== '[object Symbol]') { return false; }

    	// temp disabled per https://github.com/ljharb/object.assign/issues/17
    	// if (sym instanceof Symbol) { return false; }
    	// temp disabled per https://github.com/WebReflection/get-own-property-symbols/issues/4
    	// if (!(symObj instanceof Symbol)) { return false; }

    	// if (typeof Symbol.prototype.toString !== 'function') { return false; }
    	// if (String(sym) !== Symbol.prototype.toString.call(sym)) { return false; }

    	var symVal = 42;
    	obj[sym] = symVal;
    	for (sym in obj) { return false; } // eslint-disable-line no-restricted-syntax, no-unreachable-loop
    	if (typeof Object.keys === 'function' && Object.keys(obj).length !== 0) { return false; }

    	if (typeof Object.getOwnPropertyNames === 'function' && Object.getOwnPropertyNames(obj).length !== 0) { return false; }

    	var syms = Object.getOwnPropertySymbols(obj);
    	if (syms.length !== 1 || syms[0] !== sym) { return false; }

    	if (!Object.prototype.propertyIsEnumerable.call(obj, sym)) { return false; }

    	if (typeof Object.getOwnPropertyDescriptor === 'function') {
    		var descriptor = Object.getOwnPropertyDescriptor(obj, sym);
    		if (descriptor.value !== symVal || descriptor.enumerable !== true) { return false; }
    	}

    	return true;
    };

    var origSymbol = typeof Symbol !== 'undefined' && Symbol;


    var hasSymbols$1 = function hasNativeSymbols() {
    	if (typeof origSymbol !== 'function') { return false; }
    	if (typeof Symbol !== 'function') { return false; }
    	if (typeof origSymbol('foo') !== 'symbol') { return false; }
    	if (typeof Symbol('bar') !== 'symbol') { return false; }

    	return shams();
    };

    /* eslint no-invalid-this: 1 */

    var ERROR_MESSAGE = 'Function.prototype.bind called on incompatible ';
    var slice = Array.prototype.slice;
    var toStr$1 = Object.prototype.toString;
    var funcType = '[object Function]';

    var implementation = function bind(that) {
        var target = this;
        if (typeof target !== 'function' || toStr$1.call(target) !== funcType) {
            throw new TypeError(ERROR_MESSAGE + target);
        }
        var args = slice.call(arguments, 1);

        var bound;
        var binder = function () {
            if (this instanceof bound) {
                var result = target.apply(
                    this,
                    args.concat(slice.call(arguments))
                );
                if (Object(result) === result) {
                    return result;
                }
                return this;
            } else {
                return target.apply(
                    that,
                    args.concat(slice.call(arguments))
                );
            }
        };

        var boundLength = Math.max(0, target.length - args.length);
        var boundArgs = [];
        for (var i = 0; i < boundLength; i++) {
            boundArgs.push('$' + i);
        }

        bound = Function('binder', 'return function (' + boundArgs.join(',') + '){ return binder.apply(this,arguments); }')(binder);

        if (target.prototype) {
            var Empty = function Empty() {};
            Empty.prototype = target.prototype;
            bound.prototype = new Empty();
            Empty.prototype = null;
        }

        return bound;
    };

    var functionBind = Function.prototype.bind || implementation;

    var src = functionBind.call(Function.call, Object.prototype.hasOwnProperty);

    var undefined$1;

    var $SyntaxError = SyntaxError;
    var $Function = Function;
    var $TypeError$1 = TypeError;

    // eslint-disable-next-line consistent-return
    var getEvalledConstructor = function (expressionSyntax) {
    	try {
    		return $Function('"use strict"; return (' + expressionSyntax + ').constructor;')();
    	} catch (e) {}
    };

    var $gOPD = Object.getOwnPropertyDescriptor;
    if ($gOPD) {
    	try {
    		$gOPD({}, '');
    	} catch (e) {
    		$gOPD = null; // this is IE 8, which has a broken gOPD
    	}
    }

    var throwTypeError = function () {
    	throw new $TypeError$1();
    };
    var ThrowTypeError = $gOPD
    	? (function () {
    		try {
    			// eslint-disable-next-line no-unused-expressions, no-caller, no-restricted-properties
    			arguments.callee; // IE 8 does not throw here
    			return throwTypeError;
    		} catch (calleeThrows) {
    			try {
    				// IE 8 throws on Object.getOwnPropertyDescriptor(arguments, '')
    				return $gOPD(arguments, 'callee').get;
    			} catch (gOPDthrows) {
    				return throwTypeError;
    			}
    		}
    	}())
    	: throwTypeError;

    var hasSymbols = hasSymbols$1();

    var getProto = Object.getPrototypeOf || function (x) { return x.__proto__; }; // eslint-disable-line no-proto

    var needsEval = {};

    var TypedArray = typeof Uint8Array === 'undefined' ? undefined$1 : getProto(Uint8Array);

    var INTRINSICS = {
    	'%AggregateError%': typeof AggregateError === 'undefined' ? undefined$1 : AggregateError,
    	'%Array%': Array,
    	'%ArrayBuffer%': typeof ArrayBuffer === 'undefined' ? undefined$1 : ArrayBuffer,
    	'%ArrayIteratorPrototype%': hasSymbols ? getProto([][Symbol.iterator]()) : undefined$1,
    	'%AsyncFromSyncIteratorPrototype%': undefined$1,
    	'%AsyncFunction%': needsEval,
    	'%AsyncGenerator%': needsEval,
    	'%AsyncGeneratorFunction%': needsEval,
    	'%AsyncIteratorPrototype%': needsEval,
    	'%Atomics%': typeof Atomics === 'undefined' ? undefined$1 : Atomics,
    	'%BigInt%': typeof BigInt === 'undefined' ? undefined$1 : BigInt,
    	'%Boolean%': Boolean,
    	'%DataView%': typeof DataView === 'undefined' ? undefined$1 : DataView,
    	'%Date%': Date,
    	'%decodeURI%': decodeURI,
    	'%decodeURIComponent%': decodeURIComponent,
    	'%encodeURI%': encodeURI,
    	'%encodeURIComponent%': encodeURIComponent,
    	'%Error%': Error,
    	'%eval%': eval, // eslint-disable-line no-eval
    	'%EvalError%': EvalError,
    	'%Float32Array%': typeof Float32Array === 'undefined' ? undefined$1 : Float32Array,
    	'%Float64Array%': typeof Float64Array === 'undefined' ? undefined$1 : Float64Array,
    	'%FinalizationRegistry%': typeof FinalizationRegistry === 'undefined' ? undefined$1 : FinalizationRegistry,
    	'%Function%': $Function,
    	'%GeneratorFunction%': needsEval,
    	'%Int8Array%': typeof Int8Array === 'undefined' ? undefined$1 : Int8Array,
    	'%Int16Array%': typeof Int16Array === 'undefined' ? undefined$1 : Int16Array,
    	'%Int32Array%': typeof Int32Array === 'undefined' ? undefined$1 : Int32Array,
    	'%isFinite%': isFinite,
    	'%isNaN%': isNaN,
    	'%IteratorPrototype%': hasSymbols ? getProto(getProto([][Symbol.iterator]())) : undefined$1,
    	'%JSON%': typeof JSON === 'object' ? JSON : undefined$1,
    	'%Map%': typeof Map === 'undefined' ? undefined$1 : Map,
    	'%MapIteratorPrototype%': typeof Map === 'undefined' || !hasSymbols ? undefined$1 : getProto(new Map()[Symbol.iterator]()),
    	'%Math%': Math,
    	'%Number%': Number,
    	'%Object%': Object,
    	'%parseFloat%': parseFloat,
    	'%parseInt%': parseInt,
    	'%Promise%': typeof Promise === 'undefined' ? undefined$1 : Promise,
    	'%Proxy%': typeof Proxy === 'undefined' ? undefined$1 : Proxy,
    	'%RangeError%': RangeError,
    	'%ReferenceError%': ReferenceError,
    	'%Reflect%': typeof Reflect === 'undefined' ? undefined$1 : Reflect,
    	'%RegExp%': RegExp,
    	'%Set%': typeof Set === 'undefined' ? undefined$1 : Set,
    	'%SetIteratorPrototype%': typeof Set === 'undefined' || !hasSymbols ? undefined$1 : getProto(new Set()[Symbol.iterator]()),
    	'%SharedArrayBuffer%': typeof SharedArrayBuffer === 'undefined' ? undefined$1 : SharedArrayBuffer,
    	'%String%': String,
    	'%StringIteratorPrototype%': hasSymbols ? getProto(''[Symbol.iterator]()) : undefined$1,
    	'%Symbol%': hasSymbols ? Symbol : undefined$1,
    	'%SyntaxError%': $SyntaxError,
    	'%ThrowTypeError%': ThrowTypeError,
    	'%TypedArray%': TypedArray,
    	'%TypeError%': $TypeError$1,
    	'%Uint8Array%': typeof Uint8Array === 'undefined' ? undefined$1 : Uint8Array,
    	'%Uint8ClampedArray%': typeof Uint8ClampedArray === 'undefined' ? undefined$1 : Uint8ClampedArray,
    	'%Uint16Array%': typeof Uint16Array === 'undefined' ? undefined$1 : Uint16Array,
    	'%Uint32Array%': typeof Uint32Array === 'undefined' ? undefined$1 : Uint32Array,
    	'%URIError%': URIError,
    	'%WeakMap%': typeof WeakMap === 'undefined' ? undefined$1 : WeakMap,
    	'%WeakRef%': typeof WeakRef === 'undefined' ? undefined$1 : WeakRef,
    	'%WeakSet%': typeof WeakSet === 'undefined' ? undefined$1 : WeakSet
    };

    var doEval = function doEval(name) {
    	var value;
    	if (name === '%AsyncFunction%') {
    		value = getEvalledConstructor('async function () {}');
    	} else if (name === '%GeneratorFunction%') {
    		value = getEvalledConstructor('function* () {}');
    	} else if (name === '%AsyncGeneratorFunction%') {
    		value = getEvalledConstructor('async function* () {}');
    	} else if (name === '%AsyncGenerator%') {
    		var fn = doEval('%AsyncGeneratorFunction%');
    		if (fn) {
    			value = fn.prototype;
    		}
    	} else if (name === '%AsyncIteratorPrototype%') {
    		var gen = doEval('%AsyncGenerator%');
    		if (gen) {
    			value = getProto(gen.prototype);
    		}
    	}

    	INTRINSICS[name] = value;

    	return value;
    };

    var LEGACY_ALIASES = {
    	'%ArrayBufferPrototype%': ['ArrayBuffer', 'prototype'],
    	'%ArrayPrototype%': ['Array', 'prototype'],
    	'%ArrayProto_entries%': ['Array', 'prototype', 'entries'],
    	'%ArrayProto_forEach%': ['Array', 'prototype', 'forEach'],
    	'%ArrayProto_keys%': ['Array', 'prototype', 'keys'],
    	'%ArrayProto_values%': ['Array', 'prototype', 'values'],
    	'%AsyncFunctionPrototype%': ['AsyncFunction', 'prototype'],
    	'%AsyncGenerator%': ['AsyncGeneratorFunction', 'prototype'],
    	'%AsyncGeneratorPrototype%': ['AsyncGeneratorFunction', 'prototype', 'prototype'],
    	'%BooleanPrototype%': ['Boolean', 'prototype'],
    	'%DataViewPrototype%': ['DataView', 'prototype'],
    	'%DatePrototype%': ['Date', 'prototype'],
    	'%ErrorPrototype%': ['Error', 'prototype'],
    	'%EvalErrorPrototype%': ['EvalError', 'prototype'],
    	'%Float32ArrayPrototype%': ['Float32Array', 'prototype'],
    	'%Float64ArrayPrototype%': ['Float64Array', 'prototype'],
    	'%FunctionPrototype%': ['Function', 'prototype'],
    	'%Generator%': ['GeneratorFunction', 'prototype'],
    	'%GeneratorPrototype%': ['GeneratorFunction', 'prototype', 'prototype'],
    	'%Int8ArrayPrototype%': ['Int8Array', 'prototype'],
    	'%Int16ArrayPrototype%': ['Int16Array', 'prototype'],
    	'%Int32ArrayPrototype%': ['Int32Array', 'prototype'],
    	'%JSONParse%': ['JSON', 'parse'],
    	'%JSONStringify%': ['JSON', 'stringify'],
    	'%MapPrototype%': ['Map', 'prototype'],
    	'%NumberPrototype%': ['Number', 'prototype'],
    	'%ObjectPrototype%': ['Object', 'prototype'],
    	'%ObjProto_toString%': ['Object', 'prototype', 'toString'],
    	'%ObjProto_valueOf%': ['Object', 'prototype', 'valueOf'],
    	'%PromisePrototype%': ['Promise', 'prototype'],
    	'%PromiseProto_then%': ['Promise', 'prototype', 'then'],
    	'%Promise_all%': ['Promise', 'all'],
    	'%Promise_reject%': ['Promise', 'reject'],
    	'%Promise_resolve%': ['Promise', 'resolve'],
    	'%RangeErrorPrototype%': ['RangeError', 'prototype'],
    	'%ReferenceErrorPrototype%': ['ReferenceError', 'prototype'],
    	'%RegExpPrototype%': ['RegExp', 'prototype'],
    	'%SetPrototype%': ['Set', 'prototype'],
    	'%SharedArrayBufferPrototype%': ['SharedArrayBuffer', 'prototype'],
    	'%StringPrototype%': ['String', 'prototype'],
    	'%SymbolPrototype%': ['Symbol', 'prototype'],
    	'%SyntaxErrorPrototype%': ['SyntaxError', 'prototype'],
    	'%TypedArrayPrototype%': ['TypedArray', 'prototype'],
    	'%TypeErrorPrototype%': ['TypeError', 'prototype'],
    	'%Uint8ArrayPrototype%': ['Uint8Array', 'prototype'],
    	'%Uint8ClampedArrayPrototype%': ['Uint8ClampedArray', 'prototype'],
    	'%Uint16ArrayPrototype%': ['Uint16Array', 'prototype'],
    	'%Uint32ArrayPrototype%': ['Uint32Array', 'prototype'],
    	'%URIErrorPrototype%': ['URIError', 'prototype'],
    	'%WeakMapPrototype%': ['WeakMap', 'prototype'],
    	'%WeakSetPrototype%': ['WeakSet', 'prototype']
    };



    var $concat = functionBind.call(Function.call, Array.prototype.concat);
    var $spliceApply = functionBind.call(Function.apply, Array.prototype.splice);
    var $replace = functionBind.call(Function.call, String.prototype.replace);
    var $strSlice = functionBind.call(Function.call, String.prototype.slice);

    /* adapted from https://github.com/lodash/lodash/blob/4.17.15/dist/lodash.js#L6735-L6744 */
    var rePropName = /[^%.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|%$))/g;
    var reEscapeChar = /\\(\\)?/g; /** Used to match backslashes in property paths. */
    var stringToPath = function stringToPath(string) {
    	var first = $strSlice(string, 0, 1);
    	var last = $strSlice(string, -1);
    	if (first === '%' && last !== '%') {
    		throw new $SyntaxError('invalid intrinsic syntax, expected closing `%`');
    	} else if (last === '%' && first !== '%') {
    		throw new $SyntaxError('invalid intrinsic syntax, expected opening `%`');
    	}
    	var result = [];
    	$replace(string, rePropName, function (match, number, quote, subString) {
    		result[result.length] = quote ? $replace(subString, reEscapeChar, '$1') : number || match;
    	});
    	return result;
    };
    /* end adaptation */

    var getBaseIntrinsic = function getBaseIntrinsic(name, allowMissing) {
    	var intrinsicName = name;
    	var alias;
    	if (src(LEGACY_ALIASES, intrinsicName)) {
    		alias = LEGACY_ALIASES[intrinsicName];
    		intrinsicName = '%' + alias[0] + '%';
    	}

    	if (src(INTRINSICS, intrinsicName)) {
    		var value = INTRINSICS[intrinsicName];
    		if (value === needsEval) {
    			value = doEval(intrinsicName);
    		}
    		if (typeof value === 'undefined' && !allowMissing) {
    			throw new $TypeError$1('intrinsic ' + name + ' exists, but is not available. Please file an issue!');
    		}

    		return {
    			alias: alias,
    			name: intrinsicName,
    			value: value
    		};
    	}

    	throw new $SyntaxError('intrinsic ' + name + ' does not exist!');
    };

    var getIntrinsic = function GetIntrinsic(name, allowMissing) {
    	if (typeof name !== 'string' || name.length === 0) {
    		throw new $TypeError$1('intrinsic name must be a non-empty string');
    	}
    	if (arguments.length > 1 && typeof allowMissing !== 'boolean') {
    		throw new $TypeError$1('"allowMissing" argument must be a boolean');
    	}

    	var parts = stringToPath(name);
    	var intrinsicBaseName = parts.length > 0 ? parts[0] : '';

    	var intrinsic = getBaseIntrinsic('%' + intrinsicBaseName + '%', allowMissing);
    	var intrinsicRealName = intrinsic.name;
    	var value = intrinsic.value;
    	var skipFurtherCaching = false;

    	var alias = intrinsic.alias;
    	if (alias) {
    		intrinsicBaseName = alias[0];
    		$spliceApply(parts, $concat([0, 1], alias));
    	}

    	for (var i = 1, isOwn = true; i < parts.length; i += 1) {
    		var part = parts[i];
    		var first = $strSlice(part, 0, 1);
    		var last = $strSlice(part, -1);
    		if (
    			(
    				(first === '"' || first === "'" || first === '`')
    				|| (last === '"' || last === "'" || last === '`')
    			)
    			&& first !== last
    		) {
    			throw new $SyntaxError('property names with quotes must have matching quotes');
    		}
    		if (part === 'constructor' || !isOwn) {
    			skipFurtherCaching = true;
    		}

    		intrinsicBaseName += '.' + part;
    		intrinsicRealName = '%' + intrinsicBaseName + '%';

    		if (src(INTRINSICS, intrinsicRealName)) {
    			value = INTRINSICS[intrinsicRealName];
    		} else if (value != null) {
    			if (!(part in value)) {
    				if (!allowMissing) {
    					throw new $TypeError$1('base intrinsic for ' + name + ' exists, but the property is not available.');
    				}
    				return void undefined$1;
    			}
    			if ($gOPD && (i + 1) >= parts.length) {
    				var desc = $gOPD(value, part);
    				isOwn = !!desc;

    				// By convention, when a data property is converted to an accessor
    				// property to emulate a data property that does not suffer from
    				// the override mistake, that accessor's getter is marked with
    				// an `originalValue` property. Here, when we detect this, we
    				// uphold the illusion by pretending to see that original data
    				// property, i.e., returning the value rather than the getter
    				// itself.
    				if (isOwn && 'get' in desc && !('originalValue' in desc.get)) {
    					value = desc.get;
    				} else {
    					value = value[part];
    				}
    			} else {
    				isOwn = src(value, part);
    				value = value[part];
    			}

    			if (isOwn && !skipFurtherCaching) {
    				INTRINSICS[intrinsicRealName] = value;
    			}
    		}
    	}
    	return value;
    };

    function getAugmentedNamespace(n) {
    	if (n.__esModule) return n;
    	var a = Object.defineProperty({}, '__esModule', {value: true});
    	Object.keys(n).forEach(function (k) {
    		var d = Object.getOwnPropertyDescriptor(n, k);
    		Object.defineProperty(a, k, d.get ? d : {
    			enumerable: true,
    			get: function () {
    				return n[k];
    			}
    		});
    	});
    	return a;
    }

    function createCommonjsModule(fn) {
      var module = { exports: {} };
    	return fn(module, module.exports), module.exports;
    }

    var callBind = createCommonjsModule(function (module) {




    var $apply = getIntrinsic('%Function.prototype.apply%');
    var $call = getIntrinsic('%Function.prototype.call%');
    var $reflectApply = getIntrinsic('%Reflect.apply%', true) || functionBind.call($call, $apply);

    var $gOPD = getIntrinsic('%Object.getOwnPropertyDescriptor%', true);
    var $defineProperty = getIntrinsic('%Object.defineProperty%', true);
    var $max = getIntrinsic('%Math.max%');

    if ($defineProperty) {
    	try {
    		$defineProperty({}, 'a', { value: 1 });
    	} catch (e) {
    		// IE 8 has a broken defineProperty
    		$defineProperty = null;
    	}
    }

    module.exports = function callBind(originalFunction) {
    	var func = $reflectApply(functionBind, $call, arguments);
    	if ($gOPD && $defineProperty) {
    		var desc = $gOPD(func, 'length');
    		if (desc.configurable) {
    			// original length, plus the receiver, minus any additional arguments (after the receiver)
    			$defineProperty(
    				func,
    				'length',
    				{ value: 1 + $max(0, originalFunction.length - (arguments.length - 1)) }
    			);
    		}
    	}
    	return func;
    };

    var applyBind = function applyBind() {
    	return $reflectApply(functionBind, $apply, arguments);
    };

    if ($defineProperty) {
    	$defineProperty(module.exports, 'apply', { value: applyBind });
    } else {
    	module.exports.apply = applyBind;
    }
    });

    var $indexOf = callBind(getIntrinsic('String.prototype.indexOf'));

    var callBound = function callBoundIntrinsic(name, allowMissing) {
    	var intrinsic = getIntrinsic(name, !!allowMissing);
    	if (typeof intrinsic === 'function' && $indexOf(name, '.prototype.') > -1) {
    		return callBind(intrinsic);
    	}
    	return intrinsic;
    };

    var _nodeResolve_empty = {};

    var _nodeResolve_empty$1 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        'default': _nodeResolve_empty
    });

    var require$$0 = /*@__PURE__*/getAugmentedNamespace(_nodeResolve_empty$1);

    var hasMap = typeof Map === 'function' && Map.prototype;
    var mapSizeDescriptor = Object.getOwnPropertyDescriptor && hasMap ? Object.getOwnPropertyDescriptor(Map.prototype, 'size') : null;
    var mapSize = hasMap && mapSizeDescriptor && typeof mapSizeDescriptor.get === 'function' ? mapSizeDescriptor.get : null;
    var mapForEach = hasMap && Map.prototype.forEach;
    var hasSet = typeof Set === 'function' && Set.prototype;
    var setSizeDescriptor = Object.getOwnPropertyDescriptor && hasSet ? Object.getOwnPropertyDescriptor(Set.prototype, 'size') : null;
    var setSize = hasSet && setSizeDescriptor && typeof setSizeDescriptor.get === 'function' ? setSizeDescriptor.get : null;
    var setForEach = hasSet && Set.prototype.forEach;
    var hasWeakMap = typeof WeakMap === 'function' && WeakMap.prototype;
    var weakMapHas = hasWeakMap ? WeakMap.prototype.has : null;
    var hasWeakSet = typeof WeakSet === 'function' && WeakSet.prototype;
    var weakSetHas = hasWeakSet ? WeakSet.prototype.has : null;
    var hasWeakRef = typeof WeakRef === 'function' && WeakRef.prototype;
    var weakRefDeref = hasWeakRef ? WeakRef.prototype.deref : null;
    var booleanValueOf = Boolean.prototype.valueOf;
    var objectToString = Object.prototype.toString;
    var functionToString = Function.prototype.toString;
    var match = String.prototype.match;
    var bigIntValueOf = typeof BigInt === 'function' ? BigInt.prototype.valueOf : null;
    var gOPS = Object.getOwnPropertySymbols;
    var symToString = typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol' ? Symbol.prototype.toString : null;
    var hasShammedSymbols = typeof Symbol === 'function' && typeof Symbol.iterator === 'object';
    var isEnumerable = Object.prototype.propertyIsEnumerable;

    var gPO = (typeof Reflect === 'function' ? Reflect.getPrototypeOf : Object.getPrototypeOf) || (
        [].__proto__ === Array.prototype // eslint-disable-line no-proto
            ? function (O) {
                return O.__proto__; // eslint-disable-line no-proto
            }
            : null
    );

    var inspectCustom = require$$0.custom;
    var inspectSymbol = inspectCustom && isSymbol(inspectCustom) ? inspectCustom : null;
    var toStringTag = typeof Symbol === 'function' && typeof Symbol.toStringTag !== 'undefined' ? Symbol.toStringTag : null;

    var objectInspect = function inspect_(obj, options, depth, seen) {
        var opts = options || {};

        if (has$3(opts, 'quoteStyle') && (opts.quoteStyle !== 'single' && opts.quoteStyle !== 'double')) {
            throw new TypeError('option "quoteStyle" must be "single" or "double"');
        }
        if (
            has$3(opts, 'maxStringLength') && (typeof opts.maxStringLength === 'number'
                ? opts.maxStringLength < 0 && opts.maxStringLength !== Infinity
                : opts.maxStringLength !== null
            )
        ) {
            throw new TypeError('option "maxStringLength", if provided, must be a positive integer, Infinity, or `null`');
        }
        var customInspect = has$3(opts, 'customInspect') ? opts.customInspect : true;
        if (typeof customInspect !== 'boolean') {
            throw new TypeError('option "customInspect", if provided, must be `true` or `false`');
        }

        if (
            has$3(opts, 'indent')
            && opts.indent !== null
            && opts.indent !== '\t'
            && !(parseInt(opts.indent, 10) === opts.indent && opts.indent > 0)
        ) {
            throw new TypeError('options "indent" must be "\\t", an integer > 0, or `null`');
        }

        if (typeof obj === 'undefined') {
            return 'undefined';
        }
        if (obj === null) {
            return 'null';
        }
        if (typeof obj === 'boolean') {
            return obj ? 'true' : 'false';
        }

        if (typeof obj === 'string') {
            return inspectString(obj, opts);
        }
        if (typeof obj === 'number') {
            if (obj === 0) {
                return Infinity / obj > 0 ? '0' : '-0';
            }
            return String(obj);
        }
        if (typeof obj === 'bigint') {
            return String(obj) + 'n';
        }

        var maxDepth = typeof opts.depth === 'undefined' ? 5 : opts.depth;
        if (typeof depth === 'undefined') { depth = 0; }
        if (depth >= maxDepth && maxDepth > 0 && typeof obj === 'object') {
            return isArray$3(obj) ? '[Array]' : '[Object]';
        }

        var indent = getIndent(opts, depth);

        if (typeof seen === 'undefined') {
            seen = [];
        } else if (indexOf(seen, obj) >= 0) {
            return '[Circular]';
        }

        function inspect(value, from, noIndent) {
            if (from) {
                seen = seen.slice();
                seen.push(from);
            }
            if (noIndent) {
                var newOpts = {
                    depth: opts.depth
                };
                if (has$3(opts, 'quoteStyle')) {
                    newOpts.quoteStyle = opts.quoteStyle;
                }
                return inspect_(value, newOpts, depth + 1, seen);
            }
            return inspect_(value, opts, depth + 1, seen);
        }

        if (typeof obj === 'function') {
            var name = nameOf(obj);
            var keys = arrObjKeys(obj, inspect);
            return '[Function' + (name ? ': ' + name : ' (anonymous)') + ']' + (keys.length > 0 ? ' { ' + keys.join(', ') + ' }' : '');
        }
        if (isSymbol(obj)) {
            var symString = hasShammedSymbols ? String(obj).replace(/^(Symbol\(.*\))_[^)]*$/, '$1') : symToString.call(obj);
            return typeof obj === 'object' && !hasShammedSymbols ? markBoxed(symString) : symString;
        }
        if (isElement(obj)) {
            var s = '<' + String(obj.nodeName).toLowerCase();
            var attrs = obj.attributes || [];
            for (var i = 0; i < attrs.length; i++) {
                s += ' ' + attrs[i].name + '=' + wrapQuotes(quote(attrs[i].value), 'double', opts);
            }
            s += '>';
            if (obj.childNodes && obj.childNodes.length) { s += '...'; }
            s += '</' + String(obj.nodeName).toLowerCase() + '>';
            return s;
        }
        if (isArray$3(obj)) {
            if (obj.length === 0) { return '[]'; }
            var xs = arrObjKeys(obj, inspect);
            if (indent && !singleLineValues(xs)) {
                return '[' + indentedJoin(xs, indent) + ']';
            }
            return '[ ' + xs.join(', ') + ' ]';
        }
        if (isError(obj)) {
            var parts = arrObjKeys(obj, inspect);
            if (parts.length === 0) { return '[' + String(obj) + ']'; }
            return '{ [' + String(obj) + '] ' + parts.join(', ') + ' }';
        }
        if (typeof obj === 'object' && customInspect) {
            if (inspectSymbol && typeof obj[inspectSymbol] === 'function') {
                return obj[inspectSymbol]();
            } else if (typeof obj.inspect === 'function') {
                return obj.inspect();
            }
        }
        if (isMap(obj)) {
            var mapParts = [];
            mapForEach.call(obj, function (value, key) {
                mapParts.push(inspect(key, obj, true) + ' => ' + inspect(value, obj));
            });
            return collectionOf('Map', mapSize.call(obj), mapParts, indent);
        }
        if (isSet(obj)) {
            var setParts = [];
            setForEach.call(obj, function (value) {
                setParts.push(inspect(value, obj));
            });
            return collectionOf('Set', setSize.call(obj), setParts, indent);
        }
        if (isWeakMap(obj)) {
            return weakCollectionOf('WeakMap');
        }
        if (isWeakSet(obj)) {
            return weakCollectionOf('WeakSet');
        }
        if (isWeakRef(obj)) {
            return weakCollectionOf('WeakRef');
        }
        if (isNumber(obj)) {
            return markBoxed(inspect(Number(obj)));
        }
        if (isBigInt(obj)) {
            return markBoxed(inspect(bigIntValueOf.call(obj)));
        }
        if (isBoolean(obj)) {
            return markBoxed(booleanValueOf.call(obj));
        }
        if (isString(obj)) {
            return markBoxed(inspect(String(obj)));
        }
        if (!isDate(obj) && !isRegExp$1(obj)) {
            var ys = arrObjKeys(obj, inspect);
            var isPlainObject = gPO ? gPO(obj) === Object.prototype : obj instanceof Object || obj.constructor === Object;
            var protoTag = obj instanceof Object ? '' : 'null prototype';
            var stringTag = !isPlainObject && toStringTag && Object(obj) === obj && toStringTag in obj ? toStr(obj).slice(8, -1) : protoTag ? 'Object' : '';
            var constructorTag = isPlainObject || typeof obj.constructor !== 'function' ? '' : obj.constructor.name ? obj.constructor.name + ' ' : '';
            var tag = constructorTag + (stringTag || protoTag ? '[' + [].concat(stringTag || [], protoTag || []).join(': ') + '] ' : '');
            if (ys.length === 0) { return tag + '{}'; }
            if (indent) {
                return tag + '{' + indentedJoin(ys, indent) + '}';
            }
            return tag + '{ ' + ys.join(', ') + ' }';
        }
        return String(obj);
    };

    function wrapQuotes(s, defaultStyle, opts) {
        var quoteChar = (opts.quoteStyle || defaultStyle) === 'double' ? '"' : "'";
        return quoteChar + s + quoteChar;
    }

    function quote(s) {
        return String(s).replace(/"/g, '&quot;');
    }

    function isArray$3(obj) { return toStr(obj) === '[object Array]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
    function isDate(obj) { return toStr(obj) === '[object Date]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
    function isRegExp$1(obj) { return toStr(obj) === '[object RegExp]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
    function isError(obj) { return toStr(obj) === '[object Error]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
    function isString(obj) { return toStr(obj) === '[object String]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
    function isNumber(obj) { return toStr(obj) === '[object Number]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
    function isBoolean(obj) { return toStr(obj) === '[object Boolean]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }

    // Symbol and BigInt do have Symbol.toStringTag by spec, so that can't be used to eliminate false positives
    function isSymbol(obj) {
        if (hasShammedSymbols) {
            return obj && typeof obj === 'object' && obj instanceof Symbol;
        }
        if (typeof obj === 'symbol') {
            return true;
        }
        if (!obj || typeof obj !== 'object' || !symToString) {
            return false;
        }
        try {
            symToString.call(obj);
            return true;
        } catch (e) {}
        return false;
    }

    function isBigInt(obj) {
        if (!obj || typeof obj !== 'object' || !bigIntValueOf) {
            return false;
        }
        try {
            bigIntValueOf.call(obj);
            return true;
        } catch (e) {}
        return false;
    }

    var hasOwn = Object.prototype.hasOwnProperty || function (key) { return key in this; };
    function has$3(obj, key) {
        return hasOwn.call(obj, key);
    }

    function toStr(obj) {
        return objectToString.call(obj);
    }

    function nameOf(f) {
        if (f.name) { return f.name; }
        var m = match.call(functionToString.call(f), /^function\s*([\w$]+)/);
        if (m) { return m[1]; }
        return null;
    }

    function indexOf(xs, x) {
        if (xs.indexOf) { return xs.indexOf(x); }
        for (var i = 0, l = xs.length; i < l; i++) {
            if (xs[i] === x) { return i; }
        }
        return -1;
    }

    function isMap(x) {
        if (!mapSize || !x || typeof x !== 'object') {
            return false;
        }
        try {
            mapSize.call(x);
            try {
                setSize.call(x);
            } catch (s) {
                return true;
            }
            return x instanceof Map; // core-js workaround, pre-v2.5.0
        } catch (e) {}
        return false;
    }

    function isWeakMap(x) {
        if (!weakMapHas || !x || typeof x !== 'object') {
            return false;
        }
        try {
            weakMapHas.call(x, weakMapHas);
            try {
                weakSetHas.call(x, weakSetHas);
            } catch (s) {
                return true;
            }
            return x instanceof WeakMap; // core-js workaround, pre-v2.5.0
        } catch (e) {}
        return false;
    }

    function isWeakRef(x) {
        if (!weakRefDeref || !x || typeof x !== 'object') {
            return false;
        }
        try {
            weakRefDeref.call(x);
            return true;
        } catch (e) {}
        return false;
    }

    function isSet(x) {
        if (!setSize || !x || typeof x !== 'object') {
            return false;
        }
        try {
            setSize.call(x);
            try {
                mapSize.call(x);
            } catch (m) {
                return true;
            }
            return x instanceof Set; // core-js workaround, pre-v2.5.0
        } catch (e) {}
        return false;
    }

    function isWeakSet(x) {
        if (!weakSetHas || !x || typeof x !== 'object') {
            return false;
        }
        try {
            weakSetHas.call(x, weakSetHas);
            try {
                weakMapHas.call(x, weakMapHas);
            } catch (s) {
                return true;
            }
            return x instanceof WeakSet; // core-js workaround, pre-v2.5.0
        } catch (e) {}
        return false;
    }

    function isElement(x) {
        if (!x || typeof x !== 'object') { return false; }
        if (typeof HTMLElement !== 'undefined' && x instanceof HTMLElement) {
            return true;
        }
        return typeof x.nodeName === 'string' && typeof x.getAttribute === 'function';
    }

    function inspectString(str, opts) {
        if (str.length > opts.maxStringLength) {
            var remaining = str.length - opts.maxStringLength;
            var trailer = '... ' + remaining + ' more character' + (remaining > 1 ? 's' : '');
            return inspectString(str.slice(0, opts.maxStringLength), opts) + trailer;
        }
        // eslint-disable-next-line no-control-regex
        var s = str.replace(/(['\\])/g, '\\$1').replace(/[\x00-\x1f]/g, lowbyte);
        return wrapQuotes(s, 'single', opts);
    }

    function lowbyte(c) {
        var n = c.charCodeAt(0);
        var x = {
            8: 'b',
            9: 't',
            10: 'n',
            12: 'f',
            13: 'r'
        }[n];
        if (x) { return '\\' + x; }
        return '\\x' + (n < 0x10 ? '0' : '') + n.toString(16).toUpperCase();
    }

    function markBoxed(str) {
        return 'Object(' + str + ')';
    }

    function weakCollectionOf(type) {
        return type + ' { ? }';
    }

    function collectionOf(type, size, entries, indent) {
        var joinedEntries = indent ? indentedJoin(entries, indent) : entries.join(', ');
        return type + ' (' + size + ') {' + joinedEntries + '}';
    }

    function singleLineValues(xs) {
        for (var i = 0; i < xs.length; i++) {
            if (indexOf(xs[i], '\n') >= 0) {
                return false;
            }
        }
        return true;
    }

    function getIndent(opts, depth) {
        var baseIndent;
        if (opts.indent === '\t') {
            baseIndent = '\t';
        } else if (typeof opts.indent === 'number' && opts.indent > 0) {
            baseIndent = Array(opts.indent + 1).join(' ');
        } else {
            return null;
        }
        return {
            base: baseIndent,
            prev: Array(depth + 1).join(baseIndent)
        };
    }

    function indentedJoin(xs, indent) {
        if (xs.length === 0) { return ''; }
        var lineJoiner = '\n' + indent.prev + indent.base;
        return lineJoiner + xs.join(',' + lineJoiner) + '\n' + indent.prev;
    }

    function arrObjKeys(obj, inspect) {
        var isArr = isArray$3(obj);
        var xs = [];
        if (isArr) {
            xs.length = obj.length;
            for (var i = 0; i < obj.length; i++) {
                xs[i] = has$3(obj, i) ? inspect(obj[i], obj) : '';
            }
        }
        var syms = typeof gOPS === 'function' ? gOPS(obj) : [];
        var symMap;
        if (hasShammedSymbols) {
            symMap = {};
            for (var k = 0; k < syms.length; k++) {
                symMap['$' + syms[k]] = syms[k];
            }
        }

        for (var key in obj) { // eslint-disable-line no-restricted-syntax
            if (!has$3(obj, key)) { continue; } // eslint-disable-line no-restricted-syntax, no-continue
            if (isArr && String(Number(key)) === key && key < obj.length) { continue; } // eslint-disable-line no-restricted-syntax, no-continue
            if (hasShammedSymbols && symMap['$' + key] instanceof Symbol) {
                // this is to prevent shammed Symbols, which are stored as strings, from being included in the string key section
                continue; // eslint-disable-line no-restricted-syntax, no-continue
            } else if ((/[^\w$]/).test(key)) {
                xs.push(inspect(key, obj) + ': ' + inspect(obj[key], obj));
            } else {
                xs.push(key + ': ' + inspect(obj[key], obj));
            }
        }
        if (typeof gOPS === 'function') {
            for (var j = 0; j < syms.length; j++) {
                if (isEnumerable.call(obj, syms[j])) {
                    xs.push('[' + inspect(syms[j]) + ']: ' + inspect(obj[syms[j]], obj));
                }
            }
        }
        return xs;
    }

    var $TypeError = getIntrinsic('%TypeError%');
    var $WeakMap = getIntrinsic('%WeakMap%', true);
    var $Map = getIntrinsic('%Map%', true);

    var $weakMapGet = callBound('WeakMap.prototype.get', true);
    var $weakMapSet = callBound('WeakMap.prototype.set', true);
    var $weakMapHas = callBound('WeakMap.prototype.has', true);
    var $mapGet = callBound('Map.prototype.get', true);
    var $mapSet = callBound('Map.prototype.set', true);
    var $mapHas = callBound('Map.prototype.has', true);

    /*
     * This function traverses the list returning the node corresponding to the
     * given key.
     *
     * That node is also moved to the head of the list, so that if it's accessed
     * again we don't need to traverse the whole list. By doing so, all the recently
     * used nodes can be accessed relatively quickly.
     */
    var listGetNode = function (list, key) { // eslint-disable-line consistent-return
    	for (var prev = list, curr; (curr = prev.next) !== null; prev = curr) {
    		if (curr.key === key) {
    			prev.next = curr.next;
    			curr.next = list.next;
    			list.next = curr; // eslint-disable-line no-param-reassign
    			return curr;
    		}
    	}
    };

    var listGet = function (objects, key) {
    	var node = listGetNode(objects, key);
    	return node && node.value;
    };
    var listSet = function (objects, key, value) {
    	var node = listGetNode(objects, key);
    	if (node) {
    		node.value = value;
    	} else {
    		// Prepend the new node to the beginning of the list
    		objects.next = { // eslint-disable-line no-param-reassign
    			key: key,
    			next: objects.next,
    			value: value
    		};
    	}
    };
    var listHas = function (objects, key) {
    	return !!listGetNode(objects, key);
    };

    var sideChannel = function getSideChannel() {
    	var $wm;
    	var $m;
    	var $o;
    	var channel = {
    		assert: function (key) {
    			if (!channel.has(key)) {
    				throw new $TypeError('Side channel does not contain ' + objectInspect(key));
    			}
    		},
    		get: function (key) { // eslint-disable-line consistent-return
    			if ($WeakMap && key && (typeof key === 'object' || typeof key === 'function')) {
    				if ($wm) {
    					return $weakMapGet($wm, key);
    				}
    			} else if ($Map) {
    				if ($m) {
    					return $mapGet($m, key);
    				}
    			} else {
    				if ($o) { // eslint-disable-line no-lonely-if
    					return listGet($o, key);
    				}
    			}
    		},
    		has: function (key) {
    			if ($WeakMap && key && (typeof key === 'object' || typeof key === 'function')) {
    				if ($wm) {
    					return $weakMapHas($wm, key);
    				}
    			} else if ($Map) {
    				if ($m) {
    					return $mapHas($m, key);
    				}
    			} else {
    				if ($o) { // eslint-disable-line no-lonely-if
    					return listHas($o, key);
    				}
    			}
    			return false;
    		},
    		set: function (key, value) {
    			if ($WeakMap && key && (typeof key === 'object' || typeof key === 'function')) {
    				if (!$wm) {
    					$wm = new $WeakMap();
    				}
    				$weakMapSet($wm, key, value);
    			} else if ($Map) {
    				if (!$m) {
    					$m = new $Map();
    				}
    				$mapSet($m, key, value);
    			} else {
    				if (!$o) {
    					/*
    					 * Initialize the linked list as an empty node, so that we don't have
    					 * to special-case handling of the first node: we can always refer to
    					 * it as (previous node).next, instead of something like (list).head
    					 */
    					$o = { key: {}, next: null };
    				}
    				listSet($o, key, value);
    			}
    		}
    	};
    	return channel;
    };

    var replace = String.prototype.replace;
    var percentTwenties = /%20/g;

    var Format = {
        RFC1738: 'RFC1738',
        RFC3986: 'RFC3986'
    };

    var formats = {
        'default': Format.RFC3986,
        formatters: {
            RFC1738: function (value) {
                return replace.call(value, percentTwenties, '+');
            },
            RFC3986: function (value) {
                return String(value);
            }
        },
        RFC1738: Format.RFC1738,
        RFC3986: Format.RFC3986
    };

    var has$2 = Object.prototype.hasOwnProperty;
    var isArray$2 = Array.isArray;

    var hexTable = (function () {
        var array = [];
        for (var i = 0; i < 256; ++i) {
            array.push('%' + ((i < 16 ? '0' : '') + i.toString(16)).toUpperCase());
        }

        return array;
    }());

    var compactQueue = function compactQueue(queue) {
        while (queue.length > 1) {
            var item = queue.pop();
            var obj = item.obj[item.prop];

            if (isArray$2(obj)) {
                var compacted = [];

                for (var j = 0; j < obj.length; ++j) {
                    if (typeof obj[j] !== 'undefined') {
                        compacted.push(obj[j]);
                    }
                }

                item.obj[item.prop] = compacted;
            }
        }
    };

    var arrayToObject = function arrayToObject(source, options) {
        var obj = options && options.plainObjects ? Object.create(null) : {};
        for (var i = 0; i < source.length; ++i) {
            if (typeof source[i] !== 'undefined') {
                obj[i] = source[i];
            }
        }

        return obj;
    };

    var merge = function merge(target, source, options) {
        /* eslint no-param-reassign: 0 */
        if (!source) {
            return target;
        }

        if (typeof source !== 'object') {
            if (isArray$2(target)) {
                target.push(source);
            } else if (target && typeof target === 'object') {
                if ((options && (options.plainObjects || options.allowPrototypes)) || !has$2.call(Object.prototype, source)) {
                    target[source] = true;
                }
            } else {
                return [target, source];
            }

            return target;
        }

        if (!target || typeof target !== 'object') {
            return [target].concat(source);
        }

        var mergeTarget = target;
        if (isArray$2(target) && !isArray$2(source)) {
            mergeTarget = arrayToObject(target, options);
        }

        if (isArray$2(target) && isArray$2(source)) {
            source.forEach(function (item, i) {
                if (has$2.call(target, i)) {
                    var targetItem = target[i];
                    if (targetItem && typeof targetItem === 'object' && item && typeof item === 'object') {
                        target[i] = merge(targetItem, item, options);
                    } else {
                        target.push(item);
                    }
                } else {
                    target[i] = item;
                }
            });
            return target;
        }

        return Object.keys(source).reduce(function (acc, key) {
            var value = source[key];

            if (has$2.call(acc, key)) {
                acc[key] = merge(acc[key], value, options);
            } else {
                acc[key] = value;
            }
            return acc;
        }, mergeTarget);
    };

    var assign = function assignSingleSource(target, source) {
        return Object.keys(source).reduce(function (acc, key) {
            acc[key] = source[key];
            return acc;
        }, target);
    };

    var decode = function (str, decoder, charset) {
        var strWithoutPlus = str.replace(/\+/g, ' ');
        if (charset === 'iso-8859-1') {
            // unescape never throws, no try...catch needed:
            return strWithoutPlus.replace(/%[0-9a-f]{2}/gi, unescape);
        }
        // utf-8
        try {
            return decodeURIComponent(strWithoutPlus);
        } catch (e) {
            return strWithoutPlus;
        }
    };

    var encode = function encode(str, defaultEncoder, charset, kind, format) {
        // This code was originally written by Brian White (mscdex) for the io.js core querystring library.
        // It has been adapted here for stricter adherence to RFC 3986
        if (str.length === 0) {
            return str;
        }

        var string = str;
        if (typeof str === 'symbol') {
            string = Symbol.prototype.toString.call(str);
        } else if (typeof str !== 'string') {
            string = String(str);
        }

        if (charset === 'iso-8859-1') {
            return escape(string).replace(/%u[0-9a-f]{4}/gi, function ($0) {
                return '%26%23' + parseInt($0.slice(2), 16) + '%3B';
            });
        }

        var out = '';
        for (var i = 0; i < string.length; ++i) {
            var c = string.charCodeAt(i);

            if (
                c === 0x2D // -
                || c === 0x2E // .
                || c === 0x5F // _
                || c === 0x7E // ~
                || (c >= 0x30 && c <= 0x39) // 0-9
                || (c >= 0x41 && c <= 0x5A) // a-z
                || (c >= 0x61 && c <= 0x7A) // A-Z
                || (format === formats.RFC1738 && (c === 0x28 || c === 0x29)) // ( )
            ) {
                out += string.charAt(i);
                continue;
            }

            if (c < 0x80) {
                out = out + hexTable[c];
                continue;
            }

            if (c < 0x800) {
                out = out + (hexTable[0xC0 | (c >> 6)] + hexTable[0x80 | (c & 0x3F)]);
                continue;
            }

            if (c < 0xD800 || c >= 0xE000) {
                out = out + (hexTable[0xE0 | (c >> 12)] + hexTable[0x80 | ((c >> 6) & 0x3F)] + hexTable[0x80 | (c & 0x3F)]);
                continue;
            }

            i += 1;
            c = 0x10000 + (((c & 0x3FF) << 10) | (string.charCodeAt(i) & 0x3FF));
            out += hexTable[0xF0 | (c >> 18)]
                + hexTable[0x80 | ((c >> 12) & 0x3F)]
                + hexTable[0x80 | ((c >> 6) & 0x3F)]
                + hexTable[0x80 | (c & 0x3F)];
        }

        return out;
    };

    var compact = function compact(value) {
        var queue = [{ obj: { o: value }, prop: 'o' }];
        var refs = [];

        for (var i = 0; i < queue.length; ++i) {
            var item = queue[i];
            var obj = item.obj[item.prop];

            var keys = Object.keys(obj);
            for (var j = 0; j < keys.length; ++j) {
                var key = keys[j];
                var val = obj[key];
                if (typeof val === 'object' && val !== null && refs.indexOf(val) === -1) {
                    queue.push({ obj: obj, prop: key });
                    refs.push(val);
                }
            }
        }

        compactQueue(queue);

        return value;
    };

    var isRegExp = function isRegExp(obj) {
        return Object.prototype.toString.call(obj) === '[object RegExp]';
    };

    var isBuffer = function isBuffer(obj) {
        if (!obj || typeof obj !== 'object') {
            return false;
        }

        return !!(obj.constructor && obj.constructor.isBuffer && obj.constructor.isBuffer(obj));
    };

    var combine = function combine(a, b) {
        return [].concat(a, b);
    };

    var maybeMap = function maybeMap(val, fn) {
        if (isArray$2(val)) {
            var mapped = [];
            for (var i = 0; i < val.length; i += 1) {
                mapped.push(fn(val[i]));
            }
            return mapped;
        }
        return fn(val);
    };

    var utils = {
        arrayToObject: arrayToObject,
        assign: assign,
        combine: combine,
        compact: compact,
        decode: decode,
        encode: encode,
        isBuffer: isBuffer,
        isRegExp: isRegExp,
        maybeMap: maybeMap,
        merge: merge
    };

    var has$1 = Object.prototype.hasOwnProperty;

    var arrayPrefixGenerators = {
        brackets: function brackets(prefix) {
            return prefix + '[]';
        },
        comma: 'comma',
        indices: function indices(prefix, key) {
            return prefix + '[' + key + ']';
        },
        repeat: function repeat(prefix) {
            return prefix;
        }
    };

    var isArray$1 = Array.isArray;
    var push = Array.prototype.push;
    var pushToArray = function (arr, valueOrArray) {
        push.apply(arr, isArray$1(valueOrArray) ? valueOrArray : [valueOrArray]);
    };

    var toISO = Date.prototype.toISOString;

    var defaultFormat = formats['default'];
    var defaults$1 = {
        addQueryPrefix: false,
        allowDots: false,
        charset: 'utf-8',
        charsetSentinel: false,
        delimiter: '&',
        encode: true,
        encoder: utils.encode,
        encodeValuesOnly: false,
        format: defaultFormat,
        formatter: formats.formatters[defaultFormat],
        // deprecated
        indices: false,
        serializeDate: function serializeDate(date) {
            return toISO.call(date);
        },
        skipNulls: false,
        strictNullHandling: false
    };

    var isNonNullishPrimitive = function isNonNullishPrimitive(v) {
        return typeof v === 'string'
            || typeof v === 'number'
            || typeof v === 'boolean'
            || typeof v === 'symbol'
            || typeof v === 'bigint';
    };

    var stringify = function stringify(
        object,
        prefix,
        generateArrayPrefix,
        strictNullHandling,
        skipNulls,
        encoder,
        filter,
        sort,
        allowDots,
        serializeDate,
        format,
        formatter,
        encodeValuesOnly,
        charset,
        sideChannel$1
    ) {
        var obj = object;

        if (sideChannel$1.has(object)) {
            throw new RangeError('Cyclic object value');
        }

        if (typeof filter === 'function') {
            obj = filter(prefix, obj);
        } else if (obj instanceof Date) {
            obj = serializeDate(obj);
        } else if (generateArrayPrefix === 'comma' && isArray$1(obj)) {
            obj = utils.maybeMap(obj, function (value) {
                if (value instanceof Date) {
                    return serializeDate(value);
                }
                return value;
            });
        }

        if (obj === null) {
            if (strictNullHandling) {
                return encoder && !encodeValuesOnly ? encoder(prefix, defaults$1.encoder, charset, 'key', format) : prefix;
            }

            obj = '';
        }

        if (isNonNullishPrimitive(obj) || utils.isBuffer(obj)) {
            if (encoder) {
                var keyValue = encodeValuesOnly ? prefix : encoder(prefix, defaults$1.encoder, charset, 'key', format);
                return [formatter(keyValue) + '=' + formatter(encoder(obj, defaults$1.encoder, charset, 'value', format))];
            }
            return [formatter(prefix) + '=' + formatter(String(obj))];
        }

        var values = [];

        if (typeof obj === 'undefined') {
            return values;
        }

        var objKeys;
        if (generateArrayPrefix === 'comma' && isArray$1(obj)) {
            // we need to join elements in
            objKeys = [{ value: obj.length > 0 ? obj.join(',') || null : undefined }];
        } else if (isArray$1(filter)) {
            objKeys = filter;
        } else {
            var keys = Object.keys(obj);
            objKeys = sort ? keys.sort(sort) : keys;
        }

        for (var i = 0; i < objKeys.length; ++i) {
            var key = objKeys[i];
            var value = typeof key === 'object' && key.value !== undefined ? key.value : obj[key];

            if (skipNulls && value === null) {
                continue;
            }

            var keyPrefix = isArray$1(obj)
                ? typeof generateArrayPrefix === 'function' ? generateArrayPrefix(prefix, key) : prefix
                : prefix + (allowDots ? '.' + key : '[' + key + ']');

            sideChannel$1.set(object, true);
            var valueSideChannel = sideChannel();
            pushToArray(values, stringify(
                value,
                keyPrefix,
                generateArrayPrefix,
                strictNullHandling,
                skipNulls,
                encoder,
                filter,
                sort,
                allowDots,
                serializeDate,
                format,
                formatter,
                encodeValuesOnly,
                charset,
                valueSideChannel
            ));
        }

        return values;
    };

    var normalizeStringifyOptions = function normalizeStringifyOptions(opts) {
        if (!opts) {
            return defaults$1;
        }

        if (opts.encoder !== null && opts.encoder !== undefined && typeof opts.encoder !== 'function') {
            throw new TypeError('Encoder has to be a function.');
        }

        var charset = opts.charset || defaults$1.charset;
        if (typeof opts.charset !== 'undefined' && opts.charset !== 'utf-8' && opts.charset !== 'iso-8859-1') {
            throw new TypeError('The charset option must be either utf-8, iso-8859-1, or undefined');
        }

        var format = formats['default'];
        if (typeof opts.format !== 'undefined') {
            if (!has$1.call(formats.formatters, opts.format)) {
                throw new TypeError('Unknown format option provided.');
            }
            format = opts.format;
        }
        var formatter = formats.formatters[format];

        var filter = defaults$1.filter;
        if (typeof opts.filter === 'function' || isArray$1(opts.filter)) {
            filter = opts.filter;
        }

        return {
            addQueryPrefix: typeof opts.addQueryPrefix === 'boolean' ? opts.addQueryPrefix : defaults$1.addQueryPrefix,
            allowDots: typeof opts.allowDots === 'undefined' ? defaults$1.allowDots : !!opts.allowDots,
            charset: charset,
            charsetSentinel: typeof opts.charsetSentinel === 'boolean' ? opts.charsetSentinel : defaults$1.charsetSentinel,
            delimiter: typeof opts.delimiter === 'undefined' ? defaults$1.delimiter : opts.delimiter,
            encode: typeof opts.encode === 'boolean' ? opts.encode : defaults$1.encode,
            encoder: typeof opts.encoder === 'function' ? opts.encoder : defaults$1.encoder,
            encodeValuesOnly: typeof opts.encodeValuesOnly === 'boolean' ? opts.encodeValuesOnly : defaults$1.encodeValuesOnly,
            filter: filter,
            format: format,
            formatter: formatter,
            serializeDate: typeof opts.serializeDate === 'function' ? opts.serializeDate : defaults$1.serializeDate,
            skipNulls: typeof opts.skipNulls === 'boolean' ? opts.skipNulls : defaults$1.skipNulls,
            sort: typeof opts.sort === 'function' ? opts.sort : null,
            strictNullHandling: typeof opts.strictNullHandling === 'boolean' ? opts.strictNullHandling : defaults$1.strictNullHandling
        };
    };

    var stringify_1 = function (object, opts) {
        var obj = object;
        var options = normalizeStringifyOptions(opts);

        var objKeys;
        var filter;

        if (typeof options.filter === 'function') {
            filter = options.filter;
            obj = filter('', obj);
        } else if (isArray$1(options.filter)) {
            filter = options.filter;
            objKeys = filter;
        }

        var keys = [];

        if (typeof obj !== 'object' || obj === null) {
            return '';
        }

        var arrayFormat;
        if (opts && opts.arrayFormat in arrayPrefixGenerators) {
            arrayFormat = opts.arrayFormat;
        } else if (opts && 'indices' in opts) {
            arrayFormat = opts.indices ? 'indices' : 'repeat';
        } else {
            arrayFormat = 'indices';
        }

        var generateArrayPrefix = arrayPrefixGenerators[arrayFormat];

        if (!objKeys) {
            objKeys = Object.keys(obj);
        }

        if (options.sort) {
            objKeys.sort(options.sort);
        }

        var sideChannel$1 = sideChannel();
        for (var i = 0; i < objKeys.length; ++i) {
            var key = objKeys[i];

            if (options.skipNulls && obj[key] === null) {
                continue;
            }
            pushToArray(keys, stringify(
                obj[key],
                key,
                generateArrayPrefix,
                options.strictNullHandling,
                options.skipNulls,
                options.encode ? options.encoder : null,
                options.filter,
                options.sort,
                options.allowDots,
                options.serializeDate,
                options.format,
                options.formatter,
                options.encodeValuesOnly,
                options.charset,
                sideChannel$1
            ));
        }

        var joined = keys.join(options.delimiter);
        var prefix = options.addQueryPrefix === true ? '?' : '';

        if (options.charsetSentinel) {
            if (options.charset === 'iso-8859-1') {
                // encodeURIComponent('&#10003;'), the "numeric entity" representation of a checkmark
                prefix += 'utf8=%26%2310003%3B&';
            } else {
                // encodeURIComponent('✓')
                prefix += 'utf8=%E2%9C%93&';
            }
        }

        return joined.length > 0 ? prefix + joined : '';
    };

    var has = Object.prototype.hasOwnProperty;
    var isArray = Array.isArray;

    var defaults = {
        allowDots: false,
        allowPrototypes: false,
        allowSparse: false,
        arrayLimit: 20,
        charset: 'utf-8',
        charsetSentinel: false,
        comma: false,
        decoder: utils.decode,
        delimiter: '&',
        depth: 5,
        ignoreQueryPrefix: false,
        interpretNumericEntities: false,
        parameterLimit: 1000,
        parseArrays: true,
        plainObjects: false,
        strictNullHandling: false
    };

    var interpretNumericEntities = function (str) {
        return str.replace(/&#(\d+);/g, function ($0, numberStr) {
            return String.fromCharCode(parseInt(numberStr, 10));
        });
    };

    var parseArrayValue = function (val, options) {
        if (val && typeof val === 'string' && options.comma && val.indexOf(',') > -1) {
            return val.split(',');
        }

        return val;
    };

    // This is what browsers will submit when the ✓ character occurs in an
    // application/x-www-form-urlencoded body and the encoding of the page containing
    // the form is iso-8859-1, or when the submitted form has an accept-charset
    // attribute of iso-8859-1. Presumably also with other charsets that do not contain
    // the ✓ character, such as us-ascii.
    var isoSentinel = 'utf8=%26%2310003%3B'; // encodeURIComponent('&#10003;')

    // These are the percent-encoded utf-8 octets representing a checkmark, indicating that the request actually is utf-8 encoded.
    var charsetSentinel = 'utf8=%E2%9C%93'; // encodeURIComponent('✓')

    var parseValues = function parseQueryStringValues(str, options) {
        var obj = {};
        var cleanStr = options.ignoreQueryPrefix ? str.replace(/^\?/, '') : str;
        var limit = options.parameterLimit === Infinity ? undefined : options.parameterLimit;
        var parts = cleanStr.split(options.delimiter, limit);
        var skipIndex = -1; // Keep track of where the utf8 sentinel was found
        var i;

        var charset = options.charset;
        if (options.charsetSentinel) {
            for (i = 0; i < parts.length; ++i) {
                if (parts[i].indexOf('utf8=') === 0) {
                    if (parts[i] === charsetSentinel) {
                        charset = 'utf-8';
                    } else if (parts[i] === isoSentinel) {
                        charset = 'iso-8859-1';
                    }
                    skipIndex = i;
                    i = parts.length; // The eslint settings do not allow break;
                }
            }
        }

        for (i = 0; i < parts.length; ++i) {
            if (i === skipIndex) {
                continue;
            }
            var part = parts[i];

            var bracketEqualsPos = part.indexOf(']=');
            var pos = bracketEqualsPos === -1 ? part.indexOf('=') : bracketEqualsPos + 1;

            var key, val;
            if (pos === -1) {
                key = options.decoder(part, defaults.decoder, charset, 'key');
                val = options.strictNullHandling ? null : '';
            } else {
                key = options.decoder(part.slice(0, pos), defaults.decoder, charset, 'key');
                val = utils.maybeMap(
                    parseArrayValue(part.slice(pos + 1), options),
                    function (encodedVal) {
                        return options.decoder(encodedVal, defaults.decoder, charset, 'value');
                    }
                );
            }

            if (val && options.interpretNumericEntities && charset === 'iso-8859-1') {
                val = interpretNumericEntities(val);
            }

            if (part.indexOf('[]=') > -1) {
                val = isArray(val) ? [val] : val;
            }

            if (has.call(obj, key)) {
                obj[key] = utils.combine(obj[key], val);
            } else {
                obj[key] = val;
            }
        }

        return obj;
    };

    var parseObject = function (chain, val, options, valuesParsed) {
        var leaf = valuesParsed ? val : parseArrayValue(val, options);

        for (var i = chain.length - 1; i >= 0; --i) {
            var obj;
            var root = chain[i];

            if (root === '[]' && options.parseArrays) {
                obj = [].concat(leaf);
            } else {
                obj = options.plainObjects ? Object.create(null) : {};
                var cleanRoot = root.charAt(0) === '[' && root.charAt(root.length - 1) === ']' ? root.slice(1, -1) : root;
                var index = parseInt(cleanRoot, 10);
                if (!options.parseArrays && cleanRoot === '') {
                    obj = { 0: leaf };
                } else if (
                    !isNaN(index)
                    && root !== cleanRoot
                    && String(index) === cleanRoot
                    && index >= 0
                    && (options.parseArrays && index <= options.arrayLimit)
                ) {
                    obj = [];
                    obj[index] = leaf;
                } else {
                    obj[cleanRoot] = leaf;
                }
            }

            leaf = obj;
        }

        return leaf;
    };

    var parseKeys = function parseQueryStringKeys(givenKey, val, options, valuesParsed) {
        if (!givenKey) {
            return;
        }

        // Transform dot notation to bracket notation
        var key = options.allowDots ? givenKey.replace(/\.([^.[]+)/g, '[$1]') : givenKey;

        // The regex chunks

        var brackets = /(\[[^[\]]*])/;
        var child = /(\[[^[\]]*])/g;

        // Get the parent

        var segment = options.depth > 0 && brackets.exec(key);
        var parent = segment ? key.slice(0, segment.index) : key;

        // Stash the parent if it exists

        var keys = [];
        if (parent) {
            // If we aren't using plain objects, optionally prefix keys that would overwrite object prototype properties
            if (!options.plainObjects && has.call(Object.prototype, parent)) {
                if (!options.allowPrototypes) {
                    return;
                }
            }

            keys.push(parent);
        }

        // Loop through children appending to the array until we hit depth

        var i = 0;
        while (options.depth > 0 && (segment = child.exec(key)) !== null && i < options.depth) {
            i += 1;
            if (!options.plainObjects && has.call(Object.prototype, segment[1].slice(1, -1))) {
                if (!options.allowPrototypes) {
                    return;
                }
            }
            keys.push(segment[1]);
        }

        // If there's a remainder, just add whatever is left

        if (segment) {
            keys.push('[' + key.slice(segment.index) + ']');
        }

        return parseObject(keys, val, options, valuesParsed);
    };

    var normalizeParseOptions = function normalizeParseOptions(opts) {
        if (!opts) {
            return defaults;
        }

        if (opts.decoder !== null && opts.decoder !== undefined && typeof opts.decoder !== 'function') {
            throw new TypeError('Decoder has to be a function.');
        }

        if (typeof opts.charset !== 'undefined' && opts.charset !== 'utf-8' && opts.charset !== 'iso-8859-1') {
            throw new TypeError('The charset option must be either utf-8, iso-8859-1, or undefined');
        }
        var charset = typeof opts.charset === 'undefined' ? defaults.charset : opts.charset;

        return {
            allowDots: typeof opts.allowDots === 'undefined' ? defaults.allowDots : !!opts.allowDots,
            allowPrototypes: typeof opts.allowPrototypes === 'boolean' ? opts.allowPrototypes : defaults.allowPrototypes,
            allowSparse: typeof opts.allowSparse === 'boolean' ? opts.allowSparse : defaults.allowSparse,
            arrayLimit: typeof opts.arrayLimit === 'number' ? opts.arrayLimit : defaults.arrayLimit,
            charset: charset,
            charsetSentinel: typeof opts.charsetSentinel === 'boolean' ? opts.charsetSentinel : defaults.charsetSentinel,
            comma: typeof opts.comma === 'boolean' ? opts.comma : defaults.comma,
            decoder: typeof opts.decoder === 'function' ? opts.decoder : defaults.decoder,
            delimiter: typeof opts.delimiter === 'string' || utils.isRegExp(opts.delimiter) ? opts.delimiter : defaults.delimiter,
            // eslint-disable-next-line no-implicit-coercion, no-extra-parens
            depth: (typeof opts.depth === 'number' || opts.depth === false) ? +opts.depth : defaults.depth,
            ignoreQueryPrefix: opts.ignoreQueryPrefix === true,
            interpretNumericEntities: typeof opts.interpretNumericEntities === 'boolean' ? opts.interpretNumericEntities : defaults.interpretNumericEntities,
            parameterLimit: typeof opts.parameterLimit === 'number' ? opts.parameterLimit : defaults.parameterLimit,
            parseArrays: opts.parseArrays !== false,
            plainObjects: typeof opts.plainObjects === 'boolean' ? opts.plainObjects : defaults.plainObjects,
            strictNullHandling: typeof opts.strictNullHandling === 'boolean' ? opts.strictNullHandling : defaults.strictNullHandling
        };
    };

    var parse = function (str, opts) {
        var options = normalizeParseOptions(opts);

        if (str === '' || str === null || typeof str === 'undefined') {
            return options.plainObjects ? Object.create(null) : {};
        }

        var tempObj = typeof str === 'string' ? parseValues(str, options) : str;
        var obj = options.plainObjects ? Object.create(null) : {};

        // Iterate over the keys and setup the new object

        var keys = Object.keys(tempObj);
        for (var i = 0; i < keys.length; ++i) {
            var key = keys[i];
            var newObj = parseKeys(key, tempObj[key], options, typeof str === 'string');
            obj = utils.merge(obj, newObj, options);
        }

        if (options.allowSparse === true) {
            return obj;
        }

        return utils.compact(obj);
    };

    var lib$1 = {
        formats: formats,
        parse: parse,
        stringify: stringify_1
    };

    /* eslint-env browser */
    var browser = typeof self == 'object' ? self.FormData : window.FormData;

    var ulit = { ini_from_obj: ini_from_obj$1 };

    function ini_from_obj$1(obj) {

        let arr = [];

        for (const i of Object.entries(obj)) {
            arr.push(i.join("="));
        }

        return arr.join("\n");
    }

    const axios = axios$1.default;



    const { ini_from_obj } = ulit;

    /**
     * 
     * @param {string} username 
     * @param {string} password 
     * @param {import("axios").AxiosRequestConfig} config 
     * @param {string} ym_server 
     */
    function Yemot_api(username, password, config = {}, ym_server = "ym") {

    	let token;
    	let is_connect = false;

    	const yemot_con = axios.create({
    		baseURL: `https://www.call2all.co.il/${ym_server}/api/`,
    		maxContentLength: Infinity,
    		...config
    	});

    	this.copy_files = async (target_path, files_path) => {

    		return exec("FileAction", {
    			action: "copy",
    			target: "ivr2:" + target_path,
    			...make_what_files(files_path)
    		});
    	};

    	this.move_files = async (target_path, files_path) => {

    		return exec("FileAction", {
    			action: "move",
    			target: "ivr2:" + target_path,
    			...make_what_files(files_path)
    		});
    	};

    	this.delete = async (files_path) => {
    		return exec("FileAction", {
    			action: "delete",
    			...make_what_files(files_path)
    		});
    	};

    	this.create_ext = async (path, ini_settings_obj) => {

    		await exec("UpdateExtension", {
    			path
    		});

    		return upload_txt_file(path + "/ext.ini", ini_settings_obj);
    	};

    	this.logout = () => {
    		return exec("Logout");
    	};

    	this.upload_file = (path, file, convertAudio = 0) => {

    		return exec("UploadFile", {
    			path,
    			convertAudio,
    			file
    		});
    	};

    	this.download_file = (path) => {

    		return exec("DownloadFile", {
    			path
    		});
    	};

    	this.get_ivr_tree = (path) => {
    		return exec("GetIvrTree", {
    			path: "ivr2:" + path
    		});
    	};

    	this.get_incoming_calls = () => {
    		return exec("GetIncomingCalls");
    	};

    	this.get_session = () => {
    		return exec("GetSession");
    	};

    	this.run_campaign = (template_id, phones = false, caller_id = false) => {

    		const param = {
    			templateId: template_id
    		};

    		if (phones && Array.isArray(phones)) {
    			param.phones = phones.join(":");
    		}

    		if (caller_id) {
    			param.callerId = caller_id;
    		}

    		return exec("RunCampaign", param);
    	};

    	this.exec = exec;

    	this.upload_txt_file = upload_txt_file;

    	/** ====================================================================== */

    	/** */
    	async function upload_txt_file(path, ini_settings_obj) {

    		if (typeof ini_settings_obj === "object") {

    			if (Array.isArray(ini_settings_obj)) {
    				ini_settings_obj = ini_settings_obj.join("\n");
    			} else {
    				ini_settings_obj = ini_from_obj(ini_settings_obj);
    			}
    		}

    		return exec("UploadTextFile", {
    			what: "ivr2:/" + path,
    			contents: ini_settings_obj
    		});

    	}

    	/**
    	 * 
    	 * @param {string} method 
    	 * @param {object} parameters 
    	 * @param {import("axios").AxiosRequestConfig} options
    	 * 
    	 * @returns {promise}
    	 */
    	async function exec(method, parameters = {}, options = {}) {

    		if (!is_connect && method !== "Login") {
    			await login();
    		}

    		let data = make();

    		try {
    			let res = await yemot_con.post(method, data, options);

    			if (res.data.responseStatus && res.data.responseStatus !== "OK") {

    				if (
    					(res.data.responseStatus === "EXCEPTION" &&
    						res.data.message ===
    						"IllegalStateException(session token is invalid)") ||
    					(res.data.responseStatus === "FORBIDDEN" &&
    						res.data.message ===
    						"session is expired")
    				) {

    					return await session_is_expired();
    				}

    				let message;
    				if (res.data.exceptionMessage) {
    					message = res.data.exceptionMessage;
    				} else if (res.data.message) {
    					message = res.data.message;
    				}

    				const error = new Error(message);

    				error.response = res;
    				error.request = res.request;
    				error.config = res.config;

    				throw error;
    			}

    			return res;


    		} catch (error) {

    			if (error.response) {
    				if (error.response.status == 404 &&
    					method === "DownloadFile") {
    					throw (error.response.data);

    				}
    			}

    			throw error;
    		}

    		async function session_is_expired() {
    			await login();

    			return exec(method, parameters, options);
    		}

    		function make() {
    			if (method !== "Login") {

    				parameters.token = token;
    			}

    			let data;

    			if (method === "UploadFile") {

    				const form = new browser();

    				for (const parameter of Object.entries(parameters)) {

    					if (typeof parameter[1] == "object") {
    						form.append(parameter[0], parameter[1].value, parameter[1].options);
    					} else {
    						form.append(parameter[0], parameter[1]);
    					}
    				}

    				options.headers = form.getHeaders();
    				data = form.getBuffer();

    			} else {

    				if (method === "DownloadFile") {
    					options.responseType = options.responseType || "arraybuffer";
    				}

    				options.headers = { "Content-Type": "application/x-www-form-urlencoded" };

    				data = lib$1.stringify(parameters);
    			}
    			return data;
    		}
    	}

    	async function login() {

    		const parm = { username, password };

    		const res = await exec("Login", parm);

    		if (res.data && res.data.responseStatus !== "OK") {

    			throw (res.data.responseStatus + ": " + res.data.message);
    		}

    		token = res.data.token;

    		is_connect = true;
    	}

    	function make_what_files(files) {
    		const final_files = {};
    		let i = 0;
    		for (const file of files) {
    			final_files["what" + i] = "ivr2:" + file;
    			i++;
    		}
    		return final_files;
    	}
    }

    Yemot_api.Yemot_api = Yemot_api;

    var lib = Yemot_api;

    var yemotApi = lib;

    const user_store = writable({
    	is_login: false,
    	user: "", pass: ""
    });

    let yemot_api = new yemotApi();

    function login(user, pass) {

    	yemot_api = new yemotApi(user, pass);
    }
    function check_coockie() {

    	if (document.cookie) {
    		const cookie = JSON.parse(document.cookie);

    		if (cookie.user && cookie.pass)
    			login(cookie.user, cookie.pass);
    	}
    }

    user_store.subscribe((value) => {

    	if (value.is_login) {
    		const json = JSON.stringify({
    			user: value.user,
    			pass: value.pass,
    		});

    		document.cookie = json;

    	} else {
    		if (value.user && value.pass) {
    			value.user = value.pass = "";
    			document.cookie = "{}";
    		}

    	}
    });

    /* src\Login.svelte generated by Svelte v3.38.2 */
    const file$2 = "src\\Login.svelte";

    // (22:1) {#if error}
    function create_if_block$2(ctx) {
    	let div;
    	let p;
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			t = text(/*error*/ ctx[2]);
    			add_location(p, file$2, 23, 3, 449);
    			attr_dev(div, "class", "error svelte-essc8k");
    			add_location(div, file$2, 22, 2, 425);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*error*/ 4) set_data_dev(t, /*error*/ ctx[2]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(22:1) {#if error}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let form;
    	let h1;
    	let t1;
    	let t2;
    	let label0;
    	let t4;
    	let input0;
    	let t5;
    	let label1;
    	let t7;
    	let input1;
    	let t8;
    	let button;
    	let mounted;
    	let dispose;
    	let if_block = /*error*/ ctx[2] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			form = element("form");
    			h1 = element("h1");
    			h1.textContent = "📞";
    			t1 = space();
    			if (if_block) if_block.c();
    			t2 = space();
    			label0 = element("label");
    			label0.textContent = "מספר מערכת";
    			t4 = space();
    			input0 = element("input");
    			t5 = space();
    			label1 = element("label");
    			label1.textContent = "סיסמא";
    			t7 = space();
    			input1 = element("input");
    			t8 = space();
    			button = element("button");
    			button.textContent = "כניסה 🔑";
    			attr_dev(h1, "class", "svelte-essc8k");
    			add_location(h1, file$2, 19, 1, 394);
    			attr_dev(label0, "for", "user");
    			attr_dev(label0, "class", "svelte-essc8k");
    			add_location(label0, file$2, 29, 1, 497);
    			attr_dev(input0, "name", "user");
    			attr_dev(input0, "placeholder", "0773137770");
    			attr_dev(input0, "class", "svelte-essc8k");
    			add_location(input0, file$2, 30, 1, 536);
    			attr_dev(label1, "for", "password");
    			attr_dev(label1, "class", "svelte-essc8k");
    			add_location(label1, file$2, 32, 1, 605);
    			attr_dev(input1, "name", "password");
    			attr_dev(input1, "type", "password");
    			attr_dev(input1, "placeholder", "******");
    			attr_dev(input1, "class", "svelte-essc8k");
    			add_location(input1, file$2, 33, 1, 643);
    			attr_dev(button, "type", "submit");
    			attr_dev(button, "class", "svelte-essc8k");
    			add_location(button, file$2, 40, 1, 742);
    			attr_dev(form, "class", "svelte-essc8k");
    			add_location(form, file$2, 18, 0, 345);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, form, anchor);
    			append_dev(form, h1);
    			append_dev(form, t1);
    			if (if_block) if_block.m(form, null);
    			append_dev(form, t2);
    			append_dev(form, label0);
    			append_dev(form, t4);
    			append_dev(form, input0);
    			set_input_value(input0, /*user*/ ctx[0]);
    			append_dev(form, t5);
    			append_dev(form, label1);
    			append_dev(form, t7);
    			append_dev(form, input1);
    			set_input_value(input1, /*pass*/ ctx[1]);
    			append_dev(form, t8);
    			append_dev(form, button);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[4]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[5]),
    					listen_dev(form, "submit", prevent_default(/*handleSubmit*/ ctx[3]), false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*error*/ ctx[2]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					if_block.m(form, t2);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*user*/ 1 && input0.value !== /*user*/ ctx[0]) {
    				set_input_value(input0, /*user*/ ctx[0]);
    			}

    			if (dirty & /*pass*/ 2 && input1.value !== /*pass*/ ctx[1]) {
    				set_input_value(input1, /*pass*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(form);
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Login", slots, []);
    	let user, pass, error;

    	function handleSubmit() {
    		login(user, pass);

    		yemot_api.get_incoming_calls().then(() => {
    			user_store.set({ is_login: true, user, pass });
    		}).catch(reason => {
    			$$invalidate(2, error = reason.toString());
    		});
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Login> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		user = this.value;
    		$$invalidate(0, user);
    	}

    	function input1_input_handler() {
    		pass = this.value;
    		$$invalidate(1, pass);
    	}

    	$$self.$capture_state = () => ({
    		login,
    		user_store,
    		yemot_api,
    		user,
    		pass,
    		error,
    		handleSubmit
    	});

    	$$self.$inject_state = $$props => {
    		if ("user" in $$props) $$invalidate(0, user = $$props.user);
    		if ("pass" in $$props) $$invalidate(1, pass = $$props.pass);
    		if ("error" in $$props) $$invalidate(2, error = $$props.error);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [user, pass, error, handleSubmit, input0_input_handler, input1_input_handler];
    }

    class Login extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Login",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src\Calls.svelte generated by Svelte v3.38.2 */
    const file$1 = "src\\Calls.svelte";

    // (27:2) {:else}
    function create_else_block$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("בטעינה...");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(27:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (25:2) {#if calls}
    function create_if_block_1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("סך השיחות הפעילות למערכת כרגע הוא:");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(25:2) {#if calls}",
    		ctx
    	});

    	return block;
    }

    // (31:1) {#if calls}
    function create_if_block$1(ctx) {
    	let h2;
    	let t;

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			t = text(/*calls*/ ctx[0]);
    			add_location(h2, file$1, 31, 2, 552);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			append_dev(h2, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*calls*/ 1) set_data_dev(t, /*calls*/ ctx[0]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(31:1) {#if calls}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div;
    	let h1;
    	let t1;
    	let p;
    	let t2;
    	let t3;
    	let button;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*calls*/ ctx[0]) return create_if_block_1;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);
    	let if_block1 = /*calls*/ ctx[0] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			h1 = element("h1");
    			h1.textContent = "סך השיחות למערכת:";
    			t1 = space();
    			p = element("p");
    			if_block0.c();
    			t2 = space();
    			if (if_block1) if_block1.c();
    			t3 = space();
    			button = element("button");
    			button.textContent = "יציאה 🔒";
    			attr_dev(h1, "class", "svelte-ia0itf");
    			add_location(h1, file$1, 22, 1, 407);
    			attr_dev(p, "class", "svelte-ia0itf");
    			add_location(p, file$1, 23, 1, 436);
    			attr_dev(button, "class", "svelte-ia0itf");
    			add_location(button, file$1, 35, 1, 588);
    			attr_dev(div, "class", "modal svelte-ia0itf");
    			add_location(div, file$1, 21, 0, 385);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h1);
    			append_dev(div, t1);
    			append_dev(div, p);
    			if_block0.m(p, null);
    			append_dev(div, t2);
    			if (if_block1) if_block1.m(div, null);
    			append_dev(div, t3);
    			append_dev(div, button);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*logout*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(p, null);
    				}
    			}

    			if (/*calls*/ ctx[0]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block$1(ctx);
    					if_block1.c();
    					if_block1.m(div, t3);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block0.d();
    			if (if_block1) if_block1.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $user_store;
    	validate_store(user_store, "user_store");
    	component_subscribe($$self, user_store, $$value => $$invalidate(2, $user_store = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Calls", slots, []);
    	let calls = 0;

    	async function get_calls() {
    		const response = await yemot_api.get_incoming_calls();
    		return response.data.callsCount;
    	}

    	async function set_calls() {
    		$$invalidate(0, calls = await get_calls());
    	}

    	function logout() {
    		set_store_value(user_store, $user_store.is_login = false, $user_store);
    	}

    	setInterval(set_calls, 1000);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Calls> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		yemot_api,
    		user_store,
    		calls,
    		get_calls,
    		set_calls,
    		logout,
    		$user_store
    	});

    	$$self.$inject_state = $$props => {
    		if ("calls" in $$props) $$invalidate(0, calls = $$props.calls);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [calls, logout];
    }

    class Calls extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Calls",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.38.2 */
    const file = "src\\App.svelte";

    // (18:1) {:else}
    function create_else_block(ctx) {
    	let calls;
    	let current;
    	calls = new Calls({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(calls.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(calls, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(calls.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(calls.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(calls, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(18:1) {:else}",
    		ctx
    	});

    	return block;
    }

    // (16:1) {#if !$user_store.is_login}
    function create_if_block(ctx) {
    	let login;
    	let current;
    	login = new Login({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(login.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(login, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(login.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(login.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(login, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(16:1) {#if !$user_store.is_login}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let html;
    	let t;
    	let section;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (!/*$user_store*/ ctx[0].is_login) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			html = element("html");
    			t = space();
    			section = element("section");
    			if_block.c();
    			document.title = "שיחות פעילות";
    			attr_dev(html, "lang", "he");
    			add_location(html, file, 9, 1, 177);
    			attr_dev(section, "class", "svelte-1bqpatv");
    			add_location(section, file, 14, 0, 247);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			append_dev(document.head, html);
    			insert_dev(target, t, anchor);
    			insert_dev(target, section, anchor);
    			if_blocks[current_block_type_index].m(section, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index !== previous_block_index) {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(section, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			detach_dev(html);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(section);
    			if_blocks[current_block_type_index].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let $user_store;
    	validate_store(user_store, "user_store");
    	component_subscribe($$self, user_store, $$value => $$invalidate(0, $user_store = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Login, Calls, user_store, $user_store });
    	return [$user_store];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    check_coockie();

    const app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
