var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');
var commands = require('./bot_commands');

logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});

logger.level = 'debug';

process.on("unhandledRejection", logger.error);

// Initialize Discord Bot
var bot = new Discord.Client({
    token: auth.token,
    autorun: true
});

global.bot = bot;

bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
});

bot.on('message', function(user, userID, channelID, message, evt) {
    // Our bot needs to know if it will execute a command
    // It will listen for messages that start with '!'

    if (message.length > 1 && message.substring(0, 1) == '!') {
        var args = message.substring(1).split(' ');

        logger.info("Received message with arguments " + JSON.stringify(args));

        var cmd = args[0];

        args = args.splice(1);
        switch(cmd) {
            case 'ping':
                bot.sendMessage({
                    to: channelID,
                    message: 'Pong!' + ' User\'s id is ' + userID
                })
                break;
            case 'join':
                commands.join(channelID, user, userID, function(error, events) {
                    logger.error(error + ": " + events);
                });
                break;
            case 'leave':
                commands.leave(channelID, user, userID);
                break;
            case 'play':
                if (args.length == 0) {
                    commands.send(channelID, "No sound title provided! Please provide a sound name when trying to play with \"!play\"");
                    break;
                }
                commands.play(channelID, user, userID, args[0].toString());
                break;
        }
    }
});