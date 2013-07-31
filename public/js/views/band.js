var app = app || {};

app.BandView = Backbone.View.extend({
  tagName: 'div',
  className: 'band-view',
  template: $('#band-template').html(),

  render: function() {
    var tpl = _.template(this.template);
    this.$el.html(tpl(this.model.toJSON()));
    return this;
  },

  // render external profile
  renderProfile: function(provider) {
    var band = this.model.toJSON();

    if (band.external_ids[provider + '_id']) {
        var profileId = band.external_ids[provider + '_id'];
        console.log(band.band_name + ' ' + provider + ' ' + profileId);
    }
  }

});
