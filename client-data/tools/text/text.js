(function () { //Code isolation
	var board = Tools.board;

	var input = document.createElement("input");
	input.id = "textToolInput";
	input.type = "text";
	input.setAttribute("autocomplete", "off");

	var curText = {
		"x": 0,
		"y": 0,
        "size": 36,
		"rawSize":11,
		"oldSize": 0,
		"opacity": 1,
		"color": "#000",
		"id": 0,
		"sentText": "",
		"lastSending": 0
	};

	var active = false;


	function onStart() {
		curText.oldSize = Tools.getSize();
		Tools.setSize(curText.rawSize);
	}

	function onQuit() {
		stopEdit();
		Tools.setSize(curText.oldSize);
	}

	function clickHandler(x, y, evt, isTouchEvent) {
		//if(document.querySelector("#menu").offsetWidth>Tools.menu_width+3) return;
		if (evt.target === input) return;
		if (evt.target.tagName === "text") {
			editOldText(evt.target);
			evt.preventDefault();
			return;
		}
		curText.rawSize = Tools.getSize();
		curText.size = parseInt(curText.rawSize * 1.5 + 12);
		curText.opacity = Tools.getOpacity();
		curText.color = Tools.getColor();
		curText.x = x;
		curText.y = y + curText.size / 2;

		stopEdit();
		startEdit();
		evt.preventDefault();
	}

	function editOldText(elem) {
		curText.id = elem.id;
		var r = elem.getBoundingClientRect();
		var x = (r.left + document.documentElement.scrollLeft) / Tools.scale;
		var y = (r.top + r.height + document.documentElement.scrollTop) / Tools.scale;

		curText.x = x;
		curText.y = y;
		curText.sentText = elem.textContent;
		curText.size = parseInt(elem.getAttribute("font-size"));
		curText.opacity = parseFloat(elem.getAttribute("opacity"));
		curText.color = elem.getAttribute("fill");
		startEdit();
		input.value = elem.textContent;
	}

	function startEdit() {
		active = true;
		if (!input.parentNode) board.appendChild(input);
		input.value = "";
		var left = curText.x - document.documentElement.scrollLeft + 'px';
		var clientW = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
		var x = curText.x * Tools.scale - document.documentElement.scrollLeft;
		if (x + 250 > clientW) {
			x = Math.max(60, clientW - 260);
		}

		input.style.left = x + 'px';
		input.style.top = curText.y * Tools.scale - document.documentElement.scrollTop + 20 + 'px';
		input.focus();
		input.addEventListener("keyup", textChangeHandler);
		input.addEventListener("blur", textChangeHandler);
		input.addEventListener("blur", blur);
	}

	function stopEdit() {
		try { input.blur(); } catch (e) { /* Internet Explorer */ }
		active = false;
		blur();
		curText.id = 0;
		curText.sentText = "";
		input.value = "";
		input.removeEventListener("keyup", textChangeHandler);
	}

	function blur() {
		if (active) return;
		input.style.top = '-1000px';
	}

	function textChangeHandler(evt) {
		if (evt.which === 13) { // enter
			curText.y += 1.3 * curText.size;
			stopEdit();
			startEdit();
		} else if (evt.which === 27) { // escape
			stopEdit();
		}
		if (performance.now() - curText.lastSending > 100) {
			if (curText.sentText !== input.value) {
				//If the user clicked where there was no text, then create a new text field
				if (curText.id === 0) {
					curText.id = Tools.generateUID("t"); //"t" for text
					Tools.drawAndSend({
						'type': 'new',
						'id': curText.id,
						'color': curText.color,
						'size': curText.size,
						'opacity': curText.opacity,
						'x': curText.x,
						'y': curText.y
					})
				}
				Tools.drawAndSend({
					'type': "update",
					'id': curText.id,
					'txt': input.value.slice(0, 280)
				});
				curText.sentText = input.value;
				curText.lastSending = performance.now();
			}
		} else {
			clearTimeout(curText.timeout);
			curText.timeout = setTimeout(textChangeHandler, 500, evt);
		}
	}

	function draw(data, isLocal) {
		Tools.drawingEvent = true;
		switch (data.type) {
			case "new":
				createTextField(data);
				break;
			case "update":
				var textField = document.getElementById(data.id);
				if (textField === null) {
					console.error("Text: Hmmm... I received text that belongs to an unknown text field");
					return false;
				}
				updateText(textField, data.txt);
				break;
			default:
				console.error("Text: Draw instruction with unknown type. ", data);
				break;
		}
	}

	function updateText(textField, text) {
		textField.textContent = text;
	}

	function createTextField(fieldData) {
		var elem = Tools.createSVGElement("text");
		elem.id = fieldData.id;
		elem.setAttribute("x", fieldData.x);
		elem.setAttribute("y", fieldData.y);
		elem.setAttribute("font-size", fieldData.size);
		elem.setAttribute("stroke", fieldData.color);
		elem.setAttribute("fill", fieldData.color);
		elem.setAttribute("opacity", Math.max(0.1, Math.min(1, fieldData.opacity)) || 1);
		if (fieldData.txt) elem.textContent = fieldData.txt;
		Tools.drawingArea.appendChild(elem);
		return elem;
	}

	Tools.add({ //The new tool
		"name": "Text",
		"shortcut": "t",
		"listeners": {
			"press": clickHandler,
		},
		"onstart": onStart,
		"onquit": onQuit,
		"draw": draw,
		"stylesheet": "tools/text/text.css",
		"mouseCursor": "text"
	});

})(); //End of code isolation
