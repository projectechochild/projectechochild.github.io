var ChessBoard = (function () {
  'use strict';

  var PIECE_UNICODE = {
    'K': '\u2654', 'Q': '\u2655', 'R': '\u2656', 'B': '\u2657', 'N': '\u2658', 'P': '\u2659',
    'k': '\u265A', 'q': '\u265B', 'r': '\u265C', 'b': '\u265D', 'n': '\u265E', 'p': '\u265F'
  };

  var boardEl, state, selected, legalMoves, firstMoveDone;
  var pointerDown, downRow, downCol, dragEl, hasMoved;

  function init() {
    boardEl = document.getElementById('chess-gate-board');
    if (!boardEl) return;

    state = ChessEngine.initState();
    selected = null;
    legalMoves = [];
    firstMoveDone = false;
    pointerDown = false;
    dragEl = null;
    hasMoved = false;

    ChessEngine.setFirstMoveCallback(function () {
      firstMoveDone = true;
      ChessGate.unlock();
    });

    render();
    attachEvents();
  }

  function render() {
    boardEl.innerHTML = '';
    boardEl.className = 'chess-board';

    for (var r = 0; r < 8; r++) {
      for (var c = 0; c < 8; c++) {
        var sq = document.createElement('div');
        var isLight = (r + c) % 2 === 0;
        sq.className = 'chess-square ' + (isLight ? 'chess-square-light' : 'chess-square-dark');
        sq.dataset.row = r;
        sq.dataset.col = c;

        if (selected && selected[0] === r && selected[1] === c) {
          sq.classList.add('chess-square-selected');
        }

        for (var m = 0; m < legalMoves.length; m++) {
          if (legalMoves[m].to[0] === r && legalMoves[m].to[1] === c) {
            sq.classList.add('chess-legal-move');
            if (state.board[r][c] !== '.') sq.classList.add('chess-legal-capture');
          }
        }

        var piece = state.board[r][c];
        if (piece !== '.') {
          var pEl = document.createElement('span');
          pEl.className = 'chess-piece ' + (ChessEngine.colorOf(piece) === 'w' ? 'chess-piece-white' : 'chess-piece-black');
          pEl.textContent = PIECE_UNICODE[piece];
          pEl.dataset.row = r;
          pEl.dataset.col = c;
          sq.appendChild(pEl);
        }

        boardEl.appendChild(sq);
      }
    }
  }

  function attachEvents() {
    boardEl.addEventListener('mousedown', onPointerDown);
    boardEl.addEventListener('touchstart', onTouchStart, { passive: false });
    document.addEventListener('mousemove', onPointerMove);
    document.addEventListener('mouseup', onPointerUp);
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd);
  }

  function getSquare(el) {
    if (!el) return null;
    if (el.classList && el.classList.contains('chess-square')) return el;
    if (el.parentElement && el.parentElement.classList && el.parentElement.classList.contains('chess-square')) return el.parentElement;
    return null;
  }

  function onPointerDown(e) {
    if (firstMoveDone) return;
    var sq = getSquare(e.target);
    if (!sq) return;
    e.preventDefault();
    pointerDown = true;
    hasMoved = false;
    downRow = parseInt(sq.dataset.row);
    downCol = parseInt(sq.dataset.col);
    handleTap(downRow, downCol, e);
  }

  function onTouchStart(e) {
    if (firstMoveDone) return;
    var sq = getSquare(e.target);
    if (!sq) return;
    e.preventDefault();
    pointerDown = true;
    hasMoved = false;
    downRow = parseInt(sq.dataset.row);
    downCol = parseInt(sq.dataset.col);
    handleTap(downRow, downCol, e.touches[0]);
  }

  function handleTap(r, c, posEvent) {
    var piece = state.board[r][c];

    // If already have a selection and tapping a legal destination, move
    if (selected) {
      for (var i = 0; i < legalMoves.length; i++) {
        if (legalMoves[i].to[0] === r && legalMoves[i].to[1] === c) {
          tryMove(selected[0], selected[1], r, c);
          return;
        }
      }
    }

    // If tapping own piece, select it
    if (piece !== '.' && ChessEngine.colorOf(piece) === state.turn) {
      selected = [r, c];
      legalMoves = ChessEngine.getLegalMoves(state, r, c);

      // Create drag element
      dragEl = document.createElement('span');
      dragEl.className = 'chess-piece ' + (ChessEngine.colorOf(piece) === 'w' ? 'chess-piece-white' : 'chess-piece-black') + ' chess-piece-drag';
      dragEl.textContent = PIECE_UNICODE[piece];
      dragEl.style.position = 'fixed';
      dragEl.style.pointerEvents = 'none';
      dragEl.style.zIndex = '999999';
      dragEl.style.display = 'none';
      document.body.appendChild(dragEl);

      moveDragElement(posEvent);
      render();
    } else {
      selected = null;
      legalMoves = [];
      render();
    }
  }

  function onPointerMove(e) {
    if (!pointerDown) return;
    checkDragStart(e.clientX, e.clientY);
    moveDragElement(e);
  }

  function onTouchMove(e) {
    if (!pointerDown) return;
    e.preventDefault();
    var touch = e.touches[0];
    checkDragStart(touch.clientX, touch.clientY);
    moveDragElement(touch);
  }

  function checkDragStart(cx, cy) {
    if (hasMoved) return;
    // We don't track start position, but if dragEl exists and pointer is down,
    // show it after a tiny movement
    if (dragEl && dragEl.style.display === 'none') {
      hasMoved = true;
      dragEl.style.display = 'block';
    }
  }

  function moveDragElement(posEvent) {
    if (!dragEl) return;
    dragEl.style.left = (posEvent.clientX - 20) + 'px';
    dragEl.style.top = (posEvent.clientY - 20) + 'px';
    if (dragEl.style.display === 'none' && pointerDown) {
      // Show drag element immediately on touch (no hover state)
      dragEl.style.display = 'block';
    }
  }

  function onPointerUp(e) {
    if (!pointerDown) return;
    pointerDown = false;
    finishInteraction(e.clientX, e.clientY);
  }

  function onTouchEnd(e) {
    if (!pointerDown) return;
    pointerDown = false;
    var touch = e.changedTouches[0];
    finishInteraction(touch.clientX, touch.clientY);
  }

  function finishInteraction(clientX, clientY) {
    if (dragEl) {
      // Clean up drag element
      if (dragEl.parentNode) dragEl.parentNode.removeChild(dragEl);
      dragEl = null;
    }

    if (hasMoved) {
      // Was a drag — find drop target
      var targetEl = document.elementFromPoint(clientX, clientY);
      var sq = getSquare(targetEl);
      if (sq && selected) {
        var tr = parseInt(sq.dataset.row);
        var tc = parseInt(sq.dataset.col);
        tryMove(selected[0], selected[1], tr, tc);
      }
    }
    // If not a drag, the tap was already handled in handleTap
  }

  function tryMove(fromR, fromC, toR, toC) {
    if (firstMoveDone) return;
    var success = ChessEngine.makeMove(state, fromR, fromC, toR, toC);
    selected = null;
    legalMoves = [];

    if (success) {
      ChessEngine.checkFirstMove();
      if (!firstMoveDone) {
        render();
        setTimeout(aiMove, 400);
      }
    } else {
      boardEl.classList.add('chess-board-invalid');
      setTimeout(function () { boardEl.classList.remove('chess-board-invalid'); }, 300);
      render();
    }
  }

  function aiMove() {
    if (firstMoveDone) return;
    var allMoves = [];
    for (var r = 0; r < 8; r++) {
      for (var c = 0; c < 8; c++) {
        var p = state.board[r][c];
        if (p !== '.' && ChessEngine.colorOf(p) === state.turn) {
          var moves = ChessEngine.getLegalMoves(state, r, c);
          for (var i = 0; i < moves.length; i++) allMoves.push(moves[i]);
        }
      }
    }
    if (allMoves.length === 0) return;

    var captures = allMoves.filter(function (m) { return state.board[m.to[0]][m.to[1]] !== '.'; });
    var pool = captures.length > 0 ? captures : allMoves;
    var chosen = pool[Math.floor(Math.random() * pool.length)];

    ChessEngine.makeMove(state, chosen.from[0], chosen.from[1], chosen.to[0], chosen.to[1]);
    ChessEngine.checkFirstMove();
    if (!firstMoveDone) render();
  }

  return {
    init: init
  };
})();

