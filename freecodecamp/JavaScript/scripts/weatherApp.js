'use strict';

async function getWeather (city) {
try {
  const response = await fetch(`https://weather-proxy.freecodecamp.rocks/api/city/${city}`);
    const userData = await response.json();
    showWeather(userData);
  } catch (error) {
    alert("Something went wrong, please try again later", error);
  }
}

async function showWeather (city) {

}