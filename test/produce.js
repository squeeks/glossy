var assert       = require('assert');
var producer     = require('../lib/glossy/produce.js');

assert.ok(producer, 'producer loaded');

var syslogProducer = new producer();
assert.ok(syslogProducer, 'new SyslogProducer object created');

var BSDProducer = new producer('BSD');
assert.ok(BSDProducer, 'new BSDProducer object created');

var msg = syslogProducer.produce({
	facility: 'local4',
	severity: 'error',
	host: 'localhost',
	app_id: 'sudo',
	pid: '123',
	date: new Date(1234567890000),
	message: 'Test Message'
});

assert.equal(msg, "<163>1 2009-01-13T23:31:30.00Z localhost sudo 123 - Test Message",'Valid message returned');

syslogProducer.produce({
	facility: 'audit',
	severity: 'error',
	host: '127.0.0.1',
	app_id: 'sudo',
	pid: '419',
	date: new Date(1234567890000),
	message: 'Test Message'
}, function(cbMsg) {
	assert.equal(cbMsg, '<107>1 2009-01-13T23:31:30.00Z 127.0.0.1 sudo 419 - Test Message', 'Valid message in callback returned');
});


