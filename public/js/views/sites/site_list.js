define([
  'jquery',
  'underscore',
  'backbone',
  'collections/sites',
  'views/paginator',
  'views/sites/site_list_item',
  'text!templates/sites/site_list.html'
], function($, _, Backbone, SitesCollection, PaginatorView, SiteListItemView, siteListTemplate){
  var SiteListView = Backbone.View.extend({
    el: '#site-list-container',

    initialize: function() {
      this.collection.on('reset', this.render, this);
      this.collection.on('sync', this.render, this);
    },

    page: 1,

    render: function () {

      this.$el.html(siteListTemplate);

      var parent = this;
      _.each(this.collection.models, function (model) {
        parent.renderSite(model);
      }, this);

      $('#pagination', this.el).append(new PaginatorView({collection: this.collection, page: this.page}).render().el);
    },

    renderSite: function (model) {
      $('#site-list', this.el).append(new SiteListItemView({model: model}).render().el); 
    }

  });
  return SiteListView;
});
