const QRCode = require('qrcode');
const os = require('os');

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const ip = getLocalIP();
const url = `http://${ip}:4200`;

console.log('\n┌─────────────────────────────────────┐');
console.log(`│  PetitFour — Mobile Access           │`);
console.log('├─────────────────────────────────────┤');
console.log(`│  ${url.padEnd(37)}│`);
console.log('└─────────────────────────────────────┘\n');

QRCode.toString(url, { type: 'terminal', small: true })
  .then(qr => {
    console.log(qr);
    console.log('  Make sure your phone is on the same WiFi.\n');
  })
  .catch(console.error);
