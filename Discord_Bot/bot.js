var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');

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
})

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
                var user_voice_channel = getVoiceChannelID(getServerID(channelID), userID);

                var channel = bot.channels[user_voice_channel];
                if (!channel) {
                    bot.sendMessage({
                        to: channelID,
                        message: 'Could not find voice channel of user ' + toString(user) + '!'
                    })
                    logger.error('Could not connect to user\'s voice channel as it did not exist');
                } else {
                    logger.info("Channel name is " + channel.name);
                    bot.sendMessage({
                        to: channelID,
                        message: 'Joining voice channel of ' + toString(user)
                    });
                    bot.joinVoiceChannel(user_voice_channel, (e, data) => {
                        if (e != null && data != null)
                            logger.error(e + ": " + data);
                    });
                }
                break;
            case 'leave':
                var user_voice_channel = getVoiceChannelID(getServerID(channelID), userID);

                var channel = bot.channels[user_voice_channel];
                if (!channel) {
                    bot.sendMessage({
                        to: channelID,
                        message: 'Could not find voice channel of user ' + toString(user) + '!'
                    })
                    logger.error('Could not leave user\'s voice channel as it did not exist');
                } else {
                    logger.info("Channel name is " + channel.name);
                    bot.sendMessage({
                        to: channelID,
                        message: 'Leaving voice channel of ' + toString(user) + '. Bye bye!'
                    });
                    bot.leaveVoiceChannel(user_voice_channel, (e, data) => {
                        if (e != null && data != null)
                            logger.error(e + ": " + data);
                    });
                }
                break;
        }
    }
});

function getServerID(channelID) {
    return bot.channels[channelID].guild_id;
}

function getVoiceChannelID(serverID, userID) {
    var user = bot.servers[serverID].members[userID];

    return user.voice_channel_id;
}

function toString(obj) {
    return JSON.stringify(obj);
}