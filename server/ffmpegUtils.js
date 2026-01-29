// const ffmpeg = require('fluent-ffmpeg');
// const path = require('path');
// const fs = require('fs');

// const extractFrames = (videoPath, outputDir) => {
//   return new Promise((resolve, reject) => {
//     // Ensure output dir exists
//     if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

//     ffmpeg(videoPath)
//       .setStartTime(0)
//       .setDuration(1) // Limit to 1 second for testing
//       .fps(24) // Force 24 fps
//       .output(path.join(outputDir, 'frame_%03d.png'))
//       .on('end', () => resolve())
//       .on('error', (err) => reject(err))
//       .run();
//   });
// };

// const stitchFrames = (frameDir, outputPath) => {
//   return new Promise((resolve, reject) => {
//     // ✅ Ensure output directory exists
//     const outputDir = path.dirname(outputPath);
//     if (!fs.existsSync(outputDir)) {
//       fs.mkdirSync(outputDir, { recursive: true });
//     }

//     ffmpeg()
//       .input(path.join(frameDir, 'frame_%03d.png'))

//       .inputOptions('-framerate 24')
//       .outputOptions([
//         '-c:v libx264',
//         '-pix_fmt yuv420p'
//       ])
//       .on('end', () => resolve(outputPath))
//       .on('error', (err) => reject(err))
//       .save(outputPath); // ✅ use save instead of output().run()
//   });
// };


// module.exports = { extractFrames, stitchFrames };

const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

const extractFrames = (videoPath, outputDir) => {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    ffmpeg(videoPath)
      .setStartTime(0)
      .setDuration(1.5) // Limit to 1.5 seconds for demo speed
      .fps(24)
      .output(path.join(outputDir, 'frame_%03d.png'))
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .run();
  });
};

const stitchFrames = (frameDir, outputPath) => {
  return new Promise((resolve, reject) => {
    // FIX: Look for 'processed_' frames, not original 'frame_'
    const inputPattern = path.join(frameDir, 'processed_%03d.png');

    ffmpeg()
      .input(inputPattern)
      .inputOptions('-framerate 24')
      .outputOptions([
        '-c:v libx264',
        '-pix_fmt yuv420p',
        '-preset ultrafast' // Speed up encoding
      ])
      .on('end', () => resolve(outputPath))
      .on('error', (err) => reject(err))
      .save(outputPath);
  });
};

module.exports = { extractFrames, stitchFrames };