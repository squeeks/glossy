var syslogParser = require('../lib/glossy/parse.js'),
          assert = require('assert'),
              fs = require('fs');

assert.ok(syslogParser, 'parser loaded');

var messages = JSON.parse(fs.readFileSync(__dirname + '/fixtures/RFC5424.json', 'utf8'));

for(message in messages) {
    parsed = syslogParser.parse(messages[message]);
    assert.ok(parsed);
};

//TODO expand tests further
