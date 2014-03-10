define([
  'jquery',
  'underscore',
  'backbone',
  'vm',
  'events',
  'text!templates/layout.html',
  'bootstrap',
], function($, _, Backbone, Vm, Events, layoutTemplate){
  var AppView = Backbone.View.extend({
    el: 'body',

    initialize: function () {
    },

    events: {
      'click .topnav-link': 'renderMenuItem',
       'keypress  .search-input': 'searchBands'
    },

    render: function (ev) {

      var parent = this;
      var section = "dashboard";

      if (ev) {
        section = $(ev.currentTarget).html().toLowerCase();
      }

      $(this.el).html(layoutTemplate);
      require(['views/topnav/menu'], function (TopNavView) {
        var topNavView = Vm.create(parent, 'TopNavView', TopNavView);
        topNavView.render();
      });

      require(['views/sidenav/' + section + '_menu'], function (SideNavView) {
        var sideNavView = Vm.create(parent, 'SideNavView', SideNavView);
        sideNavView.render();
      });

      require(['views/footer/footer'], function (FooterView) {
        // Pass the appView down into the footer so we can render the visualisation
        var footerView = Vm.create(parent, 'FooterView', FooterView, {appView: parent});
        footerView.render();
      });
    
    },

    searchBands: function(e) {
      if ( e.which === 13 ) {
        e.preventDefault();
        Backbone.history.navigate('bands/search/' + $('.search-input').val(), true);
      }
    },

    renderMenuItem: function (ev) {
      // clear out the search
      $('.search-input').val('');

      $('.active').removeClass('active');
      $(ev.currentTarget).addClass('active');
    
      this.render(ev);
    }

  });
  return AppView;
});
