const ChessEngine = (function () {
  'use strict';

  const PIECE = {
    K: 'K', Q: 'Q', R: 'R', B: 'B', N: 'N', P: 'P',
    k: 'k', q: 'q', r: 'r', b: 'b', n: 'n', p: 'p'
  };

  const PIECE_VALUE = {
    P: 1, N: 3, B: 3, R: 5, Q: 9, K: 100,
    p: 1, n: 3, b: 3, r: 5, q: 9, k: 100
  };

  const EMPTY = '.';

  function isWhite(p) { return p >= 'A' && p <= 'Z'; }
  function isBlack(p) { return p >= 'a' && p <= 'z'; }
  function isPiece(p) { return p !== EMPTY; }
  function colorOf(p) { return isWhite(p) ? 'w' : isBlack(p) ? 'b' : null; }
  function opponent(c) { return c === 'w' ? 'b' : 'w'; }

  function parseFEN(fen) {
    const rows = fen.split(' ')[0].split('/');
    const board = [];
    for (let r = 0; r < 8; r++) {
      board[r] = [];
      let col = 0;
      for (let i = 0; i < rows[r].length; i++) {
        const ch = rows[r][i];
        if (ch >= '1' && ch <= '8') {
          for (let j = 0; j < parseInt(ch); j++) board[r][col++] = EMPTY;
        } else {
          board[r][col++] = ch;
        }
      }
    }
    return board;
  }

  function fenToBoard(fen) {
    const parts = fen.split(' ');
    return {
      board: parseFEN(fen),
      turn: parts[1] || 'w',
      castling: parts[2] || 'KQkq',
      enPassant: parts[3] || '-',
      halfMoves: parseInt(parts[4]) || 0,
      fullMoves: parseInt(parts[5]) || 1
    };
  }

  function boardToFEN(state) {
    let fen = '';
    for (let r = 0; r < 8; r++) {
      let empty = 0;
      for (let c = 0; c < 8; c++) {
        if (state.board[r][c] === EMPTY) {
          empty++;
        } else {
          if (empty > 0) { fen += empty; empty = 0; }
          fen += state.board[r][c];
        }
      }
      if (empty > 0) fen += empty;
      if (r < 7) fen += '/';
    }
    fen += ' ' + state.turn;
    fen += ' ' + state.castling;
    fen += ' ' + state.enPassant;
    fen += ' ' + state.halfMoves;
    fen += ' ' + state.fullMoves;
    return fen;
  }

  function inBounds(r, c) { return r >= 0 && r < 8 && c >= 0 && c < 8; }

  function cloneBoard(board) {
    const out = [];
    for (let r = 0; r < 8; r++) out[r] = board[r].slice();
    return out;
  }

  function findKing(board, color) {
    const k = color === 'w' ? 'K' : 'k';
    for (let r = 0; r < 8; r++)
      for (let c = 0; c < 8; c++)
        if (board[r][c] === k) return [r, c];
    return null;
  }

  function isSquareAttacked(board, row, col, byColor) {
    const enemy = byColor === 'w' ? 'w' : 'b';

    // Knight attacks
    const knightMoves = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
    const kn = enemy === 'w' ? 'N' : 'n';
    for (let i = 0; i < knightMoves.length; i++) {
      const nr = row + knightMoves[i][0], nc = col + knightMoves[i][1];
      if (inBounds(nr, nc) && board[nr][nc] === kn) return true;
    }

    // Pawn attacks
    const pawnDir = enemy === 'w' ? 1 : -1;
    const pw = enemy === 'w' ? 'P' : 'p';
    if (inBounds(row + pawnDir, col - 1) && board[row + pawnDir][col - 1] === pw) return true;
    if (inBounds(row + pawnDir, col + 1) && board[row + pawnDir][col + 1] === pw) return true;

    // King attacks
    const ki = enemy === 'w' ? 'K' : 'k';
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const kr2 = row + dr, kc2 = col + dc;
        if (inBounds(kr2, kc2) && board[kr2][kc2] === ki) return true;
      }

    // Sliding: rook/queen (straight), bishop/queen (diagonal)
    const rq = enemy === 'w' ? ['R','Q'] : ['r','q'];
    const bq = enemy === 'w' ? ['B','Q'] : ['b','q'];

    const straightDirs = [[0,1],[0,-1],[1,0],[-1,0]];
    const diagDirs = [[1,1],[1,-1],[-1,1],[-1,-1]];

    for (let d = 0; d < 4; d++) {
      let sr = row + straightDirs[d][0], sc = col + straightDirs[d][1];
      while (inBounds(sr, sc)) {
        if (board[sr][sc] !== EMPTY) {
          if (rq.indexOf(board[sr][sc]) >= 0) return true;
          break;
        }
        sr += straightDirs[d][0]; sc += straightDirs[d][1];
      }
    }

    for (let d2 = 0; d2 < 4; d2++) {
      let sr2 = row + diagDirs[d2][0], sc2 = col + diagDirs[d2][1];
      while (inBounds(sr2, sc2)) {
        if (board[sr2][sc2] !== EMPTY) {
          if (bq.indexOf(board[sr2][sc2]) >= 0) return true;
          break;
        }
        sr2 += diagDirs[d2][0]; sc2 += diagDirs[d2][1];
      }
    }

    return false;
  }

  function isInCheck(board, color) {
    const kp = findKing(board, color);
    if (!kp) return false;
    return isSquareAttacked(board, kp[0], kp[1], opponent(color));
  }

  function getPseudoMoves(state, row, col) {
    const board = state.board;
    const piece = board[row][col];
    if (piece === EMPTY) return [];
    const color = colorOf(piece);
    const moves = [];
    const type = piece.toUpperCase();

    function addMove(r, c, special) {
      if (!inBounds(r, c)) return false;
      const target = board[r][c];
      if (target !== EMPTY && colorOf(target) === color) return false;
      moves.push({ from: [row, col], to: [r, c], special: special || null });
      return target === EMPTY;
    }

    function slide(dirs) {
      for (let i = 0; i < dirs.length; i++) {
        let r = row + dirs[i][0], c = col + dirs[i][1];
        while (inBounds(r, c)) {
          if (!addMove(r, c)) break;
          r += dirs[i][0]; c += dirs[i][1];
        }
      }
    }

    if (type === 'P') {
      const dir = color === 'w' ? -1 : 1;
      const startRow = color === 'w' ? 6 : 1;
      // Forward
      if (inBounds(row + dir, col) && board[row + dir][col] === EMPTY) {
        addMove(row + dir, col);
        // Double move
        if (row === startRow && board[row + 2 * dir][col] === EMPTY) {
          addMove(row + 2 * dir, col, 'double');
        }
      }
      // Captures
      for (let dc = -1; dc <= 1; dc += 2) {
        const cr = row + dir, cc = col + dc;
        if (inBounds(cr, cc) && board[cr][cc] !== EMPTY && colorOf(board[cr][cc]) !== color) {
          addMove(cr, cc);
        }
        // En passant
        if (state.enPassant !== '-') {
          const epr = parseInt(state.enPassant[1]), epc = state.enPassant.charCodeAt(0) - 97;
          if (cr === epr && cc === epc) {
            addMove(cr, cc, 'enpassant');
          }
        }
      }
    } else if (type === 'N') {
      const knightDirs = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
      for (let k = 0; k < knightDirs.length; k++) addMove(row + knightDirs[k][0], col + knightDirs[k][1]);
    } else if (type === 'B') {
      slide([[1,1],[1,-1],[-1,1],[-1,-1]]);
    } else if (type === 'R') {
      slide([[0,1],[0,-1],[1,0],[-1,0]]);
    } else if (type === 'Q') {
      slide([[0,1],[0,-1],[1,0],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]]);
    } else if (type === 'K') {
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          addMove(row + dr, col + dc);
        }
      // Castling
      const kRow = color === 'w' ? 7 : 0;
      if (row === kRow && col === 4 && !isInCheck(board, color)) {
        const ks = color === 'w' ? 'K' : 'k';
        const qs = color === 'w' ? 'Q' : 'q';
        if (state.castling.indexOf(ks) >= 0 &&
            board[kRow][5] === EMPTY && board[kRow][6] === EMPTY &&
            board[kRow][7] === (color === 'w' ? 'R' : 'r') &&
            !isSquareAttacked(board, kRow, 5, opponent(color)) &&
            !isSquareAttacked(board, kRow, 6, opponent(color))) {
          moves.push({ from: [row, col], to: [kRow, 6], special: 'castle-k' });
        }
        if (state.castling.indexOf(qs) >= 0 &&
            board[kRow][3] === EMPTY && board[kRow][2] === EMPTY && board[kRow][1] === EMPTY &&
            board[kRow][0] === (color === 'w' ? 'R' : 'r') &&
            !isSquareAttacked(board, kRow, 3, opponent(color)) &&
            !isSquareAttacked(board, kRow, 2, opponent(color))) {
          moves.push({ from: [row, col], to: [kRow, 2], special: 'castle-q' });
        }
      }
    }

    return moves;
  }

  function getLegalMoves(state, row, col) {
    const piece = state.board[row][col];
    if (piece === EMPTY || colorOf(piece) !== state.turn) return [];

    const pseudo = getPseudoMoves(state, row, col);
    const legal = [];
    const color = state.turn;

    for (let i = 0; i < pseudo.length; i++) {
      const m = pseudo[i];
      const simBoard = cloneBoard(state.board);

      // Simulate move
      simBoard[m.to[0]][m.to[1]] = simBoard[m.from[0]][m.from[1]];
      simBoard[m.from[0]][m.from[1]] = EMPTY;

      if (m.special === 'enpassant') {
        const epRow = color === 'w' ? m.to[0] + 1 : m.to[0] - 1;
        simBoard[epRow][m.to[1]] = EMPTY;
      } else if (m.special === 'castle-k') {
        const kRow2 = color === 'w' ? 7 : 0;
        simBoard[kRow2][5] = simBoard[kRow2][7];
        simBoard[kRow2][7] = EMPTY;
      } else if (m.special === 'castle-q') {
        const kRow3 = color === 'w' ? 7 : 0;
        simBoard[kRow3][3] = simBoard[kRow3][0];
        simBoard[kRow3][0] = EMPTY;
      }

      if (!isInCheck(simBoard, color)) {
        legal.push(m);
      }
    }

    return legal;
  }

  function hasLegalMoves(state) {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = state.board[r][c];
        if (piece !== EMPTY && colorOf(piece) === state.turn) {
          if (getLegalMoves(state, r, c).length > 0) return true;
        }
      }
    }
    return false;
  }

  function isCheckmate(state) {
    return hasLegalMoves(state) === false && isInCheck(state.board, state.turn);
  }

  function isStalemate(state) {
    return hasLegalMoves(state) === false && isInCheck(state.board, state.turn) === false;
  }

  function getAllLegalMoves(state) {
    const all = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = state.board[r][c];
        if (piece !== EMPTY && colorOf(piece) === state.turn) {
          const moves = getLegalMoves(state, r, c);
          for (let i = 0; i < moves.length; i++) all.push(moves[i]);
        }
      }
    }
    return all;
  }

  function pickBestMove(state, moves) {
    if (moves.length === 0) return null;

    // Prefer captures, prioritize by piece value
    let bestMove = moves[0];
    let bestScore = -Infinity;

    for (let i = 0; i < moves.length; i++) {
      const m = moves[i];
      const captured = state.board[m.to[0]][m.to[1]];
      let score = 0;

      if (captured !== EMPTY) {
        score += PIECE_VALUE[captured] || 0;
      }

      // Prefer moves that give check
      const simBoard = cloneBoard(state.board);
      simBoard[m.to[0]][m.to[1]] = simBoard[m.from[0]][m.from[1]];
      simBoard[m.from[0]][m.from[1]] = EMPTY;
      if (isInCheck(simBoard, opponent(state.turn))) {
        score += 0.5;
      }

      // Add small random factor to break ties
      score += Math.random() * 0.1;

      if (score > bestScore) {
        bestScore = score;
        bestMove = m;
      }
    }

    return bestMove;
  }

  function makeMove(state, fromRow, fromCol, toRow, toCol) {
    const legal = getLegalMoves(state, fromRow, fromCol);
    let move = null;
    for (let i = 0; i < legal.length; i++) {
      if (legal[i].to[0] === toRow && legal[i].to[1] === toCol) {
        move = legal[i];
        break;
      }
    }
    if (!move) return false;

    const board = state.board;
    const piece = board[fromRow][fromCol];
    const color = colorOf(piece);

    // Execute move
    board[toRow][toCol] = piece;
    board[fromRow][fromCol] = EMPTY;

    if (move.special === 'enpassant') {
      const epRow = color === 'w' ? toRow + 1 : toRow - 1;
      board[epRow][toCol] = EMPTY;
    } else if (move.special === 'castle-k') {
      const kr = color === 'w' ? 7 : 0;
      board[kr][5] = board[kr][7];
      board[kr][7] = EMPTY;
    } else if (move.special === 'castle-q') {
      const kr2 = color === 'w' ? 7 : 0;
      board[kr2][3] = board[kr2][0];
      board[kr2][0] = EMPTY;
    }

    // Pawn promotion (auto-queen)
    if (piece === 'P' && toRow === 0) board[toRow][toCol] = 'Q';
    if (piece === 'p' && toRow === 7) board[toRow][toCol] = 'q';

    // Update castling rights
    if (piece === 'K' || piece === 'k') {
      state.castling = state.castling.replace(color === 'w' ? 'KQ' : 'kq', '');
    }
    if (piece === 'R' && fromRow === 7 && fromCol === 7) state.castling = state.castling.replace('K', '');
    if (piece === 'R' && fromRow === 7 && fromCol === 0) state.castling = state.castling.replace('Q', '');
    if (piece === 'r' && fromRow === 0 && fromCol === 7) state.castling = state.castling.replace('k', '');
    if (piece === 'r' && fromRow === 0 && fromCol === 0) state.castling = state.castling.replace('q', '');

    // En passant square
    if (move.special === 'double') {
      const epRow = color === 'w' ? fromRow - 1 : fromRow + 1;
      const epCol = fromCol;
      state.enPassant = String.fromCharCode(97 + epCol) + (8 - epRow);
    } else {
      state.enPassant = '-';
    }

    // Switch turn
    state.turn = opponent(state.turn);
    if (state.turn === 'w') state.fullMoves++;

    return true;
  }

  let _firstMoveCallback = null;
  let _hasMoved = false;

  return {
    initState: function (fen) {
      if (!fen) fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      return fenToBoard(fen);
    },
    getLegalMoves: getLegalMoves,
    getAllLegalMoves: getAllLegalMoves,
    pickBestMove: pickBestMove,
    makeMove: makeMove,
    getFEN: function (state) { return boardToFEN(state); },
    setFirstMoveCallback: function (fn) { _firstMoveCallback = fn; _hasMoved = false; },
    checkFirstMove: function () {
      if (_firstMoveCallback && !_hasMoved) {
        _hasMoved = true;
        _firstMoveCallback();
      }
    },
    colorOf: colorOf,
    isInCheck: function (state, color) { return isInCheck(state.board, color); },
    isCheckmate: isCheckmate,
    isStalemate: isStalemate,
    hasLegalMoves: hasLegalMoves
  };
})();
