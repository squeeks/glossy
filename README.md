glossy
===========

glossy aims to be a very generic yet powerful library for both producing
and also parsing raw syslog messages. The library aims to be capable of
adhearing to both RFC 3164 and RFC 5424 and by itself does no network
interactions, it's up to you to use this library as a syslog producer, a
consumer, relay or something else entirely.


Parsing
-------

    var syslogParser = require('glossy').Parse; // or wherever your glossy libs are
    
    parsedMessage = syslogParser.parse(message);

parsedMessage will return an object containing as many parsed values as
possible, as well as the original message. The date value will be a Date object.
Alternatively, you can give it a callback as your second argument:

    syslogParser.parse(message, function(parsedMessage){
        console.log(parsedMessage);
    });


Producing
-------
Unless you stipulate for BSD/RFC 3164 style messages, it will default to
generating all messages as newer, RFC 5424 format. This might break consumers or
relays not expecting it.

    var syslogProducer = require('glossy').Produce; // or wherever glossy lives
    var glossy = new syslog.Producer({ type: 'BSD' });

    var msg = glossy.produce({
        facility: 'local4', // these can either be a valid integer, 
        severity: 'error',  // or a relevant string
        host: 'localhost',
        app_id: 'sudo',
        pid: '123',
        date: new Date(Date()),
        message: 'Nice, Neat, New, Oh Wow'
    });

Again, you can specify a callback for the second argument.

    var msg = glossy.produce({
        facility: 'ntp', 
        severity: 'info',
	host: 'localhost',
        date: new Date(Date()),
        message: 'Lunch Time!'
    }, function(syslogMsg){
    	console.log(syslogMsg);
    });


Parsing Example
-------
Handle incoming syslog messages coming in on UDP port 514:

    var syslogParser = require('glossy').Parse; // or wherever your glossy libs are
    var dgram  = require("dgram");
    var server = dgram.createSocket("udp4");
    
    server.on("message", function(rawMessage) {
        syslogParser.parse(rawMessage.toString('utf8', 0), function(parsedMessage){
    		console.log(parsedMessage.host + ' - ' + parsedMessage.message);
    	});
    });
    
    server.on("listening", function() {
    	var address = server.address();
    	console.log("Server now listening at " + 
     		address.address + ":" + address.port);
    });
    
    server.bind(514); // Remember ports < 1024 need root


TODO
-------
* Better completion of test suite
* Decoding structured data
* Support for signed messages (RFC 5848)
* Better parsing of app_id/service/pid from RFC 5424 messages


Author
-------
Squeeks - privacymyass@gmail.com


License
-------
This is free software licensed under the MIT License - see the LICENSE file that
should be included with this package.
