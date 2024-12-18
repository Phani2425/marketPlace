import React, { useState, useEffect, useRef } from "react";
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
} from "react-icons/fa";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { User } from "../types/types";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import toast from "react-hot-toast";

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

const Header = ({ user }: PropsType) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isCategoriesView, setIsCategoriesView] = useState<boolean>(false);
  const cartItems = useSelector((state: RootState) => state.cartReducer.cartItems);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Add event listener to close sidebar on screen resize and outside click
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        resetSidebar();
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (
        sidebarRef.current && 
        !sidebarRef.current.contains(event.target as Node) && 
        isSidebarOpen
      ) {
        resetSidebar();
      }
    };

    // Add event listeners
    window.addEventListener('resize', handleResize);
    document.addEventListener('mousedown', handleClickOutside);

    // Cleanup event listeners
    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSidebarOpen]);

  const logoutHandler = async () => {
    try {
      await signOut(auth);
      toast.success("Sign Out Successfully");
      resetSidebar();
    } catch (error) {
      toast.error("Sign Out Fail");
    }
  };

  const resetSidebar = () => {
    setIsOpen(false);
    setIsSidebarOpen(false);
    setIsCategoriesView(false);
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
            MarketPlace
          </Link>
          
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