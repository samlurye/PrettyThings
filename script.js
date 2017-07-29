function map2(a1, a2, f) {
	var length1 = a1.length;
	var length2 = a2.length;
	if (length1 != length2) {
		throw "Arrays Must Have Equal Length";
	}
	var result = [];
	for (var i = 0; i < length1; i++) {
		result.push(f(a1[i], a2[i], i, a1, a2));
	}
	return result;
}

function Vector2(x, y) {
	this.x = x;
	this.y = y;
	this.array = [x, y];
	this.dim = 2;
	this.print = function() { console.log(this.array) };
}

function Vector3(x, y, z) {
	Vector2.call(this, x, y);
	this.z = z;
	this.array.push(this.z);
	this.dim = 3;
}

function Vector4(x, y, z, w) {
	Vector3.call(this, x, y, z);
	this.w = w;
	this.array.push(this.w);
	this.dim = 4;
}

function Matrix3x3(v1, v2, v3) {
	this.rows = [v1, v2, v3];
	this.columns = Array(3).fill(0).map(function(c, i) {
		return new Vector3(v1.array[i], v2.array[i], v3.array[i]);
	});
}

class Vector {

	static arrayToVector(args) {
		var length = args.length;
		if (length == 2) {
			return new Vector2(args[0], args[1]);
		} else if (length == 3) {
			return new Vector3(args[0], args[1], args[2]);
		} else {
			return new Vector4(args[0], args[1], args[2], args[3]);
		}
	}

	static scale(v, k) {
		return Vector.arrayToVector(v.array.map(c => c * k));
	}

	static componentWiseOperation(v1, v2, f) {
		if (v1.dim != v2.dim) {
			throw "Unequal Dimensions";
		}
		return Vector.arrayToVector(map2(v1.array, v2.array, f));
	}

	static add(v1, v2) {
		return Vector.componentWiseOperation(v1, v2, (x, y) => x + y);
	}

	static subtract(v1, v2) {
		return Vector.componentWiseOperation(v1, v2, (x, y) => x - y);
	}

	static product(v1, v2) {
		return Vector.componentWiseOperation(v1, v2, (x, y) => x * y);
	}

	static dot(v1, v2) {
		return v2.array.reduce((sum, c, i) => sum += c * v1.array[i], 0);
	}

	static cross(v1, v2) {
		return new Vector3(
			v1.y * v2.z - v1.z * v2.y,
			v1.z * v2.x - v1.x * v2.z,
			v1.x * v2.y - v1.y * v2.x
		)
	}

	static matrixMultVector(m, v) {
		return Vector.arrayToVector(m.rows.map(function(v_m) {
			return Vector.dot(v_m, v);
		}));
	}

	static matrixMultMatrix(m1, m2) {
		var productArray = m1.rows.map(function(v1) {
			return Vector.arrayToVector(m2.columns.map(function(v2) {
				return Vector.dot(v1, v2);
			}));
		});
		var result = new Matrix3x3(
			new Vector3(0, 0, 0),
			new Vector3(0, 0, 0),
			new Vector3(0, 0, 0)
		);
		Matrix3x3.apply(result, productArray);
		return result;
	}

	static cosAngle(v1, v2) {
		return Vector.dot(v1, v2) / (Vector.mag(v1) * Vector.mag(v2));
	}
	
	static rotate2D(v, angle) {
		var x = v.x * Math.cos(angle) - v.y * Math.sin(angle);
		var y = v.x * Math.sin(angle) + v.y * Math.cos(angle);
		var args = [];
		args.push(x);
		args.push(y);
		if (v.z) {
			args.push(v.z);
		}
		if (v.w) {
			args.push(v.w);
		}
		return Vector.arrayToVector(args);
	}

  	static mag(v) {
		return Math.sqrt(v.array.reduce((sum, c) => sum += c * c, 0));
	}

	static dist(v1, v2) {
		return Vector.mag(Vector.add(v1, v2));
	}

	static normalize(v) {
		return Vector.scale(v, 1 / Vector.mag(v));
	}

	static ortho(v, m, n) {
		var a = m;
		var b = n;
		var c = 0;
		if (v.z != 0) {
			c = (-v.x * a - v.y * b) / v.z;
		} else if (v.y != 0) {
			b = (-v.x * a) / v.y;
		} else if (v.x != 0) {
			a = 0;
			b = 1;
		} else {
			throw "Invalid Input"
		}
		return Vector.normalize(new Vector3(a, b, c));
	}

}

class Quaternion {

	constructor(axis, w) {
		this.w = w;
		this.axis = axis;
	}

	static add(q1, q2) {
		return new Quaternion(q1.w + q2.w, Vector.add(q1.axis, q2.axis));
	}

	static mult(q1, q2) {
		return new Quaternion(
			Vector.add(Vector.scale(q2.axis, q1.w), Vector.add(Vector.scale(q1.axis, q2.w), Vector.cross(q1.axis, q2.axis))),
			q1.w * q2.w - Vector.dot(q1.axis, q2.axis)
		);
	}

