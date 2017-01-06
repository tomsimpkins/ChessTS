'use strict'
var Chess = require('chess.js').Chess
var pieceTable = require('./pieceTable.js')
var SCORE_LOOKUP = { p: 1, n: 3.2, b: 3.3, r: 5, q: 9, k: 200 }

var transpositionTable = {}

var calculateScore = (function() {
  var cache

  cache = {}
  return function(position) {
    var pieces, moves, fen, score

    fen = position.fen().replace(/ -.*/, '')
    if (cache.hasOwnProperty(fen)) return cache[fen]

    pieces = position.SQUARES.reduce(function(acc, square) {
      var piece

      piece = position.get(square)
      if (piece == null) return acc

      acc[piece.color].push(extend({square: square}, piece))
      return acc
    }, {w: [], b: []})

    moves = {
      w: position.moves({verbose: true, reversePlayers: position.turn() === 'b'}),
      b: position.moves({verbose: true, reversePlayers: position.turn() === 'w'})
    }

    score = 100 * piecesScore(pieces) + 10 * mobilityScore(moves) + positionScore(pieces) + 20000 * winScore(position)
    cache[fen] = score

    return score

    function piecesScore(pieces) {
      return pieces.w.reduce(pieceScore, 0) - pieces.b.reduce(pieceScore, 0)

      function pieceScore(acc, piece) {
        return acc + SCORE_LOOKUP[piece.type]
      }
    }

    function positionScore(pieces) {
      return pieces.w.reduce(positionScoreFold, 0) - pieces.b.reduce(positionScoreFold, 0)

      function positionScoreFold(acc, piece) {
        return acc + pieceTable.getPositionValue(piece)
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
})()

var negaMaxCount = 0

// Returns a tuple (score, bestmove) for the position at the given depth
var negamaxSearch = function(position, depth, color, alpha, beta, extension, quiescence) {
  var bestMove, bestScore, fen, positionCopy, res, move, moves, i

  negaMaxCount++

  if (position.game_over()) return { score: color * calculateScore(position), move: undefined }

  if (!quiescence && depth === 0) {
    if (!extension && position.in_check()) {
      extension = true
      depth = 1
    }
    else {
      quiescence = true
      depth = 1
    }
  }

  moves = position.moves({ verbose: true })
  if (quiescence) {
    moves = moves.filter(function(move) {
      return move.hasOwnProperty('captured')
    })
    if (depth === 0 || moves.length === 0) return { score: color * calculateScore(position), move: undefined }
  }

  bestScore = -Infinity
  bestMove = null

  fen = position.fen()
  moves = moves.sort(compareHeuristic)

  for (i = 0; i < moves.length; i++) {
    move = moves[i]

    positionCopy = new Chess(fen)
    positionCopy.move(move)

    res = negamaxSearch(positionCopy, depth - 1, color === 1 ? -1 : 1, -beta, -alpha, extension, quiescence)
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
  var res = negamaxSearch(position, 3, position.turn() === 'w' ? 1 : -1, -Infinity, Infinity)
  console.log(Object.keys(transpositionTable).length)
  return res
}

// var count, position, table, initialHash, incrementalHash, endHash, move
// position = new Chess()
// table = init_zobrist()
// endHash = incrementalHash = initialHash = init_hash(position, table)
// count = 0
// var gameCount = 0
// while (gameCount++ < 10000) {
//   while (incrementalHash === endHash && !position.game_over() && count++ < 1000) {
//     move = position.moves({verbose: true})[Math.floor(position.moves().length * Math.random())]
//     position.move(move)
//     incrementalHash = updateHash(table, incrementalHash, move)
//     endHash = init_hash(position, table)
//   }
// }
//
// if (incrementalHash !== endHash) console.log('endHash:' + endHash, 'incrementalHash:' + incrementalHash, position.history({verbose: true}))
