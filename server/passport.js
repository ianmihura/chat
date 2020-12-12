const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcrypt')

module.exports = function (passport, getUserByName, getUserById) {
    const authenticateUser = async (name, password, callback) => {
        const user = getUserByName(name)
        if (user == null)
            return callback(null, false)
        try {
            if (await bcrypt.compare(password, user.password))
                return callback(null, user)
            else
                callback(null, false)
        } catch (error) {
            return callback(error)
        }
    }

    passport.use(new LocalStrategy({
        usernameField: 'name'
    }, authenticateUser))

    passport.serializeUser((user, callback) => callback(null, user.id))
    passport.deserializeUser((id, callback) => {
        callback(null, getUserById(id))
    })
}