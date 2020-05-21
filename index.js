const app = require("express")();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

const port = process.env.PORT || 4000;

app.get("/", (req, res) => {
  res.status(200).json({ message: "Works!" });
});

io.on("connection", (socket) => {
  console.log("Someone connected");
  const shipData = {
    shipId: "art",
    boardX: 2,
    boardY: 2,
    type: "warFrig",
    orientation: "SOUTH",
  };
  io.emit("addShip", JSON.stringify(shipData));
  socket.send("Sent from socket ");
});

http.listen(port, () => {
  console.log(`Listening on port: ${port}`);
});
