// apis for /api/

const { Router } = require("express")
const { getStacks, validateStack } = require("./database.js")
const { staticResource } = require("./resource.js")
const router = Router()

function formatNow() {
  function toString(v) {
    if(v < 10) return `0${v}`
    else return `${v}`
  }
  const date = new Date()
  return `${date.getFullYear()}-${toString(date.getMonth() + 1)}-${toString(date.getDate())}`
}

function errorOf(name, value, skip = false) {
  if (skip || validateStack[name](value)) {
    return null
  } else {
    return name
  }
}

router.get("/stack", async (request, response, _next) => {
  let id
  try {
    id = parseInt(request.query.id)
  } catch (e) {
    response.status(400)
    response.send({
      id: "common/malformed_parameter",
      cause: "query/id",
      message: "잘못된 게시글 아이디 형식입니다."
    })
    return
  }
  const stack = getStacks().stacks.find(stack => stack.id == id)
  if (!stack) {
    response.status(404)
    response.send({
      id: ["stack/stack_not_found", "common/entity_not_found"],
      cause: ["query/id", "database/stack"],
      message: "게시글을 찾을 수 없습니다."
    })
    return
  }

  response.send(stack)
})


router.get("/stacks", async (request, response, _next) => {
  const query = request.query.query
  if (!query) {
    let { startId, count } = request.query
    startId ??= 0
    count ??= 20
    if (count > 100) {
      response.status(400)
      response.send({
        id: "common/illegal_parameter",
        cause: "query/count",
        message: "너무 많은 게시글을 조회하려 합니다."
      })
      return
    }

    // 1. skip to 'startId'
    let index = 0
    const stacks = getStacks().stacks
    while (index < stacks.length && stacks[index].id < startId) index++

    if(request.query.query) {
      const query = request.query.query
      if(typeof query != "string") return [] // 귀찮아 + 시간없어 제출까지 1시간도 안남음 으악; 디자인이랑 쓸데없는 디테일에 너무 신경썼나
      // 2. search
      const result = []
      while(index < stacks.length && result.length < count) {
        const stack = stacks[index]
        if(stack.title.includes(query) || stack.content.includes(query)) {
          result.push(stack)
        }
        index++
      }
      response.send({
        result,
        maxId: index >= stacks.length ? stacks[stacks.length - 1].id : stacks.length > 0 ? stacks[index].id : 0
      })
    } else {
      // 2. pick 'count' stacks
      const result = stacks.slice(index, index + count)
      response.send({
        result,
        maxId: result.length > 0 ? result[result.length - 1].id : index < stacks.length? stacks[index].id : 0
      }) // .slice does not error even if start >= length
    }
  }
})


function createStack(request, response) {
  const body = request.body
  if (typeof body != "object") {
    response.status(400)
    response.send({
      id: "common/malformed_body",
      cause: "body",
      "message": "잘못된 게시글 형식입니다."
    })
    return
  }
  const error = errorOf("title", body.title) ??
    errorOf("content", body.content)
  if (error) {
    response.status(400)
    response.send({
      id: "common/malformed_body",
      cause: `body/${error}`,
      message: "잘못된 게시글 형식입니다."
    })
    return
  }

  const database = getStacks()
  const id = ++database.lastId
  const now = formatNow()
  const newData = {
    id,
    title: body.title,
    content: body.content,
    createdAt: now,
    modifiedAt: now,
  }
  database.stacks.push(newData)

  response.send(newData)
}


function editStack(request, response) {
  let id
  try {
    id = parseInt(request.query.id)
  } catch (e) {
    response.status(400)
    response.send({
      id: "common/malformed_parameter",
      cause: "query/id",
      message: "잘못된 게시글 아이디 형식입니다."
    })
    return
  }

  const body = request.body
  if (typeof body != "object") {
    response.status(400)
    response.send({
      id: "common/malformed_body",
      cause: "body",
      "message": "잘못된 게시글 형식입니다."
    })
    return
  }

  const error = errorOf("title", body.title, !body.title) ??
    errorOf("content", body.content, !body.content)
  if (error) {
    response.status(400)
    response.send({
      id: "common/malformed_body",
      cause: `body/${error}`,
      message: "잘못된 게시글 형식입니다."
    })
    return
  }

  const database = getStacks().stacks
  const previousIndex = database.findIndex(stack => stack.id == id)
  if (previousIndex == -1) {
    response.status(404)
    response.send({
      id: "common/stack_not_found",
      cause: `query/id`,
      message: "게시글을 찾을 수 없습니다."
    })
    return
  }
  const previous = database[previousIndex]
  const newData = {
    ...previous,
    title: body.title ?? previous.title,
    content: body.content ?? previous.content,
    modifiedAt: formatNow(),
  }
  database[previousIndex] = newData

  response.send(newData)
}

router.put("/stack", async (request, response, _next) => {
  if ("id" in request.query) {
    editStack(request, response)
  } else {
    createStack(request, response)
  }
})

module.exports = router
