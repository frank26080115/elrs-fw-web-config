let fw_configuration = {}
let fw_hardware = {}

function generateFinalConfig()
{
	try
	{
	let fw_ver = null;
	let fw_radio = $('input[name="fwver"]:checked').val();
	if (fw_radio == "official") {
		fw_ver = $('#drop_fwversion').val();
	}
	else if (fw_radio == "combatrobot") {
		fw_ver = "shrew";
	}
	else if (fw_radio == "provided") {
		fw_ver = fw_radio;
	}

	let rx = null;
	let rx_highlevel = $('input[name="rxhighlevel"]:checked').val();
	if (rx_highlevel == "nano") {
		rx = receiver_list.find(obj => obj["product_name"] == "Generic ESP8285 2.4Ghz RX");
	}
	else if (rx_highlevel == "list") {
		rx = receiver_list[$('input[name="chk_rx"]:checked').val()];
	}
	else if (rx_highlevel == "shrew") {
		rx = shrew_rx;
	}

	if (rx_highlevel == "retain") {
		if (provided_data.hasOwnProperty("product_name")) {
			$("#txt_rawproductname").val(provided_data["product_name"]);
		}
		else if (rx != null) {
			$("#txt_rawproductname").val(rx["product_name"]);
		}
		if (provided_data.hasOwnProperty("device_name")) {
			$("#txt_rawdevicename").val(provided_data["device_name"]);
		}
		else if (rx != null) {
			$("#txt_rawdevicename").val(rx["lua_name"]);
		}
	}
	else {
		$("#txt_rawproductname").val(rx["product_name"]);
		$("#txt_rawdevicename").val(rx["lua_name"]);
	}

	$('#txt_rawproductname').attr('maxlength', ELRSOPTS_PRODUCTNAME_SIZE);
	$('#txt_rawproductname').on('input', function() {
		var value = $(this).val();
		if (value.length > ELRSOPTS_PRODUCTNAME_SIZE) {
			$(this).val(value.substring(0, ELRSOPTS_PRODUCTNAME_SIZE));
		}
	});
	$('#txt_rawproductname').trigger('input');
	$('#txt_rawdevicename').attr('maxlength', ELRSOPTS_DEVICENAME_SIZE);
	$('#txt_rawdevicename').on('input', function() {
		var value = $(this).val();
		if (value.length > ELRSOPTS_DEVICENAME_SIZE) {
			$(this).val(value.substring(0, ELRSOPTS_DEVICENAME_SIZE));
		}
	});
	$('#txt_rawdevicename').trigger('input');

	options = {};
	options["flash-discriminator"] = getRandomInt32();
	if ($('#bindphrase-phrase').is(':checked')) {
		options["uid"] = uidBytesFromText($('#txt_bindphrase').val());
		if (typeof(Storage) !== "undefined") {
			localStorage.setItem("bindphrase", $('#txt_bindphrase').val());
		}
	}
	else {
		options["uid"] = uidBytesFromText($('#txt_bindid').val());
	}
	options["wifi-on-interval"] = parseInt($('#txt_wifitime').val()) || 60;
	if ($('#wifimode-sta').is(':checked')) {
		options["wifi-ssid"] = $('#txt_wifi_ssid').val();
		options["wifi-password"] = $('#txt_wifi_password').val();
	}
	options["rcvr-uart-baud"] = parseInt($('#txt_baudrate').val()) || 420000;
	options["is-airport"] = $('#chk_isairport').is(':checked');
	options["lock-on-first-connection"] = $('#chk_lockonconnect').is(':checked');
	options["customised"] = true;
	if (fw_radio == "combatrobot" && rx_highlevel != "shrew") {
		options["fwver"] = "combatrobotics";
	}
	else if (rx_highlevel == "shrew") {
		options["fwver"] = "shrew";
	}
	else if (fw_radio == "provided") {
		try {
			options["fwver"] = provided_data["options"]["fwver"];
		}
		catch (e) {
		}
	}
	else {
		options["fwver"] = $('#drop_fwversion').val();
	}
	if (fw_ver == "shrew")
	{
		if ($('#rxdatarate-fixed').is(':checked')) {
			options["fixed-data-rate"] = parseInt($('#drop_datarate').val()) || -1;
		}
		else {
			options["fixed-data-rate"] = -1;
		}
		options["permanent-binding"] = $('#chk_preventbinding').is(':checked');
		if (rx_highlevel == "shrew") {
			options["shrew"] = $("#drop_shrewvariant").val();
		}
		else {
			options["shrew"] = 0;
		}
	}
	$("#txt_rawconfig").val(prettifyJSON(options));

	let hw = {};
	if (rx != null) {
		hw_file = rx["layout_file"];
		if (hw_file in layout_list) {
			hw = layout_list[hw_file];
		}
		else {
			fetch_layoutfile(hw_file);
			$("#txt_rawhardware").val("still loading... please wait...");
			setTimeout(function(){
				generateFinalConfig();
			}, 1000);
			return;
		}
		if (rx.hasOwnProperty("overlay")) {
			hw = mergeJSONObjects(hw, rx["overlay"]);
		}
	}
	if (rx_highlevel == "retain") {
		hw = mergeJSONObjects(provided_data["hardware"], hw);
		fw_ver = "provided";
	}

	if ($('#chk_disablebindbutton').is(':checked')) {
		if (hw.hasOwnProperty("button")) {
			delete hw["button"];
		}
	}

	let pwmpinset = $('input[name="pwmpinset"]:checked').val();
	if (pwmpinset == "nano3") {
		if (hw.hasOwnProperty("serial_tx")) {
			delete hw["serial_tx"];
		}
		if (hw.hasOwnProperty("serial_rx")) {
			delete hw["serial_rx"];
		}
		if (hw.hasOwnProperty("button")) {
			delete hw["button"];
		}
		hw["pwm_outputs"] = [0, 1, 3];
	}
	else if (pwmpinset == "nano2") {
		if (hw.hasOwnProperty("serial_rx")) {
			delete hw["serial_rx"];
		}
		if (hw.hasOwnProperty("button")) {
			delete hw["button"];
		}
		hw["pwm_outputs"] = [0, 3];
		hw["serial_tx"] = 1;
	}
	else if (pwmpinset == "shrew") {
		shrew_hw = layout_list["Shrew.json"];
		hw["serial_tx"] = shrew_hw["serial_tx"];
		hw["serial_rx"] = shrew_hw["serial_rx"];
		hw["pwm_outputs"] = shrew_hw["pwm_outputs"];
	}
	else if (pwmpinset == "custom") {
		hw["pwm_outputs"] = bytesFromText($('#txt_pwmlist').val());
	}

	$("#txt_rawhardware").val(prettifyJSON(hw));

	if (fw_ver == "provided")
	{
		if (provided_fwbin_cleaned == null) {
			$("#build_error").show();
			$("#build_busy").hide();
			$("#build_message").hide();
			$("#build_done").hide();
			$("#build_error_inner").text("No data from provided firmware file, please try using the \"Load Prev Config\" tab again.");
			return;
		}
		else {
			$("#build_error").hide();
			$("#build_busy").hide();
			$("#build_message").hide();
			$("#build_done").show();
			built_fw = provided_fwbin_cleaned;
		}
		return;
	}

	if (rx == null) {
		$("#build_error").show();
		$("#build_busy").hide();
		$("#build_message").hide();
		$("#build_done").hide();
		$("#build_error_inner").text("No receiver hardware selected, please select one.");
		return;
	}

	let best_build_target;
	if (fw_ver == "shrew") {
		best_build_target = "Unified_ShrewESC_2400_RX_via_UART";
	}
	else {
		best_build_target = findClosestStringMatch(rx["firmware"], build_targets);
	}
	let r = fetch_firmware_build(fw_ver, best_build_target);
	if (r != null) {
		console.log("got the firmware previously already");
	}
	}
	catch (e) {
		$("#build_error").show();
		$("#build_error_inner").text("Error while processing all user inputs: " + e.message);
	}
}

