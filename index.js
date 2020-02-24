const request = require("request");
const url = require("url");
const path = require("path");
const { Howl } = require("howler");
const fs = require("fs");
const remote = require("electron").remote;
const settings = require("electron-settings");
const { Tray, Menu } = remote;

let userDataFile = require("./user_settings.json");

//API STUFF---
let key = "4685baf849484b0fc10163ba4e489b75";
let cityName = "Sydney,CA";
let apiLink;
let geoKey = "4yE4HHZPIeBZBTWeWp0zQCZHp2XUpBWK";
let currentCity;
let geoAPILink = `http://www.mapquestapi.com/geocoding/v1/address?key=${geoKey}&location=Boulder`;
//------------
//`http://www.mapquestapi.com/geocoding/v1/address?key=${geoKey}&location=${currentCity}`
//Page Elements---
let currentWindow = remote.getCurrentWindow();
let optBtn = document.getElementById("optBtn");
let optMenu = document.getElementById("optMenu");
let autoplayCheck = document.getElementById("autoplay");
let minBtn = document.getElementById("minBtn");
let maxBtn = document.getElementById("maxBtn");
let closeBtn = document.getElementById("closeBtn");
let closeOptBtn = document.getElementById("closeOptBtn");
let currentConditionText = document.getElementById("currentCondition");
let playBtn = document.getElementById("playMusic");
let pauseBtn = document.getElementById("pauseMusic");
let playingStatus = document.getElementById("status");
playingStatus.innerHTML = "- Nothing is playing -";
let bgVideo = document.getElementById("bgVideo");
let videoSrc = document.createElement("source");
let soundMenu = document.getElementById("soundMenu");
let sndMenuBtn = document.getElementById("soundMenuOpener");
let tempText = document.getElementById("currentTemperature");
let feelsText = document.getElementById("currentFeelslike");
let currentLocationText = document.getElementById("currentLocation");
let cityNameSaveBtn = document.getElementById("citySaveBtn");
let cityNameInput = document.getElementById("cityNameInput");

let soundSelection = document.querySelectorAll("#soundSelection");
console.log(soundSelection);
soundSelection.forEach(clickableSounds);
//------------

let currentWeather;
let currentTemp;
let currentFeels;
let currentLocation;
let currentLat;
let currentLon;
let prevWeather;
let prevLat;
let prevLon;
let isAuto = true;
let isPlaying = document.getElementById("autoplay").checked;

loadSettings();

/*Tray Stuff*/
let trayIcon = new Tray(path.join("", "./WeatherOrNotIcon.ico"));
const trayMenuTemplate = [
  {
    label: "WeatherOrNot",
    enabled: false
  },

  {
    label: "Play",
    click: function() {
      playAudio(currentWeather);
    }
  },

  {
    label: "Pause",
    click: function() {
      pauseAudio();
    }
  }
];
let trayMenu = Menu.buildFromTemplate(trayMenuTemplate);
trayIcon.setContextMenu(trayMenu);
//------------

let isPaused = false;

//Weather Sounds
let sound;
let snowSound = "./audio/Light_Snow.wav";
let cloudySound = "./audio/Breezy_Clouds.wav";
let clearSound = "./audio/Birds_Clear.wav";
let rainSound = "./audio/Light_Rain.wav";
let citySound = "./audio/Busy_City.wav";
let fireSound = "./audio/Warm_Fireplace.wav";
//------------

//Video Sources
let snowBG = "./video/snow.mp4";
let cloudsBG = "./video/clouds.mp4";
let clearBG = "./video/clear.mp4";
let rainBG = "./video/rain.mp4";
let cityBG = "./video/city.mp4";
let fireBG = "./video/fireplace.mp4";
//------------

//Default at 10 minute intervals
//600000
let checkInterval = 300000;

//Check every _ interval and update weather
if (isAuto) {
  requestGeo(cityName);
  setInterval(requestWeather, checkInterval);
}

//Initialize BG video
videoSrc.setAttribute("src", cloudsBG);
bgVideo.appendChild(videoSrc);
// bgVideo.load();
setTimeout(function() {
  bgVideo.play();
}, 0);
sound = new Howl({
  src: [cloudySound],
  onend: function() {
    playAudio(currentWeather);
  }
});
//------------

