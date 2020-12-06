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
    // if (peers[userId]) peers[userId].close()
    console.log(`User disconnected ${userId}`)
})