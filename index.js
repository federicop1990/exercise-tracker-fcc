const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

// Body parser 
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: "false" }));

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// Avoid using mongoose
const initMem = () => {
  return { users: {} }
}

app.mem = initMem()

// New user POST request
app.post('/api/users', (req, res) => {
  const { username } = req.body

  if (!username) {
    return res.json(err('Name is required'))
  }
  let user = app.mem.users[username]
  if (!user) {
    user = createUser(username)
  }
  app.mem.users[username] = user
  return res.json(user)
})

// GET user excercises
app.get('/api/users', (req, res) => {
  const users = Object.values(app.mem.users);
  return res.json(users)
})

// POST user excercise
app.post('/api/users/:_id/exercises', (req, res) => {
  console.log(req.params)
  const { description } = req.body
  const userId = req.params._id
  const duration = parseInt(req.body.duration)
  const date = req.body.date ? new Date(req.body.date) : new Date()

  const user = Object.values(app.mem.users).filter((user) => user._id === userId)[0]
  if (!user) {
    res.sendStatus(404)
    return res.json(err('User not found'))
  }
  if (!user.log)
    user.log = []

  const excercise = { description, duration, date };
  user.log.push(excercise);
  app.mem.users[user.username] = user

  res.json({
    _id: user._id,
    username: user.username,
    description: excercise.description,
    duration: excercise.duration,
    date: excercise.date.toDateString(),
  })
})

// GET user excercise log
app.get('/api/users/:_id/logs', (req, res) => {
  const userId = req.params._id

  const user = Object.values(app.mem.users).filter((user) => user._id === userId)[0]

  if (!user) {
    res.sendStatus(404)
    return res.json(err('User not found'))
  }

  let { from, to, limit } = req.query
  from = from ? new Date(from) : new Date(0)
  const start = from.getTime()

  to = to ? new Date(to) : new Date()
  const end = to.getTime()

  let log = user.log.filter((excercise) => {
    const timeStart = excercise.date.getTime()
    return timeStart >= start && timeStart <= end
  })
    .sort((a, b) => a.date.getTime() - b.date.getTime())

  limit = parseInt(limit)
  if (limit !== 0 && log.length > limit && !isNaN(limit))
    log = log.slice(0, limit);

  return res.json({
    _id: user._id,
    username: user.username,
    count: user.log.length,
    log,
  })

})

const createUser = (name) => ({ _id: name, username: name })

const err = (msg) => ({ error: msg })

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
