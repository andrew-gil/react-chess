import Bishop from '../pieces/bishop.js';
import King from '../pieces/king.js';
import Knight from '../pieces/knight.js';
import Pawn from '../pieces/pawn.js';
import Queen from '../pieces/queen.js';
import Rook from '../pieces/rook.js';
import { getPlayerFromFEN, getSquaresFromFEN, setPlayerInFEN, getCastlesFromFEN, getEnPassantFromFEN, getHalfMoveClockFromFEN, getFullMoveClockFromFEN } from './fen-helpers.js';
import { generateValidMoves, generateFENFromState, coordToNotation} from './helper-functions.js';
import { isSameColumn } from './index.js';
import Tree from './tree.js'
import BotGame from '../components/bot-game.js';

//stockfish won't go for mate if they know that with perfect play, there is no checkmate. i want my bot to play aggressively if there is only 1-2 moves every turn that the opponent can make
//that won't immediately lose them the game (sharp mode)

/* 
How do chess engines work?
minimax:
stockfish uses an algorithm called minimax, where given a certain depth, the engine creates a tree of all the possible board states
after x number of moves. At the end depth, the game evaluates the position and evaluates the best one for itself. Going up the tree
one depth, they then calculate the best move for the opponent, which is the minimum number. At the next level they calculate max, and so on.

since the minimax tree grows exponentially, it is important to be able to prune it efficiently.
alpha-beta pruning:
starting from the top node, set alpha to negative infinity and beta to positive infinity
our requirement for pruning is if alpha >= beta
traverse the tree in order, while assigning a min or max goal to each level, alternating
if min, we are looking to see if a child of the node has an alpha or beta less than or equal to current beta
if max, we are looking to see if a child of the node has an alpha or beta greater than or equal to current alpha



The bot first evaluates the position of the board on a given turn
    Evaluation function example, formulated by Claude Shannon in 1949
    D,S,I is doubled, blocked, isolated pawns, and M is mobility (number of legal moves)
    f(p) = 200(K - k) + 9(Q - q) + 5(R-r) + 3(B-b) + 3(N-n) + 1(P-p) - 0.5(D-d + S-s + I-i) + 0.1(M-m)

    This evaluation function is flawed because it doesn't factor in who is to move

while humans will also typically evaluate kings safety, kings safety is evaluated by the minimax algorithm, not this static evaluation function
we can also evaluate threats, but hopefully the minimax algorithm handles that. I think the stockfish algorithm evaluates threats

My Personal Static Evaluation Function
Check if in opening, middlegame, or endgame

Material
    in open board situations, bishops are worth more than knights. In closed board situations, knights are worth more. if a board is easily openable, they are worth the same
    pawns closer to the center are worth more than pawns towards the edge
King Safety
    is your king checkable in one move
    are pieces around your king being attacked more or the same amount of ways they are being defended 
        (example: queen and bishop attacking a short castled king's pawn above the king, is being attacked more times than being defended)
Center control
    who has better control of the center four squares
Pawns
    blocked pawns is a negative
    if a pawn is doubled, that is only a negative to the pawn behind
    if a pawn is isolated, that is a negative
    if a pawn is passed, that is a positive
    if a pawn is isolated and 


Piece Protection
factor in threats, passed pawns, and make bishops worth more than knights in open board situations, whereas knights will be worth more than bishops in closed board situations

f(p) = 200(K - k) + 9(Q - q) + 5(R-r) + 3(B-b) + 3(N-n) + 1(P-p) - 0.5(D-d + S-s + I-i) + 0.1(M-m)

The chess bot looks at all possible board configurations after it has made a move
it assumes the opponent's perspective, and evaluates the best move possible for the opponent
it then 
*/

export function makeDecisionTree(givenFEN, givenDepth) {
    //tree is a class with constructor(parentNodeKey, value)
    //tree.insert(parentNodeKey, key, value)
    //BotGame is a working chess game, with handleClick(source, dest) modifying the state of the game
    //generateValidMoves(FEN, source) generates all possible moves a piece at source can make during a given board state
    const tree = new Tree("1", givenFEN);
    let nodes = [];
    let botGame = new BotGame(givenFEN);
    let size = 0;
    let maxSize = 100000;
    function makeTreeofAvailableMoves(FEN, depth, parent, tree) {
        if (depth === 0 || size > maxSize) {
            return;
        }
        const squares = getSquaresFromFEN(FEN);
        const player = getPlayerFromFEN(FEN);
        const promotionPieces = ['q','r','b','n']
        //make a decision tree, the root of which is your current board state
        let k = 1;
        for (let i = 0; i < squares.length; i++) {
            if (squares[i]) {
                if (squares[i].getPlayer() === player) {
                    const validMoves = generateValidMoves(FEN, i)
                    let p = 0
                    for (let j = 0; j < validMoves.length; j++) {
                        //there is a chance a valid move is generated which is not valid in the game. For example, an en passant which exposes your king to check.
                        //for pawn promotion, there are 4 possible outcomes, and the notation is for example a7a8q, a7a8r, ... 
                        //within bot game, we must run all four possible promotions
                        botGame.setStateFromFEN(FEN);
                        botGame.handleClick(i,validMoves[j],promotionPieces[p]);
                        const newFEN = botGame.returnFEN();
                        if (newFEN != FEN) {
                            //console.log(coordToNotation(i) + coordToNotation(validMoves[j]));
                            tree.insert(parent, parent + k, newFEN);
                            k++;
                            size++;
                            if (depth === 1) {
                                if (isPawnPromoting(i, validMoves[j], FEN)) {
                                    nodes.push(coordToNotation(i) + coordToNotation(validMoves[j]) + promotionPieces[p])
                                } else {
                                    nodes.push(coordToNotation(i) + coordToNotation(validMoves[j]))
                                }
                            }
                            makeTreeofAvailableMoves(newFEN, depth-1, parent+(k-1), tree);
                        }
                        if (isPawnPromoting(i, validMoves[j], FEN)) {
                            p++;
                            if (p < promotionPieces.length) {
                                j--
                            }
                        }
                    }
                }
            }
        }
    }
    makeTreeofAvailableMoves(givenFEN, givenDepth, "1", tree);
    return nodes;
    return tree;
}

