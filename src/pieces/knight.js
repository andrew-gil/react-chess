import Piece from './piece.js';
import { isSameRow } from '../helpers'
import { coordToNotation } from '../helpers/helper-functions.js';

export default class Knight extends Piece {
  constructor(player) {
    super(player, (player === 1 ? "https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg" : "https://upload.wikimedia.org/wikipedia/commons/e/ef/Chess_ndt45.svg"));
    this.origin = true;
  }
  getPiece() {
    return "n"
  }
  hasNotMoved() {
    return this.origin;
  }
  hasMoved() {
    this.origin = false;
  }
  //function is flawed because it allows the knight to hop over borders on the board. For example, knight on b1 can go to h3
  //a possible solution is given the coordinate of the knight, make sure the dest coordinate cannot exceed two and one in row and column, or two and one in column adn row
  isKnightMoveLegal(src, dest) {
    const srcNot = coordToNotation(src);
    const destNot= coordToNotation(dest);
    const srcCol = this.letterToColumn(srcNot[0])
    const destCol = this.letterToColumn(destNot[0])
    const srcRow = Number(srcNot[1])-1
    const destRow = Number(destNot[1])-1
    if ((srcCol <= 1 && destCol >= 6) || (srcCol >= 6 && destCol <= 1) || (srcRow <= 1 && destRow >= 6) || (srcRow >= 6 && destRow <= 1)) {
      return false
    }
    return true
  }
  letterToColumn(letter) {
    const letters = ['a','b','c','d','e','f','g','h'];
    for (let i = 0; i < letters.length; i++) {
      if (letters[i] === letter) {
        return i
      }
    }
  }

  isMovePossible(src, dest) {
    if (!this.isKnightMoveLegal(src,dest)) {
      return false
    }
    return ((src - 17 === dest && !isSameRow(src, dest)) ||
      (src - 10 === dest && !isSameRow(src, dest)) ||
      (src + 6 === dest && !isSameRow(src, dest)) ||
      (src + 15 === dest && !isSameRow(src, dest)) ||
      (src - 15 === dest && !isSameRow(src, dest)) ||
      (src - 6 === dest && !isSameRow(src, dest)) ||
      (src + 10 === dest && !isSameRow(src, dest)) ||
      (src + 17 === dest && !isSameRow(src, dest)))
  }

  /**
   * always returns empty array because of jumping
   * @return {[]}
   */
  getSrcToDestPath() {
    return [];
  }
}
