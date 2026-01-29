import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import './App.css';

function App() {
  const [videoUrl, setVideoUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [originalName, setOriginalName] = useState("");

  const onDrop = async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setOriginalName(file.name.split('.')[0]); // Save name for the download button
    const formData = new FormData();
    formData.append('video', file);

    setLoading(true);
    setStatus("Uploading & Processing...");
    setVideoUrl(null);

    try {
      const res = await axios.post('http://localhost:5000/process', formData);
      setVideoUrl(res.data.url);
      setStatus("Done!");
    } catch (err) {
      console.error(err);
      setStatus("Error processing video.");
    } finally {
      setLoading(false);
    }
  };

  // Function to handle the download
  const handleDownload = async () => {
    if (!videoUrl) return;
    
    try {
      // We fetch it as a blob to force the browser to download instead of playing it
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${originalName}_scribble_edit.mp4`; // Custom filename
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: {'video/*': []},
    multiple: false 
  });

  return (
    <div className="App">
      <header className="App-header">
        <h1>Video FX Studio</h1>
        <p className="subtitle">Add scribbles, paper texture & effects to your videos</p>
        
        <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
          <input {...getInputProps()} />
          {loading ? (
            <div className="loader">
              <div className="spinner"></div>
              <p>Processing video... (approx 20-30 seconds)</p>
            </div>
          ) : (
            <div className="upload-prompt">
              <p>📹 Drag & drop your video here</p>
              <p className="hint">.mp4, .mov, .avi, .webm supported</p>
            </div>
          )}
        </div>
        
        {status && <p className="status-text">{status}</p>}

        {videoUrl && (
          <div className="result-container">
            <h3>✨ Your Processed Video:</h3>
            <video src={videoUrl} controls autoPlay loop className="video-player" />
            
            <div className="button-group">
              <button onClick={handleDownload} className="download-btn">
                ⬇ Download Video
              </button>
            </div>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;