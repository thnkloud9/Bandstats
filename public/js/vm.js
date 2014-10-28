define([
  'jquery',
  'underscore',
  'backbone',
  'events'
], function($, _, Backbone, Events){
  var views = {};
  var create = function (context, name, View, options) {

    // If the view already exists, delete it
    if(typeof views[name] !== 'undefined') {
      views[name].vmClose();
    }

    // create it
    var view = new View(options);
    views[name] = view;

    if(typeof context.children === 'undefined'){
      context.children = {};
    }

    views[name].vmClose = function() {
      var parent = views[name];
      var requiredViews = (views[name].requiredViews) ? views[name].requiredViews : [];

      // destroy children
      _.each(parent.children, function(child, name) {
        if (requiredViews.indexOf(name) < 0) {
          //console.log('Closing Child ' + name);
          if (typeof child.close === 'function') {
            child.close();
          }
          child.vmClose();
          //child.remove();
          child.undelegateEvents();
          child.unbind();
          child.off();
          delete parent.children[name];
        }
      }, parent);

      //this.remove();
      parent.undelegateEvents();
      parent.unbind();
      if (typeof parent.model !== 'undefined') {
        parent.model.unbind("change", parent.modelChanged);
      }
      if (typeof parent.vent !== 'undefined') {
        parent.stopListening(parent.vent);
      }
      if (typeof parent.close === 'function') {
        parent.close();
      }
      parent.off();
    }

    context.children[name] = view;

    Events.trigger('viewCreated');

    console.log(views);

    return view;
  };
  
  
  return {
    create: create
  };
});
