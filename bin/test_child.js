#!/usr/bin/env node

var program = require('commander');
var moment = require('moment');
var now = moment().format('YYYY-MM-DD HH:mm:ss');
var util = require('util');

program
    .version('0.0.1')
    .option('-m, --me <me>', 'name to echo out')
    .option('-s, --sleep <sleep>', 'how long the job should run (in seconds)')

program.parse(process.argv);

// tell the world about myself
console.log(now + ' Im a child, my name is ' + program.me);

if (program.sleep) {
  var sleep = program.sleep;
} else {
  var sleep = 30;
}
// now wait sleep minutes and send something else
setInterval(function(){
    console.log("This is last message, I am " + program.me)
    // die peacefully
    process.exit();
},(sleep * 1000));

