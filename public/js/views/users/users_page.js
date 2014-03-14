define([
  'jquery',
  'underscore',
  'backbone',
  'vm',
  'views/users/user_list',
  'views/users/user_gallery',
  'text!templates/users/users_page.html',
], function($, _, Backbone, Vm, UserListView, UserGalleryView, usersPageTemplate){
  var UsersPage = Backbone.View.extend({
    el: '#content',

    initialize: function() {
    },

    events: { 
      'click button#btn-gallery-view': 'renderUserGallery',
      'click button#btn-list-view': 'renderUserList'
    },

    render: function () {
      this.$el.html(usersPageTemplate);
      this.renderUserGallery();

      require(['views/sidenav/users_menu'], function (SideNavView) {
        var sideNavView = Vm.create(parent, 'SideNavView', SideNavView);
        sideNavView.render();                                      
      });
    },

    renderUserGallery: function (model) {
      var usersCollection = this.collection;

      var userGalleryView = Vm.create(this, 'UserGalleryView', UserGalleryView, {collection: usersCollection});
      userGalleryView.render();
    },

    renderUserList: function () {
      var userListView = Vm.create(this, 'UserListView', UserListView, {collection: this.collection});
      userListView.render();
    }
  });
  return UsersPage;
});
