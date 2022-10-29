import * as d3 from "d3";
import {Table} from "apache-arrow";
import { area, curveBasis } from "d3";
console.log(d3)

export function lineChart() {
  const margin = { top: 30, right: 0, bottom: 30, left: 50 };
  const width = document.body.clientWidth;
  const height = 300;

  //construct svg 
  const svg = d3
    .create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto; height: intrinsic;");

  //update the function
  function update(
    airdata: Table,
    scatter: Table,
    isScatterPlot: boolean
  ) {
    // clear old diagram
    svg.selectAll("*").remove();

    const Xdate = airdata
      .getChild("month")!
      .toJSON()
      .map((t: number) => new Date(t).getTime());
    const Xdate_scatter = scatter
      .getChild("day")!
      .toJSON()
      .map((t: number) => new Date(t).getTime());
    const Yfloat = airdata.getChild("averageaqi")!.toArray();
    const Yfloat10 = airdata.getChild("tenthAvg")!.toArray();
    const Yfloat90 = airdata.getChild("nintyAvg")!.toArray();
    const Yscatter = scatter.getChild("aqi")!.toArray();

    
    // making data into array
    const arrayXY = [];
    for (let i = 0; i < Yfloat.length; i++) {
      arrayXY.push({
        date: Xdate[i],
        day: Xdate_scatter[i],
        usaqi: Yfloat[i],
        aqi10: Yfloat10[i],
        aqi90: Yfloat90[i],
        aqi: Yscatter[i],
      });
    }

    const xRange = [margin.left, width - margin.right];
    const yRange = [margin.top, height - margin.bottom];

    // TODO: use the domain from the scatterplot data
    const xScale = d3.scaleUtc().range(xRange).domain(d3.extent(Xdate) as any);
    const yScale = d3.scaleLinear().range(yRange).domain([Math.max(...Yscatter), 0]);

    const Xaxis = d3.axisBottom(xScale).ticks(width / 80);
    const Yaxis = d3.axisLeft(yScale).tickSizeOuter(0);

    // data bindig to line chart svg elemets??
    svg.append("g")
      .call(Xaxis)
      .attr("class", "Xaxis")
      .attr("id", "linechart1")
      .attr("transform", "translate(0, " + (height - margin.bottom) + ")");
    svg.append("g")
      .call(Yaxis)
      .attr("class", "Yaxis")
      .attr("id", "linechart1")
      .attr("transform", `translate(${margin.left},0)`);

      //render the line
      const line = d3
        .line<any>()
        .curve(d3.curveLinear)
        .x((d) => xScale(d.date))
        .y((d) => yScale(d.usaqi));

      svg
      .append("path")
      .attr("class", "line_part1")
      .attr("fill", "none")
      .attr("stroke", "black")
      .attr("stroke-width", 1.5)
      .attr("d", line(arrayXY));

      //render the lineArea
      const lineArea = d3
        .area<any>()
        .curve(curveBasis)
        .x((d) => xScale(d.date))
        .y0((d) => yScale(d.aqi10))
        .y1((d) => yScale(d.aqi90));

      svg
      .append("path")
      .attr("class", "line_area")
      .attr("fill", "black")
      .attr("opacity", .2)
      .attr("stroke", "none")
      .attr("stroke-width", 0)
      .attr("d", lineArea(arrayXY));


      //render the points
      const scatterChart = svg.append("g").attr("fill", "steelblue");
      const I = arrayXY

      scatterChart
      .selectAll("circle")
      .data(I)
      .join("circle")
      .attr("cx", (d) => xScale(d.day))
      .attr("cy", (d) => yScale(d.aqi))
      .attr("r", 2);
      
  }
  return {
    element: svg.node()!,
    update
  };
}

