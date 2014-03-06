define([
  'jquery',
  'underscore',
  'backbone',
  'text!templates/topnav/menu.html'
], function($, _, Backbone, topNavTemplate){
  var TopNavView = Backbone.View.extend({
    el: '#topnav',
    initialize: function () {
    },
    render: function () {
      $(this.el).html(topNavTemplate);
      $('a[href="' + window.location.hash + '"]').addClass('active');
    },
    events: {
      'click a': 'highlightMenuItem'
    },
    highlightMenuItem: function (ev) {
      $('.active').removeClass('active');
      $(ev.currentTarget).addClass('active');
    }
  })

  return TopNavView;
});
