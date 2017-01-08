function TranspositionTable(tableSize) {
  this.tableSize = tableSize
  this.hashTable = (function(hashTable) {
    var i

    for (i = 0; i < tableSize; i++) {
      hashTable[i] = null
    }
    return hashTable
  })([])
}

TranspositionTable.prototype.getIndexFromHash = function(hash) {
  var index

  index = hash % this.tableSize
  return index < 0 ? index + this.tableSize : index
}

TranspositionTable.prototype.retrieve = function(hash) {
  var index, res

  index = this.getIndexFromHash(hash)
  res = this.hashTable[index]
  
  return res == null || res.zobrist !== hash ? null : res
}

TranspositionTable.prototype.insert = function(hash, depth, value, flag, move) {
  var index

  index = this.getIndexFromHash(hash)
  this.hashTable[index] = this.node(hash, depth, value, flag, move)
}

TranspositionTable.prototype.node = function(zobrist, depth, value, flag, move) {
  return {
    zobrist: zobrist,
    depth: depth,
    value: value,
    flag: flag,
    move: move
  }
}

exports.TranspositionTable = TranspositionTable