function isPawnPromoting(source, dest, FEN) {
    const squares = getSquaresFromFEN(FEN);
    const player = getPlayerFromFEN(FEN);
    if (squares[source] instanceof Pawn) {
        if ((player === 1 && (dest >= 0 && dest < 8)) || (player === 2 && (dest >= 56 && dest < 64))) {
            return true
        }
    }
    return false
}

export function debugPerft() {
    let stock = {b2b3: 1,
        c2c3: 1,
        d2d3: 1,
        e2e3: 1,
        f2f3: 1,
        g2g3: 1,
        h2h3: 1,
        b2b4: 1,
        c2c4: 1,
        d2d4: 1,
        e2e4: 1,
        f2f4: 1,
        g2g4: 1,
        h2h4: 1,
        g1f3: 1,
        g1h3: 1,
        a3b1: 1,
        a3c4: 1,
        a3b5: 1,
        a1b1: 1};
    let mine = makeDecisionTree("rnbqkbnr/ppp1pppp/3p4/8/8/N7/PPPPPPPP/R1BQKBNR w KQkq - 0 2", 1)
    for (let key in mine) {
        if (key in stock) {
        } else {
            console.log(key)
        }
    }
}

/*
function makeTreeofAvailableMoves(FEN, depth, parent = "1", tree = new Tree("1", FEN)) {
    if (depth === 0) {
        return tree
    }
    const squares = getSquaresFromFEN(FEN);
    const player = getPlayerFromFEN(FEN);
    const opponent = player === 1 ? 2 : 1
    const castles = getCastlesFromFEN(FEN);
    const pawnBoost = getEnPassantFromFEN(FEN);
    const halfMoveClock = getHalfMoveClockFromFEN(FEN);
    const fullMoveClock = getFullMoveClockFromFEN(FEN);
    //make a decision tree, the root of which is your current board state
    let k = 1;
    let botGame = new BotGame(FEN);
    for (let i = 0; i < squares.length; i++) {
        if (squares[i]) {
            if (squares[i].getPlayer() === player) {
                const validMoves = generateValidMoves(FEN, i)
                for (let j = 0; j < validMoves.length; j++) {
                    botGame.setStateFromFEN(FEN);
                    botGame.handleClick(i,validMoves[j]);
                    const newFEN = botGame.returnFEN();
                    tree.insert(parent, parent + k, newFEN)
                    k++
                    makeTreeofAvailableMoves(newFEN, depth-1, parent+k, tree)
                }
            }
            
        }
    }
}
*/
//in theory the above function works for everything besides promotion, because handleclick handles castling and en passant

