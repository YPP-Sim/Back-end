const app = require("express")();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const onCommand = require("./socket-commands");

const port = process.env.PORT || 4000;

app.get("/", (req, res) => {
  res.status(200).json({ message: "Works!" });
});

io.on("connection", (socket) => {
  console.log("Someone connected");
  socket.on("clientCommand", (command, args) => {
    console.log("Client command: " + command, "Args: " + args);
    onCommand(command, args, socket, io);
  });

  socket.on("message", (data) => {
    console.log("message: ", data);
  });
});

http.listen(port, () => {
  console.log(`Listening on port: ${port}`);
});
