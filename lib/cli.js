var flatiron = require('flatiron'),
    path = require('path'),
    commands = require('./commands'),
    app = module.exports = require('./app');

// Commands
app.cmd(/version/, commands.version);
app.cmd(/create/, commands.create);
app.cmd(/create ([^\s]+)/, commands.create);
app.cmd(/update/, commands.update);
app.cmd(/update ([^\s]+)/, commands.update);
