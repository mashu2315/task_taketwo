
require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const https = require('https'); // Added for auto-downloading assets
const cors = require('cors');
const { extractFrames, stitchFrames } = require('./ffmpegUtils');
const { getSubjectCoordinates } = require('./aiService');
const { processFrame } = require('./drawingUtils');

const app = express();
app.use(cors());
app.use('/output', express.static(path.join(__dirname, 'output')));

const upload = multer({ dest: 'uploads/' });

// --- HELPER: Auto-download dummy textures if folder is empty ---
const downloadFile = (url, dest) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close(() => resolve(true));
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {}); // Delete failed file
      resolve(false);
    });
  });
};

const ensureAssetsExist = async (assetsDir) => {
  const existingFiles = fs.readdirSync(assetsDir).filter(f => !f.startsWith('.'));
  if (existingFiles.length > 0) return;

  console.log("⚠️ No papers found. Downloading sample textures for you...");
  const samples = [
    "https://img.freepik.com/free-photo/white-crumpled-paper-texture-background_1150-49667.jpg",
    "https://img.freepik.com/free-photo/cardboard-sheet_1150-17865.jpg",
    "https://img.freepik.com/free-photo/old-paper-texture_1150-38668.jpg"
  ];

  for (let i = 0; i < samples.length; i++) {
    await downloadFile(samples[i], path.join(assetsDir, `sample_texture_${i}.jpg`));
  }
  console.log("✅ Sample textures downloaded!");
};
// -------------------------------------------------------------

app.post('/process', upload.single('video'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No video uploaded" });

  const jobId = req.file.filename;
  const videoPath = req.file.path;
  const tempDir = path.join(__dirname, 'temp_frames', jobId);
  const outputDir = path.join(__dirname, 'output');
  const assetsDir = path.join(__dirname, 'assets', 'papers');
  const finalVideoPath = path.join(outputDir, `${jobId}.mp4`);

  // Ensure Dirs
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

  try {
    // 1. CHECK ASSETS
    await ensureAssetsExist(assetsDir);
    
    // Case-insensitive image filter
    const paperFiles = fs.readdirSync(assetsDir).filter(file => {
      return ['.jpg', '.jpeg', '.png'].includes(path.extname(file).toLowerCase());
    });
    const paperPaths = paperFiles.map(file => path.join(assetsDir, file));

    console.log(`[${jobId}] Using ${paperPaths.length} paper textures.`);

    // 2. EXTRACT FRAMES
    console.log(`[${jobId}] Extracting frames...`);
    await extractFrames(videoPath, tempDir);

    const frameFiles = fs.readdirSync(tempDir).filter(f => f.startsWith('frame_')).sort();
    
    // 3. DETECT SUBJECT (Gemini / Vision Logic)
    console.log(`[${jobId}] Detecting subject...`);
    const coords = await getSubjectCoordinates(path.join(tempDir, frameFiles[0]));

    // 4. APPLY EFFECTS
    console.log(`[${jobId}] Rendering effects...`);
    for (let i = 0; i < frameFiles.length; i++) {
      const inputPath = path.join(tempDir, frameFiles[i]);
      const frameNum = String(i + 1).padStart(3, '0');
      const outputPath = path.join(tempDir, `processed_${frameNum}.png`);
      
      // Cycle papers
      const paperPath = paperPaths.length > 0 ? paperPaths[i % paperPaths.length] : null;

      // Jitter Detection Box (Simulates "Hand Drawn" instability)
      const jitterCoords = {
        x: coords.x + (Math.random() - 0.5) * 30,
        y: coords.y + (Math.random() - 0.5) * 30,
        width: coords.width + (Math.random() - 0.5) * 20,
        height: coords.height + (Math.random() - 0.5) * 20
      };

      await processFrame(inputPath, outputPath, paperPath, jitterCoords, i);
    }

    // 5. STITCH
    console.log(`[${jobId}] Stitching video...`);
    await stitchFrames(tempDir, finalVideoPath);

    // 6. CLEANUP
    console.log(`[${jobId}] Cleanup...`);
    fs.rmSync(tempDir, { recursive: true, force: true });
    fs.unlinkSync(videoPath);

    res.json({ url: `http://localhost:${process.env.PORT || 5000}/output/${jobId}.mp4` });

  } catch (err) {
    console.error("Processing Error:", err);
    if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));