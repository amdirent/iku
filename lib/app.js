var flatiron = require('flatiron');

var app = module.exports = flatiron.app;

app.use(flatiron.plugins.cli, {
  usage: [
    '',
    'iku',
    '',
    'Usage:',
    '  iku version            - Print iku version.',
    '  iku create <app_name> [--help]"  - Create a new RESTful API server.',
    '',
    'Author: Christopher Rankin <crankin@amdirent.com>'
  ]
});
