const socket = io("/");

const myPeer = new Peer(undefined, {
  host: location.hostname,
  port: 3001,
  path: "/",
});

//location.port || (location.protocol === "https:" ? 443 : 80)
//peerjs

let myVideoStream;
const videoGrid = document.getElementById("video-grid");

//Message
const messageContainer = document.getElementById("message-container");
const messageForm = document.getElementById("send-container");
const messageInput = document.getElementById("chat_message");

//Toggle Btns
const videoToggleBtn = document.getElementById("stopVideo");
const audioToggleBtn = document.getElementById("muteButton");

//Record
const RecordBtn = document.getElementById("recordBtn");
const stopRecordBtn = document.getElementById("stopRecordBtn");
const downloadLink = document.getElementById("download");

//Search btns
const userSearchInput = document.getElementById("userSearch_input");
const toggleUserDataBtn = document.getElementById("toggleUserData");
const userInfoRight = document.getElementById("userInfoRight");
let usersData = [];
let isUserSearchOpen = false;

let shouldStop = false;
let stopped = false;

const InviteBtn = document.getElementById("inviteButton");
const CopyInviteBnt = document.getElementById("copyInviteBtn");
const SendMailBtn = document.getElementById("sendMailBtn");

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
  socket.emit("join-room", ROOM_ID, id, USERNAME);
});

socket.on("user-disconnected", (userId) => {
  // console.log("user-diconnected", userId);
  if (allPeers[userId]) allPeers[userId].close();
});

socket.on("chat-message", (data) => {
  appendMessage(`${data.userId}: ${data.message}`);
});

toggleUserDataBtn.addEventListener("click", function () {
  if (isUserSearchOpen) {
    isUserSearchOpen = false;
    messageForm.style.display = "";
    userInfoRight.style.display = "none";
    return;
  }

  isUserSearchOpen = true;
  messageForm.style.display = "none";
  userInfoRight.style.display = "";
  return;
});

function updateUserData(currData) {
  let usersList = document.querySelector("#userinfo_div");
  usersList.style.padding = "1rem";
  usersList.innerHTML = "";

  if (typeof currData === "string") {
    const pElement = document.createElement("p");
    pElement.innerHTML = currData;

    usersList.appendChild(pElement);

    return;
  }

  let ol = document.createElement("ol");

  currData.forEach(function (user) {
    let li = document.createElement("li");
    li.innerHTML = user;
    li.style.padding = "5px";
    ol.appendChild(li);
  });

  // console.log(ol);

  usersList.appendChild(ol);
}

userSearchInput.addEventListener("change", function (e) {
  const val = e.target.value.toLowerCase();
  let currData;
  if (val === "") {
    currData = usersData;
    updateUserData(currData);
    return;
  }

  currData = usersData.filter((el) => el.toLowerCase().includes(val));

  if (currData.length === 0) {
    updateUserData("No such user found");
    return;
  }

  updateUserData(currData);
});

socket.on("updateUsersList", function (users) {
  // userList = users;
  console.log("update check");
  usersData = users;

  updateUserData(users);
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

const videoElement = document.createElement("video");

function stopRecord() {
  // downloadLink.style.display = "block";
}

// function startRecord() {}

stopRecordBtn.addEventListener("click", function () {
  shouldStop = true;
});

const handleRecord = function ({ stream, mimeType }) {
  // startRecord()
  let recordedChunks = [];
  stopped = false;
  const mediaRecorder = new MediaRecorder(stream);

  mediaRecorder.ondataavailable = function (e) {
    if (e.data.size > 0) {
      recordedChunks.push(e.data);
    }

    if (shouldStop === true && stopped === false) {
      mediaRecorder.stop();
      stopped = true;
    }
  };

  mediaRecorder.onstop = function () {
    const blob = new Blob(recordedChunks, {
      type: mimeType,
    });
    recordedChunks = [];
    const filename = window.prompt("Enter file name");
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = `${filename || "recording"}.webm`;
    stopRecord();
    // shouldStop = true;
    videoElement.srcObject = null;
  };

  mediaRecorder.start(200);
};

async function recordScreen() {
  const mimeType = "video/webm";
  shouldStop = false;
  const constraints = {
    video: {
      cursor: "motion",
    },
  };
  if (!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia)) {
    return window.alert("Screen Record not supported!");
  }
  let stream = null;
  const displayStream = await navigator.mediaDevices.getDisplayMedia({
    video: { cursor: "motion" },
    audio: { echoCancellation: true },
  });
  if (window.confirm("Record audio with screen?")) {
    const audioContext = new AudioContext();

    const voiceStream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true },
      video: false,
    });
    const userAudio = audioContext.createMediaStreamSource(voiceStream);

    const audioDestination = audioContext.createMediaStreamDestination();
    userAudio.connect(audioDestination);

    if (displayStream.getAudioTracks().length > 0) {
      const displayAudio = audioContext.createMediaStreamSource(displayStream);
      displayAudio.connect(audioDestination);
    }

    const tracks = [
      ...displayStream.getVideoTracks(),
      ...audioDestination.stream.getTracks(),
    ];
    stream = new MediaStream(tracks);
    handleRecord({ stream, mimeType });
  } else {
    stream = displayStream;
    handleRecord({ stream, mimeType });
  }
  videoElement.srcObject = stream;
}

RecordBtn.addEventListener("click", () => {
  recordScreen();
});

function openModal() {
  document.getElementById("main").style.opacity = "0.7";

  document.getElementById("modal").style.display = "block";
}

InviteBtn.addEventListener("click", openModal);
CopyInviteBnt.addEventListener("click", copyInvite);
SendMailBtn.addEventListener("click", sendEmail);

async function copyInvite() {
  document.getElementById("main").style.opacity = "1";
  document.getElementById("modal").style.display = "none";

  const msg = window.location.href;

  await navigator.clipboard.writeText(msg);

  alert("Copied the text: " + msg);
}

async function sendEmail() {
  document.getElementById("main").style.opacity = "1";
  document.getElementById("modal").style.display = "none";

  let meetLink = window.location.href;
  let email = prompt("Enter recipient’s email address");

  const re =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

  console.log(email);

  if (!email || !re.test(email)) {
    alert("Please enter a valid email address");
    return;
  }

  try {
    const res = await fetch("/api/sendMail", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user: USERNAME,
        email,
        meetLink,
      }),
    });

    const data = await res.json();
    if (data.result) alert("Message sent sucessfully ;)");
  } catch (error) {
    alert("Something went wrong,Try again");
  }
}
