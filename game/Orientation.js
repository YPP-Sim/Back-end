module.exports = {
  NORTH: {
    name: "NORTH",
    xDir: 0,
    yDir: 1,
    left: {
      x: -1,
      y: 0,
      toOrientation: this.WEST,
    },
    right: {
      x: 1,
      y: 0,
      toOrientation: this.EAST,
    },
  },
  SOUTH: {
    name: "SOUTH",
    xDir: 0,
    yDir: -1,
    left: {
      x: 1,
      y: 0,
      toOrientation: this.EAST,
    },
    right: {
      x: -1,
      y: 0,
      toOrientation: this.WEST,
    },
  },
  WEST: {
    name: "WEST",
    xDir: -1,
    yDir: 0,
    left: {
      x: 0,
      y: 1,
      toOrientation: this.SOUTH,
    },
    right: {
      x: 0,
      y: -1,
      toOrientation: this.NORTH,
    },
  },
  EAST: {
    name: "EAST",
    xDir: 1,
    yDir: 0,
    left: {
      x: 0,
      y: -1,
      toOrientation: this.NORTH,
    },
    right: {
      x: 0,
      y: 1,
      toOrientation: this.SOUTH,
    },
  },
};
