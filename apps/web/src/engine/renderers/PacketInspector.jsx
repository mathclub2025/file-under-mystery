import React, { useState, useEffect } from "react";
import { Network } from "lucide-react";
import { assetUrl } from "../../lib/assetHelper.js";

export default function PacketInspector({ config, onEvidenceReady }) {
  const [packets, setPackets] = useState([]);
  const [filterMethod, setFilterMethod] = useState("ALL");
  const [selectedPacket, setSelectedPacket] = useState(null);

  useEffect(() => {
    fetch(assetUrl("/evidence/network_capture.json"))
      .then((r) => r.json())
      .then((data) => {
        setPackets(data);
        setSelectedPacket((prev) => prev || (data.length > 0 ? data[0] : null));
        onEvidenceReady?.();
      })
      .catch((err) => {
        console.error("Error loading network capture:", err);
        onEvidenceReady?.();
      });
  }, []);

  const filteredPackets = [...packets]
    .filter((p) => filterMethod === "ALL" || p.method === filterMethod);

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      className="flex flex-col gap-4 w-full font-mono text-xs select-none max-w-5xl mx-auto"
    >
      {/* PCAP Packet Stream Table Viewport */}
      <div className="rounded-2xl overflow-hidden border border-white/15 p-4 flex flex-col bg-black shadow-2xl relative min-h-[300px] w-full">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 text-white font-bold text-xs">
            <Network size={15} />
            <span>REALTIME PCAP CAPTURE LOG // 80 FRAMES INTERCEPTED</span>
          </div>

          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
            {["ALL", "GET", "POST", "PUT", "HEAD"].map((m) => (
              <button
                key={m}
                onClick={() => setFilterMethod(m)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  filterMethod === m
                    ? "bg-white text-black shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Packet Stream Table */}
        <div className="overflow-x-auto max-h-[280px] rounded-xl border border-white/10 bg-black">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-black text-slate-400 uppercase tracking-wider border-b border-white/10 z-10">
              <tr>
                <th className="p-2.5">#</th>
                <th className="p-2.5">Method</th>
                <th className="p-2.5">Endpoint URI</th>
                <th className="p-2.5">Status</th>
                <th className="p-2.5 text-right">Payload Size</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-200">
              {filteredPackets.map((pkt) => {
                const isSelected = selectedPacket?.id === pkt.id;
                const sizeDisplay = pkt.size_kb ? `${pkt.size_kb} KB` : `${(pkt.size_bytes / 1024).toFixed(1)} KB`;
                return (
                  <tr
                    key={pkt.id}
                    onClick={() => setSelectedPacket(pkt)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-white/20 text-white font-bold"
                        : "hover:bg-white/5"
                    }`}
                  >
                    <td className="p-2.5 font-mono">{pkt.id}</td>
                    <td className="p-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        pkt.method === "POST"
                          ? "bg-white/20 text-white"
                          : pkt.method === "PUT"
                          ? "bg-white/10 text-slate-300"
                          : "bg-black text-slate-400 border border-white/10"
                      }`}>
                        {pkt.method}
                      </span>
                    </td>
                    <td className="p-2.5 font-mono text-slate-300">{pkt.uri}</td>
                    <td className="p-2.5 text-slate-300">{pkt.status} OK</td>
                    <td className="p-2.5 text-right font-bold font-mono text-white">
                      {sizeDisplay}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Packet Header Inspection Terminal */}
      {selectedPacket && (
        <div className="rounded-2xl p-4 border border-white/15 bg-black flex flex-col gap-3 shadow-2xl animate-fade-in w-full">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-white font-bold text-xs uppercase tracking-wider">
              PACKET #{selectedPacket.id} // {selectedPacket.method} {selectedPacket.uri}
            </span>
            <span className="text-slate-400 text-[10px]">{selectedPacket.timestamp}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex flex-col gap-1.5">
              <div><span className="text-slate-400">Client IP:</span> <span className="text-white font-bold font-mono">{selectedPacket.client_ip}</span></div>
              <div><span className="text-slate-400">User-Agent:</span> <span className="text-white font-mono">{selectedPacket.user_agent}</span></div>
              <div><span className="text-slate-400">Status:</span> <span className="text-white font-bold">{selectedPacket.status} OK</span></div>
              <div><span className="text-slate-400">Payload Size:</span> <span className="text-white font-bold font-mono">{selectedPacket.size_kb ? `${selectedPacket.size_kb} KB` : `${(selectedPacket.size_bytes / 1024).toFixed(1)} KB`} ({selectedPacket.size_bytes.toLocaleString()} bytes)</span></div>
            </div>

            <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex flex-col gap-1.5">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Authorization Header:</span>
              <div className="p-2.5 bg-black rounded-lg border border-white/15 text-white font-mono break-all text-xs select-text">
                {selectedPacket.authorization}
              </div>
              <span className="text-[10px] text-slate-500 italic">
                Inspect raw token header value to extract authorization credentials.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
