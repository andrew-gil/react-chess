import Bishop from '../pieces/bishop.js';
import King from '../pieces/king.js';
import Knight from '../pieces/knight.js';
import Pawn from '../pieces/pawn.js';
import Queen from '../pieces/queen.js';
import Rook from '../pieces/rook.js';

import { NotationToCoord } from './helper-functions.js';


export function getSquaresFromFEN(FEN) {
    const squares = Array(64).fill(null);
    let i = 0
    let j = 0
    while (FEN[i] != " " && j < 64) {
      if (isNumber(FEN[i])) {
        j += Number(FEN[i])
      } else if (FEN[i] === "/") {
      } else {
        //this means this is a character
        if (FEN[i] === "K") {
          squares[j] = new King(1)
        } else if (FEN[i] === "Q") {
          squares[j] = new Queen(1)
        }else if (FEN[i] === "R") {
          squares[j] = new Rook(1)
        }else if (FEN[i] === "B") {
          squares[j] = new Bishop(1)
        }else if (FEN[i] === "N") {
          squares[j] = new Knight(1)
        }else if (FEN[i] === "P") {
          squares[j] = new Pawn(1)
        }else if (FEN[i] === "k") {
          squares[j] = new King(2)
        }else if (FEN[i] === "q") {
          squares[j] = new Queen(2)
        }else if (FEN[i] === "r") {
          squares[j] = new Rook(2)
        }else if (FEN[i] === "b") {
          squares[j] = new Bishop(2)
        }else if (FEN[i] === "n") {
          squares[j] = new Knight(2)
        }else if (FEN[i] === "p") {
          squares[j] = new Pawn(2)
        }
        j+=1
      }
      i+=1
    }
    return squares
}

function isNumber(char) {
    if (char === "1" || char === "2" || char == "3" || char === "4" || char === "5" || char === "6" || char === "7" || char === "8") {
      return true
    } else {
      return false
    }
  }

export function getPlayerFromFEN(FEN) {
    let i = 0
    while (FEN[i] != " ") {
      i++
    }
    i++
    
    let player = FEN[i] === "w" ? 1 : 0;
    player = FEN[i] === "b" ? 2 : player;
    return player
}

export function setPlayerInFEN(FEN, p) {
    let i = 0
    while (FEN[i] != " ") {
      i++
    }
    i++
    
    let player = p === 2 ? "b" : "w";

    let newFEN = FEN.slice(0,i) + player + FEN.slice(i+2, FEN.length);
    return newFEN
}

export function getCastlesFromFEN(FEN) {
    let i = 0
    while (FEN[i] != " ") {
      i++
    }
    i+=3;
    var whiteShortCastle = false
    var whiteLongCastle = false
    var blackShortCastle = false
    var blackLongCastle = false
    if (FEN[i] != "-") {
      let j = i
      while (FEN[j] != " ") {
        whiteShortCastle = FEN[j] === "K" ? true : whiteShortCastle
        whiteLongCastle = FEN[j] === "Q" ? true : whiteLongCastle
        blackShortCastle = FEN[j] === "k" ? true : blackShortCastle
        blackLongCastle = FEN[j] === "q" ? true : blackLongCastle
        j++
      }
    }
    return [whiteShortCastle, whiteLongCastle, blackShortCastle, blackLongCastle]
}

export function getEnPassantFromFEN(FEN) {
    let i = 0
    let numEmptySpaces = 0
    while (numEmptySpaces < 3 && i < FEN.length) {
      numEmptySpaces = FEN[i] === ' ' ? numEmptySpaces+1 : numEmptySpaces
      i++
    }
    //now i is at the enpasant field
    if (FEN[i] === '-') {
        return -1
    } else {
        return NotationToCoord(FEN[i] + FEN[i+1])
    }
}

export function getHalfMoveClockFromFEN(FEN) {
    let i = 0
    let numEmptySpaces = 0
    while (numEmptySpaces < 4 && i < FEN.length) {
      numEmptySpaces = FEN[i] === ' ' ? numEmptySpaces+1 : numEmptySpaces
      i++
    }
    //now i is at the halfmoveclock field
    var halfMoveString = ''
    while (FEN[i] != " ") {
      halfMoveString += FEN[i];
      i++;
    }
    const halfMoveClock = Number(halfMoveString)
    return halfMoveClock
}

export function getFullMoveClockFromFEN(FEN) {
    let i = 0
    let numEmptySpaces = 0
    while (numEmptySpaces < 5 && i < FEN.length) {
      numEmptySpaces = FEN[i] === ' ' ? numEmptySpaces+1 : numEmptySpaces
      i++
    }
    //now i is at the fullMoveClock field
    var fullMoveString = ''
    while (i < FEN.length) {
      fullMoveString += FEN[i];
      i++;
    }
    const fullMoveClock = Number(fullMoveString)
    return fullMoveClock
}