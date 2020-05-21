const app = require("express")();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

const port = process.env.PORT || 4000;

app.get("/", (req, res) => {
  res.status(200).json({ message: "Works!" });
});

io.on("connection", (socket) => {
  console.log("Someone connected");
  io.emit("test", "Helllo!!!");
  socket.send("Sent from socket ");
});

http.listen(port, () => {
  console.log(`Listening on port: ${port}`);
});
