import React from 'react';
import {useEffect, useRef, useState} from 'react';
import '../index.css';
import Board from './board.js';
import King from '../pieces/king'
import Queen from '../pieces/queen'
import Bishop from '../pieces/bishop'
import Knight from '../pieces/knight'
import Rook from '../pieces/rook'
import Pawn from '../pieces/pawn'
import Dot from '../pieces/dot'
import BlackFallenSoldierBlock from './black-fallen-soldier-block.js';
import WhiteFallenSoldierBlock from './white-fallen-soldier-block.js';
import History from './history.js';
import initialiseChessBoard from '../helpers/board-initialiser.js';
import { generateFENFromState, NotationToCoord, sliceBoardState, isValidEnPassant, isValidCastle, isCheckForPlayer, isCheckmateForPlayer, isStalemate, generateValidMoves, getKingPosition} from '../helpers/helper-functions';
import {staticEvaluation} from '../helpers/chess-bot.js'
import { getCastlesFromFEN, getEnPassantFromFEN, getFullMoveClockFromFEN, getHalfMoveClockFromFEN, getPlayerFromFEN, getSquaresFromFEN } from '../helpers/fen-helpers';

export default class BotGame{
  constructor(FEN) {
    this.state = {
      squares: initialiseChessBoard(),
      player: 1,
      pawnBoost: -1,
      castles: [true,true,true,true],
      halfMoveClock: 0,
      fullMoveClock: 1,
      currentFEN: FEN,
      gameEnd: false
    }
    this.setStateFromFEN(FEN)
    //this.state.prevState = this.state
  }

  setStateFromFEN(FEN) {
    const player = getPlayerFromFEN(FEN)
    const opponent = player === 1 ? 2 : 1
    const castles = getCastlesFromFEN(FEN)
    const pawnBoost = getEnPassantFromFEN(FEN)
    const halfMoveClock = getHalfMoveClockFromFEN(FEN)
    const fullMoveClock = getFullMoveClockFromFEN(FEN)
    var status = ''
    var gameEnd = false
    if (halfMoveClock >= 50) {
      status = 'Draw, by 50 half moves.'
      gameEnd = true
    }
    const squares = getSquaresFromFEN(FEN)
    if (isCheckmateForPlayer(FEN)) {
      status = 'Checkmate! player ' + opponent + ' wins.'
      gameEnd = true
    } else if (isStalemate(FEN)) {
      status = 'Draw, by stalemate.'
      gameEnd = true
    }
    this.state = {
      squares: squares,
      player: player,
      pawnBoost: pawnBoost,
      castles: castles,
      halfMoveClock: halfMoveClock,
      fullMoveClock: fullMoveClock,
      currentFEN: FEN,
      gameEnd: gameEnd
    }
  }
  
  handleClick(sourceSelection, i, promotionPiece) {
    if (this.state.gameEnd) {
      return
    }
    let squares = [...this.state.squares];
    if (squares[i] && squares[i].getPlayer() === this.state.player) {
    }
    else {
      var isMovePossible = squares[sourceSelection].isMovePossible(sourceSelection, i, squares);
      var isCheckMe = isCheckForPlayer(squares, this.state.player)
      //here we will implement the logic for en passant and castling
      var piece = squares[sourceSelection].getPiece()
      //if the player is trying to castle
      if (piece === "k" && !isCheckMe && (i === sourceSelection + 2 || i === sourceSelection - 2)) {
        isMovePossible = isValidCastle(squares, i, sourceSelection, this.state.player,
          this.state.castles)
      }
      if (piece == "p") {
        if (i == this.state.pawnBoost ) {
          isMovePossible = isValidEnPassant(squares, i, sourceSelection, this.state.player)
        }
        //check for pawn promotion
        if (this.state.player == 1) {
          if (i >= 0 && i < 8) {
            if (promotionPiece === "q") {squares[sourceSelection] = new Queen(1);}
            if (promotionPiece === "r") {squares[sourceSelection] = new Rook(1);}
            if (promotionPiece === "b") {squares[sourceSelection] = new Bishop(1);}
            if (promotionPiece === "n") {squares[sourceSelection] = new Knight(1);}
          }
        } else {
          if (i >= 56 && i < 64) {
            if (promotionPiece === "q") {squares[sourceSelection] = new Queen(2);}
            if (promotionPiece === "r") {squares[sourceSelection] = new Rook(2);}
            if (promotionPiece === "b") {squares[sourceSelection] = new Bishop(2);}
            if (promotionPiece === "n") {squares[sourceSelection] = new Knight(2);}
          }
        }
      }
      if (isMovePossible) {
        var pieceCaptured = false
        if (squares[i] !== null) {
          pieceCaptured = true
        }
        squares[i] = squares[sourceSelection];
        squares[sourceSelection] = null;
        isCheckMe = isCheckForPlayer(squares, this.state.player)
        if (isCheckMe) {
        } else {
          var halfMoveClock = 0
          var pawnBoost = -1
          if (squares[i].getPiece() === "p") {
            const pawnOrigin = sourceSelection;
            if (i === pawnOrigin+16) {
              pawnBoost = i-8
              //console.log(pawnBoosted)
            } else if (i === pawnOrigin-16) {
              pawnBoost = i+8
            }
          } else if (!pieceCaptured) {
            halfMoveClock += this.state.halfMoveClock +1
          }
          //here if the move being made is a king or rook move, remove the respective castling rights
          var castles = this.state.castles;
          if (squares[i].getPiece() === "k") {
            if (this.state.player === 1) {
              castles[0] = false;
              castles[1] = false;
            } else {
              castles[2] = false;
              castles[3] = false
            }
          }
          if (squares[i].getPiece() === "r") {
            if (this.state.player === 1) {
              if (sourceSelection === 63) {
                castles[0] = false;
              } else if (sourceSelection === 56) {
                castles[1] = false;
              }
            } else {
              if (sourceSelection === 7) {
                castles[2] = false;
              } else if (sourceSelection === 0) {
                castles[2] = false;
              }
            }
          }
          let player = this.state.player === 1 ? 2 : 1;
          var newFEN = generateFENFromState(squares, 
            player, 
            castles,
            pawnBoost, 
            halfMoveClock, 
            player === 1 ? this.state.fullMoveClock+1 : this.state.fullMoveClock
          )
          //console.log("something")
          //console.log(newFEN)
          this.setStateFromFEN(newFEN)
        }
      }
      else {
        return
      }
    }
  }
  returnFEN() {
    return this.state.currentFEN;
  }
}

