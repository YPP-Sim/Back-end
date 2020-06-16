const PlayerMoves = require("./moves/PlayerMoves");

class PlayerData {
  constructor(playerName, ship = null) {
    this.playerName = playerName;
    this.ship = ship;
    this.moves = new PlayerMoves(playerName);
  }

  getMoves() {
    return this.moves;
  }

  // Same is moves.set#####(move)
  // Just some more helpful sugar coating
  setFirstMove(move) {
    this.moves.firstMove = move;
  }

  setSecondMove(move) {
    this.moves.secondMove = move;
  }

  setThirdMove(move) {
    this.moves.thirdMove = move;
  }

  setFourthMove(move) {
    this.moves.fourthMove = move;
  }

  getSide(game) {
    let side;
    if (game.isDefender(this.getName())) side = "DEFENDER";
    else if (game.isAttacker(this.getName())) side = "ATTACKER";
    else side = "UNDECIDED";

    return side;
  }

  getName() {
    return this.playerName;
  }

  getShip() {
    return this.ship;
  }
}

module.exports = PlayerData;
