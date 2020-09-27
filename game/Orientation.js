module.exports = {
  NORTH: {
    name: "NORTH",
    xDir: 0,
    yDir: -1,
    left: {
      x: -1,
      y: 0,
      orientation: "WEST",
    },
    right: {
      x: 1,
      y: 0,
      orientation: "EAST",
    },
  },
  SOUTH: {
    name: "SOUTH",
    xDir: 0,
    yDir: 1,
    left: {
      x: 1,
      y: 0,
      orientation: "EAST",
    },
    right: {
      x: -1,
      y: 0,
      orientation: "WEST",
    },
  },
  WEST: {
    name: "WEST",
    xDir: -1,
    yDir: 0,
    left: {
      x: 0,
      y: 1,
      orientation: "SOUTH",
    },
    right: {
      x: 0,
      y: -1,
      orientation: "NORTH",
    },
  },
  EAST: {
    name: "EAST",
    xDir: 1,
    yDir: 0,
    left: {
      x: 0,
      y: -1,
      orientation: "NORTH",
    },
    right: {
      x: 0,
      y: 1,
      orientation: "SOUTH",
    },
  },
};
