const LiveChessBoard = (function () {
  'use strict'

  const PIECE_UNICODE = {
    'K': '\u2654', 'Q': '\u2655', 'R': '\u2656', 'B': '\u2657', 'N': '\u2658', 'P': '\u2659',
    'k': '\u265A', 'q': '\u265B', 'r': '\u265C', 'b': '\u265D', 'n': '\u265E', 'p': '\u265F'
  }

  const CUSTOM_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/4P3/N1BQK2R w KQkq - 0 1'

  const pieceToCharacter = {
    'N': 'jesse',
    'B': 'shasha',
    'Q': 'veil',
    'K': 'tom',
    'R': 'david',
    'P': 'govt-spy'
  }

  let boardEl, state, selected, legalMoves
  let onMoveCallback = null

  function init(onMove) {
    boardEl = document.getElementById('live-chess-board')
    if (!boardEl || typeof ChessEngine === 'undefined') return null

    onMoveCallback = onMove || null
    state = ChessEngine.initState(CUSTOM_FEN)
    selected = null
    legalMoves = []

    render()
    attachEvents()

    return state
  }

  function scanBoard() {
    const positions = {}
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = state.board[r][c]
        const charId = pieceToCharacter[p]
        if (charId) {
          positions[charId] = { file: c, rank: r, captured: false }
        }
      }
    }
    return positions
  }

  function getCharacterPositions() {
    const positions = {}
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = state.board[r][c]
        const charId = pieceToCharacter[p]
        if (charId) {
          positions[charId] = { file: c, rank: r }
        }
      }
    }
    for (const id of Object.keys(pieceToCharacter)) {
      if (!positions[id]) {
        positions[id] = null
      }
    }
    return positions
  }

  function render() {
    boardEl.innerHTML = ''
    boardEl.className = 'live-chess-board'

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const sq = document.createElement('div')
        const isLight = (r + c) % 2 === 0
        sq.className = 'live-square ' + (isLight ? 'live-square-light' : 'live-square-dark')
        sq.dataset.row = r
        sq.dataset.col = c

        if (selected && selected[0] === r && selected[1] === c) {
          sq.classList.add('live-square-selected')
        }

        for (let i = 0; i < legalMoves.length; i++) {
          if (legalMoves[i].to[0] === r && legalMoves[i].to[1] === c) {
            sq.classList.add('live-legal-move')
            if (state.board[r][c] !== '.') sq.classList.add('live-legal-capture')
          }
        }

        const piece = state.board[r][c]
        if (piece !== '.') {
          const pEl = document.createElement('span')
          pEl.className = 'live-piece ' + (ChessEngine.colorOf(piece) === 'w' ? 'live-piece-white' : 'live-piece-black')
          pEl.textContent = PIECE_UNICODE[piece]
          sq.appendChild(pEl)
        }

        boardEl.appendChild(sq)
      }
    }
  }

  function attachEvents() {
    boardEl.addEventListener('click', function (e) {
      const sq = e.target.closest('.live-square')
      if (!sq) return
      const r = parseInt(sq.dataset.row)
      const c = parseInt(sq.dataset.col)
      handleClick(r, c)
    })
  }

  function handleClick(r, c) {
    const piece = state.board[r][c]

    if (selected) {
      for (let i = 0; i < legalMoves.length; i++) {
        if (legalMoves[i].to[0] === r && legalMoves[i].to[1] === c) {
          makeMove(selected[0], selected[1], r, c)
          return
        }
      }
    }

    if (piece !== '.' && ChessEngine.colorOf(piece) === state.turn) {
      selected = [r, c]
      legalMoves = ChessEngine.getLegalMoves(state, r, c)
      render()
    } else {
      selected = null
      legalMoves = []
      render()
    }
  }

  function makeMove(fromR, fromC, toR, toC) {
    const capturedPiece = state.board[toR][toC]
    const movedPiece = state.board[fromR][fromC]

    const success = ChessEngine.makeMove(state, fromR, fromC, toR, toC)
    selected = null
    legalMoves = []

    if (success) {
      const charId = pieceToCharacter[movedPiece]
      const capturedCharId = capturedPiece !== '.' ? pieceToCharacter[capturedPiece] : null
      const result = {
        state: state,
        fromFile: fromC,
        fromRank: fromR,
        toFile: toC,
        toRank: toR,
        pieceType: movedPiece,
        pieceChar: charId,
        capturedCharId: capturedCharId,
        isBlack: false,
        positions: getCharacterPositions()
      }
      if (onMoveCallback) onMoveCallback(result)
      render()
      setTimeout(aiMove, 400)
    } else {
      render()
    }
  }

  function aiMove() {
    const allMoves = ChessEngine.getAllLegalMoves(state)
    if (allMoves.length === 0) return

    const chosen = ChessEngine.pickBestMove(state, allMoves)
    if (!chosen) return

    const capturedPiece = state.board[chosen.to[0]][chosen.to[1]]
    ChessEngine.makeMove(state, chosen.from[0], chosen.from[1], chosen.to[0], chosen.to[1])

    const capturedCharId = capturedPiece !== '.' ? pieceToCharacter[capturedPiece] : null
    const result = {
      state: state,
      fromFile: chosen.from[1],
      fromRank: chosen.from[0],
      toFile: chosen.to[1],
      toRank: chosen.to[0],
      pieceType: state.board[chosen.to[0]][chosen.to[1]],
      pieceChar: null,
      capturedCharId: capturedCharId,
      isBlack: true,
      positions: getCharacterPositions()
    }
    if (onMoveCallback) onMoveCallback(result)
    render()
  }

  return {
    init: init,
    scanBoard: scanBoard,
    getCharacterPositions: getCharacterPositions
  }
})()
