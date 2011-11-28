var syslogParser = require('../lib/glossy/parse.js');

var message = '<110>1 2009-05-03T14:00:39.529966+02:00 host.example.org syslogd 2138 - [ssign VER="0111" RSID="1" SG="0" SPRI="0" GBC="2" FMN="1" CNT="7" HB="K6wzcombEvKJ+UTMcn9bPryAeaU= zrkDcIeaDluypaPCY8WWzwHpPok= zgrWOdpx16ADc7UmckyIFY53icE= XfopJ+S8/hODapiBBCgVQaLqBKg= J67gKMFl/OauTC20ibbydwIlJC8= M5GziVgB6KPY3ERU1HXdSi2vtdw= Wxd/lU7uG/ipEYT9xeqnsfohyH0=" SIGN="AKBbX4J7QkrwuwdbV7Taujk2lvOf8gCgC62We1QYfnrNHz7FzAvdySuMyfM="]';

for(var i = 0; i<10000; i++) {
    syslogParser.parse(message);
}

