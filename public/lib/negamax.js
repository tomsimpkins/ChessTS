'use strict'
var Chess = require('chess.js').Chess
var Zobrist = require('./Zobrist.js').Zobrist
var TranspositionTable = require('./TranspositionTable.js').TranspositionTable
var pieceTable = require('./pieceTable.js')

var SCORE_LOOKUP = { p: 1, n: 3.2, b: 3.3, r: 5, q: 9, k: 200 }
var hasher = new Zobrist()
var tTable = new TranspositionTable(Math.pow(2, 20))

var calculateScore = (function() {
  var cache

  cache = {}
  return function(position, hash) {
    var pieces, moves, fen, score

    // fen = position.fen().replace(/ -.*/, '')
    if (cache.hasOwnProperty(hash)) return cache[hash]

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
    cache[hash] = score

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
var retrievalCount = [0, 0, 0, 0]
var alphaBetaCuts = 0

// Returns a tuple (score, bestmove) for the position at the given depth
var negamaxSearch = function(position, depth, color, alpha, beta, extension, quiescence, hash) {
  var alphaOrig, bestMove, bestScore, res, move, moves, i, ttEntry, ttFlag

  negaMaxCount++
  alphaOrig = alpha

  // Transposition Table Lookup; node is the lookup key for ttEntry
  // ttEntry = tTable.retrieve(hash)
  // if (ttEntry !== null && ttEntry.depth >= depth) {
  //   if (ttEntry.flag = 'EXACT') {
  //     retrievalCount[0]++
  //     return { score: ttEntry.value, move: ttEntry.move }
  //   }
  //   else if (ttEntry.flag = 'LOWER_BOUND') {
  //     retrievalCount[1]++
  //     alpha = Math.max(alpha, ttEntry.value)
  //   }
  //   else if (ttEntry.flag = 'UPPER_BOUND') {
  //     retrievalCount[2]++
  //     beta = Math.min(beta, ttEntry.value)
  //   }
  //
  //   if (alpha >= beta) {
  //     retrievalCount[3]++
  //     return { score: ttEntry.value, move: ttEntry.move }
  //   }
  // }

  if (position.game_over()) return { score: color * calculateScore(position, hash), move: undefined }

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
    if (depth === 0 || moves.length === 0) return { score: color * calculateScore(position, hash), move: undefined }
  }

  bestScore = -Infinity
  bestMove = null

  moves = moves.sort(compareHeuristic)

  for (i = 0; i < moves.length; i++) {
    move = moves[i]

    position.move(move)
    res = negamaxSearch(position, depth - 1, color === 1 ? -1 : 1, -beta, -alpha, extension, quiescence, hasher.updateHash(hash, move))
    position.undo()

    res.score = -res.score
    if (res.score > bestScore) {
      bestScore = res.score
      bestMove = move
    }
    if (res.score > alpha) alpha = res.score
    if (alpha >= beta) {
      alphaBetaCuts += (moves.length - i)
      break
    }
  }

  // if (ttEntry === null || ttEntry.depth < depth) {
  //   if (bestScore <= alphaOrig) ttFlag = 'UPPER_BOUND'
  //   else if (bestScore >= beta) ttFlag = 'LOWER_BOUND'
  //   else ttFlag = 'EXACT'
  //
  //   tTable.insert(hash, depth, bestScore, ttFlag, bestMove)
  // }

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

function aiMove(position) {
  var hash, result

  hash = hasher.hashFromPosition(position)

  console.time('negamax')
  result = negamaxSearch(position, 3, position.turn() === 'w' ? 1 : -1, -Infinity, Infinity, false, false, hash)
  console.timeEnd('negamax')
  console.log('negamaxCalls:' + negaMaxCount, 'alphaBetaCuts:' + alphaBetaCuts, 'ttRetrievals:' + JSON.stringify(retrievalCount))

  negaMaxCount = 0
  alphaBetaCuts = 0
  retrievalCount = [0, 0, 0, 0]

  return result
}

module.exports.aiMove = aiMove