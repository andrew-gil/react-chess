import Bishop from '../pieces/bishop.js';
import King from '../pieces/king.js';
import Knight from '../pieces/knight.js';
import Pawn from '../pieces/pawn.js';
import Queen from '../pieces/queen.js';
import Rook from '../pieces/rook.js';

import { getCastlesFromFEN, getEnPassantFromFEN, getPlayerFromFEN, getSquaresFromFEN,  } from './fen-helpers.js';

export function generateFENFromState(squares, player, castles, pawnBoost, halfMoveClock, fullMoveClock) {
    let wSC = castles[0];
    let wLC = castles[1];
    let bSC = castles[2];
    let bLC = castles[3];
    let i = 0;
    let consecutiveEmpty = 0;
    var FEN = ""
    while (i < 64) {
        if (i%8 === 0 && i != 0) {
            if (consecutiveEmpty > 0) {
                FEN += consecutiveEmpty;
                consecutiveEmpty = 0
            }
            FEN += "/";
        }
        if (squares[i]) {
            if (consecutiveEmpty > 0) {
                FEN += consecutiveEmpty;
                consecutiveEmpty = 0
            }
            if (squares[i].getPlayer() === 1) {
                FEN+= checkPiece(squares[i], 1)
            }
            else if (squares[i].getPlayer() === 2) {
                FEN+= checkPiece(squares[i], 2)
            }
        } else {
            //this means this is empty square
            consecutiveEmpty++
        }
        i++
        }
    if (consecutiveEmpty > 0) {
        FEN+= consecutiveEmpty;
    }
    FEN += " "
    //now the squares have been processed
    FEN+= player=== 1 ? "w" : "b";
    FEN += " "
    if (!wSC && !wLC && !bSC && !bLC) {
        FEN+= "- "
    } else {
        FEN += wSC? "K" : "";
        FEN += wLC? "Q" : "";
        FEN += bSC? "k" : "";
        FEN += bLC? "q" : "";
        FEN += " ";
    }
    if (pawnBoost != -1){
      FEN += coordToNotation(pawnBoost) + " "
    } else {
      FEN += "- "
    }
    FEN += halfMoveClock + " " + fullMoveClock
    return FEN
}
export function checkPiece(square, player) {
    if (square) {
      if (square instanceof King) {
        return player === 1 ? "K" : "k"
      }
      if (square instanceof Queen) {
        return player === 1 ? "Q" : "q"
      }
      if (square instanceof Bishop) {
        return player === 1 ? "B" : "b"
      }
      if (square instanceof Knight) {
        return player === 1 ? "N" : "n"
      }
      if (square instanceof Rook) {
        return player === 1 ? "R" : "r"
      }
      if (square instanceof Pawn) {
        return player === 1 ? "P" : "p"
      }
    }
    return ""
}
  
export function NotationToCoord(notation) {
    //this function takes, for example, h8, and returns 63
    const letters = ['a','b','c','d','e','f','g','h'];
    var margin = 0
    for (let l = 0; l < letters.length; l++) {
      if (notation[0] === letters[l]) {
        margin = l
        break
      }
    }
    return (((8-notation[1])*8)) + margin
}
export function coordToNotation(coord) {
    //for 17, we want b6
    const letters = ['a','b','c','d','e','f','g','h'];
    //coord 0-7 is 8, coord 8-15 is 7, etc
    var row = 8 - Math.floor(coord/8)
    //coord - (Math.floor(coord/8)) * 8 = column
    //ex: 17 has row of 6. 17-16 = 1, letters[1] = b
    var column = letters[coord - (Math.floor(coord/8) * 8)]
    return column+row
}

export function sliceBoardState(FEN) {
  let i = FEN.length-1;
  let spaceCount = 0
  while (spaceCount < 2) {
    if (FEN[i] === " ") {
      spaceCount++
    }
    i--
  }
  return FEN.slice(0, i+1)
}

export function isValidEnPassant(squares, i, pawnOrigin, player) {
  //check en passant
  //to do en passant, the pawn must be 3 spaces above its origin, and the last move must have been a pawn next to him
  //if white, the pawn must be at the 5th rank (24-31). If black, the pawn must be at the 4th (32-39)
  if (player === 1) {
    if (pawnOrigin > 23 && pawnOrigin < 32) {
      if (Math.min(pawnOrigin+1, 31) === i+8 || Math.max(pawnOrigin-1, 24) === i+8) {
        squares[i] = squares[i+8]
        squares[i+8] = null
        return true
      }
      
    }
  } else {
    if (pawnOrigin > 31 && pawnOrigin < 40) {
      if (Math.min(pawnOrigin+1, 39) === i-8 || Math.max(pawnOrigin-1, 32) === i-8) {
        squares[i] = squares[i-8]
        squares[i-8] = null
        return true
      }
    }
  }
  return false
}

