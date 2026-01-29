
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