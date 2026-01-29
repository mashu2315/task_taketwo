const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

const extractFrames = (videoPath, outputDir) => {
  return new Promise((resolve, reject) => {
    // Ensure output dir exists
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    ffmpeg(videoPath)
      .setStartTime(0)
      .setDuration(1) // Limit to 1 second for testing
      .fps(24) // Force 24 fps
      .output(path.join(outputDir, 'frame_%03d.png'))
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .run();
  });
};

const stitchFrames = (frameDir, outputPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(path.join(frameDir, 'processed_%03d.png'))
      .inputFPS(24)
      .output(outputPath)
      .outputOptions('-c:v libx264', '-pix_fmt yuv420p')
      .on('end', () => resolve(outputPath))
      .on('error', (err) => reject(err))
      .run();
  });
};

module.exports = { extractFrames, stitchFrames };