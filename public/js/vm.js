define([
  'jquery',
  'underscore',
  'backbone',
  'events'
], function($, _, Backbone, Events){
  var views = {};
  var create = function (context, name, View, options) {
    // View clean up isn't actually implemented yet but will simply call .close, .remove and .unbind
    if(typeof views[name] !== 'undefined') {
      views[name].undelegateEvents();
      if(typeof views[name].close === 'function') {
        views[name].close();
      }
    }
    var view = new View(options);
    views[name] = view;
    if(typeof context.children === 'undefined'){
      context.children = {};
      context.children[name] = view;
    } else {
      context.children[name] = view;
    }
    Events.trigger('viewCreated');
    return view;
  };
  
  
  return {
    create: create
  };
});
