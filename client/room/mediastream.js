const uiController = require('./ui')
const socketController = require('./socket')

window.localStream = {}
window.remoteStreams = {}

// Creating new peerConnection
module.exports.newMediaStreams = function (userId) {
    window.remoteStreams[userId] = new MediaStream()

    if (window.localStream.id && window.peerConnections[userId])
        window.localStream.getTracks().forEach(track => {
            window.peerConnections[userId].addTrack(track, window.localStream)
        })
}

// Media stream success callback
let _mediaDeviceCallback = function (stream) {
    window.localStream = stream
    uiController.addVideoStream(stream, USER_ID)
}

// Media stream final callback
let _mediaDeviceFinal = function () {
    socketController.emit('join-room', ROOM_ID, USER_ID)
}

// Set user selected video source
module.exports.setVideoSource = function () {
    if (DEFAULT_VIDEO == "screen")
        navigator.mediaDevices.getDisplayMedia({
            video: {
                cursor: "always"
            },
            audio: false
        })
            .then(_mediaDeviceCallback)
            .catch((e) => console.log(e))
            .then(_mediaDeviceFinal)

    else if (DEFAULT_VIDEO == "webcam")
        navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
        })
            .then(_mediaDeviceCallback)
            .catch((e) => console.log(e))
            .then(_mediaDeviceFinal)

    else _mediaDeviceFinal()
}
