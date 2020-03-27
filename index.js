const express = require("express");
const path = require("path");
const socket = require("socket.io");
const storage = require("node-persist");
const hbs = require("express-handlebars");
const { generateThisMonthCalendar } = require("./helpers/calendar");
const app = express();

app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static("public"));

app.engine(
  "hbs",
  hbs({
    extname: "hbs",
    defaultLayout: "layout",
    layoutsDir: __dirname + "/views/layouts/"
  })
);

function getDaysArray(start, end) {
  const oneDay = 24 * 3600 * 1000;
  const days = [];

  for (let dt = start; dt <= end; dt += oneDay) {
    days.push(dt);
  }
  return days;
}

const TODAY = Date.now();
const THREE_WEEKS_FROM_TODAY = TODAY + 1000 * 60 * 60 * 24 * 21;

const todayObj = new Date(TODAY);
const threeWeeksFromTodayObj = new Date(THREE_WEEKS_FROM_TODAY);
const THIS_MONTH = todayObj.getMonth();
const MONTH_OF_THREE_WEEKS_FROM_TODAY = threeWeeksFromTodayObj.getMonth();
const TOTAL_MONTHS_IN_A_YEAR = 12;
const dates = {};

const normalizedTotalMonths =
  MONTH_OF_THREE_WEEKS_FROM_TODAY < THIS_MONTH
    ? MONTH_OF_THREE_WEEKS_FROM_TODAY + TOTAL_MONTHS_IN_A_YEAR
    : MONTH_OF_THREE_WEEKS_FROM_TODAY;

for (
  let i = THIS_MONTH, j = todayObj.getFullYear();
  i <= normalizedTotalMonths;
  i++, j++
) {
  console.log("j:", i);
  const monthName = new Date(
    2017,
    i % TOTAL_MONTHS_IN_A_YEAR,
    1
  ).toLocaleString(undefined, {
    month: "long"
  });

  // stop incrementing beyond the year of 3-weeks
  const year = Math.min(j, threeWeeksFromTodayObj.getFullYear());

  dates[`${monthName} ${year}`] = generateThisMonthCalendar(
    i % TOTAL_MONTHS_IN_A_YEAR,
    year
  );
}
console.log("dates:", dates);
// console.log("cacheDates:", generateThisMonthCalendar(4, 2020));

app.get("/", function(req, res, next) {
  res.render("index", {
    title: "Select a Date & Time",
    dates: ["1212", "33433"]
  });
});

const server = app.listen(4000, function() {
  console.log("listening to requests on port 4000");
});

// const io = socket(server);

// init();

// async function init() {
//   await storage.init(/* options ... */);
//   initSocket();
// }

// function initSocket() {
//   io.on("connection", function(client) {
//     client.on("join", async function(cb) {
//       const bids = await storage.getItem("name"); // yourname
//       console.log("bids:", bids);

//       cb(bids);
//     });

//     // listen to 'chat' emitted from client
//     client.on("chat", async function(cb) {
//       // then broadcast 'chat' along with data to all clients(including emitter) listening on 'chat' event
//       const bids = await storage.getItem("name"); // yourname

//       cb(bids);
//       // io.emit("chat", data);
//       // emit to other clients execept the emitter
//       // socket.broadcast.emit("chat", data);
//     });
//   });
// }
