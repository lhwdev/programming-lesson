const express = require('express')
const { readDatabase } = require('./api.js')
const router = express.Router()


function getContext(extra) {
  return {
    db: readDatabase(),
    ...extra
  }
}

router.get('/', (req, res, _next) => {
  res.render('index', getContext({ title: '성균관대학교 학우들의 이야기' }))
})

router.get('/write', (req, res, _next) => {
  res.render('write', getContext({ title: '학교 후기 작성하기' }))
})

router.get('/message/:kind', (req, res, _next) => {
  const messages = {
    'like-success': {
      title: '좋아요 성공',
      content: '페이지 좋아요에 성공했습니다.'
    },
    'like-failed': {
      title: '좋아요 실패',
      content: '페이지 좋아요에 실패했습니다. %%'
    },
    'write-success': {
      title: '글쓰기 성공',
      content: '성공적으로 후기를 등록했습니다.'
    },
    'write-failed': {
      title: '글쓰기 실패',
      content: '후기 작성에 실패했습니다. %%'
    }
  }
  const defined = messages[req.params.kind]
  if(!defined) {
    res.status(400).send({ message: `잘못된 메시지 종류(${req.params.kind})입니다.` })
  }
  let message = {
    ...defined,
    content: defined.content.replace('%%', req.query.message),
  }
  res.render('message', getContext({ title: message.title, message }))
})

module.exports = router