export function isValidCastle(squares, i, sourceSelection, player, possibleCastles) {
  //check if the move is a castle
  /*
  In order for a castle to be valid:
  1. the king must have not moved
  2. the rook must have not moved
  3. the path must be clear
  4. the two spaces the king moves through must be out of check
  5. the king cannot be in check 
  */
  //if all true, set isMovePossible Parameters as such, and move the rook
  //the above if() checks parameter 5
  if (((possibleCastles[0] && player === 1) || (possibleCastles[2] && player === 2)) && i === sourceSelection + 2) {
    //the above if checks parameter 1 and 2
    const isDestPathOccupied = Boolean(squares[i-1])
    const isDestOccupied = Boolean(squares[i])
    //if the path is empty for the king, check if either squares would be check
    if (!isDestOccupied && !isDestPathOccupied) {
      //the above if checks parameter 3
      //set new location
      const squareCopy = [...squares]
      squareCopy[i-1] = squareCopy[sourceSelection];
      //remove piece from source
      squareCopy[sourceSelection] = null;
      var isCheckMe = isCheckForPlayer(squareCopy, player)
      if (!isCheckMe) {
        //set new location
        squareCopy[i] = squareCopy[i-1];
        //remove piece from source
        squareCopy[i-1] = null;
        isCheckMe = isCheckForPlayer(squareCopy, player)
        if (!isCheckMe) {
          //after this if(), parameter 4 is fulfilled, making the castle valid
          //manually move the rook, if it exists and is a rook
          if (squares[sourceSelection+3] instanceof Rook && squares[sourceSelection+3].getPlayer() === player) {
            squares[sourceSelection+1] = squares[sourceSelection+3]
            squares[sourceSelection+3] = null
            return true
          }
          
        }
      }
    }
    return false
  } else if (((possibleCastles[1] && player === 1) || (possibleCastles[3] && player === 2)) && i === sourceSelection - 2) {
    //the above if checks parameter 2
    const isDestPathOccupied = Boolean(squares[i+1])
    const isDestOccupied = Boolean(squares[i])
    //if the path is empty for the king, check if either squares would be check
    if (!isDestOccupied && !isDestPathOccupied) {
      //the above if checks parameter 3
      //set new location
      const squareCopy = [...squares]
      squareCopy[i+1] = squareCopy[sourceSelection];
      //remove piece from source
      squareCopy[sourceSelection] = null;
      isCheckMe = isCheckForPlayer(squareCopy, player)
      if (!isCheckMe) {
        //set new location
        squareCopy[i] = squareCopy[i+1];
        //remove piece from source
        squareCopy[i+1] = null;
        isCheckMe = isCheckForPlayer(squareCopy, player)
        if (!isCheckMe) {
          //after this if(), parameter 4 is fulfilled, making the castle valid
          //reset the positions of the squares for the actual move, and manually move the rook
          if (squares[sourceSelection-4] instanceof Rook && squares[sourceSelection+3].getPlayer() === player) {
            squares[sourceSelection-1] = squares[sourceSelection-4]
            squares[sourceSelection-4] = null
            return true
          }
        }
      }
    }
    return false
  } else {
    return false
  }
}



export function getKingPosition(squares, player) {
  //this function doesn't recognize kings on 0, as 0 is considered a false value
  if (squares[0] && squares[0].getPlayer()===player) {
    if (squares[0] instanceof King) {
      return 0
    }
  }
  return squares.reduce((acc, curr, i) =>
    acc || //King may be only one, if we had found it, returned his position
    ((curr //current squre mustn't be a null
      && (curr.getPlayer() === player)) //we are looking for aspecial king 
      && (curr instanceof King)
      && i), // returned position if all conditions are completed
    null)
    
}

export function isCheckForPlayer(squares, player) {
  const opponent = player === 1 ? 2 : 1
  const playersKingPosition = getKingPosition(squares, player)
  const canPieceKillPlayersKing = (piece, i) => piece.isMovePossible(i, playersKingPosition, squares)
  return squares.reduce((acc, curr, idx) =>
    acc ||
    (curr &&
      (curr.getPlayer() === opponent) &&
      canPieceKillPlayersKing(curr, idx)
      && true),
    false)
}

