define([
  'jquery',
  'underscore',
  'backbone',
  'text!templates/settings/page.html'
], function($, _, Backbone, settingsPageTemplate){
  var SettingsPage = Backbone.View.extend({
    el: '.page',
    render: function () {
      this.$el.html(settingsPageTemplate);
    }
  });
  return SettingsPage;
});
