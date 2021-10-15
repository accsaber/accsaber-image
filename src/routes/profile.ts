import { Handler } from "express";
import Player from "../interfaces/player";
import axios from "axios";
import { createCanvas, loadImage, registerFont } from "canvas";
import fs from "fs/promises";
import path from "path";
import https from "https";

const renderProfile = async (player: Player, dpiRatio = 2) => {
  // Assets
  const logoImage = await loadImage(
    await fs.readFile(path.resolve(__dirname, "../../images/acc.png"))
  );

  const playerImage = await loadImage(
    (
      await axios.get<Buffer>(
        `https://accsaber.com/cdn/avatars/${player.playerId}.jpg`,
        {
          responseType: "arraybuffer",
        }
      )
    ).data
  );
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

  // Canvas setup
  const width = 560;
  const height = 332;
  const c = createCanvas(width * dpiRatio, height * dpiRatio);
  const ctx = c.getContext("2d");

  const drawRoundedRectangle = (
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ) => {
    width += ctx.lineWidth;
    height += ctx.lineWidth;
    // TODO: make it rounded
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

  type Section = {
    label: string;
    value: string;
    fillStyle?: string;
    font?: string;
  };
  const drawInfoSections = (sections: Section[]) => {
    const drawBorder = (x: number) => {
      ctx.beginPath();
      ctx.fillStyle = "rgb(55, 65, 81)";
      ctx.fillRect(x, 184, 1, 100);
    };
    const drawInfoSection = (x: number, section: Section): number => {
      ctx.fillStyle = "rgb(209, 213, 219)";
      ctx.font = `bold ${section.font ?? "16px Montserrat"}`;
      ctx.fillText(section.label, x + 41, 204);

      ctx.beginPath();
      ctx.strokeStyle = "rgb(55, 65, 81)";
      ctx.lineWidth = 2;
      drawRoundedRectangle(
        x + 32,
        200,
        ctx.measureText(section.label).width + 16,
        30,
        3
      );
      ctx.stroke();

      ctx.fillStyle = section.fillStyle ?? "rgb(209, 213, 219)";
      ctx.font = "regular 24px Montserrat";
      ctx.fillText(section.value, x + 32, 240);
      return ctx.measureText(section.value).width + 56;
    };
    let currentX = 32;
    sections.forEach((section, n) => {
      currentX += drawInfoSection(currentX, section);
      if (n + 1 < sections.length) {
        ctx.fillStyle = "rgb(55, 65, 81)";
        ctx.fillRect(currentX + 8, 184, 1, 100);
        currentX += 8;
      }
    });
  };

  ctx.scale(dpiRatio, dpiRatio);

  // Background
  ctx.fillStyle = "#1f2937";
  ctx.fillRect(0, 0, width, height);

  // Bar on the right
  ctx.fillStyle = "#374151";
  ctx.fillRect(488, 0, 72, height);

  // Logo
  ctx.drawImage(logoImage, 500, 272, 48, 48);

  // Player name
  ctx.font = "30px Raleway";
  ctx.fillStyle = "rgb(243, 244, 246)";
  ctx.textBaseline = "top";
  ctx.fillText(player.playerName, 184, 64);

  // Player rank
  ctx.font = "bold 36px Montserrat";
  ctx.fillStyle = "rgb(243, 244, 246)";
  ctx.textBaseline = "top";
  ctx.fillText(`#${player.rank}`, 184, 104);

  // Info boxes
  drawInfoSections([
    {
      label: "ACC",
      value: `${(player.averageAcc * 100).toFixed(2)}%`,
    },
    {
      label: "AP",
      value: `${player.ap.toFixed(2)}`,
    },
    {
      label: "trending_up",
      value: `${player.rank < player.rankLastWeek ? "+" : ""}${
        player.rankLastWeek - player.rank
      }`,
      font: '24px "Material Icons"',
      fillStyle: (() => {
        if (player.rankLastWeek > player.rank) return "#10B981";
        if (player.rankLastWeek < player.rank) return "rgb(248, 113, 113)";
        return undefined;
      })(),
    },
  ]);

  // Player image
  ctx.save();
  ctx.beginPath();
  ctx.arc(104, 104, 56, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(playerImage, 48, 48, 112, 112);
  ctx.closePath();
  ctx.restore();

  return c.toBuffer();
};

const profileHandler: Handler = async (req, res, next) => {
  axios
    .get<Player>(`https://accsaber.com/api/players/${req.params[0]}`)
    .then(async ({ data: player }) => {
      res.end(
        await renderProfile(
          player,
          parseInt(req.query?.scale?.toString() || "2")
        )
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
export default profileHandler;
