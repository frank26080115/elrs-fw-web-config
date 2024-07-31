let receiver_list = [];
let layout_list = {};
let version_list = [];

function fill_receiver_list()
{
	$("#hardware_loading").show();
	$("#hardware_list").hide();
	$.ajax({
		url: 'get_hardware.php', // Replace with your API endpoint
		type: 'GET',
		dataType: 'json', // The type of data you're expecting back from the server
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
			let table_contents = "<div class='radio-group'><table>\r\n";
			for (let item_num = 0; item_num < receiver_list.length; item_num++) {
				let rx = receiver_list[item_num];
				table_contents += `<tr><td><input type="radio" id="chk_rx_${item_num}" name="chk_rx" value="${item_num}" onchange="chk_rx_onchange(this, ${item_num})" /></td><td><label for="chk_rx_${item_num}">${rx["product_name"]}</label></td></tr>\r\n`;
			}
			table_contents += "</table></div>"
			let tbl_ele = $(table_contents);
			$("#hardware_loading").hide();
			$("#hardware_list").empty().append(tbl_ele);
			$("#hardware_list").show();
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
		url: 'get_gittags.php', // Replace with your API endpoint
		type: 'GET',
		dataType: 'json', // The type of data you're expecting back from the server
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
		},
		error: function(xhr, status, error) {
			setTimeout(function() {
				fill_version_dropdown();
			}, 1000);
		}
	});
}

function fetch_layoutfile(f)
{
	
}