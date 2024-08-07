import { Transport } from './esptool/webserial.js'
import { ESPLoader } from './esptool/ESPLoader.js'
import { ESPError } from './esptool/error.js'

function btn_flasherase_onclick()
{
	const portFilters = [];
	navigator.serial.requestPort({ filters: portFilters })
		.then(port => {
			console.log("Serial Port:");
			console.log(port);
			let esptool = new ESPLoader(port);
			esptool.eraseFlash(port)
				.then(() => {
					console.log('Flash erased successfully');
					alert("Flash Erased Successfully");
				})
				.catch((error) => {
					console.error('Error occurred while erasing the flash: ', error);
					alert("Error occurred while erasing the flash: " + error);
				});
		})
		.catch(error => {
			console.error('Error occurred while requesting the port: ', error);
		});
}

function btn_flash_onclick()
{
	let head = built_fw;
	let tail = generateBinaryFromTextboxes();
	if (head == null) {
		alert("ERROR: the firmware has not been transfered from the server");
		return;
	}
	if (tail == null) {
		alert("ERROR: unable to generate firmware configuration");
		return;
	}
	let fw = concatenateUint8Arrays(head, tail);

	const portFilters = [];
	navigator.serial.requestPort({ filters: portFilters })
		.then(port => {
			console.log("Serial Port:");
			console.log(port);
			$("#build_busy").show();
			$("#build_busy_inner").text("Flashing microcontroller, please wait...");
			let esptool = new ESPLoader(port);
			esptool.flashFirmware(port, fw)
				.then(() => {
					$("#build_busy").hide();
					console.log('Firmware Flash Successful');
					alert("Firmware Flash Successful");
				})
				.catch((error) => {
					$("#build_busy").hide();
					console.error('Error occurred while erasing the flash: ', error);
					alert("Error occurred while erasing the flash: " + error);
				});
		})
		.catch(error => {
			console.error('Error occurred while requesting the port: ', error);
		});
}
