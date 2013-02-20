#!/usr/bin/env node

var program = require('commander');
var moment = require('moment');
var now = moment().format('YYYY-MM-DD HH:mm:ss');

program
    .version('0.0.1')
    .option('-m, --me <me>', 'whatever')

program.parse(process.argv);

// tell the world about myself
console.log(now + ' Im a child, my name is ' + program.me);

// now wait 5 minutes and send something else
setInterval(function(){
    console.log("This is last message, I am " + program.me)
    // die peacefully
    process.exit();
},(30 * 1000));