// updateElements("Snow");

//API URL api.openweathermap.org/data/2.5/weather?q={city name}&appid={your api key}
//Geolocation API URL http://www.mapquestapi.com/geocoding/v1/address?key=KEY&location=Washington,DC
//API request to get current weather using a placeholder location
function requestGeo(address) {
  geoAPILink = `http://www.mapquestapi.com/geocoding/v1/address?key=${geoKey}&location=${address}`;
  request(geoAPILink, function(err, response, body) {
    console.log("Requesting geolocation...");
    console.log(geoAPILink);
    let jsonBody = JSON.parse(body);
    currentLat = jsonBody["results"][0]["locations"][0]["latLng"]["lat"];
    currentLon = jsonBody["results"][0]["locations"][0]["latLng"]["lng"];
    apiLink = `http://api.openweathermap.org/data/2.5/weather?lat=${currentLat}&lon=${currentLon}&appid=${key}&units=metric`;
    if (prevLat !== currentLat || prevLon !== currentLon) {
      updateElements(currentWeather);
    }
    prevLat = currentLat;
    prevLon = currentLon;
    requestWeather();
  });
}
//------------
//API request to get current weather using a placeholder location
function requestWeather() {
  request(apiLink, function(err, response, body) {
    console.log("Requesting weather...");
    console.log(apiLink);
    let jsonBody = JSON.parse(body);
    currentWeather = jsonBody["weather"][0]["main"];
    currentTemp = Math.round(jsonBody["main"]["temp"]);
    currentFeels = Math.round(jsonBody["main"]["feels_like"]);
    currentLocation =
      "- " + jsonBody["name"] + ", " + jsonBody["sys"]["country"] + " -";
    if (prevWeather !== currentWeather) {
      updateElements(currentWeather);
    }
    prevWeather = currentWeather;
    playAudio(currentWeather);
  });
}
//------------

//Button Events
optBtn.addEventListener("click", function() {
  optMenu.classList.toggle("closed");
});

autoplayCheck.addEventListener("onchange", function() {
  if (autoplayCheck.checked == true) {
    userSettings.autoplay = true;
  } else {
    userSettings.autoplay = false;
  }
  saveSettings(userSettings);
});

minBtn.addEventListener("click", function() {
  currentWindow.minimize();
});

maxBtn.addEventListener("click", function() {
  if (!currentWindow.isMaximized()) {
    currentWindow.maximize();
  } else {
    currentWindow.unmaximize();
  }
});

closeBtn.addEventListener("click", function() {
  currentWindow.close();
});

closeOptBtn.addEventListener("click", function() {
  optMenu.classList.toggle("closed");
});

playBtn.addEventListener("click", function() {
  playAudio(currentWeather);

  console.log("Button clicked");
});

pauseBtn.addEventListener("click", function() {
  pauseAudio();
});

soundMenuOpener.addEventListener("click", function() {
  soundMenu.classList.toggle("closed");
  soundMenuOpener.classList.toggle("closed");
});

cityNameSaveBtn.addEventListener("click", function() {
  currentCity = cityNameInput.value;
  console.log(currentCity);
  requestGeo(currentCity);
});
//------------

//Add list functionality
function clickableSounds(item) {
  item.addEventListener("click", function() {
    if (item.innerHTML == "Auto") {
      isAuto = true;
      currentWeather = prevWeather;
      updateElements(currentWeather);
      if (isPlaying) {
        sound.stop();
        playAudio(currentWeather);
      }
    } else {
      isAuto = false;
      currentWeather = item.innerHTML;
      updateElements(item.innerHTML);
      console.log("Clicked " + item.innerHTML);
      if (isPlaying) {
        sound.stop();
        playAudio(currentWeather);
      }
    }
  });
}
//------------

