module.exports = function onCommand(command, args, socket, io) {
  switch (command) {
    case "addShip":
      const shipData = {
        shipId: "art",
        boardX: 2,
        boardY: 2,
        type: "warFrig",
        orientation: "SOUTH",
      };
      io.emit("addShip", JSON.stringify(shipData));
      break;

    default:
      socket.emit("message", "Unknown command: " + command);
      return;
  }
};
