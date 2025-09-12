// Celiador Inspection Transformer
// Automatically adds inspection markers to JSX elements during build

const fs = require('fs');
const path = require('path');

/**
 * Transform JSX elements to add inspection metadata
 * This runs during the build process to inject data attributes
 */
function addInspectionMarkers(sourceCode, filePath) {
  // Simple regex-based transformation for key interactive elements
  // In a real implementation, you'd use AST parsing (babel, etc.)
  
  const lines = sourceCode.split('\n');
  const relativePath = path.relative(process.cwd(), filePath);
  
  let transformedLines = lines.map((line, lineIndex) => {
    const lineNumber = lineIndex + 1;
    
    // Look for JSX elements that should have inspection markers
    const jsxElementRegex = /<(h[1-6]|button|input|textarea|select|a|div|span|section|header|footer|nav|main|article|form)([^>]*?)(\/>|>)/g;
    
    return line.replace(jsxElementRegex, (match, tagName, attributes, closeTag) => {
      // Skip if already has inspection markers
      if (attributes.includes('data-celiador-id') || attributes.includes('data-source-file')) {
        return match;
      }
      
      // Generate unique inspection ID
      const inspectionId = `${path.basename(filePath, path.extname(filePath))}_${tagName}_${lineNumber}_${Math.random().toString(36).substr(2, 6)}`;
      
      // Add inspection metadata
      const inspectionAttrs = [
        `data-celiador-id="${inspectionId}"`,
        `data-source-file="${relativePath}"`,
        `data-source-line="${lineNumber}"`
      ].join(' ');
      
      // Insert attributes before closing
      const newAttributes = attributes.trim() ? `${attributes} ${inspectionAttrs}` : inspectionAttrs;
      
      return `<${tagName} ${newAttributes}${closeTag}`;
    });
  });
  
  return transformedLines.join('\n');
}

/**
 * Next.js webpack plugin to transform files during build
 */
class CeliadoreInspectionPlugin {
  apply(compiler) {
    compiler.hooks.thisCompilation.tap('CeliadoreInspectionPlugin', (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: 'CeliadoreInspectionPlugin',
          stage: compilation.PROCESS_ASSETS_STAGE_OPTIMIZE,
        },
        () => {
          // Only run in development mode
          if (process.env.NODE_ENV !== 'development') return;
          
          console.log('🔍 [Celiador] Adding inspection markers to JSX files...');
        }
      );
    });
  }
}

/**
 * File system watcher for development
 * Processes files as they're read by the dev server
 */
function createFileProcessor() {
  const originalReadFileSync = fs.readFileSync;
  
  fs.readFileSync = function(filePath, options) {
    const result = originalReadFileSync.apply(this, arguments);
    
    // Only process JSX/TSX files in development
    if (process.env.NODE_ENV === 'development' && 
        typeof result === 'string' &&
        (filePath.endsWith('.jsx') || filePath.endsWith('.tsx')) &&
        !filePath.includes('node_modules')) {
      
      try {
        const transformed = addInspectionMarkers(result, filePath);
        return options && options.encoding ? transformed : Buffer.from(transformed);
      } catch (error) {
        console.warn('🚨 [Celiador] Failed to transform', filePath, error.message);
        return result;
      }
    }
    
    return result;
  };
}

module.exports = {
  addInspectionMarkers,
  CeliadoreInspectionPlugin, 
  createFileProcessor
};