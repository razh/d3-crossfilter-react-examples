import d3 from 'd3';
import React from 'react/addons';
import Line from './line';

export default React.createClass({
  render() {
    var width = 640;
    var height = 320;
    var margin = { top: 48, left: 48, bottom: 48, right: 48 };

    var data = [ 0, 8, 2, 1, 7 ];

    var xAccessor = ( d, i ) => i;
    var yAccessor = d => d;

    var x = d3.scale.linear()
      .domain( d3.extent( data, xAccessor ) )
      .range( [ 0, width - margin.left - margin.right ] );

    var y = d3.scale.linear()
      .domain( d3.extent( data, yAccessor ) )
      .range( [ height - margin.top - margin.bottom, 0 ] );

    return (
      <svg width={width} height={height}>
        <g transform={'translate(' + margin.left + ',' + margin.top + ')'}>
          <Line
            data={data}
            x={x}
            y={y}
            xAccessor={xAccessor}
            yAccessor={yAccessor}/>
        </g>
      </svg>
    );
  }
});
