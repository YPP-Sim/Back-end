const uuid = require("uuid");
class Flag {
  constructor(x, y, pointValue) {
    this.x = x;
    this.y = y;
    this.pointValue = pointValue;
    this.attackersContesting = false;
    this.defendersContesting = false;
    this.playersContesting = [];
    this.id = uuid.v4();
  }
}

module.exports = Flag;
