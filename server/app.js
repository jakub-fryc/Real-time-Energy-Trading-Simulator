import express from "express";
import http from "http";
import { Server } from "socket.io";
import constants from "./utils/constants.js";
import {
  gameSessions,
  generateOffer,
  saveSession,
  loadSession,
  sessionTokens,
  emitStats,
  processAcceptedOffer,
  processAcceptedDemand,
  createNewGameSession,
  defaultDayStats,
  getAllUserStats,
  hasLostGame,
  removeSession,
  getPenalty,
} from "./services/gameService.js";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const __dirname = import.meta.dirname;

const app = express();
app.use(express.static(path.join(__dirname, "client")));
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});
const port = process.env.PORT || 8000;

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "index.html"));
});

io.on("connection", async (socket) => {
  console.log("User connected");

  const sessionId = socket.handshake.query.sessionId;

  const storedSession = await loadSession(sessionId);

  if (storedSession) {
    gameSessions.set(sessionId, storedSession);
  }

  let state = gameSessions.get(sessionId);

  if (state) {
    startGame(socket, state, sessionId);
  } else {
    socket.emit("prompt-start");
  }

  socket.on("start-game", (dayLength) => {
    if (!state) {
      state = createNewGameSession(sessionId, socket);
      const day = parseInt(dayLength);
      if (!day || day < 0 || day > 2) {
        state.gameDays = 0;
      } else {
        state.gameDays = day;
      }
      startGame(socket, state, sessionId);
    }
  });
});

function startGame(socket, state, sessionId) {
  socket.emit("updateHours", state.days[state.currentDay].sessionHours);

  const updateOffersAndDemands = () => {
    if (state.days[state.currentDay].playTime > constants.dayLength) {
      endCurrentDay();
    } else {
      state.days[state.currentDay].playTime += 1;
      emitStats(socket, state);
      const currentOffers = state.currentOfferList;
      const currentActiveOffers = state.currentActiveOffers;

      const currentDemands = state.currentDemandList;
      const currentActiveDemands = state.currentActiveDemands;

      for (let i = 0; i < currentOffers.length; i++) {
        currentOffers[i].lifeTime -= 1;
        if (currentOffers[i].lifeTime <= 0) {
          currentActiveOffers.delete(currentOffers[i].uuid);
          currentOffers[i] = generateOffer().offer;
          currentActiveOffers.set(currentOffers[i].uuid, currentOffers[i]);
        }
      }

      for (let i = 0; i < currentDemands.length; i++) {
        currentDemands[i].lifeTime -= 1;
        if (currentDemands[i].lifeTime <= 0) {
          currentActiveDemands.delete(currentDemands[i].uuid);
          currentDemands[i] = generateOffer().demand;
          currentActiveDemands.set(currentDemands[i].uuid, currentDemands[i]);
        }
      }

      socket.emit("offerRoom", { currentOffers, currentDemands });
    }
  };

  let interval;

  if (state.days[state.currentDay].playTime < constants.dayLength) {
    updateOffersAndDemands();
  } else {
    emitStats(socket, state);
  }
  interval = setInterval(
    updateOffersAndDemands,
    constants.iterationMiliseconds,
  );

  function endCurrentDay() {
    clearInterval(interval);
    state.currentActiveOffers.clear();

    if (hasLostGame(state, state.currentDay)) {
      socket.emit("lost-game");
      return;
    }

    const token = uuidv4();
    sessionTokens.set(sessionId, token);

    const penalty = getPenalty(state, state.currentDay);

    const { offers, demands, money } = state.days[state.currentDay];
    const stats = {
      offers,
      demands,
      delta: offers - demands,
      money: money - penalty,
    };

    if (state.currentDay + 1 > state.gameDays) {
      socket.emit("end-game", getAllUserStats(state));
    } else {
      socket.emit("day-ended", {
        continueToken: token,
        stats,
      });
    }
  }

  socket.on("nextDay", (token, callback) => {
    const session = sessionTokens.get(sessionId);
    if (session == token) {
      callback({ success: true });
      state.days[state.currentDay].money -= getPenalty(state, state.currentDay);
      state.currentDay += 1;
      state.days.push(defaultDayStats());
      socket.emit("updateHours", state.days[state.currentDay].sessionHours);
      sessionTokens.delete(sessionId);
      interval = setInterval(
        updateOffersAndDemands,
        constants.iterationMiliseconds,
      );
    } else {
      callback({ success: false });
    }
  });

  socket.on("acceptOffer", (uuid) => {
    if (state.currentActiveOffers.has(uuid)) {
      state = processAcceptedOffer(uuid, state, socket);
    } else if (state.currentActiveDemands.has(uuid)) {
      state = processAcceptedDemand(uuid, state, socket);
    }
  });

  let autoSave = setInterval(async () => {
    if (state) {
      await saveSession(sessionId, state);
    }
  }, 30000);

  socket.on("start-again", async () => {
    await removeSession(sessionId, state);
    gameSessions.delete(sessionId);
    state = null;
    socket.emit("reload-page");
  });

  socket.on("disconnect", async () => {
    clearInterval(interval);
    clearInterval(autoSave);
    if (state) {
      await saveSession(sessionId, state);
    }
    console.log("User disconnected");
  });
}

server.listen(port, () => {
  console.log("Server poslouchá na portu " + port);
});
