define([
  'jquery',
  'underscore',
  'backbone',
  'vm',
  'text!templates/sites/page.html',
  'views/sites/sidemenu',
  'views/sites/section'
], function($, _, Backbone, Vm, sitesPageTemplate, SidemenuView, SectionView){
  var SitesPage = Backbone.View.extend({
    el: '.page',
    render: function () {
      this.$el.html(sitesPageTemplate);
      
      var sidemenuView = Vm.create(this, 'SitesSideMenuView', SidemenuView);
      sidemenuView.render();
      
      var sectionView = Vm.create(this, 'SitesSectionView', SectionView, {section: this.options.section});
      sectionView.render();
    }
  });
  return SitesPage;
});
