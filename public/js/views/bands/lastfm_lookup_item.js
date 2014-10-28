define([
  'jquery',
  'underscore',
  'backbone',
  'models/band',
  'text!templates/bands/lastfm_lookup_item.html' 
], function($, _, Backbone, BandModel, template) {

  var LastfmLookupItemView = Backbone.View.extend({
    el: '#lastfm-lookup-results',
    tagName: "li",
    template: _.template(template),

    events: {
      'click .lnk-lastfm-lookup-select': 'updateLastfmId',
    },

    initialize: function () {
      //this.model.bind("change", this.render, this);
      //this.model.bind("destroy", this.close, this);
    },

    render: function () {
      $(this.el).append(this.template(this.model.toJSON()));
      return this;
    },

    updateLastfmId: function(ev) {
      var lastfmId = String($(ev.currentTarget).data("lastfm-id"));
      var bandId = this.model.get('band_id');
      var bandModel = new BandModel({band_id: bandId});
      bandModel.fetch({
        success: function (model, response) {
	      // only update lastfm_id, copy rest from previous
          var externalIds = model.get('external_ids');
          externalIds.lastfm_id = lastfmId;
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

  return LastfmLookupItemView;

}); 
