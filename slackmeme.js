var request = require('request');
var https = require('https');

module.exports = function (req, res, next) {
    var botPayload = {
        username: 'memebot',
        channel: req.body.channel_id,
        icon_emoji: ':allthethings:'
    };
    console.log(req.body);
    if (req.body.text) {
        parsed = parse(req.body.text);
        botPayload.text = req.body.user_name + ' typed : ' + JSON.stringify(parsed);
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
      list(function (memes) {
          botPayload.text = '```\nAvailable Memes :\n';
          for (i = 0; i < memes.length; i++) {
              botPayload.text += memes[i].name + '\n';
          }
          botPayload.text += '```\n';
          return res.status(200).send(botPayload.text);
        //   send(botPayload, function (error, status, body) {
        //     if (error) {
        //         return next(error);
        //     } else if (status !== 200) {
        //         return next(new Error('Incoming WebHook: ' + status + ' ' + body));
        //     } else {
        //         return res.status(200).end();
        //     }
        //   });
      });
    }
};

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
       if(str.charAt(i) === ' ' && !readingPart) {
            args.push(part);
            part = '';
        } else {
            if(str.charAt(i) === '\"') {
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
    var path = '/T026MTNPZ/B0ATP0X36/pPHyA2JhblufRGRJSiISTtd0';
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
