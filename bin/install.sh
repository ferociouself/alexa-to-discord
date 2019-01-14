#!/usr/bin/env bash
cd $HOME/alexa-to-discord
set -e

#install nvm
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.32.0/install.sh | bash
. $HOME/.nvm/nvm.sh

# add nodejs
nvm install v10.15.0
nvm use --delete-prefix v10.15.0