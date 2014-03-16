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
  'text!templates/bands/band_detail.html',
  'typeahead' 
], function($, _, Backbone, Vm, BandModel, 
    FacebookStatsPanelView, 
    LastfmStatsPanelView, 
    FacebookStatsTableView, 
    LastfmStatsTableView, 
    template) {

  var BandDetailView = Backbone.View.extend({

    el: "#content",

    template: _.template(template),

    initialize: function () {
      this.children = {};
    },

    loadBand: function (id) {
      this.model = new BandModel({band_id: id});
      this.model.fetch();

      this.model.bind("change", this.render, this);
      this.model.bind("destroy", this.close, this);
    
    },

    render: function () {
      $(this.el).html(this.template(this.model.attributes));
      
      this.renderGenreTypeahead();
      this.renderRegionTypeahead();
 
      var facebookStatsPanelView = Vm.create(this, 'FacebookStatsPanelView', FacebookStatsPanelView, {model: this.model});
      $(facebookStatsPanelView.render().el).appendTo($('#facebook-stats-content', this.el));

      var lastfmStatsPanelView = Vm.create(this, 'LastfmStatsPanelView', LastfmStatsPanelView, {model: this.model});
      $(lastfmStatsPanelView.render().el).appendTo($('#lastfm-stats-content', this.el));

      var facebookStatsTableView = Vm.create(this, 'FacebookStatsTableView', FacebookStatsTableView, {model: this.model});
      $(facebookStatsTableView.render().el).appendTo($('#facebook-stats-table', this.el));

      var lastfmStatsTableView = Vm.create(this, 'LastfmStatsTableView', LastfmStatsTableView, {model: this.model});
      $(lastfmStatsTableView.render().el).appendTo($('#lastfm-stats-table', this.el));

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

    destroyChildren: function () {
      var parent = this;
      _.each(this.children, function(child, name) {
        if (child.close) {
          child.close();
        }
        child.remove();
        child.undelegateEvents();
        child.unbind();
      }, this);
      this.children = {};
    }

  });

  return BandDetailView;

}); 
