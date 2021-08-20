// todo: scroll pane

class MagicGuiManager {
   guis = []
   
   constructor(listParams) {
      listParams.forEach( params => this.guis.push(new MagicGUI("", params)) )
   }
   
   onDraw() {
      this.updateValues();
      
      for (let i = this.guis.length-1; i>= 0; i--) {
         this.guis[i].processClick();
         if (this.guis[i].consumesClick()) break;
      }
      
      this.guis.forEach(gui => gui.onDraw())
   }
   
   updateValues() {
      this.guis.forEach(gui => gui.updateValues())
   }
   
   consumesClick() {
      return this.guis.reduce((acc, gui) => gui.consumesClick() || acc, false)
   }
}

class MagicGUI_Pane {
   
   components = []
   params = {}
   bufferY = 10;
   bufferX = 10;
   
   x = 0
   y = 0
   height = 100
   width = 100
   
   forceGUIUpdate = true
   
   collapsed = false
   
   constructor(title, params) {
      this.params = params
      this.title = title
      
      if(this.specialSetup) this.specialSetup();
      
      for (key of Object.keys(params)) { 
         if (key.startsWith("min_") || key.startsWith("max_") || key.startsWith("step_")) continue;
         
         if (key.startsWith("button_")) {
            this.components.push(new MagicGUI_Button(key, params[key]));
         } else if (typeof(params[key]) == "boolean") {
            this.components.push(new MagicGUI_Checkbox(key, params[key]));
         } else if (key.startsWith("display_")) {
            this.components.push(new MagicGUI_Display(key, params[key]));
         } else if (typeof(params[key]) == "number") {
            this.components.push( new MagicGUI_Slider(key, params[key], params["min_"+key], params["max_"+key], params["step_"+key]));
         } else if (typeof(params[key]) == "string") {
            this.components.push( new MagicGUI_Text(key, params[key]) );
         } else if (Array.isArray(params[key])) {
            this.components.push( new MagicGUI_Radio(key, params[key]));
         } else if (typeof(params[key]) == "object") {
            this.components.push( new MagicGUI_CollapsiblePane(key, params[key]));
         } 
      }
      
      this.onUpdatePosition();
      
      if (this.specialBonusSetup) this.specialBonusSetup();
   }
   
   inBounds(x,y) {
      return (this.x <= x && x <= this.width+this.x && this.y <= y && y <= this.y+this.height)
   }
   
   consumesClick() {
      return this.startedClickInBounds;
   }
   
   onUpdatePosition() {
      let y = this.y + this.bufferY;
      let componentsToRender = this.selectComponentsToRender ? this.selectComponentsToRender() : this.components
      
      componentsToRender.forEach(component => { 
         component.x = this.x + this.bufferX;
         component.y = y;
         
         if (component.onUpdatePosition) component.onUpdatePosition()
         
         y += component.height + this.bufferY 
      })
      
      this.height = this.bufferY;
      this.width = 0; 
      componentsToRender.forEach(component => { 
         this.height += component.height + this.bufferY; 
         this.width = Math.max(this.width, component.width)
      } )
      this.width += 2*this.bufferX;
   }
   
   draw() {
      let componentsToRender = this.selectComponentsToRender ? this.selectComponentsToRender() : this.components
      
      if (componentsToRender.reduce((acc, component) => acc || component.forceGUIUpdate, false)) this.updateComponentPositions();
      this.components.forEach(component => component.forceGUIUpdate = false);
      
      
      fill(255);
      //stroke(0);
noStroke()
      
      rect(this.x,this.y,this.width,this.height);
      componentsToRender.forEach(component => component.draw() )
      
   }
   
   updateValues() {
      this.components.forEach(component => {
         if(!component.updateValue) return;
         component.updateValue(this.params[component.paramKey]) 
         
      })
   }
   
   onClick() {
      this.components.forEach(component => {
         if(!component.onClick) return;
         let value = component.onClick(mouseX, mouseY) 
         this.params[component.paramKey] = value;
      })
   }
   
   noClick() {
      this.components.forEach(component => {
         if(!component.noClick) return
         let value = component.noClick(mouseX, mouseY, this.pmouseIsPressed) 
         this.params[component.paramKey] = value;
      })
   }
   
