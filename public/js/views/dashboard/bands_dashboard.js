define([
  'jquery',
  'underscore',
  'backbone',
  'text!templates/dashboard/bands_dashboard.html',
  'chart', 
], function($, _, Backbone, template) {

  var BandsDashboardView = Backbone.View.extend({

    tagName: "li",
    className: "dashboard-widget",
    template: _.template(template),
    data: {},

    initialize: function () {
    },

    render: function () {
      $(this.el).html(this.template());

      this.getData();

      return this;
    },

    getData: function () {
      var parent = this;
      var url = '/admin/dashboard/bandStats'; 

      $.ajax({
	    url: url,
	    type: 'GET',
	    dataType: 'json',
	    success: function (data) {
	      parent.renderValidBandsChart(data);
	    },
	    error: function (data) {
	      console.log("error: " + data);
	    }
      });
    },

    renderValidBandsChart: function (data) {
      this.data = data;

      var missingFacebook = data.missing_facebook;
      var missingLastfm = data.missing_lastfm;
      var badFacebook = data.bad_facebook;
      var badLastfm = data.bad_lastfm;
      var duplicates = data.duplicates;
      var good = data.total - (missingFacebook + missingLastfm + badFacebook + badLastfm);


      $('#good').html(good);
      $('#missing-facebook').html(missingFacebook);
      $('#missing-lastfm').html(missingLastfm);
      $('#bad-facebook').html(badFacebook);
      $('#bad-lastfm').html(badLastfm);
      $('#duplicates').html(duplicates);
      $('#total').html(data.total);

      

      var pieData = [
		{ value: good, color:"#5cb85c" },
		{ value : missingFacebook, color : "#FF0007" },
		{ value : badFacebook, color : "#5ACCBB" },
		{ value : missingLastfm, color : "#B200B2" },
		{ value : badLastfm, color : "#0EB29A" },
		{ value : duplicates, color : "#800000" }

	];
	var ctx = $('#chart-valid-bands-pie', this.el).get(0).getContext("2d");
	var myPie = new Chart(ctx).Pie(pieData);
    }

  });

  return BandsDashboardView;

}); 
