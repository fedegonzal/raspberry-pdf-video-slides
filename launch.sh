#!/bin/bash

chromium-browser "http://localhost:8080" &

sleep 2          # Wait for 2 seconds before the next click
xdotool key 's'

#while true; do
#    sleep 2          # Wait for 2 seconds before the next click
#    xdotool key 's'
    #xdotool click 1
#done
