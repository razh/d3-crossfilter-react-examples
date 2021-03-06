import _ from 'lodash';
import d3 from 'd3';
import crossfilter from 'crossfilter';
import React from 'react/addons';

import { randomGaussian } from './../data/random';

const store = (() => {
  const data = _.range( 256 ).map( i => [ i, randomGaussian() + 8 ] );

  // Initialize crossfilter dataset.
  const filter = crossfilter( data );

  // Create dimensions and groups.
  const index = filter.dimension( d => d[0] );
  const indexGroup = index.group().reduceSum( d => d[1] );
  const value = filter.dimension( d => d[1] );
  const valueGroup = value.group().reduceSum( d => d[1] );
  const index2D = filter.dimension( d => d );
  const index2DGroup = index2D.group();

  const charts = [];

  return {
    data,
    filter,
    index, indexGroup,
    value, valueGroup,
    index2D, index2DGroup,
    charts
  };
}) ();

function filterAll() {
  _.forEach([
    store.index,
    store.value,
    store.index2D
  ], dimension => dimension.filterAll() );
}

function redrawAll() {
  _.forEach( store.charts, chart => chart.redraw() );
}

const ChartMixin = {
  propTypes: {
    id: React.PropTypes.string.isRequired,
    dimension: React.PropTypes.object.isRequired,
    group: React.PropTypes.object.isRequired,
    yAccessor: React.PropTypes.func.isRequired
  },

  getDefaultProps() {
    return {
      margin: { top: 32, left: 32, bottom: 32, right: 32 },
      width: 320,
      height: 320,
      xAccessor: d => d.key
    };
  },

  onBrushEnd() {
    if ( this.chart.brush.empty() ) {
      this.props.dimension.filterAll();
      redrawAll();
    }
  }
};

