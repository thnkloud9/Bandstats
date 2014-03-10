define([
  'jquery',
  'underscore',
  'backbone',
  'collections/users',
  'views/paginator',
  'views/users/user_list_item',
  'text!templates/users/user_list.html'
], function($, _, Backbone, UsersCollection, PaginatorView, UserListItemView, userListTemplate){
  var UserListView = Backbone.View.extend({
    el: '#user-list-container',

    initialize: function() {
      this.collection.on('reset', this.render, this);
      this.collection.on('sync', this.render, this);
    },

    page: 1,

    render: function () {

      this.$el.html(userListTemplate);

      var parent = this;
      _.each(this.collection.models, function (model) {
        parent.renderUser(model);
      }, this);

      $('#pagination', this.el).append(new PaginatorView({collection: this.collection, page: this.page}).render().el);
    },

    renderUser: function (model) {
      $('#user-list', this.el).append(new UserListItemView({model: model}).render().el); 
    }

  });
  return UserListView;
});
