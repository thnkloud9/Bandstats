define([
  'jquery',
  'underscore',
  'backbone',
  'models/band',
  'text!templates/bands/facebook_lookup_item.html' 
], function($, _, Backbone, BandModel, template) {

  var FacebookLookupItemView = Backbone.View.extend({
    el: '#facebook-lookup-results',
    tagName: "li",
    template: _.template(template),

    events: {
      'click .lnk-facebook-lookup-select': 'updateFacebookId',
    },

    initialize: function () {
      //this.model.bind("change", this.render, this);
      //this.model.bind("destroy", this.close, this);
    },

    render: function () {
      $(this.el).append(this.template(this.model.toJSON()));
      return this;
    },

    updateFacebookId: function(ev) {
      var facebookId = String($(ev.currentTarget).data("facebook-id"));
      var bandId = this.model.get('band_id');
      var bandModel = new BandModel({band_id: bandId});
      bandModel.fetch({
        success: function (model, response) {
	  // only update facebook_id, copy rest from previous
          var externalIds = model.get('external_ids');
          externalIds.facebook_id = facebookId;
	  model.set({external_ids: externalIds}); 

          model.save(null, { 
            success: function(band, saveResponse) {
	      console.log(bandId + ' saved');
              $('.flash-message').addClass('alert-success').text("Success").show();
            }, 
            error: function(band, saveResponse) {
              console.log('error:', response);
              $('.flash-message').addClass('alert-danger').text(response.statusText).show();
            }
          });
          
	}
      });

    }

  });

  return FacebookLookupItemView;

}); 
