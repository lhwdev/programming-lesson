document.addEventListener("DOMContentLoaded", async () => {
  document.querySelector("#action-back").addEventListener("click", () => window.history.back())
  document.querySelector("#action-edit").addEventListener("click", () => window.open("/edit?id=0", "_self"))

  const id = new URLSearchParams(window.location.search).get("id")
  const result = await fetch(`/api/stack?id=${id}`)
  if(!result.ok) {
    alert((await result.json()).message)
    window.history.back()
  }

  const stack = await result.json()

  document.querySelector("h1").innerText = stack.title
  document.querySelector("#content").innerText = stack.content
  document.querySelector("#modified_at").innerText = stack.modifiedAt
  document.querySelector("#created_at").innerText = stack.createdAt
  document.querySelector("#id").innerText = stack.id
})
