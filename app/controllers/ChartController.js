/**
 * Chart Controller
 *
 * author: Mark Lewis
 */

var request = require('request');
var async = require('async');
var _ = require('underscore');

var BandRepository = require('./../repositories/BandRepository.js');

/**
 * constructor
 */
var ChartController = function(db) {

    /**
     * Load the band repo for mongo connectivity
     */
    this.bandRepository = new BandRepository({'db': db});
    this.data = {"section": "band"};

    /**
     * server-side implementation to support
     * jquery datatables plugin for mongoskin
     */
    this.indexAction = function(req, res) {
        var data = this.data;
        var query = {};
        var parent = this;
        var limit = req.query.limit;
        var start = req.query.start;
        var orderByList = req.query.orderBy;
        var regionList = req.query.region;
        var genreList = req.query.genre;
        var conditions = [];
 
        if (req.query.search) {
            search = new RegExp('.*' + req.query.search + '.*', 'i');
            conditions.push({"band_name": search});
            conditions.push({"band_id": search});
            conditions.push({"external_ids.facebook_id": search});
            conditions.push({"band_url": search});
        }

        if (regionList) {
            regions = regionList.split(',');
            conditions.push({"regions": { $in: regions }});
        }

        if (genreList) {
            genres = genreList.split(',');
            conditions.push({"genres": { $in: genres }});
        }

        // dont show failed lookups or bands without score 
        if (orderByList) {
            var orderBys = orderByList.split(',');
        } else {
            var orderBys = [];
            orderBys.push("running_stats.lastfm_listeners.current");
            orderBys.push("running_stats.facebook_likes.current");
        }
        for (var o in orderBys) {
            var condition =  {};
            condition[orderBys[o]] = {$not: {$type: 2}};
            conditions.push(condition);
        }

        //Adding condition to limit the query to return only the bands having >=2 daily stats
        conditions.push({"running_stats.facebook_likes.daily_stats" : { $gte : 2 }});

        if(!limit) {
            limit = 400;
        }

        query = {
            $and: conditions
        };

        var options = {
            "_id": 0,
            "band_id": 1,
            "band_name": 1,
            "band_url": 1,
            "external_ids": 1,
            "regions": 1,
            "genres": 1,
            "limit": limit
        };

        // add sorting
        for (var o in orderBys) {
            var orderby = {};
            orderby[orderBys[o]] = -1;
            options[orderBys[o]] = 1;
        }

        // make the ordered query
        var orderedQuery = {
            $query: query,
            $orderby: orderby
        }

        parent.bandRepository.find(orderedQuery, options, function(err, bands) {
            var results = {
                "bands": bands
            }
            res.send(results);
        });
    }

}

/* export the class */
exports.controller = ChartController;