const Chart = {
  create( el, margin, width, height, x, y ) {
    // margins have been subtracted from width and height.
    const svg = Chart.setSize( el, margin, width, height );
    const g = Chart.createGroup( svg, margin );

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

const LineChart = React.createClass({
  mixins: [ ChartMixin ],

  componentDidMount() {
    let {
      group,
      margin,
      width, height,
      x, y,
      xAccessor, yAccessor
    } = this.props;

    width = width - margin.left - margin.right;
    height = height - margin.top - margin.bottom;

    let all = group.all();

    x = x || d3.scale.linear()
      .domain( d3.extent( all, xAccessor ) )
      .range( [ 0, width ] );

    y = y || d3.scale.linear()
      .domain( d3.extent( all, yAccessor ) )
      .range( [ height, 0 ] );

    const line = d3.svg.line()
      .x( _.flow( xAccessor, x ) )
      .y( _.flow( yAccessor, y ) );

    const brush = d3.svg.brush()
      .x( x );

    const {
      g,
      xAxis, yAxis,
      xAxisGroup, yAxisGroup
    } = Chart.create( this.getDOMNode(), margin, width, height, x, y );

    xAxis.ticks( 6 );
    yAxis.ticks( 6 );

    const linePath = g.append( 'path' )
      .attr( 'class', 'line' );

    const brushGroup = g.append( 'g' )
      .attr( 'class', 'brush' )
      .call( brush );

    brushGroup.selectAll( 'rect' )
      .attr( 'height', height );

    function redraw() {
      all = group.all().filter( d => d.value );
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
      brush, brushGroup,
      redraw
    };

    store.charts.push( this.chart );

    brush
      .on( 'brush', this.onBrush )
      .on( 'brushend', this.onBrushEnd );
  },

  onBrush() {
    if ( this.chart.brush.empty() ) {
      this.props.dimension.filterAll();
    } else {
      const extent = this.chart.brush.extent();
      this.props.dimension.filter( extent );
    }

    redrawAll();
  },

  shouldComponentUpdate() {
    this.chart.redraw();
    return false;
  },

  render() {
    return <svg className='chart'>{this.props.children}</svg>;
  }
});

const BarChart = React.createClass({
  mixins: [ ChartMixin ],

  componentDidMount() {
    let {
      group,
      margin,
      width, height,
      x, y,
      xAccessor, yAccessor,
      padding
    } = this.props;

    width = width - margin.left - margin.right;
    height = height - margin.top - margin.bottom;
    padding = padding || 2;

    const all = group.all();

    x = x || d3.scale.linear()
      .domain( d3.extent( all, yAccessor ) )
      .range( [ 0, width ] );

    const histogram = d3.layout.histogram()
      .value( d => d.value )
      .bins( x.ticks( 24 ) );

    y = y || d3.scale.linear()
      .domain( [ 0, d3.max( histogram( all ), d => d.y ) ] )
      .range( [ height, 0 ] );

    const brush = d3.svg.brush()
      .x( x );

    const {
      g,
      xAxis, yAxis,
      xAxisGroup, yAxisGroup
    } = Chart.create( this.getDOMNode(), margin, width, height, x, y );

    xAxis.ticks( 6 );
    yAxis.ticks( 6 );

    let bars = g.append( 'g' )
      .attr( 'class', 'bars' )
      .selectAll( '.bar' );

    const brushGroup = g.append( 'g' )
      .attr( 'class', 'brush' )
      .call( brush );

    brushGroup.selectAll( 'rect' )
      .attr( 'height', height );

    function redraw() {
      const all = group.all().filter( d => d.value );

      xAxisGroup.call( xAxis );
      yAxisGroup.call( yAxis );

      bars = bars.data( histogram( all ) );

      bars.enter().append( 'rect' )
        .attr( 'class', 'bar' );

      bars
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
      brush, brushGroup,
      redraw
    };

    store.charts.push( this.chart );

    brush
      .on( 'brush', this.onBrush )
      .on( 'brushend', this.onBrushEnd );
  },

  onBrush() {
    if ( this.chart.brush.empty() ) {
      this.props.dimension.filterAll();
    } else {
      const extent = this.chart.brush.extent();
      this.props.dimension.filter( extent );
    }

    redrawAll();
  },

  shouldComponentUpdate() {
    this.chart.redraw();
    return false;
  },

  render() {
    return <svg className='chart'>{this.props.children}</svg>;
  }
});

const ScatterPlot = React.createClass({
  mixins: [ ChartMixin ],

  componentDidMount() {
    let {
      group,
      margin,
      width, height,
      x, y,
      xAccessor, yAccessor,
      radius
    } = this.props;

    width = width - margin.left - margin.right;
    height = height - margin.top - margin.bottom;
    radius = radius || 2;

    let all = group.all();

    x = x || d3.scale.linear()
      .domain( d3.extent( all, xAccessor ) )
      .range( [ 0, width ] );

    y = y || d3.scale.linear()
      .domain( d3.extent( all, yAccessor ) )
      .range( [ height, 0 ] );

    const plotX = _.flow( xAccessor, x );
    const plotY = _.flow( yAccessor, y );

    const brush = d3.svg.brush()
      .x( x )
      .y( y );

    const {
      g,
      xAxis, yAxis,
      xAxisGroup, yAxisGroup
    } = Chart.create( this.getDOMNode(), margin, width, height, x, y );

    xAxis.ticks( 6 );
    yAxis.ticks( 6 );

    let circles = g.append( 'g' )
      .selectAll( 'circle' );

    const brushGroup = g.append( 'g' )
      .attr( 'class', 'brush' )
      .call( brush );

    function redraw() {
      let all = group.all();

      xAxisGroup.call( xAxis );
      yAxisGroup.call( yAxis );

      circles = circles.data( all );

      circles.enter().append( 'circle' )
        .attr( 'r', radius );

      circles
        .attr( 'cx', plotX )
        .attr( 'cy', plotY );

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
      brush, brushGroup,
      redraw
    };

    store.charts.push( this.chart );

    brush
      .on( 'brush', this.onBrush )
      .on( 'brushend', this.onBrushEnd );
  },

  onBrush() {
    if ( this.chart.brush.empty() ) {
      this.props.dimension.filterAll();
    } else {
      const extent = this.chart.brush.extent();
      this.props.dimension.filterFunction( d => {
        return extent[0][0] <= d[0] && d[0] <= extent[1][0] &&
               extent[0][1] <= d[1] && d[1] <= extent[1][1];
      });
    }

    redrawAll();
  },

  render() {
    return <svg className='chart'>{this.props.children}</svg>;
  }
});

export default React.createClass({
  componentWillMount() {
    filterAll();
  },

  render() {
    return (
      <div>
        <div className='chart-group'>
          <LineChart
            id='line-chart'
            dimension={store.index}
            group={store.indexGroup}
            yAccessor={d => d.value}/>
        </div>

        <div className='chart-group'>
          <BarChart
            id='bar-chart'
            dimension={store.value}
            group={store.valueGroup}
            yAccessor={d => d.value}
            padding={2}/>
        </div>

        <div className='chart-group'>
          <ScatterPlot
            id='scatter-plot'
            dimension={store.index2D}
            group={store.index2DGroup}
            xAccessor={d => d.key[0]}
            yAccessor={d => d.key[1]}/>
        </div>
      </div>
    );
  }
});
