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