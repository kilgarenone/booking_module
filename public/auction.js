const socket = io();

// Get elements
const calendarsEle = document.getElementsByClassName("calendar");
const selectedDateEle = document.getElementById("selected-date");
const slotsContainerEle = document.getElementById("time-slots");

const options = {
  weekday: "long",
  month: "long",
  day: "numeric"
};

for (let cal of calendarsEle) {
  cal.addEventListener(
    "click",
    function(event) {
      const ele = event.target;

      if (ele.nodeName !== "BUTTON") return;
      const selectedDayEle = document.querySelector(".day.selected");
      selectedDayEle && selectedDayEle.classList.remove("selected");
      ele.classList.add("selected");
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

slotsContainerEle.addEventListener("click", function(event) {
  // if clicking on a new time slot
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

  // if click on the confirm button
  if (event.target.classList.contains("confirm-time-slot")) {
    socket.emit(
      "confirmBooking",
      event.target.previousSibling.dataset.datetime,
      handleBookingSuccess.bind(event.target.previousSibling)
    );
  }
});

function handleBookingSuccess() {
  this.nextSibling.remove();
  this.classList.remove("js-selected-time-slot");
  this.classList.add("booked");
}

function displayTimeSlots(date, slots) {
  // clear content
  slotsContainerEle.innerHTML = "";

  const currentHour = new Date().getHours();

  for (const {
    time: [hour, minutes],
    disabled
  } of slots) {
    const amOrPm = hour >= 12 ? "pm" : "am";
    const slot = `${hour > 12 ? hour - 12 : hour}:${minutes}${amOrPm}`;

    slotsContainerEle.insertAdjacentHTML(
      "beforeend",
      `<li style="position:relative;white-space:nowrap"><button class="time-slot" ${
        disabled || currentHour === hour ? `disabled` : ""
      } data-datetime=${new Date(
        `${date} ${hour}:${minutes}`
      ).toISOString()} type="button">${slot}</button></li>`
    );
  }
}

socket.on("disableTimeSlot", function(slot) {
  const slotEle = document.querySelectorAll(`[data-datetime="${slot}"]`)[0];

  slotEle && slotEle.setAttribute("disabled", true);
});
