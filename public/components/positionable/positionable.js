import React from 'react';
import $ from 'jquery';
import {move, resize, rotate, remove} from './interaction';
import './positionable.less';

export default React.createClass({
  componentDidMount() {
    const elem = $(this.refs.positionableWrapper);
    move(elem, {
      on: this.props.move
    });

    rotate(elem, {
      on: this.props.rotate,
      handle: '.rework--positionable-rotate-handle'
    });

    resize(elem, {
      on: this.props.resize,
      sides: {
        left:   '.rework--positionable-resize-nw, .rework--positionable-resize-sw, .rework--positionable-resize-w',
        top:    '.rework--positionable-resize-nw, .rework--positionable-resize-ne, .rework--positionable-resize-n',
        right:  '.rework--positionable-resize-ne, .rework--positionable-resize-se, .rework--positionable-resize-e',
        bottom: '.rework--positionable-resize-sw, .rework--positionable-resize-se, .rework--positionable-resize-s'
      }
    });
  },
  render() {
    const { children, position } = this.props;

    const newChildren = React.Children.map(children, (child) => {
      const newStyle = {
        position: 'absolute',
        transform: `rotate(${position.angle}deg)`,
        height: position.height,
        width: position.width,
        top: position.top,
        left: position.left
      };
      return (
        <div className="rework--positionable"
          ref="positionableWrapper"
          style={newStyle}>
          <div className="rework--positionable-actions">
            <div className="rework--positionable-action rework--positionable-rotate-handle">
              <i className="fa fa-undo rework--positionable-rotate-handle"></i>
            </div>
          </div>

          <div className="rework--positionable-resize rework--positionable-resize-nw"></div>
          <div className="rework--positionable-resize rework--positionable-resize-ne"></div>
          <div className="rework--positionable-resize rework--positionable-resize-se"></div>
          <div className="rework--positionable-resize rework--positionable-resize-sw"></div>
          <div className="rework--positionable-resize rework--positionable-resize-n"></div>
          <div className="rework--positionable-resize rework--positionable-resize-e"></div>
          <div className="rework--positionable-resize rework--positionable-resize-s"></div>
          <div className="rework--positionable-resize rework--positionable-resize-w"></div>

          {child}
        </div>
      );
    });

    return (
      <div>{newChildren}</div>
    );
  }
});
