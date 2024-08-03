let provided_fwbin = null;
let provided_fwbin_cleaned = null;
let provided_productname = "";
let provided_devicename = "";
let provided_data = {};

const ELRSOPTS_PRODUCTNAME_SIZE = 128;
const ELRSOPTS_DEVICENAME_SIZE = 16;
const ELRSOPTS_OPTIONS_SIZE = 512;
const ELRSOPTS_HARDWARE_SIZE = 2048;
// 2704

function handleFile(event) {
	const input = event.target;
	const file = event.target.files[0];

	if (file) {
		console.log('File name:', file.name);

		const reader = new FileReader();
		reader.onload = function(event) {
			let arrayBuffer = event.target.result;
			let uint8Array = new Uint8Array(arrayBuffer);
			if (uint8Array[0] === 0x1F && uint8Array[1] === 0x8B) { // check if compressed
				let decompressedArray = pako.inflate(uint8Array);
				let decompressedUint8Array = new Uint8Array(decompressedArray);
				uint8Array = decompressedUint8Array;
			}
			provided_fwbin = uint8Array;

			if (parse_provided_firmware())
			{
				$("#uploaded-filename").show();
				$("#uploaded-filename").text("File selected: " + file.name);
				$('#fwver-provided').prop('disabled', false);
				$('#rxhighlevel-retain').prop('disabled', false);
			}
		};
		reader.readAsArrayBuffer(file);
		input.value = '';
	} else {
		console.log('No file selected');
	}
}

function parse_provided_firmware()
{
	let fw_total_len = provided_fwbin.length;

	let offset = ELRSOPTS_PRODUCTNAME_SIZE + ELRSOPTS_DEVICENAME_SIZE + ELRSOPTS_OPTIONS_SIZE + ELRSOPTS_HARDWARE_SIZE;
	let config_start = fw_total_len - offset;

	let tail = provided_fwbin.subarray(config_start);
	let all_json = tail.subarray(ELRSOPTS_PRODUCTNAME_SIZE + ELRSOPTS_DEVICENAME_SIZE);
	let options_json = uint8ArrayToString(all_json.subarray(0, ELRSOPTS_OPTIONS_SIZE));
	let hardware_json = uint8ArrayToString(all_json.subarray(ELRSOPTS_OPTIONS_SIZE));
	let product_name = uint8ArrayToString(tail.subarray(0, ELRSOPTS_PRODUCTNAME_SIZE));
	let device_name = uint8ArrayToString(tail.subarray(ELRSOPTS_DEVICENAME_SIZE));

	try {
		parse_all_json(options_json, hardware_json);
		try {
			provided_data["options"] = JSON.parse(options_json);
		}
		catch (e) {
		}
		try {
			provided_data["hardware"] = JSON.parse(hardware_json);
		}
		catch (e) {
		}
		provided_fwbin_cleaned = provided_fwbin.subarray(0, fw_total_len - offset);
		return true;
	}
	catch (e) {
		console.log("ERROR during firmware parsing: " + e.message);
		alert("ERROR while reading firmware metadata: " + e.message);
		return false;
	}
}

function getFirmwareLength(firmwareArray) {
    // The firmware header is 8 bytes long
    let headerLength = 8;

    // The segment count is stored in the second byte
    let segmentCount = firmwareArray[1];

    // Each segment has a 8-byte header (4 bytes for the address, 4 bytes for the length)
    let segmentHeaderLength = 8;

    // Start by adding the length of the firmware header
    let firmwareLength = headerLength;

    // Add the length of each segment
    for (let i = 0; i < segmentCount; i++) {
        // The segment length is stored in the segment header, starting at byte 4
        let segmentLength = firmwareArray[headerLength + i * segmentHeaderLength + 4];
        firmwareLength += segmentHeaderLength + segmentLength;
    }

    return firmwareLength;
}

function parse_all_json(options_json, hardware_json)
{
	if (options_json != null) {
		if (typeof options_json === "string") {
			if (options_json.length > 0) {
				options_json = JSON.parse(options_json);
			}
		}
		parse_options_json(options_json);
	}
	if (hardware_json != null) {
		if (typeof hardware_json === "string") {
			if (hardware_json.length > 0) {
				hardware_json = JSON.parse(hardware_json);
			}
		}
		parse_hardware_json(hardware_json);

		if (options_json != null) {
			if (options_json.hasOwnProperty("shrew")) {
				$("#pwmpinset-shrew").prop('checked', true);
				$('#pwmpinset-shrew').trigger('change');
			}
		}
	}
}

