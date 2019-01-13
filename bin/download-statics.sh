#!/usr/bin/env bash
cd $HOME/alexa-to-discord

aws s3 cp s3://discord-bot-secret/ ./
aws s3 cp s3://alexa-to-discord-sounds/ ./sounds/