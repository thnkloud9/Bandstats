define([
  'jquery',
  'underscore',
  'backbone',
  'vm',
  'models/band',
  'models/facebook_lookup_item',
  'models/lastfm_lookup_item',
  'models/spotify_lookup_item',
  'text!templates/bands/facebook_wizard_item.html',
  'text!templates/bands/lastfm_wizard_item.html',
  'text!templates/bands/spotify_wizard_item.html',
  'text!templates/bands/new_band_wizard.html',
  'typeahead'
], function($, _, Backbone, Vm,
    BandModel, 
    FacebookLookupItemModel,
    LastfmLookupItemModel,
    SpotifyLookupItemModel,
    facebookWizardItemTemplate,
    lastfmWizardItemTemplate,
    spotifyWizardItemTemplate,
    template) {

  var NewBandWizardView = Backbone.View.extend({
    el: '#new-band-wizard',
    tagName: "li",
    template: _.template(template),
    facebookItemTemplate: _.template(facebookWizardItemTemplate),
    lastfmItemTemplate: _.template(lastfmWizardItemTemplate),
    spotifyItemTemplate: _.template(spotifyWizardItemTemplate),

    events: {
      'click .save-band': 'saveBand',
      'click div.wizard-tab-menu>div.list-group>a': 'updateWizard',
      'click .next': 'nextStep',
      'change #wizard-band-name': 'updateBandName',
      'click .lnk-facebook-lookup-select': 'updateFacebookId',
      'click .lnk-facebook-lookup': 'showFacebookResults',
      'click .lnk-lastfm-lookup-select': 'updateLastfmId',
      'click .lnk-lastfm-lookup': 'showLastfmResults',
      'click .lnk-spotify-lookup-select': 'updateSpotifyId',
      'click .lnk-spotify-lookup': 'showSpotifyResults',
    },

    initialize: function () {
      this.model.bind("change", null, this);
      //this.model.bind("destroy", this.close, this);
    },

    render: function () {
      $(this.el).append(this.template(this.model.toJSON()));
      this.renderGenreTypeahead();
      this.renderRegionTypeahead();

      return this;
    },

    updateBandName: function () {
      this.lookupFacebookId();
      this.lookupLastfmId();
      this.lookupSpotifyId();
      $('#wizard-mentions-id').val($('#wizard-band-name').val());
    },

    updateWizard: function(e) {
      e.preventDefault();
      $(e.currentTarget).siblings('a.active').removeClass("active");
      $(e.currentTarget).addClass("active");
      var index = $(e.currentTarget).index();
      $("div.wizard-tab>div.wizard-tab-content").removeClass("active");
      $("div.wizard-tab>div.wizard-tab-content").eq(index).addClass("active");
    },

    nextStep: function(e) {
      var next = $(e.currentTarget).data('next');
      var nextTab = next + '-tab'; 
      var nextMenu = next + '-menu'; 

      $('.list-group-item').removeClass("active");
      $('#'+nextMenu).addClass("active");
      $("div.wizard-tab>div.wizard-tab-content").removeClass("active");
      $('#'+nextTab).addClass("active");
    },

    lookupFacebookId: function () {
      var parent = this;
      var search = $('#wizard-band-name').val();
      
      if (search == '') {
        return false; 
      }

      $.ajax("/admin/facebook/search?search=" + search, {
        type: "GET",
        dataType: "json",
          success: function(data) {
            $('#facebook-search-results', this.el).html('<ul id="facebook-lookup-results" class="list-inline"></ul>');
            $('#facebook-search-results').removeClass('loading-results');

            _.forEach(data[0].results, function(result) {
              var facebookLookupItemModel = new FacebookLookupItemModel(result);
              facebookLookupItemModel.set('band_id', 0);
              $('#facebook-lookup-results').append(parent.facebookItemTemplate(facebookLookupItemModel.toJSON())); 
            });

         },
         error: function(data) {
           console.log('error: ' + data);
         }
      });
    },

    lookupLastfmId: function (ev) {
      var parent = this;
      var search = $('#wizard-band-name').val();
      
      if (search == '') {
        return false; 
      }

      $.ajax("/admin/lastfm/search?search=" + search, {
        type: "GET",
        dataType: "json",
        success: function(data) {
	      $('#lastfm-search-results', this.el).html('<ul id="lastfm-lookup-results" class="list-inline"></ul>');
          $('#lastfm-search-results').removeClass('loading-results');

	      _.forEach(data[0].results, function(result) {
	        var lastfmLookupItemModel = new LastfmLookupItemModel(result);
            lastfmLookupItemModel.set('band_id', 0);
            $('#lastfm-lookup-results').append(parent.lastfmItemTemplate(lastfmLookupItemModel.toJSON())); 
	      });

        },
        error: function(data) {
	      console.log('error: ' + data);
        }
      }); 	
    },

    lookupSpotifyId: function (ev) {
      var parent = this;
      var search = $('#wizard-band-name').val();
      
      if (search == '') {
        return false; 
      }

      $.ajax("/admin/spotify/search?search=" + search, {
        type: "GET",
        dataType: "json",
        success: function(data) {
	      $('#spotify-search-results', this.el).html('<ul id="spotify-lookup-results" class="list-inline"></ul>');
          $('#spotify-search-results').removeClass('loading-results');

	      _.forEach(data[0].results, function(result) {
	        var spotifyLookupItemModel = new SpotifyLookupItemModel(result);
            spotifyLookupItemModel.set('band_id', 0);
            $('#spotify-lookup-results').append(parent.spotifyItemTemplate(spotifyLookupItemModel.toJSON())); 
	      });

        },
        error: function(data) {
	      console.log('error: ' + data);
        }
      }); 	
    },

    renderGenreTypeahead: function () {
      var search = new Bloodhound({
        datumTokenizer: function (d) {
            Bloodhound.tokenizers.whitespace(d.value)
        },
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        limit: 10,
        remote: {
          url: '/admin/band/genres?search=%QUERY',
          filter: function(genres) {
            return $.map(genres, function(genre) { return { name: genre }; });
          }
        }
      });

      search.initialize();

      $('#wizard-genre-typeahead').typeahead(null, {
        name: 'genres',
        displayKey: 'name',
        source: search.ttAdapter(),
      });      
    },

    renderRegionTypeahead: function () {
      var search = new Bloodhound({
        datumTokenizer: function (d) {
            Bloodhound.tokenizers.whitespace(d.value)
        },
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        limit: 10,
        remote: {
          url: '/admin/band/regions?search=%QUERY',
          filter: function(regions) {
            return $.map(regions, function(region) { return { name: region }; });
          }
        }
      });

      search.initialize();

      $('#wizard-region-typeahead').typeahead(null, {
        name: 'regions',
        displayKey: 'name',
        source: search.ttAdapter(),
      });      
    },

    saveBand: function (ev) {
      if (ev) {
        ev.preventDefault();
      }


      var externalIds = this.model.get('external_ids');
      externalIds.facebook_id = $('#wizard-facebook-id').val();
      externalIds.lastfm_id = $('#wizard-lastfm-id').val();
      externalIds.spotify_id = $('#wizard-spotify-id').val();
      externalIds.mentions_id = $('#wizard-mentions-id').val();
      var genres =  this.model.get('genres');
      genres.push($('#wizard-genre-typeahead').val());
      var regions =  this.model.get('regions');
      regions.push($('#wizard-region-typeahead').val());

      this.model.set({
        band_name: $('#wizard-band-name').val(),
        external_ids: externalIds,
        genres: genres,
        regions: regions,
        band_id: null
      });

      this.model.save(null, {
        success: function(band, response) {
          var newBandId = response.band[0].band_id;
          $('.flash-message').addClass('alert-success').text("Saved New Band Id: " + newBandId).show();
          Backbone.history.navigate('bands/' + newBandId, true);
        }, 
        error: function(band, response) {
          console.log('error:', response);
          $('.flash-message').addClass('alert-danger').text(response.statusText).show();
        }
      });

    }, 

    showFacebookResults: function() {
      $('#facebook-lookup-results').show();
    },

    updateFacebookId: function(ev) {
      var facebookId = String($(ev.currentTarget).data("facebook-id"));
      $('#wizard-facebook-id').val(facebookId);
      $('#facebook-lookup-results').hide();
    },

    showLastfmResults: function() {
      $('#lastfm-lookup-results').show();
    },

    updateLastfmId: function(ev) {
      var lastfmId = String($(ev.currentTarget).data("lastfm-id"));
      $('#wizard-lastfm-id').val(lastfmId);
      $('#lastfm-lookup-results').hide();
    },

    showSpotifyResults: function() {
      $('#spotify-lookup-results').show();
    },

    updateSpotifyId: function(ev) {
      var spotifyId = String($(ev.currentTarget).data("spotify-id"));
      $('#wizard-spotify-id').val(spotifyId);
      $('#spotify-lookup-results').hide();
    }

  });

  return NewBandWizardView;

}); 
