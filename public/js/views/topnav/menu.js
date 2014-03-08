define([
  'jquery',
  'underscore',
  'vm',
  'backbone',
  'text!templates/topnav/menu.html'
], function($, _, Vm, Backbone, topNavTemplate){
  var TopNavView = Backbone.View.extend({
    el: '#topnav',
    
    initialize: function () {
    },

    render: function () {
      $(this.el).html(topNavTemplate);
      $('a[href="' + window.location.hash + '"]').addClass('active');
    }

  })

  return TopNavView;
});