	conjugate() {
		return new Quaternion(Vector.scale(this.axis, -1), this.w);
	}

	rotate(v, theta) {
		theta = theta / 2;
		var qv = new Quaternion(v, 0);
		this.axis = Vector.scale(Vector.normalize(this.axis), Math.sin(theta));
		this.w = Math.cos(theta);
		var conj = this.conjugate();
		return Quaternion.mult(Quaternion.mult(this, qv), conj).axis;
	}

}

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

class Gradient {

	constructor(colors, endPoints) {
		this.colors = colors;
		this.endPoints = endPoints;
		this.LIs = [];
		for (var j = 1; j < this.colors.length; j++) {
			this.LIs.push(new LinearInterpolator(this.colors[j - 1], this.colors[j]))
		}
	}

	getColor(pct) {
		for (var j = 1; j < this.endPoints.length; j++) {
			if (pct <= this.endPoints[j]) {
				return this.LIs[j - 1].interpolate((pct - this.endPoints[j - 1]) / (this.endPoints[j] - this.endPoints[j - 1]));
			}
		}
		throw "Invalid Argument";
	}

}

var rainbow = [
	new Vector3(252, 106, 145),
	new Vector3(255, 247, 170),
	new Vector3(170, 255, 200),
	new Vector3(173, 170, 255),
	new Vector3(202, 127, 239)
];

var ry = [
	new Vector3(252, 106, 145),
	new Vector3(255, 247, 170)
];

var fire = [
	new Vector3(255, 255, 255),
	new Vector3(252, 165, 42),
	new Vector3(252, 42, 77),
	new Vector3(84, 2, 132),
	new Vector3(0, 0, 0)
];

var evenIntervals = [0, 0.25, 0.5, 0.75, 1];

var fireGrad = new Gradient(fire, evenIntervals);
var rainbowGrad = new Gradient(rainbow, evenIntervals);

class Settings {

	constructor(threeDMode, numCircles, minRadius, maxRadius, minLinFreq, maxLinFreq, minAngVel1, maxAngVel1, minAngVel2, maxAngVel2, axis1, axis2, grad) {
		this.threeDMode = threeDMode;
		this.numCircles = numCircles;
		this.minRadius = minRadius;
		this.maxRadius = maxRadius;
		this.minLinFreq = minLinFreq;
		this.maxLinFreq = maxLinFreq;
		this.minAngVel1 = minAngVel1;
		this.maxAngVel1 = maxAngVel1;
		this.minAngVel2 = minAngVel2;
		this.maxAngVel2 = maxAngVel2;
		this.axis1 = axis1;
		this.axis2 = axis2;
		this.grad = grad;
	}

	static createNew() {
		return new Settings(
			(function() { 
				if ($("#threeDMode .selected").attr("id") == "on") {
					return true;
				} else {
					return false;
				}
			})(),
			parseFloat($("#numCircles").val()),
			parseFloat($("#minRadius").val()),
			parseFloat($("#maxRadius").val()),
			parseFloat($("#minLinFreq").val()),
			parseFloat($("#maxLinFreq").val()),
			parseFloat($("#minAngVel1").val()),
			parseFloat($("#maxAngVel1").val()),
			parseFloat($("#minAngVel2").val()),
			parseFloat($("#maxAngVel2").val()),
			new Quaternion(new Vector3(parseFloat($("#axis1X").val()), parseFloat($("#axis1Y").val()), parseFloat($("#axis1Z").val())), 0),
			new Quaternion(new Vector3(parseFloat($("#axis2X").val()), parseFloat($("#axis2Y").val()), parseFloat($("#axis2Z").val())), 0),
			(function() {
				if ($("#gradLi .selected").attr("id") == "fire") {
					return fireGrad;
				} else {
					return rainbowGrad;
				}
			})()
		);
	}

	load() {
		$("#threeDMode .selected").removeClass("selected");
		if (this.threeDMode) {
			$("#on").addClass("selected");
		} else {
			$("#off").addClass("selected");
		}
		$("#gradLi .selected").removeClass("selected");
		if (this.grad == fireGrad) {
			$("#fire").addClass("selected");
		} else {
			$("#rainbow").addClass("selected");
		}
		$("#numCircles").val(this.numCircles);
		$("#minRadius").val(this.minRadius);
		$("#maxRadius").val(this.maxRadius);
		$("#minLinFreq").val(this.minLinFreq);
		$("#maxLinFreq").val(this.maxLinFreq);
		$("#minAngVel1").val(this.minAngVel1);
		$("#maxAngVel1").val(this.maxAngVel1);
		$("#minAngVel2").val(this.minAngVel2);
		$("#maxAngVel2").val(this.maxAngVel2);
		$("#axis1X").val(this.axis1.axis.x);
		$("#axis1Y").val(this.axis1.axis.y);
		$("#axis1Z").val(this.axis1.axis.z);
		$("#axis2X").val(this.axis2.axis.x);
		$("#axis2Y").val(this.axis2.axis.y);
		$("#axis2Z").val(this.axis2.axis.z);
	}

}

