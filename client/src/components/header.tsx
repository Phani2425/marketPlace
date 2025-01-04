import  { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  FaSearch,
  FaShoppingBag,
  FaSignInAlt,
  FaUser,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaAngleLeft,
  FaList,
  FaStore,
  FaStar
} from "react-icons/fa";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { User } from "../types/types";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import toast from "react-hot-toast";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import debounce from 'lodash/debounce';
import {useNavigate} from 'react-router-dom';



const categories = [
  "Electronics",
  "Mobiles", 
  "Laptops", 
  "Books", 
  "Fashion", 
  "Appliances", 
  "Furniture", 
  "Home Decor", 
  "Grocery", 
  "Beauty", 
  "Toys", 
  "Fitness"
];

interface PropsType {
  user: User | null;
}
interface SellerSearchResult {
  _id: string;
  storeName: string;
  storeImage?: string;
  totalProducts: number;
  rating: number;
}


const Header = ({ user }: PropsType) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isCategoriesView, setIsCategoriesView] = useState<boolean>(false);
  const cartItems = useSelector((state: RootState) => state.cartReducer.cartItems);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Add seller search input and state
const [sellerSearch, setSellerSearch] = useState<string>("");
const [searchResults, setSearchResults] = useState<SellerSearchResult[]>([]);
const [showSearchResults, setShowSearchResults] = useState(false);
const [isSearching, setIsSearching] = useState(false);
const searchRef = useRef<HTMLDivElement>(null);
const navigate = useNavigate();

 // Debounced search handler
 const debouncedSearch = debounce(async (query: string) => {
  if (query.length < 2) {
    setSearchResults([]);
    setShowSearchResults(false);
    setIsSearching(false);
    return;
  }

  setIsSearching(true);
  try {
    const { data } = await axios.get(
      `${import.meta.env.VITE_SERVER}/api/v1/seller/search?query=${query}`
    );
    if (data.success && Array.isArray(data.sellers)) {
      setSearchResults(data.sellers);
      setShowSearchResults(true);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  } catch (error) {
    console.error('Error searching sellers:', error);
    setSearchResults([]);
  } finally {
    setIsSearching(false);
  }
}, 300);

const handleSellerSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
  const query = e.target.value;
  setSellerSearch(query);
  debouncedSearch(query);
};

useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
      setShowSearchResults(false);
      setSellerSearch("");
    }
    if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node) && isSidebarOpen) {
      resetSidebar();
    }
  };

  const handleResize = () => {
    if (window.innerWidth >= 768) {
      resetSidebar();
    }
  };

  window.addEventListener('resize', handleResize);
  document.addEventListener('mousedown', handleClickOutside);

  return () => {
    window.removeEventListener('resize', handleResize);
    document.removeEventListener('mousedown', handleClickOutside);
  };
}, [isSidebarOpen]);

const resetSidebar = () => {
  setIsOpen(false);
  setIsSidebarOpen(false);
  setIsCategoriesView(false);
};

