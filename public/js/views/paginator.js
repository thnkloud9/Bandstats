define([
  'jquery',
  'underscore',
  'backbone',
  'text!templates/pagination_header.html'
], function($, _, Backbone, paginationTemplate) {

  var Paginator = Backbone.View.extend({
    el: '#paginator',
    className: "pagination pagination-centered",
    template: _.template(paginationTemplate),

    initialize:function () {
        this.model.on("reset", this.render, this);
    },

    events: { 
      'click a#prev': 'requestPreviousPage',
      'click a#next': 'requestNextPage'
    },

    render:function () {

     var totalPages = this.model.totalPages;
        
     var templateData = {
       hasPrevious: this.model.info().hasPrevious,
       hasNext: this.model.info().hasNext   
     };
   
     $('.pagination', this.el).append(this.template(templateData));

     
     return this;
   },

   requestPreviousPage: function() {
     this.model.requestPreviousPage();
   },

   requestNextPage: function() {
     this.model.requestNextPage();
   }

  });

  return Paginator;
});    
