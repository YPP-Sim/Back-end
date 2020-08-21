class Flag {
  constructor(x, y, pointValue) {
    this.x = x;
    this.y = y;
    this.pointValue = pointValue;
    this.attackersContesting = false;
    this.defendersContesting = false;
    this.playersContesting = [];
  }
}

module.exports = Flag;
