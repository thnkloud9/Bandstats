define([
  'jquery',
  'underscore',
  'backbone',
  'collections/bands',
  'views/paginator',
  'views/bands/band_list_item',
  'text!templates/bands/band_list.html'
], function($, _, Backbone, BandsCollection, PaginatorView, BandListItemView, bandListTemplate){
  var BandListView = Backbone.View.extend({
    id: '#bands-page-content',

    initialize: function() {
      this.collection.on('reset', this.render, this);
      this.collection.on('sync', this.render, this);

      this.$el.html(bandListTemplate);
    },

    render: function () {

      this.$el.html(bandListTemplate);

      var parent = this;
      _.each(this.collection.models, function (model) {
        parent.renderBand(model);
      }, this);

      $('#paginator-content', this.el).append(new PaginatorView({collection: this.collection, page: this.page}).render().el);

      return this;
    },

    renderBand: function (model) {
      $('#band-list', this.el).append(new BandListItemView({model: model}).render().el); 
    }

  });
  return BandListView;
});
