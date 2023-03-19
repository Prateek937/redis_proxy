#!/bin/bash
cd ~/redis_proxy
npm install
tmux has-session -t server || tmux new-session -d -s server 'node server.js'
