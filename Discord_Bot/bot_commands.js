var logger = require('winston');
var fs = require('fs');
var search = require('./sound_search');

function send(channelID, messageStr) {
    logger.info("Attempting to send " + messageStr + " to " + channelID);
    bot.sendMessage({
        to: channelID,
        message: messageStr
    });
}

function getServerID(channelID) {
    return bot.channels[channelID].guild_id;
}

function getVoiceChannelID(serverID, userID) {
    var user = bot.servers[serverID].members[userID];

    return user.voice_channel_id;
}

function join(channelID, user, userID, callback) {
    var user_voice_channel = getVoiceChannelID(getServerID(channelID), userID);

    var channel = bot.channels[user_voice_channel];
    if (channel.members[bot.id]) {
        logger.warn("Attempting to join voice channel we are already in!");
    }
    if (!channel) {
        bot.sendMessage({
            to: channelID,
            message: 'Could not find voice channel of user ' + user.toString() + '!'
        })
        logger.error('Could not connect to user\'s voice channel as it did not exist');
        return -1;
    } else {
        logger.info("Channel name is " + channel.name);
        bot.sendMessage({
            to: channelID,
            message: 'Joining voice channel of ' + user.toString()
        });
        bot.joinVoiceChannel(user_voice_channel, callback);
        return user_voice_channel;
    }
}

function leave(channelID, user, userID) {
    var user_voice_channel = getVoiceChannelID(getServerID(channelID), userID);

    var channel = bot.channels[user_voice_channel];
    if (!channel) {
        bot.sendMessage({
            to: channelID,
            message: 'Could not find voice channel of user ' + user.toString() + '!'
        })
        logger.error('Could not leave user\'s voice channel as it did not exist');
    } else {
        logger.info("Channel name is " + channel.name);
        bot.sendMessage({
            to: channelID,
            message: 'Leaving voice channel of ' + user.toString() + '. Bye bye!'
        });
        bot.leaveVoiceChannel(user_voice_channel, (e, data) => {
            if (e != null && data != null)
                logger.error(e + ": " + data);
        });
    }
}

function play(channelID, user, userID, sound) {
    logger.info("Attempting to find " + sound);

    var sound_path = search.findSound(sound);
    if (!sound_path) {
        send(channelID, "Could not find " + sound + "!");
        return;
    } else {
        send(channelID, "Playing " + sound_path + "...");
    }

    var user_voice_channel = getVoiceChannelID(getServerID(channelID), userID);

    var channel = bot.channels[user_voice_channel];

    if (channel && channel.members[bot.id]) {
        bot.leaveVoiceChannel(user_voice_channel);
    }

    bot.joinVoiceChannel(user_voice_channel, function(error, events){
        if (error) {
            bot.sendMessage({
                to: channelID,
                message: "Sorry, I couldn't connect to your voice channel!"
            });
            return logger.error(error + ": " + events);
        }

        logger.info("Voice channel with ID " + user_voice_channel + " has been joined.");

        bot.getAudioContext(user_voice_channel, function(error, stream) {
            if (error) {
                logger.error(error.toString());
                return;
            }
    
            fs.createReadStream(sound_path).pipe(stream, {end: false});
    
            stream.on('done', function() {
                logger.info("Finished playing sound " + sound_path);
                bot.leaveVoiceChannel(user_voice_channel);
            })
        })
    });
}

module.exports.send = send;
module.exports.join = join;
module.exports.leave = leave;
module.exports.play = play;