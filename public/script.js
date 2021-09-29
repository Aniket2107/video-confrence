const socket = io("/");

const myPeer = new Peer(undefined, {
  host: location.hostname,
  port: location.port || (location.protocol === "https:" ? 443 : 80),
  path: "/peerjs",
});

let myVideoStream;
const videoGrid = document.getElementById("video-grid");

//Message
const messageContainer = document.getElementById("message-container");
const messageForm = document.getElementById("send-container");
const messageInput = document.getElementById("chat_message");

//Toggle Btns
const videoToggleBtn = document.getElementById("stopVideo");
const audioToggleBtn = document.getElementById("muteButton");

const InviteBtn = document.getElementById("inviteButton");

let allPeers = {};

const myVideo = document.createElement("video");
myVideo.muted = true;

let isVideo = true;
let isAudio = true;

navigator.mediaDevices
  .getUserMedia({
    audio: true,
    video: true,
  })
  .then((stream) => {
    myVideoStream = stream;

    addVideoStream(myVideo, stream);

    myPeer.on("call", (call) => {
      call.answer(stream);

      const video = document.createElement("video");

      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
      });
    });

    socket.on("user-connected", (userId) => {
      // console.log("called");
      connectToNewUser(userId, stream);
    });
  });

myPeer.on("open", (id) => {
  socket.emit("join-room", ROOM_ID, id);
});

socket.on("user-disconnected", (userId) => {
  // console.log("user-diconnected", userId);
  if (allPeers[userId]) allPeers[userId].close();
});

socket.on("chat-message", (data) => {
  appendMessage(`${data.userId}: ${data.message}`);
});

messageForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const message = messageInput.value;

  console.log(message);
  appendMessage(`You: ${message}`);
  socket.emit("send-message", message, USERNAME);
  messageInput.value = "";
});

videoToggleBtn.addEventListener("click", enableVideo);

function enableVideo() {
  if (isVideo) {
    disableVideo();
    return;
  }

  myVideoStream.getVideoTracks()[0].enabled =
    !myVideoStream.getVideoTracks()[0].enabled;
  isVideo = true;

  videoToggleBtn.style.backgroundColor = "#2f80ec";
}

function disableVideo() {
  if (!isVideo) {
    enableVideo();
    return;
  }

  myVideoStream.getVideoTracks()[0].enabled =
    !myVideoStream.getVideoTracks()[0].enabled;
  isVideo = false;

  videoToggleBtn.style.backgroundColor = "red";
}

function enableAudio() {
  if (isAudio) {
    disableAudio();
    return;
  }

  myVideoStream.getAudioTracks()[0].enabled =
    !myVideoStream.getAudioTracks()[0].enabled;

  isAudio = true;
  audioToggleBtn.style.backgroundColor = "#2f80ec";
}

function disableAudio() {
  if (!isAudio) {
    enableAudio();
    return;
  }

  myVideoStream.getAudioTracks()[0].enabled =
    !myVideoStream.getAudioTracks()[0].enabled;

  isAudio = false;
  audioToggleBtn.style.backgroundColor = "red";
}

audioToggleBtn.addEventListener("click", enableAudio);

const addVideoStream = (video, stream) => {
  console.log("videoadd");

  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  videoGrid.append(video);
};

const connectToNewUser = (userId, stream) => {
  const call = myPeer.call(userId, stream);

  console.log("connect new");

  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  });

  call.on("close", () => {
    video.remove();
  });

  allPeers[userId] = call;
};

function appendMessage(message) {
  const messageElement = document.createElement("div");
  messageElement.innerText = message;
  messageContainer.append(messageElement);
}

InviteBtn.addEventListener("click", copyInvite);

async function copyInvite() {
  const msg = window.location.href;

  await navigator.clipboard.writeText(msg);

  alert("Copied the text: " + msg);
}

function instantMeet() {
  const id = uuidv4();

  window.location.href = `${window.location.host}/${id}`;
}

function redirectToMeet() {
  const code = document.querySelector("#codeInput").value;
  if (!code || code.length < 3) return;

  window.location.href = `${window.location.host}/${code}`;
}
