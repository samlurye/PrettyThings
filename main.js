// paperjs, the vector graphics library I used
paper.install(window);

$(document).ready(function() {

	paper.setup('canvas');

	// define the default settings
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

	// update the UI with the correct settings
	var activeSettings = defaultSettings;
	activeSettings.load();

	// the center of the screen
	var origin = new Vector3(view.size.width / 2, view.size.height / 2, 0);

	// the current position of the mouse on the screen
	var mousePos = new Vector2(origin.x, origin.y);

	// whether or not the user is in the window
	var userInTab = true;
	$(window).focus(function() {
		userInTab = true;
	})
	.blur(function() {
		userInTab = false;
	});

	// a class for each circle rendered on the screen
	class MovingCircle {

		constructor(circle, threeDMode, animateOrFollow, linFreq, angVel1, angVel2, axis1, axis2, axis3, color, colorAxis, angVelC, isHead, elasticity) {
			// the paperjs object
			this.circle = circle;
			// whether or not 3D mode is active
			this.threeDMode = threeDMode;
			// whether to animate the circles or make them follow the mouse
			this.animateOrFollow = animateOrFollow;
			// original radius of the circle
			this.initialRadius = this.circle.radius;
			// the linear frequency of the circle along axis3
			this.linFreq = linFreq;
			// the angular velocity of the circle with respect to axis1
			this.angVel1 = angVel1;
			// the angular velocity of axis1 with respect to axis2
			this.angVel2 = angVel2;
			// the vector around which axis3 rotates
			this.axis1 = axis1;
			// the vector around which axis1 rotates
			this.axis2 = axis2;
			// the vector along which the circle oscillates
			this.axis3 = axis3;
			// the color of the circle
			this.color = color;
			// the axis around which the circle's color rotates
			this.colorAxis = colorAxis;
			// the angular velocity of the color's rotation
			this.angVelC = angVelC;
			// whether or not this circle is the first in the chain
			this.isHead = isHead;
			// the position that this circle is following
			this.leadingPos = new Vector2(origin.x, origin.y);
			// how quickly this circle approaches its leadingPos
			this.elasticity = elasticity;
		}

		// call update every frame
		update(time, deltaTime) {
			// animate mode
			if (this.animateOrFollow == "animate") {
				// if 3D mode is on, rotate both axis1 and axis3 appropriately
				if (this.threeDMode) {
					this.axis1.axis = this.axis2.rotate(this.axis1.axis, this.angVel2);
					this.axis3.axis = this.axis2.rotate(this.axis3.axis, this.angVel2);
				}
				// rotate axis3 with respect to axis1
				this.axis3.axis = this.axis1.rotate(this.axis3.axis, this.angVel1);
				// the new position of the circle with respect to the origin
				var posRelToOrigin = Vector.scale(this.axis3.axis, view.size.height / 2 * Math.sin(time * this.linFreq));
				// the new position of the circle in paperjs coordinates
				var viewPos = Vector.add(origin, posRelToOrigin);
				// if 3D mode is active, scale factor affects the size and transparency of the circle
				var scaleFactor = 1;
				if (this.threeDMode) {
					scaleFactor = 1 / (1 + Math.exp(-4 * posRelToOrigin.z / view.size.height));
				}
				this.circle.radius = this.initialRadius * scaleFactor;
				this.circle.position.x = viewPos.x;
				this.circle.position.y = viewPos.y;
				// the z position of the circle
				this.circle.z = viewPos.z;
			// mouse follow mode
			} else if (this.animateOrFollow == "follow" && userInTab) {
				// if the circle is the first in the chain, follow the mouse
				if (this.isHead) {
					this.leadingPos = mousePos;
				}
				// apply a force to the circle proportional to the distance from the leadingPos,
				// scaled by the elasticity
				var circlePos = new Vector2(this.circle.position.x, this.circle.position.y);
				var leadingForce = Vector.subtract(this.leadingPos, circlePos);
				var force = Vector.scale(leadingForce, this.elasticity);
				this.circle.position.x = this.circle.position.x + force.x * deltaTime;
				this.circle.position.y = this.circle.position.y + force.y * deltaTime;
			}
			// rotate the color axis
			this.color = this.colorAxis.rotate(this.color, this.angVelC);
			// update the color, accounting for integers > 255 and < 0
			var color = new Vector3(this.color.x, this.color.y, this.color.z);
			color.array = color.array.map(function(c) {
				if (c > 255) {
					c = 255 - (c - 255);
				} else if (c < 0) {
					c = -c;
				}
				return c;
			});
			// set the circle color and transparency
			this.circle.fillColor = "rgb(" + color.array[0] + ", " + color.array[1] + ", " + color.array[2] + ")";
			this.circle.fillColor.alpha = scaleFactor || 1;
		}

	}

	var circles = [];
	// the time since the most recent settings were applied
	var time = 0;

	// given settings, create a list of MovingCircle objects accordingly
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

	// make the default circles
	makeCircles(activeSettings);

	// set up the UI
	attachApplyAllHandler(makeCircles);

	attachAnimateOrFollowHandlers();

	attachOnOffHandlers();

	attachGradientHandlers();

	attachColor0Handlers();

	// if the mouse is over the settings bar in mouse follow mode, return the circles to the origin
	var mouseOverSettingsBar = false;

	$(".settings-bar").mouseenter(function() {
		mouseOverSettingsBar = true;
		mousePos = new Vector2(origin.x, origin.y);
	})
	.mouseleave(function() {
		mouseOverSettingsBar = false;
	});

	// update the mouse position
	view.onMouseMove = function(event) {
		if (!mouseOverSettingsBar) {
			mousePos = new Vector2(event.point.x, event.point.y);
		} else {
			mousePos = new Vector2(origin.x, origin.y);
		}
	}

	// called every frame
	view.onFrame = function(event) {
		time += event.delta;
		// iterate over all the circles on the screen
		for (var i = 0; i < circles.length; i++) {
			console.log(mousePos);
			// update the circle
			circles[i].update(time, event.delta);
			// update the leading position of the circle
			if (circles[i].animateOrFollow == "follow" && i < circles.length - 1) {
				circles[i + 1].leadingPos = new Vector2(circles[i].circle.position.x, circles[i].circle.position.y);
			}
			// if 3D mode is on, update the order in which the circles render on the screen
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














