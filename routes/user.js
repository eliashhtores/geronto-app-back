const express = require('express')
const router = express.Router()
const app = express()
const pool = require('../database/db')
const winston = require('winston')

app.use(express.json())

const logConfiguration = {
    'transports': [
        new winston.transports.File({
            filename: 'logs/app.log'
        })
    ]
}

const winstonLogger = winston.createLogger(logConfiguration)

// Get one user by id
router.get('/:id', getUserByID, async (req, res) => {
    res.json(res.user)
})

// Create user
router.post('/', async (req, res) => {
    try {
        const { username, name, password } = req.body
        const newUser = await pool.query('INSERT INTO user (name, username, password) VALUES (?, ?, PASSWORD(?))', [
            name,
            username,
            password
        ])
        res.status(201).json(newUser)
    } catch (error) {
        res.status(500).json({ message: error.message })
        console.error(error.message)
        winstonLogger.error(`${error.message} on ${new Date()}`)
    }
})

// Validate user
router.post('/validate', async (req, res) => {
    try {
        const { username, password } = req.body
        // @@TODO handle this encryption differently
        const user = await pool.query("SELECT id, name, username FROM user WHERE username = ? AND password = CONCAT('*', UPPER(SHA1(UNHEX(SHA1(?)))))", [username, password])
        if (user[0].length == 0) {
            res.status(404).json(user[0])
            return
        }

        res.json(user[0][0])
    } catch (error) {
        res.status(500).json({ message: error.message, status: 500 })
        console.error(error.message)
        winstonLogger.error(`${error.message} on ${new Date()}`)
    }
})

// Middleware functions
async function getUserByID(req, res, next) {
    try {
        const { id } = req.params
        const user = await pool.query('SELECT * FROM user WHERE id = ?', [id])
        if (user[0].length === 0) return res.status(404).json({ message: 'User not found', status: 404 })

        res.user = user[0][0]
        next()
    } catch (error) {
        res.status(500).json({ message: error.message, status: 500 })
        console.error(error.message)
        winstonLogger.error(`${error.message} on ${new Date()}`)
    }
}

module.exports = router
