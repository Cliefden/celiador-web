// Inspection script that gets injected into the preview iframe
// This script enables UI element detection and selection

interface UIElement {
  id: string;
  type: string;
  selector: string;
  componentName?: string;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  metadata?: {
    filePath?: string;
    lineNumber?: number;
    props?: Record<string, any>;
  };
}

class CeliadorInspector {
  private isEnabled = false;
  private overlayContainer: HTMLDivElement | null = null;
  private elements: UIElement[] = [];
  private hoveredElement: UIElement | null = null;
  private selectedElement: UIElement | null = null;

  constructor() {
    this.setupMessageListener();
    this.setupStyleOverrides();
  }

  private setupMessageListener(): void {
    window.addEventListener('message', (event) => {
      if (event.data.type === 'ENABLE_INSPECTION') {
        this.enableInspection();
      } else if (event.data.type === 'DISABLE_INSPECTION') {
        this.disableInspection();
      }
    });
  }

  private setupStyleOverrides(): void {
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
  }

  private enableInspection(): void {
    if (this.isEnabled) return;
    
    this.isEnabled = true;
    this.mapDOMElements();
    this.createOverlay();
    this.sendElementsToParent();
  }

  private disableInspection(): void {
    if (!this.isEnabled) return;
    
    this.isEnabled = false;
    this.removeOverlay();
    this.elements = [];
    this.hoveredElement = null;
    this.selectedElement = null;
  }

  private mapDOMElements(): void {
    this.elements = [];
    
    // Find all interactive/significant elements
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
      '[data-component]',
      'nav',
      'header',
      'footer',
      'main',
      'section',
      'article',
      'aside',
      'div[class*="container"]',
      'div[class*="wrapper"]',
      'div[class*="card"]',
      'div[class*="modal"]',
      'form'
    ];

    const elements = document.querySelectorAll(selectors.join(', '));
    
    elements.forEach((el, index) => {
      const rect = el.getBoundingClientRect();
      
      // Skip tiny or invisible elements
      if (rect.width < 10 || rect.height < 10) return;
      
      // Skip elements that are completely outside viewport
      if (rect.bottom < 0 || rect.top > window.innerHeight || 
          rect.right < 0 || rect.left > window.innerWidth) return;

      const element: UIElement = {
        id: `celiador-element-${index}`,
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
          props: this.extractProps(el)
        }
      };

      this.elements.push(element);
    });
  }

  private generateSelector(element: Element): string {
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

  private guessComponentName(element: Element): string | undefined {
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

  private extractProps(element: Element): Record<string, any> {
    const props: Record<string, any> = {};
    
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

  private createOverlay(): void {
    if (this.overlayContainer) return;
    
    this.overlayContainer = document.createElement('div');
    this.overlayContainer.className = 'celiador-inspection-overlay';
    document.body.appendChild(this.overlayContainer);
    
    this.renderElementHighlights();
  }

  private removeOverlay(): void {
    if (this.overlayContainer) {
      this.overlayContainer.remove();
      this.overlayContainer = null;
    }
  }

  private renderElementHighlights(): void {
    if (!this.overlayContainer) return;
    
    this.overlayContainer.innerHTML = '';
    
    this.elements.forEach(element => {
      const highlight = document.createElement('div');
      highlight.className = 'celiador-element-highlight';
      highlight.style.left = `${element.boundingBox.x}px`;
      highlight.style.top = `${element.boundingBox.y}px`;
      highlight.style.width = `${element.boundingBox.width}px`;
      highlight.style.height = `${element.boundingBox.height}px`;
      
      if (this.selectedElement?.id === element.id) {
        highlight.classList.add('selected');
      }
      
      // Add tooltip
      const tooltip = document.createElement('div');
      tooltip.className = 'celiador-element-tooltip';
      tooltip.textContent = element.componentName || element.type;
      highlight.appendChild(tooltip);
      
      // Add event listeners
      highlight.addEventListener('mouseenter', () => {
        this.hoveredElement = element;
      });
      
      highlight.addEventListener('mouseleave', () => {
        this.hoveredElement = null;
      });
      
      highlight.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.selectElement(element);
      });
      
      this.overlayContainer!.appendChild(highlight);
    });
  }

  private selectElement(element: UIElement): void {
    this.selectedElement = element;
    this.renderElementHighlights(); // Re-render to show selection
    
    // Send selection to parent
    window.parent.postMessage({
      type: 'ELEMENT_SELECTED',
      element: element
    }, '*');
  }

  private sendElementsToParent(): void {
    window.parent.postMessage({
      type: 'ELEMENTS_MAPPED',
      elements: this.elements
    }, '*');
  }
}

// Initialize inspector when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.celiadorInspector = new CeliadorInspector();
  });
} else {
  window.celiadorInspector = new CeliadorInspector();
}

// Add to window for external access
declare global {
  interface Window {
    celiadorInspector: CeliadorInspector;
  }
}

export {};