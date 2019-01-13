const {google} = require('googleapis');
const secret = require('../auth.json');

const youtube = google.youtube({
    version: 'v3',
    auth: secret.google_api_key
});

async function runSearch(search_text) {
    const res = await youtube.search.list({
        part: 'id, snippet',
        q: search_text
    });
    logger.info(JSON.stringify(res.data.items));
    var ret = undefined;
    res.data.items.some(function(item) {
        logger.info("Item kind: " + item.id.kind);
        if (item.id.kind === "youtube#video") {
            logger.info("Video found in results list!: " + item.id.kind);
            ret = item;
            return true;
        }
    });
    return ret;
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