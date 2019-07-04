
//var Convert = require('./Conversions');
const WebSocket = require('ws');
var WSX = null; 

const WXListeners = [];

class WSPlusAuth extends WebSocket.Server {
    constructor(port)
    {
        super(port)
        this.UserCredential = null
    }
   // 
}




module.exports = {

    AddWSXLister: function(method){
        WXListeners.push(method);
    },
    RemoveWSXLister: function(method){
        WXListeners.splice( WXListeners.indexOf(method), 1 );
    },

    isUserOnline(UID)
    {
        WSX.clients.forEach(function each(ws) {
            if(ws.UserCredential == UID)
            {
                targetWs = ws;
                return true;
            }
            });
            return false;
    },

    UsersCount: function()
    {
        let x = 0;
        WSX.clients.forEach(function each(ws) {x++});
        return x;
    },

    Broadcast: function(data)
    {
        WSX.clients.forEach(function each(ws) {
                ws.send(data);
        });
    },

    Send:function(data, UserCredential , ClientObject){  //InputIsUTF8 use for JSON.Stringify!~!
        let x = data;
        
        var targetWs = null;

        if(ClientObject== undefined)
        {
            WSX.clients.forEach(function each(ws) {
                if(ws.UserCredential == UserCredential)
                {
                    targetWs = ws;
                    console.log("ratget found!");
                }
                });

            if(targetWs == null)
            {
                console.log("Ws Send Error: Usercredential did not match any client:\n UserCred, target:");
                console.log(UserCredential);
                console.log(targetWs);
                return;
            }
            targetWs.send(x);
            return;
        }

        ClientObject.send(x);
    },




    Start: function (port)
    {
        function noop() {}
        
        function heartbeat() {
            this.isAlive = true;
        }

        clientPool = [];
        
        WSX =  new WSPlusAuth({ port: port });

        console.log("websocket is waiting...");

        WSX.on('connection', function connection(ws) {
            console.log("websocket connection established...");

            for(let i = 0; i < WXListeners.length; i++)
            {
              if(WXListeners[i].onOpen!=undefined)
              {
                WXListeners[i].onOpen();
              }
            }


            ws.isAlive = true;
            
            ws.on('pong', heartbeat);

            ws.on('message', (data)=>{

                if(data.substring(0,8) == "AuthSet:")
                {
                    ws.UserCredential = data.substring(8);
                    console.log("User credencial set to:"+ws.UserCredential);
                    return;
                }

                else if(data.substring(0,17) == "AuthRequestBySMS:")
                {
                    let phone = data.substring(17);
                    for(let i = 0; i < WXListeners.length; i++)
                    {
                        if(WXListeners[i].onAuthRequestBySMS!=undefined)
                        {
                            WXListeners[i].onAuthRequestBySMS(phone,ws);
                        }
                    }
                    return;
                }

                else if(data.substring(0,20) == "AuthRequestByAVANAK:")
                {
                    let phone = data.substring(20);
                    for(let i = 0; i < WXListeners.length; i++)
                    {
                        if(WXListeners[i].onAuthRequestByAvanak!=undefined)
                        {
                            WXListeners[i].onAuthRequestByAvanak(phone,ws);
                        }
                    }
                    return;
                }

                else if(data.substring(0,19) == "GetCredencialByOTP:")
                {
                    let phone_otp = data.substring(19).split("-");
                    let phone = phone_otp[0];
                    let otp = phone_otp[1];

                    for(let i = 0; i < WXListeners.length; i++)
                    {
                        if(WXListeners[i].onGetCredentialByOTP!=undefined)
                        {
                            WXListeners[i].onGetCredentialByOTP(phone,otp,ws);
                        }
                    }
                    return;
                }

                


                for(let i = 0; i < WXListeners.length; i++)
                {
                    if(WXListeners[i].onMessage!=undefined)
                    {
                        WXListeners[i].onMessage(data,ws);
                    }
                }
            });


            ws.on("close",(e)=>{
                console.log("websocket connection closed");
                for(let i = 0; i < WXListeners.length; i++)
                {
                if(WXListeners[i].onClose!=undefined)
                {
                    WXListeners[i].onClose();
                }
                }

            })
            ws.on("error" , ()=>
            {
                console.log("error accurred!");
                for(let i = 0; i < WXListeners.length; i++)
                {
                if(WXListeners[i].onError!=undefined)
                {
                    WXListeners[i].onError();
                }
                }
            });


    })
    
    , interval = setInterval(function ping() {
         WSX.clients.forEach(function each(ws) {
         if (ws.isAlive === false) 
         {
             console.log("client terminated!");
             return ws.terminate();
         }
         ws.isAlive = false;
         ws.ping(noop);
         });
     }, 5000);

    }
}


