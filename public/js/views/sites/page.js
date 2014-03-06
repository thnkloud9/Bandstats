define([
  'jquery',
  'underscore',
  'backbone',
  'vm',
  'text!templates/sites/page.html',
], function($, _, Backbone, Vm, sitesPageTemplate, SidemenuView, SectionView){
  var SitesPage = Backbone.View.extend({
    el: '#content',
    render: function () {
      this.$el.html(sitesPageTemplate);
    }
  });
  return SitesPage;
});
