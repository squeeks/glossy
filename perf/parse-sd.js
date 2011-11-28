var syslogParser = require('../lib/glossy/parse.js');

var message = '<165>1 2003-10-11T22:14:15.003Z mymachine.example.com evntslog - ID47 [exampleSDID@32473 iut="3" eventSource= "Application" eventID="1011"][examplePriority@32473 class="high"]';

for(var i = 0; i<10000; i++) {
    syslogParser.parse(message);
}

