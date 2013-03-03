var syslogParser = require('../lib/glossy/parse.js'),
          assert = require('assert'),
              fs = require('fs');

assert.ok(syslogParser, 'parser loaded');

var messages = JSON.parse(fs.readFileSync(__dirname + '/fixtures/RFC3164.json', 'utf8'));


for(message in messages) {
    parsed = syslogParser.parse(messages[message]);
    assert.ok(parsed);
};

// TODO Go through each message per fixture, validate ALL values.

syslogParser.parse(messages[0], function(rfc3164BeforeTenth){
    assert.ok(rfc3164BeforeTenth, 'RFC 3164 record parsed.');
    assert.equal(rfc3164BeforeTenth.host, '10.0.0.99');
});
