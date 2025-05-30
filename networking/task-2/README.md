# Cross-Device File Broadcast System

A UDP-based file metadata broadcasting system with TCP-based file transfer capabilities.

## Project Analysis

### Implementation Overview

The project successfully implements the core requirements:

- UDP server on port 41234 using `dgram`
- File metadata broadcasting with MAC addresses
- Multicast address `224.0.0.114` for local network
- Self-broadcast filtering
- TCP-based file transfer system

### Follow-up Questions Analysis

#### Packet Duplication Prevention (Score: 15/20)

Your response correctly identifies the problem and suggests using packet keys for identification. However, it could be improved by:

1. **Sequence Number System**

```typescript
interface PacketHeader {
  sequenceNumber: number;
  timestamp: number;
  macAddress: string;
}

class PacketManager {
  private sequenceCounter: number = 0;
  private receivedPackets: Set<string> = new Set();

  createPacket(metadata: FileMetadata): Buffer {
    const header: PacketHeader = {
      sequenceNumber: this.sequenceCounter++,
      timestamp: Date.now(),
      macAddress: metadata.macAddress,
    };

    const packetKey = `${header.sequenceNumber}-${header.macAddress}`;
    return Buffer.from(JSON.stringify({ header, metadata }));
  }

  isDuplicate(packet: Buffer): boolean {
    const { header } = JSON.parse(packet.toString());
    const packetKey = `${header.sequenceNumber}-${header.macAddress}`;

    if (this.receivedPackets.has(packetKey)) {
      return true;
    }

    this.receivedPackets.add(packetKey);
    return false;
  }
}
```

2. **Timestamp-based Deduplication**

```typescript
class TimestampDeduplicator {
  private packetWindow: Map<string, number> = new Map();
  private readonly WINDOW_SIZE = 5000; // 5 seconds

  isDuplicate(packet: Buffer): boolean {
    const { header } = JSON.parse(packet.toString());
    const packetKey = `${header.macAddress}-${header.sequenceNumber}`;
    const now = Date.now();

    // Clean old entries
    for (const [key, timestamp] of this.packetWindow.entries()) {
      if (now - timestamp > this.WINDOW_SIZE) {
        this.packetWindow.delete(key);
      }
    }

    if (this.packetWindow.has(packetKey)) {
      return true;
    }

    this.packetWindow.set(packetKey, now);
    return false;
  }
}
```

3. **Sliding Window Mechanism**

```typescript
class SlidingWindow {
  private window: Map<number, Packet> = new Map();
  private readonly WINDOW_SIZE = 10;
  private baseSequence = 0;

  addPacket(sequence: number, packet: Packet): void {
    if (sequence < this.baseSequence) {
      return; // Packet too old
    }

    if (sequence >= this.baseSequence + this.WINDOW_SIZE) {
      this.slideWindow(sequence - this.WINDOW_SIZE + 1);
    }

    this.window.set(sequence, packet);
  }

  private slideWindow(newBase: number): void {
    for (let i = this.baseSequence; i < newBase; i++) {
      this.window.delete(i);
    }
    this.baseSequence = newBase;
  }
}
```

4. **Packet Acknowledgment System**

```typescript
class AckSystem {
  private pendingAcks: Map<number, { timestamp: number; retries: number }> =
    new Map();
  private readonly MAX_RETRIES = 3;
  private readonly TIMEOUT = 1000;

  sendPacket(packet: Buffer, sequence: number): void {
    this.udpServer.send(packet, UDP_PORT, MULTICAST_ADDRESS, () => {
      this.pendingAcks.set(sequence, { timestamp: Date.now(), retries: 0 });
    });
  }

  handleAck(sequence: number): void {
    this.pendingAcks.delete(sequence);
  }

  checkTimeouts(): void {
    const now = Date.now();
    for (const [
      sequence,
      { timestamp, retries },
    ] of this.pendingAcks.entries()) {
      if (now - timestamp > this.TIMEOUT) {
        if (retries < this.MAX_RETRIES) {
          // Resend packet
          this.pendingAcks.set(sequence, {
            timestamp: now,
            retries: retries + 1,
          });
        } else {
          this.pendingAcks.delete(sequence);
        }
      }
    }
  }
}
```

#### UDP Payload Size (Score: 12/20)

Your response mentions keeping payloads small but lacks specific details about:

1. **Maximum Recommended UDP Payload Size**

