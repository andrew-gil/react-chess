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
import {staticEvaluation, makeTreeofAvailableMoves, makeDecisionTree, debugPerft} from '../helpers/chess-bot.js'
import { getCastlesFromFEN, getEnPassantFromFEN, getFullMoveClockFromFEN, getHalfMoveClockFromFEN, getPlayerFromFEN, getSquaresFromFEN } from '../helpers/fen-helpers';

export default class Game extends React.Component {
  constructor() {
    super();
    const FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"

    //add current FEN to list of states
    this.state = {
      squares: initialiseChessBoard(),
      whiteFallenSoldiers: [],
      blackFallenSoldiers: [],
      whiteHistory: [],
      blackHistory: [],
      player: 1,
      sourceSelection: -1,
      status: '',
      turn: 'white',
      prevState: null,
      pawnBoost: -1,
      pawnPromotingDest: -1,
      castles: [true,true,true,true],
      halfMoveClock: 0,
      fullMoveClock: 1,
      currentFEN: FEN,
      FENHistory: [],
      orientation: true,
      gameEnd: false
    }
    this.setStateFromFEN(FEN, [], [], [], [], this.state)
    //this.state.prevState = this.state
  }

  setStateFromFEN(FEN, whiteFallenSoldiers, blackFallenSoldiers, whiteHistory, blackHistory, prevState) {
    const player = getPlayerFromFEN(FEN)
    const opponent = player === 1 ? 2 : 1
    const castles = getCastlesFromFEN(FEN)
    const pawnBoost = getEnPassantFromFEN(FEN)
    const halfMoveClock = getHalfMoveClockFromFEN(FEN)
    const fullMoveClock = getFullMoveClockFromFEN(FEN)
    let turn = player ===  1 ? 'white' : 'black';
    var status = ''
    const FENRepetition = this.state.FENHistory.reduce(
      (accumulator, currentValue) => accumulator + (sliceBoardState(FEN) === sliceBoardState(currentValue) ? 1 : 0),
      0
    );
    var gameEnd = false
    if (FENRepetition > 2) {
      status = 'Draw, by 3 move repetition.'
      gameEnd = true
    }
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
    this.setState(oldState => ({
      sourceSelection: -1,
      squares: squares,
      whiteFallenSoldiers: [...oldState.whiteFallenSoldiers, ...whiteFallenSoldiers],
      blackFallenSoldiers: [...oldState.blackFallenSoldiers, ...blackFallenSoldiers],
      whiteHistory: [...oldState.whiteHistory, ...whiteHistory],
      blackHistory: [...oldState.blackHistory, ...blackHistory],
      player: player,
      status: status,
      turn: turn,
      prevState: prevState,
      pawnBoost: pawnBoost,
      pawnPromotingDest: -1,
      castles: castles,
      halfMoveClock: halfMoveClock,
      fullMoveClock: fullMoveClock,
      currentFEN: FEN,
      FENHistory: [...oldState.FENHistory, FEN],
      gameEnd: gameEnd
    }));
    
  }
  
