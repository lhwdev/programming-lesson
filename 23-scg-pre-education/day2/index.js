/*
 * 새롭게 추가한 기능:
 * - 카드의 개수(3x3, 4x4, 5x5 등)를 결정할 수 있는 기능 (+ 카드가 홀수개일 때 처리)
 * - 난이도 조절 가능: 카드 보여주는 시간 조절
 * - 엄청난 UI
 * - 카드를 한개 열은 후 다른 카드르 열 때까지 시간제한: 심하면 컨트롤 게임이 되어버림... 오히려 좋을수도?
 * 
 * 하다보니 재미있어서 급발진했습니다......
 */

const CARD_COLORS = [ // used Material color palette to avoid collision: https://m2.material.io/design/color/the-color-system.html#tools-for-picking-colors
  "#EF9A9A", // Red 200
  "#F44336", // Red 500
  "#F48FB1", // Pink 200
  "#E91E63", // Pink 500
  "#CE93D8", // ...
  "#9C27B0",
  "#B39DDB",
  "#673AB7",
  "#9FA8DA",
  "#3F51B5",
  "#90CAF9",
  "#2196F3",
  "#81D4FA",
  "#03A9F4",
  "#80DEEA",
  "#00BCD4",
  "#80CBC4",
  "#009688",
  "#A5D6A7",
  "#4CAF50",
  "#C5E1A5",
  "#8BC34A",
  "#E6EE9C",
  "#CDDC39",
  "#FFF59D",
  "#FFEB3B",
  "#FFAB91",
  "#FF5722"
]

let speedFactor = 1 // less = faster, 0 = i(maybe) mpossible
let gameDuration = 60
let boardSize = [4, 4]
let continueGame

function randomInt(maxExclusive) { // random int in [0, maxExclusive)
  return Math.floor(Math.random() * maxExclusive)
}

function globalIndexForCard(column, row, height) {
  return row + column * height
}

function columnRowForCard(globalIndex, height) {
  return [Math.floor(globalIndex / height), globalIndex % height]
}

// Shuffle code from https://stackoverflow.com/a/2450976/10744716
// I could have written such a code like this
function shuffle(array, increment = 1, offset = 0) {
  let currentIndex = array.length - offset, randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex > 0) {

    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= increment;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
}

function createCards(width, height) {
  // 1. pickup colors
  shuffle(CARD_COLORS, 2)
  const colorsCount = Math.floor(width * height / 2)
  const colors = CARD_COLORS.slice(0, colorsCount)

  // 2. randomly assign cards (not uniformly distributed, maybe some pattern exists but I think this is enough)
  const cards = [] // colorIndex set

  for (let columnIndex = 0; columnIndex < height; columnIndex++) {
    for (let rowIndex = 0; rowIndex < width; rowIndex++) {
      const globalIndex = globalIndexForCard(columnIndex, rowIndex, height)
      const colorIndex = globalIndex % colorsCount
      if (globalIndex == colorsCount * 2) { // this is spare card
        cards.push(null)
      } else {
        cards.push(colorIndex)
      }
    }
  }

  shuffle(cards)
  const columns = []
  for (let columnIndex = 0; columnIndex < height; columnIndex++) {
    const rows = []
    for (let rowIndex = 0; rowIndex < width; rowIndex++) {
      const index = globalIndexForCard(columnIndex, rowIndex, height)
      rows.push(cards[index])
    }
    columns.push(rows)
  }
  return [colors, columns]
}

