"use client";

import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

interface MermaidDiagramProps {
  chart: string;
}

export function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (containerRef.current && chart) {
      mermaid.initialize({
        startOnLoad: true,
        theme: "default",
        securityLevel: "loose",
      });

      const renderDiagram = async () => {
        try {
          containerRef.current!.innerHTML = "";
          const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
          const { svg } = await mermaid.render(id, chart);
          containerRef.current!.innerHTML = svg;

          setIsError(false);
        } catch (error) {
          console.error("Mermaid rendering error:", error);
          setIsError(true);
        }
      };

      renderDiagram();
    }
  }, [chart]);

  if (isError) {
    return (
      <div className="my-6 p-4 border border-red-200 rounded-lg bg-red-50">
        <p className="text-red-600 text-sm">
          ダイアグラムの表示中にエラーが発生しました
        </p>
        <pre className="mt-2 text-xs text-red-800 overflow-x-auto">
          <code>{chart}</code>
        </pre>
      </div>
    );
  }

  return (
    <div className="my-6 overflow-x-auto">
      <div
        ref={containerRef}
        className="mermaid-container mx-auto p-4 bg-gray-50 rounded-lg border border-gray-200"
      />
    </div>
  );
}
