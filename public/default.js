var statusEl, fenEl, pgnEl, aiScoreEl
var aiMove = require('./lib/negamax.js').aiMove
var Chess = require('chess.js').Chess
var ChessBoard = require('chessboardjs')

// var webworkify = require('webworkify')

// var w = webworkify(require('./worker.js'))
// w.addEventListener('message', function (ev) {
//   console.log(ev.data)
// })
// w.postMessage(4)

// var worker = webworkify(require('./lib/negamax.js'))

function initGame() {
  var board, boardEl, cfg, game, onDragStart, onDrop, onMoveEnd, removeHighlights, squareToHighlight

  // worker.addEventListener('message', function(event) {
  //   console.log(event.data)
  // })

  boardEl = $('#gameBoard')
  statusEl = $('#status')
  fenEl = $('#fen')
  pgnEl = $('#pgn')
  aiScoreEl = $('#aiScore')

  removeHighlights = function(color) {
    boardEl.find('.square-55d63')
      .removeClass('highlight-' + color);
  };

  onMoveEnd = function() {
    boardEl.find('.square-' + squareToHighlight)
      .addClass('highlight-black')
  }

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

    removeHighlights('black')
    boardEl.find('.square-' + source)
      .addClass('highlight-' + 'white')
    boardEl.find('.square-' + target)
      .addClass('highlight-' + 'white')

    updateStatus()
  };

  var onSnapEnd = function() {
    var move
    
    board.position(game.fen())

    window.setTimeout(function() {
      move = aiMove(game)
      game.move(move.move)

      removeHighlights('white')
      boardEl.find('.square-' + move.move.from)
        .addClass('highlight-black')
      squareToHighlight = move.move.to

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
    onSnapEnd: onSnapEnd,
    onMoveEnd: onMoveEnd
  }

  board = new ChessBoard('gameBoard', cfg)
  updateStatus()
}

$(document).ready(initGame)