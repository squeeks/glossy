#!/bin/sh

FILES=./*.js;
NODE_BIN=`/usr/bin/which node`;
GIT_BIN=`/usr/bin/which git`;
NODE_BIN="${NODE_BIN%\\n}";

if [ ! $NODE_BIN ];
then
    echo "node doesn't appear to be in your PATH, exiting...";
    exit 1;
fi

for f in $FILES
do
    `$NODE_BIN --prof $f`;
     LOGFILE="${f%.js}"
    `/bin/mv v8.log $LOGFILE.log`
done
