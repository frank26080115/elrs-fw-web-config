let RATE_LORA_4HZ = 0;
let RATE_LORA_25HZ = 1;
let RATE_LORA_50HZ = 2;
let RATE_LORA_100HZ = 3;
let RATE_LORA_100HZ_8CH = 4;
let RATE_LORA_150HZ = 5;
let RATE_LORA_200HZ = 6;
let RATE_LORA_250HZ = 7;
let RATE_LORA_333HZ_8CH = 8;
let RATE_LORA_500HZ = 9;
let RATE_DVDA_250HZ = 10;
let RATE_DVDA_500HZ = 11;
let RATE_FLRC_500HZ = 12;
let RATE_FLRC_1000HZ = 13;
let RATE_DVDA_50HZ = 14;
let RATE_LORA_200HZ_8CH = 15;
let RATE_FSK_2G4_DVDA_500HZ = 16;
let RATE_FSK_2G4_1000HZ = 17;
let RATE_FSK_900_1000HZ = 18;
let RATE_FSK_900_1000HZ_8CH = 19;

let data_rate_names = [
	"LORA 4HZ",
	"LORA 25HZ",
	"LORA 50HZ",
	"LORA 100HZ",
	"LORA 100HZ 8CH",
	"LORA 150HZ",
	"LORA 200HZ",
	"LORA 250HZ",
	"LORA 333HZ 8CH",
	"LORA 500HZ",
	"DVDA 250HZ",
	"DVDA 500HZ",
	"FLRC 500HZ",
	"FLRC 1000HZ",
	"DVDA 50HZ",
	"LORA 200HZ 8CH",
	"FSK 2G4 DVDA 500HZ",
	"FSK 2G4 1000HZ",
	"FSK 900 1000HZ",
	"FSK 900 1000HZ 8CH",
];

let data_rates_900 = [
	RATE_LORA_200HZ,
	RATE_LORA_100HZ_8CH,
	RATE_LORA_100HZ,
	RATE_LORA_50HZ,
	RATE_LORA_25HZ,
	RATE_DVDA_50HZ,
];

let data_rates_2400 = [
	RATE_FLRC_1000HZ,
	RATE_FLRC_500HZ,
	RATE_DVDA_500HZ,
	RATE_DVDA_250HZ,
	RATE_LORA_500HZ,
	RATE_LORA_333HZ_8CH,
	RATE_LORA_250HZ,
	RATE_LORA_150HZ,
	RATE_LORA_100HZ_8CH,
	RATE_LORA_50HZ,
];

let data_rates_LR1121 = [
	RATE_LORA_200HZ,
	RATE_LORA_100HZ_8CH,
	RATE_LORA_100HZ,
	RATE_LORA_50HZ,
	RATE_LORA_500HZ,
	RATE_LORA_333HZ_8CH,
	RATE_LORA_250HZ,
	RATE_LORA_150HZ,
	RATE_LORA_100HZ_8CH,
	RATE_LORA_50HZ,
	RATE_LORA_150HZ,
	RATE_LORA_100HZ_8CH,
	RATE_LORA_250HZ,
	RATE_LORA_200HZ_8CH,
	RATE_FSK_2G4_DVDA_500HZ,
	RATE_FSK_900_1000HZ_8CH,
];

let data_rates_last = [];

function make_data_rate_dropdown(rate_collection)
{
	let old_val = -1;
	if ($('#drop_datarate').length) {
		old_val = $('#drop_datarate').val();
	}
	if (arraysMatch(data_rates_last, rate_collection) == false)
	{
		$('#div_datarate').empty();
		const select = $('<select id="drop_datarate" name="drop_datarate"></select>');
		rate_collection.forEach(r => {
			select.append($('<option></option>').attr('value', r).text(data_rate_names[r]));
		});
		$('#div_datarate').append(select);
		//select.selectmenu();
		data_rates_last = rate_collection;
		if (old_val >= 0) {
			$('#drop_datarate').val(old_val);
		}
	}
	chk_rxdatarate_onchange();
}
