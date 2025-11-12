'use client';

import { useEffect, useRef, useState } from 'react';

interface Node {
  x: number;
  y: number;
  id: string;
  type: 'input' | 'hidden' | 'output';
  activation: number;
  pulsePhase: number;
}

interface Connection {
  from: string;
  to: string;
  weight: number;
  activity: number;
}

interface NeuralNetworkVisualizationProps {
  agents: any[];
  isActive: boolean;
  className?: string;
}

export function NeuralNetworkVisualization({ agents, isActive, className = '' }: NeuralNetworkVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const nodesRef = useRef<Node[]>([]);
  const connectionsRef = useRef<Connection[]>([]);
  const [dimensions, setDimensions] = useState({ width: 400, height: 300 });

  const agentColors = {
    architect: 'rgba(59, 130, 246, 1)',    // blue
    performance: 'rgba(251, 191, 36, 1)',  // yellow
    security: 'rgba(239, 68, 68, 1)',      // red
    ux: 'rgba(168, 85, 247, 1)',           // purple
    integration: 'rgba(34, 197, 94, 1)',   // green
    default: 'rgba(156, 163, 175, 1)'      // gray
  };

  const initializeNetwork = () => {
    const nodes: Node[] = [];
    const connections: Connection[] = [];
    
    // Create input nodes (data sources)
    for (let i = 0; i < 3; i++) {
      nodes.push({
        x: 50,
        y: 50 + i * (dimensions.height - 100) / 2,
        id: `input_${i}`,
        type: 'input',
        activation: Math.random(),
        pulsePhase: Math.random() * Math.PI * 2
      });
    }
    
    // Create hidden nodes (agents)
    agents.forEach((agent, index) => {
      const angle = (index / Math.max(agents.length, 1)) * Math.PI * 2;
      const radius = Math.min(dimensions.width, dimensions.height) * 0.25;
      const centerX = dimensions.width / 2;
      const centerY = dimensions.height / 2;
      
      nodes.push({
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        id: `agent_${agent.id}`,
        type: 'hidden',
        activation: agent.progress / 100,
        pulsePhase: Math.random() * Math.PI * 2
      });
    });
    
    // Create output nodes (results)
    for (let i = 0; i < 2; i++) {
      nodes.push({
        x: dimensions.width - 50,
        y: 80 + i * (dimensions.height - 160),
        id: `output_${i}`,
        type: 'output',
        activation: Math.random(),
        pulsePhase: Math.random() * Math.PI * 2
      });
    }
    
    // Create connections
    // Input to hidden
    for (let i = 0; i < 3; i++) {
      agents.forEach((agent, agentIndex) => {
        connections.push({
          from: `input_${i}`,
          to: `agent_${agent.id}`,
          weight: 0.5 + Math.random() * 0.5,
          activity: Math.random()
        });
      });
    }
    
    // Hidden to hidden (agent collaboration)
    for (let i = 0; i < agents.length; i++) {
      for (let j = i + 1; j < agents.length; j++) {
        if (Math.random() > 0.3) { // Only some connections
          connections.push({
            from: `agent_${agents[i].id}`,
            to: `agent_${agents[j].id}`,
            weight: Math.random(),
            activity: Math.random()
          });
        }
      }
    }
    
    // Hidden to output
    agents.forEach((agent) => {
      for (let i = 0; i < 2; i++) {
        connections.push({
          from: `agent_${agent.id}`,
          to: `output_${i}`,
          weight: Math.random(),
          activity: Math.random()
        });
      }
    });
    
    nodesRef.current = nodes;
    connectionsRef.current = connections;
  };

  const updateNetwork = () => {
    // Update node activations and pulse phases
    nodesRef.current.forEach((node) => {
      node.pulsePhase += 0.02;
      if (node.pulsePhase > Math.PI * 2) node.pulsePhase = 0;
      
      // Update activation based on node type
      if (node.type === 'input') {
        node.activation = 0.3 + Math.sin(node.pulsePhase) * 0.2;
      } else if (node.type === 'hidden') {
        const agent = agents.find(a => `agent_${a.id}` === node.id);
        if (agent) {
          node.activation = (agent.progress / 100) * (0.8 + Math.sin(node.pulsePhase) * 0.2);
        }
      }
    });
    
    // Update connection activities
    connectionsRef.current.forEach((connection) => {
      connection.activity = Math.max(0.1, connection.activity + (Math.random() - 0.5) * 0.1);
      if (connection.activity > 1) connection.activity = 1;
    });
  };

  const drawConnections = (ctx: CanvasRenderingContext2D) => {
    connectionsRef.current.forEach((connection) => {
      const fromNode = nodesRef.current.find(n => n.id === connection.from);
      const toNode = nodesRef.current.find(n => n.id === connection.to);
      
      if (!fromNode || !toNode) return;
      
      const opacity = connection.activity * connection.weight * 0.7;
      const lineWidth = 1 + connection.activity * 2;
      
      // Create animated gradient
      const gradient = ctx.createLinearGradient(fromNode.x, fromNode.y, toNode.x, toNode.y);
      gradient.addColorStop(0, `rgba(20, 184, 166, ${opacity})`);
      gradient.addColorStop(0.5, `rgba(59, 130, 246, ${opacity * 1.2})`);
      gradient.addColorStop(1, `rgba(168, 85, 247, ${opacity})`);
      
      ctx.beginPath();
      ctx.moveTo(fromNode.x, fromNode.y);
      ctx.lineTo(toNode.x, toNode.y);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
      
      // Draw activity pulse
      const pulsePosition = (Date.now() / 1000 + connection.activity) % 1;
      const pulseX = fromNode.x + (toNode.x - fromNode.x) * pulsePosition;
      const pulseY = fromNode.y + (toNode.y - fromNode.y) * pulsePosition;
      
      ctx.beginPath();
      ctx.arc(pulseX, pulseY, 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 2})`;
      ctx.fill();
    });
  };

  const drawNodes = (ctx: CanvasRenderingContext2D) => {
    nodesRef.current.forEach((node) => {
      const pulseScale = 1 + Math.sin(node.pulsePhase) * 0.3;
      const baseRadius = node.type === 'hidden' ? 8 : 6;
      const radius = baseRadius * pulseScale;
      
      // Get color based on node type and agent type
      let color = 'rgba(156, 163, 175, 1)'; // default gray
      if (node.type === 'hidden') {
        const agent = agents.find(a => `agent_${a.id}` === node.id);
        if (agent) {
          color = agentColors[agent.type as keyof typeof agentColors] || agentColors.default;
        }
      } else if (node.type === 'input') {
        color = 'rgba(34, 197, 94, 1)'; // green
      } else {
        color = 'rgba(239, 68, 68, 1)'; // red
      }
      
      const opacity = 0.6 + node.activation * 0.4;
      
      // Draw glow
      const glowGradient = ctx.createRadialGradient(
        node.x, node.y, 0,
        node.x, node.y, radius * 3
      );
      glowGradient.addColorStop(0, color.replace('1)', `${opacity})`));
      glowGradient.addColorStop(1, color.replace('1)', '0)'));
      
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius * 3, 0, Math.PI * 2);
      ctx.fillStyle = glowGradient;
      ctx.fill();
      
      // Draw core
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = color.replace('1)', `${opacity})`);
      ctx.fill();
      
      // Draw inner highlight
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.3})`;
      ctx.fill();
    });
  };

  const animate = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    
    if (!canvas || !ctx) return;
    
    // Clear canvas
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);
    
    if (isActive && agents.length > 0) {
      updateNetwork();
      drawConnections(ctx);
      drawNodes(ctx);
    }
    
    animationRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateDimensions = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        setDimensions({ width: rect.width, height: rect.height });
        canvas.width = rect.width;
        canvas.height = rect.height;
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  useEffect(() => {
    if (agents.length > 0 && dimensions.width > 0) {
      initializeNetwork();
    }
  }, [agents, dimensions]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, agents, dimensions]);

  if (agents.length === 0) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ mixBlendMode: 'screen' }}
    />
  );
}