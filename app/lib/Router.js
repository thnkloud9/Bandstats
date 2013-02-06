// really simple routing
exports.initRoutes = function(app, db) {
   
    var fs = require('fs');

    // Convert dash to camel string (by James Roberts)
    // http://jamesroberts.name/blog/2010/02/22/string-functions-for-javascript-trim-to-camel-case-to-dashed-and-to-underscore/
    dashToCamel = function(str) {
        return str.replace(/(\-[a-z])/g, function($1) { return $1.toUpperCase().replace('-',''); });
    };
   
    // get all js files in controllers subfolder
    fs.readdir(__dirname + '/../controllers/', function(err, files) {
        files.forEach(function(file) {
            if (/.js$/.test(file)) {

                // add the standard route
                app.get('/' + file.replace(/(^index)?Controller\.js$/, '').toLowerCase() + '/:id?/:action?', function(request, response) {

                    var mdl = require('./../controllers/'+file);
                    // pass the db to the controller
                    var controller = new mdl.controller(db);

                    // build action parameter
                    if( !request.params.action ) { 
                        request.params.action = "indexAction"; 
                    } else {
                       request.params.action = dashToCamel(request.params.action);
                        request.params.action += 'Action';
                    }
                    // try to call the action
                    if( typeof controller[request.params.action] == 'function' ) {
                        controller[request.params.action](request, response);
                    } else {
                        response.send(request.params.action + ' is not a controller action');
                    }
                    delete controller;
                });
            }

        });
    });
};
