define([
  'jquery',
  'underscore',
  'backbone',
  'text!templates/login.html',
  'bootstrap',
], function($, _, Backbone, loginTemplate){
  var LoginView = Backbone.View.extend({
    el: 'body',

    initialize: function () {
    },

    events: {
      "click #login-submit": "login",
      "click #register-submit": "register"
    },

    render: function (ev) {

      $(this.el).html(loginTemplate);
      return this;

    },

    register: function (event) {
        parent = this;
        event.preventDefault(); // Don't let this button submit the form
        $('.flash-message').hide(); // Hide any errors on a new submit
        var url = '/login/create';
        console.log('Loggin in... ');
        var formValues = {
            username: $('#reg-email').val(),
            password: $('#reg-password').val(),
            bands: [ $('#reg-band-name').val() ]
        };

        $.ajax({
            url:url,
            type:'POST',
            dataType:"json",
            data: formValues,
            success:function (data) {
                if(data.message) {  // If there is an error, show the error messages
                    $('.flash-message').text(data.message).show();
                } else { // If not, send them to the dashboard page
                    parent.destroyView();
                    window.location = '/thanks.html';
                }
            }
        });
    },

    login: function (event) {
        parent = this;
        event.preventDefault(); // Don't let this button submit the form
        $('.flash-message').hide(); // Hide any errors on a new submit
        var url = '/login';
        var formValues = {
            username: $('#username').val(),
            password: $('#password').val()
        };

        $.ajax({
            url:url,
            type:'POST',
            dataType:"json",
            data: formValues,
            success:function (data) {
                if(data.message) {  // If there is an error, show the error messages
                    $('.flash-message').text(data.message).show();
                } else { // If not, send them to the dashboard page
                    parent.destroyView();
                    window.location = '/';
                }
            },
            error: function (data) {
                if(data.message) {  // If there is an error, show the error messages
                    $('.flash-message').text(data.message).show();
                } else { // If not, just say something went wrong
                    $('.flash-message').text('Internal Error.  Please try again later').show();
                } 
            }
        });
    },

    destroyView: function() {
      this.undelegateEvents();
      $(this.el).removeData().unbind(); 
      this.remove();  
      Backbone.View.prototype.remove.call(this);
    }

  });
  return LoginView;
});