function generateBinaryFromTextboxes()
{
	let u1 = stringToUint8Array($("#txt_rawproductname").val().trim(), ELRSOPTS_PRODUCTNAME_SIZE);
	let u2 = stringToUint8Array($("#txt_rawdevicename").val().trim(), ELRSOPTS_DEVICENAME_SIZE);
	let u3 = null;
	let u4 = null;
	try {
		u3 = stringToUint8Array(minifyJSON($("#txt_rawconfig").val()), ELRSOPTS_OPTIONS_SIZE);
	}
	catch (e) {
		$("#build_error").show();
		$("#build_error_inner").text("Failed to process configuration JSON, error message: " + e.message);
		return null;
	}
	try {
		u4 = stringToUint8Array(minifyJSON($("#txt_rawhardware").val()), ELRSOPTS_HARDWARE_SIZE);
	}
	catch (e) {
		$("#build_error").show();
		$("#build_error_inner").text("Failed to process hardware JSON, error message: " + e.message);
		return null;
	}
	$("#build_error").hide();
	let ua = concatenateUint8Arrays(u1, u2);
	ua = concatenateUint8Arrays(ua, u3);
	ua = concatenateUint8Arrays(ua, u4);
	return ua;
}

function user_download_fw(compress)
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
	if (compress) {
		fw = pako.gzip(fw);
	}
	let extra = getDateTimeTag();
	if (compress) {
		extra = "wifi-" + extra;
	}
	let blob = new Blob([fw], {type: "application/octet-stream"});
	let link = document.createElement('a');
	link.href = window.URL.createObjectURL(blob);
	link.download = 'fw-' + extra + '.bin';
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
}