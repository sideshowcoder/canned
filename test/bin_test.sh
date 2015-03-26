#!/bin/bash
. assert.sh

# start canned on port
../bin/canned -p 8765 ../example &
CPID=$!
sleep 1
assert "lsof -i:8765 | grep node | awk '{print \$1}'" "node"

curl -sL -w " %{http_code}" http://127.0.0.1:8765/search | grep 200
assert  "echo $?" "0"

curl -sL http://127.0.0.1:8765/search?search=specific | grep "specific result"
assert "echo $?" "0"

curl -sL http://127.0.0.1:8765/search?search=apostrophe | grep "There's something about Mary"
assert "echo $?" "0"

kill $CPID

assert_end examples


