var Fuse = require('fuse.js');
var fs = require('fs');
var path = require('path');

var sounds = [];

var options = {
  keys: ['title'],
  id: 'path'
}

function populateTable(sound_directory_path) {
  fs.readdir(sound_directory_path, function (err, files) {
    if (err) {
      logger.error("Could not list the sounds directory.", err);
      return;
    }

    files.forEach(function (file, index) {
      var full_path = path.join(sound_directory_path, file);

      fs.stat(full_path, function (error, stat) {
        if (error) {
          logger.error("Error reading file stats.", error);
          return;
        }

        if (stat.isFile()) {
          addSound(file, full_path);
        }
      });
    });
  })
}

function refreshTable(sound_directory_path) {
  sounds = [];
  populateTable(sound_directory_path);
}

function addSound(sound_file, full_path) {
  var title = "";
  sound_file.substring(0, sound_file.lastIndexOf('.')).split('_').forEach(function (word, index) {
    title = title.concat(title.length > 0 ? " " : "", word.charAt(0).toUpperCase() + word.slice(1));
  });
  var sound = {};
  sound['title'] = title;
  sound['path'] = full_path;
  sounds.push(sound);
  logger.info("Pushed " + title + " to Sounds list.");
}

function findSound(sound_title) {
  var fuse = new Fuse(sounds, options);

  var results = fuse.search(sound_title);

  if (results.length > 0) {
    var sound_path = results[0];
    logger.info("Sound " + JSON.stringify(sound_path) + " found.");
    return sound_path;
  } else {
    logger.warn("Sound " + sound_title + " not found!");
    return;
  }
}

module.exports.populateTable = populateTable;
module.exports.findSound = findSound;
module.exports.refreshTable = refreshTable;