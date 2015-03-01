import _ from 'lodash';
import d3 from 'd3';
import React from 'react/addons';

function createChart( el, props ) {
  let { data, margin, width, height } = props;

  width = width - margin.left - margin.right;
  height = height - margin.top - margin.bottom;

  const xAccessor = ( d, i ) => i;
  const yAccessor = d => d;

  const x = d3.scale.linear()
    .domain( d3.extent( data, xAccessor ) )
    .range( [ 0, width ] );

  const y = d3.scale.linear()
    .domain( d3.extent( data, yAccessor ) )
    .range( [ height, 0 ] );

  const line = d3.svg.line()
    .x( _.flow( xAccessor, x ) )
    .y( _.flow( yAccessor, y ) );

  const svg = d3.select( el ).append( 'svg' )
    .attr( 'width', width + margin.left + margin.right )
    .attr( 'height', height + margin.top + margin.bottom );

  const g = svg.append( 'g' )
    .attr( 'transform', 'translate(' + margin.left + ',' + margin.top + ')' );

  g.append( 'path' )
    .datum( data )
    .attr( 'class', 'line' )
    .attr( 'd', line );
}

export default React.createClass({
  getDefaultProps() {
    return {
      data: [ 0, 7, 2, 1, 8 ],
      margin: { top: 48, left: 48, bottom: 48, right: 48 },
      width: 640,
      height: 320
    };
  },

  componentDidMount() {
    createChart( this.getDOMNode(), this.props );
  },

  shouldComponentUpdate() {
    createChart( this.getDOMNode(), this.props );
    return false;
  },

  render() {
    return <div>{this.props.children}</div>;
  }
});
