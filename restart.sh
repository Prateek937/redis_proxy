#!/bin/bash
cd ~/redis_proxy
git pull
tmux has-session -t server || tmux kill-session -t server
tmux has-session -t server || tmux new-session -d -s server 'node server.js'
