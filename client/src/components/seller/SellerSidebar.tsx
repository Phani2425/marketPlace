import { useEffect, useState } from "react";
import { Link, Location, useLocation } from "react-router-dom";
import { IconType } from "react-icons";
import { 
  RiDashboardFill, 
  RiShoppingBag3Fill,
  RiAddCircleFill
} from "react-icons/ri";
import { FaBox, FaChartLine, FaStore } from "react-icons/fa";
import {useSelector} from 'react-redux'

const SellerSidebar = () => {
  const location = useLocation();
  const [showModal, setShowModal] = useState<boolean>(false);
  const [phoneActive, setPhoneActive] = useState<boolean>(
    window.innerWidth < 1100
  );

  const resizeHandler = () => {
    setPhoneActive(window.innerWidth < 1100);
  };

  useEffect(() => {
    window.addEventListener("resize", resizeHandler);
    return () => {
      window.removeEventListener("resize", resizeHandler);
    };
  }, []);

  return (
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
            }
          : {}
      }
    >
      <h2>Seller Panel</h2>
      <DivOne location={location} />
    </aside>
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