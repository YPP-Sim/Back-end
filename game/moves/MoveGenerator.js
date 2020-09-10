/**
 * Code inspired by BenBeri's implementation
 * located here: https://github.com/BenBeri/Obsidio-Server/blob/master/src/com/benberi/cadesim/server/model/player/domain/MoveGenerator.java
 */
const PlayerData = require("../PlayerData");

class MoveGenerator {
  /**
   *
   * @param {PlayerData} playerData
   */
  constructor(playerData) {
    this.player = playerData;
    this.cannonGenerationPercentage = 0;
    this.moveGenerationPercentage = 0;
  }

  update() {
    if (
      this.player.getCannons() + this.player.getCannonsLoaded() <
      this.player.getShip().shipType.maxCannons
    ) {
      this._updateCannonGeneration();
    }

    this._updateMoveGeneration();
  }

  _updateMoveGeneration() {
    const movesPerTurn = this.player.game.jobberQuality.movesPerTurn;
    const movesPerTurnBilgeAffected =
      movesPerTurn -
      0.009 * this.player.getShip().getBilgePercentage() * movesPerTurn;
    const rate = movesPerTurnBilgeAffected / this.player.game.turnTime;

    this.moveGenerationPercentage += rate;

    if (this.moveGenerationPercentage >= 1) {
      this.moveGenerationPercentage -= Math.floor(
        this.moveGenerationPercentage
      );
      this.player.generateMove();
      // Update tokens
      this.player.updateClientTokens();
    }
  }

  _updateCannonGeneration() {
    const game = this.player.game;
    const rate = game.jobberQuality.cannonsPerTurn / game.turnTime;

    this.cannonGenerationPercentage += rate;

    if (this.cannonGenerationPercentage >= 1) {
      this.cannonGenerationPercentage -= Math.floor(
        this.cannonGenerationPercentage
      );
      this.player.addCannons(1);
      this.player.updateClientTokens();
    }
  }
}

module.exports = MoveGenerator;
