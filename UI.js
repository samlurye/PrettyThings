class Settings {

	constructor(threeDMode, animateOrFollow, elasticity, numCircles, minRadius, maxRadius, minLinFreq, maxLinFreq, minAngVel1, maxAngVel1, 
			minAngVel2, maxAngVel2, axis1, axis2, gradId, axisC, minAngVelC, maxAngVelC) {
		this.threeDMode = threeDMode;
		this.animateOrFollow = animateOrFollow;
		this.elasticity = elasticity;
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
		this.gradId = gradId;
		this.grad = findGradientById(this.gradId);
		this.axisC = axisC;
		this.minAngVelC = minAngVelC;
		this.maxAngVelC = maxAngVelC;
	}

	static createNew() {
		return new Settings(
			(function() {
				var enabled = $("#animateOrFollowLi .selected").attr("id") == "animate"; 
				if ($("#threeDModeLi .selected").attr("id") == "on" && enabled) {
					return true;
				} else {
					setSelected("threeDModeLi", "off");
					return false;
				}
			})(),
			$("#animateOrFollowLi .selected").attr("id"),
			parseFloat($("#elasticity").val()) || 30,
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
			$("#gradLi .selected").attr("id"),
			new Quaternion(
				new Vector3(
					parseFloat($("#axisCX").val()) || 0, 
					parseFloat($("#axisCY").val()) || 0, 
					parseFloat($("#axisCZ").val()) || 1
				), 
				0
			),
			parseFloat($("#minAngVelC").val()) || 0,
			parseFloat($("#maxAngVelC").val()) || 0
		);
	}

	load() {
		$("#threeDMode .selected").removeClass("selected");
		if (this.threeDMode) {
			$("#on").addClass("selected");
		} else {
			$("#off").addClass("selected");
		}
		$("#animateOrFollowLi .selected").removeClass("selected");
		$("#" + this.animateOrFollow).addClass("selected");
		$("#elasticity").val(this.elasticity);
		$("#gradLi .selected").removeClass("selected");
		selectGradient(this.gradId);
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
	}

}

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

function attachApplyAllHandler(makeCircles) {
	$("#applyAll").click(function() {
		var settings = Settings.createNew();
		makeCircles(settings);
		settings.load();
	});
}

function attachAnimateOrFollowHandlers() {
	$("#animate").click(function() {
		setSelected("animateOrFollowLi", "animate");
	});
	$("#follow").click(function() {
		setSelected("animateOrFollowLi", "follow");
	});
}

function attachOnOffHandlers() {
	$("#on").click(function() {
		setSelected("threeDModeLi", "on");
	});
	$("#off").click(function() {
		setSelected("threeDModeLi", "off");
	});
}

function attachGradientHandler(id) {
	$("#" + id).click(function() {
		selectGradient(id);
	});
}

function attachGradientHandlers() {
	var gradientIds = []
	for (var id in gradientById) {
		attachGradientHandler(id);
	}
	attachGradientHandler("custom");
}

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

function attachColor0Handlers() {
	$("#add0").click(function() {
		insertColorAfter(0);
	});

	attachColorHandlers($("#textR0"), $("#rangeR0"), 0);
	attachColorHandlers($("#textG0"), $("#rangeG0"), 0);
	attachColorHandlers($("#textB0"), $("#rangeB0"), 0);
}








