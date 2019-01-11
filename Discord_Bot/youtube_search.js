const {google} = require('googleapis');
const secret = require('./auth.json');
const logger = require('winston');

const youtube = google.youtube({
    version: 'v3',
    auth: secret.google_api_key
});

async function runSearch(search_text) {
    const res = await youtube.search.list({
        part: 'id, snippet',
        q: search_text
    });
    //logger.info(JSON.stringify(res.data));
    logger.info(JSON.stringify(res.data.items[0]));
    const items = res.data.items;
    if (items.length > 0) {
        return items[0];
    }
    return;
}

async function findVideo(search_text) {
    return await runSearch(search_text).then(function(result) {
        logger.info("Search finished!");
        if (!result) {
            logger.error("Could not find any results for search: " + search_text);
            return;
        } else {
            logger.info("Found results for search: " + search_text + ". Returning the first result.");
            logger.debug("Result:\n" + JSON.stringify(result));
            return result;
        }
    });
}

module.exports.findVideo = findVideo;