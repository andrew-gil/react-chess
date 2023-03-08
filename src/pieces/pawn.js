import Piece from './piece.js';
import { isSameDiagonal } from '../helpers'

export default class Pawn extends Piece {
  constructor(player) {
    super(player, (player === 1 ? "https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg" : "https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg"));
    this.initialPositions = {
      1: [48, 49, 50, 51, 52, 53, 54, 55],
      2: [8, 9, 10, 11, 12, 13, 14, 15]
    }
    this.origin = true
  }
  
  hasNotMoved() {
    return this.origin;
  }
  hasMoved() {
    this.origin = false;
  }
  getPlayer() {
    return this.player;
  }

  isMovePossible(src, dest, squares) {
    var isDestEnemyOccupied = squares[dest]
    if (this.player === 1) {
      //this if determines if a space one space ahead is occupied, or if they are starting at that position
      if ((dest === src - 8 && !isDestEnemyOccupied) || (dest === src - 16 && !isDestEnemyOccupied && !squares[src-8] && this.initialPositions[1].indexOf(src) !== -1)) {
        return true;
      }
      //this determines if a piece can be taken diagonally
      else if (isDestEnemyOccupied && isSameDiagonal(src, dest) && (dest === src - 9 || dest === src - 7)) {
        return true;
      }
      //en passant
      //to implement, get a move storage system so we can check if the last move made was a double pawn move
    }
    else if (this.player === 2) {
      if ((dest === src + 8 && !isDestEnemyOccupied) || (dest === src + 16 && !isDestEnemyOccupied && !squares[src+8]&& this.initialPositions[2].indexOf(src) !== -1)) {
        return true;
      }
      else if (isDestEnemyOccupied && isSameDiagonal(src, dest) && (dest === src + 9 || dest === src + 7)) {
        return true;
      }
    }
    return false;
  }
  
  getPiece() {
    return "p"
  }

  /**
   * returns array of one if pawn moves two steps, else returns empty array  
   * @param  {[type]} src  [description]
   * @param  {[type]} dest [description]
   * @return {[type]}      [description]
   */
  getSrcToDestPath(src, dest) {
    if (dest === src - 16) {
      return [src - 8];
    }
    else if (dest === src + 16) {
      return [src + 8];
    }
    return [];
  }
}
