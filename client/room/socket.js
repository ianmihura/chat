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