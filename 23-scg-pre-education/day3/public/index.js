function parseHtml(html) { // https://stackoverflow.com/a/47421697/10744716
  const dom = document.createElement("template")
  dom.innerHTML = html
  return dom.content.children[0]
}
const stackArticleTemplate = parseHtml(`
  <article class="content-stack card" role="button" tabindex="0">
    <div style="display: flex; align-items: start; justify-content: space-between;">
      <h2>{title}</h2>
      <span><span class="id">{id}</span>번</span>
    </div>
    <div class="content">{content}</div>
    <div class="sub" style="margin-top: 8px;">
      최근 수정일: <span class="modified_at">{modifiedAt}</span>, 최초 작성일: <span class="created_at">{createdAt}</span>
    </div>
  </article>
`)

const loadMore = parseHtml(`
  <button id="action-load_more" class="text-button-small" style="order: 100;">더보기</button>
`)

function createStackArticle(stack) {
  const article = stackArticleTemplate.cloneNode(true)
  article.querySelector("h2").innerText = stack.title
  article.querySelector(".id").innerText = stack.id
  article.querySelector(".content").innerText = stack.content
  article.querySelector(".modified_at").innerText = stack.modifiedAt
  article.querySelector(".created_at").innerText = stack.createdAt

  article.addEventListener("click", () => {
    window.open(`/article?id=${stack.id}`, "_self")
  })

  return article
}


let startId = 0
const articleCount = 20
let search = null

async function loadStackArticles() {
  const main = document.querySelector("main")
  const result = await fetch(search ? `/api/stacks?startId=${startId}&count=${articleCount}&query=${search}` : `/api/stacks?startId=${startId}&count=${articleCount}`)
  if (result.ok) {
    const { result: stacks, maxId } = await result.json()
    for (const stack of stacks) {
      const node = createStackArticle(stack)
      main.appendChild(node)
    }
    startId = maxId + 1

    if (stacks.length != articleCount) { // == if more article remaining
      loadMore.style.visibility = "hidden"
    }
  } else {
    setTimeout(async () => alert((await result.json()).message))
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  // init
  const main = document.querySelector("main")
  main.appendChild(loadMore)
  loadMore.addEventListener("click", () => {
    loadStackArticles()
  })

  document.querySelector("#action-search").addEventListener("click", () => { document.querySelector("#searcher").hidden = false })
  document.querySelector("#form-search").addEventListener("submit", event => {
    event.preventDefault()

  })
  document.querySelector("#action-cancel_search").addEventListener("click", () => {
    document.querySelector("#searcher").hidden = true
    search = null
  })
  document.querySelector("#action-new").addEventListener("click", () => window.open("/new", "_self"))
  document.querySelector("#action-goto_id").addEventListener("click", () => document.querySelector("#dialog-goto_id").showModal())

  loadStackArticles()
})


// utilities
