
let getVideoGrid = function () {
    return document.getElementById('video-grid')
}

let newVideo = function () {
    let video = document.createElement('video')
    video.mute = true
    return video
}

let addMessage = function (userId, message) {
    let div = document.createElement("div")
    div.classList.add("item")
    div.innerText = `${userId}\n${message}`

    document.getElementById("message-board").appendChild(div)
    updateMessageScroll()
}

let addFile = function (userId) {
    addRibbon(userId, "sent you a file", "paperclip", "a")
}

let addPeerMessageBoard = function (userId) {
    addRibbon(userId, "entered the room", "user", "div")
}

let deletePeerMessageBoard = function (userId) {
    addRibbon(userId, "left the room", "user", "div")
}

let addRibbon = function (userId, message, icon, tag) {
    document.getElementById("message-board").innerHTML += `
        <${tag} class="ui ribbon label" >
            <i class="${icon} icon"></i>
            ${userId} ${message}
        </${tag}>`
}

let showUserTyping = function (userId, isTyping) {
    document.getElementById("isTyping").innerText = ""

    if (!isTyping) return;

    document.getElementById("isTyping").innerText = `${userId} is typing...`
}

let addVideoPreview = function (userId) {
    let video = document.createElement('video')
    video.src = "/media/loading.mp4"
    video.id = getVideoPreviewId(userId)
    video.play()
    video.loop = true
    getVideoGrid().appendChild(video)
}

let getVideoPreviewId = function (userId) {
    return `video-preview-${userId}`
}

let deleteVideoPreview = function (userId) {
    let video = document.getElementById(getVideoPreviewId(userId))
    if (video)
        getVideoGrid().removeChild(video)
}

let addVideoStream = function (stream, userId) {
    let video = newVideo()

    video.srcObject = stream
    video.userId = userId
    video.addEventListener('loadedmetadata', () => {
        video.play()
    })

    getVideoGrid().appendChild(video)
}

let deleteVideoStream = function (userId) {
    for (var i = 0; i < getVideoGrid().children.length; i++) {
        let video = getVideoGrid().children[i]
        if (video.userId == userId) {
            getVideoGrid().removeChild(video)
            break
        }
    }
}

let addPeerList = function () {
    document.getElementById("peer-board").innerText = ""

    Object.keys(peers).map((k) => {
        document.getElementById("peer-board").innerText += `\n${k} is connected`
    })
}

let sendMessage = function (message) {
    if (document.getElementById("useWebRTC").checked)
        sendData(message)
    else
        emit("message", message)

    emit("typing", false)

    addMessage(USER_ID, message)
};

document.getElementsByTagName("form")[0].addEventListener("submit", (e) => {
    e.preventDefault()

    let message = document.getElementById("your-message").value
    sendMessage(message)

    document.getElementById("your-message").value = ""
})

document.getElementById("your-message").addEventListener("input", (e) => {
    emit('typing', e.target.value)
})

let updateMessageScroll = function () {
    var element = document.getElementById("message-board");
    element.scrollTop = element.scrollHeight;
}