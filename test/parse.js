var assert       = require('assert');
var syslogParser = require('../lib/glossy/parse.js');

assert.ok(syslogParser, 'parser loaded');

//TODO: Add more edge cases and other shenanigans here
var messages = [

    // RFC 5424
    "<165>1 2003-08-24T05:14:15.000003-07:00 192.0.2.1 myproc 8710 - - %% It's time to make the do-nuts.",
    '<165>1 2003-10-11T22:14:15.003Z mymachine.example.com evntslog - ID47 [exampleSDID@32473 iut="3" eventSource= "Application" eventID="1011"] BOMAn application event log entry...',
    '<165>1 2003-10-11T22:14:15.003Z mymachine.example.com evntslog - ID47 [exampleSDID@32473 iut="3" eventSource= "Application" eventID="1011"][examplePriority@32473 class="high"] ',
    "<34>1 2003-10-11T22:14:15.003Z mymachine.example.com su - ID47 - BOM'su root' failed for lonvick on /dev/pts/8",

    // RFC 3164
    "<13>Feb  5 17:32:18 10.0.0.99 Use the BFG!",
    "<34>Oct 11 22:14:15 mymachine su: 'su root' failed for lonvick on /dev/pts/8",
    '<191>94103: 51w2d: DHCPD: assigned IP address 10.10.1.94 to client 0100.01c4.21d3.b3',
  '<32>Mar 05 2011 22:21:02: %ASA-6-302013: Built inbound TCP connection 401 for outside:123.123.123.123/4413 (123.123.123.123/4413) to net:BOX/25 (BOX/25)',
    '<32>Mar 16 15:10:26 SyslogAlertForwarder: Attack P2P: HotSpot Shield Traffic Detected (Medium)\u0000","',
    '<13>Mar 15 11:22:40 myhost.com     0    11,03/15/12,11:22:38,§ó·s,10.10.10.171,,40C6A91373B6,',

    // RFC 5848
    '<110>1 2009-05-03T14:00:39.519307+02:00 host.example.org syslogd 2138 - [ssign-cert VER="0111" RSID="1" SG="0" SPRI="0" TPBL="587" INDEX="1" FLEN="587" FRAG="2009-05-03T14:00:39.519005+02:00 K BACsLMZ NCV2NUAwe4RAeAnSQuvv2KS51SnHFAaWJNU2XVDYvW1LjmJgg4vKvQPo3HEOD+2hEkt1zcXADe03u5pmHoWy5FGiyCbglYxJkUJJrQqlTSS6vID9yhsmEnh07w3pOsxmb4qYo0uWQrAAenBweVMlBgV3ZA5IMA8xq8l+i8wCgkWJjCjfLar7s+0X3HVrRroyARv8EAIYoxofh9m N8n821BTTuQnz5hp40d6Z3UudKePu2di5Mx3GFelwnV0Qh5mSs0YkuHJg0mcXyUAoeYry5X6482fUxbm+gOHVmYSDtBmZEB8PTEt8Os8aedWgKEt/E4dT+Hmod4omECLteLXxtScTMgDXyC+bSBMjRRCaeWhHrYYdYBACCWMdTc12hRLJTn8LX99kv1I7qwgieyna8GCJv/rEgC ssS9E1qARM+h19KovIUOhl4VzBw3rK7v8Dlw/CJyYDd5kwSvCwjhO21LiReeS90VPYuZFRC1B82Sub152zOqIcAWsgd4myCCiZbWBsuJ8P0gtarFIpleNacCc6OV3i2Rg==" SIGN="AKAQEUiQptgpd0lKcXbuggGXH/dCdQCgdysrTBLUlbeGAQ4vwrnLOqSL7+c="]',
    '<110>1 2009-05-03T14:00:39.529966+02:00 host.example.org syslogd 2138 - [ssign VER="0111" RSID="1" SG="0" SPRI="0" GBC="2" FMN="1" CNT="7" HB="K6wzcombEvKJ+UTMcn9bPryAeaU= zrkDcIeaDluypaPCY8WWzwHpPok= zgrWOdpx16ADc7UmckyIFY53icE= XfopJ+S8/hODapiBBCgVQaLqBKg= J67gKMFl/OauTC20ibbydwIlJC8= M5GziVgB6KPY3ERU1HXdSi2vtdw= Wxd/lU7uG/ipEYT9xeqnsfohyH0=" SIGN="AKBbX4J7QkrwuwdbV7Taujk2lvOf8gCgC62We1QYfnrNHz7FzAvdySuMyfM="]',

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

syslogParser.parse(messages[4], function(rfc3164_before_10th){
    assert.ok(rfc3164_before_10th, 'RFC 3164 record parsed.');
    assert.equal(rfc3164_before_10th.host, '10.0.0.99');
});
