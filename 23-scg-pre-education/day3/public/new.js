document.addEventListener("DOMContentLoaded", async () => {
  document.querySelector("#action-back").addEventListener("click", () => window.open("/", "_self"))
  document.querySelector("#action-discard").addEventListener("click", () => window.history.back())

  document.querySelector("#action-save").addEventListener("click", async () => {
    const result = await fetch(`/api/stack`, {
      method: "PUT", body: JSON.stringify({
        title: document.querySelector("#title").value,
        content: document.querySelector("#content").value,
      }), headers: { "Content-Type": "application/json" }
    })
    if (!result.ok) {
      alert((await result.json()).message)
      return
    }
    const stack = await result.json()
    window.open(`/article?id=${stack.id}`, "_self")
  })
})
