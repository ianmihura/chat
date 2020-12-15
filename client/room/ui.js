let _getVideoGrid = function () {
    return document.getElementById('video-grid')
}

let _newVideo = function () {
    let video = document.createElement('video')
    video.mute = true
    return video
}

let _addRibbon = function (userId, message, icon) {
    document.getElementById("message-board").innerHTML += `
        <div class="ui ribbon label" >
            <i class="${icon} icon"></i>
            ${userId} ${message}
        </div>`
}

let _getVideoPreviewId = function (userId) {
    return `video-preview-${userId}`
}

let _updateMessageScroll = function () {
    var element = document.getElementById("message-board");
    element.scrollTop = element.scrollHeight;
}

let _addCustomEventListener = function (eId, type, callback) {
    document.getElementById(eId).addEventListener(type, (e) => {
        callback(e)
    })
}

module.exports = {
    formEventListener: function (sendMessage) {
        _addCustomEventListener("message-board-form", "submit", (e) => {
            e.preventDefault()

            sendMessage(document.getElementById("your-message").value)
            document.getElementById("your-message").value = ""
        })
    },

    addCustomEventListener: _addCustomEventListener,

    showUserTyping: function (userId, isTyping) {
        document.getElementById("isTyping").innerText = ""
        if (!isTyping) return;
        document.getElementById("isTyping").innerText = `${userId} is typing...`
    },

    addMessage: function (userId, message) {
        let div = document.createElement("div")
        div.classList.add("item")
        div.innerText = `${userId}\n${message}`

        document.getElementById("message-board").appendChild(div)
        _updateMessageScroll()
    },

    addFile: function (userId) {
        document.getElementById("message-board").innerHTML += `
            <a class="ui ribbon label" onclick="downloadFile('${userId}')">
                <i class="paperclip icon"></i>
                ${userId} sent you a file
            </a>`
    },

    addVideoStream: function (stream, userId) {
        let video = _newVideo()

        video.srcObject = stream
        video.userId = userId
        video.addEventListener('loadedmetadata', () => {
            video.play()
        })

        _getVideoGrid().appendChild(video)
    },

    deleteVideoStream: function (userId) {
        for (var i = 0; i < _getVideoGrid().children.length; i++) {
            let video = _getVideoGrid().children[i]
            if (video.userId == userId) {
                _getVideoGrid().removeChild(video)
                break
            }
        }
    },

    addVideoPreview: function (userId) {
        let video = document.createElement('video')
        video.src = "/media/loading.mp4"
        video.id = _getVideoPreviewId(userId)
        video.play()
        video.loop = true
        _getVideoGrid().appendChild(video)
    },

    deleteVideoPreview: function (userId) {
        let video = document.getElementById(_getVideoPreviewId(userId))
        if (video)
            _getVideoGrid().removeChild(video)
    },

    addPeerMessageBoard: function (userId) {
        _addRibbon(userId, "entered the room", "user", "div")
    },

    deletePeerMessageBoard: function (userId) {
        _addRibbon(userId, "left the room", "user", "div")
    }
}