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
    
    events: {
    }, 

    render: function () {
      $(this.el).html(topNavTemplate);
      $('a[href="' + window.location.hash + '"]').addClass('active');

      // stupid hack to make routes refresh
      $('.topnav-link').click(function(e) {
        var newFragment = Backbone.history.getFragment($(this).attr('href'));
        if (Backbone.history.fragment == newFragment) {
          // need to null out Backbone.history.fragement because 
          // navigate method will ignore when it is the same as newFragment
          Backbone.history.fragment = null;
          Backbone.history.navigate(newFragment, {trigger: true});
        } 
      });
 
      return this;
    }

  })

  return TopNavView;
});
