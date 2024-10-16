export function SOCKET(
    client: import('ws').WebSocket,
    request: import('http').IncomingMessage,
    server: import('ws').WebSocketServer,
  ) {
    client.on('message', async (message: string) => {
      const data = JSON.parse(message);
      console.log(data)
    });

    client.on("open", () => {
        console.log("Connected to WebSocket client");
        client.send(JSON.stringify({type: "identify"}));
    })
  }