const express = require('express')
const router = express.Router()
const app = express()
const pool = require('../database/db')

app.use(express.json())

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

// Get prescription by id
router.get('/:id', getPrescriptionByID, async (req, res) => {
    res.json(res.prescription)
})

// Get prescriptions by diagnostic
router.get('/diagnostic/:diagnostic_name', getDiagnosticByName, async (req, res) => {
    res.json(res.prescriptions)
})

// Get prescription by patient_id
router.get('/patient/:id', getPrescriptionByPatientID, async (req, res) => {
    res.json(res.prescriptions)
})

// Create prescription
router.post('/', async (req, res) => {
    try {
        const { blood_pressure, oxygen_saturation, heart_rate, breathing_frequency, temperature, current_condition, indications, physical_examination, patient_id, created_by, medication, diagnostic } = req.body
        const newPrescription = await pool.query(
            'INSERT INTO prescription (blood_pressure, oxygen_saturation, heart_rate, breathing_frequency, temperature, current_condition, indications, physical_examination, patient_id, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [blood_pressure, oxygen_saturation, heart_rate, breathing_frequency, temperature, current_condition, indications, physical_examination, patient_id, created_by]
        )
        if (medication.length > 0)
            createExtraData(medication, newPrescription[0].insertId, 'medication')

        if (diagnostic.length > 0)
            createExtraData(diagnostic, newPrescription[0].insertId, 'diagnostic')

        res.status(201).json(newPrescription)
    } catch (error) {
        res.status(500).json({ message: error.message })
        console.error(error.message)
        winstonLogger.error(`${error.message} on ${new Date()}`)
    }
})

// Create medication and/or diagnostic information for the prescription
async function createExtraData(data, prescription, table) {
    data.forEach(async function (field) {
        try {
            await pool.query(`INSERT INTO prescription_${table} VALUES (DEFAULT, ?, ?)`,
                [
                    prescription,
                    field
                ]
            )
        } catch (error) {
            console.error(error.message)
        }
    })
}

// Middleware functions
async function getPrescriptionByPatientID(req, res, next) {
    try {
        const { id } = req.params
        const prescriptions = await pool.query(
            "SELECT pr.id, name AS patient_name, COALESCE(blood_pressure, '') AS blood_pressure, COALESCE(oxygen_saturation, '') AS oxygen_saturation, COALESCE(heart_rate, '') AS heart_rate, COALESCE(breathing_frequency, '') AS breathing_frequency, COALESCE(temperature, '') AS temperature, COALESCE(physical_examination, '') AS physical_examination, COALESCE(indications, '') AS indications, DATE_FORMAT(pr.created_at, '%Y-%m-%d') AS created_at FROM prescription pr JOIN patient pt ON (pr.patient_id = pt.id) WHERE pt.id = ? ORDER BY pr.id DESC",
            [id]
        )
        if (prescriptions[0].length === 0) return res.status(404).json({ message: 'No prescriptions found', status: 404 })

        res.prescriptions = prescriptions[0]
        next()
    } catch (error) {
        res.status(500).json({ message: error.message, status: 500 })
        console.error(error.message)
        winstonLogger.error(`${error.message} on ${new Date()}`)
    }
}

async function getDiagnosticByName(req, res, next) {
    try {
        const diagnostic = req.params.diagnostic_name
        const prescriptions = await pool.query(
            `SELECT pr.id, name, diagnostic, DATE_FORMAT(pr.created_at, '%Y-%m-%d') AS created_at FROM prescription pr JOIN patient pt ON (pr.patient_id = pt.id) WHERE diagnostic LIKE '%${diagnostic}%' ORDER BY pr.id DESC`
        )
        if (prescriptions[0].length === 0) return res.status(404).json({ message: 'No prescriptions found', status: 404 })

        res.prescriptions = prescriptions[0]
        next()
    } catch (error) {
        res.status(500).json({ message: error.message, status: 500 })
        console.error(error.message)
        winstonLogger.error(`${error.message} on ${new Date()}`)
    }
}

async function getPrescriptionByID(req, res, next) {
    try {
        const { id } = req.params
        const prescription = await pool.query(
            `SELECT COALESCE(blood_pressure, '') AS blood_pressure, COALESCE(oxygen_saturation, '') AS oxygen_saturation, COALESCE(heart_rate, '') AS heart_rate, COALESCE(breathing_frequency, '') AS breathing_frequency, COALESCE(temperature, '') AS temperature, COALESCE(indications, '') AS indications, COALESCE(physical_examination, '') AS physical_examination, DATE_FORMAT(pr.created_at, '%Y-%m-%d') AS created_at, 
                pt.name, birth_date, gender, height, weight, allergies, COALESCE(pathological_personal_history, '') AS pathological_personal_history, COALESCE(current_condition, '') AS current_condition,
                COALESCE(physical_examination, '') AS physical_examination, COALESCE(indications, '') AS indications, username
                FROM prescription pr 
                JOIN patient pt ON (pr.patient_id = pt.id)
                JOIN user us ON (us.id = pr.created_by)
                WHERE pr.id = ?
            `,
            [id]
        )
        if (prescription[0].length === 0) return res.status(404).json({ message: 'Prescription not found', status: 404 })

        res.prescription = prescription[0][0]
        next()
    } catch (error) {
        res.status(500).json({ message: error.message, status: 500 })
        console.error(error.message)
        winstonLogger.error(`${error.message} on ${new Date()}`)
    }
}

module.exports = router
