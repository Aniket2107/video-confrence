const express = require("express");
const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const { ExpressPeerServer } = require("peer");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();
const app = express();

const { Users } = require("./util");

//Gmail api credientials
const CLIENT_ID = process.env.CLIENT_ID;
const CLEINT_SECRET = process.env.CLEINT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;
const EMAIL = process.env.EMAIL;

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLEINT_SECRET,
  REDIRECT_URI
);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

app.use(express.json());
app.set("view engine", "ejs");

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);

const io = require("socket.io")(server);

const peerServer = ExpressPeerServer(server, {
  debug: process.env.NODE_ENV === "development",
});

// Middlewares
app.use("/peerjs", peerServer);

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.render("home", {
    roomId: uuidv4(),
  });
});

app.post("/api/sendMail", async (req, res) => {
  try {
    const accessToken = await oAuth2Client.getAccessToken();

    const transport = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: EMAIL,
        clientId: CLIENT_ID,
        clientSecret: CLEINT_SECRET,
        refreshToken: REFRESH_TOKEN,
        accessToken: accessToken,
      },
    });

    const FROM = `TEAM VCL <${EMAIL}>`;

    const mailOptions = {
      from: FROM,
      to: req.body.email,
      subject: "Meeting invite link",
      html: `<!doctype html>
      <html>
      
      <head>
        <style type='text/css'>
          href>a {
            text-decoration: none
          }
      
          body {
            margin: 0px;
            padding: 0px;
            font-family: 'Helvetica', 'Arial', sans-serif;
          }
      
          a {
            text-decoration: none;
            color: #4E83BF;
          }
      
          .small {
            font-size: 12px;
          }
        </style>
      </head>
      
      <body> <br><br>
        <center><h3>${req.body.user} invited to a live meeting @ VCL click on the link(s) below to join</h3></center>    
        <table width='100%' style='font-size: 14px; font-weight: 300; color: #4A4A4A;'>
          <tr>
            <td colspan='3' align='center' style='background-color: #F4F4F4; padding: 28px 0 20px 0;'>
              <table align=center cellpadding=0 cellspacing=0>
                <tr>
                  <td><b><a href=${req.body.meetLink} style='color: #FFFFFF; font-size: 20px; background-color: #83C36D; border-radius: 4px; border: 8px solid #83C36D;'>     Join the meeting     </a></b></td>
                </tr>
              </table>
              <p style='margin: 24px 0 8px 0'><span class='small'>Meeting link: <a href=${req.body.meetLink}>${req.body.meetLink}</a></span></p>
            </td>
          </tr>
        </table>
        <center><span style='font-size: 12px; font-weight: 300; color: #4A4A4A;'>© 2021 VCL, Inc. All rights Reserved.</span></center><br><br><br></body>
      </html>
    `,
    };

    const result = await transport.sendMail(mailOptions);
    return res.status(200).json({ result });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get("/:room", (req, res) => {
  res.render("room", {
    roomId: req.params.room,
    port: process.env.NODE_ENV === "production" ? 443 : 3001,
  });
});

let users = new Users();

console.log(users);

io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId, username) => {
    socket.join(roomId);

    socket.to(roomId).emit("user-connected", userId);

    users.removeUser(username);
    users.addUser(userId, username);

    io.to(roomId).emit("updateUsersList", users.getUserList());

    socket.on("send-message", (message, username) => {
      socket.to(roomId).emit("chat-message", {
        message: message,
        userId: username,
      });
    });

    socket.on("shareScreen", (video) => {
      socket.to(roomId).emit("screenShare", video);
    });

    socket.on("disconnect", () => {
      let user = users.removeUser(username);

      if (user) {
        io.to(user.room).emit("updateUsersList", users.getUserList());
      }
      socket.to(roomId).emit("user-disconnected", userId);
    });
  });
});
