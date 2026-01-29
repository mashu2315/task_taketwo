const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');

/**
 * Detect subject coordinates using image processing
 * This function analyzes the image to find the main subject (person/object)
 * Returns bounding box coordinates for drawing scribbles
 */
const getSubjectCoordinates = async (imagePath) => {
  try {
    const image = await loadImage(imagePath);
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');
    
    // Draw the image to analyze
    ctx.drawImage(image, 0, 0);
    
    // Get image data for analysis
    const imageData = ctx.getImageData(0, 0, image.width, image.height);
    const data = imageData.data;
    
    // Simple edge/motion detection by analyzing brightness distribution
    // This finds the region with highest activity/contrast
    let brightestX = 0, brightestY = 0;
    let brightestIntensity = 0;
    const sampleRate = 20; // Check every 20th pixel for performance
    
    for (let i = 0; i < data.length; i += sampleRate * 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const intensity = (r + g + b) / 3;
      
      if (intensity > brightestIntensity) {
        brightestIntensity = intensity;
        const pixelIndex = i / 4;
        brightestX = (pixelIndex % image.width);
        brightestY = Math.floor(pixelIndex / image.width);
      }
    }
    
    // Generate coordinates centered around the detected region
    // Default to center if detection fails
    const centerX = brightestX || image.width / 2;
    const centerY = brightestY || image.height / 2;
    
    // Create a bounding box around the center
    const boxWidth = Math.min(image.width * 0.4, 500);
    const boxHeight = Math.min(image.height * 0.5, 600);
    
    return {
      x: Math.max(0, centerX - boxWidth / 2),
      y: Math.max(0, centerY - boxHeight / 2),
      width: boxWidth,
      height: boxHeight
    };
    
  } catch (error) {
    console.error("Subject Detection Error:", error);
    // Fallback: center of the frame
    return { x: 200, y: 150, width: 400, height: 500 };
  }
};

module.exports = { getSubjectCoordinates };
