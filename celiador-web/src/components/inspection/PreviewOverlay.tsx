'use client';

import { useState, useEffect, useRef } from 'react';
import { MousePointer } from 'lucide-react';

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

interface PreviewOverlayProps {
  isActive: boolean;
  previewIframeRef: React.RefObject<HTMLIFrameElement>;
  onElementSelect: (element: UIElement) => void;
  deviceClasses: string;
}

export function PreviewOverlay({ 
  isActive, 
  previewIframeRef, 
  onElementSelect, 
  deviceClasses 
}: PreviewOverlayProps) {
  const [elements, setElements] = useState<UIElement[]>([]);
  const [hoveredElement, setHoveredElement] = useState<UIElement | null>(null);
  const [mappedElements, setMappedElements] = useState<UIElement[]>([]);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Request elements from injected script and return fallback for immediate display
  const scanIframeElements = (): UIElement[] => {
    if (!previewIframeRef.current) {
      console.warn('❌ No iframe ref available');
      return [];
    }

    const iframe = previewIframeRef.current;
    const iframeRect = iframe.getBoundingClientRect();

    // Request elements from the injected script (async)
    if (iframe.contentWindow) {
      console.log('🔄 Requesting elements from injected inspection script...');
      iframe.contentWindow.postMessage({ type: 'GET_ELEMENTS' }, '*');
    }

    // Return fallback elements for immediate display (will be replaced when real elements arrive)
    console.log('🔧 Using fallback elements while waiting for real element data...');
    return createFallbackElements(iframe, iframeRect);
  };

  // Get a smart name for the element
  const getElementName = (element: Element): string => {
    // Try data attributes first
    const testId = element.getAttribute('data-testid');
    if (testId) return testId;
    
    // Try common React patterns
    const className = element.className;
    if (className) {
      const classes = className.split(' ');
      for (const cls of classes) {
        if (/^[A-Z][a-zA-Z]+/.test(cls)) return cls; // PascalCase
      }
    }
    
    // Use text content for buttons/links
    if (element.tagName === 'BUTTON' || element.tagName === 'A') {
      const text = element.textContent?.trim();
      if (text && text.length < 20) {
        return text.replace(/\s+/g, '') + 'Button';
      }
    }
    
    // Use heading text
    if (element.tagName.match(/^H[1-6]$/)) {
      const text = element.textContent?.trim();
      if (text && text.length < 30) {
        return text.replace(/\s+/g, '') + 'Heading';
      }
    }
    
    // Default to tag name
    return element.tagName.toLowerCase();
  };

  // Extract useful properties from the element
  const extractElementProps = (element: Element): Record<string, any> => {
    const props: Record<string, any> = {};
    
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
  };

  // Fallback: create reasonable mock elements when CORS blocks iframe access
  const createFallbackElements = (iframe: HTMLIFrameElement, iframeRect: DOMRect): UIElement[] => {
    console.log('🔧 Creating fallback elements due to CORS restrictions');
    
    // Create elements based on typical Next.js starter page layout
    const elements: UIElement[] = [
      {
        id: 'title-heading',
        type: 'h1',
        selector: 'h1',
        componentName: 'WelcomeHeading',
        boundingBox: {
          x: iframeRect.left + 40,
          y: iframeRect.top + 180,
          width: 300,
          height: 80,
        }
      },
      {
        id: 'learn-nextjs-button',
        type: 'a',
        selector: 'a[href*="nextjs"]',
        componentName: 'LearnNextjsButton',
        boundingBox: {
          x: iframeRect.left + 40,
          y: iframeRect.top + 340,
          width: 140,
          height: 36,
        }
      },
      {
        id: 'deploy-button',
        type: 'a', 
        selector: 'a[href*="vercel"]',
        componentName: 'DeployButton',
        boundingBox: {
          x: iframeRect.left + 200,
          y: iframeRect.top + 340,
          width: 120,
          height: 36,
        }
      },
      {
        id: 'docs-section',
        type: 'div',
        selector: '.grid',
        componentName: 'DocsSection',
        boundingBox: {
          x: iframeRect.left + 20,
          y: iframeRect.top + 400,
          width: iframeRect.width - 40,
          height: 100,
        }
      }
    ];

    return elements;
  };

  // Handle communication with injected inspection script
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'ELEMENTS_MAPPED') {
        console.log('🎯 Received elements from injected script:', event.data.elements);
        setMappedElements(event.data.elements);
        
        // Process the received elements and convert to display coordinates
        if (previewIframeRef.current && event.data.elements?.length > 0) {
          const iframeRect = previewIframeRef.current.getBoundingClientRect();
          const processedElements = event.data.elements.map((el: UIElement) => ({
            ...el,
            boundingBox: {
              x: iframeRect.left + el.boundingBox.x,
              y: iframeRect.top + el.boundingBox.y,
              width: el.boundingBox.width,
              height: el.boundingBox.height,
            }
          }));
          console.log(`🎨 Setting ${processedElements.length} real elements from iframe`);
          
          // Smooth transition for element updates
          setElements(prev => {
            // If this is the first load, set immediately
            if (prev.length === 0) {
              return processedElements;
            }
            // For updates, we could add animation logic here
            return processedElements;
          });
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [previewIframeRef]);

  // Update elements when iframe position changes or inspection is activated
  useEffect(() => {
    if (isActive) {
      // Enable inspection in the injected script
      if (previewIframeRef.current?.contentWindow) {
        console.log('🚀 Enabling inspection mode in iframe');
        previewIframeRef.current.contentWindow.postMessage({ type: 'ENABLE_INSPECTION' }, '*');
      }

      const updateElements = () => {
        const foundElements = scanIframeElements();
        setElements(foundElements);
      };

      // Initial scan with small delay to ensure iframe is ready
      setTimeout(updateElements, 200);

      // Re-scan periodically in case iframe content changes
      const interval = setInterval(updateElements, 2000);

      // Update on scroll/resize to maintain positioning
      const handleUpdate = () => {
        setTimeout(updateElements, 100);
      };

      window.addEventListener('scroll', handleUpdate);
      window.addEventListener('resize', handleUpdate);

      return () => {
        clearInterval(interval);
        window.removeEventListener('scroll', handleUpdate);
        window.removeEventListener('resize', handleUpdate);
      };
    } else {
      // Disable inspection in the injected script
      if (previewIframeRef.current?.contentWindow) {
        console.log('🛑 Disabling inspection mode in iframe');
        previewIframeRef.current.contentWindow.postMessage({ type: 'DISABLE_INSPECTION' }, '*');
      }
      
      setElements([]);
      setMappedElements([]);
    }
  }, [isActive, previewIframeRef]);

  if (!isActive) {
    return null;
  }

  return (
    <div 
      ref={overlayRef}
      className="fixed inset-0 pointer-events-none z-50"
    >
      {elements.map((element) => (
        <div
          key={element.id}
          className={`absolute border-2 border-purple-500 bg-purple-500/10 cursor-pointer transition-all duration-200 ease-out hover:border-purple-600 hover:bg-purple-600/20 hover:shadow-lg ${
            hoveredElement?.id === element.id ? 'ring-2 ring-purple-300' : ''
          }`}
          style={{
            left: element.boundingBox.x,
            top: element.boundingBox.y,
            width: element.boundingBox.width,
            height: element.boundingBox.height,
            pointerEvents: 'auto',
          }}
          onMouseEnter={() => setHoveredElement(element)}
          onMouseLeave={() => setHoveredElement(null)}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🎯 Element selected from overlay:', element);
            onElementSelect(element);
          }}
        >
          {/* Tooltip */}
          <div className="absolute -top-8 left-0 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none">
            <MousePointer className="inline w-3 h-3 mr-1" />
            {element.componentName || element.type}
          </div>
          
          {/* Selection indicator */}
          {hoveredElement?.id === element.id && (
            <div className="absolute inset-0 border-2 border-purple-400 bg-purple-400/20 animate-pulse" />
          )}
        </div>
      ))}
      
      {/* Instruction overlay */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg pointer-events-none">
        <MousePointer className="inline w-4 h-4 mr-2" />
        Click on any element to modify it
      </div>
    </div>
  );
}