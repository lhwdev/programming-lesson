const express = require("express")
const path = require("path")

const app = express()
const port = 5000

app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use("/", express.static(path.resolve("public"), { extensions: ["html"] }))
app.use("/api/", require("./api.js"))

app.listen(port, () => {
  app
})
