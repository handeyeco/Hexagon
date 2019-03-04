// All of the constants shared between Hexagons
const hexagonPrototypeGenerator = function (sideLength) {
  const angle = 0.523598776;
  const height = Math.sin(angle) * sideLength;
  const radius = Math.cos(angle) * sideLength;
  const rectangleHeight = sideLength + 2 * height;
  const rectangleWidth = 2 * radius;

  let lastHexIndex = null;

  const drawMouse = function (canvasContext, mouseX, mouseY, bells, scale) {
    let safeHexRadius =  this.radius * 10;
    let distance = Math.sqrt(Math.pow(this.centerX - mouseX, 2) + Math.pow(this.centerY - mouseY, 2));
    if (distance < safeHexRadius) {
      this.drawHexShape(canvasContext);

      const scale = window.devicePixelRatio || 1;
      if (mouseX && mouseY && canvasContext.isPointInPath(mouseX * scale, mouseY * scale)) {
        canvasContext.globalAlpha = 1.0;

        if (bells) {
          bells.ringBell(this.frequency);
        }

      } else {
        let distanceOpacity = ((1 / safeHexRadius) * -1) * distance + 1;
        canvasContext.globalAlpha = Math.max(distanceOpacity - this.randomness, 0);
      }

      canvasContext.fillStyle = this.color;
      canvasContext.strokeStyle = this.color;
      canvasContext.fill();
      canvasContext.stroke();
    }
  }

  const drawKey = function (canvasContext, activeFreqs) {
    if (activeFreqs.indexOf(this.frequency) !== -1) {
      canvasContext.globalAlpha = this.randomness;
      this.drawHexShape(canvasContext);

      canvasContext.fillStyle = this.color;
      canvasContext.strokeStyle = this.color;
      canvasContext.fill();
      canvasContext.stroke();
    }
  }

  const drawHexShape = function (canvasContext) {
    canvasContext.beginPath();
    canvasContext.moveTo(this.vector1[0], this.vector1[1]);
    canvasContext.lineTo(this.vector2[0], this.vector2[1]);
    canvasContext.lineTo(this.vector3[0], this.vector3[1]);
    canvasContext.lineTo(this.vector4[0], this.vector4[1]);
    canvasContext.lineTo(this.vector5[0], this.vector5[1]);
    canvasContext.lineTo(this.vector6[0], this.vector6[1]);
    canvasContext.closePath();
  }

  return {
    sideLength,
    height,
    radius,
    rectangleHeight,
    rectangleWidth,
    drawMouse,
    drawKey,
    drawHexShape,
  }
}

// Variables specific to individual hexagons
const Hexagon = function (x, y, index, frequency, hex) {
  let color = "maroon";
  let randomness = Math.random();

  const newHex = {
    x,
    y,
    color,
    index,
    randomness,
    frequency,
    centerX: x + hex.rectangleWidth / 2,
    centerY: y + hex.sideLength,
    vector1: [x + hex.radius, y],
    vector2: [x + hex.rectangleWidth, y + hex.height],
    vector3: [x + hex.rectangleWidth, y + hex.height + hex.sideLength],
    vector4: [x + hex.radius, y + hex.rectangleHeight],
    vector5: [x, y + hex.sideLength + hex.height],
    vector6: [x, y + hex.height]
  }

  return Object.setPrototypeOf(newHex, hex);
}
