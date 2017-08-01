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

	static conjugate(q) {
		return new Quaternion(Vector.scale(q.axis, -1), q.w);
	}

	rotate(v, theta) {
		theta = theta / 2;
		var qv = new Quaternion(v, 0);
		var scaledAxis = Vector.scale(Vector.normalize(this.axis), Math.sin(theta));
		var scaledW = Math.cos(theta);
		var scaledQ = new Quaternion(scaledAxis, scaledW);
		var conj = Quaternion.conjugate(scaledQ);
		return Quaternion.mult(Quaternion.mult(scaledQ, qv), conj).axis;
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

var sym = [
	new Vector3(252, 165, 42),
	new Vector3(252, 42, 77),
	new Vector3(84, 2, 132),
	new Vector3(252, 42, 77),
	new Vector3(252, 165, 42)
];

var evenIntervals = [0, 0.25, 0.5, 0.75, 1];

var fireGrad = new Gradient(fire, evenIntervals);
var rainbowGrad = new Gradient(rainbow, evenIntervals);

function setSelected(parentId, id) {
	$("#" + parentId + " .selected").removeClass("selected");
	$("#" + id).addClass("selected");
}

function showRGBSelect(on) {
	if (on) {
		$(".rgb-select").css({"display": "block"});
	} else {
		$(".rgb-select").css({"display": "none"});
	}
}

function selectGradient(id) {
	setSelected("gradLi", id);
	if (id == "custom") {
		showRGBSelect(true);
	} else {
		showRGBSelect(false);
	}
}

class Settings {

	constructor(threeDMode, numCircles, minRadius, maxRadius, minLinFreq, maxLinFreq, minAngVel1, maxAngVel1, 
			minAngVel2, maxAngVel2, axis1, axis2, grad, axisC, minAngVelC, maxAngVelC, minRadiusC, maxRadiusC) {
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
		this.axisC = axisC;
		this.minAngVelC = minAngVelC;
		this.maxAngVelC = maxAngVelC;
		this.minRadiusC = minRadiusC;
		this.maxRadiusC = maxRadiusC;
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
			parseFloat($("#numCircles").val()) || 0,
			parseFloat($("#minRadius").val()) || 0,
			parseFloat($("#maxRadius").val()) || 0,
			parseFloat($("#minLinFreq").val()) || 0,
			parseFloat($("#maxLinFreq").val()) || 0,
			parseFloat($("#minAngVel1").val()) || 0,
			parseFloat($("#maxAngVel1").val()) || 0,
			parseFloat($("#minAngVel2").val()) || 0,
			parseFloat($("#maxAngVel2").val()) || 0,
			new Quaternion(
				new Vector3(
					parseFloat($("#axis1X").val()) || 0, 
					parseFloat($("#axis1Y").val()) || 0, 
					parseFloat($("#axis1Z").val()) || 1
				), 
				0
			),
			new Quaternion(
				new Vector3(
					parseFloat($("#axis2X").val()) || 0, 
					parseFloat($("#axis2Y").val()) || 0, 
					parseFloat($("#axis2Z").val()) || 1
				), 
				0
			),
			(function() {
				if ($("#gradLi .selected").attr("id") == "fire") {
					return fireGrad;
				} else if ($("#gradLi .selected").attr("id") == "rainbow") {
					return rainbowGrad;
				} else {
					var colors = [];
					var endPoints = [];
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
						return new Gradient(colors, [0, 1]);
					} else {
						for (var i = 0; i < length; i++) {
							endPoints.push(i / (length - 1));
						}
						return new Gradient(colors, endPoints);
					}
				}
			})(),
			new Quaternion(
				new Vector3(
					parseFloat($("#axisCX").val()) || 0, 
					parseFloat($("#axisCY").val()) || 0, 
					parseFloat($("#axisCZ").val()) || 1
				), 
				0
			),
			parseFloat($("#minAngVelC").val()) || 0,
			parseFloat($("#maxAngVelC").val()) || 0,
			parseFloat($("#minRadiusC").val()) || 0,
			parseFloat($("#maxRadiusC").val()) || 0 
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
			selectGradient("fire");

		} else if (this.grad == rainbowGrad) {
			selectGradient("rainbow");
		} else {
			selectGradient("custom");
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
		$("#axisCX").val(this.axisC.axis.x);
		$("#axisCY").val(this.axisC.axis.y);
		$("#axisCZ").val(this.axisC.axis.z);
		$("#minAngVelC").val(this.minAngVelC);
		$("#maxAngVelC").val(this.maxAngVelC);
		$("#minRadiusC").val(this.minRadiusC);
		$("#maxRadiusC").val(this.maxRadiusC);
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
		true,
		100,
		0,
		75,
		0.5,
		1.2,
		0.005,
		0.005,
		-0.03,
		0.03,
		new Quaternion(new Vector3(0, 0, 1), 0),
		new Quaternion(new Vector3(1, 1, 1), 0),
		rainbowGrad,
		new Quaternion(new Vector3(0, 0, 1), 0),
		-0.1,
		0.1,
		0,
		200
	);
	var activeSettings = defaultSettings;
	activeSettings.load();

	var origin = new Vector3(view.size.width / 2, view.size.height / 2, 0);

	class MovingCircle {

		constructor(circle, linFreq, angVel1, angVel2, axis1, axis2, axis3, color, colorAxis, radiusC, angVelC) {
			this.circle = circle;
			this.initialRadius = this.circle.radius;
			this.linFreq = linFreq;
			this.angVel1 = angVel1;
			this.angVel2 = angVel2;
			this.axis1 = axis1;
			this.axis2 = axis2;
			this.axis3 = axis3;
			this.color = color;
			this.colorAxis = colorAxis;
			this.angVelC = angVelC;
			this.radiusC = radiusC;
			this.colorDelta = Vector.scale(Vector.ortho(this.colorAxis.axis, 1, 0), radiusC);
			this.colorPivot = Vector.subtract(this.color, this.colorDelta);
		}

		update(time) {
			if (activeSettings.threeDMode) {
				this.axis1.axis = this.axis2.rotate(this.axis1.axis, this.angVel2);
				this.axis3.axis = this.axis2.rotate(this.axis3.axis, this.angVel2);
			}
			this.axis3.axis = this.axis1.rotate(this.axis3.axis, this.angVel1);
			var posRelToOrigin = Vector.scale(this.axis3.axis, view.size.height / 2 * Math.sin(time * this.linFreq));
			var viewPos = Vector.add(origin, posRelToOrigin);
			var scaleFactor = 1;
			if (activeSettings.threeDMode) {
				scaleFactor = 1 / (1 + Math.exp(-4 * posRelToOrigin.z / view.size.height));
			}
			this.circle.radius = this.initialRadius * scaleFactor;
			this.circle.position.x = viewPos.x;
			this.circle.position.y = viewPos.y;
			this.circle.z = viewPos.z;
			this.colorDelta = this.colorAxis.rotate(this.colorDelta, this.angVelC);
			var color = Vector.add(this.colorPivot, this.colorDelta);
			this.circle.fillColor = "rgb(" + color.x + ", " + color.y + ", " + color.z + ")";
			this.circle.fillColor.alpha = scaleFactor;
		}

	}

	var circles = [];
	var time = 0;

	function makeCircles(settings) {
		circles.map(function(c) {
			c.circle.remove();
		});
		circles = [];
		time = 0;
		for (var i = 0; i < settings.numCircles; i++) {
			var circle = new Shape.Circle(
				view.center, 
				i / settings.numCircles * (settings.maxRadius - settings.minRadius) + settings.minRadius
			);
			var color = settings.grad.getColor(i / settings.numCircles);
			circle.fillColor = "rgb(" + color.x + ", " + color.y + ", " + color.z + ")";
			circle.sendToBack();
			var linFreq = i / settings.numCircles * (settings.maxLinFreq - settings.minLinFreq) + settings.minLinFreq;
			var angVel1 = i / settings.numCircles * (settings.maxAngVel1 - settings.minAngVel1) + settings.minAngVel1;
			var angVel2 = i / settings.numCircles * (settings.maxAngVel2 - settings.minAngVel2) + settings.minAngVel2;
			var axis1 = new Quaternion(new Vector3(settings.axis1.axis.x, settings.axis1.axis.y, settings.axis1.axis.z), 0);
			var axis2 = new Quaternion(new Vector3(settings.axis2.axis.x, settings.axis2.axis.y, settings.axis2.axis.z), 0)
			var axis3 = new Quaternion(Vector.ortho(axis1.axis, 1, 0), 0);
			var axisC = new Quaternion(new Vector3(settings.axisC.axis.x, settings.axisC.axis.y, settings.axisC.axis.z), 0);
			var angVelC = i / settings.numCircles * (settings.maxAngVelC - settings.minAngVelC) + settings.minAngVelC;
			var radiusC = i / settings.numCircles * (settings.maxRadiusC - settings.minRadiusC) + settings.minRadiusC;
			var movingCircle = new MovingCircle(circle, linFreq, angVel1, angVel2, axis1, axis2, axis3, color, axisC, radiusC, angVelC);
			circles.push(movingCircle);
		}
	}

	makeCircles(activeSettings);

	$("#applyAll").click(function() {
		activeSettings = Settings.createNew();
		console.log(activeSettings);
		makeCircles(activeSettings);
	});

	$("#on").click(function() {
		setSelected("threeDMode", "on");
	});

	$("#off").click(function() {
		setSelected("threeDMode", "off");
	});

	$("#fire").click(function() {
		selectGradient("fire");
	});

	$("#rainbow").click(function() {
		selectGradient("rainbow");
	});

	$("#custom").click(function() {
		selectGradient("custom");
	});

	function setRGB(idNum) {
		var r = $("#rangeR" + idNum).val();
		var g = $("#rangeG" + idNum).val();
		var b = $("#rangeB" + idNum).val()
		$("#color" + idNum).css({"background-color": "rgb(" + r + ", " + g + ", " + b +")"});
	}

	function attachColorHandlers(textDiv, rangeDiv, idNum) {
		textDiv.off("keyup");
		textDiv.off("blur");
		rangeDiv.off("change");
		textDiv.keyup(function() {
			rangeDiv.val(parseFloat(textDiv.val()));
			setRGB(idNum);
			
		});
		textDiv.blur(function() {
			if (textDiv.val() == "") {
				textDiv.val(0);
				rangeDiv.val(0);
				setRGB(idNum);
			}
		});
		rangeDiv.change(function() {
			textDiv.val(parseFloat(rangeDiv.val()));
			setRGB(idNum);
		});
	}

	function updateRangeAndTextIds(div, color, i, posNeg) {
		var textDiv = div.find(".text" + color);
		var rangeDiv = div.find(".range" + color);
		textDiv.attr("id", "text" + color + (i + posNeg));
		rangeDiv.attr("id", "range" + color + (i + posNeg));
		attachColorHandlers(textDiv, rangeDiv, i + posNeg);
	}

	function updateIdsInRGBSelect(div, i, posNeg) {
		div.attr("id", "rgb-select" + (i + posNeg));
		div.find(".color").attr("id", "color" + (i + posNeg));
		updateRangeAndTextIds(div, "R", i, posNeg);
		updateRangeAndTextIds(div, "G", i, posNeg);
		updateRangeAndTextIds(div, "B", i, posNeg);
		div.find(".add-delete-color").each(function(index) {
			if (index == 0) {
				$(this).attr("id", "add" + (i + posNeg));
			} else {
				$(this).attr("id", "delete" + (i + posNeg));
			}
		});
		div.find("#add" + (i + posNeg)).each(function() {
			$(this).off("click");
			$(this).click(function() {
				insertColorAfter(i + posNeg);
			});
		});
		div.find("#delete" + (i + posNeg)).each(function() {
			$(this).off("click");
			$(this).click(function() {
				deleteColorAt(i + posNeg);
			});
		});
	}

	function insertColorAfter(idNum) {
		$(".rgb-select").each(function(i) {
			if (i > idNum) {
				updateIdsInRGBSelect($(this), i, 1);
			}
		});
		var newRGBSelect = $("#rgb-select" + idNum).clone();
		updateIdsInRGBSelect(newRGBSelect, idNum, 1);
		$("#rgb-select" + idNum).after(newRGBSelect);
	}

	function deleteColorAt(idNum) {
		$(".rgb-select").each(function(i) {
			if (i == idNum) {
				$(this).remove();
			} else if (i > idNum) {
				updateIdsInRGBSelect($(this), i, -1);
			}
		});
	}

	$("#add0").click(function() {
		insertColorAfter(0);
	});

	attachColorHandlers($("#textR0"), $("#rangeR0"), 0);
	attachColorHandlers($("#textG0"), $("#rangeG0"), 0);
	attachColorHandlers($("#textB0"), $("#rangeB0"), 0);

	view.onFrame = function(event) {
		time += event.delta;
		for (var i = 0; i < circles.length; i++) {
			circles[i].update(time);
			if (activeSettings.threeDMode) {
				if (circles[i].circle.previousSibling) {
					if (circles[i].circle.z > circles[i].circle.previousSibling.z) {
						circles[i].circle.moveAbove(circles[i].circle.previousSibling);
					} else {
						circles[i].circle.moveBelow(circles[i].circle.previousSibling);
					}
				}
			}
		}
	}
});














