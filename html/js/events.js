function chk_rx_onchange(r, i)
{
	let x = $('input[name="chk_rx"]:checked').val();
	if (typeof x !== "undefined" && x !== null) {
		let rx = receiver_list[x];
		if (rx["firmware"].includes("2400")) {
			make_data_rate_dropdown(data_rates_2400);
			$("#regulatory_domain").hide();
		}
		else if (rx["firmware"].includes("900")) {
			make_data_rate_dropdown(data_rates_900);
			$("#regulatory_domain").show();
		}
		else if (rx["firmware"].includes("1121")) {
			make_data_rate_dropdown(data_rates_LR1121);
			$("#regulatory_domain").hide();
		}
		fetch_layoutfile(rx["layout_file"]);
		$("#drop_buildtargets").val(findClosestStringMatchDict(rx["firmware"], build_targets_dict));
	}
}

function chk_bindphrase_onchange(r)
{
	if ($('#bindphrase-phrase').is(':checked')) {
		$('#txt_bindphrase').prop('disabled', false);
		$('#txt_bindid').prop('disabled', true);
	}
	else {
		$('#txt_bindphrase').prop('disabled', true);
		$('#txt_bindid').prop('disabled', false);
	}
}

let lock_bindphrase_textbox = false;

function txt_bindphrase_onchange()
{
	if ($('#bindphrase-phrase').is(':checked') == false && $('#bindphrase-id').is(':checked') == false) {
		$('#bindphrase-phrase').prop('checked', true);
	}
	if ($('#bindphrase-phrase').is(':checked')) {
		lock_bindphrase_textbox = true;
		let uid = uidBytesFromText($('#txt_bindphrase').val());
		$('#txt_bindid').val(uidBytesToText(uid));
		$('#txt_bindid').prop('disabled', true);
		lock_bindphrase_textbox = false;
	}
}

function txt_bindid_onchange()
{
	if (lock_bindphrase_textbox == false) {
		$('#txt_bindphrase').val('');
		$('#bindphrase-id').prop('checked', true);
	}
}

function chk_fwver_onchange(r)
{
	if ($('#fwver-official').is(':checked')) {
		$('#drop_fwversion').prop('disabled', false);
	}
	else {
		$('#drop_fwversion').prop('disabled', true);
	}
	if ($('#fwver-combatrobot').is(':checked')) {
		$('#rxdatarate-fixed').prop('disabled', false);
		$('#chk_preventbinding').prop('disabled', false);
		chk_rxdatarate_onchange();
	}
	else {
		if ($('#rxdatarate-fixed').is(':checked')) {
			$('#rxdatarate-fixed').prop('checked', false);
			$('#rxdatarate-auto').prop('checked', true);
			//$('#rxdatarate-auto').trigger('change');
		}
		$('#rxdatarate-fixed').prop('disabled', true);
		$('#chk_preventbinding').prop('disabled', true);
		if ($('#pwmpinset-shrew').is(':checked')) {
			$('#pwmpinset-default').prop('checked', true);
			//$('#pwmpinset-default').trigger('change');
		}
		$('#pwmpinset-shrew').prop('checked', false);
	}
	if ($('#fwver-provided').is(':checked')) {
		$('#buildtargets-list').hide();
	}
	else {
		$('#buildtargets-list').show();
	}
}

function chk_rxdatarate_onchange(r)
{
	if ($('#rxdatarate-auto').is(':checked')) {
		$('#chk_lockonconnect').prop('disabled', false);
		$('#drop_datarate').prop('disabled', true);
	}
	else {
		$('#chk_lockonconnect').prop('disabled', true);
		$('#drop_datarate').prop('disabled', false);
	}
}

function chk_rxhighlevel_onchange(r)
{
	if ($('#rxhighlevel-list').is(':checked')) {
		$('#rx-list').show();
		chk_rx_onchange();
	}
	else {
		$('#rx-list').hide();
	}
	if ($('#rxhighlevel-shrew').is(':checked')) {
		$('#drop_shrewvariant').prop('disabled', false);
		$('#fwver-combatrobot').prop('checked', true);
		$('#fwver-combatrobot').trigger('change');
		$('#pwmpinset-shrew').prop('disabled', false);
		$('#pwmpinset-shrew').prop('checked', true);
		//$('#pwmpinset-shrew').trigger('change');
		$('#pwmpinset-nano3').prop('disabled', true);
		$('#pwmpinset-nano2').prop('disabled', true);
		$('#rxdatarate-fixed').prop('disabled', false);
		make_data_rate_dropdown(data_rates_2400);
		$("#regulatory_domain").hide();
	}
	else {
		$('#drop_shrewvariant').prop('disabled', true);
		$('#pwmpinset-shrew').prop('disabled', true);
		if ($('#pwmpinset-shrew').is(':checked')) {
			$('#pwmpinset-default').prop('checked', true);
			//$('#pwmpinset-default').trigger('change');
		}
		$('#pwmpinset-shrew').prop('checked', false);
		$('#pwmpinset-nano3').prop('disabled', false);
		$('#pwmpinset-nano2').prop('disabled', false);
	}
	if ($('#rxhighlevel-retain').is(':checked') || $('#rxhighlevel-custom').is(':checked')) {
		$('#buildtargets-list').show();
	}
	else {
		$('#buildtargets-list').hide();
	}
}

function drop_portprotocol_onchange(ele)
{
	var selectedText = $('#drop_portprotocol option:selected').text();
	selectedText += $('#drop_portprotocol2 option:selected').text();
	if (selectedText.toLowerCase().includes("sbus")) {
		//$("#sbus-options").show();
	}
	else {
		//$("#sbus-options").hide();
	}
}

function accordion_onactivate(evt, ui)
{
	var newHeaderId = ui.newHeader.attr('id') || 'No ID'; // Handle no ID case
	var oldHeaderId = ui.oldHeader.attr('id') || 'No ID'; // Handle no ID case

	if (newHeaderId !== 'No ID') {
		console.log("Opened section ID: " + newHeaderId);
		if (newHeaderId == "sect_save") {
			generateFinalConfig();
		}
	} else {
		console.log("Opened section has no ID");
	}

	if (oldHeaderId !== 'No ID') {
		console.log("Closed section ID: " + oldHeaderId);
	} else {
		console.log("Closed section has no ID");
	}
}

function build_retry()
{
	$("#build_busy_inner").text("Reattempting build...");
	$("#build_busy").show();
	$("#build_message").hide();
	$("#build_done").hide();
	$("#build_error").hide();
	$.ajax({
		url: 'builder.php', // replace with your API endpoint
		type: 'POST',
		data: JSON.stringify({"action": "clear", "version": last_build_ver, "firmware": last_build_fw}),
		contentType: 'application/json',
		success: function(response) {
			fetch_firmware_build(last_build_ver, last_build_fw);
		},
		error: function(jqXHR, textStatus, errorThrown) {
			setTimeout(function(){
				build_retry();
			}, 500);
		}
	});
}

function btn_saveoffline_onclick()
{
	user_download_fw(false);
}

function btn_savewifi_onclick()
{
	let compress = false;
	if (last_build_fw == null) {
		alert("ERROR: unable to determine if compression is needed");
		return
	}
	if (last_build_fw.includes("ESP82")) {
		compress = true;
	}
	user_download_fw(compress);
}

function btn_flasherase_onclick()
{
	const portFilters = [];
	navigator.serial.requestPort({ filters: portFilters })
		.then(port => {
			console.log("Serial Port:");
			console.log(port);
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
