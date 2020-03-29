// Pads a string value with leading zeroes(0) until length is reached
// For example: zeroPad(5, 2) => "05"
const zeroPad = (value, length) => `${value}`.padStart(length, "0");

// (int) Number days in a month for a given year from 28 - 31
const getNumOfDaysInGivenMonth = (month, year) => {
  const months30 = [4, 6, 9, 11];
  const leapYear = year % 4 === 0;

  // eslint-disable-next-line no-nested-ternary
  return month === 2
    ? leapYear
      ? 29
      : 28
    : months30.includes(month)
    ? 30
    : 31;
};

function generateThisMonthCalendar(month, year) {
  // plus one coz month is originally zero-indexed (e.g. 0 is Jan)
  const m = month + 1;
  // Get number of days in the month and the month's first day
  const monthDays = getNumOfDaysInGivenMonth(m, year);

  // Builds dates to be displayed from current month
  return [...new Array(monthDays)].map(
    (n, index) => `${year}-${zeroPad(m, 2)}-${zeroPad(index + 1, 2)}`
  );
}

module.exports = { generateThisMonthCalendar };
