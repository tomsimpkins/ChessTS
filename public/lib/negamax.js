'use strict'
var Chess = require('chess.js').Chess
var pieceTable = require('./pieceTable.js')
var SCORE_LOOKUP = { p: 1, n: 3, b: 3, r: 5, q: 8, k: 200 }

var negaMaxCount = 0

// Returns a tuple (score, bestmove) for the position at the given depth
var negamaxSearch = function(position, depth, color, alpha, beta) {
  var bestMove, bestScore, positionCopy, res, move, moves, i

  negaMaxCount++

  if (depth === 0 || position.game_over()) return { score: color * calculateScore(position), move: undefined }

  bestScore = -Infinity
  bestMove = null

  moves = position.moves({ verbose: true }).sort(compareHeuristic)

  for (i = 0; i < moves.length; i++) {
    move = moves[i]

    positionCopy = new Chess(position.fen())
    positionCopy.move(move)

    res = negamaxSearch(positionCopy, depth - 1, color === 1 ? -1 : 1, -beta, -alpha)
    res.score = -res.score

    if (res.score > bestScore) {
      bestScore = res.score
      bestMove = move
    }
    if (res.score > alpha) alpha = res.score
    if (alpha >= beta) break
  }

  return { score: bestScore, move: bestMove }
}

function calculateScore(position) {
  var pieces, moves

  pieces = position.SQUARES.reduce(function(acc, square) {
    var piece

    piece = position.get(square)
    if (piece == null) return acc

    acc[piece.color].push(extend({ square: square }, piece))
    return acc
  }, { w: [], b: [] })

  // moves = { w: position.moves({ verbose: true, reversePlayers: position.turn() === 'b' }),
  //   b: position.moves({ verbose: true, reversePlayers: position.turn() === 'w' }) }

  return 100 * piecesScore(pieces) + positionScore(pieces) + 20000 * winScore(position)

  function piecesScore(pieces) {
    return pieces.w.reduce(pieceScore, 0) - pieces.b.reduce(pieceScore, 0)

    function pieceScore(acc, piece) {
      return acc + SCORE_LOOKUP[piece.type]
    }
  }
  
  function positionScore(pieces) {
    return pieces.w.reduce(positionScoreFold, 0) - pieces.b.reduce(positionScoreFold, 0)
    
    function positionScoreFold(acc, piece) {
      return acc + pieceTable.getPostionValue(piece)
    }
  }

  function mobilityScore(moves) {
    return moves.w.length - moves.b.length
  }
  
  function winScore(position) {
    if (!position.in_checkmate()) return 0

    return position.turn() === 'w' ? -1 : 1
  }
}

function compareHeuristic(a, b) {
  if (!a.captured && !b.captured) return 0
  if (!a.captured && b.captured) return 1
  if (a.captured && !b.captured) return -1

  return (SCORE_LOOKUP[b.captured] - SCORE_LOOKUP[b.piece]) - (SCORE_LOOKUP[a.captured] - SCORE_LOOKUP[a.piece])
}

function extend(a, b) {
  var key
  
  for (key in b) {
    if (b.hasOwnProperty(key)) {
      a[key] = b[key]
    }
  }
  
  return a
}

exports.aiMove = function(position) {
  return negamaxSearch(position, 3, position.turn() === 'w' ? 1 : -1, -Infinity, Infinity)
}