import { Handler } from "express";
import Player from "../interfaces/player";
import axios from "axios";
import { createCanvas, loadImage, registerFont } from "canvas";
import fs from "fs/promises";
import path from "path";
import https from "https";
import { RankedMap } from "../interfaces/ranked-map";

const renderMap = async (map: RankedMap, dpiRatio = 3) => {
  // Assets
  const logoImage = await loadImage(
    await fs.readFile(path.resolve(__dirname, "../../images/acc.png"))
  );

  const mapImage = await loadImage(
    (
      await axios.get<Buffer>(
        `https://accsaber.com/cdn/covers/${map.songHash.toUpperCase()}.png`,
        {
          responseType: "arraybuffer",
        }
      )
    ).data
  );
  /* fonts */ {
    registerFont("./fonts/Raleway/static/Raleway-Regular.ttf", {
      family: "Raleway",
    });

    registerFont("./fonts/Montserrat/Montserrat-Regular.ttf", {
      family: "Montserrat",
      weight: "regular",
    });

    registerFont("./fonts/Montserrat/Montserrat-SemiBold.ttf", {
      family: "Montserrat",
      weight: "semibold",
    });
    registerFont("./fonts/Montserrat/Montserrat-Bold.ttf", {
      family: "Montserrat",
      weight: "bold",
    });

    registerFont("./fonts/MaterialIconsRound-Regular.otf", {
      family: "Material Icons",
    });
  }

  // Canvas setup
  const width = 560;
  const height = 112 + 50 + 96;
  const c = createCanvas(width * dpiRatio, height * dpiRatio);
  const ctx = c.getContext("2d");
  ctx.scale(dpiRatio, dpiRatio);

  const drawRoundedRectangle = (
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ) => {
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  };

  // Background
  ctx.drawImage(mapImage, 0, height / 2 - width / 2, width, width);
  ctx.fillStyle = "#000a";
  ctx.fillRect(0, 0, width - 72, height);

  // Bar on the right
  ctx.fillStyle = "#000b";
  ctx.fillRect(488, 0, 72, height);

  // Logo
  ctx.drawImage(logoImage, 500, height - 60, 48, 48);

  // Album art
  ctx.filter = "blur(20px)";
  ctx.save();
  ctx.beginPath();
  drawRoundedRectangle(48, 48, 112, 112, 5);
  ctx.clip();
  ctx.drawImage(mapImage, 48, 48, 112, 112);
  ctx.closePath();
  ctx.restore();

  // Song name
  ctx.font = "30px Raleway";
  ctx.fillStyle = "rgb(243, 244, 246)";
  ctx.textBaseline = "top";
  ctx.fillText(map.songName, 184, 64);

  // Artist
  ctx.font = "bold 24px Raleway";
  ctx.fillStyle = "#9CA3AF";
  ctx.textBaseline = "top";
  ctx.fillText(`${map.songAuthorName}`, 184, 104);

  // Complexity meter
  ctx.save();
  ctx.beginPath();

  drawRoundedRectangle(48, 185, 150, 25, 5);
  ctx.clip();
  ctx.fillStyle = "#fff2";
  ctx.fillRect(48, 185, 150, 25);
  ctx.fillStyle = "#10B981";
  ctx.fillRect(48, 185, (150 * map.complexity) / 15, 25);

  ctx.font = "bold 13px montserrat";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgb(243, 244, 246)";
  ctx.fillText(map.complexity.toString(), 48 + 75, 197);
  ctx.restore();

  ctx.font = "13px montserrat";
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.fillText(map.categoryDisplayName, 208, 197);

  return c.toBuffer();
};

const mapHandler: Handler = async (req, res, next) => {
  axios
    .get<RankedMap>(`https://accsaber.com/api/ranked-maps/${req.params[0]}`)
    .then(async ({ data: map }) => {
      res.end(
        await renderMap(map, parseInt(req.query?.scale?.toString() || "2"))
      );
    })
    .catch((err) => {
      console.log(err);
      res.status(err?.response?.status ?? 500);
      err?.response?.data?.message
        ? res.json(err.response.data.message)
        : next();
    });
};
export default mapHandler;
