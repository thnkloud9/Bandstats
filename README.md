# Bandstats Version 0.1


## Installation

Bandstats server requires the following packages and libraries to be present at
the operating system:

  node
  mongodb

You'll need to do `npm install .` to install all required packages that the
Bandstats server requires.


## Deployment

No real deloyment yet, but will implement upstart eventually.

1. Do `npm install`
2. node app.js 


## Configuration

The Bandstats application can be configured by editing the app/config/app.conf file.  
I'm using nconf so will eventually add support for ENV config as well.


## Testing

Not implemented yet, plan to use mochajs

## Project Structure

### package.json

Contains node package dependencies. See installation section above.

### npm-shrinkwrap.json

Contains node package dependencies, with explicit versioning even for,
submodules, e.g. for the whole module tree.

The existence of this file makes npm ignore the package.json. You can create
this file with `npm shrinkwrap`

### app.js

Assembles files and boots up the app to listen for connections, collects
models, controllers and sets up the database connection.

### app/

Server side scripting


### app/lib/

General-purpose libraries used throughout the application. Contains the controller Router.


### app/controllers/

Contains Controllers.

Controller classes reside in files called \*Controller.js and route the
HTTP world to server side functions. They work pretty much like rails style controllers
and routes map all HTTP methods to endpoints by default.

Manager classes reside in files called \*Manager.coffee and mostly do database
related tasks. They serve as collections of model related functionalities.

### server/repositories/

Implementation of the Repository pattern with mongoskin.  Repositories extend BaseRepository which contains
basic CRUD function.


### public/

Anything stored here is accessible from outside.


### bin/

Command line tools (collectors, exporters, importers, etc)


### node\_modules/

Contains all node modules after installed by npm via `npm install .`


### logs/

Untracked by git and initially not present. Contains log files sorted by date.
Disable the log file functionality in order to not create log files. See the
script `start_server` for details.

