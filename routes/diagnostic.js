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

// Get one diagnostic by id
router.get('/:id', getDiagnosticByID, async (req, res) => {
    res.json(res.diagnostic)
})

// Get diagnostic by string
router.get('/search/:string', getDiagnosticsByString, async (req, res) => {
    res.json(res.diagnostics)
})

router.get('/prescription/:id', getDiagnosticsByPrescriptionByID, async (req, res) => {
    res.json(res.diagnostics)
})

// Create diagnostic
router.post('/', async (req, res) => {
    try {
        const { barcode, active_substance, dose, name, lab, presentation, cost, price, employee_price } = req.body
        const newDiagnostic = await pool.query('INSERT INTO diagnostic (barcode, active_substance, dose, name, lab, presentation, cost, price, employee_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', 
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
        res.status(201).json(newDiagnostic)
    } catch (error) {
        res.status(500).json({ message: error.message })
        console.error(error.message)
        winstonLogger.error(`${error.message} on ${new Date()}`)
    }
})

// Update diagnostic
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
        const updatedDiagnostic = await pool.query(
            'UPDATE diagnostic SET active_substance = ?, dose = ?, name = ?, lab = ?, presentation = ?, cost = ?, price = ?, employee_price = ?, active = ? WHERE id = ?',
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
        res.json(updatedDiagnostic)
    } catch (error) {
        res.status(500).json({ message: error.message })
        console.error(error.message)
        winstonLogger.error(`${error.message} on ${new Date()}`)
    }
})


// Validate diagnostic
router.post('/validate', async (req, res) => {
    try {
        const { active_substance, password } = req.body
        const diagnostic = await pool.query("SELECT id, active_substance, active_substance FROM diagnostic WHERE active_substance = ? AND password = CONCAT('*', UPPER(SHA1(UNHEX(SHA1(?)))))", [active_substance, password])
        if (diagnostic[0].length == 0) {
            res.status(404).json(diagnostic[0])
            return
        }

        res.json(diagnostic[0][0])
    } catch (error) {
        res.status(500).json({ message: error.message, status: 500 })
        console.error(error.message)
        winstonLogger.error(`${error.message} on ${new Date()}`)
    }
})

// Middleware functions
async function getDiagnosticByID(req, res, next) {
    try {
        const { id } = req.params
        const diagnostic = await pool.query('SELECT * FROM diagnostic WHERE id = ?', [id])
        if (diagnostic[0].length === 0) return res.status(404).json({ message: 'Diagnostic not found', status: 404 })

        res.diagnostic = diagnostic[0][0]
        next()
    } catch (error) {
        res.status(500).json({ message: error.message, status: 500 })
        console.error(error.message)
        winstonLogger.error(`${error.message} on ${new Date()}`)
    }
}

async function getDiagnosticsByString(req, res, next) {
    try {
        const { string } = req.params
        const diagnostics = await pool.query(`SELECT * FROM diagnostic WHERE name LIKE '%${string}%' ORDER BY name`)
        if (diagnostics[0].length === 0) return res.status(404).json({ message: 'No diagnostics found', status: 404 })

        res.diagnostics = diagnostics[0]
        next()
    } catch (error) {
        res.status(500).json({ message: error.message, status: 500 })
        console.error(error.message)
        winstonLogger.error(`${error.message} on ${new Date()}`)
    }
}

async function getDiagnosticsByPrescriptionByID(req, res, next) {
    try {
        const { id } = req.params
        const diagnostic = await pool.query(
            `SELECT name
                FROM prescription pr 
                JOIN prescription_diagnostic pm ON (pm.prescription_id = pr.id)
                JOIN diagnostic diag ON (diag.id = pm.diagnostic_id)
                WHERE pr.id = ?`,
            [id]
        )
        if (diagnostic[0].length === 0) return res.status(404).json({ message: 'No diagnostics found', status: 404 })

        res.diagnostics = diagnostic[0]
        next()
    } catch (error) {
        res.status(500).json({ message: error.message, status: 500 })
        console.error(error.message)
        winstonLogger.error(`${error.message} on ${new Date()}`)
    }
}

module.exports = router