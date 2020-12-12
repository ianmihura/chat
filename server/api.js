const bcrypt = require('bcrypt')

module.exports = {
    postRegister: async (req, res) => {
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
    },
    deleteLogout: (req, res) => {
        req.logOut()
        res.redirect('/login')
    }
}