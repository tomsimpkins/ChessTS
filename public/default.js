var statusEl, fenEl, pgnEl, aiScoreEl
var aiMove = require('./lib/negamax.js').aiMove
var Chess = require('chess.js').Chess
var ChessBoard = require('chessboardjs')

function initGame() {
  var board, cfg, game, onDragStart, onDrop

  statusEl = $('#status')
  fenEl = $('#fen')
  pgnEl = $('#pgn')
  aiScoreEl = $('#aiScore')

  game = new Chess()

  onDragStart = function(source, piece, position, orientation) {
    if (game.game_over() === true ||
      (game.turn() === 'w' && piece.search(/^b/) !== -1)
      || (game.turn() === 'b' && piece.search(/^w/) !== -1)) {

      return false
    }
  }

  onDrop = function(source, target) {
    var move

    move = game.move({
      from: source,
      to: target,
      promotion: 'q'
    })

    if (move === null) return 'snapback'

    updateStatus()
  };

  var onSnapEnd = function() {
    var move
    
    board.position(game.fen())

    window.setTimeout(function() {
      move = aiMove(game)
      game.move(move.move)
      aiScoreEl.html(move.score)
      updateBoard()
      updateStatus()
    }, 500)
  };
  
  function updateBoard() {
    board.position(game.fen())
  }

  var updateStatus = function() {
    var status = ''

    var moveColor = 'White'
    if (game.turn() === 'b') {
      moveColor = 'Black'
    }

    if (game.in_checkmate() === true) {
      status = 'Game over, ' + moveColor + ' is in checkmate.'
    }

    else if (game.in_draw() === true) {
      status = 'Game over, drawn position'
    }

    else {
      status = moveColor + ' to move'

      if (game.in_check() === true) {
        status += ', ' + moveColor + ' is in check'
      }
    }
    
    statusEl.html(status)
    fenEl.html(game.fen())
    pgnEl.html(game.pgn())
  }

  cfg = {
    draggable: true,
    position: 'start',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd
  }

  board = new ChessBoard('gameBoard', cfg)
  updateStatus()
}

$(document).ready(initGame)