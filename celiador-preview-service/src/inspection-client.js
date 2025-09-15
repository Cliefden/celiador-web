// Inspection script that gets injected into the preview iframe
// This script enables UI element detection and selection

class CeliadorInspector {
  constructor() {
    this.isEnabled = false;
    this.overlayContainer = null;
    this.elements = [];
    this.hoveredElement = null;
    this.selectedElement = null;
    
    this.setupMessageListener();
    this.setupStyleOverrides();
    
    // Add debug logging
    console.log('[CeliadorInspector] Inspector initialized');
  }

  setupMessageListener() {
    console.log('[CeliadorInspector] Setting up message listener');
    window.addEventListener('message', (event) => {
      console.log('[CeliadorInspector] Received message:', event.data);
      
      if (event.data.type === 'ENABLE_INSPECTION') {
        console.log('[CeliadorInspector] Enabling inspection');
        this.enableInspection();
      } else if (event.data.type === 'DISABLE_INSPECTION') {
        console.log('[CeliadorInspector] Disabling inspection');
        this.disableInspection();
      }
    });
  }

  setupStyleOverrides() {
    // Inject CSS for inspection overlay
    const style = document.createElement('style');
    style.textContent = `
      .celiador-inspection-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 9999;
        overflow: hidden;
      }
      
      .celiador-element-highlight {
        position: absolute;
        border: 2px solid #8b5cf6;
        background: rgba(139, 92, 246, 0.1);
        cursor: pointer;
        pointer-events: auto;
        transition: all 0.2s ease;
        box-sizing: border-box;
      }
      
      .celiador-element-highlight:hover {
        border-color: #7c3aed;
        background: rgba(124, 58, 237, 0.2);
        box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.3);
      }
      
      .celiador-element-highlight.selected {
        border-color: #fbbf24;
        background: rgba(251, 191, 36, 0.2);
        box-shadow: 0 0 0 2px rgba(251, 191, 36, 0.5);
      }
      
      .celiador-element-tooltip {
        position: absolute;
        top: -24px;
        left: 0;
        background: #1f2937;
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-family: system-ui, sans-serif;
        white-space: nowrap;
        pointer-events: none;
        z-index: 10000;
      }
      
      .celiador-element-tooltip::before {
        content: '';
        position: absolute;
        top: 100%;
        left: 8px;
        border: 4px solid transparent;
        border-top-color: #1f2937;
      }
    `;
    document.head.appendChild(style);
    console.log('[CeliadorInspector] Styles injected');
  }

  enableInspection() {
    if (this.isEnabled) {
      console.log('[CeliadorInspector] Inspection already enabled');
      return;
    }
    
    console.log('[CeliadorInspector] Enabling inspection mode');
    this.isEnabled = true;
    this.mapDOMElements();
    this.createOverlay();
    this.sendElementsToParent();
  }

  disableInspection() {
    if (!this.isEnabled) {
      console.log('[CeliadorInspector] Inspection already disabled');
      return;
    }
    
    console.log('[CeliadorInspector] Disabling inspection mode');
    this.isEnabled = false;
    this.removeOverlay();
    this.elements = [];
    this.hoveredElement = null;
    this.selectedElement = null;
  }

