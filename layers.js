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

class VectorOps {

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
		return VectorOps.arrayToVector(v.array.map(c => c * k));
	}

	static componentWiseOperation(v1, v2, f) {
		if (v1.dim != v2.dim) {
			throw "Unequal Dimensions";
		}
		return VectorOps.arrayToVector(map2(v1.array, v2.array, f));
	}

	static add(v1, v2) {
		return VectorOps.componentWiseOperation(v1, v2, (x, y) => x + y);
	}

	static subtract(v1, v2) {
		return VectorOps.componentWiseOperation(v1, v2, (x, y) => x - y);
	}

	static product(v1, v2) {
		return VectorOps.componentWiseOperation(v1, v2, (x, y) => x * y);
	}

	static dot(v1, v2) {
		return v2.array.reduce((sum, c, i) => sum += c * v1.array[i], 0);
	}
	
	static rotate(v, angle) {
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
		return VectorOps.arrayToVector(args);
	}

  	static mag(v) {
		return Math.sqrt(v.array.reduce((sum, c) => sum += c * c, 0));
	}

	static dist(v1, v2) {
		return VectorOps.mag(VectorOps.add(v1, v2));
	}

	static normalize(v) {
		return VectorOps.scale(v, 1 / VectorOps.mag(v));
	}

}

class LinearInterpolator {

	constructor(vstart, vend) {
		this.start = vstart;
		this.end = vend;
		this.delta = VectorOps.subtract(this.end, this.start);
	}

	interpolate(pct) {
		return VectorOps.add(this.start, VectorOps.scale(this.delta, pct));
	}

}

paper.install(window);

$(document).ready(function() {
	paper.setup('canvas');

	console.log(VectorOps.dot(new Vector2(0, 1), new Vector2(1, 0)));

	var origin = new Vector2(view.size.width / 2, view.size.height / 2);
	var numCircles = 100;
	var maxLinFreq = 0.2;
	var maxAngFreq = 0.03;
	var minRadius = 25;
	var maxRadius = 100;
	var startColor = new Vector3(252, 17, 225);
	var endColor = new Vector3(21, 4, 150);
	var li = new LinearInterpolator(startColor, endColor);

	class MovingCircle {

		constructor(circle, linFreq, angFreq) {
			this.circle = circle;
			this.linFreq = linFreq;
			this.angFreq = angFreq;
			this.axis = new Vector2(1, 0);
		}

		update(event) {
			this.axis = VectorOps.rotate(this.axis, this.angFreq);
			var posRelToOrigin = VectorOps.scale(this.axis, view.size.height / 2 * Math.sin(event.time * this.linFreq));
			var viewPos = VectorOps.add(origin, posRelToOrigin);
			this.circle.radius = 50 * Math.abs(VectorOps.dot(this.axis, new Vector2(1, 0)) + VectorOps.dot(this.axis, new Vector2(0, 1)));
			this.circle.position.x = viewPos.x;
			this.circle.position.y = viewPos.y;
		}

	}

	var circles = [];

	for (var i = 0; i < numCircles; i++) {
		var circle = new Shape.Circle(view.center, minRadius + i / numCircles * (maxRadius - minRadius));
		var color = li.interpolate(i / numCircles);
		circle.fillColor = "rgb(" + color.x + ", " + color.y + ", " + color.z + ")";
		circle.sendToBack();
		var movingCircle = new MovingCircle(circle, i / numCircles * maxLinFreq, i / numCircles * maxAngFreq);
		circles.push(movingCircle);
	}

	view.onFrame = function(event) {
		for (var i = 0; i < circles.length; i++) {
			circles[i].update(event);
		} 
	}
});














