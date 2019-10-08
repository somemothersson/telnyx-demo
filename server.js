// Dependencies
require("dotenv").config();
const express = require("express");
const request = require("request");

// Telnyx API credentials
const APIKey = process.env.API_KEY;
const APISecret = process.env.API_SECRET;
const MSGProfileSecret = process.env.MSG_PROFILE_SECRET;

// Telnyx IVR settings
const ivrVoice = "male";
const ivrLang = "en-US";

//Load Express
const app = express();

// Init Middleware
app.use(express.json({ extended: false }));

// Define Front End Route - See App is running from Web
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

// ===========================CALL CONTROL FUNCTIONS============================

// Answer Call
const answerCall = (callCntrlId, clientState) => {
  let action = `answer`;
  let locClientState64 = null;
  if (clientState)
    locClientState64 = Buffer.from(clientState).toString("base64");
  console.log(`Answer Call Client State: ${clientState}`);
  request
    .post(`https://api.telnyx.com/calls/${callCntrlId}/actions/${action}`)
    .auth(APIKey, APISecret, true)
    .form({ client_state: locClientState64 }),
    {},
    (error, response, body) => {
      console.log(`Answer statusCode: ${response} ${response.statusCode}`);
      console.log(`Answer body: ${body}`);
      if (error) console.error(error);

      
    };
};

// Transfer Call
const transferCall = (callCntrlId, dest, origin) => {
  let action = "transfer";
  request
    .post(`https://api.telnyx.com/calls/${callCntrlId}/actions/${action}`)
    .auth(APIKey, APISecret, true)
    .form({ to: dest, from: origin }),
    (error, response, body) => {
      console.log(`statusCode: ${response} ${response.statusCode}`);
      console.log(`body: ${body}`);
      if (error) console.error(error);

     
    };
};

// IVR Menu Listen for Options - gather using speak
const IVRlisten = (callCntrlId, ivrMessage, digits, maxDigits, clientState) => {
  let action = "gather_using_speak";
  let locClientState64 = null;
  if (clientState)
    locClientState64 = Buffer.from(clientState).toString("base64");
    console.log(`IVRListen Client State: ${clientState}`)

  request
    .post(`https://api.telnyx.com/calls/${callCntrlId}/actions/${action}`)
    .auth(APIKey, APISecret, true)
    .form({
      payload: ivrMessage,
      voice: ivrVoice,
      language: ivrLang,
      valid_digits: digits,
      max: maxDigits,
      client_state: locClientState64
    }),
    {},
    (error, response, body) => {
      console.log(`IVRListen statusCode: ${response} ${response.statusCode}`);
      console.log(`IVRListen body: ${body}`);
      if (error) console.error(error);
      
    };
};

// Speak Message => Send Text Message
const speakMessage = (callOrigin, callCntrlId, ivrMessage) => {

  let action = "speak";
  console.log("SPEAK")
  request
    .post(`https://api.telnyx.com/calls/${callCntrlId}/actions/${action}`)
    .auth(APIKey, APISecret, true)
    .form({ payload: ivrMessage, voice: ivrVoice, language: ivrLang }),
    {},
    (error, response, body) => {
      console.log(`Speak statusCode: ${response} ${response.statusCode}`);
      console.log(`Speak body: ${body}`);
      console.log("[%s] DEBUG - Command Executed [%s]", timeStamp, action)
      if (error) console.error(error);

      
    }
  // sendText(callCntrlId, callOrigin);
};

// Hangup Call
const hangupCall = callCntrlId => {
  console.log(hangupCall);
  let action = "hangup";
  request
    .post(`https://api.telnyx.com/calls/${callCntrlId}/actions/${action}`)
    .auth(APIKey, APISecret, true)
    .form({}),
    {},
    (error, response, body) => {
      console.log(body);
      console.log(`Hang Up statusCode: ${JSON.stringify(response)} ${response.statusCode}`);
      console.log(`Hang up body: ${body}`);
      if (error) console.error(error);
      
    };

};

// Send Text Message => Hangup Call
const sendText = (callCntrlId, txtOrigin) => {
  console.log(`FROM - ${txtOrigin}`);

  const options = {
    url: "https://sms.telnyx.com/messages",
    headers: { "X-Profile-Secret": `${MSGProfileSecret}` },
    json: {
      from: `+13127367272`,
      to: `+13127367295`,
      body: `You have received a request from ${txtOrigin}`,
      delivery_status_webhook_url: "https://example.com/campaign/7214"
    }
  };

  request.post(options, (error, response, body) => {
    console.error(error);
    console.log(`Text statusCode: ${response} ${response.statusCode}`);
    console.log(`Text body: ${body}`);
  });
  hangupCall(callCntrlId);
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
    // console.log(
    //   `${timeStamp} - Complete Payload ${JSON.stringify(req.body, null, 4)}`
    // );
    console.log(`Inbound Event Type: ${eventType}`);

    // ===========================IVR LOGIC============================
    //Using the Event Type to Trigger Functions
    switch (eventType) {
      
      // Answer Call
      case "call_initiated":
          
        //  If "call_initiated state is direction incoming, it is a new call => Answer Call
        if (direction === "incoming") {
          console.log(`Incoming Call InitiatedClient State: ${clientState}`);
          answerCall(callCnId, null);
        } else {
          answerCall(callCnId, "stage-outgoing");
        }
        res.end()
        break;

      // Call Answered - Play Greeting - Gather Digits
      case "call_answered":
        
        if (!clientState || clientState != null)
        console.log(`Call Answered Client State !null: ${clientState}`);
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

      // DTMF Received - Route Option
      case "gather_ended":
        // Log which option from the menu was chosen
        
        if (!clientState || clientState != null) {
          console.log(`Gather Ended State !null : ${clientState}`);
       
          //Choose Option 1
          if (ivrOption === "1") {
            console.log(`IVR OPTION = ${ivrOption}`)
            speakMessage(origin, callCnId, `Thank you for calling Steve`);
           
            //Choose Option 2
          } else if (ivrOption === "2") {
            console.log(`IVR OPTION = ${ivrOption}`)
            speakMessage(origin, callCnId, `Thank you for calling Joe,He will be notified of your call, GoodBye`);
          } else res.end();
        } else 

        break;

      default:
        res.end();
    }
  } catch (error) {
    console.error(error);
  }
});
