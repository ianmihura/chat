window.localStream = {}
window.remoteStreams = {}
window.peerConnections = {}
window.dataChannels = {}

let newPeerConnection = function (userId) {
    if (window.peerConnections[userId]) return false

    window.peerConnections[userId] = new RTCPeerConnection({
        'iceServers': [{
            urls: 'stun:stun.services.mozilla.com',
            username: "louis@mozilla.com",
            credential: "webrtcdemo"
        }]
    })

    window.remoteStreams[userId] = new MediaStream()

    if (window.localStream.id)
        window.localStream.getTracks().forEach(track => {
            window.peerConnections[userId].addTrack(track, window.localStream)
        })

    return window.peerConnections[userId]
}

// Media Stream
let mediaDeviceCallback = function (stream) {
    window.localStream = stream
    addVideoStream(myVideo, stream)
}

let mediaDeviceFinal = function () {
    emit('join-room', ROOM_ID, USER_ID)
    // On peer connected
    onBroadcastRecieved('peer-connected', userId => {
        setTimeout(() => makeCall(userId), 2000)
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

else mediaDeviceFinal()




// Connectivity

// Calling (local)
let makeCall = async function (userId) {

    let peerConnection = newPeerConnection(userId)
    if (!peerConnection) return false

    configureDataChannel(userId)
    configurePeerConnection(userId)

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    emit('calling', offer)
}

// Calling recieved (remote)
onBroadcastRecieved('peer-calling', async (userId, offer) => {
    if (!offer) return false;

    let peerConnection = newPeerConnection(userId)
    if (!peerConnection) return false

    configureDataChannel(userId)
    configurePeerConnection(userId)

    peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
    const answer = await peerConnection.createAnswer()
    await peerConnection.setLocalDescription(answer)

    emit('answering', answer, userId)
})

// Recieving Answer (local)
onBroadcastRecieved('peer-answering', async (userId, answer, answerUser) => {
    if (!answer) return false
    if (window.peerConnections[userId].connectionState === "connected") return false
    if (answerUser != USER_ID) return false

    const remoteDesc = new RTCSessionDescription(answer)
    await window.peerConnections[userId].setRemoteDescription(remoteDesc)
})

// Data channel Configuration & Event listeners (all)
let configureDataChannel = function (userId) {
    window.dataChannels[userId] = window.peerConnections[userId].createDataChannel("datachannel", {
        id: 0,
        negotiated: true,
        ordered: true
    })
    let dataChannel = window.dataChannels[userId]

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

let configurePeerConnection = function (userId) {
    let peerConnection = window.peerConnections[userId]

    // Set Remote Stream (remote)
    peerConnection.addEventListener('track', async (event) => {
        let remoteStream = window.remoteStreams[userId]
        remoteStream.addTrack(event.track, remoteStream)
    })

    // Trickling ICE candidate exchange emit (all)
    peerConnection.addEventListener('icecandidate', event => {
        if (event.candidate)
            emit('ice-candidate', event.candidate)
    })

    // On success (all)
    peerConnection.addEventListener('connectionstatechange', event => {
        if (peerConnection.connectionState === 'connected') {
            let remoteStream = window.remoteStreams[userId]
            addVideoStream(document.createElement('video'), remoteStream)
            console.log(`Connected with peer ${userId}`)
        }
    })
}

// Trickling ICE candidate exchange answer (all)
onBroadcastRecieved('peer-ice-candidate', async (userId, iceCandidate) => {
    if (iceCandidate) {
        try {
            await window.peerConnections[userId].addIceCandidate(iceCandidate)
        } catch (e) {
            console.error('Error adding received ice candidate', e)
        }
    }
})

// Send data (all)
let sendData = function (message) {
    Object.keys(window.dataChannels).map((userId) =>
        window.dataChannels[userId].send(JSON.stringify({
            message: message,
            userId: USER_ID
        })))
}

// let sendChunk = function () {
//     let chunkSize = Math.min(peerConnection.sctp.maxMessageSize, 262144);
//     let dataString = new Array(chunkSize).fill('X').join('');
//     console.log(`Determined chunk size: ${chunkSize}\nFinal dataString size: ${dataString.length}`);

//     sendData(dataString)
// }