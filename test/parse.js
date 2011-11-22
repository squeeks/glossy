var assert       = require('assert');
var syslogParser = require('../lib/glossy/parse.js');

assert.ok(syslogParser, 'parser loaded');

//TODO: Add more edge cases and other shenanigans here
var messages = [
	"<165>1 2003-08-24T05:14:15.000003-07:00 192.0.2.1 myproc 8710 - - %% It's time to make the do-nuts.",
	'<165>1 2003-10-11T22:14:15.003Z mymachine.example.com evntslog - ID47 [exampleSDID@32473 iut="3" eventSource= "Application" eventID="1011"] BOMAn application event log entry...',
	'<165>1 2003-10-11T22:14:15.003Z mymachine.example.com evntslog - ID47 [exampleSDID@32473 iut="3" eventSource= "Application" eventID="1011"][examplePriority@32473 class="high"] ',
	"<34>1 2003-10-11T22:14:15.003Z mymachine.example.com su - ID47 - BOM'su root' failed for lonvick on /dev/pts/8",
	"<13>Feb  5 17:32:18 10.0.0.99 Use the BFG!",
	"<34>Oct 11 22:14:15 mymachine su: 'su root' failed for lonvick on /dev/pts/8"
];

for(message in messages) {
	parsed = syslogParser.parse(messages[message]);
	assert.ok(parsed);
};

var firstParsed = syslogParser.parse(messages[0]);
assert.ok(firstParsed, 'First message parsed successfully');
assert.equal(firstParsed.facility, 'local4', 'Facility value matches');
assert.equal(firstParsed.severity, 'notice', 'Severity value matches');

syslogParser.parse(messages[1], function(secondParsed){
	assert.ok(secondParsed, 'Second message parsed, assert using callback');
	assert.equal(secondParsed.host, 'mymachine.example.com', 'hostname matches');
});

//TODO Cover some invalid messages, bad timestamps, out of range chars, incorrect PRIVAL etc


