//. # React Collect
//.
//. [![Build Status](https://travis-ci.com/wearereasonablepeople/react-collect.svg?branch=master)](https://travis-ci.com/wearereasonablepeople/react-collect)
//. [![Greenkeeper Enabled](https://badges.greenkeeper.io/wearereasonablepeople/react-collect.svg)](https://greenkeeper.io/)
//.
//. Allows the top of your render-tree to collect information from elements
//. in the sub-tree. Whenever the tree rerenders, the collection of information
//. is adjusted to contain only the information from the rendered elements.
//.
//. This allows to dynamically include only the Redux reducers that are
//. relevant to the current view, for example, which can have benefits for
//. performance or bundle size. It also encourages a more "componentised"
//. architecture.
//.
//. ## Usage
//.
//. ```js
//. import {collect, Collector} from 'react-collect';
//. import {render} from 'react-dom';
//. import {createStore} from 'redux';
//. import reduceReducers from 'reduce-reducers';
//.
//. const myReducer = (state, {type}) => ({...state, lastAction: type});
//. const store = createStore (x => x);
//.
//. // We pass the reducer into collect. Whenever this component is mounted,
//. // the reducer will be made available to the Collector.
//. const MyComponent = collect (myReducer) (() => (
//.   <button onClick={() => store.dispatch ({type: 'MY_ACTION'})}></button>
//. ));
//.
//. // Whenever the set of reducers changes, we swap out the active reducer.
//. const onChange = rs => store.replaceReducer (reduceReducers (rs));
//.
//. render (
//.   <Collector onChange={onChange}><MyComponent /></Collector>,
//.   document.getElementById ('app')
//. );
//. ```

import React from 'react';

var Component = React.Component;
var createElement = React.createElement;
var Context = React.createContext ();

// identity :: a -> a
export function identity(x) {
  return x;
}

// getComponentName :: ReactComponent? -> String
export function getComponentName(Component) {
  return Component == null ?
         '<Null>' :
         (Component.displayName || Component.name || '<Anonymous>');
}

export function createBaseCollectionManager(item) {

  function BaseComponent(props) {
    Component.call (this, props);
    props.collect (item);
  }

  BaseComponent.prototype = Object.create (Component.prototype);

  BaseComponent.prototype.componentWillUnmount = function() {
    this.props.uncollect (item);
  };

  return BaseComponent;

}

//. ## API
//.
//# collect :: Any? -> ReactComponent -> ReactComponent
//.
//. Decorates a component with collection capabilities. Decorated components
//. must have a [`Collector`](#Collector) as one of their ancestors.
//.
//. When given, the first argument is an item that is always automatically
//. collected whenever the component mounts, and uncollected when the component
//. unmounts.
//.
//. Alternatively, for more control, you can manually use the `collect` and
//. `uncollect` functions that are given to the decorated component as props.
//.
//. ```js
//. import {collect} from 'react-collect';
//. import {MyComponent} from './my-component';
//.
//. export default collect ({message: 'Hello!'}) (MyComponent);
//. ```
export function collect(item) {

  var BaseComponent = (item == null) ?
                      (Component) :
                      (createBaseCollectionManager (item));

  return function(UserComponent) {

    var name = getComponentName (UserComponent);

    function CollectorManager(props) {
      BaseComponent.call (this, props);
    }

    CollectorManager.prototype = Object.create (BaseComponent.prototype);

    CollectorManager.prototype.render = function() {
      return UserComponent && createElement (UserComponent, this.props);
    };

    CollectorManager.displayName = 'CollectorManager(' + name + ')';

    function Collecting(xs) {
      return createElement (Context.Consumer, {}, function(ys) {
        return createElement (CollectorManager, Object.assign ({}, xs, ys));
      });
    }

    Collecting.displayName = 'Collecting(' + name + ')';

    return Collecting;

  };
}

//# Collector :: ReactComponent
//.
//. This component wraps your tree and collects the items from all child
//. components that have been decorated with [`collect`](#collect).
//.
//. Expects a single property `onChange` - the function to call when the
//. collection has changed. The function is called with an array of distinct
//. entries.
//.
//. ```jsx
//. import {Collector} from 'react-collect';
//. import App from './my-app';
//.
//. const onChange = collection => collection.forEach (() => { /* */ });
//.
//. export default <Collector onChange={onChange}><App /></Collector>;
//. ```
export function Collector(props) {
  if (typeof props.onChange !== 'function') {
    throw new TypeError ('Collector wants an onChange prop of type function');
  }
  Component.call (this, props);
  this.toCollect = new Set ();
  this.toUncollect = new Set ();
  this.collection = new Set ();
}

Collector.prototype = Object.create (Component.prototype);

Collector.prototype.updateCollection = function() {
  var toCollect = Array.from (this.toCollect).filter (function(item) {
    return !(this.toUncollect.has (item) || this.collection.has (item));
  }, this);
  var toUncollect = Array.from (this.toUncollect).filter (function(item) {
    return !this.toCollect.has (item) && this.collection.has (item);
  }, this);
  this.toCollect = new Set ();
  this.toUncollect = new Set ();
  if (toCollect.length === 0 && toUncollect.length === 0) {
    return;
  }
  toUncollect.forEach (this.collection.delete, this.collection);
  toCollect.forEach (this.collection.add, this.collection);
  this.props.onChange (Array.from (this.collection));
};

Collector.prototype.setDirty = function() {
  clearTimeout (this.timeoutId);
  this.timeoutId = setTimeout (function(collector) {
    collector.updateCollection ();
  }, 20, this);
};

Collector.prototype.collect = function(item) {
  this.toCollect.add (item);
  this.setDirty ();
};

Collector.prototype.uncollect = function(item) {
  this.toUncollect.add (item);
  this.setDirty ();
};

Collector.prototype.componentWillUnmount = function() {
  clearTimeout (this.timeoutId);
  if (this.collection.size > 0) {
    this.props.onChange ([]);
  }
};

Collector.prototype.render = function() {
  return createElement (
    Context.Provider,
    {value: {
      collect: this.collect.bind (this),
      uncollect: this.uncollect.bind (this)
    }},
    this.props.children
  );
};
