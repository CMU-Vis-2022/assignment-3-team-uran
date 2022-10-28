import * as d3 from "d3";

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
    X: Array<string>,
    Y: Array<string>,
    Y_ten: Array<string>,
    Y_ninety: Array<string>,
    scatter_usaqi: Array<string>,
    scatter_date: Array<string>,
    isScatter: boolean
  ) {


    // clear old diagram
    svg.selectAll("#line_part1").remove();
    svg.selectAll("#colorbox").remove();
    svg.selectAll("#scatterplot").remove();
    svg.selectAll("#linechart-mouseover").remove();
    console.log("Line Chart Boolean: ", isScatter);

    // map data to elements
    const Yfloat = Y.map(Number);
    const Yfloat10 = Y_ten.map(Number);
    const Yfloat90 = Y_ninety.map(Number);

    // mapping the date data and update
    const date = [];
    for (let i = 0; i < scatter_date.length; i++) {
      date.push(new Date(scatter_date[i]));
    }

    const Xdate: Date[] = [];
    for (let i = 0; i < X.length; i++) {
      Xdate.push(new Date(X[i]));
    }

    const Xnum: number[] = [];
    for (let i = 0; i < X.length; i++) {
      Xnum.push(new Date(X[i]).getTime());
    }
    
    // making data into array
    const arrayXY = [];
    for (let i = 0; i < Yfloat.length; i++) {
      arrayXY.push({
        date: Xdate[i],
        usaqi: Yfloat[i],
        aqi10: Yfloat10[i],
        aqi90: Yfloat90[i],
      });
    }


    // constructing x-y axis and scale
    const domain_min = new Date(Math.min.apply(null, Xnum));
    const domain_max = new Date(Math.max.apply(null, Xnum));
    const Xscale = d3.scaleTime()
      .domain([domain_min, domain_max])
      .range([margin.left, width - margin.right]);
    const Yscale = d3.scaleTime()
      .domain([domain_min, domain_max])
      .range([height - margin.bottom, margin.top]);
    const Xaxis = d3.axisBottom(Xscale);
    const Yaxis = d3.axisLeft(Yscale);

    // data bindig to svg elemets
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




  }
  return {
    element: svg.node()!,
  };
}

