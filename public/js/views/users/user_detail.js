define([
  'jquery',
  'underscore',
  'backbone',
  'models/user',
  'collections/users',
  'collections/bands',
  'text!templates/users/user_detail.html',
  'typeahead'
], function($, _, Backbone, UserModel, UserCollection, BandsCollection, template) {

  var UserDetailView = Backbone.View.extend({

    el: "#content",

    template: _.template(template),

    initialize: function () {
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

    saveUser: function(ev) {
      ev.preventDefault();

      var url = '/admin/user/' + this.model.get('user_id') + '/update';

      this.model.set({
          username: $('#user-username').val(),
          role: $('#user-role').val(),
          description: $('#user-description').val(),
          active: $('user-active').is(':checked')
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
