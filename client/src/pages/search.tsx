// src/pages/search.tsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ProductCard from "../components/product-card";
import { useCategoriesQuery, useSearchProductsQuery } from "../redux/api/productAPI";
import { CartItem } from "../types/types";
import { addToCart } from "../redux/reducer/cartReducer";
import { useDispatch } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { FaSearch, FaFilter, FaTimes, FaSort, FaStar } from "react-icons/fa";
import { Skeleton } from "../components/loader";
import toast from "react-hot-toast";

const sortOptions = [
  { value: "-1", label: "Price: High to Low" },
  { value: "1", label: "Price: Low to High" },
  { value: "rating", label: "Highest Rated" },
  { value: "newest", label: "Newest First" }
];

const Search = () => {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  
  // Search and Filter States
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("");
  const [maxPrice, setMaxPrice] = useState(100000);
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [selectedRating, setSelectedRating] = useState(0);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [page, setPage] = useState(1);

  // Fetch Data
  const { data: categoriesResponse } = useCategoriesQuery("");
  const { data: searchedData, isLoading: productLoading } = useSearchProductsQuery({
    search,
    sort,
    category,
    page,
    price: maxPrice,
  });

  const handleFilterChange = (type: string, value: string | number) => {
    switch (type) {
      case 'sort':
      setSort(String(value));
      updateActiveFilters('Sort', sortOptions.find(opt => opt.value === String(value))?.label || String(value));
      break;
      case 'category':
        setCategory(value as string);
        updateActiveFilters('Category', value as string);
        break;
      case 'price':
        setMaxPrice(value as number);
        updateActiveFilters('Price', `₹${value}`);
        break;
      case 'rating':
        setSelectedRating(value as number);
        updateActiveFilters('Rating', `${value}★ & above`);
        break;
    }
  };

  const updateActiveFilters = (type: string, value: string) => {
    setActiveFilters(prev => {
      const filtered = prev.filter(f => !f.startsWith(type));
      return [...filtered, `${type}: ${value}`];
    });
  };

  const clearFilter = (filter: string) => {
    const [type] = filter.split(': ');
    setActiveFilters(prev => prev.filter(f => f !== filter));

    switch (type) {
      case 'Sort':
        setSort('');
        break;
      case 'Category':
        setCategory('');
        break;
      case 'Price':
        setMaxPrice(100000);
        break;
      case 'Rating':
        setSelectedRating(0);
        break;
    }
  };

  const clearAllFilters = () => {
    setActiveFilters([]);
    setSort('');
    setCategory('');
    setMaxPrice(100000);
    setSelectedRating(0);
  };

  const addToCartHandler = (cartItem: CartItem) => {
    if (cartItem.stock < 1) return toast.error("Out of Stock");
    dispatch(addToCart(cartItem));
    toast.success("Added to cart");
  };

  return (
    <div className="search-page">
      <header className="search-header">
        <div className="search-input-wrapper">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button 
          className="filter-toggle"
          onClick={() => setShowFilters(!showFilters)}
        >
          <FaFilter />
          Filters {activeFilters.length > 0 && `(${activeFilters.length})`}
        </button>
      </header>

      <div className="search-content">
        <AnimatePresence>
          {showFilters && (
            <motion.aside
              className="filter-sidebar"
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", damping: 30 }}
            >
              <div className="filter-header">
                <h2>Filters</h2>
                {activeFilters.length > 0 && (
                  <button className="clear-all" onClick={clearAllFilters}>
                    Clear All
                  </button>
                )}
              </div>

              {activeFilters.length > 0 && (
                <div className="active-filters">
                  {activeFilters.map(filter => (
                    <span key={filter} className="filter-tag">
                      {filter}
                      <FaTimes onClick={() => clearFilter(filter)} />
                    </span>
                  ))}
                </div>
              )}

              <div className="filter-section">
                <h3>Sort By</h3>
                <div className="sort-options">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      className={sort === option.value ? 'active' : ''}
                      onClick={() => handleFilterChange('sort', option.value)}
                    >
                      <FaSort />
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="filter-section">
                <h3>Categories</h3>
                <div className="category-list">
                  {categoriesResponse?.categories.map((cat) => (
                    <button
                      key={cat}
                      className={category === cat ? 'active' : ''}
                      onClick={() => handleFilterChange('category', cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="filter-section">
                <h3>Price Range</h3>
                <div className="price-range">
                  <div className="range-slider">
                    <div 
                      className="slider-track"
                      style={{ width: `${(maxPrice / 100000) * 100}%` }}
                    />
                    <input
                      type="range"
                      min={0}
                      max={100000}
                      value={maxPrice}
                      onChange={(e) => handleFilterChange('price', Number(e.target.value))}
                    />
                  </div>
                  <div className="price-inputs">
                    <span>₹0</span>
                    <input
                      type="number"
                      value={maxPrice}
                      onChange={(e) => handleFilterChange('price', Number(e.target.value))}
                      min={0}
                      max={100000}
                    />
                  </div>
                </div>
              </div>

              <div className="filter-section">
                <h3>Rating</h3>
                <div className="rating-options">
                  {[4, 3, 2, 1].map((rating) => (
                    <button
                      key={rating}
                      className={`rating-btn ${selectedRating === rating ? 'active' : ''}`}
                      onClick={() => handleFilterChange('rating', rating)}
                    >
                      {rating} <FaStar /> & above
                    </button>
                  ))}
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        <main className="products-section">
          {productLoading ? (
            <div className="products-grid">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} height={300} />
              ))}
            </div>
          ) : (
            <>
              <div className="results-header">
                <h2>
                  {searchedData?.products.length} Results Found
                  {search && ` for "${search}"`}
                </h2>
              </div>

              <motion.div 
                className="products-grid"
                initial="hidden"
                animate="visible"
                variants={{
                  visible: {
                    transition: { staggerChildren: 0.1 }
                  }
                }}
              >
                {searchedData?.products.map((product) => (
                  <motion.div
                    key={product._id}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0 }
                    }}
                  >
                    <ProductCard
                      productId={product._id}
                      name={product.name}
                      price={product.price}
                      stock={product.stock}
                      handler={addToCartHandler}
                      photos={product.photos}
                    />
                  </motion.div>
                ))}
              </motion.div>

              {searchedData && searchedData.totalPage > 1 && (
                <div className="pagination">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                  >
                    Previous
                  </button>
                  <span>
                    Page {page} of {searchedData.totalPage}
                  </span>
                  <button
                    disabled={page === searchedData.totalPage}
                    onClick={() => setPage(p => p + 1)}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Search;