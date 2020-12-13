window.dataChannels = {}

// Data channel Configuration & Event listeners (all)
let newDataChannel = function (userId) {
    if (window.dataChannels[userId] && window.dataChannels[userId].readyState != "closed")
        return false

    window.dataChannels[userId] = window.peerConnections[userId].createDataChannel("datachannel", {
        id: 0,
        negotiated: true,
        ordered: true
    })

    configureDataChannel(window.dataChannels[userId])
}

let configureDataChannel = function (dataChannel) {

    dataChannel.binaryType = 'arraybuffer'

    // Listen for data messages
    dataChannel.addEventListener('message', event => {
        console.log(event)
        const data = JSON.parse(event.data)
        addMessage(data.userId, data.message)
    })

    // Open and Close events
    dataChannel.addEventListener('open', event => {
        console.log(`Data channel succesfully opened`)
    })
    dataChannel.addEventListener('close', event => {
        console.log(`Data channel closed`)
    })
}

// Send data (all)
let sendData = function (message) {
    Object.keys(window.dataChannels).map((userId) =>
        window.dataChannels[userId].send(JSON.stringify({
            message: message,
            userId: USER_ID
        })))
}

// let sendChunk = function () {
//     let chunkSize = Math.min(peerConnection.sctp.maxMessageSize, 262144);
//     let dataString = new Array(chunkSize).fill('X').join('');
//     console.log(`Determined chunk size: ${chunkSize}\nFinal dataString size: ${dataString.length}`);

//     sendData(dataString)
// }