// 카드 노드를 만드는 곳에 게임 상태를 같이 저장하는 자체가 마음에 안들지만 일단 넘어갈게요... 총총...
function createCardsNode(colors, columns) {
  let timer = 0
  let gameState = "preview" // just state machine, preview -> play -> win/lose
  let revealActionIndex = 9
  const revealingCards = []
  const revealedColors = []

  const game = document.createElement("div")

  const progress = document.createElement("progress")
  progress.className = "game-progress"
  game.appendChild(progress)

  const table = document.createElement("table")
  game.appendChild(table)
  const allCards = []
  table.className = "card-table"
  table.style.setProperty("--card-flip-duration", `${300 * speedFactor}ms`)

  for (const [columnIndex, column] of columns.entries()) {
    const columnNode = document.createElement("tr")
    columnNode.className = "card-column"
    for (const [rowIndex, row] of column.entries()) {
      const card = document.createElement("td")
      card.className = "card"

      const cardFlip = document.createElement("div") // see https://www.w3schools.com/howto/howto_css_flip_card.asp
      cardFlip.className = "card-flip"
      card.appendChild(cardFlip)

      const frontColor = document.createElement("div")
      frontColor.className = "card-front"
      cardFlip.appendChild(frontColor)
      const backHidden = document.createElement("div")
      backHidden.className = "card-hidden"
      cardFlip.appendChild(backHidden)

      card.dataset.index = `${globalIndexForCard(columnIndex, rowIndex, columns.length)}`
      if (row == null) { // row itself is color index
        frontColor.innerText = "x"
        backHidden.innerText = "x"
        card.classList.add("card-spare")
        card.dataset.color_index = "null"
      } else {
        frontColor.style.backgroundColor = colors[row]
        card.dataset.color_index = `${row}`
      }
      cardFlip.classList.add("card-state-flipped")


      const eventListener = () => {
        if (gameState != "play") return
        if (row == null) return // spare card
        if (revealingCards.length >= 2 || revealingCards.includes(card)) return
        revealCard(card, true)
        revealingCards.push(card)
        if (revealingCards.length >= 2) {
          if (revealingCards[0].dataset.color_index == revealingCards[1].dataset.color_index) {
            // boom, you're right
            revealedColors.push(revealingCards[0].dataset.color_index)
            revealingCards.forEach(makePermanent)
            revealingCards.length = 0
            revealActionIndex++
            card.removeEventListener("click", eventListener)
            if (revealedColors.length >= colors.length) {
              // complete, you won
              gameState = "win"
              document.querySelector("#record").innerText = `기록: ${timer}초, 속도: ${speedFactor/* 이게 맞나(귀찮아) */}`
              document.querySelector("#success_dialog").show()
            }
          } else setTimeout(() => { // wrong, hide card
            revealingCards.forEach(hideCard)
            revealingCards.length = 0 // ~~이개외되?~~
            revealActionIndex++
          }, 500 * speedFactor)
        } else {
          // '카드를 한개 열은 후 다른 카드르 열 때까지 시간제한' (난이도 순한맛부터)
          if (speedFactor <= 1) {
            const actionIndex = revealActionIndex
            setTimeout(() => {
              if (actionIndex != revealActionIndex) return // clicked other card
              revealingCards.forEach(hideCard)
              revealingCards.length = 0
              revealActionIndex++
            }, 1500 * speedFactor)
          }

        }

      } // end eventListener lambdda
      card.addEventListener("click", eventListener)
      columnNode.appendChild(card)
      allCards.push(card)
    }
    table.appendChild(columnNode)
  }

  const timeoutToPlay = 3000 * speedFactor

  setTimeout(() => {
    gameState = "play"
    allCards.forEach(card => hideCard(card))
    if (gameDuration != -1) {
      progress.max = gameDuration
      progress.value = gameDuration

      let intervalId
      intervalId = setInterval(() => {
        timer++
        progress.value = gameDuration - timer
        if (gameState != "play") clearInterval(intervalId)
        if (timer >= gameDuration) {
          clearInterval(intervalId)
          document.querySelector("#fail_dialog").show()
        }
      }, 1000)
    } else {
      progress.max = 1
      progress.value = 1
    }
  }, timeoutToPlay)

  progress.max = timeoutToPlay
  const startTime = Date.now()
  const update = () => {
    const past = Date.now() - startTime
    if (past >= timeoutToPlay) {
      return
    }
    progress.value = timeoutToPlay - past
    requestAnimationFrame(update)
  }
  requestAnimationFrame(update)

  continueGame = () => {
    gameState = "play"
    progress.max = 1
    progress.min = 0
    gameDuration = -1
    document.querySelector("#fail_dialog").close()
  }

  return game
}

function revealCard(card, temporary) {
  card.children[0].classList.add("card-state-flipped")
  if (temporary) card.children[0].classList.add("card-state-flipped-temporary")
}

function makePermanent(card) {
  card.children[0].classList.remove("card-state-flipped-temporary")
}

function hideCard(card) {
  card.children[0].classList.remove("card-state-flipped")
  card.children[0].classList.remove("card-state-flipped-temporary")
}

function resetDialogs() {
  document.querySelector("#home_dialog").close()
  document.querySelector("#success_dialog").close()
  document.querySelector("#fail_dialog").close()
}

function startGame() {
  const [colors, colorIndexes] = createCards(boardSize[0], boardSize[1])
  document.querySelector("#game_container").replaceChildren(/* empty vararg */)
  const cardsNode = createCardsNode(colors, colorIndexes)
  resetDialogs()
  document.querySelector("#game_container").appendChild(cardsNode)
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".button_start").forEach(button => button.addEventListener("click", () => startGame()))
  document.querySelectorAll(".button_home").forEach(button => button.addEventListener("click", () => {
    resetDialogs()
    document.querySelector("#home_dialog").show()
  }))
  document.querySelectorAll(".button_continue").forEach(button => button.addEventListener("click", () => {
    continueGame()
  }))

  const time_limit_buttons = document.querySelectorAll(".time_limit")
  time_limit_buttons.forEach(button => button.addEventListener("click", () => {
    gameDuration = parseInt(button.dataset.duration)
    time_limit_buttons.forEach(b => b.classList.remove("selected"))
    button.classList.add("selected")
  }))

  const speed_buttons = document.querySelectorAll(".speed")
  speed_buttons.forEach(button => button.addEventListener("click", () => {
    speedFactor = parseFloat(button.dataset.speed)
    speed_buttons.forEach(b => b.classList.remove("selected"))
    button.classList.add("selected")
  }))

  const size_buttons = document.querySelectorAll(".size")
  size_buttons.forEach(button => button.addEventListener("click", () => {
    const size = parseFloat(button.dataset.size)
    boardSize = [size, size]
    size_buttons.forEach(b => b.classList.remove("selected"))
    button.classList.add("selected")
  }))

  document.querySelector("#home_dialog").show()
}, { once: true })
