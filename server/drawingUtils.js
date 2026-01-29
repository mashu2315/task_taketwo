// const { createCanvas, loadImage } = require('canvas');
// const fs = require('fs');

// /**
//  * Generate a random bright color for scribbles
//  */
// const getRandomColor = () => {
//   const colors = [
//     '#FF006E', '#FB5607', '#FFBE0B', '#8338EC',
//     '#3A86FF', '#06FFB4', '#FF1654',
//     '#00D9FF', '#00FF41', '#FFBA08'
//   ];
//   return colors[Math.floor(Math.random() * colors.length)];
// };

// /**
//  * Draw random scribbles around the detected subject
//  */
// const drawScribbles = (ctx, coords, frameIndex, canvasWidth, canvasHeight) => {
//   const {
//     x = 0,
//     y = 0,
//     width,
//     w,
//     height,
//     h
//   } = coords;

//   const boxWidth = width || w || 200;
//   const boxHeight = height || h || 300;

//   const numScribbles = 2 + Math.floor(Math.random() * 4);

//   for (let s = 0; s < numScribbles; s++) {
//     const color = getRandomColor();
//     ctx.strokeStyle = color;
//     ctx.lineWidth = 2 + Math.random() * 4;
//     ctx.lineCap = 'round';
//     ctx.lineJoin = 'round';
//     ctx.globalAlpha = 0.8 + Math.random() * 0.2;

//     ctx.shadowBlur = 5 + Math.random() * 5;
//     ctx.shadowColor = color;

//     ctx.beginPath();
//     const numPoints = 5 + Math.floor(Math.random() * 5);

//     for (let i = 0; i < numPoints; i++) {
//       const offsetX = (Math.random() - 0.5) * boxWidth * 1.3;
//       const offsetY = (Math.random() - 0.5) * boxHeight * 1.3;

//       const px = x + boxWidth / 2 + offsetX;
//       const py = y + boxHeight / 2 + offsetY;

//       const clampedX = Math.max(0, Math.min(canvasWidth, px));
//       const clampedY = Math.max(0, Math.min(canvasHeight, py));

//       if (i === 0) ctx.moveTo(clampedX, clampedY);
//       else ctx.lineTo(clampedX, clampedY);
//     }

//     ctx.stroke();
//   }

//   ctx.globalAlpha = 1.0;
//   ctx.shadowBlur = 0;
// };

// /**
//  * Draw a circular/oval scribble border around the subject
//  */
// const drawScribbleBorder = (ctx, coords) => {
//   const {
//     x = 0,
//     y = 0,
//     width,
//     w,
//     height,
//     h
//   } = coords;

//   const boxWidth = width || w || 200;
//   const boxHeight = height || h || 300;

//   const color = getRandomColor();
//   ctx.strokeStyle = color;
//   ctx.lineWidth = 3 + Math.random() * 3;
//   ctx.lineCap = 'round';
//   ctx.lineJoin = 'round';
//   ctx.globalAlpha = 0.7;

//   ctx.beginPath();
//   const segments = 40;

//   for (let i = 0; i <= segments; i++) {
//     const angle = (i / segments) * Math.PI * 2;

//     const radiusVariation = (Math.random() - 0.5) * 40 + (10 + Math.sin(i * 0.1) * 15);
//     const rX = (boxWidth / 2) * (0.9 + Math.random() * 0.2) + radiusVariation;
//     const rY = (boxHeight / 2) * (0.9 + Math.random() * 0.2) + radiusVariation;

//     const px = x + (boxWidth / 2) + Math.cos(angle) * rX;
//     const py = y + (boxHeight / 2) + Math.sin(angle) * rY;

//     if (i === 0) ctx.moveTo(px, py);
//     else ctx.lineTo(px, py);
//   }

//   ctx.closePath();
//   ctx.stroke();
//   ctx.globalAlpha = 1.0;
// };

// /**
//  * Apply paper texture overlay
//  */
// const applyPaperTexture = async (ctx, canvasWidth, canvasHeight, paperPath, frameIndex) => {
//   if (!paperPath) return;

//   try {
//     const paperImg = await loadImage(paperPath);

//     const baseOpacity = 0.5 + Math.sin(frameIndex * 0.3) * 0.15;
//     ctx.globalAlpha = baseOpacity;
//     ctx.globalCompositeOperation = 'multiply';

