class DayOrder {
  static coerceEmployee(data = {}) {
    return {
      function:  data.function  || '',
      name:      data.name      || '',
      prevision: data.prevision || '',
      arrival:   data.arrival   || '',
      departure: data.departure || '',
      phone:     data.phone     || '',
      comments:  data.comments  || '',
    };
  }
}

module.exports = { DayOrder };
