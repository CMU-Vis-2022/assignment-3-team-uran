import "./style.css";
import * as d3 from "d3";

import {lineChart} from "./line_charts";
import { Int32, Table, Utf8, Date_ } from "apache-arrow";
import { db } from "./duckdb";
import parquet from "./pittsburgh-air-quality.parquet?url";

const app = document.querySelector("#app")!;

// Create the chart. The specific code here makes some assumptions that may not hold for you.
const chart = lineChart();

// Load a Parquet file and register it with DuckDB. We could request the data from a URL instead.
const res = await fetch(parquet);
await db.registerFileBuffer(
  "pittsburgh-air-quality.parquet",
  new Uint8Array(await res.arrayBuffer())
);

// Query DuckDB for the locations.
const conn = await db.connect();

const station: Table<{ location: Utf8, count: Int32 }> = await conn.query(`
SELECT
  "Station name" AS location,
  count()::INT as count
FROM "pittsburgh-air-quality.parquet"
GROUP BY location
ORDER by count DESC`);

// Create a select element for the locations.
const select = d3.select(app).append("select");
for (const location of station) {
  const s = select.append("option").text(`${location.location} (${location.count})`).attr('value', location.location);
  if (location.location === "Avalon") {
    s.attr('selected', true)
  }
}

select.on("change", async () => {
  const location = select.property("value");

  console.log("Location:", location);

  update(location, false);
});

// Update the chart with the first location.
update("Avalon", false);

const count = d3.select(app).append("div");

// Add the chart to the DOM.
app.appendChild(chart.element);

async function update(
  station: string,
  isScatterPlot: boolean
)
{
  let airdata;
  let scatter;
  if (station === "All Stations") {
    airdata = await conn.query(`
    SELECT
      date_trunc('month', "Timestamp(UTC)") + to_days(15) as month,
      avg("US AQI")::FLOAT as averageaqi,
      quantile_cont("US AQI", 0.9) as nintyAvg,
      quantile_cont("US AQI", 0.1) as tenthAvg
    from "pittsburgh-air-quality.parquet" 
    GROUP BY month
    ORDER BY month `);

    scatter = await conn.query(`
    SELECT date as day, "US AQI"::FLOAT as aqi
    FROM "pittsburgh-air-quality.parquet"`);
  } else {
    airdata = await conn.query(`
    SELECT
      date_trunc('month', "Timestamp(UTC)") + to_days(15) as month,
      avg("US AQI")::FLOAT as averageaqi,
      quantile_cont("US AQI", 0.9) as nintyAvg,
      quantile_cont("US AQI", 0.1) as tenthAvg
    from "pittsburgh-air-quality.parquet" 
    WHERE "Station name" = '${station}'
    GROUP BY month
    ORDER BY month `);

    scatter = await conn.query(`
    SELECT "Timestamp(UTC)" as day, "US AQI"::FLOAT as aqi
    FROM "pittsburgh-air-quality.parquet"
    WHERE "Station name" = '${station}' `);
  }

  const size = scatter.numRows;
  count.text(`Number of records: ${size}`);

  chart.update(airdata, scatter, isScatterPlot);
}

app.appendChild(chart.element);
