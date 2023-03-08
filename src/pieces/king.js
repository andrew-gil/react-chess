import Piece from './piece.js';
import { isSameDiagonal, isSameRow } from '../helpers'

export default class King extends Piece {
  constructor(player) {
    super(player, (player === 1 ? "https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg" : "https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg"));
    this.initialPositions = {
      1: [60],
      2: [4]
    }
    this.origin = true;
  }

  hasNotMoved() {
    return this.origin;
  }
  hasMoved() {
    this.origin = false;
  }

  getPiece() {
    return "k"
  }

  isMovePossible(src, dest) {
    /*
    if (this.player === 1) {
      if ((dest === src + 2 || dest === src - 2) && this.origin && !isDestOccupied && !isDestPathOccupied) {
        return true
      }
    } else if (this.player == 2) {
      if ((dest === src + 2 || dest === src - 2) && this.origin && !isDestOccupied && !isDestPathOccupied) {
        return true
      }
    }
    */
    return ((src - 9 === dest && isSameDiagonal(src, dest)) ||
      src - 8 === dest ||
      (src - 7 === dest && isSameDiagonal(src, dest)) ||
      (src + 1 === dest && isSameRow(src, dest)) ||
      (src + 9 === dest && isSameDiagonal(src, dest)) ||
      src + 8 === dest ||
      (src + 7 === dest && isSameDiagonal(src, dest)) ||
      (src - 1 === dest && isSameRow(src, dest)))
  }

  /**
   * always returns empty array because of one step
   * @return {[]}
   */
  getSrcToDestPath(src, dest) {
    return [];
  }
}
