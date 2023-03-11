document.addEventListener("DOMContentLoaded", async () => {
  document.querySelector("#action-back").addEventListener("click", () => window.open("/", "_self"))
  document.querySelector("#action-discard").addEventListener("click", () => window.history.back())

  const id = new URLSearchParams(window.location.search).get("id")
  const result = await fetch(`/api/stack?id=${id}`)
  if (!result.ok) {
    alert((await result.json()).message)
    window.history.back()
  }

  const stack = await result.json()

  document.querySelector("#title").value = stack.title
  document.querySelector("#content").value = stack.content
  document.querySelector("#modified_at").innerText = stack.modifiedAt
  document.querySelector("#created_at").innerText = stack.createdAt
  document.querySelector("#id").innerText = stack.id

  document.querySelector("#action-save").addEventListener("click", async () => {
    const result = await fetch(`/api/stack?id=${id}`, { method: "PUT", body: JSON.stringify({
      title: document.querySelector("#title").value,
      content: document.querySelector("#content").value,
    }), headers: { "Content-Type": "application/json" } })
    if(!result.ok) {
      alert((await result.json()).message)
    }
    window.open("/", "_self")
  })
})
