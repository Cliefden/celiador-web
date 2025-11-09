'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useLivingEcosystem } from '@/hooks/useLivingEcosystem';

interface UIElement {
  id: string;
  selector: string;
  tagName: string;
  coordinates: { x: number; y: number; width: number; height: number };
  text?: string;
  componentName?: string;
}

interface ElementMapping {
  elementId: string;
  filePath: string;
  lineNumber: number;
  codeBlock: string;
  componentName?: string;
  confidence: number;
}

interface VisualContextOverlayProps {
  previewRef: React.RefObject<HTMLIFrameElement>;
  projectId: string;
  instanceId?: string;
  onElementSelect?: (element: UIElement, mapping?: ElementMapping) => void;
  className?: string;
}

interface SelectedElement extends UIElement {
  mapping?: ElementMapping;
}

export function VisualContextOverlay({
  previewRef,
  projectId,
  instanceId,
  onElementSelect,
  className = ''
}: VisualContextOverlayProps) {
  const {
    isEnabled,
    visualContext,
    captureVisualContext
  } = useLivingEcosystem(projectId);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);
  const [hoveredElement, setHoveredElement] = useState<UIElement | null>(null);
  const [showElementInfo, setShowElementInfo] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Capture visual context when component mounts
  useEffect(() => {
    if (isEnabled && instanceId) {
      captureVisualContext(instanceId);
    }
  }, [isEnabled, instanceId, captureVisualContext]);

  const handleElementClick = useCallback((event: React.MouseEvent) => {
    if (!isEnabled || !visualContext?.uiElements) return;

    event.preventDefault();
    event.stopPropagation();

    const rect = overlayRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Find the element at the clicked coordinates
    const clickedElement = visualContext.uiElements.find((element: UIElement) => {
      const { coordinates } = element;
      return (
        x >= coordinates.x &&
        x <= coordinates.x + coordinates.width &&
        y >= coordinates.y &&
        y <= coordinates.y + coordinates.height
      );
    });

    if (clickedElement) {
      // Mock element mapping (in real implementation, this would come from the backend)
      const mockMapping: ElementMapping = {
        elementId: clickedElement.id,
        filePath: `src/components/${clickedElement.componentName || 'Unknown'}.tsx`,
        lineNumber: Math.floor(Math.random() * 50) + 1,
        codeBlock: `<${clickedElement.tagName}>${clickedElement.text || 'Content'}</${clickedElement.tagName}>`,
        componentName: clickedElement.componentName,
        confidence: 0.85 + Math.random() * 0.15
      };

      const selectedWithMapping = { ...clickedElement, mapping: mockMapping };
      setSelectedElement(selectedWithMapping);
      setShowElementInfo(true);
      onElementSelect?.(clickedElement, mockMapping);
    }
  }, [isEnabled, visualContext, onElementSelect]);

  const handleElementHover = useCallback((event: React.MouseEvent) => {
    if (!isEnabled || !visualContext?.uiElements) return;

    const rect = overlayRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const hoveredElement = visualContext.uiElements.find((element: UIElement) => {
      const { coordinates } = element;
      return (
        x >= coordinates.x &&
        x <= coordinates.x + coordinates.width &&
        y >= coordinates.y &&
        y <= coordinates.y + coordinates.height
      );
    });

    setHoveredElement(hoveredElement || null);
  }, [isEnabled, visualContext]);

  const handleAnalyzeClick = async () => {
    if (!instanceId || isAnalyzing) return;

    setIsAnalyzing(true);
    try {
      await captureVisualContext(instanceId);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const closeElementInfo = () => {
    setSelectedElement(null);
    setShowElementInfo(false);
  };

  if (!isEnabled) {
    return null;
  }

  return (
    <>
      {/* Overlay for element interaction */}
      <div
        ref={overlayRef}
        className={`absolute inset-0 z-10 ${className}`}
        onClick={handleElementClick}
        onMouseMove={handleElementHover}
        onMouseLeave={() => setHoveredElement(null)}
        style={{ pointerEvents: isEnabled ? 'auto' : 'none' }}
      >
        {/* Element highlights */}
        {visualContext?.uiElements?.map((element: UIElement) => (
          <div
            key={element.id}
            className={`absolute border-2 transition-all duration-200 pointer-events-none ${
              selectedElement?.id === element.id
                ? 'border-blue-500 bg-blue-500 bg-opacity-10'
                : hoveredElement?.id === element.id
                ? 'border-yellow-400 bg-yellow-400 bg-opacity-10'
                : 'border-transparent'
            }`}
            style={{
              left: element.coordinates.x,
              top: element.coordinates.y,
              width: element.coordinates.width,
              height: element.coordinates.height
            }}
          >
            {/* Element label on hover */}
            {hoveredElement?.id === element.id && (
              <div className="absolute -top-6 left-0 bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                {element.componentName || element.tagName}
                {element.text && `: "${element.text.slice(0, 20)}..."`}
              </div>
            )}
          </div>
        ))}

        {/* Visual context controls */}
        <div className="absolute top-4 right-4 space-y-2">
          <button
            onClick={handleAnalyzeClick}
            disabled={isAnalyzing || !instanceId}
            className="bg-blue-500 text-white px-3 py-2 rounded-lg shadow-lg hover:bg-blue-600 disabled:opacity-50 flex items-center space-x-2 text-sm"
          >
            {isAnalyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <span>🔍</span>
                <span>Analyze UI</span>
              </>
            )}
          </button>

          {visualContext?.uiElements && visualContext.uiElements.length > 0 && (
            <div className="bg-green-500 text-white px-3 py-2 rounded-lg shadow-lg text-sm">
              {visualContext.uiElements.length} elements detected
            </div>
          )}
        </div>
      </div>

      {/* Element information modal */}
      {showElementInfo && selectedElement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                UI Element Details
              </h3>
              <button
                onClick={closeElementInfo}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Element info */}
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Element</h4>
                <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">Tag:</span> {selectedElement.tagName}
                  </div>
                  {selectedElement.componentName && (
                    <div className="text-sm">
                      <span className="font-medium">Component:</span> {selectedElement.componentName}
                    </div>
                  )}
                  {selectedElement.text && (
                    <div className="text-sm">
                      <span className="font-medium">Text:</span> "{selectedElement.text}"
                    </div>
                  )}
                  <div className="text-sm">
                    <span className="font-medium">Position:</span> {selectedElement.coordinates.x}, {selectedElement.coordinates.y}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Size:</span> {selectedElement.coordinates.width} × {selectedElement.coordinates.height}
                  </div>
                </div>
              </div>

              {/* Code mapping */}
              {selectedElement.mapping && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Code Location</h4>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                    <div className="text-sm">
                      <span className="font-medium">File:</span> {selectedElement.mapping.filePath}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Line:</span> {selectedElement.mapping.lineNumber}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Confidence:</span> {Math.round(selectedElement.mapping.confidence * 100)}%
                    </div>
                    <div className="bg-gray-900 text-green-400 p-2 rounded text-xs font-mono">
                      {selectedElement.mapping.codeBlock}
                    </div>
                  </div>
                </div>
              )}

              {/* Quick actions */}
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Quick Actions</h4>
                <div className="grid grid-cols-2 gap-2">
                  <button className="bg-blue-500 text-white px-3 py-2 rounded text-sm hover:bg-blue-600 transition-colors">
                    Edit Styles
                  </button>
                  <button className="bg-purple-500 text-white px-3 py-2 rounded text-sm hover:bg-purple-600 transition-colors">
                    View Code
                  </button>
                  <button className="bg-green-500 text-white px-3 py-2 rounded text-sm hover:bg-green-600 transition-colors">
                    Add Feature
                  </button>
                  <button className="bg-orange-500 text-white px-3 py-2 rounded text-sm hover:bg-orange-600 transition-colors">
                    Optimize
                  </button>
                </div>
              </div>

              {/* AI suggestions */}
              <div>
                <h4 className="font-medium text-gray-700 mb-2">💡 AI Suggestions</h4>
                <div className="space-y-2">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="text-sm font-medium text-blue-900 mb-1">
                      Accessibility Improvement
                    </div>
                    <div className="text-xs text-blue-700">
                      Add aria-label for better screen reader support
                    </div>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="text-sm font-medium text-green-900 mb-1">
                      Performance Tip
                    </div>
                    <div className="text-xs text-green-700">
                      Consider lazy loading for this component
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}