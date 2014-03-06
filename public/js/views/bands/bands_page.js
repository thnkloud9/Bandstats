define([
  'jquery',
  'underscore',
  'backbone',
  'vm',
  'views/bands/band_menu',
  'views/bands/band_list',
  'text!templates/bands/bands_page.html',
], function($, _, Backbone, Vm, BandMenuView, BandListView, bandsPageTemplate){
  var BandsPage = Backbone.View.extend({
    el: '#content',
    render: function () {
      this.$el.html(bandsPageTemplate);

      // this view will manage the sub views of the bands page
      var bandMenuView = Vm.create(this, 'BandMenuView', BandMenuView);
      bandMenuView.render();

    }
  });
  return BandsPage;
});