   startClick() {
      this.components.forEach(component => {
         if(!component.startClick) return
         let value = component.startClick(mouseX, mouseY) 
         this.params[component.paramKey] = value;
      })
   }
   
   endClick() {
      this.components.forEach(component => {
         if(!component.endClick) return
         let value = component.endClick(mouseX, mouseY) 
         this.params[component.paramKey] = value;
      })
   }
}

MagicGUIStartX = 0
class MagicGUI extends MagicGUI_Pane {
   
   specialSetup(params) {
      this.x = MagicGUIStartX
      
      this.dragButton = new MagicGUI_Button("gui_dragButtonEvent", 0);
      this.dragButton.text = "=";
      this.dragButton.height = 20;
      this.dragButton.fillColor = color(255);
      this.dragButton.pressedFillColor = color(250);
      this.dragButton.onClick = () => {}; // make this button only release when the click releases, not when the click moves out of bounds
      this.dragButton.textColor = color(0);
      this.dragButton.borderColor = color(255);
      this.components.push(this.dragButton);
      
      this.y = windowHeight - this.dragButton.height - 1.5*this.bufferY;
      
   }
   
   specialBonusSetup() {
      this.dragButton.width = this.width - 2*this.bufferX;
      
      this.updateComponentPositions();
      
      MagicGUIStartX += this.width;
   }
   
   
   updateComponentPositions() {
      this.onUpdatePosition()
   }
   
   processClick() {
      if (mouseIsPressed && !this.pmouseIsPressed) {
         this.startClick();
         this.startedClickInBounds = this.inBounds(mouseX, mouseY);
      } else if (!mouseIsPressed && this.pmouseIsPressed) {
         this.endClick();
         this.startedClickInBounds = false;
      }
      
      if (mouseIsPressed) {
         this.onClick()
      } else {
         this.noClick()
      }
      
      
      this.pmouseIsPressed = mouseIsPressed
      
      
      if (this.dragButton.clicking) {
         this.x += mouseX - pmouseX;
         this.y += mouseY - pmouseY;
         this.updateComponentPositions();
      }
   }
   
   onDraw() {
      
      //if (this.components.reduce((acc, component) => acc || component.forceGUIUpdate, false)) this.updateComponentPositions();
      //this.components.forEach(component => component.forceGUIUpdate = false);
      
      this.draw()
      
   }
}

class MagicGUI_CollapsiblePane extends MagicGUI_Pane {
   collapsed = true
   
   specialSetup() {
      this.collapseButton = new MagicGUI_Button("gui_collapseButtonEvent", 0);
      this.collapseButton.text = "v " + this.title;
      this.collapseButton.height = 20;
      this.collapseButton.fillColor = color(255);
      this.collapseButton.pressedFillColor = color(250);
      //this.collapseButton.endClick = () => {};
      this.collapseButton.textColor = color(0);
      this.collapseButton.borderColor = color(255);
      this.components.push(this.collapseButton);
   }
   
   specialBonusSetup() {
      this.collapseButton.width = this.width - 2*this.bufferX;
      
      this.onUpdatePosition();
   }
   
   selectComponentsToRender() {
      return this.collapsed ? [this.collapseButton] : this.components
   }
   
   endClick() {
      if(this.inBounds(mouseX, mouseY)) super.endClick()
      
      if (this.params["gui_collapseButtonEvent"]) {
         this.forceGUIUpdate = true
         this.collapsed = !this.collapsed
         this.collapseButton.text = (this.collapsed ? "> " : "v ") + this.title
      }
   }
   
   onClick() {
      if(this.inBounds(mouseX, mouseY)) super.onClick()
   }
   
   noClick() {
      if(this.inBounds(mouseX, mouseY)) super.noClick()
   }
   
   startClick() {
      if(this.inBounds(mouseX, mouseY)) super.startClick()
   }
}

class MagicGUI_Button {
   text = ""
   width = 100
   height = 40
   fillColor = color(20, 70, 150)
   pressedFillColor = color(10, 35, 75)
   borderColor = color(0);
   
