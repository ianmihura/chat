const datachannelController = require('./datachannel')
const mediastreamController = require('./mediastream')
const uiController = require('./ui')
const socketController = require('./socket')

window.peerConnections = {}

$(document).ready(() => {
    mediastreamController.setVideoSource()
})

let _newPeerConnection = function (userId) {
    if (window.peerConnections[userId] && window.peerConnections[userId].connectionState != "closed")
        return false

    window.peerConnections[userId] = new RTCPeerConnection({
        'iceServers': [{
            urls: 'stun:stun.services.mozilla.com',
            username: "louis@mozilla.com",
            credential: "webrtcdemo"
        }]
    })

    mediastreamController.newMediaStreams(userId)

    _configurePeerConnection(userId)

    return window.peerConnections[userId]
}

let _configurePeerConnection = function (userId) {
    let peerConnection = window.peerConnections[userId]

    // Set Remote Stream (all)
    peerConnection.addEventListener('track', async (event) => {
        let remoteStream = window.remoteStreams[userId]
        remoteStream.addTrack(event.track, remoteStream)
    })

    // Trickling ICE candidate exchange emit (all)
    peerConnection.addEventListener('icecandidate', event => {
        if (event.candidate)
            socketController.emit('ice-candidate', event.candidate)
    })

    // On success (all)
    peerConnection.addEventListener('connectionstatechange', event => {
        if (peerConnection.connectionState === 'connected') {
            uiController.deleteVideoPreview(userId)
            let remoteStream = window.remoteStreams[userId]
            uiController.addVideoStream(remoteStream, userId)
            console.log(`Connected with peer ${userId}`)
        }
    })
}

// On peer connected
socketController.onBroadcastRecieved('peer-connected', userId => {
    uiController.addVideoPreview(userId)
    uiController.addPeerMessageBoard(userId)
    setTimeout(() => _makeCall(userId), 2000)
})

// Calling (local)
let _makeCall = async function (userId) {

    let peerConnection = _newPeerConnection(userId)
    if (!peerConnection) return false

    datachannelController.newDataChannel(userId)

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    socketController.emit('calling', offer)
}

// Calling recieved (remote)
socketController.onBroadcastRecieved('peer-calling', async (userId, offer) => {
    if (!offer) return false

    let peerConnection = _newPeerConnection(userId)
    if (!peerConnection) return false

    uiController.addVideoPreview(userId)
    uiController.addPeerMessageBoard(userId)

    datachannelController.newDataChannel(userId)

    peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
    const answer = await peerConnection.createAnswer()
    await peerConnection.setLocalDescription(answer)

    socketController.emit('answering', answer, userId)
})

// Recieving Answer (local)
socketController.onBroadcastRecieved('peer-answering', async (userId, answer, answerUser) => {
    if (!answer) return false
    if (window.peerConnections[userId].connectionState === "connected") return false
    if (answerUser != USER_ID) return false

    const remoteDesc = new RTCSessionDescription(answer)
    await window.peerConnections[userId].setRemoteDescription(remoteDesc)
})

// Trickling ICE candidate exchange answer (all)
socketController.onBroadcastRecieved('peer-ice-candidate', async (userId, iceCandidate) => {
    if (iceCandidate) {
        try {
            await window.peerConnections[userId].addIceCandidate(iceCandidate)
        } catch (e) {
            console.error('Error adding received ice candidate', e)
        }
    }
})