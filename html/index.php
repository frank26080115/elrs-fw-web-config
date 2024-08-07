<?php
?>

<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<script src="https://code.jquery.com/jquery-3.6.0.min.js" onerror="handleLoadError()"></script>
<script src="https://code.jquery.com/ui/1.12.1/jquery-ui.min.js" onerror="handleLoadError()"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/pako/2.0.4/pako.min.js" onerror="handleLoadError()"></script>
<link rel="stylesheet" href="https://code.jquery.com/ui/1.12.1/themes/ui-darkness/jquery-ui.css" onerror="handleLoadError()">

<script src="https://unpkg.com/esptool-js/bundle.js" type="module" onerror="handleLoadError()"></script>

<link rel="icon" type="image/x-icon" href="/imgs/favicon.ico">

<link rel="stylesheet" href="css/style.css" onerror="handleLoadError()">
<script src="js/main.js" onerror="handleLoadError()"></script>
<script src="js/utils.js" onerror="handleLoadError()"></script>
<script src="js/data_rates.js" onerror="handleLoadError()"></script>
<script src="js/getters.js" onerror="handleLoadError()"></script>
<script src="js/events.js" onerror="handleLoadError()"></script>
<script src="js/fwbin.js" onerror="handleLoadError()"></script>
<script src="js/shrew.js" onerror="handleLoadError()"></script>

<meta property="og:title" content="ELRS Firmware Configuration Tool" />
<meta property="og:description" content="Build and preconfigure a customized ELRS firmware" />
<meta property="og:image" content="https://expresslrsconfig.eleccelerator.com/imgs/logo.png" />
<meta property="og:url" content="https://expresslrsconfig.eleccelerator.com/" />
<meta name="twitter:title" content="ELRS Firmware Configuration Tool" />
<meta name="twitter:description" content="Build and preconfigure a customized ELRS firmware" />
<meta name="twitter:image" content="https://expresslrsconfig.eleccelerator.com/imgs/logo.png" />

<script>
let loading_error = false;
function handleLoadError() {
	loading_error = true;
	document.getElementById("loading").style.display = "block";
	document.getElementById("div_all").style.display = "none";
}

window.onload = function() {
	if (loading_error == false) {
		document.getElementById("loading").style.display = "none";
		document.getElementById("div_all").style.display = "block";
	}
	else {
		return;
	}

	fetch_layoutfile("Generic 2400.json");
	fetch_layoutfile("Shrew.json");
	get_all_build_targets();

	$("#accordion").accordion({
		heightStyle: "content",
		activate: function( event, ui ) {
			accordion_onactivate(event, ui);
		}
	});
	//$("input[type=radio]").checkboxradio();
	$("fieldset").each(function() {
		var $fieldset = $(this);
		var $legend = $fieldset.find("legend");

		$legend.addClass("ui-accordion-header ui-accordion-header-fs ui-state-active ui-corner-all");
		$fieldset.addClass("ui-accordion-content ui-accordion-content-fs ui-widget-content ui-corner-bottom");
	});
	//$("input[type=checkbox]").checkboxradio();
	$("input[type=text]").addClass("ui-widget ui-widget-content ui-corner-all ui-textbox");
	$("input[type=number]").spinner();
	$("input[type=button]").button();

	//$("#drop_shrewvariant").selectmenu();

	$("#uploaded-filename").hide();

	$('#buildtargets-list').hide();

	fill_receiver_list();
	fill_version_dropdown();

	make_data_rate_dropdown(data_rates_2400);

	chk_fwver_onchange(null);
	chk_rxhighlevel_onchange(null);
	chk_rxdatarate_onchange(null);
	drop_portprotocol_onchange(null);

	$("#build_error").hide();
	$("#build_busy").hide();
	$("#build_message").hide();
	$("#build_done").hide();
	$("#build_busy").show();
	$("#build_busy_inner").text("Initializing and making a build request, please wait...");

	if (typeof(Storage) !== "undefined") {
		if (localStorage.getItem('bindphrase') !== null) {
			let s = localStorage.getItem('bindphrase');
			if (s.trim().length > 0) {
				$('#bindphrase-phrase').prop('checked', true);
				$("#txt_bindphrase").val(s);
				txt_bindphrase_onchange();
			}
		}
	}
	chk_bindphrase_onchange();
};

