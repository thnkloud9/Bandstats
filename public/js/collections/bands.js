define([
  'backbone',
  'models/band',
], function(Backbone, bandModel){
  var BandsCollection = Backbone.Collection.extend({
    model: bandModel,
    filter: {},
    sort: {},
    query: null, 

    initialize : function(query){
      if (query) {
        this.query = query;
      }

      this.sort['running_stats.facebook_likes.current'] = "desc"; 
    
    },

    url: function() {
      var path = "/admin/band";
      path += "?limit=" + this.paginatorOptions.perPage;
      path += "&skip=" + (this.paginatorOptions.currentPage * this.paginatorOptions.perPage);

      if (this.query) {
        path += "&search=" + this.query;
      }
    
      _.forEach(this.sort, function(direction, field) {
        path+= "&sort[" + field + "]=" + direction;
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

      // this should be in the bands_page view, but it doesn't
      // seem to work from there, so its here for now
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
