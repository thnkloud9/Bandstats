define([
  'jquery',
  'underscore',
  'backbone',
  'collections/bands',
  'views/paginator',
  'views/bands/band_tile_item',
  'text!templates/bands/band_list.html'
], function($, _, Backbone, BandsCollection, PaginatorView, BandTileItemView, bandListTemplate){
  var BandTileView = Backbone.View.extend({

    id: 'band-tile-content',

    events: {
      'click .band-detail-link': 'close',
    },

    initialize: function() {
      this.collection.on('reset', this.render, this);
      this.collection.on('sync', this.render, this);
      this.isLoading = false;

      // bind to checkScroll 
      _.bindAll(this, 'checkScroll');
      $(window).scroll(this.checkScroll);

      // only render the list container once
      //this.$el.empty();
      this.$el.html(bandListTemplate);
    },

    close: function() {
      $(window).unbind('scroll');
      this.remove();
      this.undelegateEvents();
      this.unbind();
    },

    render: function () {
      this.renderBands();
      return this;
    },

    renderBand: function (model) {
      $('#band-list', this.el).append(new BandTileItemView({model: model}).render().el); 
    },

    renderBands: function () {
      var parent = this;
      _.each(this.collection.models, function (model) {
        if (model.get('band_id') > 0) {
          parent.renderBand(model);
        }
      }, this);

      this.isLoading = false;
      return this;
    },

    checkScroll: function () {
      // if we are at the bottom of the page
      if(!(this.isLoading) && $(window).scrollTop() + $(window).height() >= $(document).height()) {
        if (this.collection.paginatorOptions.hasNext) {
          this.isLoading = true;
          this.collection.getNextPage(); // Load next page
          this.renderBands();
        }
      }
    }

  });

  return BandTileView;
});
