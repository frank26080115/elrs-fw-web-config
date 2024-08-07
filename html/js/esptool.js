import { Transport } from './esptool/webserial.js'
import { ESPLoader } from './esptool/ESPLoader.js'
import { ESPError } from './esptool/error.js'

document.getElementById("btn_flasherase").onclick =
function btn_flasherase_onclick()
{
	serialbtns_disable();
	const portFilters = [];
	navigator.serial.requestPort({ filters: portFilters })
		.then(port => {
			let transport = new Transport(port);
			$("#build_busy").show();
			$("#build_busy_inner").text("serial port selected, establishing connection, please wait...");
			let esptool = new ESPLoader(transport, 115200); // note: there's a timeout bug, but if the baud specified matches ROM baud, which is 115200, then the change_baud function that causes the timeout problem is skipped
			esptool.main_fn().then(chip => {
				$("#build_busy").show();
				$("#build_busy_inner").text("chip \"" + chip + "\" connected, erasing flash, please wait...");
				esptool.erase_flash()
					.then(() => {
						quitFlashWithError('Flash erased successfully', null, port);
					})
					.catch((error) => {
						quitFlashWithError('Error occurred while erasing the flash: ', error, port);
					});
			}).catch(error => {
				quitFlashWithError('Error occurred while communicating: ', error, port);
			});
		})
		.catch(error => {
			quitFlashWithError('Error occurred while requesting/opening the port: ', error, null);
		});
};

document.getElementById("btn_flash").onclick =
function btn_flash_onclick()
{
	serialbtns_disable();

	let head = built_fw;
	let tail = generateBinaryFromTextboxes();
	if (head == null) {
		quitFlashWithError("ERROR: the firmware has not been transfered from the server", null, null);
		return;
	}
	if (tail == null) {
		quitFlashWithError("ERROR: unable to generate firmware configuration", null, null);
		return;
	}
	let fw = concatenateUint8Arrays(head, tail);

	let mcu = null;
	if (last_build_fw != null) {
		if (last_build_fw.includes("_ShrewESC_") || last_build_fw.includes("_ESP32_")) {
			mcu = "esp32";
		}
		else if (last_build_fw.includes("_ESP8")) {
			mcu = "esp8";
		}
	}

	const portFilters = [];
	navigator.serial.requestPort({ filters: portFilters })
		.then(port => {
			let transport = new Transport(port);
			$("#build_busy").show();
			$("#build_busy_inner").text("serial port selected, establishing connection, please wait...");
			let esptool = new ESPLoader(transport, 115200); // note: there's a timeout bug, but if the baud specified matches ROM baud, which is 115200, then the change_baud function that causes the timeout problem is skipped
			esptool.main_fn().then(chip => {
				if (mcu != null) {
					if (mcu.toLowerCase().includes(mcu.toLowerCase()) == false) {
						quitFlashWithError("Error: microcontroller mismatch! selected = " + mcu.toUpperCase() + " ; detected = " + chip.toUpperCase(), null, port);
						return;
					}
				}
				$("#build_busy").show();
				$("#build_busy_inner").text("chip \"" + chip + "\" connected, flashing firmware, please wait...");
				let fileArray = [{data: fw, address:0x0000}]
				esptool.write_flash({fileArray,
					flash_size: 'keep',
					reportProgress(fileIndex, written, total) {
						$("#build_busy_inner").text("flashing firmware, please wait... (" + Math.round(written * 100 / total) + "% : " + written + " / " + total + ")");
					}
				})
					.then(() => {
						quitFlashWithError('Firmware Flashed successfully', null, port);
					})
					.catch((error) => {
						quitFlashWithError('Error occurred while flashing the firmware: ', error, port);
					});
			}).catch(error => {
				quitFlashWithError('Error occurred while communicating: ', error, port);
			});
		})
		.catch(error => {
			quitFlashWithError('Error occurred while requesting/opening the port: ', error, null);
		});
};

function quitFlashWithError(msg, error, port) {
	if (port != null) {
		try {
			port.close();
		}
		catch (e) {
		}
	}
	if (error != null) {
		console.error(msg, error);
		alert(msg + error);
	}
	else {
		console.log(msg);
		alert(msg);
	}
	$("#build_busy").hide();
	serialbtns_enable();
}
