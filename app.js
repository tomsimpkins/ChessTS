var http = require('http')
var express = require('express')
var io = require('socket.io')(http)
var app, port, router, path, server

app = express()
router = express.Router();
path = __dirname

app.use('/img/chesspieces/wikipedia', express.static(path + '/public/lib/img/chesspieces/wikipedia'))
app.use('/style/chessboard-0.3.0.min.css', express.static(path + '/public/lib/chessboard-0.3.0.min.css'))
app.use('/style/highlights.css', express.static(path + '/public/lib/highlights.css'))
app.use('/bundle.js', express.static(path + '/public/bundle.js'))
app.get('/', function (req, res) {
  res.sendFile('public/default.html', {root: path})
})

server = http.Server(app)
port = process.env.PORT || 3000

server.listen(port, function() {
  console.log("Server listening on: http://localhost:%s", port)
})

// io.on('connection', function(socket) {
//   console.log('new socket: ' + socket)
// })
