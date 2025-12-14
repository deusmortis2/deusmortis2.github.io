///////////////////////////////////////
// Coding Challenge #2 With AI

/*
Let's say you're building a time tracking application for freelancers. At some point in building this app, you need a function that receives daily work hours for a certain week, and returns:
1. Total hours worked
2. Average daily hours
3. The day with the most hours worked
4. Number of days worked
5. Whether the week was full-time (worked 35 hours or more)

TEST DATA: [7.5, 8, 6.5, 0, 8.5, 4, 0]
*/

function analyzeWorkWeek(dailyHours) {
  if (!Array.isArray(dailyHours) || dailyHours.length !== 7) {
    throw new Error("analyzeWorkWeek requires an array of exactly 7 numbers (Monday–Sunday).");
  }

  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday"
  ];

  const totalHours = dailyHours.reduce((sum, h) => sum + h, 0);

  const averageDailyHours = Number(
    (totalHours / 7).toFixed(1)
  );

  let maxHours = -Infinity;
  let busiestDayIndex = 0;

  dailyHours.forEach((hours, index) => {
    if (hours > maxHours) {
      maxHours = hours;
      busiestDayIndex = index;
    }
  });

  const daysWorked = dailyHours.filter(hours => hours > 0).length;

  const isFullTime = totalHours >= 35;

  return {
    totalHours,
    averageDailyHours,
    busiestDay: daysOfWeek[busiestDayIndex],
    daysWorked,
    isFullTime
  };
}


const workHours = [7.5, 8, 6.5, 0, 8.5, 5, 0];
console.log(analyzeWorkWeek(workHours));

const workHours2 = [7.5, 8, 6.5, 0, 8.5];
console.log(analyzeWorkWeek(workHours2));