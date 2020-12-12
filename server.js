// Required external libraries
const express = require('express')
const app = express()
const https = require('https')
const { v4: uuidV4 } = require('uuid')
const bcrypt = require('bcrypt')
const passport = require('passport')
const session = require('express-session')
const methodOverride = require('method-override')
// const router = express.Router()

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
const Users = []

// Server config
const SESSION_SECRET = uuidV4()
const server = https.createServer(sslKeys, app)
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
})
const { checkAuthenticated, checkNotAuthenticated } = require('./server/helper')
app.set('view engine', 'pug')
app.use(express.static('public'))
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
app.get('/', checkAuthenticated, (req, res) => { res.redirect(`/${uuidV4()}`) })
app.get('/login', checkNotAuthenticated, (req, res) => { res.render('login.pug') })
app.get('/register', checkNotAuthenticated, (req, res) => { res.render('register.pug') })
app.get('/:roomId', checkAuthenticated, (req, res) => { res.render('room', { roomId: req.params.roomId, userId: req.user.name }) })

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

    } catch {
        res.redirect('/register')
    }
})

app.delete('/logout', (req, res) => {
    req.logOut()
    res.redirect('/login')
})

// Socket connections
const io = require('socket.io')(server)
const socketService = require('./server/socket')
io.on('connection', socketService.ioConnect)

// Deploy
server.listen(443)