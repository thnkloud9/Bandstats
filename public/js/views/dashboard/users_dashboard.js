define([
  'jquery',
  'underscore',
  'backbone',
  'text!templates/dashboard/users_dashboard.html' 
], function($, _, Backbone, template) {

  var UsersDashboardView = Backbone.View.extend({

    tagName: "li",
    className: "dashboard-widget",
    template: _.template(template),

    initialize: function () {
    },

    render: function () {
      $(this.el).html( this.template() );
      this.getData();
      return this;
    },

    getData: function () {
      var parent = this;
      var url = '/admin/dashboard/userStats'; 

      $.ajax({
	url: url,
	type: 'GET',
	dataType: 'json',
	success: function (data) {
	  parent.renderUserStats(data);
	},
	error: function (data) {
	  console.log("error: " + data);
	}
      });

    },

    renderUserStats: function (data) {
      console.log(data);

      $('#total-users').html(data.total);
      $('#active-users').html(data.active);
      $('#online-users').html(data.online);
    },

  });

  return UsersDashboardView;

}); 
