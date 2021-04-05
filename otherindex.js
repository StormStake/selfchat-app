const configuration = {'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]}
const signalingChannel = new WebSocket("ws://35.161.208.116:9000")
const peerConnection = new RTCPeerConnection(configuration);
const msgBtn = document.getElementById("msgBtn")
const msgBox = document.getElementById("msgBox")
const msgs = document.getElementById("msgs")
var tarGet = 'un'


    const loginBtn = document.getElementById("login")

    loginBtn.addEventListener('click', () => {
        makeLogin().then(() => {
            console.log("login succesful maybe...")
        })
    })
    
    async function makeLogin() {
        const username = document.getElementById("username").value
        var logindata = JSON.stringify({'type': 'login', 'name': username})
        signalingChannel.send(logindata)
    }
    



    signalingChannel.addEventListener('message', async message => {
        message = JSON.parse(message.data)
        tarGet = message.name
        
        if (message.offer) {
            console.log("setting offer to remote desc")
            peerConnection.setRemoteDescription(new RTCSessionDescription(message.offer));
            const answer = await peerConnection.createAnswer({'offerToReceiveAudio': false});
            await peerConnection.setLocalDescription(answer);
            console.log('sending answer')
            signalingChannel.send(JSON.stringify({'type': 'answer','answer': answer, 'name': message.name}));
        }
    });

// Listen for local ICE candidates on the local RTCPeerConnection
peerConnection.addEventListener('icecandidate', event => {
    
    if (event.candidate) {
        signalingChannel.send(JSON.stringify({'type': 'candidate', 'candidate': event.candidate, 'name': tarGet}));
    }
});

// Listen for remote ICE candidates and add them to the local RTCPeerConnection
signalingChannel.addEventListener('message', async message => {
    var vr = JSON.parse(message.data)
    if (vr.candidate) {
        try {
            console.log("testing ice candidate")
            tarGet = message.name
            await peerConnection.addIceCandidate(vr.candidate);
            console.log("cs state is "+peerConnection.connectionState)
        } catch (e) {
            console.error('Error adding received ice candidate', e);
        }
    }
});

peerConnection.addEventListener('connectionstatechange', event => {
    if (peerConnection.connectionState === 'connected') {
        console.log('Connection state GO!')
    }
});

peerConnection.ondatachannel = ondata;

function ondata(event) {
    console.log('datachannel open')
    var chan = event.channel;
    chan.onopen = e => {
        chan.send("test")
        msgBtn.addEventListener("click", () => {
            chan.send(msgBox.value)
            
        })
    }
    chan.onmessage = print;

}



function print(event) {
    var textnode = document.createElement('p')
    textnode.innerHTML = `From:${event.data.name}>`+event.data.text
    msgs.appendChild(textnode)
}


peerConnection.oniceconnectionstatechange = e => console.log("ice   "+peerConnection.iceConnectionState);