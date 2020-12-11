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

// Server config
const server = https.createServer(sslKeys, app)
app.set('view engine', 'pug')
app.use(express.static('public'))
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// Routes
// app.use('/', router.get('/', (req, res) => res.render('room')))
app.get('/', (req, res) => { res.redirect(`/${uuidV4()}`) })
app.get('/:roomId', (req, res) => { res.render('room', { roomId: req.params.roomId }) })

// API
// const apiService = require('./server/api')
// app.post('api/join', apiService.join)

// Socket connections
const io = require('socket.io')(server)
const socketService = require('./server/socket')
io.on('connection', socketService.ioConnect)

// Deploy
server.listen(443)