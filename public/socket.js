const socket = io('/')

let emit = function (type, ...body) {
    socket.emit(type, ...body)
}

let onBroadcastRecieved = function (type, callback) {
    socket.on(type, callback)
}


onBroadcastRecieved('peer-typing', (userId, isTyping) => {
    showUserTyping(userId, isTyping)
})

onBroadcastRecieved('peer-message', (userId, message) => {
    addMessage(userId, message)
})

onBroadcastRecieved('peer-disconnected', userId => {
    console.log(`User disconnected ${userId}`)

    if (window.peerConnections[userId])
        window.peerConnections[userId].close()
    if (window.dataChannels[userId])
        window.dataChannels[userId].close()

    deleteVideoStream(userId)
    deletePeerMessageBoard(userId)
})