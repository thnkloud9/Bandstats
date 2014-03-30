// Filename: router.js
define([
  'jquery',
  'underscore',
  'backbone',
  'vm',
  'models/session',
  'paginator'
], function ($, _, Backbone, Vm, SessionModel) {

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
      'bands/missing/:field': 'missing_external_id',
      'bands/bad/:field': 'bad_external_id',
      'sites/:id': 'site',
      'sites': 'sites',
      'jobs/:id': 'job',
      'jobs': 'jobs',
      'running_jobs': 'running_jobs',
      'jobs_log': 'jobs_log',
      'settings': 'settings',
      'login': 'login',
      'dashboard': 'dashboard',
      'dashboard/genres': 'dashboard_genres',
      'dashboard/regions': 'dashboard_regions',
      'users/:id': 'user',
      'users': 'users',
      
      // Default - catch all
      '*actions': 'defaultAction'
    }
  });
  
  var initialize = function(options){
    var parent = this;
    var appView = options.appView;
    var router = new AppRouter(options);

    options.session.id = options.session.user.user_id;
    var session = new SessionModel(options.session);

    var vent = options.vent;
 
    router.on('route:defaultAction', function (actions) {
      require(['views/dashboard/dashboard_page'], function (DashboardPage) {
        var dashboardPage = Vm.create(appView, 'DashboardPage', DashboardPage);
        dashboardPage.render();
      });
    });

    router.on('route:dashboard', function () {
      require(['views/dashboard/dashboard_page'], function (DashboardPage) {
        var dashboardPage = Vm.create(appView, 'DashboardPage', DashboardPage);
        dashboardPage.render();
      });
    });

    router.on('route:dashboard_genres', function () {
      require(['views/dashboard/dashboard_page'], function (DashboardPage) {
        var dashboardPage = Vm.create(appView, 'DashboardPage', DashboardPage);
        dashboardPage.renderGenres();
      });
    });

    router.on('route:dashboard_regions', function () {
      require(['views/dashboard/dashboard_page'], function (DashboardPage) {
        var dashboardPage = Vm.create(appView, 'DashboardPage', DashboardPage);
        dashboardPage.renderRegions();
      });
    });

    router.on('route:bandsearch', function (query) {
      require(['views/bands/bands_page','collections/bands'], function (BandsPageView, BandsCollection) {
        var bandsCollection = new BandsCollection(query);
        bandsCollection.getFirstPage();
        var searchResultsView = Vm.create(this, 'BandsPageView', BandsPageView, {collection: bandsCollection, session: session, vent: vent});
        searchResultsView.render();
      });
    });

    router.on('route:missing_external_id', function (field) {
      require(['views/bands/bands_page','collections/bands'], function (BandsPageView, BandsCollection) {
	    var query = '{"external_ids.' + field + '": ""}';
        var bandsCollection = new BandsCollection(null, query);
        bandsCollection.getFirstPage();
        var searchResultsView = Vm.create(this, 'BandsPageView', BandsPageView, {collection: bandsCollection, session: session, vent: vent});
        searchResultsView.render();
      });
    });

    router.on('route:bad_external_id', function (field) {
      require(['views/bands/bands_page','collections/bands'], function (BandsPageView, BandsCollection) {
	    var query = '{"running_stats.' + field + '.error": { "$exists": true } }';
        var bandsCollection = new BandsCollection(null, query);
        bandsCollection.getFirstPage();
        var searchResultsView = Vm.create(this, 'BandsPageView', BandsPageView, {collection: bandsCollection, session: session, vent: vent});
        searchResultsView.render();
      });
    });

    router.on('route:bands', function () {
      require(['views/bands/bands_page','collections/bands'], function (BandsPageView, BandsCollection) {
        var bandsCollection = new BandsCollection();
        var bandsPage = Vm.create(appView, 'BandsPageView', BandsPageView, {collection: bandsCollection, session: session, vent: vent});
        bandsPage.applySessionFilter();
        bandsPage.render();
      });
    });

    router.on('route:band', function (id) {
      require(['views/bands/band_detail', 'views/bands/bands_page'], function (BandDetailView, BandsPageView) {
        // create the bandsPageView to ensure event handling
        var bandsPage = Vm.create(appView, 'BandsPageView', BandsPageView, {vent: vent});
        var bandPage = Vm.create(appView, 'BandDetailView', BandDetailView, {vent: vent});
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

    router.on('route:jobs_log', function () {
      require(['views/jobs/jobs_page', 'collections/jobs_log'], function (JobsPage, JobsLogCollection) {
        var jobsLogCollection = new JobsLogCollection();
        jobsLogCollection.fetch();
        var jobsPage = Vm.create(appView, 'JobsPage', JobsPage, {collection: jobsLogCollection});
        jobsPage.render();
      });
    });

    router.on('route:settings', function () {
      require(['views/settings/settings_page'], function (SettingsPage) {
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
