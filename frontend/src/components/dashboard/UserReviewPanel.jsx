import { useState, useEffect } from "react";
import axios from "axios";

const StarRow = ({ rating, size = "w-4 h-4" }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <svg
        key={s}
        className={`${size} ${s <= rating ? "text-yellow-400" : "text-gray-600"}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
  </div>
);

const UserReviewPanel = ({ authHeaders }) => {
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  useEffect(() => {
    const loadReviews = async () => {
      setReviewsLoading(true);
      try {
        const { data } = await axios.get(
          "http://localhost:5003/api/reviews/my",
          authHeaders(),
        );
        setReviews(data);
      } catch (error) {
        setReviews([]);
      } finally {
        setReviewsLoading(false);
      }
    };

    loadReviews();
  }, [authHeaders]);

  const avgRating = reviews.length
    ? (
        reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      ).toFixed(1)
    : null;

  return (
    <div className="flex-1 overflow-auto p-2">
      {reviewsLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center p-4">
          <div className="text-5xl mb-4">📝</div>
          <p className="text-white font-bold text-lg">No reviews yet</p>
          <p className="text-gray-500 text-sm mt-1">
            After completing a ride, your feedback will appear here.
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-4 mb-6">
            <div className="bg-gray-900 border border-white/10 rounded-2xl p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-400">Average rating</p>
                  <p className="text-4xl font-black text-white">{avgRating}</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <StarRow
                    rating={Math.round(parseFloat(avgRating) || 0)}
                    size="w-5 h-5"
                  />
                  <span className="font-semibold">
                    {reviews.length} reviews
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {reviews.map((r) => (
              <div
                key={r._id}
                className="bg-gray-800/60 border border-white/10 rounded-2xl p-5"
              >
                <div className="flex items-center justify-between mb-3 gap-3">
                  <div>
                    <p className="text-sm text-gray-400">Driver reviewed</p>
                    <p className="text-white font-semibold">
                      {r.rider?.name || "Driver"}
                    </p>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(r.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <StarRow rating={r.rating} />
                  <span className="text-sm text-gray-300 font-semibold">
                    {r.rating}/5
                  </span>
                </div>

                <p className="text-gray-300 text-sm leading-relaxed mb-4">
                  {r.comment || (
                    <span className="italic text-gray-600">
                      No comment left.
                    </span>
                  )}
                </p>

                {r.ride && (
                  <div className="bg-gray-900/50 rounded-xl p-3 text-xs text-gray-500 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="truncate">
                        {r.ride.pickupLocation?.address || "Pickup"}
                      </span>
                      <span className="text-green-400 font-semibold">
                        ৳{r.ride.fare}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-gray-500">
                      <span className="truncate">
                        {r.ride.dropoffLocation?.address || "Dropoff"}
                      </span>
                      <span>{r.ride.duration} min</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default UserReviewPanel;
