define([
  'jquery',
  'underscore',
  'backbone',
  'vm',
  'views/bands/facebook_stats_panel',
  'views/bands/lastfm_stats_panel',
  'text!templates/bands/band_gallery_item.html' 
], function($, _, Backbone, Vm, FacebookStatsPanelView, LastfmStatsPanelView, template) {

  var BandGalleryItemView = Backbone.View.extend({

    tagName: "li",
    className: "span3",
    template: _.template(template),

    initialize: function (options) {
      this.vent = options.vent;
      this.model.bind("change", this.render, this);
      this.model.bind("destroy", this.close, this);
    },

    render: function () {
      $(this.el).html(this.template(this.model.toJSON()));

      var viewName = 'FacebookStatsPanelView' + this.model.get("band_id");
      var facebookStatsPanelView = Vm.create(this, viewName, FacebookStatsPanelView, {model: this.model, vent: this.vent});
      $(facebookStatsPanelView.render().el).appendTo($('#facebook-stats-content', this.el)); 

      var viewName = 'LastfmStatsPanelView' + this.model.get("band_id");
      var lastfmStatsPanelView = Vm.create(this, viewName, LastfmStatsPanelView, {model: this.model, vent: this.vent});
      $(lastfmStatsPanelView.render().el).appendTo($('#lastfm-stats-content', this.el)); 

      return this;
    },
 
  });

  return BandGalleryItemView;

}); 
