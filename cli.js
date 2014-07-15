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
	
	case 'vm':
		console.log("Not implemented.");
		//var cmd = commands.shift();

		// Check to see if this is a iku project.
		//isIkuProject = _.contains(fs.readdirSync(process.cwd()), '.iku');
		//if (!isIkuProject) {
		//	console.log("You need to be inside your project's root directory when you run this command.");
		//	process.exit(1);
		//}

		//switch(cmd) {
		//	case 'up':
		//		exec('cd vagrant && vagrant up', function (err) {
		//			if (err) { logError(err) } 
		//		});
		//		break;
		//	case 'down':
		//		exec('cd vagrant && vagrant destroy', function (err) {
		//			if (err) { logError(err) } 
		//		});
		//		break;
		//	case 'ssh':
		//		exec('cd vagrant && vagrant ssh', function (err) {
		//			if (err) { logError(err) } 
		//		});
		//		break;
		//}

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
		var newDir = CWD + '/' + name;		
		var srcDir = newDir + '/source';

		// STEP 1: Make our new app direcory
		console.log("Creating directory: " + newDir);
		fs.mkdir(newDir, function (err) {
			if (err) {
				logError(err);
				process.exit(1);
			}

			fs.writeFileSync(newDir + '/.iku', '');

			fs.mkdir(srcDir, function (err) {
				if (err) {
					logError(err);
					process.exit(1);
				}
				
				console.log("Initializing git repository");
				exec('cd ' + srcDir + ' && git init', function (err) {
					if (err) {
						logError(err);
						process.exit(1);
					}
					
					console.log("Creating server");
					exec('cd ' + srcDir + ' && express --ejs server', function (err) {
						if (err) {
							logError(err);
							process.exit(1);
						}
					});

					console.log("Creating client");
					exec('cd ' + srcDir + ' && git submodule add -b production https://github.com/amdirent/bootplate.git client', function (err) {
						if (err) {
							logError(err);
							process.exit(1);
						}
						exec('cd ' + srcDir + ' && git submodule update --init --recursive', function (err){
							if (err) {
								logError(err);
								process.exit(1);
							}
						});
					});
				});
			});

			console.log("Creating vagrant folder.");
			exec('cd ' + newDir + ' && git clone https://github.com/amdirent/vagrant-trusty-pg93-node.git vagrant', function (err) {
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
      console.log('Unknown command :' + args._.join(' '));
    }
}
