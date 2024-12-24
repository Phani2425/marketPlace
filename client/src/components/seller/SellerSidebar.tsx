import { useEffect, useState } from "react";
import { Link, Location, useLocation } from "react-router-dom";
import { IconType } from "react-icons";
import { 
  RiDashboardFill, 
  RiShoppingBag3Fill,
  RiAddCircleFill
} from "react-icons/ri";
import { FaBox, FaChartLine, FaStore, FaBars,FaTimes} from "react-icons/fa";
import {useSelector} from 'react-redux'
import { RootState } from '../../redux/store';

const SellerSidebar = () => {
  const location = useLocation();
  const [showModal, setShowModal] = useState<boolean>(false);
  const [phoneActive, setPhoneActive] = useState<boolean>(window.innerWidth < 1100);

  const toggleSidebar = () => {
    setShowModal(prev => !prev);
  };

  const closeSidebar = () => {
    setShowModal(false);
  };

  useEffect(() => {
    const resizeHandler = () => {
      setPhoneActive(window.innerWidth < 1100);
      if (window.innerWidth >= 1100) {
        setShowModal(false);
      }
    };

    window.addEventListener("resize", resizeHandler);
    return () => window.removeEventListener("resize", resizeHandler);
  }, []);

  return (
    <>
      {phoneActive && (
        <button className="toggle-sidebar" onClick={toggleSidebar}>
          <FaBars />
        </button>
      )}
      <aside
        style={
          phoneActive
            ? {
                width: "20rem",
                height: "100vh",
                position: "fixed",
                top: 0,
                left: showModal ? "0" : "-20rem",
                transition: "all 0.5s",
                zIndex: 1000,
              }
            : {}
        }
      >
        <div className="sidebar-header">
          <h2>Seller Panel</h2>
          {phoneActive && (
            <button className="close-btn" onClick={closeSidebar}>
              <FaTimes />
            </button>
          )}
        </div>
        <DivOne location={location} />
      </aside>
      {showModal && phoneActive && (
        <div className="sidebar-overlay" onClick={closeSidebar} />
      )}
    </>
  );
};

const DivOne = ({ location }: { location: Location }) => {
  const { user } = useSelector((state: RootState) => state.userReducer);
  return(
    <div>
    <h5>Dashboard</h5>
    <ul>
      <Li
        url="/seller/dashboard"
        text="Dashboard"
        Icon={RiDashboardFill}
        location={location}
      />
      <Li
        url="/seller/products"
        text="Products"
        Icon={RiShoppingBag3Fill}
        location={location}
      />
      <Li
        url="/seller/product/new"
        text="Add Product"
        Icon={RiAddCircleFill}
        location={location}
      />
      <Li
        url="/seller/orders"
        text="Orders"
        Icon={FaBox}
        location={location}
      />
      <Li
        url="/seller/analytics"
        text="Analytics"
        Icon={FaChartLine}
        location={location}
      />
        <Li
          url={`/store/${user?._id}`} // Use actual user ID instead of localStorage
          text="View Store"
          Icon={FaStore}
          location={location}
        />
    </ul>
  </div>
  )
}

interface LiProps {
  url: string;
  text: string;
  location: Location;
  Icon: IconType;
}

const Li = ({ url, text, location, Icon }: LiProps) => (
  <li
    style={{
      backgroundColor: location.pathname.includes(url)
        ? "rgba(0,115,255,0.1)"
        : "white",
    }}
  >
    <Link
      to={url}
      style={{
        color: location.pathname.includes(url) ? "rgb(0,115,255)" : "black",
      }}
    >
      <Icon /> {text}
    </Link>
  </li>
);

export default SellerSidebar;