define([
  'jquery',
  'underscore',
  'backbone',
  'models/site',
  'text!templates/sites/site_detail.html' 
], function($, _, Backbone, SiteModel, template) {

  var SiteDetailView = Backbone.View.extend({

    el: "#content",

    template: _.template(template),

    events: {
        'click #site-save': 'saveSite',
        'click #site-delete': 'deleteSite',
    },

    initialize: function () {
    },

    loadSite: function (id) {
      this.model = new SiteModel({site_id: id});
      this.model.fetch();

      this.model.bind("change", this.render, this);
      this.model.bind("destroy", this.close, this);
    },

    loadSiteArticles: function (callback) {
      var parent = this;
      if (this.model.get("site_id")) {
        $.ajax({
          url: '/admin/site/' + parent.model.get("site_id") + '/articles',
          type: 'get',
          dataType: 'json',
          success: function(response) {
            callback(null, response.articles);
          },
          error: function(err, status, msg) {
           callback(err, {});
          }
        });
      }
    },

    render: function () {
      var parent = this;
      this.loadSiteArticles(function(err, articles) {
        var extendedModel = _.clone(parent.model.attributes);
        extendedModel.articles = articles;
        extendedModel.articleFields = _.keys(articles[0]);

        $(parent.el).html(parent.template(extendedModel));

        // bootstrap popovers
        $(".bs-tooltip").tooltip();
        $(".bs-popover-select").on('mouseover', function(e) {
          var $e = $(e.target); 
          var parent = this;

          if ($e.is('option')) {
            console.log('on an option');
            $(this).popover('destroy');
            $(this).popover({
              trigger: 'manual',
              placement: 'right',
              container: 'body',
              title: $e.attr("data-title"),
              content: $e.attr("data-content")
            }).popover('show');
          }
        });
        $(".bs-popover-select").on('mouseleave', function(e) {
          $('.bs-popover-select').popover('destroy');
        });

        return this;
      });
    },

    saveSite: function (ev) {
      if (ev) {
        ev.preventDefault();
      }

      this.model.set({
        site_name: $('#site-name').val(),
        site_url: $('#site-url').val(),
        band_name_field: $("#band-name-field option:selected" ).text().trim(),
        album_name_field: $("#album-name-field option:selected" ).text().trim(),
        track_name_field: $("#track-name-field option:selected" ).text().trim(),
        description_field: $("#description-field option:selected" ).text().trim(),
        publish_date_field: $("#publish-date-field option:selected" ).text().trim(),
        link_field: $("#link-field option:selected" ).text().trim(),
        site_image_url: $('#site-image-url').attr("src")
      }); 

      this.model.unset('articles');
      //this.model.unset('articleFields');

      if (this.model.get('site_id') === "0") {
        this.model.set('site_id', null);
      }

      this.model.save(null, {
        success: function(site, response) {
          $('.flash-message').addClass('alert-success').text("Success").show();
        }, 
        error: function(site, response) {
          console.log('error:', response);
          $('.flash-message').addClass('alert-danger').text(response.statusText).show();
        }
      });
    },
    
    deleteSite: function (ev) {
      ev.preventDefault();

      this.model.destroy({
        success: function(site, response) {
          $('.flash-message').addClass('alert-sucess').text("Success").show();
        }
      });
    }

  });

  return SiteDetailView;

}); 
