const express = require('express')
const app = express()
const port = 3000

app.get('/', (req, res) => res.send('Hello from the Open World!'))

app.listen(port, () => console.log(`Open Business app listening at http://localhost:${port}`))