//Update the page based on the current weather
function updateElements(currentWeather) {
  if (sound !== undefined) {
    sound.stop();
  }
  bgVideo.pause();
  switch (currentWeather) {
    case "Snow":
      videoSrc.setAttribute("src", snowBG);
      bgVideo.load();
      setTimeout(function() {
        bgVideo.play();
      }, 0);
      sound = new Howl({
        src: [snowSound],
        onend: function() {
          playAudio(currentWeather);
        }
      });
      break;

    case "Clouds":
      videoSrc.setAttribute("src", cloudsBG);
      bgVideo.load();
      setTimeout(function() {
        bgVideo.play();
      }, 0);
      sound = new Howl({
        src: [cloudySound],
        onend: function() {
          playAudio(currentWeather);
        }
      });
      break;

    case "Clear":
      videoSrc.setAttribute("src", clearBG);
      bgVideo.load();
      setTimeout(function() {
        bgVideo.play();
      }, 0);
      sound = new Howl({
        src: [clearSound],
        onend: function() {
          playAudio(currentWeather);
        }
      });
      break;

    case "Rain":
      videoSrc.setAttribute("src", rainBG);
      bgVideo.load();
      setTimeout(function() {
        bgVideo.play();
      }, 0);
      sound = new Howl({
        src: [rainSound],
        onend: function() {
          playAudio(currentWeather);
        }
      });
      break;

    case "City":
      videoSrc.setAttribute("src", cityBG);
      bgVideo.load();
      setTimeout(function() {
        bgVideo.play();
      }, 0);
      sound = new Howl({
        src: [citySound],
        onend: function() {
          playAudio(currentWeather);
        }
      });
      break;
    case "Fireplace":
      videoSrc.setAttribute("src", fireBG);
      bgVideo.load();
      setTimeout(function() {
        bgVideo.play();
      }, 0);
      sound = new Howl({
        src: [fireSound],
        onend: function() {
          playAudio(currentWeather);
        }
      });
      break;

    default:
      videoSrc.setAttribute("src", cloudsBG);
      bgVideo.load();
      setTimeout(function() {
        bgVideo.play();
      }, 0);
      sound = new Howl({
        src: [cloudySound],
        onend: function() {
          playAudio(currentWeather);
        }
      });
      break;
  }

  setWeatherText(currentWeather, currentTemp, currentFeels, currentLocation);
  logConditions(currentWeather);
}
//------------

//Set the text to reflect the current weather
function setWeatherText(
  currentWeather,
  currentTemp,
  currentFeels,
  currentLocation
) {
  currentConditionText.innerHTML = "Current condition: " + currentWeather;
  tempText.innerHTML = "Temperature: " + currentTemp + "C";
  feelsText.innerHTML = "Feels like: " + currentFeels + "C";
  currentLocationText.innerHTML = currentLocation;
}
//------------

//Play audio based on the current weather pulled from the API
function playAudio(currentWeather) {
  isPlaying = true;
  playingStatus.innerHTML = "- Playing -";
  if (sound !== undefined) {
    if (isPaused) {
      isPaused == false;
    } else {
      sound.stop();
    }
    sound.play();
  }
}

function pauseAudio() {
  if (sound !== undefined) {
    if (isPaused) {
      isPaused = false;
      sound.play();
      isPlaying = true;
      playingStatus.innerHTML = "- Playing -";
    } else {
      isPaused = true;
      sound.pause();
      isPlaying = false;
      playingStatus.innerHTML = "- Paused -";
    }
  }
}
//------------

//Manage the volume via volume slider
window.SetVolume = function(val) {
  let player = sound;
  console.log("Before: " + player.volume);
  player.volume(val);
  console.log("After: " + player.volume);
};
//------------

//Log the known conditions to a text file
function logConditions(currentWeather) {
  let stream = fs.createWriteStream("known_conditions.txt", { flags: "a" });
  let text = fs.readFileSync("known_conditions.txt", "utf8");
  if (
    !text.includes(currentWeather) &&
    currentWeather !== undefined &&
    currentWeather !== NaN
  ) {
    console.log(text);
    stream.write(currentWeather + "\n");
  }
  stream.end();
}
//------------

function saveSettings(jsonData) {
  fs.writeFile("user_settings.json", jsonData, function(err) {
    if (err) {
      console.log(err);
    }
  });
}

function loadSettings() {
  let jsonData = JSON.parse(JSON.stringify(userDataFile));
  userSettings = jsonData;
}
