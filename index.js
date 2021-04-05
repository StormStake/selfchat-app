const signalingChannel = new WebSocket("ws://35.161.208.116:9000")
const configuration = {'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]}
const peerConnection = new RTCPeerConnection(configuration);
const sendNameBtn = document.getElementById('sendOtherName')
const dataChannel = peerConnection.createDataChannel(false)
const loginBtn = document.getElementById("login")
var targetname = ''
loginBtn.addEventListener('click', () => {
    makeLogin().then(() => {
        console.log("login succesful maybe...")
    })
})

async function makeLogin() {
    const username = 'a'//document.getElementById("username").value
    var logindata = JSON.stringify({'type': 'login', 'name': username})
    signalingChannel.send(logindata)
}

sendNameBtn.addEventListener('click', () =>{
    
    targetname = 'b'//document.querySelector("#otherperson").value
    makeCall(targetname).then(() =>{
        console.log("test")
    }).catch((e) =>{
        console.log("fail")
    })
    
})

async function makeCall(target) {
    
    
    signalingChannel.addEventListener('message', async message => {
        var message = JSON.parse(message.data)
        
    if (message.answer) {
        console.log('setting remote desc')
        const remoteDesc = new RTCSessionDescription(message.answer);
        await peerConnection.setRemoteDescription(remoteDesc);
    }})

    console.log("setting local desc")
    const offer = await peerConnection.createOffer({'offerToReceiveAudio': false});
    await peerConnection.setLocalDescription(offer);
    signalingChannel.send(JSON.stringify({'type': 'offer', 'offer': offer, 'name': target}));
}


// Listen for local ICE candidates on the local RTCPeerConnection
peerConnection.addEventListener('icecandidate', event => {
    
    if (event.candidate) {
        
        signalingChannel.send(JSON.stringify({'type': 'candidate', 'candidate': event.candidate, 'name': targetname}))
        
    }
});

// Listen for remote ICE candidates and add them to the local RTCPeerConnection
signalingChannel.addEventListener('message', async message => {
    
    var vr = JSON.parse(message.data)
    
    if (vr.candidate) {
        try {
            console.log("setting cand "+vr.candidate)
            var candidate = new RTCIceCandidate(vr.candidate);
            await peerConnection.addIceCandidate(candidate);
            
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
peerConnection.addEventListener("icegatheringstatechange", ev => {
    switch(peerConnection.iceGatheringState) {
      case "new":
        console.log('New')
      break;
      case "gathering":
        console.log('Gathering')    
      break;
      case "complete":
            console.log('Complete')
        break;
    }
  });



dataChannel.onopen = sendMsg;

function sendMsg(event) {
    console.log("HELLOYES")
    dataChannel.send("HELLOWORLD")
}

peerConnection.oniceconnectionstatechange = e => console.log("ice connection "+peerConnection.iceConnectionState);

dataChannel.onmessage = e => console.log("FROM:B:"+e.data)