import React, { useState } from 'react';

const ReportDateSelector = ({ onDateChange, reportType, years }) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(
    reportType === 'monthly' ? new Date().getMonth() + 1 : null
  );

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // If no years are provided, use the current year and past 3 years
  const availableYears = years || [
    new Date().getFullYear(),
    new Date().getFullYear() - 1,
    new Date().getFullYear() - 2,
    new Date().getFullYear() - 3,
  ];

  const handleYearChange = (e) => {
    const year = parseInt(e.target.value);
    setSelectedYear(year);
    onDateChange(year, selectedMonth);
  };

  const handleMonthChange = (e) => {
    const month = parseInt(e.target.value);
    setSelectedMonth(month);
    onDateChange(selectedYear, month);
  };

  return (
    <div className="report-date-selector">
      <div className="selector-container">
        <label htmlFor="year-select" className="selector-label">Year:</label>
        <select
          id="year-select"
          value={selectedYear}
          onChange={handleYearChange}
          className="selector-dropdown"
        >
          {availableYears.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      {reportType === 'monthly' && (
        <div className="selector-container">
          <label htmlFor="month-select" className="selector-label">Month:</label>
          <select
            id="month-select"
            value={selectedMonth}
            onChange={handleMonthChange}
            className="selector-dropdown"
          >
            {months.map((month, index) => (
              <option key={index} value={index + 1}>{month}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

export default ReportDateSelector;