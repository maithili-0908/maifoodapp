import { app } from "./app.js";

const port = process.env.PORT || 4000;
const host = process.env.HOST || "0.0.0.0";
app.listen(port, host, () => {
  console.log(`Mai Food Delivery API listening on http://${host}:${port}`);
});
