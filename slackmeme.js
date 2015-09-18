var request = require('request');
var querystring = require('querystring');
var https = require('https');

module.exports = function (req, res, next) {
    var botPayload = {
        username: 'Memebot',
        channel: req.body.channel_id,
        icon_emoji: ':allthethings:'
    };
    if (req.body.text) {
        parsed = parse(req.body.text);
        generate(parsed, function(url) {
            botPayload.text = url;
            send(botPayload, function (error, status, body) {
                if (error) {
                    return next(error);
                } else if (status !== 200) {
                    return next(new Error('Incoming WebHook: ' + status + ' ' + body));
                } else {
                    return res.status(200).end();
                }
            });
        });
    } else {
      list(function (memes) {
          botPayload.text = '```\nAvailable Memes :\n';
          for (i = 0; i < memes.length; i++) {
              botPayload.text += memes[i].name + '\n';
          }
          botPayload.text += '```\n';
          return res.status(200).send(botPayload.text);
      });
    }
};

function generate(commands, callback) {
    list(function(memes) {
        var templateId = null;
        for (i = 0; i< memes.length; i++) {
            if (memes[i].name == commands[0]) {
                templateId = memes[i].id;
            }
        }
        if (templateId === null) {
            console.log('Meme not found : ' + commands[0]);
        } else {
            if (commands.length < 2) {
                commands[1] = '';
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
                callback(url);
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
    console.log('post meme');
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
            console.log('end!');
            body = JSON.parse(body);
            callback(body.data.url);
        })
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

var parse = function(str) {
    var args = [];
    var readingPart = false;
    var part = '';
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
    var path = process.env.SLACK_PATH;
    var uri = 'https://hooks.slack.com/services' + path;

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
