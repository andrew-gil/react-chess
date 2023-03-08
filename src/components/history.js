import React from 'react';

import '../index.css';
import FallenSoldierBlock from './black-fallen-soldier-block';
import Square from './square.js';

export default class History extends React.Component {
  coordToNotation(coord) {
    //for 17, we want b6
    const letters = ['a','b','c','d','e','f','g','h'];
    //coord 0-7 is 8, coord 8-15 is 7, etc
    var row = 8 - Math.floor(coord/8)
    //coord - (Math.floor(coord/8)) * 8 = column
    //ex: 17 has row of 6. 17-16 = 1, letters[1] = b
    var column = letters[coord - (Math.floor(coord/8) * 8)]
    return column+row
  }
  //{piece + this.coordToNotation(coord)}
  renderHistorySquare(move, i, color) {
    if (move.length == 2) {
      var piece = ""
      var coord = move
    } else {
      var piece = move[0]
      var coord = move.slice(1, move.length)
    }
    return (
      <button className={"square " + "hsquare" + color}
        key={i}
      >
        {piece + this.coordToNotation(coord)}
      </button>
    );
  }
  render() {
    return (
      <div>
        <div className="history-row">{this.props.whiteHistory.map((ws, index) =>
          this.renderHistorySquare(ws, index, "white")
        )}</div>
        <div className="history-row">{this.props.blackHistory.map((bs, index) =>
          this.renderHistorySquare(bs, index, "black")
        )}</div>
      </div>
    );
  }

}

