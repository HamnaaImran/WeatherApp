/* ========== Menu Toggle ========== */
const menuIcon   = document.querySelector(".humberg-menu i");
const menuContent = document.querySelector(".menu-content");

menuIcon.addEventListener("click", () => {
  menuContent.classList.toggle("open");
  menuIcon.classList.toggle("uil-times");
});

/* ========== Swiper Instances (created later) ========== */
let hourlySwiper = null;
let weeklySwiper = null;

/* ========== API & DOM Refs ========== */
const API_KEY = "28c2b467e5bc6dee079a32184988da3c";
const searchBtn       = document.querySelector(".city-submit");
const input           = document.querySelector(".input-city");
const inputLocation   = document.querySelector(".input-location");
const currentWeatherCard = document.querySelector(".current-weather-card");
const weeklyContainer = document.getElementById("weakly-weather-container");
const hourlyContainer = document.getElementById("hourly-section");

/* ========== Card Builders ========== */
const createCurrentCard = (forecast, city) => {
  const cloud = forecast.weather[0].description;
  const bgMap = {
    "light rain": "assets/light rain.gif",
    "moderate rain": "assets/rain.webp",
    "scattered clouds": "assets/scrated sky.gif",
    "broken clouds": "assets/scrated sky.gif",
    "overcast clouds": "assets/scrated sky.gif",
    "clear sky": "assets/clear sky.gif",
  };
  currentWeatherCard.style.backgroundImage = `url('${bgMap[cloud] || "assets/clear sky.gif"}')`;

  return `
    <div class="cityinfo">
      <h1 class="city-name">${city}</h1>
      <h3 class="city-time">${forecast.dt_txt.split(" ")[0]}</h3>
    </div>
    <div class="city-temp">
      <img class="current-weather-img" src="https://openweathermap.org/img/wn/${forecast.weather[0].icon}.png" alt="">
      <h1 class="temp-value">${(forecast.main.temp - 273.15).toFixed(1)} °C</h1>
    </div>
    <p class="desc">${forecast.weather[0].description}</p>
    <div class="other-details">
      <div class="firstline-details">
        <div><h1>${forecast.main.humidity}%</h1><p>Humidity</p></div>
        <div><h1>${forecast.wind.speed} km/h</h1><p>Wind</p></div>
      </div>
      <div class="lastline-details">
        <div><h1>${(forecast.main.feels_like - 273.15).toFixed(1)} °C</h1><p>Feels like</p></div>
        <div><h1>${forecast.main.pressure}</h1><p>Pressure</p></div>
      </div>
    </div>`;
};

const createWeeklyCard = (forecast) => {
  const dayName = new Date(forecast.dt_txt).toLocaleDateString("en-US", { weekday: "short" });

  return `
    <div class="weekly-card swiper-slide">
      <h2 class="weekly-date">${dayName}</h2>
      <img src="https://openweathermap.org/img/wn/${forecast.weather[0].icon}.png" alt="">
      <h2>${(forecast.main.temp - 273.15).toFixed(1)} °C</h2>
      <p>${forecast.weather[0].description}</p>
    </div>`;
};

const createHourlyCard = (forecast) => {
  const time = forecast.dt_txt.split(" ")[1].slice(0, 5);
  return `
    <div class="hourly-card swiper-slide">
      <h3>${time}</h3>
      <img src="https://openweathermap.org/img/wn/${forecast.weather[0].icon}.png" alt="">
      <h2>${(forecast.main.temp - 273.15).toFixed(1)} °C</h2>
      <p>${forecast.weather[0].description}</p>
    </div>`;
};

/* ========== Fetch & Render ========== */
const getWeatherDetails = (city, lat, lon) => {
  fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}`)
    .then(res => res.json())
    .then(data => {
      /* --- Current & Weekly --- */
      const seenDays = new Set();
      const weekly = data.list.filter(f => {
        const d = f.dt_txt.split(" ")[0];
        if (!seenDays.has(d)) {
          seenDays.add(d);
          return true;
        }
        return false;
      });

      currentWeatherCard.innerHTML = createCurrentCard(weekly[0], city);
      weeklyContainer.innerHTML = weekly.slice(1).map(createWeeklyCard).join("");

      /* --- Hourly (today) --- */
      const today = new Date().getDate();
      const hourly = data.list.filter(f => new Date(f.dt_txt).getDate() === today);
      hourlyContainer.innerHTML = hourly.map(createHourlyCard).join("");

      /* Re‑init Swipers */
      initSwipers();
    })
    .catch(() => alert("Error fetching weather details."));
};

const getCityCoordinates = () => {
  const cityName = input.value.trim();
  if (!cityName) return;
  fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${API_KEY}`)
    .then(res => res.json())
    .then(data => {
      if (!data[0]) return alert("City not found.");
      const { name, lat, lon } = data[0];
      getWeatherDetails(name, lat, lon);
    })
    .catch(() => alert("Error fetching coordinates."));
};

const getUserCoordinates = () => {
  navigator.geolocation.getCurrentPosition(
    pos => {
      const { latitude, longitude } = pos.coords;
      fetch(`https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${API_KEY}`)
        .then(res => res.json())
        .then(data => {
          const city = data[0]?.name || "Your Location";
          getWeatherDetails(city, latitude, longitude);
        });
    },
    err => {
      if (err.code === err.PERMISSION_DENIED) alert("Location permission denied.");
    }
  );
};

/* ========== Swiper Init Helper ========== */
function initSwipers() {
  if (hourlySwiper) hourlySwiper.destroy(true, true);
  if (weeklySwiper) weeklySwiper.destroy(true, true);

  hourlySwiper = new Swiper(".hourlySwiper", {
    slidesPerView: 3,
    spaceBetween: 20,
    grabCursor: true,
    pagination: {
      el: ".hourlySwiper .swiper-pagination",
      clickable: true,
      dynamicBullets: true,
    },
    breakpoints: {
      0: { slidesPerView: 1 },
      520: { slidesPerView: 2 },
      950: { slidesPerView: 3 }
    }
  });

  weeklySwiper = new Swiper(".weeklySwiper", {
    slidesPerView: 4,
    spaceBetween: 20,
    grabCursor: true,
    centeredSlides: true,
    pagination: {
      el: ".weeklySwiper .swiper-pagination",
      clickable: true,
      dynamicBullets: true,
    },
    breakpoints: {
      0: { slidesPerView: 1 },
      520: { slidesPerView: 2 },
      950: { slidesPerView: 3 },
      1200: { slidesPerView: 4 }
    }
  });
}

/* ========== Event Listeners ========== */
searchBtn.addEventListener("click", getCityCoordinates);
inputLocation.addEventListener("click", getUserCoordinates);
window.addEventListener("load", getUserCoordinates);
