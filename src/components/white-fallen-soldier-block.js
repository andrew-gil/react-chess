import React from 'react';

import '../index.css';
import Square from './square.js';

export default class WhiteFallenSoldierBlock extends React.Component {

  renderSquare(square, i, squareShade) {
    return <Square
      key={i}
      keyVal={i}
      piece={square}
      style={square.style}
      fallen="fallen"
    />
  }


  render() {
    return (
      <div>
        <div className="board-row fallen-soldier-col-white">
          {this.props.whiteFallenSoldiers.map((ws, index) => this.renderSquare(ws, index))}
          </div>
      </div>
    );
  }
}

