
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
    socket.on('create free space', ({username}) => {
        availableAgents[username] = socket.id;
    })
    
    /*==================USER==============================*/
    socket.on('join free space', ({username, userId}) => {
        socketOperations.setUser(username);

        // assign user to available agent
        if (availableAgents.length > 0){

            // inform agent of new user (customer) OR figure a way to retrieve agent's socket object using his socket id
            var agentUsername = Object.keys(availableAgents)[0];
            var agentSocketId = availableAgents[agentUsername];
            var agentSocketObj = io.sockets.connected[agentSocketId];
            agentSocketId.emit('user joined space', username);

            // move agent from availableAgents list to occupiedAgents list
            occupiedAgents[agentUsername] = agentSocketId;
            delete availableAgents[agentUsername];
        
            // user and agent join a new room with room key = agent's username and user's userId concatenated together
            var roomKey = idGenerator.generateString(10)
            socket.join(roomKey);
            agentSocketObj.join(roomKey);

            // return room key to both user and agent
            socket.to(roomKey).emit('room key', {roomKey, agentUsername, userUsername: username})
        } else {
            // inform user that there are no available agents at the moment
            socket.emit('room key', null)
        }
      });

    // user trying to reconnect to same room using roomKey
    socket.on('reconnection request', ({roomKey, username}) => {
        socketOperations.setUser(username);
        
        // insert logic to check if room is still active. 
        var roomActive = true;
        if (roomActive){
            socket.join(roomKey)
            socket.emit('room key', roomKey)
        } else {
            socket.emit('room key', null)
        }
    })

    socket.on('new message', ({message, roomKey}) => {
        socket.to(roomKey).emit('new message received', {message, from: socket.user})
    })

    socket.on('leave room', (roomKey) => {
        socket.leave(roomKey);
        socket.to(roomKey).emit('user left', {message: socket.user + ' left'})
    })

})

