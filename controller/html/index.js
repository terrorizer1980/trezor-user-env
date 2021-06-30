/* eslint-disable func-names */
/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable no-underscore-dangle */
let ws;
let id = 0;
let bridgeStatus = 'Stopped';  // Can also be 'Running'

function output(str, color = 'black') {
    const log = document.getElementById('log');
    const escaped = str
        .replace(/&/, '&amp;')
        .replace(/</, '&lt;')
        .replace(/>/, '&gt;')
        .replace(/"/, '&quot;'); // "
    log.innerHTML = `<span style="color: ${color}">${escaped}</span><br>${log.innerHTML}`;
}

const createOption = (select, value) => {
    const option = document.createElement("option");
    option.text = value;
    option.value = value;
    select.add(option);
}

const clearOptions = select => {
    while(select.options.length) select.remove(0);
}

const populateEmulatorSelect = firmwares => {
    const t1Select = document.getElementById('t1-select');
    const t2Select = document.getElementById('t2-select');
    clearOptions(t1Select);
    clearOptions(t2Select);
    firmwares["T1"].forEach(version => createOption(t1Select, version));
    firmwares["TT"].forEach(version => createOption(t2Select, version));
}


const handleMessage = event => {
    if (!event.data || typeof event.data !== 'string') {
        output(`Response received without proper data: ${event.data}`, 'red');
        return;
    }

    const dataObject = JSON.parse(event.data);
    
    // Choosing the right color for the output - normal, success and error scenarios
    let color = 'black';
    if ('success' in dataObject) {
        if (dataObject.success) {
            color = 'green';
        } else {
            color = 'red';
        }
    }

    output(`Response received: ${event.data}`, color);

    if (dataObject.type === 'client') {
        populateEmulatorSelect(dataObject.firmwares);
    }
};

function init() {
    // Connect to Web Socket
    ws = new WebSocket('ws://localhost:9001/');
    // Set event handlers.
    ws.onopen = function () {
        document.getElementById('ws-status').style.display = 'none';
        output('Websocket opened');
    };
    ws.onmessage = handleMessage;
    ws.onclose = function () {
        document.getElementById('ws-status').style.display = 'block';
        output('Websocket closed');
    };
    ws.onerror = function (e) {
        output('onerror');
        console.log(e);
    };
}

function _send(json) {
    const requestToSend = JSON.stringify(
        Object.assign(json, {
            id,
        }),
    );
    ws.send(requestToSend);
    id++;
    output(`Request sent: ${requestToSend}`, 'blue');
}

function onSubmit() {
    const input = document.getElementById('raw-input');

    // Defending against invalid JSON
    try {
        JSON.parse(input.value);
    } catch(err) {
        alert('Impossible to parse input into JSON! Please correct the input string');
        return;
    }

    _send(JSON.parse(input.value));
    output(`send: ${input.value}`);
    input.value = '';
    input.focus();
}

function onCloseClick() {
    ws.close();
}

function emulatorStart(select) {
    const version = document.getElementById(select).value;
    _send({
        type: 'emulator-start',
        version,
    });
}

function emulatorWipe() {
    _send({
        type: 'emulator-wipe',
    });
}

function emulatorResetDevice() {
    _send({
        type: 'emulator-reset-device',
    });
}

function emulatorSetup() {
    const input = document.getElementById('seed-input');
    _send({
        type: 'emulator-setup',
        mnemonic: input.value || 'all all all all all all all all all all all all',
        pin: '',
        passphrase_protection: false,
        label: 'Hello!',
    });
}

function emulatorPressYes() {
    _send({
        type: 'emulator-press-yes',
    });
}

function emulatorPressNo() {
    _send({
        type: 'emulator-press-no',
    });
}

function emulatorStop() {
    _send({
        type: 'emulator-stop',
    });
}

function bridgeStart(version) {
    _send({
        type: 'bridge-start',
        version,
    });
}

function bridgeStop() {
    _send({
        type: 'bridge-stop',
    });
}

function exit() {
    _send({
        type: 'exit',
    });
}

function ping() {
    _send({
        type: 'ping',
    });
}

function getBridgeStatus() {
    return new Promise((resolve, reject) => {
        fetch('http://0.0.0.0:21325/status/', { mode: 'no-cors' }).then(
            response => {
                bridgeStatus = 'Running';
                resolve();
            },
            error => {
                bridgeStatus = 'Stopped';
                reject();
            },
        );
    });
}

function writeBridgeStatus() {
    const el = document.getElementById('bridge-status');
    el.innerHTML = bridgeStatus;
}

// maybe not the best idea to bombard bridge with status requests. time will show.
function watchBridge() {
    setInterval(() => {
        getBridgeStatus().then(
            () => {
                writeBridgeStatus();
            },
            () => {
                writeBridgeStatus();
            },
        );
    }, 3000);
}

window.onload = function () {
    init();
    watchBridge();
}