   x = 0
   y = 0
   scale = 1
   clicking = false
   
   textSize = 8;
   textColor = color(255);
   
   constructor(k, v) {
      this.text = k.substring(7);
      this.paramKey = k;
      this.paramValue = v;
   }
   
   draw() {
      //push()
      
      fill(this.clicking ? this.pressedFillColor : this.fillColor);
      stroke(this.borderColor);
      rect(this.x, this.y, this.scale*this.width, this.scale*this.height);
      
      fill(this.textColor);
      //stroke(this.textColor);
      noStroke();
      //textSize(this.textSize * this.scale);
      //textAlign(CENTER, CENTER);
      drawText(this.text, this.x, this.y + this.scale*this.height/2, this.scale*this.textSize);
      //pop()
   }
   
   inBounds(x, y) {
      return this.x <= x && this.y <= y && this.x+this.scale*this.width >= x &&  this.y+this.scale*this.height >= y
   }
   
   startClick(x, y) {
      if (this.inBounds(x, y)) {
         this.clicking = true
      }
      return false
   }
   
   onClick(x, y) {
      if (!this.inBounds(x, y)) {
         this.clicking = false
      }
      return false
   }
   
   endClick(x, y) {
      if (this.inBounds(x, y) && this.clicking) {
         this.clicking = false
         this.justClicked = true
         return true
      }
      
      this.clicking = false
      return false
   }
   
   noClick(x, y) {
      if (this.justClicked) {
         this.justClicked = false
         return true
      }
      this.justClicked = false
      return false;
   }
}

class MagicGUI_Checkbox extends MagicGUI_Button {
   checkBuffer = 10
   checkedColor = color(20, 70, 150)
   checked = false
   boxWidth = 20
   style = "square"
   
   constructor(k, v, style = "square") {
      super(k, v);
      this.text = k;
      this.checked = v;
      this.style = style
      
      //this.width = 40
      this.height = 20
      this.fillColor = color(150)
      this.pressedFillColor = color(100)
      this.textColor = color(0);
      this.textSize = 8;
   }
   
   draw() {
      //push()
      
      fill(this.clicking ? this.pressedFillColor : this.fillColor);
      
      if (this.style === "square") {
         rect(this.x, this.y, this.scale*this.boxWidth, this.scale*this.height);
      } else if (this.style === "circle") {
         circle(this.x+this.boxWidth/2, this.y+this.boxWidth/2, this.boxWidth)
      }
      
      if (this.checked) {
         fill(this.checkedColor);
         stroke(this.checkedColor);
         if (this.style === "square") {
            rect(this.x+this.scale*this.checkBuffer/2, this.y+this.scale*this.checkBuffer/2, this.scale*this.boxWidth-this.scale*this.checkBuffer, this.scale*this.height-this.scale*this.checkBuffer);
         } else if (this.style === "circle") {
            circle(this.x+this.boxWidth/2, this.y+this.boxWidth/2, this.boxWidth-this.checkBuffer)
         }
      }
      
      fill(this.textColor);
      //stroke(this.textColor);
      //noStroke();
      //textSize(this.textSize * this.scale);
      //textAlign(LEFT, CENTER);
      drawText(this.text, this.x+this.scale*this.boxWidth, this.y + this.scale*this.height/2, this.scale*this.textSize);
      
      //pop()
   }
   
   startClick(x, y) {
      super.startClick(x,y) 
      return this.checked
   }
   
   onClick(x, y) {
      super.onClick(x,y) 
      return this.checked
   }
   
   endClick(x, y) {
      if (super.endClick(x,y)) {
         this.checked = !this.checked;
      }
      return this.checked
   }
   
   noClick(x, y) {
      super.noClick(x,y);
      return this.checked
   }
   
   updateValue(v) {
      this.checked = v;
   }
}

class MagicGUI_Slider {
   text = ""
   width = 100
   height = 20
   barHeight = 10;
   barWidth = 80;
   percentageValue = 0;
   
   valueMin = 0;
   valueMax = 1;
   valueStep = 0;
   
