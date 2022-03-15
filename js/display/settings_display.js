const SettingsDisplay = function(d) {
	this.setSize = function() {
		w = 72; h = 30;
		x = d.centerWidth(w);
		y = d.centerHeight(h);
	}
	let x, y;
	this.setSize();

	const settings = d.buffer.new(x, y, w, h, 'menu');
	
	this.start = function() {
		settings.outline('red');
	}
}

module.exports = SettingsDisplay;
