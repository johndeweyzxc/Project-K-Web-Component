import { PBKDF2, HmacSHA1, algo, enc } from "crypto-js";
import { EapolMic, EapolPmkid } from "./Model";

async function calculateMIC(eapol: EapolMic, psk: string): Promise<boolean> {
  const a: Uint8Array = new TextEncoder().encode("Pairwise key expansion");
  const minMaxMac: Uint8Array =
    h2b(eapol.bssid) < h2b(eapol.staMac)
      ? catray(h2b(eapol.bssid), h2b(eapol.staMac))
      : catray(h2b(eapol.staMac), h2b(eapol.bssid));
  const minMaxNonce: Uint8Array =
    h2b(eapol.anonce) > h2b(eapol.snonce)
      ? catray(h2b(eapol.anonce), h2b(eapol.snonce))
      : catray(h2b(eapol.snonce), h2b(eapol.anonce));
  const b: Uint8Array = catray(minMaxMac, minMaxNonce);
  console.log(`minMaxMac: ${b2h(minMaxMac)}`);
  console.log(`minMaxNonce: ${b2h(minMaxNonce)}`);
  console.log(`a: ${b2h(a)}`);
  console.log(`b: ${b2h(b)}`);

  const pmkInHex: string = PBKDF2(psk, eapol.ssid, {
    keySize: 32 / 4,
    iterations: 4096,
    hasher: algo.SHA1,
  }).toString();

  console.log(`PMK: ${pmkInHex.toUpperCase()}`);
  const ptkInHex: string = prf512(pmkInHex, a, b);
  console.log(`PTK: ${ptkInHex.toUpperCase()}`);
  const micInHex: string = calculateHMAC(
    ptkInHex.substring(0, 32),
    eapol.m2Data
  );
  console.log(`MIC: ${micInHex.toUpperCase()}`);
  if (micInHex.toUpperCase() === eapol.mic) {
    return true;
  } else {
    return false;
  }
}

async function calculatePMKID(
  eapol: EapolPmkid,
  psk: string
): Promise<boolean> {
  const pmkInHex: string = PBKDF2(psk, eapol.ssid, {
    keySize: 32 / 4,
    iterations: 4096,
    hasher: algo.SHA1,
  }).toString();

  console.log(`PMK: ${pmkInHex.toUpperCase()}`);
  const pmkNameBuff: Uint8Array = new TextEncoder().encode("PMK Name");
  const bssidBuff: Uint8Array = h2b(eapol.bssid);
  const staMacBuff: Uint8Array = h2b(eapol.staMac);
  const dataBuff = new Uint8Array(
    pmkNameBuff.length + bssidBuff.length + staMacBuff.length
  );
  dataBuff.set(pmkNameBuff, 0);
  dataBuff.set(bssidBuff, pmkNameBuff.length);
  dataBuff.set(staMacBuff, pmkNameBuff.length + bssidBuff.length);
  const pmkidInHex: string = calculateHMAC(pmkInHex, b2h(dataBuff));

  if (pmkidInHex.toUpperCase() === eapol.pmkid) {
    return true;
  } else {
    return false;
  }
}

function prf512(pmkInHex: string, a: Uint8Array, b: Uint8Array): string {
  const blen = 64;
  let i = 0;
  let R = new Uint8Array();

  while (i <= (blen * 8 + 159) / 160) {
    const message = catray(a, new Uint8Array([0x00]), b, new Uint8Array([i]));
    console.log(`message: ${b2h(message)}`);
    const hmac = calculateHMAC(pmkInHex, b2h(message));
    i += 1;
    R = catray(R, h2b(hmac));
    console.log(`R: ${b2h(R)}`);
  }
  console.log(R.length);
  const ptkHex = Array.from(new Uint8Array(R.slice(0, blen)))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return ptkHex;
}

function calculateHMAC(key: string, message: string): string {
  const hmac1 = HmacSHA1(
    enc.Hex.parse(message.toLocaleLowerCase()),
    enc.Hex.parse(key.toLocaleLowerCase())
  );
  return hmac1.toString().slice(0, 32);
}

function catray(...arrays: Uint8Array[]): Uint8Array {
  let totalLength = 0;
  arrays.forEach((arr: Uint8Array) => (totalLength += arr.length));
  const result = new Uint8Array(totalLength);
  let offset = 0;
  arrays.forEach((arr: Uint8Array) => {
    result.set(arr, offset);
    offset += arr.length;
  });
  return result;
}

function h2b(hex: string): Uint8Array {
  const bytes: number[] = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.substr(i, 2), 16));
  }
  return new Uint8Array(bytes);
}

function b2h(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte: number) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export { calculateMIC, calculatePMKID };
