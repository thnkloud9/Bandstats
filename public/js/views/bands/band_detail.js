define([
  'jquery',
  'underscore',
  'backbone',
  'vm',
  'models/band',
  'views/bands/facebook_stats_panel',
  'views/bands/lastfm_stats_panel',
  'views/bands/spotify_stats_panel',
  'views/bands/facebook_stats_table',
  'views/bands/lastfm_stats_table',
  'views/bands/spotify_stats_table',
  'views/bands/mentions_stats_panel',
  'views/bands/mentions_stats_table',
  'views/bands/running_stats_chart',
  'text!templates/bands/band_detail.html',
  'typeahead'
], function($, _, Backbone, Vm, 
    BandModel, 
    FacebookStatsPanelView, 
    LastfmStatsPanelView, 
    SpotifyStatsPanelView, 
    FacebookStatsTableView, 
    LastfmStatsTableView, 
    SpotifyStatsTableView, 
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
      'click #band-clear-all': 'clearAllStats',
      'click #btn-add-genre': 'addGenre',
      'click #btn-add-region': 'addRegion',
      'click .btn-delete-genre': 'deleteGenre',
      'click .btn-delete-region': 'deleteRegion',
      'click #toggle-active': 'toggleActive',
      'click #toggle-article-matching': 'toggleArticleMatching',
      'dragstart .image-draggable': 'imageDrag',
      'dragover .image-droppable': function (e) { e.preventDefault(); },
      'drop .image-droppable': 'imageDrop'
    }, 

    initialize: function (options) {
      this.vent = options.vent;
    },

    imageDrag: function (e) {
      var source = $(e.target).attr('src');
      e.originalEvent.dataTransfer.setData('src', source);
    },

    imageDrop: function (e) {
      e.preventDefault();
      $(e.target).attr('src', e.originalEvent.dataTransfer.getData('src'));
    },

    toggleActive: function () {
        if (this.model.get('active') == 'true') {
            this.model.set('active', 'false');
        } else {
            this.model.set('active', 'true');
        }
        this.render();
    },

    toggleArticleMatching: function () {
        if (this.model.get('article_matching') == 'true') {
            this.model.set('article_matching', 'false');
        } else {
            this.model.set('article_matching', 'true');
        }
        this.render();
    },

    clearAllStats: function () {
      var runningStats =  this.model.get('running_stats');
      runningStats.facebook_likes = {
        current: 0,
        incremental_avg: 0,
        incremental_total: 0,
        last_updated: "",
        incremental: 0,
        daily_stats: [] 
      }
      runningStats.lastfm_listeners = {
        current: 0,
        incremental_avg: 0,
        incremental_total: 0,
        last_updated: "",
        incremental: 0,
        daily_stats: [] 
      }
      runningStats.spotify_followers = {
        current: 0,
        incremental_avg: 0,
        incremental_total: 0,
        last_updated: "",
        incremental: 0,
        daily_stats: [] 
      }
      this.model.set('running_stats', runningStats);
      this.model.set('mentions', []);
      this.model.set('mentions_total', 0);
      this.model.set('mentions_this_period', 0);
      this.model.save();
      this.render();
    },

    addGenre: function () {
      var genres =  this.model.get('genres');
      genres.push($('#genre-typeahead').val());
      this.model.set('genres', genres);
      this.model.save();
      this.render();
    },

    deleteGenre: function (ev) {
      var genre = $(ev.currentTarget).data("genre");
      var genres =  this.model.get('genres');
      genres.splice(genres.indexOf(genre), 1);
      this.model.set('genres', genres);
      this.model.save();
      this.render();
    },

    addRegion: function () {
      var regions =  this.model.get('regions');
      regions.push($('#region-typeahead').val());
      this.model.set('regions', regions);
      this.model.save();
      this.render();
    },

    deleteRegion: function (ev) {
      console.log('calling delete region');
      var region = $(ev.currentTarget).data("region");
      var regions =  this.model.get('regions');
      regions.splice(regions.indexOf(region), 1);
      this.model.set('regions', regions);
      this.model.save();
      this.render();
    },

    loadBand: function (id) {
      this.model = new BandModel({band_id: id});
      this.model.fetch();

      this.model.bind("change", this.render, this);
      this.model.bind("destroy", this.close, this);
      this.model.bind("fetch", this.render, this);
    
    },

    render: function () {
      var parent = this;
      $(this.el).html(this.template(this.model.attributes));

      this.renderGenreTypeahead();
      this.renderRegionTypeahead();

      var stats = this.model.attributes.running_stats.facebook_likes.daily_stats;
      var facebookChartView = Vm.create(this, 'FacebookChartView', RunningStatsChartView, {model: this.model, vent: this.vent, chart_data: stats});
      $(facebookChartView.render().el).appendTo($('#facebook-chart-content', this.el));

      stats = this.model.attributes.running_stats.lastfm_listeners.daily_stats;
      var lastfmChartView = Vm.create(this, 'LastfmChartView', RunningStatsChartView, {model: this.model, vent: this.vent, chart_data: stats});
      $(lastfmChartView.render().el).appendTo($('#lastfm-chart-content', this.el));

      stats = this.model.attributes.running_stats.spotify_followers.daily_stats;
      var spotifyChartView = Vm.create(this, 'SpotifyChartView', RunningStatsChartView, {model: this.model, vent: this.vent, chart_data: stats});
      $(spotifyChartView.render().el).appendTo($('#spotify-chart-content', this.el));
 
      var facebookStatsPanelView = Vm.create(this, 'FacebookStatsPanelView', FacebookStatsPanelView, {model: this.model, vent: this.vent});
      $(facebookStatsPanelView.render().el).appendTo($('#facebook-stats-content', this.el));
      facebookStatsPanelView.on('refreshParent', this.render, this);

      var lastfmStatsPanelView = Vm.create(this, 'LastfmStatsPanelView', LastfmStatsPanelView, {model: this.model, vent: this.vent});
      $(lastfmStatsPanelView.render().el).appendTo($('#lastfm-stats-content', this.el));
      lastfmStatsPanelView.on('refreshParent', this.render, this);

      var spotifyStatsPanelView = Vm.create(this, 'SpotifyStatsPanelView', SpotifyStatsPanelView, {model: this.model, vent: this.vent});
      $(spotifyStatsPanelView.render().el).appendTo($('#spotify-stats-content', this.el));
      spotifyStatsPanelView.on('refreshParent', this.render, this);

      var facebookStatsTableView = Vm.create(this, 'FacebookStatsTableView', FacebookStatsTableView, {model: this.model, vent: this.vent});
      $(facebookStatsTableView.render().el).appendTo($('#facebook-stats-table', this.el));

      var lastfmStatsTableView = Vm.create(this, 'LastfmStatsTableView', LastfmStatsTableView, {model: this.model, vent: this.vent});
      $(lastfmStatsTableView.render().el).appendTo($('#lastfm-stats-table', this.el));

      var spotifyStatsTableView = Vm.create(this, 'SpotifyStatsTableView', SpotifyStatsTableView, {model: this.model, vent: this.vent});
      $(spotifyStatsTableView.render().el).appendTo($('#spotify-stats-table', this.el));

      var mentionsStatsTableView = Vm.create(this, 'MentionsStatsTableView', MentionsStatsTableView, {model: this.model, vent: this.vent});
      $(mentionsStatsTableView.render().el).appendTo($('#mentions-stats-table', this.el));

      var mentionsStatsPanelView = Vm.create(this, 'MentionsStatsPanelView', MentionsStatsPanelView, {model: this.model, vent: this.vent});
      $(mentionsStatsPanelView.render().el).appendTo($('#mentions-stats-content', this.el));

      $('.bs-tooltip').tooltip();

      // if this is a new band, show the wizard modal
      if (this.model.get('band_id') === "0") {
        require(['views/modal', 'views/bands/new_band_wizard'], function (ModalView, NewBandWizardView) {
          var modalView = Vm.create(parent, 'ModalView', ModalView, {vent: parent.vent, buttons: {}});
          modalView.render();
          $('#admin-modal').modal('show');
          $('#admin-modal-title').html('Add a new band wizard');
	      $('.admin-modal-content', this.el).html('<ul id="new-band-wizard" class="list-inline"></ul>');
          var newBandWizardView = Vm.create(parent, 'NewBandWizardView', NewBandWizardView, {model: parent.model});
	      newBandWizardView.render();
        });
      }

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
      externalIds.spotify_id = $('#spotify-id').val();
      externalIds.mentions_id = $('#mentions-id').val();

      this.model.set({
        band_name: $('#band-name').val(),
        band_url: $('#band-url').val(),
        external_ids: externalIds
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
          var html = "<a href='#bands'>Band List</a>";
          $('.flash-message').addClass('alert-success').html("Success " + html).show();
        }
      });
    },

  });

  return BandDetailView;

}); 
