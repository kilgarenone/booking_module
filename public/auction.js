const socket = io.connect("http://localhost:4000");

// Get elements
const calendars = document.getElementsByClassName("calendar");
const selectedDateEle = document.getElementById("selected-date");

const options = {
  weekday: "long",
  month: "long",
  day: "numeric"
};

for (let cal of calendars) {
  cal.addEventListener(
    "click",
    function(event) {
      const ele = event.target;

      if (ele.nodeName !== "BUTTON") return;

      const date = ele.dataset.date;
      selectedDateEle.innerHTML = new Date(date).toLocaleString(
        "en-US",
        options
      );

      socket.emit(
        "getTimeSlots",
        ele.dataset.date,
        displayTimeSlots.bind(null, ele.dataset.date)
      );
    },
    false
  );
}

const slotsContainer = document.getElementById("time-slots");

slotsContainer.addEventListener("click", function(event) {
  if (
    event.target.classList.contains("time-slot") &&
    !event.target.classList.contains("js-selected-time-slot")
  ) {
    // clean up
    const confirmEle = document.getElementsByClassName("confirm-time-slot")[0];
    const selected = document.getElementsByClassName(
      "js-selected-time-slot"
    )[0];
    confirmEle && confirmEle.remove();
    selected && selected.classList.remove("js-selected-time-slot");

    // do work
    event.target.classList.add("js-selected-time-slot");
    event.target.parentNode.insertAdjacentHTML(
      "beforeend",
      `<button class="confirm-time-slot">Confirm</button>`
    );

    return;
  }

  if (event.target.classList.contains("confirm-time-slot")) {
    socket.emit(
      "confirmBooking",
      event.target.previousSibling.dataset.datetime,
      handleBookingSuccess
    );
  }
});

function handleBookingSuccess() {}

function displayTimeSlots(date, slots) {
  slotsContainer.innerHTML = "";

  for (const [hour, minutes] of slots) {
    const amOrPm = hour >= 12 ? "pm" : "am";
    const slot = `${hour > 12 ? hour - 12 : hour}:${minutes}${amOrPm}`;

    slotsContainer.insertAdjacentHTML(
      "beforeend",
      `<div style="position:relative;white-space:nowrap"><button class="time-slot" data-datetime=${new Date(
        `${date} ${hour}:${minutes}`
      ).toISOString()} type="button">${slot}</button></div>`
    );
  }
}

// enter.addEventListener("click", function() {
//   // emit 'chat' event to server's socket along with some data
//   socket.emit("join", displayBids);
// });

// // client is listening on 'chat' event emitted from server, receiving data too
// socket.on("chat", function() {
//   auctionFeeds.innerHTML += data.hello;
// });
