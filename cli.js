#!/usr/bin/env node

// Author: Christopher Rankin

var _             = require('lodash'),
    async         = require('async'),
    fs            = require('fs'),
    path          = require('path'),
		exec					= require('child_process').exec,
    args          = require('minimist')(process.argv.slice(2)),
    commands      = _.clone(args._),
    flags         = _.omit(args, '_');

var logError = function (e) {
	console.log(e.message);
	console.log(e.stack);
};

// No commands?  Check for some common flags
if (commands.length < 1) {
  switch(true) {
    case flags.v:
    case flags.V:
      commands.push('version');
      break;
    case flags.h:
    case flags['?']:
      commands.push('help');
      break;
  }
}

// Handle the command line arguments.
switch(commands.shift()) {
  // Print version
  case 'version':
    // Grab the version number from the package.json file.
    var packageJson = fs.readFileSync(path.join(__dirname, "./package.json"));
    console.log("Version: " + JSON.parse(packageJson).version);
    break;

  // Build
  //case 'build':
	//	buildClient();
  //  break;

  //case 'test':
  //  var toTest = commands.shift() || 'all';

  //  if (toTest == 'all') {
  //    //test.testAll();
  //  } else {
  //    //test.testExtension(toTest);
  //  }
  //  break;

  case 'new':
		var name = commands.shift();
		var CWD = process.cwd();  	
		var newDir = CWD + '/../' + name;		

		// STEP 1: Make our new app direcory
		fs.mkdir(newDir, function (err) {
			if (err) {
				logError(err);
				process.exit(1);
			}
	
			exec('cd ' + newDir + ' && git init', function (err) {
				if (err) {
					logError(err);
					process.exit(1);
				}
			});
	
			// STEP 2: Add Vagrant VM	
			exec('cd ' + newDir + ' && git submodule add https://github.com/amdirent/vagrant-trusty-pg93-node.git vagrant', function (err) {
				if (err) {
					logError(err);
					process.exit(1);
				}
			});		


			// STEP 3: Generate our express app (the server)
			exec('cd ' + newDir + ' && express --ejs server', function (err) {
				if (err) {
					logError(err);
					process.exit(1);
				}
			});


			// STEP 4: Clone in enyo bootplate (the client)
			exec('cd ' + newDir + ' && git submodule add https://github.com/amdirent/bootplate.git client', function (err) {
				if (err) {
					logError(err);
					process.exit(1);
				}
			});

		});	
  	break;

  // Print usage information
  case 'help':
    console.log("Help & usage information will go here.");
    break;

  default:
    if(args._.length) {
      logger.error('Unknown command "%s"', args._.join(' '));
    }
}