```typescript
class UDPSizeManager {
  private readonly MAX_PAYLOAD_SIZE = 512; // Optimal size for most networks
  private readonly HEADER_SIZE = 20; // IP header size
  private readonly UDP_HEADER_SIZE = 8; // UDP header size

  calculateOptimalPayloadSize(): number {
    return this.MAX_PAYLOAD_SIZE - this.HEADER_SIZE - this.UDP_HEADER_SIZE;
  }

  splitLargePayload(data: Buffer): Buffer[] {
    const optimalSize = this.calculateOptimalPayloadSize();
    const chunks: Buffer[] = [];

    for (let i = 0; i < data.length; i += optimalSize) {
      chunks.push(data.slice(i, i + optimalSize));
    }

    return chunks;
  }
}
```

2. **Fragmentation Handling**

```typescript
class FragmentationManager {
  private fragments: Map<string, Map<number, Buffer>> = new Map();

  fragmentPacket(packet: Buffer, id: string): Buffer[] {
    const optimalSize = 512;
    const fragments: Buffer[] = [];
    const totalFragments = Math.ceil(packet.length / optimalSize);

    for (let i = 0; i < totalFragments; i++) {
      const fragment = packet.slice(i * optimalSize, (i + 1) * optimalSize);
      const fragmentHeader = Buffer.from(
        JSON.stringify({
          id,
          fragmentNumber: i,
          totalFragments,
          isLast: i === totalFragments - 1,
        })
      );

      fragments.push(Buffer.concat([fragmentHeader, fragment]));
    }

    return fragments;
  }

  reassemblePacket(fragment: Buffer): Buffer | null {
    const header = JSON.parse(fragment.slice(0, 100).toString());
    const fragmentData = fragment.slice(100);

    if (!this.fragments.has(header.id)) {
      this.fragments.set(header.id, new Map());
    }

    const packetFragments = this.fragments.get(header.id)!;
    packetFragments.set(header.fragmentNumber, fragmentData);

    if (packetFragments.size === header.totalFragments) {
      const reassembled = Buffer.concat(Array.from(packetFragments.values()));
      this.fragments.delete(header.id);
      return reassembled;
    }

    return null;
  }
}
```

3. **MTU Considerations**

```typescript
class MTUManager {
  private readonly DEFAULT_MTU = 1500;
  private interfaceMTUs: Map<string, number> = new Map();

  async detectInterfaceMTU(interfaceName: string): Promise<number> {
    try {
      // This is a simplified example. In reality, you'd use system commands
      // or network APIs to detect the actual MTU
      const mtu = await this.getInterfaceMTU(interfaceName);
      this.interfaceMTUs.set(interfaceName, mtu);
      return mtu;
    } catch (error) {
      console.warn(`Could not detect MTU for ${interfaceName}, using default`);
      return this.DEFAULT_MTU;
    }
  }

  getOptimalPayloadSize(interfaceName: string): number {
    const mtu = this.interfaceMTUs.get(interfaceName) || this.DEFAULT_MTU;
    return mtu - 28; // Subtract IP and UDP headers
  }
}
```

#### Network Interface Handling (Score: 14/20)

Your response correctly identifies the core concept but could be enhanced with:

1. **Interface Enumeration and Selection**

```typescript
import * as os from "os";

class NetworkInterfaceManager {
  private interfaces: Map<string, NetworkInterface> = new Map();

  async enumerateInterfaces(): Promise<void> {
    const networkInterfaces = os.networkInterfaces();

    for (const [name, interfaces] of Object.entries(networkInterfaces)) {
      if (!interfaces) continue;

      for (const iface of interfaces) {
        if (iface.family === "IPv4" && !iface.internal) {
          this.interfaces.set(name, {
            name,
            address: iface.address,
            netmask: iface.netmask,
            mac: await this.getInterfaceMAC(name),
          });
        }
      }
    }
  }

  selectBestInterface(): NetworkInterface | null {
    // Implement interface selection logic based on:
    // - Connection speed
    // - Reliability
    // - Current load
    // - User preference
    return this.findOptimalInterface();
  }
}
```

2. **Interface-specific Multicast Group Joining**

