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
		return Vector.mag(Vector.subtract(v1, v2));
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