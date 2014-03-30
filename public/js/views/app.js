define([
  'jquery',
  'underscore',
  'backbone',
  'vm',
  'events',
  'text!templates/layout.html',
  'bootstrap',
  'typeahead',
], function($, _, Backbone, Vm, Events, layoutTemplate){
  var AppView = Backbone.View.extend({
    el: 'body',
    session: null,
    requiredViews: ['TopNavView', 'SideNavView', 'FooterView', 'ModalView'],

    initialize: function (options) {
      this.options = options;
    },

    events: {
      'click .topnav-link': 'renderMenuItem',
      'keyup  #band-search': 'searchBands'
    },

    render: function (ev) {
      var parent = this;
      var section = "dashboard";

      if (ev) {
        section = $(ev.currentTarget).html().toLowerCase();
	    if (section === 'edit profile') {
	      section = 'users';
	    }
      }

      $(this.el).html(layoutTemplate);
      require(['views/topnav/menu'], function (TopNavView) {
        var topNavView = Vm.create(parent, 'TopNavView', TopNavView, {session: parent.options.session});
        topNavView.render();
        parent.renderBandsTypeahead();  
      });


      require(['views/sidenav/' + section + '_menu'], function (SideNavView) {
        var sideNavView = Vm.create(parent, 'SideNavView', SideNavView);
        sideNavView.render();
      });

      require(['views/footer/footer'], function (FooterView) {
        // Pass the appView down into the footer so we can render the visualisation
        var footerView = Vm.create(parent, 'FooterView', FooterView, {appView: parent});
        footerView.render();
      });

      require(['views/modal'], function (ModalView) {
        // Pass the appView down into the footer so we can render the visualisation
        var modalView = Vm.create(parent, 'ModalView', ModalView);
        modalView.render();
      });

    },

    searchBands: function(e) {
      if ( e.which === 13 ) {
        e.preventDefault();
        
        Backbone.history.navigate('bands/search/' + $('#band-search').val(), true);
      }
    },

    // typeahead setup for bands list
    renderBandsTypeahead: function() {
      var search = new Bloodhound({
        datumTokenizer: function(d) { 
	    return Bloodhound.tokenizers.whitespace(d.band_name); 
	},
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        remote: '/admin/band/list?limit=5&search=%QUERY',
        prefetch: '/admin/band/list?limit=50'
      });
 
      search.initialize();

      $(function() {
          _.compile = function(templ) {
              var compiled = this.template(templ);
              compiled.render = function(ctx) {
                  return this(ctx);
              }
              return compiled;
          }       
      });

      $('#band-search').typeahead(null, {
        name: 'band-search',
        displayKey: 'band_name',
        source: search.ttAdapter(),
        templates: {
            suggestion: _.compile([
                '<div class="media">',
                '<a class="band-detail-link pull-left" href="#bands/<%= band_id %>">',
                '<img class="media-object img-rounded thumbnail-xsmall" src="<%= band_image_src %>" alt="..."></a>',
                '<div class="media-body">',
                '<h4 class="media-heading"><%=band_name%></h4>',
                '<%=regions[0]%>, <%=genres[0]%>',
                '</div></div>'
            ].join(''))
        }
      });
    },

    renderMenuItem: function (ev) {
      // clear out the search
      $('.search-input').val('');

      $('.active').removeClass('active');
      $(ev.currentTarget).addClass('active');
    
      this.render(ev);
    },

    destroyChildren: function() {
      var parent = this;

      _.each(this.children, function(child, name) {
        if (parent.requiredViews.indexOf(name) < 0) {
          if (child.close) {
            child.close();
          }
          child.remove();
          child.undelegateEvents();
          child.unbind();

          delete parent.children[name];
        }
      }, this);
    }

  });
  return AppView;
});
