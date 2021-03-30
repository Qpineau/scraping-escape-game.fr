const puppeteer = require("puppeteer");
const fs = require("fs");

const URL = "https://www.escapegame.fr/paris/";

let rooms;

const saveToFile = (data) => {
  fs.writeFile("./data/rooms.json", JSON.stringify(data), "utf8", (err) => {
    if (err) {
      console.log(error);
    }
  });
};

const getGames = async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(URL, { waitUntil: "networkidle2" });

  const games = await page.evaluate(() => {
    return [...document.querySelectorAll("#jsRooms > .card-room")].map(
      (element) => {
        return {
          name: element.querySelector(".card-title a").textContent,
          brand: element
            .querySelector(".card-room-brand-city")
            .textContent.trim(),
          summary: element.querySelector(".room-summary").textContent.trim(),
          snooping:
            element.querySelector(".room-snooping") &&
            Number(
              element
                .querySelector(".room-snooping")
                .textContent.trim()
                .slice(0, -8)
            ),
          handling:
            element.querySelector(".room-handling") &&
            Number(
              element
                .querySelector(".room-handling")
                .textContent.trim()
                .slice(0, -13)
            ),
          thinking:
            element.querySelector(".room-thinking") &&
            Number(
              element
                .querySelector(".room-thinking")
                .textContent.trim()
                .slice(0, -10)
            ),
          rating:
            element.querySelector(".rating-full") &&
            Number(
              (
                Number(
                  element
                    .querySelector(".rating-full")
                    .getAttribute("style")
                    .split(" ")[1]
                    .slice(0, -3)
                ) / 17
              ).toFixed(1)
            ),
          "user rating": Number(
            element.querySelector(".user-rating") &&
              element
                .querySelector(".user-rating")
                .textContent.trim()
                .split("%")[0]
          ),
          image: element
            .querySelector(".card-room-hero-image")
            .getAttribute("data-src")
            .split("?")[0],
          domain:
            "https://www.escapegame.fr" +
            element.querySelector(".card-title a").getAttribute("href"),
        };
      }
    );
  });

  await browser.close();

  rooms = games;

  getMoreAboutGames(0);
};

getGames();

const getMoreAboutGames = async (index) => {
  if (index < rooms.length - 1) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(rooms[index].domain, { waitUntil: "networkidle2" });
    // SUMMARY
    const summary = await page.evaluate(() => {
      return document.querySelector(".content").textContent.trim();
    });
    // AVAILABILITIES

    const availabilities = await page.evaluate(() => {
      return (
        document.querySelector(".button-blue") &&
        document
          .querySelector(".button-blue")
          .getAttribute("href")
          .split("?")[0]
      );
    });

    //   ROOM ADRESSES

    const addresses = await page.evaluate(() => {
      return [...document.querySelectorAll(".room-address")].map((element) => {
        return {
          link: element.getAttribute("href"),
          location: element.innerText,
          coords: {
            lat: element.getAttribute("href").split("=")[1].split(",")[0],
            lon: element.getAttribute("href").split("=")[1].split(",")[1],
          },
        };
      });
    });

    //   BOOKING

    const booking = await page.evaluate(() => {
      return (
        document.querySelector(".sticky-cta-sn a") &&
        document
          .querySelector(".sticky-cta-sn a")
          .getAttribute("href")
          .split("?")[0]
      );
    });

    //   SPECS

    const specs = await page.evaluate(() => {
      return [...document.querySelectorAll(".room-specs .col >div ")].map(
        (element) => {
          const key = element.innerText.split("\n")[0];
          const value = element.innerText.split("\n")[1];
          return { [key]: value };
        }
      );
    });

    await browser.close();
    rooms[index] = {
      ...rooms[index],
      summary,
      availabilities,
      addresses,
      booking,
      specs,
    };
    index++;
    getMoreAboutGames(index);
  } else {
    //   On va enregistrer les data
    saveToFile(rooms);
  }
};
