const Orientation = require("./Orientation");

module.exports = {
  NORTH_WIND: {
    name: "NORTH_WIND",
    direction: Orientation.NORTH,
  },
  EAST_WIND: {
    name: "EAST_WIND",
    direction: Orientation.EAST,
  },
  WEST_WIND: {
    name: "WEST_WIND",
    direction: Orientation.WEST,
  },
  SOUTH_WIND: {
    name: "SOUTH_WIND",
    direction: Orientation.SOUTH,
  },
  WHIRLWIND_CLOCKWISE_SE: {
    name: "WHIRLWIND_CLOCKWISE_SE",
    direction: Orientation.WEST,
    turn_direction: Orientation.WEST.right,
    clockwise: true,
  },
  WHIRLWIND_CLOCKWISE_SW: {
    name: "WHIRLWIND_CLOCKWISE_SW",
    direction: Orientation.NORTH,
    turn_direction: Orientation.NORTH.right,
    clockwise: true,
  },
  WHIRLWIND_CLOCKWISE_NW: {
    name: "WHIRLWIND_CLOCKWISE_NW",
    direction: Orientation.EAST,
    turn_direction: Orientation.EAST.right,
    clockwise: true,
  },
  WHIRLWIND_CLOCKWISE_NE: {
    name: "WHIRLWIND_CLOCKWISE_NE",
    direction: Orientation.SOUTH,
    turn_direction: Orientation.SOUTH.right,
    clockwise: true,
  },

  WHIRLWIND_COUNTER_CLOCKWISE_SE: {
    name: "WHIRLWIND_COUNTER_CLOCKWISE_SE",
    direction: Orientation.NORTH,
    turn_direction: Orientation.NORTH.left,
    clockwise: false,
  },
  WHIRLWIND_COUNTER_CLOCKWISE_SW: {
    name: "WHIRLWIND_COUNTER_CLOCKWISE_SW",
    direction: Orientation.EAST,
    turn_direction: Orientation.EAST.left,
    clockwise: false,
  },
  WHIRLWIND_COUNTER_CLOCKWISE_NW: {
    name: "WHIRLWIND_COUNTER_CLOCKWISE_NW",
    direction: Orientation.SOUTH,
    turn_direction: Orientation.SOUTH.left,
    clockwise: false,
  },
  WHIRLWIND_COUNTER_CLOCKWISE_NE: {
    name: "WHIRLWIND_COUNTER_CLOCKWISE_NE",
    direction: Orientation.WEST,
    turn_direction: Orientation.WEST.left,
    clockwise: false,
  },
};
