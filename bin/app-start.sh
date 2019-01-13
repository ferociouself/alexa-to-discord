#!/usr/bin/env bash
cd $HOME/alexa-to-discord

# Allows NVM to load
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion

nvm use --delete-prefix v10.15.0
node -v
node bot.js > /dev/null 2> /dev/null < /dev/null &
