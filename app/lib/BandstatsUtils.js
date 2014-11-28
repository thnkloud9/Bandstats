/**
 * Bandstats Utils
 *
 * author: Mark Lewis
 */

var nconf = require('nconf');
var request = require('request');
var async = require('async');
var _ = require('underscore');
var fs = require('fs');
var path = require('path');
var util = require('util');
var sleep = require('sleep');

/**
 * Constructor
 *
 */
function BandstatsUtils() {
    nconf.file(path.join(__dirname, '../config/app.json'));
};


BandstatsUtils.prototype.sanitizeSearchString = function(text) {
    if ((typeof text == 'undefined') || (text == null)) {
	return '';
    }
    sanitized_text = text.toLowerCase();
    sanitized_text = sanitized_text.replace('&', 'and')
        .replace(/[\+\*\,\.\?\!\-\;\:\'\(\)]+/g, '')
        .replace(/[\"“\'].+[\"”\']/g, '')
        .replace(/[\n\r]/g, '')
        .replace(/[\[\]]/g, '')
        .replace(/[\\\/]/g, '');
 
    return sanitized_text;

}

module.exports = BandstatsUtils;
