module.exports = function onCommand(command, args, socket, io) {
  switch (command) {
    case "addShip":
      // TODO Update server's game data

      io.emit("addShip", JSON.stringify(args));
      break;

    case "moveShip":
      if (!args.shipId || !args.moveType) {
        socket.emit(
          "message",
          "shipId and moveType arguments must not be null"
        );
        break;
      }

      // TODO Update server's game data

      io.emit("moveShip", args);
      break;

    case "damageShip":
      if (!args.shipId || !args.damageAmount) {
        socket.emit(
          "message",
          "shipId and damageAmount arguments must not be null"
        );
        break;
      }

      // TODO Update server's game data

      break;
    default:
      socket.emit("message", "Unknown command: " + command);
      return;
  }
};
