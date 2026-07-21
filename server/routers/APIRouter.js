import express from "express";
const router = express.Router();

router.get("/", (req, res) => {
  return res.send("Hello world");
});

router.post("/acceptOffer", (req, res) => {});

export default router;
