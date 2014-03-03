define([
  'jquery',
  'underscore',
  'backbone',
  'vm'
], function($, _, Backbone, Vm){
  var SitesPage = Backbone.View.extend({
    el: '.content',
    render: function () {
      this.$el.html('<h4 style="color: red;">Incomplete</h4>');
    }
  });
  return SitesPage;
});
