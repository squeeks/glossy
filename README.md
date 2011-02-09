glossy
===========

glossy aims to be a very generic yet powerful library for both producing
and also parsing raw syslog messages. The library aims to be capable of
adhearing to both RFC 3164 and RFC 5424 and by itself does no network
interactions, it's up to you to use this library as a syslog producer, a
consumer, relay or something else entirely.

Usage
-------

    var syslogParser = require('glossy').Parse; // or wherever your glossy libs are
    
    parsedMessage = syslogParser.parse(message);

parsedMessage will return an object containing as many parsed values as
possible, as well as the original message. The date value will be a Date object.


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
    
    server.bind(514);


TODO
-------
* Full producer support
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
