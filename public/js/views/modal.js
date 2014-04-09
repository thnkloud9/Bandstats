define([
  'jquery',
  'underscore',
  'backbone',
  'text!templates/modal.html',
  'text!templates/loading.html'
], function($, _, Backbone, paginationTemplate, loadingTemplate) {

  var ModalView = Backbone.View.extend({
    el: '#admin-modal-container',
    id: 'modal-container',
    template: _.template(paginationTemplate),
    loadingTemplate: _.template(loadingTemplate),

    initialize:function (options) {
      this.vent = options.vent;
    },

    events: { 
      'click .btn-close-modal': 'closeModal',
      'click .btn-save-modal': 'saveModal',
    },

    render:function () {

      var templateData = {};
  
      this.$el.html(this.template(templateData));
      $('.admin-modal-content', this.el).html(this.loadingTemplate({}));

      return this;
   },

   closeModal: function(ev) {
     console.log('closing modal');
     $('.admin-modal-content', this.el).html(this.loadingTemplate({}));
   },

   saveModal: function(ev) {
     var triggerEvent = $(ev.currentTarget).data("trigger-event");
     this.vent.trigger(triggerEvent, ev);
   }

  });

  return ModalView;
});    