  mapDOMElements() {
    this.elements = [];
    console.log(`[CeliadorInspector] Starting element mapping on page:`, {
      title: document.title,
      url: window.location.href,
      documentReady: document.readyState,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      scroll: { x: window.scrollX, y: window.scrollY },
      bodySize: { width: document.body?.scrollWidth, height: document.body?.scrollHeight }
    });
    
    // Find meaningful elements in priority order - broader detection
    const priorityElements = [
      { selector: 'h1', priority: 1, minSize: 20 },
      { selector: 'h2, h3, h4, h5, h6', priority: 2, minSize: 16 },
      { selector: 'button', priority: 3, minSize: 15 },
      { selector: '.btn, .button, [role="button"]', priority: 4, minSize: 15 },
      { selector: 'input, textarea, select', priority: 5, minSize: 15 },
      { selector: 'a[href]', priority: 6, minSize: 15 }, // Much lower threshold
      { selector: '[data-testid], [data-component]', priority: 7, minSize: 15 },
      { selector: '[class*="btn"], [class*="button"]', priority: 8, minSize: 15 }, // Catch styled buttons
      { selector: 'div[class], span[class]', priority: 9, minSize: 30 }, // Styled interactive elements
      { selector: '*[onclick], *[style*="cursor: pointer"]', priority: 10, minSize: 20 } // Interactive elements
    ];

    priorityElements.forEach(({ selector, priority, minSize }) => {
      const elements = document.querySelectorAll(selector);
      console.log(`[CeliadorInspector] Found ${elements.length} ${selector} elements`);
      
      elements.forEach((el, index) => {
        const rect = el.getBoundingClientRect();
        console.log(`[CeliadorInspector] Element ${selector}[${index}]:`, {
          element: el,
          rect: { width: rect.width, height: rect.height, top: rect.top, left: rect.left },
          text: el.textContent?.trim().substring(0, 30),
          minSize,
          passesSize: rect.width >= minSize && rect.height >= minSize,
          passesViewport: rect.bottom >= 0 && rect.top <= window.innerHeight && rect.right >= 0 && rect.left <= window.innerWidth
        });
        
        // Apply size and visibility filters
        if (rect.width < minSize || rect.height < minSize) {
          console.log(`[CeliadorInspector] Skipping ${selector}[${index}] - too small: ${rect.width}x${rect.height} < ${minSize}`);
          return;
        }
        
        // Better viewport filtering with buffer
        const viewportBuffer = 50;
        if (rect.bottom < -viewportBuffer || rect.top > window.innerHeight + viewportBuffer || 
            rect.right < -viewportBuffer || rect.left > window.innerWidth + viewportBuffer) {
          console.log(`[CeliadorInspector] Skipping ${selector}[${index}] - outside viewport with buffer`);
          return;
        }
            
        // Additional filtering for links
        if (el.tagName === 'A') {
          const text = el.textContent?.trim() || '';
          if (text.length < 2) return; // Relaxed from 3 to 2 chars
          if (el.getAttribute('href') === '#') return; // Skip placeholder links
        }
        
        // Skip nested buttons/links inside other buttons/links
        const isNested = el.closest('button, .btn, .button, [role="button"]') !== el && 
                         el.tagName !== 'BUTTON' && !el.classList.contains('btn');
        if (isNested) return;
        
        // For broad selectors (div, span), only include likely interactive elements
        if ((el.tagName === 'DIV' || el.tagName === 'SPAN') && priority >= 9) {
          const text = el.textContent?.trim() || '';
          const hasClickableText = text.length > 3 && text.length < 50; // Reasonable text length
          const hasInteractiveClasses = /btn|button|click|link|nav|menu|action|cta|card/i.test(el.className);
          const hasInteractiveStyle = el.style.cursor === 'pointer' || getComputedStyle(el).cursor === 'pointer';
          
          if (!hasClickableText && !hasInteractiveClasses && !hasInteractiveStyle) {
            console.log(`[CeliadorInspector] Skipping non-interactive div/span: "${text.substring(0, 30)}"`);
            return;
          }
        }

        const element = {
          id: `celiador-${el.tagName.toLowerCase()}-${priority}-${index}`,
          type: el.tagName.toLowerCase(),
          selector: this.generateSelector(el),
          componentName: this.guessComponentName(el),
          boundingBox: {
            x: Math.max(0, rect.left + window.scrollX), // Don't allow negative positions
            y: Math.max(0, rect.top + window.scrollY),
            width: Math.min(rect.width, Math.min(400, window.innerWidth - rect.left)), // Clamp to viewport
            height: Math.min(rect.height, Math.min(200, window.innerHeight - rect.top)),
          },
          metadata: {
            props: this.extractProps(el),
            priority: priority,
            textContent: el.textContent?.trim().substring(0, 50) || ''
          }
        };

        this.elements.push(element);
      });
    });
    
    // Sort by priority and limit to reasonable number
    this.elements.sort((a, b) => (a.metadata.priority || 10) - (b.metadata.priority || 10));
    this.elements = this.elements.slice(0, 30); // Max 30 elements with better filtering
    
    console.log(`[CeliadorInspector] Mapped ${this.elements.length} meaningful elements for inspection`);
    console.log('[CeliadorInspector] Elements found:', this.elements.map(el => ({ 
      type: el.type, 
      text: el.metadata?.textContent?.substring(0, 20) || el.componentName,
      priority: el.metadata?.priority 
    })));
  }

  generateSelector(element) {
    // Generate a CSS selector for the element
    if (element.id) {
      return `#${element.id}`;
    }
    
    if (element.className) {
      const classes = element.className.split(' ')
        .filter(cls => cls && !cls.startsWith('_')) // Filter out CSS modules
        .slice(0, 2) // Take first 2 classes
        .join('.');
      if (classes) {
        return `${element.tagName.toLowerCase()}.${classes}`;
      }
    }
    
    // Fallback to tag name with nth-child
    const parent = element.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(child => 
        child.tagName === element.tagName
      );
      const index = siblings.indexOf(element);
      return `${element.tagName.toLowerCase()}:nth-child(${index + 1})`;
    }
    
