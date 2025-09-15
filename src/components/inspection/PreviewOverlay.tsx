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

    // The injected script automatically sends elements when inspection is enabled,
    // so we don't need to request them separately
    console.log('🔧 Attempting fallback element extraction while waiting for injected script...');
    return extractRealElements(iframe, iframeRect);
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

  // Try to extract meaningful elements from the iframe DOM (limited by CORS)
  const extractRealElements = (iframe: HTMLIFrameElement, iframeRect: DOMRect): UIElement[] => {
    console.log('🔍 Attempting to extract meaningful elements from iframe');
    
    try {
      const iframeDocument = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDocument) {
        console.warn('🚫 Cannot access iframe document due to CORS restrictions');
        return [];
      }
      
      const elements: UIElement[] = [];
      
      // Get meaningful elements in priority order - cast a wide net
      const elementQueries = [
        { selector: 'h1', priority: 1, minSize: 20 },
        { selector: 'h2, h3, h4, h5, h6', priority: 2, minSize: 16 },
        { selector: 'button', priority: 3, minSize: 15 },
        { selector: 'a[href]', priority: 4, minSize: 15 }, 
        { selector: 'input, textarea, select', priority: 5, minSize: 15 },
        { selector: '[role="button"]', priority: 6, minSize: 15 },
        { selector: '.btn, .button, [class*="btn"], [class*="button"]', priority: 7, minSize: 15 },
        { selector: '[onclick], [data-testid], [data-component]', priority: 8, minSize: 15 },
        // Very broad selectors to catch styled elements
        { selector: 'div[class], span[class]', priority: 9, minSize: 40 }, // Any div/span with classes that might be clickable
        { selector: '*[style*="cursor: pointer"], *[style*="cursor:pointer"]', priority: 10, minSize: 20 } // Elements with pointer cursor
      ];
      
      elementQueries.forEach(({ selector, priority, minSize }) => {
        const domElements = iframeDocument.querySelectorAll(selector);
        console.log(`🔍 Found ${domElements.length} elements for selector: ${selector}`);
        
        domElements.forEach((element, index) => {
          const rect = element.getBoundingClientRect();
          const elementText = element.textContent?.trim().substring(0, 30) || '';
          
          console.log(`🔍 Checking element ${selector}[${index}]:`, {
            text: elementText,
            rect: { width: rect.width, height: rect.height, x: rect.x, y: rect.y },
            minSize: minSize,
            passes: rect.width >= minSize && rect.height >= minSize
          });
          
          // Filter out tiny, hidden, or poorly positioned elements
          if (rect.width < minSize || rect.height < minSize) {
            console.log(`❌ Skipping ${elementText}: too small (${rect.width}x${rect.height} < ${minSize})`);
            return;
          }
          
          // More lenient viewport filtering - allow elements slightly off-screen
          const viewportBuffer = 50;
          if (rect.bottom < -viewportBuffer) return; // Too far above
          if (rect.top > iframeDocument.documentElement.scrollHeight + viewportBuffer) return; // Too far below
          if (rect.right < -viewportBuffer) return; // Too far left
          if (rect.left > iframeDocument.documentElement.scrollWidth + viewportBuffer) return; // Too far right
          
          // Skip links that are just icons or very small
          if (element.tagName === 'A') {
            const text = element.textContent?.trim() || '';
            if (text.length < 2) return; // Skip icon-only links
          }
          
          // For broad selectors (div, span), only include likely interactive elements
          if ((element.tagName === 'DIV' || element.tagName === 'SPAN') && priority >= 9) {
            const text = element.textContent?.trim() || '';
            const hasClickableText = text.length > 3 && text.length < 50; // Reasonable text length
            const hasInteractiveClasses = /btn|button|click|link|nav|menu|action|cta|card/i.test(element.className);
            const hasInteractiveStyle = element.style.cursor === 'pointer';
            
            if (!hasClickableText && !hasInteractiveClasses && !hasInteractiveStyle) {
              console.log(`❌ Skipping non-interactive div/span: ${text}`);
              return;
            }
          }
          
          const elementName = getElementName(element);
          const elementProps = extractElementProps(element);
          
          // Calculate position relative to viewport, not adding scroll since we're positioning absolutely
          const absoluteX = iframeRect.left + rect.left;
          const absoluteY = iframeRect.top + rect.top;
          
          // Ensure overlay doesn't extend outside the iframe bounds
          const maxX = iframeRect.right;
          const maxY = iframeRect.bottom;
          
          // Skip elements that start outside the iframe bounds
          if (absoluteX >= maxX || absoluteY >= maxY || absoluteX + rect.width < iframeRect.left || absoluteY + rect.height < iframeRect.top) {
            console.log(`🚫 Skipping element outside iframe bounds: ${elementText} at (${absoluteX}, ${absoluteY})`);
            return;
          }
          
          // Clamp dimensions to iframe bounds
          const clampedWidth = Math.min(rect.width, maxX - absoluteX);
          const clampedHeight = Math.min(rect.height, maxY - absoluteY);
          
          // Skip elements that would be too small after clamping
          if (clampedWidth <= 10 || clampedHeight <= 10) {
            console.log(`🚫 Skipping element too small after clamping: ${elementText}`);
            return;
          }
          
          elements.push({
            id: `${element.tagName.toLowerCase()}_${priority}_${index}`,
            type: element.tagName.toLowerCase(),
            selector: selector,
            componentName: elementName,
            boundingBox: {
              x: absoluteX,
              y: absoluteY,
              width: clampedWidth,
              height: clampedHeight,
            },
            metadata: {
              props: elementProps,
              priority: priority
            }
          });
        });
      });
      
      // Sort by priority and limit to most important elements
      elements.sort((a, b) => (a.metadata?.priority || 10) - (b.metadata?.priority || 10));
      const limitedElements = elements.slice(0, 30); // Max 30 elements with better filtering
      
      console.log(`🎯 Extracted ${limitedElements.length} meaningful elements from iframe`);
      console.log('🎯 Elements found:', limitedElements.map(el => ({ 
        type: el.type, 
        text: el.metadata?.props?.textContent?.substring(0, 20) || el.componentName,
        priority: el.metadata?.priority 
      })));
      return limitedElements;
      
    } catch (error) {
      console.warn('🚫 Error extracting real elements:', error);
      return [];
    }
  };

  // Handle communication with injected inspection script
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Only handle messages from the preview iframe
      if (!previewIframeRef.current || event.source !== previewIframeRef.current.contentWindow) {
        return;
      }

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
            },
            metadata: {
              ...el.metadata,
              fromInjectedScript: true // Mark as from injected script
            }
          }));
          console.log(`🎨 Setting ${processedElements.length} real elements from iframe`);
          
          // Use the elements from the injected script instead of fallback
          setElements(processedElements);
        } else {
          console.log('🔍 No elements received from injected script, keeping existing elements');
        }
      } else if (event.data.type === 'ELEMENT_SELECTED') {
        console.log('🎯 Element selected in iframe:', event.data.element);
        // Handle element selection from iframe
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
        console.log('🚀 Enabling inspection mode in iframe', previewIframeRef.current.src);
        console.log('🚀 Sending ENABLE_INSPECTION message to iframe');
        previewIframeRef.current.contentWindow.postMessage({ type: 'ENABLE_INSPECTION' }, '*');
        
        // Also check if the inspector is available in the iframe
        setTimeout(() => {
          if (previewIframeRef.current?.contentWindow) {
            try {
              const hasInspector = 'celiadorInspector' in previewIframeRef.current.contentWindow;
              console.log('🔍 Inspector availability check:', hasInspector);
            } catch (error) {
              console.log('🔍 Cannot check inspector due to CORS:', error.message);
            }
          }
        }, 1000);
      }

      const updateElements = () => {
        const foundElements = scanIframeElements();
        console.log(`🔍 Fallback scan found ${foundElements.length} elements`);
        
        // Always set fallback elements initially, they'll be replaced if injected script responds
        setElements(prev => {
          // If we already have elements from injected script, don't override
          if (prev.length > 0 && prev[0]?.metadata?.fromInjectedScript) {
            console.log('🎯 Keeping existing elements from injected script');
            return prev;
          }
          // Otherwise use fallback elements
          console.log(`🔄 Using ${foundElements.length} fallback elements`);
          return foundElements;
        });
      };

      // Initial scan with small delay to ensure iframe is ready
      setTimeout(updateElements, 200);

      // Re-scan periodically in case iframe content changes - less frequent since we prioritize injected script
      const interval = setInterval(updateElements, 5000);

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
      className="fixed inset-0 pointer-events-none z-50 overflow-hidden"
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
            minWidth: '20px',
            minHeight: '20px',
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
          {/* Element type indicator */}
          <div className="absolute -top-6 -left-1 bg-purple-600 text-white text-xs px-1 py-0.5 rounded text-center min-w-[20px] font-medium pointer-events-none">
            {element.type.toUpperCase()}
          </div>
          
          {/* Tooltip with element info */}
          {hoveredElement?.id === element.id && (
            <div className="absolute -top-12 left-0 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none z-50 max-w-xs">
              <MousePointer className="inline w-3 h-3 mr-1" />
              <span className="font-medium">{element.componentName || element.type}</span>
              {element.metadata?.props?.textContent && (
                <span className="ml-1 opacity-75">- "{element.metadata.props.textContent.slice(0, 20)}..."</span>
              )}
            </div>
          )}
          
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