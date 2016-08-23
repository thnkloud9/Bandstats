define([
  'jquery',
  'underscore',
  'backbone',
  'text!templates/pagination_header.html'
], function($, _, Backbone, paginationTemplate) {

  var Paginator = Backbone.View.extend({
    id: 'paginator',
    className: "pagination pagination-centered",
    tagName: 'ul',
    template: _.template(paginationTemplate),

    initialize:function () {
        this.collection.on("reset", this.render, this);
    },

    events: { 
      'click a#prev': 'getPreviousPage',
      'click a#next': 'getNextPage',
      'click a#first': 'getFirstPage',
      'click a#last': 'getLastPage',
    },

    render:function () {

      var totalPages = this.collection.paginatorOptions.totalPages;
      var templateData = {
        hasFirst: this.collection.paginatorOptions.hasFirst,
        hasPrevious: this.collection.paginatorOptions.hasPrevious,
        hasNext: this.collection.paginatorOptions.hasNext,
        hasLast: this.collection.paginatorOptions.hasLast,
      };
  
      this.$el.html(this.template(templateData));

      return this;
   },

   getFirstPage: function(event) {
     event.preventDefault(); 
     this.collection.getFirstPage();
   },

   getPreviousPage: function(event) {
     event.preventDefault(); 
     this.collection.getPreviousPage();
   },

   getNextPage: function(event) {
     event.preventDefault(); 
     this.collection.getNextPage();
   },

   getLastPage: function(event) {
     event.preventDefault(); 
     this.collection.getLastPage();
   },

  });

  return Paginator;
});    
