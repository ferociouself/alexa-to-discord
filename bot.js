var Discord = require('discord.io');
var auth = require('./auth.json');
var commands = require('./bot_commands');
var search = require('./search/sound_search');
var logger = require('./logger').logger;

const SOUND_DIRECTORY_PATH = "./sounds/";
const ADMIN_ID = "138884634220953600";

process.on("unhandledRejection", logger.error);

// Initialize Discord Bot
var bot = new Discord.Client({
    token: auth.token,
    autorun: true
});

global.bot = bot;
global.logger = logger;

bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
    search.populateTable(SOUND_DIRECTORY_PATH);
});

bot.on('disconnect', function(errMsg, code) {
    logger.error("Bot disconnected! [" + code + "] " + errMsg);
    bot.connect();
})

bot.on('message', function(user, userID, channelID, message, evt) {
    // Our bot needs to know if it will execute a command
    // It will listen for messages that start with '!'

    if (message.length > 1 && message.substring(0, 1) == '-') {
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
                commands.join(channelID, user, userID);
                break;
            case 'leave':
                commands.leave(channelID, user, userID);
                break;
            case 'play':
                if (args.length == 0) {
                    commands.send(channelID, "No sound title provided! Please provide a sound name when trying to play with \"!play\"");
                    break;
                }
                commands.play(channelID, userID, args.join(" "));
                break;
            case 'refresh':
                if (userID == ADMIN_ID) {
                    search.refreshTable(SOUND_DIRECTORY_PATH);
                } else {
                    commands.send(channelID, "Only an administrator of this bot may perform this action!");
                }
                break;
            case 'search':
                if (args.length == 0) {
                    commands.send(channelID, "No YouTube search term provided! Please provide a search term.");
                } else {
                    commands.search(channelID, userID, args.join(" "));
                }
                break;
            case 'stop':
                commands.stop(channelID, userID);
                break;
        }
    }
});
