#!/bin/bash

npm install
npx electron-packager . whatsapp-electron --platform=linux --arch=x64 --icon=assets/whatsapp.png --overwrite

