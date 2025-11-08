const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ ok: true, message: "server is running" });
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`server running on http://localhost:${PORT}`);
});
