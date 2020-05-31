let io;

module.exports = {
    init: httpServer => {
        io = require('socket.io')(httpServer)
        return io;
    },
    setUser: (username) => {
        io.user = username;
        return io;
    },
    getIO: () => {
        if (!io){
            throw new Error('Socket.io has not been initialised')
        }
        return io; 
    }
}