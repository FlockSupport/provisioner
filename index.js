
const express = require('express');

const app = express();

const server = app.listen(3000);
const socketOperations = require('./socket')
const io = require('./socket').init(server)
const idGenerator = require('./helpers/idgenerator')

var availableAgents = [];
var occupiedAgents = [];


io.on('connection', socket => {
    console.log('client connected');

    /*==================AGENT=============================*/
    socket.on('create free space request', ({username}) => {
        availableAgents[username] = socket.id;
    })
    
    /*==================USER==============================*/
    socket.on('join free space request', ({username}) => {
        socketOperations.setUser(username);

        // assign user to available agent
        if (availableAgents.length > 0){

            var agentUsername = Object.keys(availableAgents)[0];
            var agentSocketId = availableAgents[agentUsername];
            var agentSocketObj = io.sockets.connected[agentSocketId];

            // move agent from availableAgents list to occupiedAgents list
            occupiedAgents[agentUsername] = agentSocketId;
            delete availableAgents[agentUsername];
        
            // user and agent join a new room with room key = agent's username and user's userId concatenated together
            var roomKey = idGenerator.generateString(10)
            socket.join(roomKey);
            agentSocketObj.join(roomKey);

            // return room key to both user and agent
            socket.to(roomKey).emit('new room success', {roomKey, agentUsername, customerUsername: username})
        } else {
            // inform user that there are no available agents at the moment
            socket.emit('new room failure', null)
        }
      });

    // user trying to reconnect to same room using roomKey
    socket.on('reconnection request', ({roomKey, username}) => {
        socketOperations.setUser(username);
        
        // insert logic to check if room is still active. 
        var roomActive = true;
        if (roomActive){
            socket.join(roomKey)
            socket.emit('reconnection success', roomKey)
        } else {
            socket.emit('reconnection failure', null)
        }
    })

    socket.on('send message', ({message, roomKey}) => {
        socket.to(roomKey).emit('received message', {message, sender: socket.user})
    })

    socket.on('leave room', (roomKey) => {
        socket.leave(roomKey);
        socket.to(roomKey).emit('user left', {user: socket.user})
    })

})