  handleClick(i) {
    if (this.state.gameEnd) {
      return
    }
    let squares = [...this.state.squares];
    var guaranteedPromotion = false;
    if (this.state.pawnPromotingDest != -1) {
      //bug, make sure the chosen_piece is only one of the four options given
      if ((this.state.player == 1 && (i-this.state.pawnPromotingDest)%8===0 && (i <= this.state.pawnPromotingDest+24))
        || (this.state.player == 2 && (this.state.pawnPromotingDest-i)%8===0 && (i >= this.state.pawnPromotingDest-24))) {
        var chosen_piece = squares[i]
        squares = this.state.prevState.squares;
        squares[this.state.sourceSelection] = chosen_piece
        //reset to previous board, change the value of the pawn, and guarantee that isMovePossible runs without any code in between running
        //there is a bug with the go back button however, because even though we reset to previous board, the state is still set
        //so that the promotion options are on the board. Therefore, after promoting, if we go back one prevstate, we go back to promotion options
        //if we go back again, we go back to when our piece is promoted and on the board
        //if we go back again, we go to the enemy's turn after he has selected his piece (which isn't highlighted) but before he chose a destination
        //which is right before we promoted. 
        //after making it so after a promotion, the prevstate is set to the currentstate.prevstate, the back button now does nothing but
        //change the turn. After pressing it twice, we go back enemy's turn, where our pawn is back

        //note X23 that if we press go back once, and change the turn back to white, then try to click anywhere on the board (status is "choose destination"), it gives
        //typerror cannot read properties of null (reading 'style') on line X23
        //this is probably because sourceSelectionis set to an empty square, that probably being the original pawn location

        //effectively, we skipped the pawn promotion screen

        //after making it so the prevstate is set to currentstate.prevstate.prevstate, the back button now goes immediately back to enemys turn

        //prevstate history seems to be (newest to oldest)
        //pawn is promoted (white)
        //promotion options (white)
        //pawn is promoted (white)
        //pawn is on rank 7, black hasn't moved (black)

        

        //instead of having an unpromoted pawn in its proper place, we have a promoted pawn on the 8th rank as the third to recent state
        //if that was an unpromoted pawn, this state history would make sense
        //therefore, black moves, and before it moved, it is stored as a state
        //white goes to 8th rank, and the state before it moved is not stored, but the state after it moves is stored
        //then white 
        guaranteedPromotion = true;
        i = this.state.pawnPromotingDest;
      } else {
        this.setState({ status: "Wrong selection. Choose valid promotion piece" });
        return 
      }
      
    }

    if (this.state.sourceSelection === -1) {
      if (!squares[i] || squares[i].player !== this.state.player) {
        this.setState({ status: "Wrong selection. Choose player " + this.state.player + " pieces." });
        if (squares[i]) {
          squares[i].style = { ...squares[i].style, backgroundColor: "" };
        }
      }
      else {
        squares[i].style = { ...squares[i].style, backgroundColor: "RGB(111,143,114)" }; // Emerald from http://omgchess.blogspot.com/2015/09/chess-board-color-schemes.html
        //consider adding possible moves to the respective squares visually, in the form of dots or highlights. When trying to do this, I had difficulty setting the style of null
        //whether or not I modified squares or tried to access the square with document.getelementbyId. When trying to add dots, I realized I would have to rerender the board
        //in order to make the dots visually appear, as well as use a dot svg with the appropriate background size (45x45) and appropriate size. After making the move, i would have to
        //remove all dot objects, which would make my code unneccessarily complicated. The best thing to do would be to set styles of the buttons
        //useful information: if I comment out the setState, and click on a white piece, nothing happens, but if i then click on an invalid sourceselection, the original piece
        //i clicked gets highlighted. This means that on my initial click, squares[i].style was changed, but only rendered on the board once I triggered the above if statement,
        //where the state is set. Squares is modified in this else statement, and the style is kept until we make it to line X23, where the highlight is reset.

        //We can modify squares[i].style, and the board will show as long as we run this.setState. 
        //when we modify squares[i].style, board, which has each square's style set to null or this.props.squares[i], is having its style updated.
        const possibleMoves = generateValidMoves(this.state.currentFEN, i)
        for (let j = 0; j < possibleMoves.length; j++) {
          //console.log(squares[possibleMoves[j]])
          //document.getElementById("square"+possibleMoves[j]).style = { background: "transparent" };
        }
        
        
        this.setState({
          status: "Choose destination for the selected piece",
          sourceSelection: i
        })
        
      }
      return
    }

    //X23
    squares[this.state.sourceSelection].style = { ...squares[this.state.sourceSelection].style, backgroundColor: "" };

    if (squares[i] && squares[i].player === this.state.player) {
      this.setState({
        status: "Wrong selection. Choose valid source and destination again.",
        sourceSelection: -1,
      });
    }
    else {

      const whiteFallenSoldiers = [];
      const blackFallenSoldiers = [];
      var isMovePossible = squares[this.state.sourceSelection].isMovePossible(this.state.sourceSelection, i, squares);
      var isCheckMe = isCheckForPlayer(squares, this.state.player)
      //here we will implement the logic for en passant and castling
      var piece = squares[this.state.sourceSelection].getPiece()
      //if the player is trying to castle
      if (piece === "k" && !isCheckMe && (i === this.state.sourceSelection + 2 || i === this.state.sourceSelection - 2)) {
        isMovePossible = isValidCastle(squares, i, this.state.sourceSelection, this.state.player,
          this.state.castles)
      }
      var pawnPromoting = -1;
      if (piece == "p" && this.state.pawnPromotingDest == -1 ) {
        if (i == this.state.pawnBoost ) {
          isMovePossible = isValidEnPassant(squares, i, this.state.sourceSelection, this.state.player)
        }
        //check for pawn promotion
        if (this.state.player == 1) {
          if (i >= 0 && i < 8) {
            pawnPromoting = i
            //squares[pawnOrigin] = new Queen(1)
          }
        } else {
          if (i >= 56 && i < 64) {
            pawnPromoting = i
            //squares[pawnOrigin] = new Queen(2)
          }
        }
      }
      if (isMovePossible || guaranteedPromotion) {
        var pieceCaptured = false
        if (squares[i] !== null) {
          if (squares[i].player === 1) {
            whiteFallenSoldiers.push(squares[i]);
          }
          else {
            blackFallenSoldiers.push(squares[i]);
          }
          pieceCaptured = true
        }

        squares[i] = squares[this.state.sourceSelection];
        squares[this.state.sourceSelection] = null;

        isCheckMe = isCheckForPlayer(squares, this.state.player)

        if (isCheckMe) {
          this.setState(oldState => ({
            status: "Wrong selection. Choose valid source and destination again. Now you have a check!",
            sourceSelection: -1,
          }))
        } else {
          //if we get to this stage, the move is being made.
          if (pawnPromoting != -1) {
            //display the four options
            if (pawnPromoting >= 0 && pawnPromoting < 8) {
              squares[pawnPromoting] = new Queen(1)
              squares[pawnPromoting+8] = new Rook(1)
              squares[pawnPromoting+16] = new Knight(1)
              squares[pawnPromoting+24] = new Bishop(1)
            } else if (pawnPromoting >= 56 && pawnPromoting < 64) {
              squares[pawnPromoting] = new Queen(2)
              squares[pawnPromoting-8] = new Rook(2)
              squares[pawnPromoting-16] = new Knight(2)
              squares[pawnPromoting-24] = new Bishop(2)
            }
            this.setState(oldState => ({
              squares,
              status: "Select Promotion Piece",
              prevState: this.state,
              pawnPromotingDest: pawnPromoting,
            }))
            return
          }

          //we will generate a new FEN from (squares, player, wSC, wLC, bSC, bLC, pawnBoost, halfMoveClock, fullMoveClock)
          //using the new FEN, we will update the board state, along with variables (whiteFallenSoldiers, blackFallenSoldiers, whiteHistory, blackHistory)
          //here if the move is a pawn boost, record it into the FEN. also update halfmove clock here
          var halfMoveClock = 0
          var pawnBoost = -1
          if (squares[i].getPiece() === "p") {
            const pawnOrigin = this.state.sourceSelection;
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
              if (this.state.sourceSelection === 63) {
                castles[0] = false;
              } else if (this.state.sourceSelection === 56) {
                castles[1] = false;
              }
            } else {
              if (this.state.sourceSelection === 7) {
                castles[2] = false;
              } else if (this.state.sourceSelection === 0) {
                castles[2] = false;
              }
            }
          }
          let player = this.state.player === 1 ? 2 : 1;
          let turn = this.state.turn === 'white' ? 'black' : 'white';


          var newFEN = generateFENFromState(squares, 
            player, 
            castles,
            pawnBoost, 
            halfMoveClock, 
            player === 1 ? this.state.fullMoveClock+1 : this.state.fullMoveClock
          )
          console.log(newFEN)
          if (guaranteedPromotion) {
            this.setStateFromFEN(newFEN, whiteFallenSoldiers, blackFallenSoldiers, [], [], this.state.prevState)
          } else {
            this.setStateFromFEN(newFEN, whiteFallenSoldiers, blackFallenSoldiers, [], [], this.state)
          }
          
        }
      }
      else {
        this.setState({
          status: "Wrong selection. Choose valid source and destination again.",
          sourceSelection: -1,
        });
      }
    }
  }



  backButton() {
    this.setState(this.state.prevState); 
    this.setState({
      status: '',
      sourceSelection: -1
    })
  }

  setFENButton() {
    //in addition to setting the state, we must reset these values
    //whiteFallenSoldiers, blackFallenSoldiers, whiteHistory, blackHistory, FENHistory
    this.setStateFromFEN(document.getElementById("inputFEN").value, [], [], [], [], this.state)
    this.setState({
      whiteFallenSoldiers: [],
      blackFallenSoldiers: [],
      whiteHistory: [],
      blackHistory: [],
      currentFEN : document.getElementById("inputFEN").value,
      FENHistory: [document.getElementById("inputFEN").value],
    })
  }
  genFENButton() {
    //console.log(this.state.FENHistory[this.state.FENHistory.length-1])
    document.getElementById("generatedFEN").innerHTML = this.state.currentFEN;
    console.log(this.state.currentFEN)
  }
  /*
              <div className = "fallen-soldier-block">
              {<History
                whiteHistory = {this.state.whiteHistory}
                blackHistory = {this.state.blackHistory}
              />}
            </div> */
  //staticEvaluation(this.state.FENHistory[this.state.FENHistory.length-1])
  render() {
    return (
      <div>
        <div className="fallen-soldier-block-white">
          {<WhiteFallenSoldierBlock
            whiteFallenSoldiers={this.state.whiteFallenSoldiers}
          />
          }
        </div>
        <div className="game">
          <div className="game-board">
            <Board
              orientation = {this.state.orientation}
              squares={this.state.squares}
              onClick={(i) => this.handleClick(i)}
            />
          </div>
          <div className = "move-history">

          </div>
        </div>
        <div className="fallen-soldier-block-black">
          {<BlackFallenSoldierBlock
            blackFallenSoldiers={this.state.blackFallenSoldiers}
          />
          }
        </div>
        <div className="game-info">
            <h3>Turn {this.state.fullMoveClock}</h3>
            <div id="player-turn-box" style={{ backgroundColor: this.state.turn }}>
            </div>
            <button
              onClick = {() => this.backButton()}
              >
                go back
            </button>
        </div>
        <div className="game-status">{this.state.status}</div>
        <br/>
        <br/>
        <input type = "text" id = "inputFEN"></input>
        <button onClick = {() => this.setFENButton()}>
            set state from FEN
        </button>
        <br/>
        <br/>
        <button onClick = {() => this.genFENButton()}>
            generate FEN from boardState
        </button>
        <p id = "generatedFEN"></p>
        <br/>
        <br/>
        <button onClick = {() => this.setState({orientation: !this.state.orientation})}>
            flip board
        </button>
        <button onClick = {() => console.log('[...(makeDecisionTree("rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8", 1)).preOrderTraversal()].map(x => x.value)')}> check1</button>
        <button onClick = {() => console.log(makeDecisionTree(this.state.currentFEN, 3).length)}> check2</button>
        <button onClick = {() => console.log(makeDecisionTree("rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8", 3).length)}> check3</button>
        <div className = "application-information">
          <div className="icons-attribution">
            <div> <small> Chess Icons And Favicon (extracted) By en:User:Cburnett [<a href="http://www.gnu.org/copyleft/fdl.html">GFDL</a>, <a href="http://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA-3.0</a>, <a href="http://opensource.org/licenses/bsd-license.php">BSD</a> or <a href="http://www.gnu.org/licenses/gpl.html">GPL</a>], <a href="https://commons.wikimedia.org/wiki/Category:SVG_chess_pieces">via Wikimedia Commons</a> </small></div>
          </div>
          <ul>
            <li><a href="https://github.com/TalhaAwan/react-chess" target="_blank">Source Code</a> </li>
            <li><a href="https://www.techighness.com/post/develop-two-player-chess-game-with-react-js/">Blog Post</a></li>
          </ul>
          <div>
            TO DO, to make an actual chess game

            <li>implement move history</li>
            <li>implement pawn promotion DONE, but bug when going back moves</li>
            <li>implement engine</li>
            ------------------------------------
            <li>fixed pawn, knight, and getKingPosition, all bugged in original</li>
            <li>implement board flip DONE</li>
            <li>load position from FEN DONE</li>
            <li>implement go back moves DONE</li>
            <li>implement en passant DONE</li>
            <li>implement checkmate DONE</li>
            <li>implement stalemate DONE</li>
            <li>implement 3 move repetition DONE</li>
            <li>implement 50 half moves DONE</li>
            <li>implement castling DONE</li>
            <li>implement coordinates DONE</li>
            TO DO, for fun
            <li>ability to make custom boards</li>
            <li>make go back work on key press (back arrow)</li>
            <li>animation for piece movement</li>
          </div>
        </div>
      </div>
    );
  }
}