var ChessGate = (function () {
  'use strict';

  var STORAGE_KEY = 'echo_chess_unlocked';
  var overlay;

  function hasPlayed() {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  }

  function unlock() {
    localStorage.setItem(STORAGE_KEY, 'true');
    console.log('[ChessGate] First move made — Echo Child unlocked');

    overlay = document.getElementById('chess-gate-overlay');
    if (overlay) {
      overlay.classList.add('chess-gate-unlocked');
      setTimeout(function () {
        overlay.style.display = 'none';
      }, 200);
    }
  }

  function reset() {
    localStorage.removeItem(STORAGE_KEY);
    console.log('[ChessGate] Reset — chess gate will appear on next visit');
  }

  function init() {
    overlay = document.getElementById('chess-gate-overlay');
    if (!overlay) return;

    if (hasPlayed()) {
      overlay.remove();
      return;
    }

    overlay.style.display = 'flex';
    ChessBoard.init();

    var skipBtn = document.getElementById('chess-skip-btn');
    if (skipBtn) {
      skipBtn.addEventListener('click', function () {
        unlock();
      });
    }

    window.ChessGate = { reset: reset, unlock: unlock };
    console.log('[ChessGate] Active — make a move or type ChessGate.reset() to retry later');
  }

  return { init: init, reset: reset, unlock: unlock };
})();
