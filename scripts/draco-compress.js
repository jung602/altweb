#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Define the directories to process
const directories = [
  'public/models/main',
  'public/models/main-mobile'
];

// Process each directory
directories.forEach(dir => {
  const files = fs.readdirSync(dir);
  
  // Create output directory if it doesn't exist
  const outputDir = path.join(dir, 'draco');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }
  
  // Process each GLB file
  files.forEach(file => {
    if (file.endsWith('.glb') && !file.includes('draco')) {
      const inputPath = path.join(dir, file);
      const outputFileName = file.replace('.glb', '_draco.glb');
      const outputPath = path.join(outputDir, outputFileName);
      
      console.log(`Compressing ${inputPath}...`);
      
      try {
        // Use gltf-transform to apply Draco compression
        // Using maximum quantization bits to preserve geometry details
        execSync(
          `npx gltf-transform draco ${inputPath} ${outputPath} ` +
          `--method edgebreaker ` +
          `--quantize-position 16 ` +
          `--quantize-normal 10 ` +
          `--quantize-texcoord 12 ` +
          `--encode-speed 1`, // Lower encode speed for better compression
          {
            stdio: 'inherit'
          }
        );
        
        console.log(`Successfully compressed to ${outputPath}`);
      } catch (error) {
        console.error(`Error compressing ${inputPath}:`, error.message);
      }
    }
  });
});

console.log('Draco compression completed for all models.'); 