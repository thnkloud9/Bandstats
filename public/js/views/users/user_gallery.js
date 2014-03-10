define([
  'jquery',
  'underscore',
  'backbone',
  'collections/users',
  'views/paginator',
  'views/users/user_gallery_item',
  'text!templates/users/user_list.html'
], function($, _, Backbone, UsersCollection, PaginatorView, UserGalleryItemView, userListTemplate){
  var UserGalleryView = Backbone.View.extend({

    el: '#user-list-container',

    page: 1, 

    initialize: function() {
      this.collection.on('reset', this.render, this);
      this.collection.on('sync', this.render, this);
    },

    render: function () {

      this.$el.html(userListTemplate);

      var parent = this;
      _.each(this.collection.models, function (model) {
        parent.renderUser(model);
      }, this);

      $('#pagination', this.el).html(new PaginatorView({collection: this.collection, page: this.page}).render().el);
    },

    renderUser: function (model) {
      $('#user-list', this.el).append(new UserGalleryItemView({model: model}).render().el); 
    }

  });
  return UserGalleryView;
});
