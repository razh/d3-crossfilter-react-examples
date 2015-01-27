import _ from 'lodash';
import d3 from 'd3';
import React from 'react/addons';

export default React.createClass({
  getDefaultProps() {
    var line = d3.svg.line();
    return {
      data: [],
      // d3 line properties.
      line,
      x: line.x(),
      y: line.y(),
      defined: line.defined(),
      interpolate: line.interpolate(),
      tension: line.tension(),
      // Accessors.
      xAccessor: _.identity,
      yAccessor: _.identity
    };
  },

  shouldComponentUpdate( nextProps ) {
    return nextProps.data !== this.props.data;
  },

  render() {
    var {
      data,
      line,
      x,
      y,
      defined,
      interpolate,
      tension,
      xAccessor,
      yAccessor
    } = this.props;

    line
      .x( _.flow( xAccessor, x ) )
      .y( _.flow( yAccessor, y ) )
      .defined( defined )
      .interpolate( interpolate )
      .tension( tension );

    return <path className='line' d={line( data )}/>;
  }
});
