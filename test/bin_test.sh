#!/bin/bash
. assert.sh

# start canned on port
../bin/canned -p 8765 ../example &
CPID=$!
sleep 1
assert "lsof -i:8765 | grep node | awk '{print \$1}'" "node"
kill $CPID

assert_end examples


