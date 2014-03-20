define([
  'jquery',
  'underscore',
  'backbone',
  'vm',
  'views/sites/site_list',
  'views/sites/site_gallery',
  'text!templates/sites/sites_page.html',
], function($, _, Backbone, Vm, SiteListView, SiteGalleryView, sitesPageTemplate, SidemenuView, SectionView){
  var SitesPage = Backbone.View.extend({

    el: '#content',

    events: {
      'click button#btn-gallery-view': 'renderSiteGallery',
      'click button#btn-list-view': 'renderSiteList'
    },

    render: function () {
      this.$el.html(sitesPageTemplate);

      this.renderSiteList();

      require(['views/sidenav/sites_menu'], function (SideNavView) {
        var sideNavView = Vm.create(parent, 'SideNavView', SideNavView);
        sideNavView.render();                                      
      });
    },

    renderSiteGallery: function(model) {
      var siteGalleryView = Vm.create(this, 'SiteGalleryView', SiteGalleryView, {collection: this.collection});
      siteGalleryView.render();

    },

    renderSiteList: function(model) {
      var siteListView = Vm.create(this, 'SiteListView', SiteListView, {collection: this.collection});
      siteListView.render();

    }

  });

  return SitesPage;
});
