require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { extractFrames, stitchFrames } = require('./ffmpegUtils');
const { getSubjectCoordinates } = require('./aiService');
const { processFrame } = require('./drawingUtils');

const app = express();
app.use(cors());
app.use('/output', express.static(path.join(__dirname, 'output')));

const upload = multer({ dest: 'uploads/' });

app.post('/process', upload.single('video'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No video uploaded" });
  }

  // 1. SETUP PATHS
  const videoPath = req.file.path;
  const jobId = req.file.filename;
  const tempDir = path.join(__dirname, 'temp_frames', jobId);
  const outputDir = path.join(__dirname, 'output');
  const finalVideoPath = path.join(outputDir, `${jobId}.mp4`);
  
  // Define where the paper texture assets are stored
  const assetsDir = path.join(__dirname, 'assets', 'papers');

  // Ensure directories exist
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  if (!fs.existsSync(assetsDir)) {
    console.warn("⚠️ Warning: No 'assets/papers' folder found. Texture effects will be skipped.");
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  try {
    // 2. GET PAPER ASSETS
    // Filter for image files only (ignore .DS_Store, etc)
    const paperFiles = fs.readdirSync(assetsDir).filter(file => {
      return ['.jpg', '.jpeg', '.png'].includes(path.extname(file).toLowerCase());
    });
    
    const paperPaths = paperFiles.map(file => path.join(assetsDir, file));
    
    if (paperPaths.length === 0) {
      console.log("Note: No paper textures found in assets/papers. Video will process without texture.");
    } else {
      console.log(`✓ Loaded ${paperPaths.length} paper texture(s) from assets`);
    }

    // 3. EXTRACT FRAMES
    console.log("1. Extracting frames from video...");
    await extractFrames(videoPath, tempDir);

    const frameFiles = fs.readdirSync(tempDir).filter(f => f.startsWith('frame_')).sort();
    console.log(`   ✓ Extracted ${frameFiles.length} frames`);
    
    // 4. DETECT SUBJECT
    console.log("2. Detecting subject in first frame...");
    const coords = await getSubjectCoordinates(path.join(tempDir, frameFiles[0]));
    console.log(`   ✓ Subject detected at (${Math.floor(coords.x)}, ${Math.floor(coords.y)})`);

    // 5. PROCESS EACH FRAME
    console.log("3. Processing frames with effects...");
    for (let i = 0; i < frameFiles.length; i++) {
      const inputPath = path.join(tempDir, frameFiles[i]);
      const frameNum = String(i + 1).padStart(3, '0');
      const outputPath = path.join(tempDir, `processed_${frameNum}.png`);
      
      // AUTO-CYCLE: Pick a paper texture based on frame index
      // If you have 3 papers, frame 0 gets paper 0, frame 1 gets paper 1, frame 2 gets paper 2, etc.
      let currentPaper = null;
      if (paperPaths.length > 0) {
        currentPaper = paperPaths[i % paperPaths.length];
      }

      // Add jitter to coordinates for animation effect
      const jitterCoords = {
        x: coords.x + (Math.random() - 0.5) * 10,
        y: coords.y + (Math.random() - 0.5) * 10,
        width: coords.width,
        height: coords.height
      };

      await processFrame(inputPath, outputPath, currentPaper, jitterCoords, i);
      
      if ((i + 1) % Math.ceil(frameFiles.length / 5) === 0) {
        console.log(`   ✓ Processed ${i + 1}/${frameFiles.length} frames`);
      }
    }

    // 6. STITCH FRAMES INTO VIDEO
    console.log("4. Stitching frames into video...");
    await stitchFrames(tempDir, finalVideoPath);
    console.log(`   ✓ Video created: ${jobId}.mp4`);

    // 7. CLEANUP (optional - remove temp frames to save space)
    // fs.rmSync(tempDir, { recursive: true });

    res.json({ url: `http://localhost:${process.env.PORT || 5000}/output/${jobId}.mp4` });

  } catch (err) {
    console.error("❌ Processing Error:", err);
    res.status(500).json({ error: err.message || "Processing failed" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🎬 Video FX Server running on http://localhost:${PORT}`);
  console.log(`📁 Assets folder: ${path.join(__dirname, 'assets', 'papers')}`);
  console.log(`\nReady to process videos!\n`);
});
