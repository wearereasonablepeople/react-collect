import assert from 'assert';
import TestRenderer from 'react-test-renderer';
import React from 'react';
import show from 'sanctuary-show';
import Z from 'sanctuary-type-classes';
import sinon from 'sinon';

import {
  identity,
  getComponentName,
  createBaseCollectionManager,
  collect,
  Collector
} from '..';


var el = React.createElement;
var render = TestRenderer.create;

function eq(actual) {
  return function eqq(expected) {
    assert.strictEqual (show (actual), show (expected));
    assert.strictEqual (Z.equals (actual, expected), true);
  };
}

function noop() {}

function throws(f) {
  return function throwsf(ee) {
    try {
      f ();
    } catch (ae) {
      eq (ee) (ae);
      return;
    }
    var e = new Error ('Expected function to throw');
    Error.captureStackTrace (e, throwsf);
    throw e;
  };
}

function MockComponent(props) {
  return el ('div');
}

test ('identity', function() {
  eq (identity (42)) (42);
});

test ('getComponentName', function() {
  eq (getComponentName ({displayName: 'Test'})) ('Test');
  eq (getComponentName (MockComponent)) ('MockComponent');
  eq (getComponentName ({})) ('<Anonymous>');
  eq (getComponentName (null)) ('<Null>');
});

test ('createBaseCollectionManager', function() {
  eq (typeof createBaseCollectionManager ({})) ('function');
});

test ('Collector', function() {
  throws (function() { new Collector ({}); })
         (new TypeError ('Collector wants an onChange prop of type function'));

  var collector = new Collector ({onChange: noop});
  var item = {};
  var item2 = {};

  eq (Array.from (collector.toCollect)) ([]);

  collector.collect (item);
  collector.collect (item);
  collector.collect (item2);

  eq (Array.from (collector.toCollect)) ([item, item2]);
  eq (Array.from (collector.toUncollect)) ([]);

  collector.uncollect (item);
  collector.uncollect (item);

  eq (Array.from (collector.toUncollect)) ([item]);
  eq (Array.from (collector.collection)) ([]);

  collector.updateCollection ();

  eq (Array.from (collector.toCollect)) ([]);
  eq (Array.from (collector.toUncollect)) ([]);
  eq (Array.from (collector.collection)) ([item2]);
});

test ('collect()', function() {
  var collector = collect ();
  var Collecting = collector (MockComponent);
  var CollectingNull = collector (null);

  eq (Collecting.displayName) ('Collecting(MockComponent)');
  eq (CollectingNull.displayName) ('Collecting(<Null>)');

  var onChange = sinon.spy ();
  var renderer = render (
    el (Collector, {onChange: onChange}, (
      el (Collecting, {foo: 'bar'})
    ))
  );

  renderer.unmount ();

  eq (onChange.called) (false);
});

test ('collect(item)', function() {
  var item = {};
  var collector = collect (item);
  var Collecting = collector (MockComponent);
  var CollectingNull = collector (null);

  eq (Collecting.displayName) ('Collecting(MockComponent)');
  eq (CollectingNull.displayName) ('Collecting(<Null>)');

  var onChange = sinon.spy ();
  var renderer = render (
    el (Collector, {onChange: onChange}, (
      el (Collecting, {foo: 'bar'})
    ))
  );

  var mockComponent = renderer.root.findByType (MockComponent);

  eq (mockComponent.parent.type.displayName) ('CollectorManager(MockComponent)');
  eq (mockComponent.props.foo) ('bar');
  eq (typeof mockComponent.props.collect) ('function');
  eq (typeof mockComponent.props.uncollect) ('function');

  return new Promise (function(res) { setTimeout (res, 200); }).then (function() {
    eq (onChange.callCount) (1);
    eq (onChange.firstCall.args) ([[item]]);
    renderer.unmount ();
    eq (onChange.callCount) (2);
    eq (onChange.secondCall.args) ([[]]);
  });
});
