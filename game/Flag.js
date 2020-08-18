class Flag {
  constructor(x, y, pointValue) {
    this.x = x;
    this.y = y;
    this.pointValue = pointValue;

    this.playersContesting = [];
  }
}

module.exports = Flag;
