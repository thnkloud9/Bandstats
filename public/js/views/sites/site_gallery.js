define([
  'jquery',
  'underscore',
  'backbone',
  'collections/sites',
  'views/paginator',
  'views/sites/site_gallery_item',
  'text!templates/sites/site_list.html'
], function($, _, Backbone, SitesCollection, PaginatorView, SiteGalleryItemView, siteListTemplate){
  var SiteGalleryView = Backbone.View.extend({

    el: '#site-list-container',

    page: 1, 

    initialize: function() {
      this.collection.on('reset', this.render, this);
      this.collection.on('sync', this.render, this);
    },

    render: function () {

      this.$el.html(siteListTemplate);

      var parent = this;
      _.each(this.collection.models, function (model) {
        parent.renderSite(model);
      }, this);

      $('#pagination', this.el).html(new PaginatorView({collection: this.collection, page: this.page}).render().el);
    },

    renderSite: function (model) {
      $('#site-list', this.el).append(new SiteGalleryItemView({model: model}).render().el); 
    }

  });
  return SiteGalleryView;
});
