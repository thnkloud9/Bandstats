define([
  'jquery',
  'underscore',
  'backbone',
  'vm',
  'views/bands/band_list',
  'views/bands/band_gallery',
  'views/bands/band_tile',
  'text!templates/bands/bands_page.html',
], function($, _, Backbone, Vm, 
    BandListView, 
    BandGalleryView, 
    BandTileView, 
    bandsPageTemplate) {

  var BandsPage = Backbone.View.extend({
    el: '#content',
    template: _.template(bandsPageTemplate),
    filter: {},
    sort: {},
    viewType: 'tile',
    requiredViews: [],

    initialize: function(options) {
      this.session = options.session; 
      this.vent = options.vent;
      this.filter.genres = [];
      this.filter.regions = [];
	  //this.sort['running_stats.facebook_likes.current'] = "desc";
    },

    applySessionFilter: function () {
      // apply session filter
      var sessionFilter = this.session.get('filter'); 
      var sessionSort = this.session.get('sort'); 

      if (sessionFilter) {
	    this.filter = sessionFilter;
      }

      // apply session sort
      if (this.session.sort) {
	    this.sort = this.session.sort;
      }

      // appy view type
      this.viewType = this.session.get('view');

      this.applyFilter();
    },

    events: { 
      'click button#btn-gallery-view': 'renderBandGallery',
      'click button#btn-list-view': 'renderBandList',
      'click button#btn-tile-view': 'renderBandTile',
      'click button#btn-show-filter': 'showFilter',
      'click button#btn-apply-filter': 'applyFilter',
      'click button#btn-clear-filter': 'clearFilter',
      'click button#btn-add-genre-filter': 'addGenreFilter',
      'click button#btn-add-region-filter': 'addRegionFilter',
      'click button#btn-add-sort-filter': 'addSortFilter',

      // not happy about having this here, but its needed for these 
      // to work in gallery view as well as band_detail views
      'click .lnk-facebook-lookup': 'lookupFacebookId',
      'click .lnk-facebook-clear': 'clearFacebookId',
      'click .lnk-facebook-collect': 'collectFacebookLikes',

      'click .lnk-lastfm-lookup': 'lookupLastfmId',
      'click .lnk-lastfm-clear': 'clearLastfmId',
      'click .lnk-lastfm-collect': 'collectLastfmLikes',
    },

    clearFacebookId: function (ev) {
      this.vent.trigger("facebookStatsPanel.clearFacebookId", ev);
    },

    collectFacebookLikes: function (ev) {
      this.vent.trigger("facebookStatsPanel.collectFacebookLikes", ev);
    },

    lookupFacebookId: function (ev) {
      this.vent.trigger("facebookStatsPanel.lookupFacebookId", ev);
    },

    clearLastfmId: function (ev) {
      this.vent.trigger("lastfmStatsPanel.clearLastfmId", ev);
    },

    collectLastfmLikes: function (ev) {
      this.vent.trigger("lastfmStatsPanel.collectLastfmLikes", ev);
    },

    lookupLastfmId: function (ev) {
      this.vent.trigger("lastfmStatsPanel.lookupLastfmId", ev);
    },


    addGenreFilter: function() {
      var genre = $('#genre-typeahead').val();
      if (genre != "") {
	    this.filter.genres.push(genre);
      }
      $('#band-list-filter', this.el).append('<li><span class="label label-default">' + genre + '</span></li>');
      $('#genre-typeahead').val('');
    },

    addRegionFilter: function() {
      var region = $('#region-typeahead').val();	
      if (region != "") {
	    this.filter.regions.push(region);
      }
      $('#band-list-filter', this.el).append('<li><span class="label label-default">' + region + '</span></li>'); 
      $('#region-typeahead').val('');
    },

    addSortFilter: function() {
      var sortField = $('#select-sort').val();
      var direction = $('#select-direction').val();
      this.sort[sortField] = direction;
      $('#band-list-filter', this.el).append('<li><span class="label label-default">' + $('#select-sort option:selected').text() + ' ' + direction + '</span></li>'); 
    },

    render: function () {
      // load this with filter data from the collection
      var sorts = [];
      _.forEach(this.sort, function (direction, field) {
	    sorts.push(field + ' ' + direction);
      });
      var templateData = {
        genres: this.filter.genres,
        regions: this.filter.regions,
	    sorts: sorts
      };

      this.$el.html(this.template(templateData));

      this.renderGenreTypeahead();
      this.renderRegionTypeahead();
    
      require(['views/sidenav/bands_menu'], function (SideNavView) {
        var sideNavView = Vm.create(parent, 'SideNavView', SideNavView);
        sideNavView.render();                                      
      });

      this.renderViewType();
    },

    /**
     * typeahead lookups
     */
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

    /**
     * child view render functions 
     */
    renderViewType: function () {
      if (this.viewType === 'tile') {
        this.renderBandTile();
      }
      if (this.viewType === 'gallery') {
        this.renderBandGallery();
      }
      if (this.viewType === 'list') {
        this.renderBandList();
      }
    },

    renderBandGallery: function () {
      this.destroyChildren();
      var bandGalleryView = Vm.create(this, 'BandGalleryView', BandGalleryView, {collection: this.collection, vent: this.vent});
      $(bandGalleryView.render().el).appendTo('#bands-page-content');

      // save view to session prefs
      this.session.set('view', 'gallery');
    },

    renderBandList: function () {
      this.destroyChildren();
      var bandListView = Vm.create(this, 'BandListView', BandListView, {collection: this.collection, vent: this.vent});
      $(bandListView.render().el).appendTo('#bands-page-content');

      // save view to session prefs
      this.session.set('view', 'list');
    },

    renderBandTile: function () {
      this.destroyChildren();
      var bandTileView = Vm.create(this, 'BandTileView', BandTileView, {collection: this.collection, vent: this.vent});
      $(bandTileView.render().el).appendTo('#bands-page-content');

      // save view to session prefs
      this.session.set('view', 'tile');
    },

    /**
     * filter functions 
     */
    showFilter: function () {
	  $('#bands-filter-list-content').toggle();
    },
 
    applyFilter: function () {
 	  this.collection.filter = this.filter;
 	  this.collection.sort = this.sort;
	  this.collection.getFirstPage();
    
      // save the filters to the session
      this.session.set('filter', this.filter);
      this.session.set('sort', this.sort);

	  this.render();
    },

    clearFilter: function () {
	  this.filter = {};
	  this.sort = {};
      this.filter.genres = [];
      this.filter.regions = [];

 	  this.collection.filter = this.filter;
 	  this.collection.sort = this.sort;
	  this.collection.getFirstPage();

      // clear the filters to the session
      this.session.set('filter', this.filter);
      this.session.set('sort', this.sort);

	  this.render();
    },

    destroyChildren: function () {
      _.each(this.children, function(child, name) {
        if (this.requiredViews.indexOf(name) < 0) {
          if (typeof child.close === 'function') {
            child.close();
          }
          child.vmClose();
          child.remove();
          child.undelegateEvents();
          child.unbind();
          child.off();
          delete this.children[name];
        }
      }, this);
    }
  });
  return BandsPage;
});