export function staticEvaluation(FEN) {
    const squares = getSquaresFromFEN(FEN)
    const player = getPlayerFromFEN(FEN)
    //[king, queen, rook, bishop, knight, pawn, doubled pawns, blocked pawns, isolated pawns, mobility]
    let whiteState = [0,0,0,0,0,0,0,0,0,0];
    let blackState = [0,0,0,0,0,0,0,0,0,0];
    //wCCfs stands for white column checked for stacked (pawns)
    let wCCfs = [];
    let bCCfs = [];
    for (let j = 0; j < 64; j++) {
        if (squares[j]) {
            if (squares[j].getPlayer() === 1) {
                whiteState[0] = squares[j] instanceof King ? whiteState[0]+1 : whiteState[0];
                whiteState[1] = squares[j] instanceof Queen ? whiteState[1]+1 : whiteState[1];
                whiteState[2] = squares[j] instanceof Rook ? whiteState[2]+1 : whiteState[2];
                whiteState[3] = squares[j] instanceof Bishop ? whiteState[3]+1 : whiteState[3];
                whiteState[4] = squares[j] instanceof Knight ? whiteState[4]+1 : whiteState[4];
                if (squares[j] instanceof Pawn) {
                    whiteState[5]++
                    //check if doubled and/or blocked
                    //a pawn is doubled if a pawn exists behind it
                    let checkForStack = true
                    for (let i = 0; i < wCCfs.length; i++) {
                        if (isSameColumn(j, wCCfs[i])) {
                            checkForStack = false
                        }
                    }
                    if (checkForStack) {
                        for(let i = j%8; i < 64; i+=8) {
                            if (squares[i]) {
                                if (squares[i] instanceof Pawn && squares[i].getPlayer() === 1 && i != j) {
                                    whiteState[6]++
                                }
                            }
                        }
                        wCCfs.push(j)
                    }
                    whiteState[7] = squares[j-8] ? whiteState[7]+1 : whiteState[7]
                    //a pawn is isolated if the columns next to it have no ally pawns
                    //Math.floor((j-1)/8) + (j-1)%8
                    let left = (j-1)%8
                    let right = (j+1)%8
                    let isIsolated = true
                    if (left !== 7) {
                        for(let i = left; i < 64; i+=8) {
                            if (squares[i]) {
                                if (squares[i] instanceof Pawn && squares[i].getPlayer() === 1) {
                                    isIsolated = false
                                }
                            }
                        }
                    }
                    if (right !== 0) {
                        for(let i = right; i < 64; i+=8) {
                            if (squares[i]) {
                                if (squares[i] instanceof Pawn && squares[i].getPlayer() === 1) {
                                    isIsolated = false
                                }
                            }
                        }
                    }
                    whiteState[8] = isIsolated ? whiteState[8]+1 : whiteState[8]
                }
                whiteState[9] += generateValidMoves(setPlayerInFEN(FEN, 1), j).length
            } else if (squares[j].getPlayer() === 2) {
                blackState[0] = squares[j] instanceof King ? blackState[0]+1 : blackState[0];
                blackState[1] = squares[j] instanceof Queen ? blackState[1]+1 : blackState[1];
                blackState[2] = squares[j] instanceof Rook ? blackState[2]+1 : blackState[2];
                blackState[3] = squares[j] instanceof Bishop ? blackState[3]+1 : blackState[3];
                blackState[4] = squares[j] instanceof Knight ? blackState[4]+1 : blackState[4];
                if (squares[j] instanceof Pawn) {
                    blackState[5]++
                    //check if doubled and/or blocked
                    //a pawn is doubled if a pawn exists behind it
                    let checkForStack = true
                    for (let i = 0; i < bCCfs.length; i++) {
                        if (isSameColumn(j, bCCfs[i])) {
                            checkForStack = false
                        }
                    }
                    if (checkForStack) {
                        for(let i = j%8; i < 64; i+=8) {
                            if (squares[i]) {
                                if (squares[i] instanceof Pawn && squares[i].getPlayer() === 2 && i != j) {
                                    blackState[6]++
                                }
                            }
                        }
                        bCCfs.push(j)
                    }
                    blackState[7] = squares[j+8] ? blackState[7]+1 : blackState[7]
                    //a pawn is isolated if the columns next to it have no ally pawns
                    //Math.floor((j-1)/8) + (j-1)%8
                    let left = (j-1)%8
                    let right = (j+1)%8
                    let isIsolated = true
                    if (left !== 7) {
                        for(let i = left; i < 64; i+=8) {
                            if (squares[i]) {
                                if (squares[i] instanceof Pawn && squares[i].getPlayer() === 2) {
                                    isIsolated = false
                                }
                            }
                        }
                    }
                    if (right !== 0) {
                        for(let i = right; i < 64; i+=8) {
                            if (squares[i]) {
                                if (squares[i] instanceof Pawn && squares[i].getPlayer() === 2) {
                                    isIsolated = false
                                }
                            }
                        }
                    }
                    blackState[8] = isIsolated ? blackState[8]+1 : blackState[8]
                }
                blackState[9] += generateValidMoves(setPlayerInFEN(FEN, 2), j).length
            }
        }
    }
    //we will calculate mobility for the player who is currently able to move. for the other player, we will calculate mobility 
    //now given the states of white and black, calculate evaluation
    //f(p) = 200(K - k) + 9(Q - q) + 5(R-r) + 3(B-b) + 3(N-n) + 1(P-p) - 0.5(D-d + S-s + I-i) + 0.1(M-m)
    console.log(whiteState)
    console.log(blackState)
    let evaluation = 9*(whiteState[1]-blackState[1]) + 5*(whiteState[2]-blackState[2]) + 3*(whiteState[3]-blackState[3]) + 3*(whiteState[4]-blackState[4]) + 1*(whiteState[5]-blackState[5]) - 0.5*(whiteState[6]-blackState[6]) - 0.5*(whiteState[7]-blackState[7]) - 0.5*(whiteState[8]-blackState[8])+ 0.1*(whiteState[9]-blackState[9]);
    evaluation = (whiteState[0] > blackState[0]) ? 1000 : evaluation
    evaluation = (whiteState[0] < blackState[0]) ? -1000 : evaluation
    return evaluation
}