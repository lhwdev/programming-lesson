const express = require('express')
const fs = require('fs')

const router = express.Router()

const databasePath = "data/review.json"
let database;

function readDatabase() {
  if (!database) {
    database = JSON.parse(fs.readFileSync(databasePath))
  }
  return database
}

function writeDatabase(block) {
  block(database)
  fs.writeFileSync(databasePath, JSON.stringify(database))
}

router.post('/like', function (req, res, _next) {
  let id = req.query.id
  try {
    id = parseInt(id)
  } catch (e) {
    res.status(400).send({ message: '잘못된 후기 id입니다.' })
    return
  }

  reviewIndex = readDatabase().reviews.findIndex(review => review.id == id)
  writeDatabase(out => out.reviews[reviewIndex].likes++)

  res.json(readDatabase().reviews[reviewIndex])
});

// 참고: PUT으로 하고 싶은데 html form은 get, post만 된다고...
router.post('/review', (req, res, _next) => {
  const { author, content } = req.body
  if(!author || !content) {
    res.status(400).send({ message: '제목과 내용을 입력해 주세요.' })
    return
  }

  const previous = readDatabase()
  const id = previous.nextReviewId
  const review = {
    id,
    author,
    content,
    likes: 0
  }

  writeDatabase(out => {
    out.nextReviewId = id + 1
    out.reviews.push(review)
  })
  
  res.redirect("/message/write-success")
})

module.exports = {
  router,
  readDatabase,
  writeDatabase,
};
