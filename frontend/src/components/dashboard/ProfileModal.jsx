import { useState, useRef, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";

const DEFAULT_AVATAR =
  "data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20fill%3D%22%233b82f6%22%2F%3E%3Cpath%20d%3D%22M50%2055c-11%200-30%206-30%2018v7h60v-7c0-12-19-18-30-18zm0-10c8.28%200%2015-6.72%2015-15S58.28%2015%2050%2015%2035%2021.72%2035%2030s6.72%2015%2015%2015z%22%20fill%3D%22%23ffffff%22%2F%3E%3C%2Fsvg%3E";

// Compress image aggressively — target well under 80KB base64
// 300px wide, 65% quality JPEG ≈ 15–40KB base64 for typical photos
const compressImage = (file, maxWidthPx = 300, quality = 0.65) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const scale = Math.min(1, maxWidthPx / Math.max(img.width, img.height));
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        // Fill white background before drawing (handles PNG transparency)
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const result = canvas.toDataURL("image/jpeg", quality);
        // Safety check — should be well under 100KB
        const sizeKB = Math.round((result.length * 3) / 4 / 1024);
        console.log(`Compressed image: ${canvas.width}x${canvas.height}px, ~${sizeKB}KB`);
        resolve(result);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const ProfileModal = ({ onClose }) => {
  const { user, updateUser } = useContext(AuthContext);
  const [tab, setTab] = useState("profile");
  const [preview, setPreview] = useState(user?.profilePicture || DEFAULT_AVATAR);
  const [compressedData, setCompressedData] = useState(null); // compressed base64
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [msg, setMsg] = useState(null);
  const [processing, setProcessing] = useState(false);
  const fileRef = useRef();

  const token = () => {
    const s = localStorage.getItem("rideX_user");
    return s ? JSON.parse(s).token : "";
  };
  const headers = () => ({ headers: { Authorization: `Bearer ${token()}` } });

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setMsg(null);
    setProcessing(true);
    try {
      // Show raw preview immediately for UX
      const rawReader = new FileReader();
      rawReader.onloadend = () => setPreview(rawReader.result);
      rawReader.readAsDataURL(file);
      // Compress in background
      const compressed = await compressImage(file);
      setCompressedData(compressed);
    } catch {
      setMsg({ type: "error", text: "Could not process image. Try another file." });
    } finally {
      setProcessing(false);
    }
    // Reset file input so same file can be re-selected
    e.target.value = "";
  };

  const handlePhotoUpload = async () => {
    if (!compressedData) {
      setMsg({ type: "error", text: "Please select an image first." });
      return;
    }
    setUploading(true);
    setMsg(null);
    try {
      const { data } = await axios.put(
        "http://localhost:5003/api/auth/profile/picture",
        { profilePicture: compressedData },
        headers()
      );
      updateUser({ profilePicture: data.profilePicture });
      setPreview(data.profilePicture);
      setCompressedData(null);
      setMsg({ type: "success", text: "✓ Profile photo updated!" });
    } catch (err) {
      console.error("Profile picture upload error:", err);
      const errMsg =
        err.response?.status === 413
          ? "Image too large even after compression. Please try a smaller file."
          : err.response?.data?.message
          ? err.response.data.message
          : err.message?.includes("Network")
          ? "Cannot reach server. Is the backend running on port 5003?"
          : `Upload failed: ${err.message || "Unknown error"}`;
      setMsg({ type: "error", text: errMsg });
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setMsg({ type: "error", text: "Name cannot be empty." });
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      const { data } = await axios.put(
        "http://localhost:5003/api/auth/profile/update",
        { name: name.trim(), phone: phone.trim() },
        headers()
      );
      updateUser({ name: data.name, phone: data.phone });
      setMsg({ type: "success", text: "✓ Profile saved!" });
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.message || "Save failed. Try again." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-white/10 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition text-lg font-bold"
          >
            ✕
          </button>
          <div className="relative inline-block mb-3">
            <img
              src={preview}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover border-4 border-white/30 shadow-xl"
              onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
            />
            <button
              onClick={() => { setTab("photo"); fileRef.current?.click(); }}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-white text-blue-600 flex items-center justify-center shadow-lg hover:scale-110 transition"
              title="Change photo"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
          <h2 className="text-white font-bold text-xl">{user?.name}</h2>
          <span className={`inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-semibold ${user?.role === "rider" ? "bg-green-500/30 text-green-300" : "bg-blue-400/30 text-blue-200"}`}>
            {user?.role === "rider" ? "🏍️ Rider" : "👤 Passenger"}
          </span>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          {[
            { id: "profile", label: "Edit Profile" },
            { id: "photo", label: "Change Photo" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-3 text-sm font-semibold transition ${tab === t.id ? "text-blue-400 border-b-2 border-blue-500" : "text-gray-400 hover:text-gray-200"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="p-6">
          {msg && (
            <div className={`mb-4 p-3 rounded-xl text-sm font-medium ${msg.type === "success" ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"}`}>
              {msg.text}
            </div>
          )}

          {tab === "profile" && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Full Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  placeholder="Your name"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Phone</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  placeholder="+880..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Email (read-only)</label>
                <input
                  value={user?.email || ""}
                  disabled
                  className="w-full px-4 py-3 bg-white/5 border border-white/5 rounded-xl text-gray-500 cursor-not-allowed"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-lg shadow-blue-500/30 hover:from-blue-500 hover:to-indigo-500 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </form>
          )}

          {tab === "photo" && (
            <div className="space-y-4">
              {/* Hidden file input */}
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleFileChange}
              />

              {/* Preview area */}
              {compressedData ? (
                <div className="text-center">
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-32 h-32 rounded-full object-cover border-4 border-blue-500/50 mx-auto shadow-xl mb-3"
                  />
                  <p className="text-green-400 text-sm font-medium">Image ready to upload</p>
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="text-gray-400 hover:text-gray-200 text-xs mt-1 underline"
                  >
                    Choose a different image
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-white/20 hover:border-blue-500/60 rounded-2xl p-8 cursor-pointer transition group text-center"
                >
                  {processing ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <p className="text-gray-400 text-sm">Processing image...</p>
                    </div>
                  ) : (
                    <>
                      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/30 transition">
                        <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-gray-300 text-sm font-medium">Click to select a photo</p>
                      <p className="text-gray-600 text-xs mt-1">JPG, PNG, WebP · Auto-compressed</p>
                    </>
                  )}
                </div>
              )}

              <button
                onClick={handlePhotoUpload}
                disabled={uploading || !compressedData || processing}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-lg shadow-blue-500/30 hover:from-blue-500 hover:to-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Uploading...
                  </span>
                ) : "Upload Photo"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
