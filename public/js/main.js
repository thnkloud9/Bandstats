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
    moment: 'libs/moment/moment',
    chart: 'libs/chart/chart.min',

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

      if (data.user.role === 'admin') {
        // create events aggregator
        var vent = _.extend({}, Backbone.Events);
 
        // create the app view
        var appView = Vm.create({}, 'AppView', AppView, {session: data, vent: vent});
        appView.render();

        // start backbone history
        Router.initialize({appView: appView, session: data, vent: vent});  // The router now has a copy of all main appview
        Backbone.history.start();
      }

      if (data.user.role === 'manager') {
	console.log('load band manager page');
      }
	
      
    },
    error: function() {
      // to the login view
      var loginView = Vm.create({}, 'LoginView', LoginView);
      loginView.render();
    }
  });

});
