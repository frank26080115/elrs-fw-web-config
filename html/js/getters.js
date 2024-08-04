let receiver_list = [];
let layout_list = {};
let version_list = [];
let layout_fetch_queue = [];
let build_targets = [];
let build_targets_dict = {};

function fill_receiver_list()
{
	$("#hardware_loading").show();
	$("#hardware_list").hide();
	$.ajax({
		url: 'get_hardware.php',
		type: 'GET',
		dataType: 'json',
		success: function(response) {
			if (response.hasOwnProperty("error")) {
				console.log("get_hardware error: " + response.error);
				setTimeout(function() {
					fill_receiver_list();
				}, 1000);
				return;
			}
			for (let key_mfg in response) {
				if (response.hasOwnProperty(key_mfg)) {
					if (typeof response[key_mfg] === 'object' && response[key_mfg] !== null) {
						let mfg = response[key_mfg];
						for (let key_family in mfg) {
							if (mfg.hasOwnProperty(key_family)) {
								if (typeof mfg[key_family] === 'object' && mfg[key_family] !== null) {
									let family = mfg[key_family];
									for (let key_rx in family) {
										if (family.hasOwnProperty(key_rx)) {
											if (typeof family[key_rx] === 'object' && family[key_rx] !== null) {
												let rx = family[key_rx];
												if (key_family.startsWith("rx_")) {
													receiver_list.push(rx);
												}
											}
										}
									}
								}
							}
						}
					}
				}
			}
			let has_default = false;
			let table_contents = "<div class='radio-group'><table>\r\n";
			for (let item_num = 0; item_num < receiver_list.length; item_num++) {
				let rx = receiver_list[item_num];
				let extra = "";
				if (isGenericRx(rx) && has_default == false) {
					extra = "checked ";
					console.log("default rx found: " + rx["product_name"]);
					has_default = true;
				}
				table_contents += `<tr><td><input type="radio" id="chk_rx_${item_num}" name="chk_rx" value="${item_num}" onchange="chk_rx_onchange(this, ${item_num})" ${extra}/></td><td><label for="chk_rx_${item_num}">${rx["product_name"]}</label></td></tr>\r\n`;
			}
			table_contents += "</table></div>"
			let tbl_ele = $(table_contents);
			$("#rx-list-inner").empty().append(tbl_ele);
			validateRadioGroup("chk_rx");
			chk_rxhighlevel_onchange(null);
		},
		error: function(xhr, status, error) {
			setTimeout(function() {
				fill_receiver_list();
			}, 1000);
		}
	});
}

function fill_version_dropdown()
{
	$.ajax({
		url: 'get_gittags.php',
		type: 'GET',
		dataType: 'json',
		success: function(response) {
			if (response.hasOwnProperty("error")) {
				console.log("get_gittags error: " + response.error);
				setTimeout(function() {
					fill_version_dropdown();
				}, 1000);
				return;
			}
			if (response.hasOwnProperty("tags")) {
				let tag_list = response["tags"];
				if (tag_list.length <= 0) {
					console.log("get_gittags zero length");
					setTimeout(function() {
						fill_version_dropdown();
					}, 1000);
					return;
				}
				for (let tag of tag_list) {
					let tag_split = tag.split('.');
					let major = tag_split[0];
					if (major.startsWith("v") || major.startsWith("V")) {
						major = major.substring(1);
					}
					let major_num = parseInt(major);
					if (isNaN(major_num) == false) {
						if (major_num >= 3) {
							version_list.push(tag);
						}
					}
				}
			}
			version_list.sort(compareVersions);
			let select_contents = "<select id='drop_fwversion' name='drop_fwversion'>\r\n";
			for (let item_num = 0; item_num < version_list.length; item_num++) {
				let v = version_list[item_num];
				select_contents += `<option value='${v}'>${v}</option>\r\n`;
			}
			select_contents += "</select>";
			$("#version_dropdown").empty().append($(select_contents));
			//$("#drop_fwversion").selectmenu();
			chk_fwver_onchange();
		},
		error: function(xhr, status, error) {
			setTimeout(function() {
				fill_version_dropdown();
			}, 1000);
		}
	});
}

function get_all_build_targets()
{
	$.ajax({
		url: 'get_buildtargets.php',
		type: 'GET',
		dataType: 'json',
		success: function(response) {
			build_targets = response["targets"];
			build_targets.sort();
			for (let i = 0; i < build_targets.length; i++) {
				let s = build_targets[i];
				let j = s.indexOf("_via_");
				if (j > 0) {
					s = s.substring(0, j);
				}
				if (s.indexOf("_TX_") >= 0 || s.endsWith("_TX")) {
					continue;
				}
				if (Object.values(build_targets_dict).includes(s) == false) {
					build_targets_dict[i] = s;
				}
			}
			let select = $('<select id="drop_buildtarget" name="drop_buildtarget"></select>');
			$.each(build_targets_dict, function(key, value) {
				let option = $('<option></option>').attr('value', key).text(value);
				select.append(option);
			});
			$("#buildtargets-list-inner").empty().append(select);
			//select.selectmenu();
		},
		error: function(xhr, status, error) {
			setTimeout(function() {
				get_all_build_targets();
			}, 1000);
		}
	});
}

