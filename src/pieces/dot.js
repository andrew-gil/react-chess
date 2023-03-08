import Piece from './piece.js';
import { isSameRow, isSameColumn, isSameDiagonal, isPathClean } from '../helpers'

//remember to remove.origin and .hasnotmoved from each piece
export default class Dot extends Piece {
  constructor(player) {
    super(player, "https://upload.wikimedia.org/wikipedia/commons/1/11/BlackDot.svg");
  }

  isMovePossible() {
    return false;
  }
  getPiece() {
    return ""
  }
  getSrcToDestPath() {
    return null
  }
}