   barFillColor = color(100);
   fillColor = color(20, 70, 150)
   pressedFillColor = color(10, 35, 75)
   borderColor = color(0)
   textColor = color(255)
   textOverlayColor = color(255,255,255,100);
   textSize = 8;
   x = 0
   y = 0
   scale = 1
   clicking = false
   
   constructor(k, v, min, max, step) {
      this.paramKey = k;
      this.paramValue = v;
      
      textSize(this.textSize * this.scale);
      this.barWidth = 10+Math.max(80, textWidth(this.paramKey + ": 0.00"))
      this.width = this.barWidth+20
      
      this.valueMin = min || 0;
      this.valueMax = max || 1;
      this.valueStep = step;
      this.percentageValue = (v-this.valueMin)/(this.valueMax-this.valueMin);
      this.text = k;
   }
   
   updateValue(v) {
      this.percentageValue = (v-this.valueMin)/(this.valueMax-this.valueMin);
   }
   
   draw() {
      //push()
noStroke()
      let barX = this.x+this.scale*this.width/2-this.scale*this.barWidth/2
      fill(this.barFillColor)
      //stroke(this.borderColor);
      rect(barX, this.y+this.scale*this.height/2-this.scale*this.barHeight/2, this.scale*this.barWidth, this.scale*this.barHeight);
      
      
      fill(this.textColor);
      //stroke(this.textColor);
      //noStroke();
      //textSize(this.textSize * this.scale);
      //textAlign(CENTER, CENTER);
      drawText(this.text + ": " + this.getValue(), this.x, this.y + this.scale*this.height/2, this.scale*this.textSize);
      
      
      fill(this.clicking ? this.pressedFillColor : this.fillColor);
      //stroke(this.borderColor);
      
      circle(barX + this.scale*this.percentageValue*this.barWidth, this.y+this.scale*this.height/2, this.scale*this.height);
      
      fill(this.textOverlayColor);
      //stroke(this.textOverlayColor);
      //noStroke();
      //textSize(this.textSize * this.scale);
      //textAlign(CENTER, CENTER);
      drawText(this.text + ": " + this.getValue(), this.x, this.y + this.scale*this.height/2, this.scale*this.textSize);
      
      //rect(this.x, this.y, this.scale*this.width, this.scale*this.height);
      
      //pop()
   }
   
   getValue() {
      let val = (this.valueMax-this.valueMin)*this.percentageValue+this.valueMin;
      if (this.valueStep) val = val - (val % this.valueStep);
      
      return val;
   }
   
   inBounds(x, y) {
      return this.x <= x && this.y <= y && this.x+this.scale*this.width >= x &&  this.y+this.scale*this.height >= y
   }
   
   startClick(x, y) {
      if (this.inBounds(x, y)) {
         this.clicking = true
      }
      return this.getValue();
   }
   
   onClick(x, y) {
      if (!this.clicking) return this.getValue();
      
      x -= this.x;
      this.percentageValue = x/this.width;
      this.percentageValue = Math.max(0, Math.min(1, this.percentageValue));
      
      return this.getValue();
   }
   
   endClick(x, y) {
      if (this.inBounds(x, y) && this.clicking) {
         this.clicking = false
         return this.getValue();
      }
      
      this.clicking = false
      return this.getValue();
   }
}

class MagicGUI_Display {
   text = ""
   width = 100
   height = 10
   
   value = undefined
   
   x = 0
   y = 0
   scale = 1
   
   textSize = 12;
   textColor = color(0);
   
   constructor(k, v) {
      this.text = k.substring(8);
      this.paramKey = k;
      this.paramValue = v;
      this.value = v;
      
      this.updateWidth();
   }
   
   draw() {
      //push()
      
      
      fill(this.textColor);
      //stroke(this.textColor);
      //noStroke();
      //textSize(this.textSize * this.scale);
      //textAlign(LEFT, CENTER);
      drawText(this.text + ": " + this.value, this.x, this.y + this.scale*this.height/2, this.scale*this.textSize);
      //pop()
   }
   
   inBounds(x, y) {
      return this.x <= x && this.y <= y && this.x+this.scale*this.width >= x &&  this.y+this.scale*this.height >= y
   }
   
