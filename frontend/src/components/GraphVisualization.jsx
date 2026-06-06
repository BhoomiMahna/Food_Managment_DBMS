import React, { useEffect, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

const GraphVisualization = () => {
    const [graphData, setGraphData] = useState({ nodes: [], links: [] });
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

    useEffect(() => {
        // Fetch graph data from AI Service
        fetch('http://localhost:8000/api/ml/graph-data')
            .then(res => res.json())
            .then(data => {
                if (data.nodes && data.links) {
                    setGraphData(data);
                }
            })
            .catch(err => console.error("Failed to load graph data:", err));

        // Update dimensions on resize
        const handleResize = () => {
            const container = document.getElementById('graph-container');
            if (container) {
                setDimensions({
                    width: container.clientWidth,
                    height: container.clientHeight
                });
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const getNodeColor = (node) => {
        switch(node.group) {
            case 'Farmer': return '#10b981'; // Emerald 500
            case 'Wholesaler': return '#3b82f6'; // Blue 500
            case 'Retailer': return '#f59e0b'; // Amber 500
            default: return '#9ca3af'; // Gray 400
        }
    };

    return (
        <div id="graph-container" className="w-full h-96 bg-gray-900 rounded-xl overflow-hidden shadow-inner border border-gray-800">
            {graphData.nodes.length > 0 ? (
                <ForceGraph2D
                    width={dimensions.width}
                    height={dimensions.height}
                    graphData={graphData}
                    nodeLabel="label"
                    nodeColor={getNodeColor}
                    nodeRelSize={6}
                    linkColor={() => 'rgba(255,255,255,0.2)'}
                    linkWidth={1.5}
                    d3AlphaDecay={0.05}
                    d3VelocityDecay={0.4}
                />
            ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                    Loading Graph Intelligence...
                </div>
            )}
        </div>
    );
};

export default GraphVisualization;
