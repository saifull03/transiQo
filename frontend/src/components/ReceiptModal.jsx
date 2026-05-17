import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import html2pdf from "html2pdf.js";

const ReceiptModal = ({ rideId, autoAction, onClose }) => {
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
        // Ensure fareBreakdown is dynamically populated if backend hasn't been restarted
        let fb = data.fareBreakdown;
        if (!fb || !fb.baseFare) {
          const baseFare = 200;
          const distanceCharge = (data.distance || 0) * 21;
          const timeCharge = (data.duration || 0) * 3;
          const calculatedTotal = baseFare + distanceCharge + timeCharge;
          const surgeCharge = data.fare > calculatedTotal ? data.fare - calculatedTotal : 0;
          fb = { baseFare, distanceCharge, timeCharge, surgeCharge };
          data.fareBreakdown = fb;
        }
        setReceipt(data);
      } catch (err) {
        console.error("Failed to load receipt", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReceipt();
  }, [rideId]);

  useEffect(() => {
    if (!loading && receipt && autoAction) {
      if (autoAction === "print") {
        setTimeout(() => {
          printReceipt();
        }, 500);
      } else if (autoAction === "download") {
        setTimeout(() => {
          downloadPdf();
        }, 500);
      }
    }
  }, [loading, receipt, autoAction]);

  const printReceipt = () => {
    if (!containerRef.current || !receipt) return;
    const printContents = containerRef.current.innerHTML;

    const invoiceName = `Transiqo-invoice-${receipt.transactionId || receipt.rideId}`;

    // Temporarily update the main document title so Chromium/Chrome GTK print spooler picks it up
    const originalTitle = document.title;
    document.title = invoiceName;

    // Clean up any previous print iframes from older print jobs
    const oldIframes = document.querySelectorAll('iframe[id^="receipt-print-iframe"]');
    oldIframes.forEach(f => {
      if (document.body.contains(f)) {
        document.body.removeChild(f);
      }
    });

    // Create a pristine print iframe with a unique ID so GTK print spooler never reuses cached titles
    const uniqueId = `receipt-print-iframe-${receipt.transactionId || receipt.rideId}-${Date.now()}`;
    const iframe = document.createElement("iframe");
    iframe.id = uniqueId;
    iframe.name = uniqueId;
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <html>
        <head>
          <title>${invoiceName}</title>
          <style>
            @import url('https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css');
            body {
              background: white !important;
              color: black !important;
              padding: 40px 20px !important;
              margin: 0 !important;
              font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            }
            .no-print { display: none !important; }
            .bg-gray-50, .bg-gray-50\\/50 { background-color: #f9fafb !important; }
            .border-gray-100 { border-color: #f3f4f6 !important; border-width: 1px !important; border-style: solid !important; }
            .text-blue-600 { color: #2563eb !important; }
            .text-green-600 { color: #16a34a !important; }
            .text-amber-600 { color: #d97706 !important; }
            .bg-emerald-100 { background-color: #d1fae5 !important; color: #065f46 !important; padding: 2px 6px !important; border-radius: 4px !important; display: inline-block; font-weight: bold; }
            .bg-amber-100 { background-color: #fef3c7 !important; color: #92400e !important; padding: 2px 6px !important; border-radius: 4px !important; display: inline-block; font-weight: bold; }
            .grid { display: grid !important; }
            .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
            .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
            .grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; }
            .gap-3 { gap: 0.75rem !important; }
            .gap-4 { gap: 1rem !important; }
            .gap-2 { gap: 0.5rem !important; }
            .flex { display: flex !important; }
            .justify-between { justify-content: space-between !important; }
            .items-center { align-items: center !important; }
            .space-y-5 > * + * { margin-top: 1.25rem !important; }
            .space-y-4 > * + * { margin-top: 1rem !important; }
            .space-y-3 > * + * { margin-top: 0.75rem !important; }
            .space-y-2 > * + * { margin-top: 0.5rem !important; }
            .space-y-1 > * + * { margin-top: 0.25rem !important; }
            .text-center { text-align: center !important; }
            .text-right { text-align: right !important; }
            .font-bold { font-weight: 700 !important; }
            .font-extrabold { font-weight: 800 !important; }
            .font-black { font-weight: 900 !important; }
            .text-xs { font-size: 0.75rem !important; }
            .text-sm { font-size: 0.875rem !important; }
            .text-2xl { font-size: 1.5rem !important; }
            .uppercase { text-transform: uppercase !important; }
            .tracking-wider { letter-spacing: 0.05em !important; }
            .border-b { border-bottom-width: 1px !important; border-bottom-style: solid !important; }
            .border-t { border-top-width: 1px !important; border-top-style: solid !important; }
            .pb-4 { padding-bottom: 1rem !important; }
            .pt-3 { padding-top: 0.75rem !important; }
            .p-3 { padding: 0.75rem !important; }
            .p-4 { padding: 1rem !important; }
            .rounded-lg { border-radius: 0.5rem !important; }
            .shadow-2xs { box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important; }
          </style>
        </head>
        <body>
          ${printContents}
        </body>
      </html>
    `);
    doc.close();

    iframe.contentWindow.focus();
    setTimeout(() => {
      iframe.contentWindow.print();
      // Listen for print dialog closure to restore title and focus
      const restoreFocus = () => {
        document.title = originalTitle;
        window.focus();
        if (document.activeElement) {
          document.activeElement.blur();
        }
      };
      iframe.contentWindow.onafterprint = restoreFocus;
      // Backup focus restore after 60 seconds in case onafterprint is delayed by Linux WM
      setTimeout(restoreFocus, 60000);
    }, 500);
  };

  const downloadPdf = () => {
    if (!containerRef.current || !receipt) return;
    const invoiceName = `Transiqo-invoice-${receipt.transactionId || receipt.rideId}`;
    const opt = {
      margin: 10,
      filename: `${invoiceName}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };
    const element = containerRef.current;
    try {
      const generatePdf = typeof html2pdf === "function" ? html2pdf : (html2pdf.default || window.html2pdf);
      if (generatePdf) {
        generatePdf().set(opt).from(element).save().catch((err) => {
          console.warn("html2pdf canvas error, falling back to printReceipt:", err);
          printReceipt();
        });
      } else {
        printReceipt();
      }
    } catch (err) {
      console.warn("html2pdf init error, falling back to printReceipt:", err);
      printReceipt();
    }
  };

  if (!rideId) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-auto">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-800 my-4 flex flex-col max-h-[90vh]">
        {/* Modal Actions Header - Hidden in Print */}
        <div className="no-print p-3.5 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            Official Ride Invoice & Receipt
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={downloadPdf}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-xs transition-colors shadow-sm flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
              Download PDF
            </button>
            <button
              onClick={printReceipt}
              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-xs transition-colors shadow-sm flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
              Print
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-medium text-xs transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        {/* Printable Container */}
        <div id="printable-receipt" className="p-6 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-y-auto flex-1">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-500 font-medium text-sm">Loading full ride details...</span>
            </div>
          )}
          {!loading && receipt && (
            <div ref={containerRef} className="space-y-5 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2">
              {/* Receipt Header */}
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                      rideX
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 rounded text-[10px] font-bold uppercase tracking-wider">
                      {receipt.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Official Ride Receipt & Invoice
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 block">
                    Receipt / Invoice ID
                  </span>
                  <span className="font-mono text-xs font-bold text-gray-800 dark:text-gray-200 block">
                    {receipt.rideId}
                  </span>
                </div>
              </div>

              {/* Timing Grid */}
              <div className="grid grid-cols-3 gap-3 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800 text-center">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 block mb-0.5">
                    Booking Time
                  </span>
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200 block">
                    {new Date(receipt.createdAt).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 block mb-0.5">
                    Start Time
                  </span>
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200 block">
                    {receipt.startedAt ? new Date(receipt.startedAt).toLocaleString() : new Date(receipt.createdAt).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 block mb-0.5">
                    Completion Time
                  </span>
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200 block">
                    {receipt.updatedAt ? new Date(receipt.updatedAt).toLocaleString() : new Date(receipt.receiptGeneratedAt || receipt.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Parties Info: Passenger & Driver side-by-side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
                {/* Passenger Info */}
                <div className="bg-gray-50/50 dark:bg-gray-800/30 p-3.5 rounded-lg border border-gray-100 dark:border-gray-800 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block mb-1">
                    Billed To (Passenger)
                  </span>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-2">
                    {receipt.user?.name || "—"}
                  </h4>
                  <div className="space-y-1 text-xs text-gray-600 dark:text-gray-300">
                    <div className="flex justify-between">
                      <span className="text-gray-400 dark:text-gray-500">Phone:</span>
                      <span className="font-medium">{receipt.user?.phone || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 dark:text-gray-500">Email:</span>
                      <span className="font-medium">{receipt.user?.email || "—"}</span>
                    </div>
                  </div>
                </div>

                {/* Driver Info */}
                <div className="bg-gray-50/50 dark:bg-gray-800/30 p-3.5 rounded-lg border border-gray-100 dark:border-gray-800 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-green-600 dark:text-green-400 block mb-1">
                    Service Provider (Driver)
                  </span>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-2 flex items-center justify-between">
                    <span>{receipt.rider?.name || "—"}</span>
                    <span className="text-[10px] bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded font-semibold">
                      ★ {receipt.rider?.rating?.toFixed(1) || "5.0"}
                    </span>
                  </h4>
                  <div className="space-y-1 text-xs text-gray-600 dark:text-gray-300">
                    <div className="flex justify-between">
                      <span className="text-gray-400 dark:text-gray-500">Phone:</span>
                      <span className="font-medium">{receipt.rider?.phone || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 dark:text-gray-500">Vehicle:</span>
                      <span className="font-medium truncate max-w-[120px]">
                        {receipt.rider?.vehicle ? `${receipt.rider.vehicle.make || ''} ${receipt.rider.vehicle.model || ''}` : "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 dark:text-gray-500">Plate:</span>
                      <span className="font-mono font-bold">{receipt.rider?.vehicle?.licensePlate || "—"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Route & Trip Metrics */}
              <div className="bg-gray-50/50 dark:bg-gray-800/30 p-4 rounded-lg border border-gray-100 dark:border-gray-800 shadow-2xs space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="flex items-start gap-2">
                    <span className="w-2.5 h-2.5 bg-green-500 rounded-full mt-1 flex-shrink-0"></span>
                    <div>
                      <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">Pickup</span>
                      <p className="font-bold text-gray-800 dark:text-gray-200 mt-0.5 line-clamp-2">
                        {receipt.pickup?.address || `${receipt.pickup?.lat}, ${receipt.pickup?.lng}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-2.5 h-2.5 bg-red-500 rounded-full mt-1 flex-shrink-0"></span>
                    <div>
                      <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">Dropoff</span>
                      <p className="font-bold text-gray-800 dark:text-gray-200 mt-0.5 line-clamp-2">
                        {receipt.dropoff?.address || `${receipt.dropoff?.lat}, ${receipt.dropoff?.lng}`}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 pt-3 border-t border-gray-200 dark:border-gray-700/50 text-center">
                  <div className="p-2 bg-white dark:bg-gray-800 rounded border border-gray-100 dark:border-gray-700">
                    <span className="text-[9px] text-gray-400 dark:text-gray-500 uppercase font-bold block mb-0.5">Distance</span>
                    <span className="text-xs font-extrabold text-gray-900 dark:text-white">{receipt.distance} km</span>
                  </div>
                  <div className="p-2 bg-white dark:bg-gray-800 rounded border border-gray-100 dark:border-gray-700">
                    <span className="text-[9px] text-gray-400 dark:text-gray-500 uppercase font-bold block mb-0.5">Duration</span>
                    <span className="text-xs font-extrabold text-gray-900 dark:text-white">{receipt.duration} min</span>
                  </div>
                  <div className="p-2 bg-white dark:bg-gray-800 rounded border border-gray-100 dark:border-gray-700">
                    <span className="text-[9px] text-gray-400 dark:text-gray-500 uppercase font-bold block mb-0.5">Method</span>
                    <span className="text-xs font-extrabold text-gray-900 dark:text-white uppercase">{receipt.paymentMethod || "cash"}</span>
                  </div>
                  <div className="p-2 bg-white dark:bg-gray-800 rounded border border-gray-100 dark:border-gray-700">
                    <span className="text-[9px] text-gray-400 dark:text-gray-500 uppercase font-bold block mb-0.5">Status</span>
                    <span className={`text-xs font-extrabold capitalize ${receipt.paymentStatus === 'completed' ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                      {receipt.paymentStatus || "pending"}
                    </span>
                  </div>
                </div>
                {receipt.transactionId && (
                  <div className="text-[10px] text-gray-400 dark:text-gray-500 text-center font-mono pt-1">
                    TXID: {receipt.transactionId}
                  </div>
                )}
              </div>

              {/* Fare Breakdown & Total */}
              <div className="bg-gray-50/50 dark:bg-gray-800/30 p-4 rounded-lg border border-gray-100 dark:border-gray-800 shadow-2xs space-y-3">
                <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider border-b border-gray-200 dark:border-gray-700/50 pb-2">
                  Fare Breakdown
                </h4>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-gray-600 dark:text-gray-300">
                    <span>Base Fare</span>
                    <span className="font-medium">৳{receipt.fareBreakdown?.baseFare?.toFixed(2) || "0.00"}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-300">
                    <span>Distance Charge ({receipt.distance} km)</span>
                    <span className="font-medium">৳{receipt.fareBreakdown?.distanceCharge?.toFixed(2) || "0.00"}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-300">
                    <span>Time Charge ({receipt.duration} mins)</span>
                    <span className="font-medium">৳{receipt.fareBreakdown?.timeCharge?.toFixed(2) || "0.00"}</span>
                  </div>
                  {receipt.fareBreakdown?.surgeCharge > 0 && (
                    <div className="flex justify-between text-amber-600 dark:text-amber-400 font-medium">
                      <span>Surge Pricing multiplier</span>
                      <span>৳{receipt.fareBreakdown.surgeCharge.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-dashed border-gray-200 dark:border-gray-700 pt-3 mt-3 flex items-center justify-between">
                  <div>
                    <span className="text-sm font-bold text-gray-900 dark:text-white block">Total Billed Amount</span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">Includes all applicable taxes & tolls</span>
                  </div>
                  <div className="text-2xl font-black text-blue-600 dark:text-blue-400 tracking-tight">
                    ৳{receipt.fare?.toFixed(2) || "0.00"}
                  </div>
                </div>
              </div>

              {/* Footer Note */}
              <div className="text-center text-[10px] text-gray-400 dark:text-gray-500 pt-2 border-t border-gray-100 dark:border-gray-800">
                <p>Thank you for choosing rideX. Support: support@ridex.com</p>
                <p className="mt-0.5 font-mono">rideX Technologies Ltd. • Tech District</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;
