window.peerConnections = {}

let newPeerConnection = function (userId) {
    if (window.peerConnections[userId] && window.peerConnections[userId].connectionState != "closed")
        return false

    window.peerConnections[userId] = new RTCPeerConnection({
        'iceServers': [{
            urls: 'stun:stun.services.mozilla.com',
            username: "louis@mozilla.com",
            credential: "webrtcdemo"
        }]
    })

    newMediaStreams(userId)

    configurePeerConnection(userId)

    return window.peerConnections[userId]
}

let configurePeerConnection = function (userId) {
    let peerConnection = window.peerConnections[userId]

    // Set Remote Stream (all)
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
            deleteVideoPreview(userId)
            let remoteStream = window.remoteStreams[userId]
            addVideoStream(remoteStream, userId)
            console.log(`Connected with peer ${userId}`)
        }
    })
}

// Calling (local)
let makeCall = async function (userId) {

    let peerConnection = newPeerConnection(userId)
    if (!peerConnection) return false

    newDataChannel(userId)

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    emit('calling', offer)
}

// Calling recieved (remote)
onBroadcastRecieved('peer-calling', async (userId, offer) => {
    if (!offer) return false;

    let peerConnection = newPeerConnection(userId)
    if (!peerConnection) return false

    newDataChannel(userId)

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