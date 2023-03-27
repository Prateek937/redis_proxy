#!/bin/bash
git add .
git commit -m 'update from aditya'
git push origin master
ssh -i proxy ec2-user@3.82.175.72 '~/redis_proxy/restart.sh'
