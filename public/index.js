$(document).ready(() => {
    navigator.mediaDevices.enumerateDevices()
        .then(devices => populateVideoOptions(devices))
        .catch(err => console.log(err))
})

let populateVideoOptions = function (devices) {
    // devices.map(device => {
    //     if (device.kind == "videoinput")
    //         addVideoOption(device)
    // })

    if (devices.find(d => d.kind == "videoinput"))
        addVideoOption({
            label: `Webcam`,
            deviceId: "webcam",
            default: true
        })

    addVideoOption({
        label: "Share screen",
        deviceId: "screen"
    })

    addVideoOption({
        label: "None",
        deviceId: "none"
    })

    $('.ui.checkbox').checkbox();

}

let addVideoOption = function (device) {
    document.getElementById("videoOptions").innerHTML += `
        <div class="field">
            <div class="ui radio checkbox">
                <input type="radio" name="video" value="${device.deviceId}" 
                ${device.default ? 'checked' : ''}>
                <label>${device.label}</label>
            </div>
        </div>`
}