export function moveIsNotCheck(squares, player, origin, dest) {
  var squaresCopy = [...squares];
  squaresCopy[dest] = squaresCopy[origin];
  squaresCopy[origin] = null;
  if (isCheckForPlayer(squaresCopy, player)) {
    return false
  }
  return true
}

export function generateValidMoves(FEN, i) {
  const player = getPlayerFromFEN(FEN);
  const squares = getSquaresFromFEN(FEN);
  //this returns all valid moves a piece on i can make given the board state
  /*you must not move so that you can be checked */
  if (!squares[i]) {
    return []
  } else if (squares[i].getPlayer() === player) {
    const opponent = player === 1 ? 2 : 1
    var piece = squares[i]
    if (piece instanceof King) {
      //check plus and minus 9, 8, 7, and 1
      var valid = [];
      var moves = [9,-9,8,-8,7,-7,1,-1]
      for (let j = 0; j < moves.length; j++) {
        if (i+moves[j] >= 0 && i+moves[j]<64) {
          if (squares[i+moves[j]]) {
            if (squares[i+moves[j]].getPlayer() != player) {
              if (moveIsNotCheck(squares, player, i, i+moves[j]) && piece.isMovePossible(i, i+moves[j])) {
                valid.push(i+moves[j])
              }
            }
          } else {
            if (moveIsNotCheck(squares, player, i, i+moves[j]) && piece.isMovePossible(i, i+moves[j])) {
              valid.push((i+moves[j]))
            }
          }
        } 
      }
      if (!isCheckForPlayer(squares,player)) {
        const castles = getCastlesFromFEN(FEN);
        for (let j = 0; j < castles.length; j++) {
          if (castles[j]) {
            //if j is 0 or 2, move is +2. If 1 or 3, move is -2
            //castling is the only move in the game that moves 2 pieces in one turn.
            //for our chess bot to process castling in a decision tree properly, we must clarify that these moves are castles.
            //we will give the index of the valid move, but negative.
            const castleMove = ((j+1)%2)===0 ? -2 : 2
            if (isValidCastle([...squares], i+castleMove, i, player, castles)) {
              valid.push(i+castleMove)
            }
          }
        }
      }
      return valid
    } else if (piece instanceof Queen) {
      //check for the first blockade. If it is the other player, you can take the square. If your own piece, you cannot move past
      //check ranks (horizontal), files(vertical), diagonals (NE and NW)
      var directions = [1, -1, 8, -8, 7, -7, 9, -9];
      var valid = [];
      for (let j = 0; j < directions.length; j++) {
        let loc = i;
        while (loc+directions[j] >= 0 && loc + directions[j] < 64) {
          if (squares[loc+directions[j]] != null) {
            //if the square is an opponent, that square is takeable
            if (squares[loc+directions[j]].getPlayer() == opponent) {
              if (moveIsNotCheck(squares, player, i, loc+directions[j]) && piece.isMovePossible(i, loc+directions[j], squares)) {
                valid.push(loc+directions[j])
              }
              break
            } else {
              //this means the square is not takeable, and movement in this direction has ended
              break
            }
          } else {
            //this means the square is empty and you are able to move onto it
            if (moveIsNotCheck(squares, player, i, loc+directions[j]) && piece.isMovePossible(i, loc+directions[j], squares)) {
              valid.push(loc+directions[j])
              loc += directions[j]
            } else {
              break
            }
          }
        }
      }
      return valid

    } else if (piece instanceof Rook) {
      var directions = [1, -1, 8, -8];
      var valid = [];
      for (let j = 0; j < directions.length; j++) {
        let loc = i;
        while (loc+directions[j] >= 0 && loc + directions[j] < 64) {
          if (squares[loc+directions[j]] != null) {
            //if the square is an opponent, that square is takeable
            if (squares[loc+directions[j]].getPlayer() == opponent) {
              if (moveIsNotCheck(squares, player, i, loc+directions[j]) && piece.isMovePossible(i, loc+directions[j], squares)) {
                valid.push(loc+directions[j])
              }
              break
            } else {
              //this means the square is not takeable, and movement in this direction has ended
              break
            }
          } else {
            //this means the square is empty and you are able to move onto it
            if (moveIsNotCheck(squares, player, i, loc+directions[j]) && piece.isMovePossible(i, loc+directions[j], squares)) {
              valid.push(loc+directions[j])
              loc += directions[j]
            } else {
              break
            }
          }
        }
      }
      return valid
    } else if (piece instanceof Bishop) {
      var directions = [7, -7, 9, -9];
      var valid = [];
      for (let j = 0; j < directions.length; j++) {
        let loc = i;
        while (loc+directions[j] >= 0 && loc + directions[j] < 64) {
          if (squares[loc+directions[j]] != null) {
            //if the square is an opponent, that square is takeable
            if (squares[loc+directions[j]].getPlayer() == opponent) {
              if (moveIsNotCheck(squares, player, i, loc+directions[j]) && piece.isMovePossible(i, loc+directions[j], squares)) {
                valid.push(loc+directions[j])
              }
              break
            } else {
              //this means the square is not takeable, and movement in this direction has ended
              break
            }
          } else {
            //this means the square is empty and you are able to move onto it
            if (moveIsNotCheck(squares, player, i, loc+directions[j]) && piece.isMovePossible(i, loc+directions[j], squares)) {
              valid.push(loc+directions[j])
              loc += directions[j]
            } else {
              break
            }
          }
        }
      }
      return valid
    } else if (piece instanceof Knight) {
      var valid = [];
      var moves = [17, -17, 15, -15, 10, -10, 6, -6]
      for (let j = 0; j < moves.length; j++) {
        if (i+moves[j] >= 0 && i+moves[j]<64) {
          if(squares[i+moves[j]]) {
            if (squares[i+moves[j]].getPlayer() != player) {
              if (moveIsNotCheck(squares, player, i, i+moves[j]) && piece.isMovePossible(i, i+moves[j])) {
                valid.push(i+moves[j])
              }
            }
          } else {
            if (moveIsNotCheck(squares, player, i, i+moves[j]) && piece.isMovePossible(i, i+moves[j])) {
              valid.push(i+moves[j])
            }
          }

        } 
      }
      return valid
    } else if (piece instanceof Pawn) {
      var valid = [];
      var moves = [-7,-8,-9,-16];
      if (player === 2) {
        moves[0] = 7;
        moves[1] = 8;
        moves[2] = 9;
        moves[3] = 16;
      }
      for (let j = 0; j < moves.length; j+=2) {
        if (squares[i+moves[j]]) {
          if (squares[i+moves[j]].getPlayer() == opponent) {
            if (moveIsNotCheck(squares, player, i, i+moves[j]) && piece.isMovePossible(i,i+moves[j],squares)) {
              valid.push(i+moves[j])
            }
          }
        } else if (i+moves[j] === getEnPassantFromFEN(FEN)) {
          if (isValidEnPassant([...squares], i+moves[j], i, player) && moveIsNotCheck(squares, player, i, i+moves[j])) {
            //if en passant, the square is taken. Make sure taking a pawn does not expose your king to check, which this does not do because it does not remove the pawn from the board.
            valid.push(i+moves[j])
          }
        }
      }
      for (let j = 1; j < moves.length; j+=2) {
        if (piece.isMovePossible(i,i+moves[j],squares) && moveIsNotCheck(squares, player, i, i+moves[j])) {
          valid.push(i+moves[j])
        }
      }
      
      return valid
    } 
  }
  //this means the piece on the square is not the right color piece
  return []
}

