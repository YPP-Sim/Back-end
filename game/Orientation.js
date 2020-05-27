module.exports = {
  NORTH: {
    name: "NORTH",
    xDir: 0,
    yDir: 1,
    left: {
      x: -1,
      y: 0,
    },
    right: {
      x: 1,
      y: 0,
    },
  },
  SOUTH: {
    name: "SOUTH",
    xDir: 0,
    yDir: -1,
    left: {
      x: 1,
      y: 0,
    },
    right: {
      x: -1,
      y: 0,
    },
  },
  WEST: {
    name: "WEST",
    xDir: -1,
    yDir: 0,
    left: {
      x: 0,
      y: 1,
    },
    right: {
      x: 0,
      y: -1,
    },
  },
  EAST: {
    name: "EAST",
    xDir: 1,
    yDir: 0,
    left: {
      x: 0,
      y: -1,
    },
    right: {
      x: 0,
      y: 1,
    },
  },
};
