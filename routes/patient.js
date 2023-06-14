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

// Get one patient by id
router.get('/:id', getPatientByID, async (req, res) => {
    res.json(res.patient)
})

// Get patient by name
router.get('/patient_name/:name', getPatientsByName, async (req, res) => {
    res.json(res.patients)
})

// Create patient
router.post('/', async (req, res) => {
    try {
        const {
            name,
            birth_date,
            gender,
            height,
            weight,
            allergies,
            family_history,
            pathological_personal_history,
            non_pathological_personal_history,
            surgical_history_hospitalizations,
            gynecological_history,
            laboratories_xray,
            created_by,
        } = req.body

        const newPatient = await pool.query(
            'INSERT INTO patient (name, birth_date, gender, height, weight, allergies, family_history, pathological_personal_history, non_pathological_personal_history, surgical_history_hospitalizations, gynecological_history, laboratories_xray, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                name,
                birth_date,
                gender,
                height,
                weight,
                allergies,
                family_history,
                pathological_personal_history,
                non_pathological_personal_history,
                surgical_history_hospitalizations,
                gynecological_history,
                laboratories_xray,
                created_by,
            ]
        )
        res.status(201).json(newPatient)
    } catch (error) {
        res.status(500).json({ message: error.message })
        console.error(error.message)
        winstonLogger.error(`${error.message} on ${new Date()}`)
    }
})

// Update patient
router.patch('/:id', async (req, res) => {
    const { id } = req.params
    const {
        name,
        birth_date,
        gender,
        height,
        weight,
        allergies,
        family_history,
        pathological_personal_history,
        non_pathological_personal_history,
        surgical_history_hospitalizations,
        gynecological_history,
        laboratories_xray,
        updated_by,
    } = req.body
    try {
        const updatedPatient = await pool.query(
            'UPDATE patient SET name = ?, birth_date = ?, gender = ?, height = ?, weight = ?, allergies = ?, family_history = ?, pathological_personal_history = ?, non_pathological_personal_history = ?, surgical_history_hospitalizations = ?, gynecological_history = ?, laboratories_xray = ?, updated_by = ? WHERE id = ?',
            [
                name,
                birth_date,
                gender,
                height,
                weight,
                allergies,
                family_history,
                pathological_personal_history,
                non_pathological_personal_history,
                surgical_history_hospitalizations,
                gynecological_history,
                laboratories_xray,
                updated_by,
                id,
            ]
        )
        res.json(updatedPatient)
    } catch (error) {
        res.status(500).json({ message: error.message })
        console.error(error.message)
        winstonLogger.error(`${error.message} on ${new Date()}`)
    }
})

// Middleware functions
async function getPatientByID(req, res, next) {
    try {
        const { id } = req.params
        const patient = await pool.query('SELECT * FROM patient WHERE id = ?', [id])
        if (patient[0].length === 0) return res.status(404).json({ message: 'Patient not found', status: 404 })

        res.patient = patient[0][0]
        next()
    } catch (error) {
        res.status(500).json({ message: error.message, status: 500 })
        console.error(error.message)
        winstonLogger.error(`${error.message} on ${new Date()}`)
    }
}

async function getPatientsByName(req, res, next) {
    try {
        const { name } = req.params
        const patients = await pool.query(`SELECT * FROM patient WHERE name LIKE '%${name}%'`)
        if (patients[0].length === 0) return res.status(404).json({ message: 'No patients found', status: 404 })

        res.patients = patients[0]
        next()
    } catch (error) {
        res.status(500).json({ message: error.message, status: 500 })
        console.error(error.message)
        winstonLogger.error(`${error.message} on ${new Date()}`)
    }
}

module.exports = router