function parse_options_json(options_json)
{
	fill_textbox_with_json(options_json, "bindphrase", "txt_bindphrase");
	fill_textbox_with_json(options_json, "uid", "txt_bindid");
	fill_textbox_with_json(options_json, "wifi-on-interval", "txt_wifitime");
	fill_textbox_with_json(options_json, "rcvr-uart-baud", "txt_baudrate");
	fill_checkbox_with_json(options_json, "lock-on-first-connection", "chk_lockonconnect");
	fill_checkbox_with_json(options_json, "is-airport", "chk_isairport");
	fill_textbox_with_json(options_json, "domain", "drop_domain");
	fill_textbox_with_json(options_json, "wifi-ssid", "txt_wifi_ssid");
	fill_textbox_with_json(options_json, "wifi-password", "txt_wifi_password");
	if (options_json.hasOwnProperty("wifi-ssid")) {
		if ($("#txt_wifi_ssid").val().length > 0) {
			$('#wifimode-sta').prop('checked', true);
			$('#wifimode-sta').trigger('change');
		}
		else {
			$('#wifimode-ap').prop('checked', true);
			$('#wifimode-ap').trigger('change');
		}
	}
	else {
		$('#wifimode-ap').prop('checked', true);
		$('#wifimode-ap').trigger('change');
	}

	if (options_json.hasOwnProperty("fwver")) {
		var matchFound = false;
		$('#drop_fwversion option').each(function() {
			if ($(this).val() == options_json["fwver"]) {
				matchFound = true;
				return false; // This breaks the .each() loop
			}
		});
		if (matchFound) {
			$('#fwver-official').prop('checked', true);
			$('#fwver-official').trigger('change');
			$('#drop_fwversion').val(options_json["fwver"]);
		}
		else if (options_json["fwver"] == "shrew" || options_json["fwver"] == "combatrobotics") {
			$('#fwver-combatrobot').prop('checked', true);
			$('#fwver-combatrobot').trigger('change');
			if (options_json["fwver"] == "shrew") {
				$('#fwver-combatrobot').prop('checked', true);
				$('#fwver-combatrobot').trigger('change');
				$("#rxhighlevel-shrew").prop('checked', true);
				$('#rxhighlevel-shrew').trigger('change');
				$('#drop_shrewvariant').val(options_json["shrew"]);
			}
		}
	}
	if (options_json.hasOwnProperty("fixed-data-rate")) {
		$('#rxdatarate-fixed').prop('checked', true);
		$('#rxdatarate-fixed').trigger('change');
		$('#drop_datarate').val(options_json["fixed-data-rate"]);
	}
	if (options_json.hasOwnProperty("permanent-binding")) {
		$('#chk_preventbinding').prop('checked', true);
	}
	if (options_json.hasOwnProperty("shrew")) {
		$('#drop_shrewvariant').val(options_json["shrew"]);
	}
}

function parse_hardware_json(hardware_json)
{
	if (isValidGpioPin(hardware_json, "serial_tx") && !isValidGpioPin(hardware_json, "serial_rx") && hardware_json.hasOwnProperty("pwm")) {
		let pwm = hardware_json["pwm_outputs"];
		if (pwm.length == 2) {
			if (pwm.indexOf(0) !== -1 && pwm.indexOf(3) !== -1 && (hardware_json["serial_tx"] == 1 || hardware_json["serial_tx"] == "1")) {
				$("#pwmpinset-nano2").prop('checked', true);
				$("#pwmpinset-nano2").trigger('change');
			}
		}
	}
	if (!isValidGpioPin(hardware_json, "serial_tx") && !isValidGpioPin(hardware_json, "serial_rx") && hardware_json.hasOwnProperty("pwm")) {
		let pwm = hardware_json["pwm_outputs"];
		if (pwm.length == 3) {
			if (pwm.indexOf(0) !== -1 && pwm.indexOf(3) !== -1 && pwm.indexOf(1) !== -1) {
				$("#pwmpinset-nano3").prop('checked', true);
				$("#pwmpinset-nano3").trigger('change');
			}
		}
	}

	if (hardware_json.hasOwnProperty("pwm_outputs")) {
		$("#txt_pwmlist").val(uidBytesToText(hardware_json["pwm_outputs"]));
	}

	if (isValidGpioPin(hardware_json, "button") == false) {
		$('#chk_disablebindbutton').prop('checked', true);
	}
}

function fill_textbox_with_json(obj, key, eleid) {
	if (obj.hasOwnProperty(key)) {
		if (typeof obj[key] === "string") {
			$("#" + eleid).val(obj[key]);
		}
		else if (Array.isArray(obj[key])) {
			$("#" + eleid).val(uidBytesToText(obj[key]));
		}
		else {
			$("#" + eleid).val(obj[key]);
		}
	}
}

function fill_checkbox_with_json(obj, key, eleid, inv) {
	if (inv === undefined) {
		inv = false;
	}
	if (obj.hasOwnProperty(key)) {
		if (typeof obj[key] === "string") {
			if (obj[key].toLowerCase() == "true" || obj[key].toLowerCase() == "yes" || obj[key].toLowerCase() == "y") {
				$('#' + eleid).prop('checked', xor(true, inv));
			}
			else if (obj[key].toLowerCase() == "false" || obj[key].toLowerCase() == "no" || obj[key].toLowerCase() == "n") {
				$('#' + eleid).prop('checked', xor(false, inv));
			}
		}
		else if (typeof obj[key] === "boolean") {
			$('#' + eleid).prop('checked', xor(obj[key], inv));
		}
		else {
			$('#' + eleid).prop('checked', xor(obj[key] === 0, xor(true, inv)));
		}
	}
}
