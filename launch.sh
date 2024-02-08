#!/bin/bash

chromium --start-fullscreen --enable-chrome-browser-cloud-management --autoplay-policy=no-user-gesture-required "http://localhost:8080/video-fullscreen.html"
# https://fedegonzal.github.io/raspberry-pdf-video-slides/

#sleep 2          # Wait for 2 seconds before the next click
#xdotool key 's'

#while true; do
#    sleep 2          # Wait for 2 seconds before the next click
#    xdotool key 's'
    #xdotool click 1
#done
