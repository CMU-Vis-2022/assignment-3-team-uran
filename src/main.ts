import "./style.css";
import * as d3 from "d3";

import { barChart } from "./bar-chart";
import {lineChart} from "./Line_charts";
import { Int32, Table, Utf8 } from "apache-arrow";
import { db } from "./duckdb";
import parquet from "./pittsburgh-air-quality.parquet?url";

const app = document.querySelector("#app")!;

// Create the chart. The specific code here makes some assumptions that may not hold for you.
const chart = barChart();

async function update(station: string) {
  // Query DuckDB for the data we want to visualize.
  const data: Table<{ time: Utf8; aqi: Int32 }> = await conn.query(`
SELECT
"Station name" AS Station,
avg("US AQI") AS aqi,
DATE_TRUNC('month',"Timestamp(UTC)") + INTERVAL'14 days' AS time,
FROM "pittsburgh-air-quality.parquet"
WHERE "Station name" = '${station}'
GROUP BY "Station name", time`);

console.log(data)

  // Get the X and Y columns for the chart. Instead of using Parquet, DuckDB, and Arrow, we could also load data from CSV or JSON directly.
  const X = data.getChild("time")!.toArray();
  const Y = data
    .getChild("aqi")!
    .toJSON()
    .map((d) => `${d}`);

  chart.update(X, Y);
}

// Load a Parquet file and register it with DuckDB. We could request the data from a URL instead.
const res = await fetch(parquet);
await db.registerFileBuffer(
  "pittsburgh-air-quality.parquet",
  new Uint8Array(await res.arrayBuffer())
);

// Query DuckDB for the locations.
const conn = await db.connect();

const station: Table<{ station: Utf8 }> = await conn.query(`
SELECT DISTINCT "Station name"
FROM "pittsburgh-air-quality.parquet"`);

// Create a select element for the locations.
const select = d3.select(app).append("select");
for (const location of station) {
  select.append("option").text(location.location);
}

select.on("change", async () => {
  const location = select.property("value");

  update(location);
});

// Update the chart with the first location.
update("Avalon");

// Add the chart to the DOM.
app.appendChild(chart.element);


const line_chart = lineChart();

async function updateLineChart(
  Station: string,
  isScatterPlot: boolean
)
{
  const station_name = Station.split(" ");
  const station_items = station_name.splice(-1);
  let station_items_string = station_items[0];
  station_items_string = station_items_string.replace("(", "");
  station_items_string = station_items_string.replace(")", "");
  station_items_string = "Number of Records:" + station_items_string;
  d3.select("#station_item").text(station_items_string);

  const finalStation = station_name.join(" ");

  let airdata;
  let ninetyPercentile;
  let tenthPercentile;
  let scatter;
  if (finalStation === "All Stations") {
    airdata = await conn.query(`
    SELECT date_trunc('month', date) + to_days(15) as month, avg(usaqi)::FLOAT as averageaqi
    from parquet 
    GROUP BY date_trunc('month', date) + to_days(15)
    ORDER BY date_trunc('month', date) + to_days(15) `);

    ninetyPercentile = await conn.query (`
    SELECT date_trunc('month', date) + to_days(15) as month, quantile_cont(usaqi, 0.9) as nintyAvg
    from parquet 
    GROUP BY date_trunc('month', date) + to_days(15)
    ORDER BY date_trunc('month', date) + to_days(15) `);

    tenthPercentile = await conn.query (`
    SELECT date_trunc('month', date) + to_days(15) as month, quantile_cont(usaqi, 0.1) as tenthAvg
    from parquet 
    GROUP BY date_trunc('month', date) + to_days(15)
    ORDER BY date_trunc('month', date) + to_days(15) `);

    scatter = await conn.query(`
    SELECT date_trunc('day', date) as day, usaqi::FLOAT as aqi
    FROM parquet`);
  }
  else {
    airdata = await conn.query(`
    SELECT date_trunc('month', date) + to_days(15) as month, avg(usaqi)::FLOAT as averageaqi
    from parquet 
    WHERE station_name = '${finalStation}'
    GROUP BY date_trunc('month', date) + to_days(15)
    ORDER BY date_trunc('month', date) + to_days(15) `);

    ninetyPercentile = await conn.query (`
    SELECT date_trunc('month', date) + to_days(15) as month, quantile_cont(usaqi, 0.9) as nintyAvg
    from parquet 
    WHERE station_name = '${finalStation}'
    GROUP BY date_trunc('month', date) + to_days(15)
    ORDER BY date_trunc('month', date) + to_days(15) `);

    tenthPercentile = await conn.query (`
    SELECT date_trunc('month', date) + to_days(15) as month, quantile_cont(usaqi, 0.1) as tenthAvg
    from parquet 
    WHERE station_name = '${finalStation}'
    GROUP BY date_trunc('month', date) + to_days(15)
    ORDER BY date_trunc('month', date) + to_days(15) `);

    scatter = await conn.query(`
    SELECT date_trunc('day', date) as day, usaqi::FLOAT as aqi
    FROM parquet
    WHERE station_name = '${finalStation}' `);
  }

}
app.appendChild(line_chart.element);
