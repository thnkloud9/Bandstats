// simple rails style routing
exports.initRoutes = function(app, passport, db, jobScheduler) {
   
    var fs = require('fs');

    // authentication
    var UserRepository = require('./../repositories/UserRepository.js');
    var userRepository = new UserRepository({"db": db});
    var LocalStrategy = require('passport-local').Strategy;

    passport.serializeUser(function(user, done) {
        done(null, user.user_id);
    });

    passport.deserializeUser(function(user_id, done) {
        userRepository.findOne({"user_id": user_id }, function (err, user) {
            done(err, user);
        });
    });

    passport.use(new LocalStrategy(
        function(username, password, done) {
            userRepository.findOne({"username": username}, function (err, user) {
                if (err) { return done(err); }
                if (!user) {
                    return done(null, false, { message: 'Incorrect username.' });
                }
                userRepository.validPassword(user, password, function(err, isMatch) {
                    if (!isMatch) {
                        return done(null, false, { message: 'Incorrect password.' });
                    }
                    return done(null, user);
                });
            });
        }
    ));


    // login stuff first
    app.post('/login', passport.authenticate('local', { failureRedirect: '/login', failureFlash: true }), function(req, res) {
        res.redirect('/admin/band');
    });

    app.get('/login', function(req, res){
        var template = require('./../views/login');
        res.send(template.render({"message": req.flash('error')}));
    });

    app.get('/logout', function(req, res){
        req.logout();
        res.redirect('/login');
    });

    // get all js files in controllers subfolder
    fs.readdir(__dirname + '/../controllers/', function(err, files) {
        files.forEach(function(file) {
            if (/.js$/.test(file)) {

                // add get route
                app.all('/' + file.replace(/(^index)?Controller\.js$/, '').toLowerCase() + '/:id?/:action?', function(request, response) {
                    mapRoute('./../controllers/', file, request, response);
                });
                
            }

        });
    });

    // get all js files in controllers/admin subfolder
    fs.readdir(__dirname + '/../controllers/admin/', function(err, files) {
        files.forEach(function(file) {
            if (/.js$/.test(file)) {

                // add get route
                // TODO: add authentication middle wear here
                app.all('/admin/' + file.replace(/(^index)?Controller\.js$/, '').toLowerCase() + '/:id?/:action?', ensureAuthenticated, function(request, response) {
                //app.all('/admin/' + file.replace(/(^index)?Controller\.js$/, '').toLowerCase() + '/:id?/:action?', function(request, response) {
                    mapRoute('./../controllers/admin/', file, request, response);
                });
                
            }

        });
    });

    function mapRoute(path, file, request, response) {
        var mdl = require(path + file);

        if (file === 'JobController.js') {
            // pass db and scheduler to jobs controller
            var controller = new mdl.controller(db, jobScheduler);
        } else {
            // pass the db to the controller
            var controller = new mdl.controller(db);
        }

        // build action parameter
        if( !request.params.action ) {
            // see if action is first 
            if (typeof controller[dashToCamel(request.params.id) + "Action"] === "function") {
                request.params.action = dashToCamel(request.params.id) + "Action";
            } else {
                request.params.action = "indexAction"; 
            }
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
    }

    function ensureAuthenticated(req, res, next) {
        if (req.isAuthenticated()) { return next(); }
        res.redirect('/login')
    }

    // Convert dash to camel string (by James Roberts)
    function dashToCamel(str) {
        if (str) {
            return str.replace(/(\-[a-z])/g, function($1) { return $1.toUpperCase().replace('-',''); });
        } else {
            return str;
        }
    }
}
