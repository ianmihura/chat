window.localStream = {}
window.remoteStreams = {}
window.peerConnections = {}

$(document).ready(() => {
    window.peerConnections[0] = new RTCPeerConnection({
        'iceServers': [{
            urls: 'stun:stun.services.mozilla.com',
            username: "louis@mozilla.com",
            credential: "webrtcdemo"
        }]
    })
})

const peers = {}
const remoteStream = new MediaStream()
const peerConnection = new RTCPeerConnection({
    'iceServers': [{
        urls: 'stun:stun.services.mozilla.com',
        username: "louis@mozilla.com",
        credential: "webrtcdemo"
    }]
})

// Data channel
let dataChannel = {}

// Media Stream
let mediaDeviceCallback = function (stream) {
    addVideoStream(myVideo, stream)
    // Local Stream
    stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream)
    })
}

let mediaDeviceFinal = function () {
    emit('join-room', ROOM_ID, USER_ID)
    // On peer connected
    onBroadcastRecieved('peer-connected', userId => {
        callData()
        setTimeout(makeCall, 2000)
    })
}

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

else
    mediaDeviceFinal()

// Calling
async function makeCall() {
    // Recieving Answer (local)
    onBroadcastRecieved('peer-answering', async (userId, answer) => {
        if (!answer) return false;

        const remoteDesc = new RTCSessionDescription(answer);
        await peerConnection.setRemoteDescription(remoteDesc);
    })

    // Making Call (local)
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    emit('calling', offer)
};

// Open data channel (local)
let callData = function () {
    dataChannel = peerConnection.createDataChannel("asdf", { ordered: true })
    configureDataChannel()
}

// Calling recieved (remote)
onBroadcastRecieved('peer-calling', async (userId, offer) => {
    if (!offer) return false;

    peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
    const answer = await peerConnection.createAnswer()
    await peerConnection.setLocalDescription(answer)
    emit('answering', answer)

});

// Set Remote Stream (remote)
peerConnection.addEventListener('track', async (event) => {
    console.log(`Track event`, event)
    remoteStream.addTrack(event.track, remoteStream)
})

// Listen for remote data channel opened (remote)
peerConnection.addEventListener('datachannel', event => {
    dataChannel = event.channel
    configureDataChannel()
})

// Data channel Configuration & Event listeners (all)
let configureDataChannel = function () {
    dataChannel.binaryType = 'arraybuffer'

    // Listen for data messages
    dataChannel.addEventListener('message', event => {
        console.log(event)
        const data = JSON.parse(event.data)
        addMessage(data.userId, data.message)
    })

    // Open and Close events
    dataChannel.addEventListener('open', event => {
        console.log(`Data channel succesfully opened`, event)
    })
    dataChannel.addEventListener('close', event => {
        console.log(`Data channel closed`, event)
    })
}

// Trickling ICE candidate exchange (all)
peerConnection.addEventListener('icecandidate', event => {
    if (event.candidate)
        emit('ice-candidate', event.candidate)
})

onBroadcastRecieved('peer-ice-candidate', async (userId, iceCandidate) => {
    if (iceCandidate) {
        try {
            await peerConnection.addIceCandidate(iceCandidate)
        } catch (e) {
            console.error('Error adding received ice candidate', e)
        }
    }
})

// On success
peerConnection.addEventListener('connectionstatechange', event => {
    if (peerConnection.connectionState === 'connected') {
        console.log("Peers connected", event)

        addVideoStream(document.createElement('video'), remoteStream)
    }
})

// Send data (all)
let sendData = function (message) {
    dataChannel.send(JSON.stringify({
        message: message,
        userId: USER_ID
    }))
}

let sendChunk = function () {
    let chunkSize = Math.min(peerConnection.sctp.maxMessageSize, 262144);
    let dataString = new Array(chunkSize).fill('X').join('');
    console.log(`Determined chunk size: ${chunkSize}\nFinal dataString size: ${dataString.length}`);

    sendData(dataString)
}