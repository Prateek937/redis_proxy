#!/bin/bash
git add .
git commit -m 'update from aditya'
git push origin master
ssh -i bastion ec2-user@54.152.43.31 '~/redis_proxy/restart.sh'