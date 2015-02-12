import d3 from 'd3';
import React from 'react/addons';
import Line from './line';

export default React.createClass({
  render() {
    let { data, margin, width, height } = this.props;

    data = data || [ 0, 8, 2, 1, 7 ];
    margin = margin || { top: 48, left: 48, bottom: 48, right: 48 };
    width = ( width || 640 ) - margin.left - margin.right;
    height = ( height || 320 ) - margin.top - margin.bottom;

    const xAccessor = ( d, i ) => i;
    const yAccessor = d => d;

    const x = d3.scale.linear()
      .domain( d3.extent( data, xAccessor ) )
      .range( [ 0, width ] );

    const y = d3.scale.linear()
      .domain( d3.extent( data, yAccessor ) )
      .range( [ height, 0 ] );

    return (
      <svg
        width={width + margin.left + margin.right}
        height={height + margin.top + margin.bottom}>
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
