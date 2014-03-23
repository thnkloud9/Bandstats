define([
  'jquery',
  'underscore',
  'backbone',
  'text!templates/modal.html',
  'text!templates/loading.html'
], function($, _, Backbone, paginationTemplate, loadingTemplate) {

  var Paginator = Backbone.View.extend({
    el: '#admin-modal-container',
    id: 'modal-container',
    template: _.template(paginationTemplate),
    loadingTemplate: _.template(loadingTemplate),

    initialize:function () {
    },

    events: { 
      'click .btn-close-modal': 'closeModal',
    },

    render:function () {

      var templateData = {};
  
      this.$el.html(this.template(templateData));
      $('.admin-modal-content', this.el).html(this.loadingTemplate({}));

      return this;
   },

   closeModal: function(event) {
     console.log('closing modal');
     $('.admin-modal-content', this.el).html(this.loadingTemplate({}));
   },

  });

  return Paginator;
});    
