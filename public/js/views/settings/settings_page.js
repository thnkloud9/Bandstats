define([
  'jquery',
  'underscore',
  'backbone',
  'vm',
  'text!templates/settings/settings_page.html'
], function($, _, Backbone, Vm, settingsPageTemplate){
  var SettingsPage = Backbone.View.extend({
    el: '#content',

    render: function () {
      this.$el.html(settingsPageTemplate);
      require(['views/sidenav/settings_menu'], function (SideNavView) {
        var sideNavView = Vm.create(parent, 'SideNavView', SideNavView);
        sideNavView.render();                                      
      });

      this.getData();
    },

    getData: function () {
      var parent = this;
      var url = '/admin/setting'; 

      $.ajax({
	url: url,
	type: 'GET',
	dataType: 'json',
	success: function (data) {
	  parent.renderForm(data);
	},
	error: function (data) {
	  console.log("error: " + data);
	}
      });
    },
    
    renderForm: function (data) {
      var groupHeadings = _.keys(data);
      var i = 0;
      _.forEach(data, function(group) {

  	$('#form-settings', this.el).append('<h3>' + groupHeadings[i] + '</h3>');

        _.forEach(group, function(value, field) {
	    $('#form-settings', this.el).append('<label for="' +  field + '" class="control-label">' + field + '</label>'); 
	    $('#form-settings', this.el).append('<input id="' + field + '" class="form-control" type="text" value="' + value + '"/>'); 
        });

  	$('#form-settings', this.el).append('<hr />');

	i++;

      });
    },
 
  });
  return SettingsPage;
});
