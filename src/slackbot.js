var request = require('request');
var querystring = require('querystring');
var https = require('https');

module.exports = function (req, res, next) {
    var botPayload = {
        username: 'Memebot',
        channel: req.body.channel_id,
        icon_emoji: ':slack:'
    };
    if (req.body.text) {
        parsed = parseCommand(req.body.text);
        generate(parsed, function(error, url) {
            if (error === null) {
                botPayload.text = req.body.user_name + " : " + url;
                send(botPayload, function (error, status, body) {
                    if (error) {
                        return next(error);
                    } else if (status !== 200) {
                        return next(new Error('Incoming WebHook: ' + status + ' ' + body));
                    } else {
                        return res.status(200).end();
                    }
                });
            } else {
                return res.status(200).send(error);
            }
        });
    } else {
      list(function (memes) {
          botPayload.text = orderList(memes);
          return res.status(200).send(botPayload.text);
      });
    }
};

function orderList(memes) {
    memes.sort(function(a, b) {
        if (a.name < b.name) {
            return -1;
        }
        if (a.name > b.name) {
            return 1;
        }
        return 0;
    });

    var text = 'Available Memes :\n```\n';
    for (i = 0; i < memes.length; i++) {
        text += memes[i].name + '\n';
    }
    text += '```\n';
    return text;
}

function findMeme(memes, meme) {
    var id = null;
    for (i = 0; i < memes.length; i++) {
        if (memes[i].name.toLowerCase() == meme.toLowerCase()) {
            return memes[i].id;
        }
        if (memes[i].name.toLowerCase().indexOf(meme.toLowerCase()) > -1) {
            id = memes[i].id;
        }
    }
    return id;
}

function generate(commands, callback) {
    list(function(memes) {
        var templateId = findMeme(memes, commands[0]);
        if (templateId === null) {
            callback("Couldn't find any meme named \"" + commands[0] + '". \nType `/meme` to see a list of available memes', null);
        } else {
            if (commands.length < 2) {
                callback("Not enough arguments! Syntax : `/meme Meme \"top text\" [\"bottom text\"]`", null);
                return;
            }
            if (commands.length < 3) {
                commands[2] = '';
            }
            var data = {
                template_id: templateId,
                text0: commands[1],
                text1: commands[2],
                username: process.env.IMGFLIP_USERNAME,
                password: process.env.IMGFLIP_PASSWORD
            };
            post_meme(data, function(url) {
                callback(null, url);
            });
        }
    });
}

function post_meme(data, callback) {
    data = querystring.stringify(data);
    var options = {
        host: 'api.imgflip.com',
        path: '/caption_image',
        method: 'POST',
        headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(data)
        }
    };
    var postReq = https.request(options, function(response) {
        var body = '';
        response.setEncoding('utf8');
        response.on('error', function(err) {
            console.log(err);
        });
        response.on('data', function(chunk) {
            body += chunk;
        });
        response.on('end', function() {
            body = JSON.parse(body);
            callback(body.data.url);
        });
    });
    postReq.write(data);
}

function list(callback) {
    var options = {
        host: 'api.imgflip.com',
        path: '/get_memes',
    };
    https.get(options, function(response) {
        var body = '';

        response.on('error', function(err) {
            console.log(err);
        });
        response.on('data', function(chunk) {
            body += chunk;
        });
        response.on('end', function() {
            body = JSON.parse(body);
            callback(body.data.memes);
        });
    });
}

function parseCommand(str) {
    var args = [];
    var readingPart = false;
    var part = '';

    str = str.replace(/“/g, '"').replace(/”/g, '"');
    for (var i = 0; i < str.length; i++) {
       if (str.charAt(i) === ' ' && !readingPart) {
            args.push(part);
            part = '';
        } else {
            if (str.charAt(i) === '\"') {
                readingPart = !readingPart;
            } else {
                part += str.charAt(i);
            }
        }
    }
    args.push(part);
    return args;
}

function send(payload, callback) {
    var uri = process.env.SLACK_URL;

    request({
        uri: uri,
        method: 'POST',
        body: JSON.stringify(payload)
    }, function (error, response, body) {
        if (error) {
          return callback(error);
        }
        callback(null, response.statusCode, body);
    });
}
