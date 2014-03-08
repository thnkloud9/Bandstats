define([
  'backbone',
  'models/band',
  'paginator'
], function(Backbone, bandModel){
  var BandsSearchCollection = Backbone.Paginator.requestPager.extend({
    model: bandModel,

    initialize : function(query){
        this.query = query;
    },

    paginator_core: {
      type: 'GET',
      dataType: 'json',
      url: function() {
        return '/admin/band?search=' + this.query
      }
    },

    paginator_ui: {
      firstPage: 0,
      currentPage: 0,
      perPage: 12,
      totalPages: 100
    },

    server_api: {
      'limit': function() { return this.perPage },
      'skip': function() { return this.currentPage * this.perPage; }
    },

    parse: function (response) {
      this.totalPages = Math.ceil(response.totalRecords / this.perPage);
      this.totalRecords = parseInt(response.totalRecords);
      return response.data; 
    }
  });

  return BandsSearchCollection;

});
