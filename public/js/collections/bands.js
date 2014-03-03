define([
  'backbone',
  'models/band',
  'paginator'
], function(Backbone, bandModel){
  var BandsCollection = Backbone.Paginator.requestPager.extend({
    model: bandModel,
    paginator_core: {
      type: 'GET',
      dataType: 'json',
      url: '/admin/band'
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

  return BandsCollection;

});
