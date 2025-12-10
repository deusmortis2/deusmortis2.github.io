const originalConsoleLog = console.log; // Store the original console.log
const logDisplay = document.getElementById("log-display");

console.log = function (...args) {
  // Call the original console.log to still output to the browser console
  originalConsoleLog.apply(console, args);

  // Convert arguments to a string and append to the log display
  const message = args
    .map((arg) => {
      if (typeof arg === "object" && arg !== null) {
        try {
          return JSON.stringify(arg); // Stringify objects for display
        } catch (e) {
          return String(arg); // Fallback for circular references or other issues
        }
      }
      return String(arg);
    })
    .join(" ");

  const logEntry = document.createElement("p");
  logEntry.textContent = message;
  logDisplay.appendChild(logEntry);
};

// You can repeat this process for console.warn, console.error, etc.
// Example for console.error:
// const originalConsoleError = console.error;
// console.error = function(...args) {
//     originalConsoleError.apply(console, args);
//     const errorMessage = args.map(arg => String(arg)).join(' ');
//     const errorEntry = document.createElement('p');
//     errorEntry.style.color = 'red'; // Style errors differently
//     errorEntry.textContent = `ERROR: ${errorMessage}`;
//     logDisplay.appendChild(errorEntry);
// };
