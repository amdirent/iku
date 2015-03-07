var app               = require('./app'),
    colors            = require('colors'),
    fs                = require('fs'),
    exec              = require('child_process').exec,
    generatePassword  = require('password-generator'),
    commands          = module.exports;

var print = function(arg) { console.log(arg); };
// Print version of Iku
commands.version = function() {
  console.log(require('../package.json').version);
};

// Update iku components
commands.update = function(component) {
  if (app.argv.help) {
    print(
      [
        '', 
        'iku update <component>'.cyan,
        '',
        'Usage:'.cyan,
        'Run this command from the <app_name>/src/client directory',
        '',
        ' iku update --help       - Print this help message',
        ' iku update <component>  - Update the component (polymer, client, server)',
        ''
    ].join("\n"));
    return;
  }

  // Throw error if application name doesn't exist.
  if (component === undefined) {
    print([
      'Error: You must define a component to update.'.red,
      'iku update <component>'.bold.cyan
    ].join("\n"));
    return;
  }

  

  if (component === 'polymer') {
    exec('bower update', function(err, stdout, stderr) {
      print(stdout.cyan);
      print(stderr.red);
      if (err) {
        print(err.toString().red);
        return
      }
    }); 
  }
};

// Create a new RESTful server
commands.create = function(app_name) {
  if (app.argv.help) {
    print(
      [
        '', 
        'iku create <app_name>'.cyan,
        '',
        'Usage:'.cyan,
        '',
        ' iku create --help <app_name>       - Print this help message',
        ' iku create --git <app_name>        - Initialize a new git repository.',
        ''
    ].join("\n"));
    return;
  }

  // Throw error if application name doesn't exist.
  if (app_name === undefined) {
    print([
      'Error: You must define a name for your application.'.red,
      'iku create <app_name>'.bold.cyan
    ].join("\n"));
    return;
  }

  // Set name of directory
  var app_dir = process.cwd() + "/" + app_name;
      src_dir = app_dir + "/" + "src";

  try {
    // Create the new application directory
    print("Creating directory: ".cyan + app_dir.underline); 
    fs.mkdirSync(app_dir);
    fs.mkdirSync(src_dir);

    // Initialize a git repository if the flag was set.  
    print("Initializing Git repository".cyan);
    exec('cd ' + app_dir + ' && git init', function(git_err) {
      if (git_err) {
        print(git_err.toString().red);
        return;
      }
    });       

    // Clone server bootplate
    console.log("Creating server".cyan);
    exec('cd ' + src_dir + ' && git submodule add https://github.com/amdirent/iku-server-bootplate.git server', function (install_server_error) {
      if (install_server_error) {
        print(install_server_error.toString().red);
        return;
      }

      // Clone client bootplate
      if (app.argv.client) {
        print("Creating client".cyan);
        exec('cd ' + src_dir + ' && git submodule add https://github.com/amdirent/iku-client-bootplate.git client', function(install_client_error) {
            if (install_client_error) {
              print(install_client_error.toString().red);
              return;
            }

            fs.symlinkSync(src_dir + "/client", src_dir + "/server/public");
          });
      }

      // Update submodules in repo.
      exec('cd ' + src_dir + ' && git submodule update --init --recursive', 
        function (submodule_update_error){
          if (submodule_update_error) {
            print(submodule_update_error.toString().red); 
            return;
          }
      });


      // Create database credentials
      print(
          "Writing database credentials to: ".cyan + src_dir.underline + 
          "/server/config/database.js".underline);

      exec(
          'sed s/app_name/' + app_name + '/ < ' + src_dir + 
          '/server/config/database.js.template > ' + src_dir + 
          '/server/config/database.js.passwd', function(db_cred_error) {

        if (db_cred_error) {
          print(db_cred_error.toString().red);
          return;
        }

        exec(
          'sed s/psswd/' + generatePassword(8, false) + 
          '/ < ' + src_dir + '/server/config/database.js.passwd > ' + 
          src_dir + '/server/config/database.js', function(db_psswd_error) {

          if (db_psswd_error) {
            print(db_psswd_error.toString().red);
            return;
          }

          // Remove the template
          fs.unlinkSync(src_dir + '/server/config/database.js.template');
          fs.unlinkSync(src_dir + '/server/config/database.js.passwd');

          //TODO: Create https server keys
          print([
            "",
            "This server uses HTTPS only, so you'll need certificates.",
            "You can create your own self signed certs by following the directions in the README.",
            "For production applications you'll want to get your certs from a Certificate Authority.",
            ""   
          ].join("\n").yellow);

        });

      });

    });

        
  } catch (err) {
    print(err.toString().red);
    return;  
  }

};
