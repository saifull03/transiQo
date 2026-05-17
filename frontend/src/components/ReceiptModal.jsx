import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import html2pdf from "html2pdf.js";

const ReceiptModal = ({ rideId, onClose }) => {
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef();

  const token = () => {
    const s = localStorage.getItem("rideX_user");
    return s ? JSON.parse(s).token : "";
  };

  useEffect(() => {
    if (!rideId) return;
    const fetchReceipt = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(
          `http://localhost:5003/api/rides/${rideId}/receipt`,
          { headers: { Authorization: `Bearer ${token()}` } },
        );
        setReceipt(data);
      } catch (err) {
        console.error("Failed to load receipt", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReceipt();
  }, [rideId]);

  const printReceipt = () => {
    if (!containerRef.current) return;
    const w = window.open("", "_blank");
    w.document.write("<html><head><title>Receipt</title>");
    w.document.write(
      '<meta name="viewport" content="width=device-width,initial-scale=1">',
    );
    w.document.write(
      '<link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">',
    );
    w.document.write("</head><body>");
    w.document.write(containerRef.current.innerHTML);
    w.document.write("</body></html>");
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
  };

  const downloadPdf = () => {
    if (!containerRef.current || !receipt) return;
    const opt = {
      margin: 10,
      filename: `receipt-${receipt.rideId}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };
    html2pdf().set(opt).from(containerRef.current).save();
  };

  if (!rideId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl overflow-auto">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-bold">Ride Receipt</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={downloadPdf}
              className="px-3 py-1 bg-blue-600 text-white rounded"
            >
              Download PDF
            </button>
            <button
              onClick={printReceipt}
              className="px-3 py-1 bg-green-600 text-white rounded"
            >
              Print
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1 bg-gray-200 dark:bg-gray-800 text-gray-700 rounded"
            >
              Close
            </button>
          </div>
        </div>

        <div ref={containerRef} className="p-6">
          {loading && <div>Loading receipt...</div>}
          {!loading && receipt && (
            <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-extrabold">rideX</h2>
                  <div className="text-sm text-gray-500">Receipt</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Receipt ID</div>
                  <div className="font-mono text-sm">{receipt.rideId}</div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500">Date</div>
                  <div className="font-semibold">
                    {new Date(receipt.createdAt).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Payment</div>
                  <div className="font-semibold">
                    {receipt.paymentMethod || "cash"}
                  </div>
                </div>
              </div>

              <div className="mt-6 bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                <div className="flex justify-between">
                  <div>
                    <div className="text-xs text-gray-500">Pickup</div>
                    <div className="font-semibold">
                      {receipt.pickup?.address ||
                        `${receipt.pickup?.lat}, ${receipt.pickup?.lng}`}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Destination</div>
                    <div className="font-semibold">
                      {receipt.dropoff?.address ||
                        `${receipt.dropoff?.lat}, ${receipt.dropoff?.lng}`}
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-4 text-sm text-gray-600">
                  <div>
                    <div className="text-xs text-gray-500">Distance</div>
                    <div>{receipt.distance} km</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Duration</div>
                    <div>{receipt.duration} mins</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Status</div>
                    <div className="font-semibold">{receipt.status}</div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <div className="text-sm text-gray-500">Rider</div>
                <div className="font-semibold">
                  {receipt.rider?.name || "—"}
                </div>
                <div className="text-xs text-gray-400">
                  Rating: {receipt.rider?.rating ?? "N/A"}
                </div>
                <div className="text-xs text-gray-400">
                  Vehicle:{" "}
                  {receipt.rider?.vehicle
                    ? `${receipt.rider.vehicle.make} ${receipt.rider.vehicle.model}`
                    : "—"}
                </div>
              </div>

              <div className="mt-6 border-t border-gray-100 dark:border-gray-700 pt-4">
                <div className="flex justify-between text-sm text-gray-600">
                  <div>Base fare</div>
                  <div>
                    ৳{receipt.fareBreakdown.baseFare?.toFixed(2) || "0.00"}
                  </div>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <div>Distance charge</div>
                  <div>
                    ৳
                    {receipt.fareBreakdown.distanceCharge?.toFixed(2) || "0.00"}
                  </div>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <div>Time charge</div>
                  <div>
                    ৳{receipt.fareBreakdown.timeCharge?.toFixed(2) || "0.00"}
                  </div>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <div>Surge</div>
                  <div>
                    ৳{receipt.fareBreakdown.surgeCharge?.toFixed(2) || "0.00"}
                  </div>
                </div>

                <div className="mt-4 flex justify-between items-center">
                  <div className="text-sm text-gray-500">Total</div>
                  <div className="text-2xl font-extrabold">
                    ৳{receipt.fare.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;
