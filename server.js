// Required external libraries
const express = require('express')
const app = express()
const https = require('https')
const { v4: uuidV4 } = require('uuid')
// const router = express.Router()

// TLS keys
const fs = require('fs')
const sslKeys = {
    key: fs.readFileSync('cert/server.key'),
    cert: fs.readFileSync('cert/server.cert')
}

// General app config
const server = https.createServer(sslKeys, app)
const io = require('socket.io')(server)

app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// Routes
// app.use('/', router.get('/', (req, res) => res.render('room')))

app.get('/', (req, res) => {
    res.redirect(`/${uuidV4()}`)
})

app.get('/:roomId', (req, res) => {
    res.render('room', { roomId: req.params.roomId })
})

// Socket connections
io.on('connection', socket => {
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

        socket.on('answering', (answer) => {
            console.log(`User ${userId} answering`, answer)
            socket.to(roomId).broadcast.emit('peer-answering', userId, answer)
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
})

// Deploy
server.listen(443)