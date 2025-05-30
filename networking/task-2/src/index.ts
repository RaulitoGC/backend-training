import * as dgram from "dgram";
import * as net from "net";
import * as macaddress from "macaddress";
import * as fs from "fs";
import * as path from "path";

// Constants
const UDP_PORT = 41234;
const TCP_PORT = 41235;
const MULTICAST_ADDRESS = "224.0.0.114";
const SEPARATOR = "|";

// Interface for file metadata
interface FileMetadata {
  macAddress: string;
  fileName: string;
  fileSize: number;
}

class FileBroadcastSystem {
  private udpServer: dgram.Socket;
  private tcpServer: net.Server;
  private ownMacAddress: string;

  constructor() {
    this.udpServer = dgram.createSocket({
      type: "udp4",
      reuseAddr: true,
    });
    this.tcpServer = net.createServer();
    this.ownMacAddress = "";
    this.initialize();
  }

  private async initialize() {
    try {
      // Get own MAC address
      this.ownMacAddress = await macaddress.one();
      console.log("Own MAC Address:", this.ownMacAddress);

      // Setup UDP server
      this.setupUdpServer();

      // Setup TCP server for file transfers
      this.setupTcpServer();
    } catch (error) {
      console.error("Initialization error:", error);
    }
  }

  private setupUdpServer() {
    this.udpServer.on("error", (err: Error) => {
      console.error("UDP Server error:", err);
    });

    this.udpServer.on("message", (msg: Buffer, rinfo: dgram.RemoteInfo) => {
      const message = msg.toString();
      const [macAddress, fileName, fileSize] = message.split(SEPARATOR);

      // Ignore own broadcasts
      if (macAddress === this.ownMacAddress) {
        return;
      }

      console.log(`Received file offer from ${macAddress}:`);
      console.log(`File: ${fileName}, Size: ${fileSize} bytes`);

      // In a real implementation, you might want to show this to the user
      // and let them decide whether to download the file
    });

    // Bind to all interfaces first
    this.udpServer.bind(UDP_PORT, () => {
      console.log(`UDP Server listening on port ${UDP_PORT}`);
      // Join multicast group after binding
      this.udpServer.addMembership(MULTICAST_ADDRESS);
    });
  }

  private setupTcpServer() {
    this.tcpServer.on("connection", (socket: net.Socket) => {
      console.log("TCP connection established");

      socket.on("data", (data: Buffer) => {
        // Handle incoming file data
        // In a real implementation, you would save this to a file
        console.log("Received file data:", data.length, "bytes");
      });

      socket.on("end", () => {
        console.log("TCP connection closed");
      });
    });

    this.tcpServer.listen(TCP_PORT, () => {
      console.log(`TCP Server listening on port ${TCP_PORT}`);
    });
  }

  public broadcastFile(filePath: string) {
    try {
      const stats = fs.statSync(filePath);
      const fileName = path.basename(filePath);

      const metadata: FileMetadata = {
        macAddress: this.ownMacAddress,
        fileName: fileName,
        fileSize: stats.size,
      };

      const message = `${metadata.macAddress}${SEPARATOR}${metadata.fileName}${SEPARATOR}${metadata.fileSize}`;

      this.udpServer.send(
        message,
        UDP_PORT,
        MULTICAST_ADDRESS,
        (err: Error | null) => {
          if (err) {
            console.error("Error broadcasting file:", err);
          } else {
            console.log("File broadcasted successfully");
          }
        }
      );
    } catch (error) {
      console.error("Error preparing file broadcast:", error);
    }
  }

  public async requestFile(metadata: FileMetadata) {
    const client = new net.Socket();

    client.connect(TCP_PORT, "localhost", () => {
      console.log("Connected to TCP server");
      // In a real implementation, you would request the specific file
      // and handle the incoming data
    });

    client.on("data", (data: Buffer) => {
      // Handle received file data
      console.log("Received file data:", data.length, "bytes");
    });

    client.on("end", () => {
      console.log("File transfer completed");
    });

    client.on("error", (err: Error) => {
      console.error("TCP connection error:", err);
    });
  }
}

// Example usage
const broadcastSystem = new FileBroadcastSystem();

// Example: Broadcast a file
// broadcastSystem.broadcastFile('/path/to/your/file.txt');

// Example: Request a file
// broadcastSystem.requestFile({
//     macAddress: '00:11:22:33:44:55',
//     fileName: 'example.txt',
//     fileSize: 1024
// });
