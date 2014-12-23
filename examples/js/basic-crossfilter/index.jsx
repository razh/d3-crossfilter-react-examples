import _ from 'lodash';
import d3 from 'd3';
import crossfilter from 'crossfilter';
import React from 'react/addons';

import { randomGaussian } from './../data/random';

var defaults = {
  margin: { top: 32, left: 32, bottom: 32, right: 32 },
  width: 320,
  height: 320,
  xAccessor: ( d, i ) => i
};

var store = (() => {
  var data = _.range( 256 ).map(() => {
    return {
      s: randomGaussian(),
      t: randomGaussian(),
      p: randomGaussian(),
      q: randomGaussian()
    };
  });

  var accessors = [
    d => d.s,
    d => d.t,
    d => d.p,
    d => d.q
  ];

  // Initialize crossfilter dataset.
  var filter = crossfilter( data );
  var dimensions = [];
  var groups = [];

  accessors.forEach( accessor => {
    var dimension = filter.dimension( ( d, i ) => i );
    dimensions.push( dimension );
    groups.push( dimension.group().reduceSum( accessor ) );
  });

  return {
    data,
    accessors,
    dimensions,
    groups
  };
}) ();

var ChartMixin = {
  propTypes: {
    id: React.PropTypes.string.isRequired,
    dimension: React.PropTypes.object.isRequired,
    group: React.PropTypes.object.isRequired,
    yAccessor: React.PropTypes.func.isRequired
  }
};

var Chart = {
  create( el, margin, width, height, x, y ) {
    // margins have been subtracted from width and height.
    var svg = Chart.setSize( el, margin, width, height );
    var g = Chart.createGroup( svg, margin );

    return {
      svg,
      g,
      xAxis: Chart.createXAxis( x ),
      yAxis: Chart.createYAxis( y ),
      xAxisGroup: Chart.createXAxisGroup( g, height ),
      yAxisGroup: Chart.createYAxisGroup( g )
    };
  },

  setSize( el, margin, width, height ) {
    return d3.select( el )
      .attr( 'width', width + margin.left + margin.right )
      .attr( 'height', height + margin.top + margin.bottom );
  },

  createGroup( svg, margin ) {
    return svg.append( 'g' )
      .attr( 'transform', 'translate(' + margin.left + ',' + margin.top + ')' );
  },

  createXAxis( x ) {
    return d3.svg.axis()
      .scale( x )
      .orient( 'bottom' );
  },

  createYAxis( y ) {
    return d3.svg.axis()
      .scale( y )
      .orient( 'left' );
  },

  createXAxisGroup( g, height ) {
    return g.append( 'g' )
      .attr( 'class', 'x axis' )
      .attr( 'transform', 'translate(0,' + height + ')' );
  },

  createYAxisGroup( g ) {
    return g.append( 'g' )
      .attr( 'class', 'y axis' );
  }
};

var LineChart = React.createClass({
  mixins: [ ChartMixin ],

  componentDidMount() {
    var {
      group,
      margin,
      width, height,
      x, y,
      xAccessor, yAccessor
    } = this.props;

    margin = margin || defaults.margin;
    width = ( width || defaults.width ) - margin.left - margin.right;
    height = ( height || defaults.height ) - margin.top - margin.bottom;

    xAccessor = xAccessor || defaults.xAccessor;

    var all = group.all();

    x = x || d3.scale.linear()
      .domain( d3.extent( all, xAccessor ) )
      .range( [ 0, width ] );

    y = y || d3.scale.linear()
      .domain( d3.extent( all, yAccessor ) )
      .range( [ height, 0 ] );

    var line = d3.svg.line()
      .x( _.compose( x, xAccessor ) )
      .y( _.compose( y, yAccessor ) );

    var brush = d3.svg.brush()
      .x( x );

    var {
      g,
      xAxis, yAxis,
      xAxisGroup, yAxisGroup
    } = Chart.create( this.getDOMNode(), margin, width, height, x, y );

    xAxis.ticks( 6 );
    yAxis.ticks( 6 );

    var linePath = g.append( 'path' )
      .attr( 'class', 'line' );

    var brushGroup = g.append( 'g' )
      .attr( 'class', 'brush' )
      .call( brush );

    brushGroup.selectAll( 'rect' )
      .attr( 'height', height );

    function redraw() {
      xAxisGroup.call( xAxis );
      yAxisGroup.call( yAxis );
      linePath.datum( all ).attr( 'd', line );
    }

    redraw();

    this.chart = {
      margin,
      width, height,
      x, y,
      xAxis, yAxis,
      xAccessor, yAccessor,
      xAxisGroup, yAxisGroup,
      line, linePath,
      brushGroup,
      redraw
    };
  },

  shouldComponentUpdate() {
    this.chart.redraw();
    return false;
  },

  render() {
    return <svg className='chart'>{this.props.children}</svg>;
  }
});

