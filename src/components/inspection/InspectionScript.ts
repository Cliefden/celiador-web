// DISABLED: Inspection script completely disabled to prevent CORS errors
// This script was causing cross-origin violations when injected into preview iframe

console.log('🚫 CeliadorInspector disabled to prevent CORS errors');

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
    console.log('🚫 CeliadorInspector constructor disabled');
    // All functionality disabled to prevent CORS errors
  }

  private setupMessageListener(): void {
    console.log('🚫 setupMessageListener disabled to prevent CORS errors');
    // Message listener disabled to avoid cross-origin violations
  }

  private setupStyleOverrides(): void {
    console.log('🚫 setupStyleOverrides disabled to prevent CORS errors');
    // Style injection disabled to avoid DOM manipulation
  }

  private enableInspection(): void {
    console.log('🚫 enableInspection disabled to prevent CORS errors');
    // All inspection functionality disabled to avoid DOM access
  }

  private disableInspection(): void {
    console.log('🚫 disableInspection disabled to prevent CORS errors');
    // All inspection functionality disabled
  }

  private mapDOMElements(): void {
    console.log('🚫 mapDOMElements disabled to prevent CORS errors');
    // DOM element mapping disabled to avoid getBoundingClientRect and querySelectorAll calls
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
    console.log('🚫 selectElement disabled to prevent CORS errors');
    // Element selection and postMessage disabled to avoid cross-origin violations
  }

  private sendElementsToParent(): void {
    console.log('🚫 sendElementsToParent disabled to prevent CORS errors');
    // postMessage disabled to avoid cross-origin violations
  }
}

// DISABLED: Inspector initialization completely disabled to prevent CORS errors
console.log('🚫 CeliadorInspector initialization disabled to prevent CORS errors');

// Mock inspector for compatibility
window.celiadorInspector = {
  isEnabled: false,
  enableInspection: () => console.log('🚫 Inspector disabled'),
  disableInspection: () => console.log('🚫 Inspector disabled')
} as any;

// Add to window for external access
declare global {
  interface Window {
    celiadorInspector: CeliadorInspector;
  }
}

export {};