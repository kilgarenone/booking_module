const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);

const path = require("path");
const socket = require("socket.io");
const storage = require("node-persist");
const hbs = require("express-handlebars");
const { generateThisMonthCalendar } = require("./helpers/calendar");

app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static("public"));

app.engine(
  "hbs",
  hbs({
    extname: "hbs",
    defaultLayout: "layout",
    helpers: require("./helpers/hbs"),
    layoutsDir: __dirname + "/views/layouts/"
  })
);

function buildCalendar() {
  const TODAY = Date.now();
  const THREE_WEEKS_FROM_TODAY = TODAY + 1000 * 60 * 60 * 24 * 22;

  const todayObj = new Date(TODAY);
  todayObj.setHours(0, 0, 0, 0);
  const threeWeeksFromTodayObj = new Date(THREE_WEEKS_FROM_TODAY);
  threeWeeksFromTodayObj.setHours(0, 0, 0, 0);
  const THIS_MONTH = todayObj.getMonth();
  const MONTH_OF_THREE_WEEKS_FROM_TODAY = threeWeeksFromTodayObj.getMonth();
  const TOTAL_MONTHS_IN_A_YEAR = 12;
  const TOTAL_WEEKDAYS_MINUS_ONE = 6;
  const FIRST_DAY_OF_THE_WEEK = 0;
  const dates = {};

  const normalizedTotalMonths =
    MONTH_OF_THREE_WEEKS_FROM_TODAY < THIS_MONTH
      ? MONTH_OF_THREE_WEEKS_FROM_TODAY + TOTAL_MONTHS_IN_A_YEAR
      : MONTH_OF_THREE_WEEKS_FROM_TODAY;

  for (
    let month = THIS_MONTH, j = todayObj.getFullYear();
    month <= normalizedTotalMonths;
    month++, j++
  ) {
    const monthName = new Date(
      2017,
      month % TOTAL_MONTHS_IN_A_YEAR,
      1
    ).toLocaleString(undefined, {
      month: "long"
    });
    // stop incrementing beyond the year of 3-weeks
    const year = Math.min(j, threeWeeksFromTodayObj.getFullYear());
    const thisDate = new Date(year, month, 1, 0, 0, 0);
    const thisDay = thisDate.getDay();
    // If thisDay's value is '0' which is 'Sunday', then precede it with '6' empty days
    // because the week starts from Monday, Tuesday, ... Sunday.
    // If value is '2' which is 'Tuesday', then put 1(2-1) empty day in front of it.
    const emptyDays = Array(
      thisDay === FIRST_DAY_OF_THE_WEEK ? TOTAL_WEEKDAYS_MINUS_ONE : thisDay - 1
    ).fill(0);

    const days = emptyDays.concat(
      generateThisMonthCalendar(month % TOTAL_MONTHS_IN_A_YEAR, year)
    );

    const chunks = [];
    for (let i = 0; i < days.length; i += 7) {
      chunks.push(days.slice(i, i + 7));
    }
    dates[`${monthName} ${year}`] = chunks;
  }

  return { dates, todayObj, threeWeeksFromTodayObj };
}

app.get("/", function(req, res, next) {
  const { dates, todayObj, threeWeeksFromTodayObj } = buildCalendar();
  res.render("index", {
    title: "Select a Date & Time",
    dates,
    today: todayObj,
    threeWeeks: threeWeeksFromTodayObj
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, function() {
  console.log(`listening to requests on port ${PORT}`);
});

function addMinutes(time, minutes) {
  const date = new Date(
    new Date("01/01/2015 " + time).getTime() + minutes * 60000
  );

  const mins = date.getMinutes();

  const timeSlot = [
    date.getHours(),
    mins.toString().length == 1 ? "0" + mins : mins
  ];

  return timeSlot;
}

async function generateTimeSlots(date) {
  const dt = new Date(date);
  const isSaturday = dt.getDay() === 6;
  let startTime = "8:30";
  const interval = "30";
  const endTime = "18:00";
  const timeSlots = [];
  let dateStorage = await storage.getItem(date); // yourname

  while (startTime !== endTime) {
    const time = addMinutes(startTime, interval);
    const currentSlotCount = (dateStorage && dateStorage[time.join(":")]) || 0;
    timeSlots.push({
      time,
      disabled: isSaturday ? currentSlotCount >= 4 : currentSlotCount >= 2
    });
    startTime = time.join(":");
  }

  return timeSlots;
}
init();

async function init() {
  await storage.init(/* options ... */);
  initSocket();
}

function initSocket() {
  io.on("connection", function(client) {
    client.on("getTimeSlots", async function(date, cb) {
      const slots = await generateTimeSlots(date);
      cb(slots);
    });

    client.on("confirmBooking", async function(datetime, cb) {
      const dt = new Date(datetime);
      const mins = dt.getMinutes();
      const timeSlot = `${dt.getHours()}:${
        mins.toString().length == 1 ? "0" + mins : mins
      }`;
      const isSaturday = dt.getDay() === 6;

      const date = datetime.slice(0, 10);
      let dateStorage = await storage.getItem(date); // yourname

      if (!dateStorage) {
        dateStorage = {};
        dateStorage[timeSlot] = 1;
      } else {
        if (!dateStorage[timeSlot]) {
          dateStorage[timeSlot] = 1;
        } else {
          dateStorage[timeSlot] = dateStorage[timeSlot] + 1;
          if (isSaturday && dateStorage[timeSlot] >= 4) {
            client.broadcast.emit("disableTimeSlot", datetime);
          }
          if (!isSaturday && dateStorage[timeSlot] >= 2) {
            client.broadcast.emit("disableTimeSlot", datetime);
          }
        }
      }
      await storage.setItem(date, dateStorage); // yourname
      cb();
    });
  });
}
