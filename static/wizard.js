"use strict";
var SeratoWizard = (() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf, __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: !0 });
  }, __copyProps = (to, from, except, desc) => {
    if (from && typeof from == "object" || typeof from == "function")
      for (let key of __getOwnPropNames(from))
        !__hasOwnProp.call(to, key) && key !== except && __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: !0 }) : target,
    mod
  )), __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: !0 }), mod);

  // node_modules/react/cjs/react.production.js
  var require_react_production = __commonJS({
    "node_modules/react/cjs/react.production.js"(exports) {
      "use strict";
      var REACT_ELEMENT_TYPE = /* @__PURE__ */ Symbol.for("react.transitional.element"), REACT_PORTAL_TYPE = /* @__PURE__ */ Symbol.for("react.portal"), REACT_FRAGMENT_TYPE = /* @__PURE__ */ Symbol.for("react.fragment"), REACT_STRICT_MODE_TYPE = /* @__PURE__ */ Symbol.for("react.strict_mode"), REACT_PROFILER_TYPE = /* @__PURE__ */ Symbol.for("react.profiler"), REACT_CONSUMER_TYPE = /* @__PURE__ */ Symbol.for("react.consumer"), REACT_CONTEXT_TYPE = /* @__PURE__ */ Symbol.for("react.context"), REACT_FORWARD_REF_TYPE = /* @__PURE__ */ Symbol.for("react.forward_ref"), REACT_SUSPENSE_TYPE = /* @__PURE__ */ Symbol.for("react.suspense"), REACT_MEMO_TYPE = /* @__PURE__ */ Symbol.for("react.memo"), REACT_LAZY_TYPE = /* @__PURE__ */ Symbol.for("react.lazy"), REACT_ACTIVITY_TYPE = /* @__PURE__ */ Symbol.for("react.activity"), REACT_VIEW_TRANSITION_TYPE = /* @__PURE__ */ Symbol.for("react.view_transition"), MAYBE_ITERATOR_SYMBOL = Symbol.iterator;
      function getIteratorFn(maybeIterable) {
        return maybeIterable === null || typeof maybeIterable != "object" ? null : (maybeIterable = MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL] || maybeIterable["@@iterator"], typeof maybeIterable == "function" ? maybeIterable : null);
      }
      var ReactNoopUpdateQueue = {
        isMounted: function() {
          return !1;
        },
        enqueueForceUpdate: function() {
        },
        enqueueReplaceState: function() {
        },
        enqueueSetState: function() {
        }
      }, assign = Object.assign, emptyObject = {};
      function Component(props, context, updater) {
        this.props = props, this.context = context, this.refs = emptyObject, this.updater = updater || ReactNoopUpdateQueue;
      }
      Component.prototype.isReactComponent = {};
      Component.prototype.setState = function(partialState, callback) {
        if (typeof partialState != "object" && typeof partialState != "function" && partialState != null)
          throw Error(
            "takes an object of state variables to update or a function which returns an object of state variables."
          );
        this.updater.enqueueSetState(this, partialState, callback, "setState");
      };
      Component.prototype.forceUpdate = function(callback) {
        this.updater.enqueueForceUpdate(this, callback, "forceUpdate");
      };
      function ComponentDummy() {
      }
      ComponentDummy.prototype = Component.prototype;
      function PureComponent(props, context, updater) {
        this.props = props, this.context = context, this.refs = emptyObject, this.updater = updater || ReactNoopUpdateQueue;
      }
      var pureComponentPrototype = PureComponent.prototype = new ComponentDummy();
      pureComponentPrototype.constructor = PureComponent;
      assign(pureComponentPrototype, Component.prototype);
      pureComponentPrototype.isPureReactComponent = !0;
      var isArrayImpl = Array.isArray;
      function noop2() {
      }
      var ReactSharedInternals = { H: null, A: null, T: null, S: null }, hasOwnProperty = Object.prototype.hasOwnProperty;
      function ReactElement(type, key, props) {
        var refProp = props.ref;
        return {
          $$typeof: REACT_ELEMENT_TYPE,
          type,
          key,
          ref: refProp !== void 0 ? refProp : null,
          props
        };
      }
      function cloneAndReplaceKey(oldElement, newKey) {
        return ReactElement(oldElement.type, newKey, oldElement.props);
      }
      function isValidElement(object) {
        return typeof object == "object" && object !== null && object.$$typeof === REACT_ELEMENT_TYPE;
      }
      function escape(key) {
        var escaperLookup = { "=": "=0", ":": "=2" };
        return "$" + key.replace(/[=:]/g, function(match) {
          return escaperLookup[match];
        });
      }
      var userProvidedKeyEscapeRegex = /\/+/g;
      function getElementKey(element, index) {
        return typeof element == "object" && element !== null && element.key != null ? escape("" + element.key) : index.toString(36);
      }
      function resolveThenable(thenable) {
        switch (thenable.status) {
          case "fulfilled":
            return thenable.value;
          case "rejected":
            throw thenable.reason;
          default:
            switch (typeof thenable.status == "string" ? thenable.then(noop2, noop2) : (thenable.status = "pending", thenable.then(
              function(fulfilledValue) {
                thenable.status === "pending" && (thenable.status = "fulfilled", thenable.value = fulfilledValue);
              },
              function(error) {
                thenable.status === "pending" && (thenable.status = "rejected", thenable.reason = error);
              }
            )), thenable.status) {
              case "fulfilled":
                return thenable.value;
              case "rejected":
                throw thenable.reason;
            }
        }
        throw thenable;
      }
      function mapIntoArray(children, array, escapedPrefix, nameSoFar, callback) {
        var type = typeof children;
        (type === "undefined" || type === "boolean") && (children = null);
        var invokeCallback = !1;
        if (children === null) invokeCallback = !0;
        else
          switch (type) {
            case "bigint":
            case "string":
            case "number":
              invokeCallback = !0;
              break;
            case "object":
              switch (children.$$typeof) {
                case REACT_ELEMENT_TYPE:
                case REACT_PORTAL_TYPE:
                  invokeCallback = !0;
                  break;
                case REACT_LAZY_TYPE:
                  return invokeCallback = children._init, mapIntoArray(
                    invokeCallback(children._payload),
                    array,
                    escapedPrefix,
                    nameSoFar,
                    callback
                  );
              }
          }
        if (invokeCallback)
          return callback = callback(children), invokeCallback = nameSoFar === "" ? "." + getElementKey(children, 0) : nameSoFar, isArrayImpl(callback) ? (escapedPrefix = "", invokeCallback != null && (escapedPrefix = invokeCallback.replace(userProvidedKeyEscapeRegex, "$&/") + "/"), mapIntoArray(callback, array, escapedPrefix, "", function(c) {
            return c;
          })) : callback != null && (isValidElement(callback) && (callback = cloneAndReplaceKey(
            callback,
            escapedPrefix + (callback.key == null || children && children.key === callback.key ? "" : ("" + callback.key).replace(
              userProvidedKeyEscapeRegex,
              "$&/"
            ) + "/") + invokeCallback
          )), array.push(callback)), 1;
        invokeCallback = 0;
        var nextNamePrefix = nameSoFar === "" ? "." : nameSoFar + ":";
        if (isArrayImpl(children))
          for (var i = 0; i < children.length; i++)
            nameSoFar = children[i], type = nextNamePrefix + getElementKey(nameSoFar, i), invokeCallback += mapIntoArray(
              nameSoFar,
              array,
              escapedPrefix,
              type,
              callback
            );
        else if (i = getIteratorFn(children), typeof i == "function")
          for (children = i.call(children), i = 0; !(nameSoFar = children.next()).done; )
            nameSoFar = nameSoFar.value, type = nextNamePrefix + getElementKey(nameSoFar, i++), invokeCallback += mapIntoArray(
              nameSoFar,
              array,
              escapedPrefix,
              type,
              callback
            );
        else if (type === "object") {
          if (typeof children.then == "function")
            return mapIntoArray(
              resolveThenable(children),
              array,
              escapedPrefix,
              nameSoFar,
              callback
            );
          throw array = String(children), Error(
            "Objects are not valid as a React child (found: " + (array === "[object Object]" ? "object with keys {" + Object.keys(children).join(", ") + "}" : array) + "). If you meant to render a collection of children, use an array instead."
          );
        }
        return invokeCallback;
      }
      function mapChildren(children, func, context) {
        if (children == null) return children;
        var result = [], count = 0;
        return mapIntoArray(children, result, "", "", function(child) {
          return func.call(context, child, count++);
        }), result;
      }
      function lazyInitializer(payload) {
        if (payload._status === -1) {
          var ctor = payload._result, thenable = ctor();
          thenable.then(
            function(moduleObject) {
              (payload._status === 0 || payload._status === -1) && (payload._status = 1, payload._result = moduleObject, thenable.status === void 0 && (thenable.status = "fulfilled", thenable.value = moduleObject));
            },
            function(error) {
              (payload._status === 0 || payload._status === -1) && (payload._status = 2, payload._result = error, thenable.status === void 0 && (thenable.status = "rejected", thenable.reason = error));
            }
          ), payload._status === -1 && (payload._status = 0, payload._result = thenable);
        }
        if (payload._status === 1) return payload._result.default;
        throw payload._result;
      }
      var reportGlobalError = typeof reportError == "function" ? reportError : function(error) {
        if (typeof window == "object" && typeof window.ErrorEvent == "function") {
          var event = new window.ErrorEvent("error", {
            bubbles: !0,
            cancelable: !0,
            message: typeof error == "object" && error !== null && typeof error.message == "string" ? String(error.message) : String(error),
            error
          });
          if (!window.dispatchEvent(event)) return;
        } else if (typeof process == "object" && typeof process.emit == "function") {
          process.emit("uncaughtException", error);
          return;
        }
        console.error(error);
      };
      function startTransition(scope) {
        var prevTransition = ReactSharedInternals.T, currentTransition = {};
        currentTransition.types = prevTransition !== null ? prevTransition.types : null, ReactSharedInternals.T = currentTransition;
        try {
          var returnValue = scope(), onStartTransitionFinish = ReactSharedInternals.S;
          onStartTransitionFinish !== null && onStartTransitionFinish(currentTransition, returnValue), typeof returnValue == "object" && returnValue !== null && typeof returnValue.then == "function" && returnValue.then(noop2, reportGlobalError);
        } catch (error) {
          reportGlobalError(error);
        } finally {
          prevTransition !== null && currentTransition.types !== null && (prevTransition.types = currentTransition.types), ReactSharedInternals.T = prevTransition;
        }
      }
      function addTransitionType(type) {
        var transition = ReactSharedInternals.T;
        if (transition !== null) {
          var transitionTypes = transition.types;
          transitionTypes === null ? transition.types = [type] : transitionTypes.indexOf(type) === -1 && transitionTypes.push(type);
        } else startTransition(addTransitionType.bind(null, type));
      }
      var Children = {
        map: mapChildren,
        forEach: function(children, forEachFunc, forEachContext) {
          mapChildren(
            children,
            function() {
              forEachFunc.apply(this, arguments);
            },
            forEachContext
          );
        },
        count: function(children) {
          var n = 0;
          return mapChildren(children, function() {
            n++;
          }), n;
        },
        toArray: function(children) {
          return mapChildren(children, function(child) {
            return child;
          }) || [];
        },
        only: function(children) {
          if (!isValidElement(children))
            throw Error(
              "React.Children.only expected to receive a single React element child."
            );
          return children;
        }
      };
      exports.Activity = REACT_ACTIVITY_TYPE;
      exports.Children = Children;
      exports.Component = Component;
      exports.Fragment = REACT_FRAGMENT_TYPE;
      exports.Profiler = REACT_PROFILER_TYPE;
      exports.PureComponent = PureComponent;
      exports.StrictMode = REACT_STRICT_MODE_TYPE;
      exports.Suspense = REACT_SUSPENSE_TYPE;
      exports.ViewTransition = REACT_VIEW_TRANSITION_TYPE;
      exports.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = ReactSharedInternals;
      exports.__COMPILER_RUNTIME = {
        __proto__: null,
        c: function(size) {
          return ReactSharedInternals.H.useMemoCache(size);
        }
      };
      exports.addTransitionType = addTransitionType;
      exports.cache = function(fn) {
        return function() {
          return fn.apply(null, arguments);
        };
      };
      exports.cacheSignal = function() {
        return null;
      };
      exports.cloneElement = function(element, config, children) {
        if (element == null)
          throw Error(
            "The argument must be a React element, but you passed " + element + "."
          );
        var props = assign({}, element.props), key = element.key;
        if (config != null)
          for (propName in config.key !== void 0 && (key = "" + config.key), config)
            !hasOwnProperty.call(config, propName) || propName === "key" || propName === "__self" || propName === "__source" || propName === "ref" && config.ref === void 0 || (props[propName] = config[propName]);
        var propName = arguments.length - 2;
        if (propName === 1) props.children = children;
        else if (1 < propName) {
          for (var childArray = Array(propName), i = 0; i < propName; i++)
            childArray[i] = arguments[i + 2];
          props.children = childArray;
        }
        return ReactElement(element.type, key, props);
      };
      exports.createContext = function(defaultValue) {
        return defaultValue = {
          $$typeof: REACT_CONTEXT_TYPE,
          _currentValue: defaultValue,
          _currentValue2: defaultValue,
          _threadCount: 0,
          Provider: null,
          Consumer: null
        }, defaultValue.Provider = defaultValue, defaultValue.Consumer = {
          $$typeof: REACT_CONSUMER_TYPE,
          _context: defaultValue
        }, defaultValue;
      };
      exports.createElement = function(type, config, children) {
        var propName, props = {}, key = null;
        if (config != null)
          for (propName in config.key !== void 0 && (key = "" + config.key), config)
            hasOwnProperty.call(config, propName) && propName !== "key" && propName !== "__self" && propName !== "__source" && (props[propName] = config[propName]);
        var childrenLength = arguments.length - 2;
        if (childrenLength === 1) props.children = children;
        else if (1 < childrenLength) {
          for (var childArray = Array(childrenLength), i = 0; i < childrenLength; i++)
            childArray[i] = arguments[i + 2];
          props.children = childArray;
        }
        if (type && type.defaultProps)
          for (propName in childrenLength = type.defaultProps, childrenLength)
            props[propName] === void 0 && (props[propName] = childrenLength[propName]);
        return ReactElement(type, key, props);
      };
      exports.createRef = function() {
        return { current: null };
      };
      exports.forwardRef = function(render) {
        return { $$typeof: REACT_FORWARD_REF_TYPE, render };
      };
      exports.isValidElement = isValidElement;
      exports.lazy = function(ctor) {
        return {
          $$typeof: REACT_LAZY_TYPE,
          _payload: { _status: -1, _result: ctor },
          _init: lazyInitializer
        };
      };
      exports.memo = function(type, compare) {
        return {
          $$typeof: REACT_MEMO_TYPE,
          type,
          compare: compare === void 0 ? null : compare
        };
      };
      exports.startTransition = startTransition;
      exports.unstable_useCacheRefresh = function() {
        return ReactSharedInternals.H.useCacheRefresh();
      };
      exports.use = function(usable) {
        return ReactSharedInternals.H.use(usable);
      };
      exports.useActionState = function(action, initialState, permalink) {
        return ReactSharedInternals.H.useActionState(action, initialState, permalink);
      };
      exports.useCallback = function(callback, deps) {
        return ReactSharedInternals.H.useCallback(callback, deps);
      };
      exports.useContext = function(Context) {
        return ReactSharedInternals.H.useContext(Context);
      };
      exports.useDebugValue = function() {
      };
      exports.useDeferredValue = function(value, initialValue) {
        return ReactSharedInternals.H.useDeferredValue(value, initialValue);
      };
      exports.useEffect = function(create, deps) {
        return ReactSharedInternals.H.useEffect(create, deps);
      };
      exports.useEffectEvent = function(callback) {
        return ReactSharedInternals.H.useEffectEvent(callback);
      };
      exports.useId = function() {
        return ReactSharedInternals.H.useId();
      };
      exports.useImperativeHandle = function(ref, create, deps) {
        return ReactSharedInternals.H.useImperativeHandle(ref, create, deps);
      };
      exports.useInsertionEffect = function(create, deps) {
        return ReactSharedInternals.H.useInsertionEffect(create, deps);
      };
      exports.useLayoutEffect = function(create, deps) {
        return ReactSharedInternals.H.useLayoutEffect(create, deps);
      };
      exports.useMemo = function(create, deps) {
        return ReactSharedInternals.H.useMemo(create, deps);
      };
      exports.useOptimistic = function(passthrough, reducer) {
        return ReactSharedInternals.H.useOptimistic(passthrough, reducer);
      };
      exports.useReducer = function(reducer, initialArg, init) {
        return ReactSharedInternals.H.useReducer(reducer, initialArg, init);
      };
      exports.useRef = function(initialValue) {
        return ReactSharedInternals.H.useRef(initialValue);
      };
      exports.useState = function(initialState) {
        return ReactSharedInternals.H.useState(initialState);
      };
      exports.useSyncExternalStore = function(subscribe, getSnapshot, getServerSnapshot) {
        return ReactSharedInternals.H.useSyncExternalStore(
          subscribe,
          getSnapshot,
          getServerSnapshot
        );
      };
      exports.useTransition = function() {
        return ReactSharedInternals.H.useTransition();
      };
      exports.version = "19.3.1";
    }
  });

  // node_modules/react/index.js
  var require_react = __commonJS({
    "node_modules/react/index.js"(exports, module) {
      "use strict";
      module.exports = require_react_production();
    }
  });

  // node_modules/react-dom/cjs/react-dom.production.js
  var require_react_dom_production = __commonJS({
    "node_modules/react-dom/cjs/react-dom.production.js"(exports) {
      "use strict";
      var React = require_react();
      function formatProdErrorMessage(code) {
        var url = "https://react.dev/errors/" + code;
        if (1 < arguments.length) {
          url += "?args[]=" + encodeURIComponent(arguments[1]);
          for (var i = 2; i < arguments.length; i++)
            url += "&args[]=" + encodeURIComponent(arguments[i]);
        }
        return "Minified React error #" + code + "; visit " + url + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
      }
      function noop2() {
      }
      var Internals = {
        d: {
          f: noop2,
          r: function() {
            throw Error(formatProdErrorMessage(522));
          },
          D: noop2,
          C: noop2,
          L: noop2,
          m: noop2,
          X: noop2,
          S: noop2,
          M: noop2
        },
        p: 0,
        findDOMNode: null
      }, REACT_PORTAL_TYPE = /* @__PURE__ */ Symbol.for("react.portal"), REACT_RECOVERABLE_TYPE = /* @__PURE__ */ Symbol.for("react.recoverable"), REACT_OPTIMISTIC_KEY = /* @__PURE__ */ Symbol.for("react.optimistic_key");
      function createPortal$1(children, containerInfo, implementation) {
        var key = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
        return {
          $$typeof: REACT_PORTAL_TYPE,
          key: key == null ? null : key === REACT_OPTIMISTIC_KEY ? REACT_OPTIMISTIC_KEY : "" + key,
          children,
          containerInfo,
          implementation
        };
      }
      var ReactSharedInternals = React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
      function getCrossOriginStringAs(as, input) {
        if (as === "font") return "";
        if (typeof input == "string")
          return input === "use-credentials" ? input : "";
      }
      exports.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = Internals;
      exports.browser = function(reason) {
        return { $$typeof: REACT_RECOVERABLE_TYPE, _reason: reason };
      };
      exports.createPortal = function(children, container) {
        var key = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
        if (!container || container.nodeType !== 1 && container.nodeType !== 9 && container.nodeType !== 11)
          throw Error(formatProdErrorMessage(299));
        return createPortal$1(children, container, null, key);
      };
      exports.flushSync = function(fn) {
        var previousTransition = ReactSharedInternals.T, previousUpdatePriority = Internals.p;
        try {
          if (ReactSharedInternals.T = null, Internals.p = 2, fn) return fn();
        } finally {
          ReactSharedInternals.T = previousTransition, Internals.p = previousUpdatePriority, Internals.d.f();
        }
      };
      exports.preconnect = function(href, options2) {
        typeof href == "string" && (options2 ? (options2 = options2.crossOrigin, options2 = typeof options2 == "string" ? options2 === "use-credentials" ? options2 : "" : void 0) : options2 = null, Internals.d.C(href, options2));
      };
      exports.prefetchDNS = function(href) {
        typeof href == "string" && Internals.d.D(href);
      };
      exports.preinit = function(href, options2) {
        if (typeof href == "string" && options2 && typeof options2.as == "string") {
          var as = options2.as, crossOrigin = getCrossOriginStringAs(as, options2.crossOrigin), integrity = typeof options2.integrity == "string" ? options2.integrity : void 0, fetchPriority = typeof options2.fetchPriority == "string" ? options2.fetchPriority : void 0;
          as === "style" ? Internals.d.S(
            href,
            typeof options2.precedence == "string" ? options2.precedence : void 0,
            {
              crossOrigin,
              integrity,
              fetchPriority
            }
          ) : as === "script" && Internals.d.X(href, {
            crossOrigin,
            integrity,
            fetchPriority,
            nonce: typeof options2.nonce == "string" ? options2.nonce : void 0
          });
        }
      };
      exports.preinitModule = function(href, options2) {
        if (typeof href == "string")
          if (typeof options2 == "object" && options2 !== null) {
            if (options2.as == null || options2.as === "script") {
              var crossOrigin = getCrossOriginStringAs(
                options2.as,
                options2.crossOrigin
              );
              Internals.d.M(href, {
                crossOrigin,
                integrity: typeof options2.integrity == "string" ? options2.integrity : void 0,
                nonce: typeof options2.nonce == "string" ? options2.nonce : void 0,
                fetchPriority: typeof options2.fetchPriority == "string" ? options2.fetchPriority : void 0
              });
            }
          } else options2 == null && Internals.d.M(href);
      };
      exports.preload = function(href, options2) {
        if (typeof href == "string" && typeof options2 == "object" && options2 !== null && typeof options2.as == "string") {
          var as = options2.as, crossOrigin = getCrossOriginStringAs(as, options2.crossOrigin);
          Internals.d.L(href, as, {
            crossOrigin,
            integrity: typeof options2.integrity == "string" ? options2.integrity : void 0,
            nonce: typeof options2.nonce == "string" ? options2.nonce : void 0,
            type: typeof options2.type == "string" ? options2.type : void 0,
            fetchPriority: typeof options2.fetchPriority == "string" ? options2.fetchPriority : void 0,
            referrerPolicy: typeof options2.referrerPolicy == "string" ? options2.referrerPolicy : void 0,
            imageSrcSet: typeof options2.imageSrcSet == "string" ? options2.imageSrcSet : void 0,
            imageSizes: typeof options2.imageSizes == "string" ? options2.imageSizes : void 0,
            media: typeof options2.media == "string" ? options2.media : void 0
          });
        }
      };
      exports.preloadModule = function(href, options2) {
        if (typeof href == "string")
          if (options2) {
            var crossOrigin = getCrossOriginStringAs(options2.as, options2.crossOrigin);
            Internals.d.m(href, {
              as: typeof options2.as == "string" && options2.as !== "script" ? options2.as : void 0,
              crossOrigin,
              integrity: typeof options2.integrity == "string" ? options2.integrity : void 0,
              nonce: typeof options2.nonce == "string" ? options2.nonce : void 0,
              fetchPriority: typeof options2.fetchPriority == "string" ? options2.fetchPriority : void 0
            });
          } else Internals.d.m(href);
      };
      exports.requestFormReset = function(form) {
        Internals.d.r(form);
      };
      exports.unstable_batchedUpdates = function(fn, a) {
        return fn(a);
      };
      exports.useFormState = function(action, initialState, permalink) {
        return ReactSharedInternals.H.useFormState(action, initialState, permalink);
      };
      exports.useFormStatus = function() {
        return ReactSharedInternals.H.useHostTransitionStatus();
      };
      exports.version = "19.3.1";
    }
  });

  // node_modules/react-dom/index.js
  var require_react_dom = __commonJS({
    "node_modules/react-dom/index.js"(exports, module) {
      "use strict";
      function checkDCE() {
        if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function"))
          try {
            __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(checkDCE);
          } catch (err) {
            console.error(err);
          }
      }
      checkDCE(), module.exports = require_react_dom_production();
    }
  });

  // node_modules/scheduler/cjs/scheduler.production.js
  var require_scheduler_production = __commonJS({
    "node_modules/scheduler/cjs/scheduler.production.js"(exports) {
      "use strict";
      function push(heap, node) {
        var index = heap.length;
        heap.push(node);
        a: for (; 0 < index; ) {
          var parentIndex = index - 1 >>> 1, parent = heap[parentIndex];
          if (0 < compare(parent, node))
            heap[parentIndex] = node, heap[index] = parent, index = parentIndex;
          else break a;
        }
      }
      function peek(heap) {
        return heap.length === 0 ? null : heap[0];
      }
      function pop(heap) {
        if (heap.length === 0) return null;
        var first = heap[0], last = heap.pop();
        if (last !== first) {
          heap[0] = last;
          a: for (var index = 0, length = heap.length, halfLength = length >>> 1; index < halfLength; ) {
            var leftIndex = 2 * (index + 1) - 1, left = heap[leftIndex], rightIndex = leftIndex + 1, right = heap[rightIndex];
            if (0 > compare(left, last))
              rightIndex < length && 0 > compare(right, left) ? (heap[index] = right, heap[rightIndex] = last, index = rightIndex) : (heap[index] = left, heap[leftIndex] = last, index = leftIndex);
            else if (rightIndex < length && 0 > compare(right, last))
              heap[index] = right, heap[rightIndex] = last, index = rightIndex;
            else break a;
          }
        }
        return first;
      }
      function compare(a, b) {
        var diff = a.sortIndex - b.sortIndex;
        return diff !== 0 ? diff : a.id - b.id;
      }
      exports.unstable_now = void 0;
      typeof performance == "object" && typeof performance.now == "function" ? (localPerformance = performance, exports.unstable_now = function() {
        return localPerformance.now();
      }) : (localDate = Date, initialTime = localDate.now(), exports.unstable_now = function() {
        return localDate.now() - initialTime;
      });
      var localPerformance, localDate, initialTime, taskQueue = [], timerQueue = [], taskIdCounter = 1, currentTask = null, currentPriorityLevel = 3, isPerformingWork = !1, isHostCallbackScheduled = !1, isHostTimeoutScheduled = !1, needsPaint = !1, localSetTimeout = typeof setTimeout == "function" ? setTimeout : null, localClearTimeout = typeof clearTimeout == "function" ? clearTimeout : null, localSetImmediate = typeof setImmediate < "u" ? setImmediate : null;
      function advanceTimers(currentTime) {
        for (var timer = peek(timerQueue); timer !== null; ) {
          if (timer.callback === null) pop(timerQueue);
          else if (timer.startTime <= currentTime)
            pop(timerQueue), timer.sortIndex = timer.expirationTime, push(taskQueue, timer);
          else break;
          timer = peek(timerQueue);
        }
      }
      function handleTimeout(currentTime) {
        if (isHostTimeoutScheduled = !1, advanceTimers(currentTime), !isHostCallbackScheduled)
          if (peek(taskQueue) !== null)
            isHostCallbackScheduled = !0, isMessageLoopRunning || (isMessageLoopRunning = !0, schedulePerformWorkUntilDeadline());
          else {
            var firstTimer = peek(timerQueue);
            firstTimer !== null && requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime);
          }
      }
      var isMessageLoopRunning = !1, taskTimeoutID = -1, frameInterval = 5, startTime = -1;
      function shouldYieldToHost() {
        return needsPaint ? !0 : !(exports.unstable_now() - startTime < frameInterval);
      }
      function performWorkUntilDeadline() {
        if (needsPaint = !1, isMessageLoopRunning) {
          var currentTime = exports.unstable_now();
          startTime = currentTime;
          var hasMoreWork = !0;
          try {
            a: {
              isHostCallbackScheduled = !1, isHostTimeoutScheduled && (isHostTimeoutScheduled = !1, localClearTimeout(taskTimeoutID), taskTimeoutID = -1), isPerformingWork = !0;
              var previousPriorityLevel = currentPriorityLevel;
              try {
                b: {
                  for (advanceTimers(currentTime), currentTask = peek(taskQueue); currentTask !== null && !(currentTask.expirationTime > currentTime && shouldYieldToHost()); ) {
                    var callback = currentTask.callback;
                    if (typeof callback == "function") {
                      currentTask.callback = null, currentPriorityLevel = currentTask.priorityLevel;
                      var continuationCallback = callback(
                        currentTask.expirationTime <= currentTime
                      );
                      if (currentTime = exports.unstable_now(), typeof continuationCallback == "function") {
                        currentTask.callback = continuationCallback, advanceTimers(currentTime), hasMoreWork = !0;
                        break b;
                      }
                      currentTask === peek(taskQueue) && pop(taskQueue), advanceTimers(currentTime);
                    } else pop(taskQueue);
                    currentTask = peek(taskQueue);
                  }
                  if (currentTask !== null) hasMoreWork = !0;
                  else {
                    var firstTimer = peek(timerQueue);
                    firstTimer !== null && requestHostTimeout(
                      handleTimeout,
                      firstTimer.startTime - currentTime
                    ), hasMoreWork = !1;
                  }
                }
                break a;
              } finally {
                currentTask = null, currentPriorityLevel = previousPriorityLevel, isPerformingWork = !1;
              }
              hasMoreWork = void 0;
            }
          } finally {
            hasMoreWork ? schedulePerformWorkUntilDeadline() : isMessageLoopRunning = !1;
          }
        }
      }
      var schedulePerformWorkUntilDeadline;
      typeof localSetImmediate == "function" ? schedulePerformWorkUntilDeadline = function() {
        localSetImmediate(performWorkUntilDeadline);
      } : typeof MessageChannel < "u" ? (channel = new MessageChannel(), port = channel.port2, channel.port1.onmessage = performWorkUntilDeadline, schedulePerformWorkUntilDeadline = function() {
        port.postMessage(null);
      }) : schedulePerformWorkUntilDeadline = function() {
        localSetTimeout(performWorkUntilDeadline, 0);
      };
      var channel, port;
      function requestHostTimeout(callback, ms) {
        taskTimeoutID = localSetTimeout(function() {
          callback(exports.unstable_now());
        }, ms);
      }
      exports.unstable_IdlePriority = 5;
      exports.unstable_ImmediatePriority = 1;
      exports.unstable_LowPriority = 4;
      exports.unstable_NormalPriority = 3;
      exports.unstable_Profiling = null;
      exports.unstable_UserBlockingPriority = 2;
      exports.unstable_cancelCallback = function(task) {
        task.callback = null;
      };
      exports.unstable_forceFrameRate = function(fps) {
        0 > fps || 125 < fps ? console.error(
          "forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported"
        ) : frameInterval = 0 < fps ? Math.floor(1e3 / fps) : 5;
      };
      exports.unstable_getCurrentPriorityLevel = function() {
        return currentPriorityLevel;
      };
      exports.unstable_next = function(eventHandler) {
        switch (currentPriorityLevel) {
          case 1:
          case 2:
          case 3:
            var priorityLevel = 3;
            break;
          default:
            priorityLevel = currentPriorityLevel;
        }
        var previousPriorityLevel = currentPriorityLevel;
        currentPriorityLevel = priorityLevel;
        try {
          return eventHandler();
        } finally {
          currentPriorityLevel = previousPriorityLevel;
        }
      };
      exports.unstable_requestPaint = function() {
        needsPaint = !0;
      };
      exports.unstable_runWithPriority = function(priorityLevel, eventHandler) {
        switch (priorityLevel) {
          case 1:
          case 2:
          case 3:
          case 4:
          case 5:
            break;
          default:
            priorityLevel = 3;
        }
        var previousPriorityLevel = currentPriorityLevel;
        currentPriorityLevel = priorityLevel;
        try {
          return eventHandler();
        } finally {
          currentPriorityLevel = previousPriorityLevel;
        }
      };
      exports.unstable_scheduleCallback = function(priorityLevel, callback, options2) {
        var currentTime = exports.unstable_now();
        switch (typeof options2 == "object" && options2 !== null ? (options2 = options2.delay, options2 = typeof options2 == "number" && 0 < options2 ? currentTime + options2 : currentTime) : options2 = currentTime, priorityLevel) {
          case 1:
            var timeout = -1;
            break;
          case 2:
            timeout = 250;
            break;
          case 5:
            timeout = 1073741823;
            break;
          case 4:
            timeout = 1e4;
            break;
          default:
            timeout = 5e3;
        }
        return timeout = options2 + timeout, priorityLevel = {
          id: taskIdCounter++,
          callback,
          priorityLevel,
          startTime: options2,
          expirationTime: timeout,
          sortIndex: -1
        }, options2 > currentTime ? (priorityLevel.sortIndex = options2, push(timerQueue, priorityLevel), peek(taskQueue) === null && priorityLevel === peek(timerQueue) && (isHostTimeoutScheduled ? (localClearTimeout(taskTimeoutID), taskTimeoutID = -1) : isHostTimeoutScheduled = !0, requestHostTimeout(handleTimeout, options2 - currentTime))) : (priorityLevel.sortIndex = timeout, push(taskQueue, priorityLevel), isHostCallbackScheduled || isPerformingWork || (isHostCallbackScheduled = !0, isMessageLoopRunning || (isMessageLoopRunning = !0, schedulePerformWorkUntilDeadline()))), priorityLevel;
      };
      exports.unstable_shouldYield = shouldYieldToHost;
      exports.unstable_wrapCallback = function(callback) {
        var parentPriorityLevel = currentPriorityLevel;
        return function() {
          var previousPriorityLevel = currentPriorityLevel;
          currentPriorityLevel = parentPriorityLevel;
          try {
            return callback.apply(this, arguments);
          } finally {
            currentPriorityLevel = previousPriorityLevel;
          }
        };
      };
    }
  });

  // node_modules/scheduler/index.js
  var require_scheduler = __commonJS({
    "node_modules/scheduler/index.js"(exports, module) {
      "use strict";
      module.exports = require_scheduler_production();
    }
  });

  // node_modules/react-dom/cjs/react-dom-client.production.js
  var require_react_dom_client_production = __commonJS({
    "node_modules/react-dom/cjs/react-dom-client.production.js"(exports) {
      "use strict";
      var Scheduler = require_scheduler(), React = require_react(), ReactDOM = require_react_dom();
      function formatProdErrorMessage(code) {
        var url = "https://react.dev/errors/" + code;
        if (1 < arguments.length) {
          url += "?args[]=" + encodeURIComponent(arguments[1]);
          for (var i = 2; i < arguments.length; i++)
            url += "&args[]=" + encodeURIComponent(arguments[i]);
        }
        return "Minified React error #" + code + "; visit " + url + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
      }
      function isValidContainer(node) {
        return !(!node || node.nodeType !== 1 && node.nodeType !== 9 && node.nodeType !== 11);
      }
      function getNearestMountedFiber(fiber) {
        for (var node = fiber, nextNode = node; nextNode && !nextNode.alternate; )
          node = nextNode, (node.flags & 4098) !== 0 && (fiber = node.return), nextNode = node.return;
        for (; node.return; ) node = node.return;
        return node.tag === 3 ? fiber : null;
      }
      function getSuspenseInstanceFromFiber(fiber) {
        if (fiber.tag === 13) {
          var suspenseState = fiber.memoizedState;
          if (suspenseState === null && (fiber = fiber.alternate, fiber !== null && (suspenseState = fiber.memoizedState)), suspenseState !== null) return suspenseState.dehydrated;
        }
        return null;
      }
      function getActivityInstanceFromFiber(fiber) {
        if (fiber.tag === 31) {
          var activityState = fiber.memoizedState;
          if (activityState === null && (fiber = fiber.alternate, fiber !== null && (activityState = fiber.memoizedState)), activityState !== null) return activityState.dehydrated;
        }
        return null;
      }
      function assertIsMounted(fiber) {
        if (getNearestMountedFiber(fiber) !== fiber)
          throw Error(formatProdErrorMessage(188));
      }
      function findCurrentFiberUsingSlowPath(fiber) {
        var alternate = fiber.alternate;
        if (!alternate) {
          if (alternate = getNearestMountedFiber(fiber), alternate === null) throw Error(formatProdErrorMessage(188));
          return alternate !== fiber ? null : fiber;
        }
        for (var a = fiber, b = alternate; ; ) {
          var parentA = a.return;
          if (parentA === null) break;
          var parentB = parentA.alternate;
          if (parentB === null) {
            if (b = parentA.return, b !== null) {
              a = b;
              continue;
            }
            break;
          }
          if (parentA.child === parentB.child) {
            for (parentB = parentA.child; parentB; ) {
              if (parentB === a) return assertIsMounted(parentA), fiber;
              if (parentB === b) return assertIsMounted(parentA), alternate;
              parentB = parentB.sibling;
            }
            throw Error(formatProdErrorMessage(188));
          }
          if (a.return !== b.return) a = parentA, b = parentB;
          else {
            for (var didFindChild = !1, child$0 = parentA.child; child$0; ) {
              if (child$0 === a) {
                didFindChild = !0, a = parentA, b = parentB;
                break;
              }
              if (child$0 === b) {
                didFindChild = !0, b = parentA, a = parentB;
                break;
              }
              child$0 = child$0.sibling;
            }
            if (!didFindChild) {
              for (child$0 = parentB.child; child$0; ) {
                if (child$0 === a) {
                  didFindChild = !0, a = parentB, b = parentA;
                  break;
                }
                if (child$0 === b) {
                  didFindChild = !0, b = parentB, a = parentA;
                  break;
                }
                child$0 = child$0.sibling;
              }
              if (!didFindChild) throw Error(formatProdErrorMessage(189));
            }
          }
          if (a.alternate !== b) throw Error(formatProdErrorMessage(190));
        }
        if (a.tag !== 3) throw Error(formatProdErrorMessage(188));
        return a.stateNode.current === a ? fiber : alternate;
      }
      function findCurrentHostFiberImpl(node) {
        var tag = node.tag;
        if (tag === 5 || tag === 26 || tag === 27 || tag === 6) return node;
        for (node = node.child; node !== null; ) {
          if (tag = findCurrentHostFiberImpl(node), tag !== null) return tag;
          node = node.sibling;
        }
        return null;
      }
      function traverseVisibleInstancesAndTextInstances(child, searchWithinHosts, fn, a, b, c) {
        for (; child !== null; ) {
          if ((child.tag === 5 || child.tag === 27 || child.tag === 6) && fn(child, a, b, c) || (child.tag !== 22 || child.memoizedState === null) && (searchWithinHosts || child.tag !== 5 && child.tag !== 27) && traverseVisibleInstancesAndTextInstances(
            child.child,
            searchWithinHosts,
            fn,
            a,
            b,
            c
          ))
            return !0;
          child = child.sibling;
        }
        return !1;
      }
      function getFragmentParentInstanceOrContainerFiber(fiber) {
        for (fiber = fiber.return; fiber !== null; ) {
          if (fiber.tag === 3 || fiber.tag === 5 || fiber.tag === 27) return fiber;
          fiber = fiber.return;
        }
        return null;
      }
      function fiberIsPortaledIntoHost(fiber) {
        var foundPortalParent = !1;
        for (fiber = fiber.return; fiber !== null && (fiber.tag === 4 && (foundPortalParent = !0), !(fiber.tag === 3 || fiber.tag === 5 || fiber.tag === 27)); )
          fiber = fiber.return;
        return foundPortalParent;
      }
      function getFragmentInstanceOrTextInstanceSiblings(fiber) {
        var result = [null, null], parentHostFiber = getFragmentParentInstanceOrContainerFiber(fiber);
        return parentHostFiber === null || findFragmentInstanceOrTextInstanceSiblings(
          result,
          fiber,
          parentHostFiber.child,
          { foundSelf: !1 }
        ), result;
      }
      function findFragmentInstanceOrTextInstanceSiblings(result, self, child, state) {
        for (; child !== null; ) {
          if (child === self) state.foundSelf = !0;
          else if (child.tag === 5 || child.tag === 27 || child.tag === 6) {
            if (state.foundSelf) return result[1] = child, !0;
            result[0] = child;
          } else if ((child.tag !== 22 || child.memoizedState === null) && findFragmentInstanceOrTextInstanceSiblings(
            result,
            self,
            child.child,
            state
          ))
            return !0;
          child = child.sibling;
        }
        return !1;
      }
      function getInstanceFromHostFiber(fiber) {
        switch (fiber.tag) {
          case 5:
          case 27:
          case 6:
            return fiber.stateNode;
          case 3:
            return fiber.stateNode.containerInfo;
          default:
            throw Error(formatProdErrorMessage(559));
        }
      }
      var searchTarget = null, searchBoundary = null;
      function isFiberPrecedingCheck(child, target, boundary) {
        return child === boundary ? !0 : child === target ? (searchTarget = child, !0) : !1;
      }
      function isFiberFollowingCheck(child, target, boundary) {
        return child === boundary ? (searchBoundary = child, !1) : child === target ? (searchBoundary !== null && (searchTarget = child), !0) : !1;
      }
      function getParentForFragmentAncestors(inst) {
        if (inst === null) return null;
        do
          inst = inst === null ? null : inst.return;
        while (inst && inst.tag !== 5 && inst.tag !== 27 && inst.tag !== 3);
        return inst || null;
      }
      function getLowestCommonAncestor(instA, instB, getParent2) {
        for (var depthA = 0, tempA = instA; tempA; tempA = getParent2(tempA)) depthA++;
        tempA = 0;
        for (var tempB = instB; tempB; tempB = getParent2(tempB)) tempA++;
        for (; 0 < depthA - tempA; ) instA = getParent2(instA), depthA--;
        for (; 0 < tempA - depthA; ) instB = getParent2(instB), tempA--;
        for (; depthA--; ) {
          if (instA === instB || instB !== null && instA === instB.alternate)
            return instA;
          instA = getParent2(instA), instB = getParent2(instB);
        }
        return null;
      }
      var assign = Object.assign, REACT_LEGACY_ELEMENT_TYPE = /* @__PURE__ */ Symbol.for("react.element"), REACT_ELEMENT_TYPE = /* @__PURE__ */ Symbol.for("react.transitional.element"), REACT_PORTAL_TYPE = /* @__PURE__ */ Symbol.for("react.portal"), REACT_FRAGMENT_TYPE = /* @__PURE__ */ Symbol.for("react.fragment"), REACT_STRICT_MODE_TYPE = /* @__PURE__ */ Symbol.for("react.strict_mode"), REACT_PROFILER_TYPE = /* @__PURE__ */ Symbol.for("react.profiler"), REACT_CONSUMER_TYPE = /* @__PURE__ */ Symbol.for("react.consumer"), REACT_CONTEXT_TYPE = /* @__PURE__ */ Symbol.for("react.context"), REACT_FORWARD_REF_TYPE = /* @__PURE__ */ Symbol.for("react.forward_ref"), REACT_SUSPENSE_TYPE = /* @__PURE__ */ Symbol.for("react.suspense"), REACT_SUSPENSE_LIST_TYPE = /* @__PURE__ */ Symbol.for("react.suspense_list"), REACT_MEMO_TYPE = /* @__PURE__ */ Symbol.for("react.memo"), REACT_LAZY_TYPE = /* @__PURE__ */ Symbol.for("react.lazy"), REACT_ACTIVITY_TYPE = /* @__PURE__ */ Symbol.for("react.activity"), REACT_LEGACY_HIDDEN_TYPE = /* @__PURE__ */ Symbol.for("react.legacy_hidden"), REACT_MEMO_CACHE_SENTINEL = /* @__PURE__ */ Symbol.for("react.memo_cache_sentinel"), REACT_VIEW_TRANSITION_TYPE = /* @__PURE__ */ Symbol.for("react.view_transition"), REACT_RECOVERABLE_TYPE = /* @__PURE__ */ Symbol.for("react.recoverable"), MAYBE_ITERATOR_SYMBOL = Symbol.iterator;
      function getIteratorFn(maybeIterable) {
        return maybeIterable === null || typeof maybeIterable != "object" ? null : (maybeIterable = MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL] || maybeIterable["@@iterator"], typeof maybeIterable == "function" ? maybeIterable : null);
      }
      var REACT_CLIENT_REFERENCE = /* @__PURE__ */ Symbol.for("react.client.reference");
      function getComponentNameFromType(type) {
        if (type == null) return null;
        if (typeof type == "function")
          return type.$$typeof === REACT_CLIENT_REFERENCE ? null : type.displayName || type.name || null;
        if (typeof type == "string") return type;
        switch (type) {
          case REACT_FRAGMENT_TYPE:
            return "Fragment";
          case REACT_PROFILER_TYPE:
            return "Profiler";
          case REACT_STRICT_MODE_TYPE:
            return "StrictMode";
          case REACT_SUSPENSE_TYPE:
            return "Suspense";
          case REACT_SUSPENSE_LIST_TYPE:
            return "SuspenseList";
          case REACT_ACTIVITY_TYPE:
            return "Activity";
          case REACT_VIEW_TRANSITION_TYPE:
            return "ViewTransition";
        }
        if (typeof type == "object")
          switch (type.$$typeof) {
            case REACT_PORTAL_TYPE:
              return "Portal";
            case REACT_CONTEXT_TYPE:
              return type.displayName || "Context";
            case REACT_CONSUMER_TYPE:
              return (type._context.displayName || "Context") + ".Consumer";
            case REACT_FORWARD_REF_TYPE:
              var innerType = type.render;
              return type = type.displayName, type || (type = innerType.displayName || innerType.name || "", type = type !== "" ? "ForwardRef(" + type + ")" : "ForwardRef"), type;
            case REACT_MEMO_TYPE:
              return innerType = type.displayName || null, innerType !== null ? innerType : getComponentNameFromType(type.type) || "Memo";
            case REACT_LAZY_TYPE:
              innerType = type._payload, type = type._init;
              try {
                return getComponentNameFromType(type(innerType));
              } catch {
              }
          }
        return null;
      }
      var isArrayImpl = Array.isArray, ReactSharedInternals = React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, ReactDOMSharedInternals = ReactDOM.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, sharedNotPendingObject = {
        pending: !1,
        data: null,
        method: null,
        action: null
      }, valueStack = [], index = -1;
      function createCursor(defaultValue) {
        return { current: defaultValue };
      }
      function pop(cursor) {
        0 > index || (cursor.current = valueStack[index], valueStack[index] = null, index--);
      }
      function push(cursor, value) {
        index++, valueStack[index] = cursor.current, cursor.current = value;
      }
      var contextStackCursor = createCursor(null), contextFiberStackCursor = createCursor(null), rootInstanceStackCursor = createCursor(null), hostTransitionProviderCursor = createCursor(null);
      function pushHostContainer(fiber, nextRootInstance) {
        switch (push(rootInstanceStackCursor, nextRootInstance), push(contextFiberStackCursor, fiber), push(contextStackCursor, null), nextRootInstance.nodeType) {
          case 9:
          case 11:
            fiber = (fiber = nextRootInstance.documentElement) && (fiber = fiber.namespaceURI) ? getOwnHostContext(fiber) : 0;
            break;
          default:
            if (fiber = nextRootInstance.tagName, nextRootInstance = nextRootInstance.namespaceURI)
              nextRootInstance = getOwnHostContext(nextRootInstance), fiber = getChildHostContextProd(nextRootInstance, fiber);
            else
              switch (fiber) {
                case "svg":
                  fiber = 1;
                  break;
                case "math":
                  fiber = 2;
                  break;
                default:
                  fiber = 0;
              }
        }
        pop(contextStackCursor), push(contextStackCursor, fiber);
      }
      function popHostContainer() {
        pop(contextStackCursor), pop(contextFiberStackCursor), pop(rootInstanceStackCursor);
      }
      function pushHostContext(fiber) {
        var stateHook = fiber.memoizedState;
        stateHook !== null && (HostTransitionContext._currentValue = stateHook.memoizedState, push(hostTransitionProviderCursor, fiber)), stateHook = contextStackCursor.current;
        var JSCompiler_inline_result = getChildHostContextProd(stateHook, fiber.type);
        stateHook !== JSCompiler_inline_result && (push(contextFiberStackCursor, fiber), push(contextStackCursor, JSCompiler_inline_result));
      }
      function popHostContext(fiber) {
        contextFiberStackCursor.current === fiber && (pop(contextStackCursor), pop(contextFiberStackCursor)), hostTransitionProviderCursor.current === fiber && (pop(hostTransitionProviderCursor), HostTransitionContext._currentValue = sharedNotPendingObject);
      }
      var prefix, suffix;
      function describeBuiltInComponentFrame(name) {
        if (prefix === void 0)
          try {
            throw Error();
          } catch (x) {
            var match = x.stack.trim().match(/\n( *(at )?)/);
            prefix = match && match[1] || "", suffix = -1 < x.stack.indexOf(`
    at`) ? " (<anonymous>)" : -1 < x.stack.indexOf("@") ? "@unknown:0:0" : "";
          }
        return `
` + prefix + name + suffix;
      }
      var reentry = !1;
      function describeNativeComponentFrame(fn, construct) {
        if (!fn || reentry) return "";
        reentry = !0;
        var previousPrepareStackTrace = Error.prepareStackTrace;
        Error.prepareStackTrace = void 0;
        try {
          var RunInRootFrame = {
            DetermineComponentFrameRoot: function() {
              try {
                if (construct) {
                  var Fake = function() {
                    throw Error();
                  };
                  if (Object.defineProperty(Fake.prototype, "props", {
                    set: function() {
                      throw Error();
                    }
                  }), typeof Reflect == "object" && Reflect.construct) {
                    try {
                      Reflect.construct(Fake, []);
                    } catch (x) {
                      var control = x;
                    }
                    Reflect.construct(fn, [], Fake);
                  } else {
                    try {
                      Fake.call();
                    } catch (x$1) {
                      control = x$1;
                    }
                    Fake = !1;
                    try {
                      var prevProps = Object.getOwnPropertyDescriptor(
                        fn.prototype,
                        "props"
                      );
                      Object.defineProperty(fn.prototype, "props", {
                        configurable: !0,
                        set: function() {
                          throw Error();
                        }
                      }), Fake = !0, new fn();
                    } finally {
                      Fake && (prevProps !== void 0 ? Object.defineProperty(fn.prototype, "props", prevProps) : delete fn.prototype.props);
                    }
                  }
                } else {
                  try {
                    throw Error();
                  } catch (x$2) {
                    control = x$2;
                  }
                  (Fake = fn()) && typeof Fake.catch == "function" && Fake.catch(function() {
                  });
                }
              } catch (sample) {
                if (sample && control && typeof sample.stack == "string")
                  return [sample.stack, control.stack];
              }
              return [null, null];
            }
          };
          RunInRootFrame.DetermineComponentFrameRoot.displayName = "DetermineComponentFrameRoot";
          var namePropDescriptor = Object.getOwnPropertyDescriptor(
            RunInRootFrame.DetermineComponentFrameRoot,
            "name"
          );
          namePropDescriptor && namePropDescriptor.configurable && Object.defineProperty(
            RunInRootFrame.DetermineComponentFrameRoot,
            "name",
            { value: "DetermineComponentFrameRoot" }
          );
          var _RunInRootFrame$Deter = RunInRootFrame.DetermineComponentFrameRoot(), sampleStack = _RunInRootFrame$Deter[0], controlStack = _RunInRootFrame$Deter[1];
          if (sampleStack && controlStack) {
            var sampleLines = sampleStack.split(`
`), controlLines = controlStack.split(`
`);
            for (namePropDescriptor = RunInRootFrame = 0; RunInRootFrame < sampleLines.length && !sampleLines[RunInRootFrame].includes("DetermineComponentFrameRoot"); )
              RunInRootFrame++;
            for (; namePropDescriptor < controlLines.length && !controlLines[namePropDescriptor].includes(
              "DetermineComponentFrameRoot"
            ); )
              namePropDescriptor++;
            if (RunInRootFrame === sampleLines.length || namePropDescriptor === controlLines.length)
              for (RunInRootFrame = sampleLines.length - 1, namePropDescriptor = controlLines.length - 1; 1 <= RunInRootFrame && 0 <= namePropDescriptor && sampleLines[RunInRootFrame] !== controlLines[namePropDescriptor]; )
                namePropDescriptor--;
            for (; 1 <= RunInRootFrame && 0 <= namePropDescriptor; RunInRootFrame--, namePropDescriptor--)
              if (sampleLines[RunInRootFrame] !== controlLines[namePropDescriptor]) {
                if (RunInRootFrame !== 1 || namePropDescriptor !== 1)
                  do
                    if (RunInRootFrame--, namePropDescriptor--, 0 > namePropDescriptor || sampleLines[RunInRootFrame] !== controlLines[namePropDescriptor]) {
                      var frame = `
` + sampleLines[RunInRootFrame].replace(" at new ", " at ");
                      return fn.displayName && frame.includes("<anonymous>") && (frame = frame.replace("<anonymous>", fn.displayName)), frame;
                    }
                  while (1 <= RunInRootFrame && 0 <= namePropDescriptor);
                break;
              }
          }
        } finally {
          reentry = !1, Error.prepareStackTrace = previousPrepareStackTrace;
        }
        return (previousPrepareStackTrace = fn ? fn.displayName || fn.name : "") ? describeBuiltInComponentFrame(previousPrepareStackTrace) : "";
      }
      function describeFiber(fiber, childFiber) {
        switch (fiber.tag) {
          case 26:
          case 27:
          case 5:
            return describeBuiltInComponentFrame(fiber.type);
          case 16:
            return describeBuiltInComponentFrame("Lazy");
          case 13:
            return fiber.child !== childFiber && childFiber !== null ? describeBuiltInComponentFrame("Suspense Fallback") : describeBuiltInComponentFrame("Suspense");
          case 19:
            return describeBuiltInComponentFrame("SuspenseList");
          case 0:
          case 15:
            return describeNativeComponentFrame(fiber.type, !1);
          case 11:
            return describeNativeComponentFrame(fiber.type.render, !1);
          case 1:
            return describeNativeComponentFrame(fiber.type, !0);
          case 31:
            return describeBuiltInComponentFrame("Activity");
          case 30:
            return describeBuiltInComponentFrame("ViewTransition");
          default:
            return "";
        }
      }
      function getStackByFiberInDevAndProd(workInProgress2) {
        try {
          var info = "", previous = null;
          do
            info += describeFiber(workInProgress2, previous), previous = workInProgress2, workInProgress2 = workInProgress2.return;
          while (workInProgress2);
          return info;
        } catch (x) {
          return `
Error generating stack: ` + x.message + `
` + x.stack;
        }
      }
      var hasOwnProperty = Object.prototype.hasOwnProperty, scheduleCallback$3 = Scheduler.unstable_scheduleCallback, cancelCallback$1 = Scheduler.unstable_cancelCallback, shouldYield = Scheduler.unstable_shouldYield, requestPaint = Scheduler.unstable_requestPaint, now = Scheduler.unstable_now, getCurrentPriorityLevel = Scheduler.unstable_getCurrentPriorityLevel, ImmediatePriority = Scheduler.unstable_ImmediatePriority, UserBlockingPriority = Scheduler.unstable_UserBlockingPriority, NormalPriority$1 = Scheduler.unstable_NormalPriority, LowPriority = Scheduler.unstable_LowPriority, IdlePriority = Scheduler.unstable_IdlePriority, log$1 = Scheduler.log, unstable_setDisableYieldValue = Scheduler.unstable_setDisableYieldValue, rendererID = null, injectedHook = null;
      function setIsStrictModeForDevtools(newIsStrictMode) {
        if (typeof log$1 == "function" && unstable_setDisableYieldValue(newIsStrictMode), injectedHook && typeof injectedHook.setStrictMode == "function")
          try {
            injectedHook.setStrictMode(rendererID, newIsStrictMode);
          } catch {
          }
      }
      var clz32 = Math.clz32 ? Math.clz32 : clz32Fallback, log = Math.log, LN2 = Math.LN2;
      function clz32Fallback(x) {
        return x >>>= 0, x === 0 ? 32 : 31 - (log(x) / LN2 | 0) | 0;
      }
      var nextTransitionUpdateLane = 256, nextTransitionDeferredLane = 262144, nextRetryLane = 4194304;
      function getHighestPriorityLanes(lanes) {
        var pendingSyncLanes = lanes & 42;
        if (pendingSyncLanes !== 0) return pendingSyncLanes;
        switch (lanes & -lanes) {
          case 1:
            return 1;
          case 2:
            return 2;
          case 4:
            return 4;
          case 8:
            return 8;
          case 16:
            return 16;
          case 32:
            return 32;
          case 64:
            return 64;
          case 128:
            return 128;
          case 256:
          case 512:
          case 1024:
          case 2048:
          case 4096:
          case 8192:
          case 16384:
          case 32768:
          case 65536:
          case 131072:
            return lanes & -lanes;
          case 262144:
          case 524288:
          case 1048576:
          case 2097152:
            return lanes & 3932160;
          case 4194304:
          case 8388608:
          case 16777216:
          case 33554432:
            return lanes & 62914560;
          case 67108864:
            return 67108864;
          case 134217728:
            return 134217728;
          case 268435456:
            return 268435456;
          case 536870912:
            return 536870912;
          case 1073741824:
            return 0;
          default:
            return lanes;
        }
      }
      function getNextLanes(root2, wipLanes, rootHasPendingCommit) {
        var pendingLanes = root2.pendingLanes;
        if (pendingLanes === 0) return 0;
        var nextLanes = 0, suspendedLanes = root2.suspendedLanes, pingedLanes = root2.pingedLanes;
        root2 = root2.warmLanes;
        var nonIdlePendingLanes = pendingLanes & 134217727;
        return nonIdlePendingLanes !== 0 ? (pendingLanes = nonIdlePendingLanes & ~suspendedLanes, pendingLanes !== 0 ? nextLanes = getHighestPriorityLanes(pendingLanes) : (pingedLanes &= nonIdlePendingLanes, pingedLanes !== 0 ? nextLanes = getHighestPriorityLanes(pingedLanes) : rootHasPendingCommit || (rootHasPendingCommit = nonIdlePendingLanes & ~root2, rootHasPendingCommit !== 0 && (nextLanes = getHighestPriorityLanes(rootHasPendingCommit))))) : (nonIdlePendingLanes = pendingLanes & ~suspendedLanes, nonIdlePendingLanes !== 0 ? nextLanes = getHighestPriorityLanes(nonIdlePendingLanes) : pingedLanes !== 0 ? nextLanes = getHighestPriorityLanes(pingedLanes) : rootHasPendingCommit || (rootHasPendingCommit = pendingLanes & ~root2, rootHasPendingCommit !== 0 && (nextLanes = getHighestPriorityLanes(rootHasPendingCommit)))), nextLanes === 0 ? 0 : wipLanes !== 0 && wipLanes !== nextLanes && (wipLanes & suspendedLanes) === 0 && (suspendedLanes = nextLanes & -nextLanes, rootHasPendingCommit = wipLanes & -wipLanes, suspendedLanes >= rootHasPendingCommit || suspendedLanes === 32 && (rootHasPendingCommit & 4194048) !== 0) ? wipLanes : nextLanes;
      }
      function checkIfRootIsPrerendering(root2, renderLanes2) {
        return (root2.pendingLanes & ~(root2.suspendedLanes & ~root2.pingedLanes) & renderLanes2) === 0;
      }
      function getEntangledLanes(root2, renderLanes2) {
        (renderLanes2 & 8) !== 0 && (renderLanes2 |= renderLanes2 & 32);
        var allEntangledLanes = root2.entangledLanes;
        if (allEntangledLanes !== 0)
          for (root2 = root2.entanglements, allEntangledLanes &= renderLanes2; 0 < allEntangledLanes; ) {
            var index$4 = 31 - clz32(allEntangledLanes), lane = 1 << index$4;
            renderLanes2 |= root2[index$4], allEntangledLanes &= ~lane;
          }
        return renderLanes2;
      }
      function computeExpirationTime(lane, currentTime) {
        switch (lane) {
          case 1:
          case 2:
          case 4:
          case 8:
          case 64:
            return currentTime + 250;
          case 16:
          case 32:
          case 128:
          case 256:
          case 512:
          case 1024:
          case 2048:
          case 4096:
          case 8192:
          case 16384:
          case 32768:
          case 65536:
          case 131072:
          case 262144:
          case 524288:
          case 1048576:
          case 2097152:
            return currentTime + 5e3;
          case 4194304:
          case 8388608:
          case 16777216:
          case 33554432:
            return -1;
          case 67108864:
          case 134217728:
          case 268435456:
          case 536870912:
          case 1073741824:
            return -1;
          default:
            return -1;
        }
      }
      function claimNextRetryLane() {
        var lane = nextRetryLane;
        return nextRetryLane <<= 1, (nextRetryLane & 62914560) === 0 && (nextRetryLane = 4194304), lane;
      }
      function createLaneMap(initial) {
        for (var laneMap = [], i = 0; 31 > i; i++) laneMap.push(initial);
        return laneMap;
      }
      function markRootUpdated$1(root2, updateLane) {
        root2.pendingLanes |= updateLane, updateLane !== 268435456 && (root2.suspendedLanes = 0, root2.pingedLanes = 0, root2.warmLanes = 0);
      }
      function markRootFinished(root2, finishedLanes, remainingLanes, spawnedLane, updatedLanes, suspendedRetryLanes) {
        var previouslyPendingLanes = root2.pendingLanes;
        root2.pendingLanes = remainingLanes, root2.suspendedLanes = 0, root2.pingedLanes = 0, root2.warmLanes = 0, root2.expiredLanes &= remainingLanes, root2.entangledLanes &= remainingLanes, root2.errorRecoveryDisabledLanes &= remainingLanes, root2.shellSuspendCounter = 0;
        var entanglements = root2.entanglements, expirationTimes = root2.expirationTimes, hiddenUpdates = root2.hiddenUpdates;
        for (remainingLanes = previouslyPendingLanes & ~remainingLanes; 0 < remainingLanes; ) {
          var index$7 = 31 - clz32(remainingLanes), lane = 1 << index$7;
          entanglements[index$7] = 0, expirationTimes[index$7] = -1;
          var hiddenUpdatesForLane = hiddenUpdates[index$7];
          if (hiddenUpdatesForLane !== null)
            for (hiddenUpdates[index$7] = null, index$7 = 0; index$7 < hiddenUpdatesForLane.length; index$7++) {
              var update = hiddenUpdatesForLane[index$7];
              update !== null && (update.lane &= -536870913);
            }
          remainingLanes &= ~lane;
        }
        spawnedLane !== 0 && markSpawnedDeferredLane(root2, spawnedLane, 0), suspendedRetryLanes !== 0 && updatedLanes === 0 && root2.tag !== 0 && (root2.suspendedLanes |= suspendedRetryLanes & ~(previouslyPendingLanes & ~finishedLanes));
      }
      function markSpawnedDeferredLane(root2, spawnedLane, entangledLanes) {
        root2.pendingLanes |= spawnedLane, root2.suspendedLanes &= ~spawnedLane;
        var spawnedLaneIndex = 31 - clz32(spawnedLane);
        root2.entangledLanes |= spawnedLane, root2.entanglements[spawnedLaneIndex] = root2.entanglements[spawnedLaneIndex] | 1073741824 | entangledLanes & 261930;
      }
      function markRootEntangled(root2, entangledLanes) {
        var rootEntangledLanes = root2.entangledLanes |= entangledLanes;
        for (root2 = root2.entanglements; rootEntangledLanes; ) {
          var index$8 = 31 - clz32(rootEntangledLanes), lane = 1 << index$8;
          lane & entangledLanes | root2[index$8] & entangledLanes && (root2[index$8] |= entangledLanes), rootEntangledLanes &= ~lane;
        }
      }
      function getBumpedLaneForHydration(root2, renderLanes2) {
        var renderLane = renderLanes2 & -renderLanes2;
        return renderLane = (renderLane & 42) !== 0 ? 1 : getBumpedLaneForHydrationByLane(renderLane), (renderLane & (root2.suspendedLanes | renderLanes2)) !== 0 ? 0 : renderLane;
      }
      function getBumpedLaneForHydrationByLane(lane) {
        switch (lane) {
          case 2:
            lane = 1;
            break;
          case 8:
            lane = 4;
            break;
          case 32:
            lane = 16;
            break;
          case 256:
          case 512:
          case 1024:
          case 2048:
          case 4096:
          case 8192:
          case 16384:
          case 32768:
          case 65536:
          case 131072:
          case 262144:
          case 524288:
          case 1048576:
          case 2097152:
          case 4194304:
          case 8388608:
          case 16777216:
          case 33554432:
            lane = 128;
            break;
          case 268435456:
            lane = 134217728;
            break;
          default:
            lane = 0;
        }
        return lane;
      }
      function lanesToEventPriority(lanes) {
        return lanes &= -lanes, 2 < lanes ? 8 < lanes ? (lanes & 134217727) !== 0 ? 32 : 268435456 : 8 : 2;
      }
      function resolveUpdatePriority() {
        var updatePriority = ReactDOMSharedInternals.p;
        return updatePriority !== 0 ? updatePriority : (updatePriority = window.event, updatePriority === void 0 ? 32 : getEventPriority(updatePriority.type));
      }
      function runWithPriority(priority, fn) {
        var previousPriority = ReactDOMSharedInternals.p;
        try {
          return ReactDOMSharedInternals.p = priority, fn();
        } finally {
          ReactDOMSharedInternals.p = previousPriority;
        }
      }
      var randomKey = Math.random().toString(36).slice(2), internalInstanceKey = "__reactFiber$" + randomKey, internalPropsKey = "__reactProps$" + randomKey, internalContainerInstanceKey = "__reactContainer$" + randomKey, internalEventHandlersKey = "__reactEvents$" + randomKey, internalEventHandlerListenersKey = "__reactListeners$" + randomKey, internalEventHandlesSetKey = "__reactHandles$" + randomKey, internalRootNodeResourcesKey = "__reactResources$" + randomKey, internalHoistableMarker = "__reactMarker$" + randomKey, internalLoadPendingKey = "__reactLoad$" + randomKey;
      function detachDeletedInstance(node) {
        delete node[internalInstanceKey], delete node[internalPropsKey], delete node[internalEventHandlerListenersKey], delete node[internalEventHandlesSetKey];
      }
      function getClosestInstanceFromNode(targetNode) {
        var targetInst;
        if (targetInst = targetNode[internalInstanceKey]) return targetInst;
        for (var parentNode = targetNode.parentNode; parentNode; ) {
          if (targetInst = parentNode[internalContainerInstanceKey] || parentNode[internalInstanceKey]) {
            if (parentNode = targetInst.alternate, targetInst.child !== null || parentNode !== null && parentNode.child !== null)
              for (targetNode = getParentHydrationBoundary(targetNode); targetNode !== null; ) {
                if (parentNode = targetNode[internalInstanceKey]) return parentNode;
                targetNode = getParentHydrationBoundary(targetNode);
              }
            return targetInst;
          }
          targetNode = parentNode, parentNode = targetNode.parentNode;
        }
        return null;
      }
      function getInstanceFromNode(node) {
        if (node = node[internalInstanceKey] || node[internalContainerInstanceKey]) {
          var tag = node.tag;
          if (tag === 5 || tag === 6 || tag === 13 || tag === 31 || tag === 26 || tag === 27 || tag === 3)
            return node;
        }
        return null;
      }
      function getNodeFromInstance(inst) {
        var tag = inst.tag;
        if (tag === 5 || tag === 26 || tag === 27 || tag === 6) return inst.stateNode;
        throw Error(formatProdErrorMessage(33));
      }
      function getResourcesFromRoot(root2) {
        var resources = root2[internalRootNodeResourcesKey];
        return resources || (resources = root2[internalRootNodeResourcesKey] = { hoistableStyles: /* @__PURE__ */ new Map(), hoistableScripts: /* @__PURE__ */ new Map() }), resources;
      }
      function markNodeAsHoistable(node) {
        node[internalHoistableMarker] = !0;
      }
      function clearPendingLoadOnNode(node) {
        node[internalLoadPendingKey] = void 0;
      }
      var allNativeEvents = /* @__PURE__ */ new Set(), registrationNameDependencies = {};
      function registerTwoPhaseEvent(registrationName, dependencies) {
        registerDirectEvent(registrationName, dependencies), registerDirectEvent(registrationName + "Capture", dependencies);
      }
      function registerDirectEvent(registrationName, dependencies) {
        for (registrationNameDependencies[registrationName] = dependencies, registrationName = 0; registrationName < dependencies.length; registrationName++)
          allNativeEvents.add(dependencies[registrationName]);
      }
      var VALID_ATTRIBUTE_NAME_REGEX = RegExp(
        "^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$"
      ), illegalAttributeNameCache = {}, validatedAttributeNameCache = {};
      function isAttributeNameSafe(attributeName) {
        return hasOwnProperty.call(validatedAttributeNameCache, attributeName) ? !0 : hasOwnProperty.call(illegalAttributeNameCache, attributeName) ? !1 : VALID_ATTRIBUTE_NAME_REGEX.test(attributeName) ? validatedAttributeNameCache[attributeName] = !0 : (illegalAttributeNameCache[attributeName] = !0, !1);
      }
      var viewTransitionMutationContext = !1;
      function pushMutationContext() {
        var prev = viewTransitionMutationContext;
        return viewTransitionMutationContext = !1, prev;
      }
      function setValueForAttribute(node, name, value) {
        if (isAttributeNameSafe(name))
          if (value === null) node.removeAttribute(name);
          else {
            switch (typeof value) {
              case "undefined":
              case "function":
              case "symbol":
                node.removeAttribute(name);
                return;
              case "boolean":
                var prefix$10 = name.toLowerCase().slice(0, 5);
                if (prefix$10 !== "data-" && prefix$10 !== "aria-") {
                  node.removeAttribute(name);
                  return;
                }
            }
            node.setAttribute(name, value);
          }
      }
      function setValueForKnownAttribute(node, name, value) {
        if (value === null) node.removeAttribute(name);
        else {
          switch (typeof value) {
            case "undefined":
            case "function":
            case "symbol":
            case "boolean":
              node.removeAttribute(name);
              return;
          }
          node.setAttribute(name, value);
        }
      }
      function setValueForNamespacedAttribute(node, namespace, name, value) {
        if (value === null) node.removeAttribute(name);
        else {
          switch (typeof value) {
            case "undefined":
            case "function":
            case "symbol":
            case "boolean":
              node.removeAttribute(name);
              return;
          }
          node.setAttributeNS(namespace, name, value);
        }
      }
      function getToStringValue(value) {
        switch (typeof value) {
          case "bigint":
          case "boolean":
          case "number":
          case "string":
          case "undefined":
            return value;
          case "object":
            return value;
          default:
            return "";
        }
      }
      function isCheckable(elem) {
        var type = elem.type;
        return (elem = elem.nodeName) && elem.toLowerCase() === "input" && (type === "checkbox" || type === "radio");
      }
      function trackValueOnNode(node, valueField, currentValue) {
        var descriptor = Object.getOwnPropertyDescriptor(
          node.constructor.prototype,
          valueField
        );
        if (!node.hasOwnProperty(valueField) && typeof descriptor < "u" && typeof descriptor.get == "function" && typeof descriptor.set == "function") {
          var get = descriptor.get, set = descriptor.set;
          return Object.defineProperty(node, valueField, {
            configurable: !0,
            get: function() {
              return get.call(this);
            },
            set: function(value) {
              currentValue = "" + value, set.call(this, value);
            }
          }), Object.defineProperty(node, valueField, {
            enumerable: descriptor.enumerable
          }), {
            getValue: function() {
              return currentValue;
            },
            setValue: function(value) {
              currentValue = "" + value;
            },
            stopTracking: function() {
              node._valueTracker = null, delete node[valueField];
            }
          };
        }
      }
      function track(node) {
        if (!node._valueTracker) {
          var valueField = isCheckable(node) ? "checked" : "value";
          node._valueTracker = trackValueOnNode(
            node,
            valueField,
            "" + node[valueField]
          );
        }
      }
      function updateValueIfChanged(node) {
        if (!node) return !1;
        var tracker = node._valueTracker;
        if (!tracker) return !0;
        var lastValue = tracker.getValue(), value = "";
        return node && (value = isCheckable(node) ? node.checked ? "true" : "false" : node.value), node = value, node !== lastValue ? (tracker.setValue(node), !0) : !1;
      }
      var escapeSelectorAttributeValueInsideDoubleQuotesRegex = /[\n"\\]/g;
      function escapeSelectorAttributeValueInsideDoubleQuotes(value) {
        return value.replace(
          escapeSelectorAttributeValueInsideDoubleQuotesRegex,
          function(ch) {
            return "\\" + ch.charCodeAt(0).toString(16) + " ";
          }
        );
      }
      function updateInput(element, value, defaultValue, lastDefaultValue, checked, defaultChecked, type, name) {
        element.name = "", type != null && typeof type != "function" && typeof type != "symbol" && typeof type != "boolean" ? element.type = type : element.removeAttribute("type"), value != null ? type === "number" ? (value === 0 && element.value === "" || element.value != value) && (element.value = "" + getToStringValue(value)) : element.value !== "" + getToStringValue(value) && (element.value = "" + getToStringValue(value)) : type !== "submit" && type !== "reset" || element.removeAttribute("value"), value != null ? type === "number" && element.value == value ? setDefaultValue(element, getToStringValue(element.value)) : setDefaultValue(element, getToStringValue(value)) : defaultValue != null ? setDefaultValue(element, getToStringValue(defaultValue)) : lastDefaultValue != null && element.removeAttribute("value"), checked == null && defaultChecked != null && (element.defaultChecked = !!defaultChecked), checked != null && (element.checked = checked && typeof checked != "function" && typeof checked != "symbol"), name != null && typeof name != "function" && typeof name != "symbol" && typeof name != "boolean" ? element.name = "" + getToStringValue(name) : element.removeAttribute("name");
      }
      function initInput(element, value, defaultValue, checked, defaultChecked, type, name, isHydrating2) {
        if (type != null && typeof type != "function" && typeof type != "symbol" && typeof type != "boolean" && (element.type = type), value != null || defaultValue != null) {
          if (!(type !== "submit" && type !== "reset" || value != null)) {
            track(element);
            return;
          }
          defaultValue = defaultValue != null ? "" + getToStringValue(defaultValue) : "", value = value != null ? "" + getToStringValue(value) : defaultValue, isHydrating2 || value === element.value || (element.value = value), element.defaultValue = value;
        }
        checked = checked ?? defaultChecked, checked = typeof checked != "function" && typeof checked != "symbol" && !!checked, element.checked = isHydrating2 ? element.checked : !!checked, element.defaultChecked = !!checked, name != null && typeof name != "function" && typeof name != "symbol" && typeof name != "boolean" && (element.name = name), track(element);
      }
      function setDefaultValue(node, value) {
        node.defaultValue !== "" + value && (node.defaultValue = "" + value);
      }
      function updateOptions(node, multiple, propValue, setDefaultSelected) {
        if (node = node.options, multiple) {
          multiple = {};
          for (var i = 0; i < propValue.length; i++)
            multiple["$" + propValue[i]] = !0;
          for (propValue = 0; propValue < node.length; propValue++)
            i = multiple.hasOwnProperty("$" + node[propValue].value), node[propValue].selected !== i && (node[propValue].selected = i), i && setDefaultSelected && (node[propValue].defaultSelected = !0);
        } else {
          for (propValue = "" + getToStringValue(propValue), multiple = null, i = 0; i < node.length; i++) {
            if (node[i].value === propValue) {
              node[i].selected = !0, setDefaultSelected && (node[i].defaultSelected = !0);
              return;
            }
            multiple !== null || node[i].disabled || (multiple = node[i]);
          }
          multiple !== null && (multiple.selected = !0);
        }
      }
      function updateTextarea(element, value, defaultValue) {
        if (value != null && (value = "" + getToStringValue(value), value !== element.value && (element.value = value), defaultValue == null)) {
          element.defaultValue !== value && (element.defaultValue = value);
          return;
        }
        element.defaultValue = defaultValue != null ? "" + getToStringValue(defaultValue) : "";
      }
      function initTextarea(element, value, defaultValue, children) {
        if (value == null) {
          if (children != null) {
            if (defaultValue != null) throw Error(formatProdErrorMessage(92));
            if (isArrayImpl(children)) {
              if (1 < children.length) throw Error(formatProdErrorMessage(93));
              children = children[0];
            }
            defaultValue = children;
          }
          defaultValue == null && (defaultValue = ""), value = defaultValue;
        }
        defaultValue = getToStringValue(value), element.defaultValue = defaultValue, children = element.textContent, children === defaultValue && children !== "" && children !== null && (element.value = children), track(element);
      }
      function setTextContent(node, text) {
        if (text) {
          var firstChild = node.firstChild;
          if (firstChild && firstChild === node.lastChild && firstChild.nodeType === 3) {
            firstChild.nodeValue = text;
            return;
          }
        }
        node.textContent = text;
      }
      var unitlessNumbers = new Set(
        "animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(
          " "
        )
      );
      function setValueForStyle(style2, styleName, value) {
        var isCustomProperty = styleName.indexOf("--") === 0;
        value == null || typeof value == "boolean" || value === "" ? isCustomProperty ? style2.setProperty(styleName, "") : styleName === "float" ? style2.cssFloat = "" : style2[styleName] = "" : isCustomProperty ? style2.setProperty(styleName, value) : typeof value != "number" || value === 0 || unitlessNumbers.has(styleName) ? styleName === "float" ? style2.cssFloat = value : style2[styleName] = ("" + value).trim() : style2[styleName] = value + "px";
      }
      function setValueForStyles(node, styles, prevStyles) {
        if (styles != null && typeof styles != "object")
          throw Error(formatProdErrorMessage(62));
        if (node = node.style, prevStyles != null) {
          for (var styleName in prevStyles)
            !prevStyles.hasOwnProperty(styleName) || styles != null && styles.hasOwnProperty(styleName) || (styleName.indexOf("--") === 0 ? node.setProperty(styleName, "") : styleName === "float" ? node.cssFloat = "" : node[styleName] = "", viewTransitionMutationContext = !0);
          for (var styleName$16 in styles)
            styleName = styles[styleName$16], styles.hasOwnProperty(styleName$16) && prevStyles[styleName$16] !== styleName && (setValueForStyle(node, styleName$16, styleName), viewTransitionMutationContext = !0);
        } else
          for (var styleName$17 in styles)
            styles.hasOwnProperty(styleName$17) && setValueForStyle(node, styleName$17, styles[styleName$17]);
      }
      function isCustomElement(tagName) {
        if (tagName.indexOf("-") === -1) return !1;
        switch (tagName) {
          case "annotation-xml":
          case "color-profile":
          case "font-face":
          case "font-face-src":
          case "font-face-uri":
          case "font-face-format":
          case "font-face-name":
          case "missing-glyph":
            return !1;
          default:
            return !0;
        }
      }
      var aliases = /* @__PURE__ */ new Map([
        ["acceptCharset", "accept-charset"],
        ["htmlFor", "for"],
        ["httpEquiv", "http-equiv"],
        ["crossOrigin", "crossorigin"],
        ["accentHeight", "accent-height"],
        ["alignmentBaseline", "alignment-baseline"],
        ["arabicForm", "arabic-form"],
        ["baselineShift", "baseline-shift"],
        ["capHeight", "cap-height"],
        ["clipPath", "clip-path"],
        ["clipRule", "clip-rule"],
        ["colorInterpolation", "color-interpolation"],
        ["colorInterpolationFilters", "color-interpolation-filters"],
        ["colorProfile", "color-profile"],
        ["colorRendering", "color-rendering"],
        ["dominantBaseline", "dominant-baseline"],
        ["enableBackground", "enable-background"],
        ["fillOpacity", "fill-opacity"],
        ["fillRule", "fill-rule"],
        ["floodColor", "flood-color"],
        ["floodOpacity", "flood-opacity"],
        ["fontFamily", "font-family"],
        ["fontSize", "font-size"],
        ["fontSizeAdjust", "font-size-adjust"],
        ["fontStretch", "font-stretch"],
        ["fontStyle", "font-style"],
        ["fontVariant", "font-variant"],
        ["fontWeight", "font-weight"],
        ["glyphName", "glyph-name"],
        ["glyphOrientationHorizontal", "glyph-orientation-horizontal"],
        ["glyphOrientationVertical", "glyph-orientation-vertical"],
        ["horizAdvX", "horiz-adv-x"],
        ["horizOriginX", "horiz-origin-x"],
        ["imageRendering", "image-rendering"],
        ["letterSpacing", "letter-spacing"],
        ["lightingColor", "lighting-color"],
        ["markerEnd", "marker-end"],
        ["markerMid", "marker-mid"],
        ["markerStart", "marker-start"],
        ["maskType", "mask-type"],
        ["overlinePosition", "overline-position"],
        ["overlineThickness", "overline-thickness"],
        ["paintOrder", "paint-order"],
        ["panose-1", "panose-1"],
        ["pointerEvents", "pointer-events"],
        ["renderingIntent", "rendering-intent"],
        ["shapeRendering", "shape-rendering"],
        ["stopColor", "stop-color"],
        ["stopOpacity", "stop-opacity"],
        ["strikethroughPosition", "strikethrough-position"],
        ["strikethroughThickness", "strikethrough-thickness"],
        ["strokeDasharray", "stroke-dasharray"],
        ["strokeDashoffset", "stroke-dashoffset"],
        ["strokeLinecap", "stroke-linecap"],
        ["strokeLinejoin", "stroke-linejoin"],
        ["strokeMiterlimit", "stroke-miterlimit"],
        ["strokeOpacity", "stroke-opacity"],
        ["strokeWidth", "stroke-width"],
        ["textAnchor", "text-anchor"],
        ["textDecoration", "text-decoration"],
        ["textRendering", "text-rendering"],
        ["transformOrigin", "transform-origin"],
        ["underlinePosition", "underline-position"],
        ["underlineThickness", "underline-thickness"],
        ["unicodeBidi", "unicode-bidi"],
        ["unicodeRange", "unicode-range"],
        ["unitsPerEm", "units-per-em"],
        ["vAlphabetic", "v-alphabetic"],
        ["vHanging", "v-hanging"],
        ["vIdeographic", "v-ideographic"],
        ["vMathematical", "v-mathematical"],
        ["vectorEffect", "vector-effect"],
        ["vertAdvY", "vert-adv-y"],
        ["vertOriginX", "vert-origin-x"],
        ["vertOriginY", "vert-origin-y"],
        ["wordSpacing", "word-spacing"],
        ["writingMode", "writing-mode"],
        ["xmlnsXlink", "xmlns:xlink"],
        ["xHeight", "x-height"]
      ]), isJavaScriptProtocol = /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;
      function sanitizeURL(url) {
        return isJavaScriptProtocol.test("" + url) ? "javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')" : url;
      }
      function noop$1() {
      }
      var currentReplayingEvent = null;
      function getEventTarget(nativeEvent) {
        return nativeEvent = nativeEvent.target || nativeEvent.srcElement || window, nativeEvent.correspondingUseElement && (nativeEvent = nativeEvent.correspondingUseElement), nativeEvent.nodeType === 3 ? nativeEvent.parentNode : nativeEvent;
      }
      var restoreTarget = null, restoreQueue = null;
      function restoreStateOfTarget(target) {
        var internalInstance = getInstanceFromNode(target);
        if (internalInstance && (target = internalInstance.stateNode)) {
          var props = target[internalPropsKey] || null;
          a: switch (target = internalInstance.stateNode, internalInstance.type) {
            case "input":
              if (updateInput(
                target,
                props.value,
                props.defaultValue,
                props.defaultValue,
                props.checked,
                props.defaultChecked,
                props.type,
                props.name
              ), internalInstance = props.name, props.type === "radio" && internalInstance != null) {
                for (props = target; props.parentNode; ) props = props.parentNode;
                for (props = props.querySelectorAll(
                  'input[name="' + escapeSelectorAttributeValueInsideDoubleQuotes(
                    "" + internalInstance
                  ) + '"][type="radio"]'
                ), internalInstance = 0; internalInstance < props.length; internalInstance++) {
                  var otherNode = props[internalInstance];
                  if (otherNode !== target && otherNode.form === target.form) {
                    var otherProps = otherNode[internalPropsKey] || null;
                    if (!otherProps) throw Error(formatProdErrorMessage(90));
                    updateInput(
                      otherNode,
                      otherProps.value,
                      otherProps.defaultValue,
                      otherProps.defaultValue,
                      otherProps.checked,
                      otherProps.defaultChecked,
                      otherProps.type,
                      otherProps.name
                    );
                  }
                }
                for (internalInstance = 0; internalInstance < props.length; internalInstance++)
                  otherNode = props[internalInstance], otherNode.form === target.form && updateValueIfChanged(otherNode);
              }
              break a;
            case "textarea":
              updateTextarea(target, props.value, props.defaultValue);
              break a;
            case "select":
              internalInstance = props.value, internalInstance != null && updateOptions(target, !!props.multiple, internalInstance, !1);
          }
        }
      }
      var isInsideEventHandler = !1;
      function batchedUpdates$1(fn, a, b) {
        if (isInsideEventHandler) return fn(a, b);
        isInsideEventHandler = !0;
        try {
          var JSCompiler_inline_result = fn(a);
          return JSCompiler_inline_result;
        } finally {
          if (isInsideEventHandler = !1, (restoreTarget !== null || restoreQueue !== null) && (flushSyncWork$1(), restoreTarget && (a = restoreTarget, fn = restoreQueue, restoreQueue = restoreTarget = null, restoreStateOfTarget(a), fn)))
            for (a = 0; a < fn.length; a++) restoreStateOfTarget(fn[a]);
        }
      }
      function getListener(inst, registrationName) {
        var stateNode = inst.stateNode;
        if (stateNode === null) return null;
        var props = stateNode[internalPropsKey] || null;
        if (props === null) return null;
        stateNode = props[registrationName];
        a: switch (registrationName) {
          case "onClick":
          case "onClickCapture":
          case "onDoubleClick":
          case "onDoubleClickCapture":
          case "onMouseDown":
          case "onMouseDownCapture":
          case "onMouseMove":
          case "onMouseMoveCapture":
          case "onMouseUp":
          case "onMouseUpCapture":
          case "onMouseEnter":
            (props = !props.disabled) || (inst = inst.type, props = !(inst === "button" || inst === "input" || inst === "select" || inst === "textarea")), inst = !props;
            break a;
          default:
            inst = !1;
        }
        if (inst) return null;
        if (stateNode && typeof stateNode != "function")
          throw Error(
            formatProdErrorMessage(231, registrationName, typeof stateNode)
          );
        return stateNode;
      }
      var canUseDOM = !(typeof window > "u" || typeof window.document > "u" || typeof window.document.createElement > "u"), passiveBrowserEventsSupported = !1;
      if (canUseDOM)
        try {
          options2 = {}, Object.defineProperty(options2, "passive", {
            get: function() {
              passiveBrowserEventsSupported = !0;
            }
          }), window.addEventListener("test", options2, options2), window.removeEventListener("test", options2, options2);
        } catch {
          passiveBrowserEventsSupported = !1;
        }
      var options2, root = null, startText = null, fallbackText = null;
      function getData() {
        if (fallbackText) return fallbackText;
        var start, startValue = startText, startLength = startValue.length, end, endValue = "value" in root ? root.value : root.textContent, endLength = endValue.length;
        for (start = 0; start < startLength && startValue[start] === endValue[start]; start++) ;
        var minEnd = startLength - start;
        for (end = 1; end <= minEnd && startValue[startLength - end] === endValue[endLength - end]; end++) ;
        return fallbackText = endValue.slice(start, 1 < end ? 1 - end : void 0);
      }
      function getEventCharCode(nativeEvent) {
        var keyCode = nativeEvent.keyCode;
        return "charCode" in nativeEvent ? (nativeEvent = nativeEvent.charCode, nativeEvent === 0 && keyCode === 13 && (nativeEvent = 13)) : nativeEvent = keyCode, nativeEvent === 10 && (nativeEvent = 13), 32 <= nativeEvent || nativeEvent === 13 ? nativeEvent : 0;
      }
      function functionThatReturnsTrue() {
        return !0;
      }
      function functionThatReturnsFalse() {
        return !1;
      }
      function createSyntheticEvent(Interface) {
        function SyntheticBaseEvent(reactName, reactEventType, targetInst, nativeEvent, nativeEventTarget) {
          this._reactName = reactName, this._targetInst = targetInst, this.type = reactEventType, this.nativeEvent = nativeEvent, this.target = nativeEventTarget, this.currentTarget = null;
          for (var propName in Interface)
            Interface.hasOwnProperty(propName) && (reactName = Interface[propName], this[propName] = reactName ? reactName(nativeEvent) : nativeEvent[propName]);
          return this.isDefaultPrevented = (nativeEvent.defaultPrevented != null ? nativeEvent.defaultPrevented : nativeEvent.returnValue === !1) ? functionThatReturnsTrue : functionThatReturnsFalse, this.isPropagationStopped = functionThatReturnsFalse, this;
        }
        return assign(SyntheticBaseEvent.prototype, {
          preventDefault: function() {
            this.defaultPrevented = !0;
            var event = this.nativeEvent;
            event && (event.preventDefault ? event.preventDefault() : typeof event.returnValue != "unknown" && (event.returnValue = !1), this.isDefaultPrevented = functionThatReturnsTrue);
          },
          stopPropagation: function() {
            var event = this.nativeEvent;
            event && (event.stopPropagation ? event.stopPropagation() : typeof event.cancelBubble != "unknown" && (event.cancelBubble = !0), this.isPropagationStopped = functionThatReturnsTrue);
          },
          persist: function() {
          },
          isPersistent: functionThatReturnsTrue
        }), SyntheticBaseEvent;
      }
      var EventInterface = {
        eventPhase: 0,
        bubbles: 0,
        cancelable: 0,
        timeStamp: function(event) {
          return event.timeStamp || Date.now();
        },
        defaultPrevented: 0,
        isTrusted: 0
      }, SyntheticEvent = createSyntheticEvent(EventInterface), UIEventInterface = assign({}, EventInterface, { view: 0, detail: 0 }), SyntheticUIEvent = createSyntheticEvent(UIEventInterface), lastMovementX, lastMovementY, lastMouseEvent, MouseEventInterface = assign({}, UIEventInterface, {
        screenX: 0,
        screenY: 0,
        clientX: 0,
        clientY: 0,
        pageX: 0,
        pageY: 0,
        ctrlKey: 0,
        shiftKey: 0,
        altKey: 0,
        metaKey: 0,
        getModifierState: getEventModifierState,
        button: 0,
        buttons: 0,
        relatedTarget: function(event) {
          return event.relatedTarget === void 0 ? event.fromElement === event.srcElement ? event.toElement : event.fromElement : event.relatedTarget;
        },
        movementX: function(event) {
          return "movementX" in event ? event.movementX : (event !== lastMouseEvent && (lastMouseEvent && event.type === "mousemove" ? (lastMovementX = event.screenX - lastMouseEvent.screenX, lastMovementY = event.screenY - lastMouseEvent.screenY) : lastMovementY = lastMovementX = 0, lastMouseEvent = event), lastMovementX);
        },
        movementY: function(event) {
          return "movementY" in event ? event.movementY : lastMovementY;
        }
      }), SyntheticMouseEvent = createSyntheticEvent(MouseEventInterface), DragEventInterface = assign({}, MouseEventInterface, { dataTransfer: 0 }), SyntheticDragEvent = createSyntheticEvent(DragEventInterface), FocusEventInterface = assign({}, UIEventInterface, { relatedTarget: 0 }), SyntheticFocusEvent = createSyntheticEvent(FocusEventInterface), AnimationEventInterface = assign({}, EventInterface, {
        animationName: 0,
        elapsedTime: 0,
        pseudoElement: 0
      }), SyntheticAnimationEvent = createSyntheticEvent(AnimationEventInterface), ClipboardEventInterface = assign({}, EventInterface, {
        clipboardData: function(event) {
          return "clipboardData" in event ? event.clipboardData : window.clipboardData;
        }
      }), SyntheticClipboardEvent = createSyntheticEvent(ClipboardEventInterface), CompositionEventInterface = assign({}, EventInterface, { data: 0 }), SyntheticCompositionEvent = createSyntheticEvent(CompositionEventInterface), normalizeKey = {
        Esc: "Escape",
        Spacebar: " ",
        Left: "ArrowLeft",
        Up: "ArrowUp",
        Right: "ArrowRight",
        Down: "ArrowDown",
        Del: "Delete",
        Win: "OS",
        Menu: "ContextMenu",
        Apps: "ContextMenu",
        Scroll: "ScrollLock",
        MozPrintableKey: "Unidentified"
      }, translateToKey = {
        8: "Backspace",
        9: "Tab",
        12: "Clear",
        13: "Enter",
        16: "Shift",
        17: "Control",
        18: "Alt",
        19: "Pause",
        20: "CapsLock",
        27: "Escape",
        32: " ",
        33: "PageUp",
        34: "PageDown",
        35: "End",
        36: "Home",
        37: "ArrowLeft",
        38: "ArrowUp",
        39: "ArrowRight",
        40: "ArrowDown",
        45: "Insert",
        46: "Delete",
        112: "F1",
        113: "F2",
        114: "F3",
        115: "F4",
        116: "F5",
        117: "F6",
        118: "F7",
        119: "F8",
        120: "F9",
        121: "F10",
        122: "F11",
        123: "F12",
        144: "NumLock",
        145: "ScrollLock",
        224: "Meta"
      }, modifierKeyToProp = {
        Alt: "altKey",
        Control: "ctrlKey",
        Meta: "metaKey",
        Shift: "shiftKey"
      };
      function modifierStateGetter(keyArg) {
        var nativeEvent = this.nativeEvent;
        return nativeEvent.getModifierState ? nativeEvent.getModifierState(keyArg) : (keyArg = modifierKeyToProp[keyArg]) ? !!nativeEvent[keyArg] : !1;
      }
      function getEventModifierState() {
        return modifierStateGetter;
      }
      var KeyboardEventInterface = assign({}, UIEventInterface, {
        key: function(nativeEvent) {
          if (nativeEvent.key) {
            var key = normalizeKey[nativeEvent.key] || nativeEvent.key;
            if (key !== "Unidentified") return key;
          }
          return nativeEvent.type === "keypress" ? (nativeEvent = getEventCharCode(nativeEvent), nativeEvent === 13 ? "Enter" : String.fromCharCode(nativeEvent)) : nativeEvent.type === "keydown" || nativeEvent.type === "keyup" ? translateToKey[nativeEvent.keyCode] || "Unidentified" : "";
        },
        code: 0,
        location: 0,
        ctrlKey: 0,
        shiftKey: 0,
        altKey: 0,
        metaKey: 0,
        repeat: 0,
        locale: 0,
        getModifierState: getEventModifierState,
        charCode: function(event) {
          return event.type === "keypress" ? getEventCharCode(event) : 0;
        },
        keyCode: function(event) {
          return event.type === "keydown" || event.type === "keyup" ? event.keyCode : 0;
        },
        which: function(event) {
          return event.type === "keypress" ? getEventCharCode(event) : event.type === "keydown" || event.type === "keyup" ? event.keyCode : 0;
        }
      }), SyntheticKeyboardEvent = createSyntheticEvent(KeyboardEventInterface), PointerEventInterface = assign({}, MouseEventInterface, {
        pointerId: 0,
        width: 0,
        height: 0,
        pressure: 0,
        tangentialPressure: 0,
        tiltX: 0,
        tiltY: 0,
        twist: 0,
        pointerType: 0,
        isPrimary: 0
      }), SyntheticPointerEvent = createSyntheticEvent(PointerEventInterface), SubmitEventInterface = assign({}, EventInterface, { submitter: 0 }), SyntheticSubmitEvent = createSyntheticEvent(SubmitEventInterface), TouchEventInterface = assign({}, UIEventInterface, {
        touches: 0,
        targetTouches: 0,
        changedTouches: 0,
        altKey: 0,
        metaKey: 0,
        ctrlKey: 0,
        shiftKey: 0,
        getModifierState: getEventModifierState
      }), SyntheticTouchEvent = createSyntheticEvent(TouchEventInterface), TransitionEventInterface = assign({}, EventInterface, {
        propertyName: 0,
        elapsedTime: 0,
        pseudoElement: 0
      }), SyntheticTransitionEvent = createSyntheticEvent(TransitionEventInterface), WheelEventInterface = assign({}, MouseEventInterface, {
        deltaX: function(event) {
          return "deltaX" in event ? event.deltaX : "wheelDeltaX" in event ? -event.wheelDeltaX : 0;
        },
        deltaY: function(event) {
          return "deltaY" in event ? event.deltaY : "wheelDeltaY" in event ? -event.wheelDeltaY : "wheelDelta" in event ? -event.wheelDelta : 0;
        },
        deltaZ: 0,
        deltaMode: 0
      }), SyntheticWheelEvent = createSyntheticEvent(WheelEventInterface), ToggleEventInterface = assign({}, EventInterface, {
        newState: 0,
        oldState: 0,
        source: 0
      }), SyntheticToggleEvent = createSyntheticEvent(ToggleEventInterface), END_KEYCODES = [9, 13, 27, 32], canUseCompositionEvent = canUseDOM && "CompositionEvent" in window, documentMode = null;
      canUseDOM && "documentMode" in document && (documentMode = document.documentMode);
      var canUseTextInputEvent = canUseDOM && "TextEvent" in window && !documentMode, useFallbackCompositionData = canUseDOM && (!canUseCompositionEvent || documentMode && 8 < documentMode && 11 >= documentMode), SPACEBAR_CHAR = " ", hasSpaceKeypress = !1;
      function isFallbackCompositionEnd(domEventName, nativeEvent) {
        switch (domEventName) {
          case "keyup":
            return END_KEYCODES.indexOf(nativeEvent.keyCode) !== -1;
          case "keydown":
            return nativeEvent.keyCode !== 229;
          case "keypress":
          case "mousedown":
          case "focusout":
            return !0;
          default:
            return !1;
        }
      }
      function getDataFromCustomEvent(nativeEvent) {
        return nativeEvent = nativeEvent.detail, typeof nativeEvent == "object" && "data" in nativeEvent ? nativeEvent.data : null;
      }
      var isComposing = !1;
      function getNativeBeforeInputChars(domEventName, nativeEvent) {
        switch (domEventName) {
          case "compositionend":
            return getDataFromCustomEvent(nativeEvent);
          case "keypress":
            return nativeEvent.which !== 32 ? null : (hasSpaceKeypress = !0, SPACEBAR_CHAR);
          case "textInput":
            return domEventName = nativeEvent.data, domEventName === SPACEBAR_CHAR && hasSpaceKeypress ? null : domEventName;
          default:
            return null;
        }
      }
      function getFallbackBeforeInputChars(domEventName, nativeEvent) {
        if (isComposing)
          return domEventName === "compositionend" || !canUseCompositionEvent && isFallbackCompositionEnd(domEventName, nativeEvent) ? (domEventName = getData(), fallbackText = startText = root = null, isComposing = !1, domEventName) : null;
        switch (domEventName) {
          case "paste":
            return null;
          case "keypress":
            if (!(nativeEvent.ctrlKey || nativeEvent.altKey || nativeEvent.metaKey) || nativeEvent.ctrlKey && nativeEvent.altKey) {
              if (nativeEvent.char && 1 < nativeEvent.char.length)
                return nativeEvent.char;
              if (nativeEvent.which) return String.fromCharCode(nativeEvent.which);
            }
            return null;
          case "compositionend":
            return useFallbackCompositionData && nativeEvent.locale !== "ko" ? null : nativeEvent.data;
          default:
            return null;
        }
      }
      var supportedInputTypes = {
        color: !0,
        date: !0,
        datetime: !0,
        "datetime-local": !0,
        email: !0,
        month: !0,
        number: !0,
        password: !0,
        range: !0,
        search: !0,
        tel: !0,
        text: !0,
        time: !0,
        url: !0,
        week: !0
      };
      function isTextInputElement(elem) {
        var nodeName = elem && elem.nodeName && elem.nodeName.toLowerCase();
        return nodeName === "input" ? !!supportedInputTypes[elem.type] : nodeName === "textarea";
      }
      function createAndAccumulateChangeEvent(dispatchQueue, inst, nativeEvent, target) {
        restoreTarget ? restoreQueue ? restoreQueue.push(target) : restoreQueue = [target] : restoreTarget = target, inst = accumulateTwoPhaseListeners(inst, "onChange"), 0 < inst.length && (nativeEvent = new SyntheticEvent(
          "onChange",
          "change",
          null,
          nativeEvent,
          target
        ), dispatchQueue.push({ event: nativeEvent, listeners: inst }));
      }
      var activeElement$1 = null, activeElementInst$1 = null;
      function runEventInBatch(dispatchQueue) {
        processDispatchQueue(dispatchQueue, 0);
      }
      function getInstIfValueChanged(targetInst) {
        var targetNode = getNodeFromInstance(targetInst);
        if (updateValueIfChanged(targetNode)) return targetInst;
      }
      function getTargetInstForChangeEvent(domEventName, targetInst) {
        if (domEventName === "change") return targetInst;
      }
      var isInputEventSupported = !1;
      canUseDOM && (canUseDOM ? (isSupported$jscomp$inline_474 = "oninput" in document, isSupported$jscomp$inline_474 || (element$jscomp$inline_475 = document.createElement("div"), element$jscomp$inline_475.setAttribute("oninput", "return;"), isSupported$jscomp$inline_474 = typeof element$jscomp$inline_475.oninput == "function"), JSCompiler_inline_result$jscomp$318 = isSupported$jscomp$inline_474) : JSCompiler_inline_result$jscomp$318 = !1, isInputEventSupported = JSCompiler_inline_result$jscomp$318 && (!document.documentMode || 9 < document.documentMode));
      var JSCompiler_inline_result$jscomp$318, isSupported$jscomp$inline_474, element$jscomp$inline_475;
      function stopWatchingForValueChange() {
        activeElement$1 && (activeElement$1.detachEvent("onpropertychange", handlePropertyChange), activeElementInst$1 = activeElement$1 = null);
      }
      function handlePropertyChange(nativeEvent) {
        if (nativeEvent.propertyName === "value" && getInstIfValueChanged(activeElementInst$1)) {
          var dispatchQueue = [];
          createAndAccumulateChangeEvent(
            dispatchQueue,
            activeElementInst$1,
            nativeEvent,
            getEventTarget(nativeEvent)
          ), batchedUpdates$1(runEventInBatch, dispatchQueue);
        }
      }
      function handleEventsForInputEventPolyfill(domEventName, target, targetInst) {
        domEventName === "focusin" ? (stopWatchingForValueChange(), activeElement$1 = target, activeElementInst$1 = targetInst, activeElement$1.attachEvent("onpropertychange", handlePropertyChange)) : domEventName === "focusout" && stopWatchingForValueChange();
      }
      function getTargetInstForInputEventPolyfill(domEventName) {
        if (domEventName === "selectionchange" || domEventName === "keyup" || domEventName === "keydown")
          return getInstIfValueChanged(activeElementInst$1);
      }
      function getTargetInstForClickEvent(domEventName, targetInst) {
        if (domEventName === "click") return getInstIfValueChanged(targetInst);
      }
      function getTargetInstForInputOrChangeEvent(domEventName, targetInst) {
        if (domEventName === "input" || domEventName === "change")
          return getInstIfValueChanged(targetInst);
      }
      function is(x, y) {
        return x === y && (x !== 0 || 1 / x === 1 / y) || x !== x && y !== y;
      }
      var objectIs = typeof Object.is == "function" ? Object.is : is;
      function shallowEqual(objA, objB) {
        if (objectIs(objA, objB)) return !0;
        if (typeof objA != "object" || objA === null || typeof objB != "object" || objB === null)
          return !1;
        var keysA = Object.keys(objA), keysB = Object.keys(objB);
        if (keysA.length !== keysB.length) return !1;
        for (keysB = 0; keysB < keysA.length; keysB++) {
          var currentKey = keysA[keysB];
          if (!hasOwnProperty.call(objB, currentKey) || !objectIs(objA[currentKey], objB[currentKey]))
            return !1;
        }
        return !0;
      }
      function getActiveElement(doc) {
        if (doc = doc || (typeof document < "u" ? document : void 0), typeof doc > "u") return null;
        try {
          return doc.activeElement || doc.body;
        } catch {
          return doc.body;
        }
      }
      function getLeafNode(node) {
        for (; node && node.firstChild; ) node = node.firstChild;
        return node;
      }
      function getNodeForCharacterOffset(root2, offset) {
        var node = getLeafNode(root2);
        root2 = 0;
        for (var nodeEnd; node; ) {
          if (node.nodeType === 3) {
            if (nodeEnd = root2 + node.textContent.length, root2 <= offset && nodeEnd >= offset)
              return { node, offset: offset - root2 };
            root2 = nodeEnd;
          }
          a: {
            for (; node; ) {
              if (node.nextSibling) {
                node = node.nextSibling;
                break a;
              }
              node = node.parentNode;
            }
            node = void 0;
          }
          node = getLeafNode(node);
        }
      }
      function containsNode(outerNode, innerNode) {
        return outerNode && innerNode ? outerNode === innerNode ? !0 : outerNode && outerNode.nodeType === 3 ? !1 : innerNode && innerNode.nodeType === 3 ? containsNode(outerNode, innerNode.parentNode) : "contains" in outerNode ? outerNode.contains(innerNode) : outerNode.compareDocumentPosition ? !!(outerNode.compareDocumentPosition(innerNode) & 16) : !1 : !1;
      }
      function getActiveElementDeep(containerInfo) {
        containerInfo = containerInfo != null && containerInfo.ownerDocument != null && containerInfo.ownerDocument.defaultView != null ? containerInfo.ownerDocument.defaultView : window;
        for (var element = getActiveElement(containerInfo.document); element instanceof containerInfo.HTMLIFrameElement; ) {
          try {
            var JSCompiler_inline_result = typeof element.contentWindow.location.href == "string";
          } catch {
            JSCompiler_inline_result = !1;
          }
          if (JSCompiler_inline_result) containerInfo = element.contentWindow;
          else break;
          element = getActiveElement(containerInfo.document);
        }
        return element;
      }
      function hasSelectionCapabilities(elem) {
        var nodeName = elem && elem.nodeName && elem.nodeName.toLowerCase();
        return nodeName && (nodeName === "input" && (elem.type === "text" || elem.type === "search" || elem.type === "tel" || elem.type === "url" || elem.type === "password") || nodeName === "textarea" || elem.contentEditable === "true");
      }
      var skipSelectionChangeEvent = canUseDOM && "documentMode" in document && 11 >= document.documentMode, activeElement = null, activeElementInst = null, lastSelection = null, mouseDown = !1;
      function constructSelectEvent(dispatchQueue, nativeEvent, nativeEventTarget) {
        var doc = nativeEventTarget.window === nativeEventTarget ? nativeEventTarget.document : nativeEventTarget.nodeType === 9 ? nativeEventTarget : nativeEventTarget.ownerDocument;
        mouseDown || activeElement == null || activeElement !== getActiveElement(doc) || (doc = activeElement, "selectionStart" in doc && hasSelectionCapabilities(doc) ? doc = { start: doc.selectionStart, end: doc.selectionEnd } : (doc = (doc.ownerDocument && doc.ownerDocument.defaultView || window).getSelection(), doc = {
          anchorNode: doc.anchorNode,
          anchorOffset: doc.anchorOffset,
          focusNode: doc.focusNode,
          focusOffset: doc.focusOffset
        }), lastSelection && shallowEqual(lastSelection, doc) || (lastSelection = doc, doc = accumulateTwoPhaseListeners(activeElementInst, "onSelect"), 0 < doc.length && (nativeEvent = new SyntheticEvent(
          "onSelect",
          "select",
          null,
          nativeEvent,
          nativeEventTarget
        ), dispatchQueue.push({ event: nativeEvent, listeners: doc }), nativeEvent.target = activeElement)));
      }
      function makePrefixMap(styleProp, eventName) {
        var prefixes = {};
        return prefixes[styleProp.toLowerCase()] = eventName.toLowerCase(), prefixes["Webkit" + styleProp] = "webkit" + eventName, prefixes["Moz" + styleProp] = "moz" + eventName, prefixes;
      }
      var vendorPrefixes = {
        animationend: makePrefixMap("Animation", "AnimationEnd"),
        animationiteration: makePrefixMap("Animation", "AnimationIteration"),
        animationstart: makePrefixMap("Animation", "AnimationStart"),
        transitionrun: makePrefixMap("Transition", "TransitionRun"),
        transitionstart: makePrefixMap("Transition", "TransitionStart"),
        transitioncancel: makePrefixMap("Transition", "TransitionCancel"),
        transitionend: makePrefixMap("Transition", "TransitionEnd")
      }, prefixedEventNames = {}, style = {};
      canUseDOM && (style = document.createElement("div").style, "AnimationEvent" in window || (delete vendorPrefixes.animationend.animation, delete vendorPrefixes.animationiteration.animation, delete vendorPrefixes.animationstart.animation), "TransitionEvent" in window || delete vendorPrefixes.transitionend.transition);
      function getVendorPrefixedEventName(eventName) {
        if (prefixedEventNames[eventName]) return prefixedEventNames[eventName];
        if (!vendorPrefixes[eventName]) return eventName;
        var prefixMap = vendorPrefixes[eventName], styleProp;
        for (styleProp in prefixMap)
          if (prefixMap.hasOwnProperty(styleProp) && styleProp in style)
            return prefixedEventNames[eventName] = prefixMap[styleProp];
        return eventName;
      }
      var ANIMATION_END = getVendorPrefixedEventName("animationend"), ANIMATION_ITERATION = getVendorPrefixedEventName("animationiteration"), ANIMATION_START = getVendorPrefixedEventName("animationstart"), TRANSITION_RUN = getVendorPrefixedEventName("transitionrun"), TRANSITION_START = getVendorPrefixedEventName("transitionstart"), TRANSITION_CANCEL = getVendorPrefixedEventName("transitioncancel"), TRANSITION_END = getVendorPrefixedEventName("transitionend"), topLevelEventsToReactNames = /* @__PURE__ */ new Map(), simpleEventPluginEvents = "abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error fullscreenChange fullscreenError gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(
        " "
      );
      simpleEventPluginEvents.push("scrollEnd");
      function registerSimpleEvent(domEventName, reactName) {
        topLevelEventsToReactNames.set(domEventName, reactName), registerTwoPhaseEvent(reactName, [domEventName]);
      }
      var globalClientIdCounter$1 = 0;
      function getViewTransitionName(props, instance) {
        if (props.name != null && props.name !== "auto") return props.name;
        if (instance.autoName !== null) return instance.autoName;
        props = pendingEffectsRoot.identifierPrefix;
        var globalClientId = globalClientIdCounter$1++;
        return props = "_" + props + "t_" + globalClientId.toString(32) + "_", instance.autoName = props;
      }
      function getClassNameByType(classByType) {
        if (classByType == null || typeof classByType == "string")
          return classByType;
        var className = null, activeTypes = pendingTransitionTypes;
        if (activeTypes !== null)
          for (var i = 0; i < activeTypes.length; i++) {
            var match = classByType[activeTypes[i]];
            if (match != null) {
              if (match === "none") return "none";
              className = className == null ? match : className + (" " + match);
            }
          }
        return className ?? classByType.default;
      }
      function getViewTransitionClassName(defaultClass, eventClass) {
        return defaultClass = getClassNameByType(defaultClass), eventClass = getClassNameByType(eventClass), eventClass == null ? defaultClass === "auto" ? null : defaultClass : eventClass === "auto" ? null : eventClass;
      }
      var reportGlobalError = typeof reportError == "function" ? reportError : function(error) {
        if (typeof window == "object" && typeof window.ErrorEvent == "function") {
          var event = new window.ErrorEvent("error", {
            bubbles: !0,
            cancelable: !0,
            message: typeof error == "object" && error !== null && typeof error.message == "string" ? String(error.message) : String(error),
            error
          });
          if (!window.dispatchEvent(event)) return;
        } else if (typeof process == "object" && typeof process.emit == "function") {
          process.emit("uncaughtException", error);
          return;
        }
        console.error(error);
      }, concurrentQueues = [], concurrentQueuesIndex = 0, concurrentlyUpdatedLanes = 0;
      function finishQueueingConcurrentUpdates() {
        for (var endIndex = concurrentQueuesIndex, i = concurrentlyUpdatedLanes = concurrentQueuesIndex = 0; i < endIndex; ) {
          var fiber = concurrentQueues[i];
          concurrentQueues[i++] = null;
          var queue = concurrentQueues[i];
          concurrentQueues[i++] = null;
          var update = concurrentQueues[i];
          concurrentQueues[i++] = null;
          var lane = concurrentQueues[i];
          if (concurrentQueues[i++] = null, queue !== null && update !== null) {
            var pending = queue.pending;
            pending === null ? update.next = update : (update.next = pending.next, pending.next = update), queue.pending = update;
          }
          lane !== 0 && markUpdateLaneFromFiberToRoot(fiber, update, lane);
        }
      }
      function enqueueUpdate$1(fiber, queue, update, lane) {
        concurrentQueues[concurrentQueuesIndex++] = fiber, concurrentQueues[concurrentQueuesIndex++] = queue, concurrentQueues[concurrentQueuesIndex++] = update, concurrentQueues[concurrentQueuesIndex++] = lane, concurrentlyUpdatedLanes |= lane, fiber.lanes |= lane, fiber = fiber.alternate, fiber !== null && (fiber.lanes |= lane);
      }
      function enqueueConcurrentHookUpdate(fiber, queue, update, lane) {
        return enqueueUpdate$1(fiber, queue, update, lane), getRootForUpdatedFiber(fiber);
      }
      function enqueueConcurrentRenderForLane(fiber, lane) {
        return enqueueUpdate$1(fiber, null, null, lane), getRootForUpdatedFiber(fiber);
      }
      function markUpdateLaneFromFiberToRoot(sourceFiber, update, lane) {
        sourceFiber.lanes |= lane;
        var alternate = sourceFiber.alternate;
        alternate !== null && (alternate.lanes |= lane);
        for (var isHidden = !1, parent = sourceFiber.return; parent !== null; )
          parent.childLanes |= lane, alternate = parent.alternate, alternate !== null && (alternate.childLanes |= lane), parent.tag === 22 && (sourceFiber = parent.stateNode, sourceFiber === null || sourceFiber._visibility & 1 || (isHidden = !0)), sourceFiber = parent, parent = parent.return;
        return sourceFiber.tag === 3 ? (parent = sourceFiber.stateNode, isHidden && update !== null && (isHidden = 31 - clz32(lane), sourceFiber = parent.hiddenUpdates, alternate = sourceFiber[isHidden], alternate === null ? sourceFiber[isHidden] = [update] : alternate.push(update), update.lane = lane | 536870912), parent) : null;
      }
      function getRootForUpdatedFiber(sourceFiber) {
        if (50 < nestedUpdateCount)
          throw nestedUpdateCount = 0, rootWithNestedUpdates = null, Error(formatProdErrorMessage(185));
        for (var parent = sourceFiber.return; parent !== null; )
          sourceFiber = parent, parent = sourceFiber.return;
        return sourceFiber.tag === 3 ? sourceFiber.stateNode : null;
      }
      var emptyContextObject = {};
      function FiberNode(tag, pendingProps, key, mode) {
        this.tag = tag, this.key = key, this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null, this.index = 0, this.refCleanup = this.ref = null, this.pendingProps = pendingProps, this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null, this.mode = mode, this.subtreeFlags = this.flags = 0, this.deletions = null, this.childLanes = this.lanes = 0, this.alternate = null;
      }
      function createFiberImplClass(tag, pendingProps, key, mode) {
        return new FiberNode(tag, pendingProps, key, mode);
      }
      function shouldConstruct(Component) {
        return Component = Component.prototype, !(!Component || !Component.isReactComponent);
      }
      function createWorkInProgress(current2, pendingProps) {
        var workInProgress2 = current2.alternate;
        return workInProgress2 === null ? (workInProgress2 = createFiberImplClass(
          current2.tag,
          pendingProps,
          current2.key,
          current2.mode
        ), workInProgress2.elementType = current2.elementType, workInProgress2.type = current2.type, workInProgress2.stateNode = current2.stateNode, workInProgress2.alternate = current2, current2.alternate = workInProgress2) : (workInProgress2.pendingProps = pendingProps, workInProgress2.type = current2.type, workInProgress2.flags = 0, workInProgress2.subtreeFlags = 0, workInProgress2.deletions = null), workInProgress2.flags = current2.flags & 1206910976, workInProgress2.childLanes = current2.childLanes, workInProgress2.lanes = current2.lanes, workInProgress2.child = current2.child, workInProgress2.memoizedProps = current2.memoizedProps, workInProgress2.memoizedState = current2.memoizedState, workInProgress2.updateQueue = current2.updateQueue, pendingProps = current2.dependencies, workInProgress2.dependencies = pendingProps === null ? null : { lanes: pendingProps.lanes, firstContext: pendingProps.firstContext }, workInProgress2.sibling = current2.sibling, workInProgress2.index = current2.index, workInProgress2.ref = current2.ref, workInProgress2.refCleanup = current2.refCleanup, workInProgress2;
      }
      function resetWorkInProgress(workInProgress2, renderLanes2) {
        workInProgress2.flags &= 1206910978;
        var current2 = workInProgress2.alternate;
        return current2 === null ? (workInProgress2.childLanes = 0, workInProgress2.lanes = renderLanes2, workInProgress2.child = null, workInProgress2.subtreeFlags = 0, workInProgress2.memoizedProps = null, workInProgress2.memoizedState = null, workInProgress2.updateQueue = null, workInProgress2.dependencies = null, workInProgress2.stateNode = null) : (workInProgress2.childLanes = current2.childLanes, workInProgress2.lanes = current2.lanes, workInProgress2.child = current2.child, workInProgress2.subtreeFlags = 0, workInProgress2.deletions = null, workInProgress2.memoizedProps = current2.memoizedProps, workInProgress2.memoizedState = current2.memoizedState, workInProgress2.updateQueue = current2.updateQueue, workInProgress2.type = current2.type, renderLanes2 = current2.dependencies, workInProgress2.dependencies = renderLanes2 === null ? null : {
          lanes: renderLanes2.lanes,
          firstContext: renderLanes2.firstContext
        }), workInProgress2;
      }
      function createFiberFromTypeAndProps(type, key, pendingProps, owner, mode, lanes) {
        var fiberTag = 0;
        if (owner = type, typeof owner == "function") shouldConstruct(owner) && (fiberTag = 1);
        else if (typeof owner == "string")
          fiberTag = isHostHoistableType(
            type,
            pendingProps,
            contextStackCursor.current
          ) ? 26 : type === "html" || type === "head" || type === "body" ? 27 : 5;
        else
          a: switch (owner) {
            case REACT_ACTIVITY_TYPE:
              return type = createFiberImplClass(31, pendingProps, key, mode), type.elementType = REACT_ACTIVITY_TYPE, type.lanes = lanes, type;
            case REACT_FRAGMENT_TYPE:
              return createFiberFromFragment(pendingProps.children, mode, lanes, key);
            case REACT_STRICT_MODE_TYPE:
              fiberTag = 8, mode |= 24;
              break;
            case REACT_PROFILER_TYPE:
              return type = createFiberImplClass(12, pendingProps, key, mode | 2), type.elementType = REACT_PROFILER_TYPE, type.lanes = lanes, type;
            case REACT_SUSPENSE_TYPE:
              return type = createFiberImplClass(13, pendingProps, key, mode), type.elementType = REACT_SUSPENSE_TYPE, type.lanes = lanes, type;
            case REACT_SUSPENSE_LIST_TYPE:
              return type = createFiberImplClass(19, pendingProps, key, mode), type.elementType = REACT_SUSPENSE_LIST_TYPE, type.lanes = lanes, type;
            case REACT_LEGACY_HIDDEN_TYPE:
            case REACT_VIEW_TRANSITION_TYPE:
              return type = mode | 32, type = createFiberImplClass(30, pendingProps, key, type), type.elementType = REACT_VIEW_TRANSITION_TYPE, type.lanes = lanes, type.stateNode = {
                autoName: null,
                paired: null,
                clones: null,
                ref: null
              }, type;
            default:
              if (typeof owner == "object" && owner !== null)
                switch (owner.$$typeof) {
                  case REACT_CONTEXT_TYPE:
                    fiberTag = 10;
                    break a;
                  case REACT_CONSUMER_TYPE:
                    fiberTag = 9;
                    break a;
                  case REACT_FORWARD_REF_TYPE:
                    fiberTag = 11;
                    break a;
                  case REACT_MEMO_TYPE:
                    fiberTag = 14;
                    break a;
                  case REACT_LAZY_TYPE:
                    fiberTag = 16, owner = null;
                    break a;
                }
              fiberTag = 29, pendingProps = Error(
                formatProdErrorMessage(130, type === null ? "null" : typeof type, "")
              ), owner = null;
          }
        return key = createFiberImplClass(fiberTag, pendingProps, key, mode), key.elementType = type, key.type = owner, key.lanes = lanes, key;
      }
      function createFiberFromFragment(elements, mode, lanes, key) {
        return elements = createFiberImplClass(7, elements, key, mode), elements.lanes = lanes, elements;
      }
      function createFiberFromText(content, mode, lanes) {
        return content = createFiberImplClass(6, content, null, mode), content.lanes = lanes, content;
      }
      function createFiberFromDehydratedFragment(dehydratedNode) {
        var fiber = createFiberImplClass(18, null, null, 0);
        return fiber.stateNode = dehydratedNode, fiber;
      }
      function createFiberFromPortal(portal, mode, lanes) {
        return mode = createFiberImplClass(
          4,
          portal.children !== null ? portal.children : [],
          portal.key,
          mode
        ), mode.lanes = lanes, mode.stateNode = {
          containerInfo: portal.containerInfo,
          pendingChildren: null,
          implementation: portal.implementation
        }, mode;
      }
      var CapturedStacks = /* @__PURE__ */ new WeakMap();
      function createCapturedValueAtFiber(value, source) {
        if (typeof value == "object" && value !== null) {
          var existing = CapturedStacks.get(value);
          return existing !== void 0 ? existing : (source = {
            value,
            source,
            stack: getStackByFiberInDevAndProd(source)
          }, CapturedStacks.set(value, source), source);
        }
        return {
          value,
          source,
          stack: getStackByFiberInDevAndProd(source)
        };
      }
      var forkStack = [], forkStackIndex = 0, treeForkProvider = null, treeForkCount = 0, idStack = [], idStackIndex = 0, treeContextProvider = null, treeContextId = 1, treeContextOverflow = "";
      function pushTreeFork(workInProgress2, totalChildren) {
        forkStack[forkStackIndex++] = treeForkCount, forkStack[forkStackIndex++] = treeForkProvider, treeForkProvider = workInProgress2, treeForkCount = totalChildren;
      }
      function pushTreeId(workInProgress2, totalChildren, index2) {
        idStack[idStackIndex++] = treeContextId, idStack[idStackIndex++] = treeContextOverflow, idStack[idStackIndex++] = treeContextProvider, treeContextProvider = workInProgress2;
        var baseIdWithLeadingBit = treeContextId;
        workInProgress2 = treeContextOverflow;
        var baseLength = 32 - clz32(baseIdWithLeadingBit) - 1;
        baseIdWithLeadingBit &= ~(1 << baseLength), index2 += 1;
        var length = 32 - clz32(totalChildren) + baseLength;
        if (30 < length) {
          var numberOfOverflowBits = baseLength - baseLength % 5;
          length = (baseIdWithLeadingBit & (1 << numberOfOverflowBits) - 1).toString(32), baseIdWithLeadingBit >>= numberOfOverflowBits, baseLength -= numberOfOverflowBits, treeContextId = 1 << 32 - clz32(totalChildren) + baseLength | index2 << baseLength | baseIdWithLeadingBit, treeContextOverflow = length + workInProgress2;
        } else
          treeContextId = 1 << length | index2 << baseLength | baseIdWithLeadingBit, treeContextOverflow = workInProgress2;
      }
      function pushMaterializedTreeId(workInProgress2) {
        workInProgress2.return !== null && (pushTreeFork(workInProgress2, 1), pushTreeId(workInProgress2, 1, 0));
      }
      function popTreeContext(workInProgress2) {
        for (; workInProgress2 === treeForkProvider; )
          treeForkProvider = forkStack[--forkStackIndex], forkStack[forkStackIndex] = null, treeForkCount = forkStack[--forkStackIndex], forkStack[forkStackIndex] = null;
        for (; workInProgress2 === treeContextProvider; )
          treeContextProvider = idStack[--idStackIndex], idStack[idStackIndex] = null, treeContextOverflow = idStack[--idStackIndex], idStack[idStackIndex] = null, treeContextId = idStack[--idStackIndex], idStack[idStackIndex] = null;
      }
      function restoreSuspendedTreeContext(workInProgress2, suspendedContext) {
        idStack[idStackIndex++] = treeContextId, idStack[idStackIndex++] = treeContextOverflow, idStack[idStackIndex++] = treeContextProvider, treeContextId = suspendedContext.id, treeContextOverflow = suspendedContext.overflow, treeContextProvider = workInProgress2;
      }
      var hydrationParentFiber = null, nextHydratableInstance = null, isHydrating = !1, hydrationErrors = null, rootOrSingletonContext = !1, HydrationMismatchException = Error(formatProdErrorMessage(519));
      function throwOnHydrationMismatch(fiber) {
        var error = Error(
          formatProdErrorMessage(
            418,
            1 < arguments.length && arguments[1] !== void 0 && arguments[1] ? "text" : "HTML",
            ""
          )
        );
        throw queueHydrationError(createCapturedValueAtFiber(error, fiber)), HydrationMismatchException;
      }
      function prepareToHydrateHostInstance(fiber) {
        var instance = fiber.stateNode, type = fiber.type, props = fiber.memoizedProps;
        switch (instance[internalInstanceKey] = fiber, instance[internalPropsKey] = props, type) {
          case "dialog":
            listenToNonDelegatedEvent("cancel", instance), listenToNonDelegatedEvent("close", instance);
            break;
          case "iframe":
          case "object":
          case "embed":
            listenToNonDelegatedEvent("load", instance);
            break;
          case "video":
          case "audio":
            for (type = 0; type < mediaEventTypes.length; type++)
              listenToNonDelegatedEvent(mediaEventTypes[type], instance);
            break;
          case "source":
            listenToNonDelegatedEvent("error", instance);
            break;
          case "img":
          case "image":
          case "link":
            listenToNonDelegatedEvent("error", instance), listenToNonDelegatedEvent("load", instance);
            break;
          case "details":
            listenToNonDelegatedEvent("toggle", instance);
            break;
          case "input":
            listenToNonDelegatedEvent("invalid", instance), initInput(
              instance,
              props.value,
              props.defaultValue,
              props.checked,
              props.defaultChecked,
              props.type,
              props.name,
              !0
            );
            break;
          case "select":
            listenToNonDelegatedEvent("invalid", instance);
            break;
          case "textarea":
            listenToNonDelegatedEvent("invalid", instance), initTextarea(instance, props.value, props.defaultValue, props.children);
        }
        type = props.children, typeof type != "string" && typeof type != "number" && typeof type != "bigint" || instance.textContent === "" + type || props.suppressHydrationWarning === !0 || checkForUnmatchedText(instance.textContent, type) ? (props.popover != null && (listenToNonDelegatedEvent("beforetoggle", instance), listenToNonDelegatedEvent("toggle", instance)), props.onScroll != null && listenToNonDelegatedEvent("scroll", instance), props.onScrollEnd != null && listenToNonDelegatedEvent("scrollend", instance), props.onClick != null && (instance.onclick = noop$1), instance = !0) : instance = !1, instance || throwOnHydrationMismatch(fiber, !0);
      }
      function popToNextHostParent(fiber) {
        for (hydrationParentFiber = fiber.return; hydrationParentFiber; )
          switch (hydrationParentFiber.tag) {
            case 5:
            case 31:
            case 13:
              rootOrSingletonContext = !1;
              return;
            case 27:
            case 3:
              rootOrSingletonContext = !0;
              return;
            default:
              hydrationParentFiber = hydrationParentFiber.return;
          }
      }
      function popHydrationState(fiber) {
        if (fiber !== hydrationParentFiber) return !1;
        if (!isHydrating) return popToNextHostParent(fiber), isHydrating = !0, !1;
        var tag = fiber.tag, JSCompiler_temp;
        if ((JSCompiler_temp = tag !== 3 && tag !== 27) && ((JSCompiler_temp = tag === 5) && (JSCompiler_temp = fiber.type, JSCompiler_temp = !(JSCompiler_temp !== "form" && JSCompiler_temp !== "button") || shouldSetTextContent(fiber.type, fiber.memoizedProps)), JSCompiler_temp = !JSCompiler_temp), JSCompiler_temp && nextHydratableInstance && throwOnHydrationMismatch(fiber), popToNextHostParent(fiber), tag === 13) {
          if (fiber = fiber.memoizedState, fiber = fiber !== null ? fiber.dehydrated : null, !fiber) throw Error(formatProdErrorMessage(317));
          nextHydratableInstance = getNextHydratableInstanceAfterHydrationBoundary(fiber);
        } else if (tag === 31) {
          if (fiber = fiber.memoizedState, fiber = fiber !== null ? fiber.dehydrated : null, !fiber) throw Error(formatProdErrorMessage(317));
          nextHydratableInstance = getNextHydratableInstanceAfterHydrationBoundary(fiber);
        } else
          tag === 27 ? (tag = nextHydratableInstance, isSingletonScope(fiber.type) ? (fiber = previousHydratableOnEnteringScopedSingleton, previousHydratableOnEnteringScopedSingleton = null, nextHydratableInstance = fiber) : nextHydratableInstance = tag) : nextHydratableInstance = hydrationParentFiber ? getNextHydratable(fiber.stateNode.nextSibling) : null;
        return !0;
      }
      function resetHydrationState() {
        nextHydratableInstance = hydrationParentFiber = null, isHydrating = !1;
      }
      function upgradeHydrationErrorsToRecoverable() {
        var queuedErrors = hydrationErrors;
        return queuedErrors !== null && (workInProgressRootRecoverableErrors === null ? workInProgressRootRecoverableErrors = queuedErrors : workInProgressRootRecoverableErrors.push.apply(
          workInProgressRootRecoverableErrors,
          queuedErrors
        ), hydrationErrors = null), queuedErrors;
      }
      function queueHydrationError(error) {
        hydrationErrors === null ? hydrationErrors = [error] : hydrationErrors.push(error);
      }
      var valueCursor = createCursor(null), currentlyRenderingFiber$1 = null, lastContextDependency = null;
      function pushProvider(providerFiber, context, nextValue) {
        push(valueCursor, context._currentValue), context._currentValue = nextValue;
      }
      function popProvider(context) {
        context._currentValue = valueCursor.current, pop(valueCursor);
      }
      function scheduleContextWorkOnParentPath(parent, renderLanes2, propagationRoot) {
        for (; parent !== null; ) {
          var alternate = parent.alternate;
          if ((parent.childLanes & renderLanes2) !== renderLanes2 ? (parent.childLanes |= renderLanes2, alternate !== null && (alternate.childLanes |= renderLanes2)) : alternate !== null && (alternate.childLanes & renderLanes2) !== renderLanes2 && (alternate.childLanes |= renderLanes2), parent === propagationRoot) break;
          parent = parent.return;
        }
      }
      function propagateContextChanges(workInProgress2, contexts, renderLanes2, forcePropagateEntireTree) {
        var fiber = workInProgress2.child;
        for (fiber !== null && (fiber.return = workInProgress2); fiber !== null; ) {
          var list = fiber.dependencies;
          if (list !== null) {
            var nextFiber = fiber.child;
            list = list.firstContext;
            a: for (; list !== null; ) {
              var dependency = list;
              list = fiber;
              for (var i = 0; i < contexts.length; i++)
                if (dependency.context === contexts[i]) {
                  list.lanes |= renderLanes2, dependency = list.alternate, dependency !== null && (dependency.lanes |= renderLanes2), scheduleContextWorkOnParentPath(
                    list.return,
                    renderLanes2,
                    workInProgress2
                  ), forcePropagateEntireTree || (nextFiber = null);
                  break a;
                }
              list = dependency.next;
            }
          } else if (fiber.tag === 18) {
            if (nextFiber = fiber.return, nextFiber === null) throw Error(formatProdErrorMessage(341));
            nextFiber.lanes |= renderLanes2, list = nextFiber.alternate, list !== null && (list.lanes |= renderLanes2), scheduleContextWorkOnParentPath(nextFiber, renderLanes2, workInProgress2), nextFiber = null;
          } else
            fiber.tag === 13 && fiber.memoizedState !== null && fiber.memoizedState.dehydrated === null ? (fiber.lanes |= renderLanes2, nextFiber = fiber.alternate, nextFiber !== null && (nextFiber.lanes |= renderLanes2), scheduleContextWorkOnParentPath(
              fiber.return,
              renderLanes2,
              workInProgress2
            ), nextFiber = fiber.child, nextFiber = nextFiber !== null ? nextFiber.sibling : null) : nextFiber = fiber.child;
          if (nextFiber !== null) nextFiber.return = fiber;
          else
            for (nextFiber = fiber; nextFiber !== null; ) {
              if (nextFiber === workInProgress2) {
                nextFiber = null;
                break;
              }
              if (fiber = nextFiber.sibling, fiber !== null) {
                fiber.return = nextFiber.return, nextFiber = fiber;
                break;
              }
              nextFiber = nextFiber.return;
            }
          fiber = nextFiber;
        }
      }
      function propagateParentContextChanges(current2, workInProgress2, renderLanes2, forcePropagateEntireTree) {
        current2 = null;
        for (var parent = workInProgress2, isInsidePropagationBailout = !1; parent !== null; ) {
          if (!isInsidePropagationBailout) {
            if ((parent.flags & 524288) !== 0) isInsidePropagationBailout = !0;
            else if ((parent.flags & 262144) !== 0) break;
          }
          if (parent.tag === 10) {
            var currentParent = parent.alternate;
            if (currentParent === null) throw Error(formatProdErrorMessage(387));
            if (currentParent = currentParent.memoizedProps, currentParent !== null) {
              var context = parent.type;
              objectIs(parent.pendingProps.value, currentParent.value) || (current2 !== null ? current2.push(context) : current2 = [context]);
            }
          } else if (parent === hostTransitionProviderCursor.current) {
            if (currentParent = parent.alternate, currentParent === null) throw Error(formatProdErrorMessage(387));
            currentParent.memoizedState.memoizedState !== parent.memoizedState.memoizedState && (current2 !== null ? current2.push(HostTransitionContext) : current2 = [HostTransitionContext]);
          }
          parent = parent.return;
        }
        return current2 !== null && propagateContextChanges(
          workInProgress2,
          current2,
          renderLanes2,
          forcePropagateEntireTree
        ), workInProgress2.flags |= 262144, current2 !== null;
      }
      function checkIfContextChanged(currentDependencies) {
        for (currentDependencies = currentDependencies.firstContext; currentDependencies !== null; ) {
          if (!objectIs(
            currentDependencies.context._currentValue,
            currentDependencies.memoizedValue
          ))
            return !0;
          currentDependencies = currentDependencies.next;
        }
        return !1;
      }
      function prepareToReadContext(workInProgress2) {
        currentlyRenderingFiber$1 = workInProgress2, lastContextDependency = null, workInProgress2 = workInProgress2.dependencies, workInProgress2 !== null && (workInProgress2.firstContext = null);
      }
      function readContext(context) {
        return readContextForConsumer(currentlyRenderingFiber$1, context);
      }
      function readContextDuringReconciliation(consumer, context) {
        return currentlyRenderingFiber$1 === null && prepareToReadContext(consumer), readContextForConsumer(consumer, context);
      }
      function readContextForConsumer(consumer, context) {
        var value = context._currentValue;
        if (context = { context, memoizedValue: value, next: null }, lastContextDependency === null) {
          if (consumer === null) throw Error(formatProdErrorMessage(308));
          lastContextDependency = context, consumer.dependencies = { lanes: 0, firstContext: context }, consumer.flags |= 524288;
        } else lastContextDependency = lastContextDependency.next = context;
        return value;
      }
      var AbortControllerLocal = typeof AbortController < "u" ? AbortController : function() {
        var listeners = [], signal = this.signal = {
          aborted: !1,
          addEventListener: function(type, listener) {
            listeners.push(listener);
          }
        };
        this.abort = function() {
          signal.aborted = !0, listeners.forEach(function(listener) {
            return listener();
          });
        };
      }, scheduleCallback$2 = Scheduler.unstable_scheduleCallback, NormalPriority = Scheduler.unstable_NormalPriority, CacheContext = {
        $$typeof: REACT_CONTEXT_TYPE,
        Consumer: null,
        Provider: null,
        _currentValue: null,
        _currentValue2: null,
        _threadCount: 0
      };
      function createCache() {
        return {
          controller: new AbortControllerLocal(),
          data: /* @__PURE__ */ new Map(),
          refCount: 0
        };
      }
      function releaseCache(cache) {
        cache.refCount--, cache.refCount === 0 && scheduleCallback$2(NormalPriority, function() {
          cache.controller.abort();
        });
      }
      function queueTransitionTypes(root2, transitionTypes) {
        if ((root2.pendingLanes & 4194048) !== 0) {
          var queued = root2.transitionTypes;
          for (queued === null && (queued = root2.transitionTypes = []), root2 = 0; root2 < transitionTypes.length; root2++) {
            var transitionType = transitionTypes[root2];
            queued.indexOf(transitionType) === -1 && queued.push(transitionType);
          }
        }
      }
      var entangledTransitionTypes = null;
      function claimQueuedTransitionTypes(root2) {
        var claimed = root2.transitionTypes;
        return root2.transitionTypes = null, claimed;
      }
      var currentEntangledListeners = null, currentEntangledPendingCount = 0, currentEntangledLane = 0, currentEntangledActionThenable = null;
      function entangleAsyncAction(transition, thenable) {
        if (currentEntangledListeners === null) {
          var entangledListeners = currentEntangledListeners = [];
          currentEntangledPendingCount = 0, currentEntangledLane = requestTransitionLane(), currentEntangledActionThenable = {
            status: "pending",
            value: void 0,
            then: function(resolve) {
              entangledListeners.push(resolve);
            }
          };
        }
        return currentEntangledPendingCount++, thenable.then(pingEngtangledActionScope, pingEngtangledActionScope), thenable;
      }
      function pingEngtangledActionScope() {
        if (--currentEntangledPendingCount === 0 && (entangledTransitionTypes = null, currentEntangledListeners !== null)) {
          currentEntangledActionThenable !== null && (currentEntangledActionThenable.status = "fulfilled");
          var listeners = currentEntangledListeners;
          currentEntangledListeners = null, currentEntangledLane = 0, currentEntangledActionThenable = null;
          for (var i = 0; i < listeners.length; i++) (0, listeners[i])();
        }
      }
      function chainThenableValue(thenable, result) {
        var listeners = [], thenableWithOverride = {
          status: "pending",
          value: null,
          reason: null,
          then: function(resolve) {
            listeners.push(resolve);
          }
        };
        return thenable.then(
          function() {
            thenableWithOverride.status = "fulfilled", thenableWithOverride.value = result;
            for (var i = 0; i < listeners.length; i++) (0, listeners[i])(result);
          },
          function(error) {
            for (thenableWithOverride.status = "rejected", thenableWithOverride.reason = error, error = 0; error < listeners.length; error++)
              (0, listeners[error])(void 0);
          }
        ), thenableWithOverride;
      }
      var prevOnStartTransitionFinish = ReactSharedInternals.S;
      ReactSharedInternals.S = function(transition, returnValue) {
        if (globalMostRecentTransitionTime = now(), typeof returnValue == "object" && returnValue !== null && typeof returnValue.then == "function" && entangleAsyncAction(transition, returnValue), entangledTransitionTypes !== null)
          for (var root$28 = firstScheduledRoot; root$28 !== null; )
            queueTransitionTypes(root$28, entangledTransitionTypes), root$28 = root$28.next;
        if (root$28 = transition.types, root$28 !== null) {
          for (var root$29 = firstScheduledRoot; root$29 !== null; )
            queueTransitionTypes(root$29, root$28), root$29 = root$29.next;
          if (currentEntangledLane !== 0) {
            root$29 = entangledTransitionTypes, root$29 === null && (root$29 = entangledTransitionTypes = []);
            for (var i = 0; i < root$28.length; i++) {
              var transitionType = root$28[i];
              root$29.indexOf(transitionType) === -1 && root$29.push(transitionType);
            }
          }
        }
        prevOnStartTransitionFinish !== null && prevOnStartTransitionFinish(transition, returnValue);
      };
      var resumedCache = createCursor(null);
      function peekCacheFromPool() {
        var cacheResumedFromPreviousRender = resumedCache.current;
        return cacheResumedFromPreviousRender !== null ? cacheResumedFromPreviousRender : workInProgressRoot.pooledCache;
      }
      function pushTransition(offscreenWorkInProgress, prevCachePool) {
        prevCachePool === null ? push(resumedCache, resumedCache.current) : push(resumedCache, prevCachePool.pool);
      }
      function getSuspendedCache() {
        var cacheFromPool = peekCacheFromPool();
        return cacheFromPool === null ? null : { parent: CacheContext._currentValue, pool: cacheFromPool };
      }
      var SuspenseException = Error(formatProdErrorMessage(460)), SuspenseyCommitException = Error(formatProdErrorMessage(474)), SuspenseActionException = Error(formatProdErrorMessage(542)), noopSuspenseyCommitThenable = { then: function() {
      } };
      function isThenableResolved(thenable) {
        return thenable = thenable.status, thenable === "fulfilled" || thenable === "rejected";
      }
      function trackUsedThenable(thenableState2, thenable, index2) {
        switch (index2 = thenableState2[index2], index2 === void 0 ? thenableState2.push(thenable) : index2 !== thenable && (thenable.then(noop$1, noop$1), thenable = index2), thenable.status) {
          case "fulfilled":
            return thenable.value;
          case "rejected":
            throw thenableState2 = thenable.reason, checkIfUseWrappedInAsyncCatch(thenableState2), thenableState2 === void 0 && !("reason" in thenable) ? Error(formatProdErrorMessage(600)) : thenableState2;
          default:
            if (typeof thenable.status == "string") thenable.then(noop$1, noop$1);
            else {
              if (thenableState2 = workInProgressRoot, thenableState2 !== null && 100 < thenableState2.shellSuspendCounter)
                throw Error(formatProdErrorMessage(482));
              thenableState2 = thenable, thenableState2.status = "pending", thenableState2.then(
                function(fulfilledValue) {
                  if (thenable.status === "pending") {
                    var fulfilledThenable = thenable;
                    fulfilledThenable.status = "fulfilled", fulfilledThenable.value = fulfilledValue;
                  }
                },
                function(error) {
                  if (thenable.status === "pending") {
                    var rejectedThenable = thenable;
                    rejectedThenable.status = "rejected", rejectedThenable.reason = error;
                  }
                }
              );
            }
            switch (thenable.status) {
              case "fulfilled":
                return thenable.value;
              case "rejected":
                throw thenableState2 = thenable.reason, checkIfUseWrappedInAsyncCatch(thenableState2), thenableState2;
            }
            throw suspendedThenable = thenable, SuspenseException;
        }
      }
      function resolveLazy(lazyType) {
        try {
          var init = lazyType._init;
          return init(lazyType._payload);
        } catch (x) {
          throw x !== null && typeof x == "object" && typeof x.then == "function" ? (suspendedThenable = x, SuspenseException) : x;
        }
      }
      var suspendedThenable = null;
      function getSuspendedThenable() {
        if (suspendedThenable === null) throw Error(formatProdErrorMessage(459));
        var thenable = suspendedThenable;
        return suspendedThenable = null, thenable;
      }
      function checkIfUseWrappedInAsyncCatch(rejectedReason) {
        if (rejectedReason === SuspenseException || rejectedReason === SuspenseActionException)
          throw Error(formatProdErrorMessage(483));
      }
      var thenableState$1 = null, thenableIndexCounter$1 = 0;
      function unwrapThenable(thenable) {
        var index2 = thenableIndexCounter$1;
        return thenableIndexCounter$1 += 1, thenableState$1 === null && (thenableState$1 = []), trackUsedThenable(thenableState$1, thenable, index2);
      }
      function coerceRef(workInProgress2, element) {
        element = element.props.ref, workInProgress2.ref = element !== void 0 ? element : null;
      }
      function throwOnInvalidObjectTypeImpl(returnFiber, newChild) {
        throw newChild.$$typeof === REACT_LEGACY_ELEMENT_TYPE ? Error(formatProdErrorMessage(525)) : (returnFiber = Object.prototype.toString.call(newChild), Error(
          formatProdErrorMessage(
            31,
            returnFiber === "[object Object]" ? "object with keys {" + Object.keys(newChild).join(", ") + "}" : returnFiber
          )
        ));
      }
      function createChildReconciler(shouldTrackSideEffects) {
        function deleteChild(returnFiber, childToDelete) {
          if (shouldTrackSideEffects) {
            var deletions = returnFiber.deletions;
            deletions === null ? (returnFiber.deletions = [childToDelete], returnFiber.flags |= 16) : deletions.push(childToDelete);
          }
        }
        function deleteRemainingChildren(returnFiber, currentFirstChild) {
          if (!shouldTrackSideEffects) return null;
          for (; currentFirstChild !== null; )
            deleteChild(returnFiber, currentFirstChild), currentFirstChild = currentFirstChild.sibling;
          return null;
        }
        function mapRemainingChildren(currentFirstChild) {
          for (var existingChildren = /* @__PURE__ */ new Map(); currentFirstChild !== null; )
            currentFirstChild.key === null ? existingChildren.set(currentFirstChild.index, currentFirstChild) : existingChildren.set(currentFirstChild.key, currentFirstChild), currentFirstChild = currentFirstChild.sibling;
          return existingChildren;
        }
        function useFiber(fiber, pendingProps) {
          return fiber = createWorkInProgress(fiber, pendingProps), fiber.index = 0, fiber.sibling = null, fiber;
        }
        function placeChild(newFiber, lastPlacedIndex, newIndex) {
          return newFiber.index = newIndex, shouldTrackSideEffects ? (newIndex = newFiber.alternate, newIndex !== null ? (newIndex = newIndex.index, newIndex < lastPlacedIndex ? (newFiber.flags |= 2, lastPlacedIndex) : newIndex) : (newFiber.flags |= 134217730, lastPlacedIndex)) : (newFiber.flags |= 1048576, lastPlacedIndex);
        }
        function placeSingleChild(newFiber) {
          return shouldTrackSideEffects && newFiber.alternate === null && (newFiber.flags |= 134217730), newFiber;
        }
        function updateTextNode(returnFiber, current2, textContent, lanes) {
          return current2 === null || current2.tag !== 6 ? (current2 = createFiberFromText(textContent, returnFiber.mode, lanes), current2.return = returnFiber, current2) : (current2 = useFiber(current2, textContent), current2.return = returnFiber, current2);
        }
        function updateElement(returnFiber, current2, element, lanes) {
          var elementType = element.type;
          return elementType === REACT_FRAGMENT_TYPE ? (returnFiber = updateFragment(
            returnFiber,
            current2,
            element.props.children,
            lanes,
            element.key
          ), coerceRef(returnFiber, element), returnFiber) : current2 !== null && (current2.elementType === elementType || typeof elementType == "object" && elementType !== null && elementType.$$typeof === REACT_LAZY_TYPE && resolveLazy(elementType) === current2.type) ? (current2 = useFiber(current2, element.props), coerceRef(current2, element), current2.return = returnFiber, current2) : (current2 = createFiberFromTypeAndProps(
            element.type,
            element.key,
            element.props,
            null,
            returnFiber.mode,
            lanes
          ), coerceRef(current2, element), current2.return = returnFiber, current2);
        }
        function updatePortal(returnFiber, current2, portal, lanes) {
          return current2 === null || current2.tag !== 4 || current2.stateNode.containerInfo !== portal.containerInfo || current2.stateNode.implementation !== portal.implementation ? (current2 = createFiberFromPortal(portal, returnFiber.mode, lanes), current2.return = returnFiber, current2) : (current2 = useFiber(current2, portal.children || []), current2.return = returnFiber, current2);
        }
        function updateFragment(returnFiber, current2, fragment, lanes, key) {
          return current2 === null || current2.tag !== 7 ? (current2 = createFiberFromFragment(
            fragment,
            returnFiber.mode,
            lanes,
            key
          ), current2.return = returnFiber, current2) : (current2 = useFiber(current2, fragment), current2.return = returnFiber, current2);
        }
        function createChild(returnFiber, newChild, lanes) {
          if (typeof newChild == "string" && newChild !== "" || typeof newChild == "number" || typeof newChild == "bigint")
            return newChild = createFiberFromText(
              "" + newChild,
              returnFiber.mode,
              lanes
            ), newChild.return = returnFiber, newChild;
          if (typeof newChild == "object" && newChild !== null) {
            switch (newChild.$$typeof) {
              case REACT_ELEMENT_TYPE:
                return lanes = createFiberFromTypeAndProps(
                  newChild.type,
                  newChild.key,
                  newChild.props,
                  null,
                  returnFiber.mode,
                  lanes
                ), coerceRef(lanes, newChild), lanes.return = returnFiber, lanes;
              case REACT_PORTAL_TYPE:
                return newChild = createFiberFromPortal(
                  newChild,
                  returnFiber.mode,
                  lanes
                ), newChild.return = returnFiber, newChild;
              case REACT_LAZY_TYPE:
                return newChild = resolveLazy(newChild), createChild(returnFiber, newChild, lanes);
            }
            if (isArrayImpl(newChild) || getIteratorFn(newChild))
              return newChild = createFiberFromFragment(
                newChild,
                returnFiber.mode,
                lanes,
                null
              ), newChild.return = returnFiber, newChild;
            if (typeof newChild.then == "function")
              return createChild(returnFiber, unwrapThenable(newChild), lanes);
            if (newChild.$$typeof === REACT_CONTEXT_TYPE)
              return createChild(
                returnFiber,
                readContextDuringReconciliation(returnFiber, newChild),
                lanes
              );
            throwOnInvalidObjectTypeImpl(returnFiber, newChild);
          }
          return null;
        }
        function updateSlot(returnFiber, oldFiber, newChild, lanes) {
          var key = oldFiber !== null ? oldFiber.key : null;
          if (typeof newChild == "string" && newChild !== "" || typeof newChild == "number" || typeof newChild == "bigint")
            return key !== null ? null : updateTextNode(returnFiber, oldFiber, "" + newChild, lanes);
          if (typeof newChild == "object" && newChild !== null) {
            switch (newChild.$$typeof) {
              case REACT_ELEMENT_TYPE:
                return newChild.key === key ? updateElement(returnFiber, oldFiber, newChild, lanes) : null;
              case REACT_PORTAL_TYPE:
                return newChild.key === key ? updatePortal(returnFiber, oldFiber, newChild, lanes) : null;
              case REACT_LAZY_TYPE:
                return newChild = resolveLazy(newChild), updateSlot(returnFiber, oldFiber, newChild, lanes);
            }
            if (isArrayImpl(newChild) || getIteratorFn(newChild))
              return key !== null ? null : updateFragment(returnFiber, oldFiber, newChild, lanes, null);
            if (typeof newChild.then == "function")
              return updateSlot(
                returnFiber,
                oldFiber,
                unwrapThenable(newChild),
                lanes
              );
            if (newChild.$$typeof === REACT_CONTEXT_TYPE)
              return updateSlot(
                returnFiber,
                oldFiber,
                readContextDuringReconciliation(returnFiber, newChild),
                lanes
              );
            throwOnInvalidObjectTypeImpl(returnFiber, newChild);
          }
          return null;
        }
        function updateFromMap(existingChildren, returnFiber, newIdx, newChild, lanes) {
          if (typeof newChild == "string" && newChild !== "" || typeof newChild == "number" || typeof newChild == "bigint")
            return existingChildren = existingChildren.get(newIdx) || null, updateTextNode(returnFiber, existingChildren, "" + newChild, lanes);
          if (typeof newChild == "object" && newChild !== null) {
            switch (newChild.$$typeof) {
              case REACT_ELEMENT_TYPE:
                return existingChildren = existingChildren.get(
                  newChild.key === null ? newIdx : newChild.key
                ) || null, updateElement(returnFiber, existingChildren, newChild, lanes);
              case REACT_PORTAL_TYPE:
                return existingChildren = existingChildren.get(
                  newChild.key === null ? newIdx : newChild.key
                ) || null, updatePortal(returnFiber, existingChildren, newChild, lanes);
              case REACT_LAZY_TYPE:
                return newChild = resolveLazy(newChild), updateFromMap(
                  existingChildren,
                  returnFiber,
                  newIdx,
                  newChild,
                  lanes
                );
            }
            if (isArrayImpl(newChild) || getIteratorFn(newChild))
              return existingChildren = existingChildren.get(newIdx) || null, updateFragment(returnFiber, existingChildren, newChild, lanes, null);
            if (typeof newChild.then == "function")
              return updateFromMap(
                existingChildren,
                returnFiber,
                newIdx,
                unwrapThenable(newChild),
                lanes
              );
            if (newChild.$$typeof === REACT_CONTEXT_TYPE)
              return updateFromMap(
                existingChildren,
                returnFiber,
                newIdx,
                readContextDuringReconciliation(returnFiber, newChild),
                lanes
              );
            throwOnInvalidObjectTypeImpl(returnFiber, newChild);
          }
          return null;
        }
        function reconcileChildrenArray(returnFiber, currentFirstChild, newChildren, lanes) {
          for (var resultingFirstChild = null, previousNewFiber = null, oldFiber = currentFirstChild, newIdx = currentFirstChild = 0, nextOldFiber = null; oldFiber !== null && newIdx < newChildren.length; newIdx++) {
            oldFiber.index > newIdx ? (nextOldFiber = oldFiber, oldFiber = null) : nextOldFiber = oldFiber.sibling;
            var newFiber = updateSlot(
              returnFiber,
              oldFiber,
              newChildren[newIdx],
              lanes
            );
            if (newFiber === null) {
              oldFiber === null && (oldFiber = nextOldFiber);
              break;
            }
            shouldTrackSideEffects && oldFiber && newFiber.alternate === null && deleteChild(returnFiber, oldFiber), currentFirstChild = placeChild(newFiber, currentFirstChild, newIdx), previousNewFiber === null ? resultingFirstChild = newFiber : previousNewFiber.sibling = newFiber, previousNewFiber = newFiber, oldFiber = nextOldFiber;
          }
          if (newIdx === newChildren.length)
            return deleteRemainingChildren(returnFiber, oldFiber), isHydrating && pushTreeFork(returnFiber, newIdx), resultingFirstChild;
          if (oldFiber === null) {
            for (; newIdx < newChildren.length; newIdx++)
              oldFiber = createChild(returnFiber, newChildren[newIdx], lanes), oldFiber !== null && (currentFirstChild = placeChild(
                oldFiber,
                currentFirstChild,
                newIdx
              ), previousNewFiber === null ? resultingFirstChild = oldFiber : previousNewFiber.sibling = oldFiber, previousNewFiber = oldFiber);
            return isHydrating && pushTreeFork(returnFiber, newIdx), resultingFirstChild;
          }
          for (oldFiber = mapRemainingChildren(oldFiber); newIdx < newChildren.length; newIdx++)
            nextOldFiber = updateFromMap(
              oldFiber,
              returnFiber,
              newIdx,
              newChildren[newIdx],
              lanes
            ), nextOldFiber !== null && (shouldTrackSideEffects && (newFiber = nextOldFiber.alternate, newFiber !== null && oldFiber.delete(newFiber.key === null ? newIdx : newFiber.key)), currentFirstChild = placeChild(
              nextOldFiber,
              currentFirstChild,
              newIdx
            ), previousNewFiber === null ? resultingFirstChild = nextOldFiber : previousNewFiber.sibling = nextOldFiber, previousNewFiber = nextOldFiber);
          return shouldTrackSideEffects && oldFiber.forEach(function(child) {
            return deleteChild(returnFiber, child);
          }), isHydrating && pushTreeFork(returnFiber, newIdx), resultingFirstChild;
        }
        function reconcileChildrenIterator(returnFiber, currentFirstChild, newChildren, lanes) {
          if (newChildren == null) throw Error(formatProdErrorMessage(151));
          for (var resultingFirstChild = null, previousNewFiber = null, oldFiber = currentFirstChild, newIdx = currentFirstChild = 0, nextOldFiber = null, step = newChildren.next(); oldFiber !== null && !step.done; newIdx++, step = newChildren.next()) {
            oldFiber.index > newIdx ? (nextOldFiber = oldFiber, oldFiber = null) : nextOldFiber = oldFiber.sibling;
            var newFiber = updateSlot(returnFiber, oldFiber, step.value, lanes);
            if (newFiber === null) {
              oldFiber === null && (oldFiber = nextOldFiber);
              break;
            }
            shouldTrackSideEffects && oldFiber && newFiber.alternate === null && deleteChild(returnFiber, oldFiber), currentFirstChild = placeChild(newFiber, currentFirstChild, newIdx), previousNewFiber === null ? resultingFirstChild = newFiber : previousNewFiber.sibling = newFiber, previousNewFiber = newFiber, oldFiber = nextOldFiber;
          }
          if (step.done)
            return deleteRemainingChildren(returnFiber, oldFiber), isHydrating && pushTreeFork(returnFiber, newIdx), resultingFirstChild;
          if (oldFiber === null) {
            for (; !step.done; newIdx++, step = newChildren.next())
              step = createChild(returnFiber, step.value, lanes), step !== null && (currentFirstChild = placeChild(step, currentFirstChild, newIdx), previousNewFiber === null ? resultingFirstChild = step : previousNewFiber.sibling = step, previousNewFiber = step);
            return isHydrating && pushTreeFork(returnFiber, newIdx), resultingFirstChild;
          }
          for (oldFiber = mapRemainingChildren(oldFiber); !step.done; newIdx++, step = newChildren.next())
            step = updateFromMap(oldFiber, returnFiber, newIdx, step.value, lanes), step !== null && (shouldTrackSideEffects && (nextOldFiber = step.alternate, nextOldFiber !== null && oldFiber.delete(
              nextOldFiber.key === null ? newIdx : nextOldFiber.key
            )), currentFirstChild = placeChild(step, currentFirstChild, newIdx), previousNewFiber === null ? resultingFirstChild = step : previousNewFiber.sibling = step, previousNewFiber = step);
          return shouldTrackSideEffects && oldFiber.forEach(function(child) {
            return deleteChild(returnFiber, child);
          }), isHydrating && pushTreeFork(returnFiber, newIdx), resultingFirstChild;
        }
        function reconcileChildFibersImpl(returnFiber, currentFirstChild, newChild, lanes) {
          if (typeof newChild == "object" && newChild !== null && newChild.type === REACT_FRAGMENT_TYPE && newChild.key === null && newChild.props.ref === void 0 && (newChild = newChild.props.children), typeof newChild == "object" && newChild !== null) {
            switch (newChild.$$typeof) {
              case REACT_ELEMENT_TYPE:
                a: {
                  for (var key = newChild.key; currentFirstChild !== null; ) {
                    if (currentFirstChild.key === key) {
                      if (key = newChild.type, key === REACT_FRAGMENT_TYPE) {
                        if (currentFirstChild.tag === 7) {
                          deleteRemainingChildren(
                            returnFiber,
                            currentFirstChild.sibling
                          ), lanes = useFiber(
                            currentFirstChild,
                            newChild.props.children
                          ), coerceRef(lanes, newChild), lanes.return = returnFiber, returnFiber = lanes;
                          break a;
                        }
                      } else if (currentFirstChild.elementType === key || typeof key == "object" && key !== null && key.$$typeof === REACT_LAZY_TYPE && resolveLazy(key) === currentFirstChild.type) {
                        deleteRemainingChildren(
                          returnFiber,
                          currentFirstChild.sibling
                        ), lanes = useFiber(currentFirstChild, newChild.props), coerceRef(lanes, newChild), lanes.return = returnFiber, returnFiber = lanes;
                        break a;
                      }
                      deleteRemainingChildren(returnFiber, currentFirstChild);
                      break;
                    } else deleteChild(returnFiber, currentFirstChild);
                    currentFirstChild = currentFirstChild.sibling;
                  }
                  newChild.type === REACT_FRAGMENT_TYPE ? (lanes = createFiberFromFragment(
                    newChild.props.children,
                    returnFiber.mode,
                    lanes,
                    newChild.key
                  ), coerceRef(lanes, newChild), lanes.return = returnFiber, returnFiber = lanes) : (lanes = createFiberFromTypeAndProps(
                    newChild.type,
                    newChild.key,
                    newChild.props,
                    null,
                    returnFiber.mode,
                    lanes
                  ), coerceRef(lanes, newChild), lanes.return = returnFiber, returnFiber = lanes);
                }
                return placeSingleChild(returnFiber);
              case REACT_PORTAL_TYPE:
                a: {
                  for (key = newChild.key; currentFirstChild !== null; ) {
                    if (currentFirstChild.key === key)
                      if (currentFirstChild.tag === 4 && currentFirstChild.stateNode.containerInfo === newChild.containerInfo && currentFirstChild.stateNode.implementation === newChild.implementation) {
                        deleteRemainingChildren(
                          returnFiber,
                          currentFirstChild.sibling
                        ), lanes = useFiber(currentFirstChild, newChild.children || []), lanes.return = returnFiber, returnFiber = lanes;
                        break a;
                      } else {
                        deleteRemainingChildren(returnFiber, currentFirstChild);
                        break;
                      }
                    else deleteChild(returnFiber, currentFirstChild);
                    currentFirstChild = currentFirstChild.sibling;
                  }
                  lanes = createFiberFromPortal(newChild, returnFiber.mode, lanes), lanes.return = returnFiber, returnFiber = lanes;
                }
                return placeSingleChild(returnFiber);
              case REACT_LAZY_TYPE:
                return newChild = resolveLazy(newChild), reconcileChildFibersImpl(
                  returnFiber,
                  currentFirstChild,
                  newChild,
                  lanes
                );
            }
            if (isArrayImpl(newChild))
              return reconcileChildrenArray(
                returnFiber,
                currentFirstChild,
                newChild,
                lanes
              );
            if (getIteratorFn(newChild)) {
              if (key = getIteratorFn(newChild), typeof key != "function") throw Error(formatProdErrorMessage(150));
              return newChild = key.call(newChild), reconcileChildrenIterator(
                returnFiber,
                currentFirstChild,
                newChild,
                lanes
              );
            }
            if (typeof newChild.then == "function")
              return reconcileChildFibersImpl(
                returnFiber,
                currentFirstChild,
                unwrapThenable(newChild),
                lanes
              );
            if (newChild.$$typeof === REACT_CONTEXT_TYPE)
              return reconcileChildFibersImpl(
                returnFiber,
                currentFirstChild,
                readContextDuringReconciliation(returnFiber, newChild),
                lanes
              );
            throwOnInvalidObjectTypeImpl(returnFiber, newChild);
          }
          return typeof newChild == "string" && newChild !== "" || typeof newChild == "number" || typeof newChild == "bigint" ? (newChild = "" + newChild, currentFirstChild !== null && currentFirstChild.tag === 6 ? (deleteRemainingChildren(returnFiber, currentFirstChild.sibling), lanes = useFiber(currentFirstChild, newChild), lanes.return = returnFiber, returnFiber = lanes) : (deleteRemainingChildren(returnFiber, currentFirstChild), lanes = createFiberFromText(newChild, returnFiber.mode, lanes), lanes.return = returnFiber, returnFiber = lanes), placeSingleChild(returnFiber)) : deleteRemainingChildren(returnFiber, currentFirstChild);
        }
        return function(returnFiber, currentFirstChild, newChild, lanes) {
          try {
            thenableIndexCounter$1 = 0;
            var firstChildFiber = reconcileChildFibersImpl(
              returnFiber,
              currentFirstChild,
              newChild,
              lanes
            );
            return thenableState$1 = null, firstChildFiber;
          } catch (x) {
            if (x === SuspenseException || x === SuspenseActionException) throw x;
            var fiber = createFiberImplClass(29, x, null, returnFiber.mode);
            return fiber.lanes = lanes, fiber.return = returnFiber, fiber;
          }
        };
      }
      var reconcileChildFibers = createChildReconciler(!0), mountChildFibers = createChildReconciler(!1), hasForceUpdate = !1;
      function initializeUpdateQueue(fiber) {
        fiber.updateQueue = {
          baseState: fiber.memoizedState,
          firstBaseUpdate: null,
          lastBaseUpdate: null,
          shared: { pending: null, lanes: 0, hiddenCallbacks: null },
          callbacks: null
        };
      }
      function cloneUpdateQueue(current2, workInProgress2) {
        current2 = current2.updateQueue, workInProgress2.updateQueue === current2 && (workInProgress2.updateQueue = {
          baseState: current2.baseState,
          firstBaseUpdate: current2.firstBaseUpdate,
          lastBaseUpdate: current2.lastBaseUpdate,
          shared: current2.shared,
          callbacks: null
        });
      }
      function createUpdate(lane) {
        return { lane, tag: 0, payload: null, callback: null, next: null };
      }
      function enqueueUpdate(fiber, update, lane) {
        var updateQueue = fiber.updateQueue;
        if (updateQueue === null) return null;
        if (updateQueue = updateQueue.shared, (executionContext & 2) !== 0) {
          var pending = updateQueue.pending;
          return pending === null ? update.next = update : (update.next = pending.next, pending.next = update), updateQueue.pending = update, update = getRootForUpdatedFiber(fiber), markUpdateLaneFromFiberToRoot(fiber, null, lane), update;
        }
        return enqueueUpdate$1(fiber, updateQueue, update, lane), getRootForUpdatedFiber(fiber);
      }
      function entangleTransitions(root2, fiber, lane) {
        if (fiber = fiber.updateQueue, fiber !== null && (fiber = fiber.shared, (lane & 4194048) !== 0)) {
          var queueLanes = fiber.lanes;
          queueLanes &= root2.pendingLanes, lane |= queueLanes, fiber.lanes = lane, markRootEntangled(root2, lane);
        }
      }
      function enqueueCapturedUpdate(workInProgress2, capturedUpdate) {
        var queue = workInProgress2.updateQueue, current2 = workInProgress2.alternate;
        if (current2 !== null && (current2 = current2.updateQueue, queue === current2)) {
          var newFirst = null, newLast = null;
          if (queue = queue.firstBaseUpdate, queue !== null) {
            do {
              var clone = {
                lane: queue.lane,
                tag: queue.tag,
                payload: queue.payload,
                callback: null,
                next: null
              };
              newLast === null ? newFirst = newLast = clone : newLast = newLast.next = clone, queue = queue.next;
            } while (queue !== null);
            newLast === null ? newFirst = newLast = capturedUpdate : newLast = newLast.next = capturedUpdate;
          } else newFirst = newLast = capturedUpdate;
          queue = {
            baseState: current2.baseState,
            firstBaseUpdate: newFirst,
            lastBaseUpdate: newLast,
            shared: current2.shared,
            callbacks: current2.callbacks
          }, workInProgress2.updateQueue = queue;
          return;
        }
        workInProgress2 = queue.lastBaseUpdate, workInProgress2 === null ? queue.firstBaseUpdate = capturedUpdate : workInProgress2.next = capturedUpdate, queue.lastBaseUpdate = capturedUpdate;
      }
      var didReadFromEntangledAsyncAction = !1;
      function suspendIfUpdateReadFromEntangledAsyncAction() {
        if (didReadFromEntangledAsyncAction) {
          var entangledActionThenable = currentEntangledActionThenable;
          if (entangledActionThenable !== null) throw entangledActionThenable;
        }
      }
      function processUpdateQueue(workInProgress$jscomp$0, props, instance$jscomp$0, renderLanes2) {
        didReadFromEntangledAsyncAction = !1;
        var queue = workInProgress$jscomp$0.updateQueue;
        hasForceUpdate = !1;
        var firstBaseUpdate = queue.firstBaseUpdate, lastBaseUpdate = queue.lastBaseUpdate, pendingQueue = queue.shared.pending;
        if (pendingQueue !== null) {
          queue.shared.pending = null;
          var lastPendingUpdate = pendingQueue, firstPendingUpdate = lastPendingUpdate.next;
          lastPendingUpdate.next = null, lastBaseUpdate === null ? firstBaseUpdate = firstPendingUpdate : lastBaseUpdate.next = firstPendingUpdate, lastBaseUpdate = lastPendingUpdate;
          var current2 = workInProgress$jscomp$0.alternate;
          current2 !== null && (current2 = current2.updateQueue, pendingQueue = current2.lastBaseUpdate, pendingQueue !== lastBaseUpdate && (pendingQueue === null ? current2.firstBaseUpdate = firstPendingUpdate : pendingQueue.next = firstPendingUpdate, current2.lastBaseUpdate = lastPendingUpdate));
        }
        if (firstBaseUpdate !== null) {
          var newState = queue.baseState;
          lastBaseUpdate = 0, current2 = firstPendingUpdate = lastPendingUpdate = null, pendingQueue = firstBaseUpdate;
          do {
            var updateLane = pendingQueue.lane & -536870913, isHiddenUpdate = updateLane !== pendingQueue.lane;
            if (isHiddenUpdate ? (workInProgressRootRenderLanes & updateLane) === updateLane : (renderLanes2 & updateLane) === updateLane) {
              updateLane !== 0 && updateLane === currentEntangledLane && (didReadFromEntangledAsyncAction = !0), current2 !== null && (current2 = current2.next = {
                lane: 0,
                tag: pendingQueue.tag,
                payload: pendingQueue.payload,
                callback: null,
                next: null
              });
              a: {
                var workInProgress2 = workInProgress$jscomp$0, update = pendingQueue;
                updateLane = props;
                var instance = instance$jscomp$0;
                switch (update.tag) {
                  case 1:
                    if (workInProgress2 = update.payload, typeof workInProgress2 == "function") {
                      newState = workInProgress2.call(instance, newState, updateLane);
                      break a;
                    }
                    newState = workInProgress2;
                    break a;
                  case 3:
                    workInProgress2.flags = workInProgress2.flags & -65537 | 128;
                  case 0:
                    if (workInProgress2 = update.payload, updateLane = typeof workInProgress2 == "function" ? workInProgress2.call(instance, newState, updateLane) : workInProgress2, updateLane == null) break a;
                    newState = assign({}, newState, updateLane);
                    break a;
                  case 2:
                    hasForceUpdate = !0;
                }
              }
              updateLane = pendingQueue.callback, updateLane !== null && (workInProgress$jscomp$0.flags |= 64, isHiddenUpdate && (workInProgress$jscomp$0.flags |= 8192), isHiddenUpdate = queue.callbacks, isHiddenUpdate === null ? queue.callbacks = [updateLane] : isHiddenUpdate.push(updateLane));
            } else
              isHiddenUpdate = {
                lane: updateLane,
                tag: pendingQueue.tag,
                payload: pendingQueue.payload,
                callback: pendingQueue.callback,
                next: null
              }, current2 === null ? (firstPendingUpdate = current2 = isHiddenUpdate, lastPendingUpdate = newState) : current2 = current2.next = isHiddenUpdate, lastBaseUpdate |= updateLane;
            if (pendingQueue = pendingQueue.next, pendingQueue === null) {
              if (pendingQueue = queue.shared.pending, pendingQueue === null)
                break;
              isHiddenUpdate = pendingQueue, pendingQueue = isHiddenUpdate.next, isHiddenUpdate.next = null, queue.lastBaseUpdate = isHiddenUpdate, queue.shared.pending = null;
            }
          } while (!0);
          current2 === null && (lastPendingUpdate = newState), queue.baseState = lastPendingUpdate, queue.firstBaseUpdate = firstPendingUpdate, queue.lastBaseUpdate = current2, firstBaseUpdate === null && (queue.shared.lanes = 0), workInProgressRootSkippedLanes |= lastBaseUpdate, workInProgress$jscomp$0.lanes = lastBaseUpdate, workInProgress$jscomp$0.memoizedState = newState;
        }
      }
      function callCallback(callback, context) {
        if (typeof callback != "function")
          throw Error(formatProdErrorMessage(191, callback));
        callback.call(context);
      }
      function commitCallbacks(updateQueue, context) {
        var callbacks = updateQueue.callbacks;
        if (callbacks !== null)
          for (updateQueue.callbacks = null, updateQueue = 0; updateQueue < callbacks.length; updateQueue++)
            callCallback(callbacks[updateQueue], context);
      }
      var currentTreeHiddenStackCursor = createCursor(null), prevEntangledRenderLanesCursor = createCursor(0);
      function pushHiddenContext(fiber, context) {
        fiber = entangledRenderLanes, push(prevEntangledRenderLanesCursor, fiber), push(currentTreeHiddenStackCursor, context), entangledRenderLanes = fiber | context.baseLanes;
      }
      function reuseHiddenContextOnStack() {
        push(prevEntangledRenderLanesCursor, entangledRenderLanes), push(currentTreeHiddenStackCursor, currentTreeHiddenStackCursor.current);
      }
      function popHiddenContext() {
        entangledRenderLanes = prevEntangledRenderLanesCursor.current, pop(currentTreeHiddenStackCursor), pop(prevEntangledRenderLanesCursor);
      }
      var suspenseHandlerStackCursor = createCursor(null), shellBoundary = null;
      function pushPrimaryTreeSuspenseHandler(handler) {
        var current2 = handler.alternate;
        push(suspenseStackCursor, suspenseStackCursor.current & 1), push(suspenseHandlerStackCursor, handler), shellBoundary === null && (current2 === null || currentTreeHiddenStackCursor.current !== null || current2.memoizedState !== null) && (shellBoundary = handler);
      }
      function pushDehydratedActivitySuspenseHandler(fiber) {
        push(suspenseStackCursor, suspenseStackCursor.current), push(suspenseHandlerStackCursor, fiber), shellBoundary === null && (shellBoundary = fiber);
      }
      function pushOffscreenSuspenseHandler(fiber) {
        fiber.tag === 22 ? (push(suspenseStackCursor, suspenseStackCursor.current), push(suspenseHandlerStackCursor, fiber), shellBoundary === null && (shellBoundary = fiber)) : reuseSuspenseHandlerOnStack();
      }
      function reuseSuspenseHandlerOnStack() {
        push(suspenseStackCursor, suspenseStackCursor.current), push(suspenseHandlerStackCursor, suspenseHandlerStackCursor.current);
      }
      function popSuspenseHandler(fiber) {
        pop(suspenseHandlerStackCursor), shellBoundary === fiber && (shellBoundary = null), pop(suspenseStackCursor);
      }
      var suspenseStackCursor = createCursor(0);
      function pushSuspenseListContext(fiber, newContext) {
        push(suspenseHandlerStackCursor, suspenseHandlerStackCursor.current), push(suspenseStackCursor, newContext);
      }
      function popSuspenseListContext(fiber) {
        pop(suspenseStackCursor), pop(suspenseHandlerStackCursor), shellBoundary === fiber && (shellBoundary = null);
      }
      function findFirstSuspended(row) {
        for (var node = row; node !== null; ) {
          if (node.tag === 13) {
            var state = node.memoizedState;
            if (state !== null && (state = state.dehydrated, state === null || isSuspenseInstancePending(state) || isSuspenseInstanceFallback(state)))
              return node;
          } else if (node.tag === 19 && node.memoizedProps.revealOrder !== "independent") {
            if ((node.flags & 128) !== 0) return node;
          } else if (node.child !== null) {
            node.child.return = node, node = node.child;
            continue;
          }
          if (node === row) break;
          for (; node.sibling === null; ) {
            if (node.return === null || node.return === row) return null;
            node = node.return;
          }
          node.sibling.return = node.return, node = node.sibling;
        }
        return null;
      }
      var renderLanes = 0, currentlyRenderingFiber = null, currentHook = null, workInProgressHook = null, didScheduleRenderPhaseUpdate = !1, didScheduleRenderPhaseUpdateDuringThisPass = !1, shouldDoubleInvokeUserFnsInHooksDEV = !1, localIdCounter = 0, thenableIndexCounter = 0, thenableState = null, globalClientIdCounter = 0;
      function throwInvalidHookError() {
        throw Error(formatProdErrorMessage(321));
      }
      function areHookInputsEqual(nextDeps, prevDeps) {
        if (prevDeps === null) return !1;
        for (var i = 0; i < prevDeps.length && i < nextDeps.length; i++)
          if (!objectIs(nextDeps[i], prevDeps[i])) return !1;
        return !0;
      }
      function renderWithHooks(current2, workInProgress2, Component, props, secondArg, nextRenderLanes) {
        return renderLanes = nextRenderLanes, currentlyRenderingFiber = workInProgress2, workInProgress2.memoizedState = null, workInProgress2.updateQueue = null, workInProgress2.lanes = 0, ReactSharedInternals.H = current2 === null || current2.memoizedState === null ? HooksDispatcherOnMount : HooksDispatcherOnUpdate, shouldDoubleInvokeUserFnsInHooksDEV = !1, nextRenderLanes = Component(props, secondArg), shouldDoubleInvokeUserFnsInHooksDEV = !1, didScheduleRenderPhaseUpdateDuringThisPass && (nextRenderLanes = renderWithHooksAgain(
          workInProgress2,
          Component,
          props,
          secondArg
        )), finishRenderingHooks(current2), nextRenderLanes;
      }
      function finishRenderingHooks(current2) {
        ReactSharedInternals.H = ContextOnlyDispatcher;
        var didRenderTooFewHooks = currentHook !== null && currentHook.next !== null;
        if (renderLanes = 0, workInProgressHook = currentHook = currentlyRenderingFiber = null, didScheduleRenderPhaseUpdate = !1, thenableIndexCounter = 0, thenableState = null, didRenderTooFewHooks) throw Error(formatProdErrorMessage(300));
        current2 === null || didReceiveUpdate || (current2 = current2.dependencies, current2 !== null && checkIfContextChanged(current2) && (didReceiveUpdate = !0));
      }
      function renderWithHooksAgain(workInProgress2, Component, props, secondArg) {
        currentlyRenderingFiber = workInProgress2;
        var numberOfReRenders = 0;
        do {
          if (didScheduleRenderPhaseUpdateDuringThisPass && (thenableState = null), thenableIndexCounter = 0, didScheduleRenderPhaseUpdateDuringThisPass = !1, 25 <= numberOfReRenders) throw Error(formatProdErrorMessage(301));
          if (numberOfReRenders += 1, workInProgressHook = currentHook = null, workInProgress2.updateQueue != null) {
            var children = workInProgress2.updateQueue;
            children.lastEffect = null, children.events = null, children.stores = null, children.memoCache != null && (children.memoCache.index = 0);
          }
          ReactSharedInternals.H = HooksDispatcherOnRerender, children = Component(props, secondArg);
        } while (didScheduleRenderPhaseUpdateDuringThisPass);
        return children;
      }
      function TransitionAwareHostComponent() {
        var dispatcher = ReactSharedInternals.H, maybeThenable = dispatcher.useState()[0];
        return maybeThenable = typeof maybeThenable.then == "function" ? useThenable(maybeThenable) : maybeThenable, dispatcher = dispatcher.useState()[0], (currentHook !== null ? currentHook.memoizedState : null) !== dispatcher && (currentlyRenderingFiber.flags |= 1024), maybeThenable;
      }
      function checkDidRenderIdHook() {
        var didRenderIdHook = localIdCounter !== 0;
        return localIdCounter = 0, didRenderIdHook;
      }
      function bailoutHooks(current2, workInProgress2, lanes) {
        workInProgress2.updateQueue = current2.updateQueue, workInProgress2.flags &= -2053, current2.lanes &= ~lanes;
      }
      function resetHooksOnUnwind(workInProgress2) {
        if (didScheduleRenderPhaseUpdate) {
          for (workInProgress2 = workInProgress2.memoizedState; workInProgress2 !== null; ) {
            var queue = workInProgress2.queue;
            queue !== null && (queue.pending = null), workInProgress2 = workInProgress2.next;
          }
          didScheduleRenderPhaseUpdate = !1;
        }
        renderLanes = 0, workInProgressHook = currentHook = currentlyRenderingFiber = null, didScheduleRenderPhaseUpdateDuringThisPass = !1, thenableIndexCounter = localIdCounter = 0, thenableState = null;
      }
      function mountWorkInProgressHook() {
        var hook = {
          memoizedState: null,
          baseState: null,
          baseQueue: null,
          queue: null,
          next: null
        };
        return workInProgressHook === null ? currentlyRenderingFiber.memoizedState = workInProgressHook = hook : workInProgressHook = workInProgressHook.next = hook, workInProgressHook;
      }
      function updateWorkInProgressHook() {
        if (currentHook === null) {
          var nextCurrentHook = currentlyRenderingFiber.alternate;
          nextCurrentHook = nextCurrentHook !== null ? nextCurrentHook.memoizedState : null;
        } else nextCurrentHook = currentHook.next;
        var nextWorkInProgressHook = workInProgressHook === null ? currentlyRenderingFiber.memoizedState : workInProgressHook.next;
        if (nextWorkInProgressHook !== null)
          workInProgressHook = nextWorkInProgressHook, currentHook = nextCurrentHook;
        else {
          if (nextCurrentHook === null)
            throw currentlyRenderingFiber.alternate === null ? Error(formatProdErrorMessage(467)) : Error(formatProdErrorMessage(310));
          currentHook = nextCurrentHook, nextCurrentHook = {
            memoizedState: currentHook.memoizedState,
            baseState: currentHook.baseState,
            baseQueue: currentHook.baseQueue,
            queue: currentHook.queue,
            next: null
          }, workInProgressHook === null ? currentlyRenderingFiber.memoizedState = workInProgressHook = nextCurrentHook : workInProgressHook = workInProgressHook.next = nextCurrentHook;
        }
        return workInProgressHook;
      }
      function createFunctionComponentUpdateQueue() {
        return { lastEffect: null, events: null, stores: null, memoCache: null };
      }
      function useThenable(thenable) {
        var index2 = thenableIndexCounter;
        return thenableIndexCounter += 1, thenableState === null && (thenableState = []), thenable = trackUsedThenable(thenableState, thenable, index2), index2 = currentlyRenderingFiber, (workInProgressHook === null ? index2.memoizedState : workInProgressHook.next) === null && (index2 = index2.alternate, ReactSharedInternals.H = index2 === null || index2.memoizedState === null ? HooksDispatcherOnMount : HooksDispatcherOnUpdate), thenable;
      }
      function use(usable) {
        if (usable !== null && typeof usable == "object") {
          if (typeof usable.then == "function") return useThenable(usable);
          if (usable.$$typeof === REACT_RECOVERABLE_TYPE) return;
          if (usable.$$typeof === REACT_CONTEXT_TYPE) return readContext(usable);
        }
        throw Error(formatProdErrorMessage(438, String(usable)));
      }
      function useMemoCache(size) {
        var memoCache = null, updateQueue = currentlyRenderingFiber.updateQueue;
        if (updateQueue !== null && (memoCache = updateQueue.memoCache), memoCache == null) {
          var current2 = currentlyRenderingFiber.alternate;
          current2 !== null && (current2 = current2.updateQueue, current2 !== null && (current2 = current2.memoCache, current2 != null && (memoCache = {
            data: current2.data.map(function(array) {
              return array.slice();
            }),
            index: 0
          })));
        }
        if (memoCache == null && (memoCache = { data: [], index: 0 }), updateQueue === null && (updateQueue = createFunctionComponentUpdateQueue(), currentlyRenderingFiber.updateQueue = updateQueue), updateQueue.memoCache = memoCache, updateQueue = memoCache.data[memoCache.index], updateQueue === void 0)
          for (updateQueue = memoCache.data[memoCache.index] = Array(size), current2 = 0; current2 < size; current2++)
            updateQueue[current2] = REACT_MEMO_CACHE_SENTINEL;
        return memoCache.index++, updateQueue;
      }
      function basicStateReducer(state, action) {
        return typeof action == "function" ? action(state) : action;
      }
      function updateReducer(reducer) {
        var hook = updateWorkInProgressHook();
        return updateReducerImpl(hook, currentHook, reducer);
      }
      function updateReducerImpl(hook, current2, reducer) {
        var queue = hook.queue;
        if (queue === null) throw Error(formatProdErrorMessage(311));
        queue.lastRenderedReducer = reducer;
        var baseQueue = hook.baseQueue, pendingQueue = queue.pending;
        if (pendingQueue !== null) {
          if (baseQueue !== null) {
            var baseFirst = baseQueue.next;
            baseQueue.next = pendingQueue.next, pendingQueue.next = baseFirst;
          }
          current2.baseQueue = baseQueue = pendingQueue, queue.pending = null;
        }
        if (pendingQueue = hook.baseState, baseQueue === null) hook.memoizedState = pendingQueue;
        else {
          current2 = baseQueue.next;
          var newBaseQueueFirst = baseFirst = null, newBaseQueueLast = null, update = current2, didReadFromEntangledAsyncAction$64 = !1;
          do {
            var updateLane = update.lane & -536870913;
            if (updateLane !== update.lane ? (workInProgressRootRenderLanes & updateLane) === updateLane : (renderLanes & updateLane) === updateLane) {
              var revertLane = update.revertLane;
              if (revertLane === 0)
                newBaseQueueLast !== null && (newBaseQueueLast = newBaseQueueLast.next = {
                  lane: 0,
                  revertLane: 0,
                  gesture: null,
                  action: update.action,
                  hasEagerState: update.hasEagerState,
                  eagerState: update.eagerState,
                  next: null
                }), updateLane === currentEntangledLane && (didReadFromEntangledAsyncAction$64 = !0);
              else if ((renderLanes & revertLane) === revertLane) {
                update = update.next, revertLane === currentEntangledLane && (didReadFromEntangledAsyncAction$64 = !0);
                continue;
              } else
                updateLane = {
                  lane: 0,
                  revertLane: update.revertLane,
                  gesture: null,
                  action: update.action,
                  hasEagerState: update.hasEagerState,
                  eagerState: update.eagerState,
                  next: null
                }, newBaseQueueLast === null ? (newBaseQueueFirst = newBaseQueueLast = updateLane, baseFirst = pendingQueue) : newBaseQueueLast = newBaseQueueLast.next = updateLane, currentlyRenderingFiber.lanes |= revertLane, workInProgressRootSkippedLanes |= revertLane;
              updateLane = update.action, shouldDoubleInvokeUserFnsInHooksDEV && reducer(pendingQueue, updateLane), pendingQueue = update.hasEagerState ? update.eagerState : reducer(pendingQueue, updateLane);
            } else
              revertLane = {
                lane: updateLane,
                revertLane: update.revertLane,
                gesture: update.gesture,
                action: update.action,
                hasEagerState: update.hasEagerState,
                eagerState: update.eagerState,
                next: null
              }, newBaseQueueLast === null ? (newBaseQueueFirst = newBaseQueueLast = revertLane, baseFirst = pendingQueue) : newBaseQueueLast = newBaseQueueLast.next = revertLane, currentlyRenderingFiber.lanes |= updateLane, workInProgressRootSkippedLanes |= updateLane;
            update = update.next;
          } while (update !== null && update !== current2);
          if (newBaseQueueLast === null ? baseFirst = pendingQueue : newBaseQueueLast.next = newBaseQueueFirst, !objectIs(pendingQueue, hook.memoizedState) && (didReceiveUpdate = !0, didReadFromEntangledAsyncAction$64 && (reducer = currentEntangledActionThenable, reducer !== null)))
            throw reducer;
          hook.memoizedState = pendingQueue, hook.baseState = baseFirst, hook.baseQueue = newBaseQueueLast, queue.lastRenderedState = pendingQueue;
        }
        return baseQueue === null && (queue.lanes = 0), [hook.memoizedState, queue.dispatch];
      }
      function rerenderReducer(reducer) {
        var hook = updateWorkInProgressHook(), queue = hook.queue;
        if (queue === null) throw Error(formatProdErrorMessage(311));
        queue.lastRenderedReducer = reducer;
        var dispatch = queue.dispatch, lastRenderPhaseUpdate = queue.pending, newState = hook.memoizedState;
        if (lastRenderPhaseUpdate !== null) {
          queue.pending = null;
          var update = lastRenderPhaseUpdate = lastRenderPhaseUpdate.next;
          do
            newState = reducer(newState, update.action), update = update.next;
          while (update !== lastRenderPhaseUpdate);
          objectIs(newState, hook.memoizedState) || (didReceiveUpdate = !0), hook.memoizedState = newState, hook.baseQueue === null && (hook.baseState = newState), queue.lastRenderedState = newState;
        }
        return [newState, dispatch];
      }
      function updateSyncExternalStore(subscribe, getSnapshot, getServerSnapshot) {
        var fiber = currentlyRenderingFiber, hook = updateWorkInProgressHook(), isHydrating$jscomp$0 = isHydrating;
        if (isHydrating$jscomp$0) {
          if (getServerSnapshot === void 0) throw Error(formatProdErrorMessage(407));
          getServerSnapshot = getServerSnapshot();
        } else getServerSnapshot = getSnapshot();
        var snapshotChanged = !objectIs(
          (currentHook || hook).memoizedState,
          getServerSnapshot
        );
        if (snapshotChanged && (hook.memoizedState = getServerSnapshot, didReceiveUpdate = !0), hook = hook.queue, updateEffect(subscribeToStore.bind(null, fiber, hook, subscribe), [
          subscribe
        ]), subscribe = hook.getSnapshot !== getSnapshot || snapshotChanged || workInProgressHook !== null && (workInProgressHook.memoizedState.tag & 1) !== 0, pushSimpleEffect(
          subscribe ? 9 : 8,
          { destroy: void 0 },
          updateStoreInstance.bind(null, fiber, hook, getServerSnapshot, getSnapshot),
          null
        ), subscribe) {
          if (fiber.flags |= 2048, workInProgressRoot === null) throw Error(formatProdErrorMessage(349));
          isHydrating$jscomp$0 || (renderLanes & 127) !== 0 || pushStoreConsistencyCheck(fiber, getSnapshot, getServerSnapshot);
        }
        return getServerSnapshot;
      }
      function pushStoreConsistencyCheck(fiber, getSnapshot, renderedSnapshot) {
        fiber.flags |= 16384, fiber = { getSnapshot, value: renderedSnapshot }, getSnapshot = currentlyRenderingFiber.updateQueue, getSnapshot === null ? (getSnapshot = createFunctionComponentUpdateQueue(), currentlyRenderingFiber.updateQueue = getSnapshot, getSnapshot.stores = [fiber]) : (renderedSnapshot = getSnapshot.stores, renderedSnapshot === null ? getSnapshot.stores = [fiber] : renderedSnapshot.push(fiber));
      }
      function updateStoreInstance(fiber, inst, nextSnapshot, getSnapshot) {
        inst.value = nextSnapshot, inst.getSnapshot = getSnapshot, checkIfSnapshotChanged(inst) && forceStoreRerender(fiber);
      }
      function subscribeToStore(fiber, inst, subscribe) {
        return subscribe(function() {
          checkIfSnapshotChanged(inst) && forceStoreRerender(fiber);
        });
      }
      function checkIfSnapshotChanged(inst) {
        var latestGetSnapshot = inst.getSnapshot;
        inst = inst.value;
        try {
          var nextValue = latestGetSnapshot();
          return !objectIs(inst, nextValue);
        } catch {
          return !0;
        }
      }
      function forceStoreRerender(fiber) {
        var root2 = enqueueConcurrentRenderForLane(fiber, 2);
        root2 !== null && scheduleUpdateOnFiber(root2, fiber, 2);
      }
      function mountStateImpl(initialState) {
        var hook = mountWorkInProgressHook();
        if (typeof initialState == "function") {
          var initialStateInitializer = initialState;
          if (initialState = initialStateInitializer(), shouldDoubleInvokeUserFnsInHooksDEV) {
            setIsStrictModeForDevtools(!0);
            try {
              initialStateInitializer();
            } finally {
              setIsStrictModeForDevtools(!1);
            }
          }
        }
        return hook.memoizedState = hook.baseState = initialState, hook.queue = {
          pending: null,
          lanes: 0,
          dispatch: null,
          lastRenderedReducer: basicStateReducer,
          lastRenderedState: initialState
        }, hook;
      }
      function updateOptimisticImpl(hook, current2, passthrough, reducer) {
        return hook.baseState = passthrough, updateReducerImpl(
          hook,
          currentHook,
          typeof reducer == "function" ? reducer : basicStateReducer
        );
      }
      function dispatchActionState(fiber, actionQueue, setPendingState, setState, payload) {
        if (isRenderPhaseUpdate(fiber)) throw Error(formatProdErrorMessage(485));
        if (fiber = actionQueue.action, fiber !== null) {
          var actionNode = {
            payload,
            action: fiber,
            next: null,
            isTransition: !0,
            status: "pending",
            value: null,
            reason: null,
            listeners: [],
            then: function(listener) {
              actionNode.listeners.push(listener);
            }
          };
          ReactSharedInternals.T !== null ? setPendingState(!0) : actionNode.isTransition = !1, setState(actionNode), setPendingState = actionQueue.pending, setPendingState === null ? (actionNode.next = actionQueue.pending = actionNode, runActionStateAction(actionQueue, actionNode)) : (actionNode.next = setPendingState.next, actionQueue.pending = setPendingState.next = actionNode);
        }
      }
      function runActionStateAction(actionQueue, node) {
        var action = node.action, payload = node.payload, prevState = actionQueue.state;
        if (node.isTransition) {
          var prevTransition = ReactSharedInternals.T, currentTransition = {};
          currentTransition.types = prevTransition !== null ? prevTransition.types : null, ReactSharedInternals.T = currentTransition;
          try {
            var returnValue = action(prevState, payload), onStartTransitionFinish = ReactSharedInternals.S;
            onStartTransitionFinish !== null && onStartTransitionFinish(currentTransition, returnValue), handleActionReturnValue(actionQueue, node, returnValue);
          } catch (error) {
            onActionError(actionQueue, node, error);
          } finally {
            prevTransition !== null && currentTransition.types !== null && (prevTransition.types = currentTransition.types), ReactSharedInternals.T = prevTransition;
          }
        } else
          try {
            prevTransition = action(prevState, payload), handleActionReturnValue(actionQueue, node, prevTransition);
          } catch (error$70) {
            onActionError(actionQueue, node, error$70);
          }
      }
      function handleActionReturnValue(actionQueue, node, returnValue) {
        returnValue !== null && typeof returnValue == "object" && typeof returnValue.then == "function" ? returnValue.then(
          function(nextState) {
            onActionSuccess(actionQueue, node, nextState);
          },
          function(error) {
            return onActionError(actionQueue, node, error);
          }
        ) : onActionSuccess(actionQueue, node, returnValue);
      }
      function onActionSuccess(actionQueue, actionNode, nextState) {
        actionNode.status = "fulfilled", actionNode.value = nextState, notifyActionListeners(actionNode), actionQueue.state = nextState, actionNode = actionQueue.pending, actionNode !== null && (nextState = actionNode.next, nextState === actionNode ? actionQueue.pending = null : (nextState = nextState.next, actionNode.next = nextState, runActionStateAction(actionQueue, nextState)));
      }
      function onActionError(actionQueue, actionNode, error) {
        var last = actionQueue.pending;
        if (actionQueue.pending = null, last !== null) {
          last = last.next;
          do
            actionNode.status = "rejected", actionNode.reason = error, notifyActionListeners(actionNode), actionNode = actionNode.next;
          while (actionNode !== last);
        }
        actionQueue.action = null;
      }
      function notifyActionListeners(actionNode) {
        actionNode = actionNode.listeners;
        for (var i = 0; i < actionNode.length; i++) (0, actionNode[i])();
      }
      function actionStateReducer(oldState, newState) {
        return newState;
      }
      function mountActionState(action, initialStateProp) {
        if (isHydrating) {
          var ssrFormState = workInProgressRoot.formState;
          if (ssrFormState !== null) {
            a: {
              var JSCompiler_inline_result = currentlyRenderingFiber;
              if (isHydrating) {
                if (nextHydratableInstance) {
                  b: {
                    for (var JSCompiler_inline_result$jscomp$0 = nextHydratableInstance, inRootOrSingleton = rootOrSingletonContext; JSCompiler_inline_result$jscomp$0.nodeType !== 8; ) {
                      if (!inRootOrSingleton) {
                        JSCompiler_inline_result$jscomp$0 = null;
                        break b;
                      }
                      if (JSCompiler_inline_result$jscomp$0 = getNextHydratable(
                        JSCompiler_inline_result$jscomp$0.nextSibling
                      ), JSCompiler_inline_result$jscomp$0 === null) {
                        JSCompiler_inline_result$jscomp$0 = null;
                        break b;
                      }
                    }
                    inRootOrSingleton = JSCompiler_inline_result$jscomp$0.data, JSCompiler_inline_result$jscomp$0 = inRootOrSingleton === "F!" || inRootOrSingleton === "F" ? JSCompiler_inline_result$jscomp$0 : null;
                  }
                  if (JSCompiler_inline_result$jscomp$0) {
                    nextHydratableInstance = getNextHydratable(
                      JSCompiler_inline_result$jscomp$0.nextSibling
                    ), JSCompiler_inline_result = JSCompiler_inline_result$jscomp$0.data === "F!";
                    break a;
                  }
                }
                throwOnHydrationMismatch(JSCompiler_inline_result);
              }
              JSCompiler_inline_result = !1;
            }
            JSCompiler_inline_result && (initialStateProp = ssrFormState[0]);
          }
        }
        return ssrFormState = mountWorkInProgressHook(), ssrFormState.memoizedState = ssrFormState.baseState = initialStateProp, JSCompiler_inline_result = {
          pending: null,
          lanes: 0,
          dispatch: null,
          lastRenderedReducer: actionStateReducer,
          lastRenderedState: initialStateProp
        }, ssrFormState.queue = JSCompiler_inline_result, ssrFormState = dispatchSetState.bind(
          null,
          currentlyRenderingFiber,
          JSCompiler_inline_result
        ), JSCompiler_inline_result.dispatch = ssrFormState, JSCompiler_inline_result = mountStateImpl(!1), inRootOrSingleton = dispatchOptimisticSetState.bind(
          null,
          currentlyRenderingFiber,
          !1,
          JSCompiler_inline_result.queue
        ), JSCompiler_inline_result = mountWorkInProgressHook(), JSCompiler_inline_result$jscomp$0 = {
          state: initialStateProp,
          dispatch: null,
          action,
          pending: null
        }, JSCompiler_inline_result.queue = JSCompiler_inline_result$jscomp$0, ssrFormState = dispatchActionState.bind(
          null,
          currentlyRenderingFiber,
          JSCompiler_inline_result$jscomp$0,
          inRootOrSingleton,
          ssrFormState
        ), JSCompiler_inline_result$jscomp$0.dispatch = ssrFormState, JSCompiler_inline_result.memoizedState = action, [initialStateProp, ssrFormState, !1];
      }
      function updateActionState(action) {
        var stateHook = updateWorkInProgressHook();
        return updateActionStateImpl(stateHook, currentHook, action);
      }
      function updateActionStateImpl(stateHook, currentStateHook, action) {
        if (currentStateHook = updateReducerImpl(
          stateHook,
          currentStateHook,
          actionStateReducer
        )[0], stateHook = updateReducer(basicStateReducer)[0], typeof currentStateHook == "object" && currentStateHook !== null && typeof currentStateHook.then == "function")
          try {
            var state = useThenable(currentStateHook);
          } catch (x) {
            throw x === SuspenseException ? SuspenseActionException : x;
          }
        else state = currentStateHook;
        currentStateHook = updateWorkInProgressHook();
        var actionQueue = currentStateHook.queue, dispatch = actionQueue.dispatch;
        return action !== currentStateHook.memoizedState && (currentlyRenderingFiber.flags |= 2048, pushSimpleEffect(
          9,
          { destroy: void 0 },
          actionStateActionEffect.bind(null, actionQueue, action),
          null
        )), [state, dispatch, stateHook];
      }
      function actionStateActionEffect(actionQueue, action) {
        actionQueue.action = action;
      }
      function rerenderActionState(action) {
        var stateHook = updateWorkInProgressHook(), currentStateHook = currentHook;
        if (currentStateHook !== null)
          return updateActionStateImpl(stateHook, currentStateHook, action);
        updateWorkInProgressHook(), stateHook = stateHook.memoizedState, currentStateHook = updateWorkInProgressHook();
        var dispatch = currentStateHook.queue.dispatch;
        return currentStateHook.memoizedState = action, [stateHook, dispatch, !1];
      }
      function pushSimpleEffect(tag, inst, create, deps) {
        return tag = { tag, create, deps, inst, next: null }, inst = currentlyRenderingFiber.updateQueue, inst === null && (inst = createFunctionComponentUpdateQueue(), currentlyRenderingFiber.updateQueue = inst), create = inst.lastEffect, create === null ? inst.lastEffect = tag.next = tag : (deps = create.next, create.next = tag, tag.next = deps, inst.lastEffect = tag), tag;
      }
      function updateRef() {
        return updateWorkInProgressHook().memoizedState;
      }
      function mountEffectImpl(fiberFlags, hookFlags, create, deps) {
        var hook = mountWorkInProgressHook();
        currentlyRenderingFiber.flags |= fiberFlags, hook.memoizedState = pushSimpleEffect(
          1 | hookFlags,
          { destroy: void 0 },
          create,
          deps === void 0 ? null : deps
        );
      }
      function updateEffectImpl(fiberFlags, hookFlags, create, deps) {
        var hook = updateWorkInProgressHook();
        deps = deps === void 0 ? null : deps;
        var inst = hook.memoizedState.inst;
        currentHook !== null && deps !== null && areHookInputsEqual(deps, currentHook.memoizedState.deps) ? hook.memoizedState = pushSimpleEffect(hookFlags, inst, create, deps) : (currentlyRenderingFiber.flags |= fiberFlags, hook.memoizedState = pushSimpleEffect(
          1 | hookFlags,
          inst,
          create,
          deps
        ));
      }
      function mountEffect(create, deps) {
        mountEffectImpl(8390656, 8, create, deps);
      }
      function updateEffect(create, deps) {
        updateEffectImpl(2048, 8, create, deps);
      }
      function useEffectEventImpl(payload) {
        currentlyRenderingFiber.flags |= 4;
        var componentUpdateQueue = currentlyRenderingFiber.updateQueue;
        if (componentUpdateQueue === null)
          componentUpdateQueue = createFunctionComponentUpdateQueue(), currentlyRenderingFiber.updateQueue = componentUpdateQueue, componentUpdateQueue.events = [payload];
        else {
          var events = componentUpdateQueue.events;
          events === null ? componentUpdateQueue.events = [payload] : events.push(payload);
        }
      }
      function updateEvent(callback) {
        var ref = updateWorkInProgressHook().memoizedState;
        return useEffectEventImpl({ ref, nextImpl: callback }), function() {
          if ((executionContext & 2) !== 0) throw Error(formatProdErrorMessage(440));
          return ref.impl.apply(void 0, arguments);
        };
      }
      function updateInsertionEffect(create, deps) {
        return updateEffectImpl(4, 2, create, deps);
      }
      function updateLayoutEffect(create, deps) {
        return updateEffectImpl(4, 4, create, deps);
      }
      function imperativeHandleEffect(create, ref) {
        if (typeof ref == "function") {
          create = create();
          var refCleanup = ref(create);
          return function() {
            typeof refCleanup == "function" ? refCleanup() : ref(null);
          };
        }
        if (ref != null)
          return create = create(), ref.current = create, function() {
            ref.current = null;
          };
      }
      function updateImperativeHandle(ref, create, deps) {
        deps = deps != null ? deps.concat([ref]) : null, updateEffectImpl(4, 4, imperativeHandleEffect.bind(null, create, ref), deps);
      }
      function mountDebugValue() {
      }
      function updateCallback(callback, deps) {
        var hook = updateWorkInProgressHook();
        deps = deps === void 0 ? null : deps;
        var prevState = hook.memoizedState;
        return deps !== null && areHookInputsEqual(deps, prevState[1]) ? prevState[0] : (hook.memoizedState = [callback, deps], callback);
      }
      function updateMemo(nextCreate, deps) {
        var hook = updateWorkInProgressHook();
        deps = deps === void 0 ? null : deps;
        var prevState = hook.memoizedState;
        if (deps !== null && areHookInputsEqual(deps, prevState[1]))
          return prevState[0];
        if (prevState = nextCreate(), shouldDoubleInvokeUserFnsInHooksDEV) {
          setIsStrictModeForDevtools(!0);
          try {
            nextCreate();
          } finally {
            setIsStrictModeForDevtools(!1);
          }
        }
        return hook.memoizedState = [prevState, deps], prevState;
      }
      function mountDeferredValueImpl(hook, value, initialValue) {
        return initialValue === void 0 || (renderLanes & 1073741824) !== 0 && (workInProgressRootRenderLanes & 261930) === 0 ? hook.memoizedState = value : (hook.memoizedState = initialValue, hook = requestDeferredLane(), currentlyRenderingFiber.lanes |= hook, workInProgressRootSkippedLanes |= hook, initialValue);
      }
      function updateDeferredValueImpl(hook, prevValue, value, initialValue) {
        return objectIs(value, prevValue) ? value : currentTreeHiddenStackCursor.current !== null ? (hook = mountDeferredValueImpl(hook, value, initialValue), objectIs(hook, prevValue) || (didReceiveUpdate = !0), hook) : (renderLanes & 106) === 0 || (renderLanes & 1073741824) !== 0 && (workInProgressRootRenderLanes & 261930) === 0 ? (didReceiveUpdate = !0, hook.memoizedState = value) : (hook = requestDeferredLane(), currentlyRenderingFiber.lanes |= hook, workInProgressRootSkippedLanes |= hook, prevValue);
      }
      function startTransition(fiber, queue, pendingState, finishedState, callback) {
        var previousPriority = ReactDOMSharedInternals.p;
        ReactDOMSharedInternals.p = previousPriority !== 0 && 8 > previousPriority ? previousPriority : 8;
        var prevTransition = ReactSharedInternals.T, currentTransition = {};
        currentTransition.types = prevTransition !== null ? prevTransition.types : null, ReactSharedInternals.T = currentTransition, dispatchOptimisticSetState(fiber, !1, queue, pendingState);
        try {
          var returnValue = callback(), onStartTransitionFinish = ReactSharedInternals.S;
          if (onStartTransitionFinish !== null && onStartTransitionFinish(currentTransition, returnValue), returnValue !== null && typeof returnValue == "object" && typeof returnValue.then == "function") {
            var thenableForFinishedState = chainThenableValue(
              returnValue,
              finishedState
            );
            dispatchSetStateInternal(
              fiber,
              queue,
              thenableForFinishedState,
              requestUpdateLane(fiber)
            );
          } else
            dispatchSetStateInternal(
              fiber,
              queue,
              finishedState,
              requestUpdateLane(fiber)
            );
        } catch (error) {
          dispatchSetStateInternal(
            fiber,
            queue,
            { then: function() {
            }, status: "rejected", reason: error },
            requestUpdateLane()
          );
        } finally {
          ReactDOMSharedInternals.p = previousPriority, prevTransition !== null && currentTransition.types !== null && (prevTransition.types = currentTransition.types), ReactSharedInternals.T = prevTransition;
        }
      }
      function noop2() {
      }
      function startHostTransition(formFiber, pendingState, action, formData) {
        if (formFiber.tag !== 5) throw Error(formatProdErrorMessage(476));
        var queue = ensureFormComponentIsStateful(formFiber).queue;
        startTransition(
          formFiber,
          queue,
          pendingState,
          sharedNotPendingObject,
          action === null ? noop2 : function() {
            return requestFormReset$1(formFiber), action(formData);
          }
        );
      }
      function ensureFormComponentIsStateful(formFiber) {
        var existingStateHook = formFiber.memoizedState;
        if (existingStateHook !== null) return existingStateHook;
        existingStateHook = {
          memoizedState: sharedNotPendingObject,
          baseState: sharedNotPendingObject,
          baseQueue: null,
          queue: {
            pending: null,
            lanes: 0,
            dispatch: null,
            lastRenderedReducer: basicStateReducer,
            lastRenderedState: sharedNotPendingObject
          },
          next: null
        };
        var initialResetState = {};
        return existingStateHook.next = {
          memoizedState: initialResetState,
          baseState: initialResetState,
          baseQueue: null,
          queue: {
            pending: null,
            lanes: 0,
            dispatch: null,
            lastRenderedReducer: basicStateReducer,
            lastRenderedState: initialResetState
          },
          next: null
        }, formFiber.memoizedState = existingStateHook, formFiber = formFiber.alternate, formFiber !== null && (formFiber.memoizedState = existingStateHook), existingStateHook;
      }
      function requestFormReset$1(formFiber) {
        var stateHook = ensureFormComponentIsStateful(formFiber);
        stateHook.next === null && (stateHook = formFiber.alternate.memoizedState), dispatchSetStateInternal(
          formFiber,
          stateHook.next.queue,
          {},
          requestUpdateLane()
        );
      }
      function useHostTransitionStatus() {
        return readContext(HostTransitionContext);
      }
      function updateId() {
        return updateWorkInProgressHook().memoizedState;
      }
      function updateRefresh() {
        return updateWorkInProgressHook().memoizedState;
      }
      function refreshCache(fiber) {
        for (var provider = fiber.return; provider !== null; ) {
          switch (provider.tag) {
            case 24:
            case 3:
              var lane = requestUpdateLane();
              fiber = createUpdate(lane);
              var root$73 = enqueueUpdate(provider, fiber, lane);
              root$73 !== null && (scheduleUpdateOnFiber(root$73, provider, lane), entangleTransitions(root$73, provider, lane)), provider = { cache: createCache() }, fiber.payload = provider;
              return;
          }
          provider = provider.return;
        }
      }
      function dispatchReducerAction(fiber, queue, action) {
        var lane = requestUpdateLane();
        action = {
          lane,
          revertLane: 0,
          gesture: null,
          action,
          hasEagerState: !1,
          eagerState: null,
          next: null
        }, isRenderPhaseUpdate(fiber) ? enqueueRenderPhaseUpdate(queue, action) : (action = enqueueConcurrentHookUpdate(fiber, queue, action, lane), action !== null && (scheduleUpdateOnFiber(action, fiber, lane), entangleTransitionUpdate(action, queue, lane)));
      }
      function dispatchSetState(fiber, queue, action) {
        var lane = requestUpdateLane();
        dispatchSetStateInternal(fiber, queue, action, lane);
      }
      function dispatchSetStateInternal(fiber, queue, action, lane) {
        var update = {
          lane,
          revertLane: 0,
          gesture: null,
          action,
          hasEagerState: !1,
          eagerState: null,
          next: null
        };
        if (isRenderPhaseUpdate(fiber)) enqueueRenderPhaseUpdate(queue, update);
        else {
          var alternate = fiber.alternate;
          if (fiber.lanes === 0 && (alternate === null || alternate.lanes === 0) && (alternate = queue.lastRenderedReducer, alternate !== null))
            try {
              var currentState = queue.lastRenderedState, eagerState = alternate(currentState, action);
              if (update.hasEagerState = !0, update.eagerState = eagerState, objectIs(eagerState, currentState))
                return enqueueUpdate$1(fiber, queue, update, 0), workInProgressRoot === null && finishQueueingConcurrentUpdates(), !1;
            } catch {
            }
          if (action = enqueueConcurrentHookUpdate(fiber, queue, update, lane), action !== null)
            return scheduleUpdateOnFiber(action, fiber, lane), entangleTransitionUpdate(action, queue, lane), !0;
        }
        return !1;
      }
      function dispatchOptimisticSetState(fiber, throwIfDuringRender, queue, action) {
        if (action = {
          lane: 2,
          revertLane: requestTransitionLane(),
          gesture: null,
          action,
          hasEagerState: !1,
          eagerState: null,
          next: null
        }, isRenderPhaseUpdate(fiber)) {
          if (throwIfDuringRender) throw Error(formatProdErrorMessage(479));
        } else
          throwIfDuringRender = enqueueConcurrentHookUpdate(
            fiber,
            queue,
            action,
            2
          ), throwIfDuringRender !== null && scheduleUpdateOnFiber(throwIfDuringRender, fiber, 2);
      }
      function isRenderPhaseUpdate(fiber) {
        var alternate = fiber.alternate;
        return fiber === currentlyRenderingFiber || alternate !== null && alternate === currentlyRenderingFiber;
      }
      function enqueueRenderPhaseUpdate(queue, update) {
        didScheduleRenderPhaseUpdateDuringThisPass = didScheduleRenderPhaseUpdate = !0;
        var pending = queue.pending;
        pending === null ? update.next = update : (update.next = pending.next, pending.next = update), queue.pending = update;
      }
      function entangleTransitionUpdate(root2, queue, lane) {
        if ((lane & 4194048) !== 0) {
          var queueLanes = queue.lanes;
          queueLanes &= root2.pendingLanes, lane |= queueLanes, queue.lanes = lane, markRootEntangled(root2, lane);
        }
      }
      var ContextOnlyDispatcher = {
        readContext,
        use,
        useCallback: throwInvalidHookError,
        useContext: throwInvalidHookError,
        useEffect: throwInvalidHookError,
        useImperativeHandle: throwInvalidHookError,
        useLayoutEffect: throwInvalidHookError,
        useInsertionEffect: throwInvalidHookError,
        useMemo: throwInvalidHookError,
        useReducer: throwInvalidHookError,
        useRef: throwInvalidHookError,
        useState: throwInvalidHookError,
        useDebugValue: throwInvalidHookError,
        useDeferredValue: throwInvalidHookError,
        useTransition: throwInvalidHookError,
        useSyncExternalStore: throwInvalidHookError,
        useId: throwInvalidHookError,
        useHostTransitionStatus: throwInvalidHookError,
        useFormState: throwInvalidHookError,
        useActionState: throwInvalidHookError,
        useOptimistic: throwInvalidHookError,
        useMemoCache: throwInvalidHookError,
        useCacheRefresh: throwInvalidHookError,
        useEffectEvent: throwInvalidHookError
      }, HooksDispatcherOnMount = {
        readContext,
        use,
        useCallback: function(callback, deps) {
          return mountWorkInProgressHook().memoizedState = [
            callback,
            deps === void 0 ? null : deps
          ], callback;
        },
        useContext: readContext,
        useEffect: mountEffect,
        useImperativeHandle: function(ref, create, deps) {
          deps = deps != null ? deps.concat([ref]) : null, mountEffectImpl(
            4194308,
            4,
            imperativeHandleEffect.bind(null, create, ref),
            deps
          );
        },
        useLayoutEffect: function(create, deps) {
          return mountEffectImpl(4194308, 4, create, deps);
        },
        useInsertionEffect: function(create, deps) {
          mountEffectImpl(4, 2, create, deps);
        },
        useMemo: function(nextCreate, deps) {
          var hook = mountWorkInProgressHook();
          deps = deps === void 0 ? null : deps;
          var nextValue = nextCreate();
          if (shouldDoubleInvokeUserFnsInHooksDEV) {
            setIsStrictModeForDevtools(!0);
            try {
              nextCreate();
            } finally {
              setIsStrictModeForDevtools(!1);
            }
          }
          return hook.memoizedState = [nextValue, deps], nextValue;
        },
        useReducer: function(reducer, initialArg, init) {
          var hook = mountWorkInProgressHook();
          if (init !== void 0) {
            var initialState = init(initialArg);
            if (shouldDoubleInvokeUserFnsInHooksDEV) {
              setIsStrictModeForDevtools(!0);
              try {
                init(initialArg);
              } finally {
                setIsStrictModeForDevtools(!1);
              }
            }
          } else initialState = initialArg;
          return hook.memoizedState = hook.baseState = initialState, reducer = {
            pending: null,
            lanes: 0,
            dispatch: null,
            lastRenderedReducer: reducer,
            lastRenderedState: initialState
          }, hook.queue = reducer, reducer = reducer.dispatch = dispatchReducerAction.bind(
            null,
            currentlyRenderingFiber,
            reducer
          ), [hook.memoizedState, reducer];
        },
        useRef: function(initialValue) {
          var hook = mountWorkInProgressHook();
          return initialValue = { current: initialValue }, hook.memoizedState = initialValue;
        },
        useState: function(initialState) {
          initialState = mountStateImpl(initialState);
          var queue = initialState.queue, dispatch = dispatchSetState.bind(null, currentlyRenderingFiber, queue);
          return queue.dispatch = dispatch, [initialState.memoizedState, dispatch];
        },
        useDebugValue: mountDebugValue,
        useDeferredValue: function(value, initialValue) {
          var hook = mountWorkInProgressHook();
          return mountDeferredValueImpl(hook, value, initialValue);
        },
        useTransition: function() {
          var stateHook = mountStateImpl(!1);
          return stateHook = startTransition.bind(
            null,
            currentlyRenderingFiber,
            stateHook.queue,
            !0,
            !1
          ), mountWorkInProgressHook().memoizedState = stateHook, [!1, stateHook];
        },
        useSyncExternalStore: function(subscribe, getSnapshot, getServerSnapshot) {
          var fiber = currentlyRenderingFiber, hook = mountWorkInProgressHook();
          if (isHydrating) {
            if (getServerSnapshot === void 0)
              throw Error(formatProdErrorMessage(407));
            getServerSnapshot = getServerSnapshot();
          } else {
            if (getServerSnapshot = getSnapshot(), workInProgressRoot === null)
              throw Error(formatProdErrorMessage(349));
            (workInProgressRootRenderLanes & 127) !== 0 || pushStoreConsistencyCheck(fiber, getSnapshot, getServerSnapshot);
          }
          hook.memoizedState = getServerSnapshot;
          var inst = { value: getServerSnapshot, getSnapshot };
          return hook.queue = inst, mountEffect(subscribeToStore.bind(null, fiber, inst, subscribe), [
            subscribe
          ]), fiber.flags |= 2048, pushSimpleEffect(
            9,
            { destroy: void 0 },
            updateStoreInstance.bind(
              null,
              fiber,
              inst,
              getServerSnapshot,
              getSnapshot
            ),
            null
          ), getServerSnapshot;
        },
        useId: function() {
          var hook = mountWorkInProgressHook(), identifierPrefix = workInProgressRoot.identifierPrefix;
          if (isHydrating) {
            var JSCompiler_inline_result = treeContextOverflow, idWithLeadingBit = treeContextId;
            JSCompiler_inline_result = (idWithLeadingBit & ~(1 << 32 - clz32(idWithLeadingBit) - 1)).toString(32) + JSCompiler_inline_result, identifierPrefix = "_" + identifierPrefix + "R_" + JSCompiler_inline_result, JSCompiler_inline_result = localIdCounter++, 0 < JSCompiler_inline_result && (identifierPrefix += "H" + JSCompiler_inline_result.toString(32)), identifierPrefix += "_";
          } else
            JSCompiler_inline_result = globalClientIdCounter++, identifierPrefix = "_" + identifierPrefix + "r_" + JSCompiler_inline_result.toString(32) + "_";
          return hook.memoizedState = identifierPrefix;
        },
        useHostTransitionStatus,
        useFormState: mountActionState,
        useActionState: mountActionState,
        useOptimistic: function(passthrough) {
          var hook = mountWorkInProgressHook();
          hook.memoizedState = hook.baseState = passthrough;
          var queue = {
            pending: null,
            lanes: 0,
            dispatch: null,
            lastRenderedReducer: null,
            lastRenderedState: null
          };
          return hook.queue = queue, hook = dispatchOptimisticSetState.bind(
            null,
            currentlyRenderingFiber,
            !0,
            queue
          ), queue.dispatch = hook, [passthrough, hook];
        },
        useMemoCache,
        useCacheRefresh: function() {
          return mountWorkInProgressHook().memoizedState = refreshCache.bind(
            null,
            currentlyRenderingFiber
          );
        },
        useEffectEvent: function(callback) {
          var hook = mountWorkInProgressHook(), ref = { impl: callback };
          return hook.memoizedState = ref, function() {
            if ((executionContext & 2) !== 0)
              throw Error(formatProdErrorMessage(440));
            return ref.impl.apply(void 0, arguments);
          };
        }
      }, HooksDispatcherOnUpdate = {
        readContext,
        use,
        useCallback: updateCallback,
        useContext: readContext,
        useEffect: updateEffect,
        useImperativeHandle: updateImperativeHandle,
        useInsertionEffect: updateInsertionEffect,
        useLayoutEffect: updateLayoutEffect,
        useMemo: updateMemo,
        useReducer: updateReducer,
        useRef: updateRef,
        useState: function() {
          return updateReducer(basicStateReducer);
        },
        useDebugValue: mountDebugValue,
        useDeferredValue: function(value, initialValue) {
          var hook = updateWorkInProgressHook();
          return updateDeferredValueImpl(
            hook,
            currentHook.memoizedState,
            value,
            initialValue
          );
        },
        useTransition: function() {
          var booleanOrThenable = updateReducer(basicStateReducer)[0], start = updateWorkInProgressHook().memoizedState;
          return [
            typeof booleanOrThenable == "boolean" ? booleanOrThenable : useThenable(booleanOrThenable),
            start
          ];
        },
        useSyncExternalStore: updateSyncExternalStore,
        useId: updateId,
        useHostTransitionStatus,
        useFormState: updateActionState,
        useActionState: updateActionState,
        useOptimistic: function(passthrough, reducer) {
          var hook = updateWorkInProgressHook();
          return updateOptimisticImpl(hook, currentHook, passthrough, reducer);
        },
        useMemoCache,
        useCacheRefresh: updateRefresh,
        useEffectEvent: updateEvent
      }, HooksDispatcherOnRerender = {
        readContext,
        use,
        useCallback: updateCallback,
        useContext: readContext,
        useEffect: updateEffect,
        useImperativeHandle: updateImperativeHandle,
        useInsertionEffect: updateInsertionEffect,
        useLayoutEffect: updateLayoutEffect,
        useMemo: updateMemo,
        useReducer: rerenderReducer,
        useRef: updateRef,
        useState: function() {
          return rerenderReducer(basicStateReducer);
        },
        useDebugValue: mountDebugValue,
        useDeferredValue: function(value, initialValue) {
          var hook = updateWorkInProgressHook();
          return currentHook === null ? mountDeferredValueImpl(hook, value, initialValue) : updateDeferredValueImpl(
            hook,
            currentHook.memoizedState,
            value,
            initialValue
          );
        },
        useTransition: function() {
          var booleanOrThenable = rerenderReducer(basicStateReducer)[0], start = updateWorkInProgressHook().memoizedState;
          return [
            typeof booleanOrThenable == "boolean" ? booleanOrThenable : useThenable(booleanOrThenable),
            start
          ];
        },
        useSyncExternalStore: updateSyncExternalStore,
        useId: updateId,
        useHostTransitionStatus,
        useFormState: rerenderActionState,
        useActionState: rerenderActionState,
        useOptimistic: function(passthrough, reducer) {
          var hook = updateWorkInProgressHook();
          return currentHook !== null ? updateOptimisticImpl(hook, currentHook, passthrough, reducer) : (hook.baseState = passthrough, [passthrough, hook.queue.dispatch]);
        },
        useMemoCache,
        useCacheRefresh: updateRefresh,
        useEffectEvent: updateEvent
      };
      function applyDerivedStateFromProps(workInProgress2, ctor, getDerivedStateFromProps, nextProps) {
        ctor = workInProgress2.memoizedState, getDerivedStateFromProps = getDerivedStateFromProps(nextProps, ctor), getDerivedStateFromProps = getDerivedStateFromProps == null ? ctor : assign({}, ctor, getDerivedStateFromProps), workInProgress2.memoizedState = getDerivedStateFromProps, workInProgress2.lanes === 0 && (workInProgress2.updateQueue.baseState = getDerivedStateFromProps);
      }
      var classComponentUpdater = {
        enqueueSetState: function(inst, payload, callback) {
          inst = inst._reactInternals;
          var lane = requestUpdateLane(), update = createUpdate(lane);
          update.payload = payload, callback != null && (update.callback = callback), payload = enqueueUpdate(inst, update, lane), payload !== null && (scheduleUpdateOnFiber(payload, inst, lane), entangleTransitions(payload, inst, lane));
        },
        enqueueReplaceState: function(inst, payload, callback) {
          inst = inst._reactInternals;
          var lane = requestUpdateLane(), update = createUpdate(lane);
          update.tag = 1, update.payload = payload, callback != null && (update.callback = callback), payload = enqueueUpdate(inst, update, lane), payload !== null && (scheduleUpdateOnFiber(payload, inst, lane), entangleTransitions(payload, inst, lane));
        },
        enqueueForceUpdate: function(inst, callback) {
          inst = inst._reactInternals;
          var lane = requestUpdateLane(), update = createUpdate(lane);
          update.tag = 2, callback != null && (update.callback = callback), callback = enqueueUpdate(inst, update, lane), callback !== null && (scheduleUpdateOnFiber(callback, inst, lane), entangleTransitions(callback, inst, lane));
        }
      };
      function checkShouldComponentUpdate(workInProgress2, ctor, oldProps, newProps, oldState, newState, nextContext) {
        return workInProgress2 = workInProgress2.stateNode, typeof workInProgress2.shouldComponentUpdate == "function" ? workInProgress2.shouldComponentUpdate(newProps, newState, nextContext) : ctor.prototype && ctor.prototype.isPureReactComponent ? !shallowEqual(oldProps, newProps) || !shallowEqual(oldState, newState) : !0;
      }
      function callComponentWillReceiveProps(workInProgress2, instance, newProps, nextContext) {
        workInProgress2 = instance.state, typeof instance.componentWillReceiveProps == "function" && instance.componentWillReceiveProps(newProps, nextContext), typeof instance.UNSAFE_componentWillReceiveProps == "function" && instance.UNSAFE_componentWillReceiveProps(newProps, nextContext), instance.state !== workInProgress2 && classComponentUpdater.enqueueReplaceState(instance, instance.state, null);
      }
      function resolveClassComponentProps(Component, baseProps) {
        var newProps = baseProps;
        if ("ref" in baseProps) {
          newProps = {};
          for (var propName in baseProps)
            propName !== "ref" && (newProps[propName] = baseProps[propName]);
        }
        if (Component = Component.defaultProps) {
          newProps === baseProps && (newProps = assign({}, newProps));
          for (var propName$77 in Component)
            newProps[propName$77] === void 0 && (newProps[propName$77] = Component[propName$77]);
        }
        return newProps;
      }
      function defaultOnUncaughtError(error) {
        reportGlobalError(error);
      }
      function defaultOnCaughtError(error) {
        console.error(error);
      }
      function defaultOnRecoverableError(error) {
        reportGlobalError(error);
      }
      function logUncaughtError(root2, errorInfo) {
        try {
          var onUncaughtError = root2.onUncaughtError;
          onUncaughtError(errorInfo.value, { componentStack: errorInfo.stack });
        } catch (e$78) {
          setTimeout(function() {
            throw e$78;
          });
        }
      }
      function logCaughtError(root2, boundary, errorInfo) {
        try {
          var onCaughtError = root2.onCaughtError;
          onCaughtError(errorInfo.value, {
            componentStack: errorInfo.stack,
            errorBoundary: boundary.tag === 1 ? boundary.stateNode : null
          });
        } catch (e$79) {
          setTimeout(function() {
            throw e$79;
          });
        }
      }
      function createRootErrorUpdate(root2, errorInfo, lane) {
        return lane = createUpdate(lane), lane.tag = 3, lane.payload = { element: null }, lane.callback = function() {
          logUncaughtError(root2, errorInfo);
        }, lane;
      }
      function createClassErrorUpdate(lane) {
        return lane = createUpdate(lane), lane.tag = 3, lane;
      }
      function initializeClassErrorUpdate(update, root2, fiber, errorInfo) {
        var getDerivedStateFromError = fiber.type.getDerivedStateFromError;
        if (typeof getDerivedStateFromError == "function") {
          var error = errorInfo.value;
          update.payload = function() {
            return getDerivedStateFromError(error);
          }, update.callback = function() {
            logCaughtError(root2, fiber, errorInfo);
          };
        }
        var inst = fiber.stateNode;
        inst !== null && typeof inst.componentDidCatch == "function" && (update.callback = function() {
          logCaughtError(root2, fiber, errorInfo), typeof getDerivedStateFromError != "function" && (legacyErrorBoundariesThatAlreadyFailed === null ? legacyErrorBoundariesThatAlreadyFailed = /* @__PURE__ */ new Set([this]) : legacyErrorBoundariesThatAlreadyFailed.add(this));
          var stack = errorInfo.stack;
          this.componentDidCatch(errorInfo.value, {
            componentStack: stack !== null ? stack : ""
          });
        });
      }
      function throwException(root2, returnFiber, sourceFiber, value, rootRenderLanes) {
        if (sourceFiber.flags |= 32768, value !== null && typeof value == "object" && typeof value.then == "function") {
          if (returnFiber = sourceFiber.alternate, returnFiber !== null && propagateParentContextChanges(
            returnFiber,
            sourceFiber,
            rootRenderLanes,
            !0
          ), sourceFiber = suspenseHandlerStackCursor.current, sourceFiber !== null) {
            switch (sourceFiber.tag) {
              case 31:
              case 13:
              case 19:
                return shellBoundary === null ? renderDidSuspendDelayIfPossible() : sourceFiber.alternate === null && workInProgressRootExitStatus === 0 && (workInProgressRootExitStatus = 3), sourceFiber.flags &= -257, sourceFiber.flags |= 65536, sourceFiber.lanes = rootRenderLanes, value === noopSuspenseyCommitThenable ? sourceFiber.flags |= 16384 : (returnFiber = sourceFiber.updateQueue, returnFiber === null ? sourceFiber.updateQueue = /* @__PURE__ */ new Set([value]) : returnFiber.add(value), attachPingListener(root2, value, rootRenderLanes)), !1;
              case 22:
                return sourceFiber.flags |= 65536, value === noopSuspenseyCommitThenable ? sourceFiber.flags |= 16384 : (returnFiber = sourceFiber.updateQueue, returnFiber === null ? (returnFiber = {
                  transitions: null,
                  markerInstances: null,
                  retryQueue: /* @__PURE__ */ new Set([value])
                }, sourceFiber.updateQueue = returnFiber) : (sourceFiber = returnFiber.retryQueue, sourceFiber === null ? returnFiber.retryQueue = /* @__PURE__ */ new Set([value]) : sourceFiber.add(value)), attachPingListener(root2, value, rootRenderLanes)), !1;
            }
            throw Error(formatProdErrorMessage(435, sourceFiber.tag));
          }
          return attachPingListener(root2, value, rootRenderLanes), renderDidSuspendDelayIfPossible(), !1;
        }
        if (isHydrating)
          return returnFiber = suspenseHandlerStackCursor.current, returnFiber !== null ? ((returnFiber.flags & 65536) === 0 && (returnFiber.flags |= 256), returnFiber.flags |= 65536, returnFiber.lanes = rootRenderLanes, value !== HydrationMismatchException && (root2 = Error(formatProdErrorMessage(422), { cause: value }), queueHydrationError(createCapturedValueAtFiber(root2, sourceFiber)))) : (value !== HydrationMismatchException && (returnFiber = Error(formatProdErrorMessage(423), {
            cause: value
          }), queueHydrationError(
            createCapturedValueAtFiber(returnFiber, sourceFiber)
          )), root2 = root2.current.alternate, root2.flags |= 65536, rootRenderLanes &= -rootRenderLanes, root2.lanes |= rootRenderLanes, value = createCapturedValueAtFiber(value, sourceFiber), rootRenderLanes = createRootErrorUpdate(
            root2.stateNode,
            value,
            rootRenderLanes
          ), enqueueCapturedUpdate(root2, rootRenderLanes), workInProgressRootExitStatus !== 4 && (workInProgressRootExitStatus = 2)), !1;
        var wrapperError = Error(formatProdErrorMessage(520), { cause: value });
        if (wrapperError = createCapturedValueAtFiber(wrapperError, sourceFiber), workInProgressRootConcurrentErrors === null ? workInProgressRootConcurrentErrors = [wrapperError] : workInProgressRootConcurrentErrors.push(wrapperError), workInProgressRootExitStatus !== 4 && (workInProgressRootExitStatus = 2), returnFiber === null) return !0;
        value = createCapturedValueAtFiber(value, sourceFiber), sourceFiber = returnFiber;
        do {
          switch (sourceFiber.tag) {
            case 3:
              return sourceFiber.flags |= 65536, root2 = rootRenderLanes & -rootRenderLanes, sourceFiber.lanes |= root2, root2 = createRootErrorUpdate(sourceFiber.stateNode, value, root2), enqueueCapturedUpdate(sourceFiber, root2), !1;
            case 1:
              if (returnFiber = sourceFiber.type, wrapperError = sourceFiber.stateNode, (sourceFiber.flags & 128) === 0 && (typeof returnFiber.getDerivedStateFromError == "function" || wrapperError !== null && typeof wrapperError.componentDidCatch == "function" && (legacyErrorBoundariesThatAlreadyFailed === null || !legacyErrorBoundariesThatAlreadyFailed.has(wrapperError))))
                return sourceFiber.flags |= 65536, rootRenderLanes &= -rootRenderLanes, sourceFiber.lanes |= rootRenderLanes, rootRenderLanes = createClassErrorUpdate(rootRenderLanes), initializeClassErrorUpdate(
                  rootRenderLanes,
                  root2,
                  sourceFiber,
                  value
                ), enqueueCapturedUpdate(sourceFiber, rootRenderLanes), !1;
              break;
            case 22:
              if (sourceFiber.memoizedState !== null)
                return sourceFiber.flags |= 65536, !1;
          }
          sourceFiber = sourceFiber.return;
        } while (sourceFiber !== null);
        return !1;
      }
      var SelectiveHydrationException = Error(formatProdErrorMessage(461)), didReceiveUpdate = !1;
      function reconcileChildren(current2, workInProgress2, nextChildren, renderLanes2) {
        workInProgress2.child = current2 === null ? mountChildFibers(workInProgress2, null, nextChildren, renderLanes2) : reconcileChildFibers(
          workInProgress2,
          current2.child,
          nextChildren,
          renderLanes2
        );
      }
      function updateForwardRef(current2, workInProgress2, Component, nextProps, renderLanes2) {
        Component = Component.render;
        var ref = workInProgress2.ref;
        if ("ref" in nextProps) {
          var propsWithoutRef = {};
          for (var key in nextProps)
            key !== "ref" && (propsWithoutRef[key] = nextProps[key]);
        } else propsWithoutRef = nextProps;
        return prepareToReadContext(workInProgress2), nextProps = renderWithHooks(
          current2,
          workInProgress2,
          Component,
          propsWithoutRef,
          ref,
          renderLanes2
        ), key = checkDidRenderIdHook(), current2 !== null && !didReceiveUpdate ? (bailoutHooks(current2, workInProgress2, renderLanes2), bailoutOnAlreadyFinishedWork(current2, workInProgress2, renderLanes2)) : (isHydrating && key && pushMaterializedTreeId(workInProgress2), workInProgress2.flags |= 1, reconcileChildren(current2, workInProgress2, nextProps, renderLanes2), workInProgress2.child);
      }
      function updateMemoComponent(current2, workInProgress2, Component, nextProps, renderLanes2) {
        if (current2 === null) {
          var type = Component.type;
          return typeof type == "function" && !shouldConstruct(type) && type.defaultProps === void 0 && Component.compare === null ? (workInProgress2.tag = 15, workInProgress2.type = type, updateSimpleMemoComponent(
            current2,
            workInProgress2,
            type,
            nextProps,
            renderLanes2
          )) : (current2 = createFiberFromTypeAndProps(
            Component.type,
            null,
            nextProps,
            workInProgress2,
            workInProgress2.mode,
            renderLanes2
          ), current2.ref = workInProgress2.ref, current2.return = workInProgress2, workInProgress2.child = current2);
        }
        if (type = current2.child, !checkScheduledUpdateOrContext(current2, renderLanes2)) {
          var prevProps = type.memoizedProps;
          if (Component = Component.compare, Component = Component !== null ? Component : shallowEqual, Component(prevProps, nextProps) && current2.ref === workInProgress2.ref)
            return bailoutOnAlreadyFinishedWork(current2, workInProgress2, renderLanes2);
        }
        return workInProgress2.flags |= 1, current2 = createWorkInProgress(type, nextProps), current2.ref = workInProgress2.ref, current2.return = workInProgress2, workInProgress2.child = current2;
      }
      function updateSimpleMemoComponent(current2, workInProgress2, Component, nextProps, renderLanes2) {
        if (current2 !== null) {
          var prevProps = current2.memoizedProps;
          if (shallowEqual(prevProps, nextProps) && current2.ref === workInProgress2.ref)
            if (didReceiveUpdate = !1, workInProgress2.pendingProps = nextProps = prevProps, checkScheduledUpdateOrContext(current2, renderLanes2))
              (current2.flags & 131072) !== 0 && (didReceiveUpdate = !0);
            else
              return workInProgress2.lanes = current2.lanes, bailoutOnAlreadyFinishedWork(current2, workInProgress2, renderLanes2);
        }
        return updateFunctionComponent(
          current2,
          workInProgress2,
          Component,
          nextProps,
          renderLanes2
        );
      }
      function updateOffscreenComponent(current2, workInProgress2, renderLanes2, nextProps) {
        var nextChildren = nextProps.children, prevState = current2 !== null ? current2.memoizedState : null;
        if (current2 === null && workInProgress2.stateNode === null && (workInProgress2.stateNode = {
          _visibility: 1,
          _pendingMarkers: null,
          _retryCache: null,
          _transitions: null
        }), nextProps.mode === "hidden") {
          if ((workInProgress2.flags & 128) !== 0) {
            if (prevState = prevState !== null ? prevState.baseLanes | renderLanes2 : renderLanes2, current2 !== null) {
              for (nextProps = workInProgress2.child = current2.child, nextChildren = 0; nextProps !== null; )
                nextChildren = nextChildren | nextProps.lanes | nextProps.childLanes, nextProps = nextProps.sibling;
              nextProps = nextChildren & ~prevState;
            } else nextProps = 0, workInProgress2.child = null;
            return deferHiddenOffscreenComponent(
              current2,
              workInProgress2,
              prevState,
              renderLanes2,
              nextProps
            );
          }
          if ((renderLanes2 & 536870912) !== 0)
            workInProgress2.memoizedState = { baseLanes: 0, cachePool: null }, current2 !== null && pushTransition(
              workInProgress2,
              prevState !== null ? prevState.cachePool : null
            ), prevState !== null ? pushHiddenContext(workInProgress2, prevState) : reuseHiddenContextOnStack(), pushOffscreenSuspenseHandler(workInProgress2);
          else
            return nextProps = workInProgress2.lanes = 536870912, deferHiddenOffscreenComponent(
              current2,
              workInProgress2,
              prevState !== null ? prevState.baseLanes | renderLanes2 : renderLanes2,
              renderLanes2,
              nextProps
            );
        } else
          prevState !== null ? (pushTransition(workInProgress2, prevState.cachePool), pushHiddenContext(workInProgress2, prevState), reuseSuspenseHandlerOnStack(), workInProgress2.memoizedState = null) : (current2 !== null && pushTransition(workInProgress2, null), reuseHiddenContextOnStack(), reuseSuspenseHandlerOnStack());
        return reconcileChildren(current2, workInProgress2, nextChildren, renderLanes2), workInProgress2.child;
      }
      function bailoutOffscreenComponent(current2, workInProgress2) {
        return current2 !== null && current2.tag === 22 || workInProgress2.stateNode !== null || (workInProgress2.stateNode = {
          _visibility: 1,
          _pendingMarkers: null,
          _retryCache: null,
          _transitions: null
        }), workInProgress2.sibling;
      }
      function deferHiddenOffscreenComponent(current2, workInProgress2, nextBaseLanes, renderLanes2, remainingChildLanes) {
        var JSCompiler_inline_result = peekCacheFromPool();
        return JSCompiler_inline_result = JSCompiler_inline_result === null ? null : { parent: CacheContext._currentValue, pool: JSCompiler_inline_result }, workInProgress2.memoizedState = {
          baseLanes: nextBaseLanes,
          cachePool: JSCompiler_inline_result
        }, current2 !== null && pushTransition(workInProgress2, null), reuseHiddenContextOnStack(), pushOffscreenSuspenseHandler(workInProgress2), current2 !== null && propagateParentContextChanges(current2, workInProgress2, renderLanes2, !0), workInProgress2.childLanes = remainingChildLanes, null;
      }
      function mountActivityChildren(workInProgress2, nextProps) {
        return nextProps = mountWorkInProgressOffscreenFiber(
          { mode: nextProps.mode, children: nextProps.children },
          workInProgress2.mode
        ), nextProps.ref = workInProgress2.ref, workInProgress2.child = nextProps, nextProps.return = workInProgress2, nextProps;
      }
      function retryActivityComponentWithoutHydrating(current2, workInProgress2, renderLanes2) {
        return reconcileChildFibers(workInProgress2, current2.child, null, renderLanes2), current2 = mountActivityChildren(workInProgress2, workInProgress2.pendingProps), current2.flags |= 2, popSuspenseHandler(workInProgress2), workInProgress2.memoizedState = null, current2;
      }
      function updateActivityComponent(current2, workInProgress2, renderLanes2) {
        var nextProps = workInProgress2.pendingProps, didSuspend = (workInProgress2.flags & 128) !== 0;
        if (workInProgress2.flags &= -129, current2 === null) {
          if (isHydrating) {
            if (nextProps.mode === "hidden")
              return current2 = mountActivityChildren(workInProgress2, nextProps), workInProgress2.lanes = 536870912, current2.memoizedState = { baseLanes: 0, cachePool: null }, bailoutOffscreenComponent(null, current2);
            if (pushDehydratedActivitySuspenseHandler(workInProgress2), (current2 = nextHydratableInstance) ? (current2 = canHydrateHydrationBoundary(
              current2,
              rootOrSingletonContext
            ), current2 = current2 !== null && current2.data === "&" ? current2 : null, current2 !== null && (workInProgress2.memoizedState = {
              dehydrated: current2,
              treeContext: treeContextProvider !== null ? { id: treeContextId, overflow: treeContextOverflow } : null,
              retryLane: 536870912,
              hydrationErrors: null
            }, renderLanes2 = createFiberFromDehydratedFragment(current2), renderLanes2.return = workInProgress2, workInProgress2.child = renderLanes2, hydrationParentFiber = workInProgress2, nextHydratableInstance = null)) : current2 = null, current2 === null) throw throwOnHydrationMismatch(workInProgress2);
            return workInProgress2.lanes = 536870912, null;
          }
          return mountActivityChildren(workInProgress2, nextProps);
        }
        var prevState = current2.memoizedState;
        if (prevState !== null) {
          var dehydrated = prevState.dehydrated;
          if (pushDehydratedActivitySuspenseHandler(workInProgress2), didSuspend)
            if (workInProgress2.flags & 256)
              workInProgress2.flags &= -257, workInProgress2 = retryActivityComponentWithoutHydrating(
                current2,
                workInProgress2,
                renderLanes2
              );
            else if (workInProgress2.memoizedState !== null)
              workInProgress2.child = current2.child, workInProgress2.flags |= 128, workInProgress2 = null;
            else throw Error(formatProdErrorMessage(558));
          else if (didReceiveUpdate || propagateParentContextChanges(current2, workInProgress2, renderLanes2, !1), didSuspend = (renderLanes2 & current2.childLanes) !== 0, didReceiveUpdate || didSuspend) {
            if (currentTreeHiddenStackCursor.current === null) {
              if (nextProps = workInProgressRoot, nextProps !== null && (dehydrated = getBumpedLaneForHydration(nextProps, renderLanes2), dehydrated !== 0 && dehydrated !== prevState.retryLane))
                throw prevState.retryLane = dehydrated, enqueueConcurrentRenderForLane(current2, dehydrated), scheduleUpdateOnFiber(nextProps, current2, dehydrated), SelectiveHydrationException;
              renderDidSuspendDelayIfPossible();
            }
            workInProgress2 = retryActivityComponentWithoutHydrating(
              current2,
              workInProgress2,
              renderLanes2
            );
          } else
            current2 = prevState.treeContext, nextHydratableInstance = getNextHydratable(dehydrated.nextSibling), hydrationParentFiber = workInProgress2, isHydrating = !0, hydrationErrors = null, rootOrSingletonContext = !1, current2 !== null && restoreSuspendedTreeContext(workInProgress2, current2), workInProgress2 = mountActivityChildren(workInProgress2, nextProps), workInProgress2.flags |= 134221824;
          return workInProgress2;
        }
        return current2 = createWorkInProgress(current2.child, {
          mode: nextProps.mode,
          children: nextProps.children
        }), current2.ref = workInProgress2.ref, workInProgress2.child = current2, current2.return = workInProgress2, current2;
      }
      function markRef(current2, workInProgress2) {
        var ref = workInProgress2.ref;
        if (ref === null)
          current2 !== null && current2.ref !== null && (workInProgress2.flags |= 4194816);
        else {
          if (typeof ref != "function" && typeof ref != "object")
            throw Error(formatProdErrorMessage(284));
          (current2 === null || current2.ref !== ref) && (workInProgress2.flags |= 4194816);
        }
      }
      function updateFunctionComponent(current2, workInProgress2, Component, nextProps, renderLanes2) {
        return prepareToReadContext(workInProgress2), Component = renderWithHooks(
          current2,
          workInProgress2,
          Component,
          nextProps,
          void 0,
          renderLanes2
        ), nextProps = checkDidRenderIdHook(), current2 !== null && !didReceiveUpdate ? (bailoutHooks(current2, workInProgress2, renderLanes2), bailoutOnAlreadyFinishedWork(current2, workInProgress2, renderLanes2)) : (isHydrating && nextProps && pushMaterializedTreeId(workInProgress2), workInProgress2.flags |= 1, reconcileChildren(current2, workInProgress2, Component, renderLanes2), workInProgress2.child);
      }
      function replayFunctionComponent(current2, workInProgress2, nextProps, Component, secondArg, renderLanes2) {
        return prepareToReadContext(workInProgress2), workInProgress2.updateQueue = null, nextProps = renderWithHooksAgain(
          workInProgress2,
          Component,
          nextProps,
          secondArg
        ), finishRenderingHooks(current2), Component = checkDidRenderIdHook(), current2 !== null && !didReceiveUpdate ? (bailoutHooks(current2, workInProgress2, renderLanes2), bailoutOnAlreadyFinishedWork(current2, workInProgress2, renderLanes2)) : (isHydrating && Component && pushMaterializedTreeId(workInProgress2), workInProgress2.flags |= 1, reconcileChildren(current2, workInProgress2, nextProps, renderLanes2), workInProgress2.child);
      }
      function updateClassComponent(current2, workInProgress2, Component, nextProps, renderLanes2) {
        if (prepareToReadContext(workInProgress2), workInProgress2.stateNode === null) {
          var context = emptyContextObject, contextType = Component.contextType;
          typeof contextType == "object" && contextType !== null && (context = readContext(contextType)), context = new Component(nextProps, context), workInProgress2.memoizedState = context.state !== null && context.state !== void 0 ? context.state : null, context.updater = classComponentUpdater, workInProgress2.stateNode = context, context._reactInternals = workInProgress2, context = workInProgress2.stateNode, context.props = nextProps, context.state = workInProgress2.memoizedState, context.refs = {}, initializeUpdateQueue(workInProgress2), contextType = Component.contextType, context.context = typeof contextType == "object" && contextType !== null ? readContext(contextType) : emptyContextObject, context.state = workInProgress2.memoizedState, contextType = Component.getDerivedStateFromProps, typeof contextType == "function" && (applyDerivedStateFromProps(
            workInProgress2,
            Component,
            contextType,
            nextProps
          ), context.state = workInProgress2.memoizedState), typeof Component.getDerivedStateFromProps == "function" || typeof context.getSnapshotBeforeUpdate == "function" || typeof context.UNSAFE_componentWillMount != "function" && typeof context.componentWillMount != "function" || (contextType = context.state, typeof context.componentWillMount == "function" && context.componentWillMount(), typeof context.UNSAFE_componentWillMount == "function" && context.UNSAFE_componentWillMount(), contextType !== context.state && classComponentUpdater.enqueueReplaceState(context, context.state, null), processUpdateQueue(workInProgress2, nextProps, context, renderLanes2), suspendIfUpdateReadFromEntangledAsyncAction(), context.state = workInProgress2.memoizedState), typeof context.componentDidMount == "function" && (workInProgress2.flags |= 4194308), nextProps = !0;
        } else if (current2 === null) {
          context = workInProgress2.stateNode;
          var unresolvedOldProps = workInProgress2.memoizedProps, oldProps = resolveClassComponentProps(Component, unresolvedOldProps);
          context.props = oldProps;
          var oldContext = context.context, contextType$jscomp$0 = Component.contextType;
          contextType = emptyContextObject, typeof contextType$jscomp$0 == "object" && contextType$jscomp$0 !== null && (contextType = readContext(contextType$jscomp$0));
          var getDerivedStateFromProps = Component.getDerivedStateFromProps;
          contextType$jscomp$0 = typeof getDerivedStateFromProps == "function" || typeof context.getSnapshotBeforeUpdate == "function", unresolvedOldProps = workInProgress2.pendingProps !== unresolvedOldProps, contextType$jscomp$0 || typeof context.UNSAFE_componentWillReceiveProps != "function" && typeof context.componentWillReceiveProps != "function" || (unresolvedOldProps || oldContext !== contextType) && callComponentWillReceiveProps(
            workInProgress2,
            context,
            nextProps,
            contextType
          ), hasForceUpdate = !1;
          var oldState = workInProgress2.memoizedState;
          context.state = oldState, processUpdateQueue(workInProgress2, nextProps, context, renderLanes2), suspendIfUpdateReadFromEntangledAsyncAction(), oldContext = workInProgress2.memoizedState, unresolvedOldProps || oldState !== oldContext || hasForceUpdate ? (typeof getDerivedStateFromProps == "function" && (applyDerivedStateFromProps(
            workInProgress2,
            Component,
            getDerivedStateFromProps,
            nextProps
          ), oldContext = workInProgress2.memoizedState), (oldProps = hasForceUpdate || checkShouldComponentUpdate(
            workInProgress2,
            Component,
            oldProps,
            nextProps,
            oldState,
            oldContext,
            contextType
          )) ? (contextType$jscomp$0 || typeof context.UNSAFE_componentWillMount != "function" && typeof context.componentWillMount != "function" || (typeof context.componentWillMount == "function" && context.componentWillMount(), typeof context.UNSAFE_componentWillMount == "function" && context.UNSAFE_componentWillMount()), typeof context.componentDidMount == "function" && (workInProgress2.flags |= 4194308)) : (typeof context.componentDidMount == "function" && (workInProgress2.flags |= 4194308), workInProgress2.memoizedProps = nextProps, workInProgress2.memoizedState = oldContext), context.props = nextProps, context.state = oldContext, context.context = contextType, nextProps = oldProps) : (typeof context.componentDidMount == "function" && (workInProgress2.flags |= 4194308), nextProps = !1);
        } else {
          context = workInProgress2.stateNode, cloneUpdateQueue(current2, workInProgress2), contextType = workInProgress2.memoizedProps, contextType$jscomp$0 = resolveClassComponentProps(Component, contextType), context.props = contextType$jscomp$0, getDerivedStateFromProps = workInProgress2.pendingProps, oldState = context.context, oldContext = Component.contextType, oldProps = emptyContextObject, typeof oldContext == "object" && oldContext !== null && (oldProps = readContext(oldContext)), unresolvedOldProps = Component.getDerivedStateFromProps, (oldContext = typeof unresolvedOldProps == "function" || typeof context.getSnapshotBeforeUpdate == "function") || typeof context.UNSAFE_componentWillReceiveProps != "function" && typeof context.componentWillReceiveProps != "function" || (contextType !== getDerivedStateFromProps || oldState !== oldProps) && callComponentWillReceiveProps(
            workInProgress2,
            context,
            nextProps,
            oldProps
          ), hasForceUpdate = !1, oldState = workInProgress2.memoizedState, context.state = oldState, processUpdateQueue(workInProgress2, nextProps, context, renderLanes2), suspendIfUpdateReadFromEntangledAsyncAction();
          var newState = workInProgress2.memoizedState;
          contextType !== getDerivedStateFromProps || oldState !== newState || hasForceUpdate || current2 !== null && current2.dependencies !== null && checkIfContextChanged(current2.dependencies) ? (typeof unresolvedOldProps == "function" && (applyDerivedStateFromProps(
            workInProgress2,
            Component,
            unresolvedOldProps,
            nextProps
          ), newState = workInProgress2.memoizedState), (contextType$jscomp$0 = hasForceUpdate || checkShouldComponentUpdate(
            workInProgress2,
            Component,
            contextType$jscomp$0,
            nextProps,
            oldState,
            newState,
            oldProps
          ) || current2 !== null && current2.dependencies !== null && checkIfContextChanged(current2.dependencies)) ? (oldContext || typeof context.UNSAFE_componentWillUpdate != "function" && typeof context.componentWillUpdate != "function" || (typeof context.componentWillUpdate == "function" && context.componentWillUpdate(nextProps, newState, oldProps), typeof context.UNSAFE_componentWillUpdate == "function" && context.UNSAFE_componentWillUpdate(
            nextProps,
            newState,
            oldProps
          )), typeof context.componentDidUpdate == "function" && (workInProgress2.flags |= 4), typeof context.getSnapshotBeforeUpdate == "function" && (workInProgress2.flags |= 1024)) : (typeof context.componentDidUpdate != "function" || contextType === current2.memoizedProps && oldState === current2.memoizedState || (workInProgress2.flags |= 4), typeof context.getSnapshotBeforeUpdate != "function" || contextType === current2.memoizedProps && oldState === current2.memoizedState || (workInProgress2.flags |= 1024), workInProgress2.memoizedProps = nextProps, workInProgress2.memoizedState = newState), context.props = nextProps, context.state = newState, context.context = oldProps, nextProps = contextType$jscomp$0) : (typeof context.componentDidUpdate != "function" || contextType === current2.memoizedProps && oldState === current2.memoizedState || (workInProgress2.flags |= 4), typeof context.getSnapshotBeforeUpdate != "function" || contextType === current2.memoizedProps && oldState === current2.memoizedState || (workInProgress2.flags |= 1024), nextProps = !1);
        }
        return context = nextProps, markRef(current2, workInProgress2), nextProps = (workInProgress2.flags & 128) !== 0, context || nextProps ? (context = workInProgress2.stateNode, Component = nextProps && typeof Component.getDerivedStateFromError != "function" ? null : context.render(), workInProgress2.flags |= 1, current2 !== null && nextProps ? (workInProgress2.child = reconcileChildFibers(
          workInProgress2,
          current2.child,
          null,
          renderLanes2
        ), workInProgress2.child = reconcileChildFibers(
          workInProgress2,
          null,
          Component,
          renderLanes2
        )) : reconcileChildren(current2, workInProgress2, Component, renderLanes2), workInProgress2.memoizedState = context.state, current2 = workInProgress2.child) : current2 = bailoutOnAlreadyFinishedWork(
          current2,
          workInProgress2,
          renderLanes2
        ), current2;
      }
      function mountHostRootWithoutHydrating(current2, workInProgress2, nextChildren, renderLanes2) {
        return resetHydrationState(), workInProgress2.flags |= 256, reconcileChildren(current2, workInProgress2, nextChildren, renderLanes2), workInProgress2.child;
      }
      var SUSPENDED_MARKER = {
        dehydrated: null,
        treeContext: null,
        retryLane: 0,
        hydrationErrors: null
      };
      function mountSuspenseOffscreenState(renderLanes2) {
        return { baseLanes: renderLanes2, cachePool: getSuspendedCache() };
      }
      function getRemainingWorkInPrimaryTree(current2, primaryTreeDidDefer, renderLanes2) {
        return current2 = current2 !== null ? current2.childLanes & ~renderLanes2 : 0, primaryTreeDidDefer && (current2 |= workInProgressDeferredLane), current2;
      }
      function updateSuspenseComponent(current2, workInProgress2, renderLanes2) {
        var nextProps = workInProgress2.pendingProps, showFallback = !1, didSuspend = (workInProgress2.flags & 128) !== 0, JSCompiler_temp;
        if ((JSCompiler_temp = didSuspend) || (JSCompiler_temp = current2 !== null && current2.memoizedState === null ? !1 : (suspenseStackCursor.current & 2) !== 0), JSCompiler_temp && (showFallback = !0, workInProgress2.flags &= -129), JSCompiler_temp = (workInProgress2.flags & 32) !== 0, workInProgress2.flags &= -33, current2 === null) {
          if (isHydrating) {
            if (showFallback ? pushPrimaryTreeSuspenseHandler(workInProgress2) : reuseSuspenseHandlerOnStack(), (current2 = nextHydratableInstance) ? (current2 = canHydrateHydrationBoundary(
              current2,
              rootOrSingletonContext
            ), current2 = current2 !== null && current2.data !== "&" ? current2 : null, current2 !== null && (workInProgress2.memoizedState = {
              dehydrated: current2,
              treeContext: treeContextProvider !== null ? { id: treeContextId, overflow: treeContextOverflow } : null,
              retryLane: 536870912,
              hydrationErrors: null
            }, renderLanes2 = createFiberFromDehydratedFragment(current2), renderLanes2.return = workInProgress2, workInProgress2.child = renderLanes2, hydrationParentFiber = workInProgress2, nextHydratableInstance = null)) : current2 = null, current2 === null) throw throwOnHydrationMismatch(workInProgress2);
            return isSuspenseInstanceFallback(current2) ? workInProgress2.lanes = 32 : workInProgress2.lanes = 536870912, null;
          }
          return didSuspend = nextProps.children, nextProps = nextProps.fallback, showFallback ? (reuseSuspenseHandlerOnStack(), showFallback = workInProgress2.mode, didSuspend = mountWorkInProgressOffscreenFiber(
            { mode: "hidden", children: didSuspend },
            showFallback
          ), nextProps = createFiberFromFragment(
            nextProps,
            showFallback,
            renderLanes2,
            null
          ), didSuspend.return = workInProgress2, nextProps.return = workInProgress2, didSuspend.sibling = nextProps, workInProgress2.child = didSuspend, nextProps = workInProgress2.child, nextProps.memoizedState = mountSuspenseOffscreenState(renderLanes2), nextProps.childLanes = getRemainingWorkInPrimaryTree(
            current2,
            JSCompiler_temp,
            renderLanes2
          ), workInProgress2.memoizedState = SUSPENDED_MARKER, bailoutOffscreenComponent(null, nextProps)) : (pushPrimaryTreeSuspenseHandler(workInProgress2), mountSuspensePrimaryChildren(workInProgress2, didSuspend));
        }
        var prevState = current2.memoizedState;
        if (prevState !== null) {
          var dehydrated$96 = prevState.dehydrated;
          if (dehydrated$96 !== null)
            return updateDehydratedSuspenseComponent(
              current2,
              workInProgress2,
              didSuspend,
              JSCompiler_temp,
              nextProps,
              dehydrated$96,
              prevState,
              renderLanes2
            );
        }
        return showFallback ? (reuseSuspenseHandlerOnStack(), showFallback = nextProps.fallback, didSuspend = workInProgress2.mode, prevState = current2.child, dehydrated$96 = prevState.sibling, nextProps = createWorkInProgress(prevState, {
          mode: "hidden",
          children: nextProps.children
        }), nextProps.subtreeFlags = prevState.subtreeFlags & 1206910976, dehydrated$96 !== null ? showFallback = createWorkInProgress(dehydrated$96, showFallback) : (showFallback = createFiberFromFragment(
          showFallback,
          didSuspend,
          renderLanes2,
          null
        ), showFallback.flags |= 2), showFallback.return = workInProgress2, nextProps.return = workInProgress2, nextProps.sibling = showFallback, workInProgress2.child = nextProps, bailoutOffscreenComponent(null, nextProps), nextProps = workInProgress2.child, showFallback = current2.child.memoizedState, showFallback === null ? showFallback = mountSuspenseOffscreenState(renderLanes2) : (didSuspend = showFallback.cachePool, didSuspend !== null ? (prevState = CacheContext._currentValue, didSuspend = didSuspend.parent !== prevState ? { parent: prevState, pool: prevState } : didSuspend) : didSuspend = getSuspendedCache(), showFallback = {
          baseLanes: showFallback.baseLanes | renderLanes2,
          cachePool: didSuspend
        }), nextProps.memoizedState = showFallback, nextProps.childLanes = getRemainingWorkInPrimaryTree(
          current2,
          JSCompiler_temp,
          renderLanes2
        ), workInProgress2.memoizedState = SUSPENDED_MARKER, bailoutOffscreenComponent(current2.child, nextProps)) : (pushPrimaryTreeSuspenseHandler(workInProgress2), renderLanes2 = current2.child, current2 = renderLanes2.sibling, renderLanes2 = createWorkInProgress(renderLanes2, {
          mode: "visible",
          children: nextProps.children
        }), renderLanes2.return = workInProgress2, renderLanes2.sibling = null, current2 !== null && (JSCompiler_temp = workInProgress2.deletions, JSCompiler_temp === null ? (workInProgress2.deletions = [current2], workInProgress2.flags |= 16) : JSCompiler_temp.push(current2)), workInProgress2.child = renderLanes2, workInProgress2.memoizedState = null, renderLanes2);
      }
      function mountSuspensePrimaryChildren(workInProgress2, primaryChildren) {
        return primaryChildren = mountWorkInProgressOffscreenFiber(
          { mode: "visible", children: primaryChildren },
          workInProgress2.mode
        ), primaryChildren.return = workInProgress2, workInProgress2.child = primaryChildren;
      }
      function mountWorkInProgressOffscreenFiber(offscreenProps, mode) {
        return offscreenProps = createFiberImplClass(22, offscreenProps, null, mode), offscreenProps.lanes = 0, offscreenProps;
      }
      function retrySuspenseComponentWithoutHydrating(current2, workInProgress2, renderLanes2) {
        return reconcileChildFibers(workInProgress2, current2.child, null, renderLanes2), current2 = mountSuspensePrimaryChildren(
          workInProgress2,
          workInProgress2.pendingProps.children
        ), current2.flags |= 2, workInProgress2.memoizedState = null, current2;
      }
      function updateDehydratedSuspenseComponent(current2, workInProgress2, didSuspend, didPrimaryChildrenDefer, nextProps, suspenseInstance, suspenseState, renderLanes2) {
        if (didSuspend)
          return workInProgress2.flags & 256 ? (pushPrimaryTreeSuspenseHandler(workInProgress2), workInProgress2.flags &= -257, retrySuspenseComponentWithoutHydrating(
            current2,
            workInProgress2,
            renderLanes2
          )) : workInProgress2.memoizedState !== null ? (reuseSuspenseHandlerOnStack(), workInProgress2.child = current2.child, workInProgress2.flags |= 128, null) : (reuseSuspenseHandlerOnStack(), suspenseInstance = nextProps.fallback, suspenseState = workInProgress2.mode, nextProps = mountWorkInProgressOffscreenFiber(
            { mode: "visible", children: nextProps.children },
            suspenseState
          ), suspenseInstance = createFiberFromFragment(
            suspenseInstance,
            suspenseState,
            renderLanes2,
            null
          ), suspenseInstance.flags |= 2, nextProps.return = workInProgress2, suspenseInstance.return = workInProgress2, nextProps.sibling = suspenseInstance, workInProgress2.child = nextProps, reconcileChildFibers(workInProgress2, current2.child, null, renderLanes2), nextProps = workInProgress2.child, nextProps.memoizedState = mountSuspenseOffscreenState(renderLanes2), nextProps.childLanes = getRemainingWorkInPrimaryTree(
            current2,
            didPrimaryChildrenDefer,
            renderLanes2
          ), workInProgress2.memoizedState = SUSPENDED_MARKER, bailoutOffscreenComponent(null, nextProps));
        if (pushPrimaryTreeSuspenseHandler(workInProgress2), isSuspenseInstanceFallback(suspenseInstance)) {
          if (didPrimaryChildrenDefer = suspenseInstance.nextSibling && suspenseInstance.nextSibling.dataset, didPrimaryChildrenDefer) var digest = didPrimaryChildrenDefer.dgst;
          return didPrimaryChildrenDefer = digest, didPrimaryChildrenDefer !== "" && (nextProps = Error(formatProdErrorMessage(419)), nextProps.stack = "", nextProps.digest = didPrimaryChildrenDefer, queueHydrationError({ value: nextProps, source: null, stack: null })), retrySuspenseComponentWithoutHydrating(
            current2,
            workInProgress2,
            renderLanes2
          );
        }
        if (didReceiveUpdate || propagateParentContextChanges(current2, workInProgress2, renderLanes2, !1), didPrimaryChildrenDefer = (renderLanes2 & current2.childLanes) !== 0, didReceiveUpdate || didPrimaryChildrenDefer) {
          if (currentTreeHiddenStackCursor.current !== null)
            return retrySuspenseComponentWithoutHydrating(
              current2,
              workInProgress2,
              renderLanes2
            );
          if (didPrimaryChildrenDefer = workInProgressRoot, didPrimaryChildrenDefer !== null && (nextProps = getBumpedLaneForHydration(
            didPrimaryChildrenDefer,
            renderLanes2
          ), nextProps !== 0 && nextProps !== suspenseState.retryLane))
            throw suspenseState.retryLane = nextProps, enqueueConcurrentRenderForLane(current2, nextProps), scheduleUpdateOnFiber(didPrimaryChildrenDefer, current2, nextProps), SelectiveHydrationException;
          return isSuspenseInstancePending(suspenseInstance) || renderDidSuspendDelayIfPossible(), retrySuspenseComponentWithoutHydrating(
            current2,
            workInProgress2,
            renderLanes2
          );
        }
        return isSuspenseInstancePending(suspenseInstance) ? (workInProgress2.flags |= 192, workInProgress2.child = current2.child, null) : (current2 = suspenseState.treeContext, nextHydratableInstance = getNextHydratable(suspenseInstance.nextSibling), hydrationParentFiber = workInProgress2, isHydrating = !0, hydrationErrors = null, rootOrSingletonContext = !1, current2 !== null && restoreSuspendedTreeContext(workInProgress2, current2), workInProgress2 = mountSuspensePrimaryChildren(
          workInProgress2,
          nextProps.children
        ), workInProgress2.flags |= 134221824, workInProgress2);
      }
      function scheduleSuspenseWorkOnFiber(fiber, renderLanes2, propagationRoot) {
        fiber.lanes |= renderLanes2;
        var alternate = fiber.alternate;
        alternate !== null && (alternate.lanes |= renderLanes2), scheduleContextWorkOnParentPath(fiber.return, renderLanes2, propagationRoot);
      }
      function findLastContentRow(firstChild) {
        for (var lastContentRow = null; firstChild !== null; ) {
          var currentRow = firstChild.alternate;
          currentRow !== null && findFirstSuspended(currentRow) === null && (lastContentRow = firstChild), firstChild = firstChild.sibling;
        }
        return lastContentRow;
      }
      function initSuspenseListRenderState(workInProgress2, isBackwards, tail, lastContentRow, tailMode, treeForkCount2) {
        var renderState = workInProgress2.memoizedState;
        renderState === null ? workInProgress2.memoizedState = {
          isBackwards,
          rendering: null,
          renderingStartTime: 0,
          last: lastContentRow,
          tail,
          tailMode,
          treeForkCount: treeForkCount2
        } : (renderState.isBackwards = isBackwards, renderState.rendering = null, renderState.renderingStartTime = 0, renderState.last = lastContentRow, renderState.tail = tail, renderState.tailMode = tailMode, renderState.treeForkCount = treeForkCount2);
      }
      function reverseChildren(fiber) {
        var row = fiber.child;
        for (fiber.child = null; row !== null; ) {
          var nextRow = row.sibling;
          row.sibling = fiber.child, fiber.child = row, row = nextRow;
        }
      }
      function updateSuspenseListComponent(current2, workInProgress2, renderLanes2) {
        var nextProps = workInProgress2.pendingProps, revealOrder = nextProps.revealOrder, tailMode = nextProps.tail;
        nextProps = nextProps.children;
        var suspenseContext = suspenseStackCursor.current;
        if (workInProgress2.flags & 128)
          return pushSuspenseListContext(workInProgress2, suspenseContext), null;
        var shouldForceFallback = (suspenseContext & 2) !== 0;
        if (shouldForceFallback ? (suspenseContext = suspenseContext & 1 | 2, workInProgress2.flags |= 128) : suspenseContext &= 1, pushSuspenseListContext(workInProgress2, suspenseContext), revealOrder === "backwards" && current2 !== null ? (reverseChildren(current2), reconcileChildren(current2, workInProgress2, nextProps, renderLanes2), reverseChildren(current2)) : reconcileChildren(current2, workInProgress2, nextProps, renderLanes2), nextProps = isHydrating ? treeForkCount : 0, !shouldForceFallback && current2 !== null && (current2.flags & 128) !== 0)
          a: for (current2 = workInProgress2.child; current2 !== null; ) {
            if (current2.tag === 13)
              current2.memoizedState !== null && scheduleSuspenseWorkOnFiber(current2, renderLanes2, workInProgress2);
            else if (current2.tag === 19)
              scheduleSuspenseWorkOnFiber(current2, renderLanes2, workInProgress2);
            else if (current2.child !== null) {
              current2.child.return = current2, current2 = current2.child;
              continue;
            }
            if (current2 === workInProgress2) break a;
            for (; current2.sibling === null; ) {
              if (current2.return === null || current2.return === workInProgress2)
                break a;
              current2 = current2.return;
            }
            current2.sibling.return = current2.return, current2 = current2.sibling;
          }
        switch (revealOrder) {
          case "backwards":
            renderLanes2 = findLastContentRow(workInProgress2.child), renderLanes2 === null ? (revealOrder = workInProgress2.child, workInProgress2.child = null) : (revealOrder = renderLanes2.sibling, renderLanes2.sibling = null, reverseChildren(workInProgress2)), initSuspenseListRenderState(
              workInProgress2,
              !0,
              revealOrder,
              null,
              tailMode,
              nextProps
            );
            break;
          case "unstable_legacy-backwards":
            for (renderLanes2 = null, revealOrder = workInProgress2.child, workInProgress2.child = null; revealOrder !== null; ) {
              if (current2 = revealOrder.alternate, current2 !== null && findFirstSuspended(current2) === null) {
                workInProgress2.child = revealOrder;
                break;
              }
              current2 = revealOrder.sibling, revealOrder.sibling = renderLanes2, renderLanes2 = revealOrder, revealOrder = current2;
            }
            initSuspenseListRenderState(
              workInProgress2,
              !0,
              renderLanes2,
              null,
              tailMode,
              nextProps
            );
            break;
          case "together":
            initSuspenseListRenderState(
              workInProgress2,
              !1,
              null,
              null,
              void 0,
              nextProps
            );
            break;
          case "independent":
            workInProgress2.memoizedState = null;
            break;
          default:
            renderLanes2 = findLastContentRow(workInProgress2.child), renderLanes2 === null ? (revealOrder = workInProgress2.child, workInProgress2.child = null) : (revealOrder = renderLanes2.sibling, renderLanes2.sibling = null), initSuspenseListRenderState(
              workInProgress2,
              !1,
              revealOrder,
              renderLanes2,
              tailMode,
              nextProps
            );
        }
        return workInProgress2.child;
      }
      function updateContextProvider(current2, workInProgress2, renderLanes2) {
        var newProps = workInProgress2.pendingProps;
        return pushProvider(workInProgress2, workInProgress2.type, newProps.value), reconcileChildren(current2, workInProgress2, newProps.children, renderLanes2), workInProgress2.child;
      }
      function bailoutOnAlreadyFinishedWork(current2, workInProgress2, renderLanes2) {
        if (current2 !== null && (workInProgress2.dependencies = current2.dependencies), workInProgressRootSkippedLanes |= workInProgress2.lanes, (renderLanes2 & workInProgress2.childLanes) === 0)
          if (current2 !== null) {
            if (propagateParentContextChanges(
              current2,
              workInProgress2,
              renderLanes2,
              !1
            ), (renderLanes2 & workInProgress2.childLanes) === 0)
              return null;
          } else return null;
        if (current2 !== null && workInProgress2.child !== current2.child)
          throw Error(formatProdErrorMessage(153));
        if (workInProgress2.child !== null) {
          for (current2 = workInProgress2.child, renderLanes2 = createWorkInProgress(current2, current2.pendingProps), workInProgress2.child = renderLanes2, renderLanes2.return = workInProgress2; current2.sibling !== null; )
            current2 = current2.sibling, renderLanes2 = renderLanes2.sibling = createWorkInProgress(current2, current2.pendingProps), renderLanes2.return = workInProgress2;
          renderLanes2.sibling = null;
        }
        return workInProgress2.child;
      }
      function checkScheduledUpdateOrContext(current2, renderLanes2) {
        return (current2.lanes & renderLanes2) !== 0 ? !0 : (current2 = current2.dependencies, !!(current2 !== null && checkIfContextChanged(current2)));
      }
      function attemptEarlyBailoutIfNoScheduledUpdate(current2, workInProgress2, renderLanes2) {
        switch (workInProgress2.tag) {
          case 3:
            pushHostContainer(workInProgress2, workInProgress2.stateNode.containerInfo), pushProvider(workInProgress2, CacheContext, current2.memoizedState.cache), resetHydrationState();
            break;
          case 27:
          case 5:
            pushHostContext(workInProgress2);
            break;
          case 4:
            pushHostContainer(workInProgress2, workInProgress2.stateNode.containerInfo);
            break;
          case 10:
            pushProvider(
              workInProgress2,
              workInProgress2.type,
              workInProgress2.memoizedProps.value
            );
            break;
          case 31:
            if (workInProgress2.memoizedState !== null)
              return workInProgress2.flags |= 128, pushDehydratedActivitySuspenseHandler(workInProgress2), null;
            break;
          case 13:
            var state$108 = workInProgress2.memoizedState;
            if (state$108 !== null) {
              if (state$108.dehydrated !== null)
                return pushPrimaryTreeSuspenseHandler(workInProgress2), workInProgress2.flags |= 128, null;
              state$108 = propagateParentContextChanges(
                current2,
                workInProgress2,
                renderLanes2,
                !1
              );
              var primaryChildLanes = workInProgress2.child.childLanes;
              return state$108 || (renderLanes2 & primaryChildLanes) !== 0 ? updateSuspenseComponent(current2, workInProgress2, renderLanes2) : (pushPrimaryTreeSuspenseHandler(workInProgress2), current2 = bailoutOnAlreadyFinishedWork(
                current2,
                workInProgress2,
                renderLanes2
              ), current2 !== null ? current2.sibling : null);
            }
            pushPrimaryTreeSuspenseHandler(workInProgress2);
            break;
          case 19:
            if (workInProgress2.flags & 128)
              return updateSuspenseListComponent(
                current2,
                workInProgress2,
                renderLanes2
              );
            if (primaryChildLanes = (current2.flags & 128) !== 0, state$108 = (renderLanes2 & workInProgress2.childLanes) !== 0, state$108 || (propagateParentContextChanges(
              current2,
              workInProgress2,
              renderLanes2,
              !1
            ), state$108 = (renderLanes2 & workInProgress2.childLanes) !== 0), primaryChildLanes) {
              if (state$108)
                return updateSuspenseListComponent(
                  current2,
                  workInProgress2,
                  renderLanes2
                );
              workInProgress2.flags |= 128;
            }
            if (primaryChildLanes = workInProgress2.memoizedState, primaryChildLanes !== null && (primaryChildLanes.rendering = null, primaryChildLanes.tail = null, primaryChildLanes.lastEffect = null), pushSuspenseListContext(workInProgress2, suspenseStackCursor.current), state$108) break;
            return null;
          case 22:
            return workInProgress2.lanes = 0, updateOffscreenComponent(
              current2,
              workInProgress2,
              renderLanes2,
              workInProgress2.pendingProps
            );
          case 24:
            pushProvider(workInProgress2, CacheContext, current2.memoizedState.cache);
        }
        return bailoutOnAlreadyFinishedWork(current2, workInProgress2, renderLanes2);
      }
      function beginWork(current2, workInProgress2, renderLanes2) {
        if (current2 !== null)
          if (current2.memoizedProps !== workInProgress2.pendingProps)
            didReceiveUpdate = !0;
          else {
            if (!checkScheduledUpdateOrContext(current2, renderLanes2) && (workInProgress2.flags & 128) === 0)
              return didReceiveUpdate = !1, attemptEarlyBailoutIfNoScheduledUpdate(
                current2,
                workInProgress2,
                renderLanes2
              );
            didReceiveUpdate = (current2.flags & 131072) !== 0;
          }
        else
          didReceiveUpdate = !1, isHydrating && (workInProgress2.flags & 1048576) !== 0 && pushTreeId(workInProgress2, treeForkCount, workInProgress2.index);
        switch (workInProgress2.lanes = 0, workInProgress2.tag) {
          case 16:
            a: {
              var props = workInProgress2.pendingProps;
              if (current2 = resolveLazy(workInProgress2.elementType), workInProgress2.type = current2, typeof current2 == "function")
                shouldConstruct(current2) ? (props = resolveClassComponentProps(current2, props), workInProgress2.tag = 1, workInProgress2 = updateClassComponent(
                  null,
                  workInProgress2,
                  current2,
                  props,
                  renderLanes2
                )) : (workInProgress2.tag = 0, workInProgress2 = updateFunctionComponent(
                  null,
                  workInProgress2,
                  current2,
                  props,
                  renderLanes2
                ));
              else {
                if (current2 != null) {
                  var $$typeof = current2.$$typeof;
                  if ($$typeof === REACT_FORWARD_REF_TYPE) {
                    workInProgress2.tag = 11, workInProgress2 = updateForwardRef(
                      null,
                      workInProgress2,
                      current2,
                      props,
                      renderLanes2
                    );
                    break a;
                  } else if ($$typeof === REACT_MEMO_TYPE) {
                    workInProgress2.tag = 14, workInProgress2 = updateMemoComponent(
                      null,
                      workInProgress2,
                      current2,
                      props,
                      renderLanes2
                    );
                    break a;
                  } else if ($$typeof === REACT_CONTEXT_TYPE) {
                    workInProgress2.tag = 10, workInProgress2.type = current2, workInProgress2 = updateContextProvider(
                      null,
                      workInProgress2,
                      renderLanes2
                    );
                    break a;
                  }
                }
                throw workInProgress2 = getComponentNameFromType(current2) || current2, Error(formatProdErrorMessage(306, workInProgress2, ""));
              }
            }
            return workInProgress2;
          case 0:
            return updateFunctionComponent(
              current2,
              workInProgress2,
              workInProgress2.type,
              workInProgress2.pendingProps,
              renderLanes2
            );
          case 1:
            return props = workInProgress2.type, $$typeof = resolveClassComponentProps(
              props,
              workInProgress2.pendingProps
            ), updateClassComponent(
              current2,
              workInProgress2,
              props,
              $$typeof,
              renderLanes2
            );
          case 3:
            a: {
              if (pushHostContainer(
                workInProgress2,
                workInProgress2.stateNode.containerInfo
              ), current2 === null) throw Error(formatProdErrorMessage(387));
              props = workInProgress2.pendingProps;
              var prevState = workInProgress2.memoizedState;
              $$typeof = prevState.element, cloneUpdateQueue(current2, workInProgress2), processUpdateQueue(workInProgress2, props, null, renderLanes2);
              var nextState = workInProgress2.memoizedState;
              if (props = nextState.cache, pushProvider(workInProgress2, CacheContext, props), props !== prevState.cache && propagateContextChanges(
                workInProgress2,
                [CacheContext],
                renderLanes2,
                !0
              ), suspendIfUpdateReadFromEntangledAsyncAction(), props = nextState.element, prevState.isDehydrated)
                if (prevState = {
                  element: props,
                  isDehydrated: !1,
                  cache: nextState.cache
                }, workInProgress2.updateQueue.baseState = prevState, workInProgress2.memoizedState = prevState, workInProgress2.flags & 256) {
                  workInProgress2 = mountHostRootWithoutHydrating(
                    current2,
                    workInProgress2,
                    props,
                    renderLanes2
                  );
                  break a;
                } else if (props !== $$typeof) {
                  $$typeof = createCapturedValueAtFiber(
                    Error(formatProdErrorMessage(424)),
                    workInProgress2
                  ), queueHydrationError($$typeof), workInProgress2 = mountHostRootWithoutHydrating(
                    current2,
                    workInProgress2,
                    props,
                    renderLanes2
                  );
                  break a;
                } else
                  for (current2 = workInProgress2.stateNode.containerInfo, current2.nodeType === 9 ? current2 = current2.body : current2 = current2.nodeName === "HTML" ? current2.ownerDocument.body : current2, nextHydratableInstance = getNextHydratable(current2.firstChild), hydrationParentFiber = workInProgress2, isHydrating = !0, hydrationErrors = null, rootOrSingletonContext = !0, renderLanes2 = mountChildFibers(
                    workInProgress2,
                    null,
                    props,
                    renderLanes2
                  ), workInProgress2.child = renderLanes2; renderLanes2; )
                    renderLanes2.flags = renderLanes2.flags & -3 | 134221824, renderLanes2 = renderLanes2.sibling;
              else {
                if (resetHydrationState(), props === $$typeof) {
                  workInProgress2 = bailoutOnAlreadyFinishedWork(
                    current2,
                    workInProgress2,
                    renderLanes2
                  );
                  break a;
                }
                reconcileChildren(current2, workInProgress2, props, renderLanes2);
              }
              workInProgress2 = workInProgress2.child;
            }
            return workInProgress2;
          case 26:
            return markRef(current2, workInProgress2), current2 === null ? (renderLanes2 = getResource(
              workInProgress2.type,
              null,
              workInProgress2.pendingProps,
              null
            )) ? workInProgress2.memoizedState = renderLanes2 : isHydrating || (workInProgress2.stateNode = createHoistableInstance(
              workInProgress2.type,
              workInProgress2.pendingProps,
              rootInstanceStackCursor.current,
              workInProgress2
            )) : workInProgress2.memoizedState = getResource(
              workInProgress2.type,
              current2.memoizedProps,
              workInProgress2.pendingProps,
              current2.memoizedState
            ), null;
          case 27:
            return pushHostContext(workInProgress2), current2 === null && isHydrating && (props = workInProgress2.stateNode = resolveSingletonInstance(
              workInProgress2.type,
              workInProgress2.pendingProps,
              rootInstanceStackCursor.current
            ), hydrationParentFiber = workInProgress2, rootOrSingletonContext = !0, $$typeof = nextHydratableInstance, isSingletonScope(workInProgress2.type) ? (previousHydratableOnEnteringScopedSingleton = $$typeof, nextHydratableInstance = getNextHydratable(props.firstChild)) : nextHydratableInstance = $$typeof), reconcileChildren(
              current2,
              workInProgress2,
              workInProgress2.pendingProps.children,
              renderLanes2
            ), markRef(current2, workInProgress2), current2 === null && (workInProgress2.flags |= 4194304), workInProgress2.child;
          case 5:
            return current2 === null && isHydrating && (($$typeof = props = nextHydratableInstance) && (props = canHydrateInstance(
              props,
              workInProgress2.type,
              workInProgress2.pendingProps,
              rootOrSingletonContext
            ), props !== null ? (workInProgress2.stateNode = props, hydrationParentFiber = workInProgress2, nextHydratableInstance = getNextHydratable(props.firstChild), rootOrSingletonContext = !1, $$typeof = !0) : $$typeof = !1), $$typeof || throwOnHydrationMismatch(workInProgress2)), pushHostContext(workInProgress2), $$typeof = workInProgress2.type, prevState = workInProgress2.pendingProps, nextState = current2 !== null ? current2.memoizedProps : null, props = prevState.children, shouldSetTextContent($$typeof, prevState) ? props = null : nextState !== null && shouldSetTextContent($$typeof, nextState) && (workInProgress2.flags |= 32), workInProgress2.memoizedState !== null && ($$typeof = renderWithHooks(
              current2,
              workInProgress2,
              TransitionAwareHostComponent,
              null,
              null,
              renderLanes2
            ), HostTransitionContext._currentValue = $$typeof), markRef(current2, workInProgress2), reconcileChildren(current2, workInProgress2, props, renderLanes2), workInProgress2.child;
          case 6:
            return current2 === null && isHydrating && ((current2 = renderLanes2 = nextHydratableInstance) && (renderLanes2 = canHydrateTextInstance(
              renderLanes2,
              workInProgress2.pendingProps,
              rootOrSingletonContext
            ), renderLanes2 !== null ? (workInProgress2.stateNode = renderLanes2, hydrationParentFiber = workInProgress2, nextHydratableInstance = null, current2 = !0) : current2 = !1), current2 || throwOnHydrationMismatch(workInProgress2)), null;
          case 13:
            return updateSuspenseComponent(current2, workInProgress2, renderLanes2);
          case 4:
            return pushHostContainer(
              workInProgress2,
              workInProgress2.stateNode.containerInfo
            ), props = workInProgress2.pendingProps, current2 === null ? workInProgress2.child = reconcileChildFibers(
              workInProgress2,
              null,
              props,
              renderLanes2
            ) : reconcileChildren(current2, workInProgress2, props, renderLanes2), workInProgress2.child;
          case 11:
            return updateForwardRef(
              current2,
              workInProgress2,
              workInProgress2.type,
              workInProgress2.pendingProps,
              renderLanes2
            );
          case 7:
            return props = workInProgress2.pendingProps, markRef(current2, workInProgress2), reconcileChildren(current2, workInProgress2, props, renderLanes2), workInProgress2.child;
          case 8:
            return reconcileChildren(
              current2,
              workInProgress2,
              workInProgress2.pendingProps.children,
              renderLanes2
            ), workInProgress2.child;
          case 12:
            return reconcileChildren(
              current2,
              workInProgress2,
              workInProgress2.pendingProps.children,
              renderLanes2
            ), workInProgress2.child;
          case 10:
            return updateContextProvider(current2, workInProgress2, renderLanes2);
          case 9:
            return $$typeof = workInProgress2.type._context, props = workInProgress2.pendingProps.children, prepareToReadContext(workInProgress2), $$typeof = readContext($$typeof), props = props($$typeof), workInProgress2.flags |= 1, reconcileChildren(current2, workInProgress2, props, renderLanes2), workInProgress2.child;
          case 14:
            return updateMemoComponent(
              current2,
              workInProgress2,
              workInProgress2.type,
              workInProgress2.pendingProps,
              renderLanes2
            );
          case 15:
            return updateSimpleMemoComponent(
              current2,
              workInProgress2,
              workInProgress2.type,
              workInProgress2.pendingProps,
              renderLanes2
            );
          case 19:
            return updateSuspenseListComponent(current2, workInProgress2, renderLanes2);
          case 31:
            return updateActivityComponent(current2, workInProgress2, renderLanes2);
          case 22:
            return updateOffscreenComponent(
              current2,
              workInProgress2,
              renderLanes2,
              workInProgress2.pendingProps
            );
          case 24:
            return prepareToReadContext(workInProgress2), props = readContext(CacheContext), current2 === null ? ($$typeof = peekCacheFromPool(), $$typeof === null && ($$typeof = workInProgressRoot, prevState = createCache(), $$typeof.pooledCache = prevState, prevState.refCount++, prevState !== null && ($$typeof.pooledCacheLanes |= renderLanes2), $$typeof = prevState), workInProgress2.memoizedState = { parent: props, cache: $$typeof }, initializeUpdateQueue(workInProgress2), pushProvider(workInProgress2, CacheContext, $$typeof)) : ((current2.lanes & renderLanes2) !== 0 && (cloneUpdateQueue(current2, workInProgress2), processUpdateQueue(workInProgress2, null, null, renderLanes2), suspendIfUpdateReadFromEntangledAsyncAction()), $$typeof = current2.memoizedState, prevState = workInProgress2.memoizedState, $$typeof.parent !== props ? ($$typeof = { parent: props, cache: props }, workInProgress2.memoizedState = $$typeof, workInProgress2.lanes === 0 && (workInProgress2.memoizedState = workInProgress2.updateQueue.baseState = $$typeof), pushProvider(workInProgress2, CacheContext, props)) : (props = prevState.cache, pushProvider(workInProgress2, CacheContext, props), props !== $$typeof.cache && propagateContextChanges(
              workInProgress2,
              [CacheContext],
              renderLanes2,
              !0
            ))), reconcileChildren(
              current2,
              workInProgress2,
              workInProgress2.pendingProps.children,
              renderLanes2
            ), workInProgress2.child;
          case 30:
            return workInProgress2.stateNode === null && (workInProgress2.stateNode = {
              autoName: null,
              paired: null,
              clones: null,
              ref: null
            }), props = workInProgress2.pendingProps, props.name != null && props.name !== "auto" ? workInProgress2.flags |= current2 === null ? 18882560 : 18874368 : isHydrating && pushMaterializedTreeId(workInProgress2), current2 !== null && current2.memoizedProps.name !== props.name ? workInProgress2.flags |= 4194816 : markRef(current2, workInProgress2), reconcileChildren(current2, workInProgress2, props.children, renderLanes2), workInProgress2.child;
          case 29:
            throw workInProgress2.pendingProps;
        }
        throw Error(formatProdErrorMessage(156, workInProgress2.tag));
      }
      function markUpdate(workInProgress2) {
        workInProgress2.flags |= 4;
      }
      function preloadInstanceAndSuspendIfNeeded(workInProgress2, type, oldProps, newProps, renderLanes2) {
        var JSCompiler_temp;
        if ((JSCompiler_temp = (workInProgress2.mode & 32) !== 0) && (JSCompiler_temp = oldProps === null ? maySuspendCommit(type, newProps) : maySuspendCommit(type, newProps) && (newProps.src !== oldProps.src || newProps.srcSet !== oldProps.srcSet)), JSCompiler_temp) {
          if (workInProgress2.flags |= 16777216, (renderLanes2 & 335544128) === renderLanes2)
            if (workInProgress2.stateNode.complete) workInProgress2.flags |= 8192;
            else if (shouldRemainOnPreviousScreen()) workInProgress2.flags |= 8192;
            else
              throw suspendedThenable = noopSuspenseyCommitThenable, SuspenseyCommitException;
        } else workInProgress2.flags &= -16777217;
      }
      function preloadResourceAndSuspendIfNeeded(workInProgress2, resource) {
        if (resource.type !== "stylesheet" || (resource.state.loading & 4) !== 0)
          workInProgress2.flags &= -16777217;
        else if (workInProgress2.flags |= 16777216, !preloadResource(resource))
          if (shouldRemainOnPreviousScreen()) workInProgress2.flags |= 8192;
          else
            throw suspendedThenable = noopSuspenseyCommitThenable, SuspenseyCommitException;
      }
      function scheduleRetryEffect(workInProgress2, retryQueue) {
        retryQueue !== null && (workInProgress2.flags |= 4), workInProgress2.flags & 16384 && (retryQueue = workInProgress2.tag !== 22 ? claimNextRetryLane() : 536870912, workInProgress2.lanes |= retryQueue, workInProgressSuspendedRetryLanes |= retryQueue);
      }
      function cutOffTailIfNeeded(renderState, hasRenderedATailFallback) {
        if (!isHydrating)
          switch (renderState.tailMode) {
            case "visible":
              break;
            case "collapsed":
              for (var tailNode = renderState.tail, lastTailNode = null; tailNode !== null; )
                tailNode.alternate !== null && (lastTailNode = tailNode), tailNode = tailNode.sibling;
              lastTailNode === null ? hasRenderedATailFallback || renderState.tail === null ? renderState.tail = null : renderState.tail.sibling = null : lastTailNode.sibling = null;
              break;
            default:
              for (hasRenderedATailFallback = renderState.tail, tailNode = null; hasRenderedATailFallback !== null; )
                hasRenderedATailFallback.alternate !== null && (tailNode = hasRenderedATailFallback), hasRenderedATailFallback = hasRenderedATailFallback.sibling;
              tailNode === null ? renderState.tail = null : tailNode.sibling = null;
          }
      }
      function bubbleProperties(completedWork) {
        var didBailout = completedWork.alternate !== null && completedWork.alternate.child === completedWork.child, newChildLanes = 0, subtreeFlags = 0;
        if (didBailout)
          for (var child$113 = completedWork.child; child$113 !== null; )
            newChildLanes |= child$113.lanes | child$113.childLanes, subtreeFlags |= child$113.subtreeFlags & 1206910976, subtreeFlags |= child$113.flags & 1206910976, child$113.return = completedWork, child$113 = child$113.sibling;
        else
          for (child$113 = completedWork.child; child$113 !== null; )
            newChildLanes |= child$113.lanes | child$113.childLanes, subtreeFlags |= child$113.subtreeFlags, subtreeFlags |= child$113.flags, child$113.return = completedWork, child$113 = child$113.sibling;
        return completedWork.subtreeFlags |= subtreeFlags, completedWork.childLanes = newChildLanes, didBailout;
      }
      function completeWork(current2, workInProgress2, renderLanes2) {
        var newProps = workInProgress2.pendingProps;
        switch (popTreeContext(workInProgress2), workInProgress2.tag) {
          case 16:
          case 15:
          case 0:
          case 11:
          case 7:
          case 8:
          case 12:
          case 9:
          case 14:
            return bubbleProperties(workInProgress2), null;
          case 1:
            return bubbleProperties(workInProgress2), null;
          case 3:
            return renderLanes2 = workInProgress2.stateNode, newProps = null, current2 !== null && (newProps = current2.memoizedState.cache), workInProgress2.memoizedState.cache !== newProps && (workInProgress2.flags |= 2048), popProvider(CacheContext), popHostContainer(), renderLanes2.pendingContext && (renderLanes2.context = renderLanes2.pendingContext, renderLanes2.pendingContext = null), (current2 === null || current2.child === null) && (popHydrationState(workInProgress2) ? markUpdate(workInProgress2) : current2 === null || current2.memoizedState.isDehydrated && (workInProgress2.flags & 256) === 0 || (workInProgress2.flags |= 1024, upgradeHydrationErrorsToRecoverable())), bubbleProperties(workInProgress2), null;
          case 26:
            var type = workInProgress2.type, nextResource = workInProgress2.memoizedState;
            return current2 === null ? (markUpdate(workInProgress2), nextResource !== null ? (bubbleProperties(workInProgress2), preloadResourceAndSuspendIfNeeded(workInProgress2, nextResource)) : (bubbleProperties(workInProgress2), preloadInstanceAndSuspendIfNeeded(
              workInProgress2,
              type,
              null,
              newProps,
              renderLanes2
            ))) : nextResource ? nextResource !== current2.memoizedState ? (markUpdate(workInProgress2), bubbleProperties(workInProgress2), preloadResourceAndSuspendIfNeeded(workInProgress2, nextResource)) : (bubbleProperties(workInProgress2), workInProgress2.flags &= -16777217) : (current2 = current2.memoizedProps, current2 !== newProps && markUpdate(workInProgress2), bubbleProperties(workInProgress2), preloadInstanceAndSuspendIfNeeded(
              workInProgress2,
              type,
              current2,
              newProps,
              renderLanes2
            )), null;
          case 27:
            if (popHostContext(workInProgress2), renderLanes2 = rootInstanceStackCursor.current, type = workInProgress2.type, current2 !== null && workInProgress2.stateNode != null)
              current2.memoizedProps !== newProps && markUpdate(workInProgress2);
            else {
              if (!newProps) {
                if (workInProgress2.stateNode === null)
                  throw Error(formatProdErrorMessage(166));
                return bubbleProperties(workInProgress2), workInProgress2.subtreeFlags &= -33554433, null;
              }
              current2 = contextStackCursor.current, popHydrationState(workInProgress2) ? prepareToHydrateHostInstance(workInProgress2, current2) : (current2 = resolveSingletonInstance(type, newProps, renderLanes2), workInProgress2.stateNode = current2, markUpdate(workInProgress2));
            }
            return bubbleProperties(workInProgress2), workInProgress2.subtreeFlags &= -33554433, null;
          case 5:
            if (popHostContext(workInProgress2), type = workInProgress2.type, current2 !== null && workInProgress2.stateNode != null)
              current2.memoizedProps !== newProps && markUpdate(workInProgress2);
            else {
              if (!newProps) {
                if (workInProgress2.stateNode === null)
                  throw Error(formatProdErrorMessage(166));
                return bubbleProperties(workInProgress2), workInProgress2.subtreeFlags &= -33554433, null;
              }
              if (nextResource = contextStackCursor.current, popHydrationState(workInProgress2))
                prepareToHydrateHostInstance(workInProgress2, nextResource);
              else {
                var ownerDocument = getOwnerDocumentFromRootContainer(
                  rootInstanceStackCursor.current
                );
                switch (nextResource) {
                  case 1:
                    nextResource = ownerDocument.createElementNS(
                      "http://www.w3.org/2000/svg",
                      type
                    );
                    break;
                  case 2:
                    nextResource = ownerDocument.createElementNS(
                      "http://www.w3.org/1998/Math/MathML",
                      type
                    );
                    break;
                  default:
                    switch (type) {
                      case "svg":
                        nextResource = ownerDocument.createElementNS(
                          "http://www.w3.org/2000/svg",
                          type
                        );
                        break;
                      case "math":
                        nextResource = ownerDocument.createElementNS(
                          "http://www.w3.org/1998/Math/MathML",
                          type
                        );
                        break;
                      case "script":
                        nextResource = ownerDocument.createElement("div"), nextResource.innerHTML = "<script><\/script>", nextResource = nextResource.removeChild(
                          nextResource.firstChild
                        );
                        break;
                      case "select":
                        nextResource = typeof newProps.is == "string" ? ownerDocument.createElement("select", {
                          is: newProps.is
                        }) : ownerDocument.createElement("select"), newProps.multiple ? nextResource.multiple = !0 : newProps.size && (nextResource.size = newProps.size);
                        break;
                      default:
                        nextResource = typeof newProps.is == "string" ? ownerDocument.createElement(type, { is: newProps.is }) : ownerDocument.createElement(type);
                    }
                }
                nextResource[internalInstanceKey] = workInProgress2, nextResource[internalPropsKey] = newProps;
                a: for (ownerDocument = workInProgress2.child; ownerDocument !== null; ) {
                  if (ownerDocument.tag === 5 || ownerDocument.tag === 6)
                    nextResource.appendChild(ownerDocument.stateNode);
                  else if (ownerDocument.tag !== 4 && ownerDocument.tag !== 27 && ownerDocument.child !== null) {
                    ownerDocument.child.return = ownerDocument, ownerDocument = ownerDocument.child;
                    continue;
                  }
                  if (ownerDocument === workInProgress2) break a;
                  for (; ownerDocument.sibling === null; ) {
                    if (ownerDocument.return === null || ownerDocument.return === workInProgress2)
                      break a;
                    ownerDocument = ownerDocument.return;
                  }
                  ownerDocument.sibling.return = ownerDocument.return, ownerDocument = ownerDocument.sibling;
                }
                workInProgress2.stateNode = nextResource;
                a: switch (setInitialProperties(nextResource, type, newProps), type) {
                  case "button":
                  case "input":
                  case "select":
                  case "textarea":
                    newProps = !!newProps.autoFocus;
                    break a;
                  case "img":
                    newProps = !0;
                    break a;
                  default:
                    newProps = !1;
                }
                newProps && markUpdate(workInProgress2);
              }
            }
            return bubbleProperties(workInProgress2), workInProgress2.subtreeFlags &= -33554433, preloadInstanceAndSuspendIfNeeded(
              workInProgress2,
              workInProgress2.type,
              current2 === null ? null : current2.memoizedProps,
              workInProgress2.pendingProps,
              renderLanes2
            ), null;
          case 6:
            if (current2 && workInProgress2.stateNode != null)
              current2.memoizedProps !== newProps && markUpdate(workInProgress2);
            else {
              if (typeof newProps != "string" && workInProgress2.stateNode === null)
                throw Error(formatProdErrorMessage(166));
              if (current2 = rootInstanceStackCursor.current, popHydrationState(workInProgress2)) {
                if (current2 = workInProgress2.stateNode, renderLanes2 = workInProgress2.memoizedProps, newProps = null, type = hydrationParentFiber, type !== null)
                  switch (type.tag) {
                    case 27:
                    case 5:
                      newProps = type.memoizedProps;
                  }
                current2[internalInstanceKey] = workInProgress2, current2 = !!(current2.nodeValue === renderLanes2 || newProps !== null && newProps.suppressHydrationWarning === !0 || checkForUnmatchedText(current2.nodeValue, renderLanes2)), current2 || throwOnHydrationMismatch(workInProgress2, !0);
              } else
                current2 = getOwnerDocumentFromRootContainer(current2).createTextNode(
                  newProps
                ), current2[internalInstanceKey] = workInProgress2, workInProgress2.stateNode = current2;
            }
            return bubbleProperties(workInProgress2), null;
          case 31:
            if (renderLanes2 = workInProgress2.memoizedState, current2 === null || current2.memoizedState !== null) {
              if (newProps = popHydrationState(workInProgress2), renderLanes2 !== null) {
                if (current2 === null) {
                  if (!newProps) throw Error(formatProdErrorMessage(318));
                  if (current2 = workInProgress2.memoizedState, current2 = current2 !== null ? current2.dehydrated : null, !current2) throw Error(formatProdErrorMessage(557));
                  current2[internalInstanceKey] = workInProgress2;
                } else
                  resetHydrationState(), (workInProgress2.flags & 128) === 0 && (workInProgress2.memoizedState = null), workInProgress2.flags |= 4;
                bubbleProperties(workInProgress2), current2 = !1;
              } else
                renderLanes2 = upgradeHydrationErrorsToRecoverable(), current2 !== null && current2.memoizedState !== null && (current2.memoizedState.hydrationErrors = renderLanes2), current2 = !0;
              if (!current2)
                return workInProgress2.flags & 256 ? (popSuspenseHandler(workInProgress2), workInProgress2) : (popSuspenseHandler(workInProgress2), null);
              if ((workInProgress2.flags & 128) !== 0)
                throw Error(formatProdErrorMessage(558));
            }
            return bubbleProperties(workInProgress2), null;
          case 13:
            if (newProps = workInProgress2.memoizedState, current2 === null || current2.memoizedState !== null && current2.memoizedState.dehydrated !== null) {
              if (type = popHydrationState(workInProgress2), newProps !== null && newProps.dehydrated !== null) {
                if (current2 === null) {
                  if (!type) throw Error(formatProdErrorMessage(318));
                  if (type = workInProgress2.memoizedState, type = type !== null ? type.dehydrated : null, !type) throw Error(formatProdErrorMessage(317));
                  type[internalInstanceKey] = workInProgress2;
                } else
                  resetHydrationState(), (workInProgress2.flags & 128) === 0 && (workInProgress2.memoizedState = null), workInProgress2.flags |= 4;
                bubbleProperties(workInProgress2), type = !1;
              } else
                type = upgradeHydrationErrorsToRecoverable(), current2 !== null && current2.memoizedState !== null && (current2.memoizedState.hydrationErrors = type), type = !0;
              if (!type)
                return workInProgress2.flags & 256 ? (popSuspenseHandler(workInProgress2), workInProgress2) : (popSuspenseHandler(workInProgress2), null);
            }
            return popSuspenseHandler(workInProgress2), (workInProgress2.flags & 128) !== 0 ? (workInProgress2.lanes = renderLanes2, workInProgress2) : (renderLanes2 = newProps !== null, current2 = current2 !== null && current2.memoizedState !== null, renderLanes2 && (newProps = workInProgress2.child, type = null, newProps.alternate !== null && newProps.alternate.memoizedState !== null && newProps.alternate.memoizedState.cachePool !== null && (type = newProps.alternate.memoizedState.cachePool.pool), nextResource = null, newProps.memoizedState !== null && newProps.memoizedState.cachePool !== null && (nextResource = newProps.memoizedState.cachePool.pool), nextResource !== type && (newProps.flags |= 2048)), renderLanes2 !== current2 && renderLanes2 && (workInProgress2.child.flags |= 8192), scheduleRetryEffect(workInProgress2, workInProgress2.updateQueue), bubbleProperties(workInProgress2), null);
          case 4:
            return popHostContainer(), current2 === null && listenToAllSupportedEvents(workInProgress2.stateNode.containerInfo), workInProgress2.flags |= 67108864, bubbleProperties(workInProgress2), null;
          case 10:
            return popProvider(workInProgress2.type), bubbleProperties(workInProgress2), null;
          case 19:
            if (popSuspenseListContext(workInProgress2), newProps = workInProgress2.memoizedState, newProps === null) return bubbleProperties(workInProgress2), null;
            if (type = (workInProgress2.flags & 128) !== 0, nextResource = newProps.rendering, nextResource === null)
              if (type) cutOffTailIfNeeded(newProps, !1);
              else {
                if (workInProgressRootExitStatus !== 0 || current2 !== null && (current2.flags & 128) !== 0)
                  for (current2 = workInProgress2.child; current2 !== null; ) {
                    if (nextResource = findFirstSuspended(current2), nextResource !== null) {
                      for (workInProgress2.flags |= 128, cutOffTailIfNeeded(newProps, !1), current2 = nextResource.updateQueue, workInProgress2.updateQueue = current2, scheduleRetryEffect(workInProgress2, current2), workInProgress2.subtreeFlags = 0, current2 = renderLanes2, renderLanes2 = workInProgress2.child; renderLanes2 !== null; )
                        resetWorkInProgress(renderLanes2, current2), renderLanes2 = renderLanes2.sibling;
                      return pushSuspenseListContext(
                        workInProgress2,
                        suspenseStackCursor.current & 1 | 2
                      ), isHydrating && pushTreeFork(workInProgress2, newProps.treeForkCount), workInProgress2.child;
                    }
                    current2 = current2.sibling;
                  }
                newProps.tail !== null && now() > workInProgressRootRenderTargetTime && (workInProgress2.flags |= 128, type = !0, cutOffTailIfNeeded(newProps, !1), workInProgress2.lanes = 4194304);
              }
            else {
              if (!type)
                if (current2 = findFirstSuspended(nextResource), current2 !== null) {
                  if (workInProgress2.flags |= 128, type = !0, current2 = current2.updateQueue, workInProgress2.updateQueue = current2, scheduleRetryEffect(workInProgress2, current2), cutOffTailIfNeeded(newProps, !0), newProps.tail === null && newProps.tailMode !== "collapsed" && newProps.tailMode !== "visible" && !nextResource.alternate && !isHydrating)
                    return bubbleProperties(workInProgress2), null;
                } else
                  2 * now() - newProps.renderingStartTime > workInProgressRootRenderTargetTime && renderLanes2 !== 536870912 && (workInProgress2.flags |= 128, type = !0, cutOffTailIfNeeded(newProps, !1), workInProgress2.lanes = 4194304);
              newProps.isBackwards ? (nextResource.sibling = workInProgress2.child, workInProgress2.child = nextResource) : (current2 = newProps.last, current2 !== null ? current2.sibling = nextResource : workInProgress2.child = nextResource, newProps.last = nextResource);
            }
            if (newProps.tail !== null) {
              current2 = newProps.tail;
              a: {
                for (renderLanes2 = current2; renderLanes2 !== null; ) {
                  if (renderLanes2.alternate !== null) {
                    renderLanes2 = !1;
                    break a;
                  }
                  renderLanes2 = renderLanes2.sibling;
                }
                renderLanes2 = !0;
              }
              return newProps.rendering = current2, newProps.tail = current2.sibling, newProps.renderingStartTime = now(), current2.sibling = null, nextResource = suspenseStackCursor.current, nextResource = type ? nextResource & 1 | 2 : nextResource & 1, newProps.tailMode === "visible" || newProps.tailMode === "collapsed" || !renderLanes2 || isHydrating ? pushSuspenseListContext(workInProgress2, nextResource) : (renderLanes2 = nextResource, push(suspenseHandlerStackCursor, workInProgress2), push(suspenseStackCursor, renderLanes2), shellBoundary === null && (shellBoundary = workInProgress2)), isHydrating && pushTreeFork(workInProgress2, newProps.treeForkCount), current2;
            }
            return bubbleProperties(workInProgress2), null;
          case 22:
          case 23:
            return popSuspenseHandler(workInProgress2), popHiddenContext(), newProps = workInProgress2.memoizedState !== null, current2 !== null ? current2.memoizedState !== null !== newProps && (workInProgress2.flags |= 8192) : newProps && (workInProgress2.flags |= 8192), newProps ? (renderLanes2 & 536870912) !== 0 && (workInProgress2.flags & 128) === 0 && (bubbleProperties(workInProgress2), workInProgress2.subtreeFlags & 6 && (workInProgress2.flags |= 8192)) : bubbleProperties(workInProgress2), renderLanes2 = workInProgress2.updateQueue, renderLanes2 !== null && scheduleRetryEffect(workInProgress2, renderLanes2.retryQueue), renderLanes2 = null, current2 !== null && current2.memoizedState !== null && current2.memoizedState.cachePool !== null && (renderLanes2 = current2.memoizedState.cachePool.pool), newProps = null, workInProgress2.memoizedState !== null && workInProgress2.memoizedState.cachePool !== null && (newProps = workInProgress2.memoizedState.cachePool.pool), newProps !== renderLanes2 && (workInProgress2.flags |= 2048), current2 !== null && pop(resumedCache), null;
          case 24:
            return renderLanes2 = null, current2 !== null && (renderLanes2 = current2.memoizedState.cache), workInProgress2.memoizedState.cache !== renderLanes2 && (workInProgress2.flags |= 2048), popProvider(CacheContext), bubbleProperties(workInProgress2), null;
          case 25:
            return null;
          case 30:
            return workInProgress2.flags |= 33554432, bubbleProperties(workInProgress2), null;
        }
        throw Error(formatProdErrorMessage(156, workInProgress2.tag));
      }
      function unwindWork(current2, workInProgress2) {
        switch (popTreeContext(workInProgress2), workInProgress2.tag) {
          case 1:
            return current2 = workInProgress2.flags, current2 & 65536 ? (workInProgress2.flags = current2 & -65537 | 128, workInProgress2) : null;
          case 3:
            return popProvider(CacheContext), popHostContainer(), current2 = workInProgress2.flags, (current2 & 65536) !== 0 && (current2 & 128) === 0 ? (workInProgress2.flags = current2 & -65537 | 128, workInProgress2) : null;
          case 26:
          case 27:
          case 5:
            return popHostContext(workInProgress2), null;
          case 31:
            if (workInProgress2.memoizedState !== null) {
              if (popSuspenseHandler(workInProgress2), workInProgress2.alternate === null)
                throw Error(formatProdErrorMessage(340));
              resetHydrationState();
            }
            return current2 = workInProgress2.flags, current2 & 65536 ? (workInProgress2.flags = current2 & -65537 | 128, workInProgress2) : null;
          case 13:
            if (popSuspenseHandler(workInProgress2), current2 = workInProgress2.memoizedState, current2 !== null && current2.dehydrated !== null) {
              if (workInProgress2.alternate === null)
                throw Error(formatProdErrorMessage(340));
              resetHydrationState();
            }
            return current2 = workInProgress2.flags, current2 & 65536 ? (workInProgress2.flags = current2 & -65537 | 128, workInProgress2) : null;
          case 19:
            return popSuspenseListContext(workInProgress2), current2 = workInProgress2.flags, current2 & 65536 ? (workInProgress2.flags = current2 & -65537 | 128, current2 = workInProgress2.memoizedState, current2 !== null && (current2.rendering = null, current2.tail = null), workInProgress2.flags |= 4, workInProgress2) : null;
          case 4:
            return popHostContainer(), null;
          case 10:
            return popProvider(workInProgress2.type), null;
          case 22:
          case 23:
            return popSuspenseHandler(workInProgress2), popHiddenContext(), current2 !== null && pop(resumedCache), current2 = workInProgress2.flags, current2 & 65536 ? (workInProgress2.flags = current2 & -65537 | 128, workInProgress2) : null;
          case 24:
            return popProvider(CacheContext), null;
          case 25:
            return null;
          default:
            return null;
        }
      }
      function unwindInterruptedWork(current2, interruptedWork) {
        switch (popTreeContext(interruptedWork), interruptedWork.tag) {
          case 3:
            popProvider(CacheContext), popHostContainer();
            break;
          case 26:
          case 27:
          case 5:
            popHostContext(interruptedWork);
            break;
          case 4:
            popHostContainer();
            break;
          case 31:
            interruptedWork.memoizedState !== null && popSuspenseHandler(interruptedWork);
            break;
          case 13:
            popSuspenseHandler(interruptedWork);
            break;
          case 19:
            popSuspenseListContext(interruptedWork);
            break;
          case 10:
            popProvider(interruptedWork.type);
            break;
          case 22:
          case 23:
            popSuspenseHandler(interruptedWork), popHiddenContext(), current2 !== null && pop(resumedCache);
            break;
          case 24:
            popProvider(CacheContext);
        }
      }
      function commitHookEffectListMount(flags, finishedWork) {
        try {
          var updateQueue = finishedWork.updateQueue, lastEffect = updateQueue !== null ? updateQueue.lastEffect : null;
          if (lastEffect !== null) {
            var firstEffect = lastEffect.next;
            updateQueue = firstEffect;
            do {
              if ((updateQueue.tag & flags) === flags) {
                lastEffect = void 0;
                var create = updateQueue.create, inst = updateQueue.inst;
                lastEffect = create(), inst.destroy = lastEffect;
              }
              updateQueue = updateQueue.next;
            } while (updateQueue !== firstEffect);
          }
        } catch (error) {
          captureCommitPhaseError(finishedWork, finishedWork.return, error);
        }
      }
      function commitHookEffectListUnmount(flags, finishedWork, nearestMountedAncestor$jscomp$0) {
        try {
          var updateQueue = finishedWork.updateQueue, lastEffect = updateQueue !== null ? updateQueue.lastEffect : null;
          if (lastEffect !== null) {
            var firstEffect = lastEffect.next;
            updateQueue = firstEffect;
            do {
              if ((updateQueue.tag & flags) === flags) {
                var inst = updateQueue.inst, destroy = inst.destroy;
                if (destroy !== void 0) {
                  inst.destroy = void 0, lastEffect = finishedWork;
                  var nearestMountedAncestor = nearestMountedAncestor$jscomp$0, destroy_ = destroy;
                  try {
                    destroy_();
                  } catch (error) {
                    captureCommitPhaseError(
                      lastEffect,
                      nearestMountedAncestor,
                      error
                    );
                  }
                }
              }
              updateQueue = updateQueue.next;
            } while (updateQueue !== firstEffect);
          }
        } catch (error) {
          captureCommitPhaseError(finishedWork, finishedWork.return, error);
        }
      }
      function commitClassCallbacks(finishedWork) {
        var updateQueue = finishedWork.updateQueue;
        if (updateQueue !== null) {
          var instance = finishedWork.stateNode;
          try {
            commitCallbacks(updateQueue, instance);
          } catch (error) {
            captureCommitPhaseError(finishedWork, finishedWork.return, error);
          }
        }
      }
      function safelyCallComponentWillUnmount(current2, nearestMountedAncestor, instance) {
        instance.props = resolveClassComponentProps(
          current2.type,
          current2.memoizedProps
        ), instance.state = current2.memoizedState;
        try {
          instance.componentWillUnmount();
        } catch (error) {
          captureCommitPhaseError(current2, nearestMountedAncestor, error);
        }
      }
      function safelyAttachRef(current2, nearestMountedAncestor) {
        try {
          var ref = current2.ref;
          if (ref !== null) {
            switch (current2.tag) {
              case 26:
              case 27:
              case 5:
                var instanceToUse = current2.stateNode;
                break;
              case 30:
                var instance = current2.stateNode, name = getViewTransitionName(current2.memoizedProps, instance);
                (instance.ref === null || instance.ref.name !== name) && (instance.ref = createViewTransitionInstance(name)), instanceToUse = instance.ref;
                break;
              case 7:
                if (current2.stateNode === null) {
                  var fragmentInstance = new FragmentInstance(current2);
                  traverseVisibleInstancesAndTextInstances(
                    current2.child,
                    !1,
                    addFragmentHandleToFiber,
                    fragmentInstance,
                    void 0,
                    void 0
                  ), current2.stateNode = fragmentInstance;
                }
                instanceToUse = current2.stateNode;
                break;
              default:
                instanceToUse = current2.stateNode;
            }
            typeof ref == "function" ? current2.refCleanup = ref(instanceToUse) : ref.current = instanceToUse;
          }
        } catch (error) {
          captureCommitPhaseError(current2, nearestMountedAncestor, error);
        }
      }
      function safelyDetachRef(current2, nearestMountedAncestor) {
        var ref = current2.ref, refCleanup = current2.refCleanup;
        if (ref !== null)
          if (typeof refCleanup == "function")
            try {
              refCleanup();
            } catch (error) {
              captureCommitPhaseError(current2, nearestMountedAncestor, error);
            } finally {
              current2.refCleanup = null, current2 = current2.alternate, current2 != null && (current2.refCleanup = null);
            }
          else if (typeof ref == "function")
            try {
              ref(null);
            } catch (error$148) {
              captureCommitPhaseError(current2, nearestMountedAncestor, error$148);
            }
          else ref.current = null;
      }
      function commitNewChildToFragmentInstances(fiber, parentFragmentInstances) {
        if ((fiber.tag === 5 || fiber.tag === 27 || fiber.tag === 6) && fiber.alternate === null && parentFragmentInstances !== null)
          for (var i = 0; i < parentFragmentInstances.length; i++)
            commitNewChildToFragmentInstance(
              fiber.stateNode,
              parentFragmentInstances[i]
            );
      }
      function commitFragmentInstanceInsertionEffects(fiber) {
        for (var parent = fiber.return; parent !== null && (isFragmentInstanceParent(parent) && commitNewChildToFragmentInstance(fiber.stateNode, parent.stateNode), !isFragmentInstanceHostBoundary(parent)); )
          parent = parent.return;
      }
      function commitFragmentInstanceDeletionEffects(fiber) {
        for (var parent = fiber.return; parent !== null && (isFragmentInstanceParent(parent) && deleteChildFromFragmentInstance(fiber.stateNode, parent.stateNode), !isFragmentInstanceHostBoundary(parent)); )
          parent = parent.return;
      }
      function isFragmentInstanceHostBoundary(fiber) {
        return fiber.tag === 5 || fiber.tag === 3 || fiber.tag === 27;
      }
      function isFragmentInstanceParent(fiber) {
        return fiber && fiber.tag === 7 && fiber.stateNode !== null;
      }
      function commitHostMount(finishedWork) {
        var type = finishedWork.type, props = finishedWork.memoizedProps, instance = finishedWork.stateNode;
        try {
          a: switch (type) {
            case "button":
            case "input":
            case "select":
            case "textarea":
              props.autoFocus && instance.focus();
              break a;
            case "img":
              props.src ? instance.src = props.src : props.srcSet && (instance.srcset = props.srcSet);
          }
        } catch (error) {
          captureCommitPhaseError(finishedWork, finishedWork.return, error);
        }
      }
      function commitHostUpdate(finishedWork, newProps, oldProps) {
        try {
          var domElement = finishedWork.stateNode;
          updateProperties(domElement, finishedWork.type, oldProps, newProps), domElement[internalPropsKey] = newProps;
        } catch (error) {
          captureCommitPhaseError(finishedWork, finishedWork.return, error);
        }
      }
      function isHostParent(fiber) {
        return fiber.tag === 5 || fiber.tag === 3 || fiber.tag === 26 || fiber.tag === 27 && isSingletonScope(fiber.type) || fiber.tag === 4;
      }
      function getHostSibling(fiber) {
        a: for (; ; ) {
          for (; fiber.sibling === null; ) {
            if (fiber.return === null || isHostParent(fiber.return)) return null;
            fiber = fiber.return;
          }
          for (fiber.sibling.return = fiber.return, fiber = fiber.sibling; fiber.tag !== 5 && fiber.tag !== 6 && fiber.tag !== 18; ) {
            if (fiber.tag === 27 && isSingletonScope(fiber.type) || fiber.flags & 2 || fiber.child === null || fiber.tag === 4) continue a;
            fiber.child.return = fiber, fiber = fiber.child;
          }
          if (!(fiber.flags & 2)) return fiber.stateNode;
        }
      }
      function insertOrAppendPlacementNodeIntoContainer(node, before, parent, parentFragmentInstances) {
        var tag = node.tag;
        if (tag === 5 || tag === 6)
          tag = node.stateNode, before ? (parent.nodeType === 9 ? parent.body : parent.nodeName === "HTML" ? parent.ownerDocument.body : parent).insertBefore(tag, before) : (before = parent.nodeType === 9 ? parent.body : parent.nodeName === "HTML" ? parent.ownerDocument.body : parent, before.appendChild(tag), parent = parent._reactRootContainer, parent != null || before.onclick !== null || (before.onclick = noop$1)), commitNewChildToFragmentInstances(node, parentFragmentInstances), viewTransitionMutationContext = !0;
        else if (tag !== 4 && (tag === 27 && (commitNewChildToFragmentInstances(node, parentFragmentInstances), parentFragmentInstances = null, isSingletonScope(node.type) && (parent = node.stateNode, before = null)), node = node.child, node !== null))
          for (insertOrAppendPlacementNodeIntoContainer(
            node,
            before,
            parent,
            parentFragmentInstances
          ), node = node.sibling; node !== null; )
            insertOrAppendPlacementNodeIntoContainer(
              node,
              before,
              parent,
              parentFragmentInstances
            ), node = node.sibling;
      }
      function insertOrAppendPlacementNode(node, before, parent, parentFragmentInstances) {
        var tag = node.tag;
        if (tag === 5 || tag === 6)
          tag = node.stateNode, before ? parent.insertBefore(tag, before) : parent.appendChild(tag), commitNewChildToFragmentInstances(node, parentFragmentInstances), viewTransitionMutationContext = !0;
        else if (tag !== 4 && (tag === 27 && (commitNewChildToFragmentInstances(node, parentFragmentInstances), parentFragmentInstances = null, isSingletonScope(node.type) && (parent = node.stateNode)), node = node.child, node !== null))
          for (insertOrAppendPlacementNode(
            node,
            before,
            parent,
            parentFragmentInstances
          ), node = node.sibling; node !== null; )
            insertOrAppendPlacementNode(
              node,
              before,
              parent,
              parentFragmentInstances
            ), node = node.sibling;
      }
      function commitHostSingletonAcquisition(finishedWork) {
        var singleton = finishedWork.stateNode, props = finishedWork.memoizedProps;
        try {
          for (var type = finishedWork.type, attributes = singleton.attributes; attributes.length; )
            singleton.removeAttributeNode(attributes[0]);
          setInitialProperties(singleton, type, props), singleton[internalInstanceKey] = finishedWork, singleton[internalPropsKey] = props;
        } catch (error) {
          captureCommitPhaseError(finishedWork, finishedWork.return, error);
        }
      }
      var shouldStartViewTransition = !1, appearingViewTransitions = null;
      function trackEnterViewTransitions(placement) {
        (placement.tag === 30 || (placement.subtreeFlags & 33554432) !== 0) && (shouldStartViewTransition = !0);
      }
      var viewTransitionCancelableChildren = null;
      function pushViewTransitionCancelableScope() {
        var prevChildren = viewTransitionCancelableChildren;
        return viewTransitionCancelableChildren = null, prevChildren;
      }
      var viewTransitionHostInstanceIdx = 0;
      function applyViewTransitionToHostInstances(fiber, name, className, collectMeasurements, stopAtNestedViewTransitions) {
        return viewTransitionHostInstanceIdx = 0, applyViewTransitionToHostInstancesRecursive(
          fiber.child,
          name,
          className,
          collectMeasurements,
          stopAtNestedViewTransitions
        );
      }
      function applyViewTransitionToHostInstancesRecursive(child, name, className, collectMeasurements, stopAtNestedViewTransitions) {
        for (var inViewport = !1; child !== null; ) {
          if (child.tag === 5) {
            var instance = child.stateNode;
            if (collectMeasurements !== null) {
              var measurement = measureInstance(instance);
              collectMeasurements.push(measurement), measurement.view && (inViewport = !0);
            } else
              inViewport || measureInstance(instance).view && (inViewport = !0);
            shouldStartViewTransition = !0, applyViewTransitionName(
              instance,
              viewTransitionHostInstanceIdx === 0 ? name : name + "_" + viewTransitionHostInstanceIdx,
              className
            ), viewTransitionHostInstanceIdx++;
          } else (child.tag !== 22 || child.memoizedState === null) && (child.tag === 30 && stopAtNestedViewTransitions || applyViewTransitionToHostInstancesRecursive(
            child.child,
            name,
            className,
            collectMeasurements,
            stopAtNestedViewTransitions
          ) && (inViewport = !0));
          child = child.sibling;
        }
        return inViewport;
      }
      function restoreViewTransitionOnHostInstances(child, stopAtNestedViewTransitions) {
        for (; child !== null; )
          child.tag === 5 ? restoreViewTransitionName(child.stateNode, child.memoizedProps) : (child.tag !== 22 || child.memoizedState === null) && (child.tag === 30 && stopAtNestedViewTransitions || restoreViewTransitionOnHostInstances(
            child.child,
            stopAtNestedViewTransitions
          )), child = child.sibling;
      }
      function commitAppearingPairViewTransitions(placement) {
        if ((placement.subtreeFlags & 18874368) !== 0)
          for (placement = placement.child; placement !== null; ) {
            if ((placement.tag !== 22 || placement.memoizedState === null) && (commitAppearingPairViewTransitions(placement), placement.tag === 30 && (placement.flags & 18874368) !== 0 && placement.stateNode.paired)) {
              var props = placement.memoizedProps;
              if (props.name == null || props.name === "auto")
                throw Error(formatProdErrorMessage(544));
              var name = props.name;
              props = getViewTransitionClassName(props.default, props.share), props !== "none" && (applyViewTransitionToHostInstances(
                placement,
                name,
                props,
                null,
                !1
              ) || restoreViewTransitionOnHostInstances(placement.child, !1));
            }
            placement = placement.sibling;
          }
      }
      function commitEnterViewTransitions(placement, gesture) {
        if (placement.tag === 30) {
          var state = placement.stateNode, props = placement.memoizedProps, name = getViewTransitionName(props, state), className = getViewTransitionClassName(
            props.default,
            state.paired ? props.share : props.enter
          );
          className !== "none" ? applyViewTransitionToHostInstances(placement, name, className, null, !1) ? (commitAppearingPairViewTransitions(placement), state.paired || gesture || scheduleViewTransitionEvent(placement, props.onEnter)) : restoreViewTransitionOnHostInstances(placement.child, !1) : commitAppearingPairViewTransitions(placement);
        } else if ((placement.subtreeFlags & 33554432) !== 0)
          for (placement = placement.child; placement !== null; )
            commitEnterViewTransitions(placement, gesture), placement = placement.sibling;
        else commitAppearingPairViewTransitions(placement);
      }
      function commitDeletedPairViewTransitions(deletion) {
        if (appearingViewTransitions !== null && appearingViewTransitions.size !== 0) {
          var pairs = appearingViewTransitions;
          if ((deletion.subtreeFlags & 18874368) !== 0)
            for (deletion = deletion.child; deletion !== null; ) {
              if (deletion.tag !== 22 || deletion.memoizedState === null) {
                if (deletion.tag === 30 && (deletion.flags & 18874368) !== 0) {
                  var props = deletion.memoizedProps, name = props.name;
                  if (name != null && name !== "auto") {
                    var pair = pairs.get(name);
                    if (pair !== void 0) {
                      var className = getViewTransitionClassName(
                        props.default,
                        props.share
                      );
                      if (className !== "none" && (applyViewTransitionToHostInstances(
                        deletion,
                        name,
                        className,
                        null,
                        !1
                      ) ? (className = deletion.stateNode, pair.paired = className, className.paired = pair, scheduleViewTransitionEvent(deletion, props.onShare)) : restoreViewTransitionOnHostInstances(deletion.child, !1)), pairs.delete(name), pairs.size === 0) break;
                    }
                  }
                }
                commitDeletedPairViewTransitions(deletion);
              }
              deletion = deletion.sibling;
            }
        }
      }
      function commitExitViewTransitions(deletion) {
        if (deletion.tag === 30) {
          var props = deletion.memoizedProps, name = getViewTransitionName(props, deletion.stateNode), pair = appearingViewTransitions !== null ? appearingViewTransitions.get(name) : void 0, className = getViewTransitionClassName(
            props.default,
            pair !== void 0 ? props.share : props.exit
          );
          className !== "none" && (applyViewTransitionToHostInstances(deletion, name, className, null, !1) ? pair !== void 0 ? (className = deletion.stateNode, pair.paired = className, className.paired = pair, appearingViewTransitions.delete(name), scheduleViewTransitionEvent(deletion, props.onShare)) : scheduleViewTransitionEvent(deletion, props.onExit) : restoreViewTransitionOnHostInstances(deletion.child, !1)), appearingViewTransitions !== null && commitDeletedPairViewTransitions(deletion);
        } else if ((deletion.subtreeFlags & 33554432) !== 0)
          for (deletion = deletion.child; deletion !== null; )
            commitExitViewTransitions(deletion), deletion = deletion.sibling;
        else
          appearingViewTransitions !== null && commitDeletedPairViewTransitions(deletion);
      }
      function commitNestedViewTransitions(changedParent) {
        for (changedParent = changedParent.child; changedParent !== null; ) {
          if (changedParent.tag === 30) {
            var props = changedParent.memoizedProps, name = getViewTransitionName(props, changedParent.stateNode);
            props = getViewTransitionClassName(props.default, props.update), changedParent.flags &= -5, props !== "none" && applyViewTransitionToHostInstances(
              changedParent,
              name,
              props,
              changedParent.memoizedState = [],
              !1
            );
          } else
            (changedParent.subtreeFlags & 33554432) !== 0 && commitNestedViewTransitions(changedParent);
          changedParent = changedParent.sibling;
        }
      }
      function restorePairedViewTransitions(parent) {
        if ((parent.subtreeFlags & 18874368) !== 0)
          for (parent = parent.child; parent !== null; ) {
            if (parent.tag !== 22 || parent.memoizedState === null) {
              if (parent.tag === 30 && (parent.flags & 18874368) !== 0) {
                var instance = parent.stateNode;
                instance.paired !== null && (instance.paired = null, restoreViewTransitionOnHostInstances(parent.child, !1));
              }
              restorePairedViewTransitions(parent);
            }
            parent = parent.sibling;
          }
      }
      function restoreEnterOrExitViewTransitions(fiber) {
        if (fiber.tag === 30)
          fiber.stateNode.paired = null, restoreViewTransitionOnHostInstances(fiber.child, !1), restorePairedViewTransitions(fiber);
        else if ((fiber.subtreeFlags & 33554432) !== 0)
          for (fiber = fiber.child; fiber !== null; )
            restoreEnterOrExitViewTransitions(fiber), fiber = fiber.sibling;
        else restorePairedViewTransitions(fiber);
      }
      function restoreNestedViewTransitions(changedParent) {
        for (changedParent = changedParent.child; changedParent !== null; )
          changedParent.tag === 30 ? restoreViewTransitionOnHostInstances(changedParent.child, !1) : (changedParent.subtreeFlags & 33554432) !== 0 && restoreNestedViewTransitions(changedParent), changedParent = changedParent.sibling;
      }
      function measureViewTransitionHostInstancesRecursive(parentViewTransition, child, newName, oldName, className, previousMeasurements, stopAtNestedViewTransitions) {
        for (var inViewport = !1; child !== null; ) {
          if (child.tag === 5) {
            var instance = child.stateNode;
            if (previousMeasurements !== null && viewTransitionHostInstanceIdx < previousMeasurements.length) {
              var previousMeasurement = previousMeasurements[viewTransitionHostInstanceIdx], nextMeasurement = measureInstance(instance);
              (previousMeasurement.view || nextMeasurement.view) && (inViewport = !0);
              var JSCompiler_temp;
              if (JSCompiler_temp = (parentViewTransition.flags & 4) === 0)
                if (nextMeasurement.clip) JSCompiler_temp = !0;
                else {
                  JSCompiler_temp = previousMeasurement.rect;
                  var newRect = nextMeasurement.rect;
                  JSCompiler_temp = JSCompiler_temp.y !== newRect.y || JSCompiler_temp.x !== newRect.x || JSCompiler_temp.height !== newRect.height || JSCompiler_temp.width !== newRect.width;
                }
              JSCompiler_temp && (parentViewTransition.flags |= 4), nextMeasurement.abs ? nextMeasurement = !previousMeasurement.abs : (previousMeasurement = previousMeasurement.rect, nextMeasurement = nextMeasurement.rect, nextMeasurement = previousMeasurement.height !== nextMeasurement.height || previousMeasurement.width !== nextMeasurement.width), nextMeasurement && (parentViewTransition.flags |= 32);
            } else parentViewTransition.flags |= 32;
            (parentViewTransition.flags & 4) !== 0 && applyViewTransitionName(
              instance,
              viewTransitionHostInstanceIdx === 0 ? newName : newName + "_" + viewTransitionHostInstanceIdx,
              className
            ), inViewport && (parentViewTransition.flags & 4) !== 0 || (viewTransitionCancelableChildren === null && (viewTransitionCancelableChildren = []), viewTransitionCancelableChildren.push(
              instance,
              viewTransitionHostInstanceIdx === 0 ? oldName : oldName + "_" + viewTransitionHostInstanceIdx,
              child.memoizedProps
            )), viewTransitionHostInstanceIdx++;
          } else (child.tag !== 22 || child.memoizedState === null) && (child.tag === 30 && stopAtNestedViewTransitions ? parentViewTransition.flags |= child.flags & 32 : measureViewTransitionHostInstancesRecursive(
            parentViewTransition,
            child.child,
            newName,
            oldName,
            className,
            previousMeasurements,
            stopAtNestedViewTransitions
          ) && (inViewport = !0));
          child = child.sibling;
        }
        return inViewport;
      }
      function measureNestedViewTransitions(changedParent, gesture) {
        for (changedParent = changedParent.child; changedParent !== null; ) {
          if (changedParent.tag === 30) {
            var props = changedParent.memoizedProps, state = changedParent.stateNode, name = getViewTransitionName(props, state), className = getViewTransitionClassName(props.default, props.update);
            if (gesture) {
              state = state.clones;
              var previousMeasurements = state === null ? null : state.map(measureClonedInstance);
            } else
              previousMeasurements = changedParent.memoizedState, changedParent.memoizedState = null;
            state = changedParent;
            var child = changedParent.child;
            viewTransitionHostInstanceIdx = 0, name = measureViewTransitionHostInstancesRecursive(
              state,
              child,
              name,
              name,
              className,
              previousMeasurements,
              !1
            ), (changedParent.flags & 4) !== 0 && name && (gesture || scheduleViewTransitionEvent(changedParent, props.onUpdate));
          } else
            (changedParent.subtreeFlags & 33554432) !== 0 && measureNestedViewTransitions(changedParent, gesture);
          changedParent = changedParent.sibling;
        }
      }
      var offscreenSubtreeIsHidden = !1, offscreenSubtreeWasHidden = !1, offscreenDirectParentIsHidden = !1, needsFormReset = !1, PossiblyWeakSet = typeof WeakSet == "function" ? WeakSet : Set, nextEffect = null, viewTransitionContextChanged = !1, inUpdateViewTransition = !1, rootViewTransitionAffected = !1, rootViewTransitionNameCanceled = !1;
      function commitBeforeMutationEffects(root2, firstChild, committedLanes) {
        if (root2 = root2.containerInfo, eventsEnabled = _enabled, root2 = getActiveElementDeep(root2), hasSelectionCapabilities(root2)) {
          if ("selectionStart" in root2)
            var JSCompiler_temp = {
              start: root2.selectionStart,
              end: root2.selectionEnd
            };
          else
            a: {
              JSCompiler_temp = (JSCompiler_temp = root2.ownerDocument) && JSCompiler_temp.defaultView || window;
              var selection = JSCompiler_temp.getSelection && JSCompiler_temp.getSelection();
              if (selection && selection.rangeCount !== 0) {
                JSCompiler_temp = selection.anchorNode;
                var anchorOffset = selection.anchorOffset, focusNode = selection.focusNode;
                selection = selection.focusOffset;
                try {
                  JSCompiler_temp.nodeType, focusNode.nodeType;
                } catch {
                  JSCompiler_temp = null;
                  break a;
                }
                var length = 0, start = -1, end = -1, indexWithinAnchor = 0, indexWithinFocus = 0, node = root2, parentNode = null;
                b: for (; ; ) {
                  for (var next; node !== JSCompiler_temp || anchorOffset !== 0 && node.nodeType !== 3 || (start = length + anchorOffset), node !== focusNode || selection !== 0 && node.nodeType !== 3 || (end = length + selection), node.nodeType === 3 && (length += node.nodeValue.length), (next = node.firstChild) !== null; )
                    parentNode = node, node = next;
                  for (; ; ) {
                    if (node === root2) break b;
                    if (parentNode === JSCompiler_temp && ++indexWithinAnchor === anchorOffset && (start = length), parentNode === focusNode && ++indexWithinFocus === selection && (end = length), (next = node.nextSibling) !== null) break;
                    node = parentNode, parentNode = node.parentNode;
                  }
                  node = next;
                }
                JSCompiler_temp = start === -1 || end === -1 ? null : { start, end };
              } else JSCompiler_temp = null;
            }
          JSCompiler_temp = JSCompiler_temp || { start: 0, end: 0 };
        } else JSCompiler_temp = null;
        for (selectionInformation = { focusedElem: root2, selectionRange: JSCompiler_temp }, _enabled = !1, committedLanes = (committedLanes & 335544064) === committedLanes, nextEffect = firstChild, firstChild = committedLanes ? 9270 : 1024; nextEffect !== null; ) {
          if (root2 = nextEffect, committedLanes && (JSCompiler_temp = root2.deletions, JSCompiler_temp !== null))
            for (anchorOffset = 0; anchorOffset < JSCompiler_temp.length; anchorOffset++)
              committedLanes && commitExitViewTransitions(JSCompiler_temp[anchorOffset]);
          if (root2.alternate === null && (root2.flags & 2) !== 0)
            committedLanes && trackEnterViewTransitions(root2), commitBeforeMutationEffects_complete(committedLanes);
          else {
            if (root2.tag === 22) {
              if (JSCompiler_temp = root2.alternate, root2.memoizedState !== null) {
                JSCompiler_temp !== null && JSCompiler_temp.memoizedState === null && committedLanes && commitExitViewTransitions(JSCompiler_temp), commitBeforeMutationEffects_complete(committedLanes);
                continue;
              } else if (JSCompiler_temp !== null && JSCompiler_temp.memoizedState !== null) {
                committedLanes && trackEnterViewTransitions(root2), commitBeforeMutationEffects_complete(committedLanes);
                continue;
              }
            }
            JSCompiler_temp = root2.child, (root2.subtreeFlags & firstChild) !== 0 && JSCompiler_temp !== null ? (JSCompiler_temp.return = root2, nextEffect = JSCompiler_temp) : (committedLanes && commitNestedViewTransitions(root2), commitBeforeMutationEffects_complete(committedLanes));
          }
        }
        appearingViewTransitions = null;
      }
      function commitBeforeMutationEffects_complete(isViewTransitionEligible$jscomp$0) {
        for (; nextEffect !== null; ) {
          var fiber = nextEffect, isViewTransitionEligible = isViewTransitionEligible$jscomp$0, current2 = fiber.alternate, flags = fiber.flags;
          switch (fiber.tag) {
            case 0:
            case 11:
            case 15:
              break;
            case 1:
              if ((flags & 1024) !== 0 && current2 !== null) {
                isViewTransitionEligible = void 0, flags = current2.memoizedProps, current2 = current2.memoizedState;
                var instance = fiber.stateNode;
                try {
                  var resolvedPrevProps = resolveClassComponentProps(
                    fiber.type,
                    flags
                  );
                  isViewTransitionEligible = instance.getSnapshotBeforeUpdate(
                    resolvedPrevProps,
                    current2
                  ), instance.__reactInternalSnapshotBeforeUpdate = isViewTransitionEligible;
                } catch (error) {
                  captureCommitPhaseError(fiber, fiber.return, error);
                }
              }
              break;
            case 3:
              if ((flags & 1024) !== 0) {
                if (current2 = fiber.stateNode.containerInfo, isViewTransitionEligible = current2.nodeType, isViewTransitionEligible === 9)
                  clearContainerSparingly(current2);
                else if (isViewTransitionEligible === 1)
                  switch (current2.nodeName) {
                    case "HEAD":
                    case "HTML":
                    case "BODY":
                      clearContainerSparingly(current2);
                      break;
                    default:
                      current2.textContent = "";
                  }
              }
              break;
            case 5:
            case 26:
            case 27:
            case 6:
            case 4:
            case 17:
              break;
            case 30:
              isViewTransitionEligible && current2 !== null && (isViewTransitionEligible = getViewTransitionName(
                current2.memoizedProps,
                current2.stateNode
              ), flags = fiber.memoizedProps, flags = getViewTransitionClassName(flags.default, flags.update), flags !== "none" && applyViewTransitionToHostInstances(
                current2,
                isViewTransitionEligible,
                flags,
                current2.memoizedState = [],
                !0
              ));
              break;
            default:
              if ((flags & 1024) !== 0) throw Error(formatProdErrorMessage(163));
          }
          if (current2 = fiber.sibling, current2 !== null) {
            current2.return = fiber.return, nextEffect = current2;
            break;
          }
          nextEffect = fiber.return;
        }
      }
      function commitLayoutEffectOnFiber(finishedRoot, current2, finishedWork) {
        var flags = finishedWork.flags;
        switch (finishedWork.tag) {
          case 0:
          case 11:
          case 15:
            recursivelyTraverseLayoutEffects(finishedRoot, finishedWork), flags & 4 && commitHookEffectListMount(5, finishedWork);
            break;
          case 1:
            if (recursivelyTraverseLayoutEffects(finishedRoot, finishedWork), flags & 4)
              if (finishedRoot = finishedWork.stateNode, current2 === null)
                try {
                  finishedRoot.componentDidMount();
                } catch (error) {
                  captureCommitPhaseError(finishedWork, finishedWork.return, error);
                }
              else {
                var prevProps = resolveClassComponentProps(
                  finishedWork.type,
                  current2.memoizedProps
                );
                current2 = current2.memoizedState;
                try {
                  finishedRoot.componentDidUpdate(
                    prevProps,
                    current2,
                    finishedRoot.__reactInternalSnapshotBeforeUpdate
                  );
                } catch (error$146) {
                  captureCommitPhaseError(
                    finishedWork,
                    finishedWork.return,
                    error$146
                  );
                }
              }
            flags & 64 && commitClassCallbacks(finishedWork), flags & 512 && safelyAttachRef(finishedWork, finishedWork.return);
            break;
          case 3:
            if (recursivelyTraverseLayoutEffects(finishedRoot, finishedWork), flags & 64 && (finishedRoot = finishedWork.updateQueue, finishedRoot !== null)) {
              if (current2 = null, finishedWork.child !== null)
                switch (finishedWork.child.tag) {
                  case 27:
                  case 5:
                    current2 = finishedWork.child.stateNode;
                    break;
                  case 1:
                    current2 = finishedWork.child.stateNode;
                }
              try {
                commitCallbacks(finishedRoot, current2);
              } catch (error) {
                captureCommitPhaseError(finishedWork, finishedWork.return, error);
              }
            }
            break;
          case 27:
            current2 === null && flags & 4 && commitHostSingletonAcquisition(finishedWork);
          case 26:
          case 5:
            recursivelyTraverseLayoutEffects(finishedRoot, finishedWork), current2 === null && flags & 4 && commitHostMount(finishedWork), flags & 512 && safelyAttachRef(finishedWork, finishedWork.return);
            break;
          case 12:
            recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
            break;
          case 31:
            recursivelyTraverseLayoutEffects(finishedRoot, finishedWork), flags & 4 && commitActivityHydrationCallbacks(finishedRoot, finishedWork);
            break;
          case 13:
            recursivelyTraverseLayoutEffects(finishedRoot, finishedWork), flags & 4 && commitSuspenseHydrationCallbacks(finishedRoot, finishedWork), flags & 64 && (finishedRoot = finishedWork.memoizedState, finishedRoot !== null && (finishedRoot = finishedRoot.dehydrated, finishedRoot !== null && (finishedWork = retryDehydratedSuspenseBoundary.bind(
              null,
              finishedWork
            ), registerSuspenseInstanceRetry(finishedRoot, finishedWork))));
            break;
          case 22:
            if (flags = finishedWork.memoizedState !== null || offscreenSubtreeIsHidden, !flags) {
              var newOffscreenSubtreeWasHidden = current2 !== null && current2.memoizedState !== null || offscreenSubtreeWasHidden;
              current2 = offscreenSubtreeIsHidden, prevProps = offscreenSubtreeWasHidden, offscreenSubtreeIsHidden = flags, (offscreenSubtreeWasHidden = newOffscreenSubtreeWasHidden) && !prevProps ? (flags = 2, (finishedWork.subtreeFlags & 8772) !== 0 && (flags |= 1), recursivelyTraverseReappearLayoutEffects(
                finishedRoot,
                finishedWork,
                flags
              )) : recursivelyTraverseLayoutEffects(finishedRoot, finishedWork), offscreenSubtreeIsHidden = current2, offscreenSubtreeWasHidden = prevProps;
            }
            break;
          case 30:
            recursivelyTraverseLayoutEffects(finishedRoot, finishedWork), flags & 512 && safelyAttachRef(finishedWork, finishedWork.return);
            break;
          case 7:
            flags & 512 && safelyAttachRef(finishedWork, finishedWork.return);
          default:
            recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
        }
      }
      function hideOrUnhideAllChildren(parentFiber, isHidden) {
        for (parentFiber = parentFiber.child; parentFiber !== null; )
          hideOrUnhideAllChildrenOnFiber(parentFiber, isHidden), parentFiber = parentFiber.sibling;
      }
      function hideOrUnhideAllChildrenOnFiber(fiber, isHidden) {
        switch (fiber.tag) {
          case 5:
          case 26:
            try {
              var instance = fiber.stateNode;
              if (isHidden) {
                var style2 = instance.style;
                typeof style2.setProperty == "function" ? style2.setProperty("display", "none", "important") : style2.display = "none";
              } else {
                var instance$jscomp$0 = fiber.stateNode, styleProp = fiber.memoizedProps.style, display = styleProp != null && styleProp.hasOwnProperty("display") ? styleProp.display : null;
                instance$jscomp$0.style.display = display == null || typeof display == "boolean" ? "" : ("" + display).trim();
              }
            } catch (error) {
              captureCommitPhaseError(fiber, fiber.return, error);
            }
            hideOrUnhideNearestPortals(fiber, isHidden);
            break;
          case 6:
            try {
              fiber.stateNode.nodeValue = isHidden ? "" : fiber.memoizedProps, viewTransitionMutationContext = !0;
            } catch (error) {
              captureCommitPhaseError(fiber, fiber.return, error);
            }
            break;
          case 18:
            try {
              var instance$jscomp$1 = fiber.stateNode;
              isHidden ? hideOrUnhideDehydratedBoundary(instance$jscomp$1, !0) : hideOrUnhideDehydratedBoundary(fiber.stateNode, !1);
            } catch (error) {
              captureCommitPhaseError(fiber, fiber.return, error);
            }
            break;
          case 22:
          case 23:
            fiber.memoizedState === null && hideOrUnhideAllChildren(fiber, isHidden);
            break;
          default:
            hideOrUnhideAllChildren(fiber, isHidden);
        }
      }
      function hideOrUnhideNearestPortals(parentFiber, isHidden$jscomp$0) {
        if (parentFiber.subtreeFlags & 67108864)
          for (parentFiber = parentFiber.child; parentFiber !== null; ) {
            a: {
              var fiber = parentFiber, isHidden = isHidden$jscomp$0;
              switch (fiber.tag) {
                case 4:
                  hideOrUnhideAllChildrenOnFiber(fiber, isHidden);
                  break a;
                case 22:
                  fiber.memoizedState === null && hideOrUnhideNearestPortals(fiber, isHidden);
                  break a;
                default:
                  hideOrUnhideNearestPortals(fiber, isHidden);
              }
            }
            parentFiber = parentFiber.sibling;
          }
      }
      function detachFiberAfterEffects(fiber) {
        var alternate = fiber.alternate;
        alternate !== null && (fiber.alternate = null, detachFiberAfterEffects(alternate)), fiber.child = null, fiber.deletions = null, fiber.sibling = null, fiber.tag === 5 && (alternate = fiber.stateNode, alternate !== null && detachDeletedInstance(alternate)), fiber.stateNode = null, fiber.return = null, fiber.dependencies = null, fiber.memoizedProps = null, fiber.memoizedState = null, fiber.pendingProps = null, fiber.stateNode = null, fiber.updateQueue = null;
      }
      var hostParent = null, hostParentIsContainer = !1;
      function recursivelyTraverseDeletionEffects(finishedRoot, nearestMountedAncestor, parent) {
        for (parent = parent.child; parent !== null; )
          commitDeletionEffectsOnFiber(finishedRoot, nearestMountedAncestor, parent), parent = parent.sibling;
      }
      function commitDeletionEffectsOnFiber(finishedRoot, nearestMountedAncestor, deletedFiber) {
        if (injectedHook && typeof injectedHook.onCommitFiberUnmount == "function")
          try {
            injectedHook.onCommitFiberUnmount(rendererID, deletedFiber);
          } catch {
          }
        switch (deletedFiber.tag) {
          case 26:
            offscreenSubtreeWasHidden || safelyDetachRef(deletedFiber, nearestMountedAncestor), recursivelyTraverseDeletionEffects(
              finishedRoot,
              nearestMountedAncestor,
              deletedFiber
            ), deletedFiber.memoizedState ? deletedFiber.memoizedState.count-- : deletedFiber.stateNode && !offscreenSubtreeWasHidden && (deletedFiber = deletedFiber.stateNode, deletedFiber.parentNode.removeChild(deletedFiber));
            break;
          case 27:
            offscreenSubtreeWasHidden || safelyDetachRef(deletedFiber, nearestMountedAncestor), commitFragmentInstanceDeletionEffects(deletedFiber);
            var prevHostParent = hostParent, prevHostParentIsContainer = hostParentIsContainer;
            isSingletonScope(deletedFiber.type) && (hostParent = deletedFiber.stateNode, hostParentIsContainer = !1), recursivelyTraverseDeletionEffects(
              finishedRoot,
              nearestMountedAncestor,
              deletedFiber
            ), releaseSingletonInstance(
              deletedFiber.stateNode,
              deletedFiber.type,
              deletedFiber.memoizedProps
            ), hostParent = prevHostParent, hostParentIsContainer = prevHostParentIsContainer;
            break;
          case 5:
            offscreenSubtreeWasHidden || safelyDetachRef(deletedFiber, nearestMountedAncestor), commitFragmentInstanceDeletionEffects(deletedFiber);
          case 6:
            if (deletedFiber.tag === 6 && commitFragmentInstanceDeletionEffects(deletedFiber), prevHostParent = hostParent, prevHostParentIsContainer = hostParentIsContainer, hostParent = null, recursivelyTraverseDeletionEffects(
              finishedRoot,
              nearestMountedAncestor,
              deletedFiber
            ), hostParent = prevHostParent, hostParentIsContainer = prevHostParentIsContainer, hostParent !== null)
              if (hostParentIsContainer)
                try {
                  (hostParent.nodeType === 9 ? hostParent.body : hostParent.nodeName === "HTML" ? hostParent.ownerDocument.body : hostParent).removeChild(deletedFiber.stateNode), viewTransitionMutationContext = !0;
                } catch (error) {
                  captureCommitPhaseError(
                    deletedFiber,
                    nearestMountedAncestor,
                    error
                  );
                }
              else
                try {
                  hostParent.removeChild(deletedFiber.stateNode), viewTransitionMutationContext = !0;
                } catch (error) {
                  captureCommitPhaseError(
                    deletedFiber,
                    nearestMountedAncestor,
                    error
                  );
                }
            break;
          case 18:
            hostParent !== null && (hostParentIsContainer ? (finishedRoot = hostParent, clearHydrationBoundary(
              finishedRoot.nodeType === 9 ? finishedRoot.body : finishedRoot.nodeName === "HTML" ? finishedRoot.ownerDocument.body : finishedRoot,
              deletedFiber.stateNode
            ), retryIfBlockedOn(finishedRoot)) : clearHydrationBoundary(hostParent, deletedFiber.stateNode));
            break;
          case 4:
            prevHostParent = hostParent, prevHostParentIsContainer = hostParentIsContainer, hostParent = deletedFiber.stateNode.containerInfo, hostParentIsContainer = !0, recursivelyTraverseDeletionEffects(
              finishedRoot,
              nearestMountedAncestor,
              deletedFiber
            ), hostParent = prevHostParent, hostParentIsContainer = prevHostParentIsContainer;
            break;
          case 0:
          case 11:
          case 14:
          case 15:
            commitHookEffectListUnmount(2, deletedFiber, nearestMountedAncestor), offscreenSubtreeWasHidden || commitHookEffectListUnmount(4, deletedFiber, nearestMountedAncestor), recursivelyTraverseDeletionEffects(
              finishedRoot,
              nearestMountedAncestor,
              deletedFiber
            );
            break;
          case 1:
            offscreenSubtreeWasHidden || (safelyDetachRef(deletedFiber, nearestMountedAncestor), prevHostParent = deletedFiber.stateNode, typeof prevHostParent.componentWillUnmount == "function" && safelyCallComponentWillUnmount(
              deletedFiber,
              nearestMountedAncestor,
              prevHostParent
            )), recursivelyTraverseDeletionEffects(
              finishedRoot,
              nearestMountedAncestor,
              deletedFiber
            );
            break;
          case 21:
            recursivelyTraverseDeletionEffects(
              finishedRoot,
              nearestMountedAncestor,
              deletedFiber
            );
            break;
          case 22:
            offscreenSubtreeWasHidden = (prevHostParent = offscreenSubtreeWasHidden) || deletedFiber.memoizedState !== null, recursivelyTraverseDeletionEffects(
              finishedRoot,
              nearestMountedAncestor,
              deletedFiber
            ), offscreenSubtreeWasHidden = prevHostParent;
            break;
          case 30:
            safelyDetachRef(deletedFiber, nearestMountedAncestor), recursivelyTraverseDeletionEffects(
              finishedRoot,
              nearestMountedAncestor,
              deletedFiber
            );
            break;
          case 7:
            offscreenSubtreeWasHidden || safelyDetachRef(deletedFiber, nearestMountedAncestor), recursivelyTraverseDeletionEffects(
              finishedRoot,
              nearestMountedAncestor,
              deletedFiber
            );
            break;
          default:
            recursivelyTraverseDeletionEffects(
              finishedRoot,
              nearestMountedAncestor,
              deletedFiber
            );
        }
      }
      function commitActivityHydrationCallbacks(finishedRoot, finishedWork) {
        if (finishedWork.memoizedState === null && (finishedRoot = finishedWork.alternate, finishedRoot !== null && (finishedRoot = finishedRoot.memoizedState, finishedRoot !== null))) {
          finishedRoot = finishedRoot.dehydrated;
          try {
            retryIfBlockedOn(finishedRoot);
          } catch (error) {
            captureCommitPhaseError(finishedWork, finishedWork.return, error);
          }
        }
      }
      function commitSuspenseHydrationCallbacks(finishedRoot, finishedWork) {
        if (finishedWork.memoizedState === null && (finishedRoot = finishedWork.alternate, finishedRoot !== null && (finishedRoot = finishedRoot.memoizedState, finishedRoot !== null && (finishedRoot = finishedRoot.dehydrated, finishedRoot !== null))))
          try {
            retryIfBlockedOn(finishedRoot);
          } catch (error) {
            captureCommitPhaseError(finishedWork, finishedWork.return, error);
          }
      }
      function getRetryCache(finishedWork) {
        switch (finishedWork.tag) {
          case 31:
          case 13:
          case 19:
            var retryCache = finishedWork.stateNode;
            return retryCache === null && (retryCache = finishedWork.stateNode = new PossiblyWeakSet()), retryCache;
          case 22:
            return finishedWork = finishedWork.stateNode, retryCache = finishedWork._retryCache, retryCache === null && (retryCache = finishedWork._retryCache = new PossiblyWeakSet()), retryCache;
          default:
            throw Error(formatProdErrorMessage(435, finishedWork.tag));
        }
      }
      function attachSuspenseRetryListeners(finishedWork, wakeables) {
        var retryCache = getRetryCache(finishedWork);
        wakeables.forEach(function(wakeable) {
          if (!retryCache.has(wakeable)) {
            retryCache.add(wakeable);
            var retry = resolveRetryWakeable.bind(null, finishedWork, wakeable);
            wakeable.then(retry, retry);
          }
        });
      }
      function recursivelyTraverseMutationEffects(root$jscomp$0, parentFiber, lanes) {
        var deletions = parentFiber.deletions;
        if (deletions !== null)
          for (var i = 0; i < deletions.length; i++) {
            var childToDelete = deletions[i], root2 = root$jscomp$0, returnFiber = parentFiber, parent = returnFiber;
            a: for (; parent !== null; ) {
              switch (parent.tag) {
                case 27:
                  if (isSingletonScope(parent.type)) {
                    hostParent = parent.stateNode, hostParentIsContainer = !1;
                    break a;
                  }
                  break;
                case 5:
                  hostParent = parent.stateNode, hostParentIsContainer = !1;
                  break a;
                case 3:
                case 4:
                  hostParent = parent.stateNode.containerInfo, hostParentIsContainer = !0;
                  break a;
              }
              parent = parent.return;
            }
            if (hostParent === null) throw Error(formatProdErrorMessage(160));
            commitDeletionEffectsOnFiber(root2, returnFiber, childToDelete), hostParent = null, hostParentIsContainer = !1, root2 = childToDelete.alternate, root2 !== null && (root2.return = null), childToDelete.return = null;
          }
        if (parentFiber.subtreeFlags & 13886)
          for (parentFiber = parentFiber.child; parentFiber !== null; )
            commitMutationEffectsOnFiber(parentFiber, root$jscomp$0, lanes), parentFiber = parentFiber.sibling;
      }
      var currentHoistableRoot = null;
      function commitMutationEffectsOnFiber(finishedWork, root2, lanes) {
        var current2 = finishedWork.alternate, flags = finishedWork.flags;
        switch (finishedWork.tag) {
          case 0:
          case 11:
          case 14:
          case 15:
            if (flags & 4 && (current2 = finishedWork.updateQueue, current2 = current2 !== null ? current2.events : null, current2 !== null))
              for (var ii = 0; ii < current2.length; ii++) {
                var _eventPayloads$ii2 = current2[ii];
                _eventPayloads$ii2.ref.impl = _eventPayloads$ii2.nextImpl;
              }
            recursivelyTraverseMutationEffects(root2, finishedWork, lanes), commitReconciliationEffects(finishedWork), flags & 4 && (commitHookEffectListUnmount(3, finishedWork, finishedWork.return), commitHookEffectListMount(3, finishedWork), commitHookEffectListUnmount(5, finishedWork, finishedWork.return));
            break;
          case 1:
            recursivelyTraverseMutationEffects(root2, finishedWork, lanes), commitReconciliationEffects(finishedWork), flags & 512 && (offscreenSubtreeWasHidden || current2 === null || safelyDetachRef(current2, current2.return)), flags & 64 && offscreenSubtreeIsHidden && (finishedWork = finishedWork.updateQueue, finishedWork !== null && (root2 = finishedWork.callbacks, root2 !== null && (lanes = finishedWork.shared.hiddenCallbacks, finishedWork.shared.hiddenCallbacks = lanes === null ? root2 : lanes.concat(root2))));
            break;
          case 26:
            if (ii = currentHoistableRoot, recursivelyTraverseMutationEffects(root2, finishedWork, lanes), commitReconciliationEffects(finishedWork), flags & 512 && (offscreenSubtreeWasHidden || current2 === null || safelyDetachRef(current2, current2.return)), flags & 4)
              if (flags = current2 !== null ? current2.memoizedState : null, lanes = finishedWork.memoizedState, current2 === null)
                if (lanes === null)
                  if (finishedWork.stateNode === null)
                    if (offscreenSubtreeIsHidden)
                      finishedWork.stateNode = createHoistableInstance(
                        finishedWork.type,
                        finishedWork.memoizedProps,
                        root2.containerInfo,
                        finishedWork
                      );
                    else {
                      a: {
                        root2 = finishedWork.type, lanes = finishedWork.memoizedProps, flags = ii.ownerDocument || ii;
                        b: switch (root2) {
                          case "title":
                            current2 = flags.getElementsByTagName("title")[0], (!current2 || current2[internalHoistableMarker] || current2[internalInstanceKey] || current2.namespaceURI === "http://www.w3.org/2000/svg" || current2.hasAttribute("itemprop")) && (current2 = flags.createElement(root2), flags.head.insertBefore(
                              current2,
                              flags.querySelector("head > title")
                            )), setInitialProperties(current2, root2, lanes), current2[internalInstanceKey] = finishedWork, markNodeAsHoistable(current2), root2 = current2;
                            break a;
                          case "link":
                            if (ii = getHydratableHoistableCache(
                              "link",
                              "href",
                              flags
                            ).get(root2 + (lanes.href || ""))) {
                              for (_eventPayloads$ii2 = 0; _eventPayloads$ii2 < ii.length; _eventPayloads$ii2++)
                                if (current2 = ii[_eventPayloads$ii2], current2.getAttribute("href") === (lanes.href == null || lanes.href === "" ? null : lanes.href) && current2.getAttribute("rel") === (lanes.rel == null ? null : lanes.rel) && current2.getAttribute("title") === (lanes.title == null ? null : lanes.title) && current2.getAttribute("crossorigin") === (lanes.crossOrigin == null ? null : lanes.crossOrigin)) {
                                  ii.splice(_eventPayloads$ii2, 1);
                                  break b;
                                }
                            }
                            current2 = flags.createElement(root2), setInitialProperties(current2, root2, lanes), flags.head.appendChild(current2);
                            break;
                          case "meta":
                            if (ii = getHydratableHoistableCache(
                              "meta",
                              "content",
                              flags
                            ).get(root2 + (lanes.content || ""))) {
                              for (_eventPayloads$ii2 = 0; _eventPayloads$ii2 < ii.length; _eventPayloads$ii2++)
                                if (current2 = ii[_eventPayloads$ii2], current2.getAttribute("content") === (lanes.content == null ? null : "" + lanes.content) && current2.getAttribute("name") === (lanes.name == null ? null : lanes.name) && current2.getAttribute("property") === (lanes.property == null ? null : lanes.property) && current2.getAttribute("http-equiv") === (lanes.httpEquiv == null ? null : lanes.httpEquiv) && current2.getAttribute("charset") === (lanes.charSet == null ? null : lanes.charSet)) {
                                  ii.splice(_eventPayloads$ii2, 1);
                                  break b;
                                }
                            }
                            current2 = flags.createElement(root2), setInitialProperties(current2, root2, lanes), flags.head.appendChild(current2);
                            break;
                          default:
                            throw Error(formatProdErrorMessage(468, root2));
                        }
                        current2[internalInstanceKey] = finishedWork, markNodeAsHoistable(current2), root2 = current2;
                      }
                      finishedWork.stateNode = root2;
                    }
                  else
                    offscreenSubtreeIsHidden || mountHoistable(ii, finishedWork.type, finishedWork.stateNode);
                else
                  finishedWork.stateNode = acquireResource(
                    ii,
                    lanes,
                    finishedWork.memoizedProps
                  );
              else
                flags !== lanes ? (flags === null ? (root2 = current2.stateNode, root2 === null || offscreenSubtreeWasHidden || root2.parentNode.removeChild(root2)) : flags.count--, lanes === null ? offscreenSubtreeIsHidden || mountHoistable(ii, finishedWork.type, finishedWork.stateNode) : acquireResource(ii, lanes, finishedWork.memoizedProps)) : lanes === null && finishedWork.stateNode !== null && commitHostUpdate(
                  finishedWork,
                  finishedWork.memoizedProps,
                  current2.memoizedProps
                );
            break;
          case 27:
            recursivelyTraverseMutationEffects(root2, finishedWork, lanes), commitReconciliationEffects(finishedWork), flags & 512 && (offscreenSubtreeWasHidden || current2 === null || safelyDetachRef(current2, current2.return)), current2 !== null && flags & 4 && commitHostUpdate(
              finishedWork,
              finishedWork.memoizedProps,
              current2.memoizedProps
            );
            break;
          case 5:
            if (ii = offscreenDirectParentIsHidden, offscreenDirectParentIsHidden = !1, recursivelyTraverseMutationEffects(root2, finishedWork, lanes), offscreenDirectParentIsHidden = ii, commitReconciliationEffects(finishedWork), flags & 512 && (offscreenSubtreeWasHidden || current2 === null || safelyDetachRef(current2, current2.return)), finishedWork.flags & 32) {
              root2 = finishedWork.stateNode;
              try {
                setTextContent(root2, ""), viewTransitionMutationContext = !0;
              } catch (error) {
                captureCommitPhaseError(finishedWork, finishedWork.return, error);
              }
            }
            flags & 4 && finishedWork.stateNode != null && (root2 = finishedWork.memoizedProps, commitHostUpdate(
              finishedWork,
              root2,
              current2 !== null ? current2.memoizedProps : root2
            )), flags & 1024 && (needsFormReset = !0);
            break;
          case 6:
            if (recursivelyTraverseMutationEffects(root2, finishedWork, lanes), commitReconciliationEffects(finishedWork), flags & 4) {
              if (finishedWork.stateNode === null)
                throw Error(formatProdErrorMessage(162));
              root2 = finishedWork.memoizedProps, lanes = finishedWork.stateNode;
              try {
                lanes.nodeValue = root2, viewTransitionMutationContext = !0;
              } catch (error) {
                captureCommitPhaseError(finishedWork, finishedWork.return, error);
              }
            }
            break;
          case 3:
            if (viewTransitionMutationContext = !1, tagCaches = null, ii = currentHoistableRoot, currentHoistableRoot = getHoistableRoot(root2.containerInfo), recursivelyTraverseMutationEffects(root2, finishedWork, lanes), currentHoistableRoot = ii, commitReconciliationEffects(finishedWork), flags & 4 && current2 !== null && current2.memoizedState.isDehydrated)
              try {
                retryIfBlockedOn(root2.containerInfo);
              } catch (error) {
                captureCommitPhaseError(finishedWork, finishedWork.return, error);
              }
            needsFormReset && (needsFormReset = !1, recursivelyResetForms(finishedWork)), viewTransitionMutationContext = !1;
            break;
          case 4:
            flags = offscreenDirectParentIsHidden, offscreenDirectParentIsHidden = offscreenSubtreeIsHidden, current2 = pushMutationContext(), ii = currentHoistableRoot, currentHoistableRoot = getHoistableRoot(
              finishedWork.stateNode.containerInfo
            ), recursivelyTraverseMutationEffects(root2, finishedWork, lanes), commitReconciliationEffects(finishedWork), currentHoistableRoot = ii, viewTransitionMutationContext && inUpdateViewTransition && (rootViewTransitionAffected = !0), viewTransitionMutationContext = current2, offscreenDirectParentIsHidden = flags;
            break;
          case 12:
            recursivelyTraverseMutationEffects(root2, finishedWork, lanes), commitReconciliationEffects(finishedWork);
            break;
          case 31:
            recursivelyTraverseMutationEffects(root2, finishedWork, lanes), commitReconciliationEffects(finishedWork), flags & 4 && (root2 = finishedWork.updateQueue, root2 !== null && (finishedWork.updateQueue = null, attachSuspenseRetryListeners(finishedWork, root2)));
            break;
          case 13:
            recursivelyTraverseMutationEffects(root2, finishedWork, lanes), commitReconciliationEffects(finishedWork), finishedWork.child.flags & 8192 && finishedWork.memoizedState !== null != (current2 !== null && current2.memoizedState !== null) && (globalMostRecentFallbackTime = now()), flags & 4 && (root2 = finishedWork.updateQueue, root2 !== null && (finishedWork.updateQueue = null, attachSuspenseRetryListeners(finishedWork, root2)));
            break;
          case 22:
            ii = finishedWork.memoizedState !== null, _eventPayloads$ii2 = current2 !== null && current2.memoizedState !== null;
            var prevOffscreenSubtreeIsHidden = offscreenSubtreeIsHidden, prevOffscreenSubtreeWasHidden = offscreenSubtreeWasHidden, prevOffscreenDirectParentIsHidden$166 = offscreenDirectParentIsHidden;
            offscreenSubtreeIsHidden = prevOffscreenSubtreeIsHidden || ii, offscreenDirectParentIsHidden = prevOffscreenDirectParentIsHidden$166 || ii, offscreenSubtreeWasHidden = prevOffscreenSubtreeWasHidden || _eventPayloads$ii2, recursivelyTraverseMutationEffects(root2, finishedWork, lanes), offscreenSubtreeWasHidden = prevOffscreenSubtreeWasHidden, offscreenDirectParentIsHidden = prevOffscreenDirectParentIsHidden$166, offscreenSubtreeIsHidden = prevOffscreenSubtreeIsHidden, commitReconciliationEffects(finishedWork), flags & 8192 && (root2 = finishedWork.stateNode, root2._visibility = ii ? root2._visibility & -2 : root2._visibility | 1, !ii || current2 === null || _eventPayloads$ii2 || offscreenSubtreeIsHidden || offscreenSubtreeWasHidden || (root2 = _eventPayloads$ii2 || offscreenSubtreeWasHidden, lanes = offscreenSubtreeIsHidden, current2 = offscreenSubtreeWasHidden, offscreenSubtreeIsHidden = ii || offscreenSubtreeIsHidden, offscreenSubtreeWasHidden = root2, recursivelyTraverseDisappearLayoutEffects(finishedWork, 2), offscreenSubtreeIsHidden = lanes, offscreenSubtreeWasHidden = current2), !ii && offscreenDirectParentIsHidden || hideOrUnhideAllChildren(finishedWork, ii)), flags & 4 && (root2 = finishedWork.updateQueue, root2 !== null && (lanes = root2.retryQueue, lanes !== null && (root2.retryQueue = null, attachSuspenseRetryListeners(finishedWork, lanes))));
            break;
          case 19:
            recursivelyTraverseMutationEffects(root2, finishedWork, lanes), commitReconciliationEffects(finishedWork), flags & 4 && (root2 = finishedWork.updateQueue, root2 !== null && (finishedWork.updateQueue = null, attachSuspenseRetryListeners(finishedWork, root2)));
            break;
          case 30:
            flags & 512 && (offscreenSubtreeWasHidden || current2 === null || safelyDetachRef(current2, current2.return)), flags = pushMutationContext(), ii = inUpdateViewTransition, _eventPayloads$ii2 = (lanes & 335544064) === lanes, prevOffscreenSubtreeIsHidden = finishedWork.memoizedProps, inUpdateViewTransition = _eventPayloads$ii2 && getViewTransitionClassName(
              prevOffscreenSubtreeIsHidden.default,
              prevOffscreenSubtreeIsHidden.update
            ) !== "none", recursivelyTraverseMutationEffects(root2, finishedWork, lanes), commitReconciliationEffects(finishedWork), _eventPayloads$ii2 && current2 !== null && viewTransitionMutationContext && (finishedWork.flags |= 4), inUpdateViewTransition = ii, viewTransitionMutationContext = flags;
            break;
          case 21:
            break;
          case 7:
            flags & 512 && (offscreenSubtreeWasHidden || current2 === null || safelyDetachRef(current2, current2.return)), current2 && current2.stateNode !== null && (current2.stateNode._fragmentFiber = finishedWork);
          default:
            recursivelyTraverseMutationEffects(root2, finishedWork, lanes), commitReconciliationEffects(finishedWork);
        }
      }
      function commitReconciliationEffects(finishedWork) {
        var flags = finishedWork.flags;
        if (flags & 2) {
          try {
            for (var hostParentFiber, parentFiber = finishedWork.return; parentFiber !== null; ) {
              if (isHostParent(parentFiber)) {
                hostParentFiber = parentFiber;
                break;
              }
              parentFiber = parentFiber.return;
            }
            parentFiber = null;
            for (var parent = finishedWork.return; parent !== null; ) {
              if (isFragmentInstanceParent(parent)) {
                var fragmentInstance = parent.stateNode;
                parentFiber === null ? parentFiber = [fragmentInstance] : parentFiber.push(fragmentInstance);
              }
              if (isFragmentInstanceHostBoundary(parent)) break;
              parent = parent.return;
            }
            var JSCompiler_inline_result = parentFiber;
            if (hostParentFiber == null) throw Error(formatProdErrorMessage(160));
            switch (hostParentFiber.tag) {
              case 27:
                var parent$jscomp$0 = hostParentFiber.stateNode, before = getHostSibling(finishedWork);
                insertOrAppendPlacementNode(
                  finishedWork,
                  before,
                  parent$jscomp$0,
                  JSCompiler_inline_result
                );
                break;
              case 5:
                var parent$149 = hostParentFiber.stateNode;
                hostParentFiber.flags & 32 && (setTextContent(parent$149, ""), hostParentFiber.flags &= -33);
                var before$150 = getHostSibling(finishedWork);
                insertOrAppendPlacementNode(
                  finishedWork,
                  before$150,
                  parent$149,
                  JSCompiler_inline_result
                );
                break;
              case 3:
              case 4:
                var parent$151 = hostParentFiber.stateNode.containerInfo, before$152 = getHostSibling(finishedWork);
                insertOrAppendPlacementNodeIntoContainer(
                  finishedWork,
                  before$152,
                  parent$151,
                  JSCompiler_inline_result
                );
                break;
              default:
                throw Error(formatProdErrorMessage(161));
            }
          } catch (error) {
            captureCommitPhaseError(finishedWork, finishedWork.return, error);
          }
          finishedWork.flags &= -3;
        }
        flags & 4096 && (finishedWork.flags &= -4097);
      }
      function recursivelyResetForms(parentFiber) {
        if (parentFiber.subtreeFlags & 1024)
          for (parentFiber = parentFiber.child; parentFiber !== null; ) {
            var fiber = parentFiber;
            recursivelyResetForms(fiber), fiber.tag === 5 && fiber.flags & 1024 && (fiber = fiber.stateNode, _enabled = !0, fiber.reset(), _enabled = !1), parentFiber = parentFiber.sibling;
          }
      }
      function recursivelyTraverseAfterMutationEffects(root2, parentFiber) {
        if (parentFiber.subtreeFlags & 9270)
          for (parentFiber = parentFiber.child; parentFiber !== null; )
            commitAfterMutationEffectsOnFiber(parentFiber, root2), parentFiber = parentFiber.sibling;
        else measureNestedViewTransitions(parentFiber, !1);
      }
      function commitAfterMutationEffectsOnFiber(finishedWork, root2) {
        var current2 = finishedWork.alternate;
        if (current2 === null) commitEnterViewTransitions(finishedWork, !1);
        else
          switch (finishedWork.tag) {
            case 3:
              if (rootViewTransitionNameCanceled = viewTransitionContextChanged = !1, pushViewTransitionCancelableScope(), recursivelyTraverseAfterMutationEffects(root2, finishedWork), !viewTransitionContextChanged && !rootViewTransitionAffected) {
                if (finishedWork = viewTransitionCancelableChildren, finishedWork !== null)
                  for (var i = 0; i < finishedWork.length; i += 3) {
                    current2 = finishedWork[i];
                    var oldName = finishedWork[i + 1];
                    restoreViewTransitionName(current2, finishedWork[i + 2]), current2 = current2.ownerDocument.documentElement, current2 !== null && current2.animate(
                      { opacity: [0, 0], pointerEvents: ["none", "none"] },
                      {
                        duration: 0,
                        fill: "forwards",
                        pseudoElement: "::view-transition-group(" + oldName + ")"
                      }
                    );
                  }
                finishedWork = root2.containerInfo, finishedWork = finishedWork.nodeType === 9 ? finishedWork.documentElement : finishedWork.ownerDocument.documentElement, finishedWork !== null && finishedWork.style.viewTransitionName === "" && (finishedWork.style.viewTransitionName = "none", finishedWork.animate(
                  { opacity: [0, 0], pointerEvents: ["none", "none"] },
                  {
                    duration: 0,
                    fill: "forwards",
                    pseudoElement: "::view-transition-group(root)"
                  }
                ), finishedWork.animate(
                  { width: [0, 0], height: [0, 0] },
                  {
                    duration: 0,
                    fill: "forwards",
                    pseudoElement: "::view-transition"
                  }
                )), rootViewTransitionNameCanceled = !0;
              }
              viewTransitionCancelableChildren = null;
              break;
            case 5:
              recursivelyTraverseAfterMutationEffects(root2, finishedWork);
              break;
            case 4:
              i = viewTransitionContextChanged, viewTransitionContextChanged = !1, recursivelyTraverseAfterMutationEffects(root2, finishedWork), viewTransitionContextChanged && (rootViewTransitionAffected = !0), viewTransitionContextChanged = i;
              break;
            case 22:
              finishedWork.memoizedState === null && (current2.memoizedState !== null ? commitEnterViewTransitions(finishedWork, !1) : recursivelyTraverseAfterMutationEffects(root2, finishedWork));
              break;
            case 30:
              i = viewTransitionContextChanged, oldName = pushViewTransitionCancelableScope(), viewTransitionContextChanged = !1, recursivelyTraverseAfterMutationEffects(root2, finishedWork), viewTransitionContextChanged && (finishedWork.flags |= 4);
              var props = finishedWork.memoizedProps, state = finishedWork.stateNode;
              root2 = getViewTransitionName(props, state), state = getViewTransitionName(current2.memoizedProps, state);
              var className = getViewTransitionClassName(props.default, props.update);
              className === "none" ? root2 = !1 : (props = current2.memoizedState, current2.memoizedState = null, current2 = finishedWork.child, viewTransitionHostInstanceIdx = 0, root2 = measureViewTransitionHostInstancesRecursive(
                finishedWork,
                current2,
                root2,
                state,
                className,
                props,
                !0
              ), viewTransitionHostInstanceIdx !== (props === null ? 0 : props.length) && (finishedWork.flags |= 32)), (finishedWork.flags & 4) !== 0 && root2 ? (scheduleViewTransitionEvent(
                finishedWork,
                finishedWork.memoizedProps.onUpdate
              ), viewTransitionCancelableChildren = oldName) : oldName !== null && (oldName.push.apply(oldName, viewTransitionCancelableChildren), viewTransitionCancelableChildren = oldName), viewTransitionContextChanged = (finishedWork.flags & 32) !== 0 ? !0 : i;
              break;
            default:
              recursivelyTraverseAfterMutationEffects(root2, finishedWork);
          }
      }
      function recursivelyTraverseLayoutEffects(root2, parentFiber) {
        if (parentFiber.subtreeFlags & 8772)
          for (parentFiber = parentFiber.child; parentFiber !== null; )
            commitLayoutEffectOnFiber(root2, parentFiber.alternate, parentFiber), parentFiber = parentFiber.sibling;
      }
      function recursivelyTraverseDisappearLayoutEffects(parentFiber, layoutEffectTraversalFlags$jscomp$0) {
        for (parentFiber = parentFiber.child; parentFiber !== null; ) {
          var finishedWork = parentFiber, layoutEffectTraversalFlags = layoutEffectTraversalFlags$jscomp$0;
          switch (finishedWork.tag) {
            case 0:
            case 11:
            case 14:
            case 15:
              commitHookEffectListUnmount(4, finishedWork, finishedWork.return), recursivelyTraverseDisappearLayoutEffects(
                finishedWork,
                layoutEffectTraversalFlags
              );
              break;
            case 1:
              safelyDetachRef(finishedWork, finishedWork.return);
              var instance = finishedWork.stateNode;
              typeof instance.componentWillUnmount == "function" && safelyCallComponentWillUnmount(
                finishedWork,
                finishedWork.return,
                instance
              ), recursivelyTraverseDisappearLayoutEffects(
                finishedWork,
                layoutEffectTraversalFlags
              );
              break;
            case 27:
              (layoutEffectTraversalFlags & 2) !== 0 && releaseSingletonInstance(
                finishedWork.stateNode,
                finishedWork.type,
                finishedWork.memoizedProps
              );
            case 5:
              safelyDetachRef(finishedWork, finishedWork.return), finishedWork.tag !== 5 && finishedWork.tag !== 27 || commitFragmentInstanceDeletionEffects(finishedWork), recursivelyTraverseDisappearLayoutEffects(
                finishedWork,
                layoutEffectTraversalFlags
              );
              break;
            case 6:
              commitFragmentInstanceDeletionEffects(finishedWork);
              break;
            case 26:
              safelyDetachRef(finishedWork, finishedWork.return), instance = finishedWork.stateNode, finishedWork.memoizedState !== null || instance === null || offscreenSubtreeWasHidden || instance.parentNode.removeChild(instance), recursivelyTraverseDisappearLayoutEffects(
                finishedWork,
                layoutEffectTraversalFlags
              );
              break;
            case 22:
              finishedWork.memoizedState === null && recursivelyTraverseDisappearLayoutEffects(
                finishedWork,
                layoutEffectTraversalFlags
              );
              break;
            case 30:
              safelyDetachRef(finishedWork, finishedWork.return), recursivelyTraverseDisappearLayoutEffects(
                finishedWork,
                layoutEffectTraversalFlags
              );
              break;
            case 7:
              safelyDetachRef(finishedWork, finishedWork.return);
            default:
              recursivelyTraverseDisappearLayoutEffects(
                finishedWork,
                layoutEffectTraversalFlags
              );
          }
          parentFiber = parentFiber.sibling;
        }
      }
      function recursivelyTraverseReappearLayoutEffects(finishedRoot$jscomp$0, parentFiber, layoutEffectTraversalFlags) {
        for (layoutEffectTraversalFlags = (parentFiber.subtreeFlags & 8772) !== 0 ? layoutEffectTraversalFlags : layoutEffectTraversalFlags & -2, parentFiber = parentFiber.child; parentFiber !== null; ) {
          var current2 = parentFiber.alternate, finishedRoot = finishedRoot$jscomp$0, finishedWork = parentFiber, flags = finishedWork.flags, includeWorkInProgressEffects = (layoutEffectTraversalFlags & 1) !== 0;
          switch (finishedWork.tag) {
            case 0:
            case 11:
            case 15:
              recursivelyTraverseReappearLayoutEffects(
                finishedRoot,
                finishedWork,
                layoutEffectTraversalFlags
              ), commitHookEffectListMount(4, finishedWork);
              break;
            case 1:
              if (recursivelyTraverseReappearLayoutEffects(
                finishedRoot,
                finishedWork,
                layoutEffectTraversalFlags
              ), current2 = finishedWork, finishedRoot = current2.stateNode, typeof finishedRoot.componentDidMount == "function")
                try {
                  finishedRoot.componentDidMount();
                } catch (error) {
                  captureCommitPhaseError(current2, current2.return, error);
                }
              if (current2 = finishedWork, finishedRoot = current2.updateQueue, finishedRoot !== null) {
                var instance = current2.stateNode;
                try {
                  var hiddenCallbacks = finishedRoot.shared.hiddenCallbacks;
                  if (hiddenCallbacks !== null)
                    for (finishedRoot.shared.hiddenCallbacks = null, finishedRoot = 0; finishedRoot < hiddenCallbacks.length; finishedRoot++)
                      callCallback(hiddenCallbacks[finishedRoot], instance);
                } catch (error) {
                  captureCommitPhaseError(current2, current2.return, error);
                }
              }
              includeWorkInProgressEffects && flags & 64 && commitClassCallbacks(finishedWork), safelyAttachRef(finishedWork, finishedWork.return);
              break;
            case 27:
              (layoutEffectTraversalFlags & 2) !== 0 && commitHostSingletonAcquisition(finishedWork);
            case 5:
              finishedWork.tag !== 5 && finishedWork.tag !== 27 || commitFragmentInstanceInsertionEffects(finishedWork), recursivelyTraverseReappearLayoutEffects(
                finishedRoot,
                finishedWork,
                layoutEffectTraversalFlags
              ), includeWorkInProgressEffects && current2 === null && flags & 4 && commitHostMount(finishedWork), safelyAttachRef(finishedWork, finishedWork.return);
              break;
            case 6:
              commitFragmentInstanceInsertionEffects(finishedWork);
              break;
            case 26:
              instance = finishedWork.stateNode, finishedWork.memoizedState !== null || instance === null || offscreenSubtreeIsHidden || mountHoistable(
                getHoistableRoot(instance.ownerDocument),
                finishedWork.type,
                instance
              ), recursivelyTraverseReappearLayoutEffects(
                finishedRoot,
                finishedWork,
                layoutEffectTraversalFlags
              ), includeWorkInProgressEffects && current2 === null && flags & 4 && commitHostMount(finishedWork), safelyAttachRef(finishedWork, finishedWork.return);
              break;
            case 12:
              recursivelyTraverseReappearLayoutEffects(
                finishedRoot,
                finishedWork,
                layoutEffectTraversalFlags
              );
              break;
            case 31:
              recursivelyTraverseReappearLayoutEffects(
                finishedRoot,
                finishedWork,
                layoutEffectTraversalFlags
              ), includeWorkInProgressEffects && flags & 4 && commitActivityHydrationCallbacks(finishedRoot, finishedWork);
              break;
            case 13:
              recursivelyTraverseReappearLayoutEffects(
                finishedRoot,
                finishedWork,
                layoutEffectTraversalFlags
              ), includeWorkInProgressEffects && flags & 4 && commitSuspenseHydrationCallbacks(finishedRoot, finishedWork);
              break;
            case 22:
              finishedWork.memoizedState === null && recursivelyTraverseReappearLayoutEffects(
                finishedRoot,
                finishedWork,
                layoutEffectTraversalFlags
              ), safelyAttachRef(finishedWork, finishedWork.return);
              break;
            case 30:
              recursivelyTraverseReappearLayoutEffects(
                finishedRoot,
                finishedWork,
                layoutEffectTraversalFlags
              ), safelyAttachRef(finishedWork, finishedWork.return);
              break;
            case 7:
              safelyAttachRef(finishedWork, finishedWork.return);
            default:
              recursivelyTraverseReappearLayoutEffects(
                finishedRoot,
                finishedWork,
                layoutEffectTraversalFlags
              );
          }
          parentFiber = parentFiber.sibling;
        }
      }
      function commitOffscreenPassiveMountEffects(current2, finishedWork) {
        var previousCache = null;
        current2 !== null && current2.memoizedState !== null && current2.memoizedState.cachePool !== null && (previousCache = current2.memoizedState.cachePool.pool), current2 = null, finishedWork.memoizedState !== null && finishedWork.memoizedState.cachePool !== null && (current2 = finishedWork.memoizedState.cachePool.pool), current2 !== previousCache && (current2 != null && current2.refCount++, previousCache != null && releaseCache(previousCache));
      }
      function commitCachePassiveMountEffect(current2, finishedWork) {
        current2 = null, finishedWork.alternate !== null && (current2 = finishedWork.alternate.memoizedState.cache), finishedWork = finishedWork.memoizedState.cache, finishedWork !== current2 && (finishedWork.refCount++, current2 != null && releaseCache(current2));
      }
      function recursivelyTraversePassiveMountEffects(root2, parentFiber, committedLanes, committedTransitions) {
        var isViewTransitionEligible = (committedLanes & 335544064) === committedLanes;
        if (parentFiber.subtreeFlags & (isViewTransitionEligible ? 10262 : 10256))
          for (parentFiber = parentFiber.child; parentFiber !== null; )
            commitPassiveMountOnFiber(
              root2,
              parentFiber,
              committedLanes,
              committedTransitions
            ), parentFiber = parentFiber.sibling;
        else isViewTransitionEligible && restoreNestedViewTransitions(parentFiber);
      }
      function commitPassiveMountOnFiber(finishedRoot, finishedWork, committedLanes, committedTransitions) {
        var isViewTransitionEligible = (committedLanes & 335544064) === committedLanes;
        isViewTransitionEligible && finishedWork.alternate === null && finishedWork.return !== null && finishedWork.return.alternate !== null && restoreEnterOrExitViewTransitions(finishedWork);
        var flags = finishedWork.flags;
        switch (finishedWork.tag) {
          case 0:
          case 11:
          case 15:
            recursivelyTraversePassiveMountEffects(
              finishedRoot,
              finishedWork,
              committedLanes,
              committedTransitions
            ), flags & 2048 && commitHookEffectListMount(9, finishedWork);
            break;
          case 1:
            recursivelyTraversePassiveMountEffects(
              finishedRoot,
              finishedWork,
              committedLanes,
              committedTransitions
            );
            break;
          case 3:
            recursivelyTraversePassiveMountEffects(
              finishedRoot,
              finishedWork,
              committedLanes,
              committedTransitions
            ), isViewTransitionEligible && rootViewTransitionNameCanceled && (finishedRoot = finishedRoot.containerInfo, finishedRoot = finishedRoot.nodeType === 9 ? finishedRoot.body : finishedRoot.nodeName === "HTML" ? finishedRoot.ownerDocument.body : finishedRoot, finishedRoot.style.viewTransitionName === "root" && (finishedRoot.style.viewTransitionName = ""), finishedRoot = finishedRoot.ownerDocument.documentElement, finishedRoot !== null && finishedRoot.style.viewTransitionName === "none" && (finishedRoot.style.viewTransitionName = "")), flags & 2048 && (flags = null, finishedWork.alternate !== null && (flags = finishedWork.alternate.memoizedState.cache), finishedWork = finishedWork.memoizedState.cache, finishedWork !== flags && (finishedWork.refCount++, flags != null && releaseCache(flags)));
            break;
          case 12:
            if (flags & 2048) {
              recursivelyTraversePassiveMountEffects(
                finishedRoot,
                finishedWork,
                committedLanes,
                committedTransitions
              ), flags = finishedWork.stateNode;
              try {
                var _finishedWork$memoize2 = finishedWork.memoizedProps, id = _finishedWork$memoize2.id, onPostCommit = _finishedWork$memoize2.onPostCommit;
                typeof onPostCommit == "function" && onPostCommit(
                  id,
                  finishedWork.alternate === null ? "mount" : "update",
                  flags.passiveEffectDuration,
                  -0
                );
              } catch (error) {
                captureCommitPhaseError(finishedWork, finishedWork.return, error);
              }
            } else
              recursivelyTraversePassiveMountEffects(
                finishedRoot,
                finishedWork,
                committedLanes,
                committedTransitions
              );
            break;
          case 31:
            recursivelyTraversePassiveMountEffects(
              finishedRoot,
              finishedWork,
              committedLanes,
              committedTransitions
            );
            break;
          case 13:
            recursivelyTraversePassiveMountEffects(
              finishedRoot,
              finishedWork,
              committedLanes,
              committedTransitions
            );
            break;
          case 23:
            break;
          case 22:
            _finishedWork$memoize2 = finishedWork.stateNode, id = finishedWork.alternate, finishedWork.memoizedState !== null ? (isViewTransitionEligible && id !== null && id.memoizedState === null && restoreEnterOrExitViewTransitions(id), _finishedWork$memoize2._visibility & 2 ? recursivelyTraversePassiveMountEffects(
              finishedRoot,
              finishedWork,
              committedLanes,
              committedTransitions
            ) : recursivelyTraverseAtomicPassiveEffects(
              finishedRoot,
              finishedWork
            )) : (isViewTransitionEligible && id !== null && id.memoizedState !== null && restoreEnterOrExitViewTransitions(finishedWork), _finishedWork$memoize2._visibility & 2 ? recursivelyTraversePassiveMountEffects(
              finishedRoot,
              finishedWork,
              committedLanes,
              committedTransitions
            ) : (_finishedWork$memoize2._visibility |= 2, recursivelyTraverseReconnectPassiveEffects(
              finishedRoot,
              finishedWork,
              committedLanes,
              committedTransitions,
              (finishedWork.subtreeFlags & 10256) !== 0 || !1
            ))), flags & 2048 && commitOffscreenPassiveMountEffects(id, finishedWork);
            break;
          case 24:
            recursivelyTraversePassiveMountEffects(
              finishedRoot,
              finishedWork,
              committedLanes,
              committedTransitions
            ), flags & 2048 && commitCachePassiveMountEffect(finishedWork.alternate, finishedWork);
            break;
          case 30:
            isViewTransitionEligible && (flags = finishedWork.alternate, flags !== null && (restoreViewTransitionOnHostInstances(flags.child, !0), restoreViewTransitionOnHostInstances(finishedWork.child, !0))), recursivelyTraversePassiveMountEffects(
              finishedRoot,
              finishedWork,
              committedLanes,
              committedTransitions
            );
            break;
          default:
            recursivelyTraversePassiveMountEffects(
              finishedRoot,
              finishedWork,
              committedLanes,
              committedTransitions
            );
        }
      }
      function recursivelyTraverseReconnectPassiveEffects(finishedRoot$jscomp$0, parentFiber, committedLanes$jscomp$0, committedTransitions$jscomp$0, includeWorkInProgressEffects) {
        for (includeWorkInProgressEffects = includeWorkInProgressEffects && ((parentFiber.subtreeFlags & 10256) !== 0 || !1), parentFiber = parentFiber.child; parentFiber !== null; ) {
          var finishedRoot = finishedRoot$jscomp$0, finishedWork = parentFiber, committedLanes = committedLanes$jscomp$0, committedTransitions = committedTransitions$jscomp$0, flags = finishedWork.flags;
          switch (finishedWork.tag) {
            case 0:
            case 11:
            case 15:
              recursivelyTraverseReconnectPassiveEffects(
                finishedRoot,
                finishedWork,
                committedLanes,
                committedTransitions,
                includeWorkInProgressEffects
              ), commitHookEffectListMount(8, finishedWork);
              break;
            case 23:
              break;
            case 22:
              var instance = finishedWork.stateNode;
              finishedWork.memoizedState !== null ? instance._visibility & 2 ? recursivelyTraverseReconnectPassiveEffects(
                finishedRoot,
                finishedWork,
                committedLanes,
                committedTransitions,
                includeWorkInProgressEffects
              ) : recursivelyTraverseAtomicPassiveEffects(
                finishedRoot,
                finishedWork
              ) : (instance._visibility |= 2, recursivelyTraverseReconnectPassiveEffects(
                finishedRoot,
                finishedWork,
                committedLanes,
                committedTransitions,
                includeWorkInProgressEffects
              )), includeWorkInProgressEffects && flags & 2048 && commitOffscreenPassiveMountEffects(
                finishedWork.alternate,
                finishedWork
              );
              break;
            case 24:
              recursivelyTraverseReconnectPassiveEffects(
                finishedRoot,
                finishedWork,
                committedLanes,
                committedTransitions,
                includeWorkInProgressEffects
              ), includeWorkInProgressEffects && flags & 2048 && commitCachePassiveMountEffect(finishedWork.alternate, finishedWork);
              break;
            default:
              recursivelyTraverseReconnectPassiveEffects(
                finishedRoot,
                finishedWork,
                committedLanes,
                committedTransitions,
                includeWorkInProgressEffects
              );
          }
          parentFiber = parentFiber.sibling;
        }
      }
      function recursivelyTraverseAtomicPassiveEffects(finishedRoot$jscomp$0, parentFiber) {
        if (parentFiber.subtreeFlags & 10256)
          for (parentFiber = parentFiber.child; parentFiber !== null; ) {
            var finishedRoot = finishedRoot$jscomp$0, finishedWork = parentFiber, flags = finishedWork.flags;
            switch (finishedWork.tag) {
              case 22:
                recursivelyTraverseAtomicPassiveEffects(finishedRoot, finishedWork), flags & 2048 && commitOffscreenPassiveMountEffects(
                  finishedWork.alternate,
                  finishedWork
                );
                break;
              case 24:
                recursivelyTraverseAtomicPassiveEffects(finishedRoot, finishedWork), flags & 2048 && commitCachePassiveMountEffect(finishedWork.alternate, finishedWork);
                break;
              default:
                recursivelyTraverseAtomicPassiveEffects(finishedRoot, finishedWork);
            }
            parentFiber = parentFiber.sibling;
          }
      }
      var suspenseyCommitFlag = 8192;
      function recursivelyAccumulateSuspenseyCommit(parentFiber, committedLanes, suspendedState) {
        if (parentFiber.subtreeFlags & suspenseyCommitFlag)
          for (parentFiber = parentFiber.child; parentFiber !== null; )
            accumulateSuspenseyCommitOnFiber(
              parentFiber,
              committedLanes,
              suspendedState
            ), parentFiber = parentFiber.sibling;
      }
      function accumulateSuspenseyCommitOnFiber(fiber, committedLanes, suspendedState) {
        switch (fiber.tag) {
          case 26:
            recursivelyAccumulateSuspenseyCommit(
              fiber,
              committedLanes,
              suspendedState
            ), fiber.flags & suspenseyCommitFlag && (fiber.memoizedState !== null ? suspendResource(
              suspendedState,
              currentHoistableRoot,
              fiber.memoizedState,
              fiber.memoizedProps
            ) : (fiber = fiber.stateNode, (committedLanes & 335544128) === committedLanes && suspendInstance(suspendedState, fiber)));
            break;
          case 5:
            recursivelyAccumulateSuspenseyCommit(
              fiber,
              committedLanes,
              suspendedState
            ), fiber.flags & suspenseyCommitFlag && (fiber = fiber.stateNode, (committedLanes & 335544128) === committedLanes && suspendInstance(suspendedState, fiber));
            break;
          case 3:
          case 4:
            var previousHoistableRoot = currentHoistableRoot;
            currentHoistableRoot = getHoistableRoot(fiber.stateNode.containerInfo), recursivelyAccumulateSuspenseyCommit(
              fiber,
              committedLanes,
              suspendedState
            ), currentHoistableRoot = previousHoistableRoot;
            break;
          case 22:
            fiber.memoizedState === null && (previousHoistableRoot = fiber.alternate, previousHoistableRoot !== null && previousHoistableRoot.memoizedState !== null ? (previousHoistableRoot = suspenseyCommitFlag, suspenseyCommitFlag = 16777216, recursivelyAccumulateSuspenseyCommit(
              fiber,
              committedLanes,
              suspendedState
            ), suspenseyCommitFlag = previousHoistableRoot) : recursivelyAccumulateSuspenseyCommit(
              fiber,
              committedLanes,
              suspendedState
            ));
            break;
          case 30:
            if ((fiber.flags & suspenseyCommitFlag) !== 0 && (previousHoistableRoot = fiber.memoizedProps.name, previousHoistableRoot != null && previousHoistableRoot !== "auto")) {
              var state = fiber.stateNode;
              state.paired = null, appearingViewTransitions === null && (appearingViewTransitions = /* @__PURE__ */ new Map()), appearingViewTransitions.set(previousHoistableRoot, state);
            }
            recursivelyAccumulateSuspenseyCommit(
              fiber,
              committedLanes,
              suspendedState
            );
            break;
          default:
            recursivelyAccumulateSuspenseyCommit(
              fiber,
              committedLanes,
              suspendedState
            );
        }
      }
      function detachAlternateSiblings(parentFiber) {
        var previousFiber = parentFiber.alternate;
        if (previousFiber !== null && (parentFiber = previousFiber.child, parentFiber !== null)) {
          previousFiber.child = null;
          do
            previousFiber = parentFiber.sibling, parentFiber.sibling = null, parentFiber = previousFiber;
          while (parentFiber !== null);
        }
      }
      function recursivelyTraversePassiveUnmountEffects(parentFiber) {
        var deletions = parentFiber.deletions;
        if ((parentFiber.flags & 16) !== 0) {
          if (deletions !== null)
            for (var i = 0; i < deletions.length; i++) {
              var childToDelete = deletions[i];
              nextEffect = childToDelete, commitPassiveUnmountEffectsInsideOfDeletedTree_begin(
                childToDelete,
                parentFiber
              );
            }
          detachAlternateSiblings(parentFiber);
        }
        if (parentFiber.subtreeFlags & 10256)
          for (parentFiber = parentFiber.child; parentFiber !== null; )
            commitPassiveUnmountOnFiber(parentFiber), parentFiber = parentFiber.sibling;
      }
      function commitPassiveUnmountOnFiber(finishedWork) {
        switch (finishedWork.tag) {
          case 0:
          case 11:
          case 15:
            recursivelyTraversePassiveUnmountEffects(finishedWork), finishedWork.flags & 2048 && commitHookEffectListUnmount(9, finishedWork, finishedWork.return);
            break;
          case 3:
            recursivelyTraversePassiveUnmountEffects(finishedWork);
            break;
          case 12:
            recursivelyTraversePassiveUnmountEffects(finishedWork);
            break;
          case 22:
            var instance = finishedWork.stateNode;
            finishedWork.memoizedState !== null && instance._visibility & 2 && (finishedWork.return === null || finishedWork.return.tag !== 13) ? (instance._visibility &= -3, recursivelyTraverseDisconnectPassiveEffects(finishedWork)) : recursivelyTraversePassiveUnmountEffects(finishedWork);
            break;
          default:
            recursivelyTraversePassiveUnmountEffects(finishedWork);
        }
      }
      function recursivelyTraverseDisconnectPassiveEffects(parentFiber) {
        var deletions = parentFiber.deletions;
        if ((parentFiber.flags & 16) !== 0) {
          if (deletions !== null)
            for (var i = 0; i < deletions.length; i++) {
              var childToDelete = deletions[i];
              nextEffect = childToDelete, commitPassiveUnmountEffectsInsideOfDeletedTree_begin(
                childToDelete,
                parentFiber
              );
            }
          detachAlternateSiblings(parentFiber);
        }
        for (parentFiber = parentFiber.child; parentFiber !== null; ) {
          switch (deletions = parentFiber, deletions.tag) {
            case 0:
            case 11:
            case 15:
              commitHookEffectListUnmount(8, deletions, deletions.return), recursivelyTraverseDisconnectPassiveEffects(deletions);
              break;
            case 22:
              i = deletions.stateNode, i._visibility & 2 && (i._visibility &= -3, recursivelyTraverseDisconnectPassiveEffects(deletions));
              break;
            default:
              recursivelyTraverseDisconnectPassiveEffects(deletions);
          }
          parentFiber = parentFiber.sibling;
        }
      }
      function commitPassiveUnmountEffectsInsideOfDeletedTree_begin(deletedSubtreeRoot, nearestMountedAncestor) {
        for (; nextEffect !== null; ) {
          var fiber = nextEffect;
          switch (fiber.tag) {
            case 0:
            case 11:
            case 15:
              commitHookEffectListUnmount(8, fiber, nearestMountedAncestor);
              break;
            case 23:
            case 22:
              if (fiber.memoizedState !== null && fiber.memoizedState.cachePool !== null) {
                var cache = fiber.memoizedState.cachePool.pool;
                cache != null && cache.refCount++;
              }
              break;
            case 24:
              releaseCache(fiber.memoizedState.cache);
          }
          if (cache = fiber.child, cache !== null) cache.return = fiber, nextEffect = cache;
          else
            a: for (fiber = deletedSubtreeRoot; nextEffect !== null; ) {
              cache = nextEffect;
              var sibling = cache.sibling, returnFiber = cache.return;
              if (detachFiberAfterEffects(cache), cache === fiber) {
                nextEffect = null;
                break a;
              }
              if (sibling !== null) {
                sibling.return = returnFiber, nextEffect = sibling;
                break a;
              }
              nextEffect = returnFiber;
            }
        }
      }
      var DefaultAsyncDispatcher = {
        getCacheForType: function(resourceType) {
          var cache = readContext(CacheContext), cacheForType = cache.data.get(resourceType);
          return cacheForType === void 0 && (cacheForType = resourceType(), cache.data.set(resourceType, cacheForType)), cacheForType;
        },
        cacheSignal: function() {
          return readContext(CacheContext).controller.signal;
        }
      }, PossiblyWeakMap = typeof WeakMap == "function" ? WeakMap : Map, executionContext = 0, workInProgressRoot = null, workInProgress = null, workInProgressRootRenderLanes = 0, workInProgressSuspendedReason = 0, workInProgressThrownValue = null, workInProgressRootDidSkipSuspendedSiblings = !1, workInProgressRootIsPrerendering = !1, workInProgressRootDidAttachPingListener = !1, entangledRenderLanes = 0, workInProgressRootExitStatus = 0, workInProgressRootSkippedLanes = 0, workInProgressRootInterleavedUpdatedLanes = 0, workInProgressRootPingedLanes = 0, workInProgressDeferredLane = 0, workInProgressSuspendedRetryLanes = 0, workInProgressRootConcurrentErrors = null, workInProgressRootRecoverableErrors = null, workInProgressRootDidIncludeRecursiveRenderUpdate = !1, globalMostRecentFallbackTime = 0, globalMostRecentTransitionTime = 0, workInProgressRootRenderTargetTime = 1 / 0, workInProgressTransitions = null, legacyErrorBoundariesThatAlreadyFailed = null, pendingEffectsStatus = 0, pendingEffectsRoot = null, pendingFinishedWork = null, pendingEffectsLanes = 0, pendingEffectsRemainingLanes = 0, pendingPassiveTransitions = null, pendingRecoverableErrors = null, pendingViewTransition = null, pendingViewTransitionEvents = null, pendingTransitionTypes = null, nestedUpdateCount = 0, rootWithNestedUpdates = null;
      function requestUpdateLane() {
        return (executionContext & 2) !== 0 && workInProgressRootRenderLanes !== 0 ? workInProgressRootRenderLanes & -workInProgressRootRenderLanes : ReactSharedInternals.T !== null ? requestTransitionLane() : resolveUpdatePriority();
      }
      function requestDeferredLane() {
        if (workInProgressDeferredLane === 0)
          if ((workInProgressRootRenderLanes & 536870912) === 0 || isHydrating) {
            var lane = nextTransitionDeferredLane;
            nextTransitionDeferredLane <<= 1, (nextTransitionDeferredLane & 3932160) === 0 && (nextTransitionDeferredLane = 262144), workInProgressDeferredLane = lane;
          } else workInProgressDeferredLane = 536870912;
        return lane = suspenseHandlerStackCursor.current, lane !== null && (lane.flags |= 32), workInProgressDeferredLane;
      }
      function scheduleViewTransitionEvent(fiber, callback) {
        if (callback != null) {
          var state = fiber.stateNode, instance = state.ref;
          instance === null && (instance = state.ref = createViewTransitionInstance(
            getViewTransitionName(fiber.memoizedProps, state)
          )), pendingViewTransitionEvents === null && (pendingViewTransitionEvents = []), pendingViewTransitionEvents.push(callback.bind(null, instance));
        }
      }
      function scheduleUpdateOnFiber(root2, fiber, lane) {
        (root2 === workInProgressRoot && (workInProgressSuspendedReason === 2 || workInProgressSuspendedReason === 9) || root2.cancelPendingCommit !== null) && (prepareFreshStack(root2, 0), markRootSuspended(
          root2,
          workInProgressRootRenderLanes,
          workInProgressDeferredLane,
          !1
        )), markRootUpdated$1(root2, lane), ((executionContext & 2) === 0 || root2 !== workInProgressRoot) && (root2 === workInProgressRoot && ((executionContext & 2) === 0 && (workInProgressRootInterleavedUpdatedLanes |= lane), workInProgressRootExitStatus === 4 && markRootSuspended(
          root2,
          workInProgressRootRenderLanes,
          workInProgressDeferredLane,
          !1
        )), ensureRootIsScheduled(root2));
      }
      function performWorkOnRoot(root$jscomp$0, lanes, forceSync) {
        if ((executionContext & 6) !== 0) throw Error(formatProdErrorMessage(327));
        var shouldTimeSlice = !forceSync && (lanes & 127) === 0 && (lanes & root$jscomp$0.expiredLanes) === 0 || checkIfRootIsPrerendering(root$jscomp$0, lanes), exitStatus = shouldTimeSlice ? renderRootConcurrent(root$jscomp$0, lanes) : renderRootSync(root$jscomp$0, lanes, !0), renderWasConcurrent = shouldTimeSlice;
        do {
          if (exitStatus === 0) {
            workInProgressRootIsPrerendering && !shouldTimeSlice && markRootSuspended(root$jscomp$0, lanes, 0, !1);
            break;
          } else {
            if (forceSync = root$jscomp$0.current.alternate, renderWasConcurrent && !isRenderConsistentWithExternalStores(forceSync)) {
              exitStatus = renderRootSync(root$jscomp$0, lanes, !1), renderWasConcurrent = !1;
              continue;
            }
            if (exitStatus === 2) {
              if (renderWasConcurrent = lanes, root$jscomp$0.errorRecoveryDisabledLanes & renderWasConcurrent)
                var JSCompiler_inline_result = 0;
              else
                JSCompiler_inline_result = root$jscomp$0.pendingLanes & -536870913, JSCompiler_inline_result = JSCompiler_inline_result !== 0 ? JSCompiler_inline_result : JSCompiler_inline_result & 536870912 ? 536870912 : 0;
              if (JSCompiler_inline_result !== 0) {
                lanes = JSCompiler_inline_result;
                a: {
                  var root2 = root$jscomp$0;
                  exitStatus = workInProgressRootConcurrentErrors;
                  var wasRootDehydrated = root2.current.memoizedState.isDehydrated;
                  if (wasRootDehydrated && (prepareFreshStack(root2, JSCompiler_inline_result).flags |= 256), JSCompiler_inline_result = renderRootSync(
                    root2,
                    JSCompiler_inline_result,
                    !1
                  ), JSCompiler_inline_result !== 2 && JSCompiler_inline_result !== 6) {
                    if (workInProgressRootDidAttachPingListener && !wasRootDehydrated) {
                      root2.errorRecoveryDisabledLanes |= renderWasConcurrent, workInProgressRootInterleavedUpdatedLanes |= renderWasConcurrent, exitStatus = 4;
                      break a;
                    }
                    renderWasConcurrent = workInProgressRootRecoverableErrors, workInProgressRootRecoverableErrors = exitStatus, renderWasConcurrent !== null && (workInProgressRootRecoverableErrors === null ? workInProgressRootRecoverableErrors = renderWasConcurrent : workInProgressRootRecoverableErrors.push.apply(
                      workInProgressRootRecoverableErrors,
                      renderWasConcurrent
                    ));
                  }
                  exitStatus = JSCompiler_inline_result;
                }
                if (renderWasConcurrent = !1, exitStatus !== 2) continue;
              }
            }
            if (exitStatus === 1) {
              prepareFreshStack(root$jscomp$0, 0), markRootSuspended(root$jscomp$0, lanes, 0, !0);
              break;
            }
            a: {
              switch (shouldTimeSlice = root$jscomp$0, renderWasConcurrent = exitStatus, renderWasConcurrent) {
                case 0:
                case 1:
                  throw Error(formatProdErrorMessage(345));
                case 4:
                  if ((lanes & 4194048) !== lanes && (lanes & 62914560) !== lanes)
                    break;
                case 6:
                  markRootSuspended(
                    shouldTimeSlice,
                    lanes,
                    workInProgressDeferredLane,
                    !workInProgressRootDidSkipSuspendedSiblings
                  );
                  break a;
                case 2:
                  workInProgressRootRecoverableErrors = null;
                  break;
                case 3:
                case 5:
                  break;
                default:
                  throw Error(formatProdErrorMessage(329));
              }
              if ((lanes & 62914560) === lanes && (exitStatus = globalMostRecentFallbackTime + 300 - now(), 10 < exitStatus)) {
                if (markRootSuspended(
                  shouldTimeSlice,
                  lanes,
                  workInProgressDeferredLane,
                  !workInProgressRootDidSkipSuspendedSiblings
                ), getNextLanes(shouldTimeSlice, 0, !0) !== 0) break a;
                pendingEffectsLanes = lanes, shouldTimeSlice.timeoutHandle = scheduleTimeout(
                  completeRootWhenReady.bind(
                    null,
                    shouldTimeSlice,
                    forceSync,
                    workInProgressRootRecoverableErrors,
                    workInProgressTransitions,
                    workInProgressRootDidIncludeRecursiveRenderUpdate,
                    lanes,
                    workInProgressDeferredLane,
                    workInProgressRootInterleavedUpdatedLanes,
                    workInProgressSuspendedRetryLanes,
                    workInProgressRootDidSkipSuspendedSiblings,
                    renderWasConcurrent,
                    "Throttled",
                    -0,
                    0
                  ),
                  exitStatus
                );
                break a;
              }
              completeRootWhenReady(
                shouldTimeSlice,
                forceSync,
                workInProgressRootRecoverableErrors,
                workInProgressTransitions,
                workInProgressRootDidIncludeRecursiveRenderUpdate,
                lanes,
                workInProgressDeferredLane,
                workInProgressRootInterleavedUpdatedLanes,
                workInProgressSuspendedRetryLanes,
                workInProgressRootDidSkipSuspendedSiblings,
                renderWasConcurrent,
                null,
                -0,
                0
              );
            }
          }
          break;
        } while (!0);
        ensureRootIsScheduled(root$jscomp$0);
      }
      function completeRootWhenReady(root2, finishedWork, recoverableErrors, transitions, didIncludeRenderPhaseUpdate, lanes, spawnedLane, updatedLanes, suspendedRetryLanes, didSkipSuspendedSiblings, exitStatus, suspendedCommitReason, completedRenderStartTime, completedRenderEndTime) {
        root2.timeoutHandle = -1;
        var subtreeFlags = finishedWork.subtreeFlags, isViewTransitionEligible = (lanes & 335544064) === lanes;
        if (suspendedCommitReason = null, (isViewTransitionEligible || subtreeFlags & 8192 || (subtreeFlags & 16785408) === 16785408) && (suspendedCommitReason = {
          stylesheets: null,
          count: 0,
          imgCount: 0,
          imgBytes: 0,
          suspenseyImages: [],
          waitingForImages: !0,
          waitingForViewTransition: !1,
          unsuspend: noop$1
        }, appearingViewTransitions = null, accumulateSuspenseyCommitOnFiber(
          finishedWork,
          lanes,
          suspendedCommitReason
        ), isViewTransitionEligible && (subtreeFlags = suspendedCommitReason, isViewTransitionEligible = root2.containerInfo, isViewTransitionEligible = (isViewTransitionEligible.nodeType === 9 ? isViewTransitionEligible : isViewTransitionEligible.ownerDocument).__reactViewTransition, isViewTransitionEligible != null && (subtreeFlags.count++, subtreeFlags.waitingForViewTransition = !0, subtreeFlags = onUnsuspend.bind(subtreeFlags), isViewTransitionEligible.finished.then(subtreeFlags, subtreeFlags))), subtreeFlags = (lanes & 62914560) === lanes ? globalMostRecentFallbackTime - now() : (lanes & 4194048) === lanes ? globalMostRecentTransitionTime - now() : 0, subtreeFlags = waitForCommitToBeReady(
          suspendedCommitReason,
          subtreeFlags
        ), subtreeFlags !== null)) {
          pendingEffectsLanes = lanes, root2.cancelPendingCommit = subtreeFlags(
            completeRoot.bind(
              null,
              root2,
              finishedWork,
              lanes,
              recoverableErrors,
              transitions,
              didIncludeRenderPhaseUpdate,
              spawnedLane,
              updatedLanes,
              suspendedRetryLanes,
              didSkipSuspendedSiblings,
              exitStatus,
              suspendedCommitReason,
              null,
              completedRenderStartTime,
              completedRenderEndTime
            )
          ), markRootSuspended(root2, lanes, spawnedLane, !didSkipSuspendedSiblings);
          return;
        }
        completeRoot(
          root2,
          finishedWork,
          lanes,
          recoverableErrors,
          transitions,
          didIncludeRenderPhaseUpdate,
          spawnedLane,
          updatedLanes,
          suspendedRetryLanes,
          didSkipSuspendedSiblings,
          exitStatus,
          suspendedCommitReason
        );
      }
      function isRenderConsistentWithExternalStores(finishedWork) {
        for (var node = finishedWork; ; ) {
          var tag = node.tag;
          if ((tag === 0 || tag === 11 || tag === 15) && node.flags & 16384 && (tag = node.updateQueue, tag !== null && (tag = tag.stores, tag !== null)))
            for (var i = 0; i < tag.length; i++) {
              var check = tag[i], getSnapshot = check.getSnapshot;
              check = check.value;
              try {
                if (!objectIs(getSnapshot(), check)) return !1;
              } catch {
                return !1;
              }
            }
          if (tag = node.child, node.subtreeFlags & 16384 && tag !== null)
            tag.return = node, node = tag;
          else {
            if (node === finishedWork) break;
            for (; node.sibling === null; ) {
              if (node.return === null || node.return === finishedWork) return !0;
              node = node.return;
            }
            node.sibling.return = node.return, node = node.sibling;
          }
        }
        return !0;
      }
      function markRootSuspended(root2, suspendedLanes, spawnedLane, didAttemptEntireTree) {
        suspendedLanes = getEntangledLanes(root2, suspendedLanes), suspendedLanes &= ~workInProgressRootPingedLanes, suspendedLanes &= ~workInProgressRootInterleavedUpdatedLanes, root2.suspendedLanes |= suspendedLanes, root2.pingedLanes &= ~suspendedLanes, didAttemptEntireTree && (root2.warmLanes |= suspendedLanes), didAttemptEntireTree = root2.expirationTimes;
        for (var lanes = suspendedLanes; 0 < lanes; ) {
          var index$6 = 31 - clz32(lanes), lane = 1 << index$6;
          didAttemptEntireTree[index$6] = -1, lanes &= ~lane;
        }
        spawnedLane !== 0 && markSpawnedDeferredLane(root2, spawnedLane, suspendedLanes);
      }
      function flushSyncWork$1() {
        return (executionContext & 6) === 0 ? (flushSyncWorkAcrossRoots_impl(0, !1), !1) : !0;
      }
      function resetWorkInProgressStack() {
        if (workInProgress !== null) {
          if (workInProgressSuspendedReason === 0)
            var interruptedWork = workInProgress.return;
          else
            interruptedWork = workInProgress, lastContextDependency = currentlyRenderingFiber$1 = null, resetHooksOnUnwind(interruptedWork), thenableState$1 = null, thenableIndexCounter$1 = 0, interruptedWork = workInProgress;
          for (; interruptedWork !== null; )
            unwindInterruptedWork(interruptedWork.alternate, interruptedWork), interruptedWork = interruptedWork.return;
          workInProgress = null;
        }
      }
      function prepareFreshStack(root2, lanes) {
        var timeoutHandle = root2.timeoutHandle;
        return timeoutHandle !== -1 && (root2.timeoutHandle = -1, cancelTimeout(timeoutHandle)), timeoutHandle = root2.cancelPendingCommit, timeoutHandle !== null && (root2.cancelPendingCommit = null, timeoutHandle()), pendingEffectsLanes = 0, resetWorkInProgressStack(), workInProgressRoot = root2, workInProgress = timeoutHandle = createWorkInProgress(root2.current, null), workInProgressRootRenderLanes = lanes, workInProgressSuspendedReason = 0, workInProgressThrownValue = null, workInProgressRootDidSkipSuspendedSiblings = !1, workInProgressRootIsPrerendering = checkIfRootIsPrerendering(root2, lanes), workInProgressRootDidAttachPingListener = !1, workInProgressSuspendedRetryLanes = workInProgressDeferredLane = workInProgressRootPingedLanes = workInProgressRootInterleavedUpdatedLanes = workInProgressRootSkippedLanes = workInProgressRootExitStatus = 0, workInProgressRootRecoverableErrors = workInProgressRootConcurrentErrors = null, workInProgressRootDidIncludeRecursiveRenderUpdate = !1, entangledRenderLanes = getEntangledLanes(root2, lanes), finishQueueingConcurrentUpdates(), timeoutHandle;
      }
      function handleThrow(root2, thrownValue) {
        currentlyRenderingFiber = null, ReactSharedInternals.H = ContextOnlyDispatcher, thrownValue === SuspenseException || thrownValue === SuspenseActionException ? (thrownValue = getSuspendedThenable(), workInProgressSuspendedReason = 3) : thrownValue === SuspenseyCommitException ? (thrownValue = getSuspendedThenable(), workInProgressSuspendedReason = 4) : workInProgressSuspendedReason = thrownValue === SelectiveHydrationException ? 8 : thrownValue !== null && typeof thrownValue == "object" && typeof thrownValue.then == "function" ? 6 : 1, workInProgressThrownValue = thrownValue, workInProgress === null && (workInProgressRootExitStatus = 1, logUncaughtError(
          root2,
          createCapturedValueAtFiber(thrownValue, root2.current)
        ));
      }
      function shouldRemainOnPreviousScreen() {
        var handler = suspenseHandlerStackCursor.current;
        return handler === null ? !0 : (workInProgressRootRenderLanes & 4194048) === workInProgressRootRenderLanes ? shellBoundary === null : (workInProgressRootRenderLanes & 62914560) === workInProgressRootRenderLanes || (workInProgressRootRenderLanes & 536870912) !== 0 ? handler === shellBoundary : !1;
      }
      function pushDispatcher() {
        var prevDispatcher = ReactSharedInternals.H;
        return ReactSharedInternals.H = ContextOnlyDispatcher, prevDispatcher === null ? ContextOnlyDispatcher : prevDispatcher;
      }
      function pushAsyncDispatcher() {
        var prevAsyncDispatcher = ReactSharedInternals.A;
        return ReactSharedInternals.A = DefaultAsyncDispatcher, prevAsyncDispatcher;
      }
      function renderDidSuspendDelayIfPossible() {
        workInProgressRootExitStatus = 4, workInProgressRootDidSkipSuspendedSiblings || (workInProgressRootRenderLanes & 4194048) !== workInProgressRootRenderLanes && suspenseHandlerStackCursor.current !== null || (workInProgressRootIsPrerendering = !0), (workInProgressRootSkippedLanes & 134217727) === 0 && (workInProgressRootInterleavedUpdatedLanes & 134217727) === 0 || workInProgressRoot === null || markRootSuspended(
          workInProgressRoot,
          workInProgressRootRenderLanes,
          workInProgressDeferredLane,
          !1
        );
      }
      function renderRootSync(root2, lanes, shouldYieldForPrerendering) {
        var prevExecutionContext = executionContext;
        executionContext |= 2;
        var prevDispatcher = pushDispatcher(), prevAsyncDispatcher = pushAsyncDispatcher();
        (workInProgressRoot !== root2 || workInProgressRootRenderLanes !== lanes) && (workInProgressTransitions = null, prepareFreshStack(root2, lanes)), lanes = !1;
        var exitStatus = workInProgressRootExitStatus;
        a: do
          try {
            if (workInProgressSuspendedReason !== 0 && workInProgress !== null) {
              var unitOfWork = workInProgress, thrownValue = workInProgressThrownValue;
              switch (workInProgressSuspendedReason) {
                case 8:
                  resetWorkInProgressStack(), exitStatus = 6;
                  break a;
                case 3:
                case 2:
                case 9:
                case 6:
                  suspenseHandlerStackCursor.current === null && (lanes = !0);
                  var reason = workInProgressSuspendedReason;
                  if (workInProgressSuspendedReason = 0, workInProgressThrownValue = null, throwAndUnwindWorkLoop(root2, unitOfWork, thrownValue, reason), shouldYieldForPrerendering && workInProgressRootIsPrerendering) {
                    exitStatus = 0;
                    break a;
                  }
                  break;
                default:
                  reason = workInProgressSuspendedReason, workInProgressSuspendedReason = 0, workInProgressThrownValue = null, throwAndUnwindWorkLoop(root2, unitOfWork, thrownValue, reason);
              }
            }
            workLoopSync(), exitStatus = workInProgressRootExitStatus;
            break;
          } catch (thrownValue$184) {
            handleThrow(root2, thrownValue$184);
          }
        while (!0);
        return lanes && root2.shellSuspendCounter++, lastContextDependency = currentlyRenderingFiber$1 = null, executionContext = prevExecutionContext, ReactSharedInternals.H = prevDispatcher, ReactSharedInternals.A = prevAsyncDispatcher, workInProgress === null && (workInProgressRoot = null, workInProgressRootRenderLanes = 0, finishQueueingConcurrentUpdates()), exitStatus;
      }
      function workLoopSync() {
        for (; workInProgress !== null; ) performUnitOfWork(workInProgress);
      }
      function renderRootConcurrent(root2, lanes) {
        var prevExecutionContext = executionContext;
        executionContext |= 2;
        var prevDispatcher = pushDispatcher(), prevAsyncDispatcher = pushAsyncDispatcher();
        workInProgressRoot !== root2 || workInProgressRootRenderLanes !== lanes ? (workInProgressTransitions = null, workInProgressRootRenderTargetTime = now() + 500, prepareFreshStack(root2, lanes)) : workInProgressRootIsPrerendering = checkIfRootIsPrerendering(
          root2,
          lanes
        );
        a: do
          try {
            if (workInProgressSuspendedReason !== 0 && workInProgress !== null) {
              lanes = workInProgress;
              var thrownValue = workInProgressThrownValue;
              b: switch (workInProgressSuspendedReason) {
                case 1:
                  workInProgressSuspendedReason = 0, workInProgressThrownValue = null, throwAndUnwindWorkLoop(root2, lanes, thrownValue, 1);
                  break;
                case 2:
                case 9:
                  if (isThenableResolved(thrownValue)) {
                    workInProgressSuspendedReason = 0, workInProgressThrownValue = null, replaySuspendedUnitOfWork(lanes);
                    break;
                  }
                  lanes = function() {
                    workInProgressSuspendedReason !== 2 && workInProgressSuspendedReason !== 9 || workInProgressRoot !== root2 || (workInProgressSuspendedReason = 7), ensureRootIsScheduled(root2);
                  }, thrownValue.then(lanes, lanes);
                  break a;
                case 3:
                  workInProgressSuspendedReason = 7;
                  break a;
                case 4:
                  workInProgressSuspendedReason = 5;
                  break a;
                case 7:
                  isThenableResolved(thrownValue) ? (workInProgressSuspendedReason = 0, workInProgressThrownValue = null, replaySuspendedUnitOfWork(lanes)) : (workInProgressSuspendedReason = 0, workInProgressThrownValue = null, throwAndUnwindWorkLoop(root2, lanes, thrownValue, 7));
                  break;
                case 5:
                  var resource = null;
                  switch (workInProgress.tag) {
                    case 26:
                      resource = workInProgress.memoizedState;
                    case 5:
                    case 27:
                      var hostFiber = workInProgress;
                      if (resource ? preloadResource(resource) : hostFiber.stateNode.complete) {
                        workInProgressSuspendedReason = 0, workInProgressThrownValue = null;
                        var sibling = hostFiber.sibling;
                        if (sibling !== null) workInProgress = sibling;
                        else {
                          var returnFiber = hostFiber.return;
                          returnFiber !== null ? (workInProgress = returnFiber, completeUnitOfWork(returnFiber)) : workInProgress = null;
                        }
                        break b;
                      }
                  }
                  workInProgressSuspendedReason = 0, workInProgressThrownValue = null, throwAndUnwindWorkLoop(root2, lanes, thrownValue, 5);
                  break;
                case 6:
                  workInProgressSuspendedReason = 0, workInProgressThrownValue = null, throwAndUnwindWorkLoop(root2, lanes, thrownValue, 6);
                  break;
                case 8:
                  resetWorkInProgressStack(), workInProgressRootExitStatus = 6;
                  break a;
                default:
                  throw Error(formatProdErrorMessage(462));
              }
            }
            workLoopConcurrentByScheduler();
            break;
          } catch (thrownValue$186) {
            handleThrow(root2, thrownValue$186);
          }
        while (!0);
        return lastContextDependency = currentlyRenderingFiber$1 = null, ReactSharedInternals.H = prevDispatcher, ReactSharedInternals.A = prevAsyncDispatcher, executionContext = prevExecutionContext, workInProgress !== null ? 0 : (workInProgressRoot = null, workInProgressRootRenderLanes = 0, finishQueueingConcurrentUpdates(), workInProgressRootExitStatus);
      }
      function workLoopConcurrentByScheduler() {
        for (; workInProgress !== null && !shouldYield(); )
          performUnitOfWork(workInProgress);
      }
      function performUnitOfWork(unitOfWork) {
        var next = beginWork(unitOfWork.alternate, unitOfWork, entangledRenderLanes);
        unitOfWork.memoizedProps = unitOfWork.pendingProps, next === null ? completeUnitOfWork(unitOfWork) : workInProgress = next;
      }
      function replaySuspendedUnitOfWork(unitOfWork) {
        var next = unitOfWork, current2 = next.alternate;
        switch (next.tag) {
          case 15:
          case 0:
            next = replayFunctionComponent(
              current2,
              next,
              next.pendingProps,
              next.type,
              void 0,
              workInProgressRootRenderLanes
            );
            break;
          case 11:
            next = replayFunctionComponent(
              current2,
              next,
              next.pendingProps,
              next.type.render,
              next.ref,
              workInProgressRootRenderLanes
            );
            break;
          case 5:
            resetHooksOnUnwind(next);
            var fiber = next;
            fiber === hydrationParentFiber && (isHydrating ? (popToNextHostParent(fiber), fiber.tag === 5 && fiber.stateNode != null && (nextHydratableInstance = fiber.stateNode)) : (popToNextHostParent(fiber), isHydrating = !0));
          default:
            unwindInterruptedWork(current2, next), next = workInProgress = resetWorkInProgress(next, entangledRenderLanes), next = beginWork(current2, next, entangledRenderLanes);
        }
        unitOfWork.memoizedProps = unitOfWork.pendingProps, next === null ? completeUnitOfWork(unitOfWork) : workInProgress = next;
      }
      function throwAndUnwindWorkLoop(root2, unitOfWork, thrownValue, suspendedReason) {
        lastContextDependency = currentlyRenderingFiber$1 = null, resetHooksOnUnwind(unitOfWork), thenableState$1 = null, thenableIndexCounter$1 = 0;
        var returnFiber = unitOfWork.return;
        try {
          if (throwException(
            root2,
            returnFiber,
            unitOfWork,
            thrownValue,
            workInProgressRootRenderLanes
          )) {
            workInProgressRootExitStatus = 1, logUncaughtError(
              root2,
              createCapturedValueAtFiber(thrownValue, root2.current)
            ), workInProgress = null;
            return;
          }
        } catch (error) {
          if (returnFiber !== null) throw workInProgress = returnFiber, error;
          workInProgressRootExitStatus = 1, logUncaughtError(
            root2,
            createCapturedValueAtFiber(thrownValue, root2.current)
          ), workInProgress = null;
          return;
        }
        unitOfWork.flags & 32768 ? (isHydrating || suspendedReason === 1 ? root2 = !0 : workInProgressRootIsPrerendering || (workInProgressRootRenderLanes & 536870912) !== 0 ? root2 = !1 : (workInProgressRootDidSkipSuspendedSiblings = root2 = !0, (suspendedReason === 2 || suspendedReason === 9 || suspendedReason === 3 || suspendedReason === 6) && (suspendedReason = suspenseHandlerStackCursor.current, suspendedReason !== null && suspendedReason.tag === 13 && (suspendedReason.flags |= 16384))), unwindUnitOfWork(unitOfWork, root2)) : completeUnitOfWork(unitOfWork);
      }
      function completeUnitOfWork(unitOfWork) {
        var completedWork = unitOfWork;
        do {
          if ((completedWork.flags & 32768) !== 0) {
            unwindUnitOfWork(
              completedWork,
              workInProgressRootDidSkipSuspendedSiblings
            );
            return;
          }
          unitOfWork = completedWork.return;
          var next = completeWork(
            completedWork.alternate,
            completedWork,
            entangledRenderLanes
          );
          if (next !== null) {
            workInProgress = next;
            return;
          }
          if (completedWork = completedWork.sibling, completedWork !== null) {
            workInProgress = completedWork;
            return;
          }
          workInProgress = completedWork = unitOfWork;
        } while (completedWork !== null);
        workInProgressRootExitStatus === 0 && (workInProgressRootExitStatus = 5);
      }
      function unwindUnitOfWork(unitOfWork, skipSiblings) {
        do {
          var next = unwindWork(unitOfWork.alternate, unitOfWork);
          if (next !== null) {
            next.flags &= 32767, workInProgress = next;
            return;
          }
          if (next = unitOfWork.return, next !== null && (next.flags |= 32768, next.subtreeFlags = 0, next.deletions = null), !skipSiblings && (unitOfWork = unitOfWork.sibling, unitOfWork !== null)) {
            workInProgress = unitOfWork;
            return;
          }
          workInProgress = unitOfWork = next;
        } while (unitOfWork !== null);
        workInProgressRootExitStatus = 6, workInProgress = null;
      }
      function completeRoot(root2, finishedWork, lanes, recoverableErrors, transitions, didIncludeRenderPhaseUpdate, spawnedLane, updatedLanes, suspendedRetryLanes, didSkipSuspendedSiblings, exitStatus, suspendedState) {
        root2.cancelPendingCommit = null;
        do
          flushPendingEffects();
        while (pendingEffectsStatus !== 0);
        if ((executionContext & 6) !== 0) throw Error(formatProdErrorMessage(327));
        if (finishedWork !== null) {
          if (finishedWork === root2.current) throw Error(formatProdErrorMessage(177));
          root2 === workInProgressRoot && (workInProgress = workInProgressRoot = null, workInProgressRootRenderLanes = 0), pendingFinishedWork = finishedWork, pendingEffectsRoot = root2, pendingEffectsLanes = lanes, pendingPassiveTransitions = transitions, pendingRecoverableErrors = recoverableErrors, commitRoot(
            root2,
            finishedWork,
            lanes,
            spawnedLane,
            updatedLanes,
            suspendedRetryLanes,
            suspendedState
          );
        }
      }
      function commitRoot(root2, finishedWork, lanes, spawnedLane, updatedLanes, suspendedRetryLanes, suspendedState) {
        var remainingLanes = finishedWork.lanes | finishedWork.childLanes;
        if (pendingEffectsRemainingLanes = remainingLanes, remainingLanes |= concurrentlyUpdatedLanes, markRootFinished(
          root2,
          lanes,
          remainingLanes,
          spawnedLane,
          updatedLanes,
          suspendedRetryLanes
        ), pendingViewTransitionEvents = null, (lanes & 335544064) === lanes ? (pendingTransitionTypes = claimQueuedTransitionTypes(root2), spawnedLane = 10262) : (pendingTransitionTypes = null, spawnedLane = 10256), (finishedWork.subtreeFlags & spawnedLane) !== 0 || (finishedWork.flags & spawnedLane) !== 0 ? (root2.callbackNode = null, root2.callbackPriority = 0, scheduleCallback$1(NormalPriority$1, function() {
          return flushPassiveEffects(), null;
        })) : (root2.callbackNode = null, root2.callbackPriority = 0), shouldStartViewTransition = !1, spawnedLane = (finishedWork.flags & 13878) !== 0, (finishedWork.subtreeFlags & 13878) !== 0 || spawnedLane) {
          spawnedLane = ReactSharedInternals.T, ReactSharedInternals.T = null, updatedLanes = ReactDOMSharedInternals.p, ReactDOMSharedInternals.p = 2, suspendedRetryLanes = executionContext, executionContext |= 4;
          try {
            commitBeforeMutationEffects(root2, finishedWork, lanes);
          } finally {
            executionContext = suspendedRetryLanes, ReactDOMSharedInternals.p = updatedLanes, ReactSharedInternals.T = spawnedLane;
          }
        }
        pendingEffectsStatus = 1, shouldStartViewTransition ? pendingViewTransition = startViewTransition(
          suspendedState,
          root2.containerInfo,
          pendingTransitionTypes,
          flushMutationEffects,
          flushLayoutEffects,
          flushAfterMutationEffects,
          flushSpawnedWork,
          flushPassiveEffects,
          reportViewTransitionError,
          null,
          null
        ) : (flushMutationEffects(), flushLayoutEffects(), flushSpawnedWork());
      }
      function reportViewTransitionError(error) {
        if (pendingEffectsStatus !== 0) {
          var onRecoverableError = pendingEffectsRoot.onRecoverableError;
          onRecoverableError(error, { componentStack: null });
        }
      }
      function flushAfterMutationEffects() {
        pendingEffectsStatus === 3 && (pendingEffectsStatus = 0, commitAfterMutationEffectsOnFiber(pendingFinishedWork, pendingEffectsRoot), pendingEffectsStatus = 4);
      }
      function flushMutationEffects() {
        if (pendingEffectsStatus === 1) {
          pendingEffectsStatus = 0;
          var root2 = pendingEffectsRoot, finishedWork = pendingFinishedWork, lanes = pendingEffectsLanes, rootMutationHasEffect = (finishedWork.flags & 13878) !== 0;
          if ((finishedWork.subtreeFlags & 13878) !== 0 || rootMutationHasEffect) {
            rootMutationHasEffect = ReactSharedInternals.T, ReactSharedInternals.T = null;
            var previousPriority = ReactDOMSharedInternals.p;
            ReactDOMSharedInternals.p = 2;
            var prevExecutionContext = executionContext;
            executionContext |= 4;
            try {
              inUpdateViewTransition = rootViewTransitionAffected = !1, commitMutationEffectsOnFiber(finishedWork, root2, lanes), lanes = selectionInformation;
              var curFocusedElem = getActiveElementDeep(root2.containerInfo), priorFocusedElem = lanes.focusedElem, priorSelectionRange = lanes.selectionRange;
              if (curFocusedElem !== priorFocusedElem && priorFocusedElem && priorFocusedElem.ownerDocument && containsNode(
                priorFocusedElem.ownerDocument.documentElement,
                priorFocusedElem
              )) {
                if (priorSelectionRange !== null && hasSelectionCapabilities(priorFocusedElem)) {
                  var start = priorSelectionRange.start, end = priorSelectionRange.end;
                  if (end === void 0 && (end = start), "selectionStart" in priorFocusedElem)
                    priorFocusedElem.selectionStart = start, priorFocusedElem.selectionEnd = Math.min(
                      end,
                      priorFocusedElem.value.length
                    );
                  else {
                    var doc = priorFocusedElem.ownerDocument || document, win = doc && doc.defaultView || window;
                    if (win.getSelection) {
                      var selection = win.getSelection(), length = priorFocusedElem.textContent.length, start$jscomp$0 = Math.min(priorSelectionRange.start, length), end$jscomp$0 = priorSelectionRange.end === void 0 ? start$jscomp$0 : Math.min(priorSelectionRange.end, length);
                      !selection.extend && start$jscomp$0 > end$jscomp$0 && (curFocusedElem = end$jscomp$0, end$jscomp$0 = start$jscomp$0, start$jscomp$0 = curFocusedElem);
                      var startMarker = getNodeForCharacterOffset(
                        priorFocusedElem,
                        start$jscomp$0
                      ), endMarker = getNodeForCharacterOffset(
                        priorFocusedElem,
                        end$jscomp$0
                      );
                      if (startMarker && endMarker && (selection.rangeCount !== 1 || selection.anchorNode !== startMarker.node || selection.anchorOffset !== startMarker.offset || selection.focusNode !== endMarker.node || selection.focusOffset !== endMarker.offset)) {
                        var range = doc.createRange();
                        range.setStart(startMarker.node, startMarker.offset), selection.removeAllRanges(), start$jscomp$0 > end$jscomp$0 ? (selection.addRange(range), selection.extend(endMarker.node, endMarker.offset)) : (range.setEnd(endMarker.node, endMarker.offset), selection.addRange(range));
                      }
                    }
                  }
                }
                for (doc = [], selection = priorFocusedElem; selection = selection.parentNode; )
                  selection.nodeType === 1 && doc.push({
                    element: selection,
                    left: selection.scrollLeft,
                    top: selection.scrollTop
                  });
                for (typeof priorFocusedElem.focus == "function" && priorFocusedElem.focus(), priorFocusedElem = 0; priorFocusedElem < doc.length; priorFocusedElem++) {
                  var info = doc[priorFocusedElem];
                  info.element.scrollLeft = info.left, info.element.scrollTop = info.top;
                }
              }
              _enabled = !!eventsEnabled, selectionInformation = eventsEnabled = null;
            } finally {
              executionContext = prevExecutionContext, ReactDOMSharedInternals.p = previousPriority, ReactSharedInternals.T = rootMutationHasEffect;
            }
          }
          root2.current = finishedWork, pendingEffectsStatus = 2;
        }
      }
      function flushLayoutEffects() {
        if (pendingEffectsStatus === 2) {
          pendingEffectsStatus = 0;
          var root2 = pendingEffectsRoot, finishedWork = pendingFinishedWork, rootHasLayoutEffect = (finishedWork.flags & 8772) !== 0;
          if ((finishedWork.subtreeFlags & 8772) !== 0 || rootHasLayoutEffect) {
            rootHasLayoutEffect = ReactSharedInternals.T, ReactSharedInternals.T = null;
            var previousPriority = ReactDOMSharedInternals.p;
            ReactDOMSharedInternals.p = 2;
            var prevExecutionContext = executionContext;
            executionContext |= 4;
            try {
              commitLayoutEffectOnFiber(root2, finishedWork.alternate, finishedWork);
            } finally {
              executionContext = prevExecutionContext, ReactDOMSharedInternals.p = previousPriority, ReactSharedInternals.T = rootHasLayoutEffect;
            }
          }
          pendingEffectsStatus = 3;
        }
      }
      function flushSpawnedWork() {
        if (pendingEffectsStatus === 4 || pendingEffectsStatus === 3) {
          pendingEffectsStatus = 0;
          var committedViewTransition = pendingViewTransition;
          pendingViewTransition = null, requestPaint();
          var root2 = pendingEffectsRoot, finishedWork = pendingFinishedWork, lanes = pendingEffectsLanes, recoverableErrors = pendingRecoverableErrors, passiveSubtreeMask = (lanes & 335544064) === lanes ? 10262 : 10256;
          if ((finishedWork.subtreeFlags & passiveSubtreeMask) !== 0 || (finishedWork.flags & passiveSubtreeMask) !== 0 ? pendingEffectsStatus = 5 : (pendingEffectsStatus = 0, pendingFinishedWork = pendingEffectsRoot = null, releaseRootPooledCache(root2, root2.pendingLanes)), passiveSubtreeMask = root2.pendingLanes, passiveSubtreeMask === 0 && (legacyErrorBoundariesThatAlreadyFailed = null), lanesToEventPriority(lanes), finishedWork = finishedWork.stateNode, injectedHook && typeof injectedHook.onCommitFiberRoot == "function")
            try {
              injectedHook.onCommitFiberRoot(
                rendererID,
                finishedWork,
                void 0,
                (finishedWork.current.flags & 128) === 128
              );
            } catch {
            }
          if (recoverableErrors !== null) {
            finishedWork = ReactSharedInternals.T, passiveSubtreeMask = ReactDOMSharedInternals.p, ReactDOMSharedInternals.p = 2, ReactSharedInternals.T = null;
            try {
              for (var onRecoverableError = root2.onRecoverableError, i = 0; i < recoverableErrors.length; i++) {
                var recoverableError = recoverableErrors[i];
                onRecoverableError(recoverableError.value, {
                  componentStack: recoverableError.stack
                });
              }
            } finally {
              ReactSharedInternals.T = finishedWork, ReactDOMSharedInternals.p = passiveSubtreeMask;
            }
          }
          if (recoverableErrors = pendingViewTransitionEvents, onRecoverableError = pendingTransitionTypes, pendingTransitionTypes = null, recoverableErrors !== null && (pendingViewTransitionEvents = null, onRecoverableError === null && (onRecoverableError = []), committedViewTransition !== null))
            for (recoverableError = 0; recoverableError < recoverableErrors.length; recoverableError++)
              finishedWork = (0, recoverableErrors[recoverableError])(
                onRecoverableError
              ), finishedWork !== void 0 && committedViewTransition.finished.finally(finishedWork);
          (pendingEffectsLanes & 3) !== 0 && flushPendingEffects(), ensureRootIsScheduled(root2), passiveSubtreeMask = root2.pendingLanes, (lanes & 261930) !== 0 && (passiveSubtreeMask & 42) !== 0 ? root2 === rootWithNestedUpdates ? nestedUpdateCount++ : (nestedUpdateCount = 0, rootWithNestedUpdates = root2) : (nestedUpdateCount = 0, rootWithNestedUpdates = null), flushSyncWorkAcrossRoots_impl(0, !1);
        }
      }
      function releaseRootPooledCache(root2, remainingLanes) {
        (root2.pooledCacheLanes &= remainingLanes) === 0 && (remainingLanes = root2.pooledCache, remainingLanes != null && (root2.pooledCache = null, releaseCache(remainingLanes)));
      }
      function flushPendingEffects() {
        return pendingViewTransition !== null && (pendingViewTransition.skipTransition(), pendingViewTransition = null), flushMutationEffects(), flushLayoutEffects(), flushSpawnedWork(), flushPassiveEffects();
      }
      function flushPassiveEffects() {
        if (pendingEffectsStatus !== 5) return !1;
        var root2 = pendingEffectsRoot, remainingLanes = pendingEffectsRemainingLanes;
        pendingEffectsRemainingLanes = 0;
        var renderPriority = lanesToEventPriority(pendingEffectsLanes), prevTransition = ReactSharedInternals.T, previousPriority = ReactDOMSharedInternals.p;
        try {
          ReactDOMSharedInternals.p = 32 > renderPriority ? 32 : renderPriority, ReactSharedInternals.T = null, renderPriority = pendingPassiveTransitions, pendingPassiveTransitions = null;
          var root$jscomp$0 = pendingEffectsRoot, lanes = pendingEffectsLanes;
          if (pendingEffectsStatus = 0, pendingFinishedWork = pendingEffectsRoot = null, pendingEffectsLanes = 0, (executionContext & 6) !== 0) throw Error(formatProdErrorMessage(331));
          var prevExecutionContext = executionContext;
          if (executionContext |= 4, commitPassiveUnmountOnFiber(root$jscomp$0.current), commitPassiveMountOnFiber(
            root$jscomp$0,
            root$jscomp$0.current,
            lanes,
            renderPriority
          ), executionContext = prevExecutionContext, flushSyncWorkAcrossRoots_impl(0, !1), injectedHook && typeof injectedHook.onPostCommitFiberRoot == "function")
            try {
              injectedHook.onPostCommitFiberRoot(rendererID, root$jscomp$0);
            } catch {
            }
          return !0;
        } finally {
          ReactDOMSharedInternals.p = previousPriority, ReactSharedInternals.T = prevTransition, releaseRootPooledCache(root2, remainingLanes);
        }
      }
      function captureCommitPhaseErrorOnRoot(rootFiber, sourceFiber, error) {
        sourceFiber = createCapturedValueAtFiber(error, sourceFiber), sourceFiber = createRootErrorUpdate(rootFiber.stateNode, sourceFiber, 2), rootFiber = enqueueUpdate(rootFiber, sourceFiber, 2), rootFiber !== null && (markRootUpdated$1(rootFiber, 2), ensureRootIsScheduled(rootFiber));
      }
      function captureCommitPhaseError(sourceFiber, nearestMountedAncestor, error) {
        if (sourceFiber.tag === 3)
          captureCommitPhaseErrorOnRoot(sourceFiber, sourceFiber, error);
        else
          for (; nearestMountedAncestor !== null; ) {
            if (nearestMountedAncestor.tag === 3) {
              captureCommitPhaseErrorOnRoot(
                nearestMountedAncestor,
                sourceFiber,
                error
              );
              break;
            } else if (nearestMountedAncestor.tag === 1) {
              var instance = nearestMountedAncestor.stateNode;
              if (typeof nearestMountedAncestor.type.getDerivedStateFromError == "function" || typeof instance.componentDidCatch == "function" && (legacyErrorBoundariesThatAlreadyFailed === null || !legacyErrorBoundariesThatAlreadyFailed.has(instance))) {
                sourceFiber = createCapturedValueAtFiber(error, sourceFiber), error = createClassErrorUpdate(2), instance = enqueueUpdate(nearestMountedAncestor, error, 2), instance !== null && (initializeClassErrorUpdate(
                  error,
                  instance,
                  nearestMountedAncestor,
                  sourceFiber
                ), markRootUpdated$1(instance, 2), ensureRootIsScheduled(instance));
                break;
              }
            }
            nearestMountedAncestor = nearestMountedAncestor.return;
          }
      }
      function attachPingListener(root2, wakeable, lanes) {
        var pingCache = root2.pingCache;
        if (pingCache === null) {
          pingCache = root2.pingCache = new PossiblyWeakMap();
          var threadIDs = /* @__PURE__ */ new Set();
          pingCache.set(wakeable, threadIDs);
        } else
          threadIDs = pingCache.get(wakeable), threadIDs === void 0 && (threadIDs = /* @__PURE__ */ new Set(), pingCache.set(wakeable, threadIDs));
        threadIDs.has(lanes) || (workInProgressRootDidAttachPingListener = !0, threadIDs.add(lanes), root2 = pingSuspendedRoot.bind(null, root2, wakeable, lanes), wakeable.then(root2, root2));
      }
      function pingSuspendedRoot(root2, wakeable, pingedLanes) {
        var pingCache = root2.pingCache;
        pingCache !== null && pingCache.delete(wakeable), root2.pingedLanes |= root2.suspendedLanes & pingedLanes, root2.warmLanes &= ~pingedLanes, workInProgressRoot === root2 && (workInProgressRootRenderLanes & pingedLanes) === pingedLanes && ((workInProgressRootExitStatus === 4 || workInProgressRootExitStatus === 3 && (workInProgressRootRenderLanes & 62914560) === workInProgressRootRenderLanes && 300 > now() - globalMostRecentFallbackTime) && (executionContext & 2) === 0 ? prepareFreshStack(root2, 0) : workInProgressRootPingedLanes |= pingedLanes, workInProgressSuspendedRetryLanes === workInProgressRootRenderLanes && (workInProgressSuspendedRetryLanes = 0)), ensureRootIsScheduled(root2);
      }
      function retryTimedOutBoundary(boundaryFiber, retryLane) {
        retryLane === 0 && (retryLane = claimNextRetryLane()), boundaryFiber = enqueueConcurrentRenderForLane(boundaryFiber, retryLane), boundaryFiber !== null && (markRootUpdated$1(boundaryFiber, retryLane), ensureRootIsScheduled(boundaryFiber));
      }
      function retryDehydratedSuspenseBoundary(boundaryFiber) {
        var suspenseState = boundaryFiber.memoizedState, retryLane = 0;
        suspenseState !== null && (retryLane = suspenseState.retryLane), retryTimedOutBoundary(boundaryFiber, retryLane);
      }
      function resolveRetryWakeable(boundaryFiber, wakeable) {
        var retryLane = 0;
        switch (boundaryFiber.tag) {
          case 31:
          case 13:
            var retryCache = boundaryFiber.stateNode, suspenseState = boundaryFiber.memoizedState;
            suspenseState !== null && (retryLane = suspenseState.retryLane);
            break;
          case 19:
            retryCache = boundaryFiber.stateNode;
            break;
          case 22:
            retryCache = boundaryFiber.stateNode._retryCache;
            break;
          default:
            throw Error(formatProdErrorMessage(314));
        }
        retryCache !== null && retryCache.delete(wakeable), retryTimedOutBoundary(boundaryFiber, retryLane);
      }
      function scheduleCallback$1(priorityLevel, callback) {
        return scheduleCallback$3(priorityLevel, callback);
      }
      var firstScheduledRoot = null, lastScheduledRoot = null, didScheduleMicrotask = !1, mightHavePendingSyncWork = !1, isFlushingWork = !1, currentEventTransitionLane = 0;
      function ensureRootIsScheduled(root2) {
        root2 !== lastScheduledRoot && root2.next === null && (lastScheduledRoot === null ? firstScheduledRoot = lastScheduledRoot = root2 : lastScheduledRoot = lastScheduledRoot.next = root2), mightHavePendingSyncWork = !0, didScheduleMicrotask || (didScheduleMicrotask = !0, scheduleImmediateRootScheduleTask());
      }
      function flushSyncWorkAcrossRoots_impl(syncTransitionLanes, onlyLegacy) {
        if (!isFlushingWork && mightHavePendingSyncWork) {
          isFlushingWork = !0;
          do
            for (var didPerformSomeWork = !1, root$190 = firstScheduledRoot; root$190 !== null; ) {
              if (!onlyLegacy)
                if (syncTransitionLanes !== 0) {
                  var pendingLanes = root$190.pendingLanes;
                  if (pendingLanes === 0) var JSCompiler_inline_result = 0;
                  else {
                    var suspendedLanes = root$190.suspendedLanes, pingedLanes = root$190.pingedLanes;
                    JSCompiler_inline_result = (1 << 31 - clz32(42 | syncTransitionLanes) + 1) - 1, JSCompiler_inline_result &= pendingLanes & ~(suspendedLanes & ~pingedLanes), JSCompiler_inline_result = JSCompiler_inline_result & 201326741 ? JSCompiler_inline_result & 201326741 | 1 : JSCompiler_inline_result ? JSCompiler_inline_result | 2 : 0;
                  }
                  JSCompiler_inline_result !== 0 && (didPerformSomeWork = !0, performSyncWorkOnRoot(root$190, JSCompiler_inline_result));
                } else
                  JSCompiler_inline_result = workInProgressRootRenderLanes, JSCompiler_inline_result = getNextLanes(
                    root$190,
                    root$190 === workInProgressRoot ? JSCompiler_inline_result : 0,
                    root$190.cancelPendingCommit !== null || root$190.timeoutHandle !== -1
                  ), (JSCompiler_inline_result & 3) === 0 || checkIfRootIsPrerendering(root$190, JSCompiler_inline_result) || (didPerformSomeWork = !0, performSyncWorkOnRoot(root$190, JSCompiler_inline_result));
              root$190 = root$190.next;
            }
          while (didPerformSomeWork);
          isFlushingWork = !1;
        }
      }
      function processRootScheduleInImmediateTask() {
        processRootScheduleInMicrotask();
      }
      function processRootScheduleInMicrotask() {
        mightHavePendingSyncWork = didScheduleMicrotask = !1;
        var syncTransitionLanes = 0;
        currentEventTransitionLane !== 0 && shouldAttemptEagerTransition() && (syncTransitionLanes = currentEventTransitionLane);
        for (var currentTime = now(), prev = null, root2 = firstScheduledRoot; root2 !== null; ) {
          var next = root2.next, nextLanes = scheduleTaskForRootDuringMicrotask(root2, currentTime);
          nextLanes === 0 ? (root2.next = null, prev === null ? firstScheduledRoot = next : prev.next = next, next === null && (lastScheduledRoot = prev)) : (prev = root2, (syncTransitionLanes !== 0 || (nextLanes & 3) !== 0) && (mightHavePendingSyncWork = !0)), root2 = next;
        }
        pendingEffectsStatus !== 0 && pendingEffectsStatus !== 5 || flushSyncWorkAcrossRoots_impl(syncTransitionLanes, !1), currentEventTransitionLane !== 0 && (currentEventTransitionLane = 0);
      }
      function scheduleTaskForRootDuringMicrotask(root2, currentTime) {
        for (var suspendedLanes = root2.suspendedLanes, pingedLanes = root2.pingedLanes, expirationTimes = root2.expirationTimes, lanes = root2.pendingLanes & -62914561; 0 < lanes; ) {
          var index$5 = 31 - clz32(lanes), lane = 1 << index$5, expirationTime = expirationTimes[index$5];
          expirationTime === -1 ? ((lane & suspendedLanes) === 0 || (lane & pingedLanes) !== 0) && (expirationTimes[index$5] = computeExpirationTime(lane, currentTime)) : expirationTime <= currentTime && (root2.expiredLanes |= lane), lanes &= ~lane;
        }
        if (currentTime = workInProgressRoot, suspendedLanes = workInProgressRootRenderLanes, suspendedLanes = getNextLanes(
          root2,
          root2 === currentTime ? suspendedLanes : 0,
          root2.cancelPendingCommit !== null || root2.timeoutHandle !== -1
        ), pingedLanes = root2.callbackNode, suspendedLanes === 0 || root2 === currentTime && (workInProgressSuspendedReason === 2 || workInProgressSuspendedReason === 9) || root2.cancelPendingCommit !== null)
          return pingedLanes !== null && pingedLanes !== null && cancelCallback$1(pingedLanes), root2.callbackNode = null, root2.callbackPriority = 0;
        if ((suspendedLanes & 3) === 0 || checkIfRootIsPrerendering(root2, suspendedLanes)) {
          if (currentTime = suspendedLanes & -suspendedLanes, currentTime === root2.callbackPriority) return currentTime;
          switch (pingedLanes !== null && cancelCallback$1(pingedLanes), lanesToEventPriority(suspendedLanes)) {
            case 2:
            case 8:
              suspendedLanes = UserBlockingPriority;
              break;
            case 32:
              suspendedLanes = NormalPriority$1;
              break;
            case 268435456:
              suspendedLanes = IdlePriority;
              break;
            default:
              suspendedLanes = NormalPriority$1;
          }
          return pingedLanes = performWorkOnRootViaSchedulerTask.bind(null, root2), suspendedLanes = scheduleCallback$3(suspendedLanes, pingedLanes), root2.callbackPriority = currentTime, root2.callbackNode = suspendedLanes, currentTime;
        }
        return pingedLanes !== null && pingedLanes !== null && cancelCallback$1(pingedLanes), root2.callbackPriority = 2, root2.callbackNode = null, 2;
      }
      function performWorkOnRootViaSchedulerTask(root2, didTimeout) {
        if (pendingEffectsStatus !== 0 && pendingEffectsStatus !== 5)
          return root2.callbackNode = null, root2.callbackPriority = 0, null;
        var originalCallbackNode = root2.callbackNode;
        if (flushPendingEffects() && root2.callbackNode !== originalCallbackNode)
          return null;
        var workInProgressRootRenderLanes$jscomp$0 = workInProgressRootRenderLanes;
        return workInProgressRootRenderLanes$jscomp$0 = getNextLanes(
          root2,
          root2 === workInProgressRoot ? workInProgressRootRenderLanes$jscomp$0 : 0,
          root2.cancelPendingCommit !== null || root2.timeoutHandle !== -1
        ), workInProgressRootRenderLanes$jscomp$0 === 0 ? null : (performWorkOnRoot(root2, workInProgressRootRenderLanes$jscomp$0, didTimeout), scheduleTaskForRootDuringMicrotask(root2, now()), root2.callbackNode != null && root2.callbackNode === originalCallbackNode ? performWorkOnRootViaSchedulerTask.bind(null, root2) : null);
      }
      function performSyncWorkOnRoot(root2, lanes) {
        if (flushPendingEffects()) return null;
        performWorkOnRoot(root2, lanes, !0);
      }
      function scheduleImmediateRootScheduleTask() {
        scheduleMicrotask(function() {
          (executionContext & 6) !== 0 ? scheduleCallback$3(
            ImmediatePriority,
            processRootScheduleInImmediateTask
          ) : processRootScheduleInMicrotask();
        });
      }
      function requestTransitionLane() {
        if (currentEventTransitionLane === 0) {
          var actionScopeLane = currentEntangledLane;
          actionScopeLane === 0 && (actionScopeLane = nextTransitionUpdateLane, nextTransitionUpdateLane <<= 1, (nextTransitionUpdateLane & 261888) === 0 && (nextTransitionUpdateLane = 256)), currentEventTransitionLane = actionScopeLane;
        }
        return currentEventTransitionLane;
      }
      function coerceFormActionProp(actionProp) {
        return actionProp == null || typeof actionProp == "symbol" || typeof actionProp == "boolean" ? null : typeof actionProp == "function" ? actionProp : sanitizeURL(actionProp);
      }
      function extractEvents$1(dispatchQueue, domEventName, maybeTargetInst, nativeEvent, nativeEventTarget) {
        if (domEventName === "submit" && maybeTargetInst && maybeTargetInst.stateNode === nativeEventTarget) {
          var action = coerceFormActionProp(
            (nativeEventTarget[internalPropsKey] || null).action
          ), submitter = nativeEvent.submitter;
          submitter && (domEventName = (domEventName = submitter[internalPropsKey] || null) ? coerceFormActionProp(domEventName.formAction) : submitter.getAttribute("formAction"), domEventName !== null && (action = domEventName, submitter = null));
          var event = new SyntheticEvent(
            "action",
            "action",
            null,
            nativeEvent,
            nativeEventTarget
          );
          dispatchQueue.push({
            event,
            listeners: [
              {
                instance: null,
                listener: function() {
                  if (nativeEvent.defaultPrevented) {
                    if (currentEventTransitionLane !== 0) {
                      var formData = new FormData(nativeEventTarget, submitter);
                      startHostTransition(
                        maybeTargetInst,
                        {
                          pending: !0,
                          data: formData,
                          method: nativeEventTarget.method,
                          action
                        },
                        null,
                        formData
                      );
                    }
                  } else
                    typeof action == "function" && (event.preventDefault(), formData = new FormData(nativeEventTarget, submitter), startHostTransition(
                      maybeTargetInst,
                      {
                        pending: !0,
                        data: formData,
                        method: nativeEventTarget.method,
                        action
                      },
                      action,
                      formData
                    ));
                },
                currentTarget: nativeEventTarget
              }
            ]
          });
        }
      }
      for (i$jscomp$inline_1667 = 0; i$jscomp$inline_1667 < simpleEventPluginEvents.length; i$jscomp$inline_1667++)
        eventName$jscomp$inline_1668 = simpleEventPluginEvents[i$jscomp$inline_1667], domEventName$jscomp$inline_1669 = eventName$jscomp$inline_1668.toLowerCase(), capitalizedEvent$jscomp$inline_1670 = eventName$jscomp$inline_1668[0].toUpperCase() + eventName$jscomp$inline_1668.slice(1), registerSimpleEvent(
          domEventName$jscomp$inline_1669,
          "on" + capitalizedEvent$jscomp$inline_1670
        );
      var eventName$jscomp$inline_1668, domEventName$jscomp$inline_1669, capitalizedEvent$jscomp$inline_1670, i$jscomp$inline_1667;
      registerSimpleEvent(ANIMATION_END, "onAnimationEnd");
      registerSimpleEvent(ANIMATION_ITERATION, "onAnimationIteration");
      registerSimpleEvent(ANIMATION_START, "onAnimationStart");
      registerSimpleEvent("dblclick", "onDoubleClick");
      registerSimpleEvent("focusin", "onFocus");
      registerSimpleEvent("focusout", "onBlur");
      registerSimpleEvent(TRANSITION_RUN, "onTransitionRun");
      registerSimpleEvent(TRANSITION_START, "onTransitionStart");
      registerSimpleEvent(TRANSITION_CANCEL, "onTransitionCancel");
      registerSimpleEvent(TRANSITION_END, "onTransitionEnd");
      registerDirectEvent("onMouseEnter", ["mouseout", "mouseover"]);
      registerDirectEvent("onMouseLeave", ["mouseout", "mouseover"]);
      registerDirectEvent("onPointerEnter", ["pointerout", "pointerover"]);
      registerDirectEvent("onPointerLeave", ["pointerout", "pointerover"]);
      registerTwoPhaseEvent(
        "onChange",
        "change click focusin focusout input keydown keyup selectionchange".split(" ")
      );
      registerTwoPhaseEvent(
        "onSelect",
        "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(
          " "
        )
      );
      registerTwoPhaseEvent("onBeforeInput", [
        "compositionend",
        "keypress",
        "textInput",
        "paste"
      ]);
      registerTwoPhaseEvent(
        "onCompositionEnd",
        "compositionend focusout keydown keypress keyup mousedown".split(" ")
      );
      registerTwoPhaseEvent(
        "onCompositionStart",
        "compositionstart focusout keydown keypress keyup mousedown".split(" ")
      );
      registerTwoPhaseEvent(
        "onCompositionUpdate",
        "compositionupdate focusout keydown keypress keyup mousedown".split(" ")
      );
      var mediaEventTypes = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(
        " "
      ), nonDelegatedEvents = new Set(
        "beforetoggle cancel close invalid load scroll scrollend toggle".split(" ").concat(mediaEventTypes)
      );
      function processDispatchQueue(dispatchQueue, eventSystemFlags) {
        eventSystemFlags = (eventSystemFlags & 4) !== 0;
        for (var i = 0; i < dispatchQueue.length; i++) {
          var _dispatchQueue$i = dispatchQueue[i], event = _dispatchQueue$i.event;
          _dispatchQueue$i = _dispatchQueue$i.listeners;
          a: {
            var previousInstance = void 0;
            if (eventSystemFlags)
              for (var i$jscomp$0 = _dispatchQueue$i.length - 1; 0 <= i$jscomp$0; i$jscomp$0--) {
                var _dispatchListeners$i = _dispatchQueue$i[i$jscomp$0], instance = _dispatchListeners$i.instance, currentTarget = _dispatchListeners$i.currentTarget;
                if (_dispatchListeners$i = _dispatchListeners$i.listener, instance !== previousInstance && event.isPropagationStopped())
                  break a;
                previousInstance = _dispatchListeners$i, event.currentTarget = currentTarget;
                try {
                  previousInstance(event);
                } catch (error) {
                  reportGlobalError(error);
                }
                event.currentTarget = null, previousInstance = instance;
              }
            else
              for (i$jscomp$0 = 0; i$jscomp$0 < _dispatchQueue$i.length; i$jscomp$0++) {
                if (_dispatchListeners$i = _dispatchQueue$i[i$jscomp$0], instance = _dispatchListeners$i.instance, currentTarget = _dispatchListeners$i.currentTarget, _dispatchListeners$i = _dispatchListeners$i.listener, instance !== previousInstance && event.isPropagationStopped())
                  break a;
                previousInstance = _dispatchListeners$i, event.currentTarget = currentTarget;
                try {
                  previousInstance(event);
                } catch (error) {
                  reportGlobalError(error);
                }
                event.currentTarget = null, previousInstance = instance;
              }
          }
        }
      }
      function listenToNonDelegatedEvent(domEventName, targetElement) {
        var JSCompiler_inline_result = targetElement[internalEventHandlersKey];
        JSCompiler_inline_result === void 0 && (JSCompiler_inline_result = targetElement[internalEventHandlersKey] = /* @__PURE__ */ new Set());
        var listenerSetKey = domEventName + "__bubble";
        JSCompiler_inline_result.has(listenerSetKey) || (addTrappedEventListener(targetElement, domEventName, 2, !1), JSCompiler_inline_result.add(listenerSetKey));
      }
      function listenToNativeEvent(domEventName, isCapturePhaseListener, target) {
        var eventSystemFlags = 0;
        isCapturePhaseListener && (eventSystemFlags |= 4), addTrappedEventListener(
          target,
          domEventName,
          eventSystemFlags,
          isCapturePhaseListener
        );
      }
      var listeningMarker = "_reactListening" + Math.random().toString(36).slice(2);
      function listenToAllSupportedEvents(rootContainerElement) {
        if (!rootContainerElement[listeningMarker]) {
          rootContainerElement[listeningMarker] = !0, allNativeEvents.forEach(function(domEventName) {
            domEventName !== "selectionchange" && (nonDelegatedEvents.has(domEventName) || listenToNativeEvent(domEventName, !1, rootContainerElement), listenToNativeEvent(domEventName, !0, rootContainerElement));
          });
          var ownerDocument = rootContainerElement.nodeType === 9 ? rootContainerElement : rootContainerElement.ownerDocument;
          ownerDocument === null || ownerDocument[listeningMarker] || (ownerDocument[listeningMarker] = !0, listenToNativeEvent("selectionchange", !1, ownerDocument));
        }
      }
      function addTrappedEventListener(targetContainer, domEventName, eventSystemFlags, isCapturePhaseListener) {
        switch (getEventPriority(domEventName)) {
          case 2:
            var listenerWrapper = dispatchDiscreteEvent;
            break;
          case 8:
            listenerWrapper = dispatchContinuousEvent;
            break;
          default:
            listenerWrapper = dispatchEvent;
        }
        eventSystemFlags = listenerWrapper.bind(
          null,
          domEventName,
          eventSystemFlags,
          targetContainer
        ), listenerWrapper = void 0, !passiveBrowserEventsSupported || domEventName !== "touchstart" && domEventName !== "touchmove" && domEventName !== "wheel" || (listenerWrapper = !0), isCapturePhaseListener ? listenerWrapper !== void 0 ? targetContainer.addEventListener(domEventName, eventSystemFlags, {
          capture: !0,
          passive: listenerWrapper
        }) : targetContainer.addEventListener(domEventName, eventSystemFlags, !0) : listenerWrapper !== void 0 ? targetContainer.addEventListener(domEventName, eventSystemFlags, {
          passive: listenerWrapper
        }) : targetContainer.addEventListener(domEventName, eventSystemFlags, !1);
      }
      function dispatchEventForPluginEventSystem(domEventName, eventSystemFlags, nativeEvent, targetInst$jscomp$0, targetContainer) {
        var ancestorInst = targetInst$jscomp$0;
        if ((eventSystemFlags & 1) === 0 && (eventSystemFlags & 2) === 0 && targetInst$jscomp$0 !== null)
          a: for (; ; ) {
            if (targetInst$jscomp$0 === null) return;
            var nodeTag = targetInst$jscomp$0.tag;
            if (nodeTag === 3 || nodeTag === 4) {
              var container = targetInst$jscomp$0.stateNode.containerInfo;
              if (container === targetContainer) break;
              if (nodeTag === 4)
                for (nodeTag = targetInst$jscomp$0.return; nodeTag !== null; ) {
                  var grandTag = nodeTag.tag;
                  if ((grandTag === 3 || grandTag === 4) && nodeTag.stateNode.containerInfo === targetContainer)
                    return;
                  nodeTag = nodeTag.return;
                }
              for (; container !== null; ) {
                if (nodeTag = getClosestInstanceFromNode(container), nodeTag === null) return;
                if (grandTag = nodeTag.tag, grandTag === 5 || grandTag === 6 || grandTag === 26 || grandTag === 27) {
                  targetInst$jscomp$0 = ancestorInst = nodeTag;
                  continue a;
                }
                container = container.parentNode;
              }
            }
            targetInst$jscomp$0 = targetInst$jscomp$0.return;
          }
        batchedUpdates$1(function() {
          var targetInst = ancestorInst, nativeEventTarget = getEventTarget(nativeEvent), dispatchQueue = [];
          a: {
            var reactName = topLevelEventsToReactNames.get(domEventName);
            if (reactName !== void 0) {
              var SyntheticEventCtor = SyntheticEvent, reactEventType = domEventName;
              switch (domEventName) {
                case "keypress":
                  if (getEventCharCode(nativeEvent) === 0) break a;
                case "keydown":
                case "keyup":
                  SyntheticEventCtor = SyntheticKeyboardEvent;
                  break;
                case "focusin":
                  reactEventType = "focus", SyntheticEventCtor = SyntheticFocusEvent;
                  break;
                case "focusout":
                  reactEventType = "blur", SyntheticEventCtor = SyntheticFocusEvent;
                  break;
                case "beforeblur":
                case "afterblur":
                  SyntheticEventCtor = SyntheticFocusEvent;
                  break;
                case "click":
                  if (nativeEvent.button === 2) break a;
                case "auxclick":
                case "dblclick":
                case "mousedown":
                case "mousemove":
                case "mouseup":
                case "mouseout":
                case "mouseover":
                case "contextmenu":
                  SyntheticEventCtor = SyntheticMouseEvent;
                  break;
                case "drag":
                case "dragend":
                case "dragenter":
                case "dragexit":
                case "dragleave":
                case "dragover":
                case "dragstart":
                case "drop":
                  SyntheticEventCtor = SyntheticDragEvent;
                  break;
                case "touchcancel":
                case "touchend":
                case "touchmove":
                case "touchstart":
                  SyntheticEventCtor = SyntheticTouchEvent;
                  break;
                case ANIMATION_END:
                case ANIMATION_ITERATION:
                case ANIMATION_START:
                  SyntheticEventCtor = SyntheticAnimationEvent;
                  break;
                case TRANSITION_END:
                  SyntheticEventCtor = SyntheticTransitionEvent;
                  break;
                case "scroll":
                case "scrollend":
                  SyntheticEventCtor = SyntheticUIEvent;
                  break;
                case "wheel":
                  SyntheticEventCtor = SyntheticWheelEvent;
                  break;
                case "copy":
                case "cut":
                case "paste":
                  SyntheticEventCtor = SyntheticClipboardEvent;
                  break;
                case "gotpointercapture":
                case "lostpointercapture":
                case "pointercancel":
                case "pointerdown":
                case "pointermove":
                case "pointerout":
                case "pointerover":
                case "pointerup":
                  SyntheticEventCtor = SyntheticPointerEvent;
                  break;
                case "submit":
                  SyntheticEventCtor = SyntheticSubmitEvent;
                  break;
                case "toggle":
                case "beforetoggle":
                  SyntheticEventCtor = SyntheticToggleEvent;
              }
              var inCapturePhase = (eventSystemFlags & 4) !== 0, accumulateTargetOnly = !inCapturePhase && (domEventName === "scroll" || domEventName === "scrollend"), reactEventName = inCapturePhase ? reactName !== null ? reactName + "Capture" : null : reactName;
              inCapturePhase = [];
              for (var instance = targetInst, lastHostComponent; instance !== null; ) {
                var _instance = instance;
                if (lastHostComponent = _instance.stateNode, _instance = _instance.tag, _instance !== 5 && _instance !== 26 && _instance !== 27 || lastHostComponent === null || reactEventName === null || (_instance = getListener(instance, reactEventName), _instance != null && inCapturePhase.push(
                  createDispatchListener(instance, _instance, lastHostComponent)
                )), accumulateTargetOnly) break;
                instance = instance.return;
              }
              0 < inCapturePhase.length && (reactName = new SyntheticEventCtor(
                reactName,
                reactEventType,
                null,
                nativeEvent,
                nativeEventTarget
              ), dispatchQueue.push({ event: reactName, listeners: inCapturePhase }));
            }
          }
          if ((eventSystemFlags & 7) === 0) {
            a: {
              if (SyntheticEventCtor = domEventName === "mouseover" || domEventName === "pointerover", reactName = domEventName === "mouseout" || domEventName === "pointerout", SyntheticEventCtor && nativeEvent !== currentReplayingEvent && (reactEventType = nativeEvent.relatedTarget || nativeEvent.fromElement) && (getClosestInstanceFromNode(reactEventType) || reactEventType[internalContainerInstanceKey]))
                break a;
              (reactName || SyntheticEventCtor) && (reactEventType = nativeEventTarget.window === nativeEventTarget ? nativeEventTarget : (SyntheticEventCtor = nativeEventTarget.ownerDocument) ? SyntheticEventCtor.defaultView || SyntheticEventCtor.parentWindow : window, reactName ? (SyntheticEventCtor = nativeEvent.relatedTarget || nativeEvent.toElement, reactName = targetInst, SyntheticEventCtor = SyntheticEventCtor ? getClosestInstanceFromNode(SyntheticEventCtor) : null, SyntheticEventCtor !== null && (accumulateTargetOnly = getNearestMountedFiber(SyntheticEventCtor), inCapturePhase = SyntheticEventCtor.tag, SyntheticEventCtor !== accumulateTargetOnly || inCapturePhase !== 5 && inCapturePhase !== 27 && inCapturePhase !== 6) && (SyntheticEventCtor = null)) : (reactName = null, SyntheticEventCtor = targetInst), reactName !== SyntheticEventCtor && (inCapturePhase = SyntheticMouseEvent, _instance = "onMouseLeave", reactEventName = "onMouseEnter", instance = "mouse", (domEventName === "pointerout" || domEventName === "pointerover") && (inCapturePhase = SyntheticPointerEvent, _instance = "onPointerLeave", reactEventName = "onPointerEnter", instance = "pointer"), accumulateTargetOnly = reactName == null ? reactEventType : getNodeFromInstance(reactName), lastHostComponent = SyntheticEventCtor == null ? reactEventType : getNodeFromInstance(SyntheticEventCtor), reactEventType = new inCapturePhase(
                _instance,
                instance + "leave",
                reactName,
                nativeEvent,
                nativeEventTarget
              ), reactEventType.target = accumulateTargetOnly, reactEventType.relatedTarget = lastHostComponent, _instance = null, getClosestInstanceFromNode(nativeEventTarget) === targetInst && (inCapturePhase = new inCapturePhase(
                reactEventName,
                instance + "enter",
                SyntheticEventCtor,
                nativeEvent,
                nativeEventTarget
              ), inCapturePhase.target = lastHostComponent, inCapturePhase.relatedTarget = accumulateTargetOnly, _instance = inCapturePhase), accumulateTargetOnly = _instance, inCapturePhase = reactName && SyntheticEventCtor ? getLowestCommonAncestor(
                reactName,
                SyntheticEventCtor,
                getParent
              ) : null, reactName !== null && accumulateEnterLeaveListenersForEvent(
                dispatchQueue,
                reactEventType,
                reactName,
                inCapturePhase,
                !1
              ), SyntheticEventCtor !== null && accumulateTargetOnly !== null && accumulateEnterLeaveListenersForEvent(
                dispatchQueue,
                accumulateTargetOnly,
                SyntheticEventCtor,
                inCapturePhase,
                !0
              )));
            }
            a: {
              if (reactName = targetInst ? getNodeFromInstance(targetInst) : window, SyntheticEventCtor = reactName.nodeName && reactName.nodeName.toLowerCase(), SyntheticEventCtor === "select" || SyntheticEventCtor === "input" && reactName.type === "file")
                var getTargetInstFunc = getTargetInstForChangeEvent;
              else if (isTextInputElement(reactName))
                if (isInputEventSupported)
                  getTargetInstFunc = getTargetInstForInputOrChangeEvent;
                else {
                  getTargetInstFunc = getTargetInstForInputEventPolyfill;
                  var handleEventFunc = handleEventsForInputEventPolyfill;
                }
              else
                SyntheticEventCtor = reactName.nodeName, !SyntheticEventCtor || SyntheticEventCtor.toLowerCase() !== "input" || reactName.type !== "checkbox" && reactName.type !== "radio" ? targetInst && isCustomElement(targetInst.elementType) && (getTargetInstFunc = getTargetInstForChangeEvent) : getTargetInstFunc = getTargetInstForClickEvent;
              if (getTargetInstFunc && (getTargetInstFunc = getTargetInstFunc(domEventName, targetInst))) {
                createAndAccumulateChangeEvent(
                  dispatchQueue,
                  getTargetInstFunc,
                  nativeEvent,
                  nativeEventTarget
                );
                break a;
              }
              handleEventFunc && handleEventFunc(domEventName, reactName, targetInst);
            }
            switch (handleEventFunc = targetInst ? getNodeFromInstance(targetInst) : window, domEventName) {
              case "focusin":
                (isTextInputElement(handleEventFunc) || handleEventFunc.contentEditable === "true") && (activeElement = handleEventFunc, activeElementInst = targetInst, lastSelection = null);
                break;
              case "focusout":
                lastSelection = activeElementInst = activeElement = null;
                break;
              case "mousedown":
                mouseDown = !0;
                break;
              case "contextmenu":
              case "mouseup":
              case "dragend":
                mouseDown = !1, constructSelectEvent(dispatchQueue, nativeEvent, nativeEventTarget);
                break;
              case "selectionchange":
                if (skipSelectionChangeEvent) break;
              case "keydown":
              case "keyup":
                constructSelectEvent(dispatchQueue, nativeEvent, nativeEventTarget);
            }
            var fallbackData;
            if (canUseCompositionEvent)
              b: {
                switch (domEventName) {
                  case "compositionstart":
                    var eventType = "onCompositionStart";
                    break b;
                  case "compositionend":
                    eventType = "onCompositionEnd";
                    break b;
                  case "compositionupdate":
                    eventType = "onCompositionUpdate";
                    break b;
                }
                eventType = void 0;
              }
            else
              isComposing ? isFallbackCompositionEnd(domEventName, nativeEvent) && (eventType = "onCompositionEnd") : domEventName === "keydown" && nativeEvent.keyCode === 229 && (eventType = "onCompositionStart");
            eventType && (useFallbackCompositionData && nativeEvent.locale !== "ko" && (isComposing || eventType !== "onCompositionStart" ? eventType === "onCompositionEnd" && isComposing && (fallbackData = getData()) : (root = nativeEventTarget, startText = "value" in root ? root.value : root.textContent, isComposing = !0)), handleEventFunc = accumulateTwoPhaseListeners(targetInst, eventType), 0 < handleEventFunc.length && (eventType = new SyntheticCompositionEvent(
              eventType,
              domEventName,
              null,
              nativeEvent,
              nativeEventTarget
            ), dispatchQueue.push({ event: eventType, listeners: handleEventFunc }), fallbackData ? eventType.data = fallbackData : (fallbackData = getDataFromCustomEvent(nativeEvent), fallbackData !== null && (eventType.data = fallbackData)))), (fallbackData = canUseTextInputEvent ? getNativeBeforeInputChars(domEventName, nativeEvent) : getFallbackBeforeInputChars(domEventName, nativeEvent)) && (eventType = accumulateTwoPhaseListeners(targetInst, "onBeforeInput"), 0 < eventType.length && (handleEventFunc = new SyntheticCompositionEvent(
              "onBeforeInput",
              "beforeinput",
              null,
              nativeEvent,
              nativeEventTarget
            ), dispatchQueue.push({
              event: handleEventFunc,
              listeners: eventType
            }), handleEventFunc.data = fallbackData)), extractEvents$1(
              dispatchQueue,
              domEventName,
              targetInst,
              nativeEvent,
              nativeEventTarget
            );
          }
          processDispatchQueue(dispatchQueue, eventSystemFlags);
        });
      }
      function createDispatchListener(instance, listener, currentTarget) {
        return {
          instance,
          listener,
          currentTarget
        };
      }
      function accumulateTwoPhaseListeners(targetFiber, reactName) {
        for (var captureName = reactName + "Capture", listeners = []; targetFiber !== null; ) {
          var _instance2 = targetFiber, stateNode = _instance2.stateNode;
          if (_instance2 = _instance2.tag, _instance2 !== 5 && _instance2 !== 26 && _instance2 !== 27 || stateNode === null || (_instance2 = getListener(targetFiber, captureName), _instance2 != null && listeners.unshift(
            createDispatchListener(targetFiber, _instance2, stateNode)
          ), _instance2 = getListener(targetFiber, reactName), _instance2 != null && listeners.push(
            createDispatchListener(targetFiber, _instance2, stateNode)
          )), targetFiber.tag === 3) return listeners;
          targetFiber = targetFiber.return;
        }
        return [];
      }
      function getParent(inst) {
        if (inst === null) return null;
        do
          inst = inst.return;
        while (inst && inst.tag !== 5 && inst.tag !== 27);
        return inst || null;
      }
      function accumulateEnterLeaveListenersForEvent(dispatchQueue, event, target, common, inCapturePhase) {
        for (var registrationName = event._reactName, listeners = []; target !== null && target !== common; ) {
          var _instance3 = target, alternate = _instance3.alternate, stateNode = _instance3.stateNode;
          if (_instance3 = _instance3.tag, alternate !== null && alternate === common) break;
          _instance3 !== 5 && _instance3 !== 26 && _instance3 !== 27 || stateNode === null || (alternate = stateNode, inCapturePhase ? (stateNode = getListener(target, registrationName), stateNode != null && listeners.unshift(
            createDispatchListener(target, stateNode, alternate)
          )) : inCapturePhase || (stateNode = getListener(target, registrationName), stateNode != null && listeners.push(
            createDispatchListener(target, stateNode, alternate)
          ))), target = target.return;
        }
        listeners.length !== 0 && dispatchQueue.push({ event, listeners });
      }
      var NORMALIZE_NEWLINES_REGEX = /\r\n?/g, NORMALIZE_NULL_AND_REPLACEMENT_REGEX = /\u0000|\uFFFD/g;
      function normalizeMarkupForTextOrAttribute(markup) {
        return (typeof markup == "string" ? markup : "" + markup).replace(NORMALIZE_NEWLINES_REGEX, `
`).replace(NORMALIZE_NULL_AND_REPLACEMENT_REGEX, "");
      }
      function checkForUnmatchedText(serverText, clientText) {
        return clientText = normalizeMarkupForTextOrAttribute(clientText), normalizeMarkupForTextOrAttribute(serverText) === clientText;
      }
      function setProp(domElement, tag, key, value, props, prevValue) {
        switch (key) {
          case "children":
            if (typeof value == "string")
              tag === "body" || tag === "textarea" && value === "" || setTextContent(domElement, value);
            else if (typeof value == "number" || typeof value == "bigint")
              tag !== "body" && setTextContent(domElement, "" + value);
            else return;
            break;
          case "className":
            setValueForKnownAttribute(domElement, "class", value);
            break;
          case "tabIndex":
            setValueForKnownAttribute(domElement, "tabindex", value);
            break;
          case "dir":
          case "role":
          case "viewBox":
          case "width":
          case "height":
            setValueForKnownAttribute(domElement, key, value);
            break;
          case "style":
            setValueForStyles(domElement, value, prevValue);
            return;
          case "data":
            if (tag !== "object") {
              setValueForKnownAttribute(domElement, "data", value);
              break;
            }
          case "src":
          case "href":
            if (value === "" && (tag !== "a" || key !== "href")) {
              domElement.removeAttribute(key);
              break;
            }
            if (value == null || typeof value == "function" || typeof value == "symbol" || typeof value == "boolean") {
              domElement.removeAttribute(key);
              break;
            }
            value = sanitizeURL(value), domElement.setAttribute(key, value);
            break;
          case "action":
          case "formAction":
            if (typeof value == "function") {
              domElement.setAttribute(
                key,
                "javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')"
              );
              break;
            } else
              typeof prevValue == "function" && (key === "formAction" ? (tag !== "input" && setProp(domElement, tag, "name", props.name, props, null), setProp(
                domElement,
                tag,
                "formEncType",
                props.formEncType,
                props,
                null
              ), setProp(
                domElement,
                tag,
                "formMethod",
                props.formMethod,
                props,
                null
              ), setProp(
                domElement,
                tag,
                "formTarget",
                props.formTarget,
                props,
                null
              )) : (setProp(domElement, tag, "encType", props.encType, props, null), setProp(domElement, tag, "method", props.method, props, null), setProp(domElement, tag, "target", props.target, props, null)));
            if (value == null || typeof value == "symbol" || typeof value == "boolean") {
              domElement.removeAttribute(key);
              break;
            }
            value = sanitizeURL(value), domElement.setAttribute(key, value);
            break;
          case "onClick":
            value != null && (domElement.onclick = noop$1);
            return;
          case "onScroll":
            value != null && listenToNonDelegatedEvent("scroll", domElement);
            return;
          case "onScrollEnd":
            value != null && listenToNonDelegatedEvent("scrollend", domElement);
            return;
          case "dangerouslySetInnerHTML":
            if (value != null) {
              if (typeof value != "object" || !("__html" in value))
                throw Error(formatProdErrorMessage(61));
              if (key = value.__html, key != null) {
                if (props.children != null) throw Error(formatProdErrorMessage(60));
                prevValue?.__html !== key && (domElement.innerHTML = key);
              }
            }
            break;
          case "multiple":
            domElement.multiple = value && typeof value != "function" && typeof value != "symbol";
            break;
          case "muted":
            domElement.muted = value && typeof value != "function" && typeof value != "symbol";
            break;
          case "suppressContentEditableWarning":
          case "suppressHydrationWarning":
          case "defaultValue":
          case "defaultChecked":
          case "innerHTML":
          case "ref":
            break;
          case "autoFocus":
            break;
          case "xlinkHref":
            if (value == null || typeof value == "function" || typeof value == "boolean" || typeof value == "symbol") {
              domElement.removeAttribute("xlink:href");
              break;
            }
            key = sanitizeURL(value), domElement.setAttributeNS(
              "http://www.w3.org/1999/xlink",
              "xlink:href",
              key
            );
            break;
          case "contentEditable":
          case "spellCheck":
          case "draggable":
          case "value":
          case "autoReverse":
          case "externalResourcesRequired":
          case "focusable":
          case "preserveAlpha":
            value != null && typeof value != "function" && typeof value != "symbol" ? domElement.setAttribute(key, value) : domElement.removeAttribute(key);
            break;
          case "inert":
          case "allowFullScreen":
          case "async":
          case "autoPlay":
          case "controls":
          case "credentialless":
          case "default":
          case "defer":
          case "disabled":
          case "disablePictureInPicture":
          case "disableRemotePlayback":
          case "formNoValidate":
          case "hidden":
          case "loop":
          case "noModule":
          case "noValidate":
          case "open":
          case "playsInline":
          case "readOnly":
          case "required":
          case "reversed":
          case "scoped":
          case "seamless":
          case "itemScope":
            value && typeof value != "function" && typeof value != "symbol" ? domElement.setAttribute(key, "") : domElement.removeAttribute(key);
            break;
          case "capture":
          case "download":
            value === !0 ? domElement.setAttribute(key, "") : value !== !1 && value != null && typeof value != "function" && typeof value != "symbol" ? domElement.setAttribute(key, value) : domElement.removeAttribute(key);
            break;
          case "cols":
          case "rows":
          case "size":
          case "span":
            value != null && typeof value != "function" && typeof value != "symbol" && !isNaN(value) && 1 <= value ? domElement.setAttribute(key, value) : domElement.removeAttribute(key);
            break;
          case "rowSpan":
          case "start":
            value == null || typeof value == "function" || typeof value == "symbol" || isNaN(value) ? domElement.removeAttribute(key) : domElement.setAttribute(key, value);
            break;
          case "popover":
            listenToNonDelegatedEvent("beforetoggle", domElement), listenToNonDelegatedEvent("toggle", domElement), setValueForAttribute(domElement, "popover", value);
            break;
          case "xlinkActuate":
            setValueForNamespacedAttribute(
              domElement,
              "http://www.w3.org/1999/xlink",
              "xlink:actuate",
              value
            );
            break;
          case "xlinkArcrole":
            setValueForNamespacedAttribute(
              domElement,
              "http://www.w3.org/1999/xlink",
              "xlink:arcrole",
              value
            );
            break;
          case "xlinkRole":
            setValueForNamespacedAttribute(
              domElement,
              "http://www.w3.org/1999/xlink",
              "xlink:role",
              value
            );
            break;
          case "xlinkShow":
            setValueForNamespacedAttribute(
              domElement,
              "http://www.w3.org/1999/xlink",
              "xlink:show",
              value
            );
            break;
          case "xlinkTitle":
            setValueForNamespacedAttribute(
              domElement,
              "http://www.w3.org/1999/xlink",
              "xlink:title",
              value
            );
            break;
          case "xlinkType":
            setValueForNamespacedAttribute(
              domElement,
              "http://www.w3.org/1999/xlink",
              "xlink:type",
              value
            );
            break;
          case "xmlBase":
            setValueForNamespacedAttribute(
              domElement,
              "http://www.w3.org/XML/1998/namespace",
              "xml:base",
              value
            );
            break;
          case "xmlLang":
            setValueForNamespacedAttribute(
              domElement,
              "http://www.w3.org/XML/1998/namespace",
              "xml:lang",
              value
            );
            break;
          case "xmlSpace":
            setValueForNamespacedAttribute(
              domElement,
              "http://www.w3.org/XML/1998/namespace",
              "xml:space",
              value
            );
            break;
          case "is":
            setValueForAttribute(domElement, "is", value);
            break;
          case "innerText":
          case "textContent":
            return;
          default:
            if (!(2 < key.length) || key[0] !== "o" && key[0] !== "O" || key[1] !== "n" && key[1] !== "N")
              key = aliases.get(key) || key, setValueForAttribute(domElement, key, value);
            else return;
        }
        viewTransitionMutationContext = !0;
      }
      function setPropOnCustomElement(domElement, tag, key, value, props, prevValue) {
        switch (key) {
          case "style":
            setValueForStyles(domElement, value, prevValue);
            return;
          case "dangerouslySetInnerHTML":
            if (value != null) {
              if (typeof value != "object" || !("__html" in value))
                throw Error(formatProdErrorMessage(61));
              if (key = value.__html, key != null) {
                if (props.children != null) throw Error(formatProdErrorMessage(60));
                prevValue?.__html !== key && (domElement.innerHTML = key);
              }
            }
            break;
          case "children":
            if (typeof value == "string") setTextContent(domElement, value);
            else if (typeof value == "number" || typeof value == "bigint")
              setTextContent(domElement, "" + value);
            else return;
            break;
          case "onScroll":
            value != null && listenToNonDelegatedEvent("scroll", domElement);
            return;
          case "onScrollEnd":
            value != null && listenToNonDelegatedEvent("scrollend", domElement);
            return;
          case "onClick":
            value != null && (domElement.onclick = noop$1);
            return;
          case "suppressContentEditableWarning":
          case "suppressHydrationWarning":
          case "innerHTML":
          case "ref":
            return;
          case "innerText":
          case "textContent":
            return;
          default:
            if (!registrationNameDependencies.hasOwnProperty(key))
              a: {
                if (key[0] === "o" && key[1] === "n" && (props = key.endsWith("Capture"), prevValue = key.slice(2, props ? key.length - 7 : void 0), tag = domElement[internalPropsKey] || null, tag = tag != null ? tag[key] : null, typeof tag == "function" && domElement.removeEventListener(prevValue, tag, props), typeof value == "function")) {
                  typeof tag != "function" && tag !== null && (key in domElement ? domElement[key] = null : domElement.hasAttribute(key) && domElement.removeAttribute(key)), domElement.addEventListener(prevValue, value, props);
                  break a;
                }
                viewTransitionMutationContext = !0, key in domElement ? domElement[key] = value : value === !0 ? domElement.setAttribute(key, "") : setValueForAttribute(domElement, key, value);
              }
            return;
        }
        viewTransitionMutationContext = !0;
      }
      function setInitialProperties(domElement, tag, props) {
        switch (tag) {
          case "div":
          case "span":
          case "svg":
          case "path":
          case "a":
          case "g":
          case "p":
          case "li":
            break;
          case "img":
            listenToNonDelegatedEvent("error", domElement), listenToNonDelegatedEvent("load", domElement);
            var hasSrc = !1, hasSrcSet = !1, propKey;
            for (propKey in props)
              if (props.hasOwnProperty(propKey)) {
                var propValue = props[propKey];
                if (propValue != null)
                  switch (propKey) {
                    case "src":
                      hasSrc = !0;
                      break;
                    case "srcSet":
                      hasSrcSet = !0;
                      break;
                    case "children":
                    case "dangerouslySetInnerHTML":
                      throw Error(formatProdErrorMessage(137, tag));
                    default:
                      setProp(domElement, tag, propKey, propValue, props, null);
                  }
              }
            hasSrcSet && setProp(domElement, tag, "srcSet", props.srcSet, props, null), hasSrc && setProp(domElement, tag, "src", props.src, props, null);
            return;
          case "input":
            listenToNonDelegatedEvent("invalid", domElement);
            var defaultValue = propKey = propValue = hasSrcSet = null, checked = null, defaultChecked = null;
            for (hasSrc in props)
              if (props.hasOwnProperty(hasSrc)) {
                var propValue$204 = props[hasSrc];
                if (propValue$204 != null)
                  switch (hasSrc) {
                    case "name":
                      hasSrcSet = propValue$204;
                      break;
                    case "type":
                      propValue = propValue$204;
                      break;
                    case "checked":
                      checked = propValue$204;
                      break;
                    case "defaultChecked":
                      defaultChecked = propValue$204;
                      break;
                    case "value":
                      propKey = propValue$204;
                      break;
                    case "defaultValue":
                      defaultValue = propValue$204;
                      break;
                    case "children":
                    case "dangerouslySetInnerHTML":
                      if (propValue$204 != null)
                        throw Error(formatProdErrorMessage(137, tag));
                      break;
                    default:
                      setProp(domElement, tag, hasSrc, propValue$204, props, null);
                  }
              }
            initInput(
              domElement,
              propKey,
              defaultValue,
              checked,
              defaultChecked,
              propValue,
              hasSrcSet,
              !1
            );
            return;
          case "select":
            listenToNonDelegatedEvent("invalid", domElement), hasSrc = propValue = propKey = null;
            for (hasSrcSet in props)
              if (props.hasOwnProperty(hasSrcSet) && (defaultValue = props[hasSrcSet], defaultValue != null))
                switch (hasSrcSet) {
                  case "value":
                    propKey = defaultValue;
                    break;
                  case "defaultValue":
                    propValue = defaultValue;
                    break;
                  case "multiple":
                    hasSrc = defaultValue;
                  default:
                    setProp(domElement, tag, hasSrcSet, defaultValue, props, null);
                }
            tag = propKey, props = propValue, domElement.multiple = !!hasSrc, tag != null ? updateOptions(domElement, !!hasSrc, tag, !1) : props != null && updateOptions(domElement, !!hasSrc, props, !0);
            return;
          case "textarea":
            listenToNonDelegatedEvent("invalid", domElement), propKey = hasSrcSet = hasSrc = null;
            for (propValue in props)
              if (props.hasOwnProperty(propValue) && (defaultValue = props[propValue], defaultValue != null))
                switch (propValue) {
                  case "value":
                    hasSrc = defaultValue;
                    break;
                  case "defaultValue":
                    hasSrcSet = defaultValue;
                    break;
                  case "children":
                    propKey = defaultValue;
                    break;
                  case "dangerouslySetInnerHTML":
                    if (defaultValue != null) throw Error(formatProdErrorMessage(91));
                    break;
                  default:
                    setProp(domElement, tag, propValue, defaultValue, props, null);
                }
            initTextarea(domElement, hasSrc, hasSrcSet, propKey);
            return;
          case "option":
            for (checked in props)
              props.hasOwnProperty(checked) && (hasSrc = props[checked], hasSrc != null) && (checked === "selected" ? domElement.selected = hasSrc && typeof hasSrc != "function" && typeof hasSrc != "symbol" : setProp(domElement, tag, checked, hasSrc, props, null));
            return;
          case "dialog":
            listenToNonDelegatedEvent("beforetoggle", domElement), listenToNonDelegatedEvent("toggle", domElement), listenToNonDelegatedEvent("cancel", domElement), listenToNonDelegatedEvent("close", domElement);
            break;
          case "iframe":
          case "object":
            listenToNonDelegatedEvent("load", domElement);
            break;
          case "video":
          case "audio":
            for (hasSrc = 0; hasSrc < mediaEventTypes.length; hasSrc++)
              listenToNonDelegatedEvent(mediaEventTypes[hasSrc], domElement);
            break;
          case "image":
            listenToNonDelegatedEvent("error", domElement), listenToNonDelegatedEvent("load", domElement);
            break;
          case "details":
            listenToNonDelegatedEvent("toggle", domElement);
            break;
          case "embed":
          case "source":
          case "link":
            listenToNonDelegatedEvent("error", domElement), listenToNonDelegatedEvent("load", domElement);
          case "area":
          case "base":
          case "br":
          case "col":
          case "hr":
          case "keygen":
          case "meta":
          case "param":
          case "track":
          case "wbr":
          case "menuitem":
            for (defaultChecked in props)
              if (props.hasOwnProperty(defaultChecked) && (hasSrc = props[defaultChecked], hasSrc != null))
                switch (defaultChecked) {
                  case "children":
                  case "dangerouslySetInnerHTML":
                    throw Error(formatProdErrorMessage(137, tag));
                  default:
                    setProp(domElement, tag, defaultChecked, hasSrc, props, null);
                }
            return;
          default:
            if (isCustomElement(tag)) {
              for (propValue$204 in props)
                props.hasOwnProperty(propValue$204) && (hasSrc = props[propValue$204], hasSrc !== void 0 && setPropOnCustomElement(
                  domElement,
                  tag,
                  propValue$204,
                  hasSrc,
                  props,
                  void 0
                ));
              return;
            }
        }
        for (defaultValue in props)
          props.hasOwnProperty(defaultValue) && (hasSrc = props[defaultValue], hasSrc != null && setProp(domElement, tag, defaultValue, hasSrc, props, null));
      }
      var emptyProps = {};
      function updateProperties(domElement, tag, lastProps, nextProps) {
        switch (tag) {
          case "div":
          case "span":
          case "svg":
          case "path":
          case "a":
          case "g":
          case "p":
          case "li":
            break;
          case "input":
            var name = null, type = null, value = null, defaultValue = null, lastDefaultValue = null, checked = null, defaultChecked = null;
            for (propKey in lastProps) {
              var lastProp = lastProps[propKey];
              if (lastProps.hasOwnProperty(propKey) && lastProp != null)
                switch (propKey) {
                  case "checked":
                    break;
                  case "value":
                    break;
                  case "defaultValue":
                    lastDefaultValue = lastProp;
                  default:
                    nextProps.hasOwnProperty(propKey) || setProp(domElement, tag, propKey, null, nextProps, lastProp);
                }
            }
            for (var propKey$221 in nextProps) {
              var propKey = nextProps[propKey$221];
              if (lastProp = lastProps[propKey$221], nextProps.hasOwnProperty(propKey$221) && (propKey != null || lastProp != null))
                switch (propKey$221) {
                  case "type":
                    propKey !== lastProp && (viewTransitionMutationContext = !0), type = propKey;
                    break;
                  case "name":
                    propKey !== lastProp && (viewTransitionMutationContext = !0), name = propKey;
                    break;
                  case "checked":
                    propKey !== lastProp && (viewTransitionMutationContext = !0), checked = propKey;
                    break;
                  case "defaultChecked":
                    propKey !== lastProp && (viewTransitionMutationContext = !0), defaultChecked = propKey;
                    break;
                  case "value":
                    propKey !== lastProp && (viewTransitionMutationContext = !0), value = propKey;
                    break;
                  case "defaultValue":
                    propKey !== lastProp && (viewTransitionMutationContext = !0), defaultValue = propKey;
                    break;
                  case "children":
                  case "dangerouslySetInnerHTML":
                    if (propKey != null)
                      throw Error(formatProdErrorMessage(137, tag));
                    break;
                  default:
                    propKey !== lastProp && setProp(
                      domElement,
                      tag,
                      propKey$221,
                      propKey,
                      nextProps,
                      lastProp
                    );
                }
            }
            updateInput(
              domElement,
              value,
              defaultValue,
              lastDefaultValue,
              checked,
              defaultChecked,
              type,
              name
            );
            return;
          case "select":
            propKey = value = defaultValue = propKey$221 = null;
            for (type in lastProps)
              if (lastDefaultValue = lastProps[type], lastProps.hasOwnProperty(type) && lastDefaultValue != null)
                switch (type) {
                  case "value":
                    break;
                  case "multiple":
                    propKey = lastDefaultValue;
                  default:
                    nextProps.hasOwnProperty(type) || setProp(
                      domElement,
                      tag,
                      type,
                      null,
                      nextProps,
                      lastDefaultValue
                    );
                }
            for (name in nextProps)
              if (type = nextProps[name], lastDefaultValue = lastProps[name], nextProps.hasOwnProperty(name) && (type != null || lastDefaultValue != null))
                switch (name) {
                  case "value":
                    type !== lastDefaultValue && (viewTransitionMutationContext = !0), propKey$221 = type;
                    break;
                  case "defaultValue":
                    type !== lastDefaultValue && (viewTransitionMutationContext = !0), defaultValue = type;
                    break;
                  case "multiple":
                    type !== lastDefaultValue && (viewTransitionMutationContext = !0), value = type;
                  default:
                    type !== lastDefaultValue && setProp(
                      domElement,
                      tag,
                      name,
                      type,
                      nextProps,
                      lastDefaultValue
                    );
                }
            tag = defaultValue, lastProps = value, nextProps = propKey, propKey$221 != null ? updateOptions(domElement, !!lastProps, propKey$221, !1) : !!nextProps != !!lastProps && (tag != null ? updateOptions(domElement, !!lastProps, tag, !0) : updateOptions(domElement, !!lastProps, lastProps ? [] : "", !1));
            return;
          case "textarea":
            propKey = propKey$221 = null;
            for (defaultValue in lastProps)
              if (name = lastProps[defaultValue], lastProps.hasOwnProperty(defaultValue) && name != null && !nextProps.hasOwnProperty(defaultValue))
                switch (defaultValue) {
                  case "value":
                    break;
                  case "children":
                    break;
                  default:
                    setProp(domElement, tag, defaultValue, null, nextProps, name);
                }
            for (value in nextProps)
              if (name = nextProps[value], type = lastProps[value], nextProps.hasOwnProperty(value) && (name != null || type != null))
                switch (value) {
                  case "value":
                    name !== type && (viewTransitionMutationContext = !0), propKey$221 = name;
                    break;
                  case "defaultValue":
                    name !== type && (viewTransitionMutationContext = !0), propKey = name;
                    break;
                  case "children":
                    break;
                  case "dangerouslySetInnerHTML":
                    if (name != null) throw Error(formatProdErrorMessage(91));
                    break;
                  default:
                    name !== type && setProp(domElement, tag, value, name, nextProps, type);
                }
            updateTextarea(domElement, propKey$221, propKey);
            return;
          case "option":
            for (var propKey$237 in lastProps)
              propKey$221 = lastProps[propKey$237], lastProps.hasOwnProperty(propKey$237) && propKey$221 != null && !nextProps.hasOwnProperty(propKey$237) && (propKey$237 === "selected" ? domElement.selected = !1 : setProp(
                domElement,
                tag,
                propKey$237,
                null,
                nextProps,
                propKey$221
              ));
            for (lastDefaultValue in nextProps)
              propKey$221 = nextProps[lastDefaultValue], propKey = lastProps[lastDefaultValue], nextProps.hasOwnProperty(lastDefaultValue) && propKey$221 !== propKey && (propKey$221 != null || propKey != null) && (lastDefaultValue === "selected" ? (propKey$221 !== propKey && (viewTransitionMutationContext = !0), domElement.selected = propKey$221 && typeof propKey$221 != "function" && typeof propKey$221 != "symbol") : setProp(
                domElement,
                tag,
                lastDefaultValue,
                propKey$221,
                nextProps,
                propKey
              ));
            return;
          case "img":
          case "link":
          case "area":
          case "base":
          case "br":
          case "col":
          case "embed":
          case "hr":
          case "keygen":
          case "meta":
          case "param":
          case "source":
          case "track":
          case "wbr":
          case "menuitem":
            for (var propKey$242 in lastProps)
              propKey$221 = lastProps[propKey$242], lastProps.hasOwnProperty(propKey$242) && propKey$221 != null && !nextProps.hasOwnProperty(propKey$242) && setProp(domElement, tag, propKey$242, null, nextProps, propKey$221);
            for (checked in nextProps)
              if (propKey$221 = nextProps[checked], propKey = lastProps[checked], nextProps.hasOwnProperty(checked) && propKey$221 !== propKey && (propKey$221 != null || propKey != null))
                switch (checked) {
                  case "children":
                  case "dangerouslySetInnerHTML":
                    if (propKey$221 != null)
                      throw Error(formatProdErrorMessage(137, tag));
                    break;
                  default:
                    setProp(
                      domElement,
                      tag,
                      checked,
                      propKey$221,
                      nextProps,
                      propKey
                    );
                }
            return;
          default:
            if (isCustomElement(tag)) {
              for (var propKey$247 in lastProps)
                propKey$221 = lastProps[propKey$247], lastProps.hasOwnProperty(propKey$247) && propKey$221 !== void 0 && !nextProps.hasOwnProperty(propKey$247) && setPropOnCustomElement(
                  domElement,
                  tag,
                  propKey$247,
                  void 0,
                  nextProps,
                  propKey$221
                );
              for (defaultChecked in nextProps)
                propKey$221 = nextProps[defaultChecked], propKey = lastProps[defaultChecked], !nextProps.hasOwnProperty(defaultChecked) || propKey$221 === propKey || propKey$221 === void 0 && propKey === void 0 || setPropOnCustomElement(
                  domElement,
                  tag,
                  defaultChecked,
                  propKey$221,
                  nextProps,
                  propKey
                );
              return;
            }
        }
        for (var propKey$252 in lastProps)
          propKey$221 = lastProps[propKey$252], lastProps.hasOwnProperty(propKey$252) && propKey$221 != null && !nextProps.hasOwnProperty(propKey$252) && setProp(domElement, tag, propKey$252, null, nextProps, propKey$221);
        for (lastProp in nextProps)
          propKey$221 = nextProps[lastProp], propKey = lastProps[lastProp], !nextProps.hasOwnProperty(lastProp) || propKey$221 === propKey || propKey$221 == null && propKey == null || setProp(domElement, tag, lastProp, propKey$221, nextProps, propKey);
      }
      function isLikelyStaticResource(initiatorType) {
        switch (initiatorType) {
          case "css":
          case "script":
          case "font":
          case "img":
          case "image":
          case "input":
          case "link":
            return !0;
          default:
            return !1;
        }
      }
      function estimateBandwidth() {
        if (typeof performance.getEntriesByType == "function") {
          for (var count = 0, bits = 0, resourceEntries = performance.getEntriesByType("resource"), i = 0; i < resourceEntries.length; i++) {
            var entry = resourceEntries[i], transferSize = entry.transferSize, initiatorType = entry.initiatorType, duration = entry.duration;
            if (transferSize && duration && isLikelyStaticResource(initiatorType)) {
              for (initiatorType = 0, duration = entry.responseEnd, i += 1; i < resourceEntries.length; i++) {
                var overlapEntry = resourceEntries[i], overlapStartTime = overlapEntry.startTime;
                if (overlapStartTime > duration) break;
                var overlapTransferSize = overlapEntry.transferSize, overlapInitiatorType = overlapEntry.initiatorType;
                overlapTransferSize && isLikelyStaticResource(overlapInitiatorType) && (overlapEntry = overlapEntry.responseEnd, initiatorType += overlapTransferSize * (overlapEntry < duration ? 1 : (duration - overlapStartTime) / (overlapEntry - overlapStartTime)));
              }
              if (--i, bits += 8 * (transferSize + initiatorType) / (entry.duration / 1e3), count++, 10 < count) break;
            }
          }
          if (0 < count) return bits / count / 1e6;
        }
        return navigator.connection && (count = navigator.connection.downlink, typeof count == "number") ? count : 5;
      }
      var eventsEnabled = null, selectionInformation = null;
      function getOwnerDocumentFromRootContainer(rootContainerElement) {
        return rootContainerElement.nodeType === 9 ? rootContainerElement : rootContainerElement.ownerDocument;
      }
      function getOwnHostContext(namespaceURI) {
        switch (namespaceURI) {
          case "http://www.w3.org/2000/svg":
            return 1;
          case "http://www.w3.org/1998/Math/MathML":
            return 2;
          default:
            return 0;
        }
      }
      function getChildHostContextProd(parentNamespace, type) {
        if (parentNamespace === 0)
          switch (type) {
            case "svg":
              return 1;
            case "math":
              return 2;
            default:
              return 0;
          }
        return parentNamespace === 1 && type === "foreignObject" ? 0 : parentNamespace;
      }
      function createHoistableInstance(type, props, rootContainerInstance, internalInstanceHandle) {
        return rootContainerInstance = getOwnerDocumentFromRootContainer(
          rootContainerInstance
        ).createElement(type), rootContainerInstance[internalInstanceKey] = internalInstanceHandle, rootContainerInstance[internalPropsKey] = props, setInitialProperties(rootContainerInstance, type, props), markNodeAsHoistable(rootContainerInstance), rootContainerInstance;
      }
      function shouldSetTextContent(type, props) {
        return type === "textarea" || type === "noscript" || typeof props.children == "string" || typeof props.children == "number" || typeof props.children == "bigint" || typeof props.dangerouslySetInnerHTML == "object" && props.dangerouslySetInnerHTML !== null && props.dangerouslySetInnerHTML.__html != null;
      }
      var currentPopstateTransitionEvent = null;
      function shouldAttemptEagerTransition() {
        var event = window.event;
        return event && event.type === "popstate" ? event === currentPopstateTransitionEvent ? !1 : (currentPopstateTransitionEvent = event, !0) : (currentPopstateTransitionEvent = null, !1);
      }
      var scheduleTimeout = typeof setTimeout == "function" ? setTimeout : void 0, cancelTimeout = typeof clearTimeout == "function" ? clearTimeout : void 0, localPromise = typeof Promise == "function" ? Promise : void 0, localRequestAnimationFrame = typeof requestAnimationFrame == "function" ? requestAnimationFrame : scheduleTimeout, scheduleMicrotask = typeof queueMicrotask == "function" ? queueMicrotask : typeof localPromise < "u" ? function(callback) {
        return localPromise.resolve(null).then(callback).catch(handleErrorInNextTick);
      } : scheduleTimeout;
      function handleErrorInNextTick(error) {
        setTimeout(function() {
          throw error;
        });
      }
      function isSingletonScope(type) {
        return type === "head";
      }
      function clearHydrationBoundary(parentInstance, hydrationInstance) {
        var node = hydrationInstance, depth = 0;
        do {
          var nextNode = node.nextSibling;
          if (parentInstance.removeChild(node), nextNode && nextNode.nodeType === 8)
            if (node = nextNode.data, node === "/$" || node === "/&") {
              if (depth === 0) {
                parentInstance.removeChild(nextNode), retryIfBlockedOn(hydrationInstance);
                return;
              }
              depth--;
            } else if (node === "$" || node === "$?" || node === "$~" || node === "$!" || node === "&")
              depth++;
            else if (node === "html")
              clearSingletonPreambleContribution(
                parentInstance.ownerDocument.documentElement
              );
            else if (node === "head") {
              node = parentInstance.ownerDocument.head, clearSingletonPreambleContribution(node);
              for (var node$jscomp$0 = node.firstChild; node$jscomp$0; ) {
                var nextNode$jscomp$0 = node$jscomp$0.nextSibling, nodeName = node$jscomp$0.nodeName;
                node$jscomp$0[internalHoistableMarker] || nodeName === "SCRIPT" || nodeName === "STYLE" || nodeName === "LINK" && node$jscomp$0.rel.toLowerCase() === "stylesheet" || node.removeChild(node$jscomp$0), node$jscomp$0 = nextNode$jscomp$0;
              }
            } else
              node === "body" && clearSingletonPreambleContribution(parentInstance.ownerDocument.body);
          node = nextNode;
        } while (node);
        retryIfBlockedOn(hydrationInstance);
      }
      function hideOrUnhideDehydratedBoundary(suspenseInstance, isHidden) {
        var node = suspenseInstance;
        suspenseInstance = 0;
        do {
          var nextNode = node.nextSibling;
          if (node.nodeType === 1 ? isHidden ? (node._stashedDisplay = node.style.display, node.style.display = "none") : (node.style.display = node._stashedDisplay || "", node.getAttribute("style") === "" && node.removeAttribute("style")) : node.nodeType === 3 && (isHidden ? (node._stashedText = node.nodeValue, node.nodeValue = "") : node.nodeValue = node._stashedText || ""), nextNode && nextNode.nodeType === 8)
            if (node = nextNode.data, node === "/$") {
              if (suspenseInstance === 0) break;
              suspenseInstance--;
            } else
              node !== "$" && node !== "$?" && node !== "$~" && node !== "$!" || suspenseInstance++;
          node = nextNode;
        } while (node);
      }
      function applyViewTransitionName(instance, name, className) {
        if (name = CSS.escape(name) !== name ? "r-" + btoa(name).replace(/=/g, "") : name, instance.style.viewTransitionName = name, className != null && (instance.style.viewTransitionClass = className), className = getComputedStyle(instance), className.display === "inline") {
          if (name = instance.getClientRects(), name.length === 1) var JSCompiler_inline_result = 1;
          else
            for (var i = JSCompiler_inline_result = 0; i < name.length; i++) {
              var rect = name[i];
              0 < rect.width && 0 < rect.height && JSCompiler_inline_result++;
            }
          JSCompiler_inline_result === 1 && (instance = instance.style, instance.display = name.length === 1 ? "inline-block" : "block", instance.marginTop = "-" + className.paddingTop, instance.marginBottom = "-" + className.paddingBottom);
        }
      }
      function restoreViewTransitionName(instance, props) {
        instance = instance.style, props = props.style;
        var viewTransitionName = props != null ? props.hasOwnProperty("viewTransitionName") ? props.viewTransitionName : props.hasOwnProperty("view-transition-name") ? props["view-transition-name"] : null : null;
        instance.viewTransitionName = viewTransitionName == null || typeof viewTransitionName == "boolean" ? "" : ("" + viewTransitionName).trim(), viewTransitionName = props != null ? props.hasOwnProperty("viewTransitionClass") ? props.viewTransitionClass : props.hasOwnProperty("view-transition-class") ? props["view-transition-class"] : null : null, instance.viewTransitionClass = viewTransitionName == null || typeof viewTransitionName == "boolean" ? "" : ("" + viewTransitionName).trim(), instance.display === "inline-block" && (props == null ? instance.display = instance.margin = "" : (viewTransitionName = props.display, instance.display = viewTransitionName == null || typeof viewTransitionName == "boolean" ? "" : viewTransitionName, viewTransitionName = props.margin, viewTransitionName != null ? instance.margin = viewTransitionName : (viewTransitionName = props.hasOwnProperty("marginTop") ? props.marginTop : props["margin-top"], instance.marginTop = viewTransitionName == null || typeof viewTransitionName == "boolean" ? "" : viewTransitionName, props = props.hasOwnProperty("marginBottom") ? props.marginBottom : props["margin-bottom"], instance.marginBottom = props == null || typeof props == "boolean" ? "" : props)));
      }
      function createMeasurement(rect, computedStyle, element) {
        return element = element.ownerDocument.defaultView, {
          rect,
          abs: computedStyle.position === "absolute" || computedStyle.position === "fixed",
          clip: computedStyle.clipPath !== "none" || computedStyle.overflow !== "visible" || computedStyle.filter !== "none" || computedStyle.mask !== "none" || computedStyle.mask !== "none" || computedStyle.borderRadius !== "0px",
          view: 0 <= rect.bottom && 0 <= rect.right && rect.top <= element.innerHeight && rect.left <= element.innerWidth
        };
      }
      function measureInstance(instance) {
        var rect = instance.getBoundingClientRect(), computedStyle = getComputedStyle(instance);
        return createMeasurement(rect, computedStyle, instance);
      }
      function measureClonedInstance(instance) {
        var measuredRect = instance.getBoundingClientRect();
        measuredRect = new DOMRect(
          measuredRect.x + 2e4,
          measuredRect.y + 2e4,
          measuredRect.width,
          measuredRect.height
        );
        var computedStyle = getComputedStyle(instance);
        return createMeasurement(measuredRect, computedStyle, instance);
      }
      function forceLayout(ownerDocument) {
        return ownerDocument.documentElement.clientHeight;
      }
      function waitForImageToLoad(resolve) {
        this.addEventListener("load", resolve), this.addEventListener("error", resolve);
      }
      function startViewTransition(suspendedState, rootContainer, transitionTypes, mutationCallback, layoutCallback, afterMutationCallback, spawnedWorkCallback, passiveCallback, errorCallback) {
        var ownerDocument = rootContainer.nodeType === 9 ? rootContainer : rootContainer.ownerDocument;
        try {
          var transition = ownerDocument.startViewTransition({
            update: function() {
              var ownerWindow = ownerDocument.defaultView, pendingNavigation = ownerWindow.navigation && ownerWindow.navigation.transition, previousFontLoadingStatus = ownerDocument.fonts.status;
              mutationCallback();
              var blockingPromises = [];
              if (previousFontLoadingStatus === "loaded" && (forceLayout(ownerDocument), ownerDocument.fonts.status === "loading" && blockingPromises.push(ownerDocument.fonts.ready)), previousFontLoadingStatus = blockingPromises.length, suspendedState !== null)
                for (var suspenseyImages = suspendedState.suspenseyImages, imgBytes = 0, i = 0; i < suspenseyImages.length; i++) {
                  var suspenseyImage = suspenseyImages[i];
                  if (!suspenseyImage.complete) {
                    var rect = suspenseyImage.getBoundingClientRect();
                    if (0 < rect.bottom && 0 < rect.right && rect.top < ownerWindow.innerHeight && rect.left < ownerWindow.innerWidth) {
                      if (imgBytes += estimateImageBytes(suspenseyImage), imgBytes > estimatedBytesWithinLimit) {
                        blockingPromises.length = previousFontLoadingStatus;
                        break;
                      }
                      suspenseyImage = new Promise(
                        waitForImageToLoad.bind(suspenseyImage)
                      ), blockingPromises.push(suspenseyImage);
                    }
                  }
                }
              if (0 < blockingPromises.length)
                return ownerWindow = Promise.race([
                  Promise.all(blockingPromises),
                  new Promise(function(resolve) {
                    return setTimeout(resolve, 500);
                  })
                ]).then(layoutCallback, layoutCallback), (pendingNavigation ? Promise.allSettled([pendingNavigation.finished, ownerWindow]) : ownerWindow).then(afterMutationCallback, afterMutationCallback);
              if (layoutCallback(), pendingNavigation)
                return pendingNavigation.finished.then(
                  afterMutationCallback,
                  afterMutationCallback
                );
              afterMutationCallback();
            },
            types: transitionTypes
          });
          ownerDocument.__reactViewTransition = transition;
          var viewTransitionAnimations = [];
          return transition.ready.then(
            function() {
              for (var animations = ownerDocument.documentElement.getAnimations({
                subtree: !0
              }), i = 0; i < animations.length; i++) {
                var animation = animations[i], effect = animation.effect, pseudoElement = effect.pseudoElement;
                if (pseudoElement != null && pseudoElement.startsWith("::view-transition")) {
                  viewTransitionAnimations.push(animation), animation = effect.getKeyframes();
                  for (var height = pseudoElement = void 0, unchangedDimensions = !0, j = 0; j < animation.length; j++) {
                    var keyframe = animation[j], w = keyframe.width;
                    if (pseudoElement === void 0) pseudoElement = w;
                    else if (pseudoElement !== w) {
                      unchangedDimensions = !1;
                      break;
                    }
                    if (w = keyframe.height, height === void 0) height = w;
                    else if (height !== w) {
                      unchangedDimensions = !1;
                      break;
                    }
                    delete keyframe.width, delete keyframe.height, keyframe.transform === "none" && delete keyframe.transform;
                  }
                  unchangedDimensions && pseudoElement !== void 0 && height !== void 0 && (effect.setKeyframes(animation), unchangedDimensions = getComputedStyle(
                    effect.target,
                    effect.pseudoElement
                  ), unchangedDimensions.width !== pseudoElement || unchangedDimensions.height !== height) && (unchangedDimensions = animation[0], unchangedDimensions.width = pseudoElement, unchangedDimensions.height = height, unchangedDimensions = animation[animation.length - 1], unchangedDimensions.width = pseudoElement, unchangedDimensions.height = height, effect.setKeyframes(animation));
                }
              }
              spawnedWorkCallback();
            },
            function(error) {
              ownerDocument.__reactViewTransition === transition && (ownerDocument.__reactViewTransition = null);
              try {
                typeof error == "object" && error !== null && error.name === "InvalidStateError" && (error.message === "View transition was skipped because document visibility state is hidden." || error.message === "Skipping view transition because document visibility state has become hidden." || error.message === "Skipping view transition because viewport size changed." || error.message === "Transition was aborted because of invalid state") && (error = null), error !== null && errorCallback(error);
              } finally {
                mutationCallback(), layoutCallback(), spawnedWorkCallback();
              }
            }
          ), transition.finished.finally(function() {
            for (var i = 0; i < viewTransitionAnimations.length; i++)
              viewTransitionAnimations[i].cancel();
            ownerDocument.__reactViewTransition === transition && (ownerDocument.__reactViewTransition = null), passiveCallback();
          }), transition;
        } catch {
          return mutationCallback(), layoutCallback(), spawnedWorkCallback(), null;
        }
      }
      function ViewTransitionPseudoElement(pseudo2, name) {
        this._scope = document.documentElement, this._selector = "::view-transition-" + pseudo2 + "(" + name + ")";
      }
      ViewTransitionPseudoElement.prototype.animate = function(keyframes, options3) {
        return options3 = typeof options3 == "number" ? { duration: options3 } : assign({}, options3), options3.pseudoElement = this._selector, this._scope.animate(keyframes, options3);
      };
      ViewTransitionPseudoElement.prototype.getAnimations = function() {
        for (var scope = this._scope, selector = this._selector, animations = scope.getAnimations({ subtree: !0 }), result = [], i = 0; i < animations.length; i++) {
          var effect = animations[i].effect;
          effect !== null && effect.target === scope && effect.pseudoElement === selector && result.push(animations[i]);
        }
        return result;
      };
      ViewTransitionPseudoElement.prototype.getComputedStyle = function() {
        return getComputedStyle(this._scope, this._selector);
      };
      function createViewTransitionInstance(name) {
        return {
          name,
          group: new ViewTransitionPseudoElement("group", name),
          imagePair: new ViewTransitionPseudoElement("image-pair", name),
          old: new ViewTransitionPseudoElement("old", name),
          new: new ViewTransitionPseudoElement("new", name)
        };
      }
      function FragmentInstance(fragmentFiber) {
        this._fragmentFiber = fragmentFiber, this._observers = this._eventListeners = null;
      }
      FragmentInstance.prototype.addEventListener = function(type, listener, optionsOrUseCapture) {
        var signal = null, cleanup = null;
        if (!(optionsOrUseCapture != null && typeof optionsOrUseCapture != "boolean" && (signal = optionsOrUseCapture.signal || null, signal !== null && signal.aborted))) {
          this._eventListeners === null && (this._eventListeners = []);
          var listeners = this._eventListeners;
          if (indexOfEventListener(listeners, type, listener, optionsOrUseCapture) === -1) {
            var fragmentInstance = this, attachedListener = listener;
            optionsOrUseCapture != null && typeof optionsOrUseCapture != "boolean" && optionsOrUseCapture.once === !0 && (attachedListener = function(event) {
              fragmentInstance.removeEventListener(
                type,
                listener,
                optionsOrUseCapture
              ), typeof listener == "function" ? listener.call(this, event) : listener.handleEvent(event);
            }), signal !== null && (cleanup = fragmentInstance.removeEventListener.bind(
              fragmentInstance,
              type,
              listener,
              optionsOrUseCapture
            ), signal.addEventListener("abort", cleanup, { once: !0 }), cleanup = signal.removeEventListener.bind(signal, "abort", cleanup)), signal = getAttachOptions(optionsOrUseCapture), listeners.push({
              type,
              listener,
              optionsOrUseCapture,
              attachedListener,
              cleanup
            }), traverseVisibleInstancesAndTextInstances(
              this._fragmentFiber.child,
              !1,
              addEventListenerToChild,
              type,
              attachedListener,
              signal
            );
          }
          this._eventListeners = listeners;
        }
      };
      function addEventListenerToChild(child, type, listener, optionsOrUseCapture) {
        return getInstanceFromHostFiber(child).addEventListener(
          type,
          listener,
          optionsOrUseCapture
        ), !1;
      }
      FragmentInstance.prototype.removeEventListener = function(type, listener, optionsOrUseCapture) {
        var listeners = this._eventListeners;
        if (listeners !== null && (listener = indexOfEventListener(
          listeners,
          type,
          listener,
          optionsOrUseCapture
        ), listener !== -1)) {
          var _listeners$index = listeners[listener];
          optionsOrUseCapture = _listeners$index.attachedListener;
          var cleanup = _listeners$index.cleanup;
          _listeners$index = getAttachOptions(_listeners$index.optionsOrUseCapture), traverseVisibleInstancesAndTextInstances(
            this._fragmentFiber.child,
            !1,
            removeEventListenerFromChild,
            type,
            optionsOrUseCapture,
            _listeners$index
          ), listeners.splice(listener, 1), cleanup !== null && cleanup();
        }
      };
      function removeEventListenerFromChild(child, type, listener, optionsOrUseCapture) {
        return getInstanceFromHostFiber(child).removeEventListener(
          type,
          listener,
          optionsOrUseCapture
        ), !1;
      }
      function getAttachOptions(opts) {
        return opts != null && typeof opts != "boolean" && (opts.once === !0 || opts.signal instanceof AbortSignal) ? { capture: opts.capture, passive: opts.passive } : opts;
      }
      function normalizeListenerOptions(opts) {
        return opts == null ? "c=0" : typeof opts == "boolean" ? "c=" + (opts ? "1" : "0") : "c=" + (opts.capture ? "1" : "0");
      }
      function indexOfEventListener(eventListeners, type, listener, optionsOrUseCapture) {
        if (eventListeners.length === 0) return -1;
        optionsOrUseCapture = normalizeListenerOptions(optionsOrUseCapture);
        for (var i = 0; i < eventListeners.length; i++) {
          var item = eventListeners[i];
          if (item.type === type && item.listener === listener && normalizeListenerOptions(item.optionsOrUseCapture) === optionsOrUseCapture)
            return i;
        }
        return -1;
      }
      FragmentInstance.prototype.dispatchEvent = function(event) {
        var parentHostFiber = getFragmentParentInstanceOrContainerFiber(
          this._fragmentFiber
        );
        if (parentHostFiber === null) return !0;
        parentHostFiber = getInstanceFromHostFiber(parentHostFiber);
        var eventListeners = this._eventListeners;
        if (eventListeners !== null && 0 < eventListeners.length || !event.bubbles) {
          var temp = parentHostFiber.nodeType === 9 ? parentHostFiber.createComment("") : document.createTextNode("");
          if (eventListeners)
            for (var i = 0; i < eventListeners.length; i++) {
              var _eventListeners$i = eventListeners[i];
              temp.addEventListener(
                _eventListeners$i.type,
                _eventListeners$i.attachedListener,
                getAttachOptions(_eventListeners$i.optionsOrUseCapture)
              );
            }
          if (parentHostFiber.appendChild(temp), event = temp.dispatchEvent(event), eventListeners)
            for (i = 0; i < eventListeners.length; i++)
              _eventListeners$i = eventListeners[i], temp.removeEventListener(
                _eventListeners$i.type,
                _eventListeners$i.attachedListener,
                getAttachOptions(_eventListeners$i.optionsOrUseCapture)
              );
          return parentHostFiber.removeChild(temp), event;
        }
        return parentHostFiber.dispatchEvent(event);
      };
      FragmentInstance.prototype.focus = function(focusOptions) {
        traverseVisibleInstancesAndTextInstances(
          this._fragmentFiber.child,
          !0,
          setFocusOnFiberIfFocusable,
          focusOptions,
          void 0,
          void 0
        );
      };
      function setFocusOnFiberIfFocusable(fiber, focusOptions) {
        return fiber.tag === 6 ? !1 : (fiber = getInstanceFromHostFiber(fiber), setFocusIfFocusable(fiber, focusOptions));
      }
      FragmentInstance.prototype.focusLast = function(focusOptions) {
        var children = [];
        traverseVisibleInstancesAndTextInstances(
          this._fragmentFiber.child,
          !0,
          collectChildren,
          children,
          void 0,
          void 0
        );
        for (var i = children.length - 1; 0 <= i && !setFocusOnFiberIfFocusable(children[i], focusOptions); i--) ;
      };
      function collectChildren(child, collection) {
        return collection.push(child), !1;
      }
      FragmentInstance.prototype.blur = function() {
        var parentHostFiber = getFragmentParentInstanceOrContainerFiber(
          this._fragmentFiber
        );
        parentHostFiber !== null && (parentHostFiber = getInstanceFromHostFiber(parentHostFiber), parentHostFiber = getOwnerDocumentFromRootContainer(parentHostFiber).activeElement, parentHostFiber !== null && traverseVisibleInstancesAndTextInstances(
          this._fragmentFiber.child,
          !1,
          blurActiveElementWithinFragment,
          parentHostFiber,
          void 0,
          void 0
        ));
      };
      function blurActiveElementWithinFragment(child, activeElement2) {
        return child.tag === 6 ? !1 : (child = getInstanceFromHostFiber(child), child === activeElement2 || child.contains(activeElement2) ? (activeElement2.blur(), !0) : !1);
      }
      FragmentInstance.prototype.observeUsing = function(observer) {
        this._observers === null && (this._observers = /* @__PURE__ */ new Set()), this._observers.add(observer), traverseVisibleInstancesAndTextInstances(
          this._fragmentFiber.child,
          !1,
          observeChild,
          observer,
          void 0,
          void 0
        );
      };
      function observeChild(child, observer) {
        return child.tag === 6 || (child = getInstanceFromHostFiber(child), observer.observe(child)), !1;
      }
      FragmentInstance.prototype.unobserveUsing = function(observer) {
        var observers = this._observers;
        if (observers !== null && observers.has(observer)) {
          observers.delete(observer), traverseVisibleInstancesAndTextInstances(
            this._fragmentFiber.child,
            !1,
            unobserveChild,
            observer,
            void 0,
            void 0
          );
          for (var i = observers = 0; i < pendingIntersectionUnobserves.length; i++) {
            var pending = pendingIntersectionUnobserves[i];
            pending.fragmentInstance === this && pending.observer === observer ? observer.unobserve(pending.instance) : pendingIntersectionUnobserves[observers++] = pending;
          }
          pendingIntersectionUnobserves.length = observers;
        }
      };
      function unobserveChild(child, observer) {
        return child.tag === 6 || (child = getInstanceFromHostFiber(child), observer.unobserve(child)), !1;
      }
      var pendingIntersectionUnobserves = [], intersectionUnobserveScheduled = !1;
      function schedulePendingIntersectionUnobserve(fragmentInstance, observer, instance) {
        pendingIntersectionUnobserves.push({
          fragmentInstance,
          observer,
          instance
        }), intersectionUnobserveScheduled || (intersectionUnobserveScheduled = !0, requestPostPaintCallback(function() {
          intersectionUnobserveScheduled = !1;
          var pending = pendingIntersectionUnobserves;
          pendingIntersectionUnobserves = [];
          for (var i = 0; i < pending.length; i++) {
            var item = pending[i];
            item.observer.unobserve(item.instance);
          }
        }));
      }
      FragmentInstance.prototype.getClientRects = function() {
        var rects = [];
        return traverseVisibleInstancesAndTextInstances(
          this._fragmentFiber.child,
          !1,
          collectClientRects,
          rects,
          void 0,
          void 0
        ), rects;
      };
      function collectClientRects(child, rects) {
        if (child.tag === 6) {
          child = child.stateNode;
          var range = child.ownerDocument.createRange();
          range.selectNodeContents(child), rects.push.apply(rects, range.getClientRects());
        } else
          child = getInstanceFromHostFiber(child), rects.push.apply(rects, child.getClientRects());
        return !1;
      }
      FragmentInstance.prototype.getRootNode = function(getRootNodeOptions) {
        var parentHostFiber = getFragmentParentInstanceOrContainerFiber(
          this._fragmentFiber
        );
        return parentHostFiber === null ? this : getInstanceFromHostFiber(parentHostFiber).getRootNode(getRootNodeOptions);
      };
      FragmentInstance.prototype.compareDocumentPosition = function(otherNode) {
        var parentHostFiber = getFragmentParentInstanceOrContainerFiber(
          this._fragmentFiber
        );
        if (parentHostFiber === null) return Node.DOCUMENT_POSITION_DISCONNECTED;
        var children = [];
        traverseVisibleInstancesAndTextInstances(
          this._fragmentFiber.child,
          !1,
          collectChildren,
          children,
          void 0,
          void 0
        );
        var parentHostInstance = getInstanceFromHostFiber(parentHostFiber);
        if (children.length === 0) {
          if (children = parentHostInstance, fiberIsPortaledIntoHost(this._fragmentFiber)) {
            a: {
              for (parentHostFiber = this._fragmentFiber.return; parentHostFiber !== null; ) {
                if (parentHostFiber.tag === 4) {
                  parentHostFiber = parentHostFiber.stateNode.containerInfo;
                  break a;
                }
                if (parentHostFiber.tag === 3 || parentHostFiber.tag === 5 || parentHostFiber.tag === 27)
                  break;
                parentHostFiber = parentHostFiber.return;
              }
              parentHostFiber = null;
            }
            parentHostFiber != null && (children = parentHostFiber);
          }
          parentHostFiber = this._fragmentFiber;
          var result = parentHostInstance = children.compareDocumentPosition(otherNode);
          return children === otherNode ? result = Node.DOCUMENT_POSITION_CONTAINS : parentHostInstance & Node.DOCUMENT_POSITION_CONTAINED_BY && (children = getFragmentInstanceOrTextInstanceSiblings(parentHostFiber)[1], children === null ? result = Node.DOCUMENT_POSITION_PRECEDING : (otherNode = getInstanceFromHostFiber(children).compareDocumentPosition(
            otherNode
          ), result = otherNode === 0 || otherNode & Node.DOCUMENT_POSITION_FOLLOWING ? Node.DOCUMENT_POSITION_FOLLOWING : Node.DOCUMENT_POSITION_PRECEDING)), result |= Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC;
        }
        parentHostFiber = getInstanceFromHostFiber(children[0]), result = getInstanceFromHostFiber(children[children.length - 1]);
        var parentHostInstanceFromDOM = fiberIsPortaledIntoHost(this._fragmentFiber) ? parentHostFiber.parentElement : parentHostInstance;
        if (parentHostInstanceFromDOM == null)
          return Node.DOCUMENT_POSITION_DISCONNECTED;
        parentHostInstance = parentHostInstanceFromDOM.compareDocumentPosition(parentHostFiber) & Node.DOCUMENT_POSITION_CONTAINED_BY, parentHostInstanceFromDOM = parentHostInstanceFromDOM.compareDocumentPosition(result) & Node.DOCUMENT_POSITION_CONTAINED_BY;
        var firstResult = parentHostFiber.compareDocumentPosition(otherNode), lastResult = result.compareDocumentPosition(otherNode), otherNodeIsWithinFirstOrLastChild = firstResult & Node.DOCUMENT_POSITION_CONTAINED_BY || lastResult & Node.DOCUMENT_POSITION_CONTAINED_BY;
        return lastResult = parentHostInstance && parentHostInstanceFromDOM && firstResult & Node.DOCUMENT_POSITION_FOLLOWING && lastResult & Node.DOCUMENT_POSITION_PRECEDING, parentHostFiber = parentHostInstance && parentHostFiber === otherNode || parentHostInstanceFromDOM && result === otherNode || otherNodeIsWithinFirstOrLastChild || lastResult ? Node.DOCUMENT_POSITION_CONTAINED_BY : !parentHostInstance && parentHostFiber === otherNode || !parentHostInstanceFromDOM && result === otherNode ? Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC : firstResult, parentHostFiber & Node.DOCUMENT_POSITION_DISCONNECTED || parentHostFiber & Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC || validateDocumentPositionWithFiberTree(
          parentHostFiber,
          this._fragmentFiber,
          children[0],
          children[children.length - 1],
          otherNode
        ) ? parentHostFiber : Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC;
      };
      function validateDocumentPositionWithFiberTree(documentPosition, fragmentFiber, precedingBoundaryFiber, followingBoundaryFiber, otherNode) {
        var otherFiber = getClosestInstanceFromNode(otherNode);
        if (documentPosition & Node.DOCUMENT_POSITION_CONTAINED_BY) {
          if (precedingBoundaryFiber = !!otherFiber)
            a: {
              for (; otherFiber !== null; ) {
                if (otherFiber.tag === 7 && (otherFiber === fragmentFiber || otherFiber.alternate === fragmentFiber)) {
                  precedingBoundaryFiber = !0;
                  break a;
                }
                otherFiber = otherFiber.return;
              }
              precedingBoundaryFiber = !1;
            }
          return precedingBoundaryFiber;
        }
        if (documentPosition & Node.DOCUMENT_POSITION_CONTAINS) {
          if (otherFiber === null)
            return otherFiber = otherNode.ownerDocument, otherNode === otherFiber || otherNode === otherFiber.documentElement || otherNode === otherFiber.body;
          a: {
            for (otherFiber = fragmentFiber, fragmentFiber = getFragmentParentInstanceOrContainerFiber(fragmentFiber); otherFiber !== null; ) {
              if (!(otherFiber.tag !== 5 && otherFiber.tag !== 3 && otherFiber.tag !== 27 || otherFiber !== fragmentFiber && otherFiber.alternate !== fragmentFiber)) {
                otherFiber = !0;
                break a;
              }
              otherFiber = otherFiber.return;
            }
            otherFiber = !1;
          }
          return otherFiber;
        }
        return documentPosition & Node.DOCUMENT_POSITION_PRECEDING ? ((fragmentFiber = !!otherFiber) && !(fragmentFiber = otherFiber === precedingBoundaryFiber) && (fragmentFiber = getLowestCommonAncestor(
          precedingBoundaryFiber,
          otherFiber,
          getParentForFragmentAncestors
        ), fragmentFiber === null ? fragmentFiber = !1 : (traverseVisibleInstancesAndTextInstances(
          fragmentFiber,
          !0,
          isFiberPrecedingCheck,
          otherFiber,
          precedingBoundaryFiber
        ), otherFiber = searchTarget, searchTarget = null, fragmentFiber = otherFiber !== null)), fragmentFiber) : documentPosition & Node.DOCUMENT_POSITION_FOLLOWING ? ((fragmentFiber = !!otherFiber) && !(fragmentFiber = otherFiber === followingBoundaryFiber) && (fragmentFiber = getLowestCommonAncestor(
          followingBoundaryFiber,
          otherFiber,
          getParentForFragmentAncestors
        ), fragmentFiber === null ? fragmentFiber = !1 : (traverseVisibleInstancesAndTextInstances(
          fragmentFiber,
          !0,
          isFiberFollowingCheck,
          otherFiber,
          followingBoundaryFiber
        ), otherFiber = searchTarget, searchBoundary = searchTarget = null, fragmentFiber = otherFiber !== null)), fragmentFiber) : !1;
      }
      function scrollTextNodeIntoView(textNode, resolvedAlignToTop) {
        var range = textNode.ownerDocument.createRange();
        range.selectNodeContents(textNode), textNode = range.getBoundingClientRect(), window.scrollTo(
          window.scrollX + textNode.left,
          resolvedAlignToTop ? window.scrollY + textNode.top : window.scrollY + textNode.bottom - window.innerHeight
        );
      }
      FragmentInstance.prototype.scrollIntoView = function(alignToTop) {
        if (typeof alignToTop == "object") throw Error(formatProdErrorMessage(566));
        var children = [];
        traverseVisibleInstancesAndTextInstances(
          this._fragmentFiber.child,
          !1,
          collectChildren,
          children,
          void 0,
          void 0
        );
        var resolvedAlignToTop = alignToTop !== !1;
        if (children.length === 0) {
          var hostSiblings = getFragmentInstanceOrTextInstanceSiblings(
            this._fragmentFiber
          );
          if (hostSiblings = resolvedAlignToTop ? hostSiblings[1] || hostSiblings[0] || getFragmentParentInstanceOrContainerFiber(this._fragmentFiber) : hostSiblings[0] || hostSiblings[1], hostSiblings === null) return;
          if (hostSiblings.tag === 6) {
            alignToTop = getInstanceFromHostFiber(hostSiblings), scrollTextNodeIntoView(alignToTop, resolvedAlignToTop);
            return;
          }
          if (hostSiblings = getInstanceFromHostFiber(hostSiblings), hostSiblings.nodeType !== 9) {
            if (hostSiblings.nodeType === 11) {
              resolvedAlignToTop = "host" in hostSiblings ? hostSiblings.host : null, resolvedAlignToTop !== null && resolvedAlignToTop.scrollIntoView(alignToTop);
              return;
            }
            hostSiblings.scrollIntoView(alignToTop);
          }
        }
        for (hostSiblings = resolvedAlignToTop ? children.length - 1 : 0; hostSiblings !== (resolvedAlignToTop ? -1 : children.length); ) {
          var child = children[hostSiblings];
          child.tag === 6 ? (child = getInstanceFromHostFiber(child), scrollTextNodeIntoView(child, resolvedAlignToTop)) : getInstanceFromHostFiber(child).scrollIntoView(alignToTop), hostSiblings += resolvedAlignToTop ? -1 : 1;
        }
      };
      function addFragmentHandleToFiber(child, fragmentInstance) {
        return child = getInstanceFromHostFiber(child), addFragmentHandleToInstance(child, fragmentInstance), !1;
      }
      function addFragmentHandleToInstance(instance, fragmentInstance) {
        instance.reactFragments == null && (instance.reactFragments = /* @__PURE__ */ new Set()), instance.reactFragments.add(fragmentInstance);
      }
      function commitNewChildToFragmentInstance(childInstance, fragmentInstance) {
        var eventListeners = fragmentInstance._eventListeners;
        if (eventListeners !== null)
          for (var i$jscomp$0 = 0; i$jscomp$0 < eventListeners.length; i$jscomp$0++) {
            var _eventListeners$i3 = eventListeners[i$jscomp$0];
            childInstance.addEventListener(
              _eventListeners$i3.type,
              _eventListeners$i3.attachedListener,
              getAttachOptions(_eventListeners$i3.optionsOrUseCapture)
            );
          }
        childInstance.nodeType !== 3 && (eventListeners = fragmentInstance._observers, eventListeners !== null && eventListeners.forEach(function(observer) {
          for (var writeIdx = 0, i = 0; i < pendingIntersectionUnobserves.length; i++) {
            var pending = pendingIntersectionUnobserves[i];
            (pending.fragmentInstance !== fragmentInstance || pending.observer !== observer || pending.instance !== childInstance) && (pendingIntersectionUnobserves[writeIdx++] = pending);
          }
          pendingIntersectionUnobserves.length = writeIdx, observer.observe(childInstance);
        }), addFragmentHandleToInstance(childInstance, fragmentInstance));
      }
      function deleteChildFromFragmentInstance(childInstance, fragmentInstance) {
        var eventListeners = fragmentInstance._eventListeners;
        if (eventListeners !== null)
          for (var i = 0; i < eventListeners.length; i++) {
            var _eventListeners$i4 = eventListeners[i];
            childInstance.removeEventListener(
              _eventListeners$i4.type,
              _eventListeners$i4.attachedListener,
              getAttachOptions(_eventListeners$i4.optionsOrUseCapture)
            );
          }
        childInstance.nodeType !== 3 && (eventListeners = fragmentInstance._observers, eventListeners !== null && eventListeners.forEach(function(observer) {
          typeof observer.rootMargin == "string" ? schedulePendingIntersectionUnobserve(
            fragmentInstance,
            observer,
            childInstance
          ) : observer.unobserve(childInstance);
        }), childInstance.reactFragments != null && childInstance.reactFragments.delete(fragmentInstance));
      }
      function clearContainerSparingly(container) {
        var nextNode = container.firstChild;
        for (nextNode && nextNode.nodeType === 10 && (nextNode = nextNode.nextSibling); nextNode; ) {
          var node = nextNode;
          switch (nextNode = nextNode.nextSibling, node.nodeName) {
            case "HTML":
            case "HEAD":
            case "BODY":
              clearContainerSparingly(node), detachDeletedInstance(node);
              continue;
            case "SCRIPT":
            case "STYLE":
              continue;
            case "LINK":
              if (node.rel.toLowerCase() === "stylesheet") continue;
          }
          container.removeChild(node);
        }
      }
      function canHydrateInstance(instance, type, props, inRootOrSingleton) {
        for (; instance.nodeType === 1; ) {
          var anyProps = props;
          if (instance.nodeName.toLowerCase() !== type.toLowerCase()) {
            if (!inRootOrSingleton && (instance.nodeName !== "INPUT" || instance.type !== "hidden"))
              break;
          } else if (inRootOrSingleton) {
            if (!instance[internalHoistableMarker])
              switch (type) {
                case "meta":
                  if (!instance.hasAttribute("itemprop")) break;
                  return instance;
                case "link":
                  if (name = instance.getAttribute("rel"), name === "stylesheet" && instance.hasAttribute("data-precedence"))
                    break;
                  if (name !== anyProps.rel || instance.getAttribute("href") !== (anyProps.href == null || anyProps.href === "" ? null : anyProps.href) || instance.getAttribute("crossorigin") !== (anyProps.crossOrigin == null ? null : anyProps.crossOrigin) || instance.getAttribute("title") !== (anyProps.title == null ? null : anyProps.title))
                    break;
                  return instance;
                case "style":
                  if (instance.hasAttribute("data-precedence")) break;
                  return instance;
                case "script":
                  if (name = instance.getAttribute("src"), (name !== (anyProps.src == null ? null : anyProps.src) || instance.getAttribute("type") !== (anyProps.type == null ? null : anyProps.type) || instance.getAttribute("crossorigin") !== (anyProps.crossOrigin == null ? null : anyProps.crossOrigin)) && name && instance.hasAttribute("async") && !instance.hasAttribute("itemprop"))
                    break;
                  return instance;
                default:
                  return instance;
              }
          } else if (type === "input" && instance.type === "hidden") {
            var name = anyProps.name == null ? null : "" + anyProps.name;
            if (anyProps.type === "hidden" && instance.getAttribute("name") === name)
              return instance;
          } else return instance;
          if (instance = getNextHydratable(instance.nextSibling), instance === null) break;
        }
        return null;
      }
      function canHydrateTextInstance(instance, text, inRootOrSingleton) {
        if (text === "") return null;
        for (; instance.nodeType !== 3; )
          if ((instance.nodeType !== 1 || instance.nodeName !== "INPUT" || instance.type !== "hidden") && !inRootOrSingleton || (instance = getNextHydratable(instance.nextSibling), instance === null)) return null;
        return instance;
      }
      function canHydrateHydrationBoundary(instance, inRootOrSingleton) {
        for (; instance.nodeType !== 8; )
          if ((instance.nodeType !== 1 || instance.nodeName !== "INPUT" || instance.type !== "hidden") && !inRootOrSingleton || (instance = getNextHydratable(instance.nextSibling), instance === null)) return null;
        return instance;
      }
      function isSuspenseInstancePending(instance) {
        return instance.data === "$?" || instance.data === "$~";
      }
      function isSuspenseInstanceFallback(instance) {
        return instance.data === "$!" || instance.data === "$?" && instance.ownerDocument.readyState !== "loading";
      }
      function registerSuspenseInstanceRetry(instance, callback) {
        var ownerDocument = instance.ownerDocument;
        if (instance.data === "$~") instance._reactRetry = callback;
        else if (instance.data !== "$?" || ownerDocument.readyState !== "loading")
          callback();
        else {
          var listener = function() {
            callback(), ownerDocument.removeEventListener("DOMContentLoaded", listener);
          };
          ownerDocument.addEventListener("DOMContentLoaded", listener), instance._reactRetry = listener;
        }
      }
      function getNextHydratable(node) {
        for (; node != null; node = node.nextSibling) {
          var nodeType = node.nodeType;
          if (nodeType === 1 || nodeType === 3) break;
          if (nodeType === 8) {
            if (nodeType = node.data, nodeType === "$" || nodeType === "$!" || nodeType === "$?" || nodeType === "$~" || nodeType === "&" || nodeType === "F!" || nodeType === "F")
              break;
            if (nodeType === "/$" || nodeType === "/&") return null;
          }
        }
        return node;
      }
      var previousHydratableOnEnteringScopedSingleton = null;
      function getNextHydratableInstanceAfterHydrationBoundary(hydrationInstance) {
        hydrationInstance = hydrationInstance.nextSibling;
        for (var depth = 0; hydrationInstance; ) {
          if (hydrationInstance.nodeType === 8) {
            var data = hydrationInstance.data;
            if (data === "/$" || data === "/&") {
              if (depth === 0)
                return getNextHydratable(hydrationInstance.nextSibling);
              depth--;
            } else
              data !== "$" && data !== "$!" && data !== "$?" && data !== "$~" && data !== "&" || depth++;
          }
          hydrationInstance = hydrationInstance.nextSibling;
        }
        return null;
      }
      function getParentHydrationBoundary(targetInstance) {
        targetInstance = targetInstance.previousSibling;
        for (var depth = 0; targetInstance; ) {
          if (targetInstance.nodeType === 8) {
            var data = targetInstance.data;
            if (data === "$" || data === "$!" || data === "$?" || data === "$~" || data === "&") {
              if (depth === 0) return targetInstance;
              depth--;
            } else data !== "/$" && data !== "/&" || depth++;
          }
          targetInstance = targetInstance.previousSibling;
        }
        return null;
      }
      function setFocusIfFocusable(node, focusOptions) {
        function handleFocus() {
          didFocus = !0;
        }
        if (node.ownerDocument.activeElement === node) return !0;
        var didFocus = !1;
        try {
          node.ownerDocument.addEventListener("focus", handleFocus, !0), (node.focus || HTMLElement.prototype.focus).call(node, focusOptions);
        } finally {
          node.ownerDocument.removeEventListener("focus", handleFocus, !0);
        }
        return didFocus;
      }
      function requestPostPaintCallback(callback) {
        localRequestAnimationFrame(function() {
          localRequestAnimationFrame(function(time) {
            return callback(time);
          });
        });
      }
      function resolveSingletonInstance(type, props, rootContainerInstance) {
        switch (props = getOwnerDocumentFromRootContainer(rootContainerInstance), type) {
          case "html":
            if (type = props.documentElement, !type) throw Error(formatProdErrorMessage(452));
            return type;
          case "head":
            if (type = props.head, !type) throw Error(formatProdErrorMessage(453));
            return type;
          case "body":
            if (type = props.body, !type) throw Error(formatProdErrorMessage(454));
            return type;
          default:
            throw Error(formatProdErrorMessage(451));
        }
      }
      function releaseSingletonInstance(instance, type, props) {
        for (var propKey in props) {
          var propValue = props[propKey];
          props.hasOwnProperty(propKey) && propValue != null && setProp(instance, type, propKey, null, emptyProps, propValue);
        }
        props.dangerouslySetInnerHTML != null && (instance.textContent = ""), instance.onclick === noop$1 && (instance.onclick = null), detachDeletedInstance(instance);
      }
      function clearSingletonPreambleContribution(instance) {
        for (var attributes = instance.attributes; attributes.length; )
          instance.removeAttributeNode(attributes[0]);
        detachDeletedInstance(instance);
      }
      var preloadPropsMap = /* @__PURE__ */ new Map(), preconnectsSet = /* @__PURE__ */ new Set();
      function getHoistableRoot(container) {
        if (typeof container.getRootNode == "function") {
          var rootNode = container.getRootNode();
          if (rootNode.nodeType === 9 || rootNode.nodeType === 11) return rootNode;
        }
        return container.nodeType === 9 ? container : container.ownerDocument;
      }
      var previousDispatcher = ReactDOMSharedInternals.d;
      ReactDOMSharedInternals.d = {
        f: flushSyncWork,
        r: requestFormReset,
        D: prefetchDNS,
        C: preconnect,
        L: preload,
        m: preloadModule,
        X: preinitScript,
        S: preinitStyle,
        M: preinitModuleScript
      };
      function flushSyncWork() {
        var previousWasRendering = previousDispatcher.f(), wasRendering = flushSyncWork$1();
        return previousWasRendering || wasRendering;
      }
      function requestFormReset(form) {
        var formInst = getInstanceFromNode(form);
        formInst !== null && formInst.tag === 5 && formInst.type === "form" ? requestFormReset$1(formInst) : previousDispatcher.r(form);
      }
      var globalDocument = typeof document > "u" ? null : document;
      function preconnectAs(rel, href, crossOrigin) {
        var ownerDocument = globalDocument;
        if (ownerDocument && typeof href == "string" && href) {
          var limitedEscapedHref = escapeSelectorAttributeValueInsideDoubleQuotes(href);
          limitedEscapedHref = 'link[rel="' + rel + '"][href="' + limitedEscapedHref + '"]', typeof crossOrigin == "string" && (limitedEscapedHref += '[crossorigin="' + crossOrigin + '"]'), preconnectsSet.has(limitedEscapedHref) || (preconnectsSet.add(limitedEscapedHref), rel = { rel, crossOrigin, href }, ownerDocument.querySelector(limitedEscapedHref) === null && (href = ownerDocument.createElement("link"), setInitialProperties(href, "link", rel), markNodeAsHoistable(href), ownerDocument.head.appendChild(href)));
        }
      }
      function prefetchDNS(href) {
        previousDispatcher.D(href), preconnectAs("dns-prefetch", href, null);
      }
      function preconnect(href, crossOrigin) {
        previousDispatcher.C(href, crossOrigin), preconnectAs("preconnect", href, crossOrigin);
      }
      function preload(href, as, options3) {
        previousDispatcher.L(href, as, options3);
        var ownerDocument = globalDocument;
        if (ownerDocument && href && as) {
          var preloadSelector = 'link[rel="preload"][as="' + escapeSelectorAttributeValueInsideDoubleQuotes(as) + '"]';
          as === "image" && options3 && options3.imageSrcSet ? (preloadSelector += '[imagesrcset="' + escapeSelectorAttributeValueInsideDoubleQuotes(
            options3.imageSrcSet
          ) + '"]', typeof options3.imageSizes == "string" && (preloadSelector += '[imagesizes="' + escapeSelectorAttributeValueInsideDoubleQuotes(
            options3.imageSizes
          ) + '"]')) : preloadSelector += '[href="' + escapeSelectorAttributeValueInsideDoubleQuotes(href) + '"]';
          var key = preloadSelector;
          switch (as) {
            case "style":
              key = getStyleKey(href);
              break;
            case "script":
              key = getScriptKey(href);
          }
          if (!(preloadPropsMap.has(key) || (href = assign(
            {
              rel: "preload",
              href: as === "image" && options3 && options3.imageSrcSet ? void 0 : href,
              as
            },
            options3
          ), preloadPropsMap.set(key, href), ownerDocument.querySelector(preloadSelector) !== null || as === "style" && ownerDocument.querySelector(getStylesheetSelectorFromKey(key)) || as === "script" && ownerDocument.querySelector(getScriptSelectorFromKey(key))))) {
            var instance = ownerDocument.createElement("link");
            setInitialProperties(instance, "link", href), as === "style" && (instance[internalLoadPendingKey] = !0, instance.onload = instance.onerror = function() {
              clearPendingLoadOnNode(instance);
            }), markNodeAsHoistable(instance), ownerDocument.head.appendChild(instance);
          }
        }
      }
      function preloadModule(href, options3) {
        previousDispatcher.m(href, options3);
        var ownerDocument = globalDocument;
        if (ownerDocument && href) {
          var as = options3 && typeof options3.as == "string" ? options3.as : "script", preloadSelector = 'link[rel="modulepreload"][as="' + escapeSelectorAttributeValueInsideDoubleQuotes(as) + '"][href="' + escapeSelectorAttributeValueInsideDoubleQuotes(href) + '"]', key = preloadSelector;
          switch (as) {
            case "audioworklet":
            case "paintworklet":
            case "serviceworker":
            case "sharedworker":
            case "worker":
            case "script":
              key = getScriptKey(href);
          }
          if (!preloadPropsMap.has(key) && (href = assign({ rel: "modulepreload", href }, options3), preloadPropsMap.set(key, href), ownerDocument.querySelector(preloadSelector) === null)) {
            switch (as) {
              case "audioworklet":
              case "paintworklet":
              case "serviceworker":
              case "sharedworker":
              case "worker":
              case "script":
                if (ownerDocument.querySelector(getScriptSelectorFromKey(key)))
                  return;
            }
            as = ownerDocument.createElement("link"), setInitialProperties(as, "link", href), markNodeAsHoistable(as), ownerDocument.head.appendChild(as);
          }
        }
      }
      function preinitStyle(href, precedence, options3) {
        previousDispatcher.S(href, precedence, options3);
        var ownerDocument = globalDocument;
        if (ownerDocument && href) {
          var styles = getResourcesFromRoot(ownerDocument).hoistableStyles, key = getStyleKey(href);
          precedence = precedence || "default";
          var resource = styles.get(key);
          if (!resource) {
            var state = { loading: 0, preload: null };
            if (resource = ownerDocument.querySelector(
              getStylesheetSelectorFromKey(key)
            ))
              state.loading = 5;
            else {
              href = assign(
                { rel: "stylesheet", href, "data-precedence": precedence },
                options3
              ), (options3 = preloadPropsMap.get(key)) && adoptPreloadPropsForStylesheet(href, options3);
              var link = resource = ownerDocument.createElement("link");
              markNodeAsHoistable(link), setInitialProperties(link, "link", href), link._p = new Promise(function(resolve, reject) {
                link.onload = resolve, link.onerror = reject;
              }), link.addEventListener("load", function() {
                state.loading |= 1;
              }), link.addEventListener("error", function() {
                state.loading |= 2;
              }), state.loading |= 4, insertStylesheet(resource, precedence, ownerDocument);
            }
            resource = {
              type: "stylesheet",
              instance: resource,
              count: 1,
              state
            }, styles.set(key, resource);
          }
        }
      }
      function preinitScript(src, options3) {
        previousDispatcher.X(src, options3);
        var ownerDocument = globalDocument;
        if (ownerDocument && src) {
          var scripts = getResourcesFromRoot(ownerDocument).hoistableScripts, key = getScriptKey(src), resource = scripts.get(key);
          resource || (resource = ownerDocument.querySelector(getScriptSelectorFromKey(key)), resource || (src = assign({ src, async: !0 }, options3), (options3 = preloadPropsMap.get(key)) && adoptPreloadPropsForScript(src, options3), resource = ownerDocument.createElement("script"), markNodeAsHoistable(resource), setInitialProperties(resource, "link", src), ownerDocument.head.appendChild(resource)), resource = {
            type: "script",
            instance: resource,
            count: 1,
            state: null
          }, scripts.set(key, resource));
        }
      }
      function preinitModuleScript(src, options3) {
        previousDispatcher.M(src, options3);
        var ownerDocument = globalDocument;
        if (ownerDocument && src) {
          var scripts = getResourcesFromRoot(ownerDocument).hoistableScripts, key = getScriptKey(src), resource = scripts.get(key);
          resource || (resource = ownerDocument.querySelector(getScriptSelectorFromKey(key)), resource || (src = assign({ src, async: !0, type: "module" }, options3), (options3 = preloadPropsMap.get(key)) && adoptPreloadPropsForScript(src, options3), resource = ownerDocument.createElement("script"), markNodeAsHoistable(resource), setInitialProperties(resource, "link", src), ownerDocument.head.appendChild(resource)), resource = {
            type: "script",
            instance: resource,
            count: 1,
            state: null
          }, scripts.set(key, resource));
        }
      }
      function getResource(type, currentProps, pendingProps, currentResource) {
        var JSCompiler_inline_result = (JSCompiler_inline_result = rootInstanceStackCursor.current) ? getHoistableRoot(JSCompiler_inline_result) : null;
        if (!JSCompiler_inline_result) throw Error(formatProdErrorMessage(446));
        switch (type) {
          case "meta":
          case "title":
            return null;
          case "style":
            return typeof pendingProps.precedence == "string" && typeof pendingProps.href == "string" ? (pendingProps = getStyleKey(pendingProps.href), currentProps = getResourcesFromRoot(
              JSCompiler_inline_result
            ).hoistableStyles, currentResource = currentProps.get(pendingProps), currentResource || (currentResource = {
              type: "style",
              instance: null,
              count: 0,
              state: null
            }, currentProps.set(pendingProps, currentResource)), currentResource) : { type: "void", instance: null, count: 0, state: null };
          case "link":
            if (pendingProps.rel === "stylesheet" && typeof pendingProps.href == "string" && typeof pendingProps.precedence == "string") {
              type = getStyleKey(pendingProps.href);
              var styles$268 = getResourcesFromRoot(
                JSCompiler_inline_result
              ).hoistableStyles, resource$269 = styles$268.get(type);
              if (resource$269 || (JSCompiler_inline_result = JSCompiler_inline_result.ownerDocument || JSCompiler_inline_result, resource$269 = {
                type: "stylesheet",
                instance: null,
                count: 0,
                state: { loading: 0, preload: null }
              }, styles$268.set(type, resource$269), (styles$268 = JSCompiler_inline_result.querySelector(
                getStylesheetSelectorFromKey(type)
              )) ? styles$268._p || (resource$269.instance = styles$268, resource$269.state.loading = 5) : (styles$268 = preloadPropsMap.get(type), styles$268 || (styles$268 = {
                rel: "preload",
                as: "style",
                href: pendingProps.href,
                crossOrigin: pendingProps.crossOrigin,
                integrity: pendingProps.integrity,
                media: pendingProps.media,
                hrefLang: pendingProps.hrefLang,
                referrerPolicy: pendingProps.referrerPolicy
              }, preloadPropsMap.set(type, styles$268)), preloadStylesheet(
                JSCompiler_inline_result,
                type,
                styles$268,
                resource$269.state
              ))), currentProps && currentResource === null)
                throw Error(formatProdErrorMessage(528, ""));
              return resource$269;
            }
            if (currentProps && currentResource !== null)
              throw Error(formatProdErrorMessage(529, ""));
            return null;
          case "script":
            return currentProps = pendingProps.async, pendingProps = pendingProps.src, typeof pendingProps == "string" && currentProps && typeof currentProps != "function" && typeof currentProps != "symbol" ? (pendingProps = getScriptKey(pendingProps), currentProps = getResourcesFromRoot(
              JSCompiler_inline_result
            ).hoistableScripts, currentResource = currentProps.get(pendingProps), currentResource || (currentResource = {
              type: "script",
              instance: null,
              count: 0,
              state: null
            }, currentProps.set(pendingProps, currentResource)), currentResource) : { type: "void", instance: null, count: 0, state: null };
          default:
            throw Error(formatProdErrorMessage(444, type));
        }
      }
      function getStyleKey(href) {
        return 'href="' + escapeSelectorAttributeValueInsideDoubleQuotes(href) + '"';
      }
      function getStylesheetSelectorFromKey(key) {
        return 'link[rel="stylesheet"][' + key + "]";
      }
      function stylesheetPropsFromRawProps(rawProps) {
        return assign({}, rawProps, {
          "data-precedence": rawProps.precedence,
          precedence: null
        });
      }
      function preloadStylesheet(ownerDocument, key, preloadProps, state) {
        if (key = ownerDocument.querySelector(
          'link[rel="preload"][as="style"][' + key + "]"
        )) {
          if (key[internalLoadPendingKey] !== !0) {
            state.loading = 1;
            return;
          }
        } else
          key = ownerDocument.createElement("link"), key[internalLoadPendingKey] = !0, key.onload = key.onerror = clearPendingLoadOnNode.bind(null, key), setInitialProperties(key, "link", preloadProps), markNodeAsHoistable(key), ownerDocument.head.appendChild(key);
        state.preload = key, key.addEventListener("load", function() {
          return state.loading |= 1;
        }), key.addEventListener("error", function() {
          return state.loading |= 2;
        });
      }
      function getScriptKey(src) {
        return '[src="' + escapeSelectorAttributeValueInsideDoubleQuotes(src) + '"]';
      }
      function getScriptSelectorFromKey(key) {
        return "script[async]" + key;
      }
      function acquireResource(hoistableRoot, resource, props) {
        if (resource.count++, resource.instance === null)
          switch (resource.type) {
            case "style":
              var instance = hoistableRoot.querySelector(
                'style[data-href~="' + escapeSelectorAttributeValueInsideDoubleQuotes(props.href) + '"]'
              );
              if (instance)
                return resource.instance = instance, markNodeAsHoistable(instance), instance;
              var styleProps = assign({}, props, {
                "data-href": props.href,
                "data-precedence": props.precedence,
                href: null,
                precedence: null
              });
              return instance = (hoistableRoot.ownerDocument || hoistableRoot).createElement(
                "style"
              ), markNodeAsHoistable(instance), setInitialProperties(instance, "style", styleProps), insertStylesheet(instance, props.precedence, hoistableRoot), resource.instance = instance;
            case "stylesheet":
              styleProps = getStyleKey(props.href);
              var instance$274 = hoistableRoot.querySelector(
                getStylesheetSelectorFromKey(styleProps)
              );
              if (instance$274)
                return resource.state.loading |= 4, resource.instance = instance$274, markNodeAsHoistable(instance$274), instance$274;
              instance = stylesheetPropsFromRawProps(props), (styleProps = preloadPropsMap.get(styleProps)) && adoptPreloadPropsForStylesheet(instance, styleProps), instance$274 = (hoistableRoot.ownerDocument || hoistableRoot).createElement("link"), markNodeAsHoistable(instance$274);
              var linkInstance = instance$274;
              return linkInstance._p = new Promise(function(resolve, reject) {
                linkInstance.onload = resolve, linkInstance.onerror = reject;
              }), setInitialProperties(instance$274, "link", instance), resource.state.loading |= 4, insertStylesheet(instance$274, props.precedence, hoistableRoot), resource.instance = instance$274;
            case "script":
              return instance$274 = getScriptKey(props.src), (styleProps = hoistableRoot.querySelector(
                getScriptSelectorFromKey(instance$274)
              )) ? (resource.instance = styleProps, markNodeAsHoistable(styleProps), styleProps) : (instance = props, (styleProps = preloadPropsMap.get(instance$274)) && (instance = assign({}, props), adoptPreloadPropsForScript(instance, styleProps)), hoistableRoot = hoistableRoot.ownerDocument || hoistableRoot, styleProps = hoistableRoot.createElement("script"), markNodeAsHoistable(styleProps), setInitialProperties(styleProps, "link", instance), hoistableRoot.head.appendChild(styleProps), resource.instance = styleProps);
            case "void":
              return null;
            default:
              throw Error(formatProdErrorMessage(443, resource.type));
          }
        else
          resource.type === "stylesheet" && (resource.state.loading & 4) === 0 && (instance = resource.instance, resource.state.loading |= 4, insertStylesheet(instance, props.precedence, hoistableRoot));
        return resource.instance;
      }
      function insertStylesheet(instance, precedence, root2) {
        for (var nodes = root2.querySelectorAll(
          'link[rel="stylesheet"][data-precedence],style[data-precedence]'
        ), last = nodes.length ? nodes[nodes.length - 1] : null, prior = last, i = 0; i < nodes.length; i++) {
          var node = nodes[i];
          if (node.dataset.precedence === precedence) prior = node;
          else if (prior !== last) break;
        }
        prior ? prior.parentNode.insertBefore(instance, prior.nextSibling) : (precedence = root2.nodeType === 9 ? root2.head : root2, precedence.insertBefore(instance, precedence.firstChild));
      }
      function adoptPreloadPropsForStylesheet(stylesheetProps, preloadProps) {
        stylesheetProps.crossOrigin == null && (stylesheetProps.crossOrigin = preloadProps.crossOrigin), stylesheetProps.referrerPolicy == null && (stylesheetProps.referrerPolicy = preloadProps.referrerPolicy), stylesheetProps.title == null && (stylesheetProps.title = preloadProps.title);
      }
      function adoptPreloadPropsForScript(scriptProps, preloadProps) {
        scriptProps.crossOrigin == null && (scriptProps.crossOrigin = preloadProps.crossOrigin), scriptProps.referrerPolicy == null && (scriptProps.referrerPolicy = preloadProps.referrerPolicy), scriptProps.integrity == null && (scriptProps.integrity = preloadProps.integrity);
      }
      var tagCaches = null;
      function getHydratableHoistableCache(type, keyAttribute, ownerDocument) {
        if (tagCaches === null) {
          var cache = /* @__PURE__ */ new Map(), caches = tagCaches = /* @__PURE__ */ new Map();
          caches.set(ownerDocument, cache);
        } else
          caches = tagCaches, cache = caches.get(ownerDocument), cache || (cache = /* @__PURE__ */ new Map(), caches.set(ownerDocument, cache));
        if (cache.has(type)) return cache;
        for (cache.set(type, null), ownerDocument = ownerDocument.getElementsByTagName(type), caches = 0; caches < ownerDocument.length; caches++) {
          var node = ownerDocument[caches];
          if (!(node[internalHoistableMarker] || node[internalInstanceKey] || type === "link" && node.getAttribute("rel") === "stylesheet") && node.namespaceURI !== "http://www.w3.org/2000/svg") {
            var nodeKey = node.getAttribute(keyAttribute) || "";
            nodeKey = type + nodeKey;
            var existing = cache.get(nodeKey);
            existing ? existing.push(node) : cache.set(nodeKey, [node]);
          }
        }
        return cache;
      }
      function mountHoistable(hoistableRoot, type, instance) {
        hoistableRoot = hoistableRoot.ownerDocument || hoistableRoot, hoistableRoot.head.insertBefore(
          instance,
          type === "title" ? hoistableRoot.querySelector("head > title") : null
        );
      }
      function isHostHoistableType(type, props, hostContext) {
        if (hostContext === 1 || props.itemProp != null) return !1;
        switch (type) {
          case "meta":
          case "title":
            return !0;
          case "style":
            if (typeof props.precedence != "string" || typeof props.href != "string" || props.href === "")
              break;
            return !0;
          case "link":
            if (typeof props.rel != "string" || typeof props.href != "string" || props.href === "" || props.onLoad || props.onError)
              break;
            return props.rel === "stylesheet" ? (type = props.disabled, typeof props.precedence == "string" && type == null) : !0;
          case "script":
            if (props.async && typeof props.async != "function" && typeof props.async != "symbol" && !props.onLoad && !props.onError && props.src && typeof props.src == "string")
              return !0;
        }
        return !1;
      }
      function maySuspendCommit(type, props) {
        return type === "img" && props.src != null && props.src !== "" && props.onLoad == null && props.loading !== "lazy";
      }
      function preloadResource(resource) {
        return !(resource.type === "stylesheet" && (resource.state.loading & 3) === 0);
      }
      function estimateImageBytes(instance) {
        return (instance.width || 100) * (instance.height || 100) * (typeof devicePixelRatio == "number" ? devicePixelRatio : 1) * 0.25;
      }
      function suspendInstance(state, instance) {
        typeof instance.decode == "function" && (state.imgCount++, instance.complete || (state.imgBytes += estimateImageBytes(instance), state.suspenseyImages.push(instance)), state = onUnsuspendImg.bind(state), instance.decode().then(state, state));
      }
      function suspendResource(state, hoistableRoot, resource, props) {
        if (resource.type === "stylesheet" && (typeof props.media != "string" || matchMedia(props.media).matches !== !1) && (resource.state.loading & 4) === 0) {
          if (resource.instance === null) {
            var key = getStyleKey(props.href), instance = hoistableRoot.querySelector(
              getStylesheetSelectorFromKey(key)
            );
            if (instance) {
              hoistableRoot = instance._p, hoistableRoot !== null && typeof hoistableRoot == "object" && typeof hoistableRoot.then == "function" && (state.count++, state = onUnsuspend.bind(state), hoistableRoot.then(state, state)), resource.state.loading |= 4, resource.instance = instance, markNodeAsHoistable(instance);
              return;
            }
            instance = hoistableRoot.ownerDocument || hoistableRoot, props = stylesheetPropsFromRawProps(props), (key = preloadPropsMap.get(key)) && adoptPreloadPropsForStylesheet(props, key), instance = instance.createElement("link"), markNodeAsHoistable(instance);
            var linkInstance = instance;
            linkInstance._p = new Promise(function(resolve, reject) {
              linkInstance.onload = resolve, linkInstance.onerror = reject;
            }), setInitialProperties(instance, "link", props), resource.instance = instance;
          }
          state.stylesheets === null && (state.stylesheets = /* @__PURE__ */ new Map()), state.stylesheets.set(resource, hoistableRoot), (hoistableRoot = resource.state.preload) && (resource.state.loading & 3) === 0 && (state.count++, resource = onUnsuspend.bind(state), hoistableRoot.addEventListener("load", resource), hoistableRoot.addEventListener("error", resource));
        }
      }
      var estimatedBytesWithinLimit = 0;
      function waitForCommitToBeReady(state, timeoutOffset) {
        return state.stylesheets && state.count === 0 && insertSuspendedStylesheets(state, state.stylesheets), 0 < state.count || 0 < state.imgCount ? function(commit) {
          var stylesheetTimer = setTimeout(function() {
            if (state.stylesheets && insertSuspendedStylesheets(state, state.stylesheets), state.unsuspend) {
              var unsuspend = state.unsuspend;
              state.unsuspend = null, unsuspend();
            }
          }, 6e4 + timeoutOffset);
          0 < state.imgBytes && estimatedBytesWithinLimit === 0 && (estimatedBytesWithinLimit = 62500 * estimateBandwidth());
          var imgTimer = setTimeout(
            function() {
              if (state.waitingForImages = !1, state.count === 0 && (state.stylesheets && insertSuspendedStylesheets(state, state.stylesheets), state.unsuspend)) {
                var unsuspend = state.unsuspend;
                state.unsuspend = null, unsuspend();
              }
            },
            (state.imgBytes > estimatedBytesWithinLimit ? 50 : 800) + timeoutOffset
          );
          return state.unsuspend = commit, function() {
            state.unsuspend = null, clearTimeout(stylesheetTimer), clearTimeout(imgTimer);
          };
        } : null;
      }
      function checkIfFullyUnsuspended(state) {
        if (state.count === 0 && (state.imgCount === 0 || !state.waitingForImages)) {
          if (state.stylesheets) insertSuspendedStylesheets(state, state.stylesheets);
          else if (state.unsuspend) {
            var unsuspend = state.unsuspend;
            state.unsuspend = null, unsuspend();
          }
        }
      }
      function onUnsuspend() {
        this.count--, checkIfFullyUnsuspended(this);
      }
      function onUnsuspendImg() {
        this.imgCount--, checkIfFullyUnsuspended(this);
      }
      var precedencesByRoot = null;
      function insertSuspendedStylesheets(state, resources) {
        state.stylesheets = null, state.unsuspend !== null && (state.count++, precedencesByRoot = /* @__PURE__ */ new Map(), resources.forEach(insertStylesheetIntoRoot, state), precedencesByRoot = null, onUnsuspend.call(state));
      }
      function insertStylesheetIntoRoot(root2, resource) {
        if (!(resource.state.loading & 4)) {
          var precedences = precedencesByRoot.get(root2);
          if (precedences) var last = precedences.get(null);
          else {
            precedences = /* @__PURE__ */ new Map(), precedencesByRoot.set(root2, precedences);
            for (var nodes = root2.querySelectorAll(
              "link[data-precedence],style[data-precedence]"
            ), i = 0; i < nodes.length; i++) {
              var node = nodes[i];
              (node.nodeName === "LINK" || node.getAttribute("media") !== "not all") && (precedences.set(node.dataset.precedence, node), last = node);
            }
            last && precedences.set(null, last);
          }
          nodes = resource.instance, node = nodes.getAttribute("data-precedence"), i = precedences.get(node) || last, i === last && precedences.set(null, nodes), precedences.set(node, nodes), this.count++, last = onUnsuspend.bind(this), nodes.addEventListener("load", last), nodes.addEventListener("error", last), i ? i.parentNode.insertBefore(nodes, i.nextSibling) : (root2 = root2.nodeType === 9 ? root2.head : root2, root2.insertBefore(nodes, root2.firstChild)), resource.state.loading |= 4;
        }
      }
      var HostTransitionContext = {
        $$typeof: REACT_CONTEXT_TYPE,
        Provider: null,
        Consumer: null,
        _currentValue: sharedNotPendingObject,
        _currentValue2: sharedNotPendingObject,
        _threadCount: 0
      };
      function FiberRootNode(containerInfo, tag, hydrate, identifierPrefix, onUncaughtError, onCaughtError, onRecoverableError, onDefaultTransitionIndicator, formState) {
        this.tag = 1, this.containerInfo = containerInfo, this.pingCache = this.current = this.pendingChildren = null, this.timeoutHandle = -1, this.callbackNode = this.next = this.pendingContext = this.context = this.cancelPendingCommit = null, this.callbackPriority = 0, this.expirationTimes = createLaneMap(-1), this.entangledLanes = this.shellSuspendCounter = this.errorRecoveryDisabledLanes = this.expiredLanes = this.warmLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0, this.entanglements = createLaneMap(0), this.hiddenUpdates = createLaneMap(null), this.identifierPrefix = identifierPrefix, this.onUncaughtError = onUncaughtError, this.onCaughtError = onCaughtError, this.onRecoverableError = onRecoverableError, this.pooledCache = null, this.pooledCacheLanes = 0, this.formState = formState, this.transitionTypes = null, this.incompleteTransitions = /* @__PURE__ */ new Map();
      }
      function createFiberRoot(containerInfo, tag, hydrate, initialChildren, hydrationCallbacks, isStrictMode, identifierPrefix, formState, onUncaughtError, onCaughtError, onRecoverableError, onDefaultTransitionIndicator) {
        return containerInfo = new FiberRootNode(
          containerInfo,
          tag,
          hydrate,
          identifierPrefix,
          onUncaughtError,
          onCaughtError,
          onRecoverableError,
          onDefaultTransitionIndicator,
          formState
        ), tag = 1, isStrictMode === !0 && (tag |= 24), isStrictMode = createFiberImplClass(3, null, null, tag), containerInfo.current = isStrictMode, isStrictMode.stateNode = containerInfo, tag = createCache(), tag.refCount++, containerInfo.pooledCache = tag, tag.refCount++, isStrictMode.memoizedState = {
          element: initialChildren,
          isDehydrated: hydrate,
          cache: tag
        }, initializeUpdateQueue(isStrictMode), containerInfo;
      }
      function getContextForSubtree(parentComponent) {
        return parentComponent ? (parentComponent = emptyContextObject, parentComponent) : emptyContextObject;
      }
      function updateContainerImpl(rootFiber, lane, element, container, parentComponent, callback) {
        parentComponent = getContextForSubtree(parentComponent), container.context === null ? container.context = parentComponent : container.pendingContext = parentComponent, container = createUpdate(lane), container.payload = { element }, callback = callback === void 0 ? null : callback, callback !== null && (container.callback = callback), element = enqueueUpdate(rootFiber, container, lane), element !== null && (scheduleUpdateOnFiber(element, rootFiber, lane), entangleTransitions(element, rootFiber, lane));
      }
      function markRetryLaneImpl(fiber, retryLane) {
        if (fiber = fiber.memoizedState, fiber !== null && fiber.dehydrated !== null) {
          var a = fiber.retryLane;
          fiber.retryLane = a !== 0 && a < retryLane ? a : retryLane;
        }
      }
      function markRetryLaneIfNotHydrated(fiber, retryLane) {
        markRetryLaneImpl(fiber, retryLane), (fiber = fiber.alternate) && markRetryLaneImpl(fiber, retryLane);
      }
      function attemptContinuousHydration(fiber) {
        if (fiber.tag === 13 || fiber.tag === 31) {
          var root2 = enqueueConcurrentRenderForLane(fiber, 67108864);
          root2 !== null && scheduleUpdateOnFiber(root2, fiber, 67108864), markRetryLaneIfNotHydrated(fiber, 67108864);
        }
      }
      function attemptHydrationAtCurrentPriority(fiber) {
        if (fiber.tag === 13 || fiber.tag === 31) {
          var lane = requestUpdateLane();
          lane = getBumpedLaneForHydrationByLane(lane);
          var root2 = enqueueConcurrentRenderForLane(fiber, lane);
          root2 !== null && scheduleUpdateOnFiber(root2, fiber, lane), markRetryLaneIfNotHydrated(fiber, lane);
        }
      }
      var _enabled = !0;
      function dispatchDiscreteEvent(domEventName, eventSystemFlags, container, nativeEvent) {
        var prevTransition = ReactSharedInternals.T;
        ReactSharedInternals.T = null;
        var previousPriority = ReactDOMSharedInternals.p;
        try {
          ReactDOMSharedInternals.p = 2, dispatchEvent(domEventName, eventSystemFlags, container, nativeEvent);
        } finally {
          ReactDOMSharedInternals.p = previousPriority, ReactSharedInternals.T = prevTransition;
        }
      }
      function dispatchContinuousEvent(domEventName, eventSystemFlags, container, nativeEvent) {
        var prevTransition = ReactSharedInternals.T;
        ReactSharedInternals.T = null;
        var previousPriority = ReactDOMSharedInternals.p;
        try {
          ReactDOMSharedInternals.p = 8, dispatchEvent(domEventName, eventSystemFlags, container, nativeEvent);
        } finally {
          ReactDOMSharedInternals.p = previousPriority, ReactSharedInternals.T = prevTransition;
        }
      }
      function dispatchEvent(domEventName, eventSystemFlags, targetContainer, nativeEvent) {
        if (_enabled) {
          var blockedOn = findInstanceBlockingEvent(nativeEvent);
          if (blockedOn === null)
            dispatchEventForPluginEventSystem(
              domEventName,
              eventSystemFlags,
              nativeEvent,
              return_targetInst,
              targetContainer
            ), clearIfContinuousEvent(domEventName, nativeEvent);
          else if (queueIfContinuousEvent(
            blockedOn,
            domEventName,
            eventSystemFlags,
            targetContainer,
            nativeEvent
          ))
            nativeEvent.stopPropagation();
          else if (clearIfContinuousEvent(domEventName, nativeEvent), eventSystemFlags & 4 && -1 < discreteReplayableEvents.indexOf(domEventName)) {
            for (; blockedOn !== null; ) {
              var fiber = getInstanceFromNode(blockedOn);
              if (fiber !== null)
                switch (fiber.tag) {
                  case 3:
                    if (fiber = fiber.stateNode, fiber.current.memoizedState.isDehydrated) {
                      var lanes = getHighestPriorityLanes(fiber.pendingLanes);
                      if (lanes !== 0) {
                        var root2 = fiber;
                        for (root2.pendingLanes |= 2, root2.entangledLanes |= 2; lanes; ) {
                          var lane = 1 << 31 - clz32(lanes);
                          root2.entanglements[1] |= lane, lanes &= ~lane;
                        }
                        ensureRootIsScheduled(fiber), (executionContext & 6) === 0 && (workInProgressRootRenderTargetTime = now() + 500, flushSyncWorkAcrossRoots_impl(0, !1));
                      }
                    }
                    break;
                  case 31:
                  case 13:
                    root2 = enqueueConcurrentRenderForLane(fiber, 2), root2 !== null && scheduleUpdateOnFiber(root2, fiber, 2), flushSyncWork$1(), markRetryLaneIfNotHydrated(fiber, 2);
                }
              if (fiber = findInstanceBlockingEvent(nativeEvent), fiber === null && dispatchEventForPluginEventSystem(
                domEventName,
                eventSystemFlags,
                nativeEvent,
                return_targetInst,
                targetContainer
              ), fiber === blockedOn) break;
              blockedOn = fiber;
            }
            blockedOn !== null && nativeEvent.stopPropagation();
          } else
            dispatchEventForPluginEventSystem(
              domEventName,
              eventSystemFlags,
              nativeEvent,
              null,
              targetContainer
            );
        }
      }
      function findInstanceBlockingEvent(nativeEvent) {
        return nativeEvent = getEventTarget(nativeEvent), findInstanceBlockingTarget(nativeEvent);
      }
      var return_targetInst = null;
      function findInstanceBlockingTarget(targetNode) {
        if (return_targetInst = null, targetNode = getClosestInstanceFromNode(targetNode), targetNode !== null) {
          var nearestMounted = getNearestMountedFiber(targetNode);
          if (nearestMounted === null) targetNode = null;
          else {
            var tag = nearestMounted.tag;
            if (tag === 13) {
              if (targetNode = getSuspenseInstanceFromFiber(nearestMounted), targetNode !== null) return targetNode;
              targetNode = null;
            } else if (tag === 31) {
              if (targetNode = getActivityInstanceFromFiber(nearestMounted), targetNode !== null) return targetNode;
              targetNode = null;
            } else if (tag === 3) {
              if (nearestMounted.stateNode.current.memoizedState.isDehydrated)
                return nearestMounted.tag === 3 ? nearestMounted.stateNode.containerInfo : null;
              targetNode = null;
            } else nearestMounted !== targetNode && (targetNode = null);
          }
        }
        return return_targetInst = targetNode, null;
      }
      function getEventPriority(domEventName) {
        switch (domEventName) {
          case "beforetoggle":
          case "cancel":
          case "click":
          case "close":
          case "contextmenu":
          case "copy":
          case "cut":
          case "auxclick":
          case "dblclick":
          case "dragend":
          case "dragstart":
          case "drop":
          case "focusin":
          case "focusout":
          case "input":
          case "invalid":
          case "keydown":
          case "keypress":
          case "keyup":
          case "mousedown":
          case "mouseup":
          case "paste":
          case "pause":
          case "play":
          case "pointercancel":
          case "pointerdown":
          case "pointerup":
          case "ratechange":
          case "reset":
          case "seeked":
          case "submit":
          case "toggle":
          case "touchcancel":
          case "touchend":
          case "touchstart":
          case "volumechange":
          case "change":
          case "selectionchange":
          case "textInput":
          case "compositionstart":
          case "compositionend":
          case "compositionupdate":
          case "beforeblur":
          case "afterblur":
          case "beforeinput":
          case "blur":
          case "fullscreenchange":
          case "fullscreenerror":
          case "focus":
          case "hashchange":
          case "popstate":
          case "select":
          case "selectstart":
            return 2;
          case "drag":
          case "dragenter":
          case "dragexit":
          case "dragleave":
          case "dragover":
          case "mousemove":
          case "mouseout":
          case "mouseover":
          case "pointermove":
          case "pointerout":
          case "pointerover":
          case "resize":
          case "scroll":
          case "touchmove":
          case "wheel":
          case "mouseenter":
          case "mouseleave":
          case "pointerenter":
          case "pointerleave":
            return 8;
          case "message":
            switch (getCurrentPriorityLevel()) {
              case ImmediatePriority:
                return 2;
              case UserBlockingPriority:
                return 8;
              case NormalPriority$1:
              case LowPriority:
                return 32;
              case IdlePriority:
                return 268435456;
              default:
                return 32;
            }
          default:
            return 32;
        }
      }
      var hasScheduledReplayAttempt = !1, queuedFocus = null, queuedDrag = null, queuedMouse = null, queuedPointers = /* @__PURE__ */ new Map(), queuedPointerCaptures = /* @__PURE__ */ new Map(), queuedExplicitHydrationTargets = [], discreteReplayableEvents = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset".split(
        " "
      );
      function clearIfContinuousEvent(domEventName, nativeEvent) {
        switch (domEventName) {
          case "focusin":
          case "focusout":
            queuedFocus = null;
            break;
          case "dragenter":
          case "dragleave":
            queuedDrag = null;
            break;
          case "mouseover":
          case "mouseout":
            queuedMouse = null;
            break;
          case "pointerover":
          case "pointerout":
            queuedPointers.delete(nativeEvent.pointerId);
            break;
          case "gotpointercapture":
          case "lostpointercapture":
            queuedPointerCaptures.delete(nativeEvent.pointerId);
        }
      }
      function accumulateOrCreateContinuousQueuedReplayableEvent(existingQueuedEvent, blockedOn, domEventName, eventSystemFlags, targetContainer, nativeEvent) {
        return existingQueuedEvent === null || existingQueuedEvent.nativeEvent !== nativeEvent ? (existingQueuedEvent = {
          blockedOn,
          domEventName,
          eventSystemFlags,
          nativeEvent,
          targetContainers: [targetContainer]
        }, blockedOn !== null && (blockedOn = getInstanceFromNode(blockedOn), blockedOn !== null && attemptContinuousHydration(blockedOn)), existingQueuedEvent) : (existingQueuedEvent.eventSystemFlags |= eventSystemFlags, blockedOn = existingQueuedEvent.targetContainers, targetContainer !== null && blockedOn.indexOf(targetContainer) === -1 && blockedOn.push(targetContainer), existingQueuedEvent);
      }
      function queueIfContinuousEvent(blockedOn, domEventName, eventSystemFlags, targetContainer, nativeEvent) {
        switch (domEventName) {
          case "focusin":
            return queuedFocus = accumulateOrCreateContinuousQueuedReplayableEvent(
              queuedFocus,
              blockedOn,
              domEventName,
              eventSystemFlags,
              targetContainer,
              nativeEvent
            ), !0;
          case "dragenter":
            return queuedDrag = accumulateOrCreateContinuousQueuedReplayableEvent(
              queuedDrag,
              blockedOn,
              domEventName,
              eventSystemFlags,
              targetContainer,
              nativeEvent
            ), !0;
          case "mouseover":
            return queuedMouse = accumulateOrCreateContinuousQueuedReplayableEvent(
              queuedMouse,
              blockedOn,
              domEventName,
              eventSystemFlags,
              targetContainer,
              nativeEvent
            ), !0;
          case "pointerover":
            var pointerId = nativeEvent.pointerId;
            return queuedPointers.set(
              pointerId,
              accumulateOrCreateContinuousQueuedReplayableEvent(
                queuedPointers.get(pointerId) || null,
                blockedOn,
                domEventName,
                eventSystemFlags,
                targetContainer,
                nativeEvent
              )
            ), !0;
          case "gotpointercapture":
            return pointerId = nativeEvent.pointerId, queuedPointerCaptures.set(
              pointerId,
              accumulateOrCreateContinuousQueuedReplayableEvent(
                queuedPointerCaptures.get(pointerId) || null,
                blockedOn,
                domEventName,
                eventSystemFlags,
                targetContainer,
                nativeEvent
              )
            ), !0;
        }
        return !1;
      }
      function attemptExplicitHydrationTarget(queuedTarget) {
        var targetInst = getClosestInstanceFromNode(queuedTarget.target);
        if (targetInst !== null) {
          var nearestMounted = getNearestMountedFiber(targetInst);
          if (nearestMounted !== null) {
            if (targetInst = nearestMounted.tag, targetInst === 13) {
              if (targetInst = getSuspenseInstanceFromFiber(nearestMounted), targetInst !== null) {
                queuedTarget.blockedOn = targetInst, runWithPriority(queuedTarget.priority, function() {
                  attemptHydrationAtCurrentPriority(nearestMounted);
                });
                return;
              }
            } else if (targetInst === 31) {
              if (targetInst = getActivityInstanceFromFiber(nearestMounted), targetInst !== null) {
                queuedTarget.blockedOn = targetInst, runWithPriority(queuedTarget.priority, function() {
                  attemptHydrationAtCurrentPriority(nearestMounted);
                });
                return;
              }
            } else if (targetInst === 3 && nearestMounted.stateNode.current.memoizedState.isDehydrated) {
              queuedTarget.blockedOn = nearestMounted.tag === 3 ? nearestMounted.stateNode.containerInfo : null;
              return;
            }
          }
        }
        queuedTarget.blockedOn = null;
      }
      function attemptReplayContinuousQueuedEvent(queuedEvent) {
        if (queuedEvent.blockedOn !== null) return !1;
        for (var targetContainers = queuedEvent.targetContainers; 0 < targetContainers.length; ) {
          var nextBlockedOn = findInstanceBlockingEvent(queuedEvent.nativeEvent);
          if (nextBlockedOn === null) {
            nextBlockedOn = queuedEvent.nativeEvent;
            var nativeEventClone = new nextBlockedOn.constructor(
              nextBlockedOn.type,
              nextBlockedOn
            );
            currentReplayingEvent = nativeEventClone, nextBlockedOn.target.dispatchEvent(nativeEventClone), currentReplayingEvent = null;
          } else
            return targetContainers = getInstanceFromNode(nextBlockedOn), targetContainers !== null && attemptContinuousHydration(targetContainers), queuedEvent.blockedOn = nextBlockedOn, !1;
          targetContainers.shift();
        }
        return !0;
      }
      function attemptReplayContinuousQueuedEventInMap(queuedEvent, key, map) {
        attemptReplayContinuousQueuedEvent(queuedEvent) && map.delete(key);
      }
      function replayUnblockedEvents() {
        hasScheduledReplayAttempt = !1, queuedFocus !== null && attemptReplayContinuousQueuedEvent(queuedFocus) && (queuedFocus = null), queuedDrag !== null && attemptReplayContinuousQueuedEvent(queuedDrag) && (queuedDrag = null), queuedMouse !== null && attemptReplayContinuousQueuedEvent(queuedMouse) && (queuedMouse = null), queuedPointers.forEach(attemptReplayContinuousQueuedEventInMap), queuedPointerCaptures.forEach(attemptReplayContinuousQueuedEventInMap);
      }
      function scheduleCallbackIfUnblocked(queuedEvent, unblocked) {
        queuedEvent.blockedOn === unblocked && (queuedEvent.blockedOn = null, hasScheduledReplayAttempt || (hasScheduledReplayAttempt = !0, Scheduler.unstable_scheduleCallback(
          Scheduler.unstable_NormalPriority,
          replayUnblockedEvents
        )));
      }
      var lastScheduledReplayQueue = null;
      function scheduleReplayQueueIfNeeded(formReplayingQueue) {
        lastScheduledReplayQueue !== formReplayingQueue && (lastScheduledReplayQueue = formReplayingQueue, Scheduler.unstable_scheduleCallback(
          Scheduler.unstable_NormalPriority,
          function() {
            lastScheduledReplayQueue === formReplayingQueue && (lastScheduledReplayQueue = null);
            for (var i = 0; i < formReplayingQueue.length; i += 3) {
              var form = formReplayingQueue[i], submitterOrAction = formReplayingQueue[i + 1], formData = formReplayingQueue[i + 2];
              if (typeof submitterOrAction != "function") {
                if (findInstanceBlockingTarget(submitterOrAction || form) === null)
                  continue;
                break;
              }
              var formInst = getInstanceFromNode(form);
              formInst !== null && (formReplayingQueue.splice(i, 3), i -= 3, startHostTransition(
                formInst,
                {
                  pending: !0,
                  data: formData,
                  method: form.method,
                  action: submitterOrAction
                },
                submitterOrAction,
                formData
              ));
            }
          }
        ));
      }
      function retryIfBlockedOn(unblocked) {
        function unblock(queuedEvent) {
          return scheduleCallbackIfUnblocked(queuedEvent, unblocked);
        }
        queuedFocus !== null && scheduleCallbackIfUnblocked(queuedFocus, unblocked), queuedDrag !== null && scheduleCallbackIfUnblocked(queuedDrag, unblocked), queuedMouse !== null && scheduleCallbackIfUnblocked(queuedMouse, unblocked), queuedPointers.forEach(unblock), queuedPointerCaptures.forEach(unblock);
        for (var i = 0; i < queuedExplicitHydrationTargets.length; i++) {
          var queuedTarget = queuedExplicitHydrationTargets[i];
          queuedTarget.blockedOn === unblocked && (queuedTarget.blockedOn = null);
        }
        for (; 0 < queuedExplicitHydrationTargets.length && (i = queuedExplicitHydrationTargets[0], i.blockedOn === null); )
          attemptExplicitHydrationTarget(i), i.blockedOn === null && queuedExplicitHydrationTargets.shift();
        if (i = (unblocked.ownerDocument || unblocked).$$reactFormReplay, i != null)
          for (queuedTarget = 0; queuedTarget < i.length; queuedTarget += 3) {
            var form = i[queuedTarget], submitterOrAction = i[queuedTarget + 1], formProps = form[internalPropsKey] || null;
            if (typeof submitterOrAction == "function")
              formProps || scheduleReplayQueueIfNeeded(i);
            else if (formProps) {
              var action = null;
              if (submitterOrAction && submitterOrAction.hasAttribute("formAction")) {
                if (form = submitterOrAction, formProps = submitterOrAction[internalPropsKey] || null)
                  action = formProps.formAction;
                else if (findInstanceBlockingTarget(form) !== null) continue;
              } else action = formProps.action;
              typeof action == "function" ? i[queuedTarget + 1] = action : (i.splice(queuedTarget, 3), queuedTarget -= 3), scheduleReplayQueueIfNeeded(i);
            }
          }
      }
      function defaultOnDefaultTransitionIndicator() {
        function handleNavigate(event) {
          event.canIntercept && event.info === "react-transition" && event.intercept({
            handler: function() {
              return new Promise(function(resolve) {
                return pendingResolve = resolve;
              });
            },
            focusReset: "manual",
            scroll: "manual"
          });
        }
        function handleNavigateComplete() {
          pendingResolve !== null && (pendingResolve(), pendingResolve = null), isCancelled || setTimeout(startFakeNavigation, 20);
        }
        function startFakeNavigation() {
          if (!isCancelled && !navigation.transition) {
            var currentEntry = navigation.currentEntry;
            currentEntry && currentEntry.url != null && navigation.navigate(currentEntry.url, {
              state: currentEntry.getState(),
              info: "react-transition",
              history: "replace"
            });
          }
        }
        if (typeof navigation == "object") {
          var isCancelled = !1, pendingResolve = null;
          return navigation.addEventListener("navigate", handleNavigate), navigation.addEventListener("navigatesuccess", handleNavigateComplete), navigation.addEventListener("navigateerror", handleNavigateComplete), setTimeout(startFakeNavigation, 100), function() {
            isCancelled = !0, navigation.removeEventListener("navigate", handleNavigate), navigation.removeEventListener("navigatesuccess", handleNavigateComplete), navigation.removeEventListener("navigateerror", handleNavigateComplete), pendingResolve !== null && (pendingResolve(), pendingResolve = null);
          };
        }
      }
      function ReactDOMRoot(internalRoot) {
        this._internalRoot = internalRoot;
      }
      ReactDOMHydrationRoot.prototype.render = ReactDOMRoot.prototype.render = function(children) {
        var root2 = this._internalRoot;
        if (root2 === null) throw Error(formatProdErrorMessage(409));
        var current2 = root2.current, lane = requestUpdateLane();
        updateContainerImpl(current2, lane, children, root2, null, null);
      };
      ReactDOMHydrationRoot.prototype.unmount = ReactDOMRoot.prototype.unmount = function() {
        var root2 = this._internalRoot;
        if (root2 !== null) {
          this._internalRoot = null;
          var container = root2.containerInfo;
          updateContainerImpl(root2.current, 2, null, root2, null, null), flushSyncWork$1(), container[internalContainerInstanceKey] = null;
        }
      };
      function ReactDOMHydrationRoot(internalRoot) {
        this._internalRoot = internalRoot;
      }
      ReactDOMHydrationRoot.prototype.unstable_scheduleHydration = function(target) {
        if (target) {
          var updatePriority = resolveUpdatePriority();
          target = { blockedOn: null, target, priority: updatePriority };
          for (var i = 0; i < queuedExplicitHydrationTargets.length && updatePriority !== 0 && updatePriority < queuedExplicitHydrationTargets[i].priority; i++) ;
          queuedExplicitHydrationTargets.splice(i, 0, target), i === 0 && attemptExplicitHydrationTarget(target);
        }
      };
      var isomorphicReactPackageVersion$jscomp$inline_2043 = React.version;
      if (isomorphicReactPackageVersion$jscomp$inline_2043 !== "19.3.1")
        throw Error(
          formatProdErrorMessage(
            527,
            isomorphicReactPackageVersion$jscomp$inline_2043,
            "19.3.1"
          )
        );
      ReactDOMSharedInternals.findDOMNode = function(componentOrElement) {
        var fiber = componentOrElement._reactInternals;
        if (fiber === void 0)
          throw typeof componentOrElement.render == "function" ? Error(formatProdErrorMessage(188)) : (componentOrElement = Object.keys(componentOrElement).join(","), Error(formatProdErrorMessage(268, componentOrElement)));
        return componentOrElement = findCurrentFiberUsingSlowPath(fiber), componentOrElement = componentOrElement !== null ? findCurrentHostFiberImpl(componentOrElement) : null, componentOrElement = componentOrElement === null ? null : componentOrElement.stateNode, componentOrElement;
      };
      var internals$jscomp$inline_2586 = {
        bundleType: 0,
        version: "19.3.1",
        rendererPackageName: "react-dom",
        currentDispatcherRef: ReactSharedInternals,
        reconcilerVersion: "19.3.1"
      };
      if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u" && (hook$jscomp$inline_2587 = __REACT_DEVTOOLS_GLOBAL_HOOK__, !hook$jscomp$inline_2587.isDisabled && hook$jscomp$inline_2587.supportsFiber))
        try {
          rendererID = hook$jscomp$inline_2587.inject(
            internals$jscomp$inline_2586
          ), injectedHook = hook$jscomp$inline_2587;
        } catch {
        }
      var hook$jscomp$inline_2587;
      exports.createRoot = function(container, options3) {
        if (!isValidContainer(container)) throw Error(formatProdErrorMessage(299));
        var isStrictMode = !1, identifierPrefix = "", onUncaughtError = defaultOnUncaughtError, onCaughtError = defaultOnCaughtError, onRecoverableError = defaultOnRecoverableError;
        return options3 != null && (options3.unstable_strictMode === !0 && (isStrictMode = !0), options3.identifierPrefix !== void 0 && (identifierPrefix = options3.identifierPrefix), options3.onUncaughtError !== void 0 && (onUncaughtError = options3.onUncaughtError), options3.onCaughtError !== void 0 && (onCaughtError = options3.onCaughtError), options3.onRecoverableError !== void 0 && (onRecoverableError = options3.onRecoverableError)), options3 = createFiberRoot(
          container,
          1,
          !1,
          null,
          null,
          isStrictMode,
          identifierPrefix,
          null,
          onUncaughtError,
          onCaughtError,
          onRecoverableError,
          defaultOnDefaultTransitionIndicator
        ), container[internalContainerInstanceKey] = options3.current, listenToAllSupportedEvents(container), new ReactDOMRoot(options3);
      };
      exports.hydrateRoot = function(container, initialChildren, options3) {
        if (!isValidContainer(container)) throw Error(formatProdErrorMessage(299));
        var isStrictMode = !1, identifierPrefix = "", onUncaughtError = defaultOnUncaughtError, onCaughtError = defaultOnCaughtError, onRecoverableError = defaultOnRecoverableError, formState = null;
        return options3 != null && (options3.unstable_strictMode === !0 && (isStrictMode = !0), options3.identifierPrefix !== void 0 && (identifierPrefix = options3.identifierPrefix), options3.onUncaughtError !== void 0 && (onUncaughtError = options3.onUncaughtError), options3.onCaughtError !== void 0 && (onCaughtError = options3.onCaughtError), options3.onRecoverableError !== void 0 && (onRecoverableError = options3.onRecoverableError), options3.formState !== void 0 && (formState = options3.formState)), initialChildren = createFiberRoot(
          container,
          1,
          !0,
          initialChildren,
          options3 ?? null,
          isStrictMode,
          identifierPrefix,
          formState,
          onUncaughtError,
          onCaughtError,
          onRecoverableError,
          defaultOnDefaultTransitionIndicator
        ), initialChildren.context = getContextForSubtree(null), options3 = initialChildren.current, isStrictMode = requestUpdateLane(), isStrictMode = getBumpedLaneForHydrationByLane(isStrictMode), identifierPrefix = createUpdate(isStrictMode), identifierPrefix.callback = null, enqueueUpdate(options3, identifierPrefix, isStrictMode), options3 = isStrictMode, initialChildren.current.lanes = options3, markRootUpdated$1(initialChildren, options3), ensureRootIsScheduled(initialChildren), container[internalContainerInstanceKey] = initialChildren.current, listenToAllSupportedEvents(container), new ReactDOMHydrationRoot(initialChildren);
      };
      exports.version = "19.3.1";
    }
  });

  // node_modules/react-dom/client.js
  var require_client = __commonJS({
    "node_modules/react-dom/client.js"(exports, module) {
      "use strict";
      function checkDCE() {
        if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function"))
          try {
            __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(checkDCE);
          } catch (err) {
            console.error(err);
          }
      }
      checkDCE(), module.exports = require_react_dom_client_production();
    }
  });

  // node_modules/react/cjs/react-jsx-runtime.production.js
  var require_react_jsx_runtime_production = __commonJS({
    "node_modules/react/cjs/react-jsx-runtime.production.js"(exports) {
      "use strict";
      var REACT_ELEMENT_TYPE = /* @__PURE__ */ Symbol.for("react.transitional.element"), REACT_FRAGMENT_TYPE = /* @__PURE__ */ Symbol.for("react.fragment");
      function jsxProd(type, config, maybeKey) {
        var key = null;
        if (maybeKey !== void 0 && (key = "" + maybeKey), config.key !== void 0 && (key = "" + config.key), "key" in config) {
          maybeKey = {};
          for (var propName in config)
            propName !== "key" && (maybeKey[propName] = config[propName]);
        } else maybeKey = config;
        return config = maybeKey.ref, {
          $$typeof: REACT_ELEMENT_TYPE,
          type,
          key,
          ref: config !== void 0 ? config : null,
          props: maybeKey
        };
      }
      exports.Fragment = REACT_FRAGMENT_TYPE;
      exports.jsx = jsxProd;
      exports.jsxs = jsxProd;
    }
  });

  // node_modules/react/jsx-runtime.js
  var require_jsx_runtime = __commonJS({
    "node_modules/react/jsx-runtime.js"(exports, module) {
      "use strict";
      module.exports = require_react_jsx_runtime_production();
    }
  });

  // src/wizard-view.ts
  var wizard_view_exports = {};
  __export(wizard_view_exports, {
    UPDATE_CHOICE_EVENT: () => UPDATE_CHOICE_EVENT,
    open: () => open
  });
  var import_react3 = __toESM(require_react(), 1), import_react_dom = __toESM(require_react_dom(), 1), import_client = __toESM(require_client(), 1);

  // src/pages/WizardScreen.tsx
  var import_react2 = __toESM(require_react(), 1);

  // src/containers/WizardContext.tsx
  var import_react = __toESM(require_react(), 1);

  // locales/en.json
  var en_default = {
    "bitrate.checking": "Checking bitrate…",
    "bitrate.confirmCrate": "Confirm crate",
    "bitrate.detail": " · {stated} kbps on the file, about {estimated} kbps from the spectrum",
    "bitrate.detailEstimate": " · about {estimated} kbps from the spectrum",
    "bitrate.empty": "No fake-320 or lossy-sourced files in this crate.",
    "bitrate.heading": "Suspect quality",
    "bitrate.intro": "Needs a crate because it decodes audio. Flags a file whose stated bitrate is much higher than the spectrum shows, or a lossless file made from a lossy one. This is a suspicion, not proof. Quit Serato before saving a crate.",
    "bitrate.notFound": {
      one: "{count} missing track was skipped. See Missing files.",
      other: "{count} missing tracks were skipped. See Missing files."
    },
    "bitrate.preview": {
      one: "{count} track would go into {name}. Confirm to write. Quit Serato first.",
      other: "{count} tracks would go into {name}. Confirm to write. Quit Serato first."
    },
    "bitrate.previewEmpty": "No flagged tracks to save.",
    "bitrate.reason.lossy_source": "Lossless file looks like it came from a lossy encode",
    "bitrate.reason.unknown": "Suspect quality",
    "bitrate.reason.upsampled": "Stated bitrate is much higher than the spectrum",
    "bitrate.row": "{title} ({file}) — {reason}{detail}",
    "bitrate.saveCrate": "Save crate",
    "bitrate.saving": "Saving crate…",
    "bitrate.summary": {
      one: "{checked} files checked. {count} suspect file.",
      other: "{checked} files checked. {count} suspect files."
    },
    "bitrate.summaryClear": "{checked} files checked. None look like fake 320s or lossy-sourced lossless.",
    "bitrate.tooQuiet": {
      one: "{count} file was too quiet or too short to measure.",
      other: "{count} files were too quiet or too short to measure."
    },
    "bitrate.unchecked": {
      one: "{count} file has an extension this check does not know.",
      other: "{count} files have an extension this check does not know."
    },
    "bitrate.unreadable": "The bitrate check could not be read.",
    "bitrate.unreadableFiles": {
      one: "{count} file could not be read.",
      other: "{count} files could not be read."
    },
    "bitrate.unreachable": "Couldn't reach the library server. Check it's running, then press Check again",
    "bitrate.written": {
      one: "Saved crate {name} with {count} track.",
      other: "Saved crate {name} with {count} tracks."
    },
    "color.blue": "Blue",
    "color.custom": "Custom",
    "color.green": "Green",
    "color.none": "None",
    "color.orange": "Orange",
    "color.pink": "Pink",
    "color.purple": "Purple",
    "color.red": "Red",
    "color.yellow": "Yellow",
    "column.added": "Added",
    "column.artist": "Artist",
    "column.bpm": "BPM",
    "column.deck": "Deck",
    "column.energy": "Energy",
    "column.genre": "Genre",
    "column.key": "Key",
    "column.lastPlayed": "Last",
    "column.play": "Play",
    "column.played": "Played",
    "column.plays": "Plays",
    "column.time": "Time",
    "column.title": "Title",
    "common.back": "Back",
    "common.cancel": "Cancel",
    "common.close": "Close",
    "common.confirm": "Confirm",
    "common.delete": "Delete",
    "common.no": "No",
    "common.off": "Off",
    "common.on": "On",
    "common.refresh": "Refresh",
    "common.reload": "Reload",
    "common.remove": "Remove",
    "common.save": "Save",
    "common.saved": "Saved.",
    "common.tryAgain": "Try again",
    "common.up": "Up",
    "common.yes": "Yes",
    "consent.accept": "Share",
    "consent.body": "Counts and actions only, plus the app name, the app version, and the operating system. Track titles, crate names, file paths, and library contents stay on this computer. Sharing stays off unless you turn it on.",
    "consent.decline": "Don't share",
    "copies.heading": "Other copies",
    "copies.useInCrates": "Use in crates",
    "count.plays": {
      one: "{count} play",
      other: "{count} plays"
    },
    "count.split": "{a} · {b}",
    "count.tracks": {
      one: "{count} track",
      other: "{count} tracks"
    },
    "crates.allTracks": "All tracks",
    "crates.collapse": "Collapse {name}",
    "crates.colorPrompt": "Crate color: {names}",
    "crates.colorSaved": "Crate color saved.",
    "crates.colorUnknown": "Use one of the palette names.",
    "crates.confirmDelete": "Delete “{name}” and the crates inside it? The tracks stay in the library.",
    "crates.created": "Crate created.",
    "crates.deleted": "Crate deleted.",
    "crates.expand": "Expand {name}",
    "crates.find": "Find a crate",
    "crates.heading": "Crates",
    "crates.new": "New",
    "crates.newPrompt": "New crate name",
    "crates.paneA": "Left crate",
    "crates.paneB": "Right crate",
    "crates.rename": "Rename",
    "crates.renamePrompt": "Rename crate",
    "crates.renamed": "Crate renamed.",
    "crates.saveView": "Save view",
    "crates.saveViewCreated": {
      one: "Saved {count} track as a crate.",
      other: "Saved {count} tracks as a crate."
    },
    "crates.saveViewEmpty": "This list has no tracks to save.",
    "crates.saveViewPrompt": "New crate name",
    "crates.selectedCrate": "Selected crate",
    "crates.smartBadge": "smart",
    "crates.smartList": "Smart crates: {names}",
    "crates.sort": "Sort crates",
    "crates.sort.added": "Added",
    "crates.sort.name": "Name",
    "crates.sort.order": "Order",
    "crates.split": "Split",
    "cratesReplace.addToCrates": "Add the replacement to {crates}.",
    "cratesReplace.alreadyInCrates": "The replacement is already in those crates. It stays where it is.",
    "cratesReplace.confirm": "Update crates",
    "cratesReplace.intro": "Put another track in every crate this one is in, at the same position. Both can stay. Smart crates are left alone.",
    "cratesReplace.keepBoth": "Leave both tracks in those crates",
    "cratesReplace.noCrates": "This track is not in any normal crate.",
    "cratesReplace.noReplacement": "Choose the track that should go in those crates.",
    "cratesReplace.nothingToDo": "Nothing to change in the crates.",
    "cratesReplace.placed": {
      one: "Added {name} to {count} crate.",
      other: "Added {name} to {count} crates."
    },
    "cratesReplace.previewFailed": "Could not read the preview.",
    "cratesReplace.quitSerato": "Quit Serato before updating crates. The preview shows the plan.",
    "cratesReplace.readingPreview": "Reading the preview…",
    "cratesReplace.removeFromCrates": "Remove the original from {crates}.",
    "cratesReplace.retire": "Then remove this track from those crates",
    "cratesReplace.retired": "Removed {name} from those crates.",
    "cratesReplace.search": "Replacement track",
    "cratesReplace.title": "Use in crates",
    "cratesReplace.updated": "Crates updated.",
    "cratesReplace.updating": "Updating…",
    "detail.bpmNumber": "BPM needs a number.",
    "detail.confirmRemove": "Remove this track from the library? The audio file stays on disk.",
    "detail.empty": "Select a track to read its attributes.",
    "detail.hideSearchCopies": "Hide search copies",
    "detail.readFailed": "Could not read track ({status})",
    "detail.reading": "Reading attributes",
    "detail.relocate": "Relocate",
    "detail.relocatePrompt": "Path to the audio file",
    "detail.relocated": "File location saved.",
    "detail.removeFromLibrary": "Remove from library",
    "detail.removePrepare": "Remove from Prepare",
    "detail.removed": "Removed from the library.",
    "detail.removedPrepare": "Removed from Prepare.",
    "detail.reveal": "Reveal in {manager}",
    "detail.saveTrack": "Save track",
    "detail.searchCopies": {
      one: "Search copies, {count} field",
      other: "Search copies, {count} fields"
    },
    "detail.sendPrepare": "Send to Prepare",
    "detail.sentPrepare": "Sent to Prepare.",
    "detail.useInCrates": "Use this copy in crates",
    "drift.bpmRange": " ({min}–{max} BPM)",
    "drift.checking": "Checking tempo…",
    "drift.empty": "No drifting or live-looking tracks in this crate.",
    "drift.heading": "Tempo drift",
    "drift.intro": "Needs a crate because it decodes audio. Flags a wandering tempo, a live-looking name, or Serato's pending tempo-map mark. A grid that already changes tempo is skipped. This does not rewrite BPM.",
    "drift.mapped": {
      one: "{count} track already has a flexible beatgrid.",
      other: "{count} tracks already have a flexible beatgrid."
    },
    "drift.notFound": {
      one: "{count} missing track was skipped. See Missing files.",
      other: "{count} missing tracks were skipped. See Missing files."
    },
    "drift.reason.drifting": "Tempo wanders",
    "drift.reason.live": "Looks like a live recording",
    "drift.reason.pending_map": "Serato marked a pending tempo map",
    "drift.reason.unknown": "Needs a flexible beatgrid",
    "drift.row": "{title} ({file}) — {reasons}{bpm}",
    "drift.summary": {
      one: "{checked} files checked. {count} track may need a flexible beatgrid.",
      other: "{checked} files checked. {count} tracks may need a flexible beatgrid."
    },
    "drift.summaryClear": "{checked} files checked. None need a flexible beatgrid.",
    "drift.tooQuiet": {
      one: "{count} file was too quiet or too short to measure.",
      other: "{count} files were too quiet or too short to measure."
    },
    "drift.unchecked": {
      one: "{count} file has an extension this check does not know.",
      other: "{count} files have an extension this check does not know."
    },
    "drift.unreadableFiles": {
      one: "{count} file could not be read.",
      other: "{count} files could not be read."
    },
    "drift.unreachable": "Couldn't reach the library server. Check it's running, then press Check again",
    "drift.unreadable": "The tempo check could not be read.",
    "duplicates.readFailed": "Could not read duplicates.",
    "error.action_unavailable": "That action is not available.",
    "error.artwork_already": "This file already has artwork.",
    "error.artwork_format": "This file format cannot take artwork yet.",
    "error.artwork_lookup": "Cover lookup failed.",
    "error.artwork_needs_confirm": "Confirm the cover before it is saved.",
    "error.artwork_needs_release": "Choose a cover before it is saved.",
    "error.artwork_no_cover": "No cover was found for this track.",
    "error.artwork_no_search": "This track has no title or artist to search.",
    "error.artwork_not_image": "That image is not a JPEG or PNG cover.",
    "error.artwork_write_failed": "The artwork could not be written.",
    "error.backup_no_space": "There is not enough disk space to back up the library.",
    "error.backup_serato_running": "Quit Serato DJ Pro before backing up drive crates. Serato DJ is still running, so nothing was copied.",
    "error.bitrate_needs_crate": "Choose a crate for a bitrate check.",
    "error.tempo_needs_crate": "Choose a crate for a tempo check.",
    "error.body_not_json": "The request body is not JSON.",
    "error.body_not_object": "The request body is not an object.",
    "error.choose_copy": "Choose the copy to keep.",
    "error.choose_replace_from": "Choose the track to replace.",
    "error.choose_replace_to": "Choose the track to put in those crates.",
    "error.choose_folder": "Choose a folder.",
    "error.choose_genre_or_artist": "Choose genre or artist.",
    "error.choose_spelling": "Choose a spelling.",
    "error.color_not_number": "Color needs a number.",
    "error.color_out_of_range": "Color is out of range.",
    "error.consent_not_saved": "The sharing choice could not be saved.",
    "error.crate_name_separator": "Use a crate name without the Serato name separator.",
    "error.crate_name_too_long": "That crate name is too long.",
    "error.crate_not_in_space": "That crate is not in this space.",
    "error.crate_not_root": "Tracks live in a crate, not the space root.",
    "error.field_readonly": "That field cannot be edited.",
    "error.file_already_this_track": "That file is already this track.",
    "error.file_already_used": "Another library track already uses that file.",
    "error.file_not_on_disk": "That file is not on disk.",
    "error.focus_failed": "The window could not be focused.",
    "error.folder_not_library": "That folder is not the Serato library on this computer.",
    "error.folder_outside_roots": "That folder is outside the music folders.",
    "error.folder_unreadable": "That folder could not be read.",
    "error.internal": "Something went wrong. The details are in the local log.",
    "error.invalid_request": "That request is not valid.",
    "error.language_not_saved": "The language could not be saved.",
    "error.layout_not_saved": "The layout could not be saved.",
    "error.legacy_read_only": "This library was made by an older Serato DJ. This app can show it but cannot change it yet.",
    "error.length_invalid": "Length needs a whole number of milliseconds.",
    "error.library_log_unconfirmed": "The session log does not confirm this library file ({database}). Writes and restores are off. Snapshots can still be taken and read.",
    "error.library_not_saved": "The library could not be saved.",
    "error.logs_not_opened": "The logs folder could not be opened.",
    "error.move_failed": "The file could not be moved. Nothing was changed.",
    "error.no_legacy_library": "No older Serato library was found.",
    "error.no_library": "No Serato library was found on this computer.",
    "error.not_duplicate": "That track is not in a duplicate group.",
    "error.note_too_long": "The note is too long.",
    "error.nothing_to_undo": "There is no outside change to undo.",
    "error.path_unreadable": "That path could not be read.",
    "error.playlist_empty": "The playlist is empty.",
    "error.preset_bad_band": "Choose a BPM band whose low end is below its high end, up to 400.",
    "error.preset_bad_bpm": "Choose a BPM above zero and a range of 0 to 50.",
    "error.preset_bad_genre": "Choose a genre.",
    "error.preset_bad_key": "Choose a musical key for the harmonic preset.",
    "error.preset_bad_months": "Choose between 1 and 240 months.",
    "error.preset_crate_gone": "That preset crate is no longer in the library.",
    "error.preset_not_a_preset_crate": "That crate was not made from a preset.",
    "error.preset_unknown": "That crate preset is not available.",
    "error.rating_invalid": "Rating needs a whole number from 1 to 5.",
    "error.recycle_failed": "The file could not be moved to the Recycle Bin.",
    "error.registration_no_space": "Crates were not registered. This library has no Serato Library space, so Serato may remove those crate files the next time it opens.",
    "error.related_direction": "Choose a one-way or two-way link.",
    "error.related_missing": "That link is not in the related tracks.",
    "error.related_not_saved": "The related-tracks file could not be saved.",
    "error.related_self": "A track cannot be related to itself.",
    "error.related_unreadable": "The related-tracks file could not be read.",
    "error.relink_duplicate_files": "Two of those files are the same.",
    "error.relink_duplicate_tracks": "Two of those tracks are the same.",
    "error.relink_needs_tracks": "Choose tracks to relink.",
    "error.relink_not_audio": "That file is not an audio file.",
    "error.relink_still_on_disk": "That track is still on disk.",
    "error.replace_needs_confirm": "Confirm the crate update before it runs.",
    "error.replace_same_track": "Those two tracks are the same.",
    "error.requestFailed": "Request failed",
    "error.requestStatus": "Request failed ({status})",
    "error.root_color": "The space root has no color.",
    "error.root_delete": "The space root cannot be deleted.",
    "error.root_rename": "The space root cannot be renamed.",
    "error.scan_depth": "Choose a quick or full check.",
    "error.scan_full_needs_crate": "Choose a crate for a full decode check.",
    "error.serato_version_unknown": "Serato version is unknown (build {build}). Writes and restores are off until the installed Serato version can be read. A value that is not a dotted number, including an unreadable plist, is unknown. Snapshots can still be taken and read.",
    "error.setup_needs_consent": "Choose whether to share stats before finishing setup.",
    "error.setup_not_saved": "Setup could not be saved.",
    "error.shortcut_skipped": "Shortcuts are left alone.",
    "error.smart_crate_tracks": "Smart crates choose their tracks from rules.",
    "error.smart_rules_json": "Smart crate rules need to be JSON.",
    "error.smart_rules_list": "Smart crate rules need a rules list.",
    "error.snapshot_id_invalid": "That snapshot id is not valid.",
    "error.snapshot_incomplete": "That snapshot is incomplete.",
    "error.snapshot_unreadable": "That snapshot could not be read.",
    "error.space_unavailable": "That space is not available here.",
    "error.spelling_not_in_group": "That spelling is not in a group.",
    "error.theme_not_saved": "The theme could not be saved.",
    "error.track_id_required": "Track id is required.",
    "error.track_not_in_library": "That track is not in the library.",
    "error.track_not_in_space": "Track is not in this space.",
    "error.track_not_in_space_alt": "That track is not in this space.",
    "error.too_many_files": "Choose fewer files at once.",
    "error.track_path_required": "A track path is required.",
    "error.trash_failed": "The file could not be moved to the Trash.",
    "error.tree_bad_bands": "Choose BPM bands between 1 and 400, 1 to 50 wide, starting no further apart than their width, and at most 60 bands.",
    "error.tree_bad_genres": "Choose at least 1 track per genre and up to 100 genres.",
    "error.tree_empty": "No tracks fit that crate tree.",
    "error.tree_unknown": "That crate tree is not available.",
    "error.undo_needs_confirm": "Confirm undo before it is saved.",
    "error.upload_too_large": "That upload is too large.",
    "error.write_preimage_mismatch": "The pre-write snapshot does not match its hash.",
    "error.write_rollback_failed": "The write did not match, and putting the library back failed.",
    "error.write_undo_failed": "The write failed, and putting the library back failed.",
    "export.m3u": "Export",
    "field.album": "Album",
    "field.artist": "Artist",
    "field.beatgridLocked": "Beatgrid locked",
    "field.color": "Color",
    "field.comments": "Comments",
    "field.composer": "Composer",
    "field.emoji": "Emoji",
    "field.file": "File",
    "field.genre": "Genre",
    "field.grouping": "Grouping",
    "field.label": "Label",
    "field.rating": "Rating",
    "field.remixer": "Remixer",
    "field.title": "Title",
    "field.year": "Year",
    "files.andMore": "And {count} more.",
    "files.browseElsewhere": "Browse elsewhere…",
    "files.changeCrates": "Crates: {crates}.",
    "files.checking": "Checking what will change.",
    "files.chooseDelete": "Choose files to delete.",
    "files.chooseDestination": "Choose the destination folder. Then confirm the move.",
    "files.chooseMove": "Choose files to move.",
    "files.chooseOneRename": "Choose one file to rename.",
    "files.chooseRenameFromTags": "Choose files to rename from tags.",
    "files.chooseOneReplace": "Choose one file to replace.",
    "files.contents": "Folder contents",
    "files.driveMissing": "Drive not connected",
    "files.driveMissingLabel": "{name}, Drive not connected",
    "files.empty": "This folder is empty.",
    "files.fileCount": {
      one: "{count} file",
      other: "{count} files"
    },
    "files.inLibrary": "In library",
    "files.moveFolder": "Move this folder",
    "files.moveHere": "Move here",
    "files.moveToFolder": "Move to folder",
    "files.moveToTrash": "Move to Trash",
    "files.newFile": "New file",
    "files.newName": "New name",
    "files.noMatches": "No files match “{query}”.",
    "files.noRoots": "No music folders yet",
    "files.noRootsBody": "Setup finds the folders Serato uses for your music.",
    "files.notSaved": "That change was not saved.",
    "files.nothingUntilConfirm": "Nothing is changed until you confirm.",
    "files.open": "Open {name}",
    "files.path": "Folder path",
    "files.readingFolder": "Reading this folder",
    "files.readingFolderNote": "Reading this folder.",
    "files.readingRoots": "Reading music folders",
    "files.readingRootsNote": "Reading music folders.",
    "files.renameFromTags": "Rename from tags",
    "files.replaceFile": "Upgrade file (keep cues)",
    "files.review": "Review",
    "files.reviewTitle": "Review this change",
    "files.rootCount": {
      one: "{count} music folder",
      other: "{count} music folders"
    },
    "files.roots": "Music folders",
    "files.rootsUnreadable": "Music folders could not be read.",
    "files.runSetup": "Run setup",
    "files.saving": "Saving.",
    "files.searchLabel": "Search files",
    "files.searchPlaceholder": "Search files",
    "files.searchResults": "Search results",
    "files.searchTruncated": "Some matching files are not listed. Type more of the name.",
    "files.searching": "Searching files…",
    "files.shortcut": "{name} (shortcut)",
    "files.trash": "Trash",
    "files.truncated": "Some files are not listed.",
    "files.updated": "The files were updated.",
    "folderSync.button": "Sync folder",
    "folderSync.counting": "Counting tracks…",
    "folderSync.done": "{name} updated: {added} added, {removed} removed.",
    "folderSync.folder": "Folder",
    "folderSync.full": "Remove tracks whose files are not in this folder",
    "folderSync.intro": "Add library tracks whose files sit in this folder. Files that are not in the library stay skipped. Nothing is imported.",
    "folderSync.subcrates": "Make a subcrate for each subfolder",
    "folderSync.summary": "{added} to add, {removed} to remove. {skipped} files not in the library.",
    "folderSync.summaryNone": "Already in sync. {skipped} files not in the library.",
    "folderSync.sync": "Sync crate",
    "folderSync.title": "Sync crate with a folder",
    "folderSync.unchanged": "{name} already matches that folder.",
    "format.bytes": {
      one: "{count} byte",
      other: "{count} bytes"
    },
    "format.hoursMinutes": "{hours}h {minutes}m",
    "format.minutes": "{minutes}m",
    "generation.checking": "Checking",
    "generation.label": "Library generation",
    "generation.legacy": "Older Serato",
    "generation.named": "Library generation, {kind}",
    "generation.reason.downgrade": "The newest session log says Serato {newest}, and an earlier log says Serato {version}.",
    "generation.reason.fallback": "No session log was found. The installed Serato version is {version}.",
    "generation.reason.installUnknown": "The installed Serato version could not be read, so writes stay off. A session log cannot turn them on.",
    "generation.reason.installed": "The installed Serato is {version}. The newest session log says Serato {newest}.",
    "generation.reason.log": "The newest session log {log} recorded Serato {version} opening {database}.",
    "generation.reason.mismatch": "The session log opened {database}, which is not this library file.",
    "generation.reason.pending": "The library generation has not been read yet.",
    "generation.reason.unknown": "A session log was found, but it did not name Serato 4 or Serato 5. Writes and restores stay off.",
    "generation.reason.unmounted": "The session log {log} named {database} on a drive that is not connected.",
    "generation.reason.version": "The newest session log {log} names Serato {version} and does not name a database file.",
    "generation.serato4": "Serato 4",
    "generation.serato5": "Serato 5",
    "generation.unknown": "Version unknown",
    "gig.checkAgain": "Check again",
    "gig.checking": "Checking the library…",
    "gig.cratesAdded": "Crates added",
    "gig.cratesEdited": "Crates edited",
    "gig.cratesRemoved": "Crates removed",
    "gig.cuesEdited": "Cues edited",
    "gig.done": "Done",
    "gig.doneNotReady": "Not ready for the gig: {score}/100, checked {crate} at {time}",
    "gig.doneReady": "Ready for the gig: {score}/100, checked {crate} at {time}",
    "gig.driveUnavailable": {
      one: "{name}: {count} track unavailable",
      other: "{name}: {count} tracks unavailable"
    },
    "gig.drives": "Drives",
    "gig.drivesAction": "Check drives",
    "gig.drivesEmpty": "No drives are unplugged.",
    "gig.emptyCrates": "Empty crates",
    "gig.emptyCratesAction": "Fill empty crates",
    "gig.emptyCratesEmpty": "No empty crates.",
    "gig.exit": "Exit gig check",
    "gig.gridsEdited": "Beatgrids edited",
    "gig.groupCount": "{label} ({count})",
    "gig.heading": "Gig check",
    "gig.holding": "Holding it back",
    "gig.missing": "Missing files",
    "gig.missingAction": "Locate missing files",
    "gig.missingEmpty": "No files are missing.",
    "gig.noSnapshot": "No snapshot to compare.",
    "gig.score": "{score}/100",
    "gig.scoreLabel": "Ready score {score} out of 100, {verdict}",
    "gig.showAll": "Show all {count}",
    "gig.since": "Since last gig",
    "gig.sinceAction": "Review changes",
    "gig.sinceEmpty": "Nothing changed since the last snapshot.",
    "gig.stepOf": "Step {index} of {total}",
    "gig.streaming": "Streaming",
    "gig.streamingAction": "Review streaming tracks",
    "gig.streamingEmpty": "No streaming tracks.",
    "gig.tagsEdited": "Tags edited",
    "gig.tracksAdded": "Tracks added",
    "gig.tracksRemoved": "Tracks removed",
    "gig.unreachable": "Couldn't reach the library server. Check it's running, then press Check again",
    "gig.unreadable": "The gig check could not be read.",
    "gig.verdictNotReady": "✕ Not ready",
    "gig.verdictReady": "✓ Ready",
    "gig.wholeSpace": "Whole space",
    "gig.wholeSpaceInline": "the whole space",
    "gig.wordNotReady": "not ready",
    "gig.wordReady": "ready",
    "health.checking": "Checking the library…",
    "health.artEmbed": "Embed cover",
    "health.artIntro": "Looks up Cover Art Archive. Preview the cover, then embed it into the audio file. Cue points stay. Quit Serato first.",
    "health.artLooking": "Looking up covers…",
    "health.artNone": "No cover was found for this track.",
    "health.artPick": "Cover to embed",
    "health.artTitle": "Find album art",
    "health.clear": "Nothing to fix in this check.",
    "health.duplicateRow": {
      one: "{title} ({count} copy)",
      other: "{title} ({count} copies)"
    },
    "health.bitrate": "Suspect quality",
    "health.bitrateNote": "Fake 320s and lossless files made from a lossy encode. Needs a crate because it decodes audio.",
    "health.duplicates": "Duplicate groups",
    "health.emptyGenre": "Empty genre",
    "health.fileRow": "{file}",
    "health.findArt": "Find art",
    "health.heading": "Library health",
    "health.intro": "Counts from the library and from audio files on disk. Each row opens the place that can fix it.",
    "health.missing": "Missing files",
    "health.more": {
      one: "{count} more.",
      other: "{count} more."
    },
    "health.noArtwork": "No artwork",
    "health.noBeatgrid": "No beatgrid",
    "health.noBpm": "No BPM",
    "health.noCrate": "Not in a crate",
    "health.noKey": "No key",
    "health.openBitrate": "Open Suspect quality",
    "health.openDuplicates": "Open Duplicates",
    "health.openFiles": "Open Files",
    "health.openMissing": "Open Missing files",
    "health.row": "{title}",
    "health.summary": {
      one: "{count} track checked.",
      other: "{count} tracks checked."
    },
    "health.unreadable": "Couldn't read the health report.",
    "health.unreachable": "Couldn't reach the library server. Check it's running, then press Check again.",
    "health.unused": "Unused files",
    "help.bug": "Report a bug",
    "help.bugTitle": "Report a bug",
    "help.change": "What should change",
    "help.copied": "Copied. Paste it into the GitHub issue.",
    "help.copyFailed": "Couldn't copy the report.",
    "help.copyLog": "Copy log",
    "help.diagnostics": "What will be included",
    "help.expected": "What you expected",
    "help.feature": "Request a feature",
    "help.featureTitle": "Request a feature",
    "help.github": "View on GitHub",
    "help.happened": "What happened",
    "help.loadFailed": "Couldn't load the diagnostics.",
    "help.loading": "Loading diagnostics…",
    "help.logCopied": "Log copied.",
    "help.logEmpty": "The log is empty.",
    "help.names": "Include track and crate names from the log",
    "help.nothing": "Nothing is sent until you submit it on GitHub.",
    "help.openGitHub": "Open on GitHub",
    "help.opened": "Opened in your browser. Review it, then submit it on GitHub.",
    "help.opening": "Opening…",
    "help.releases": "Release notes",
    "help.reportText": "Report text",
    "help.review": "You will see this on GitHub before it is submitted. The app does not post it.",
    "help.title": "Help",
    "help.tooLong": "The report is too long for a link. It was copied. Paste it into the GitHub issue.",
    "history.chooseSession": "Choose a session.",
    "history.file": "File",
    "history.notes": "Notes",
    "history.openInLibrary": "Open in library",
    "history.readFailed": "Could not read history.",
    "history.session": "Session",
    "history.sessionFailed": "Could not read that session.",
    "history.sessions": "History sessions",
    "history.started": "Started",
    "import.added": {
      one: "{count} track added.",
      other: "{count} tracks added."
    },
    "import.button": "Import",
    "import.defaultName": "Imported playlist",
    "import.unmatched": {
      one: "{count} line did not match a library track.",
      other: "{count} lines did not match a library track."
    },
    "layout.resize": "Resize the track list",
    "layout.resizeHint": "Drag to resize. Double-click to reset.",
    "layout.widthNotSaved": "Couldn't save the pane width. It goes back to the last saved width next time.",
    "library.loading": "Loading the library",
    "library.readFailed": "Could not read the library ({status})",
    "library.unavailable": "Library unavailable",
    "list.label": "Tracks",
    "list.noMatches": "No tracks match.",
    "list.readingDuplicates": "Reading duplicates",
    "logs.copied": "Copied the logs.",
    "logs.copiedTruncated": "Copied the latest log entries. Older entries were left out.",
    "logs.copyFailed": "Couldn't copy the logs.",
    "logs.copyManual": "Couldn't copy automatically. Select the log text and copy it.",
    "logs.copying": "Copying…",
    "logs.empty": "No log entries yet.",
    "logs.openFailed": "Couldn't open the logs folder.",
    "logs.opened": "Opened the logs folder.",
    "markers.beats": {
      one: "{count} beat",
      other: "{count} beats"
    },
    "markers.bpm": "{bpm} BPM",
    "markers.cue": "Cue point {number}",
    "markers.cueEmpty": "Empty",
    "markers.flip": "Flip {number}",
    "markers.gridEmpty": "The beatgrid has no markers.",
    "markers.gridHeading": "Beatgrid",
    "markers.gridNone": "No beatgrid in this file.",
    "markers.gridSuspect": "Suspect beatgrid. {reason}",
    "markers.gridTooMany": "The beatgrid has more than 4096 markers.",
    "markers.gridTooShort": "The beatgrid is too short to read.",
    "markers.gridTruncated": "The beatgrid is shorter than its marker count.",
    "markers.gridUnknown": "The beatgrid could not be read.",
    "markers.gridVersion": "That beatgrid version is not supported.",
    "markers.gridViewOnly": "View only. This app does not rewrite the beatgrid.",
    "markers.heading": "Cue points, saved loops, and beatgrid",
    "markers.loop": "Saved loop {number}",
    "markers.loopLocked": "Saved loop {number} locked",
    "markers.none": "No Serato cue points in this file.",
    "markers.readOnly": "Read from the audio file. These are not written back.",
    "markers.unavailable": "The file is not on disk, so cues cannot be read.",
    "menu.close": "Close",
    "menu.exportRekordbox": "Export to Rekordbox",
    "menu.file": "File",
    "menu.focusSearch": "Focus search",
    "menu.help": "Help",
    "menu.library": "Music",
    "menu.minimize": "Minimize",
    "menu.resetWidth": "Reset list width",
    "menu.tools": "Tools",
    "menu.window": "Window",
    "merge.addToCrates": "Add the kept copy to {crates}.",
    "merge.addToSpace": "Add the kept copy to the {space} space.",
    "merge.alreadyInCrates": "The kept copy is already in every crate the others use. It stays where it is.",
    "merge.confirmTrash": "Merge and move files to Trash",
    "merge.copiedCues": "{file} had the better {what}. They were copied onto the file you keep.",
    "merge.copyCues": "{file} has the better {what}. They will be copied onto the file you keep.",
    "merge.copyCuesWhatBoth": "cues and beatgrid",
    "merge.copyCuesWhatGrid": "beatgrid",
    "merge.copyCuesWhatMarkers": "cues",
    "merge.fieldChange": "{label} changes from {before} to {after}.",
    "merge.filesStay": "Audio files stay on disk.",
    "merge.intro": "Keep one copy. The others leave the library. Audio files stay on disk unless you move them to the Trash.",
    "merge.keep": "Copy to keep",
    "merge.keptCopy": "the kept copy",
    "merge.merged": {
      one: "Merged {count} copy into {name}.",
      other: "Merged {count} copies into {name}."
    },
    "merge.merging": "Merging…",
    "merge.noCrates": "None of the copies are in a crate.",
    "merge.noFields": "No empty fields or higher play count to copy.",
    "merge.noHistory": "No history entries point at the other copies.",
    "merge.noHistoryId": "This library has no history track id to repoint.",
    "merge.plays": {
      one: "{count} play",
      other: "{count} plays"
    },
    "merge.previewFailed": "The preview could not be read.",
    "merge.quitSerato": "Quit Serato before merging. The preview shows the plan.",
    "merge.readingPreview": "Reading the preview…",
    "merge.removeCopies": {
      one: "Remove {count} copy from the library.",
      other: "Remove {count} copies from the library."
    },
    "merge.repointHistory": {
      one: "Point {count} history entry at the kept copy.",
      other: "Point {count} history entries at the kept copy."
    },
    "merge.title": "Merge copies",
    "merge.trashFiles": "Move {files} to the Trash.",
    "merge.trashLabel": "Move the other audio files to the Trash",
    "merge.trashNote": "Off by default. Files go to the Trash, where you can restore them. They are not permanently deleted.",
    "mode.bitrate": "Needs a crate. Saving a crate writes the library. Quit Serato first.",
    "mode.drift": "Read-only. This check does not change the library.",
    "mode.duplicates": "Same title, artist, and length. Select a copy, then merge the others into it.",
    "mode.files": "Files on disk. Cue points stay in the audio file. Crates follow the path.",
    "mode.gig": "Read-only. This check does not change the library.",
    "mode.health": "Read-only. This report does not change the library.",
    "mode.missing": "Tracks whose files are missing on a connected drive.",
    "mode.missingOffline": {
      one: "Tracks whose files are missing on a connected drive. {count} track on an unplugged drive is marked offline in crates.",
      other: "Tracks whose files are missing on a connected drive. {count} tracks on unplugged drives are marked offline in crates."
    },
    "mode.portable": "Read-only. This check does not change the library.",
    "mode.scan": "Read-only. This check does not change the library.",
    "mode.snapshots": "Hash-checked copies of the library, crates, and Serato frames inside audio files. Audio itself is not copied.",
    "mode.stats": "Most played tracks and artists in a period. Making a crate from the idle list writes the library. Quit Serato first.",
    "mode.stems": "Tracks with a stems analysis state.",
    "mode.tags": "Writes the library, not the audio files. Quit Serato first.",
    "operations.action.crateAdd": "Add to crate",
    "operations.action.crateColor": "Crate color",
    "operations.action.crateCreate": "Create crate",
    "operations.action.crateDelete": "Delete crate",
    "operations.action.crateExpanded": "Crate expanded",
    "operations.action.cratePrepare": "Prepare",
    "operations.action.crateRemove": "Remove from crate",
    "operations.action.crateRemoveLibrary": "Remove from library",
    "operations.action.crateRename": "Rename crate",
    "operations.action.crateRules": "Crate rules",
    "operations.action.delete": "Delete file",
    "operations.action.importM3u": "Import playlist",
    "operations.action.mergeDuplicates": "Merge copies",
    "operations.action.move": "Move file",
    "operations.action.moveFolder": "Move folder",
    "operations.action.rename": "Rename file",
    "operations.action.renameFromTags": "Rename from tags",
    "operations.action.relink": "Relink files",
    "operations.action.replace": "Upgrade file (keep cues)",
    "operations.action.replaceInCrates": "Replace in crates",
    "operations.action.restore": "Restore",
    "operations.action.restoreRecover": "Recover restore",
    "operations.action.saveTrack": "Save track",
    "operations.actionOther": "Library edit",
    "operations.beforeOnly": "Before {before}.",
    "operations.empty": "No checked edits yet. Each library edit and each restore is listed here after it is checked.",
    "operations.entry": "{time}. {action}. {target}. {outcome}.",
    "operations.heading": "Operation log",
    "operations.noTarget": "the library",
    "operations.outcome.refused": "Not saved",
    "operations.outcome.rollbackFailed": "Could not put back",
    "operations.outcome.rolledBack": "Put back",
    "operations.outcome.verified": "Checked",
    "operations.reading": "Reading the operation log",
    "operations.rollbackFailed": "A change could not be put back. The library may not match the last good copy. This was not saved as a success.",
    "operations.snapshots": "Before {before}. After {after}.",
    "operations.unreadable": "The operation log could not be read.",
    "plan.andMore": ", and {count} more",
    "plan.cratesAdded": "Crates added",
    "plan.cratesChanged": "Crates changed",
    "plan.cratesRegistered": "Crates registered so Serato keeps them",
    "plan.cratesRemoved": "Crates removed",
    "plan.cratesSkipped": "Crates skipped",
    "plan.cratesUnavailable": "Crates on an unavailable drive",
    "plan.cueChanges": "Cue changes",
    "plan.cueDiff": "{before} → {after}",
    "plan.deletedCrates": "Deleted crates",
    "plan.deletedCues": "Deleted cues",
    "plan.deletedGrids": "Deleted grids",
    "plan.deletedTracks": "Deleted tracks",
    "plan.files": {
      one: "{label}: {count} file",
      other: "{label}: {count} files"
    },
    "plan.gridChanges": "Grid changes",
    "plan.item": "item",
    "plan.listed": "{label}: {count}. {names}",
    "plan.none": "{label}: none",
    "plan.nothingChanged": "Nothing has been changed.",
    "plan.tracksAdded": "Tracks added",
    "plan.tracksRemoved": "Tracks removed",
    "plan.tracksUnavailable": "Tracks on an unavailable drive",
    "player.cannotPlay": "This file cannot be played in this window.",
    "player.cue": "Cue",
    "player.duration": "Duration",
    "player.elapsed": "Elapsed",
    "player.next": "Next",
    "player.notInLibrary": "Not in the library or file missing",
    "player.nothingPlaying": "Nothing playing",
    "player.overview": "Track overview",
    "player.overviewSeek": "Click or drag to seek",
    "player.pause": "Pause",
    "player.play": "Play",
    "player.previous": "Previous",
    "player.region": "Player",
    "player.seek": "Seek",
    "player.volume": "Volume",
    "player.waveformReading": "Reading the waveform…",
    "player.waveformUnavailable": "Waveform unavailable for this format",
    "player.zoomIn": "Zoom in",
    "player.zoomOut": "Zoom out",
    "portable.check": "Check drive",
    "portable.checkLabel": "Check {name}",
    "portable.checking": "Checking this drive.",
    "portable.driveLabel": "Drive",
    "portable.kindFileSize": "File too large",
    "portable.kindMissing": "Missing",
    "portable.kindOffDrive": "Not on this drive",
    "portable.kindPathLength": "Path too long",
    "portable.kindSmartCrate": "Smart Crate",
    "portable.kindUnsafeName": "Unsafe name",
    "portable.missing": "This drive is not connected. Nothing was deleted.",
    "portable.noDrive": "No connected drive with a _Serato_ folder.",
    "portable.notReady": "Not ready. Fix these on the laptop first.",
    "portable.offlineNamed": "{name} is not connected. Nothing was deleted.",
    "portable.readOnly": "This only reads the drive. Nothing is copied or deleted.",
    "portable.ready": "Ready to leave the laptop.",
    "portable.title": "Portable drive",
    "portable.unreachable": "This drive could not be checked.",
    "portable.unreadable": "This drive could not be read.",
    "presets.bpm": "BPM",
    "presets.button": "Preset",
    "presets.counting": "Counting tracks…",
    "presets.create": "Create crate",
    "presets.created": {
      one: "{name} saved with {count} track.",
      other: "{name} saved with {count} tracks."
    },
    "presets.intro": "The app picks the tracks and saves a normal crate whose name ends in ⟳. Serato plays it like any crate. It refreshes when this app opens while Serato is closed, or when you press Refresh.",
    "presets.key": "Key",
    "presets.keyHelp": "Camelot, like 8A, or a key name, like Am.",
    "presets.kind": "Preset",
    "presets.kind.bpm": "BPM range",
    "presets.kind.harmonic": "Mixes with a key",
    "presets.kind.unplayed": "Not played lately",
    "presets.matches": {
      one: "{count} track matches.",
      other: "{count} tracks match."
    },
    "presets.months": "Months",
    "presets.name": "Crate name",
    "presets.name.bpm": "BPM {bpm} ±{range}",
    "presets.name.harmonic": "Mixes with {key}",
    "presets.name.unplayed": {
      one: "Not played in {count} month",
      other: "Not played in {count} months"
    },
    "presets.range": "Plus or minus",
    "presets.refresh": "Refresh",
    "presets.refreshed": "{name} refreshed: {added} added, {removed} removed.",
    "presets.refreshedOnOpen": {
      one: "{count} preset crate refreshed.",
      other: "{count} preset crates refreshed."
    },
    "presets.scope": "Only tracks in {name} and its subcrates",
    "presets.title": "New crate from a preset",
    "presets.updated": "⟳ updated {date}",
    "quickOpen.empty": "Type a track or file name.",
    "quickOpen.file": "File",
    "quickOpen.fileError": "Files on disk could not be searched. Track matches are still listed.",
    "quickOpen.label": "Name",
    "quickOpen.matchCount": {
      one: "{count} match",
      other: "{count} matches"
    },
    "quickOpen.matches": "Matches",
    "quickOpen.none": "No tracks or files match “{query}”.",
    "quickOpen.placeholder": "Track or file name",
    "quickOpen.searching": "Searching files…",
    "quickOpen.title": "Find a track or file",
    "quickOpen.track": "Track",
    "quickOpen.truncated": "Some files were not searched. Type more of the name.",
    "rail.heading": "crateCraft",
    "rating.none": "Not rated",
    "rating.stars": {
      one: "{count} star",
      other: "{count} stars"
    },
    "rekordbox.dialogTitle": "Download rekordbox.xml?",
    "rekordbox.download": "Download",
    "rekordbox.downloadTitle": "Download rekordbox.xml",
    "rekordbox.failed": "The Rekordbox export failed.",
    "rekordbox.hotLoops": "Hot loops",
    "rekordbox.hotLoopsHelp": "Uses a free hot-cue pad",
    "rekordbox.intro": "These items are not copied into Rekordbox. The file downloads after you confirm.",
    "rekordbox.keyAsis": "Key as stored",
    "rekordbox.keyCamelot": "Camelot key",
    "rekordbox.keyClassical": "Classical key",
    "rekordbox.keyNotation": "Rekordbox key notation",
    "rekordbox.memoryCues": "Memory cues",
    "rekordbox.notXml": "The export did not produce an XML file.",
    "rekordbox.reportLabel": "What is not copied",
    "related.confirmRemove": "Remove the link to “{name}”?",
    "related.crateNote": "Creates or refreshes the crate “{name}”. Serato must be quit.",
    "related.crateUpdated": "Crate “{name}” updated.",
    "related.find": "Find a track to link",
    "related.findPlaceholder": "Title or artist",
    "related.heading": "Mixes well with",
    "related.linkRating": "Link rating",
    "related.loadFailed": "Mixes well with could not be loaded.",
    "related.loading": "Loading mixes well with",
    "related.noPath": "This track has no file path, so it cannot be linked.",
    "related.noSuggestions": "No suggestions from key, tempo, or shared crates.",
    "related.noneSaved": "No saved links yet. Search for a track, or save a suggestion.",
    "related.notInLibrary": "Not in this library",
    "related.note": "Note",
    "related.notePlaceholder": "blend out of",
    "related.oneWay": "One-way",
    "related.quitSerato": "Quit Serato before writing the crate.",
    "related.ratingOutOf": "{rating}/5",
    "related.removeLink": "Remove link to {name}",
    "related.removed": "Link removed.",
    "related.saveLink": "Save link",
    "related.saveLinkTo": "Save link to {name}",
    "related.saved": "Link saved.",
    "related.savedCount": "{count} saved",
    "related.suggested": "Suggested from key, tempo within 6%, and shared crates. Save stores a two-way link.",
    "related.thisTrack": "this track",
    "related.twoWay": "Two-way",
    "related.twoWayLink": "Two-way link",
    "related.typeHint": "Type a title or artist.",
    "related.updateCrate": "Update Serato crate",
    "relink.acceptHigh": "Accept all high",
    "relink.choose": "Choose tracks to relink.",
    "relink.confidence": "Confidence",
    "relink.confidence.high": "High",
    "relink.confidence.low": "Low",
    "relink.confidence.medium": "Medium",
    "relink.confirm": "Relink",
    "relink.done": {
      one: "Pointed {count} missing track at its file.",
      other: "Pointed {count} missing tracks at their files."
    },
    "relink.empty": "No missing tracks in this space, or none of them matched.",
    "relink.find": "Find matches",
    "relink.finding": "Searching…",
    "relink.include": "Relink this track",
    "relink.intro": "Point missing tracks at files that moved. Audio stays where it is. Crates, history, and related links stay attached.",
    "relink.match": "Match",
    "relink.none": "No matches yet. Search the music folders, or add an extra folder after a drive swap.",
    "relink.pick": "Choose a file",
    "relink.previewing": "Checking what will change.",
    "relink.quitSerato": "Quit Serato before relinking.",
    "relink.reason.folder": "Folder moved",
    "relink.reason.name": "Same name",
    "relink.reason.nameAndSize": "Same name and size",
    "relink.reason.size": "Same size",
    "relink.reason.unknown": "{reason}",
    "relink.relinking": "Relinking…",
    "relink.remap": "Folder moved: {from} → {to} ({count} tracks)",
    "relink.root": "Extra folder to search",
    "relink.rootHelp": "Optional. Paste a folder after a drive swap, for example /Volumes/NEW/DJ.",
    "relink.scanned": "Searched {count} files.",
    "relink.selected": {
      one: "{count} selected",
      other: "{count} selected"
    },
    "relink.title": "Relink missing files",
    "relink.track": "Track",
    "relink.truncated": "The search stopped after 200,000 files. Add a closer extra folder.",
    "relink.unavailable": {
      one: "{count} track sits on a drive that is not plugged in. It is not matched.",
      other: "{count} tracks sit on a drive that is not plugged in. They are not matched."
    },
    "relink.why": "Why",
    "rules.and": "and",
    "rules.label": "Smart crate rules",
    "rules.matches": "Matches",
    "rules.none": "no rules yet",
    "rules.or": "or",
    "rules.save": "Save rules",
    "rules.saved": "Rules saved.",
    "scan.checkFull": "Full decode",
    "scan.checkQuick": "Quick check",
    "scan.checking": "Checking files…",
    "scan.decodeErrorDetail": "Decode stopped at {detail}s",
    "scan.empty": "No damaged files in this check.",
    "scan.heading": "Damaged files",
    "scan.intro": "Quick check reads the start of each file. Full decode needs a crate because it can take minutes.",
    "scan.notFound": {
      one: "{count} missing track was skipped. See Missing files.",
      other: "{count} missing tracks were skipped. See Missing files."
    },
    "scan.problem.decode_error": "Decode error",
    "scan.problem.empty": "Empty file",
    "scan.problem.serato_flagged": "Serato marked this file corrupt",
    "scan.problem.short": "Shorter than stored length",
    "scan.problem.undecodable": "Could not decode",
    "scan.problem.unknown": "Damaged file",
    "scan.problem.unreadable": "Could not read the file",
    "scan.problem.wrong_format": "Wrong format",
    "scan.row": "{title} ({file}) — {problem}",
    "scan.shortDetail": "Shorter than stored length ({detail}s)",
    "scan.summary": {
      one: "{checked} files checked. {count} damaged file.",
      other: "{checked} files checked. {count} damaged files."
    },
    "scan.summaryClear": "{checked} files checked. None damaged.",
    "scan.unchecked": {
      one: "{count} file has an extension this check does not know.",
      other: "{count} files have an extension this check does not know."
    },
    "scan.unreachable": "Couldn't reach the library server. Check it's running, then press Quick check",
    "scan.unreadable": "The file check could not be read.",
    "scan.wrongFormatDetail": "Looks like {detail}",
    "search.fieldAll": "All fields",
    "search.fieldLabel": "Search field",
    "search.tracks": "Search tracks",
    "settings.about": "About crateCraft",
    "settings.colorway": "Theme",
    "settings.colorway.classic": "Classic",
    "settings.colorway.darkClub": "Dark Club",
    "settings.colorway.light": "Light",
    "settings.colorway.seratoLike": "Serato-like",
    "settings.colorwayPreview": "Theme icon preview",
    "settings.copyLogs": "Copy logs",
    "settings.copyVersion": "Copy version",
    "settings.iconAppliedDock": "The Dock icon matches this theme.",
    "settings.iconAppliedWindow": "The window and taskbar icon match this theme.",
    "settings.iconDefault": "The app icon stays the usual one.",
    "settings.iconFollowsTheme": "App icon follows the theme",
    "settings.iconNotSaved": "Couldn't save the theme. It is used until you close the app.",
    "settings.iconSaved": "Theme saved.",
    "settings.iconUnsupported": "This computer can't change the running app icon. The choice is saved and applies on Mac and Windows.",
    "settings.language": "Language",
    "settings.languageNotSaved": "Couldn't save the language. It is used until you close the app.",
    "settings.languageSystem": "Same as the system",
    "settings.logText": "Log text",
    "settings.openLogs": "Open logs folder",
    "settings.rerunSetup": "Run setup again",
    "settings.share": "Share anonymous usage stats and crash reports",
    "settings.title": "Settings",
    "settings.updates": "Check GitHub for a newer version once a day",
    "settings.updatesFailed": "The update choice could not be saved.",
    "settings.updatesPrereleases": "Include test versions (beta and release candidates)",
    "sheet.scope": "Scope: {crate}",
    "sheet.title": "{view} · {space}",
    "shell.drawerHide": "Hide navigation",
    "shell.drawerShow": "Show navigation",
    "sharing.canSend": "Anonymous counts and crash reports can be sent.",
    "sharing.loadFailed": "Couldn't load sharing settings.",
    "sharing.loadFailedOff": "Couldn't load sharing settings. Nothing is sent.",
    "sharing.noKeys": "This copy has no telemetry keys, so nothing is sent either way.",
    "sharing.nothingSent": "Nothing is sent.",
    "sharing.off": "Sharing is off. Nothing is sent.",
    "sharing.on": "Sharing is on. Anonymous counts and crash reports can be sent.",
    "shortcuts.action": "Action",
    "shortcuts.cheatSheet": "Show shortcuts",
    "shortcuts.dismiss": "Close or clear search",
    "shortcuts.focusSearch": "Focus search",
    "shortcuts.groupFind": "Find",
    "shortcuts.groupLists": "Lists",
    "shortcuts.groupPlay": "Play",
    "shortcuts.groupViews": "Views",
    "shortcuts.intro": "These keys work anywhere on this screen, except while you are typing in a field. Esc still closes a dialog or clears a search.",
    "shortcuts.key": "Key",
    "shortcuts.listNext": "Next row",
    "shortcuts.listOpen": "Open the row",
    "shortcuts.listPrevious": "Previous row",
    "shortcuts.open": "Shortcuts",
    "shortcuts.playNote": "Space plays or pauses. Left moves 5 seconds back. Right moves 5 seconds forward.",
    "shortcuts.playPause": "Play or pause",
    "shortcuts.quickOpen": "Find a track or file",
    "shortcuts.seekBack": "Back 5 seconds",
    "shortcuts.seekForward": "Forward 5 seconds",
    "shortcuts.title": "Keyboard shortcuts",
    "shortcuts.viewCrates": "Crates",
    "shortcuts.viewFiles": "Organize files",
    "shortcuts.viewHistory": "History",
    "shortcuts.viewLibrary": "All tracks",
    "shortcuts.viewSnapshots": "Backups",
    "snapshots.backupDrives": "Back up drive crates",
    "snapshots.backupDrivesBusy": "Backing up drive crates…",
    "snapshots.count": {
      one: "{count} backup",
      other: "{count} backups"
    },
    "snapshots.drivePermission": "{name} (no permission)",
    "snapshots.driveReadOnly": "{name} (read-only)",
    "snapshots.drivesAbsent": "Unplugged, not copied: {drives}.",
    "snapshots.drivesAlready": "Those drive crates are already in this session's backup.",
    "snapshots.drivesCopied": "Copied: {drives}.",
    "snapshots.drivesIntro": "Connected drive crates are copied into the backup on this computer.",
    "snapshots.drivesNone": "No drive folders were due for a copy.",
    "snapshots.drivesSaved": "Drive crates were copied into the backup on this computer.",
    "snapshots.drivesSkipped": "Skipped: {drives}.",
    "snapshots.empty": "No backups yet. Take a backup to keep a point you can restore. Backups are kept, and this page does not expire them.",
    "snapshots.noSearch": "Backups has no search. Press Ctrl+K to find a track or a file.",
    "snapshots.outsideChange": "Something outside this app changed the Serato folder. A snapshot was saved after that change. Undo puts back the previous snapshot.",
    "snapshots.outsideChangeLexicon": "Lexicon changed the Serato folder. A snapshot was saved after that change. Undo puts back the previous snapshot.",
    "snapshots.reading": "Reading backups",
    "snapshots.readingPlan": "Reading what would change",
    "snapshots.restore": "Restore",
    "snapshots.restoreIntro": "Nothing is changed until you confirm. A new snapshot is saved first, so this restore can be undone.",
    "snapshots.restoreTitle": "Restore this backup",
    "snapshots.restored": "Restore finished. The previous library was saved first, so this can be undone from the list.",
    "snapshots.restoring": "Restoring…",
    "snapshots.reviewRestore": "Review restore",
    "snapshots.reviewUndo": "Review undo",
    "snapshots.saved": "Backup saved.",
    "snapshots.saving": "Saving backup…",
    "snapshots.seratoUnknown": "Serato version unknown",
    "snapshots.seratoVersion": "Serato {version} (build {build})",
    "snapshots.skippedCrates": {
      one: "Restore finished. {count} crate file was skipped because its snapshot copy could not be read: {names}.",
      other: "Restore finished. {count} crate files were skipped because their snapshot copy could not be read: {names}."
    },
    "snapshots.take": "Take a backup",
    "snapshots.trigger": "snapshot",
    "snapshots.unavailableDrives": "Unavailable: {drives}.",
    "snapshots.unknownDrive": "Unknown drive",
    "snapshots.unknownTime": "Unknown time",
    "snapshots.unreadable": "The backups could not be read.",
    "space.appleMusic": "Apple Music",
    "space.label": "Space",
    "space.library": "Library",
    "space.prepare": "Prepare",
    "space.video": "Video",
    "status.checking": "Checking Serato",
    "status.library": "Library",
    "stats.artistTracks": "Tracks",
    "stats.artists": "Most played artists",
    "stats.checking": "Reading play stats…",
    "stats.confirmCrate": {
      one: "Create crate “{name}” with {count} track not played in {days} days? Serato must be quit.",
      other: "Create crate “{name}” with {count} tracks not played in {days} days? Serato must be quit."
    },
    "stats.csv": "Download CSV",
    "stats.empty": "No plays in this period.",
    "stats.emptyArtists": "No played artists in this period.",
    "stats.emptyIdle": "No idle tracks for this cutoff.",
    "stats.emptyTracks": "No played tracks in this period.",
    "stats.from": "From",
    "stats.heading": "Play stats",
    "stats.idle": "Not played",
    "stats.idleCrate": "Make crate",
    "stats.idleCrateName": "Not played in {days} days",
    "stats.idleDays": "Idle days",
    "stats.idleHint": "Tracks in this space not played in {days} days.",
    "stats.idleRow": "{title} — last played {last}",
    "stats.intro": "Most played tracks and artists in a period. The idle list can become a crate. Serato must be quit. This report does not change the library until you confirm the crate.",
    "stats.more": {
      one: "{count} more not shown.",
      other: "{count} more not shown."
    },
    "stats.never": "never",
    "stats.period": "Period",
    "stats.period.365": "Last 365 days",
    "stats.period.30": "Last 30 days",
    "stats.period.7": "Last 7 days",
    "stats.period.90": "Last 90 days",
    "stats.period.all": "All time",
    "stats.period.custom": "Custom dates",
    "stats.show": "Show",
    "stats.summary": "{plays} plays across {sessions} sessions.",
    "stats.to": "To",
    "stats.tracks": "Most played tracks",
    "stats.unreadable": "Could not read play stats.",
    "stats.unreachable": "Couldn't reach the library server to read play stats.",
    "stats.written": {
      one: "Created crate {name} with {count} track.",
      other: "Created crate {name} with {count} tracks."
    },
    "tags.apply": "Apply",
    "tags.applyMappings": "Apply saved mappings",
    "tags.artist": "Artist",
    "tags.checking": "Reading tag spellings…",
    "tags.checkingTitles": "Reading titles…",
    "tags.field": "Field",
    "tags.genre": "Genre",
    "tags.introTitles": "Strips track numbers, URLs, and (Original Mix). Moves feat. into remixer when remixer is empty. Title-cases ALL CAPS or all lowercase. Writes the library, not the audio files. Quit Serato first.",
    "tags.group": "{name} — {spellings}, {tracks}",
    "tags.heading": "Tag spellings",
    "tags.intro": "Pick one spelling per group. Writes the library, not the audio files. Quit Serato first.",
    "tags.noChanges": "Every track in this group already uses that spelling.",
    "tags.preview": "Review",
    "tags.mappingSummary": {
      one: "{count} track still uses a saved spelling.",
      other: "{count} tracks still use a saved spelling."
    },
    "tags.mappingWritten": {
      one: "Wrote saved spellings on {count} track.",
      other: "Wrote saved spellings on {count} tracks."
    },
    "tags.previewLine": {
      one: "{from} → {to} ({count} track)",
      other: "{from} → {to} ({count} tracks)"
    },
    "tags.previewLineField": {
      one: "{field}: {from} → {to} ({count} track)",
      other: "{field}: {from} → {to} ({count} tracks)"
    },
    "tags.previewLineRemixer": {
      one: "{from} → {to}, remixer {remixer} ({count} track)",
      other: "{from} → {to}, remixer {remixer} ({count} tracks)"
    },
    "tags.previewSummary": {
      one: "{count} track would become {value}.",
      other: "{count} tracks would become {value}."
    },
    "tags.row": "{value} ({count})",
    "tags.spellingCount": {
      one: "{count} spelling",
      other: "{count} spellings"
    },
    "tags.suggested": "Suggested",
    "tags.summaryArtist": {
      one: "{values} artist spellings in this space. {count} group with more than one spelling.",
      other: "{values} artist spellings in this space. {count} groups with more than one spelling."
    },
    "tags.summaryArtistClear": "Every artist in this space uses one spelling.",
    "tags.summaryGenre": {
      one: "{values} genre spellings in this space. {count} group with more than one spelling.",
      other: "{values} genre spellings in this space. {count} groups with more than one spelling."
    },
    "tags.summaryGenreClear": "Every genre in this space uses one spelling.",
    "tags.summaryTitles": {
      one: "{count} title in this space would change.",
      other: "{count} titles in this space would change."
    },
    "tags.summaryTitlesClear": "Every title in this space already matches the cleanup rules.",
    "tags.titles": "Titles",
    "tags.titlesPreviewSummary": {
      one: "{count} title would change.",
      other: "{count} titles would change."
    },
    "tags.titlesWritten": {
      one: "Wrote the cleaned title on {count} track.",
      other: "Wrote the cleaned titles on {count} tracks."
    },
    "tags.trackCount": {
      one: "{count} track",
      other: "{count} tracks"
    },
    "tags.unreachable": "Couldn't reach the library server. Check it's running, then press Check again.",
    "tags.unreadable": "The tag groups could not be read.",
    "tags.written": {
      one: "Wrote {value} on {count} track.",
      other: "Wrote {value} on {count} tracks."
    },
    "tooltip.allTracks": "Show every track in this space. Ctrl/Cmd+1.",
    "tooltip.backupDrives": "Copy each connected drive's Serato folder into the backup on this computer. An unplugged drive is listed and left untouched.",
    "tooltip.beatgridLock": "Lock the beatgrid so Serato does not move it.",
    "tooltip.bitrateConfirm": "Create the Suspect quality crate. Serato has to be quit.",
    "tooltip.bitrateRefresh": "Run the bitrate check again on the selected crate.",
    "tooltip.bitrateSave": "Preview a Suspect quality crate of the flagged tracks. Nothing is written until you confirm. Quit Serato first.",
    "tooltip.chooseRelated": "Choose {name} as the track to link.",
    "tooltip.collapseCrate": "Hide the crates nested under {name}.",
    "tooltip.colorway": "Choose the theme. The app icon can follow this choice.",
    "tooltip.columnMenu": "Show or hide columns.",
    "tooltip.columnResize": "Drag to resize this column.",
    "tooltip.consentAccept": "Share anonymous stats and crash reports.",
    "tooltip.consentDecline": "Don't share anonymous stats.",
    "tooltip.copyLogs": "Copy the log text.",
    "tooltip.copyVersion": "Copy the app version.",
    "tooltip.crateColor": "Set the color of the selected crate.",
    "tooltip.crateDelete": "Delete the selected crate. The tracks stay in the library.",
    "tooltip.crateNew": "Create a new crate.",
    "tooltip.crateFolderSync": "Add library tracks whose files sit in a folder to this crate. Files that are not in the library stay skipped.",
    "tooltip.crateRenameFromTags": "Rename this crate's files to Artist - Title and keep crate paths.",
    "tooltip.cratePreset": "Make a crate from a preset: tracks that mix with a key, a BPM range, or tracks not played lately.",
    "tooltip.folderSyncCancel": "Close without changing the crate.",
    "tooltip.folderSyncFull": "Also remove tracks whose files are not in this folder.",
    "tooltip.folderSyncPath": "Folder on this computer whose files should match this crate.",
    "tooltip.folderSyncRun": "Update this crate to match the folder. Serato DJ Pro must be quit.",
    "tooltip.folderSyncSubcrates": "Put files in this folder into the crate, and make a subcrate for each subfolder.",
    "tooltip.crateRefresh": "Pick the tracks for this preset crate again from its preset.",
    "tooltip.crateRename": "Rename the selected crate.",
    "tooltip.crateSaveView": "Save the tracks in this list as a new crate. Serato DJ Pro must be quit.",
    "tooltip.crateSearch": "Find a crate by name. Esc clears the search.",
    "tooltip.crateSplit": "Show two crates at once. Alt-click or Shift-click fills the other list.",
    "tooltip.cratesReplaceCancel": "Close without changing crates.",
    "tooltip.cratesReplaceConfirm": "Put the replacement in those crates.",
    "tooltip.cratesReplaceKeep": "Keep both tracks in those crates. The replacement sits at the same position.",
    "tooltip.cratesReplaceRetire": "Remove this track from those crates after the replacement is added.",
    "tooltip.cratesReplaceSearch": "Find the track that should go in those crates.",
    "tooltip.cue": "Move the playhead to {label}.",
    "tooltip.editField": "Edit {label}. Nothing is saved until you save the track.",
    "tooltip.expandCrate": "Show the crates nested under {name}.",
    "tooltip.exportM3u": "Download this list as a playlist file.",
    "tooltip.exportRekordbox": "Download a playlist file Rekordbox can open. You confirm before it downloads.",
    "tooltip.fileShortcut": "{name} is a shortcut. It cannot be opened from here.",
    "tooltip.filesCancel": "Cancel. Nothing is changed. Esc.",
    "tooltip.filesConfirm": "Save this file change.",
    "tooltip.filesDelete": "Move the selected files to the Trash.",
    "tooltip.filesElsewhere": "Browse a folder that is not one of the music folders.",
    "tooltip.filesList": "Folder list. Up arrow and Down arrow move between rows. Enter opens the row.",
    "tooltip.filesMove": "Move the selected files to another folder.",
    "tooltip.filesMoveFolder": "Move this folder.",
    "tooltip.filesMoveHere": "Move the files into this folder.",
    "tooltip.filesMoveTrash": "Move the selected files to the Trash. You can restore them from there.",
    "tooltip.filesMusicFolders": "Go back to the music folders.",
    "tooltip.filesName": "Type the new file name.",
    "tooltip.filesPickCancel": "Cancel choosing a folder.",
    "tooltip.filesRefresh": "Refresh this folder from disk.",
    "tooltip.filesRename": "Rename the selected file.",
    "tooltip.filesRenameFromTags": "Rename the selected files to Artist - Title and keep crate paths.",
    "tooltip.filesReplace": "Upgrade the selected file and keep its cue points.",
    "tooltip.filesReplacement": "Type the path of the replacement file.",
    "tooltip.filesReview": "Review this change before it is saved.",
    "tooltip.filesSearch": "Search file names. Ctrl/Cmd+F or /. Esc clears the search.",
    "tooltip.filesUp": "Go up to the parent folder.",
    "tooltip.findRelated": "Find a track to link by title or artist.",
    "tooltip.gigBack": "Go back one step.",
    "tooltip.gigExit": "Leave the gig check and show crates.",
    "tooltip.gigNext": "Go to the next step.",
    "tooltip.gigRefresh": "Run the gig check again.",
    "tooltip.gigShowAll": "Show every item in this list.",
    "tooltip.gridCell": "Select this row.",
    "tooltip.gridPagination": "Show the next or previous hundred tracks.",
    "tooltip.healthArtCancel": "Close the album art dialog without writing. Esc.",
    "tooltip.healthArtEmbed": "Write the selected cover into the audio file. Cue points stay. Quit Serato first.",
    "tooltip.healthArtPick": "Choose this Cover Art Archive image to embed.",
    "tooltip.healthFindArt": "Look up a cover on Cover Art Archive and preview it before embedding.",
    "tooltip.healthOpenBitrate": "Open the bitrate check for this crate.",
    "tooltip.healthOpenDuplicates": "Open the Duplicates view.",
    "tooltip.healthOpenFiles": "Open the Files view.",
    "tooltip.healthOpenMissing": "Open the Missing files view.",
    "tooltip.healthRefresh": "Run the library health report again. Read-only.",
    "tooltip.healthTrack": "Open this track in Crates.",
    "tooltip.help": "Open Help. Report a bug or request a feature on GitHub. The app does not post it.",
    "tooltip.helpBug": "Describe a bug. GitHub opens so you can review it.",
    "tooltip.helpClose": "Close Help. Esc.",
    "tooltip.helpCopyLog": "Copy the log with your home folder replaced by ~.",
    "tooltip.helpExpected": "What you expected to happen.",
    "tooltip.helpFeature": "Describe a feature. GitHub opens so you can review it.",
    "tooltip.helpGithub": "Open the project on GitHub.",
    "tooltip.helpHappened": "What happened, or what should change.",
    "tooltip.helpNames": "Keep track and crate names in the copied log. Off leaves them out.",
    "tooltip.helpOpen": "Open the prefilled GitHub issue. You submit it there.",
    "tooltip.helpReleases": "Open the release notes on GitHub.",
    "tooltip.helpReport": "The report text, when it could not be copied.",
    "tooltip.hideSearchCopies": "Hide the fields that were compared.",
    "tooltip.hotLoops": "Copy loops onto a free hot-cue pad in the Rekordbox file.",
    "tooltip.iconFollowsTheme": "Match the Dock icon on Mac, or the window and taskbar icon on Windows, to the theme. On by default. The Finder icon and the Windows program icon stay the same.",
    "tooltip.importFile": "Choose a playlist file to import.",
    "tooltip.importM3u": "Add tracks from a playlist file into a new crate.",
    "tooltip.keepCopy": "Keep this copy: {name}. The others leave the library.",
    "tooltip.language": "Choose the language for this window. Same as the system follows this computer.",
    "tooltip.libraryGeneration": "Opens the note that says whether the session log or the installed Serato decided this is Serato 4, Serato 5, or an unknown version.",
    "tooltip.linkMutual": "Also link that track back to this one.",
    "tooltip.linkNote": "Add a note for this link.",
    "tooltip.linkRating": "Rate this link from 1 to 5.",
    "tooltip.logFallback": "Log text, when it could not be copied.",
    "tooltip.membership": "Add this track to {name}, or take it out.",
    "tooltip.memoryCues": "Include memory cues in the Rekordbox file.",
    "tooltip.mergeCancel": "Cancel. Nothing is merged. Esc.",
    "tooltip.mergeConfirm": "Merge the copies into the one you keep.",
    "tooltip.mergeConfirmTrash": "Merge the copies and move the other audio files to the Trash.",
    "tooltip.mergeDuplicates": "Merge the selected copies into the one you keep.",
    "tooltip.relink": "Find files that moved and point missing tracks at them.",
    "tooltip.relinkAcceptHigh": "Tick every match whose confidence is high.",
    "tooltip.relinkCancel": "Cancel. Nothing is written. Esc.",
    "tooltip.relinkConfirm": "Point the ticked tracks at the chosen files. Audio is not moved.",
    "tooltip.relinkFind": "Search the music folders, and the extra folder if you pasted one.",
    "tooltip.relinkInclude": "Include this track in the relink.",
    "tooltip.relinkPick": "Choose which file this missing track should use.",
    "tooltip.relinkRoot": "Extra folder to search after a drive swap. Leave blank to use the music folders.",
    "tooltip.mergeTrash": "Move the other audio files to the Trash. You can restore them from there.",
    "tooltip.merging": "Merging the copies.",
    "tooltip.missingDrive": "Connect the drive that holds {name} before opening it.",
    "tooltip.navGig": "Ready score, portable drive check, and tempo drift.",
    "tooltip.navHealth": "Overview, missing files, duplicates, stems, damaged files, suspect quality, and tag spellings.",
    "tooltip.navLibrary": "Crates, history, and play stats.",
    "tooltip.next": "Play the next track in this list.",
    "tooltip.openCopy": "Open this other copy, {name}.",
    "tooltip.openCrate": "Show the tracks in the crate {name}.",
    "tooltip.openCrumb": "Open the folder {name}.",
    "tooltip.openFile": "Open the folder {name}. Enter opens the highlighted row.",
    "tooltip.openInLibrary": "Open this history row in the library.",
    "tooltip.openLogs": "Open the folder that holds the log.",
    "tooltip.openRelated": "Open the linked track {name}.",
    "tooltip.openReplaceCopy": "Use {name} in the crates this track is in.",
    "tooltip.operationsList": "Operation log. Each row is one checked edit or restore.",
    "tooltip.operationsRefresh": "Refresh the operation log.",
    "tooltip.operationsRetry": "Try reading the operation log again.",
    "tooltip.overview": "Overview of the whole track. Click or drag to seek. Left arrow goes back 5 seconds. Right arrow goes forward 5 seconds.",
    "tooltip.playColumn": "Play or pause this row.",
    "tooltip.playRow": "Start {name}. Space plays or pauses.",
    "tooltip.portableCheck": "Check {name}. Read its crates and list what to fix before the gig. Nothing is written.",
    "tooltip.portableClose": "Close the portable drive report.",
    "tooltip.portableDrive": "Choose a connected drive that has a _Serato_ folder. An unplugged drive is named below and is not treated as a missing file.",
    "tooltip.portableRun": "Check the selected drive. Read its crates and list what to fix before the gig. Nothing is written.",
    "tooltip.prepareAdd": "Send this track to Prepare.",
    "tooltip.prepareRemove": "Take this track out of Prepare.",
    "tooltip.presetBpm": "The tempo in the middle of the range.",
    "tooltip.presetCancel": "Close without making a crate.",
    "tooltip.presetCreate": "Save the matching tracks as a new crate.",
    "tooltip.presetKey": "The key to mix from. Tracks one step either way on the Camelot wheel, and the relative key, are included.",
    "tooltip.presetKind": "Choose which tracks the crate collects.",
    "tooltip.presetMonths": "Tracks with no play in this many months, including tracks never played.",
    "tooltip.presetName": "The crate name. ⟳ is added at the end.",
    "tooltip.presetRange": "How far above or below that tempo a track can be.",
    "tooltip.presetScope": "Look only at tracks in the selected crate and the crates inside it.",
    "tooltip.previous": "Play the previous track in this list.",
    "tooltip.quickOpen": "Find a track or a file by name. Ctrl/Cmd+K. Esc closes this box.",
    "tooltip.quickOpenClose": "Close find. Esc.",
    "tooltip.quickOpenHit": "Open {kind} {title}. Enter.",
    "tooltip.quickOpenHitDetail": "Open {kind} {title}. {detail}. Enter.",
    "tooltip.quickOpenRetry": "Search files again.",
    "tooltip.rekordboxCancel": "Cancel. The file is not downloaded. Esc.",
    "tooltip.rekordboxDownload": "Download the Rekordbox file.",
    "tooltip.rekordboxKey": "Choose how keys are written in the Rekordbox file.",
    "tooltip.reload": "Reload the library from Serato.",
    "tooltip.relocate": "Point this track at a different audio file.",
    "tooltip.removeRelated": "Remove the saved link to {name}. The audio file stays on disk.",
    "tooltip.removeTrack": "Remove this track from the library. The audio file stays on disk.",
    "tooltip.rerunWizard": "Run setup again.",
    "tooltip.reveal": "Show this file in {name}. The library is not changed.",
    "tooltip.reviewRestore": "Review what restoring this snapshot would change.",
    "tooltip.runSetup": "Run setup to find music folders.",
    "tooltip.saveLink": "Save this link.",
    "tooltip.saveRules": "Save these smart crate rules.",
    "tooltip.saveSuggestion": "Save a two-way link to {name}. Serato is not changed until you update the crate.",
    "tooltip.saveTrack": "Save these track details.",
    "tooltip.scanFull": "Decode every file in the selected crate. Choose a crate first. This can take minutes. Nothing is written.",
    "tooltip.scanQuick": "Read the start of each audio file. Empty files and the wrong format show up here. Nothing is written.",
    "tooltip.search": "Search tracks by title or artist. Use the field menu to search comments, grouping, or composer. Filter with bpm:120-128, bpm:124~3, bpm:none, key:8A, key:none, mix:8A, missing:yes, nokeybpm:yes, cues:none, comments:, grouping:, or composer:. Ctrl/Cmd+F or /. Esc clears the search.",
    "tooltip.searchField": "Search one field. All fields is title, artist, album, genre, key, and file. Comments, grouping, and composer need this menu or comments:, grouping:, composer:.",
    "tooltip.seek": "Move through the track. Left arrow goes back 5 seconds. Right arrow goes forward 5 seconds. Shift with an arrow jumps 30 seconds.",
    "tooltip.selectFile": "Select {name} for rename, move, or delete.",
    "tooltip.selectFilePath": "Select {name} at {path} for rename, move, or delete.",
    "tooltip.selectRow": "Select {name}. Enter opens this row.",
    "tooltip.session": "Show the tracks played in the session {name}.",
    "tooltip.settings": "Open settings.",
    "tooltip.settingsClose": "Close settings. Esc.",
    "tooltip.shortcuts": "Keyboard shortcuts for this screen. ? opens this list.",
    "tooltip.shortcutsClose": "Close the shortcut list. Esc.",
    "tooltip.showSearchCopies": "Show the fields that were compared.",
    "tooltip.smartRules": "Edit the smart crate rules. Nothing is saved until you press Save rules.",
    "tooltip.snapshotCancel": "Cancel. Nothing is restored. Esc.",
    "tooltip.snapshotConfirm": "Restore this snapshot. A new snapshot is saved first.",
    "tooltip.snapshotsList": "Snapshot list. Up arrow and Down arrow move between rows. Enter reviews the snapshot.",
    "tooltip.snapshotsRefresh": "Refresh the snapshot list.",
    "tooltip.snapshotsRetry": "Try reading the snapshots again.",
    "tooltip.snapshotsTake": "Save a backup of the library.",
    "tooltip.snapshotsUndo": "Review undoing the last outside change.",
    "tooltip.sortAdded": "Sort crates by the date they were added.",
    "tooltip.sortArtist": "Sort tracks by artist.",
    "tooltip.sortBpm": "Sort tracks by tempo.",
    "tooltip.sortBy": "Sort by {label}.",
    "tooltip.sortCrateName": "Sort crates by name.",
    "tooltip.sortDateAdded": "Sort tracks by the date they were added.",
    "tooltip.sortDeck": "Sort history by deck.",
    "tooltip.sortEnergy": "Sort tracks by energy (the star rating as 1 to 5).",
    "tooltip.sortGenre": "Sort tracks by genre.",
    "tooltip.sortKey": "Sort tracks by key.",
    "tooltip.sortLastPlayed": "Sort tracks by the last time they were played.",
    "tooltip.sortLength": "Sort tracks by length.",
    "tooltip.sortOrder": "Sort crates in the saved order.",
    "tooltip.sortPlayed": "Sort history by whether the track was played.",
    "tooltip.sortPlays": "Sort tracks by play count.",
    "tooltip.sortStart": "Sort history by the time it started.",
    "tooltip.sortTitle": "Sort tracks by title.",
    "tooltip.space": "Choose Library, Video, Apple Music, or Prepare.",
    "tooltip.splitter": "Drag to resize the track list. Double-click to put it back. Arrow keys resize it.",
    "tooltip.statsCsv": "Download this report as a spreadsheet. Read-only.",
    "tooltip.statsFrom": "First day of a custom period.",
    "tooltip.statsIdleCrate": "Preview a crate of tracks not played in this many days, then confirm. Serato must be quit.",
    "tooltip.statsIdleDays": "A track not played for this many days is listed. Default 365.",
    "tooltip.statsPeriod": "Limit most-played counts to this period. Idle tracks use Idle days, not this period.",
    "tooltip.statsRefresh": "Load play stats for this period.",
    "tooltip.statsTo": "Last day of a custom period.",
    "tooltip.tagsApply": "Write this spelling on every track in the group. Quit Serato first. Audio files stay as they are.",
    "tooltip.tagsApplyMappings": "Write saved genre and artist spellings on tracks that still use another form. Quit Serato first. Audio files stay as they are.",
    "tooltip.tagsApplyTitles": "Write the cleaned titles. Quit Serato first. Audio files stay as they are.",
    "tooltip.tagsArtist": "Show artist names that are the same words written different ways.",
    "tooltip.tagsGenre": "Show genres that are the same words written different ways.",
    "tooltip.tagsTitles": "Show titles that would change after stripping numbers, URLs, Original Mix, and feat., and title-casing ALL CAPS or all lowercase.",
    "tooltip.tagsGroup": "Open or close this spelling group.",
    "tooltip.tagsPreview": "Show which tracks would change before writing the library.",
    "tooltip.tagsRefresh": "Load the spelling groups again.",
    "tooltip.tagsSpelling": "Choose this spelling for every track in the group.",
    "tooltip.telemetry": "Turn anonymous stats and crash reports on or off.",
    "tooltip.trackColor": "Choose a color for this track.",
    "tooltip.trackList": "Track list. Up arrow and Down arrow move between rows. Enter opens the row. Space plays or pauses.",
    "tooltip.trackRating": "Choose a rating for this track.",
    "tooltip.transport": "{action}. Space plays or pauses.",
    "tooltip.transportNamed": "{action} {name}. Space plays or pauses.",
    "tooltip.updateDismiss": "Hide this until the app opens again.",
    "tooltip.updateDownload": "Open this release's page on GitHub in your browser.",
    "tooltip.updatePrereleases": "Also tell you about beta versions and release candidates.",
    "tooltip.updateRelated": "Create or refresh the Related crate in Serato. Serato has to be quit.",
    "tooltip.updateSkip": "Don't tell you about this version again.",
    "tooltip.updateToggle": "Ask GitHub once a day whether a newer version is out.",
    "tooltip.useInCrates": "Put another track in every crate this one is in, at the same position.",
    "tooltip.viewBitrate": "Flag files whose stated bitrate is much higher than the spectrum, or lossless files made from a lossy encode. Needs a crate. Saving a crate writes the library.",
    "tooltip.viewCrates": "Show crates. Ctrl/Cmd+2.",
    "tooltip.viewDrift": "Flag tracks whose tempo wanders, or that look like live recordings. Needs a crate. Read-only.",
    "tooltip.drawerToggle": "Hide or show the navigation drawer.",
    "tooltip.driftRefresh": "Run the tempo check again on the selected crate.",
    "tooltip.viewDuplicates": "Show tracks that look like copies of each other.",
    "tooltip.viewFiles": "Show files on disk. Ctrl/Cmd+3.",
    "tooltip.viewGig": "Check the library before a gig. Read-only.",
    "tooltip.viewHealth": "One-page counts of missing files, missing BPM or key, empty genre, tracks in no crate, and duplicates. Read-only.",
    "tooltip.viewHistory": "Show history. Ctrl/Cmd+4.",
    "tooltip.viewMissing": "Show tracks whose files are missing on a connected drive. Tracks on an unplugged drive stay in crates as offline.",
    "tooltip.viewPortable": "Check a portable Serato drive before a gig. Pick a connected drive. Read-only.",
    "tooltip.viewScan": "Find audio files that are empty, the wrong format, or will not decode. Read-only.",
    "tooltip.viewSnapshots": "Open backups. Hash-checked copies of the library, crates, and cue frames. Ctrl/Cmd+5.",
    "tooltip.viewStats": "Most played tracks and artists in a period, idle tracks, and a CSV of the report.",
    "tooltip.viewStems": "Show tracks Serato has analyzed for stems. This does not separate the audio.",
    "tooltip.viewTags": "Group genre and artist spellings that mean the same thing. Writes the library, not the audio files.",
    "tooltip.volume": "Change how loud playback is.",
    "tooltip.wizard.checkAgain": "Look for the Serato library again.",
    "tooltip.wizard.continue": "Continue to the next step.",
    "tooltip.wizard.getStarted": "Start setup.",
    "tooltip.wizard.looking": "Looking for the Serato library.",
    "tooltip.wizard.none": "Continue setup.",
    "tooltip.wizard.openLibrary": "Finish setup and open the library.",
    "tooltip.wizard.saving": "Saving a safety copy of the library.",
    "tooltip.wizard.takeSnapshot": "Save a safety copy of the library.",
    "tooltip.wizard.tryAgain": "Try saving the safety copy again.",
    "tooltip.wizard.useLibrary": "Use the library that was found.",
    "tooltip.wizardBack": "Go back one setup step.",
    "tooltip.wizardCancel": "Cancel setup. The library is not changed. Esc.",
    "tooltip.wizardFolder": "Open the folder {name}.",
    "tooltip.wizardFolderClose": "Close the folder list. Esc.",
    "tooltip.wizardFolderUp": "Go up to the parent folder.",
    "tooltip.wizardFolderUse": "Use this folder as the library.",
    "tooltip.wizardNo": "Don't share anonymous stats.",
    "tooltip.wizardSecondary": "Choose a folder that already has a Serato library.",
    "tooltip.wizardUpdatesNo": "Don't check GitHub for new versions.",
    "tooltip.wizardUpdatesYes": "Check GitHub once a day for a new version.",
    "tooltip.wizardYes": "Share anonymous stats and crash reports.",
    "tooltip.zoomIn": "Show a shorter stretch of the waveform around the playhead.",
    "tooltip.zoomOut": "Show a longer stretch of the waveform around the playhead.",
    "track.missingBadge": "missing",
    "track.offlineBadge": "offline",
    "track.numbered": "Track {id}",
    "track.stemsBadge": "stems",
    "track.untitled": "Untitled",
    "update.available": "Version {version} is out. You have {current}.",
    "update.availableTest": "Test version {version} is out. You have {current}.",
    "update.dismiss": "Not now",
    "update.download": "Download",
    "update.label": "Update available",
    "update.openFailed": "The release page could not be opened. It is on GitHub under Releases.",
    "update.skip": "Skip this version",
    "version.app": "App version",
    "version.copied": "Copied",
    "version.copyFailed": "Couldn't copy the version.",
    "version.unavailable": "Version unavailable",
    "view.bitrate": "Suspect quality",
    "view.crates": "Crates",
    "view.drift": "Tempo drift",
    "view.duplicates": "Duplicates",
    "view.files": "Organize files",
    "view.gig": "Ready",
    "view.group.gig": "Gig",
    "view.group.health": "Health",
    "view.group.library": "Music",
    "view.health": "Overview",
    "view.history": "History",
    "view.label": "Views",
    "view.missing": "Missing files",
    "view.portable": "Check drive",
    "view.scan": "Damaged files",
    "view.snapshots": "Backups",
    "view.stats": "Play stats",
    "view.stems": "Stems",
    "view.tags": "Tag spellings",
    "wizard.action.checkAgain": "Check again",
    "wizard.action.continue": "Continue",
    "wizard.action.getStarted": "Get started",
    "wizard.action.looking": "Looking…",
    "wizard.action.openLibrary": "Open my library",
    "wizard.action.takeSnapshot": "Take a safety snapshot",
    "wizard.action.tryAgain": "Try again",
    "wizard.action.useLibrary": "Use this library",
    "wizard.announce": "Step {index} of {count}. {name}.",
    "wizard.blocked": "Close Serato DJ to continue.",
    "wizard.chooseCheckAgain": "Choose Check again.",
    "wizard.chooseFolder": "Choose a folder",
    "wizard.closeFolders": "Close folder list",
    "wizard.consentFailed": "Couldn't save that choice. Try again.",
    "wizard.copySaved": "Safety copy saved.",
    "wizard.done": "Library ready. Snapshot saved.",
    "wizard.finishFailed": "Couldn't save that you finished setup. Try again.",
    "wizard.folders": "Folders",
    "wizard.genericError": "Something went wrong. Try again.",
    "wizard.heading.consent": "Share anonymous usage stats and crash reports?",
    "wizard.heading.library": "Find your library",
    "wizard.heading.snapshot": "Safety snapshot",
    "wizard.heading.updates": "Check for new versions?",
    "wizard.heading.welcome": "See your Serato library",
    "wizard.lookFailed": "Couldn't look for your library.",
    "wizard.looking": "Looking for your Serato library.",
    "wizard.no": "No, don't share",
    "wizard.noSubfolders": "This folder has no folders inside it.",
    "wizard.opening": "Opening…",
    "wizard.progressLabel": "Saving a safety copy",
    "wizard.saving": "Saving…",
    "wizard.savingCopy": "Saving a safety copy…",
    "wizard.savingLibraryCopy": "Saving a safety copy of your library.",
    "wizard.snapshotBody": "A backup of your library data is saved before anything is changed.",
    "wizard.snapshotFailed": "The safety copy could not be saved. Your library was not changed. Try again.",
    "wizard.step.consent": "Sharing",
    "wizard.step.done": "Done",
    "wizard.step.library": "Find your library",
    "wizard.step.snapshot": "Safety snapshot",
    "wizard.step.updates": "Updates",
    "wizard.step.welcome": "Welcome",
    "wizard.stepOf": "Step {index} of {count}",
    "wizard.updatesBody": "Once a day, the app can ask GitHub whether a newer version is out. GitHub sees your IP address and this app's version. Nothing about your library is sent. Checking stays off unless you turn it on, and you can change it in Settings.",
    "wizard.updatesFailed": "The choice could not be saved. Try again.",
    "wizard.updatesNo": "No, don't check",
    "wizard.updatesYes": "Yes, check",
    "wizard.useFolder": "Use this folder",
    "wizard.welcomeBody": "This app shows the library Serato already keeps on this computer. It will not change anything without asking.",
    "wizard.yes": "Yes, share",
    "files.toolbar": "Folder toolbar",
    "files.actionsLabel": "File actions",
    "crates.promptName": "Name",
    "tooltip.cratePromptCancel": "Close without changing the crate.",
    "tooltip.cratePromptConfirm": "Save this crate name. Serato DJ Pro must be quit.",
    "tooltip.cratePromptName": "Type the crate name, or a color name."
  };

  // locales/es.json
  var es_default = {
    "bitrate.checking": "Comprobando la tasa de bits…",
    "bitrate.confirmCrate": "Confirmar caja",
    "bitrate.detail": " · {stated} kbps en el archivo, unos {estimated} kbps según el espectro",
    "bitrate.detailEstimate": " · unos {estimated} kbps según el espectro",
    "bitrate.empty": "Ningún archivo de 320 falso ni procedente de un códec con pérdida en esta caja.",
    "bitrate.heading": "Calidad dudosa",
    "bitrate.intro": "Necesita una caja porque decodifica el audio. Marca un archivo cuya tasa de bits declarada es mucho más alta que la del espectro, o un archivo sin pérdida hecho a partir de uno con pérdida. Es una sospecha, no una prueba. Cierra Serato antes de guardar una caja.",
    "bitrate.notFound": {
      one: "Se omitió {count} pista no encontrada. Mira Archivos no encontrados.",
      other: "Se omitieron {count} pistas no encontradas. Mira Archivos no encontrados."
    },
    "bitrate.preview": {
      one: "{count} pista iría a {name}. Confirma para escribir. Cierra Serato primero.",
      other: "{count} pistas irían a {name}. Confirma para escribir. Cierra Serato primero."
    },
    "bitrate.previewEmpty": "No hay pistas marcadas para guardar.",
    "bitrate.reason.lossy_source": "El archivo sin pérdida parece venir de un códec con pérdida",
    "bitrate.reason.unknown": "Calidad dudosa",
    "bitrate.reason.upsampled": "La tasa de bits declarada es mucho más alta que la del espectro",
    "bitrate.row": "{title} ({file}) — {reason}{detail}",
    "bitrate.saveCrate": "Guardar caja",
    "bitrate.saving": "Guardando la caja…",
    "bitrate.summary": {
      one: "{checked} archivos comprobados. {count} archivo sospechoso.",
      other: "{checked} archivos comprobados. {count} archivos sospechosos."
    },
    "bitrate.summaryClear": "{checked} archivos comprobados. Ninguno parece un 320 falso ni un archivo sin pérdida de origen con pérdida.",
    "bitrate.tooQuiet": {
      one: "{count} archivo era demasiado silencioso o corto para medirlo.",
      other: "{count} archivos eran demasiado silenciosos o cortos para medirlos."
    },
    "bitrate.unchecked": {
      one: "{count} archivo tiene una extensión que esta comprobación no conoce.",
      other: "{count} archivos tienen una extensión que esta comprobación no conoce."
    },
    "bitrate.unreadable": "No se pudo leer la comprobación de tasa de bits.",
    "bitrate.unreadableFiles": {
      one: "No se pudo leer {count} archivo.",
      other: "No se pudieron leer {count} archivos."
    },
    "bitrate.unreachable": "No se pudo alcanzar el servidor de la biblioteca. Comprueba que está en marcha y pulsa Volver a comprobar",
    "bitrate.written": {
      one: "Se guardó la caja {name} con {count} pista.",
      other: "Se guardó la caja {name} con {count} pistas."
    },
    "color.blue": "Azul",
    "color.custom": "Personalizado",
    "color.green": "Verde",
    "color.none": "Ninguno",
    "color.orange": "Naranja",
    "color.pink": "Rosa",
    "color.purple": "Morado",
    "color.red": "Rojo",
    "color.yellow": "Amarillo",
    "column.added": "Añadida",
    "column.artist": "Artista",
    "column.bpm": "BPM",
    "column.deck": "Deck",
    "column.energy": "Energía",
    "column.genre": "Género",
    "column.key": "Tono",
    "column.lastPlayed": "Última",
    "column.play": "Reproducir",
    "column.played": "Reproducida",
    "column.plays": "Veces",
    "column.time": "Tiempo",
    "column.title": "Título",
    "common.back": "Atrás",
    "common.cancel": "Cancelar",
    "common.close": "Cerrar",
    "common.confirm": "Confirmar",
    "common.delete": "Eliminar",
    "common.no": "No",
    "common.off": "Desactivado",
    "common.on": "Activado",
    "common.refresh": "Actualizar",
    "common.reload": "Recargar",
    "common.remove": "Quitar",
    "common.save": "Guardar",
    "common.saved": "Guardado.",
    "common.tryAgain": "Reintentar",
    "common.up": "Subir",
    "common.yes": "Sí",
    "consent.accept": "Compartir",
    "consent.body": "Solo recuentos y acciones, más el nombre de la app, su versión y el sistema operativo. Los títulos de las pistas, los nombres de las cajas, las rutas de los archivos y el contenido de la biblioteca se quedan en este equipo. No se comparte nada a menos que lo actives.",
    "consent.decline": "No compartir",
    "copies.heading": "Otras copias",
    "copies.useInCrates": "Usar en las cajas",
    "count.plays": {
      one: "{count} reproducción",
      other: "{count} reproducciones"
    },
    "count.split": "{a} · {b}",
    "count.tracks": {
      one: "{count} pista",
      other: "{count} pistas"
    },
    "crates.allTracks": "Todas las pistas",
    "crates.collapse": "Contraer {name}",
    "crates.colorPrompt": "Color de la caja: {names}",
    "crates.colorSaved": "Color de la caja guardado.",
    "crates.colorUnknown": "Usa uno de los nombres de la paleta.",
    "crates.confirmDelete": "¿Eliminar «{name}» y las cajas que contiene? Las pistas se quedan en la biblioteca.",
    "crates.created": "Caja creada.",
    "crates.deleted": "Caja eliminada.",
    "crates.expand": "Expandir {name}",
    "crates.find": "Buscar una caja",
    "crates.heading": "Cajas",
    "crates.new": "Nueva",
    "crates.newPrompt": "Nombre de la nueva caja",
    "crates.paneA": "Caja izquierda",
    "crates.paneB": "Caja derecha",
    "crates.rename": "Renombrar",
    "crates.renamePrompt": "Renombrar caja",
    "crates.renamed": "Caja renombrada.",
    "crates.saveView": "Guardar vista",
    "crates.saveViewCreated": {
      one: "Se guardó {count} pista como caja.",
      other: "Se guardaron {count} pistas como caja."
    },
    "crates.saveViewEmpty": "Esta lista no tiene pistas para guardar.",
    "crates.saveViewPrompt": "Nombre de la caja",
    "crates.selectedCrate": "Caja seleccionada",
    "crates.smartBadge": "inteligente",
    "crates.smartList": "Cajas inteligentes: {names}",
    "crates.sort": "Ordenar cajas",
    "crates.sort.added": "Añadidas",
    "crates.sort.name": "Nombre",
    "crates.sort.order": "Orden",
    "crates.split": "Dividir",
    "cratesReplace.addToCrates": "Añadir la pista de reemplazo a {crates}.",
    "cratesReplace.alreadyInCrates": "La pista de reemplazo ya está en esas cajas. Se queda donde está.",
    "cratesReplace.confirm": "Actualizar cajas",
    "cratesReplace.intro": "Pon otra pista en cada caja donde está esta, en la misma posición. Las dos pueden quedarse. Las cajas inteligentes no se tocan.",
    "cratesReplace.keepBoth": "Dejar las dos pistas en esas cajas",
    "cratesReplace.noCrates": "Esta pista no está en ninguna caja normal.",
    "cratesReplace.noReplacement": "Elige la pista que debe entrar en esas cajas.",
    "cratesReplace.nothingToDo": "Nada que cambiar en las cajas.",
    "cratesReplace.placed": {
      one: "Se añadió {name} a {count} caja.",
      other: "Se añadió {name} a {count} cajas."
    },
    "cratesReplace.previewFailed": "No se pudo leer la vista previa.",
    "cratesReplace.quitSerato": "Cierra Serato antes de actualizar las cajas. La vista previa muestra el plan.",
    "cratesReplace.readingPreview": "Leyendo la vista previa…",
    "cratesReplace.removeFromCrates": "Quitar la pista original de {crates}.",
    "cratesReplace.retire": "Luego quitar esta pista de esas cajas",
    "cratesReplace.retired": "Se quitó {name} de esas cajas.",
    "cratesReplace.search": "Pista de reemplazo",
    "cratesReplace.title": "Usar en las cajas",
    "cratesReplace.updated": "Se actualizaron las cajas.",
    "cratesReplace.updating": "Actualizando…",
    "detail.bpmNumber": "El BPM debe ser un número.",
    "detail.confirmRemove": "¿Quitar esta pista de la biblioteca? El archivo de audio se queda en el disco.",
    "detail.empty": "Selecciona una pista para ver sus atributos.",
    "detail.hideSearchCopies": "Ocultar copias de búsqueda",
    "detail.readFailed": "No se pudo leer la pista ({status})",
    "detail.reading": "Leyendo atributos",
    "detail.relocate": "Reubicar",
    "detail.relocatePrompt": "Ruta del archivo de audio",
    "detail.relocated": "Ubicación del archivo guardada.",
    "detail.removeFromLibrary": "Quitar de la biblioteca",
    "detail.removePrepare": "Quitar de Prepare",
    "detail.removed": "Quitada de la biblioteca.",
    "detail.removedPrepare": "Quitada de Prepare.",
    "detail.reveal": "Mostrar en {manager}",
    "detail.saveTrack": "Guardar pista",
    "detail.searchCopies": {
      one: "Copias de búsqueda, {count} campo",
      other: "Copias de búsqueda, {count} campos"
    },
    "detail.sendPrepare": "Enviar a Prepare",
    "detail.sentPrepare": "Enviada a Prepare.",
    "detail.useInCrates": "Usar esta copia en las cajas",
    "drift.bpmRange": " ({min}–{max} BPM)",
    "drift.checking": "Comprobando el tempo…",
    "drift.empty": "Ninguna pista con tempo inestable o aspecto en vivo en esta caja.",
    "drift.heading": "Tempo inestable",
    "drift.intro": "Necesita una caja porque decodifica el audio. Marca un tempo que se mueve, un nombre que parece en vivo o la marca de mapa de tempo pendiente de Serato. Se omite una parrilla que ya cambia de tempo. No reescribe el BPM.",
    "drift.mapped": {
      one: "{count} pista ya tiene una parrilla flexible.",
      other: "{count} pistas ya tienen una parrilla flexible."
    },
    "drift.notFound": {
      one: "Se omitió {count} pista no encontrada. Mira Archivos no encontrados.",
      other: "Se omitieron {count} pistas no encontradas. Mira Archivos no encontrados."
    },
    "drift.reason.drifting": "El tempo se mueve",
    "drift.reason.live": "Parece una grabación en vivo",
    "drift.reason.pending_map": "Serato marcó un mapa de tempo pendiente",
    "drift.reason.unknown": "Necesita una parrilla flexible",
    "drift.row": "{title} ({file}) — {reasons}{bpm}",
    "drift.summary": {
      one: "{checked} archivos comprobados. {count} pista puede necesitar una parrilla flexible.",
      other: "{checked} archivos comprobados. {count} pistas pueden necesitar una parrilla flexible."
    },
    "drift.summaryClear": "{checked} archivos comprobados. Ninguna necesita una parrilla flexible.",
    "drift.tooQuiet": {
      one: "{count} archivo era demasiado silencioso o corto para medirlo.",
      other: "{count} archivos eran demasiado silenciosos o cortos para medirlos."
    },
    "drift.unchecked": {
      one: "{count} archivo tiene una extensión que esta comprobación no conoce.",
      other: "{count} archivos tienen una extensión que esta comprobación no conoce."
    },
    "drift.unreadableFiles": {
      one: "No se pudo leer {count} archivo.",
      other: "No se pudieron leer {count} archivos."
    },
    "drift.unreachable": "No se pudo alcanzar el servidor de la biblioteca. Comprueba que está en marcha y pulsa Volver a comprobar",
    "drift.unreadable": "No se pudo leer la comprobación de tempo.",
    "duplicates.readFailed": "No se pudieron leer los duplicados.",
    "error.action_unavailable": "Esa acción no está disponible.",
    "error.artwork_already": "Este archivo ya tiene carátula.",
    "error.artwork_format": "Este formato de archivo no puede llevar carátula todavía.",
    "error.artwork_lookup": "No se pudo buscar la carátula.",
    "error.artwork_needs_confirm": "Confirma la carátula antes de guardarla.",
    "error.artwork_needs_release": "Elige una carátula antes de guardarla.",
    "error.artwork_no_cover": "No se encontró carátula para esta pista.",
    "error.artwork_no_search": "Esta pista no tiene título ni artista para buscar.",
    "error.artwork_not_image": "Esa imagen no es una carátula JPEG o PNG.",
    "error.artwork_write_failed": "No se pudo escribir la carátula.",
    "error.backup_no_space": "No hay espacio suficiente en el disco para copiar la biblioteca.",
    "error.backup_serato_running": "Cierra Serato DJ Pro antes de copiar las cajas de las unidades. Serato DJ sigue abierto, así que no se copió nada.",
    "error.bitrate_needs_crate": "Elige una caja para comprobar la tasa de bits.",
    "error.tempo_needs_crate": "Elige una caja para comprobar el tempo.",
    "error.body_not_json": "El cuerpo de la solicitud no es JSON.",
    "error.body_not_object": "El cuerpo de la solicitud no es un objeto.",
    "error.choose_copy": "Elige la copia que quieres conservar.",
    "error.choose_replace_from": "Elige la pista que quieres reemplazar.",
    "error.choose_replace_to": "Elige la pista que quieres poner en esas cajas.",
    "error.choose_folder": "Elige una carpeta.",
    "error.choose_genre_or_artist": "Elige género o artista.",
    "error.choose_spelling": "Elige una grafía.",
    "error.color_not_number": "El color debe ser un número.",
    "error.color_out_of_range": "El color está fuera de rango.",
    "error.consent_not_saved": "No se pudo guardar la elección sobre compartir datos.",
    "error.crate_name_separator": "Usa un nombre de caja sin el separador de nombres de Serato.",
    "error.crate_name_too_long": "Ese nombre de caja es demasiado largo.",
    "error.crate_not_in_space": "Esa caja no está en este espacio.",
    "error.crate_not_root": "Las pistas viven en una caja, no en la raíz del espacio.",
    "error.field_readonly": "Ese campo no se puede editar.",
    "error.file_already_this_track": "Ese archivo ya es esta pista.",
    "error.file_already_used": "Otra pista de la biblioteca ya usa ese archivo.",
    "error.file_not_on_disk": "Ese archivo no está en el disco.",
    "error.focus_failed": "No se pudo traer la ventana al frente.",
    "error.folder_not_library": "Esa carpeta no es la biblioteca de Serato de este equipo.",
    "error.folder_outside_roots": "Esa carpeta está fuera de las carpetas de música.",
    "error.folder_unreadable": "No se pudo leer esa carpeta.",
    "error.internal": "Algo salió mal. Los detalles están en el registro local.",
    "error.invalid_request": "Esa solicitud no es válida.",
    "error.language_not_saved": "No se pudo guardar el idioma.",
    "error.layout_not_saved": "No se pudo guardar la disposición.",
    "error.legacy_read_only": "Esta biblioteca la creó una versión anterior de Serato DJ. Esta app puede mostrarla, pero todavía no puede modificarla.",
    "error.length_invalid": "La duración debe ser un número entero de milisegundos.",
    "error.library_log_unconfirmed": "El registro de la sesión no confirma este archivo de biblioteca ({database}). Las escrituras y las restauraciones están desactivadas. Las instantáneas se pueden tomar y leer.",
    "error.library_not_saved": "No se pudo guardar la biblioteca.",
    "error.logs_not_opened": "No se pudo abrir la carpeta de registros.",
    "error.move_failed": "No se pudo mover el archivo. No se cambió nada.",
    "error.no_legacy_library": "No se encontró ninguna biblioteca antigua de Serato.",
    "error.no_library": "No se encontró ninguna biblioteca de Serato en este equipo.",
    "error.not_duplicate": "Esa pista no está en un grupo de duplicados.",
    "error.note_too_long": "La nota es demasiado larga.",
    "error.nothing_to_undo": "No hay ningún cambio externo que deshacer.",
    "error.path_unreadable": "No se pudo leer esa ruta.",
    "error.playlist_empty": "La lista de reproducción está vacía.",
    "error.preset_bad_band": "Elige una banda de BPM cuyo extremo inferior esté por debajo del superior, hasta 400.",
    "error.preset_bad_bpm": "Elige un BPM mayor que cero y un margen de 0 a 50.",
    "error.preset_bad_genre": "Elige un género.",
    "error.preset_bad_key": "Elige una tonalidad para el preajuste armónico.",
    "error.preset_bad_months": "Elige entre 1 y 240 meses.",
    "error.preset_crate_gone": "Esa caja de preajuste ya no está en la biblioteca.",
    "error.preset_not_a_preset_crate": "Esa caja no se creó a partir de un preajuste.",
    "error.preset_unknown": "Ese preajuste de caja no está disponible.",
    "error.rating_invalid": "La valoración debe ser un número entero del 1 al 5.",
    "error.recycle_failed": "No se pudo mover el archivo a la Papelera de reciclaje.",
    "error.registration_no_space": "Las cajas no se registraron. Esta biblioteca no tiene el espacio Serato Library, así que Serato puede quitar esos archivos de caja la próxima vez que se abra.",
    "error.related_direction": "Elige un enlace en un sentido o en ambos sentidos.",
    "error.related_missing": "Ese enlace no está en las pistas relacionadas.",
    "error.related_not_saved": "No se pudo guardar el archivo de pistas relacionadas.",
    "error.related_self": "Una pista no puede estar relacionada consigo misma.",
    "error.related_unreadable": "No se pudo leer el archivo de pistas relacionadas.",
    "error.relink_duplicate_files": "Dos de esos archivos son el mismo.",
    "error.relink_duplicate_tracks": "Dos de esas pistas son la misma.",
    "error.relink_needs_tracks": "Elige pistas para volver a enlazar.",
    "error.relink_not_audio": "Ese archivo no es un archivo de audio.",
    "error.relink_still_on_disk": "Esa pista sigue en el disco.",
    "error.replace_needs_confirm": "Confirma la actualización de las cajas antes de ejecutarla.",
    "error.replace_same_track": "Esas dos pistas son la misma.",
    "error.requestFailed": "La solicitud falló",
    "error.requestStatus": "La solicitud falló ({status})",
    "error.root_color": "La raíz del espacio no tiene color.",
    "error.root_delete": "La raíz del espacio no se puede eliminar.",
    "error.root_rename": "La raíz del espacio no se puede renombrar.",
    "error.scan_depth": "Elige una comprobación rápida o completa.",
    "error.scan_full_needs_crate": "Elige una caja para la comprobación completa.",
    "error.serato_version_unknown": "La versión de Serato es desconocida (compilación {build}). Las escrituras y las restauraciones están desactivadas hasta que se pueda leer la versión de Serato instalada. Un valor que no es un número con puntos, incluido un plist ilegible, es desconocido. Las instantáneas se pueden tomar y leer.",
    "error.setup_needs_consent": "Elige si quieres compartir estadísticas antes de terminar la configuración.",
    "error.setup_not_saved": "No se pudo guardar la configuración.",
    "error.shortcut_skipped": "Los accesos directos no se tocan.",
    "error.smart_crate_tracks": "Las cajas inteligentes eligen sus pistas a partir de reglas.",
    "error.smart_rules_json": "Las reglas de la caja inteligente deben estar en JSON.",
    "error.smart_rules_list": "Las reglas de la caja inteligente necesitan una lista de reglas.",
    "error.snapshot_id_invalid": "Ese identificador de instantánea no es válido.",
    "error.snapshot_incomplete": "Esa instantánea está incompleta.",
    "error.snapshot_unreadable": "No se pudo leer esa instantánea.",
    "error.space_unavailable": "Ese espacio no está disponible aquí.",
    "error.spelling_not_in_group": "Esa grafía no está en un grupo.",
    "error.theme_not_saved": "No se pudo guardar el tema.",
    "error.track_id_required": "Se necesita el identificador de la pista.",
    "error.track_not_in_library": "Esa pista no está en la biblioteca.",
    "error.track_not_in_space": "La pista no está en este espacio.",
    "error.track_not_in_space_alt": "Esa pista no está en este espacio.",
    "error.too_many_files": "Elige menos archivos a la vez.",
    "error.track_path_required": "Se necesita la ruta de la pista.",
    "error.trash_failed": "No se pudo mover el archivo a la Papelera.",
    "error.tree_bad_bands": "Elige bandas de BPM entre 1 y 400, de 1 a 50 de ancho, que empiecen como mucho a su ancho de distancia, y como máximo 60 bandas.",
    "error.tree_bad_genres": "Elige al menos 1 pista por género y hasta 100 géneros.",
    "error.tree_empty": "Ninguna pista encaja en ese árbol de cajas.",
    "error.tree_unknown": "Ese árbol de cajas no está disponible.",
    "error.undo_needs_confirm": "Confirma la acción de deshacer antes de guardarla.",
    "error.upload_too_large": "Ese archivo es demasiado grande.",
    "error.write_preimage_mismatch": "La copia previa al cambio no coincide con su hash.",
    "error.write_rollback_failed": "El cambio no coincidía, y no se pudo devolver la biblioteca.",
    "error.write_undo_failed": "El cambio falló, y no se pudo devolver la biblioteca.",
    "export.m3u": "Exportar",
    "field.album": "Álbum",
    "field.artist": "Artista",
    "field.beatgridLocked": "Beatgrid bloqueado",
    "field.color": "Color",
    "field.comments": "Comentarios",
    "field.composer": "Compositor",
    "field.emoji": "Emoji",
    "field.file": "Archivo",
    "field.genre": "Género",
    "field.grouping": "Agrupación",
    "field.label": "Sello",
    "field.rating": "Valoración",
    "field.remixer": "Remezclador",
    "field.title": "Título",
    "field.year": "Año",
    "files.andMore": "Y {count} más.",
    "files.browseElsewhere": "Explorar otra ubicación…",
    "files.changeCrates": "Cajas: {crates}.",
    "files.checking": "Comprobando qué va a cambiar.",
    "files.chooseDelete": "Elige los archivos que quieres eliminar.",
    "files.chooseDestination": "Elige la carpeta de destino. Después confirma el traslado.",
    "files.chooseMove": "Elige los archivos que quieres mover.",
    "files.chooseOneRename": "Elige un solo archivo para renombrar.",
    "files.chooseRenameFromTags": "Elige los archivos que quieres renombrar desde las etiquetas.",
    "files.chooseOneReplace": "Elige un solo archivo para reemplazar.",
    "files.contents": "Contenido de la carpeta",
    "files.driveMissing": "Unidad no conectada",
    "files.driveMissingLabel": "{name}, unidad no conectada",
    "files.empty": "Esta carpeta está vacía.",
    "files.fileCount": {
      one: "{count} archivo",
      other: "{count} archivos"
    },
    "files.inLibrary": "En la biblioteca",
    "files.moveFolder": "Mover esta carpeta",
    "files.moveHere": "Mover aquí",
    "files.moveToFolder": "Mover a una carpeta",
    "files.moveToTrash": "Mover a la Papelera",
    "files.newFile": "Archivo nuevo",
    "files.newName": "Nombre nuevo",
    "files.noMatches": "Ningún archivo coincide con “{query}”.",
    "files.noRoots": "Todavía no hay carpetas de música",
    "files.noRootsBody": "La configuración encuentra las carpetas que Serato usa para tu música.",
    "files.notSaved": "Ese cambio no se guardó.",
    "files.nothingUntilConfirm": "No se cambia nada hasta que confirmes.",
    "files.open": "Abrir {name}",
    "files.path": "Ruta de la carpeta",
    "files.readingFolder": "Leyendo esta carpeta",
    "files.readingFolderNote": "Leyendo esta carpeta.",
    "files.readingRoots": "Leyendo las carpetas de música",
    "files.readingRootsNote": "Leyendo las carpetas de música.",
    "files.renameFromTags": "Renombrar desde etiquetas",
    "files.replaceFile": "Mejorar archivo (conservar cues)",
    "files.review": "Revisar",
    "files.reviewTitle": "Revisa este cambio",
    "files.rootCount": {
      one: "{count} carpeta de música",
      other: "{count} carpetas de música"
    },
    "files.roots": "Carpetas de música",
    "files.rootsUnreadable": "No se pudieron leer las carpetas de música.",
    "files.runSetup": "Iniciar configuración",
    "files.saving": "Guardando.",
    "files.searchLabel": "Buscar archivos",
    "files.searchPlaceholder": "Buscar archivos",
    "files.searchResults": "Resultados de la búsqueda",
    "files.searchTruncated": "Algunos archivos que coinciden no están en la lista. Escribe más del nombre.",
    "files.searching": "Buscando archivos…",
    "files.shortcut": "{name} (acceso directo)",
    "files.trash": "Papelera",
    "files.truncated": "Algunos archivos no aparecen en la lista.",
    "files.updated": "Se actualizaron los archivos.",
    "folderSync.button": "Sincronizar carpeta",
    "folderSync.counting": "Contando pistas…",
    "folderSync.done": "{name} actualizada: {added} añadidas, {removed} quitadas.",
    "folderSync.folder": "Carpeta",
    "folderSync.full": "Quitar pistas cuyos archivos no están en esta carpeta",
    "folderSync.intro": "Añade las pistas de la biblioteca cuyos archivos están en esta carpeta. Los archivos que no están en la biblioteca se omiten. No se importa nada.",
    "folderSync.subcrates": "Crear una subcaja por cada subcarpeta",
    "folderSync.summary": "{added} para añadir, {removed} para quitar. {skipped} archivos no están en la biblioteca.",
    "folderSync.summaryNone": "Ya está sincronizada. {skipped} archivos no están en la biblioteca.",
    "folderSync.sync": "Sincronizar caja",
    "folderSync.title": "Sincronizar la caja con una carpeta",
    "folderSync.unchanged": "{name} ya coincide con esa carpeta.",
    "format.bytes": {
      one: "{count} byte",
      other: "{count} bytes"
    },
    "format.hoursMinutes": "{hours} h {minutes} min",
    "format.minutes": "{minutes} min",
    "generation.checking": "Comprobando",
    "generation.label": "Generación de la biblioteca",
    "generation.legacy": "Serato anterior",
    "generation.named": "Generación de la biblioteca, {kind}",
    "generation.reason.downgrade": "El registro más reciente dice Serato {newest} y un registro anterior dice Serato {version}.",
    "generation.reason.fallback": "No se encontró un registro de sesión. Se usa la versión de Serato instalada, {version}.",
    "generation.reason.installUnknown": "No se pudo leer la versión de Serato instalada, así que las escrituras siguen desactivadas. Un registro de sesión no puede activarlas.",
    "generation.reason.installed": "El Serato instalado es {version}. El registro más reciente dice Serato {newest}.",
    "generation.reason.log": "El registro de sesión más reciente, {log}, anotó que Serato {version} abrió {database}.",
    "generation.reason.mismatch": "El registro de sesión abrió {database}, que no es este archivo de biblioteca.",
    "generation.reason.pending": "La generación de la biblioteca todavía no se ha leído.",
    "generation.reason.unknown": "Hay un registro de sesión, pero no nombra Serato 4 ni Serato 5. Las escrituras y las restauraciones siguen desactivadas.",
    "generation.reason.unmounted": "El registro de sesión {log} nombró {database} en una unidad que no está conectada.",
    "generation.reason.version": "El registro de sesión más reciente, {log}, nombra Serato {version} y no nombra un archivo de base de datos.",
    "generation.serato4": "Serato 4",
    "generation.serato5": "Serato 5",
    "generation.unknown": "Versión desconocida",
    "gig.checkAgain": "Comprobar de nuevo",
    "gig.checking": "Comprobando la biblioteca…",
    "gig.cratesAdded": "Cajas añadidas",
    "gig.cratesEdited": "Cajas editadas",
    "gig.cratesRemoved": "Cajas eliminadas",
    "gig.cuesEdited": "Cues editados",
    "gig.done": "Listo",
    "gig.doneNotReady": "No listo para el bolo: {score}/100, se comprobó {crate} a las {time}",
    "gig.doneReady": "Listo para el bolo: {score}/100, se comprobó {crate} a las {time}",
    "gig.driveUnavailable": {
      one: "{name}: {count} pista no disponible",
      other: "{name}: {count} pistas no disponibles"
    },
    "gig.drives": "Unidades",
    "gig.drivesAction": "Comprobar unidades",
    "gig.drivesEmpty": "No hay unidades desconectadas.",
    "gig.emptyCrates": "Cajas vacías",
    "gig.emptyCratesAction": "Llenar cajas vacías",
    "gig.emptyCratesEmpty": "No hay cajas vacías.",
    "gig.exit": "Salir de la comprobación",
    "gig.gridsEdited": "Beatgrids editados",
    "gig.groupCount": "{label} ({count})",
    "gig.heading": "Comprobación del bolo",
    "gig.holding": "Lo que lo frena",
    "gig.missing": "Archivos que faltan",
    "gig.missingAction": "Buscar archivos que faltan",
    "gig.missingEmpty": "No falta ningún archivo.",
    "gig.noSnapshot": "No hay instantánea con la que comparar.",
    "gig.score": "{score}/100",
    "gig.scoreLabel": "Puntuación {score} de 100, {verdict}",
    "gig.showAll": "Mostrar las {count}",
    "gig.since": "Desde el último bolo",
    "gig.sinceAction": "Revisar cambios",
    "gig.sinceEmpty": "Nada cambió desde la última instantánea.",
    "gig.stepOf": "Paso {index} de {total}",
    "gig.streaming": "Streaming",
    "gig.streamingAction": "Revisar pistas en streaming",
    "gig.streamingEmpty": "No hay pistas en streaming.",
    "gig.tagsEdited": "Etiquetas editadas",
    "gig.tracksAdded": "Pistas añadidas",
    "gig.tracksRemoved": "Pistas eliminadas",
    "gig.unreachable": "No se pudo conectar con el servidor de la biblioteca. Comprueba que está en marcha y pulsa Comprobar de nuevo",
    "gig.unreadable": "No se pudo leer la comprobación del bolo.",
    "gig.verdictNotReady": "✕ No listo",
    "gig.verdictReady": "✓ Listo",
    "gig.wholeSpace": "Todo el espacio",
    "gig.wholeSpaceInline": "todo el espacio",
    "gig.wordNotReady": "no listo",
    "gig.wordReady": "listo",
    "health.checking": "Comprobando la biblioteca…",
    "health.artEmbed": "Incrustar carátula",
    "health.artIntro": "Consulta Cover Art Archive. Previsualiza la carátula y luego incrústala en el archivo de audio. Los cues se quedan. Cierra Serato primero.",
    "health.artLooking": "Buscando carátulas…",
    "health.artNone": "No se encontró carátula para esta pista.",
    "health.artPick": "Carátula a incrustar",
    "health.artTitle": "Buscar carátula",
    "health.clear": "Nada que corregir en esta comprobación.",
    "health.duplicateRow": {
      one: "{title} ({count} copia)",
      other: "{title} ({count} copias)"
    },
    "health.bitrate": "Calidad dudosa",
    "health.bitrateNote": "Falsos 320 y archivos sin pérdida hechos a partir de un códec con pérdida. Necesita una caja porque decodifica el audio.",
    "health.duplicates": "Grupos duplicados",
    "health.emptyGenre": "Género vacío",
    "health.fileRow": "{file}",
    "health.findArt": "Buscar carátula",
    "health.heading": "Salud de la biblioteca",
    "health.intro": "Cifras de la biblioteca y de los archivos de audio en el disco. Cada fila abre el sitio que puede corregirlo.",
    "health.missing": "Archivos no encontrados",
    "health.more": {
      one: "{count} más.",
      other: "{count} más."
    },
    "health.noArtwork": "Sin carátula",
    "health.noBeatgrid": "Sin beatgrid",
    "health.noBpm": "Sin BPM",
    "health.noCrate": "En ninguna caja",
    "health.noKey": "Sin tonalidad",
    "health.openBitrate": "Abrir Calidad dudosa",
    "health.openDuplicates": "Abrir Duplicados",
    "health.openFiles": "Abrir Archivos",
    "health.openMissing": "Abrir Archivos no encontrados",
    "health.row": "{title}",
    "health.summary": {
      one: "{count} pista comprobada.",
      other: "{count} pistas comprobadas."
    },
    "health.unreadable": "No se pudo leer el informe de salud.",
    "health.unreachable": "No se pudo alcanzar el servidor de la biblioteca. Comprueba que está en marcha y pulsa Volver a comprobar.",
    "health.unused": "Archivos no usados",
    "help.bug": "Informar de un error",
    "help.bugTitle": "Informar de un error",
    "help.change": "Qué debería cambiar",
    "help.copied": "Copiado. Pégalo en el informe de GitHub.",
    "help.copyFailed": "No se pudo copiar el informe.",
    "help.copyLog": "Copiar registro",
    "help.diagnostics": "Qué se incluirá",
    "help.expected": "Qué esperabas",
    "help.feature": "Pedir una función",
    "help.featureTitle": "Pedir una función",
    "help.github": "Ver en GitHub",
    "help.happened": "Qué ocurrió",
    "help.loadFailed": "No se pudieron cargar los datos de diagnóstico.",
    "help.loading": "Cargando diagnóstico…",
    "help.logCopied": "Registro copiado.",
    "help.logEmpty": "El registro está vacío.",
    "help.names": "Incluir nombres de pistas y cajas del registro",
    "help.nothing": "No se envía nada hasta que lo envíes en GitHub.",
    "help.openGitHub": "Abrir en GitHub",
    "help.opened": "Abierto en el navegador. Revísalo y envíalo en GitHub.",
    "help.opening": "Abriendo…",
    "help.releases": "Notas de la versión",
    "help.reportText": "Texto del informe",
    "help.review": "Lo verás en GitHub antes de enviarlo. La app no lo publica.",
    "help.title": "Ayuda",
    "help.tooLong": "El informe es demasiado largo para un enlace. Se copió. Pégalo en el informe de GitHub.",
    "history.chooseSession": "Elige una sesión.",
    "history.file": "Archivo",
    "history.notes": "Notas",
    "history.openInLibrary": "Abrir en la biblioteca",
    "history.readFailed": "No se pudo leer el historial.",
    "history.session": "Sesión",
    "history.sessionFailed": "No se pudo leer esa sesión.",
    "history.sessions": "Sesiones del historial",
    "history.started": "Inicio",
    "import.added": {
      one: "{count} pista añadida.",
      other: "{count} pistas añadidas."
    },
    "import.button": "Importar",
    "import.defaultName": "Lista importada",
    "import.unmatched": {
      one: "{count} línea no coincidió con ninguna pista de la biblioteca.",
      other: "{count} líneas no coincidieron con ninguna pista de la biblioteca."
    },
    "layout.resize": "Cambiar el tamaño de la lista de pistas",
    "layout.resizeHint": "Arrastra para cambiar el tamaño. Doble clic para restablecerlo.",
    "layout.widthNotSaved": "No se pudo guardar el ancho del panel. La próxima vez vuelve al último ancho guardado.",
    "library.loading": "Cargando la biblioteca",
    "library.readFailed": "No se pudo leer la biblioteca ({status})",
    "library.unavailable": "Biblioteca no disponible",
    "list.label": "Pistas",
    "list.noMatches": "Ninguna pista coincide.",
    "list.readingDuplicates": "Leyendo duplicados",
    "logs.copied": "Registros copiados.",
    "logs.copiedTruncated": "Se copiaron las entradas más recientes del registro. Las más antiguas se omitieron.",
    "logs.copyFailed": "No se pudieron copiar los registros.",
    "logs.copyManual": "No se pudo copiar automáticamente. Selecciona el texto del registro y cópialo.",
    "logs.copying": "Copiando…",
    "logs.empty": "Todavía no hay entradas en el registro.",
    "logs.openFailed": "No se pudo abrir la carpeta de registros.",
    "logs.opened": "Se abrió la carpeta de registros.",
    "markers.beats": {
      one: "{count} tiempo",
      other: "{count} tiempos"
    },
    "markers.bpm": "{bpm} BPM",
    "markers.cue": "Punto de cue {number}",
    "markers.cueEmpty": "Vacío",
    "markers.flip": "Flip {number}",
    "markers.gridEmpty": "El beatgrid no tiene marcadores.",
    "markers.gridHeading": "Beatgrid",
    "markers.gridNone": "Este archivo no tiene beatgrid.",
    "markers.gridSuspect": "Beatgrid sospechoso. {reason}",
    "markers.gridTooMany": "El beatgrid tiene más de 4096 marcadores.",
    "markers.gridTooShort": "El beatgrid es demasiado corto para leerlo.",
    "markers.gridTruncated": "El beatgrid es más corto que el número de marcadores.",
    "markers.gridUnknown": "No se pudo leer el beatgrid.",
    "markers.gridVersion": "Esa versión de beatgrid no está admitida.",
    "markers.gridViewOnly": "Solo lectura. Esta app no reescribe el beatgrid.",
    "markers.heading": "Puntos de cue, bucles guardados y beatgrid",
    "markers.loop": "Bucle guardado {number}",
    "markers.loopLocked": "Bucle guardado {number} bloqueado",
    "markers.none": "Este archivo no tiene puntos de cue de Serato.",
    "markers.readOnly": "Leídos del archivo de audio. No se vuelven a escribir.",
    "markers.unavailable": "El archivo no está en el disco, así que no se pueden leer los cues.",
    "menu.close": "Cerrar",
    "menu.exportRekordbox": "Exportar a Rekordbox",
    "menu.file": "Archivo",
    "menu.focusSearch": "Ir a la búsqueda",
    "menu.help": "Ayuda",
    "menu.library": "Música",
    "menu.minimize": "Minimizar",
    "menu.resetWidth": "Restablecer el ancho de la lista",
    "menu.tools": "Herramientas",
    "menu.window": "Ventana",
    "merge.addToCrates": "Añadir la copia conservada a {crates}.",
    "merge.addToSpace": "Añadir la copia conservada al espacio {space}.",
    "merge.alreadyInCrates": "La copia conservada ya está en todas las cajas que usan las demás. Se queda donde está.",
    "merge.confirmTrash": "Combinar y mover archivos a la Papelera",
    "merge.copiedCues": "{file} tenía los mejores {what}. Se copiaron al archivo que conservas.",
    "merge.copyCues": "{file} tiene los mejores {what}. Se copiarán al archivo que conservas.",
    "merge.copyCuesWhatBoth": "cues y beatgrid",
    "merge.copyCuesWhatGrid": "beatgrid",
    "merge.copyCuesWhatMarkers": "cues",
    "merge.fieldChange": "{label} cambia de {before} a {after}.",
    "merge.filesStay": "Los archivos de audio se quedan en el disco.",
    "merge.intro": "Conserva una copia. Las demás salen de la biblioteca. Los archivos de audio se quedan en el disco a menos que los muevas a la Papelera.",
    "merge.keep": "Copia que se conserva",
    "merge.keptCopy": "la copia conservada",
    "merge.merged": {
      one: "Se combinó {count} copia en {name}.",
      other: "Se combinaron {count} copias en {name}."
    },
    "merge.merging": "Combinando…",
    "merge.noCrates": "Ninguna de las copias está en una caja.",
    "merge.noFields": "No hay campos vacíos ni un número de reproducciones mayor que copiar.",
    "merge.noHistory": "Ninguna entrada del historial apunta a las otras copias.",
    "merge.noHistoryId": "Esta biblioteca no tiene un identificador de pista en el historial que se pueda reasignar.",
    "merge.plays": {
      one: "{count} reproducción",
      other: "{count} reproducciones"
    },
    "merge.previewFailed": "No se pudo leer la vista previa.",
    "merge.quitSerato": "Cierra Serato antes de combinar. La vista previa muestra el plan.",
    "merge.readingPreview": "Leyendo la vista previa…",
    "merge.removeCopies": {
      one: "Quitar {count} copia de la biblioteca.",
      other: "Quitar {count} copias de la biblioteca."
    },
    "merge.repointHistory": {
      one: "Apuntar {count} entrada del historial a la copia conservada.",
      other: "Apuntar {count} entradas del historial a la copia conservada."
    },
    "merge.title": "Combinar copias",
    "merge.trashFiles": "Mover {files} a la Papelera.",
    "merge.trashLabel": "Mover los otros archivos de audio a la Papelera",
    "merge.trashNote": "Desactivado por defecto. Los archivos van a la Papelera, desde donde puedes restaurarlos. No se eliminan para siempre.",
    "mode.bitrate": "Necesita una caja. Guardar una caja escribe en la biblioteca. Cierra Serato primero.",
    "mode.drift": "Solo lectura. Esta comprobación no cambia la biblioteca.",
    "mode.duplicates": "Mismo título, artista y duración. Selecciona una copia y combina las demás en ella.",
    "mode.files": "Archivos en el disco. Los cues se quedan en el archivo de audio. Las cajas siguen la ruta.",
    "mode.gig": "Solo lectura. Esta comprobación no cambia la biblioteca.",
    "mode.health": "Solo lectura. Este informe no cambia la biblioteca.",
    "mode.missing": "Pistas cuyo archivo falta en una unidad conectada.",
    "mode.missingOffline": {
      one: "Pistas cuyo archivo falta en una unidad conectada. {count} pista en una unidad desconectada se marca como desconectada en las cajas.",
      other: "Pistas cuyo archivo falta en una unidad conectada. {count} pistas en unidades desconectadas se marcan como desconectadas en las cajas."
    },
    "mode.portable": "Solo lectura. Esta comprobación no cambia la biblioteca.",
    "mode.scan": "Solo lectura. Esta comprobación no cambia la biblioteca.",
    "mode.snapshots": "Copias verificadas por hash de la biblioteca, las cajas y los datos de Serato dentro de los archivos de audio. El audio en sí no se copia.",
    "mode.stats": "Las pistas y artistas más reproducidos en un periodo. Crear una caja con las pistas inactivas escribe en la biblioteca. Cierra Serato primero.",
    "mode.stems": "Pistas con un estado de análisis de stems.",
    "mode.tags": "Escribe en la biblioteca, no en los archivos de audio. Cierra Serato primero.",
    "operations.action.crateAdd": "Añadir a la caja",
    "operations.action.crateColor": "Color de la caja",
    "operations.action.crateCreate": "Crear caja",
    "operations.action.crateDelete": "Eliminar caja",
    "operations.action.crateExpanded": "Caja expandida",
    "operations.action.cratePrepare": "Preparar",
    "operations.action.crateRemove": "Quitar de la caja",
    "operations.action.crateRemoveLibrary": "Quitar de la biblioteca",
    "operations.action.crateRename": "Renombrar caja",
    "operations.action.crateRules": "Reglas de la caja",
    "operations.action.delete": "Eliminar archivo",
    "operations.action.importM3u": "Importar lista",
    "operations.action.mergeDuplicates": "Unir copias",
    "operations.action.move": "Mover archivo",
    "operations.action.moveFolder": "Mover carpeta",
    "operations.action.rename": "Renombrar archivo",
    "operations.action.renameFromTags": "Renombrar desde etiquetas",
    "operations.action.relink": "Reenlazar archivos",
    "operations.action.replace": "Mejorar archivo (conservar cues)",
    "operations.action.replaceInCrates": "Reemplazar en las cajas",
    "operations.action.restore": "Restaurar",
    "operations.action.restoreRecover": "Recuperar restauración",
    "operations.action.saveTrack": "Guardar pista",
    "operations.actionOther": "Edición de la biblioteca",
    "operations.beforeOnly": "Antes {before}.",
    "operations.empty": "Todavía no hay cambios comprobados. Cada edición y cada restauración aparecen aquí después de la comprobación.",
    "operations.entry": "{time}. {action}. {target}. {outcome}.",
    "operations.heading": "Registro de operaciones",
    "operations.noTarget": "la biblioteca",
    "operations.outcome.refused": "No se guardó",
    "operations.outcome.rollbackFailed": "No se pudo revertir",
    "operations.outcome.rolledBack": "Revertido",
    "operations.outcome.verified": "Comprobado",
    "operations.reading": "Leyendo el registro de operaciones",
    "operations.rollbackFailed": "Un cambio no se pudo revertir. La biblioteca puede no coincidir con la última copia buena. Esto no se guardó como un éxito.",
    "operations.snapshots": "Antes {before}. Después {after}.",
    "operations.unreadable": "No se pudo leer el registro de operaciones.",
    "plan.andMore": " y {count} más",
    "plan.cratesAdded": "Cajas añadidas",
    "plan.cratesChanged": "Cajas modificadas",
    "plan.cratesRegistered": "Cajas registradas para que Serato las conserve",
    "plan.cratesRemoved": "Cajas quitadas",
    "plan.cratesSkipped": "Cajas omitidas",
    "plan.cratesUnavailable": "Cajas en una unidad no disponible",
    "plan.cueChanges": "Cambios de cues",
    "plan.cueDiff": "{before} → {after}",
    "plan.deletedCrates": "Cajas eliminadas",
    "plan.deletedCues": "Cues eliminados",
    "plan.deletedGrids": "Beatgrids eliminados",
    "plan.deletedTracks": "Pistas eliminadas",
    "plan.files": {
      one: "{label}: {count} archivo",
      other: "{label}: {count} archivos"
    },
    "plan.gridChanges": "Cambios de beatgrid",
    "plan.item": "elemento",
    "plan.listed": "{label}: {count}. {names}",
    "plan.none": "{label}: ninguno",
    "plan.nothingChanged": "No se ha cambiado nada.",
    "plan.tracksAdded": "Pistas añadidas",
    "plan.tracksRemoved": "Pistas quitadas",
    "plan.tracksUnavailable": "Pistas en una unidad no disponible",
    "player.cannotPlay": "Este archivo no se puede reproducir en esta ventana.",
    "player.cue": "Marca",
    "player.duration": "Duración",
    "player.elapsed": "Transcurrido",
    "player.next": "Siguiente",
    "player.notInLibrary": "No está en la biblioteca o falta el archivo",
    "player.nothingPlaying": "Nada en reproducción",
    "player.overview": "Vista general de la pista",
    "player.overviewSeek": "Haz clic o arrastra para buscar",
    "player.pause": "Pausa",
    "player.play": "Reproducir",
    "player.previous": "Anterior",
    "player.region": "Reproductor",
    "player.seek": "Posición",
    "player.volume": "Volumen",
    "player.waveformReading": "Leyendo la forma de onda…",
    "player.waveformUnavailable": "Forma de onda no disponible para este formato",
    "player.zoomIn": "Acercar",
    "player.zoomOut": "Alejar",
    "portable.check": "Comprobar unidad",
    "portable.checkLabel": "Comprobar {name}",
    "portable.checking": "Comprobando esta unidad.",
    "portable.driveLabel": "Unidad",
    "portable.kindFileSize": "Archivo demasiado grande",
    "portable.kindMissing": "No está",
    "portable.kindOffDrive": "Fuera de esta unidad",
    "portable.kindPathLength": "Ruta demasiado larga",
    "portable.kindSmartCrate": "Caja inteligente",
    "portable.kindUnsafeName": "Nombre no válido",
    "portable.missing": "Esta unidad no está conectada. No se ha borrado nada.",
    "portable.noDrive": "No hay ninguna unidad conectada con una carpeta _Serato_.",
    "portable.notReady": "No está lista. Corrígelo en el portátil primero.",
    "portable.offlineNamed": "{name} no está conectada. No se ha borrado nada.",
    "portable.readOnly": "Esto solo lee la unidad. No se copia ni se borra nada.",
    "portable.ready": "Lista para salir del portátil.",
    "portable.title": "Unidad portátil",
    "portable.unreachable": "No se ha podido comprobar esta unidad.",
    "portable.unreadable": "No se ha podido leer esta unidad.",
    "presets.bpm": "BPM",
    "presets.button": "Preajuste",
    "presets.counting": "Contando pistas…",
    "presets.create": "Crear caja",
    "presets.created": {
      one: "{name} guardada con {count} pista.",
      other: "{name} guardada con {count} pistas."
    },
    "presets.intro": "La app elige las pistas y guarda una caja normal cuyo nombre termina en ⟳. Serato la reproduce como cualquier caja. Se actualiza cuando esta app se abre con Serato cerrado, o cuando pulsas Actualizar.",
    "presets.key": "Tonalidad",
    "presets.keyHelp": "Camelot, como 8A, o un nombre de tonalidad, como Am.",
    "presets.kind": "Preajuste",
    "presets.kind.bpm": "Rango de BPM",
    "presets.kind.harmonic": "Mezcla con una tonalidad",
    "presets.kind.unplayed": "Sin tocar últimamente",
    "presets.matches": {
      one: "Coincide {count} pista.",
      other: "Coinciden {count} pistas."
    },
    "presets.months": "Meses",
    "presets.name": "Nombre de la caja",
    "presets.name.bpm": "BPM {bpm} ±{range}",
    "presets.name.harmonic": "Mezcla con {key}",
    "presets.name.unplayed": {
      one: "Sin tocar en {count} mes",
      other: "Sin tocar en {count} meses"
    },
    "presets.range": "Más o menos",
    "presets.refresh": "Actualizar",
    "presets.refreshed": "{name} actualizada: {added} añadidas, {removed} quitadas.",
    "presets.refreshedOnOpen": {
      one: "Se actualizó {count} caja de preajuste.",
      other: "Se actualizaron {count} cajas de preajuste."
    },
    "presets.scope": "Solo pistas de {name} y sus subcajas",
    "presets.title": "Nueva caja a partir de un preajuste",
    "presets.updated": "⟳ actualizada {date}",
    "quickOpen.empty": "Escribe el nombre de una pista o de un archivo.",
    "quickOpen.file": "Archivo",
    "quickOpen.fileError": "No se pudieron buscar los archivos del disco. Las pistas que coinciden siguen en la lista.",
    "quickOpen.label": "Nombre",
    "quickOpen.matchCount": {
      one: "{count} coincidencia",
      other: "{count} coincidencias"
    },
    "quickOpen.matches": "Coincidencias",
    "quickOpen.none": "Ninguna pista ni archivo coincide con “{query}”.",
    "quickOpen.placeholder": "Nombre de la pista o del archivo",
    "quickOpen.searching": "Buscando archivos…",
    "quickOpen.title": "Buscar una pista o un archivo",
    "quickOpen.track": "Pista",
    "quickOpen.truncated": "Algunos archivos no se buscaron. Escribe más del nombre.",
    "rail.heading": "crateCraft",
    "rating.none": "Sin valorar",
    "rating.stars": {
      one: "{count} estrella",
      other: "{count} estrellas"
    },
    "rekordbox.dialogTitle": "¿Descargar rekordbox.xml?",
    "rekordbox.download": "Descargar",
    "rekordbox.downloadTitle": "Descargar rekordbox.xml",
    "rekordbox.failed": "La exportación a Rekordbox falló.",
    "rekordbox.hotLoops": "Bucles de hot cue",
    "rekordbox.hotLoopsHelp": "Usa un pad de hot cue libre",
    "rekordbox.intro": "Estos elementos no se copian a Rekordbox. El archivo se descarga cuando confirmes.",
    "rekordbox.keyAsis": "Tono tal como está guardado",
    "rekordbox.keyCamelot": "Tono Camelot",
    "rekordbox.keyClassical": "Tono clásico",
    "rekordbox.keyNotation": "Notación de tono para Rekordbox",
    "rekordbox.memoryCues": "Cues de memoria",
    "rekordbox.notXml": "La exportación no generó un archivo XML.",
    "rekordbox.reportLabel": "Lo que no se copia",
    "related.confirmRemove": "¿Quitar el enlace con «{name}»?",
    "related.crateNote": "Crea o actualiza la caja «{name}». Serato debe estar cerrado.",
    "related.crateUpdated": "Caja «{name}» actualizada.",
    "related.find": "Buscar una pista para enlazar",
    "related.findPlaceholder": "Título o artista",
    "related.heading": "Mezcla bien con",
    "related.linkRating": "Valoración del enlace",
    "related.loadFailed": "No se pudo cargar Mezcla bien con.",
    "related.loading": "Cargando Mezcla bien con",
    "related.noPath": "Esta pista no tiene ruta de archivo, así que no se puede enlazar.",
    "related.noSuggestions": "No hay sugerencias por tono, tempo o cajas en común.",
    "related.noneSaved": "Todavía no hay enlaces guardados. Busca una pista o guarda una sugerencia.",
    "related.notInLibrary": "No está en esta biblioteca",
    "related.note": "Nota",
    "related.notePlaceholder": "mezclar al salir de",
    "related.oneWay": "En un sentido",
    "related.quitSerato": "Cierra Serato antes de escribir la caja.",
    "related.ratingOutOf": "{rating}/5",
    "related.removeLink": "Quitar el enlace con {name}",
    "related.removed": "Enlace quitado.",
    "related.saveLink": "Guardar enlace",
    "related.saveLinkTo": "Guardar enlace con {name}",
    "related.saved": "Enlace guardado.",
    "related.savedCount": "{count} guardados",
    "related.suggested": "Sugeridas por tono, tempo con un margen del 6 % y cajas en común. Guardar crea un enlace en ambos sentidos.",
    "related.thisTrack": "esta pista",
    "related.twoWay": "En ambos sentidos",
    "related.twoWayLink": "Enlace en ambos sentidos",
    "related.typeHint": "Escribe un título o un artista.",
    "related.updateCrate": "Actualizar caja de Serato",
    "relink.acceptHigh": "Aceptar todas las altas",
    "relink.choose": "Elige pistas para volver a enlazar.",
    "relink.confidence": "Confianza",
    "relink.confidence.high": "Alta",
    "relink.confidence.low": "Baja",
    "relink.confidence.medium": "Media",
    "relink.confirm": "Reenlazar",
    "relink.done": {
      one: "Se apuntó {count} pista faltante a su archivo.",
      other: "Se apuntaron {count} pistas faltantes a sus archivos."
    },
    "relink.empty": "No hay pistas faltantes en este espacio, o ninguna coincidió.",
    "relink.find": "Buscar coincidencias",
    "relink.finding": "Buscando…",
    "relink.include": "Reenlazar esta pista",
    "relink.intro": "Apunta las pistas faltantes a archivos que se movieron. El audio se queda donde está. Las cajas, el historial y los enlaces relacionados se mantienen.",
    "relink.match": "Coincidencia",
    "relink.none": "Todavía no hay coincidencias. Busca en las carpetas de música, o añade una carpeta extra después de cambiar de disco.",
    "relink.pick": "Elige un archivo",
    "relink.previewing": "Comprobando qué va a cambiar.",
    "relink.quitSerato": "Cierra Serato antes de reenlazar.",
    "relink.reason.folder": "Carpeta movida",
    "relink.reason.name": "Mismo nombre",
    "relink.reason.nameAndSize": "Mismo nombre y tamaño",
    "relink.reason.size": "Mismo tamaño",
    "relink.reason.unknown": "{reason}",
    "relink.relinking": "Reenlazando…",
    "relink.remap": "Carpeta movida: {from} → {to} ({count} pistas)",
    "relink.root": "Carpeta extra para buscar",
    "relink.rootHelp": "Opcional. Pega una carpeta después de cambiar de disco, por ejemplo /Volumes/NEW/DJ.",
    "relink.scanned": "Se buscaron {count} archivos.",
    "relink.selected": {
      one: "{count} seleccionada",
      other: "{count} seleccionadas"
    },
    "relink.title": "Reenlazar archivos faltantes",
    "relink.track": "Pista",
    "relink.truncated": "La búsqueda se detuvo a los 200.000 archivos. Añade una carpeta extra más cercana.",
    "relink.unavailable": {
      one: "{count} pista está en un disco que no está conectado. No se busca coincidencia.",
      other: "{count} pistas están en un disco que no está conectado. No se buscan coincidencias."
    },
    "relink.why": "Por qué",
    "rules.and": "y",
    "rules.label": "Reglas de la caja inteligente",
    "rules.matches": "Coincide",
    "rules.none": "todavía no hay reglas",
    "rules.or": "o",
    "rules.save": "Guardar reglas",
    "rules.saved": "Reglas guardadas.",
    "scan.checkFull": "Decodificación completa",
    "scan.checkQuick": "Comprobación rápida",
    "scan.checking": "Comprobando archivos…",
    "scan.decodeErrorDetail": "La decodificación se detuvo a los {detail}s",
    "scan.empty": "Ningún archivo dañado en esta comprobación.",
    "scan.heading": "Archivos dañados",
    "scan.intro": "La comprobación rápida lee el inicio de cada archivo. La decodificación completa necesita una caja porque puede tardar minutos.",
    "scan.notFound": {
      one: "Se omitió {count} pista no encontrada. Mira Archivos no encontrados.",
      other: "Se omitieron {count} pistas no encontradas. Mira Archivos no encontrados."
    },
    "scan.problem.decode_error": "Error de decodificación",
    "scan.problem.empty": "Archivo vacío",
    "scan.problem.serato_flagged": "Serato marcó este archivo como dañado",
    "scan.problem.short": "Más corto que la duración guardada",
    "scan.problem.undecodable": "No se pudo decodificar",
    "scan.problem.unknown": "Archivo dañado",
    "scan.problem.unreadable": "No se pudo leer el archivo",
    "scan.problem.wrong_format": "Formato incorrecto",
    "scan.row": "{title} ({file}) — {problem}",
    "scan.shortDetail": "Más corto que la duración guardada ({detail}s)",
    "scan.summary": {
      one: "{checked} archivos comprobados. {count} archivo dañado.",
      other: "{checked} archivos comprobados. {count} archivos dañados."
    },
    "scan.summaryClear": "{checked} archivos comprobados. Ninguno dañado.",
    "scan.unchecked": {
      one: "{count} archivo tiene una extensión que esta comprobación no conoce.",
      other: "{count} archivos tienen una extensión que esta comprobación no conoce."
    },
    "scan.unreachable": "No se pudo alcanzar el servidor de la biblioteca. Comprueba que está en marcha y pulsa Comprobación rápida",
    "scan.unreadable": "No se pudo leer la comprobación de archivos.",
    "scan.wrongFormatDetail": "Parece {detail}",
    "search.fieldAll": "Todos los campos",
    "search.fieldLabel": "Campo de búsqueda",
    "search.tracks": "Buscar pistas",
    "settings.about": "Acerca de crateCraft",
    "settings.colorway": "Tema",
    "settings.colorway.classic": "Clásico",
    "settings.colorway.darkClub": "Club oscuro",
    "settings.colorway.light": "Claro",
    "settings.colorway.seratoLike": "Estilo Serato",
    "settings.colorwayPreview": "Vista previa del icono del tema",
    "settings.copyLogs": "Copiar registros",
    "settings.copyVersion": "Copiar versión",
    "settings.iconAppliedDock": "El icono del Dock coincide con este tema.",
    "settings.iconAppliedWindow": "El icono de la ventana y de la barra de tareas coincide con este tema.",
    "settings.iconDefault": "El icono de la app se queda en el habitual.",
    "settings.iconFollowsTheme": "El icono de la app sigue el tema",
    "settings.iconNotSaved": "No se pudo guardar el tema. Se usa hasta que cierres la app.",
    "settings.iconSaved": "Tema guardado.",
    "settings.iconUnsupported": "Este ordenador no puede cambiar el icono de la app en ejecución. La elección se guarda y se aplica en Mac y Windows.",
    "settings.language": "Idioma",
    "settings.languageNotSaved": "No se pudo guardar el idioma. Se usa hasta que cierres la app.",
    "settings.languageSystem": "El mismo que el sistema",
    "settings.logText": "Texto del registro",
    "settings.openLogs": "Abrir carpeta de registros",
    "settings.rerunSetup": "Repetir la configuración",
    "settings.share": "Compartir estadísticas de uso anónimas e informes de errores",
    "settings.title": "Ajustes",
    "settings.updates": "Buscar en GitHub una versión más nueva una vez al día",
    "settings.updatesFailed": "No se pudo guardar la opción de actualizaciones.",
    "settings.updatesPrereleases": "Incluir versiones de prueba (beta y candidatas)",
    "sheet.scope": "Alcance: {crate}",
    "sheet.title": "{view} · {space}",
    "shell.drawerHide": "Ocultar navegación",
    "shell.drawerShow": "Mostrar navegación",
    "sharing.canSend": "Se pueden enviar recuentos anónimos e informes de errores.",
    "sharing.loadFailed": "No se pudieron cargar los ajustes de privacidad.",
    "sharing.loadFailedOff": "No se pudieron cargar los ajustes de privacidad. No se envía nada.",
    "sharing.noKeys": "Esta copia no tiene claves de telemetría, así que no se envía nada en ningún caso.",
    "sharing.nothingSent": "No se envía nada.",
    "sharing.off": "Compartir está desactivado. No se envía nada.",
    "sharing.on": "Compartir está activado. Se pueden enviar recuentos anónimos e informes de errores.",
    "shortcuts.action": "Acción",
    "shortcuts.cheatSheet": "Mostrar atajos",
    "shortcuts.dismiss": "Cerrar o borrar la búsqueda",
    "shortcuts.focusSearch": "Enfocar la búsqueda",
    "shortcuts.groupFind": "Buscar",
    "shortcuts.groupLists": "Listas",
    "shortcuts.groupPlay": "Reproducción",
    "shortcuts.groupViews": "Vistas",
    "shortcuts.intro": "Estas teclas funcionan en cualquier parte de esta pantalla, excepto mientras escribes en un campo. Esc sigue cerrando un diálogo o borrando una búsqueda.",
    "shortcuts.key": "Tecla",
    "shortcuts.listNext": "Fila siguiente",
    "shortcuts.listOpen": "Abrir la fila",
    "shortcuts.listPrevious": "Fila anterior",
    "shortcuts.open": "Atajos",
    "shortcuts.playNote": "Espacio reproduce o pausa. Izquierda retrocede 5 segundos. Derecha avanza 5 segundos.",
    "shortcuts.playPause": "Reproducir o pausar",
    "shortcuts.quickOpen": "Buscar una pista o un archivo",
    "shortcuts.seekBack": "Retroceder 5 segundos",
    "shortcuts.seekForward": "Avanzar 5 segundos",
    "shortcuts.title": "Atajos de teclado",
    "shortcuts.viewCrates": "Cajas",
    "shortcuts.viewFiles": "Organizar archivos",
    "shortcuts.viewHistory": "Historial",
    "shortcuts.viewLibrary": "Todas las pistas",
    "shortcuts.viewSnapshots": "Copias de seguridad",
    "snapshots.backupDrives": "Copiar cajas de las unidades",
    "snapshots.backupDrivesBusy": "Copiando cajas de las unidades…",
    "snapshots.count": {
      one: "{count} copia",
      other: "{count} copias"
    },
    "snapshots.drivePermission": "{name} (sin permiso)",
    "snapshots.driveReadOnly": "{name} (solo lectura)",
    "snapshots.drivesAbsent": "Desconectadas, sin copiar: {drives}.",
    "snapshots.drivesAlready": "Esas cajas ya están en la copia de esta sesión.",
    "snapshots.drivesCopied": "Copiadas: {drives}.",
    "snapshots.drivesIntro": "Las cajas de las unidades conectadas se copian en la copia de este equipo.",
    "snapshots.drivesNone": "No había carpetas de unidades pendientes de copiar.",
    "snapshots.drivesSaved": "Las cajas de las unidades se copiaron en la copia de este equipo.",
    "snapshots.drivesSkipped": "Omitidas: {drives}.",
    "snapshots.empty": "Todavía no hay copias. Haz una copia para guardar un punto al que puedas volver. Las copias se conservan y esta página no las caduca.",
    "snapshots.noSearch": "Copias de seguridad no tiene búsqueda. Pulsa Ctrl+K para buscar una pista o un archivo.",
    "snapshots.outsideChange": "Algo ajeno a esta app cambió la carpeta de Serato. Se guardó una instantánea después de ese cambio. Deshacer restaura la instantánea anterior.",
    "snapshots.outsideChangeLexicon": "Lexicon cambió la carpeta de Serato. Se guardó una instantánea después de ese cambio. Deshacer restaura la instantánea anterior.",
    "snapshots.reading": "Leyendo copias",
    "snapshots.readingPlan": "Leyendo qué cambiaría",
    "snapshots.restore": "Restaurar",
    "snapshots.restoreIntro": "No se cambia nada hasta que confirmes. Primero se guarda una instantánea nueva, así que esta restauración se puede deshacer.",
    "snapshots.restoreTitle": "Restaurar esta copia",
    "snapshots.restored": "Restauración terminada. La biblioteca anterior se guardó primero, así que puedes deshacerla desde la lista.",
    "snapshots.restoring": "Restaurando…",
    "snapshots.reviewRestore": "Revisar restauración",
    "snapshots.reviewUndo": "Revisar deshacer",
    "snapshots.saved": "Copia guardada.",
    "snapshots.saving": "Guardando copia…",
    "snapshots.seratoUnknown": "Versión de Serato desconocida",
    "snapshots.seratoVersion": "Serato {version} (compilación {build})",
    "snapshots.skippedCrates": {
      one: "Restauración terminada. Se omitió {count} archivo de caja porque no se pudo leer su copia de la instantánea: {names}.",
      other: "Restauración terminada. Se omitieron {count} archivos de caja porque no se pudo leer su copia de la instantánea: {names}."
    },
    "snapshots.take": "Hacer una copia de seguridad",
    "snapshots.trigger": "instantánea",
    "snapshots.unavailableDrives": "No disponibles: {drives}.",
    "snapshots.unknownDrive": "Unidad desconocida",
    "snapshots.unknownTime": "Hora desconocida",
    "snapshots.unreadable": "No se pudieron leer las copias.",
    "space.appleMusic": "Apple Music",
    "space.label": "Espacio",
    "space.library": "Biblioteca",
    "space.prepare": "Prepare",
    "space.video": "Vídeo",
    "status.checking": "Comprobando Serato",
    "status.library": "Biblioteca",
    "stats.artistTracks": "Pistas",
    "stats.artists": "Artistas más reproducidos",
    "stats.checking": "Leyendo estadísticas de reproducción…",
    "stats.confirmCrate": {
      one: "¿Crear la caja “{name}” con {count} pista no reproducida en {days} días? Hay que cerrar Serato.",
      other: "¿Crear la caja “{name}” con {count} pistas no reproducidas en {days} días? Hay que cerrar Serato."
    },
    "stats.csv": "Descargar CSV",
    "stats.empty": "No hay reproducciones en este periodo.",
    "stats.emptyArtists": "No hay artistas reproducidos en este periodo.",
    "stats.emptyIdle": "No hay pistas inactivas para este corte.",
    "stats.emptyTracks": "No hay pistas reproducidas en este periodo.",
    "stats.from": "Desde",
    "stats.heading": "Estadísticas",
    "stats.idle": "Sin reproducir",
    "stats.idleCrate": "Crear caja",
    "stats.idleCrateName": "Sin reproducir en {days} días",
    "stats.idleDays": "Días inactivos",
    "stats.idleHint": "Pistas de este espacio no reproducidas en {days} días.",
    "stats.idleRow": "{title} — última vez {last}",
    "stats.intro": "Las pistas y artistas más reproducidos en un periodo. La lista inactiva puede convertirse en una caja. Hay que cerrar Serato. Este informe no cambia la biblioteca hasta que confirmes la caja.",
    "stats.more": {
      one: "{count} más no se muestra.",
      other: "{count} más no se muestran."
    },
    "stats.never": "nunca",
    "stats.period": "Periodo",
    "stats.period.365": "Últimos 365 días",
    "stats.period.30": "Últimos 30 días",
    "stats.period.7": "Últimos 7 días",
    "stats.period.90": "Últimos 90 días",
    "stats.period.all": "Todo",
    "stats.period.custom": "Fechas",
    "stats.show": "Mostrar",
    "stats.summary": "{plays} reproducciones en {sessions} sesiones.",
    "stats.to": "Hasta",
    "stats.tracks": "Pistas más reproducidas",
    "stats.unreadable": "No se pudieron leer las estadísticas de reproducción.",
    "stats.unreachable": "No se pudo alcanzar el servidor de la biblioteca para leer las estadísticas de reproducción.",
    "stats.written": {
      one: "Se creó la caja {name} con {count} pista.",
      other: "Se creó la caja {name} con {count} pistas."
    },
    "tags.apply": "Aplicar",
    "tags.applyMappings": "Aplicar grafías guardadas",
    "tags.artist": "Artista",
    "tags.checking": "Leyendo grafías de etiquetas…",
    "tags.checkingTitles": "Leyendo títulos…",
    "tags.field": "Campo",
    "tags.genre": "Género",
    "tags.introTitles": "Quita números de pista, URL y (Original Mix). Pasa feat. a remixer cuando remixer está vacío. Pasa a mayúsculas iniciales los títulos en MAYÚSCULAS o minúsculas. Escribe en la biblioteca, no en los archivos de audio. Cierra Serato primero.",
    "tags.group": "{name} — {spellings}, {tracks}",
    "tags.heading": "Grafías de etiquetas",
    "tags.intro": "Elige una grafía por grupo. Escribe en la biblioteca, no en los archivos de audio. Cierra Serato primero.",
    "tags.noChanges": "Todas las pistas de este grupo ya usan esa grafía.",
    "tags.preview": "Revisar",
    "tags.mappingSummary": {
      one: "{count} pista aún usa una grafía guardada.",
      other: "{count} pistas aún usan una grafía guardada."
    },
    "tags.mappingWritten": {
      one: "Se escribió la grafía guardada en {count} pista.",
      other: "Se escribieron las grafías guardadas en {count} pistas."
    },
    "tags.previewLine": {
      one: "{from} → {to} ({count} pista)",
      other: "{from} → {to} ({count} pistas)"
    },
    "tags.previewLineField": {
      one: "{field}: {from} → {to} ({count} pista)",
      other: "{field}: {from} → {to} ({count} pistas)"
    },
    "tags.previewLineRemixer": {
      one: "{from} → {to}, remixer {remixer} ({count} pista)",
      other: "{from} → {to}, remixer {remixer} ({count} pistas)"
    },
    "tags.previewSummary": {
      one: "{count} pista pasaría a {value}.",
      other: "{count} pistas pasarían a {value}."
    },
    "tags.row": "{value} ({count})",
    "tags.spellingCount": {
      one: "{count} grafía",
      other: "{count} grafías"
    },
    "tags.suggested": "Sugerida",
    "tags.summaryArtist": {
      one: "{values} grafías de artista en este espacio. {count} grupo con más de una grafía.",
      other: "{values} grafías de artista en este espacio. {count} grupos con más de una grafía."
    },
    "tags.summaryArtistClear": "Cada artista de este espacio usa una sola grafía.",
    "tags.summaryGenre": {
      one: "{values} grafías de género en este espacio. {count} grupo con más de una grafía.",
      other: "{values} grafías de género en este espacio. {count} grupos con más de una grafía."
    },
    "tags.summaryGenreClear": "Cada género de este espacio usa una sola grafía.",
    "tags.summaryTitles": {
      one: "{count} título de este espacio cambiaría.",
      other: "{count} títulos de este espacio cambiarían."
    },
    "tags.summaryTitlesClear": "Cada título de este espacio ya cumple las reglas de limpieza.",
    "tags.titles": "Títulos",
    "tags.titlesPreviewSummary": {
      one: "{count} título cambiaría.",
      other: "{count} títulos cambiarían."
    },
    "tags.titlesWritten": {
      one: "Se escribió el título limpio en {count} pista.",
      other: "Se escribieron los títulos limpios en {count} pistas."
    },
    "tags.trackCount": {
      one: "{count} pista",
      other: "{count} pistas"
    },
    "tags.unreachable": "No se pudo contactar con el servidor de la biblioteca. Comprueba que está en marcha y pulsa Comprobar de nuevo.",
    "tags.unreadable": "No se pudieron leer los grupos de etiquetas.",
    "tags.written": {
      one: "Se escribió {value} en {count} pista.",
      other: "Se escribió {value} en {count} pistas."
    },
    "tooltip.allTracks": "Muestra todas las pistas de este espacio. Ctrl/Cmd+1.",
    "tooltip.backupDrives": "Copia la carpeta Serato de cada unidad conectada en la copia de este equipo. Una unidad desconectada se anota y no se toca.",
    "tooltip.beatgridLock": "Bloquea la rejilla de tiempo para que Serato no la mueva.",
    "tooltip.bitrateConfirm": "Crea la caja Calidad dudosa. Serato tiene que estar cerrado.",
    "tooltip.bitrateRefresh": "Vuelve a comprobar la tasa de bits de la caja seleccionada.",
    "tooltip.bitrateSave": "Previsualiza una caja Calidad dudosa con las pistas marcadas. No se escribe nada hasta que confirmes. Cierra Serato primero.",
    "tooltip.chooseRelated": "Elige {name} como pista para enlazar.",
    "tooltip.collapseCrate": "Oculta las cajas que están dentro de {name}.",
    "tooltip.colorway": "Elige el tema. El icono de la app puede seguir esta elección.",
    "tooltip.columnMenu": "Muestra u oculta columnas.",
    "tooltip.columnResize": "Arrastra para cambiar el ancho de esta columna.",
    "tooltip.consentAccept": "Comparte estadísticas anónimas e informes de fallos.",
    "tooltip.consentDecline": "No compartas estadísticas anónimas.",
    "tooltip.copyLogs": "Copia el texto del registro.",
    "tooltip.copyVersion": "Copia la versión de la aplicación.",
    "tooltip.crateColor": "Elige el color de la caja seleccionada.",
    "tooltip.crateDelete": "Elimina la caja seleccionada. Las pistas siguen en la biblioteca.",
    "tooltip.crateNew": "Crea una caja nueva.",
    "tooltip.crateFolderSync": "Añade a esta caja las pistas de la biblioteca cuyos archivos están en una carpeta. Los archivos que no están en la biblioteca se omiten.",
    "tooltip.crateRenameFromTags": "Renombra los archivos de esta caja a Artista - Título y conserva las rutas de las cajas.",
    "tooltip.cratePreset": "Crea una caja a partir de un preajuste: pistas que mezclan con una tonalidad, un rango de BPM o pistas sin tocar últimamente.",
    "tooltip.folderSyncCancel": "Cierra sin cambiar la caja.",
    "tooltip.folderSyncFull": "También quita las pistas cuyos archivos no están en esta carpeta.",
    "tooltip.folderSyncPath": "Carpeta de este ordenador cuyos archivos deben coincidir con esta caja.",
    "tooltip.folderSyncRun": "Actualiza esta caja para que coincida con la carpeta. Hay que salir de Serato DJ Pro.",
    "tooltip.folderSyncSubcrates": "Pone en la caja los archivos de esta carpeta y crea una subcaja por cada subcarpeta.",
    "tooltip.crateRefresh": "Vuelve a elegir las pistas de esta caja según su preajuste.",
    "tooltip.crateRename": "Cambia el nombre de la caja seleccionada.",
    "tooltip.crateSaveView": "Guarda las pistas de esta lista como una caja nueva. Hay que salir de Serato DJ Pro.",
    "tooltip.crateSearch": "Busca una caja por nombre. Esc borra la búsqueda.",
    "tooltip.crateSplit": "Muestra dos cajas a la vez. Alt-clic o Mayús-clic llena la otra lista.",
    "tooltip.cratesReplaceCancel": "Cierra sin cambiar las cajas.",
    "tooltip.cratesReplaceConfirm": "Pon la pista de reemplazo en esas cajas.",
    "tooltip.cratesReplaceKeep": "Deja las dos pistas en esas cajas. La de reemplazo queda en la misma posición.",
    "tooltip.cratesReplaceRetire": "Quita esta pista de esas cajas después de añadir la de reemplazo.",
    "tooltip.cratesReplaceSearch": "Busca la pista que debe entrar en esas cajas.",
    "tooltip.cue": "Lleva el cursor de reproducción a {label}.",
    "tooltip.editField": "Edita {label}. No se guarda nada hasta que guardes la pista.",
    "tooltip.expandCrate": "Muestra las cajas que están dentro de {name}.",
    "tooltip.exportM3u": "Descarga esta lista como un archivo de lista de reproducción.",
    "tooltip.exportRekordbox": "Descarga un archivo de lista que Rekordbox puede abrir. Confirmas antes de la descarga.",
    "tooltip.fileShortcut": "{name} es un acceso directo. No se puede abrir desde aquí.",
    "tooltip.filesCancel": "Cancela. No se cambia nada. Esc.",
    "tooltip.filesConfirm": "Guarda este cambio de archivo.",
    "tooltip.filesDelete": "Mueve los archivos seleccionados a la papelera.",
    "tooltip.filesElsewhere": "Examina una carpeta que no es una de las carpetas de música.",
    "tooltip.filesList": "Lista de carpetas. Arriba y Abajo cambian de fila. Intro abre la fila.",
    "tooltip.filesMove": "Mueve los archivos seleccionados a otra carpeta.",
    "tooltip.filesMoveFolder": "Mueve esta carpeta.",
    "tooltip.filesMoveHere": "Mueve los archivos a esta carpeta.",
    "tooltip.filesMoveTrash": "Mueve los archivos seleccionados a la papelera. Puedes restaurarlos desde allí.",
    "tooltip.filesMusicFolders": "Vuelve a las carpetas de música.",
    "tooltip.filesName": "Escribe el nombre nuevo del archivo.",
    "tooltip.filesPickCancel": "Cancela la elección de carpeta.",
    "tooltip.filesRefresh": "Actualiza esta carpeta desde el disco.",
    "tooltip.filesRename": "Cambia el nombre del archivo seleccionado.",
    "tooltip.filesRenameFromTags": "Renombra los archivos seleccionados a Artista - Título y conserva las rutas de las cajas.",
    "tooltip.filesReplace": "Mejora el archivo seleccionado y conserva sus puntos de cue.",
    "tooltip.filesReplacement": "Escribe la ruta del archivo de sustitución.",
    "tooltip.filesReview": "Revisa este cambio antes de guardarlo.",
    "tooltip.filesSearch": "Busca nombres de archivo. Ctrl/Cmd+F o /. Esc borra la búsqueda.",
    "tooltip.filesUp": "Sube a la carpeta superior.",
    "tooltip.findRelated": "Busca una pista para enlazar por título o artista.",
    "tooltip.gigBack": "Vuelve un paso atrás.",
    "tooltip.gigExit": "Sale de la comprobación y muestra las cajas.",
    "tooltip.gigNext": "Pasa al siguiente paso.",
    "tooltip.gigRefresh": "Vuelve a hacer la comprobación del bolo.",
    "tooltip.gigShowAll": "Muestra todos los elementos de esta lista.",
    "tooltip.gridCell": "Selecciona esta fila.",
    "tooltip.gridPagination": "Muestra las cien pistas siguientes o anteriores.",
    "tooltip.healthArtCancel": "Cierra el diálogo de carátula sin escribir. Esc.",
    "tooltip.healthArtEmbed": "Escribe la carátula elegida en el archivo de audio. Los cues se quedan. Cierra Serato primero.",
    "tooltip.healthArtPick": "Elige esta imagen de Cover Art Archive para incrustarla.",
    "tooltip.healthFindArt": "Busca una carátula en Cover Art Archive y previsualízala antes de incrustarla.",
    "tooltip.healthOpenBitrate": "Abre la comprobación de tasa de bits de esta caja.",
    "tooltip.healthOpenDuplicates": "Abre la vista Duplicados.",
    "tooltip.healthOpenFiles": "Abre la vista Archivos.",
    "tooltip.healthOpenMissing": "Abre la vista Archivos no encontrados.",
    "tooltip.healthRefresh": "Vuelve a generar el informe de salud de la biblioteca. Solo lectura.",
    "tooltip.healthTrack": "Abre esta pista en Cajas.",
    "tooltip.help": "Abre Ayuda. Informa de un error o pide una función en GitHub. La app no lo publica.",
    "tooltip.helpBug": "Describe un error. GitHub se abre para que lo revises.",
    "tooltip.helpClose": "Cierra Ayuda. Esc.",
    "tooltip.helpCopyLog": "Copia el registro con tu carpeta personal reemplazada por ~.",
    "tooltip.helpExpected": "Qué esperabas que ocurriera.",
    "tooltip.helpFeature": "Describe una función. GitHub se abre para que la revises.",
    "tooltip.helpGithub": "Abre el proyecto en GitHub.",
    "tooltip.helpHappened": "Qué ocurrió, o qué debería cambiar.",
    "tooltip.helpNames": "Conserva los nombres de pistas y cajas en el registro copiado. Desactivado los omite.",
    "tooltip.helpOpen": "Abre el informe de GitHub ya rellenado. Tú lo envías allí.",
    "tooltip.helpReleases": "Abre las notas de la versión en GitHub.",
    "tooltip.helpReport": "El texto del informe, cuando no se pudo copiar.",
    "tooltip.hideSearchCopies": "Oculta los campos que se compararon.",
    "tooltip.hotLoops": "Copia los bucles a un pad de cue libre en el archivo de Rekordbox.",
    "tooltip.iconFollowsTheme": "Haz que el icono del Dock en Mac, o el de la ventana y la barra de tareas en Windows, coincida con el tema. Activado de forma predeterminada. El icono del Finder y el icono del programa en Windows no cambian.",
    "tooltip.importFile": "Elige un archivo de lista de reproducción para importar.",
    "tooltip.importM3u": "Añade pistas de un archivo de lista a una caja nueva.",
    "tooltip.keepCopy": "Conserva esta copia: {name}. Las demás salen de la biblioteca.",
    "tooltip.language": "Elige el idioma de esta ventana. Igual que el sistema sigue el idioma de este ordenador.",
    "tooltip.libraryGeneration": "Abre la nota que dice si el registro de sesión o el Serato instalado decidió que esta biblioteca es Serato 4, Serato 5 o una versión desconocida.",
    "tooltip.linkMutual": "Enlaza también esa pista de vuelta a esta.",
    "tooltip.linkNote": "Añade una nota a este enlace.",
    "tooltip.linkRating": "Valora este enlace de 1 a 5.",
    "tooltip.logFallback": "Texto del registro, cuando no se pudo copiar.",
    "tooltip.membership": "Añade esta pista a {name}, o quítala.",
    "tooltip.memoryCues": "Incluye los cues de memoria en el archivo de Rekordbox.",
    "tooltip.mergeCancel": "Cancela. No se fusiona nada. Esc.",
    "tooltip.mergeConfirm": "Fusiona las copias en la que conservas.",
    "tooltip.mergeConfirmTrash": "Fusiona las copias y mueve los otros archivos de audio a la papelera.",
    "tooltip.mergeDuplicates": "Fusiona las copias seleccionadas en la que conservas.",
    "tooltip.relink": "Busca archivos que se movieron y apunta las pistas faltantes a ellos.",
    "tooltip.relinkAcceptHigh": "Marca cada coincidencia cuya confianza es alta.",
    "tooltip.relinkCancel": "Cancela. No se escribe nada. Esc.",
    "tooltip.relinkConfirm": "Apunta las pistas marcadas a los archivos elegidos. El audio no se mueve.",
    "tooltip.relinkFind": "Busca en las carpetas de música, y en la carpeta extra si pegaste una.",
    "tooltip.relinkInclude": "Incluye esta pista en el reenlace.",
    "tooltip.relinkPick": "Elige qué archivo debe usar esta pista faltante.",
    "tooltip.relinkRoot": "Carpeta extra para buscar después de cambiar de disco. Déjala en blanco para usar las carpetas de música.",
    "tooltip.mergeTrash": "Mueve los otros archivos de audio a la papelera. Puedes restaurarlos desde allí.",
    "tooltip.merging": "Fusionando las copias.",
    "tooltip.missingDrive": "Conecta el disco que contiene {name} antes de abrirlo.",
    "tooltip.navGig": "Puntuación de listo, comprobar unidad y tempo inestable.",
    "tooltip.navHealth": "Resumen, archivos no encontrados, duplicados, stems, archivos dañados, calidad dudosa y grafías de etiquetas.",
    "tooltip.navLibrary": "Cajas, historial y estadísticas de reproducción.",
    "tooltip.next": "Reproduce la pista siguiente de esta lista.",
    "tooltip.openCopy": "Abre esta otra copia, {name}.",
    "tooltip.openCrate": "Muestra las pistas de la caja {name}.",
    "tooltip.openCrumb": "Abre la carpeta {name}.",
    "tooltip.openFile": "Abre la carpeta {name}. Intro abre la fila resaltada.",
    "tooltip.openInLibrary": "Abre esta fila del historial en la biblioteca.",
    "tooltip.openLogs": "Abre la carpeta que contiene el registro.",
    "tooltip.openRelated": "Abre la pista enlazada {name}.",
    "tooltip.openReplaceCopy": "Usa {name} en las cajas donde está esta pista.",
    "tooltip.operationsList": "Registro de operaciones. Cada fila es una edición o una restauración comprobada.",
    "tooltip.operationsRefresh": "Actualiza el registro de operaciones.",
    "tooltip.operationsRetry": "Intenta leer el registro de operaciones otra vez.",
    "tooltip.overview": "Vista de toda la pista. Haz clic o arrastra para buscar. Izquierda retrocede 5 segundos. Derecha avanza 5 segundos.",
    "tooltip.playColumn": "Reproduce o pausa esta fila.",
    "tooltip.playRow": "Empieza {name}. Espacio reproduce o pausa.",
    "tooltip.portableCheck": "Comprueba {name}. Lee sus cajas y lista lo que hay que corregir antes del bolo. No se escribe nada.",
    "tooltip.portableClose": "Cierra el informe de la unidad portátil.",
    "tooltip.portableDrive": "Elige una unidad conectada que tenga una carpeta _Serato_. Una unidad desconectada se nombra debajo y no se trata como un archivo no encontrado.",
    "tooltip.portableRun": "Comprueba la unidad elegida. Lee sus cajas y lista lo que hay que corregir antes del bolo. No se escribe nada.",
    "tooltip.prepareAdd": "Envía esta pista a Preparar.",
    "tooltip.prepareRemove": "Quita esta pista de Preparar.",
    "tooltip.presetBpm": "El tempo en el centro del rango.",
    "tooltip.presetCancel": "Cierra sin crear una caja.",
    "tooltip.presetCreate": "Guarda las pistas que coinciden como una caja nueva.",
    "tooltip.presetKey": "La tonalidad de partida. Se incluyen las pistas un paso a cada lado en la rueda Camelot y la tonalidad relativa.",
    "tooltip.presetKind": "Elige qué pistas reúne la caja.",
    "tooltip.presetMonths": "Pistas sin tocar en estos meses, incluidas las que nunca se tocaron.",
    "tooltip.presetName": "El nombre de la caja. Se añade ⟳ al final.",
    "tooltip.presetRange": "Cuánto puede subir o bajar una pista respecto a ese tempo.",
    "tooltip.presetScope": "Mira solo las pistas de la caja elegida y de las cajas que contiene.",
    "tooltip.previous": "Reproduce la pista anterior de esta lista.",
    "tooltip.quickOpen": "Busca una pista o un archivo por nombre. Ctrl/Cmd+K. Esc cierra este cuadro.",
    "tooltip.quickOpenClose": "Cierra la búsqueda. Esc.",
    "tooltip.quickOpenHit": "Abre {kind} {title}. Intro.",
    "tooltip.quickOpenHitDetail": "Abre {kind} {title}. {detail}. Intro.",
    "tooltip.quickOpenRetry": "Vuelve a buscar archivos.",
    "tooltip.rekordboxCancel": "Cancela. El archivo no se descarga. Esc.",
    "tooltip.rekordboxDownload": "Descarga el archivo de Rekordbox.",
    "tooltip.rekordboxKey": "Elige cómo se escriben las tonalidades en el archivo de Rekordbox.",
    "tooltip.reload": "Vuelve a cargar la biblioteca desde Serato.",
    "tooltip.relocate": "Apunta esta pista a otro archivo de audio.",
    "tooltip.removeRelated": "Quita el enlace guardado a {name}. El archivo de audio sigue en el disco.",
    "tooltip.removeTrack": "Quita esta pista de la biblioteca. El archivo de audio sigue en el disco.",
    "tooltip.rerunWizard": "Ejecuta la configuración otra vez.",
    "tooltip.reveal": "Muestra este archivo en {name}. La biblioteca no cambia.",
    "tooltip.reviewRestore": "Revisa qué cambiaría al restaurar esta instantánea.",
    "tooltip.runSetup": "Ejecuta la configuración para encontrar las carpetas de música.",
    "tooltip.saveLink": "Guarda este enlace.",
    "tooltip.saveRules": "Guarda las reglas de esta caja inteligente.",
    "tooltip.saveSuggestion": "Guarda un enlace en ambos sentidos a {name}. Serato no cambia hasta que actualices la caja.",
    "tooltip.saveTrack": "Guarda estos datos de la pista.",
    "tooltip.scanFull": "Decodifica cada archivo de la caja seleccionada. Elige una caja primero. Puede tardar minutos. No se escribe nada.",
    "tooltip.scanQuick": "Lee el inicio de cada archivo de audio. Aquí aparecen los archivos vacíos y el formato incorrecto. No se escribe nada.",
    "tooltip.search": "Busca pistas por título o artista. Usa el menú de campo para comentarios, agrupación o compositor. Filtra con bpm:120-128, bpm:124~3, bpm:none, key:8A, key:none, mix:8A, missing:yes, nokeybpm:yes, cues:none, comments:, grouping: o composer:. Ctrl/Cmd+F o /. Esc borra la búsqueda.",
    "tooltip.searchField": "Busca en un solo campo. Todos los campos es título, artista, álbum, género, tono y archivo. Comentarios, agrupación y compositor usan este menú o comments:, grouping:, composer:.",
    "tooltip.seek": "Avanza por la pista. Izquierda retrocede 5 segundos. Derecha avanza 5 segundos. Mayús con una flecha salta 30 segundos.",
    "tooltip.selectFile": "Selecciona {name} para renombrar, mover o eliminar.",
    "tooltip.selectFilePath": "Selecciona {name} en {path} para renombrar, mover o eliminar.",
    "tooltip.selectRow": "Selecciona {name}. Intro abre esta fila.",
    "tooltip.session": "Muestra las pistas reproducidas en la sesión {name}.",
    "tooltip.settings": "Abre los ajustes.",
    "tooltip.settingsClose": "Cierra los ajustes. Esc.",
    "tooltip.shortcuts": "Atajos de teclado de esta pantalla. ? abre esta lista.",
    "tooltip.shortcutsClose": "Cierra la lista de atajos. Esc.",
    "tooltip.showSearchCopies": "Muestra los campos que se compararon.",
    "tooltip.smartRules": "Edita las reglas de la caja inteligente. No se guarda nada hasta que pulses Guardar reglas.",
    "tooltip.snapshotCancel": "Cancela. No se restaura nada. Esc.",
    "tooltip.snapshotConfirm": "Restaura esta instantánea. Antes se guarda una instantánea nueva.",
    "tooltip.snapshotsList": "Lista de instantáneas. Arriba y Abajo cambian de fila. Intro revisa la instantánea.",
    "tooltip.snapshotsRefresh": "Actualiza la lista de instantáneas.",
    "tooltip.snapshotsRetry": "Intenta leer las instantáneas otra vez.",
    "tooltip.snapshotsTake": "Guarda una copia de la biblioteca.",
    "tooltip.snapshotsUndo": "Revisa cómo deshacer el último cambio externo.",
    "tooltip.sortAdded": "Ordena las cajas por la fecha en que se añadieron.",
    "tooltip.sortArtist": "Ordena las pistas por artista.",
    "tooltip.sortBpm": "Ordena las pistas por tempo.",
    "tooltip.sortBy": "Ordena por {label}.",
    "tooltip.sortCrateName": "Ordena las cajas por nombre.",
    "tooltip.sortDateAdded": "Ordena las pistas por la fecha en que se añadieron.",
    "tooltip.sortDeck": "Ordena el historial por plato.",
    "tooltip.sortEnergy": "Ordena las pistas por energía (la valoración en estrellas, de 1 a 5).",
    "tooltip.sortGenre": "Ordena las pistas por género.",
    "tooltip.sortKey": "Ordena las pistas por tonalidad.",
    "tooltip.sortLastPlayed": "Ordena las pistas por la última vez que se reprodujeron.",
    "tooltip.sortLength": "Ordena las pistas por duración.",
    "tooltip.sortOrder": "Ordena las cajas en el orden guardado.",
    "tooltip.sortPlayed": "Ordena el historial según si la pista se reprodujo.",
    "tooltip.sortPlays": "Ordena las pistas por número de reproducciones.",
    "tooltip.sortStart": "Ordena el historial por la hora de inicio.",
    "tooltip.sortTitle": "Ordena las pistas por título.",
    "tooltip.space": "Elige Biblioteca, Vídeo, Apple Music o Preparar.",
    "tooltip.splitter": "Arrastra para cambiar el ancho de la lista. Doble clic lo devuelve. Las flechas lo redimensionan.",
    "tooltip.statsCsv": "Descarga este informe como hoja de cálculo. Solo lectura.",
    "tooltip.statsFrom": "Primer día de un periodo personalizado.",
    "tooltip.statsIdleCrate": "Previsualiza una caja con las pistas no reproducidas en estos días y confirma. Hay que cerrar Serato.",
    "tooltip.statsIdleDays": "Una pista no reproducida en estos días aparece en la lista. 365 por defecto.",
    "tooltip.statsPeriod": "Limita los más reproducidos a este periodo. Las pistas inactivas usan Días inactivos, no este periodo.",
    "tooltip.statsRefresh": "Carga las estadísticas de este periodo.",
    "tooltip.statsTo": "Último día de un periodo personalizado.",
    "tooltip.tagsApply": "Escribe esta grafía en cada pista del grupo. Cierra Serato primero. Los archivos de audio no cambian.",
    "tooltip.tagsApplyMappings": "Escribe las grafías de género y artista guardadas en las pistas que aún usan otra forma. Cierra Serato primero. Los archivos de audio no cambian.",
    "tooltip.tagsApplyTitles": "Escribe los títulos limpios. Cierra Serato primero. Los archivos de audio no cambian.",
    "tooltip.tagsArtist": "Muestra nombres de artista que son las mismas palabras escritas de otra forma.",
    "tooltip.tagsGenre": "Muestra géneros que son las mismas palabras escritas de otra forma.",
    "tooltip.tagsTitles": "Muestra títulos que cambiarían al quitar números, URL, Original Mix y feat., y al pasar a mayúsculas iniciales los que están en MAYÚSCULAS o minúsculas.",
    "tooltip.tagsGroup": "Abre o cierra este grupo de grafías.",
    "tooltip.tagsPreview": "Muestra qué pistas cambiarían antes de escribir en la biblioteca.",
    "tooltip.tagsRefresh": "Vuelve a cargar los grupos de grafías.",
    "tooltip.tagsSpelling": "Elige esta grafía para todas las pistas del grupo.",
    "tooltip.telemetry": "Activa o desactiva las estadísticas anónimas y los informes de fallos.",
    "tooltip.trackColor": "Elige un color para esta pista.",
    "tooltip.trackList": "Lista de pistas. Arriba y Abajo cambian de fila. Intro abre la fila. Espacio reproduce o pausa.",
    "tooltip.trackRating": "Elige una valoración para esta pista.",
    "tooltip.transport": "{action}. Espacio reproduce o pausa.",
    "tooltip.transportNamed": "{action} {name}. Espacio reproduce o pausa.",
    "tooltip.updateDismiss": "Ocultar hasta que la app se abra de nuevo.",
    "tooltip.updateDownload": "Abrir en el navegador la página de esta versión en GitHub.",
    "tooltip.updatePrereleases": "Avisar también de versiones beta y candidatas.",
    "tooltip.updateRelated": "Crea o actualiza la caja Relacionadas en Serato. Serato tiene que estar cerrado.",
    "tooltip.updateSkip": "No volver a avisar de esta versión.",
    "tooltip.updateToggle": "Preguntar a GitHub una vez al día si hay una versión más nueva.",
    "tooltip.useInCrates": "Pon otra pista en cada caja donde está esta, en la misma posición.",
    "tooltip.viewBitrate": "Marca archivos cuya tasa de bits declarada es mucho más alta que la del espectro, o archivos sin pérdida hechos a partir de un códec con pérdida. Necesita una caja. Guardar una caja escribe en la biblioteca.",
    "tooltip.viewCrates": "Muestra las cajas. Ctrl/Cmd+2.",
    "tooltip.viewDrift": "Marca pistas cuyo tempo se mueve, o que parecen grabaciones en vivo. Necesita una caja. Solo lectura.",
    "tooltip.drawerToggle": "Ocultar o mostrar el panel de navegación.",
    "tooltip.driftRefresh": "Vuelve a comprobar el tempo de la caja seleccionada.",
    "tooltip.viewDuplicates": "Muestra pistas que parecen copias unas de otras.",
    "tooltip.viewFiles": "Muestra los archivos del disco. Ctrl/Cmd+3.",
    "tooltip.viewGig": "Comprueba la biblioteca antes del bolo. Solo lectura. No cambia nada.",
    "tooltip.viewHealth": "Cifras en una página de archivos no encontrados, BPM o tonalidad faltantes, género vacío, pistas en ninguna caja y duplicados. Solo lectura.",
    "tooltip.viewHistory": "Muestra el historial. Ctrl/Cmd+4.",
    "tooltip.viewMissing": "Muestra las pistas cuyo archivo falta en una unidad conectada. Las pistas en una unidad desconectada se quedan en las cajas como desconectadas.",
    "tooltip.viewPortable": "Comprueba una unidad Serato portátil antes del bolo. Elige una unidad conectada. Solo lectura.",
    "tooltip.viewScan": "Busca archivos de audio vacíos, con el formato incorrecto o que no se pueden decodificar. Solo lectura.",
    "tooltip.viewSnapshots": "Abre las copias de seguridad. Copias comprobadas de la biblioteca, las cajas y los cues. Ctrl/Cmd+5.",
    "tooltip.viewStats": "Las pistas y artistas más reproducidos en un periodo, pistas inactivas y un CSV del informe.",
    "tooltip.viewStems": "Muestra las pistas que Serato ya analizó para stems. No separa el audio.",
    "tooltip.viewTags": "Agrupa grafías de género y artista que significan lo mismo. Escribe en la biblioteca, no en los archivos de audio.",
    "tooltip.volume": "Cambia el volumen de la reproducción.",
    "tooltip.wizard.checkAgain": "Vuelve a buscar la biblioteca de Serato.",
    "tooltip.wizard.continue": "Sigue al paso siguiente.",
    "tooltip.wizard.getStarted": "Empieza la configuración.",
    "tooltip.wizard.looking": "Buscando la biblioteca de Serato.",
    "tooltip.wizard.none": "Continúa la configuración.",
    "tooltip.wizard.openLibrary": "Termina la configuración y abre la biblioteca.",
    "tooltip.wizard.saving": "Guardando una copia de seguridad de la biblioteca.",
    "tooltip.wizard.takeSnapshot": "Guarda una copia de seguridad de la biblioteca.",
    "tooltip.wizard.tryAgain": "Intenta guardar la copia de seguridad otra vez.",
    "tooltip.wizard.useLibrary": "Usa la biblioteca que se encontró.",
    "tooltip.wizardBack": "Vuelve un paso en la configuración.",
    "tooltip.wizardCancel": "Cancela la configuración. La biblioteca no cambia. Esc.",
    "tooltip.wizardFolder": "Abre la carpeta {name}.",
    "tooltip.wizardFolderClose": "Cierra la lista de carpetas. Esc.",
    "tooltip.wizardFolderUp": "Sube a la carpeta superior.",
    "tooltip.wizardFolderUse": "Usa esta carpeta como biblioteca.",
    "tooltip.wizardNo": "No compartas estadísticas anónimas.",
    "tooltip.wizardSecondary": "Elige una carpeta que ya tenga una biblioteca de Serato.",
    "tooltip.wizardUpdatesNo": "No buscar versiones nuevas en GitHub.",
    "tooltip.wizardUpdatesYes": "Buscar en GitHub una versión nueva una vez al día.",
    "tooltip.wizardYes": "Comparte estadísticas anónimas e informes de fallos.",
    "tooltip.zoomIn": "Muestra un tramo más corto de la forma de onda alrededor del cursor.",
    "tooltip.zoomOut": "Muestra un tramo más largo de la forma de onda alrededor del cursor.",
    "track.missingBadge": "no encontrada",
    "track.offlineBadge": "desconectada",
    "track.numbered": "Pista {id}",
    "track.stemsBadge": "stems",
    "track.untitled": "Sin título",
    "update.available": "Ya está la versión {version}. Tienes la {current}.",
    "update.availableTest": "Ya está la versión de prueba {version}. Tienes la {current}.",
    "update.dismiss": "Ahora no",
    "update.download": "Descargar",
    "update.label": "Actualización disponible",
    "update.openFailed": "No se pudo abrir la página de la versión. Está en GitHub, en Releases.",
    "update.skip": "Omitir esta versión",
    "version.app": "Versión de la app",
    "version.copied": "Copiada",
    "version.copyFailed": "No se pudo copiar la versión.",
    "version.unavailable": "Versión no disponible",
    "view.bitrate": "Calidad dudosa",
    "view.crates": "Cajas",
    "view.drift": "Tempo inestable",
    "view.duplicates": "Duplicados",
    "view.files": "Organizar archivos",
    "view.gig": "Listo",
    "view.group.gig": "Bolo",
    "view.group.health": "Salud",
    "view.group.library": "Música",
    "view.health": "Resumen",
    "view.history": "Historial",
    "view.label": "Vistas",
    "view.missing": "Archivos no encontrados",
    "view.portable": "Comprobar unidad",
    "view.scan": "Archivos dañados",
    "view.snapshots": "Copias de seguridad",
    "view.stats": "Estadísticas",
    "view.stems": "Stems",
    "view.tags": "Grafías de etiquetas",
    "wizard.action.checkAgain": "Volver a buscar",
    "wizard.action.continue": "Continuar",
    "wizard.action.getStarted": "Empezar",
    "wizard.action.looking": "Buscando…",
    "wizard.action.openLibrary": "Abrir mi biblioteca",
    "wizard.action.takeSnapshot": "Tomar una instantánea de seguridad",
    "wizard.action.tryAgain": "Reintentar",
    "wizard.action.useLibrary": "Usar esta biblioteca",
    "wizard.announce": "Paso {index} de {count}. {name}.",
    "wizard.blocked": "Cierra Serato DJ para continuar.",
    "wizard.chooseCheckAgain": "Elige Volver a buscar.",
    "wizard.chooseFolder": "Elegir una carpeta",
    "wizard.closeFolders": "Cerrar la lista de carpetas",
    "wizard.consentFailed": "No se pudo guardar esa elección. Inténtalo de nuevo.",
    "wizard.copySaved": "Copia de seguridad guardada.",
    "wizard.done": "Biblioteca lista. Instantánea guardada.",
    "wizard.finishFailed": "No se pudo guardar que terminaste la configuración. Inténtalo de nuevo.",
    "wizard.folders": "Carpetas",
    "wizard.genericError": "Algo salió mal. Inténtalo de nuevo.",
    "wizard.heading.consent": "¿Compartir estadísticas de uso anónimas e informes de errores?",
    "wizard.heading.library": "Encuentra tu biblioteca",
    "wizard.heading.snapshot": "Instantánea de seguridad",
    "wizard.heading.updates": "¿Buscar versiones nuevas?",
    "wizard.heading.welcome": "Mira tu biblioteca de Serato",
    "wizard.lookFailed": "No se pudo buscar tu biblioteca.",
    "wizard.looking": "Buscando tu biblioteca de Serato.",
    "wizard.no": "No, no compartir",
    "wizard.noSubfolders": "Esta carpeta no contiene otras carpetas.",
    "wizard.opening": "Abriendo…",
    "wizard.progressLabel": "Guardando una copia de seguridad",
    "wizard.saving": "Guardando…",
    "wizard.savingCopy": "Guardando una copia de seguridad…",
    "wizard.savingLibraryCopy": "Guardando una copia de seguridad de tu biblioteca.",
    "wizard.snapshotBody": "Se guarda una copia de seguridad de los datos de tu biblioteca antes de cambiar nada.",
    "wizard.snapshotFailed": "No se pudo guardar la copia de seguridad. Tu biblioteca no cambió. Inténtalo de nuevo.",
    "wizard.step.consent": "Compartir",
    "wizard.step.done": "Listo",
    "wizard.step.library": "Encuentra tu biblioteca",
    "wizard.step.snapshot": "Instantánea de seguridad",
    "wizard.step.updates": "Actualizaciones",
    "wizard.step.welcome": "Bienvenida",
    "wizard.stepOf": "Paso {index} de {count}",
    "wizard.updatesBody": "Una vez al día, la app puede preguntar a GitHub si hay una versión más nueva. GitHub ve tu dirección IP y la versión de esta app. No se envía nada de tu biblioteca. La búsqueda queda desactivada salvo que la actives, y puedes cambiarlo en Ajustes.",
    "wizard.updatesFailed": "No se pudo guardar la opción. Inténtalo de nuevo.",
    "wizard.updatesNo": "No, no buscar",
    "wizard.updatesYes": "Sí, buscar",
    "wizard.useFolder": "Usar esta carpeta",
    "wizard.welcomeBody": "Esta app muestra la biblioteca que Serato ya guarda en este equipo. No cambiará nada sin preguntar.",
    "wizard.yes": "Sí, compartir",
    "files.toolbar": "Barra de carpeta",
    "files.actionsLabel": "Acciones de archivos",
    "crates.promptName": "Nombre",
    "tooltip.cratePromptCancel": "Cerrar sin cambiar la caja.",
    "tooltip.cratePromptConfirm": "Guardar este nombre de caja. Hay que salir de Serato DJ Pro.",
    "tooltip.cratePromptName": "Escribe el nombre de la caja, o un color."
  };

  // src/lib/i18n.ts
  var LANGUAGES = ["en", "es"], PSEUDO = "qps-ploc";
  var CATALOGS = {
    en: en_default,
    es: es_default
  }, LOCALE_EVENT = "serato-locale";
  function isLanguage(value) {
    return typeof value == "string" && LANGUAGES.includes(value);
  }
  function getLocale() {
    let lang = typeof document > "u" ? "" : document.documentElement.lang;
    return lang === PSEUDO ? PSEUDO : isLanguage(lang) ? lang : "en";
  }
  function onLocaleChange(listener) {
    let handler = () => listener(getLocale());
    return document.addEventListener(LOCALE_EVENT, handler), () => document.removeEventListener(LOCALE_EVENT, handler);
  }
  var ACCENTS = {
    a: "à",
    e: "é",
    i: "ï",
    o: "ö",
    u: "ü",
    c: "ç",
    n: "ñ",
    y: "ý",
    A: "Å",
    E: "É",
    I: "Î",
    O: "Ø",
    U: "Û",
    C: "Ç",
    N: "Ñ",
    Y: "Ý"
  };
  function pseudo(text) {
    let body = text.split(/(\{[a-zA-Z0-9_]+\})/).map((part) => part.startsWith("{") ? part : part.replace(/[a-zA-Z]/g, (ch) => ACCENTS[ch] ?? ch)).join(""), letters = text.replace(/\{[a-zA-Z0-9_]+\}/g, "").length, pad = "~".repeat(Math.max(1, Math.ceil(letters * 0.3)));
    return `[${body} ${pad}]`;
  }
  function catalogFor(locale) {
    return locale === PSEUDO ? CATALOGS.en : CATALOGS[locale];
  }
  function pick(message, count, locale) {
    if (typeof message == "string") return message;
    if (count === void 0) return message.other;
    let rules = new Intl.PluralRules(locale === PSEUDO ? "en" : locale);
    return (count === 0 ? message.zero : void 0) ?? message[rules.select(count)] ?? message.other;
  }
  function fill(text, params, locale) {
    if (!params) return text;
    let tag = locale === PSEUDO ? "en" : locale;
    return text.replace(/\{([a-zA-Z0-9_]+)\}/g, (whole, name) => {
      let value = params[name];
      return value === void 0 ? whole : typeof value == "number" ? new Intl.NumberFormat(tag).format(value) : value;
    });
  }
  function t(key, params) {
    let locale = getLocale(), message = catalogFor(locale)[key] ?? CATALOGS.en[key], count = typeof params?.count == "number" ? params.count : void 0, template = pick(message, count, locale);
    return fill(locale === PSEUDO ? pseudo(template) : template, params, locale);
  }
  function hasKey(key) {
    return Object.prototype.hasOwnProperty.call(CATALOGS.en, key);
  }
  function codedText(text, code, params) {
    if (typeof code == "string") {
      let key = `error.${code}`;
      if (hasKey(key)) return t(key, params ?? void 0);
    }
    return text;
  }
  function serverMessage(body, fallback) {
    return typeof body?.code == "string" ? codedText(body.error || fallback, body.code, body.params) : body?.error || fallback;
  }

  // src/lib/wizard/wizard.ts
  var STEP_NAME = {
    welcome: "wizard.step.welcome",
    library: "wizard.step.library",
    snapshot: "wizard.step.snapshot",
    consent: "wizard.step.consent",
    updates: "wizard.step.updates",
    done: "wizard.step.done"
  };
  function visibleSteps(needsConsent, needsUpdates = !1) {
    let steps = ["welcome", "library", "snapshot"];
    return needsConsent && steps.push("consent"), needsUpdates && steps.push("updates"), steps.push("done"), steps;
  }
  function stepsOf(model2) {
    return visibleSteps(model2.context.needsConsent, model2.context.needsUpdates);
  }
  function createWizard(input) {
    return {
      step: "welcome",
      complete: !1,
      dismissed: !1,
      context: {
        needsConsent: input.needsConsent,
        library: input.library,
        seratoRunning: input.seratoRunning,
        snapshot: "idle",
        consent: null,
        needsUpdates: input.needsUpdates ?? !1,
        updates: null
      }
    };
  }
  function reduceWizard(model2, action) {
    if (model2.dismissed || model2.complete) return model2;
    switch (action.type) {
      case "cancel":
        return { ...model2, dismissed: !0, complete: !1 };
      case "back":
        return goBack(model2);
      case "next":
        return goNext(model2);
      case "library":
        return { ...model2, context: { ...model2.context, library: action.status } };
      case "serato":
        return { ...model2, context: { ...model2.context, seratoRunning: action.running } };
      case "snapshot":
        return { ...model2, context: { ...model2.context, snapshot: action.phase } };
      case "consent":
        return goNext({ ...model2, context: { ...model2.context, consent: action.value } });
      case "updates":
        return model2.step !== "updates" ? model2 : goNext({ ...model2, context: { ...model2.context, updates: action.value } });
      case "finish":
        return model2.step !== "done" ? model2 : { ...model2, complete: !0 };
      default:
        return model2;
    }
  }
  function stepPosition(model2) {
    let steps = stepsOf(model2), found = steps.indexOf(model2.step);
    return { index: found < 0 ? 1 : found + 1, count: steps.length, name: t(STEP_NAME[model2.step]) };
  }
  function canGoBack(model2) {
    return model2.dismissed || model2.complete || model2.step === "snapshot" && model2.context.snapshot === "saving" ? !1 : stepsOf(model2).indexOf(model2.step) > 0;
  }
  function canAdvance(model2) {
    if (model2.dismissed || model2.complete) return !1;
    switch (model2.step) {
      case "welcome":
        return !0;
      case "library":
        return model2.context.library === "found";
      case "snapshot":
        return model2.context.snapshot === "saved";
      case "consent":
        return model2.context.consent !== null;
      case "updates":
        return model2.context.updates !== null;
      case "done":
        return !1;
      default:
        return !1;
    }
  }
  function snapshotBlocked(model2) {
    return model2.step === "snapshot" && model2.context.seratoRunning && model2.context.snapshot !== "saved";
  }
  function primaryAction(model2) {
    switch (model2.step) {
      case "welcome":
        return "get-started";
      case "library":
        return model2.context.library === "pending" ? "looking" : model2.context.library === "found" ? "use-library" : "check-again";
      case "snapshot":
        return model2.context.snapshot === "saved" ? "continue" : model2.context.snapshot === "error" ? "try-again" : "take-snapshot";
      case "consent":
      case "updates":
        return "none";
      case "done":
        return "open-library";
      default:
        return "none";
    }
  }
  function primaryEnabled(model2) {
    if (model2.dismissed || model2.complete) return !1;
    let action = primaryAction(model2);
    return !(action === "none" || action === "looking" || model2.step === "snapshot" && model2.context.snapshot === "saving" || snapshotBlocked(model2));
  }
  function stepAnnouncement(model2) {
    let position = stepPosition(model2);
    return t("wizard.announce", { index: position.index, count: position.count, name: position.name });
  }
  function goBack(model2) {
    if (!canGoBack(model2)) return model2;
    let steps = stepsOf(model2), index = steps.indexOf(model2.step), previous = steps[index - 1];
    return previous === void 0 ? model2 : { ...model2, step: previous };
  }
  function goNext(model2) {
    if (!canAdvance(model2)) return model2;
    let steps = stepsOf(model2), index = steps.indexOf(model2.step), next = steps[index + 1];
    return next === void 0 ? model2 : { ...model2, step: next };
  }

  // src/containers/WizardContext.tsx
  var import_jsx_runtime = __toESM(require_jsx_runtime(), 1);
  function noop() {
  }
  function noopFlag(_value) {
  }
  function noopPath(_path) {
  }
  function idleWizardValue() {
    return {
      model: createWizard({
        needsConsent: !0,
        library: "pending",
        seratoRunning: !1
      }),
      busy: !1,
      folderOpen: !1,
      folderName: "",
      folderParent: null,
      folders: [],
      summary: "",
      nextHint: "",
      statusNote: "",
      focusToken: 0,
      onPrimary: noop,
      onBack: noop,
      onCancel: noop,
      onChooseFolder: noop,
      onConsent: noopFlag,
      onUpdates: noopFlag,
      onFolderUp: noop,
      onFolderUse: noop,
      onFolderClose: noop,
      onBrowse: noopPath
    };
  }
  var WizardContext = (0, import_react.createContext)(null);
  function WizardProvider({
    value,
    children
  }) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WizardContext, { value, children });
  }
  function useWizard() {
    let value = (0, import_react.useContext)(WizardContext);
    if (value === null)
      throw new Error("useWizard must be used within WizardProvider");
    return value;
  }

  // src/lib/ui/tooltip-strings.ts
  function spec(key, params) {
    return params ? { key, params } : { key };
  }
  var tips = {
    space: spec("tooltip.space"),
    crateSearch: spec("tooltip.crateSearch"),
    mergeDuplicates: spec("tooltip.mergeDuplicates"),
    useInCrates: spec("tooltip.useInCrates"),
    cratesReplaceSearch: spec("tooltip.cratesReplaceSearch"),
    cratesReplaceKeep: spec("tooltip.cratesReplaceKeep"),
    cratesReplaceRetire: spec("tooltip.cratesReplaceRetire"),
    cratesReplaceCancel: spec("tooltip.cratesReplaceCancel"),
    cratesReplaceConfirm: spec("tooltip.cratesReplaceConfirm"),
    relink: spec("tooltip.relink"),
    relinkRoot: spec("tooltip.relinkRoot"),
    relinkFind: spec("tooltip.relinkFind"),
    relinkAcceptHigh: spec("tooltip.relinkAcceptHigh"),
    relinkConfirm: spec("tooltip.relinkConfirm"),
    relinkCancel: spec("tooltip.relinkCancel"),
    relinkInclude: spec("tooltip.relinkInclude"),
    relinkPick: spec("tooltip.relinkPick"),
    crateNew: spec("tooltip.crateNew"),
    crateRename: spec("tooltip.crateRename"),
    crateSplit: spec("tooltip.crateSplit"),
    crateSaveView: spec("tooltip.crateSaveView"),
    cratePromptName: spec("tooltip.cratePromptName"),
    cratePromptCancel: spec("tooltip.cratePromptCancel"),
    cratePromptConfirm: spec("tooltip.cratePromptConfirm"),
    crateColor: spec("tooltip.crateColor"),
    crateDelete: spec("tooltip.crateDelete"),
    cratePreset: spec("tooltip.cratePreset"),
    crateFolderSync: spec("tooltip.crateFolderSync"),
    crateRenameFromTags: spec("tooltip.crateRenameFromTags"),
    crateRefresh: spec("tooltip.crateRefresh"),
    folderSyncPath: spec("tooltip.folderSyncPath"),
    folderSyncSubcrates: spec("tooltip.folderSyncSubcrates"),
    folderSyncFull: spec("tooltip.folderSyncFull"),
    folderSyncCancel: spec("tooltip.folderSyncCancel"),
    folderSyncRun: spec("tooltip.folderSyncRun"),
    presetKind: spec("tooltip.presetKind"),
    presetKey: spec("tooltip.presetKey"),
    presetBpm: spec("tooltip.presetBpm"),
    presetRange: spec("tooltip.presetRange"),
    presetMonths: spec("tooltip.presetMonths"),
    presetScope: spec("tooltip.presetScope"),
    presetName: spec("tooltip.presetName"),
    presetCancel: spec("tooltip.presetCancel"),
    presetCreate: spec("tooltip.presetCreate"),
    shortcuts: spec("tooltip.shortcuts"),
    drawerToggle: spec("tooltip.drawerToggle"),
    playColumn: spec("tooltip.playColumn"),
    columnMenu: spec("tooltip.columnMenu"),
    columnResize: spec("tooltip.columnResize"),
    gridCell: spec("tooltip.gridCell"),
    gridPagination: spec("tooltip.gridPagination"),
    help: spec("tooltip.help"),
    helpBug: spec("tooltip.helpBug"),
    helpFeature: spec("tooltip.helpFeature"),
    helpGithub: spec("tooltip.helpGithub"),
    helpReleases: spec("tooltip.helpReleases"),
    helpClose: spec("tooltip.helpClose"),
    helpHappened: spec("tooltip.helpHappened"),
    helpExpected: spec("tooltip.helpExpected"),
    helpNames: spec("tooltip.helpNames"),
    helpCopyLog: spec("tooltip.helpCopyLog"),
    helpOpen: spec("tooltip.helpOpen"),
    helpReport: spec("tooltip.helpReport"),
    settings: spec("tooltip.settings"),
    search: spec("tooltip.search"),
    searchField: spec("tooltip.searchField"),
    exportM3u: spec("tooltip.exportM3u"),
    exportRekordbox: spec("tooltip.exportRekordbox"),
    memoryCues: spec("tooltip.memoryCues"),
    hotLoops: spec("tooltip.hotLoops"),
    rekordboxKey: spec("tooltip.rekordboxKey"),
    importM3u: spec("tooltip.importM3u"),
    importFile: spec("tooltip.importFile"),
    reload: spec("tooltip.reload"),
    filesUp: spec("tooltip.filesUp"),
    filesSearch: spec("tooltip.filesSearch"),
    filesRefresh: spec("tooltip.filesRefresh"),
    filesElsewhere: spec("tooltip.filesElsewhere"),
    filesMusicFolders: spec("tooltip.filesMusicFolders"),
    filesRename: spec("tooltip.filesRename"),
    filesRenameFromTags: spec("tooltip.filesRenameFromTags"),
    filesMove: spec("tooltip.filesMove"),
    filesMoveFolder: spec("tooltip.filesMoveFolder"),
    filesReplace: spec("tooltip.filesReplace"),
    filesDelete: spec("tooltip.filesDelete"),
    filesMoveHere: spec("tooltip.filesMoveHere"),
    filesPickCancel: spec("tooltip.filesPickCancel"),
    operationsRefresh: spec("tooltip.operationsRefresh"),
    operationsList: spec("tooltip.operationsList"),
    operationsRetry: spec("tooltip.operationsRetry"),
    snapshotsRefresh: spec("tooltip.snapshotsRefresh"),
    snapshotsTake: spec("tooltip.snapshotsTake"),
    backupDrives: spec("tooltip.backupDrives"),
    snapshotsUndo: spec("tooltip.snapshotsUndo"),
    consentDecline: spec("tooltip.consentDecline"),
    consentAccept: spec("tooltip.consentAccept"),
    telemetry: spec("tooltip.telemetry"),
    copyVersion: spec("tooltip.copyVersion"),
    rerunWizard: spec("tooltip.rerunWizard"),
    openLogs: spec("tooltip.openLogs"),
    copyLogs: spec("tooltip.copyLogs"),
    settingsClose: spec("tooltip.settingsClose"),
    logFallback: spec("tooltip.logFallback"),
    mergeTrash: spec("tooltip.mergeTrash"),
    mergeCancel: spec("tooltip.mergeCancel"),
    mergeConfirm: spec("tooltip.mergeConfirm"),
    mergeConfirmTrash: spec("tooltip.mergeConfirmTrash"),
    merging: spec("tooltip.merging"),
    rekordboxCancel: spec("tooltip.rekordboxCancel"),
    rekordboxDownload: spec("tooltip.rekordboxDownload"),
    filesName: spec("tooltip.filesName"),
    filesReplacement: spec("tooltip.filesReplacement"),
    filesCancel: spec("tooltip.filesCancel"),
    filesReview: spec("tooltip.filesReview"),
    filesConfirm: spec("tooltip.filesConfirm"),
    filesMoveTrash: spec("tooltip.filesMoveTrash"),
    shortcutsClose: spec("tooltip.shortcutsClose"),
    quickOpen: spec("tooltip.quickOpen"),
    quickOpenRetry: spec("tooltip.quickOpenRetry"),
    quickOpenClose: spec("tooltip.quickOpenClose"),
    snapshotCancel: spec("tooltip.snapshotCancel"),
    snapshotConfirm: spec("tooltip.snapshotConfirm"),
    wizardFolderUp: spec("tooltip.wizardFolderUp"),
    wizardFolderUse: spec("tooltip.wizardFolderUse"),
    wizardFolderClose: spec("tooltip.wizardFolderClose"),
    wizardNo: spec("tooltip.wizardNo"),
    wizardYes: spec("tooltip.wizardYes"),
    wizardUpdatesNo: spec("tooltip.wizardUpdatesNo"),
    wizardUpdatesYes: spec("tooltip.wizardUpdatesYes"),
    updateToggle: spec("tooltip.updateToggle"),
    updatePrereleases: spec("tooltip.updatePrereleases"),
    updateDownload: spec("tooltip.updateDownload"),
    updateSkip: spec("tooltip.updateSkip"),
    updateDismiss: spec("tooltip.updateDismiss"),
    wizardBack: spec("tooltip.wizardBack"),
    wizardCancel: spec("tooltip.wizardCancel"),
    wizardSecondary: spec("tooltip.wizardSecondary"),
    trackList: spec("tooltip.trackList"),
    filesList: spec("tooltip.filesList"),
    portableClose: spec("tooltip.portableClose"),
    snapshotsList: spec("tooltip.snapshotsList"),
    splitter: spec("tooltip.splitter"),
    previous: spec("tooltip.previous"),
    next: spec("tooltip.next"),
    seek: spec("tooltip.seek"),
    volume: spec("tooltip.volume"),
    zoomIn: spec("tooltip.zoomIn"),
    zoomOut: spec("tooltip.zoomOut"),
    overview: spec("tooltip.overview"),
    smartRules: spec("tooltip.smartRules"),
    saveRules: spec("tooltip.saveRules"),
    saveTrack: spec("tooltip.saveTrack"),
    trackColor: spec("tooltip.trackColor"),
    trackRating: spec("tooltip.trackRating"),
    beatgridLock: spec("tooltip.beatgridLock"),
    relocate: spec("tooltip.relocate"),
    removeTrack: spec("tooltip.removeTrack"),
    prepareAdd: spec("tooltip.prepareAdd"),
    prepareRemove: spec("tooltip.prepareRemove"),
    updateRelated: spec("tooltip.updateRelated"),
    findRelated: spec("tooltip.findRelated"),
    linkNote: spec("tooltip.linkNote"),
    linkRating: spec("tooltip.linkRating"),
    language: spec("tooltip.language"),
    colorway: spec("tooltip.colorway"),
    iconFollowsTheme: spec("tooltip.iconFollowsTheme"),
    libraryGeneration: spec("tooltip.libraryGeneration"),
    linkMutual: spec("tooltip.linkMutual"),
    saveLink: spec("tooltip.saveLink"),
    showSearchCopies: spec("tooltip.showSearchCopies"),
    hideSearchCopies: spec("tooltip.hideSearchCopies"),
    openInLibrary: spec("tooltip.openInLibrary"),
    runSetup: spec("tooltip.runSetup"),
    snapshotsRetry: spec("tooltip.snapshotsRetry"),
    reviewRestore: spec("tooltip.reviewRestore"),
    allTracks: spec("tooltip.allTracks"),
    navLibrary: spec("tooltip.navLibrary"),
    navHealth: spec("tooltip.navHealth"),
    navGig: spec("tooltip.navGig"),
    viewCrates: spec("tooltip.viewCrates"),
    viewHistory: spec("tooltip.viewHistory"),
    viewStats: spec("tooltip.viewStats"),
    statsRefresh: spec("tooltip.statsRefresh"),
    statsCsv: spec("tooltip.statsCsv"),
    statsPeriod: spec("tooltip.statsPeriod"),
    statsFrom: spec("tooltip.statsFrom"),
    statsTo: spec("tooltip.statsTo"),
    statsIdleDays: spec("tooltip.statsIdleDays"),
    statsIdleCrate: spec("tooltip.statsIdleCrate"),
    viewMissing: spec("tooltip.viewMissing"),
    viewDuplicates: spec("tooltip.viewDuplicates"),
    viewStems: spec("tooltip.viewStems"),
    viewFiles: spec("tooltip.viewFiles"),
    viewSnapshots: spec("tooltip.viewSnapshots"),
    viewGig: spec("tooltip.viewGig"),
    viewPortable: spec("tooltip.viewPortable"),
    viewDrift: spec("tooltip.viewDrift"),
    portableDrive: spec("tooltip.portableDrive"),
    portableRun: spec("tooltip.portableRun"),
    driftRefresh: spec("tooltip.driftRefresh"),
    viewHealth: spec("tooltip.viewHealth"),
    viewScan: spec("tooltip.viewScan"),
    viewBitrate: spec("tooltip.viewBitrate"),
    viewTags: spec("tooltip.viewTags"),
    healthRefresh: spec("tooltip.healthRefresh"),
    healthOpenMissing: spec("tooltip.healthOpenMissing"),
    healthOpenDuplicates: spec("tooltip.healthOpenDuplicates"),
    healthOpenFiles: spec("tooltip.healthOpenFiles"),
    healthOpenBitrate: spec("tooltip.healthOpenBitrate"),
    healthTrack: spec("tooltip.healthTrack"),
    healthFindArt: spec("tooltip.healthFindArt"),
    healthArtCancel: spec("tooltip.healthArtCancel"),
    healthArtEmbed: spec("tooltip.healthArtEmbed"),
    healthArtPick: spec("tooltip.healthArtPick"),
    tagsGenre: spec("tooltip.tagsGenre"),
    tagsArtist: spec("tooltip.tagsArtist"),
    tagsTitles: spec("tooltip.tagsTitles"),
    tagsRefresh: spec("tooltip.tagsRefresh"),
    tagsPreview: spec("tooltip.tagsPreview"),
    tagsApply: spec("tooltip.tagsApply"),
    tagsApplyTitles: spec("tooltip.tagsApplyTitles"),
    tagsApplyMappings: spec("tooltip.tagsApplyMappings"),
    tagsGroup: spec("tooltip.tagsGroup"),
    tagsSpelling: spec("tooltip.tagsSpelling"),
    gigRefresh: spec("tooltip.gigRefresh"),
    scanQuick: spec("tooltip.scanQuick"),
    scanFull: spec("tooltip.scanFull"),
    bitrateRefresh: spec("tooltip.bitrateRefresh"),
    bitrateSave: spec("tooltip.bitrateSave"),
    bitrateConfirm: spec("tooltip.bitrateConfirm"),
    gigBack: spec("tooltip.gigBack"),
    gigNext: spec("tooltip.gigNext"),
    gigExit: spec("tooltip.gigExit"),
    gigShowAll: spec("tooltip.gigShowAll"),
    sortTitle: spec("tooltip.sortTitle"),
    sortArtist: spec("tooltip.sortArtist"),
    sortBpm: spec("tooltip.sortBpm"),
    sortKey: spec("tooltip.sortKey"),
    sortLength: spec("tooltip.sortLength"),
    sortDeck: spec("tooltip.sortDeck"),
    sortPlayed: spec("tooltip.sortPlayed"),
    sortStart: spec("tooltip.sortStart"),
    sortOrder: spec("tooltip.sortOrder"),
    sortCrateName: spec("tooltip.sortCrateName"),
    sortAdded: spec("tooltip.sortAdded")
  }, WIZARD = {
    "get-started": "tooltip.wizard.getStarted",
    looking: "tooltip.wizard.looking",
    "use-library": "tooltip.wizard.useLibrary",
    "check-again": "tooltip.wizard.checkAgain",
    "take-snapshot": "tooltip.wizard.takeSnapshot",
    "try-again": "tooltip.wizard.tryAgain",
    continue: "tooltip.wizard.continue",
    "open-library": "tooltip.wizard.openLibrary",
    none: "tooltip.wizard.none"
  };
  function wizardPrimaryTip(action, saving) {
    return spec(saving ? "tooltip.wizard.saving" : WIZARD[action]);
  }
  function wizardFolder(name) {
    return spec("tooltip.wizardFolder", { name });
  }

  // src/lib/ui/tooltip.ts
  var TOOLTIP_ID = "app-tooltip";
  var INTERACTIVE_SELECTOR = [
    "button",
    "input:not([type='hidden'])",
    "select",
    "textarea",
    "a[href]",
    "summary",
    "[role='slider']",
    "[role='button']",
    "[role='tab']",
    "[role='menuitem']",
    "[role='menuitemcheckbox']",
    "[role='menuitemradio']",
    "[role='switch']",
    "[role='option']",
    "[role='separator']",
    "[role='checkbox']",
    "[role='radio']",
    "[tabindex]:not([tabindex='-1'])"
  ].join(",");
  var current = null;
  var tipParams = /* @__PURE__ */ new WeakMap();
  function writeTooltip(element) {
    let key = element.dataset.tooltipKey ?? "";
    if (!hasKey(key)) throw new Error(`Unknown tooltip key ${key}.`);
    let value = t(key, tipParams.get(element)).trim();
    if (!value) throw new Error("A control tooltip cannot be empty.");
    element.dataset.tooltip = value;
  }
  function syncOpenTooltip() {
    if (!current) return;
    let tip = document.getElementById(TOOLTIP_ID);
    tip instanceof HTMLElement && (tip.textContent = current.dataset.tooltip ?? "");
  }
  function setTooltip(element, spec2) {
    element.dataset.tooltipKey = spec2.key, spec2.params ? tipParams.set(element, spec2.params) : tipParams.delete(element), writeTooltip(element), element.removeAttribute("title"), current === element && syncOpenTooltip();
  }

  // src/pages/WizardScreen.tsx
  var import_jsx_runtime2 = __toESM(require_jsx_runtime(), 1), LABELS = {
    "get-started": "wizard.action.getStarted",
    looking: "wizard.action.looking",
    "use-library": "wizard.action.useLibrary",
    "check-again": "wizard.action.checkAgain",
    "take-snapshot": "wizard.action.takeSnapshot",
    "try-again": "wizard.action.tryAgain",
    continue: "wizard.action.continue",
    "open-library": "wizard.action.openLibrary"
  }, HEADINGS = {
    welcome: "wizard.heading.welcome",
    library: "wizard.heading.library",
    snapshot: "wizard.heading.snapshot",
    consent: "wizard.heading.consent",
    updates: "wizard.heading.updates",
    done: "wizard.done"
  }, ART = {
    welcome: '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160" aria-hidden="true" focusable="false"><rect x="20" y="70" width="120" height="70" rx="12" fill="var(--illus-surface, currentColor)" stroke="var(--illus-ink, currentColor)" stroke-width="4"/><circle cx="58" cy="62" r="34" fill="var(--illus-primary, currentColor)"/><circle cx="58" cy="62" r="8" fill="var(--illus-surface, currentColor)"/><circle cx="104" cy="66" r="30" fill="var(--illus-accent, var(--illus-primary, currentColor))"/><circle cx="104" cy="66" r="7" fill="var(--illus-surface, currentColor)"/><rect x="20" y="88" width="120" height="52" rx="12" fill="var(--illus-surface, currentColor)" stroke="var(--illus-ink, currentColor)" stroke-width="4"/><path d="M60 112 h40" stroke="var(--illus-ink, currentColor)" stroke-width="6" stroke-linecap="round"/></svg>',
    library: '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160" aria-hidden="true" focusable="false"><path d="M20 50 h44 l10 12 h66 v76 h-120 Z" fill="var(--illus-surface, currentColor)" stroke="var(--illus-ink, currentColor)" stroke-width="4" stroke-linejoin="round"/><circle cx="76" cy="98" r="26" fill="var(--illus-primary, currentColor)"/><circle cx="76" cy="98" r="7" fill="var(--illus-surface, currentColor)"/><circle cx="112" cy="108" r="20" fill="none" stroke="var(--illus-ink, currentColor)" stroke-width="7"/><path d="M126 122 l18 18" stroke="var(--illus-ink, currentColor)" stroke-width="9" stroke-linecap="round"/></svg>',
    snapshot: '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160" aria-hidden="true" focusable="false"><path d="M80 18 L136 40 v40 c0 34 -24 56 -56 66 c-32 -10 -56 -32 -56 -66 v-40 Z" fill="var(--illus-surface, currentColor)" stroke="var(--illus-ink, currentColor)" stroke-width="4" stroke-linejoin="round"/><circle cx="80" cy="78" r="30" fill="var(--illus-primary, currentColor)"/><circle cx="80" cy="78" r="8" fill="var(--illus-surface, currentColor)"/><path d="M62 118 l12 12 l26 -26" fill="none" stroke="var(--illus-accent, var(--illus-primary, currentColor))" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    consent: '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160" aria-hidden="true" focusable="false"><rect x="34" y="20" width="92" height="120" rx="10" fill="var(--illus-surface, currentColor)" stroke="var(--illus-ink, currentColor)" stroke-width="4"/><path d="M50 46 h60 M50 64 h60 M50 82 h40" stroke="var(--illus-ink, currentColor)" stroke-width="5" stroke-linecap="round" opacity=".6"/><rect x="50" y="100" width="22" height="22" rx="5" fill="var(--illus-primary, currentColor)"/><path d="M55 111 l5 5 l9 -10" fill="none" stroke="var(--illus-surface, currentColor)" stroke-width="4" stroke-linecap="round"/><path d="M80 112 h30" stroke="var(--illus-ink, currentColor)" stroke-width="5" stroke-linecap="round"/></svg>',
    done: '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160" aria-hidden="true" focusable="false"><circle cx="80" cy="80" r="60" fill="var(--illus-primary, currentColor)"/><circle cx="80" cy="80" r="42" fill="none" stroke="var(--illus-surface, currentColor)" stroke-width="3" opacity=".5"/><path d="M52 82 l18 18 l38 -40" fill="none" stroke="var(--illus-surface, currentColor)" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/><circle cx="138" cy="26" r="6" fill="var(--illus-accent, var(--illus-primary, currentColor))"/><circle cx="22" cy="40" r="5" fill="var(--illus-accent, var(--illus-primary, currentColor))"/><circle cx="140" cy="132" r="4" fill="var(--illus-ink, currentColor)"/></svg>'
  };
  function tooltipRef(spec2) {
    return (element) => {
      element && setTooltip(element, spec2);
    };
  }
  function useLocaleTick() {
    let [, setLocale] = (0, import_react2.useState)(getLocale);
    (0, import_react2.useEffect)(() => onLocaleChange(setLocale), []);
  }
  function bodyText(model2, summary2) {
    switch (model2.step) {
      case "welcome":
        return t("wizard.welcomeBody");
      case "library":
        return model2.context.library === "pending" ? t("wizard.looking") : summary2 || t("wizard.looking");
      case "snapshot":
        return t("wizard.snapshotBody");
      case "consent":
        return t("consent.body");
      case "updates":
        return t("wizard.updatesBody");
      case "done":
        return "";
      default:
        return "";
    }
  }
  function statusFor(model2, statusNote2) {
    return snapshotBlocked(model2) ? { text: t("wizard.blocked"), kind: "blocked" } : model2.step === "snapshot" && model2.context.snapshot === "saved" ? { text: t("wizard.copySaved"), kind: "saved" } : model2.step === "snapshot" && model2.context.snapshot === "saving" ? { text: t("wizard.savingLibraryCopy"), kind: "" } : statusNote2 ? { text: statusNote2, kind: "" } : { text: "", kind: "" };
  }
  function WizardScreen() {
    useLocaleTick();
    let wizard = useWizard(), {
      model: model2,
      busy: busy2,
      folderOpen: folderOpen2,
      folderName: folderName2,
      folderParent: folderParent2,
      folders: folders2,
      summary: summary2,
      nextHint,
      statusNote: statusNote2,
      focusToken: focusToken2
    } = wizard, titleRef = (0, import_react2.useRef)(null), [announcement, setAnnouncement] = (0, import_react2.useState)("");
    (0, import_react2.useEffect)(() => {
      focusToken2 !== 0 && (setAnnouncement(stepAnnouncement(model2)), titleRef.current?.focus());
    }, [focusToken2]);
    let position = stepPosition(model2), body = bodyText(model2, summary2), hintText = nextHint, showHint = model2.step === "library" && model2.context.library !== "found" && hintText.length > 0, status = statusFor(model2, statusNote2), action = primaryAction(model2), saving = model2.step === "snapshot" && model2.context.snapshot === "saving", saved = model2.step === "snapshot" && model2.context.snapshot === "saved", primaryLabel = saving ? t("wizard.savingCopy") : action === "none" ? "" : t(LABELS[action]), segments = Array.from({ length: position.count }, (_, offset) => {
      let index = offset + 1, state = index < position.index ? "done" : index === position.index ? "current" : "upcoming";
      return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "wizard-segment", "data-state": state }, index);
    });
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("p", { id: "wizard-step", className: "wizard-step", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { id: "wizard-step-label", children: t("wizard.stepOf", { index: position.index, count: position.count }) }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { id: "wizard-segments", className: "wizard-segments", "aria-hidden": "true", children: segments })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { id: "wizard-announce", className: "visually-hidden", "aria-live": "polite", children: announcement }),
      ["welcome", "library", "snapshot", "consent", "done"].map((slot) => {
        let svg = ART[slot], current2 = slot === model2.step && svg !== void 0;
        return svg === void 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "wizard-art", "data-art-slot": slot, hidden: !0 }, slot) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          "div",
          {
            className: "wizard-art",
            "data-art-slot": slot,
            hidden: !current2,
            dangerouslySetInnerHTML: { __html: svg }
          },
          slot
        );
      }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h2", { id: "wizard-title", tabIndex: -1, ref: titleRef, children: t(HEADINGS[model2.step]) }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { id: "wizard-body", hidden: body.length === 0, children: body }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { id: "wizard-next", className: "dialog-note", hidden: !showHint, children: showHint ? hintText : "" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        "p",
        {
          id: "wizard-status",
          className: status.kind ? `wizard-status is-${status.kind}` : "wizard-status",
          role: "status",
          "aria-live": "polite",
          hidden: status.text.length === 0,
          children: status.text
        }
      ),
      saving ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("progress", { id: "wizard-progress", max: 1, "aria-label": t("wizard.progressLabel") }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        "progress",
        {
          id: "wizard-progress",
          max: 1,
          value: saved ? 1 : 0,
          hidden: !saved,
          "aria-label": t("wizard.progressLabel")
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { id: "wizard-folders", hidden: !(folderOpen2 && model2.step === "library"), children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { id: "wizard-folder-name", className: "wizard-folder-name", children: folderName2 }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          "div",
          {
            id: "wizard-folder-list",
            className: "wizard-folders",
            role: "group",
            "aria-label": t("wizard.folders"),
            children: folders2.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "wizard-folder-empty", children: t("wizard.noSubfolders") }) : folders2.map((folder) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
              "button",
              {
                type: "button",
                className: "wizard-folder",
                ref: tooltipRef(wizardFolder(folder.name)),
                onClick: () => wizard.onBrowse(folder.path),
                children: folder.name
              },
              folder.path
            ))
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "wizard-folder-actions", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            "button",
            {
              id: "wizard-folder-up",
              className: "wizard-quiet",
              type: "button",
              ref: tooltipRef(tips.wizardFolderUp),
              disabled: folderParent2 === null,
              onClick: () => wizard.onFolderUp(),
              children: t("common.up")
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            "button",
            {
              id: "wizard-folder-use",
              type: "button",
              ref: tooltipRef(tips.wizardFolderUse),
              disabled: busy2,
              onClick: () => wizard.onFolderUse(),
              children: t("wizard.useFolder")
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            "button",
            {
              id: "wizard-folder-close",
              className: "wizard-quiet",
              type: "button",
              ref: tooltipRef(tips.wizardFolderClose),
              onClick: () => wizard.onFolderClose(),
              children: t("wizard.closeFolders")
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { id: "wizard-consent", className: "wizard-choices", hidden: model2.step !== "consent", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          "button",
          {
            id: "wizard-no",
            className: "wizard-choice",
            type: "button",
            ref: tooltipRef(tips.wizardNo),
            disabled: busy2,
            onClick: () => wizard.onConsent(!1),
            children: t("wizard.no")
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          "button",
          {
            id: "wizard-yes",
            className: "wizard-choice",
            type: "button",
            ref: tooltipRef(tips.wizardYes),
            disabled: busy2,
            onClick: () => wizard.onConsent(!0),
            children: t("wizard.yes")
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { id: "wizard-updates", className: "wizard-choices", hidden: model2.step !== "updates", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          "button",
          {
            id: "wizard-updates-no",
            className: "wizard-choice",
            type: "button",
            ref: tooltipRef(tips.wizardUpdatesNo),
            disabled: busy2,
            onClick: () => wizard.onUpdates(!1),
            children: t("wizard.updatesNo")
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          "button",
          {
            id: "wizard-updates-yes",
            className: "wizard-choice",
            type: "button",
            ref: tooltipRef(tips.wizardUpdatesYes),
            disabled: busy2,
            onClick: () => wizard.onUpdates(!0),
            children: t("wizard.updatesYes")
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "wizard-actions", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "wizard-actions-start", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            "button",
            {
              id: "wizard-back",
              className: "wizard-quiet",
              type: "button",
              ref: tooltipRef(tips.wizardBack),
              hidden: !canGoBack(model2),
              disabled: busy2,
              onClick: () => wizard.onBack(),
              children: t("common.back")
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            "button",
            {
              id: "wizard-cancel",
              className: "wizard-quiet",
              type: "button",
              ref: tooltipRef(tips.wizardCancel),
              onClick: () => wizard.onCancel(),
              children: t("common.cancel")
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            "button",
            {
              id: "wizard-secondary",
              className: "wizard-quiet",
              type: "button",
              ref: tooltipRef(tips.wizardSecondary),
              hidden: model2.step !== "library",
              disabled: busy2,
              onClick: () => wizard.onChooseFolder(),
              children: t("wizard.chooseFolder")
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          "button",
          {
            id: "wizard-primary",
            type: "button",
            ref: tooltipRef(wizardPrimaryTip(action, saving)),
            hidden: action === "none",
            disabled: busy2 || !primaryEnabled(model2),
            onClick: () => wizard.onPrimary(),
            children: primaryLabel
          }
        )
      ] })
    ] });
  }

  // src/wizard-view.ts
  var wired = !1, starting = !1, generation = 0, busy = !1, model = createWizard({
    needsConsent: !0,
    library: "pending",
    seratoRunning: !1
  }), options = {}, summary = null, nextText = null, statusNote = null, folderOpen = !1, folderPath = "", folderParent = null, folderName = "", folders = [], pollTimer = 0, polling = !1, focusToken = 0, reactHost = null, reactRoot = null, noteKey = (key) => () => t(key), noteText = (value) => () => value;
  function open(next = {}) {
    wire(), !(starting || wizardDialog().open && !next.force) && (options = next, starting = !0, begin(next).finally(() => {
      starting = !1;
    }));
  }
  function wire() {
    wired || (wired = !0, onLocaleChange(() => {
      wizardDialog().open && paint(!1);
    }), wizardDialog().addEventListener("cancel", (event) => {
      if (event.preventDefault(), folderOpen) {
        closeFolders();
        return;
      }
      cancel();
    }));
  }
  async function begin(next) {
    generation += 1;
    let token = generation;
    stopPoll(), folderOpen = !1, folderPath = "", folderParent = null, folderName = "", folders = [], statusNote = null, busy = !1;
    let settings = await loadSettings();
    if (token !== generation || settings.wizard_complete && !next.force) return;
    let needsUpdates = await updateChoiceMissing();
    if (token !== generation) return;
    let setup = await loadSetup();
    if (token !== generation) return;
    summary = setup ? noteText(setup.summary) : noteKey("wizard.lookFailed"), nextText = setup ? noteText(setup.next) : noteKey("wizard.chooseCheckAgain"), setup && publishStatus(setup);
    let library = setup === null ? "error" : setup.found ? "found" : "missing";
    model = createWizard({
      needsConsent: settings.needs_consent_prompt,
      library,
      seratoRunning: setup?.seratoRunning ?? !1,
      needsUpdates
    }), paint(!0);
    let dialog = wizardDialog();
    dialog.open || dialog.showModal(), ensurePoll();
  }
  function onBack() {
    !canGoBack(model) || busy || (folderOpen = !1, statusNote = null, model = reduceWizard(model, { type: "back" }), paint(!0), ensurePoll());
  }
  function cancel() {
    generation += 1, stopPoll(), folderOpen = !1, busy = !1, model = reduceWizard(model, { type: "cancel" }), closeDialog();
  }
  async function onPrimary() {
    if (busy || !primaryEnabled(model)) return;
    let action = primaryAction(model);
    if (action === "get-started" || action === "use-library" || action === "continue") {
      folderOpen = !1, statusNote = null, model = reduceWizard(model, { type: "next" }), paint(!0), ensurePoll(), model.step === "snapshot" && refreshSerato();
      return;
    }
    if (action === "check-again") {
      await recheck();
      return;
    }
    if (action === "take-snapshot" || action === "try-again") {
      await takeSnapshot();
      return;
    }
    action === "open-library" && await finish();
  }
  async function recheck() {
    let token = generation;
    busy = !0, statusNote = null, paint(!1);
    let setup = await loadSetup();
    token === generation && (busy = !1, setup === null ? (summary = noteKey("wizard.lookFailed"), nextText = noteKey("wizard.chooseCheckAgain"), model = reduceWizard(model, { type: "library", status: "error" })) : (summary = noteText(setup.summary), nextText = noteText(setup.next), publishStatus(setup), model = reduceWizard(model, { type: "serato", running: setup.seratoRunning }), model = reduceWizard(model, { type: "library", status: setup.found ? "found" : "missing" })), paint(!1));
  }
  async function takeSnapshot() {
    if (snapshotBlocked(model)) return;
    let token = generation;
    busy = !0, statusNote = null, model = reduceWizard(model, { type: "snapshot", phase: "saving" }), paint(!1);
    try {
      if (await postJSON("/api/snapshots", { action: "create" }, 600 * 1e3), token !== generation) return;
      model = reduceWizard(model, { type: "snapshot", phase: "saved" });
    } catch {
      if (token !== generation) return;
      model = reduceWizard(model, { type: "snapshot", phase: "error" }), statusNote = noteKey("wizard.snapshotFailed");
    } finally {
      token === generation && (busy = !1, paint(!1));
    }
  }
  async function chooseConsent(value) {
    if (busy || model.step !== "consent") return;
    let token = generation;
    busy = !0, statusNote = noteKey("wizard.saving"), paint(!1);
    try {
      let payload = await postJSON("/api/settings", { telemetry_consent: value }, 15e3);
      if (token !== generation) return;
      let settings = readSettings(payload);
      settings && options.onSettings?.(settings), busy = !1, statusNote = null, model = reduceWizard(model, { type: "consent", value }), paint(!0);
    } catch {
      if (token !== generation) return;
      busy = !1, statusNote = noteKey("wizard.consentFailed"), paint(!1);
    }
  }
  var UPDATE_CHOICE_EVENT = "serato-update-choice";
  async function chooseUpdates(value) {
    if (busy || model.step !== "updates") return;
    let token = generation;
    busy = !0, statusNote = noteKey("wizard.saving"), paint(!1);
    try {
      if (await postJSON("/api/update", { enabled: value }, 15e3), token !== generation) return;
      busy = !1, statusNote = null, model = reduceWizard(model, { type: "updates", value }), window.dispatchEvent(new CustomEvent(UPDATE_CHOICE_EVENT, { detail: { enabled: value } })), paint(!0);
    } catch {
      if (token !== generation) return;
      busy = !1, statusNote = noteKey("wizard.updatesFailed"), paint(!1);
    }
  }
  async function updateChoiceMissing() {
    try {
      let payload = await getJSON("/api/update", 15e3);
      return isRecord(payload) && payload.enabled === null;
    } catch {
      return !1;
    }
  }
  async function finish() {
    let token = generation;
    busy = !0, statusNote = noteKey("wizard.opening"), paint(!1);
    try {
      let payload = await postJSON("/api/settings", { wizard_complete: !0 }, 15e3);
      if (token !== generation) return;
      let settings = readSettings(payload);
      settings && options.onSettings?.(settings), model = reduceWizard(model, { type: "finish" }), closeDialog();
    } catch (error) {
      if (token !== generation) return;
      statusNote = error instanceof Error ? noteText(error.message) : noteKey("wizard.finishFailed"), busy = !1, paint(!1);
    }
  }
  async function showFolders() {
    folderOpen = !0, paint(!1), await browse(folderPath);
  }
  function closeFolders() {
    folderOpen = !1, paint(!1);
    let secondary = document.getElementById("wizard-secondary");
    secondary instanceof HTMLButtonElement && secondary.focus();
  }
  async function browse(path) {
    let token = generation;
    try {
      let query = path ? `?browse=${encodeURIComponent(path)}` : "?browse=", payload = await getJSON(`/api/setup${query}`, 15e3);
      if (token !== generation) return;
      let listing = readBrowse(payload);
      if (!listing) {
        statusNote = noteKey("error.folder_unreadable"), paint(!1);
        return;
      }
      folderPath = listing.path, folderParent = listing.parent, folderName = listing.name, folders = listing.folders.slice(), paint(!1);
    } catch {
      if (token !== generation) return;
      statusNote = noteKey("error.folder_unreadable"), paint(!1);
    }
  }
  async function useFolder() {
    if (!folderPath || busy) return;
    let token = generation;
    busy = !0, paint(!1);
    try {
      let payload = await postJSON("/api/setup", { folder: folderPath }, 15e3);
      if (token !== generation) return;
      let setup = readSetup(payload);
      if (!setup) {
        statusNote = noteKey("error.folder_unreadable");
        return;
      }
      summary = noteText(setup.summary), nextText = noteText(setup.next), publishStatus(setup), model = reduceWizard(model, { type: "serato", running: setup.seratoRunning }), model = reduceWizard(model, { type: "library", status: setup.found ? "found" : "missing" }), setup.found && (folderOpen = !1), statusNote = null;
    } catch (error) {
      if (token !== generation) return;
      statusNote = error instanceof Error ? noteText(error.message) : noteKey("error.folder_unreadable");
    } finally {
      if (token === generation && (busy = !1, paint(!1), model.context.library === "found")) {
        let primary = document.getElementById("wizard-primary");
        primary instanceof HTMLButtonElement && primary.focus();
      }
    }
  }
  function readValue() {
    return {
      ...idleWizardValue(),
      model,
      busy,
      folderOpen,
      folderName,
      folderParent,
      folders,
      summary: summary ? summary() : "",
      nextHint: nextText ? nextText() : "",
      statusNote: statusNote ? statusNote() : "",
      focusToken,
      onPrimary: () => {
        onPrimary();
      },
      onBack,
      onCancel: cancel,
      onChooseFolder: () => {
        showFolders();
      },
      onConsent: (value) => {
        chooseConsent(value);
      },
      onUpdates: (value) => {
        chooseUpdates(value);
      },
      onFolderUp: () => {
        folderParent && browse(folderParent);
      },
      onFolderUse: () => {
        useFolder();
      },
      onFolderClose: closeFolders,
      onBrowse: (path) => {
        browse(path);
      }
    };
  }
  function paint(moveFocus) {
    moveFocus && (focusToken += 1), (0, import_react_dom.flushSync)(() => {
      wizardRoot().render(
        (0, import_react3.createElement)(WizardProvider, {
          value: readValue(),
          children: (0, import_react3.createElement)(WizardScreen)
        })
      );
    });
  }
  function wizardRoot() {
    let dialog = wizardDialog();
    return reactRoot && reactHost === dialog || (reactRoot?.unmount(), reactHost = dialog, reactRoot = (0, import_client.createRoot)(dialog)), reactRoot;
  }
  function publishStatus(setup) {
    setup.statusMessage.length !== 0 && options.onStatus?.({
      message: setup.statusMessage,
      writable: setup.statusWritable,
      open: setup.seratoRunning,
      serato_running: setup.seratoRunning,
      process: setup.seratoRunning ? "Serato DJ" : null
    });
  }
  function ensurePoll() {
    stopPoll(), wizardDialog().open && (pollTimer = window.setInterval(() => {
      refreshSerato();
    }, 2e3));
  }
  async function refreshSerato() {
    if (polling) return;
    if (!wizardDialog().open) {
      stopPoll();
      return;
    }
    polling = !0;
    let token = generation;
    try {
      let setup = await loadSetup();
      if (token !== generation || !setup || (publishStatus(setup), model.step !== "snapshot" || model.context.snapshot === "saved")) return;
      let wasBlocked = snapshotBlocked(model);
      model = reduceWizard(model, { type: "serato", running: setup.seratoRunning }), snapshotBlocked(model) !== wasBlocked && paint(!1);
    } finally {
      polling = !1;
    }
  }
  function stopPoll() {
    pollTimer && window.clearInterval(pollTimer), pollTimer = 0;
  }
  function closeDialog() {
    stopPoll();
    let dialog = wizardDialog();
    dialog.open && dialog.close();
    let target = options.returnFocus;
    target instanceof HTMLElement && target.isConnected && target.focus();
  }
  async function loadSettings() {
    try {
      let payload = await getJSON("/api/settings", 15e3);
      return readSettings(payload) ?? fallbackSettings();
    } catch {
      return fallbackSettings();
    }
  }
  async function loadSetup() {
    try {
      let payload = await getJSON("/api/setup", 15e3);
      return readSetup(payload);
    } catch {
      return null;
    }
  }
  function fallbackSettings() {
    return {
      telemetry_consent: null,
      needs_consent_prompt: !0,
      wizard_complete: !1,
      telemetry_configured: !1,
      app_version: ""
    };
  }
  function readSettings(value) {
    if (!isRecord(value) || typeof value.needs_consent_prompt != "boolean") return null;
    let consent = value.telemetry_consent;
    return {
      telemetry_consent: typeof consent == "boolean" ? consent : null,
      needs_consent_prompt: value.needs_consent_prompt,
      wizard_complete: value.wizard_complete === !0,
      telemetry_configured: value.telemetry_configured === !0,
      app_version: typeof value.app_version == "string" ? value.app_version : ""
    };
  }
  function readSetup(value) {
    return !isRecord(value) || typeof value.found != "boolean" || typeof value.summary != "string" ? null : {
      found: value.found,
      summary: value.summary,
      next: typeof value.next == "string" ? value.next : "",
      seratoRunning: value.serato_running === !0,
      statusMessage: typeof value.status_message == "string" ? value.status_message : "",
      statusWritable: value.status_writable === !0
    };
  }
  function readBrowse(value) {
    if (!isRecord(value) || typeof value.path != "string" || typeof value.name != "string" || !Array.isArray(value.folders)) return null;
    let folders2 = [];
    for (let entry of value.folders)
      !isRecord(entry) || typeof entry.name != "string" || typeof entry.path != "string" || folders2.push({ name: entry.name, path: entry.path });
    let parent = typeof value.parent == "string" ? value.parent : null;
    return { path: value.path, parent, name: value.name, folders: folders2 };
  }
  async function getJSON(url, timeoutMs) {
    let response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) }), payload = await response.json().catch(() => null);
    if (!response.ok) throw new Error(plainError(payload));
    return payload;
  }
  async function postJSON(url, body, timeoutMs) {
    let response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs)
    }), payload = await response.json().catch(() => null);
    if (!response.ok) throw new Error(plainError(payload));
    return payload;
  }
  function plainError(payload) {
    let raw = isRecord(payload) && typeof payload.error == "string" ? payload.error : "";
    if (!raw || raw.includes("/") || raw.includes("\\") || raw.toLowerCase().includes("sqlite"))
      return t("wizard.genericError");
    let code = isRecord(payload) && typeof payload.code == "string" ? payload.code : void 0;
    return serverMessage({ error: raw, code }, raw);
  }
  function isRecord(value) {
    return typeof value == "object" && value !== null;
  }
  function wizardDialog() {
    let node = document.getElementById("wizard");
    if (!(node instanceof HTMLDialogElement)) throw new Error("Missing wizard");
    return node;
  }
  return __toCommonJS(wizard_view_exports);
})();
//# sourceMappingURL=wizard.js.map
