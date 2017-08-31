
// linearly interpolates between to endpoints, vstart and vend
class LinearInterpolator {

	constructor(vstart, vend) {
		this.start = vstart;
		this.end = vend;
		this.delta = Vector.subtract(this.end, this.start);
	}

	interpolate(pct) {
		return Vector.add(this.start, Vector.scale(this.delta, pct));
	}

}

// a class to generate color gradients
class Gradient {

	constructor(colors, endPoints) {
		// the color endpoints of the gradient
		this.colors = colors;
		// if, for example, endPoints is [0, 0.9, 1], then the gradient has 3 color
		// endPoints, where 90% of the gradient is the transition between the 1st and 2nd color,
		// and 10% is the transition between the 2nd and the 3rd color
		if (endPoints) {
			this.endPoints = endPoints;
		} else {
			this.endPoints = [];
			var length = this.colors.length;
			for (var i = 0; i < length; i++) {
				this.endPoints.push(i / (length - 1));
			}
		}
		// an array of linear interpolates, for interpolating between the colors
		this.LIs = [];
		for (var j = 1; j < this.colors.length; j++) {
			this.LIs.push(new LinearInterpolator(this.colors[j - 1], this.colors[j]))
		}
	}

	// given a percent of progress through the gradient, get the current color
	getColor(pct) {
		for (var j = 1; j < this.endPoints.length; j++) {
			if (pct <= this.endPoints[j]) {
				return this.LIs[j - 1].interpolate((pct - this.endPoints[j - 1]) / (this.endPoints[j] - this.endPoints[j - 1]));
			}
		}
		throw "Invalid Argument";
	}

}

// some preset gradients
var rainbow = [
	new Vector3(255, 255, 255),
	new Vector3(252, 106, 145),
	new Vector3(255, 247, 170),
	new Vector3(170, 255, 200),
	new Vector3(173, 170, 255),
	new Vector3(202, 127, 239),
];

var fire = [
	new Vector3(255, 255, 255),
	new Vector3(252, 165, 42),
	new Vector3(252, 42, 77),
	new Vector3(84, 2, 132),
	new Vector3(0, 0, 0)
];

var firereversed = fire.slice().reverse();

var water = [
	new Vector3(255, 255, 255),
	new Vector3(165, 255, 252),
	new Vector3(66, 75, 244),
	new Vector3(91, 247, 218),
	new Vector3(255, 255, 255)
];

var night = [
	new Vector3(0, 0, 0),
	new Vector3(54, 0, 109),
	new Vector3(6, 14, 96),
	new Vector3(255, 255, 255),
	new Vector3(54, 0, 109),
	new Vector3(0, 0, 0),
	new Vector3(255, 255, 255),
	new Vector3(0, 0, 0)
];

var nightEndPoints = [0, 0.2, 0.4, 0.45, 0.5, 0.9, 0.95, 1];

var fireGrad = new Gradient(fire);
var rainbowGrad = new Gradient(rainbow);
var firereversedGrad = new Gradient(firereversed);
var waterGrad = new Gradient(water);
var nightGrad = new Gradient(night, nightEndPoints);

var gradientById = {
	fire: fireGrad,
	rainbow: rainbowGrad,
	firereversed: firereversedGrad,
	water: waterGrad,
	night: nightGrad
};

var gradientNames = [
	"Fire",
	"Fire (Reversed)",
	"Rainbow",
	"Water",
	"Night"
];

var origGradIds = [
	"fire",
	"firereversed",
	"rainbow",
	"water",
	"night"
]

// create a custom gradient
function loadCustomGradient() {
	var colors = [];
	$(".color").each(function() {
		var col = $(this).css("background-color");
		var colArray = col.split(", ");
		var r = parseFloat(colArray[0].split("(")[1]);
		var g = parseFloat(colArray[1]);
		var b = parseFloat(colArray[2].split(")")[0]);
		colors.push(new Vector3(r, g, b));
	});
	var length = colors.length;
	if (length == 1) {
		colors.push(colors[0]);
	}
	return new Gradient(colors);
}


function findGradientById(id) {
	if (gradientById[id]) {
		return gradientById[id];
	} else {
		return loadCustomGradient();
	}
}

/*function saveGradientsToStorage() {
	localStorage.setItem("gradients", JSON.stringify(gradientById));
}

function loadGradientsFromStorage() {
	gradientById = JSON.parse(localStorage.gradients);
}*/
























