define([
  'backbone',
  'models/job',
], function(Backbone, jobModel){
  var JobsCollection = Backbone.Collection.extend({
    model: jobModel,

    url: function() {
      var path = "/admin/job";
      path += "?limit=" + this.paginatorOptions.perPage;
      path += "&skip=" + (this.paginatorOptions.currentPage * this.paginatorOptions.perPage);
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

      return response.data; 
    },

    getPreviousPage: function() {
      this.paginatorOptions.currentPage--;
      this.fetch();
    },

    getNextPage: function() {
      this.paginatorOptions.currentPage++;
      this.fetch();
    },

    getFirstPage: function() {
      this.paginatorOptions.currentPage = 0;
      this.fetch();
    },

    getLastPage: function() {
      this.paginatorOptions.currentPage = (this.paginatorOptions.totalPages-1);
      this.fetch();
    }

  });

  return JobsCollection;

});
