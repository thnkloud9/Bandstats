# Bandstats Version 0.1


## Installation

Bandstats server requires the following packages and libraries to be present at
the operating system:

  node
  mongodb

You'll need to do `npm install .` to install all required packages that the
Bandstats server requires.


## Deployment

1. Do `make install`
2. Run `sudo bandstats start`
3. Monitor the status with "sudo status bandstats"


## Configuration

The Bandstats application can be configured by setting environment variables
in your favourite OS, for example:

    NODE_ENV={production|development}
  
  'production' is the default environment.

- Custom port to listen at, default is 4000.

    [NODE_PORT=80]
    
- Seperate databases for all managers, default is localhost.

    [NODE_DB_MONGODB="mongodb://user:pass@host/mydb"]

- Specify where the log file is

    [LOG_PATH="/home/ubuntu/log_server.log"]


## Testing

For now, we use VisionMedia's mochajs.

Type `make test` to run all tests except the daemon test that requires root
priviledges.

## Project Structure

### package.json

Contains node package dependencies. See installation section above.

### npm-shrinkwrap.json

Contains node package dependencies, with explicit versioning even for,
submodules, e.g. for the whole module tree.

The existence of this file makes npm ignore the package.json. You can create
this file with `npm shrinkwrap`

### server.js

Assembles files and boots up the app to listen for connections, collects
models, controllers and sets up the database connection.

### server/

Server side scripting (surprise!)


### server/libraries/

General-purpose libraries used throughout the application.


### server/main/

Contains Controllers, Managers along with related back-end libraries.

Controller classes reside in files called \*Controller.coffee and route the
HTTP world to server side functions. These classes should know as little as
possible about how things work, just server content and pass on tasks.

Manager classes reside in files called \*Manager.coffee and mostly do database
related tasks. They serve as collections of model related functionalities.

### server/models/

Data models for the mongoose framework.


### public/

Anything stored here is accessible from outside.


### server/tools/

Operating system related files for installation and deployment, not part of the
actual server application.


### node\_modules/

Untracked by git and initially not present. Contains all node modules after
installed by npm via `npm install .`


### logs/

Untracked by git and initially not present. Contains log files sorted by date.
Disable the log file functionality in order to not create log files. See the
script `start_server` for details.

### bin/

Command-line tools to do things.