var BarChart = React.createClass({
  mixins: [ ChartMixin ],

  componentDidMount() {
    var {
      group,
      margin,
      width, height,
      x, y,
      xAccessor, yAccessor,
      padding
    } = this.props;

    margin = margin || defaults.margin;
    width = ( width || defaults.width ) - margin.left - margin.right;
    height = ( height || defaults.height ) - margin.top - margin.bottom;

    xAccessor = xAccessor || defaults.xAccessor;
    padding = padding || 2;

    var all = group.all();

    x = x || d3.scale.linear()
      .domain( d3.extent( all, yAccessor ) )
      .range( [ 0, width ] );

    var data = d3.layout.histogram()
      .value( d => d.value )
      .bins( x.ticks( 24 ) )
      ( all );

    y = y || d3.scale.linear()
      .domain( d3.extent( data, d => d.y ) )
      .range( [ height, 0 ] );

    var brush = d3.svg.brush()
      .x( x );

    var {
      g,
      xAxis, yAxis,
      xAxisGroup, yAxisGroup
    } = Chart.create( this.getDOMNode(), margin, width, height, x, y );

    xAxis.ticks( 6 );
    yAxis.ticks( 6 );

    var bars = g.append( 'g' )
      .attr( 'class', 'bars' )
      .selectAll( '.bar' );

    var brushGroup = g.append( 'g' )
      .attr( 'class', 'brush' )
      .call( brush );

    brushGroup.selectAll( 'rect' )
      .attr( 'height', height );

    function redraw() {
      xAxisGroup.call( xAxis );
      yAxisGroup.call( yAxis );

      bars = bars.data( data );

      bars.enter().append( 'rect' )
        .attr( 'class', 'bar' )
        .attr( 'x', d => x( d.x ) )
        .attr( 'y', d => y( d.y ) )
        .attr( 'width', d => x( d.dx + d.x ) - x( d.x ) - padding )
        .attr( 'height', d => height - y( d.y ) );

      bars.exit().remove();
    }

    redraw();

    this.chart = {
      margin,
      width, height,
      x, y,
      xAxis, yAxis,
      xAccessor, yAccessor,
      xAxisGroup, yAxisGroup,
      bars,
      padding,
      brushGroup,
      redraw
    };
  },

  shouldComponentUpdate() {
    this.chart.redraw();
    return false;
  },

  render() {
    return <svg className='chart'>{this.props.children}</svg>;
  }
});

var ScatterPlot = React.createClass({
  mixins: [ ChartMixin ],

  componentDidMount() {
    var {
      group,
      margin,
      width, height,
      x, y,
      xAccessor, yAccessor,
      radius
    } = this.props;

    margin = margin || defaults.margin;
    width = ( width || defaults.width ) - margin.left - margin.right;
    height = ( height || defaults.height ) - margin.top - margin.bottom;

    xAccessor = xAccessor || defaults.xAccessor;
    radius = radius || 2;

    var all = group.all();

    x = x || d3.scale.linear()
      .domain( d3.extent( all, xAccessor ) )
      .range( [ 0, width ] );

    y = y || d3.scale.linear()
      .domain( d3.extent( all, yAccessor ) )
      .range( [ 0, width ] );

    var plotX = _.compose( x, xAccessor );
    var plotY = _.compose( y, yAccessor );

    var brush = d3.svg.brush()
      .x( x )
      .y( y );

    var {
      g,
      xAxis, yAxis,
      xAxisGroup, yAxisGroup
    } = Chart.create( this.getDOMNode(), margin, width, height, x, y );

    xAxis.ticks( 6 );
    yAxis.ticks( 6 );

    var circles = g.append( 'g' )
      .selectAll( 'circle' );

    var brushGroup = g.append( 'g' )
      .attr( 'class', 'brush' )
      .call( brush );

    function redraw() {
      xAxisGroup.call( xAxis );
      yAxisGroup.call( yAxis );

      circles = circles.data( all );

      circles.enter().append( 'circle' )
        .attr( 'cx', plotX )
        .attr( 'cy', plotY )
        .attr( 'r', radius );

      circles.exit().remove();
    }

    redraw();

    this.chart = {
      margin,
      width, height,
      x, y,
      xAxis, yAxis,
      xAccessor, yAccessor,
      xAxisGroup, yAxisGroup,
      circles,
      radius,
      brushGroup,
      redraw
    };
  },

  render() {
    return <svg className='chart'>{this.props.children}</svg>;
  }
});

export default React.createClass({
  render() {
    var accessor = d => d.value;

    return (
      <div>
        <div className='chart-group'>
          {_.map( store.groups, ( group, i ) => {
            return <LineChart
              key={i}
              id={'line-chart-' + i}
              dimension={store.dimensions[i]}
              group={group}
              yAccessor={accessor}/>;
          })}
        </div>
        <div className='chart-group'>
          {_.map( store.groups, ( group, i ) => {
            return <BarChart
              key={i}
              id={'bar-chart-' + i}
              dimension={store.dimensions[i]}
              group={group}
              yAccessor={accessor}
              padding={2}/>;
          })}
        </div>
        <div className='chart-group'>
          {_.map( store.groups, ( group, i ) => {
            return <ScatterPlot
              key={i}
              id={'scatter-plot-' + i}
              dimension={store.dimensions[i]}
              group={group}
              yAccessor={accessor}/>;
          })}
        </div>
      </div>
    );
  }
});
