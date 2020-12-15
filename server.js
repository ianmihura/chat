// Required external libraries
const express = require('express')
const app = express()
const https = require('https')
const { v4: uuidV4 } = require('uuid')
const bcrypt = require('bcrypt')
const passport = require('passport')
const session = require('express-session')
const methodOverride = require('method-override')

// Required files
const { checkAuthenticated, checkNotAuthenticated } = require('./server/helper')
const api = require('./server/api')

// TLS keys
const fs = require('fs')
const sslKeys = {
    key: fs.readFileSync('cert/server.key'),
    cert: fs.readFileSync('cert/server.cert')
}

// Passport config
const initializePassport = require('./server/passport')
initializePassport(passport,
    name => Users.find(user => user.name === name),
    id => Users.find(user => user.id === id))

// Users
const Users = [{
    "id": "1607816969353",
    "name": "a",
    "password": "$2b$10$QtU8KO50rMvoJA5h3n1Nlu/JOrdkNmj6IYJP7aReixsdNXknvt7Wq"
}, {
    "id": "1607896802442",
    "name": "b",
    "password": "$2b$10$ahJDQHQd7htzbBOWAAFbzu2UKDYNIPuh/ZULPAIApS3yBimf322NW"
}]

// Server config
const SESSION_SECRET = uuidV4()
const server = https.createServer(sslKeys, app)
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
})
app.set('view engine', 'pug')
app.use(express.static('static'))
app.use(express.urlencoded({ extended: false }))
app.use(express.json())
app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'))

// Routes
app.get('/', checkAuthenticated, (req, res) => { res.render('index.pug') })
app.get('/login', checkNotAuthenticated, (req, res) => { res.render('login.pug') })
app.get('/register', checkNotAuthenticated, (req, res) => { res.render('register.pug') })
app.get('/:roomId', checkAuthenticated, (req, res) => {
    res.render('room', { roomId: req.params.roomId, userId: req.user.name, video: req.query.video })
})

// API
app.get('/api/users', (req, res) => { res.json(Users) })
app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login'
}))
app.post('/register', checkNotAuthenticated, async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10)
        Users.push({
            id: Date.now().toString(),
            name: req.body.name,
            password: hashedPassword
        })
        res.redirect('/login')

    } catch (e) {
        console.log(e)
        res.redirect('/register')
    }
})
app.post('/room', checkAuthenticated, (req, res) => {
    res.redirect(`${req.body.room}/?video=${req.body.video}`)
})
app.delete('/logout', checkAuthenticated, api.deleteLogout)

// Web Socket
const io = require('socket.io')(server)
const socketService = require('./server/socket')
io.on('connection', socketService.ioConnect)

// Deploy
server.listen(443)