const logoutHandler = async () => {
  try {
    localStorage.removeItem('adminData');
    localStorage.removeItem('sellerData');
    await signOut(auth);
    toast.success("Sign Out Successfully");
    resetSidebar();
    navigate('/');
  } catch (error) {
    toast.error("Sign Out Failed");
  }
};


  const renderSidebarContent = () => {
     if(isSidebarOpen){
      if (isCategoriesView) {
        return (
          <div className="sidebar-content">
            <ul className="categories-list">
              <li className="categories-header">
                <button 
                  className="back-btn" 
                  onClick={() => setIsCategoriesView(false)}
                >
                  <FaAngleLeft /> 
                </button>
                <h2>Categories</h2>
              </li>
              {categories.map((category) => (
                <li key={category}>
                  <Link 
                    onClick={resetSidebar} 
                    to={`/search?category=${category.toLowerCase()}`}
                  >
                    {category}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        );
      }
  
      return (
        <div className="sidebar-content">
          <div className="sidebar-header">
            <h2>Menu</h2>
            <button 
              className="close-btn" 
              onClick={resetSidebar}
            >
              <FaTimes />
            </button>
          </div>
          <ul className="main-menu">
            <li>
              <Link onClick={resetSidebar} to={"/search"}>
                <FaSearch /> Search
              </Link>
            </li>
            <li>
              <Link onClick={resetSidebar} to={"/cart"} className="cart-link">
                <FaShoppingBag /> Cart 
                {cartItems.length > 0 && (
                  <span className="cart-count">{cartItems.length}</span>
                )}
              </Link>
            </li>
            
            <li>
              <button 
                className="categories-btn"
                onClick={() => setIsCategoriesView(true)}
              >
                <FaList /> Categories
              </button>
            </li>
  
            {user?._id ? (
              <>
                {user.role === "admin" && (
                  <li>
                    <Link 
                      onClick={resetSidebar} 
                      to="/admin/dashboard"
                    >
                      <FaUser /> Admin Dashboard
                    </Link>
                  </li>
                )}
                                  {user.role === "seller" && (
                    <Link onClick={resetSidebar} to="/seller/dashboard">
                      Seller Dashboard
                    </Link>
                  )}
                  {user.role === "user" && (
                    <Link onClick={resetSidebar} to="/become-seller">
                      Become a Seller
                    </Link>
                  )}
                <li>
                  <Link onClick={resetSidebar} to="/orders">
                    <FaUser /> My Orders
                  </Link>
                </li>
                <li>
                  <button 
                    className="logout-btn"
                    onClick={logoutHandler}
                  >
                    <FaSignOutAlt /> Sign Out
                  </button>
                </li>
              </>
            ) : (
              <li>
                <Link to={"/login"}>
                  <FaSignInAlt /> Login
                </Link>
              </li>
            )}
          </ul>
        </div>
      );
     }
  };

  return (
    <>
      <nav className="header">
        <div className="header-content">
          <Link className="logo" onClick={resetSidebar} to={"/"}>
            DisposableMart
          </Link>

          <div className="seller-search" ref={searchRef}>
          <div className="search-input-wrapper">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search for sellers..."
              value={sellerSearch}
              onChange={handleSellerSearch}
              className="search-input"
            />
            {isSearching && (
              <motion.div
                className="search-loader"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            )}
          </div>
          <AnimatePresence>
      {showSearchResults && searchResults.length > 0 && (
        <motion.div
          className="search-results"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {Array.isArray(searchResults) && searchResults.map((seller) => (
            <Link
              key={seller._id}
              to={`/store/${seller._id}`}
              className="seller-result"
              onClick={() => {
                setSellerSearch('');
                setShowSearchResults(false);
              }}
            >
              <div className="seller-info">
                {seller.storeImage ? (
                  <img src={seller.storeImage} alt={seller.storeName} />
                ) : (
                  <FaStore className="store-icon" />
                )} <div className="seller-details">
                <h4>{seller.storeName}</h4>
                <span>{seller.totalProducts} products</span>
              </div>
            </div>
            <div className="seller-rating">
              <FaStar /> {(seller.rating || 0).toFixed(1)}
            </div>
          </Link>
        ))}
      </motion.div>
    )}
  </AnimatePresence>
        </div>
          
          {/* Desktop Navigation */}
          <div className="nav">
            <Link onClick={resetSidebar} to={"/search"}>
              <FaSearch className="white" />
            </Link>
            <Link onClick={resetSidebar} to={"/cart"} className="cart-icon">
              <FaShoppingBag className="white" />
              {cartItems.length > 0 && (
                <span className="cart-count">{cartItems.length}</span>
              )}
            </Link>
            {user?._id ? (
              <>
                <button className="user-icon" onClick={() => setIsOpen((prev) => !prev)}>
                  <FaUser />
                </button>
                <dialog open={isOpen}>
                  <div>
                    {user.role === "admin" && (
                      <Link 
                        state={{color:'#fff'}} 
                        onClick={resetSidebar} 
                        to="/admin/dashboard"
                      >
                        Admin
                      </Link>
                    )}
                    {user.role === "seller" && (
                    <Link onClick={resetSidebar} to="/seller/dashboard">
                      Seller Dashboard
                    </Link>
                  )}
                  {user.role === "user" && (
                    <Link onClick={resetSidebar} to="/become-seller">
                      Become a Seller
                    </Link>
                  )}
                    <Link onClick={resetSidebar} to="/orders">
                      Orders
                    </Link>
                    <button onClick={logoutHandler}>
                      <FaSignOutAlt  />
                      Sign Out
                    </button>
                  </div>
                </dialog>
              </>
            ) : (
              <Link to={"/login"}>
                <FaSignInAlt className="white" />
              </Link>
            )}
          </div>

          {/* Hamburger Menu for Mobile */}
          <button 
            className="hamburger-menu" 
            onClick={() => setIsSidebarOpen(true)}
          >
            <FaBars />
          </button>
        </div>
      </nav>

      {/* Mobile Sidebar */}
      <div 
        ref={sidebarRef}
        className={`sidebar ${isSidebarOpen ? 'open' : ''}`}
      >
        {renderSidebarContent()}
      </div>
    </>
  );
};

export default Header;