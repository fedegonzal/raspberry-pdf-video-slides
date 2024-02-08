This is an always-draft project to take a PDF file, read its pages, and create a non-interactive slide presentation, including videos from YouTube. 

PDF pages can't include videos. However, if the PDF is created from Google Slides, PowerPoint, or similar and the user just added some YouTube videos to the slides, the PDF will have some special images with the video's thumbnail and some useful metadata as its URL.

This project is a kiosk web app and uses PDF.js and YouTube API. 

# Main idea:

1. If the page has text and images => show the page.
2. If the page has text, images, and some video, locate the video position, and its URL and replace the position with the video from YouTube.
3. If the page has just one video (no text, no images) replace it with a fullscreen video from YouTube.

The goal is to use this project with Raspberry Pi devices using some Chromium-based browsers in kiosk mode.

# Recommended command line params:

    chromium-browser --kiosk --disable-gesture-requirement-for-presentation  --disable-infobars --disable-session-crashed-bubble --disable-features=TranslateUI "YOUR-URL"

Anyway, this should be enough:
chromium-browser --kiosk "YOUR-URL"

# Super simple demo:

    chromium-browser --kiosk "https://fedegonzal.github.io/raspberry-pdf-video-slides/"
