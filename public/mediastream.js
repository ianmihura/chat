window.localStream = {}
window.remoteStreams = {}

// Creating new peerConnection
let newMediaStreams = function (userId) {
    window.remoteStreams[userId] = new MediaStream()

    if (window.localStream.id && window.peerConnections[userId])
        window.localStream.getTracks().forEach(track => {
            window.peerConnections[userId].addTrack(track, window.localStream)
        })
}

// Media stream success callback
let mediaDeviceCallback = function (stream) {
    window.localStream = stream
    addVideoStream(stream, USER_ID)
}

// Media stream final callback
let mediaDeviceFinal = function () {
    emit('join-room', ROOM_ID, USER_ID)
    // On peer connected
    onBroadcastRecieved('peer-connected', userId => {
        addVideoPreview(userId)
        setTimeout(() => makeCall(userId), 2000)
    })
}

// Set user selected video source
let setVideoSource = function () {
    if (DEFAULT_VIDEO == "screen")
        navigator.mediaDevices.getDisplayMedia({
            video: {
                cursor: "always"
            },
            audio: false
        })
            .then(mediaDeviceCallback)
            .catch((e) => console.log(e))
            .then(mediaDeviceFinal)

    else if (DEFAULT_VIDEO == "webcam")
        navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
        })
            .then(mediaDeviceCallback)
            .catch((e) => console.log(e))
            .then(mediaDeviceFinal)

    else mediaDeviceFinal()
}
