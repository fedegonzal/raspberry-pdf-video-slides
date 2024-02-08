/*
To work with Raspberry Pi / Chromium, you need:

1. Disable hardware acceleration in Chromium settings

2. Use Google DNS servers
    - sudo nano /etc/dhcpcd.conf
    - add the following line at the end of the file:
       static domain_name_servers=8.8.4.4 8.8.8.8
    - sudo service dhcpcd restart

3. Use the following command to start Chromium in kiosk mode:
    - chromium-browser --disable-gesture-requirement-for-presentation --kiosk --disable-infobars --disable-session-crashed-bubble --disable-features=TranslateUI "http://localhost"
    - More info: https://peter.sh/experiments/chromium-command-line-switches/

    4. Set the screen resolution to 1280x720
*/


const pdfPath = "ista-screens-test.pdf";




// Loaded via <script> tag, create shortcut to access PDF.js exports.
let { pdfjsLib } = globalThis;

let appStarted = false;

// The workerSrc property shall be specified.
pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdfjs-dist/build/pdf.worker.js';

let slidesContainer = document.getElementById("slidesContainer");
slidesContainer.style.width = window.innerWidth + "px";
slidesContainer.style.height = window.innerHeight + "px";

// const mainElement = document.documentElement;
// mainElement.requestFullscreen();

let pdfContainer = document.getElementById("pdfContainer");
let youtubePlayerContainer = null // is defined on playerReady()

let pdfDoc = null;
let pageNum = 1;

let scale = 1;
let ratio = 1;

let fullScreen = false;

let slidesInterval;
const defaultInterval = 5000;

// Stores the YouTube player
let youtubePlayer = false;

// see searchForVideoOnPage() with details
let video = {
    hasVideo: false,
    videoId: "",
    fullScreen: false,
    bbox: [0, 0, 0, 0]
}; 


// Function to render a page
function renderPage(num) {
    pdfDoc.getPage(num).then((page) => {
        const canvas = document.createElement("canvas");
        pdfContainer.appendChild(canvas);

        const context = canvas.getContext("2d");

        scale = parseFloat(slidesContainer.style.width) / page.getViewport().viewBox[2]
        ratio = page.getViewport().viewBox[2] / page.getViewport().viewBox[3];

        const viewport = page.getViewport({ scale });

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // console.log("Slide number", num);

        try {
            // console.log("page", page);
            page.getTextContent().then((textContextResponse) => {

                const textContext = textContextResponse;

                page.getAnnotations().then((annotations) => {
                    // console.log("Annotations", annotations);

                    video = searchForVideoOnPage(annotations, textContext);

                    // console.log("Has video:", response.hasVideo);

                    if (video.videoId) {
                        // console.log( "I found a youtube video here!!" );
                        loadYoutubeVideo();
                    }

                });

            });
        } catch (error) {
            console.error("page loading error!", error);
        }

        page.render({ canvasContext: context, viewport });
    });
}


// look into a pdf page for a youtube url video
// if found, return the video id
// else return false
function searchForVideoOnPage(annotations, textContext) {
    // possible domains for youtube videos on the PDF
    const youtubeDomains = /youtube|youtu/;

    let response = {
        hasVideo: false,
        videoId: "",
        fullScreen: false,
        bbox: [0, 0, 0, 0]
    }
    
    let textItemsFound = textContext.items.length;
    
    // console.log("annotations!!", annotations);

    if (annotations.length) {

        annotations.forEach((item) => {

            // console.log("item!", item);

            const hasVideo = youtubeDomains.test(item.url);
            
            // console.log("has video!", hasVideo);

            if (hasVideo) {
                response.hasVideo = true;                        
                response.videoId = getYouTubeVideoId(item.url);

                if (textItemsFound) {
                    response.fullScreen = false;
                    response.bbox = item.rect;
                }
                else {
                    response.fullScreen = true;
                }
            }
        });
    }

    // console.log("response", response);

    return response;
}


// Create the YouTube player
function loadYoutubeVideo() {
    // https://developers.google.com/youtube/player_parameters
    // https://developers.google.com/youtube/iframe_api_reference

    clearInterval(slidesInterval);

    // console.log("youtubePlayer", youtubePlayer, video.videoId);

    youtubePlayer.loadVideoById(video.videoId);
    youtubePlayer.onPlayerStateChange = onPlayerStateChange;

    // console.log(youtubePlayer);
}



