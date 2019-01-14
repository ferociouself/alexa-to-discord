var fs = require('fs');
var sound_search = require('./search/sound_search');
var youtube_search = require('./search/youtube_search');
const youtube_stream = require('youtube-audio-stream');

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

function join(channelID, user, userID) {
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
      logger.warn('Could not connect to user\'s voice channel as it did not exist');
      return -1;
  } else {
      logger.info("Channel name is " + channel.name);
      bot.joinVoiceChannel(user_voice_channel,  function(error, events) {
        if (error) {
          logger.error(error + ": " + events);
          return;
        }

        send(channelID, "Joining voice channel of " + user);

        bot.getAudioContext(user_voice_channel, function(error, stream) {
          if (error) {
            logger.error(error.toString());
            return;
          }

          bot.channels[user_voice_channel].stream = stream;
        })
      });
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
    logger.warn('Could not leave user\'s voice channel as it did not exist');
  } else {
    logger.info("Channel name is " + channel.name);
    bot.sendMessage({
      to: channelID,
      message: 'Leaving voice channel of ' + user.toString() + '. Bye bye!'
    });
    bot.leaveVoiceChannel(user_voice_channel, (error, events) => {
      if (error) {
        logger.error(error + ": " + events);
      }

      bot.channels[user_voice_channel].stream = undefined;
    });
  }
}

function play(channelID, userID, sound) {
  logger.info("Attempting to find " + sound);

  var sound_path = sound_search.findSound(sound);
  if (!sound_path) {
    send(channelID, "Could not find " + sound + "!");
    return;
  } else {
    send(channelID, "Playing " + sound_path + "...");
  }

  var user_voice_channel = getVoiceChannelID(getServerID(channelID), userID);

  var channel = bot.channels[user_voice_channel];

  if (channel && channel.stream) {
    fs.createReadStream(sound_path).pipe(channel.stream, {end: false});
    return;
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

      bot.channels[user_voice_channel].stream = stream;

      stream.on('done', function() {
        logger.info("Finished playing sound " + sound_path);
        bot.channels[user_voice_channel].stream = undefined;
        bot.leaveVoiceChannel(user_voice_channel);
      })
    })
  });
}

async function search(channelID, userID, term) {
  logger.info("Attempting to search YouTube for " + term);

  var youtube_info = await youtube_search.findVideo(term);
  logger.debug("Returned YouTube video: " + JSON.stringify(youtube_info.snippet));
  if (!youtube_info) {
    send(channelID, "Could not find " + term + "!");
    return;
  } else {
    send(channelID, "Playing " + youtube_info.snippet.title +"...");
  }

  const youtube_url = 'http://youtube.com/watch?v=' + youtube_info.id.videoId;

  var user_voice_channel = getVoiceChannelID(getServerID(channelID), userID);

  var channel = bot.channels[user_voice_channel];

  if (channel && channel.stream) {
    youtube_stream(youtube_url).pipe(channel.stream, {end: false});
    return;
  }

  bot.joinVoiceChannel(user_voice_channel, function(error, events) {
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

      youtube_stream(youtube_url).pipe(stream, {end: false});

      bot.channels[user_voice_channel].stream = stream;

      stream.on('done', function() {
        logger.info("Finished playing sound " + youtube_info.snippet.title);
        bot.channels[user_voice_channel].stream = undefined;
        bot.leaveVoiceChannel(user_voice_channel);
      })
    })
  })
}

function stop(channelID, userID) {
  var user_voice_channel = getVoiceChannelID(getServerID(channelID), userID);

  var channel = bot.channels[user_voice_channel];

  if (channel && channel.stream) {
    logger.info("Active stream detected!");
    channel.stream.stop();
    return;
  }
  logger.info("No active stream detected.");
}

function help(userID) {
  const help_str = "Hi! Thanks for using the Alexa-to-Discord bot, a work in progress"
  + "bot that aims to allow you play music and sounds in Discord voice channels using just your voice!\n"
  + "For now, Alexa-to-Discord functions through simple text commands, listed below:\n"
  + "-help: Displays this message to the user who called me in a private message.\n"
  + "-join: Joins the Voice Channel currently holding the user who sent this command. If the user is not in a voice channel, this command will fail.\n"
  + "-leave: Leaves the Voice Channel currently holding the user who sent this command, if this bot is already in it.\n"
  + "-play <sound>: Plays from a source of sounds inside this bot, performing a fuzzy search to find the most appropriate sound.\n"
  + "-search <search terms...>: Searches for a video on YouTube given the search terms.\n"
  + "-stop: Stops the audio currently playing.";

  send(userID, help_str);
}

module.exports.send = send;
module.exports.join = join;
module.exports.leave = leave;
module.exports.play = play;
module.exports.search = search;
module.exports.stop = stop;
module.exports.help = help;
