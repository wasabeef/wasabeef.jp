const fs = require('fs');
const path = require('path');

const contentDir = path.join(process.cwd(), 'content/blog');
const publicDir = path.join(process.cwd(), 'public/images/blog');

// Ensure public/images/blog directory exists
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Copy blog images from content to public
function copyBlogImages() {
  const entries = fs.readdirSync(contentDir, { withFileTypes: true });
  
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const sourceDir = path.join(contentDir, entry.name);
      const targetDir = path.join(publicDir, entry.name);
      
      // Copy directory recursively
      if (fs.existsSync(sourceDir)) {
        copyDirectory(sourceDir, targetDir);
        console.log(`Copied images from ${sourceDir} to ${targetDir}`);
      }
    }
  }
}

function copyDirectory(source, target) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }
  
  const entries = fs.readdirSync(source, { withFileTypes: true });
  
  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);
    
    if (entry.isDirectory()) {
      copyDirectory(sourcePath, targetPath);
    } else {
      // Only copy image files
      const ext = path.extname(entry.name).toLowerCase();
      if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext)) {
        fs.copyFileSync(sourcePath, targetPath);
      }
    }
  }
}

copyBlogImages();