var app = app || {};

app.BandsView = Backbone.View.extend({
  el: $('#bands-view'),

  initialize: function() {
    this.collection = new app.Bands();
    //this.collection.fetch({
    //    data: {
    //        limit: 10,
    //        skip: 0
    //    }
    //});
    this.render();

    this.listenTo(this.collection, 'reset', this.render);
  },

  render: function() {
    this.collection.each(function(item) {
      this.renderBand(item);
    }, this);
  },

  renderBand: function(item) {
    var bandView = new app.BandView({
      model: item
    });
    this.$el.append(bandView.render().el);
    bandView.renderProfile('facebook');
  }  
});
