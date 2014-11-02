define([
  'backbone',
  'models/band',
], function(Backbone, bandModel){
  var BandsCollection = Backbone.Collection.extend({
    model: bandModel,
    filter: {},
    sort: {},
    bandSearch: null,
    startQuery: null,
    altPath: null, 

    initialize : function(bandSearch, startQuery, altPath){
      if (bandSearch) {
        this.bandSearch = bandSearch;
      }

      if (startQuery) {
        this.startQuery = startQuery;
      }

      if (altPath) {
        this.altPath = altPath;
      }
    },

    url: function() {
      var path = (this.altPath) ? this.altPath : "/admin/band";
      path += "?limit=" + this.paginatorOptions.perPage;
      path += "&skip=" + (this.paginatorOptions.currentPage * this.paginatorOptions.perPage);

      // note: these are saved queries referrenced by name
      // not actual mongo queries
      if (this.startQuery) {
        path += "&startQuery=" + this.startQuery;
      }

      if (this.bandSearch) {
        path += "&search=" + this.bandSearch;
      }
    
      _.forEach(this.sort, function(direction, field) {
        path+= "&sort[" + field + "]=" + direction;
      });

      _.forEach(this.filter, function(values, field) {
        if (typeof values === "object") {
          _.forEach(values, function(value) {
            path+= "&filter[" + field + "]=" + value;
	      });
        } else {
          path+= "&filter[" + field + "]=" + values;
        }
      });
    
      return path;
    },

    paginatorOptions: {
      currentPage: 0,
      perPage: 12,
      totalPages: 0,
      totalRecords: 0,
      hasPrevious: false,
      hasNext: false,
      hasFirst: false,
      hasLast: false,
    },

    setStartQuery: function (startQuery) {
      this.startQuery = startQuery;
    },

    server_api: {
      'limit': function() { return this.perPage },
      'skip': function() { return this.currentPage * this.perPage; }
    },

    getName: function() {
        return "Bands";
    },

    parse: function (response) {
      // set pagination info
      this.paginatorOptions.totalPages = Math.ceil(response.totalRecords / this.paginatorOptions.perPage);
      this.paginatorOptions.totalRecords = parseInt(response.totalRecords);
      if (this.paginatorOptions.totalRecords > 0) {
        this.paginatorOptions.hasFirst = true;
        this.paginatorOptions.hasLast = true;
      } else {
        this.paginatorOptions.hasFirst = false;
        this.paginatorOptions.hasLast = false;
      }

      if (this.paginatorOptions.currentPage > 0) {
        this.paginatorOptions.hasPrevious = true;
      } else {
        this.paginatorOptions.hasPrevious = false;
      }

      if (((this.paginatorOptions.currentPage+1) * this.paginatorOptions.perPage) < this.paginatorOptions.totalRecords) {
        this.paginatorOptions.hasNext = true;
      } else {
        this.paginatorOptions.hasNext = false;
      }

      $('#band-list-total').html(this.paginatorOptions.totalRecords);
      return response.data; 
    },

    getPreviousPage: function() {
      this.reset();
      this.paginatorOptions.currentPage--;
      this.fetch();
    },

    getNextPage: function() {
      this.reset();
      this.paginatorOptions.currentPage++;
      this.fetch();
    },

    getFirstPage: function() {
      this.reset();
      this.paginatorOptions.currentPage = 0;
      this.fetch();
    },

    getLastPage: function() {
      this.reset();
      this.paginatorOptions.currentPage = (this.paginatorOptions.totalPages-1);
      this.fetch();
    }

  });

  return BandsCollection;

});
