define([
  'jquery',
  'underscore',
  'backbone',
  'models/user',
  'text!templates/users/user_detail.html' 
], function($, _, Backbone, UserModel, template) {

  var UserDetailView = Backbone.View.extend({

    el: "#content",

    template: _.template(template),

    initialize: function () {
    },

    loadUser: function (id) {
      this.model = new UserModel({id: id});
      this.model.fetch();

      this.model.bind("change", this.render, this);
      this.model.bind("destroy", this.close, this);
    
    },

    render: function () {
      $(this.el).html(this.template(this.model.attributes));
      return this;
    }

  });

  return UserDetailView;

}); 
