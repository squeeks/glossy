var syslogParser = require('../lib/glossy/parse.js');

var message = "<34>Oct 11 22:14:15 mymachine su: 'su root' failed for lonvick on /dev/pts/8";

for(var i = 0; i<10000; i++) {
    syslogParser.parse(message);
}

