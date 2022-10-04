require('dotenv').config()

const express = require('express')
const app = express()
const cors = require('cors')
const userRouter = require('./routes/user')
const patientRouter = require('./routes/patient')
const prescriptionRouter = require('./routes/prescription')

app.use(cors())
app.use(express.json())
app.use('/user', userRouter)
app.use('/patient', patientRouter)
app.use('/prescription', prescriptionRouter)

app.listen(process.env.PORT || 3000, () => {
    console.log(`Server running on port ${process.env.PORT}...`)
})
