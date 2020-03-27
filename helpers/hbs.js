module.exports = {
  day: function(date) {
    return date === 0 ? "" : new Date(date).getDate();
  },
  disableDay: function(date, options) {
    const { today, threeWeeks } = options.data.root;
    const dt = new Date(date);
    return dt >= today && dt <= threeWeeks ? "" : "disabled";
  }
};