//     for (let tx = 0; tx < canvasWidth; tx += paperImg.width) {
//       for (let ty = 0; ty < canvasHeight; ty += paperImg.height) {
//         ctx.drawImage(paperImg, tx, ty);
//       }
//     }

//     ctx.globalCompositeOperation = 'source-over';
//     ctx.globalAlpha = 1.0;
//   } catch (err) {
//     console.warn("Could not load paper texture:", err.message);
//   }
// };

// /**
//  * Draw white frame border
//  */
// const drawWhiteSeparator = (ctx, canvasWidth, canvasHeight) => {
//   const thickness = 8;

//   ctx.globalAlpha = 0.6;
//   ctx.fillStyle = '#FFFFFF';

//   ctx.fillRect(0, 0, canvasWidth, thickness);
//   ctx.fillRect(0, canvasHeight - thickness, canvasWidth, thickness);
//   ctx.fillRect(0, 0, thickness, canvasHeight);
//   ctx.fillRect(canvasWidth - thickness, 0, thickness, canvasHeight);

//   ctx.globalAlpha = 1.0;
// };

// /**
//  * Main frame processing function
//  */
// const processFrame = async (framePath, outputPath, paperPath, coords, frameIndex) => {
//   const videoImg = await loadImage(framePath);
//   const width = videoImg.width;
//   const height = videoImg.height;

//   const canvas = createCanvas(width, height);
//   const ctx = canvas.getContext('2d');

//   ctx.drawImage(videoImg, 0, 0, width, height);

//   await applyPaperTexture(ctx, width, height, paperPath, frameIndex);

//   drawScribbles(ctx, coords, frameIndex, width, height);

//   drawScribbleBorder(ctx, coords);

//   drawWhiteSeparator(ctx, width, height);

//   const buffer = canvas.toBuffer('image/png');
//   fs.writeFileSync(outputPath, buffer);
// };

// module.exports = { processFrame };

const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');

const getRandomNeonColor = () => {
  const colors = ['#FF0055', '#00E5FF', '#FFD500', '#00FF48', '#FF3D00'];
  return colors[Math.floor(Math.random() * colors.length)];
};

const processFrame = async (framePath, outputPath, paperPath, coords, frameIndex) => {
  const videoImg = await loadImage(framePath);
  const { width, height } = videoImg;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // 1. Draw Video Base
  ctx.drawImage(videoImg, 0, 0, width, height);

  // 2. Draw Paper Texture
  if (paperPath) {
    try {
      const paperImg = await loadImage(paperPath);
      
      // 'multiply' is best for white paper on video.
      // It makes the white parts transparent and the shadows/creases visible.
      ctx.globalCompositeOperation = 'multiply'; 
      ctx.drawImage(paperImg, 0, 0, width, height);
      
      // Reset blending
      ctx.globalCompositeOperation = 'source-over';
    } catch (e) {
      console.warn("Skipping paper texture (load error):", paperPath);
    }
  }

  // 3. BONUS: White Foreground Separator (Approximate)
  // We draw a rough white outline around the subject area
  const { x, y, width: w, height: h } = coords;
  
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.8;
  ctx.beginPath();
  ctx.roundRect(x - 10, y - 10, w + 20, h + 20, 20); // Rounded box
  ctx.stroke();
  ctx.globalAlpha = 1.0;

  // 4. RANDOM SCRIBBLES (The Energy Effect)
  const numScribbles = 3; // How many lines to draw
  
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  for (let s = 0; s < numScribbles; s++) {
    ctx.strokeStyle = getRandomNeonColor();
    ctx.lineWidth = 4 + Math.random() * 6;
    ctx.shadowBlur = 15;
    ctx.shadowColor = ctx.strokeStyle;

    ctx.beginPath();
    
    // Start somewhere near the detected subject
    let startX = x + (w/2) + (Math.random() - 0.5) * w;
    let startY = y + (h/2) + (Math.random() - 0.5) * h;
    
    ctx.moveTo(startX, startY);
    
    // Draw a jagged random path
    for (let p = 0; p < 4; p++) {
       ctx.quadraticCurveTo(
         x + Math.random() * w, 
         y + Math.random() * h, 
         x + Math.random() * w, 
         y + Math.random() * h
       );
    }
    ctx.stroke();
  }
  
  // Save Frame
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
};

module.exports = { processFrame };