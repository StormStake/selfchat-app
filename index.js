const signalingChannel = new WebSocket("ws://35.161.208.116:9000")
const configuration = {'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]}
const peerConnection = new RTCPeerConnection(configuration);
const userNameBtn = document.getElementById('otherperson')
var dataChannel = undefined
const loginBtn = document.getElementById("login")
var targetname = ''
var username = ''
const msgBtn = document.getElementById("msgBtn")
const msgBox = document.getElementById("msgBox")



setInterval(()=>{
    console.log(peerConnection.connectionState)
},3000)


//called regardless
loginBtn.addEventListener('click', () => {
    makeLogin().then(() => {
        console.log("login succesful maybe...")
    })
})


async function makeLogin() {
    username = document.getElementById("username").value
    var logindata = JSON.stringify({'type': 'login', 'name': username})
    signalingChannel.send(logindata)
}

// Listener for remote ice candidates
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


//Debugging//
peerConnection.addEventListener('connectionstatechange', event => {
    if (peerConnection.connectionState === 'connected') {
        console.log('Connection state GO!')
    }
});

peerConnection.oniceconnectionstatechange = e => console.log("ice connection "+peerConnection.iceConnectionState);

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
//

function sendMsg(event) {

    if(peerConnection.connectionState === 'connected') {msgBtn.addEventListener("click",()=> {

        var message = {from:username, text:msgBox.value}

        var textnode = document.createElement('p')
        textnode.innerHTML = `From:${username}>`+message.text
        msgs.appendChild(textnode)
        dataChannel.send(JSON.stringify(message))
        msgBox.value = ""
    })}
}


//Puts the received msg on the msg box :Aaron
function onMessageAddtoMsgs(event) {

    var msg = JSON.parse(event.data)
    console.log(msg)
    var textnode = document.createElement('p')
    textnode.innerHTML = `From:${msg.from}>`+msg.text
    msgs.appendChild(textnode)
}

////////////////////////////////////////////////////////////////




//called if receiving
signalingChannel.addEventListener('message', async message => {
    message = JSON.parse(message.data)
    tarGet = message.name
    console.log(message)
    if (message.offer) {
        console.log("received offer")
        //Channel messaging handling :Aaron
        peerConnection.ondatachannel = ondata;
        peerConnection.setRemoteDescription(new RTCSessionDescription(message.offer));

        const answer = await peerConnection.createAnswer({'offerToReceiveAudio': false});

        console.log("set local desc")
        await peerConnection.setLocalDescription(answer)
        console.log('sending answer')
        peerConnection.addEventListener('icecandidate', event => {
            if (event.candidate) {
                console.log('making ice candidates')
                signalingChannel.send(JSON.stringify({'type': 'candidate', 'candidate': event.candidate, 'name': tarGet}))
            }
        })
        signalingChannel.send(JSON.stringify({'type': 'answer','answer': answer, 'name': message.name}))

    }
})


//rec side only
function ondata(event) {
    console.log('datachannel open')
    dataChannel = event.channel;
    dataChannel.onopen = sendMsg;
    dataChannel.onmessage = onMessageAddtoMsgs;
}



//called if sending
//Username :Aaron
userNameBtn.addEventListener('click', () =>{
    
    targetname = document.querySelector("#otherusername").value
    makeCall(targetname).then(() =>{
        console.log("test")
    }).catch((e) =>{
        console.log("fail")
    })
})


//Starts a connection as the starting end not symmetric :Aaron
async function makeCall(target) {
    console.log('Making call')
    dataChannel = peerConnection.createDataChannel(false)
    dataChannel.onopen = sendMsg;
    dataChannel.onmessage = onMessageAddtoMsgs;
    signalingChannel.addEventListener('message', async message => {
        var message = JSON.parse(message.data)
        
    if (message.answer) {
        console.log('setting remote description')
        const remoteDesc = new RTCSessionDescription(message.answer);
        await peerConnection.setRemoteDescription(remoteDesc);
        peerConnection.addEventListener('icecandidate', event => {
    
            if (event.candidate) {
                console.log('hello')
                signalingChannel.send(JSON.stringify({'type': 'candidate', 'candidate': event.candidate, 'name': targetname}))
                
            }
        });
    }})

    
    const offer = await peerConnection.createOffer({'offerToReceiveAudio': false});
    console.log("setting Local Description")
    await peerConnection.setLocalDescription(offer);
    signalingChannel.send(JSON.stringify({'type': 'offer', 'offer': offer, 'name': target}));


}



