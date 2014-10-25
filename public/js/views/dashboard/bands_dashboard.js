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

      var missingBoth = Math.min(data.missing_facebook, data.missing_lastfm);
      var badBoth = Math.min(data.bad_facebook, data.bad_lastfm);
      var missingFacebook = data.missing_facebook - missingBoth;
      var missingLastfm = data.missing_lastfm - missingBoth;
      var badFacebook = data.bad_facebook - badBoth;
      var badLastfm = data.bad_lastfm - badBoth;
      var good = data.total - (missingBoth + badBoth + missingFacebook + missingLastfm + badFacebook + badLastfm);


      $('#good').html(good);
      $('#missing-both').html(missingBoth);
      $('#bad-both').html(badBoth);
      $('#missing-facebook').html(missingFacebook);
      $('#missing-lastfm').html(missingLastfm);
      $('#bad-facebook').html(badFacebook);
      $('#bad-lastfm').html(badLastfm);
      $('#total').html(data.total);

      

      var pieData = [
		{ value: good, color:"#5cb85c" },
		{ value: missingBoth, color:"#400002" },
		{ value : badBoth, color : "#7F0003" },
		{ value : missingFacebook, color : "#FF0007" },
		{ value : badFacebook, color : "#5ACCBB" },
		{ value : missingLastfm, color : "#B200B2" },
		{ value : badLastfm, color : "#0EB29A" }

	];
	var ctx = $('#chart-valid-bands-pie', this.el).get(0).getContext("2d");
	var myPie = new Chart(ctx).Pie(pieData);
    }

  });

  return BandsDashboardView;

}); 
