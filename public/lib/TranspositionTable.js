var Chess = require('chess.js').Chess

function TranspositionTable() {
  this.hashMap = {}
  this.table = this.initialiseZobrist()
}

TranspositionTable.prototype.retrieve = function() {}

TranspositionTable.prototype.node = function(zobrist, depth, score, alpha, beta, flag) {
  return {
    zobrist: zobrist,
    depth: depth,
    score: score,
    alpha: alpha,
    beta: beta,
    flag: flag
  }
}

TranspositionTable.prototype.initialiseZobrist = function() {
  // fill a table of random numbers/bitstrings
  var pieceKeys, dummyPosition

  dummyPosition = new Chess()
  pieceKeys = ['pw', 'nw', 'bw', 'rw', 'qw', 'kw', 'pb', 'nb', 'bb', 'rb', 'qb', 'kb']

  return dummyPosition.SQUARES.reduce(function(table, square) {
    table[square] = pieceKeys.reduce(function(pieceLookup, key) {
      pieceLookup[key] = random32BitInteger()
      return pieceLookup
    }, {})
    return table
  }, {})

  function random32BitInteger() {
    return Math.round(Math.random() * Math.pow(2, 32))
  }
}

TranspositionTable.prototype.hashFromPosition = function(position) {
  var _this

  return position.SQUARES.reduce(function(h, square) {
    var piece

    piece = position.get(square)
    if (piece === null) return h

    return h ^ _this.table[square][piece.type + piece.color]
  }, 0)
}

function updateHash(table, hash, move) {
  var pieceKey

  pieceKey = move.piece + move.color
  hash ^= table[move.from][pieceKey] // moving piece leaves source
  hash ^= table[move.to][pieceKey]   // moving piece enters destination
  move.flags.split('').forEach(function(flag) {
    if (flag === 'c') {
      hash ^= table[move.to][move.captured + (move.color === 'b' ? 'w' : 'b')] // remove captured piece
    }
    else if (flag === 'e') {
      hash ^= table[move.to[0] + move.from[1]][move.captured + (move.color === 'b' ? 'w' : 'b')] // remove passed pawn
    }
    else if (flag === 'p') {
      hash ^= table[move.to][pieceKey]                    // moving piece leaves board
      hash ^= table[move.to][move.promotion + move.color] // promotion enters boards
    }
    else if (flag === 'k') {
      hash ^= table['h' + move.from[1]]['r' + move.color] // remove rook from corner
      hash ^= table['f' + move.from[1]]['r' + move.color] // put rook inside king
    }
    else if (flag === 'q') {
      hash ^= table['a' + move.from[1]]['r' + move.color] // remove rook from corner
      hash ^= table['d' + move.from[1]]['r' + move.color] // put rook inside king
    }
  })

  return hash
}

var t = new TranspositionTable()
console.log(t)