    return element.tagName.toLowerCase();
  }

  guessComponentName(element) {
    // Try to guess React component name from various attributes
    const testId = element.getAttribute('data-testid');
    if (testId) return testId;
    
    const component = element.getAttribute('data-component');
    if (component) return component;
    
    // Look for common React patterns in class names
    const className = element.className;
    if (className) {
      const classes = className.split(' ');
      for (const cls of classes) {
        // Look for PascalCase class names (likely component names)
        if (/^[A-Z][a-zA-Z]+/.test(cls)) {
          return cls;
        }
      }
    }
    
    // Fallback based on element type and context
    if (element.tagName === 'BUTTON') {
      const text = element.textContent?.trim();
      if (text && text.length < 20) {
        return `${text}Button`;
      }
    }
    
    return undefined;
  }

  extractProps(element) {
    const props = {};
    
    // Extract common attributes
    ['id', 'className', 'type', 'placeholder', 'value', 'href'].forEach(attr => {
      const value = element.getAttribute(attr);
      if (value) props[attr] = value;
    });
    
    // Extract data attributes
    Array.from(element.attributes).forEach(attr => {
      if (attr.name.startsWith('data-')) {
        props[attr.name] = attr.value;
      }
    });
    
    return props;
  }

  createOverlay() {
    if (this.overlayContainer) return;
    
    console.log('[CeliadorInspector] Creating overlay with', this.elements.length, 'elements');
    this.overlayContainer = document.createElement('div');
    this.overlayContainer.className = 'celiador-inspection-overlay';
    document.body.appendChild(this.overlayContainer);
    
    this.renderElementHighlights();
  }

  removeOverlay() {
    if (this.overlayContainer) {
      console.log('[CeliadorInspector] Removing overlay');
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
      highlight.style.left = `${element.boundingBox.x}px`;
      highlight.style.top = `${element.boundingBox.y}px`;
      highlight.style.width = `${element.boundingBox.width}px`;
      highlight.style.height = `${element.boundingBox.height}px`;
      
      if (this.selectedElement && this.selectedElement.id === element.id) {
        highlight.classList.add('selected');
      }
      
      // Add element type indicator
      const typeIndicator = document.createElement('div');
      typeIndicator.className = 'celiador-element-type';
      typeIndicator.textContent = element.type.toUpperCase();
      typeIndicator.style.cssText = `
        position: absolute;
        top: -20px;
        left: -1px;
        background: #8b5cf6;
        color: white;
        font-size: 10px;
        font-weight: bold;
        padding: 2px 6px;
        border-radius: 3px;
        font-family: system-ui, sans-serif;
        z-index: 10001;
        pointer-events: none;
        min-width: 20px;
        text-align: center;
      `;
      highlight.appendChild(typeIndicator);
      
      // Add detailed tooltip on hover
      const tooltip = document.createElement('div');
      tooltip.className = 'celiador-element-tooltip';
      tooltip.style.display = 'none';
      tooltip.innerHTML = `
        <strong>${element.componentName || element.type}</strong>
        ${element.metadata.textContent ? `<br>"${element.metadata.textContent}"` : ''}
      `;
      highlight.appendChild(tooltip);
      
      // Add event listeners
      highlight.addEventListener('mouseenter', () => {
        this.hoveredElement = element;
        tooltip.style.display = 'block';
      });
      
      highlight.addEventListener('mouseleave', () => {
        this.hoveredElement = null;
        tooltip.style.display = 'none';
      });
      
      highlight.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('[CeliadorInspector] Element selected:', element);
        this.selectElement(element);
      });
      
      this.overlayContainer.appendChild(highlight);
    });
    
    console.log(`[CeliadorInspector] Rendered ${this.elements.length} element highlights`);
  }

  selectElement(element) {
    this.selectedElement = element;
    this.renderElementHighlights(); // Re-render to show selection
    
    // Send selection to parent
    console.log('[CeliadorInspector] Sending element selection to parent:', element);
    window.parent.postMessage({
      type: 'ELEMENT_SELECTED',
      element: element
    }, '*');
  }

  sendElementsToParent() {
    console.log('[CeliadorInspector] Sending elements to parent:', this.elements.length);
    window.parent.postMessage({
      type: 'ELEMENTS_MAPPED',
      elements: this.elements
    }, '*');
  }
}

// Initialize inspector when DOM is ready
function initializeInspector() {
  console.log('[CeliadorInspector] Initializing inspector...');
  window.celiadorInspector = new CeliadorInspector();
  console.log('[CeliadorInspector] Inspector available at window.celiadorInspector');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeInspector);
} else {
  initializeInspector();
}