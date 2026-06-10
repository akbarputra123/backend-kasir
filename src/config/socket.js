let io = null

const initSocket = (server) => {
  const { Server } = require("socket.io")

  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ["GET", "POST", "PUT", "DELETE"]
    }
  })

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id)

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id)
    })
  })

  return io
}

const getSocket = () => {
  if (!io) {
    throw new Error("Socket.io belum diinisialisasi")
  }

  return io
}

module.exports = {
  initSocket,
  getSocket
}