require("dotenv").config();
const express = require("express");
const request = require("request");
const APIKey = process.env.API_KEY;
const APISecret = process.env.API_SECRET;
const APIToken = process.env.API_TOKEN;


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
const transferCall = (callCnId, dest, origin) => {

  let action = 'transfer'
  request
    .post(`https://api.telnyx.com/calls/${callCnId}/actions/${action}`)
    .auth(APIKey, APISecret, true)
    .form({ to: dest, from: origin }),
    (error, response, body) => {
      console.log(`request - response${body}`);
      if (error) console.error(error);

      console.log(body);
    };


};

// IVR Menu Message
const IVRmenu = (callCnId, ivrMessage) => {

  let action = 'speak'
  request
    .post(`https://api.telnyx.com/calls/${callCnId}/actions/${action}`)
    .auth(APIKey, APISecret, true)
    .form({ payload: }),
    (error, response, body) => {
      console.log(`request - response${body}`);
      if (error) console.error(error);

      console.log(body);
    };



};



// Answer Call
const answerCall = (callCnId, callState) => {
  let action = `answer`;
  request
    .post(`https://api.telnyx.com/calls/${callCnId}/actions/${action}`)
    .auth(APIKey, APISecret, true)
    .form({ client_state: callState }),
    (error, response, body) => {
      console.log(`request - response${body}`);
      if (error) console.error(error);

      console.log(body);
    };

  // const options = {
  //   url: `https://api.telnyx.com/calls/${callCnId}/actions/answer`,
  //   auth: {
  //     username: APIKey,
  //     password: APISecret
  //   },
  //   method: `POST`,
  //   form: {
  //     to: dest,
  //     from: origin
  //   }

  // };
  // request(options, (error, response, body) => {
  //   console.log(`request - response${response}`);
  //   if (error) console.error(error);

  //   console.log(body)
  // });
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
  const callState = req.body.payload.state;
  //  direction: 'incoming'
  const direction = req.body.payload.direction;

  console.log(`${timeStamp} - ccID ${callCnId}`)
  console.log(`${timeStamp} - Complete Payload ${JSON.stringify(req.body, null, 4)}`)  

    switch (eventType) {
      // Answer Call
      case "call_intiated":
        if (direction == 'incoming'){
          answerCall(callCnId, null)
        } else {
          answerCall(callCnId, 'stage-outgoing');
        }  
          break;
      case "call_answered":
      
        break;
      case "speak_ended":
        alert("test");
        break;
      case "call_bridged":
        alert("test");
        break;
      case "gather_ended":
        alert("test");
        break;
      case "gather_ended":
        alert("test");
        break;

      default:
        res.end();
    }

    
  } catch (error) {
    console.error(error);
  }
});
