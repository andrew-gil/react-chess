import React from 'react';

import '../index.css';
import Square from './square.js';

export default class Board extends React.Component {
  //style={this.props.squares[i] ? this.props.squares[i].style : null}
  //style={this.props.squares[i] ? this.props.squares[i].style : (squareShade === "light-square" ? {backgroundColor: "RGB(240, 217, 181)"} : {backgroundColor: "RGB(181, 136, 99)"})}
  renderSquare(i, squareShade, coordinate) {
    return <Square
      key={i}
      keyVal={i}
      style={this.props.squares[i] ? this.props.squares[i].style : this.props.squares[i]}
      shade={squareShade}
      coordinate = {coordinate}
      onClick={() => this.props.onClick(i)}
    />
  }

  render() {
    const board = [];
    const letters = ['a','b','c','d','e','f','g','h'];

    if (!this.props.orientation) {
      for (let i = 7; i >= 0; i--) {
        const squareRows = [];
        for (let j = 7; j >= 0; j--) {
          if (i == 0 && j == 7) {
              const squareShade = (isEven(i) && isEven(j)) || (!isEven(i) && !isEven(j)) ? "light-square" : "dark-square";
              squareRows.push(this.renderSquare((i * 8) + j, squareShade, letters[j]));
          } else if (i == 0) {
              const squareShade = (isEven(i) && isEven(j)) || (!isEven(i) && !isEven(j)) ? "light-square" : "dark-square";
              squareRows.push(this.renderSquare((i * 8) + j, squareShade, letters[j]));
          } else if (j == 7) {
              const squareShade = (isEven(i) && isEven(j)) || (!isEven(i) && !isEven(j)) ? "light-square" : "dark-square";
              squareRows.push(this.renderSquare((i * 8) + j, squareShade, (8-i)));
          } else {
              const squareShade = (isEven(i) && isEven(j)) || (!isEven(i) && !isEven(j)) ? "light-square" : "dark-square";
              squareRows.push(this.renderSquare((i * 8) + j, squareShade, null));
          }
        }
        board.push(<div className="board-row" key={i}>{squareRows}</div>)
      }
    } else {
      for (let i = 0; i < 8; i++) {
        const squareRows = [];
        for (let j = 0; j < 8; j++) {
          if (i == 7 && j == 0) {
              const squareShade = (isEven(i) && isEven(j)) || (!isEven(i) && !isEven(j)) ? "light-square" : "dark-square";
              squareRows.push(this.renderSquare((i * 8) + j, squareShade, letters[j]));
          } else if (i == 7) {
              const squareShade = (isEven(i) && isEven(j)) || (!isEven(i) && !isEven(j)) ? "light-square" : "dark-square";
              squareRows.push(this.renderSquare((i * 8) + j, squareShade, letters[j]));
          } else if (j == 0) {
              const squareShade = (isEven(i) && isEven(j)) || (!isEven(i) && !isEven(j)) ? "light-square" : "dark-square";
              squareRows.push(this.renderSquare((i * 8) + j, squareShade, (8-i)));
          } else {
              const squareShade = (isEven(i) && isEven(j)) || (!isEven(i) && !isEven(j)) ? "light-square" : "dark-square";
              squareRows.push(this.renderSquare((i * 8) + j, squareShade, null));
          }
        }
        board.push(<div className="board-row" key={i}>{squareRows}</div>)
      }
    }

    return (
      <div>
        {board}
      </div>
    );
  }
}


function isEven(num) {
  return num % 2 === 0
}