#!/bin/bash
git add .
git commit -m 'update from aditya'
git push origin master
ssh -i bastion ec2-user@52.54.244.199 '~/redis_proxy/restart.sh'