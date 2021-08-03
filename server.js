const express = require('express')
const path = require('path')
const http = require('http')
const PORT = process.env.PORT || 3000
const socketio = require('socket.io')
const { Console } = require('console')
const app = express()
const server = http.createServer(app)
const io = socketio(server)

app.use(express.static(path.join(__dirname, "public")))


//server
server.listen(PORT, ()=> console.log((`server running on port ${PORT}`)))

//socket connection
const connections = [null, null]
io.on('connection', socket =>{
    //console.log(('new ws connection'));

    let playerIndex = -1;
    for (const i in connections){
        if (connections[i] === null){
            playerIndex = i
            break
        }
    }

    
    socket.emit('player-number', playerIndex)

    console.log(`player ${playerIndex} has connected`)

    //ignore player 3
    if (playerIndex == -1) return
    
    connections[playerIndex] = false 

    // tell everyone what player number connected
    socket.broadcast.emit('player-connection', playerIndex )

    socket.on('disconnect', ()=>{
        console.log(`player ${playerIndex} disconnected`)
        connections[playerIndex] = null
        //tell everyone what player number just disconnected
        socket.broadcast.emit('player-connection', playerIndex)
    })

    //on ready
    socket.on('player-ready', ()=>{
        socket.broadcast.emit('enemy-ready', playerIndex)
        connections[playerIndex] = true
    })


    //check player connection
    socket.on('check-players', ()=>{
        const players = []
        for (const i in connections) {
            connections[i] === null ? players.push({connected: false, ready: false}):
            players.push({connected: true, ready: connections[i]})
        }
        socket.emit('check-players', players)
    })

    //on fire Received
    socket.on('fire', id =>{
        console.log(`shot fired from ${playerIndex}`, id)

        socket.broadcast.emit('fire', id)
    })


    //on fire reply
    socket.on('fire-reply', square =>{
        console.log(square)

        socket.broadcast.emit('fire-reply', square)
    })


    //time out
    setTimeout(() => {
        connections[playerIndex] = null
        socket.emit('timeout')
        socket.disconnect()
    },  60000);
})
