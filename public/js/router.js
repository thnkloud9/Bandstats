// Filename: router.js
define([
  'jquery',
  'underscore',
  'backbone',
  'vm',
  'paginator'
], function ($, _, Backbone, Vm) {
  var AppRouter = Backbone.Router.extend({
    routes: {
      // Pages
      'bands/:id': 'band',
      'bands': 'bands',
      'bands/search/:query': 'bandsearch',
      'sites': 'sites',
      'jobs': 'jobs',
      'settings': 'settings',
      
      // Default - catch all
      '*actions': 'defaultAction'
    }
  });

  var initialize = function(options){
    var appView = options.appView;
    var router = new AppRouter(options);
    router.on('route:defaultAction', function (actions) {
      require(['views/dashboard/page'], function (DashboardPage) {
        var dashboardPage = Vm.create(appView, 'DashboardPage', DashboardPage);
        dashboardPage.render();
      });
    });
    router.on('route:bandsearch', function (query) {
     require(['views/bands/bands_page','collections/bands_search'], function (BandsPageView, BandsSearchCollection) {
        var bandsSearchCollection = new BandsSearchCollection(query);
        bandsSearchCollection.fetch();
        var searchResultsView = Vm.create(this, 'BandsPageView', BandsPageView, {collection: bandsSearchCollection});
        searchResultsView.render();
      });
    });
    router.on('route:bands', function () {
     require(['views/bands/bands_page','collections/bands'], function (BandsPageView, BandsCollection) {
        var bandsCollection = new BandsCollection();
        bandsCollection.fetch();
        var bandsPage = Vm.create(appView, 'BandsPageView', BandsPageView, {collection: bandsCollection});
        bandsPage.render();
      });
    });
    router.on('route:band', function (id) {
     require(['views/bands/band_detail'], function (BandDetailView) {
        var bandPage = Vm.create(appView, 'BandDetailView', BandDetailView);
        bandPage.loadBand(id);
        bandPage.render();
      });
    });
    router.on('route:sites', function () {
      require(['views/sites/page'], function (SitesPage) {
        var sitesPage = Vm.create(appView, 'SitesPage', SitesPage);
        sitesPage.render();
      });
    });
    router.on('route:jobs', function () {
      require(['views/jobs/page'], function (JobsPage) {
        var jobsPage = Vm.create(appView, 'JobsPage', JobsPage);
        jobsPage.render();
      });
    });
    router.on('route:settings', function () {
      require(['views/settings/page'], function (SettingsPage) {
        var settingsPage = Vm.create(appView, 'SettingsPage', SettingsPage);
        settingsPage.render();
      });
    });
    Backbone.history.start();
  };
  return {
    initialize: initialize
  };
});
