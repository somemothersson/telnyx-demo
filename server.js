require("dotenv").config();
const express = require("express");
const request = require("request");

// Telnyx API credentials and Settings
const APIKey = process.env.API_KEY;
const APISecret = process.env.API_SECRET;
const MSGProfileSecret = process.env.MSG_PROFILE_SECRET;

const ivrVoice = "male";
const ivrLang = "en-US";

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

//Generate Current Time
var d = new Date();
var h = d.getHours();
var m = ("0" + d.getMinutes()).slice(-2);

//Generate Date in needed format
var dd = ("0" + d.getDate()).slice(-2);
var mm = ("0" + (d.getMonth() + 1)).slice(-2);
var yyyy = d.getFullYear();
var timeStamp = `${yyyy}-${mm}-${dd}_${h}:${m}`;

// Transfer Call
const transferCall = (callCntrlId, dest, origin) => {
  let action = "transfer";
  request
    .post(`https://api.telnyx.com/calls/${callCntrlId}/actions/${action}`)
    .auth(APIKey, APISecret, true)
    .form({ to: dest, from: origin }),
    (error, response, body) => {
      console.log(`request - response${body}`);
      if (error) console.error(error);

      console.log(body);
    };
};

// Answer Call
const answerCall = (callCntrlId, clientState) => {
  console.log("answer");
  let action = `answer`;
  request
    .post(`https://api.telnyx.com/calls/${callCntrlId}/actions/${action}`)
    .auth(APIKey, APISecret, true)
    .form({ client_state: Buffer.from("call_answered").toString("base64") }),
    (error, response, body) => {
      console.log(`request - response${body}`);
      if (error) console.error(error);

      console.log(body);
    };

  // const options = {
  //   url: `https://api.telnyx.com/calls/${callCntrlId}/actions/answer`,
  //   auth: {
  //     username: APIKey,
  //     password: APISecret,
  //     sendImmediately: true
  //   },
  //   method: `POST`,
  //   form: {
  //     client_state: Buffer.from("call_answered").toString("base64")
  //   }
  // };
  // request(options, (error, response, body) => {
  //   console.log(`request - response${body}`);
  //   if (error) console.error(error);
  // });
};

// Speak Message
const speakMessage = (callCntrlId, ivrMessage) => {
  let action = "speak";
  request
    .post(`https://api.telnyx.com/calls/${callCntrlId}/actions/${action}`)
    .auth(APIKey, APISecret, true)
    .form({ payload: ivrMessage, voice: ivrVoice, language: ivrLang }),
    (error, response, body) => {
      console.log(`#####request - response${body}`);
      if (error) console.error(error);

      console.log(body);
    };
};

// IVR Menu Listen for Options - gather using speak
const IVRlisten = (callCntrlId, ivrMessage, digits, maxDigits, state) => {
  let action = "gather_using_speak";

  request
    .post(`https://api.telnyx.com/calls/${callCntrlId}/actions/${action}`)
    .auth(APIKey, APISecret, true)
    .form({
      payload: ivrMessage,
      voice: ivrVoice,
      language: ivrLang,
      valid_digits: digits,
      max: maxDigits,
      client_state: Buffer.from("gather_ended").toString("base64")
    }),
    {},
    (error, response, body) => {
      console.log(`request - response${body}`);
      if (error) console.error(error);

      console.log(body);
    };
};

// Hangup Call
const hangupCall = callCntrlId => {
  let action = "hangup";
  request
    .post(`https://api.telnyx.com/calls/${callCntrlId}/actions/${action}`)
    .auth(APIKey, APISecret, true)
    .form({}),
    {},
    (error, response, body) => {
      console.log(`request - response${body}`);
      if (error) console.error(error);

      console.log(body);
    };
};

// IVR Menu Listen for Options - gather using speak
const sendText = txtOrigin => {
  console.log(`FROM - ${txtOrigin}`);

  const options = {
    url: "https://sms.telnyx.com/messages",
    headers: { "X-Profile-Secret": `${MSGProfileSecret}` },
    json: {
      from: `+13127367272`,
      to: `+17084769340`,
      body: `You have received a request from ${txtOrigin}`,
      delivery_status_webhook_url: "https://example.com/campaign/7214"
    }
  };

  request.post(options, (err, resp, body) => {
    console.log("error:", err);
    console.log("statusCode:", resp && resp.statusCode);
    console.log("body:", body);
  });
  hangupCall(callCnId);
};

// IVR Webhook Route
app.post("/ivr", async (req, res) => {
  try {
    //  event_type: 'call.initiated','call_answered"
    const eventType = req.body.event_type;
    //  id: 'fa39d5c5-d183-4e93-ae9e-b21bf09ce02b'
    const callCnId = req.body.payload.call_control_id;
    //  to: '+13127367272'
    const dest = req.body.payload.to;
    //  from: '+17084769340'
    const origin = req.body.payload.from;
    //  state: 'parked','
    const clientState = req.body.payload.client_state;
    //  direction: 'incoming'
    const direction = req.body.payload.direction;
    // dtmf digits
    const ivrOption = req.body.payload.digits;

    console.log(`${timeStamp} - ccID ${callCnId}`);
    console.log(
      `${timeStamp} - Complete Payload ${JSON.stringify(req.body, null, 4)}`
    );
    console.log(`********************* ${eventType}`);
    switch (eventType) {

      // Answer Call
      case "call_initiated":
        if (direction == "incoming") {
          answerCall(callCnId, null);
        } else {
          answerCall(callCnId, "stage-outgoing");
        }
        break;
      case "call_answered":
        // Play Greeting
          IVRlisten(
            callCnId,
            `Thank you for calling Consolidated Ball Bearings,
                To speak to Steve Press 1,
                For Joe, Press 2,`,
            `12`,
            `1`,
            null
          );
        break;
      case "speak_ended":
        res.end();
        break;
      case "call_bridged":
        res.end();
        break;
      case ("gather_ended"):
        // DTMF Received - Route Option
        console.log(`####### ${ivrOption}`);
          if (ivrOption === "1") {
            console.log("stan");
            speakMessage(callCnId, `Thank you for calling Steve`);
            sendText(origin);
            res.end();
            hangupCall(callCnId);
            
          } else if (ivrOption === "2") {
            console.log("joe");
            speakMessage(callCnId, `Thank you for calling Joe,`);
            sendText(origin);
            res.end();
            hangupCall(callCnId);
          }
         else break;

      default:
        res.end();
    }
  } catch (error) {
    console.error(error);
  }
});
