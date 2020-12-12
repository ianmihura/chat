const videoGrid = document.getElementById('video-grid')
const myVideo = document.createElement('video')
myVideo.muted = true

document.getElementsByTagName("form")[0].addEventListener("submit", (e) => {
    e.preventDefault()

    let message = document.getElementById("your-message").value
    sendMessage(message)

    document.getElementById("your-message").value = ""
});

document.getElementById("your-message").addEventListener("input", (e) => {
    emit('typing', e.target.value)
});

let addMessage = function (userId, message) {
    let div = document.createElement("div")
    div.classList.add("item")
    div.innerText = `${userId}\n${message}`

    document.getElementById("message-board").appendChild(div)
};

let showUserTyping = function (userId, isTyping) {
    document.getElementById("isTyping").innerText = ""

    if (!isTyping) return;

    document.getElementById("isTyping").innerText = `${userId} is typing...`
};

let addVideoStream = function (video, stream) {
    video.srcObject = stream
    video.addEventListener('loadedmetadata', () => {
        video.play()
    })

    videoGrid.appendChild(video)
};

let addPeerList = function () {
    document.getElementById("peer-board").innerText = ""

    Object.keys(peers).map((k) => {
        document.getElementById("peer-board").innerText += `\n${k} is connected`
    })
};

let sendMessage = function (message) {
    if (document.getElementById("useWebRTC").checked)
        sendData(message)
    else
        emit("message", message)

    emit("typing", false)

    addMessage(USER_ID, message)
};
