import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  OnChanges,
  ViewChild,
  ElementRef,
  Input
} from '@angular/core';
import * as d3 from 'd3';
import { MarketPrice } from '../market-price';

@Component({
  selector: 'app-market-chart',
  templateUrl: './market-chart.component.html',
  styleUrls: ['./market-chart.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MarketChartComponent implements OnChanges {
  @ViewChild('chart') chartElement: ElementRef;

  parseDate = d3.timeParse('%d-%m-%Y');

  @Input() marketStatus: MarketPrice[];

  private svgElement: HTMLElement;
  private chartProps: any;

  constructor() {}

  formatDate() {
    this.marketStatus.forEach(ms => {
      if (typeof ms.date === 'string') {
        ms.date = this.parseDate(ms.date);
      }
    });
  }

  buildChart() {
    this.chartProps = {};
    this.formatDate();

    // Set the dimension of the canvas / graph
    const margin = { top: 30, right: 20, bottom: 30, left: 50 };
    const width = 600 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;

    // Set the ranges
    this.chartProps.x = d3.scaleTime().range([0, width]);
    this.chartProps.y = d3.scaleLinear().range([height, 0]);

    // Define the axes
    const xAxis = d3.axisBottom(this.chartProps.x);
    const yAxis = d3.axisLeft(this.chartProps.y);

    // Define the line
    const valueline = d3
      .line<MarketPrice>()
      .x(d => {
        if (d.date instanceof Date) {
          return this.chartProps.x(d.date.getTime());
        }
      })
      .y(d => {
        console.log('Close Market');
        return this.chartProps.y(d.close);
      });

    // Define the line
    const valueline2 = d3
      .line<MarketPrice>()
      .x(d => {
        if (d.date instanceof Date) {
          return this.chartProps.x(d.date.getTime());
        }
      })
      .y(d => {
        console.log('Open Market');
        return this.chartProps.y(d.open);
      });

    const svg = d3
      .select(this.chartElement.nativeElement)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scale the range of the data
    this.chartProps.x.domain(
      d3.extent(this.marketStatus, d => {
        if (d.date instanceof Date) {
          return (d.date as Date).getTime();
        }
      })
    );
    this.chartProps.y.domain([
      0,
      d3.max(this.marketStatus, d => Math.max(d.close, d.open))
    ]);

    // Add the valueline2 path
    svg
      .append('path')
      .attr('class', 'line line2')
      .style('stroke', 'green')
      .style('fill', 'none')
      .attr('d', valueline2(this.marketStatus));

    // Add the valueline path
    svg
      .append('path')
      .attr('class', 'line line1')
      .style('stroke', 'black')
      .style('fill', 'none')
      .attr('d', valueline(this.marketStatus));

    // Add the X axis
    svg
      .append('g')
      .attr('class', 'x axis')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis);

    // Add the Y axis
    svg
      .append('g')
      .attr('class', 'Y axis')
      .call(yAxis);

    // Setting the required objects in chartProps so they could be used to update the chart
    this.chartProps.svg = svg;
    this.chartProps.valueline = valueline;
    this.chartProps.valueline2 = valueline2;
    this.chartProps.xAxis = xAxis;
    this.chartProps.yAxis = yAxis;
  }

  updateChart() {
    this.formatDate();

    // Scale the range of the data again
    this.chartProps.x.domain(
      d3.extent(this.marketStatus, d => {
        if (d.date instanceof Date) {
          return d.date.getTime();
        }
      })
    );

    this.chartProps.y.domain([
      0,
      d3.max(this.marketStatus, function(d) {
        return Math.max(d.close, d.open);
      })
    ]);

    // Select the section we want to apply our changes to
    this.chartProps.svg.transition();

    // Make the changes to the line chart
    this.chartProps.svg
      .select('.line.line1') // update the line
      .attr('d', this.chartProps.valueline(this.marketStatus));

    this.chartProps.svg
      .select('.line.line2') // update the line
      .attr('d', this.chartProps.valueline2(this.marketStatus));

    this.chartProps.svg
      .select('.x.axis') // update x axis
      .call(this.chartProps.xAxis);

    this.chartProps.svg
      .select('.y.axis') // update y axis
      .call(this.chartProps.yAxis);
  }

  ngOnChanges() {
    if (this.marketStatus && this.chartProps) {
      this.updateChart();
    } else if (this.marketStatus) {
      this.buildChart();
    }
  }
}
