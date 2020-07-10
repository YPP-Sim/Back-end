import Orientation from "./Orientation";

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
  },
  WHIRLWIND_CLOCKWISE_SW: {
    name: "WHIRLWIND_CLOCKWISE_SW",
    direction: Orientation.NORTH,
    turn_direction: Orientation.NORTH.right,
  },
  WHIRLWIND_CLOCKWISE_NW: {
    name: "WHIRLWIND_CLOCKWISE_NW",
    direction: Orientation.EAST,
    turn_direction: Orientation.EAST.right,
  },
  WHIRLWIND_CLOCKWISE_NE: {
    name: "WHIRLWIND_CLOCKWISE_NE",
    direction: Orientation.SOUTH,
    turn_direction: Orientation.SOUTH.right,
  },

  WHIRLWIND_COUNTER_CLOCKWISE_SE: {
    name: "WHIRLWIND_COUNTER_CLOCKWISE_SE",
    direction: Orientation.NORTH,
    turn_direction: Orientation.NORTH.left,
  },
  WHIRLWIND_COUNTER_CLOCKWISE_SW: {
    name: "WHIRLWIND_COUNTER_CLOCKWISE_SW",
    direction: Orientation.EAST,
    turn_direction: Orientation.EAST.left,
  },
  WHIRLWIND_COUNTER_CLOCKWISE_NW: {
    name: "WHIRLWIND_COUNTER_CLOCKWISE_NW",
    direction: Orientation.SOUTH,
    turn_direction: Orientation.SOUTH.left,
  },
  WHIRLWIND_COUNTER_CLOCKWISE_NE: {
    name: "WHIRLWIND_COUNTER_CLOCKWISE_NE",
    direction: Orientation.WEST,
    turn_direction: Orientation.WEST.left,
  },
};