</script>
<title>ELRS FW Configurator</title>
</head>
<body>
<div>
	<h1>ELRS FW Configurator</h1>
	<p>This tool generated firmware binary files for ExpressLRS receivers with preconfigured firmware options.</p>
	<p>The configurator works like a wizard. You will be asked a series of questions and the correct configuration will be generated based on your answers. Everything will be explained so you that you understand the implications.</p>
	<p>
		Only some options can be pre-configured by this tool. There are still some options that can only be edited through the web-UI or through the Lua transmitter script.
	</p>
	<p>
		For combat robotics usage, this tool provides a dedicated firmware with some extra safety related and performance related features. This tool can ensure that those features are enabled by default.
	</p>
</div>
<div id="loading"><h1>Page is Loading</h1></div>
<div id="div_all" style="display: none;">
<div id="accordion" class="accordion">
	<h3>How this tool works</h3>
	<div>
		<p>
			ExpressLRS firmware files are actually consisting of the firmware binary, plus a few chunks of JSON appended to the end of the binary. This tool is simply taking a pre-built first half and changing the second JSON half. The JSON is actually where most of the configurable items are saved.
		</p>
		<p>
			ExpressLRS is an open source project (<a href="https://github.com/ExpressLRS/ExpressLRS" target="_blank">link to soure code</a>) and uses the <a href="https://www.gnu.org/licenses/gpl-3.0.txt" target="_blank">GNU GPL v3 license (link to full text)</a>. The firmware files generated by this tool falls under the same license.
		</p>
		<p>
			Because of the wide range of compilation options available for ExpressLRS firmware, the firmware binary is built on-demand on this web-server's backend. If your particular set of compilation options have been built before, then the firmware binary would be generated pretty quickly. Otherwise, it will be built on-demand and this will take time. This server is running on a potato, seriously, it has one CPU core and 512MB of RAM, a Raspberry Pi has 4 cores and a few GB of RAM.
		</p>
	</div>
	<h3>Load Prev Config</h3>
	<div>
		<p>
			If you already have a firmware file, you may load it here, and the configuration will be extracted from it. This is completely optional.
		</p>
		<p><fieldset><form id="file-form"><input type="file" id="file-input" accept=".bin, .gz" onchange="handleFile(event)" style="file-uploader" /></form></fieldset></p>
		<div id="uploaded-filename"></div>
		<p><b>Important Note: </b> depending on where this file came from, the configuration wizard may not be able to determine all the required information. Please still go through every single step to make sure everything is correct</p>
	</div>
	<h3>Version of Code?</h3>
	<div>
		<p>
			Which version of the firmware should be built? (only version 3.3.0 and later supported)
		</p>
		<p>
			<div class="radio-group">
				<table>
					<tr><td><div class="radio-container"><input type="radio" id="fwver-official" name="fwver" value="official" onchange="chk_fwver_onchange(this)" checked />
					<label for="fwver-official" class="radio-labels">Official</label></div>
					</td><td>Choose an official ELRS released version:<br />
					<div id="version_dropdown">Loading...</div>
					</td></tr>
					<!--<tr><td><div class="radio-container"><input type="radio" id="fwver-master" name="fwver" value="master" />
					<label for="fwver-master" class="radio-labels">Master Branch</label></div>
					</td><td>The latest unreleased master branch code from the official ELRS repo.</td></tr> -->
					<tr><td><div class="radio-container"><input type="radio" id="fwver-combatrobot" name="fwver" value="combatrobot" onchange="chk_fwver_onchange(this)" />
					<label for="fwver-combatrobot" class="radio-labels">Combat Robotics</label></div></td><td>A special build with features related to combat robotics. (<a href="https://github.com/frank26080115/ExpressLRS/tree/shrew" target="_blank">link to source code</a>)<br />List of extra features:
						<ul>
							<li>PWM failsafe defaults set to no-pulses</li>
							<li>option for PWM servo stretching</li>
							<li>prevents accidental activation of binding mode</li>
							<li>option to use a single data-rate instead of dynamic for faster reconnection</li>
							<li>used for Shrew, a ESC with built-in ELRS</li>
						</ul>
					</td></tr>
					<tr><td><div class="radio-container"><input type="radio" id="fwver-provided" name="fwver" value="provided" onchange="chk_fwver_onchange(this)" disabled />
					<label for="fwver-provided" class="radio-labels">Provided</label></div></td><td>Use the file you've specified in the "Load Prev Config" tab</td></tr>
				</table>
			</div>
		</p>
	</div>
	<h3>Which Receiver?</h3>
	<div>
		<p>
			Select the receiver hardware you are targeting.
		</p>
		<p>
			<div class="radio-group">
				<table>
					<tr><td><div class="radio-container"><input type="radio" id="rxhighlevel-nano" name="rxhighlevel" value="nano" onchange="chk_rxhighlevel_onchange(this)" checked />
					<label for="rxhighlevel-nano" class="radio-labels">Basic Nano</label></div>
					</td><td>Tiny nano receivers with 4 pins meant to connect to a flight controller. These use the ESP8 microcontroller and transmit using the 2.4 GHz frequency band. There are no fancy features.</td></tr>
					<tr><td><div class="radio-container"><input type="radio" id="rxhighlevel-list" name="rxhighlevel" value="list" onchange="chk_rxhighlevel_onchange(this)" />
					<label for="rxhighlevel-list" class="radio-labels">Choose From List</label></div>
					</td><td>Choose the receiver from a giantic list, if you click this option, a list will appear below.</td></tr>
					<tr><td><div class="radio-container"><input type="radio" id="rxhighlevel-shrew" name="rxhighlevel" value="shrew" onchange="chk_rxhighlevel_onchange(this)" />
					<label for="rxhighlevel-shrew" class="radio-labels">Shrew ESC</label></div>
					</td><td>Shrew ESC, choose between:<br />
						<select id="drop_shrewvariant" name="drop_shrewvariant">
							<option value="1">3.7A - DRV8231</option>
							<option value="2">21A - DRV8244</option>
						</select>
					</td></tr>
					<tr><td><div class="radio-container"><input type="radio" id="rxhighlevel-retain" name="rxhighlevel" value="retain" onchange="chk_rxhighlevel_onchange(this)" disabled />
					<label for="rxhighlevel-retain" class="radio-labels">Provided</label></div></td><td>Use the file you've specified in the "Load Prev Config" tab</td></tr>
					<tr><td><div class="radio-container"><!--<input type="radio" id="rxhighlevel-custom" name="rxhighlevel" value="custom" onchange="chk_rxhighlevel_onchange(this)" />-->
					<label for="rxhighlevel-custom" class="radio-labels">Fully Custom</label></div></td><td>You want to edit the raw JSON. A field to edit the final JSON is provided later. Please choose another option that closely matches your hardware first.</td></tr>
				</table>
			</div>
		</p>
		<div id="rx-list">
			<fieldset>
				<legend class="ui-fieldset-legend">Big List of Receivers</legend>
				<div class="ui-accordion-content">
					<div id="rx-list-inner">Loading...</div>
				</div>
			</fieldset>
		</div>
		<div id="buildtargets-list">
			<fieldset>
				<legend class="ui-fieldset-legend">Firmware Build Target</legend>
				<div class="ui-accordion-content">
					<p id="buildtargets-list-inner">Loading...</p>
				</div>
			</fieldset>
		</div>
	</div>
	<h3>Binding</h3>
	<div>
		<div id="bind_storage">
			<fieldset><legend class="ui-fieldset-legend">Bind Storage</legend>
			<p>The combat robotics version of the firmware can prevent accidental activation of binding mode. Only the web-UI interface can be used to change the binding if this option is activate.</p>
			<p><input type="checkbox" id="chk_preventbinding" name="chk_preventbinding" disabled /><label for="chk_preventbinding">Prevent accidental activation of binding mode?</label></p>
			<!--
			<div class="radio-group">
				<table>
				<tr><td><div class="radio-container"><input type="radio" id="bindstorage-normal" name="bindstorage" value="normal" checked />
				<label for="bindstorage-normal" class="radio-labels">Normal</label></div>
				</td><td>Binding is stored and persists after power-off.</td></tr>
				<tr><td><div class="radio-container"><input type="radio" id="bindstorage-volatile" name="bindstorage" value="volatile" />
				<label for="bindstorage-volatile" class="radio-labels">Volatile</label></div>
				</td><td>No binding information is ever stored. You must perform binding after every power-on.</td></tr>
				<tr><td><div class="radio-container"><input type="radio" id="bindstorage-loan" name="bindstorage" value="loan" />
				<label for="bindstorage-loan" class="radio-labels">Loanable</label></div>
				</td><td>Binding can be edited through web-UI, and that binding will persist after power-off. If binding is done through any other method, the binding will not persist, and upon power-on, the binding from the web-UI will be restored.</td></tr>
				<tr><td><div class="radio-container"><input type="radio" id="bindstorage-admin" name="bindstorage" value="admin" />
				<label for="bindstorage-admin" class="radio-labels">Administrated</label></div></td><td>Only the web-UI can be used to edit binding information, which will persist. All other binding methods are disabled. <b>This option will only work with firmware dedicated to combat robotics.</b></td></tr>
				</table>
			</div>
			-->
			</fieldset>
		</div>
		<p><fieldset><legend class="ui-fieldset-legend">Bind Button</legend>
		<div class="checkbox">
			<input type="checkbox" id="chk_disablebindbutton" name="chk_disablebindbutton">
			<label for="chk_disablebindbutton">Disable bind button (if existing)</label>&nbsp;<span>to prevent accidental activation of binding mode</span>
		</div></fieldset></p>
		<p><fieldset><legend class="ui-fieldset-legend">Receiver Data-Rate</legend>
			<div class="radio-group">
				<table>
				<tr><td><div class="radio-container"><input type="radio" id="rxdatarate-auto" name="rxdatarate" value="auto" onchange="chk_rxdatarate_onchange(this)" checked />
				<label for="rxdatarate-auto" class="radio-labels">Auto</label></div>
				</td><td>Automatically detect transmitter data-rate.<br />
					<div class="checkbox">
						<input type="checkbox" id="chk_lockonconnect" name="chk_lockonconnect" />
						<label for="chk_lockonconnect">Lock-Upon-First-Connection: If the receiver connects to a transmitter, then the data-rate of that first connection will be remembered and no other data-rate can be used with the receiver until the receiver shuts down.</label>
					</div>
				</td></tr>
				<tr><td><div class="radio-container"><input type="radio" id="rxdatarate-fixed" name="rxdatarate" value="fixed" onchange="chk_rxdatarate_onchange(this)" />
				<label for="rxdatarate-fixed" class="radio-labels">Fixed</label></div>
				</td><td>Select the only data-rate that can be used:<br /><div id="div_datarate">&nbsp;</div><br /><b>Important Note: </b> The ability to lock the data-rate is only available in the combat robotics firmware. This allows the receiver to reconnect to a transmitter faster after an unexpected shutdown.<br /><b>Important Note: </b> You must set the correct data rate on your transmitter<br /><b>Important Note: </b> The ones labelled "8ch" are recommended for robotics applications, the other ones don't send all the channels.</td></tr>
				</table>
			</div>
		</fieldset></p>
		<p><fieldset><legend class="ui-fieldset-legend">Bind ID/Phrase</legend>
			<div class="radio-group">
				<table>
				<tr><td><div class="radio-container"><input type="radio" id="bindphrase-phrase" name="bindphrase" value="phrase" onchange="chk_bindphrase_onchange(this)" />
				<label for="bindphrase-phrase" class="radio-labels">Use Phrase</label></div>
				</td><td><input type="text" id="txt_bindphrase" name="txt_bindphrase" onchange="txt_bindphrase_onchange()" oninput="txt_bindphrase_onchange()" /></td></tr>
				<tr><td><div class="radio-container"><input type="radio" id="bindphrase-id" name="bindphrase" value="id" onchange="chk_bindphrase_onchange(this)" checked />
				<label for="bindphrase-id" class="radio-labels">Use UID</label></div>
				</td><td><input type="text" id="txt_bindid" name="txt_bindid" value="0,0,0,0,0,0" onchange="txt_bindid_onchange()" oninput="txt_bindid_onchange()" /></td></tr>
				</table>
			</div>
		</p>
	</div>
	<h3>Wi-Fi</h3>
	<div>
		<p>
			<div class="radio-group">
				<table>
				<tr><td><div class="radio-container"><input type="radio" id="wifimode-ap" name="wifimode" value="ap" checked />
				<label for="wifimode-ap" class="radio-labels">Access Point</label></div>
				</td><td>ELRS will become an access point. Use your phone or computer to directly connect to the Wi-Fi access point.</td></tr>
				<tr><td><div class="radio-container"><input type="radio" id="wifimode-sta" name="wifimode" value="sta" />
				<label for="wifimode-sta" class="radio-labels">Station</label></div>
				</td><td>
					ELRS will connect into your home Wi-Fi. Please provide...<br />
					<table>
						<tr><td>SSID:</td><td><input type="text" id="txt_wifi_ssid" name="txt_wifi_ssid" /></td></tr>
						<tr><td>Password:</td><td><input type="text" id="txt_wifi_password" name="txt_wifi_password" /></td></tr>
					</table>
				</td></tr>
				</table>
			</div>
		</p>
		<p><fieldset><legend class="ui-fieldset-legend">Auto Activation Time</legend>
		If you leave the receiver powered-ON without a transmitter connected, the Wi-Fi will activate after this amount of time:<br />
		<input type="number" id="txt_wifitime" name="txt_wifitime" value="60" min="-1" step="1" /><br />(in seconds, -1 means "never", 0 means "immediately")
		</fieldset></p>
	</div>
	<h3>Serial Port</h3>
	<div>
		<p>
			<table>
				<tr><td>Baud Rate</td><td><input type="number" id="txt_baudrate" name="txt_baudrate" value="420000" min="0" /></td></tr>
				<tr><td><label for="chk_isairport">Is AirPort?</label></td><td><input type="checkbox" id="chk_isairport" name="chk_isairport"/><br />AirPort allows you to turn a regular ExpressLRS transmitter and receiver pair into a bi-directional transparent serial data link, over the air. Official documentation: <a href="https://www.expresslrs.org/software/airport/" target="_blank">https://www.expresslrs.org/software/airport/</a></td></tr>
				<!--
				<tr><td>Port Protocol</td><td><select id="drop_portprotocol" name="drop_portprotocol" onchange="drop_portprotocol_onchange(this)">
					<option value='0' selected>CRSF</option>
					<option value='1'>Inverted CRSF</option>
					<option value='2'>SBUS</option>
					<option value='3'>Inverted SBUS</option>
					<option value='4'>SUMD</option>
					<option value='5'>DJI RS Pro</option>
					<option value='6'>HoTT Telemetry</option>
					<option value='7'>MAVLINK</option>
				</select></td></tr>
				<tr><td>Protocol (Port 2)</td><td><select id="drop_portprotocol2" name="drop_portprotocol2" onchange="drop_portprotocol_onchange(this)">
					<option value='0' selected>CRSF</option>
					<option value='1'>Inverted CRSF</option>
					<option value='2'>SBUS</option>
					<option value='3'>Inverted SBUS</option>
					<option value='4'>SUMD</option>
					<option value='5'>DJI RS Pro</option>
					<option value='6'>HoTT Telemetry</option>
					<option value='7'>MAVLINK</option>
				</select></td></tr>
				-->
			</table>
		</p>
		<!--
		<div id="sbus-options"><fieldset><legend class="ui-fieldset-legend">SBUS Options</legend>
			SBUS failsafe mode: <br />
			<select id="drop_sbusfailsafe" name="drop_sbusfailsafe">
				<option value='0'>No Pulses</option>
				<option value='1'>Last Position</option>
			</select>
		</fieldset></div>
		-->
	</div>
	<h3>PWM</h3>
	<div>
		<p>
			PWM pins are useful for controlling servos and ESCs without any flight-controllers involved.
		</p>
		<p>
			<div class="radio-group">
				<table>
				<tr><td><div class="radio-container"><input type="radio" id="pwmpinset-default" name="pwmpinset" value="default" checked>
				<label for="pwmpinset-default" class="radio-labels">Default</label></div>
				</td><td>Use default settings based on the receiver selection</td></tr>
				<tr><td><div class="radio-container"><input type="radio" id="pwmpinset-nano3" name="pwmpinset" value="nano3">
				<label for="pwmpinset-nano3" class="radio-labels">Nano 3x PWM</label></div>
				</td><td>Nano style receiver modified to output 3x PWM signals (<a href="https://github.com/frank26080115/elrs-fw-web-config/blob/master/docs/nano-pwm-mod/readme.md" target="_blank">click here for more info</a>)</td></tr>
				<tr><td><div class="radio-container"><input type="radio" id="pwmpinset-nano2" name="pwmpinset" value="nano3">
				<label for="pwmpinset-nano2" class="radio-labels">Nano Hybrid</label></div>
				</td><td>Nano style receiver modified to output 2x PWM signals and 1x serial port output (<a href="https://github.com/frank26080115/elrs-fw-web-config/blob/master/docs/nano-pwm-mod/readme.md" target="_blank">click here for more info</a>)</td></tr>
				<tr><td><div class="radio-container"><input type="radio" id="pwmpinset-shrew" name="pwmpinset" value="shrew">
				<label for="pwmpinset-shrew" class="radio-labels">Shrew ESC</label></div>
				</td><td>Shrew ESC has dedicated PWM pins.</td></tr>
				<tr><td><div class="radio-container"><input type="radio" id="pwmpinset-custom" name="pwmpinset" value="custom">
				<label for="pwmpinset-custom" class="radio-labels">Custom</label></div></td><td>Enter the list of PWM pins below:<br /><input type="text" id="txt_pwmlist" name="txt_pwmlist"></td></tr>
				</table>
			</div>
		</p>
		<p><b>Important Note: </b> If you have selected the combat robotics firmware, then all PWM pins will be initialized with a no-pulse failsafe mode for maximum safety out-of-the-box. The combat robotics specific firmware also features servo stretching, but it will not be enabled by default.</p>
		<p>Appologies, it is not possible to modify the fine details about each individual PWM pins. That section of configuration data is stored in emulated-EEPROM and is not a part of the firmware at all.</p>
		<p><b>Important Note: </b> This means if you are not using the combat robotics firmware, please double check your PWM failsafe settings afterwards. They may have defaulted to an airplane-friendly failsafe setting.</p>
	</div>
	<h3>Other</h3>
	<div>
		<!--
		<p><fieldset><legend class="ui-fieldset-legend">Model Match</legend>
			<input type="checkbox" id="chk_enablemodelmatch" name="chk_enablemodelmatch" /><label for="chk_enablemodelmatch" class="radio-labels">Enable Model Match?</label>
			<br />
			If enabled, then the transmitter's selected Model ID must match the receiver's Model ID, or else the receiver will not provide any control signal(s).
			<br />
			Model ID: <input type="number" value="0" min="0" max="255" step="1" />
		</fieldset></p>
		-->
		<!--
		<p><fieldset><legend class="ui-fieldset-legend">Telemetry</legend>
			<input type="checkbox" id="chk_forcetelemoff" name="chk_forcetelemoff" /><label for="chk_forcetelemoff" class="radio-labels">Force Telemetry Off?</label>
		</fieldset></p>
		-->
		<div id="regulatory_domain"><fieldset><legend class="ui-fieldset-legend">Regulatory Domain</legend>
			This only applies to sub-GHz radios. 2.4 GHz radios do not care about this option.<br />
			<select id="drop_domain" name="drop_domain">
				<option value='0'>AU915</option>
				<option value='1'>FCC915</option>
				<option value='2'>EU868</option>
				<option value='3'>IN866</option>
				<option value='4'>AU433</option>
				<option value='5'>EU433</option>
				<option value='6'>US433</option>
				<option value='7'>US433-Wide</option>
			</select>
		</fieldset></div>
	</div>
	<h3 id="sect_save">Finish + Save + Flash</h3>
	<div>
		<div id="build_done"><input type="button" id="btn_save_offline" onclick="btn_saveoffline_onclick()" value="Save for Offline" /><input type="button" id="btn_save_wifi" onclick="btn_savewifi_onclick()" value="Save for Wi-Fi Install" /><input type="button" id="btn_flasherase" onclick="btn_flasherase_onclick()" value="Erase Flash" /><input type="button" id="btn_flash" onclick="btn_flash_onclick()" value="Flash Firmware" /></div>
		<div id="build_message"><fieldset><legend class="ui-fieldset-legend">Build Message</legend><textarea id="txt_buildmessage" name="txt_buildmessage" class="build-message" readonly ></textarea><br /><input type="button" onclick="build_retry()" value="Retry?" />
		</fieldset></div>
		<div id="build_error"><fieldset><legend class="ui-fieldset-legend">Error</legend><div id="build_error_inner">&nbsp;</div><br /><input type="button" onclick="build_retry()" value="Retry?" />
		</fieldset></div>
		<div id="build_busy"><fieldset><legend class="ui-fieldset-legend">Busy Message</legend><div id="build_busy_inner">&nbsp;</div>
		</fieldset></div>
		<p>Below, you can edit the raw JSON data that is about to be embedded into the saved firmware file.</p>
		<p><fieldset><legend class="ui-fieldset-legend">Product Name</legend><input type="text" id="txt_rawproductname" name="txt_rawproductname" /><br />(this is cosmetic only)
		</fieldset></p>
		<p><fieldset><legend class="ui-fieldset-legend">Device Name</legend><input type="text" id="txt_rawdevicename" name="txt_rawdevicename" /><br />(this is cosmetic only)
		</fieldset></p>
		<p><fieldset><legend class="ui-fieldset-legend">Configuration</legend><textarea id="txt_rawconfig" name="txt_rawconfig" class="raw-editor"></textarea>
		</fieldset></p>
		<p><fieldset><legend class="ui-fieldset-legend">Hardware</legend><textarea id="txt_rawhardware" name="txt_rawhardware" class="raw-editor"></textarea>
		</fieldset></p>
	</div>
</div>
</div>
</body>
</html>
