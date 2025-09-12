// Celiador Inspection Client
// This script gets injected into preview iframes to enable element inspection
(function() {
  'use strict';
  
  console.log('🔍 Celiador Inspection Client loaded');

  let isInspectionActive = false;
  let highlightOverlay = null;
  let resizeObserver = null;
  let mutationObserver = null;
  let lastMappedElements = [];

  // Create highlighting overlay
  function createHighlightOverlay() {
    if (highlightOverlay) return highlightOverlay;
    
    highlightOverlay = document.createElement('div');
    highlightOverlay.style.cssText = `
      position: absolute;
      pointer-events: none;
      border: 2px solid #8b5cf6;
      background: rgba(139, 92, 246, 0.1);
      z-index: 9999;
      transition: all 0.2s ease;
      display: none;
    `;
    document.body.appendChild(highlightOverlay);
    return highlightOverlay;
  }

  // Get all interactive elements
  function getSelectableElements() {
    const selectors = [
      'button',
      'input',
      'textarea', 
      'select',
      'a[href]',
      '[onclick]',
      '[role="button"]',
      '.btn',
      '.button',
      '[data-testid]',
      'nav',
      'header',
      'footer',
      'main',
      'h1, h2, h3, h4, h5, h6',
      'section',
      'article',
      'div[class*="card"]',
      'div[class*="container"]',
      'form'
    ];
    
    const elements = document.querySelectorAll(selectors.join(', '));
    const result = [];
    
    elements.forEach((el, index) => {
      const rect = el.getBoundingClientRect();
      
      // Skip tiny or invisible elements
      if (rect.width < 10 || rect.height < 10) return;
      
      // Skip elements outside viewport
      if (rect.bottom < 0 || rect.top > window.innerHeight || 
          rect.right < 0 || rect.left > window.innerWidth) return;
      
      result.push({
        id: `celiador-element-${index}`,
        element: el,
        type: el.tagName.toLowerCase(),
        selector: generateSelector(el),
        componentName: guessComponentName(el),
        boundingBox: {
          x: rect.left + window.scrollX,
          y: rect.top + window.scrollY,
          width: rect.width,
          height: rect.height,
        },
        metadata: {
          props: extractProps(el),
          textContent: el.textContent?.trim() || '',
          className: el.className,
          // Enhanced source mapping
          sourceFile: el.getAttribute('data-source-file'),
          sourceLine: el.getAttribute('data-source-line'),
          sourceColumn: el.getAttribute('data-source-column'),
          inspectionId: el.getAttribute('data-inspection-id') || el.getAttribute('data-celiador-id'),
          // Additional debug info
          attributes: Array.from(el.attributes).reduce((acc, attr) => {
            if (attr.name.startsWith('data-celiador-') || attr.name.startsWith('data-source-')) {
              acc[attr.name] = attr.value;
            }
            return acc;
          }, {})
        }
      });
    });
    
    console.log(`🔍 Found ${result.length} selectable elements`);
    return result;
  }

  // Generate CSS selector for element
  function generateSelector(element) {
    if (element.id) {
      return `#${element.id}`;
    }
    
    if (element.className) {
      const classes = element.className.split(' ')
        .filter(cls => cls && !cls.startsWith('_'))
        .slice(0, 2)
        .join('.');
      if (classes) {
        return `${element.tagName.toLowerCase()}.${classes}`;
      }
    }
    
    return element.tagName.toLowerCase();
  }

  // Guess component name
  function guessComponentName(element) {
    const testId = element.getAttribute('data-testid');
    if (testId) return testId;
    
    const className = element.className;
    if (className) {
      const classes = className.split(' ');
      for (const cls of classes) {
        if (/^[A-Z][a-zA-Z]+/.test(cls)) {
          return cls;
        }
      }
    }
    
    if (element.tagName === 'BUTTON') {
      const text = element.textContent?.trim();
      if (text && text.length < 20) {
        return `${text.replace(/\s+/g, '')}Button`;
      }
    }
    
    if (element.tagName.match(/^H[1-6]$/)) {
      const text = element.textContent?.trim();
      if (text && text.length < 30) {
        return `${text.replace(/\s+/g, '')}Heading`;
      }
    }
    
    return element.tagName.toLowerCase();
  }

  // Extract element properties
  function extractProps(element) {
    const props = {};
    
    ['id', 'className', 'type', 'placeholder', 'value', 'href', 'src', 'alt'].forEach(attr => {
      const value = element.getAttribute(attr);
      if (value) props[attr] = value;
    });
    
    // Add text content for small elements
    const text = element.textContent?.trim();
    if (text && text.length < 50) {
      props.textContent = text;
    }
    
    return props;
  }

  // Mouse move handler for highlighting
  function handleMouseMove(e) {
    if (!isInspectionActive) return;
    
    const element = e.target;
    if (!element || element === document.body || element === document.documentElement) return;
    
    const rect = element.getBoundingClientRect();
    const overlay = createHighlightOverlay();
    
    overlay.style.display = 'block';
    overlay.style.left = (rect.left + window.scrollX) + 'px';
    overlay.style.top = (rect.top + window.scrollY) + 'px';
    overlay.style.width = rect.width + 'px';
    overlay.style.height = rect.height + 'px';
  }

  // Click handler for element selection
  function handleClick(e) {
    if (!isInspectionActive) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const element = e.target;
    const elements = getSelectableElements();
    const selectedElement = elements.find(el => el.element === element);
    
    if (selectedElement) {
      console.log('🎯 Element selected:', selectedElement);
      
      // Send selection to parent window
      window.parent.postMessage({
        type: 'ELEMENT_SELECTED',
        element: {
          id: selectedElement.id,
          type: selectedElement.type,
          selector: selectedElement.selector,
          componentName: selectedElement.componentName,
          boundingBox: selectedElement.boundingBox,
          metadata: selectedElement.metadata
        }
      }, '*');
    }
  }

  // Dynamic element mapping - updates when page changes
  function mapElements() {
    const elements = getSelectableElements().map(el => ({
      id: el.id,
      type: el.type,
      selector: el.selector,
      componentName: el.componentName,
      boundingBox: el.boundingBox,
      metadata: el.metadata
    }));
    
    lastMappedElements = elements;
    
    window.parent.postMessage({
      type: 'ELEMENTS_MAPPED',
      elements: elements
    }, '*');
  }

  // Setup dynamic monitoring for layout changes
  function startDynamicMonitoring() {
    // Watch for DOM mutations (content changes)
    if (mutationObserver) mutationObserver.disconnect();
    mutationObserver = new MutationObserver((mutations) => {
      let shouldRemap = false;
      mutations.forEach(mutation => {
        if (mutation.type === 'childList' || 
            mutation.type === 'attributes' || 
            mutation.type === 'characterData') {
          shouldRemap = true;
        }
      });
      if (shouldRemap && isInspectionActive) {
        console.log('🔄 DOM changed, remapping elements');
        setTimeout(mapElements, 100); // Debounce
      }
    });
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true
    });

    // Watch for window resize/layout changes
    if (resizeObserver) resizeObserver.disconnect();
    resizeObserver = new ResizeObserver((entries) => {
      if (isInspectionActive) {
        console.log('📐 Layout changed, remapping elements');
        setTimeout(mapElements, 50); // Quick response for resize
      }
    });
    resizeObserver.observe(document.body);

    // Also listen for window resize
    window.addEventListener('resize', () => {
      if (isInspectionActive) {
        setTimeout(mapElements, 50);
      }
    });
  }

  // Stop dynamic monitoring
  function stopDynamicMonitoring() {
    if (mutationObserver) {
      mutationObserver.disconnect();
      mutationObserver = null;
    }
    if (resizeObserver) {
      resizeObserver.disconnect(); 
      resizeObserver = null;
    }
  }

  // Enable inspection mode
  function enableInspection() {
    if (isInspectionActive) return;
    
    console.log('🚀 Enabling inspection mode');
    isInspectionActive = true;
    
    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('click', handleClick, true);
    
    // Start dynamic monitoring
    startDynamicMonitoring();
    
    // Initial element mapping
    mapElements();
  }

  // Disable inspection mode
  function disableInspection() {
    if (!isInspectionActive) return;
    
    console.log('🛑 Disabling inspection mode');
    isInspectionActive = false;
    
    // Remove event listeners
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('click', handleClick, true);
    
    // Stop dynamic monitoring
    stopDynamicMonitoring();
    
    // Hide overlay
    if (highlightOverlay) {
      highlightOverlay.style.display = 'none';
    }
    
    // Clear cached elements
    lastMappedElements = [];
  }

  // Listen for messages from parent window
  window.addEventListener('message', (event) => {
    if (event.data.type === 'ENABLE_INSPECTION') {
      enableInspection();
    } else if (event.data.type === 'DISABLE_INSPECTION') {
      disableInspection();
    } else if (event.data.type === 'GET_ELEMENTS') {
      // Send current elements to parent
      const elements = getSelectableElements().map(el => ({
        id: el.id,
        type: el.type,
        selector: el.selector,
        componentName: el.componentName,
        boundingBox: el.boundingBox,
        metadata: el.metadata
      }));
      
      window.parent.postMessage({
        type: 'ELEMENTS_MAPPED',
        elements: elements
      }, '*');
    }
  });

  // Make functions available globally for debugging
  window.celiadorInspection = {
    enable: enableInspection,
    disable: disableInspection,
    getElements: getSelectableElements,
    isActive: () => isInspectionActive
  };

  console.log('🔍 Celiador Inspection Client ready');
})();