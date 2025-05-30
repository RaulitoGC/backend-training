import express from "express";
import os from 'os';
import { publicIpv4 } from 'public-ip';
import dns from 'node:dns/promises';
import find from 'local-devices';

const app = express();
const PORT = 3000;
const IP = '192.168.100.14';
const privateRanges = [
    '10.0.0.0 – 10.255.255.255', // Class A
    '172.16.0.0 – 172.31.255.255', // Class b
    '192.168.0.0 – 192.168.255.255' // Class C
];

const getClassByPrivateIp = (ip: String|undefined): String => {
    console.log('Ip Address: ', ip)

    let categoryClass: String = "No Class";
    console.log('Category: ', ip?.startsWith('192'));
    if(ip?.startsWith('10')) {
        categoryClass = "Class A";
    } else if(ip?.startsWith('172')) {
        categoryClass = "Class B";
    } else if(ip?.startsWith('192')) {
        categoryClass = "Class C";
    }
    return `${ip} with ${categoryClass}`
}

const getUptime = () => os.uptime(); // returns seconds

const getConnectedDevices = async () => {
    try {
        return await find();
    } catch (e) {
        return [];
    }
};

const getPublicIP = async () => {
    try {
        return await publicIpv4();
    } catch (e) {
        return 'Unavailable';
    }
};

const getRouterDNS = async () => {
    try {
        // Replace with your router's hostname or IP if known
        const addresses = await dns.resolve('192.168.100.1');
        return addresses;
    } catch (e) {
        return ['Unavailable'];
    }
};

app.use(express.static('public'));

app.listen(PORT, IP, () => {
    console.log(`Listening on ${IP}:${PORT}`)
})

app.get('/events', async (req, res) => {
    res.set({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });
    res.flushHeaders();

    const sendStats = async () => {
        const stats = {
            publicIP: await getPublicIP(),
            routerDNS: await getRouterDNS(),
            privateIp: getClassByPrivateIp(req.ip),
            devices: await getConnectedDevices(),
            uptime: getUptime()
        };
        res.write(`${JSON.stringify(stats)}\n\n`);
    };

    const interval = setInterval(sendStats, 5000); // update every 5 seconds
    await sendStats();

    req.on('close', () => clearInterval(interval));
});
