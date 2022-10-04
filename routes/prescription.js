const express = require('express')
const router = express.Router()
const app = express()
const pool = require('../database/db')

app.use(express.json())

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
        const { blood_pressure, temperature, current_condition, diagnostic, medication, patient_id, created_by } = req.body
        const newPrescription = await pool.query(
            'INSERT INTO prescription (blood_pressure, temperature, current_condition, diagnostic, medication, patient_id, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [blood_pressure, temperature, current_condition, diagnostic, medication, patient_id, created_by]
        )
        res.status(201).json(newPrescription)
    } catch (error) {
        res.status(500).json({ message: error.message })
        console.error(error.message)
    }
})

// Middleware functions
async function getPrescriptionByPatientID(req, res, next) {
    try {
        const { id } = req.params
        const prescriptions = await pool.query(
            "SELECT pr.id, name AS patient_name, COALESCE(blood_pressure, '') AS blood_pressure, COALESCE(temperature, '') AS temperature, diagnostic, DATE_FORMAT(pr.created_at, '%Y-%m-%d') AS created_at FROM prescription pr JOIN patient pt ON (pr.patient_id = pt.id) WHERE pt.id = ? ORDER BY pr.id DESC",
            [id]
        )
        if (prescriptions[0].length === 0) return res.status(404).json({ message: 'No prescriptions found', status: 404 })

        res.prescriptions = prescriptions[0]
        next()
    } catch (error) {
        res.status(500).json({ message: error.message, status: 500 })
        console.error(error.message)
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
    }
}

async function getPrescriptionByID(req, res, next) {
    try {
        const { id } = req.params
        const prescription = await pool.query(
            "SELECT blood_pressure, temperature, current_condition, diagnostic, medication, DATE_FORMAT(pr.created_at, '%Y-%m-%d') AS created_at, name, age, gender, height, weight, allergies FROM prescription pr JOIN patient pt ON (pr.patient_id = pt.id) WHERE pr.id = ?",
            [id]
        )
        if (prescription[0].length === 0) return res.status(404).json({ message: 'Prescription not found', status: 404 })

        res.prescription = prescription[0][0]
        next()
    } catch (error) {
        res.status(500).json({ message: error.message, status: 500 })
        console.error(error.message)
    }
}

module.exports = router
