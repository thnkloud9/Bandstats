define([
  'jquery',
  'underscore',
  'backbone',
  'vm',
  'views/dashboard/users_dashboard',
  'views/dashboard/bands_dashboard',
  'views/dashboard/top_bands_dashboard',
  'views/dashboard/jobs_dashboard',
  'views/dashboard/sites_dashboard',
  'text!templates/dashboard/dashboard_page.html'
], function($, _, Backbone, Vm, 
  UsersDashboardView, 
  BandsDashboardView, 
  TopBandsDashboardView, 
  JobsDashboardView, 
  SitesDashboardView, 
  dashboardPageTemplate){

  var DashboardPage = Backbone.View.extend({
    el: '#content',

    render: function () {
      $(this.el).html(dashboardPageTemplate);

      var usersDashboardView = Vm.create(this, 'UsersDashboardView', UsersDashboardView);
      $(usersDashboardView.render().el).appendTo($('#dashboard-list', this.el));

      var bandsDashboardView = Vm.create(this, 'BandsDashboardView', BandsDashboardView);
      $(bandsDashboardView.render().el).appendTo($('#dashboard-list', this.el));

      var topBandsDashboardView = Vm.create(this, 'TopBandsDashboardView', TopBandsDashboardView);
      $(topBandsDashboardView.render().el).appendTo($('#dashboard-list', this.el));

      var jobsDashboardView = Vm.create(this, 'JobsDashboardView', JobsDashboardView);
      $(jobsDashboardView.render().el).appendTo($('#dashboard-list', this.el));

      var sitesDashboardView = Vm.create(this, 'SitesDashboardView', SitesDashboardView);
      $(sitesDashboardView.render().el).appendTo($('#dashboard-list', this.el));

    }

  });

  return DashboardPage;

});
