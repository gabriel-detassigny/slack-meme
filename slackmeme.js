var request = require('request');

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
      return res.status(200).send('No input');
    }
};

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

function meme() {

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

// module.exports = function (req, res, next) {
//   var userName = req.body.user_name;
//   var botPayload = {
//     text : 'Hello, ' + userName + '!'
//   };
//
//   // avoid infinite loop
//   if (userName !== 'slackbot') {
//     return res.status(200).json(botPayload);
//   } else {
//     return res.status(200).end();
//   }
// }
