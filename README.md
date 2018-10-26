# React Collect

[![Build Status](https://travis-ci.com/wearereasonablepeople/react-collect.svg?branch=master)](https://travis-ci.com/wearereasonablepeople/react-collect)
[![Greenkeeper Enabled](https://badges.greenkeeper.io/wearereasonablepeople/react-collect.svg)](https://greenkeeper.io/)

Allows the top of your render-tree to collect information from elements
in the sub-tree. Whenever the tree rerenders, the collection of information
is adjusted to contain only the information from the rendered elements.

This allows to dynamically include only the Redux reducers that are
relevant to the current view, for example, which can have benefits for
performance or bundle size. It also encourages a more "componentised"
architecture.

## Usage

```js
import {collect, Collector} from 'react-collect';
import {render} from 'react-dom';
import {createStore} from 'redux';
import reduceReducers from 'reduce-reducers';

const myReducer = (state, {type}) => ({...state, lastAction: type});
const store = createStore (x => x);

// We pass the reducer into collect. Whenever this component is mounted,
// the reducer will be made available to the Collector.
const MyComponent = collect (myReducer) (() => (
  <button onClick={() => store.dispatch ({type: 'MY_ACTION'})}></button>
));

// Whenever the set of reducers changes, we swap out the active reducer.
const onChange = rs => store.replaceReducer (reduceReducers (rs));

render (
  <Collector onChange={onChange}><MyComponent /></Collector>,
  document.getElementById ('app')
);
```

## API

#### <a name="collect" href="https://github.com/wearereasonablepeople/react-collect/blob/v1.0.3/index.mjs#L78">`collect :: Any? -⁠> ReactComponent -⁠> ReactComponent`</a>

Decorates a component with collection capabilities. Decorated components
must have a [`Collector`](#Collector) as one of their ancestors.

When given, the first argument is an item that is always automatically
collected whenever the component mounts, and uncollected when the component
unmounts.

Alternatively, for more control, you can manually use the `collect` and
`uncollect` functions that are given to the decorated component as props.

```js
import {collect} from 'react-collect';
import {MyComponent} from './my-component';

export default collect ({message: 'Hello!'}) (MyComponent);
```

#### <a name="Collector" href="https://github.com/wearereasonablepeople/react-collect/blob/v1.0.3/index.mjs#L131">`Collector :: ReactComponent`</a>

This component wraps your tree and collects the items from all child
components that have been decorated with [`collect`](#collect).

Expects a single property `onChange` - the function to call when the
collection has changed. The function is called with an array of distinct
entries.

```jsx
import {Collector} from 'react-collect';
import App from './my-app';

const onChange = collection => collection.forEach (() => { /* */ });

export default <Collector onChange={onChange}><App /></Collector>;
```
