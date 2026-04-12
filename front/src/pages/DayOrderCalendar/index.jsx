import { Calendar, Whisper, Popover, Badge, Button } from "rsuite";
import "./calendar.css";
import "./styles.css";

import { React, useCallback } from "react";

function formatDate(date) {
  var d = new Date(date),
    month = "" + (d.getMonth() + 1),
    day = "" + d.getDate(),
    year = d.getFullYear();

  if (month.length < 2) month = "0" + month;
  if (day.length < 2) day = "0" + day;

  return [year, month, day].join("-");
}

const DayOrderCalendar = ({ dayOrders, editDayOrder }) => {
  const renderCell = useCallback(
    (date) => {
      let formatedDate = formatDate(date);

      return (
        <div className="day-order-calendar-date-buttons">
          {dayOrders
            .filter((day) => day.date === formatedDate)
            .sort((a, b) => (a.name === "Tour Principal" ? -1 : 1))
            .map((dayOrder, index) => (
              <Button
                onClick={() => editDayOrder(dayOrder.id)}
                className={`button${(index % 4) + 1}`}
              >
                {dayOrder.name}
              </Button>
            ))}
        </div>
      );
    },
    [dayOrders]
  );

  const defineCellClass = useCallback(
    (date) => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (date <= yesterday) return "passed";
      else return "";
    },
    [dayOrders]
  );

  const changeDate = useCallback((date) => {
    let formatedDate = `${
      date.getMonth() + 1
    }/${date.getDate()}/${date.getFullYear()}`;
    localStorage.setItem("selectedDateInDayOrderCalendar", formatedDate);
  });

  return (
    <Calendar
      bordered
      cellClassName={defineCellClass}
      renderCell={renderCell}
      defaultValue={
        localStorage.getItem("selectedDateInDayOrderCalendar")
          ? new Date(localStorage.getItem("selectedDateInDayOrderCalendar"))
          : null
      }
      onMonthChange={changeDate}
    />
  );
};

export default DayOrderCalendar;
