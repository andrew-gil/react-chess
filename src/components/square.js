import React from 'react';

import '../index.css';

export default function Square(props) {

  if (props.fallen === "fallen") {
    return (
      <button className={props.shade + " " + props.fallen}
        onClick={props.onClick}
        style={props.style}
        key={props.keyVal}
      >
      </button>
    );
  } 
  else if (Number.isInteger(props.coordinate)) {
    return (
      <button className={"square " + props.shade + " numberCoord"+props.shade}
        onClick={props.onClick}
        style={props.style}
        key={props.keyVal}
      >
        {props.coordinate}
      </button>
    );
  } else if (props.coordinate == "a") {
    return (
      <button className={"square " + props.shade + " letterCoord"+props.shade}
        onClick={props.onClick}
        style={props.style}
        key={props.keyVal}
      >
        a
      </button>
    );
  } else if (props.coordinate) {
    return (
      <button className={"square " + props.shade + " letterCoord"+props.shade}
        onClick={props.onClick}
        style={props.style}
        key={props.keyVal}
      >
        {props.coordinate}
      </button>
    );
  } else {
    return (
      <button className={"square " + props.shade}
        onClick={props.onClick}
        style={props.style}
        key={props.keyVal}
      >
        {props.keyVal}
      </button>
    );
  }
  

}
