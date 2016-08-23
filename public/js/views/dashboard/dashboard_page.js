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
  'views/dashboard/genres_dashboard',
  'views/dashboard/regions_dashboard',
  'text!templates/dashboard/dashboard_page.html'
], function($, _, Backbone, Vm, 
  UsersDashboardView, 
  BandsDashboardView, 
  TopBandsDashboardView, 
  JobsDashboardView, 
  SitesDashboardView, 
  GenresDashboardView, 
  RegionsDashboardView, 
  dashboardPageTemplate){

  var DashboardPage = Backbone.View.extend({
    el: '#content',
    template: _.template(dashboardPageTemplate),

    initialize: function(options) {
      this.breadcrumb = options.breadcrumb;
    },

    renderGenres: function () {
      this.destroyChildren();

      var templateData = { breadcrumb: this.breadcrumb };
      $(this.el).html(this.template(templateData));

      var genresDashboardView = Vm.create(this, 'GenresDashboardView', GenresDashboardView);
      $(genresDashboardView.render().el).appendTo($('#dashboard-list', this.el));
    },

    renderRegions: function () {
      this.destroyChildren();

      var templateData = { breadcrumb: this.breadcrumb };
      $(this.el).html(this.template(templateData));

      var regionsDashboardView = Vm.create(this, 'RegionsDashboardView', RegionsDashboardView);
      $(regionsDashboardView.render().el).appendTo($('#dashboard-list', this.el));
    },

    render: function () {
      var templateData = { breadcrumb: this.breadcrumb };
      $(this.el).html(this.template(templateData));

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

    },

    destroyChildren: function() {
      var parent = this;
      _.each(this.children, function(child, name) {
        if (child.close) {
          child.close();
        }
        child.remove();
        child.undelegateEvents();
        child.unbind();
      }, this);
      this.children = {};
    }

  });

  return DashboardPage;

});
