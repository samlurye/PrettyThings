paper.install(window);

$(document).ready(function() {

	paper.setup('canvas');

	var defaultSettings = new Settings(
		false,
		"follow",
		30,
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
		"rainbow",
		new Quaternion(new Vector3(0, 0, 1), 0),
		0,
		0,
	);

	var activeSettings = defaultSettings;
	activeSettings.load();

	var origin = new Vector3(view.size.width / 2, view.size.height / 2, 0);

	var mousePos = new Vector2(origin.x, origin.y);

	var userInTab = true;
	$(window).focus(function() {
		userInTab = true;
	})
	.blur(function() {
		userInTab = false;
	});

	class MovingCircle {

		constructor(circle, threeDMode, animateOrFollow, linFreq, angVel1, angVel2, axis1, axis2, axis3, color, colorAxis, angVelC, isHead, elasticity) {
			this.circle = circle;
			this.threeDMode = threeDMode;
			this.animateOrFollow = animateOrFollow;
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
			this.isHead = isHead;
			this.leadingPos = new Vector2(origin.x, origin.y);
			this.elasticity = elasticity;
		}

		update(time, deltaTime) {
			if (this.animateOrFollow == "animate") {
				if (this.threeDMode) {
					this.axis1.axis = this.axis2.rotate(this.axis1.axis, this.angVel2);
					this.axis3.axis = this.axis2.rotate(this.axis3.axis, this.angVel2);
				}
				this.axis3.axis = this.axis1.rotate(this.axis3.axis, this.angVel1);
				var posRelToOrigin = Vector.scale(this.axis3.axis, view.size.height / 2 * Math.sin(time * this.linFreq));
				var viewPos = Vector.add(origin, posRelToOrigin);
				var scaleFactor = 1;
				if (this.threeDMode) {
					scaleFactor = 1 / (1 + Math.exp(-4 * posRelToOrigin.z / view.size.height));
				}
				this.circle.radius = this.initialRadius * scaleFactor;
				this.circle.position.x = viewPos.x;
				this.circle.position.y = viewPos.y;
				this.circle.z = viewPos.z;
			} else if (this.animateOrFollow == "follow" && userInTab) {
				if (this.isHead) {
					this.leadingPos = mousePos;
				}
				var circlePos = new Vector2(this.circle.position.x, this.circle.position.y);
				var leadingForce = Vector.subtract(this.leadingPos, circlePos);
				var force = Vector.scale(leadingForce, this.elasticity);
				this.circle.position.x = this.circle.position.x + force.x * deltaTime;
				this.circle.position.y = this.circle.position.y + force.y * deltaTime;
			}
			this.color = this.colorAxis.rotate(this.color, this.angVelC);
			var color = new Vector3(this.color.x, this.color.y, this.color.z);
			color.array = color.array.map(function(c) {
				if (c > 255) {
					c = 255 - (c - 255);
				} else if (c < 0) {
					c = -c;
				}
				return c;
			});
			this.circle.fillColor = "rgb(" + color.array[0] + ", " + color.array[1] + ", " + color.array[2] + ")";
			this.circle.fillColor.alpha = scaleFactor || 1;
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
			var movingCircle = new MovingCircle(circle, settings.threeDMode, settings.animateOrFollow, linFreq, angVel1, angVel2, 
								axis1, axis2, axis3, color, axisC, angVelC, i == 0, settings.elasticity);
			circles.push(movingCircle);
		}
	}

	makeCircles(activeSettings);

	attachApplyAllHandler(makeCircles);

	attachAnimateOrFollowHandlers();

	attachOnOffHandlers();

	attachGradientHandlers();

	attachColor0Handlers();

	attachSaveGradientHandlers();

	var mouseOverSettingsBar = false;

	$(".settings-bar").mouseenter(function() {
		mouseOverSettingsBar = true;
		mousePos = new Vector2(origin.x, origin.y);
	})
	.mouseleave(function() {
		mouseOverSettingsBar = false;
	});

	view.onMouseMove = function(event) {
		if (!mouseOverSettingsBar && $(".save-gradient-menu").css("display") == "none") {
			mousePos = new Vector2(event.point.x, event.point.y);
		} else {
			mousePos = new Vector2(origin.x, origin.y);
		}
	}

	view.onFrame = function(event) {
		time += event.delta;
		for (var i = 0; i < circles.length; i++) {
			circles[i].update(time, event.delta);
			if (circles[i].animateOrFollow == "follow" && i < circles.length - 1) {
				circles[i + 1].leadingPos = new Vector2(circles[i].circle.position.x, circles[i].circle.position.y);
			}
			if (circles[i].threeDMode) {
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














