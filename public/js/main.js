require.config({
  paths: {
    // Major libraries
    jquery: 'libs/jquery/jquery-1.11.0.min', //http://code.jquery.com/jquery-1.11.0.min.js
    underscore: 'libs/underscore/underscore-min', // https://github.com/amdjs
    backbone: 'libs/backbone/backbone-min', // https://github.com/amdjs
    paginator: 'libs/backbone-paginator/backbone.paginator.min',
    sinon: 'libs/sinon/sinon.js',

    // Require.js plugins
    text: 'libs/require/text',

    // Just a short cut so we can put our html outside the js dir
    // When you have HTML/CSS designers this aids in keeping them out of the js directory
    templates: '../templates'
  },
  shim: {
    'underscore': {
      exports: function() {
        return this._;
      }           
    },
    'backbone': {
      deps: ['underscore'],
      exports: function() {
        return this.Backbone;
      }
    },
    'paginator': {
      deps: ['backbone'],
      exports: 'Backbone.Paginator'
    }
  }

});

// Let's kick off the application

require([
  'views/app',
  'router',
  'vm'
], function(AppView, Router, Vm){
  var appView = Vm.create({}, 'AppView', AppView);
  appView.render();
  Router.initialize({appView: appView});  // The router now has a copy of all main appview
});
