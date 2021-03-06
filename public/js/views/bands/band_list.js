define([
  'jquery',
  'underscore',
  'backbone',
  'collections/bands',
  'views/paginator',
  'views/bands/band_list_item',
  'text!templates/bands/band_list.html',
  'text!templates/bands/band_list_header.html'
], function($, _, Backbone, 
    BandsCollection, 
    PaginatorView, 
    BandListItemView, 
    bandListTemplate, 
    bandListHeaderTemplate){
  var BandListView = Backbone.View.extend({
    id: '#bands-page-content',

    initialize: function() {
      this.collection.on('reset', this.render, this);
      this.collection.on('sync', this.render, this);

      this.$el.html(bandListTemplate);
    },

    render: function () {
      var parent = this;

      this.$el.html(bandListTemplate);
    
      _.each(this.collection.models, function (model) {
        parent.renderBand(model);
      }, this);

      $('#paginator-content', this.el).append(new PaginatorView({collection: this.collection, page: this.page}).render().el);

      $('#band-list-table', this.el).append(bandListHeaderTemplate);

      return this;
    },

    renderBand: function (model) {
      $('#band-list-table', this.el).append(new BandListItemView({model: model}).render().el); 
    }

  });
  return BandListView;
});
