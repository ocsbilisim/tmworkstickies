(function() {
	var disabled = false;
	var loadUrl = 'load';
  var saveurl = "save";
  var deleteurl = "del";
  var tagurl = "tag";
	var url = '';
	var defaultStyle = 0;
	var styles = [
			'yellow',
			'green',
			'blue',
			'red',
			'purple',
			'grey'
	];
	var colors =  [
			'#FEF49C', // YELLOW
			'#B2FFA1', // GREEN
			'#ADF4FF', // BLUE
			'#FFC7C7', // RED
			'#B6CAFF', // PURPLE
			'#EEEEEE'
	]; // GREY
	var defaultColor = '#FEF49C';
	var defaultWidth = 200;
	var defaultHeight = 200;
	var defaultX = 200;
	var defaultY = 200;
	var minHeight = 52;
	var minWidth = 40;
	var startingZIndex = 2000;
	var tmpId = 1;
	var dontSelect = false;
	var richText;
	
	///////////  BASE  /////////////
	var isIE;
	var isIE5;
	var isKonqueror;
	var isSafari;
	var isMozilla;
	var isWindows;
	var isMac;
	var isOpera;
	
	(function(){
	  var agent = navigator.userAgent.toLowerCase();
		isIE = agent.indexOf("msie")!=-1;
		isIE5 = agent.indexOf("msie 5")!=-1&&document.all;
		isKonqueror = agent.indexOf("konqueror")!=-1;
		isSafari = agent.indexOf("safari") != -1 || isKonqueror;
		isMozilla = !isIE && !isSafari && agent.indexOf("mozilla") != -1;
		isWindows = agent.indexOf("win") != -1;
		isMac = agent.indexOf("mac") != -1;
		isOpera = !(!window.opera)
	})();
	
	var bind = function(object, method) {
		return function() {
			method.apply(object, arguments);
		};
	};
	
	var getById = document.getElementById ?
		function(elem) { return document.getElementById(elem); } :
		function(elem) { return document.all[elem]; };
	
	function $(elem) {
		if (typeof elem == "string")
			return getById(elem);
		return elem;
	}
	
	////////////  EVENT  ///////////////
	var addEvent;
	var removeEvent;
	var getEvent;
	
	(function() {
		var curId = 0;
		var delayedListeners = [];
		var listeners = {};
		var windowLoaded = false;
		
		function getObjId(object) {
			if (!object.__eventId)
				object.__eventId = ++curId;
			return object.__eventId;
		}
		
		function getEventId(element, event, listener) {
			var listener = listener.length == 2 ? getObjId(listener[0]) + '_' + getObjId(listener[1]) : getObjId(listener);
			return getObjId(element) + "_" + event + "_" + listener;
		}
		
		function addListener(element, event, listener) {
			if (typeof element == 'string' && !windowLoaded) {
				delayedListeners.push(arguments);
				return true;
			}
			
			element = $(element);
			if (!element)
				return false;
			
			var obj = listener.length == 2 ? listener[0] : element;
			var func = listener.length == 2 ? listener[1] : listener;
			if (typeof func != "function")
				alert(func + " is a " + (typeof func) + ", not a function in " + element + ", " + event + ", " + listener);
			
			var proxy = bind(obj, func);
			listeners[getEventId(element, event, listener)] = {listener: listener, proxy: proxy};
			
			if (element.addEventListener)
				element.addEventListener(event, proxy, false);
			else if (element.attachEvent)
				element.attachEvent('on' + event, proxy);
			
			return true;
		}
		
		function removeListener(element, event, listener) {
			element = $(element);
			var eventId = getEventId(element, event, listener);
			if (!(eventId in listeners))
				return false
			
			var proxy = listeners[eventId].proxy;
			delete listeners[eventId];
			
			if (element.removeEventListener)
				element.removeEventListener(event, proxy, false);
			else if (element.detachEvent)
				element.detachEvent('on' + event, proxy);
			return true;
		}
		
		addEvent = function(element, event, listener) {
			if (element.length && element.splice) {
				var args = Array.prototype.splice.call(arguments, 0, arguments.length);
				for (var i = 0; i < element.length; i++) {
					args[0] = element[i];
					addListener.apply(this, args);
				}
			} else
				addListener.apply(this, arguments);
		};
		
		removeEvent = function(element, event, listener) {
			if (element.length && element.splice) {
				for (var i = 0; i < element.length; i++)
					removeListener(element, event, listener);
			} else
				removeListener(element, event, listener);
		};
		
		function stop() {
			this.stopPropagation();
			this.preventDefault();
		}
		
		function find(nodeName, useRelatedTarget) {
			nodeName = nodeName.toUpperCase();
			var node = useRelatedTarget ? this.relatedTarget : this.target;
			while (node.nodeName != nodeName && node.parentNode)
				node = node.parentNode;
			if (node.nodeName == nodeName)
				return node;
		}
		
		getEvent = function(event, property) {
			if (!event || event.isSetup)
				return event;
			
			if (isIE) {
				event = window.event;
				event.stopPropagation = new Function("this.cancelBubble = true");
				event.preventDefault = new Function("this.returnValue = false");
				event.target = event.srcElement;
				if ("fromElement" in event)
					event.relatedTarget = event.fromElement;
				else if ("toElement" in event)
					event.relatedTarget =  event.toElement;
				if (!("layerX" in event) && "offsetX" in event) {
					event.layerX = event.offsetX;
					event.layerY = event.offsetY;
				}
			} else {
				if (event.target.nodeType == 3) event.target = event.target.parentNode;
			}
			
			if ("button" in event)
				event.mouseButton = event.button != 2 ? 1 : 2;
			
			if (!("pageX" in event) && "clientX" in event) {
				event.pageX = event.clientX + (document.documentElement.scrollLeft || document.body.scrollLeft);
				event.pageY = event.clientY + (document.documentElement.scrollTop || document.body.scrollTop);
			}
			event.stop = stop;
			event.find = find;
			event.isSetup = true;
			return event;
		};
		
		function onWindowUnload() {
			if (!listeners) return;
			for (var i = 0; i < listeners.length; i++) {
				var element = listeners[i][0];
				var event = listeners[i][1];
				var proxy = listeners[i][4];
				try { // if the element no longer exists, don't throw an error
					if (element.removeEventListener)
						element.removeEventListener(event, proxy, false);
					else if (element.detachEvent)
						element.detachEvent('on' + event, proxy);
				} catch(e) {}
				delete listeners[i];
			}
			delete listeners;
		}
		
		function onWindowLoad() {
			windowLoaded = true;
			for (var i = 0; i < delayedListeners.length; i++) {
				addListener.apply(this, delayedListeners[i]);
			}
		}
		
		addEvent(window, 'unload', onWindowUnload);
		addEvent(window, 'load', onWindowLoad);
	})();
	
	var Class = {
		create: function() {
			return function() {
				this.init.apply(this, arguments);
			};
		},
		
		is: function(destination, source, noInit) {
			for (property in source)
				destination[property] = source[property];
			if (!noInit && source.init)
				destination.init();
			return destination;
		},
		
		extend: function(superClass, prototype) {
			var proto = new superClass('noElement');
			for (var property in prototype)
				proto[property] = prototype[property];
			return proto;
		},
		
		createForDOM: function(text, parentName) {
			var classFunction = function(forExtension) {
				var elem = classFunction['node'].cloneNode(true);
				for (var prop in this)
					elem[prop] = this[prop];
				
				if (!elem.all)
					elem.all = elem.getElementsByTagName('*');
				
				for (var i = 0; i < elem.all.length; i++) {
					if ((prop = elem.all[i].id) || (prop = elem.all[i].className)) {
						var name = prop.replace(/^\w+_/, '');
						elem[name] = elem.all[i];
					}
					if (parentName)
						elem.all[i][parentName] = elem;
				}
				if (this.init) elem.init.apply(elem, arguments);
				return elem;
			};
			
			classFunction['node'] = HTML.textToNode(text);
			
			return classFunction;
		}
	};
	
	var HTML = {
		textToNode: function(text) {
			text = text.replace(/\n/g, '').replace(/\t/g, '');
			var container = document.createElement('div');
			container.innerHTML = text;
			return container.firstChild;
		}
	};
	
	function load() {
		if (disabled) return;
		// the stack has loaded after page loaded
		// Stack.loadNotes();
		addEvent(document, 'mousedown', startDrawNote);
		addEvent(document, 'selectstart', cancelSelection);
	}
	
	function cancelSelection(event) {
		event = getEvent(event);
		if (event.altKey) {
			event.stop();
			return false;
		}
		if (dontSelect) {
			dontSelect = false;
			event.stop();
			return false;
		}
	}
	
	function stopAltPress() {
		addEvent(document, 'keyup', stopAlt);
	}
	
	function stopAlt(event) {
		event = getEvent(event);
		event.stop();
		removeEvent(document, 'keyup', stopAlt);
	}
	
	function startDrawNote(event) {
		event = getEvent(event);
		if (!event.altKey) return;
		stopAltPress();
		
		var str = '';
		if (window.getSelection) str += window.getSelection();
		else if(document.selection && document.selection.createRange) {
			var range = document.selection.createRange();
			str += range.text;
		}
		
		event.preventDefault();
		drawBox = new DrawBox(event.pageX, event.pageY);
		drawBox.str = str;
		document.body.appendChild(drawBox);
		addEvent(document, 'mousemove', drawNote);
		addEvent(document, 'mouseup', endDrawNote);
		return false;
	}
	
	function drawNote(event) {
		event = getEvent(event);
		drawBox.mousePos(event.pageX, event.pageY);
	}
	
	function endDrawNote(event) {
		event = getEvent(event);
		if (drawBox)
			document.body.removeChild(drawBox);
		var st = drawBox.style;
		addNote(parseInt(st.left), parseInt(st.top), parseInt(st.width), parseInt(st.height), drawBox.str);
		removeEvent(document, 'mousemove', drawNote);
		removeEvent(document, 'mouseup', endDrawNote);
	}
	
	function addNote(x, y, width, height, content) {
		if (disabled) return;
		var note = new Note(x, y, width, height, content);
		Stack.add(note, true);
		note.save();
	}
	
	function enable() {
		if(!disabled) return;
		Stack.loadNotes();
		addEvent(document, 'mousedown', startDrawNote);
	}
	
	function disable() {
		Stack.clearNotes();
		disabled = true;
		removeEvent(document, 'mousedown', startDrawNote);
	}
	
	function savePage() {
		Stack.saveNotes();
	}
	
	
	////// OBJECTS //////////
	
	var DrawBox = Class.createForDOM('\
	<div style="position:absolute;border:1px solid #316AC5;z-index:2000001000">\
		<div style="background: #316AC5;opacity: 0.28;filter: Alpha(Opacity=28);width: 100%;height: 100%;"></div>\
	</div>', 'box');
	
	DrawBox.prototype = {
		startX: 0,
		startY: 0,
		
		init: function(startX, startY) {
			this.startX = startX;
			this.startY = startY;
			this.move(startX, startY);
			this.size(0, 0);
		},
		
		mousePos: function(x, y) {
			this.move(Math.min(x, this.startX), Math.min(y, this.startY));
			this.size(Math.abs(x - this.startX), Math.abs(y - this.startY));
		},
		
		size: function(w, h) {
			this.style.width = w + 'px';
			this.style.height = h + 'px';
		},
		
		move: function(x, y) {
			this.style.left = x + 'px';
			this.style.top = y + 'px';
		}
	};
	
	var Stack = {
		deleteStack: new Array(),
		noteStack: new Array(),
	
		updateDepths: function() {
			for(var i = 0; i < this.noteStack.length; i++) {
				this.noteStack[i].setDepth(startingZIndex + i);
			}
		},
	
		add: function(note, newNote) {
			var depth = startingZIndex + this.noteStack.length;
			this.noteStack.push(note);
			note.setDepth(depth);
			if (document.body)
				document.body.appendChild(note);
			else
				addEvent(window, 'load', function() {
					document.body.appendChild(note);
				});
			if (newNote) setTimeout(function() {note.setfocused();}, 10);
		},
	
		remove: function(note) {
			document.body.removeChild(note);
			for(var i = 0; i < this.noteStack.length; i++) {
				if(this.noteStack[i] == note) this.noteStack.splice(i,1);
			}
			this.updateDepths();
		},
	
		clearNotes : function() {
			for(var i = 0; i < this.noteStack.length; i++) {
				if(this.noteStack[i].parentNode) document.body.removeChild(this.noteStack[i]);
			}
			this.noteStack = new Array();
		},
	
		moveToTop : function(note) {
			if (note == this.noteStack[this.noteStack.length - 1]) return;
			for(var i = 0; i < this.noteStack.length; i++) {
				if(this.noteStack[i] == note) {
					this.noteStack.splice(i, 1);
					this.noteStack.push(note);
					this.updateDepths();
					break;
				}
			}
			Loader.save(saveurl + '?z='+note.z+note.getSaveId());
		},
	
		saveNotes:function() {
			for(var i = 0; i < this.noteStack.length; i++) {
				if(this.noteStack[i].url && this.noteStack[i].url.length > 4)
					this.noteStack[i].save();
			}
		},
	
		loadNotes:function() {
			// Loader.load(loadUrl + '?user='+userhash+'&url=' + escape(location.href));
      Loader.load(loadUrl+'?sid='+sid);
		},
	
		loadThese:function(notes) {
			for(var i = 0; i < notes.length; i++) {
				var note = new Note(notes[i]);
				this.add(note);
			}
			this.noteStack.sort(
				function(a, b) {
					if (a.z > b.z) return 1;
					if (a.z < b.z) return -1;
					return 0;
				}
			);
			this.updateDepths();
		}
	};
	
	var Note = Class.createForDOM('\
	<div class="mysky_note" style="position:absolute">\
		<div class="mysky_tagCont" style="position:absolute;top:40px;right:-100px;width:100px;display:none;"></div>\
		<div class="mysky_handle" title="Move Note" style="width:100%">\
			<div class="mysky_username" title="Note Creator"></div>\
			<div class="mysky_closer" title="Delete Note"></div>\
		</div>\
		<textarea class="mysky_edit" style="background:transparent;border:none;padding:2px;margin:0;overflow:auto"></textarea>\
		<div class="mysky_resizer" title="Resize Note" style="background: url(images/corner.gif) no-repeat right bottom;width:20px;height:20px;position:absolute;bottom:-1px;right:-1px"></div>\
		<div class="mysky_tag" style="position:absolute;right:-40px;top:15px;width:40px;height:15px;background:url(images/addtag.gif) no-repeat top left;display:none;"></div>\
	</div>', 'note');
	
	Note.prototype = {
		tmpId: null,
		changed: new Array(),
		
		// args may be passed for a new note
		init: function(x, y, width, height, content) {
			Class.is(this.handle, Note.Handle);
			Class.is(this.closer, Note.Closer);
			Class.is(this.resizer, Note.Resizer);
			Class.is(this.tag, Note.TagIcon);
			Class.is(this.edit, Note.Edit);
			
			if (arguments[0].length) {
				this.loadNote(arguments[0]);
				return;
			}
			
			this.setUrl(location.href);
			this.setTitle(document.title);
			if (!(x && y)) {
				x = document.body.scrollLeft || window.pageXOffset || document.documentElement.scrollLeft;
				y = document.body.scrollTop || window.pageYOffset || document.documentElement.scrollTop;
				x += defaultX;
				y += defaultY;
			}
			this.move(x, y);
			this.setSize(width || defaultWidth, height || defaultHeight);
			this.setColor(defaultColor);
			this.content = content || '';
			this.tmpId = tmpId++;
		},
		
		// theArgs = [0:id, 1:x, 2:y, 3:w, 4:h, 5:z, 6:text, 7:color, 8:user, 9:tags]
		loadNote: function(theArgs) {
			var args;
			if (arguments.length > 1) args = arguments;
			else args = theArgs;
			this.id = args[0] || null;
      // we set the tmpId more than the current id
      if (this.id >= tmpId) {
        tmpId = this.id + 1;
      }
			this.setUrl(location.href);
			this.setTitle(document.title);
			this.move(args[1] || 100, args[2] || 100);
			this.setSize(args[3] || 100, args[4] || 100);
			this.setDepth(args[5] || startingZIndex);
			this.setText(unescape(args[6]));
			this.setColor(args[7] || defaultColor);
			this.setUser(args[8]);
			this.setTags(args[9] || new Array());
			
			this.changed = new Array();
		},
	
		save: function() {
			if (!this.changed.length && this.id) return;
			
			var query = '';
			if(this.id || this.saved) {
				query = this.getSaveId();
				for (var i = 0; i < this.changed.length; i++) {
					query += "&" + this.changed[i] + '=' + escape(this[this.changed[i]]);
				}
			} else {
				var params = ["tmpId", "x", "y", "w", "h", "z", "title", "content", "color"];
				var val;
				for(var i = 0; i < params.length; i++) {
					if((val = this[params[i]]) != null)
						query += "&" + params[i] + "=" + escape(val);
				}
			}
			
			Loader.save(saveurl+'?sid='+sid+query);
			this.saved = true;
			this.changed = new Array();
		},
	
	
		getSaveId: function() {
			if (this.id) return '&id=' + this.id;
			return '&tmpId=' + this.tmpId;
		},
	
		deleteNote: function() {
			Stack.remove(this);
			if(this.id != null)
			Stack.deleteStack.push(this.id);
			Loader.save(deleteurl+'?sid='+sid+this.getSaveId());
		},
	
		move: function(x, y) {
			this.x = x;
			this.y = y;
			this.style.left = x + 'px';
			this.style.top =  y + 'px';
			this.setChanged('x,y');
		},
	
		setSize: function(width, height) {
			this.w = Math.max(width, minWidth);
			this.h = Math.max(height, minHeight);
			this.style.width = this.w + 'px';
			this.style.height = this.h + 'px';
			this.edit.setSize(this.w + 4, this.h - 30);
			this.setChanged('w,h');
		},
	
		setColor: function(color) {
			if (color.charAt(0) != '#') color = '#' + color;
			for (var i = 0; i < colors.length; i++) {
				if (color == colors[i]) {
					break;
				}
			}
			this.color = color;
			this.className = "mysky_note mysky_" + styles[i];
			this.setChanged('color');
		},
	
		setDepth: function(depth) {
			this.z = depth;
			this.style.zIndex = depth;
		},
	
		setText: function(text, fromEdit) {
			this.content = text;
			if (!fromEdit) this.edit.setText(text);
			this.setChanged('content');
		},
	
		setTitle: function(title) {
			this.pageTitle = title;
			this.setChanged('title');
		},
	
		setUrl: function(url) {
			this.url = url;
			this.setChanged('url');
		},
		
		setUser: function(user) {
			this.user = user;
			//if (user != username)
		  //		this.username.innerHTML = user;
		},
	
		setTags: function(tags) {
			if (typeof tags == 'string') tags = tags.split(';');
			for (var i = 0; i < tags.length; i++) {
				this.addTag(tags[i]);
			}
		},
	
		addTag: function(tagText) {
			var newTag = new Note.Tag(this, tagText);
			this.tagCont.appendChild(newTag);
			if (!tagText) newTag.tagText.select();
		},
	
		removeTag: function(tag) {
			this.tagCont.removeChild(tag);
			this.updateTags();
		},
		
		updateTags: function() {
			var tags = [];
			var tagElements = this.tagCont.childNodes;
			for (var i = 0; i < tagElements.length; i++) {
				if (tagElements[i].tagText.value)
					tags.push(escape(tagElements[i].tagText.value));
			}
			tags = tags.join(',');
			Loader.save(tagurl+'?'+this.getSaveId()+'&tags='+tags);
		},
	
		setfocused: function() {
			this.focused = true;
			this.tag.style.display = 'block';
			this.tagCont.style.display = 'block';
			//this.email.style.display = 'block';
			this.edit.setfocused();
			addEvent(document, 'mousedown', [this, this.setblurred]);
		},
	
		setblurred: function() {
			this.focused = false;
			this.tag.style.display = 'none';
			this.tagCont.style.display = 'none';
			//this.email.style.display = 'none';
			this.edit.setblurred();
			removeEvent(document, 'mousedown', [this, this.setblurred]);
		},
	
		onmousedown: function(event) {
			event = getEvent(event);
			if (event.altKey) return;
			Stack.moveToTop(this);
			var note = this;
			if (this.focused) event.stopPropagation();
			else setTimeout(function(){note.setfocused();}, 10);
		},
	
		setChanged: function(props) {
			props = props.split(',');
			for (var i = 0; i < props.length; i++) {
				for (var j = 0; j < this.changed.length; j++) {
					if (this.changed[j] == props[i]) {
						var already = true;
						break;
					}
				}
				if (!already) this.changed.push(props[i]);
			}
		}
	};
	
	
	Note.Handle = {
		onmousedown: function(event) {
			event = getEvent(event);
			dontSelect = true;
			event.stopPropagation();
			Stack.moveToTop(this.note);
			var note = this.note;
			var handle = this;
			var diffX = event.pageX - parseInt(note.style.left);
			var diffY = event.pageY - parseInt(note.style.top);
			var noteX = note.x;
			var noteY = note.y;
			note.edit.setblurred();
			
			this.mousemove = function(event) {
				event = getEvent(event);
				if (Math.abs(event.pageX - diffX - noteX) + Math.abs(event.pageY - diffY - noteY) > 4)
					note.move(event.pageX - diffX, event.pageY - diffY);
			};
			this.mouseup = function(event) {
				event = getEvent(event);
				removeEvent(document, 'mousemove', handle.mousemove);
				removeEvent(document, 'mouseup', handle.mouseup);
				handle.mousemove = null;
				handle.mouseup = null;
				note.edit.setfocused();
				if (Math.abs(event.pageX - diffX - noteX) + Math.abs(event.pageY - diffY - noteY) > 4)
					note.save();
			};
			addEvent(document, 'mousemove', this.mousemove);
			addEvent(document, 'mouseup', this.mouseup);
			return false;
		},
		
		onclick: function(event) {
			event = getEvent(event);
			if (event.altKey) {
				addEvent(document, 'keyup', stopAlt);
				var index = 0;
				for (var i = 0; i < colors.length; i++) {
					if (this.note.color == colors[i]) {
						index = i < (colors.length - 1) ? i + 1 : 0;
						break;
					}
				}
				this.note.setColor(colors[index]);
				this.checkAndSave();
			}
		},
		
		checkAndSave: function() {
			var note = this.note;
			if (this.timeout) clearTimeout(this.timeout);
			this.timeout = setTimeout(function() {
				note.handle.timeout = null;
				note.save();
			}, 500);
		}
	};
	
	Note.Edit = {
		init: function() {
			addEvent(this, 'keyup', [this, this.checkAndSave]);
			addEvent(this, 'mouseup', [this, this.checkAndSave]);
		},
		
		setText: function(text) {
			this.value = text;
		},
		
		getText: function() {
			return this.value;
		},
		
		setSize: function(w, h) {
			this.style.width = (w - 4) + 'px';
			this.style.height = (h - 4) + 'px';
		},
		
		setfocused: function() {
			var textarea = this;
			setTimeout(function (){textarea.focus();}, 100);
		},
		
		setblurred: function() {
			this.blur();
		},
		
		checkAndSave: function() {
			var note = this.note;
			if (note.content == this.getText()) return;
			note.setText(this.getText(), true);
			if (this.timeout) clearTimeout(this.timeout);
			this.timeout = setTimeout(function() {
				note.edit.timeout = null;
				note.save();
			}, 500);
		}
	};
	
	Note.Resizer = {
		onmousedown: function(event) {
			event = getEvent(event);
			event.stopPropagation();
			dontSelect = true;
			Stack.moveToTop(this.note);
			var note = this.note;
			var resizer = this;
			var edit = this.note.edit;
			var diffW = event.pageX - parseInt(note.style.width);
			var diffH = event.pageY - parseInt(note.style.height);
			note.edit.setblurred();
			
			this.mousemove = function(event) {
				event = getEvent(event);
				note.setSize(event.pageX - diffW, event.pageY - diffH);
			};
			this.mouseup = function(event) {
				event = getEvent(event);
				note.setSize(event.pageX - diffW, event.pageY - diffH);
				removeEvent(document, 'mousemove', resizer.mousemove);
				removeEvent(document, 'mouseup', resizer.mouseup);
				resizer.mousemove = null;
				resizer.mouseup = null;
				note.save();
			};
			addEvent(document, 'mousemove', this.mousemove);
			addEvent(document, 'mouseup', this.mouseup);
			return false;
		}
	};
	
	Note.Closer = {
		onclick: function() {
			this.note.deleteNote();
		}
	};
	
	Note.TagIcon = {
		onclick: function() {
			this.note.addTag();
		}
	};
	
	
	Note.Tag = Class.createForDOM('\
	<div class="mysky_newTag" style="position:relative;width:85px;font-size:.8em;padding-left:15px;background: url(images/tag.gif) no-repeat -5px">\
		<input type="text" class="mysky_tagText" style="position:relative;width:95px;background:url(images/tag_end.gif) no-repeat right;border:none;padding-bottom:3px;color:#333;font: bold 11px Verdana, Arial, Helvetica, sans-serif;" />\
	</div>', 'tag');
	
	Note.Tag.prototype = {
		init: function(note, content) {
			this.note = note;
			this.text = content || '';
			var tag = this;
			this.tagText.value = this.text;
	
			this.tagText.onmouseup = function() {
				this.select();
			};
			this.tagText.onkeydown = function(event) {
				event = getEvent(event);
				if (event.which == 13) note.addTag();
				if (event.which == 27) note.removeTag(tag);
			};
			
			this.tagText.onkeyup = function() {
				tag.checkAndSave();
			},
		
			this.tagText.onmouseup = function() {
				tag.checkAndSave();
			},
			
			this.tagText.onblur = function() {
				if (!this.value) {
					note.removeTag(tag);
				}
			};
		},
		
		checkAndSave: function() {
			if (this.timeout) clearTimeout(this.timeout);
			if (this.text == this.tagText.value) return;
			var tag = this;
			var note = this.note;
			this.timeout = setTimeout(function() {
				tag.timeout = null;
				note.updateTags();
				tag.text = tag.tagText.value;
			}, 500);
		},
	
		ondblclick: function() {
			this.note.removeTag(this);
		}
	
	};
	
	var Loader = {
		load: function(url) {
			var script = document.createElement('script');
			script.type = 'text/javascript';
			script.src = url;
			Loader.addToBody(script);
		},
		
		save: function(url) {
			var img = new Image();
			img.src = url;
		},
		
		addToBody: function(node) {
			if (document.body) {
				if (typeof node == 'string')
					node = HTML.textToNode(node);
				document.body.appendChild(node);
			} else {
				if (typeof node != 'string') {
					var div = document.createElement('div');
					div.appendChild(node);
					node = div.innerHTML;
				}
				document.write(node);
			}
		}
	};
	
	
	var utils = {		
		innerText: function(element) {
			if (element.innerText != null)
				return element.innerText;
			var str = ""
			for (var i = 0; i < element.childNodes.length; i++) {
				switch (element.childNodes.item(i).nodeType) {
					case 1: //ELEMENT_NODE
						str += utils.innerText(element.childNodes[i]);
						break;
					case 3: //TEXT_NODE
						str += element.childNodes[i].nodeValue;
						break;
				}
			}
			return str;
		}
	};
	
	// make accessible from the outside
	window.MyStickies = {
		addNote: addNote,
		loadThese: bind(Stack, Stack.loadThese)
	};
	
	load();
})();