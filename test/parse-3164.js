var syslogParser = require('../lib/glossy/parse.js'),
          assert = require('assert'),
              fs = require('fs');

assert.ok(syslogParser, 'parser loaded');

var messages = JSON.parse(fs.readFileSync(__dirname + '/fixtures/RFC3164.json', 'utf8'));

for(message in messages) {
    parsed = syslogParser.parse(messages[message]);
    assert.ok(parsed);
};

syslogParser.parse(messages[0], function(parsedMessage){
    var expectedData = { 
        originalMessage: '<13>Feb  5 17:32:18 10.0.0.99 Use the BFG!',
        prival: 13,
        facilityID: 1,
        severityID: 5,
        facility: 'user',
        severity: 'notice',
        type: 'RFC3164',
        time: new Date('Tue Feb 05 2013 17:32:18 GMT+0000'),
        host: '10.0.0.99',
        message: 'Use the BFG!' };

    assert.deepEqual(parsedMessage, expectedData);
});
