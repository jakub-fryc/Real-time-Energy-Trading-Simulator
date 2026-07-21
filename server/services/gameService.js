import constants from "../utils/constants.js";
import { v4 as uuidv4 } from "uuid";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SESSIONS_DIR = path.join(__dirname, "..", "sessions");

export function generateOffer() {
  const offerValue = Math.floor(Math.random() * 25 + 1);
  const demandValue = Math.floor(Math.random() * 25 + 1);

  const offer = {
    hour: Math.floor(Math.random() * 24),
    offerValue: offerValue,
    lifeTime: constants.offerLifeTime,
    uuid: uuidv4(),
    state: "free",
  };
  const demand = {
    hour: Math.floor(Math.random() * 24),
    offerValue: demandValue,
    lifeTime: constants.offerLifeTime,
    uuid: uuidv4(),
    state: "free",
  };
  return { offer: offer, demand: demand };
}

export async function saveSession(sessionId, sessionData) {
  const sessionPath = path.join(SESSIONS_DIR, `${sessionId}.json`);
  const plainData = {
    ...sessionData,
    currentActiveOffers: Object.fromEntries(sessionData.currentActiveOffers),
    currentActiveDemands: Object.fromEntries(sessionData.currentActiveDemands),
  };
  await fs.writeFile(sessionPath, JSON.stringify(plainData, null, 2), "utf-8");
}

export async function removeSession(sessionId) {
  const sessionPath = path.join(SESSIONS_DIR, `${sessionId}.json`);
  await fs.rm(sessionPath, { force: true });
}

export async function loadSession(sessionId) {
  const sessionPath = path.join(SESSIONS_DIR, `${sessionId}.json`);
  try {
    const json = await fs.readFile(sessionPath, "utf-8");
    const data = JSON.parse(json);
    return {
      ...data,
      currentActiveOffers: new Map(Object.entries(data.currentActiveOffers)),
      currentActiveDemands: new Map(Object.entries(data.currentActiveDemands)),
    };
  } catch (error) {
    return null;
  }
}

export function emitStats(socket, state) {
  socket.emit("updateStats", {
    playTime: constants.dayLength - state.days[state.currentDay].playTime,
    money: state.days[state.currentDay].money,
    offers: state.days[state.currentDay].offers,
    demands: state.days[state.currentDay].demands,
  });
}

export function processAcceptedOffer(uuid, state, socket) {
  const offer = state.currentActiveOffers.get(uuid);
  if (!offer) return state;

  state.days[state.currentDay].sessionHours[offer.hour].offers +=
    offer.offerValue;
  state.days[state.currentDay].offers += offer.offerValue;
  state.currentActiveOffers.delete(uuid);
  state.currentOfferList.find((o) => o.uuid === uuid).state = "taken";

  emitStats(socket, state);
  socket.emit("updateHours", state.days[state.currentDay].sessionHours);

  return state;
}

export function processAcceptedDemand(uuid, state, socket) {
  const demand = state.currentActiveDemands.get(uuid);
  if (!demand) return state;

  const reward = constants.soldAward * demand.offerValue;

  state.days[state.currentDay].money += reward;
  state.days[state.currentDay].sessionHours[demand.hour].money += reward;
  state.days[state.currentDay].sessionHours[demand.hour].demands +=
    demand.offerValue;
  state.days[state.currentDay].demands += demand.offerValue;
  state.currentActiveDemands.delete(uuid);
  state.currentDemandList.find((d) => d.uuid === uuid).state = "taken";

  emitStats(socket, state);
  socket.emit("updateHours", state.days[state.currentDay].sessionHours);

  return state;
}

export function getAllUserStats(state) {
  const stats = { money: 0, offers: 0, demands: 0 };
  state.days.forEach((day) => {
    stats.money += day.money;
    stats.offers += day.offers;
    stats.demands += day.demands;
  });
  return stats;
}

export function hasLostGame(state, day) {
  let penalty = getPenalty(state, day);

  if (state.days[day].money - penalty < 0) {
    return true;
  } else {
    return false;
  }
}

export function getPenalty(state, day) {
  let penalty = 0;
  state.days[day].sessionHours.forEach((hour) => {
    const difference = diff(hour.offers, hour.demands);
    penalty += difference * constants.penaltyPerMWh;
  });

  return penalty;
}

function diff(a, b) {
  return Math.abs(a - b);
}

export function createNewGameSession(sessionId, socket) {
  const state = structuredClone(defaultStats);
  gameSessions.set(sessionId, state);
  emitStats(socket, state);

  for (let i = 0; i < constants.gridX * constants.gridY; i++) {
    const offer = generateOffer().offer;
    offer.lifeTime -= i;
    state.currentOfferList.push(offer);
    state.currentActiveOffers.set(offer.uuid, offer);
  }

  for (let i = 0; i < constants.gridX * constants.gridY; i++) {
    const demand = generateOffer().demand;
    demand.lifeTime -= i;
    state.currentDemandList.push(demand);
    state.currentActiveDemands.set(demand.uuid, demand);
  }

  return state;
}

export const gameSessions = new Map();

export const activeOffers = new Map();

export const activeDemands = new Map();

export const sessionTokens = new Map();

export let offers = [];

export let demands = [];

export const defaultDayStats = () => ({
  sessionHours: Array.from({ length: 24 }, () => ({
    offers: 0,
    demands: 0,
    money: -6,
  })),
  playTime: 0,
  offers: 0,
  demands: 0,
  money: 24 * -6,
});

export const defaultStats = {
  days: [defaultDayStats()],
  currentOfferList: [],
  currentDemandList: [],
  currentActiveOffers: new Map(),
  currentActiveDemands: new Map(),
  currentDay: 0,
  gameDays: 0,
};

export default generateOffer;