function fetch_layoutfile(f)
{
	if (f != null) {
		layout_fetch_queue.push(f);
	}
	else {
		if (layout_fetch_queue.length > 0) {
			f = layout_fetch_queue[0];
		}
	}
	if (layout_list.hasOwnProperty(f)) {
		return layout_list[f];
	}
	$.ajax({
		url: "get_jsonfile.php?file=" + f, // Replace with your API endpoint
		type: 'GET',
		dataType: 'json', // The type of data you're expecting back from the server
		success: function(response) {
			layout_list[f] = response;
			let i = layout_fetch_queue.indexOf(f);
			if (i >= 0) {
				layout_fetch_queue.splice(i, 1);
			}
		},
		error: function(xhr, status, error) {
			setTimeout(function() {
				fetch_layoutfile(null);
			}, 1000);
		}
	});
	return null;
}

let last_build_ver = null;
let last_build_fw = null;
let last_build_key = null;
let last_build_path = null;

function fetch_firmware_build(v, fw)
{
	let key = v + "_" + fw;
	if (last_build_key == key) {
		$("#build_error").hide();
		$("#build_busy").hide();
		$("#build_message").hide();
		$("#build_done").show();
		return last_build_path;
	}
	$("#build_done").hide();

	last_build_ver = v;
	last_build_fw = fw;

	$.ajax({
		url: 'builder.php',
		type: 'POST',
		data: JSON.stringify({"action": "build", "version": v, "firmware": fw}),
		contentType: 'application/json',
		success: function(response) {
			if (response.hasOwnProperty("status")) {
				$("#build_error").hide();
				$("#build_busy").show();
				$("#build_busy_inner").text("Build complete, transfering firmware file, please wait...");
				$("#build_message").hide();
				let sts = response["status"];
				if (sts == "done") {
					try {
						let fpath = response["file"];
						if (fpath.length <= 0) {
							$("#build_message").show();
							$("#txt_buildmessage").val(response["message"]);
							return;
						}
						let nkey = response["version"] + "_" + response["firmware"];
						last_build_key = nkey;
						last_build_path = fpath;
						console.log("fw file path from server: " + fpath);
						get_firmware_binary(fpath);
					}
					catch (e) {
						$("#build_error").show();
						$("#build_busy").hide();
						$("#build_message").hide();
						let s = "Error while parsing build server response: " + e.message;
						$("#build_error_inner").text(s);
					}
				}
				else if (sts.startsWith("busy")) {
					$("#build_error").hide();
					$("#build_busy").show();
					$("#build_message").hide();
					$("#build_done").hide();
					let extra = "";
					if (response.hasOwnProperty("message")) {
						extra = "<br />" + response["message"];
					}
					if (sts == "busy full") {
						$("#build_busy_inner").html("Build queue is too full, cannot queue new build. Please wait...");
					}
					else if (sts == "busy queued") {
						$("#build_busy_inner").html("Build request has been queued, please wait..." + extra);
					}
					else if (sts == "busy new") {
						$("#build_busy_inner").html("Build request has just been queued, please wait..." + extra);
					}
					else if (sts == "busy started") {
						$("#build_busy_inner").html("Your build has started, please wait..." + extra);
					}
					else {
						$("#build_busy_inner").html("Builder is busy, please wait..." + extra);
					}
					setTimeout(function() {
						fetch_firmware_build(last_build_ver, last_build_fw);
					}, 1000);
				}
			}
			else if (response.hasOwnProperty("error")) {
				let s = "Unexpected error from backend builder: " + response["error"];
				console.log(s);
				$("#build_busy").hide();
				$("#build_message").hide();
				$("#build_done").hide();
				$("#build_error").show();
				$("#build_error_inner").text(s);
			}
		},
		error: function(jqXHR, textStatus, errorThrown) {
			let s = "Builder AJAX request error: ";
			if (textStatus.length > 0) {
				s += "[" + textStatus + "] ";
			}
			s += errorThrown;
			$("#build_busy").hide();
			$("#build_message").hide();
			$("#build_done").hide();
			$("#build_error").show();
			$("#build_error_inner").text(s);
			console.log(s);
		}
	});
	return null;
}

let last_built_fw_fpath = null;
let built_fw = null;
function get_firmware_binary(fpath) {
	last_built_fw_fpath = fpath;
	$.ajax({
		url: "get_fileencoded.php?file=" + fpath,
		type: 'GET',
		contentType: 'application/json',
		success: function(data) {
			if (data.hasOwnProperty("encoded_str")) {
				var uint8Array = hexToUint8Array(data["encoded_str"]);
				if (uint8Array[0] === 0x1F && uint8Array[1] === 0x8B) { // check if compressed
					let decompressedArray = pako.inflate(uint8Array);
					let decompressedUint8Array = new Uint8Array(decompressedArray);
					uint8Array = decompressedUint8Array;
				}
				let fw_total_len = uint8Array.length;
				let offset = ELRSOPTS_PRODUCTNAME_SIZE + ELRSOPTS_DEVICENAME_SIZE + ELRSOPTS_OPTIONS_SIZE + ELRSOPTS_HARDWARE_SIZE;
				let config_start = fw_total_len - offset;
				if (config_start > 0) {
					built_fw = uint8Array.subarray(0, config_start);
					$("#build_busy").hide();
					$("#build_done").show();
				}
				else {
					let s = "ERROR: returned firmware file length is wrong: " + uint8Array.length;
					$("#build_error").show();
					$("#build_error_inner").text(s);
				}
			}
			else {
				let s = "ERROR: server did not reply back with base64 data";
				$("#build_error").show();
				$("#build_error_inner").text(s);
			}
		},
		error: function(xhr, status, error) {
			console.error('Error occurred while fetching the .bin file: ', error);
			setTimeout(function(){
				get_firmware_binary(last_built_fw_fpath);
			}, 1000);
		}
	});
}
