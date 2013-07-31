var app = app || {};

app.Bands = Backbone.Paginator.requestPager.extend({
  model: app.Band,
  paginator_core: {
    type: 'GET',
    dataType: 'json',
    url: '/admin/band'
  },
  paginator_ui: {
    firstPage: 0,
    currentPage: 0,
    perPage: 10,
    totalPages: 100
  },
  server_api: {
    '$limit': function() { return this.perPage },
    '$skip': function() { return this.currentPage * this.perPage }
  },
  parse: function (response) {
    return response; 
  }
});
