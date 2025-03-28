/**
 * Represents the possible directions of a detected trading signal.
 *
 * @enum SIGNAL_DIRECTION
 * @property {number} NONE - No directional signal detected (neutral/no signal).
 * @property {number} BULLISH - Indicates an upward (bullish) directional signal.
 * @property {number} BEARISH - Indicates a downward (bearish) directional signal.
 * @property {number} BIDIRECTIONAL - Indicates that both bullish and bearish signals have been detected simultaneously, representing a bidirectional or mixed condition.
 */
export enum SIGNAL_DIRECTION {
  NONE = 0,
  BULLISH = 1,
  BEARISH = -1,
  BIDIRECTIONAL = 2
}
