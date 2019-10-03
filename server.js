const express = require("express");
const APIV2Key = process.env.API_V2_KEY;
const request = require("request");
const telnyx = require("telnyx")(APIV2Key);

//Load Express
const app = express();

// Init Middleware
app.use(express.json({ extended: false }));

// Define Route
app.get("/", (req, res) => res.send("TelNyx Demo Running"));

const PORT = process.env.PORT || 8080;

app.listen(PORT, () =>
  console.log(`Server started on port http://localhost:${PORT}`)
);

// IVR Webhook Route
app.post("/ivr", async (req, res) => {
  try {
    
    console.log(req.body.data)
    const options = {
      uri: `https://api.telnyx.com/v2/calls/${req.body.data.id}/actions/answer`,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${APIV2Key}`
      }
    };

    request(options, (error, response, body) => {
        console.log(response)
        if (error) console.error(error);

        if (response.statusCode !== 200) {
          return res.status(404).json({ msg: "No Github profile found" });
        }
        res.status(200);
    });
  } catch (error) {
    console.log(error.message);
  }
});
