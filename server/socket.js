module.exports = {
    ioConnect: function (socket) {
        socket.on('join-room', (roomId, userId) => {
            console.log(`User joining room\n Room ${roomId}\n User ${userId}`)
            socket.join(roomId)
            socket.to(roomId).broadcast.emit('peer-connected', userId)

            socket.on('typing', (isTyping) => {
                socket.to(roomId).broadcast.emit('peer-typing', userId, isTyping)
            })

            socket.on('message', (message) => {
                console.log(`User ${userId} sending message ${message}`)
                socket.to(roomId).broadcast.emit('peer-message', userId, message)
            })

            socket.on('calling', (offer) => {
                console.log(`User ${userId} calling`, offer)
                socket.to(roomId).broadcast.emit('peer-calling', userId, offer)
            })

            socket.on('answering', (answer, answerUser) => {
                console.log(`User ${userId} answering`, answer, answerUser)
                socket.to(roomId).broadcast.emit('peer-answering', userId, answer, answerUser)
            })

            socket.on('ice-candidate', candidate => {
                console.log(`User ${userId} sending candidate:`, candidate)
                socket.to(roomId).broadcast.emit('peer-ice-candidate', userId, candidate)
            })

            socket.on('disconnect', () => {
                console.log(`User leaving room\n Room ${roomId}\n User ${userId}`)
                socket.to(roomId).broadcast.emit('peer-disconnected', userId)
            })

        })
    }
}