// Create the YouTube player
function createYotubePlayer() {
    youtubePlayer = new YT.Player('youtubePlayerContainer', {
        playerVars: { 
            'autoplay': 1,
            'mute': 1,
            'controls': 0,
            'fullscreen': 1,
            'rel': 0
        },
        events: {    
            'onReady': (event) => {
                onPlayerReady(event);
            },

            'onStateChange': (event) => {
                onPlayerStateChange(event);
            },

            'onAutoplayBlocked': (event) => {
                // console.log("Autoplay blocked", event);
            }
        }
    });
}



// Function called when the player is ready
function onPlayerReady(event) {

    youtubePlayerContainer = document.getElementById("youtubePlayerContainer");
    // console.log("Player is ready", event);

}



// Function called when the player's state changes
async function onPlayerStateChange(event) {

    /* 
    From API docs
    YT.PlayerState = {
        BUFFERING: 3,
        CUED: 5,
        ENDED: 0,
        PAUSED: 2,
        PLAYING: 1,
        UNSTARTED: -1    
    }
    */
   
    // console.log("Player's state changed");
    // console.log("State:", event);

    // const theVideo = event.target;

    // const durationSeconds = theVideo.getDuration()
    // console.log("Next slide in:", durationSeconds);

    // console.log("Video ID:", video.videoId);

    // const videoData = youtubePlayer.getVideoData();
    // console.log("Title:", videoData.title);


    if (event.data == YT.PlayerState.ENDED && !emergency) {
        finishVideoNextSlide();
    }


    if (event.data == YT.PlayerState.BUFFERING || event.data == YT.PlayerState.PLAYING) {

        // console.log("buffering or playing");

        if (video.fullScreen) {
            //pdfContainer.style.visibility = "hidden";

            try {
                await youtubePlayerContainer.requestFullscreen();

                // console.log("Requesting fullscreen!!!!");
            } 
            
            catch (error) {
                // console.log("Fullscreen fallback :)");
                
                youtubePlayerContainer.style.left = 0;
                youtubePlayerContainer.style.top = 0;
                youtubePlayerContainer.style.width = "100vw";
                youtubePlayerContainer.style.height = "100vh";
            }
        }
    
        else {
            // console.log("Size:", size);
            const safeZone = 5;
            youtubePlayerContainer.style.left = ((video.bbox[0] * scale) - (safeZone)) + "px";
            youtubePlayerContainer.style.top = ((video.bbox[1] * scale * ratio) - (safeZone)) + "px";
            youtubePlayerContainer.style.width = (((video.bbox[2] - video.bbox[0]) * scale) + (safeZone * 2)) + "px";
            youtubePlayerContainer.style.height = (((video.bbox[3] - video.bbox[1]) * scale) + (safeZone * 2)) + "px";
        }
        
        youtubePlayerContainer.style.visibility = "visible";

    }
    
} // onPlayerStateChange()

            

// Function to load the PDF
function startApp() {

    appStarted = true;

    YT.ready(() => {
        createYotubePlayer();
    });

    pdfjsLib.getDocument(pdfPath).promise.then((pdfDocument) => {
        // console.log('PDF loaded');

        pdfDoc = pdfDocument;
        renderPage(pageNum);
    });

    slidesInterval = setInterval(() => {
        gotoNextSlide();
    }, defaultInterval);

} // startApp()



// Go to the next slide as a loop
function gotoNextSlide() {
    pageNum = pageNum < pdfDoc.numPages ? pageNum + 1 : 1;
    pdfContainer.innerHTML = "";
    renderPage(pageNum);
}


function gotoPrevSlide() {
    pageNum = pageNum == 1 ? pdfDoc.numPages : pageNum - 1;
    pdfContainer.innerHTML = "";
    renderPage(pageNum);
}


let emergency = false;

function emergencyStop() {
    clearInterval(slidesInterval);
    emergency = true;
}



function getYouTubeVideoId(url) {
    // Regular expression to match YouTube video ID in various URL formats
    const regex = /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|shorts\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*/;
    
    // Match the regular expression against the provided URL
    const match = url.match(regex);

    // console.log("Match:", match);

    // If a match is found, return the video ID, otherwise return null
    return match ? match[1] : null;
}


function finishVideoNextSlide() {
    
    // destroy the video
    // player.destroy();

    youtubePlayerContainer.style.visibility = "hidden";
    //pdfContainer.style.visibility = "visible";
    
    gotoNextSlide();

    slidesInterval = setInterval(() => {
        gotoNextSlide();
    }, defaultInterval);

}


// Load the PDF when the page is ready
document.addEventListener("DOMContentLoaded", startApp);


window.addEventListener("resize", () => {
    slidesContainer.style.width = window.innerWidth + "px";
    slidesContainer.style.height = window.innerHeight + "px";
});


window.emergencyStop = emergencyStop;
