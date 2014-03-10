define([
  'jquery',
  'underscore',
  'backbone',
  'text!templates/sidenav/bands_menu.html'
], function($, _, Backbone, sideNavTemplate){
  var SideNavView = Backbone.View.extend({
    el: '#sidenav',
    initialize: function () {
    },
    render: function () {
      $(this.el).html(sideNavTemplate);
    },
    events: {
      'click .side-nav-link': 'highlightMenuItem'
    },
    highlightMenuItem: function (ev) {
      $('.active').removeClass('active');
      $(ev.currentTarget).addClass('active');
    }
  })

  return SideNavView;
});
