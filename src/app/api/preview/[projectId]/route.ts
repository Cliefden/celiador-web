import { NextRequest, NextResponse } from 'next/server';

interface PreviewProxyRouteParams {
  params: {
    projectId: string;
  };
}

// Get the orchestrator URL from environment
const ORCHESTRATOR_URL = process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'http://localhost:4000';

export async function GET(request: NextRequest, { params }: PreviewProxyRouteParams) {
  const { projectId } = await params;
  
  console.log(`🔄 [Preview Proxy] GET request for project ${projectId}`);
  console.log(`🔄 [Preview Proxy] Request URL: ${request.url}`);
  
  try {
    // Get auth token from headers or query parameter (for iframe requests)
    const url = new URL(request.url);
    const tokenFromQuery = url.searchParams.get('token');
    const authHeader = request.headers.get('authorization');
    
    let authToken: string | null = null;
    
    if (tokenFromQuery) {
      authToken = `Bearer ${tokenFromQuery}`;
    } else if (authHeader) {
      authToken = authHeader;
    }
    
    if (!authToken) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    // First, get the preview instance info from the orchestrator
    const previewResponse = await fetch(`${ORCHESTRATOR_URL}/projects/${projectId}/preview`, {
      headers: {
        'Authorization': authToken,
        'Content-Type': 'application/json',
      },
    });

    if (!previewResponse.ok) {
      console.error('Failed to get preview info:', previewResponse.status);
      return NextResponse.json({ error: 'Preview not found' }, { status: 404 });
    }

    const previewData = await previewResponse.json();
    
    // Check if preview is running
    if (!previewData || previewData.status !== 'running' || !previewData.url) {
      return NextResponse.json({ error: 'Preview not running' }, { status: 503 });
    }

    const originalUrl = previewData.url;
    console.log(`🔄 [Preview Proxy] Proxying preview from ${originalUrl} for project ${projectId}`);

    // Get any additional path from the request URL
    const requestUrlParsed = new URL(request.url);
    const additionalPath = requestUrlParsed.searchParams.get('path') || '';
    const fullOriginalUrl = additionalPath ? `${originalUrl}${additionalPath}` : originalUrl;

    console.log(`📡 [Preview Proxy] Fetching original content from: ${fullOriginalUrl}`);
    
    // Fetch the original preview content
    const originalResponse = await fetch(fullOriginalUrl);
    
    if (!originalResponse.ok) {
      console.error('Failed to fetch original preview:', originalResponse.status);
      return NextResponse.json({ error: 'Failed to fetch preview content' }, { status: originalResponse.status });
    }

    const contentType = originalResponse.headers.get('content-type') || 'text/html';
    
    // If it's HTML, inject our inspection script
    if (contentType.includes('text/html')) {
      let html = await originalResponse.text();
      
      // Inject the inspection script before closing </body> tag
      const inspectionScript = `
<script>
// Celiador Inspection System - Same Origin Version
console.log('🎯 Celiador Inspection Script loaded (same-origin)');

class CeliadorInspector {
  constructor() {
    this.isEnabled = false;
    this.overlayContainer = null;
    this.elements = [];
    this.selectedElement = null;
    this.setupMessageListener();
    console.log('✅ CeliadorInspector initialized');
  }

  setupMessageListener() {
    window.addEventListener('message', (event) => {
      // Only accept messages from parent (same origin now)
      if (event.source !== window.parent) return;
      
      if (event.data.type === 'ENABLE_INSPECTION') {
        console.log('🔍 Enabling inspection mode');
        this.enableInspection();
      } else if (event.data.type === 'DISABLE_INSPECTION') {
        console.log('❌ Disabling inspection mode');
        this.disableInspection();
      }
    });
  }

  enableInspection() {
    if (this.isEnabled) return;
    this.isEnabled = true;
    
    this.mapDOMElements();
    this.createOverlay();
    this.sendElementsToParent();
  }

  disableInspection() {
    if (!this.isEnabled) return;
    this.isEnabled = false;
    
    this.removeOverlay();
    this.elements = [];
    this.selectedElement = null;
  }

  mapDOMElements() {
    this.elements = [];
    
    // Find all interactive/significant elements
    const selectors = [
      'button', 'input', 'textarea', 'select', 'a[href]',
      '[onclick]', '[role="button"]', '.btn', '.button',
      '[data-testid]', '[data-component]', 'nav', 'header', 
      'footer', 'main', 'section', 'article', 'aside',
      'div[class*="container"]', 'div[class*="wrapper"]',
      'div[class*="card"]', 'div[class*="modal"]', 'form',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
    ];

    const elements = document.querySelectorAll(selectors.join(', '));
    
    elements.forEach((el, index) => {
      const rect = el.getBoundingClientRect();
      
      // Skip tiny or invisible elements
      if (rect.width < 10 || rect.height < 10) return;
      
      // Skip elements outside viewport
      if (rect.bottom < 0 || rect.top > window.innerHeight || 
          rect.right < 0 || rect.left > window.innerWidth) return;

      const element = {
        id: \`celiador-element-\${index}\`,
        type: el.tagName.toLowerCase(),
        selector: this.generateSelector(el),
        componentName: this.guessComponentName(el),
        boundingBox: {
          x: rect.left + window.scrollX,
          y: rect.top + window.scrollY,
          width: rect.width,
          height: rect.height,
        },
        metadata: {
          props: this.extractProps(el),
          textContent: el.textContent?.trim()?.slice(0, 100) || ''
        }
      };

      this.elements.push(element);
    });

    console.log(\`🎯 Mapped \${this.elements.length} elements for inspection\`);
  }

  generateSelector(element) {
    if (element.id) return \`#\${element.id}\`;
    
    if (element.className) {
      const classes = element.className.split(' ')
        .filter(cls => cls && !cls.startsWith('_'))
        .slice(0, 2)
        .join('.');
      if (classes) return \`\${element.tagName.toLowerCase()}.\${classes}\`;
    }
    
    return element.tagName.toLowerCase();
  }

  guessComponentName(element) {
    const testId = element.getAttribute('data-testid');
    if (testId) return testId;
    
    const component = element.getAttribute('data-component');
    if (component) return component;
    
    const className = element.className;
    if (className) {
      const classes = className.split(' ');
      for (const cls of classes) {
        if (/^[A-Z][a-zA-Z]+/.test(cls)) return cls;
      }
    }
    
    return undefined;
  }

  extractProps(element) {
    const props = {};
    
    ['id', 'className', 'type', 'placeholder', 'value', 'href'].forEach(attr => {
      const value = element.getAttribute(attr);
      if (value) props[attr] = value;
    });
    
    return props;
  }

  createOverlay() {
    if (this.overlayContainer) return;
    
    const style = document.createElement('style');
    style.textContent = \`
      .celiador-inspection-overlay {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        pointer-events: none !important;
        z-index: 999999 !important;
      }
      .celiador-element-highlight {
        position: absolute !important;
        border: 2px solid #8b5cf6 !important;
        background: rgba(139, 92, 246, 0.1) !important;
        cursor: pointer !important;
        pointer-events: auto !important;
        transition: all 0.2s ease !important;
        box-sizing: border-box !important;
      }
      .celiador-element-highlight:hover {
        border-color: #7c3aed !important;
        background: rgba(124, 58, 237, 0.2) !important;
        box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.3) !important;
      }
    \`;
    document.head.appendChild(style);
    
    this.overlayContainer = document.createElement('div');
    this.overlayContainer.className = 'celiador-inspection-overlay';
    document.body.appendChild(this.overlayContainer);
    
    this.renderElementHighlights();
  }

  removeOverlay() {
    if (this.overlayContainer) {
      this.overlayContainer.remove();
      this.overlayContainer = null;
    }
  }

  renderElementHighlights() {
    if (!this.overlayContainer) return;
    
    this.overlayContainer.innerHTML = '';
    
    this.elements.forEach(element => {
      const highlight = document.createElement('div');
      highlight.className = 'celiador-element-highlight';
      highlight.style.left = \`\${element.boundingBox.x}px\`;
      highlight.style.top = \`\${element.boundingBox.y}px\`;
      highlight.style.width = \`\${element.boundingBox.width}px\`;
      highlight.style.height = \`\${element.boundingBox.height}px\`;
      
      highlight.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.selectElement(element);
      });
      
      this.overlayContainer.appendChild(highlight);
    });
  }

  selectElement(element) {
    this.selectedElement = element;
    console.log('🎯 Element selected:', element);
    
    // Send selection to parent
    window.parent.postMessage({
      type: 'ELEMENT_SELECTED',
      element: element
    }, '*');
  }

  sendElementsToParent() {
    console.log(\`📡 Sending \${this.elements.length} elements to parent\`);
    window.parent.postMessage({
      type: 'ELEMENTS_MAPPED',
      elements: this.elements
    }, '*');
  }
}

// Initialize inspector
if (!window.celiadorInspector) {
  window.celiadorInspector = new CeliadorInspector();
}
</script>`;

      // Inject before closing </body> tag
      if (html.includes('</body>')) {
        html = html.replace('</body>', `${inspectionScript}\n</body>`);
        console.log('✅ [Preview Proxy] Injected inspection script before </body>');
      } else {
        // If no </body> tag, append to end
        html += inspectionScript;
        console.log('✅ [Preview Proxy] Appended inspection script to HTML');
      }

      return new NextResponse(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
          // Add CORS headers for same-origin
          'X-Frame-Options': 'SAMEORIGIN',
        },
      });
    }

    // For non-HTML content, just proxy it through
    const buffer = await originalResponse.arrayBuffer();
    return new NextResponse(buffer, {
      status: originalResponse.status,
      headers: {
        'Content-Type': contentType,
      },
    });

  } catch (error) {
    console.error('Preview proxy error:', error);
    return NextResponse.json({ 
      error: 'Failed to proxy preview content',
      details: error.message 
    }, { status: 500 });
  }
}