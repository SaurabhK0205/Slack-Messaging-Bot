require("dotenv").config();
const axios = require("axios");
const readline = require("readline");

const slackbotToken = process.env.SLACK_BOT_TOKEN;
const channelId = process.env.CHANNEL_ID;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
}); 


//to send a message
async function sendMessage(text) {
  const res = await axios.post("https://slack.com/api/chat.postMessage", {
    channel: channelId,
    text: text,
  }, {
    headers: {
      Authorization: `Bearer ${slackbotToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.data.ok) {
    console.error("Send Message Error:", res.data.error);
    return;
  }

  console.log("Message sent!");
}

//to schdeule a message
async function scheduleMessage(text, delayInSeconds = 60) {
  const futureTime = Math.floor(Date.now() / 1000) + delayInSeconds;

  const res = await axios.post("https://slack.com/api/chat.scheduleMessage", {
    channel: channelId,
    text: text,
    post_at: futureTime,
  }, {
    headers: {
      Authorization: `Bearer ${slackbotToken}`,
      "Content-Type": "application/json",
    },
  });

  console.log("Scheduled message ID:", res.data.scheduled_message_id);
  return res.data.scheduled_message_id;
}

//to retrieve any recent messages from the channel
async function getMessages() {
  const res = await axios.get("https://slack.com/api/conversations.history", {
    params: { channel: channelId },
    headers: {
      Authorization: `Bearer ${slackbotToken}`,
    },
  });

  console.log(JSON.stringify(res.data, null, 2));

  if (!res.data.ok) {
    console.error("Slack API error:", res.data.error);
    return;
  }

  console.log("Recent Messages:");
  res.data.messages.forEach((msg, idx) => {
    console.log(`${idx + 1}: ${msg.text} (ts: ${msg.ts})`);
  });
}

// bot main menu
function showMenu() {
  rl.question("Choose: (send message/schedule message/get messages/exit): ", async (choice) => {
    switch (choice.trim().toLowerCase()) {
      case "send message":
        rl.question("Enter message to send: ", async (msg) => {
          await sendMessage(msg);
          showMenu();
        });
        break;
      case "schedule message":
        rl.question("Enter message to schedule: ", (msg) => {
          rl.question("After how many seconds do you want the message to be sent? ", async (seconds) => {
            await scheduleMessage(msg, parseInt(seconds));
            showMenu();
          });
        });
        break;
      case "get messages":
        await getMessages();
        showMenu();
        break;
      case "exit":
        console.log("Exiting...");
        rl.close();
        break;
      default:
        console.log("Invalid option. Try again.");
        showMenu();
        break;
    }
  });
}

//finally
showMenu();
