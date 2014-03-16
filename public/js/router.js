// Filename: router.js
define([
  'jquery',
  'underscore',
  'backbone',
  'vm',
  'paginator'
], function ($, _, Backbone, Vm) {

  // redirect non-authurized requests to the login page
  $.ajaxSetup({
    statusCode: {
        401: function(){
            // Redirec the to the login page.
            window.location.replace('#login');
        },
        403: function() {
            // 403 -- Access denied
            window.location.replace('#denied');
        }
    }
  });

  var AppRouter = Backbone.Router.extend({
    routes: {
      // Pages
      'bands/:id': 'band',
      'bands': 'bands',
      'bands/search/:query': 'bandsearch',
      'sites/:id': 'site',
      'sites': 'sites',
      'jobs/:id': 'job',
      'jobs': 'jobs',
      'running_jobs': 'running_jobs',
      'settings': 'settings',
      'login': 'login',
      'dashboard': 'dashboard',
      'users/:id': 'user',
      'users': 'users',
      
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

    router.on('route:dashboard', function () {
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
        //bandsPage.renderBandTile();
      });
    });

    router.on('route:band', function (id) {
      require(['views/bands/band_detail'], function (BandDetailView) {
        var bandPage = Vm.create(appView, 'BandDetailView', BandDetailView);
        bandPage.loadBand(id);
        bandPage.render();
      });
    });

    router.on('route:site', function (id) {
      require(['views/sites/site_detail'], function (SiteDetailPage) {
        var sitePage = Vm.create(appView, 'SiteDetailPage', SiteDetailPage);
        sitePage.loadSite(id);
        sitePage.render();
      });
    });

    router.on('route:sites', function () {
      require(['views/sites/sites_page', 'collections/sites'], function (SitesPage, SitesCollection) {
        var sitesCollection = new SitesCollection();
        sitesCollection.fetch();  
        var sitesPage = Vm.create(appView, 'SitesPage', SitesPage, {collection: sitesCollection});
        sitesPage.render();
      });
    });

    router.on('route:job', function (id) {
      require(['views/jobs/job_detail'], function (JobDetailPage) {
        var jobPage = Vm.create(appView, 'JobDetailPage', JobDetailPage);
        jobPage.loadJob(id);
        jobPage.render();
      });
    });

    router.on('route:jobs', function () {
      require(['views/jobs/jobs_page', 'collections/jobs'], function (JobsPage, JobsCollection) {
        var jobsCollection = new JobsCollection();
        jobsCollection.fetch();
        var jobsPage = Vm.create(appView, 'JobsPage', JobsPage, {collection: jobsCollection});
        jobsPage.render();
      });
    });

    router.on('route:running_jobs', function () {
      require(['views/jobs/jobs_page', 'collections/running_jobs'], function (JobsPage, RunningJobsCollection) {
        var runningJobsCollection = new RunningJobsCollection();
        runningJobsCollection.fetch();
        var jobsPage = Vm.create(appView, 'JobsPage', JobsPage, {collection: runningJobsCollection});
        jobsPage.render();
      });
    });

    router.on('route:settings', function () {
      require(['views/settings/page'], function (SettingsPage) {
        var settingsPage = Vm.create(appView, 'SettingsPage', SettingsPage);
        settingsPage.render();
      });
    });

    router.on('route:login', function () {
      require(['views/login'], function (LoginPage) {
        var loginPage = Vm.create(appView, 'LoginPage', LoginPage);
        loginPage.render();
      });
    });

    router.on('route:users', function () {
      require(['views/users/users_page','collections/users'], function (UsersPageView, UsersCollection) {
        var usersCollection = new UsersCollection();
        usersCollection.fetch();
        var usersPage = Vm.create(appView, 'UsersPageView', UsersPageView, {collection: usersCollection});
        usersPage.render();
      });
    });

    router.on('route:user', function (id) {
      require(['views/users/user_detail'], function (UserDetailView) {
        var userPage = Vm.create(appView, 'UserDetailView', UserDetailView);
        userPage.loadUser(id);
        userPage.render();
      });
    });

  };
  return {
    initialize: initialize
  };
});
