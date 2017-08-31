// map a function over two arrays of equal length
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

// 2D vector object
function Vector2(x, y) {
	this.x = x;
	this.y = y;
	this.array = [x, y];
	this.dim = 2;
	this.print = function() { console.log(this.array) };
}

// 3D vector object
function Vector3(x, y, z) {
	Vector2.call(this, x, y);
	this.z = z;
	this.array.push(this.z);
	this.dim = 3;
}

// 4D vector object
function Vector4(x, y, z, w) {
	Vector3.call(this, x, y, z);
	this.w = w;
	this.array.push(this.w);
	this.dim = 4;
}

// 3x3 matrix object
function Matrix3x3(v1, v2, v3) {
	this.rows = [v1, v2, v3];
	this.columns = Array(3).fill(0).map(function(c, i) {
		return new Vector3(v1.array[i], v2.array[i], v3.array[i]);
	});
}

// a container class for a bunch of static vector methods
class Vector {

	// given an array of numbers, return a vector with those components
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

	// scale a vector v by k
	static scale(v, k) {
		return Vector.arrayToVector(v.array.map(c => c * k));
	}

	// operate on two vectors component by component, returning 1 vector
	static componentWiseOperation(v1, v2, f) {
		if (v1.dim != v2.dim) {
			throw "Unequal Dimensions";
		}
		return Vector.arrayToVector(map2(v1.array, v2.array, f));
	}

	// add two vectors
	static add(v1, v2) {
		return Vector.componentWiseOperation(v1, v2, (x, y) => x + y);
	}

	// subtract two vectors
	static subtract(v1, v2) {
		return Vector.componentWiseOperation(v1, v2, (x, y) => x - y);
	}

	// multiply two vectors by components
	static product(v1, v2) {
		return Vector.componentWiseOperation(v1, v2, (x, y) => x * y);
	}

	// dot product of two vectors
	static dot(v1, v2) {
		return v2.array.reduce((sum, c, i) => sum += c * v1.array[i], 0);
	}

	// cross product of two vectors
	static cross(v1, v2) {
		return new Vector3(
			v1.y * v2.z - v1.z * v2.y,
			v1.z * v2.x - v1.x * v2.z,
			v1.x * v2.y - v1.y * v2.x
		)
	}

	// multiply a matrix by a vector
	static matrixMultVector(m, v) {
		return Vector.arrayToVector(m.rows.map(function(v_m) {
			return Vector.dot(v_m, v);
		}));
	}

	// multiply a matrix by a matrix
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

	// get the cosine of the angle in between two vectors
	static cosAngle(v1, v2) {
		return Vector.dot(v1, v2) / (Vector.mag(v1) * Vector.mag(v2));
	}
	
	// rotate a 2D vector by an angle
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

	// magnitude of a vector
  	static mag(v) {
		return Math.sqrt(v.array.reduce((sum, c) => sum += c * c, 0));
	}

	// distance between two vectors
	static dist(v1, v2) {
		return Vector.mag(Vector.subtract(v1, v2));
	}

	// vector parallel to v with magnitude 1
	static normalize(v) {
		return Vector.scale(v, 1 / Vector.mag(v));
	}

	// return a 3D vector orthogonal to v with components m and n 
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