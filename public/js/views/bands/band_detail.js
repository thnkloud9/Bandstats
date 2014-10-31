define([
  'jquery',
  'underscore',
  'backbone',
  'vm',
  'models/band',
  'views/bands/facebook_stats_panel',
  'views/bands/lastfm_stats_panel',
  'views/bands/facebook_stats_table',
  'views/bands/lastfm_stats_table',
  'views/bands/mentions_stats_panel',
  'views/bands/mentions_stats_table',
  'views/bands/running_stats_chart',
  'text!templates/bands/band_detail.html',
  'typeahead',
  'simpleDragAndDrop',
], function($, _, Backbone, Vm, 
    BandModel, 
    FacebookStatsPanelView, 
    LastfmStatsPanelView, 
    FacebookStatsTableView, 
    LastfmStatsTableView, 
    MentionsStatsPanelView, 
    MentionsStatsTableView, 
    RunningStatsChartView, 
    template) {

  var BandDetailView = Backbone.View.extend({

    el: "#content",

    template: _.template(template),

    events: {
      'click #band-save': 'saveBand',
      'click #band-delete': 'deleteBand',
      'click #btn-add-genre': 'addGenre',
      'click #btn-add-region': 'addRegion',
      'click .btn-delete-genre': 'deleteGenre',
      'click .btn-delete-region': 'deleteRegion',
    }, 

    initialize: function (options) {
      this.vent = options.vent;
    },

    addGenre: function () {
      var genres =  this.model.get('genres');
      genres.push($('#genre-typeahead').val());
      this.model.set('genres', genres);
      this.model.save();
    },

    deleteGenre: function (ev) {
      var genre = $(ev.currentTarget).data("genre");
      var genres =  this.model.get('genres');
      genres.splice(genres.indexOf(genre), 1);
      this.model.set('genres', genres);
      this.model.save();
    },

    addRegion: function () {
      var regions =  this.model.get('regions');
      regions.push($('#region-typeahead').val());
      this.model.set('regions', regions);
      this.model.save();
    },

    deleteRegion: function (ev) {
      var region = $(ev.currentTarget).data("region");
      var regions =  this.model.get('regions');
      regions.splice(regions.indexOf(region), 1);
      this.model.set('regions', regions);
      this.model.save();
    },

    loadBand: function (id) {
      this.model = new BandModel({band_id: id});
      this.model.fetch();

      this.model.bind("change", this.render, this);
      this.model.bind("destroy", this.close, this);
      this.model.bind("fetch", this.render, this);
    
    },

    render: function () {
      $(this.el).html(this.template(this.model.attributes));

      this.renderGenreTypeahead();
      this.renderRegionTypeahead();

      var runningStatsChartView = Vm.create(this, 'RunningStatsChartView', RunningStatsChartView, {model: this.model, vent: this.vent});
      $(runningStatsChartView.render().el).appendTo($('#running-stats-chart-content', this.el));
 
      var facebookStatsPanelView = Vm.create(this, 'FacebookStatsPanelView', FacebookStatsPanelView, {model: this.model, vent: this.vent});
      $(facebookStatsPanelView.render().el).appendTo($('#facebook-stats-content', this.el));

      var lastfmStatsPanelView = Vm.create(this, 'LastfmStatsPanelView', LastfmStatsPanelView, {model: this.model, vent: this.vent});
      $(lastfmStatsPanelView.render().el).appendTo($('#lastfm-stats-content', this.el));

      var facebookStatsTableView = Vm.create(this, 'FacebookStatsTableView', FacebookStatsTableView, {model: this.model, vent: this.vent});
      $(facebookStatsTableView.render().el).appendTo($('#facebook-stats-table', this.el));

      var lastfmStatsTableView = Vm.create(this, 'LastfmStatsTableView', LastfmStatsTableView, {model: this.model, vent: this.vent});
      $(lastfmStatsTableView.render().el).appendTo($('#lastfm-stats-table', this.el));

      var mentionsStatsTableView = Vm.create(this, 'MentionsStatsTableView', MentionsStatsTableView, {model: this.model, vent: this.vent});
      $(mentionsStatsTableView.render().el).appendTo($('#mentions-stats-table', this.el));

      var mentionsStatsPanelView = Vm.create(this, 'MentionsStatsPanelView', MentionsStatsPanelView, {model: this.model, vent: this.vent});
      $(mentionsStatsPanelView.render().el).appendTo($('#mentions-stats-content', this.el));

      return this;
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

      $('#genre-typeahead').typeahead(null, {
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

      $('#region-typeahead').typeahead(null, {
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
      externalIds.facebook_id = $('#facebook-id').val();
      externalIds.lastfm_id = $('#lastfm-id').val();

      this.model.set({
        band_name: $('#band-name').val(),
        band_url: $('#band-url').val(),
        external_ids: externalIds,
        active: ($('#active').prop('checked')) ? "true" : "false",
      });

      // remove id if this is a new model
      if (this.model.get('band_id') === "0") {
        this.model.set('band_id', null);
      }

      this.model.save(null, {
        success: function(band, response) {
          $('.flash-message').addClass('alert-success').text("Success").show();
        }, 
        error: function(band, response) {
          console.log('error:', response);
          $('.flash-message').addClass('alert-danger').text(response.statusText).show();
        }
      });

    }, 

    deleteBand: function (ev) {
      ev.preventDefault();

      this.model.destroy({
        success: function(band, response) {
          $('.flash-message').addClass('alert-success').text("Success").show();
        }
      });
    },

  });

  return BandDetailView;

}); 