paper.install(window);

$(document).ready(function() {
	paper.setup('canvas');

	var unitX = new Vector3(1, 0, 0);
	var unitY = new Vector3(0, 1, 0);
	var unitZ = new Vector3(0, 0, 1);

	var i = new Quaternion(unitX, 0);
	var j = new Quaternion(unitY, 0);
	var k = new Quaternion(unitZ, 0);

	var defaultSettings = new Settings(
		false,
		200,
		25,
		75,
		-0.5,
		1.2,
		0.002,
		0.005,
		0,
		0,
		k,
		k,
		fireGrad
	)
	var activeSettings = defaultSettings;
	activeSettings.load();

	var origin = new Vector3(view.size.width / 2, view.size.height / 2, 0);

	class MovingCircle {

		constructor(circle, linFreq, angVel1, angVel2, axis1, axis2, axis3) {
			this.circle = circle;
			this.initialRadius = this.circle.radius;
			this.linFreq = linFreq;
			this.angVel1 = angVel1;
			this.angVel2 = angVel2;
			console.log(angVel2);
			this.axis1 = axis1;
			this.axis2 = axis2;
			this.axis3 = axis3;
		}

		update(event) {
			if (activeSettings.threeDMode) {
				this.axis1.axis = this.axis2.rotate(this.axis1.axis, 0.03);
				this.axis3 = this.axis2.rotate(this.axis3, 0.03);
			}
			this.axis3 = this.axis1.rotate(this.axis3, this.angVel1);
			var posRelToOrigin = Vector.scale(this.axis3, view.size.height / 2 * Math.sin(event.time * this.linFreq));
			var viewPos = Vector.add(origin, posRelToOrigin);
			var scaleFactor = 1;
			if (activeSettings.threeDMode) {
				scaleFactor = 1 / (1 + Math.exp(-4 * posRelToOrigin.z / view.size.height));
			}
			this.circle.fillColor.alpha = scaleFactor;
			this.circle.radius = this.initialRadius * scaleFactor;
			this.circle.position.x = viewPos.x;
			this.circle.position.y = viewPos.y;
		}

	}

	var circles = [];

	function makeCircles(activeSettings) {
		circles.map(function(c) {
			c.circle.remove();
		});
		circles = [];
		for (var i = 0; i < activeSettings.numCircles; i++) {
			var circle = new Shape.Circle(
				view.center, 
				i / activeSettings.numCircles * (activeSettings.maxRadius - activeSettings.minRadius) + activeSettings.minRadius
			);
			var color = activeSettings.grad.getColor(i / activeSettings.numCircles);
			circle.fillColor = "rgb(" + color.x + ", " + color.y + ", " + color.z + ", 0.5)";
			circle.sendToBack();
			var linFreq = i / activeSettings.numCircles * (activeSettings.maxLinFreq - activeSettings.minLinFreq) + activeSettings.minLinFreq;
			var angVel1 = i / activeSettings.numCircles * (activeSettings.maxAngVel1 - activeSettings.minAngVel1) + activeSettings.minAngVel1;
			var angVel2 = i / activeSettings.numCircles * (activeSettings.maxAngVel2 - activeSettings.minAngVel2) + activeSettings.minAngVel2;
			var axis1 = activeSettings.axis1;
			var axis2 = activeSettings.axis2;
			var axis3 = Vector.ortho(activeSettings.axis1.axis, 1, 0);
			var movingCircle = new MovingCircle(circle, linFreq, angVel1, angVel2, axis1, axis2, axis3);
			circles.push(movingCircle);
		}
	}

	makeCircles(activeSettings);

	$("#applyAll").click(function() {
		activeSettings = Settings.createNew();
		makeCircles(activeSettings);
	});

	function setSelected(parentId, id) {
		$("#" + parentId + " .selected").removeClass("selected");
		$("#" + id).addClass("selected");
	}

	$("#on").click(function() {
		setSelected("threeDMode", "on");
	});

	$("#off").click(function() {
		setSelected("threeDMode", "off");
	});

	$("#fire").click(function() {
		setSelected("gradLi", "fire");
	});

	$("#rainbow").click(function() {
		setSelected("gradLi", "rainbow");
	});

	view.onFrame = function(event) {
		for (var i = 0; i < circles.length; i++) {
			circles[i].update(event);
			if (activeSettings.threeDMode) {
				if (circles[i].circle.previousSibling) {
					if (circles[i].circle.radius > circles[i].circle.previousSibling.radius) {
						circles[i].circle.moveAbove(circles[i].circle.previousSibling);
					} else {
						circles[i].circle.moveBelow(circles[i].circle.previousSibling);
					}
				}
			}
		}
	}
});














