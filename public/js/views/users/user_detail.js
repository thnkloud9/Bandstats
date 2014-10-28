define([
  'jquery',
  'underscore',
  'backbone',
  'models/user',
  'collections/users',
  'collections/bands',
  'text!templates/users/password_update.html',
  'text!templates/users/user_detail.html',
  'typeahead'
], function($, _, Backbone, UserModel, UserCollection, BandsCollection, passwordUpdateTemplate, template) {

  var UserDetailView = Backbone.View.extend({

    el: "#content",

    template: _.template(template),
    passwordUpdateTemplate: _.template(passwordUpdateTemplate),

    initialize: function (options) {
      this.vent = options.vent;
      if (this.vent) {
        this.listenTo(this.vent, "userDetailView.updatePassword", this.updatePassword);
      }
    },

     // typeahead setup for bands list
    renderBandsTypeahead: function() {
      var bands = new Bloodhound({
        datumTokenizer: function(d) { return Bloodhound.tokenizers.whitespace(d.value); },
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        remote: '/admin/band/list?limit=5&search=%QUERY',
        prefetch: '/admin/band/list?limit=50'
      });
 
      bands.initialize();

      $(function() {
          _.compile = function(templ) {
              var compiled = this.template(templ);
              compiled.render = function(ctx) {
                  return this(ctx);
              }
              return compiled;
          }       
      });

      $('.bands-typeahead').typeahead(null, {
        name: 'bands',
        displayKey: 'band_name',
        source: bands.ttAdapter(),
        templates: {
            suggestion: _.compile([
                '<div class="media">',
                '<a class="pull-left">',
                '<img class="media-object img-rounded thumbnail-xsmall" src="<%= band_image_src %>" alt="..."></a>',
                '<div class="media-body">',
                '<h4 class="media-heading"><%=band_name%></h4>',
                '<%=regions[0]%>, <%=genres[0]%>',
                '</div></div>'
            ].join(''))
        }
      });
    },

    events: {
      'click #user-save': 'saveUser',
      'click #user-delete': 'deleteUser',
      'click #update-password': 'updatePassword',
      'click #show-password-modal': 'showPasswordModal',
    }, 

    loadUser: function (id) {
      this.model = new UserModel({user_id: id});
      this.model.fetch();

      this.model.bind("change", this.render, this);
      this.model.bind("destroy", this.close, this);
    
    },

    render: function () {
      $(this.el).html(this.template(this.model.attributes));

      this.renderBandsTypeahead();  

      return this;
    },

    showPasswordModal: function () {
       $('#admin-modal-title').html('Update Password');
       $('.admin-modal-content').html(this.passwordUpdateTemplate());
       $('#modal-save').attr('data-trigger-event', 'userDetailView.updatePassword');
    },

    updatePassword: function(ev) {
      var parent = this;
      var url = '/admin/user/updatePassword'; 

      if ($('#password').val() != $('#password-confirm').val()) {
        $('.modal-flash-message').addClass('alert-danger').text('password and confirm password must match').show();
      }

      var formValues = {
        user_id: this.model.get('user_id'),
        password: $('#password').val(),
      };

      $.ajax({
	    url: url,
	    type: 'PUT',
        data: formValues,
	    dataType: 'json',
	    success: function (data) {
          if (data.status === "Success") {
            $('.flash-message').addClass('alert-success').text("Password Updated").show();
          } else {
            $('.flash-message').addClass('alert-danger').text(data.status).show();
          }
	    },
	    error: function (data) {
          $('.flash-message').addClass('alert-danger').text(data).show();
	    }
      });
      
    },

    saveUser: function(ev) {
      ev.preventDefault();

      this.model.set({
          username: $('#user-username').val(),
          role: $('#user-role').val(),
          description: $('#user-description').val(),
          active: $('#user-active').is(':checked')
      });

      // remove id if this is a new model
      console.log(this.model.attributes);
      if (this.model.get('user_id') === "0") {
        this.model.set('user_id', null);
      }

      this.model.save(null, {
        success: function(user, response) {
          $('.flash-message').addClass('alert-success').text("Success").show();
        }, 
        error: function(user, response) {
          console.log('error:', response);
          $('.flash-message').addClass('alert-danger').text(response.statusText).show();
        }
      });
      
    },

    deleteUser: function(ev) {
      ev.preventDefault();
      console.log('delete user ' + this.model.get('user_id'));
    }

  });

  return UserDetailView;

}); 
