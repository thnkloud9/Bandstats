require.config({
  paths: {
    // Major libraries
    jquery: 'libs/jquery/jquery-1.11.0.min', //http://code.jquery.com/jquery-1.11.0.min.js
    underscore: 'libs/underscore/underscore-min', // https://github.com/amdjs
    backbone: 'libs/backbone/backbone-min', // https://github.com/amdjs
    paginator: 'libs/backbone-paginator/backbone.paginator.min',
    sinon: 'libs/sinon/sinon',
    bootstrap: 'libs/bootstrap/bootstrap.min',
    typeahead: 'libs/typeahead/typeahead.bundle',

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
    },
    'bootstrap': {
      deps: ['jquery']
    },
    'typeahead': {
      deps: ['jquery']
    }
  }

});

// Let's kick off the application

require([
  'jquery',
  'underscore',
  'backbone',
  'views/app',
  'views/login',
  'router',
  'vm'
], function($, _, Backbone, AppView, LoginView, Router, Vm){
  // check for authentication and redirect to login if not logged in
  $.ajax("/admin/session/current", {
    type: "GET",
    dataType: "json",
    success: function(data) {
      // create the app view
      var appView = Vm.create({}, 'AppView', AppView);
      appView.render();

      // start backbone history
      Router.initialize({appView: appView});  // The router now has a copy of all main appview
      Backbone.history.start();
      
    },
    error: function() {
      // to the login view
      var loginView = Vm.create({}, 'LoginView', LoginView);
      loginView.render();
    }
  });

});
