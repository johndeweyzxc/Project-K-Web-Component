interface EapolPmkid {
  ssid: string;
  bssid: string;
  staMac: string;
  pmkid: string;
}

interface EapolMic {
  ssid: string;
  bssid: string;
  staMac: string;
  mic: string;
  anonce: string;
  m2Data: string;
  snonce: string;
}

export type { EapolPmkid, EapolMic };