```typescript
class MulticastManager {
  private multicastGroups: Map<string, Set<string>> = new Map();

  async joinMulticastGroup(
    interfaceName: string,
    group: string
  ): Promise<void> {
    const socket = dgram.createSocket({
      type: "udp4",
      reuseAddr: true,
    });

    await new Promise<void>((resolve, reject) => {
      socket.bind(UDP_PORT, () => {
        socket.addMembership(group, this.getInterfaceAddress(interfaceName));
        this.multicastGroups.set(interfaceName, new Set([group]));
        resolve();
      });
    });
  }

  leaveMulticastGroup(interfaceName: string, group: string): void {
    const socket = this.getSocketForInterface(interfaceName);
    if (socket) {
      socket.dropMembership(group, this.getInterfaceAddress(interfaceName));
      this.multicastGroups.get(interfaceName)?.delete(group);
    }
  }
}
```

3. **Network Interface Status Monitoring**

```typescript
class InterfaceMonitor {
  private status: Map<string, InterfaceStatus> = new Map();
  private readonly CHECK_INTERVAL = 5000;

  startMonitoring(): void {
    setInterval(() => this.checkInterfaces(), this.CHECK_INTERVAL);
  }

  private async checkInterfaces(): Promise<void> {
    for (const [name, status] of this.status.entries()) {
      const newStatus = await this.checkInterfaceStatus(name);
      if (newStatus !== status) {
        this.handleStatusChange(name, newStatus);
      }
    }
  }

  private async checkInterfaceStatus(name: string): Promise<InterfaceStatus> {
    // Implement interface status checking logic
    // - Check if interface is up
    // - Check connection quality
    // - Check packet loss
    // - Check latency
    return this.getInterfaceMetrics(name);
  }
}
```

4. **Fallback Mechanisms**

```typescript
class InterfaceFallback {
  private primaryInterface: string;
  private backupInterfaces: string[];
  private currentInterface: string;

  constructor(primary: string, backups: string[]) {
    this.primaryInterface = primary;
    this.backupInterfaces = backups;
    this.currentInterface = primary;
  }

  async handleInterfaceFailure(failedInterface: string): Promise<void> {
    if (failedInterface === this.currentInterface) {
      const nextInterface = this.selectNextInterface();
      await this.switchToInterface(nextInterface);
    }
  }

  private async switchToInterface(interfaceName: string): Promise<void> {
    // Implement interface switching logic
    // - Close current connections
    // - Update routing
    // - Reestablish multicast groups
    // - Update broadcast settings
    await this.performSwitch(interfaceName);
  }
}
```

## Areas for Improvement

### 1. Error Handling and Recovery

- Implement robust error handling for network failures
- Add reconnection logic for TCP transfers
- Implement timeout mechanisms
- Add retry logic for failed broadcasts

### 2. Security Considerations

- Add data validation for incoming packets
- Implement basic authentication for file transfers
- Add checksum verification for file integrity
- Implement rate limiting for broadcasts

### 3. Performance Optimizations

- Implement connection pooling for TCP transfers
- Add compression for file transfers
- Implement chunked file transfer
- Add progress tracking for large files

### 4. Network Interface Management

- Add interface selection mechanism
- Implement interface status monitoring
- Add support for multiple simultaneous broadcasts
- Implement interface fallback strategy

### 5. User Experience

- Add command-line interface
- Implement interactive file selection
- Add transfer progress indicators
- Implement file transfer queue management

### 6. Testing and Monitoring

- Add unit tests for core functionality
- Implement integration tests
- Add network diagnostics
- Implement logging system

## Future Enhancements

1. **Protocol Improvements**

   - Implement reliable UDP (RUDP)
   - Add support for IPv6
   - Implement bandwidth throttling
   - Add support for encrypted transfers

2. **Scalability**

   - Implement peer discovery
   - Add support for multiple simultaneous transfers
   - Implement transfer prioritization
   - Add support for large file transfers

3. **User Interface**

   - Add GUI for file selection
   - Implement transfer progress visualization
   - Add network status monitoring
   - Implement file preview capabilities

4. **Network Optimization**
   - Implement adaptive buffer sizing
   - Add support for different network topologies
   - Implement network quality detection
   - Add support for proxy servers

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Build the project:

```bash
npm run build
```

3. Run the application:

```bash
npm start
```

## Usage

```typescript
const broadcastSystem = new FileBroadcastSystem();

// Broadcast a file
broadcastSystem.broadcastFile("/path/to/your/file.txt");

// Request a file
broadcastSystem.requestFile({
  macAddress: "00:11:22:33:44:55",
  fileName: "example.txt",
  fileSize: 1024,
});
```

## Contributing

Feel free to submit issues and enhancement requests!
