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

    initialize: function () {
      this.model.bind("change", this.render, this);
      this.model.bind("destroy", this.close, this);
    },
  
    render: function () {
      $(this.el).html(this.template(this.model.toJSON()));

      var facebookStatsPanelView = Vm.create(this, 'FacebookStatsPanelView', FacebookStatsPanelView, {model: this.model});
      $(facebookStatsPanelView.render().el).appendTo($('#facebook-stats-content', this.el)); 

      var lastfmStatsPanelView = Vm.create(this, 'LastfmStatsPanelView', LastfmStatsPanelView, {model: this.model});
      $(lastfmStatsPanelView.render().el).appendTo($('#lastfm-stats-content', this.el)); 

      return this;
    }

  });

  return BandGalleryItemView;

}); 
