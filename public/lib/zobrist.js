var Chess = require('chess.js').Chess

function Zobrist() {
  this.initialiseZobristTable()
}

Zobrist.prototype.initialiseZobristTable = function() {
  // fill a table of random numbers/bitstrings
  var pieceKeys, dummyPosition, seededRandom

  seededRandom = (function(s) {
    return function() {
      s = Math.sin(s) * 10000
      return s - Math.floor(s)
    }
  })(1000)

  dummyPosition = new Chess()
  pieceKeys = ['pw', 'nw', 'bw', 'rw', 'qw', 'kw', 'pb', 'nb', 'bb', 'rb', 'qb', 'kb']

  this.table = dummyPosition.SQUARES.reduce(function(table, square) {
    table[square] = pieceKeys.reduce(function(pieceLookup, key) {
      pieceLookup[key] = random32BitInteger()
      return pieceLookup
    }, {})
    return table
  }, {})

  function random32BitInteger() {
    return Math.floor(seededRandom() * Math.pow(2, 32))
  }
}

Zobrist.prototype.hashFromPosition = function(position) {
  var _this
  
  _this = this
  return position.SQUARES.reduce(function(h, square) {
    var piece

    piece = position.get(square)
    if (piece === null) return h

    return h ^ _this.table[square][piece.type + piece.color]
  }, 0)
}

Zobrist.prototype.updateHash = function(hash, move) {
  var _this, pieceKey

  _this = this
  pieceKey = move.piece + move.color
  hash ^= this.table[move.from][pieceKey] // moving piece leaves source
  hash ^= this.table[move.to][pieceKey]   // moving piece enters destination
  move.flags.split('').forEach(function(flag) {
    if (flag === 'c') {
      hash ^= _this.table[move.to][move.captured + (move.color === 'b' ? 'w' : 'b')] // remove captured piece
    }
    else if (flag === 'e') {
      hash ^= _this.table[move.to[0] + move.from[1]][move.captured + (move.color === 'b' ? 'w' : 'b')] // remove passed pawn
    }
    else if (flag === 'p') {
      hash ^= _this.table[move.to][pieceKey]                    // moving piece leaves board
      hash ^= _this.table[move.to][move.promotion + move.color] // promotion enters boards
    }
    else if (flag === 'k') {
      hash ^= _this.table['h' + move.from[1]]['r' + move.color] // remove rook from corner
      hash ^= _this.table['f' + move.from[1]]['r' + move.color] // put rook inside king
    }
    else if (flag === 'q') {
      hash ^= _this.table['a' + move.from[1]]['r' + move.color] // remove rook from corner
      hash ^= _this.table['d' + move.from[1]]['r' + move.color] // put rook inside king
    }
  })

  return hash
}

exports.Zobrist = Zobrist