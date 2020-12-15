(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const uiController = require('./ui')
const socketController = require('./socket')

window.dataChannels = {}

let _configureDataChannel = function (dataChannel) {

    dataChannel.binaryType = 'arraybuffer'

    // Listen for data messages
    dataChannel.addEventListener('message', event => {
        const data = JSON.parse(event.data)
        if (data.message)
            uiController.addMessage(data.userId, data.message)
        else if (data.file)
            uiController.addFile(data.userId)
    })

    // Open and Close events
    dataChannel.addEventListener('open', event => {
        console.log(`Data channel succesfully opened`)
    })
    dataChannel.addEventListener('close', event => {
        console.log(`Data channel closed`)
    })
}

// Send data (all)
let _sendData = function (message) {
    Object.keys(window.dataChannels).map((userId) =>
        window.dataChannels[userId].send(JSON.stringify({
            message: message,
            userId: USER_ID
        })))
}

let sendMessage = function (message) {
    if (document.getElementById("useWebRTC").checked)
        _sendData(message)
    else
        socketController.emit("message", message)

    socketController.emit("typing", false)

    uiController.addMessage(USER_ID, message)
}

uiController.formEventListener(sendMessage)

module.exports = {

    // Data channel Configuration & Event listeners (all)
    newDataChannel: function (userId) {
        if (window.dataChannels[userId] && window.dataChannels[userId].readyState != "closed")
            return false

        window.dataChannels[userId] = window.peerConnections[userId].createDataChannel("datachannel", {
            id: 0,
            negotiated: true,
            ordered: true
        })

        _configureDataChannel(window.dataChannels[userId])
    },

    sendMessage: sendMessage,

    // File transfer
    sendFile: function () {
        // Announce existance of file
        Object.keys(window.dataChannels).map((userId) =>
            window.dataChannels[userId].send(JSON.stringify({
                file: true,
                userId: USER_ID
            })))

        // seed file
    },

    downloadFile: function (userId) {
        console.log(`Downloading file from ${userId}`)
        // pullreq file transfer
    }
}
},{"./socket":3,"./ui":4}],2:[function(require,module,exports){
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

},{"./socket":3,"./ui":4}],3:[function(require,module,exports){
const socket = io('/')
const uiController = require('./ui')

let onBroadcastRecieved = function (type, callback) {
    socket.on(type, callback)
}

onBroadcastRecieved('peer-typing', (userId, isTyping) => {
    uiController.showUserTyping(userId, isTyping)
})

onBroadcastRecieved('peer-message', (userId, message) => {
    uiController.addMessage(userId, message)
})

onBroadcastRecieved('peer-disconnected', userId => {
    console.log(`User disconnected ${userId}`)

    if (window.peerConnections[userId])
        window.peerConnections[userId].close()
    if (window.dataChannels[userId])
        window.dataChannels[userId].close()

    uiController.deleteVideoStream(userId)
    uiController.deletePeerMessageBoard(userId)
})

uiController.addCustomEventListener("your-message", "input", (e) => {
    socket.emit('typing', e.target.value)
})

module.exports = {
    emit: function (type, ...body) { socket.emit(type, ...body) },
    onBroadcastRecieved: onBroadcastRecieved
}
},{"./ui":4}],4:[function(require,module,exports){
let _getVideoGrid = function () {
    return document.getElementById('video-grid')
}

let _newVideo = function () {
    let video = document.createElement('video')
    video.mute = true
    return video
}

let _addRibbon = function (userId, message, icon) {
    document.getElementById("message-board").innerHTML += `
        <div class="ui ribbon label" >
            <i class="${icon} icon"></i>
            ${userId} ${message}
        </div>`
}

let _getVideoPreviewId = function (userId) {
    return `video-preview-${userId}`
}

let _updateMessageScroll = function () {
    var element = document.getElementById("message-board");
    element.scrollTop = element.scrollHeight;
}

let _addCustomEventListener = function (eId, type, callback) {
    document.getElementById(eId).addEventListener(type, (e) => {
        callback(e)
    })
}

module.exports = {
    formEventListener: function (sendMessage) {
        _addCustomEventListener("message-board-form", "submit", (e) => {
            e.preventDefault()

            sendMessage(document.getElementById("your-message").value)
            document.getElementById("your-message").value = ""
        })
    },

    addCustomEventListener: _addCustomEventListener,

    showUserTyping: function (userId, isTyping) {
        document.getElementById("isTyping").innerText = ""
        if (!isTyping) return;
        document.getElementById("isTyping").innerText = `${userId} is typing...`
    },

    addMessage: function (userId, message) {
        let div = document.createElement("div")
        div.classList.add("item")
        div.innerText = `${userId}\n${message}`

        document.getElementById("message-board").appendChild(div)
        _updateMessageScroll()
    },

    addFile: function (userId) {
        document.getElementById("message-board").innerHTML += `
            <a class="ui ribbon label" onclick="downloadFile('${userId}')">
                <i class="paperclip icon"></i>
                ${userId} sent you a file
            </a>`
    },

    addVideoStream: function (stream, userId) {
        let video = _newVideo()

        video.srcObject = stream
        video.userId = userId
        video.addEventListener('loadedmetadata', () => {
            video.play()
        })

        _getVideoGrid().appendChild(video)
    },

    deleteVideoStream: function (userId) {
        for (var i = 0; i < _getVideoGrid().children.length; i++) {
            let video = _getVideoGrid().children[i]
            if (video.userId == userId) {
                _getVideoGrid().removeChild(video)
                break
            }
        }
    },

    addVideoPreview: function (userId) {
        let video = document.createElement('video')
        video.src = "/media/loading.mp4"
        video.id = _getVideoPreviewId(userId)
        video.play()
        video.loop = true
        _getVideoGrid().appendChild(video)
    },

    deleteVideoPreview: function (userId) {
        let video = document.getElementById(_getVideoPreviewId(userId))
        if (video)
            _getVideoGrid().removeChild(video)
    },

    addPeerMessageBoard: function (userId) {
        _addRibbon(userId, "entered the room", "user", "div")
    },

    deletePeerMessageBoard: function (userId) {
        _addRibbon(userId, "left the room", "user", "div")
    }
}
},{}],5:[function(require,module,exports){
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
},{"./datachannel":1,"./mediastream":2,"./socket":3,"./ui":4}]},{},[5]);
