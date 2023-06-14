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

// Get one medication by id
router.get('/:id', getMedicationByID, async (req, res) => {
    res.json(res.medication)
})

// Get medication by string
router.get('/search/:string', getMedicationsByString, async (req, res) => {
    res.json(res.medications)
})

router.get('/prescription/:id', getMedicationByPrescriptionByID, async (req, res) => {
    res.json(res.medications)
})

// Create medication
router.post('/', async (req, res) => {
    try {
        const { barcode, active_substance, dose, name, lab, presentation, cost, price, employee_price } = req.body
        const newMedication = await pool.query('INSERT INTO medication (barcode, active_substance, dose, name, lab, presentation, cost, price, employee_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', 
        [
            barcode,
            active_substance, 
            dose, 
            name, 
            lab, 
            presentation, 
            cost, 
            price, 
            employee_price
        ])
        res.status(201).json(newMedication)
    } catch (error) {
        res.status(500).json({ message: error.message })
        console.error(error.message)
        winstonLogger.error(`${error.message} on ${new Date()}`)
    }
})

// Update medication
router.patch('/:id', async (req, res) => {
    const { id } = req.params
    const {
        active_substance,
        dose,
        lab,
        name,
        presentation,
        cost,
        price,
        employeePrice,
        active,
    } = req.body
    try {
        const updatedMedication = await pool.query(
            'UPDATE medication SET active_substance = ?, dose = ?, name = ?, lab = ?, presentation = ?, cost = ?, price = ?, employee_price = ?, active = ? WHERE id = ?',
            [
                active_substance,
                dose,
                lab,
                name,
                presentation,
                cost,
                price,
                employeePrice,
                active,
                id,
            ]
        )
        res.json(updatedMedication)
    } catch (error) {
        res.status(500).json({ message: error.message })
        console.error(error.message)
        winstonLogger.error(`${error.message} on ${new Date()}`)
    }
})


// Validate medication
router.post('/validate', async (req, res) => {
    try {
        const { active_substance, password } = req.body
        const medication = await pool.query("SELECT id, active_substance, active_substance FROM medication WHERE active_substance = ? AND password = CONCAT('*', UPPER(SHA1(UNHEX(SHA1(?)))))", [active_substance, password])
        if (medication[0].length == 0) {
            res.status(404).json(medication[0])
            return
        }

        res.json(medication[0][0])
    } catch (error) {
        res.status(500).json({ message: error.message, status: 500 })
        console.error(error.message)
        winstonLogger.error(`${error.message} on ${new Date()}`)
    }
})

// Middleware functions
async function getMedicationByID(req, res, next) {
    try {
        const { id } = req.params
        const medication = await pool.query('SELECT * FROM medication WHERE id = ?', [id])
        if (medication[0].length === 0) return res.status(404).json({ message: 'Medication not found', status: 404 })

        res.medication = medication[0][0]
        next()
    } catch (error) {
        res.status(500).json({ message: error.message, status: 500 })
        console.error(error.message)
        winstonLogger.error(`${error.message} on ${new Date()}`)
    }
}

async function getMedicationsByString(req, res, next) {
    try {
        const { string } = req.params
        const medications = await pool.query(`SELECT * FROM medication WHERE barcode LIKE '%${string}%' OR active_substance LIKE '%${string}%' OR name LIKE '%${string}%' OR presentation LIKE '%${string}%' ORDER BY name`)
        if (medications[0].length === 0) return res.status(404).json({ message: 'No medications found', status: 404 })

        res.medications = medications[0]
        next()
    } catch (error) {
        res.status(500).json({ message: error.message, status: 500 })
        console.error(error.message)
        winstonLogger.error(`${error.message} on ${new Date()}`)
    }
}

async function getMedicationByPrescriptionByID(req, res, next) {
    try {
        const { id } = req.params
        const medication = await pool.query(
            `SELECT active_substance, dose, presentation, name
                FROM prescription pr 
                JOIN prescription_medication pm ON (pm.prescription_id = pr.id)
                JOIN medication med ON (med.id = pm.medication_id)
                WHERE pr.id = ?`,
            [id]
        )
        if (medication[0].length === 0) return res.status(404).json({ message: 'No medications found', status: 404 })

        res.medications = medication[0]
        next()
    } catch (error) {
        res.status(500).json({ message: error.message, status: 500 })
        console.error(error.message)
        winstonLogger.error(`${error.message} on ${new Date()}`)
    }
}

module.exports = router