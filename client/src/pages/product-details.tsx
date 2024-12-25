// src/pages/product-details.tsx
import { CarouselButtonType, MyntraCarousel, Slider, useRating } from "6pp";
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  FaTrash,
  FaRegHeart,
  FaHeart,
  FaShoppingCart,
  FaUser,
} from "react-icons/fa";
import {
  FaArrowLeftLong,
  FaArrowRightLong,
  FaRegStar,
  FaStar,
  FaShare,
} from "react-icons/fa6";
import { FiEdit, FiPackage, FiShield, FiTruck } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, useParams, useNavigate } from "react-router-dom";
import { Skeleton } from "../components/loader";
import RatingsComponent from "../components/ratings";
import {
  useAllReviewsOfProductsQuery,
  useDeleteReviewMutation,
  useNewReviewMutation,
  useProductDetailsQuery,
  useRelatedProductsQuery,
} from "../redux/api/productAPI";
import { addToCart } from "../redux/reducer/cartReducer";
import { RootState } from "../redux/store";
import { CartItem } from "../types/types";
// import { responseToast } from "../utils/features";
import ProductCard from "../components/product-card";
import ShareModal from "../components/shared/ShareModal";

const ProductDetails = () => {
  const params = useParams();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.userReducer);
  const navigate = useNavigate();

  const handleBuyNow = () => {
    addToCartHandler({
      productId: data?.product?._id || "",
      name: data?.product?.name || "",
      price: data?.product?.price || 0,
      stock: data?.product?.stock || 0,
      quantity,
      photo: data?.product?.photos[0].url || "",
    });
    navigate("/pay"); // Navigate to the checkout page
  };

  const { isLoading, isError, data } = useProductDetailsQuery(params.id!);
  // const reviewsResponse = useAllReviewsOfProductsQuery(params.id!);
  const relatedProducts = useRelatedProductsQuery(
    data?.product?.category || ""
  );

  const [carouselOpen, setCarouselOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState("");
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "description" | "specifications" | "reviews"
  >("description");

  const [reviewComment, setReviewComment] = useState("");
  const reviewDialogRef = useRef<HTMLDialogElement>(null);
  const [reviewSubmitLoading, setReviewSubmitLoading] = useState(false);

  const [createReview] = useNewReviewMutation();
  const [deleteReview] = useDeleteReviewMutation();

  const isFashionItem = data?.product?.category.toLowerCase() === "fashion";
  const { data: reviewsData, refetch: refetchReviews } =
    useAllReviewsOfProductsQuery(params.id!);

  const decrement = () => quantity > 1 && setQuantity((prev) => prev - 1);
  const increment = () => {
    if (data?.product?.stock === quantity) {
      toast.error(`Only ${data?.product?.stock} units available`);
      return;
    }
    setQuantity((prev) => prev + 1);
  };

  const addToCartHandler = (cartItem: CartItem) => {
    if (cartItem.stock < 1) return toast.error("Out of Stock");
    dispatch(addToCart(cartItem));
    toast.success("Added to cart");
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: data?.product?.name || "Product",
          text: data?.product?.description || "",
          url: window.location.href,
        })
        .catch(() => {
          setShowShareModal(true);
        });
    } else {
      setShowShareModal(true);
    }
  };

  const { Ratings: RatingsEditable, rating } = useRating({
    IconFilled: <FaStar />,
    IconOutline: <FaRegStar />,
    value: 0,
    selectable: true,
    styles: {
      fontSize: "1.75rem",
      color: "coral",
      justifyContent: "flex-start",
    },
  });

  const closeReviewDialog = () => {
    setReviewComment("");
    reviewDialogRef.current?.close();
  };

  const handleReviewSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setReviewSubmitLoading(true);

    try {
      const res = await createReview({
        comment: reviewComment,
        rating,
        userId: user?._id,
        productId: params.id!,
      });

      if ("data" in res) {
        toast.success("Review added successfully");
        setReviewComment("");
        closeReviewDialog();
        // Refetch reviews after adding new one
        await refetchReviews();
      } else {
        toast.error("Failed to add review");
      }
    } catch (error) {
      toast.error("Error submitting review");
    } finally {
      setReviewSubmitLoading(false);
    }
  };
  const handleDeleteReview = async (reviewId: string) => {
    // Check if user is logged in and owns the review
    if (!user) {
      toast.error("Please login to delete review");
      return;
    }

    try {
      const res = await deleteReview({ reviewId, userId: user._id });
      if ("data" in res) {
        toast.success("Review deleted successfully");
        await refetchReviews();
      } else {
        toast.error("Failed to delete review");
      }
    } catch (error) {
      toast.error("Error deleting review");
    }
  };

  if (isError) return <Navigate to="/404" />;

  return (
    <div className="product-details">
      {isLoading ? (
        <ProductLoader />
      ) : (
        <>
          <div className="product-hero">
            <motion.section
              className="product-images"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Slider
                showThumbnails
                showNav={false}
                onClick={() => setCarouselOpen(true)}
                images={data?.product?.photos.map((i) => i.url) || []}
              />
              {carouselOpen && (
                <MyntraCarousel
                  NextButton={NextButton}
                  PrevButton={PrevButton}
                  setIsOpen={setCarouselOpen}
                  images={data?.product?.photos.map((i) => i.url) || []}
                />
              )}
            </motion.section>

            <motion.section
              className="product-info"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="product-header">
                <h1>{data?.product?.name}</h1>
                <div className="product-actions">
                  <button
                    className={`wishlist-btn ${isWishlisted ? "active" : ""}`}
                    onClick={() => setIsWishlisted(!isWishlisted)}
                  >
                    {isWishlisted ? <FaHeart /> : <FaRegHeart />}
                  </button>
                  <button className="share-btn" onClick={handleShare}>
                    <FaShare />
                  </button>
                </div>
              </div>

              <div className="product-meta">
                <div className="ratings-wrapper">
                  <RatingsComponent value={data?.product?.ratings || 0} />
                  <span>({data?.product?.numOfReviews} reviews)</span>
                </div>
                <span className="category">{data?.product?.category}</span>
              </div>

              <div className="price-section">
                <h2>₹{data?.product?.price}</h2>
                {data?.product?.oldPrice && (
                  <span className="old-price">₹{data?.product?.oldPrice}</span>
                )}
                {data?.product?.discount && (
                  <span className="discount">-{data?.product?.discount}%</span>
                )}
              </div>

              {isFashionItem && (
                <div className="size-section">
                  <h3>Select Size</h3>
                  <div className="size-grid">
                    {["S", "M", "L", "XL", "XXL"].map((size) => (
                      <button
                        key={size}
                        className={`size-btn ${
                          selectedSize === size ? "active" : ""
                        }`}
                        onClick={() => setSelectedSize(size)}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="quantity-section">
                <h3>Quantity</h3>
                <div className="quantity-controls">
                  <button onClick={decrement}>-</button>
                  <span>{quantity}</span>
                  <button onClick={increment}>+</button>
                </div>
              </div>

              <div className="purchase-buttons">
                <button
                  className="add-to-cart"
                  onClick={() =>
                    addToCartHandler({
                      productId: data?.product?._id || "",
                      name: data?.product?.name || "",
                      price: data?.product?.price || 0,
                      stock: data?.product?.stock || 0,
                      quantity,
                      photo: data?.product?.photos[0].url || "",
                    })
                  }
                >
                  <FaShoppingCart /> Add to Cart
                </button>
                <button className="buy-now" onClick={handleBuyNow}>
                  Buy Now
                </button>
              </div>

              <div className="product-features">
                <div className="feature">
                  <FiTruck />
                  <span>Free Delivery</span>
                </div>
                <div className="feature">
                  <FiPackage />
                  <span>7 Days Return</span>
                </div>
                <div className="feature">
                  <FiShield />
                  <span>2 Year Warranty</span>
                </div>
              </div>
            </motion.section>
          </div>

          <section className="product-details-tabs">
            <div className="tab-buttons">
              {(["description", "specifications", "reviews"] as const).map(
                (tab) => (
                  <button
                    key={tab}
                    className={activeTab === tab ? "active" : ""}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                )
              )}
            </div>

            <div className="tab-content">
              <AnimatePresence mode="wait">
                {activeTab === "description" && (
                  <motion.div
                    key="description"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="description-content"
                  >
                    <p>{data?.product?.description}</p>
                  </motion.div>
                )}

                {activeTab === "specifications" && (
                  <motion.div
                    key="specifications"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="specifications-content"
                  >
                    {/* Add specifications content */}
                  </motion.div>
                )}

                {activeTab === "reviews" && (
                  <motion.div
                    key="reviews"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="reviews-content"
                  >
                    <div className="reviews-header">
                      <h2>
                        Customer Reviews ({reviewsData?.reviews.length || 0})
                      </h2>
                      {user && (
                        <button
                          onClick={() => reviewDialogRef.current?.showModal()}
                        >
                          <FiEdit /> Write a Review
                        </button>
                      )}
                    </div>

                    <div className="reviews-list">
                      {reviewsData?.reviews &&
                      reviewsData.reviews.length > 0 ? (
                        reviewsData.reviews.map((review) => (
                          <ReviewCard
                            key={review._id}
                            review={{
                              _id: review._id,
                              userId: review.user?._id || '', 
                              rating: review.rating,
                              comment: review.comment,
                              userName: review.user?.name || 'Anonymous', 
                              userImage: review.user?.photo || '', 
                              createdAt: review.createdAt
                            }}
                            userId={user?._id}
                            handleDeleteReview={handleDeleteReview}
                          />
                        ))
                      ) : (
                        <div className="no-reviews">
                          <p>
                            No reviews yet. Be the first to review this product!
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>

          {relatedProducts.data?.products && (
            <section className="related-products">
              <h2>Related Products</h2>
              <div className="products-grid">
                {relatedProducts.data.products.map((product) => (
                  <ProductCard
                    key={product._id}
                    productId={product._id}
                    name={product.name}
                    price={product.price}
                    stock={product.stock}
                    handler={addToCartHandler}
                    photos={product.photos}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <dialog ref={reviewDialogRef} className="review-dialog">
        <form onSubmit={handleReviewSubmit}>
          <h2>Write a Review</h2>
          <div className="rating-input">
            <label>Your Rating</label>
            <RatingsEditable />
          </div>
          <div className="review-input">
            <label>Your Review</label>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Share your experience..."
              required
            />
          </div>
          <div className="dialog-actions">
            <button
              type="button"
              onClick={() => reviewDialogRef.current?.close()}
            >
              Cancel
            </button>
            <button type="submit" disabled={reviewSubmitLoading}>
              {reviewSubmitLoading ? "Submitting..." : "Submit Review"}
            </button>
          </div>
        </form>
      </dialog>

      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        url={window.location.href}
        title={data?.product?.name || "Product"}
        image={data?.product?.photos[0]?.url}
      />
    </div>
  );
};

interface ReviewCardProps {
  review: {
    _id: string;
    userId: string;
    rating: number;
    comment: string;
    userName: string;
    userImage?: string;
    createdAt: string;
  };
  userId?: string;
  handleDeleteReview: (reviewId: string) => void;
}

const ReviewCard = ({
  review,
  userId,
  handleDeleteReview,
}: ReviewCardProps) => {
  const isOwnReview = userId === review.userId;

  return (
    <motion.div
      className="review-card"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="review-header">
        <div className="user-info">
          {review.userImage ? (
            <img src={review.userImage} alt={review.userName} />
          ) : (
            <FaUser className="user-icon" />
          )}
          <div>
            <h4>{review.userName}</h4>
            <div className="rating">
              {[...Array(5)].map((_, index) => (
                <FaStar
                  key={index}
                  className={index < review.rating ? "filled" : ""}
                  color="#fbbf24"
                />
              ))}
            </div>
          </div>
        </div>
        {isOwnReview && (
          <button
            className="delete-review"
            onClick={() => handleDeleteReview(review._id)}
            title="Delete review"
          >
            <FaTrash />
          </button>
        )}
      </div>
      <p className="review-comment">{review.comment}</p>
      <span className="review-date">
        {new Date(review.createdAt).toLocaleDateString()}
      </span>
    </motion.div>
  );
};

const NextButton: CarouselButtonType = ({ onClick }) => (
  <button onClick={onClick} className="carousel-btn next">
    <FaArrowRightLong />
  </button>
);

const PrevButton: CarouselButtonType = ({ onClick }) => (
  <button onClick={onClick} className="carousel-btn prev">
    <FaArrowLeftLong />
  </button>
);

const ProductLoader = () => (
  <div className="product-loader">
    <div className="image-loader">
      <Skeleton height={500} />
    </div>
    <div className="info-loader">
      <Skeleton height={40} width="70%" />
      <Skeleton height={20} width="30%" />
      <Skeleton height={60} width="50%" />
      <Skeleton height={100} />
      <Skeleton height={50} count={2} />
    </div>
  </div>
);

export default ProductDetails;
