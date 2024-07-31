function chk_rx_onchange(r, i)
{
	if ($('#' + r.id).is(':checked')) {
		let rx = receiver_list[i];
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
}