export function isCheckmateForPlayer(FEN) {
  /*
  Our approach will be to calculate every possible move our player can make, with every piece.
  If none of those moves can get you out of check, this is checkmate
  To determine if every possible move has been tested, we test each spot on the board for a piece, and check every move for that piece
   */
  const squares = getSquaresFromFEN(FEN);
  const player = getPlayerFromFEN(FEN)
  if (isCheckForPlayer(squares,player)) {
    const opponent = player === 1 ? 2 : 1
    for(var i = 0; i < 64; i++) {
      if (squares[i] != null) {
        if (squares[i].getPlayer() == player) {
          if (generateValidMoves(FEN, i).length != 0) {
            //console.log(i)
            //console.log(generateValidMoves(FEN, i))
            return false
          }
        }
      }
    }
    //once we've checked every square and the return is not done, it means there are no valid moves
    return true
  } else {
    return false;
  }
}

export function isStalemate(FEN) {
  const squares = getSquaresFromFEN(FEN);
  if (isCheckForPlayer(squares, 1) || isCheckForPlayer(squares, 2)) {
    return false
  }
  //the reduce function stops running once it encounters a single generateValidMoves that contains valid moves
  return squares.reduce(
    (acc, curr, idx) => acc && (curr ? !(generateValidMoves(FEN, idx).length != 0) : true),
    true
  );
}