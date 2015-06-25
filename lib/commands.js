var app               = require('./app'),
    colors            = require('colors'),
    fs                = require('fs'),
    exec              = require('child_process').exec,
    spawn             = require('child_process').spawn,
    generatePassword  = require('password-generator'),
    moment            = require('moment'),
    commands          = module.exports;

var print = function(arg) { console.log(arg); };

// Print version of iku
commands.version = function() {
  var version = require('../package.json').version;

  if (app.argv.help) {
    print([
        '',
        'iku version <action>'.cyan,
        '',
        'Usage:'.cyan,
        '',
        ' iku version --help      - Print this help message.',
        ' iku version             - Print the version of iku your using.',
        ''
        ].join("\n"));    
    return;
  } else {
    print(version);
  }

};


// Generate commands
commands.generate = function() {
  if (app.argv.help) {
    print(
      [
        '', 
        'iku generate <action>'.cyan,
        '',
        'Usage:'.cyan,
        '',
        ' iku generate --help       - Print this help message',
        ' iku generate --account    - Create a API account with auth token',
        ''
    ].join("\n"));
    return;
  }

  if (app.argv.account) {
    var conf    = require(process.cwd() + '/config/database.js'),
        db      = require('knex')(conf), 
        account = JSON.parse(app.argv.account);

    account.created_at = moment().format(); 
    
    db('accounts')
    .returning('id')
    .insert(account)
    .exec(function(err, ids) {
      if (err) { console.log(err); process.exit(1); }

      db('accounts').where('id', ids.shift())
      .select('id', 'auth_token')
      .exec(function(err, accounts) {
        if (err) { console.log(err); process.exit(1); } 
        
        var account = accounts.shift();
        console.log("Account created successfully.");
        console.log("Account ID: " + account.id);
        console.log("Your API key is: " + account.auth_token.split('-').join(''));
        process.exit();
      });
    });

  }
};

// Start the server
commands.server = function() {
  if (app.argv.help) {
    print(
      [
        '', 
        'iku server <action>'.cyan,
        '',
        'Usage:'.cyan,
        'Run this command from the <app_name>/src/client directory',
        '',
        ' iku server --help       - Print this help message',
        ' iku server --start      - Alias to node --harmony app.js',
        ''
    ].join("\n"));
    return;
  }

  if (app.argv.start) {
    var port_number = app.argv.port || 8443;
    print("Starting server on: ".cyan + "https://0.0.0.0:" +  port_number);
    
    // Lookup
    //exec('node --harmony app.js', function(err, stdout, stderr) { 
    //  if (err) { print(err.toString().red); return; } 
    //  print(stderr);
    //  print(stdout);
    //});
    app_server = spawn('node', ['--harmony', 'app.js']);
    app_server.stdout.on('data', function(data) { print(data.toString()); });
    app_server.stderr.on('data', function(data) { print(data.toString()); });
    app_server.on('exit', function(code) {
      print("child process exited with code: ".yellow + code.yellow);
    });
  }
};

// Update iku components
commands.update = function() { 
  if (app.argv.help) {
    print(
      [
        '', 
        'iku update'.cyan,
        '',
        'The update command pulls the latest code from the server and client bootplate',
        'and updates the bower components for the client. Use this command when you',
        'want to retrieve the latest stable version of iku server and client code.',
        '',
        'Usage:'.cyan,
        'Run this command from the <app_name>/src directory',
        '',
        ' iku update --help       - Print this help message',
        ''
    ].join("\n"));
    return;
  }

  var topDir = process.cwd();
  var conf = JSON.parse(fs.readFileSync(topDir + '/.iku').toString());

  exec('git submodule update --init --recursive', 
    function (submodule_update_error, stdout, stderr){
      if (submodule_update_error) {
        print(submodule_update_error.toString().red); 
        return;
      } else {
        print(stdout.cyan);
        print(stderr.red);

        // Submodule update worked. Update bower in client if it exists.
        if (conf.client) {
          exec('cd ' + topDir + '/src/client && bower update', function(err, stdout, stderr) {
            print(stdout.cyan);
            print(stderr.red);
            if (err) {
              print(err.toString().red);
              return;
            }
          });
        }
      }
  });

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
  var app_dir = process.cwd() + "/" + app_name,
      src_dir = app_dir + "/" + "src",
      iku_conf = {};

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
      
        // Going to need to put this writeFile code somewhere else. Not quite sure
        // how we're going to use this whole .iku file concept yet.
        iku_conf.client = true;
        fs.writeFile(app_dir + '/.iku', JSON.stringify(iku_conf, null, '\t'), function(err) {
          if (err) { print(err.toString().red); return; }
        });

        print("Creating client".cyan);
        exec('cd ' + src_dir + ' && git submodule add https://github.com/amdirent/iku-client-bootplate.git client', function(install_client_error) {
            if (install_client_error) {
              print(install_client_error.toString().red);
              return;
            }

            fs.symlinkSync(src_dir + "/client", src_dir + "/server/public");

            /*
             *
             * Update application name/logo in client
             *
             */
            exec(
                'sed s/:app_name/' + app_name + '/ ' + src_dir +
                '/client/admin.html.template > ' + src_dir + '/client/admin.html', function(app_logo_error) {
                  if (app_logo_error) {
                    print(app_logo_error.toString().red);
                    return;
                  } 
                  
                  fs.unlinkSync(src_dir + '/client/admin.html.template');
            });
            
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


      /* 
       *
       * Create database credentials
       *
       */
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


          // Install node modules
          exec('cd ' + src_dir + '/server && sudo npm install', 
          function (npm_install_error){
            if (npm_install_error) {
              print(npm_install_error.toString().red); 
              return;
            }

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

    });

        
  } catch (err) {
    print(err.toString().red);
    return;  
  }

};
