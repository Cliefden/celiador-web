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

  // Use conditional rendering at the end instead of early return
  // This ensures hooks are always called in the same order

  // Create mock elements based on common UI patterns when CORS blocks real detection
  const createMockElements = (iframeRect: DOMRect): UIElement[] => {
    console.log('🎯 Creating mock elements for cross-origin preview');
    
    // Create realistic element positions for a typical e-commerce layout
    const mockElements: UIElement[] = [];
    
    // Top navigation buttons (search, favorites, cart)
    mockElements.push({
      id: 'mock-search-btn',
      type: 'button',
      selector: 'button.search',
      componentName: 'SearchButton',
      boundingBox: {
        x: iframeRect.left + 186,
        y: iframeRect.top + 40,
        width: 40,
        height: 40
      },
      metadata: { props: { mockElement: true, type: 'search' } }
    });

    mockElements.push({
      id: 'mock-favorites-btn', 
      type: 'button',
      selector: 'button.favorites',
      componentName: 'FavoritesButton',
      boundingBox: {
        x: iframeRect.left + 240,
        y: iframeRect.top + 40,
        width: 40,
        height: 40
      },
      metadata: { props: { mockElement: true, type: 'favorites' } }
    });

    mockElements.push({
      id: 'mock-cart-btn',
      type: 'button', 
      selector: 'button.cart',
      componentName: 'CartButton',
      boundingBox: {
        x: iframeRect.left + 294,
        y: iframeRect.top + 40,
        width: 40,
        height: 40
      },
      metadata: { props: { mockElement: true, type: 'cart' } }
    });

    // Main hero section buttons
    mockElements.push({
      id: 'mock-shop-now-btn',
      type: 'button',
      selector: 'button.shop-now',
      componentName: 'ShopNowButton', 
      boundingBox: {
        x: iframeRect.left + 115,
        y: iframeRect.top + 460,
        width: 120,
        height: 45
      },
      metadata: { props: { mockElement: true, type: 'primary-cta' } }
    });

    mockElements.push({
      id: 'mock-browse-categories-btn',
      type: 'button',
      selector: 'button.browse-categories',
      componentName: 'BrowseCategoriesButton',
      boundingBox: {
        x: iframeRect.left + 40,
        y: iframeRect.top + 530,
        width: 280,
        height: 45
      },
      metadata: { props: { mockElement: true, type: 'secondary-cta' } }
    });

    // Logo/brand area
    mockElements.push({
      id: 'mock-logo',
      type: 'div',
      selector: 'div.logo',
      componentName: 'Logo',
      boundingBox: {
        x: iframeRect.left + 35,
        y: iframeRect.top + 35,
        width: 140,
        height: 50
      },
      metadata: { props: { mockElement: true, type: 'branding' } }
    });

    console.log(`🎯 Created ${mockElements.length} mock elements for inspection`);
    return mockElements;
  };

  // Request elements from injected script and return fallback for immediate display
  const scanIframeElements = (): UIElement[] => {
    if (!previewIframeRef.current) {
      console.warn('❌ No iframe ref available');
      return [];
    }

    const iframe = previewIframeRef.current;
    const iframeRect = iframe.getBoundingClientRect();

    console.log('🔍 scanIframeElements called - iframe rect:', {
      x: iframeRect.x,
      y: iframeRect.y, 
      width: iframeRect.width,
      height: iframeRect.height,
      left: iframeRect.left,
      top: iframeRect.top
    });

    // Always use mock elements to avoid CORS issues entirely
    console.log('🎭 Using mock elements for inspection (avoiding CORS issues)');
    const mockElements = createMockElements(iframeRect);
    console.log(`🎭 Generated ${mockElements.length} mock elements:`, mockElements.map(el => ({
      id: el.id,
      type: el.type,
      boundingBox: el.boundingBox
    })));
    return mockElements;
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

  // Try to extract meaningful elements from the iframe DOM (DISABLED due to CORS issues)
  const extractRealElements = (iframe: HTMLIFrameElement, iframeRect: DOMRect): UIElement[] => {
    // DISABLED: This function causes CORS errors in cross-origin scenarios
    console.log('🚫 extractRealElements disabled to prevent CORS errors');
    return [];
  };

  // Handle communication with same-origin inspection script
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        // Verify message is from our same-origin iframe
        if (event.origin !== window.location.origin) {
          console.log('🚫 Ignoring message from different origin:', event.origin);
          return;
        }
        
        if (!previewIframeRef.current) {
          return;
        }
        
        // Check if message is from our inspection system
        const isInspectionMessage = event.data && 
          (event.data.type === 'ELEMENTS_MAPPED' || event.data.type === 'ELEMENT_SELECTED');
        
        if (!isInspectionMessage) {
          return;
        }
        
        console.log('🎯 Received same-origin inspection message:', event.data.type);

        if (event.data.type === 'ELEMENTS_MAPPED') {
          console.log('📊 Elements mapped:', event.data.elements?.length || 0);
          setMappedElements(event.data.elements || []);
          
          // Process the received elements and convert to display coordinates
          if (previewIframeRef.current && event.data.elements?.length > 0) {
            const iframeRect = previewIframeRef.current.getBoundingClientRect();
            console.log('📐 Processing elements with iframe rect:', {
              left: iframeRect.left,
              top: iframeRect.top,
              width: iframeRect.width,
              height: iframeRect.height
            });
            
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
                fromRealInspection: true // Mark as from real inspection
              }
            }));
            
            console.log(`✅ Setting ${processedElements.length} real elements from same-origin iframe`);
            setElements(processedElements);
          }
        } else if (event.data.type === 'ELEMENT_SELECTED') {
          console.log('🎯 Element selected in iframe:', event.data.element);
          onElementSelect(event.data.element);
        }
      } catch (error) {
        console.warn('⚠️ Error handling message in PreviewOverlay:', error);
      }
    };

    console.log('🎧 Setting up same-origin message listener');
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [previewIframeRef, onElementSelect]);

  // Update elements when iframe position changes or inspection is activated
  useEffect(() => {
    if (isActive) {
      console.log('🎯 Inspection activated - waiting for real elements from same-origin iframe');

      const updateElements = () => {
        try {
          // Only use fallback mock elements if we haven't received real elements yet
          setElements(prev => {
            // If we already have real elements from inspection, keep them
            if (prev.length > 0 && prev[0]?.metadata?.fromRealInspection) {
              console.log('✅ Keeping existing real elements from same-origin inspection');
              return prev;
            }
            
            // If we haven't received real elements yet, use mock as fallback
            if (prev.length === 0) {
              console.log('⏳ Using mock elements as fallback while waiting for real elements');
              if (!previewIframeRef.current) return prev;
              
              const iframe = previewIframeRef.current;
              const iframeRect = iframe.getBoundingClientRect();
              return createMockElements(iframeRect);
            }
            
            return prev;
          });
        } catch (error) {
          console.warn('⚠️ Error in updateElements:', error);
        }
      };

      // Initial delay to allow iframe to load and inject script
      const timeout = setTimeout(updateElements, 500);

      // Update on scroll/resize to maintain positioning for any elements we have
      const handleUpdate = () => {
        setTimeout(() => {
          setElements(prev => {
            if (prev.length > 0 && prev[0]?.metadata?.fromRealInspection) {
              // Update real element positions
              if (!previewIframeRef.current) return prev;
              const iframeRect = previewIframeRef.current.getBoundingClientRect();
              
              return prev.map(element => ({
                ...element,
                boundingBox: {
                  x: iframeRect.left + (element.metadata?.originalX || 0),
                  y: iframeRect.top + (element.metadata?.originalY || 0),
                  width: element.boundingBox.width,
                  height: element.boundingBox.height,
                }
              }));
            }
            return prev;
          });
        }, 100);
      };

      window.addEventListener('scroll', handleUpdate);
      window.addEventListener('resize', handleUpdate);

      return () => {
        clearTimeout(timeout);
        window.removeEventListener('scroll', handleUpdate);
        window.removeEventListener('resize', handleUpdate);
      };
    } else {
      console.log('❌ Inspection disabled - clearing elements');
      setElements([]);
      setMappedElements([]);
    }
  }, [isActive, previewIframeRef]);

  if (!isActive) {
    return <div style={{ display: 'none' }} />;
  }

  console.log(`🎨 PreviewOverlay render - isActive: ${isActive}, elements count: ${elements.length}`);
  console.log('🎨 Elements to render:', elements.map(el => ({ id: el.id, type: el.type })));

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