import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

// Mock seasonal datasets (replace with your JSON)
const seasonalData = {
  Spring: {
    nodes: [
      { id: "Robin", group: "bird" },
      { id: "Oak Tree", group: "plant" },
      { id: "Caterpillar", group: "insect" }
    ],
    links: [
      { source: "Robin", target: "Oak Tree", weight: 10 },
      { source: "Robin", target: "Caterpillar", weight: 5 }
    ]
  },
  Summer: {
    nodes: [
      { id: "Robin", group: "bird" },
      { id: "Oak Tree", group: "plant" },
      { id: "Caterpillar", group: "insect" },
      { id: "Bee", group: "insect" },
      { id: "Wildflower", group: "plant" }
    ],
    links: [
      { source: "Bee", target: "Wildflower", weight: 25 },
      { source: "Robin", target: "Caterpillar", weight: 15 },
      { source: "Robin", target: "Oak Tree", weight: 20 }
    ]
  },
  Fall: {
    nodes: [
      { id: "Robin", group: "bird" },
      { id: "Oak Tree", group: "plant" },
      { id: "Acorn", group: "plant" }
    ],
    links: [
      { source: "Robin", target: "Acorn", weight: 12 },
      { source: "Oak Tree", target: "Acorn", weight: 22 }
    ]
  },
  Winter: {
    nodes: [
      { id: "Oak Tree", group: "plant" },
      { id: "Crow", group: "bird" }
    ],
    links: [
      { source: "Crow", target: "Oak Tree", weight: 8 }
    ]
  }
};

const colorMap = {
  bird: "#4F46E5",
  plant: "#16A34A",
  insect: "#EAB308"
};

export default function SeasonalNetwork() {
  const svgRef = useRef();
  const [season, setSeason] = useState("Spring");

  useEffect(() => {
    const { nodes, links } = seasonalData[season];
    const svg = d3.select(svgRef.current);
    const width = 600;
    const height = 500;

    // Compute degree (number of connections per node)
    const degreeCount = {};
    links.forEach(l => {
      degreeCount[l.source] = (degreeCount[l.source] || 0) + l.weight;
      degreeCount[l.target] = (degreeCount[l.target] || 0) + l.weight;
    });

    // Simulation
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id).distance(120))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2));

    // Links
    const link = svg.selectAll("line")
      .data(links, d => d.source.id + "-" + d.target.id);

    link.join(
      enter => enter.append("line")
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.6)
        .attr("stroke-width", 1)
        .call(enter => enter.transition().duration(1000)
          .attr("stroke-width", d => Math.sqrt(d.weight) * 1.5)
        ),
      update => update.transition().duration(1000)
        .attr("stroke-width", d => Math.sqrt(d.weight) * 1.5),
      exit => exit.transition().duration(600).style("opacity", 0).remove()
    );

    // Nodes
    const node = svg.selectAll("circle")
      .data(nodes, d => d.id);

    node.join(
      enter => enter.append("circle")
        .attr("r", 0)
        .attr("fill", d => colorMap[d.group] || "#aaa")
        .style("filter", "url(#glow)")
        .call(enter => enter.transition().duration(1000)
          .attr("r", d => 6 + (degreeCount[d.id] || 2))
        ),
      update => update.transition().duration(1000)
        .attr("fill", d => colorMap[d.group] || "#aaa")
        .attr("r", d => 6 + (degreeCount[d.id] || 2)),
      exit => exit.transition().duration(600).attr("r", 0).remove()
    ).call(drag(simulation));

    // Labels
    const label = svg.selectAll("text.node-label")
      .data(nodes, d => d.id);

    label.join(
      enter => enter.append("text")
        .attr("class", "node-label")
        .text(d => d.id)
        .attr("font-size", 12)
        .attr("dy", -18)
        .attr("text-anchor", "middle")
        .style("opacity", 0)
        .call(enter => enter.transition().duration(1000).style("opacity", 1)),
      update => update.transition().duration(1000).text(d => d.id),
      exit => exit.transition().duration(600).style("opacity", 0).remove()
    );

    // Glow filter (only define once)
    if (svg.select("#glow").empty()) {
      const defs = svg.append("defs");
      const filter = defs.append("filter").attr("id", "glow");
      filter.append("feGaussianBlur").attr("stdDeviation", "3.5").attr("result", "coloredBlur");
      const feMerge = filter.append("feMerge");
      feMerge.append("feMergeNode").attr("in", "coloredBlur");
      feMerge.append("feMergeNode").attr("in", "SourceGraphic");
    }

    // Tick update
    simulation.on("tick", () => {
      svg.selectAll("line")
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      svg.selectAll("circle")
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);

      svg.selectAll("text.node-label")
        .attr("x", d => d.x)
        .attr("y", d => d.y);
    });
  }, [season]);

  function drag(simulation) {
    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }
    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
    return d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended);
  }

  const currentGroups = Array.from(new Set(seasonalData[season].nodes.map(n => n.group)));

  return (
    <div className="flex flex-col items-center space-y-4">
      <h1 className="text-xl font-bold">Seasonal Ecosystem Network</h1>
      <input
        type="range"
        min="0"
        max="3"
        step="1"
        value={Object.keys(seasonalData).indexOf(season)}
        onChange={(e) => setSeason(Object.keys(seasonalData)[e.target.value])}
        className="w-96"
      />
      <p className="text-gray-600">{season}</p>
      <div className="flex space-x-6 text-sm text-gray-700">
        {currentGroups.includes("bird") && (
          <div className="flex items-center space-x-1">
            <span className="w-4 h-4 rounded-full" style={{ backgroundColor: colorMap.bird }}></span>
            <span>Bird</span>
          </div>
        )}
        {currentGroups.includes("plant") && (
          <div className="flex items-center space-x-1">
            <span className="w-4 h-4 rounded-full" style={{ backgroundColor: colorMap.plant }}></span>
            <span>Plant</span>
          </div>
        )}
        {currentGroups.includes("insect") && (
          <div className="flex items-center space-x-1">
            <span className="w-4 h-4 rounded-full" style={{ backgroundColor: colorMap.insect }}></span>
            <span>Insect</span>
          </div>
        )}
        <div className="flex items-center space-x-1">
          <span className="w-4 h-4 border border-gray-500"></span>
          <span>Edge width = correlation strength</span>
        </div>
        <div className="flex items-center space-x-1">
          <svg width="20" height="20">
            <circle cx="10" cy="10" r="8" fill="#ccc" />
          </svg>
          <span>Node size = connectivity</span>
        </div>
      </div>
      <svg ref={svgRef} width={600} height={500}></svg>
    </div>
  );
}
