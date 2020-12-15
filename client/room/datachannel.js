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