   updateValue(v) {
      this.value = v;
      
      this.forceGUIUpdate = true
      this.updateWidth()
   }
   
   updateWidth() {
      textSize(this.textSize * this.scale);
      this.width = 10+Math.max(100, textWidth(this.text + ": " + this.value)) //100 + 7*Math.max(0, (this.text + ": " + this.value).length - 12)
   }
}

class MagicGUI_Radio extends MagicGUI_Pane {
   constructor(title, options) {
      super(title, {})
      this.options = options
      this.title = title
      this.paramKey = title
      this.params = {}
      
      options.forEach(option => this.components.push(new MagicGUI_Checkbox(option, false, "circle")))
      this.components[0].updateValue(true);
      this.value = options[0]
      
      this.components.unshift(new MagicGUI_Display("display_"+title, ""))
      
      this.onUpdatePosition();
   }
   
   endClick(x, y) {
      let clickedBox = this.components.filter(component => component.clicking)[0]
      
      super.endClick(x, y)
      
      if(!clickedBox) return
      this.components.forEach(component => component.updateValue(false))
      clickedBox.updateValue(true)
      
      this.components[0].updateValue("") // component 0 isn't a radio button, it's our title
      this.components[0].forceGUIUpdate = false
      
      this.value = clickedBox.paramKey
      return this.value
   }
   
   updateValues() {}
   
   onClick() {
      super.onClick() 
      return this.value
   }
   
   noClick() {
      super.noClick() 
      return this.value
   }
   
   startClick() {
      super.startClick() 
      return this.value
   }
   
   
}

let MagicGUI_SelectedText = null
class MagicGUI_Text {
   text = ""
   width = 100
   height = 40
   
   inputBoxWidth = 100
   
   x = 0
   y = 0
   scale = 1
   
   textSize = 12;
   textColor = color(0);
   
   constructor(k, v) {
      this.text = k
      this.paramKey = k;
      this.paramValue = v;
      this.value = v;
      
      const onInput = (inputString) => this.value = inputString
      let inp = createInput(v);
      inp.position(this.x, this.y);
      inp.size(this.inputBoxWidth);
      inp.input(myInputEvent);
      
      function myInputEvent() {
         console.log('you are typing: ', this.value());
         onInput(this.value)
      }
      
      this.input = inp
      
      textSize(this.textSize * this.scale);
      this.width = this.inputBoxWidth+Math.max(100, textWidth(this.text)) 
   }
   
   draw() {
      //push()
      
      this.input.position(this.x, this.y);
      
      fill(this.textColor);
      //stroke(this.textColor);
      //noStroke();
      //textSize(this.textSize * this.scale);
      //textAlign(LEFT, CENTER);
      drawText(this.text, this.x + 20 + this.inputBoxWidth, this.y + this.scale*this.height/2, this.scale*this.textSize);
      //pop()
   }
   
   inBounds(x, y) {
      return this.x <= x && this.y <= y && this.x+this.scale*this.width >= x &&  this.y+this.scale*this.height >= y
   }
   
   startClick(x, y) {
      if(!this.inBounds(x,y)) {
         if (MagicGUI_SelectedText === this) MagicGUI_SelectedText = null
         return this.value
      }
      MagicGUI_SelectedText = this
      this.input.elt.setSelectionRange(0,this.value.length)
      this.input.elt.focus()
      return this.value
   }
   
   onClick(x, y) {
      if(!this.inBounds(x,y)) return this.value
      
      
      return this.value
   }
   
   endClick(x, y) {
      return this.value
   }
   
   noClick(x, y) {
      return this.value
   }
   
   updateValue() {}
   
   updateValuer(v) {
      this.value = v;
      
      this.input.value(v)
      this.input.elt.setSelectionRange(0,this.value.length)
   }
}
/*
function keyTyped() {
   if (!MagicGUI_SelectedText) return
   if(key === "Backspace") {
      MagicGUI_SelectedText.updateValuer(MagicGUI_SelectedText.value.substring(0, MagicGUI_SelectedText.value.length-1))
   } else {
      MagicGUI_SelectedText.updateValuer(MagicGUI_SelectedText.value + key)
   }
}*/