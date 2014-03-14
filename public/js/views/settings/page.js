define([
  'jquery',
  'underscore',
  'backbone',
  'vm',
  'text!templates/settings/page.html'
], function($, _, Backbone, Vm, settingsPageTemplate){
  var SettingsPage = Backbone.View.extend({
    el: '#content',
    render: function () {
      this.$el.html(settingsPageTemplate);
      require(['views/sidenav/settings_menu'], function (SideNavView) {
        var sideNavView = Vm.create(parent, 'SideNavView', SideNavView);
        sideNavView.render();                                      
      });
    }
  });
  return SettingsPage;
});
