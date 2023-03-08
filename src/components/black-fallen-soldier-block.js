import React from 'react';

import '../index.css';
import Square from './square.js';

export default class BlackFallenSoldierBlock extends React.Component {

  renderSquare(square, i, squareShade) {
    return <Square
      key={i}
      keyVal={i}
      piece={square}
      style={square.style}
      fallen = "fallen"
    />
  }


  render() {
    return (
      <div>
        <div className="board-row fallen-soldier-col-black">{this.props.blackFallenSoldiers.map((bs, index) =>
          this.renderSquare(bs, index)
        )}</div>
      </div>
    );
  }
}

