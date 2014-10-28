define([
  'jquery',
  'underscore',
  'backbone',
  'vm',
  'text!templates/bands/band_import.html',
  'jqueryIframeTransport',
], function($, _, Backbone, Vm, template) {

  var BandImportView = Backbone.View.extend({

    el: "#content",

    template: _.template(template),

    events: {
      'click #bands-import': 'importBands',
      'click #option-url': function () {
        $('#datafile-container').hide();  
        $('#dataurl-container').show();  
      },
      'click .option-file': function () {
        $('#dataurl-container').hide();  
        $('#datafile-container').show();  
      }
    }, 

    initialize: function (options) {
      this.vent = options.vent;
    },

    render: function () {
      $(this.el).html(this.template({}));

      return this;
    },

    importBands: function () {
      console.log('importing bands');
      var importType = $('input[name=file-type]:checked').val();
      if (importType === "url") {
        this.readImportUrl();
      } else {
        this.readImportFile();
      }
    },

    readImportUrl: function () {
      var parent = this;
      var url = $('#dataurl').val();
      $.ajax({
	    url: url,
	    type: 'GET',
	    dataType: 'json',
	    success: function (data) {
          var importBands = data;
          $('.flash-message').addClass('alert-info').text('Attempting to import ' + importBands.length + ' bands...').show();
          parent.postImport(importBands);
	    },
	    error: function (data) {
          $('.flash-message').addClass('alert-danger').text(JSON.stringify(data)).show();
	    }
      });
    },

    readImportFile: function () {
      // read selected file
      var files = document.getElementById('datafile').files;
      if (!files.length) {
        $('.flash-message').addClass('alert-danger').text('Please select a file!').show();
        return;
      }

      var parent = this;
      var file = files[0];
      var start = 0;
      var stop = file.size - 1;
      var reader = new FileReader();

      reader.onloadend = function(evt) {
        if (evt.target.readyState == FileReader.DONE) { 
          var importBands = $.parseJSON(evt.target.result);
          $('.flash-message').addClass('alert-info').text('Attempting to import ' + importBands.length + ' bands...').show();
          parent.postImport(importBands);
            
        }
      };

      var blob = file.slice(start, stop + 1);
      reader.readAsBinaryString(blob);
 
    },

    postImport: function (importBands) {
      var parent = this;
      var formValues = {
        bands: importBands
      }

      $.ajax({
	    url: '/admin/band/import',
	    type: 'POST',
        data: formValues,
	    dataType: 'json',
	    success: function (data) {
          parent.showImportStats(data);
	    },
	    error: function (data) {
          $('.flash-message').addClass('alert-danger').text(JSON.stringify(data)).show();
	    }
      });
    },

    showImportStats: function (data) {
      var stats = {
        "duplicates": 0,
        "duplicate_bands": [],
        "added": 0,
        "added_bands": [],
      }; 

      _.forEach(data, function(band) {
        if (band.duplicate) {
          stats.duplicates++;
          var dupBand = { 
            "band_id": band.band_id, 
            "band_name": band.band_name 
          }
          stats.duplicate_bands.push(dupBand);
        }

        if (band.added) {
          stats.added++;
          var newBand = { 
            "band_id": band.band_id, 
            "band_name": band.band_name 
          }
          stats.added_bands.push(newBand);
        }

      });

      $('.flash-message').removeClass('alert-info').addClass('alert-success').text(JSON.stringify(stats)).show();
    }

  });

  return BandImportView;

}); 
