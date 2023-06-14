const express = require('express')
const app = express()

const cors = require('cors')
const winston = require('winston')

const userRouter = require('./routes/user')
const patientRouter = require('./routes/patient')
const prescriptionRouter = require('./routes/prescription')
const medicationRouter = require('./routes/medication')
const diagnosticRouter = require('./routes/diagnostic')


const logConfiguration = {
    'transports': [
        new winston.transports.File({
            filename: 'logs/app.log'
        })
    ]
}

const winstonLogger = winston.createLogger(logConfiguration)

if (process.env.ENV !== 'prod') {
    require('dotenv').config()

    // Log a message
    winstonLogger.log({
        // Message to be logged
        message: `Process started at ${new Date()}!`,
        // Level of the message logging
        level: 'info'
    })
}

app.use(cors())
app.use(express.json())

app.use('/user', userRouter)
app.use('/patient', patientRouter)
app.use('/prescription', prescriptionRouter)
app.use('/medication', medicationRouter)
app.use('/diagnostic', diagnosticRouter)


app.listen(process.env.PORT || 3001, () => console.log(`Server running on port ${process.env.PORT}`))

// Error handler
app.use(function (err, req, res, next) {
    // Set locals, only providing error in development
    res.locals.message = err.message
    res.locals.error = req.app.get('env') === 'development' ? err : {}
    winstonLogger.error(err.message)

    // Render the error page
    res.status(err.status || 500)
    res.render('error')
})
