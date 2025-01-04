import { onAuthStateChanged } from "firebase/auth";
import { Suspense, lazy, useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import Header from "./components/header";
import Loader, { LoaderLayout } from "./components/loader";
import ProtectedRoute from "./components/protected-route";
import { auth } from "./firebase";
import { getUser } from "./redux/api/userAPI";
import { userExist, userNotExist } from "./redux/reducer/userReducer";
import { RootState } from "./redux/store";
import Footer from "./components/footer";
import SellersManagement from "./pages/admin/SellersManagement";
import SellerDetail from "./pages/admin/SellerDetail";
import { ThemeProvider, createTheme } from '@mui/material/styles';

const theme = createTheme();

const Home = lazy(() => import("./pages/home"));
const Search = lazy(() => import("./pages/search"));
const ProductDetails = lazy(() => import("./pages/product-details"));
const Cart = lazy(() => import("./pages/cart"));
const Shipping = lazy(() => import("./pages/shipping"));
const Login = lazy(() => import("./pages/login"));
const Orders = lazy(() => import("./pages/orders"));
const OrderDetails = lazy(() => import("./pages/order-details"));
const NotFound = lazy(() => import("./pages/not-found"));
const Checkout = lazy(() => import("./pages/checkout"));

// Admin Routes Importing
const Dashboard = lazy(() => import("./pages/admin/dashboard"));
const Products = lazy(() => import("./pages/admin/products"));
const Customers = lazy(() => import("./pages/admin/customers"));
const Transaction = lazy(() => import("./pages/admin/transaction"));
const Discount = lazy(() => import("./pages/admin/discount"));
const Barcharts = lazy(() => import("./pages/admin/charts/barcharts"));
const Piecharts = lazy(() => import("./pages/admin/charts/piecharts"));
const Linecharts = lazy(() => import("./pages/admin/charts/linecharts"));
const Coupon = lazy(() => import("./pages/admin/apps/coupon"));
const NewProduct = lazy(() => import("./pages/admin/management/newproduct"));
const ProductManagement = lazy(
  () => import("./pages/admin/management/productmanagement")
);
const TransactionManagement = lazy(
  () => import("./pages/admin/management/transactionmanagement")
);
const DiscountManagement = lazy(
  () => import("./pages/admin/management/discountmanagement")
);

const NewDiscount = lazy(() => import("./pages/admin/management/newdiscount"));
const SellerApplications = lazy(
  () => import("./pages/admin/SellerApplications")
);

// Seller Routes
const SellerDashboard = lazy(() => import("./pages/seller/Dashboard"));
const BecomeSellerForm = lazy(() => import("./pages/seller/BecomeSellerForm"));
const ProductListing = lazy(() => import("./pages/seller/ProductListing"));
const SellerNewProduct = lazy(() => import("./pages/seller/SellerNewProduct"));
const EditProduct = lazy(() => import("./pages/seller/EditProduct"));
const StoreView = lazy(() => import("./pages/seller/StoreView"));
const SellerOrders = lazy(() => import("./pages/seller/Orders"));
const SellerAnalytics = lazy(() => import("./pages/seller/Analytics"));
const SellerLogin = lazy(() => import("./pages/seller/SellerLogin"));

const App = () => {
  const { user, loading } = useSelector(
    (state: RootState) => state.userReducer
  );

  const dispatch = useDispatch();

  useEffect(() => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        const data = await getUser(user.uid);
        dispatch(userExist(data.user));
      } else {
        // Check for stored admin/seller data when no regular user is logged in
        const adminDataStr = localStorage.getItem("adminData");
        const sellerDataStr = localStorage.getItem("sellerData");
        const now = new Date().getTime();
  
        if (adminDataStr) {
          const adminData = JSON.parse(adminDataStr);
          if (now < adminData.expiresAt) {
            dispatch(userExist(adminData.user));
          } else {
            localStorage.removeItem("adminData");
            dispatch(userNotExist());
          }
        } else if (sellerDataStr) {
          const sellerData = JSON.parse(sellerDataStr);
          if (now < sellerData.expiresAt) {
            dispatch(userExist(sellerData.user));
          } else {
            localStorage.removeItem("sellerData");
            dispatch(userNotExist());
          }
        } else {
          dispatch(userNotExist());
        }
      }
    });
  }, []);

  return loading ? (
    <Loader />
  ) : (
    <ThemeProvider theme={theme}>
    <Router>
      {/* Header */}
      <Header user={user} />
      <Suspense fallback={<LoaderLayout />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/store/:id" element={<StoreView />} />
          <Route path="/seller-login" element={<SellerLogin />} />
          {/* Not logged In Route */}
          <Route
            path="/login"
            element={
              <ProtectedRoute isAuthenticated={user ? false : true}>
                <Login />
              </ProtectedRoute>
            }
          />
          {/* Logged In User Routes */}
          <Route
            element={<ProtectedRoute isAuthenticated={user ? true : false} />}
          >
            <Route path="/shipping" element={<Shipping />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/order/:id" element={<OrderDetails />} />
            <Route path="/pay" element={<Checkout />} />
            <Route path="/become-seller" element={<BecomeSellerForm />} />
          </Route>
          {/* Admin Routes */}
          <Route
            element={
              <ProtectedRoute
                isAuthenticated={true}
                adminOnly={true}
                admin={user?.role === "admin" ? true : false}
              />
            }
          >
            <Route path="/admin/dashboard" element={<Dashboard />} />
            <Route path="/admin/product" element={<Products />} />
            <Route path="/admin/customer" element={<Customers />} />
            <Route path="/admin/transaction" element={<Transaction />} />
            <Route path="/admin/discount" element={<Discount />} />
            <Route path="/admin/sellers" element={<SellersManagement />} />
            <Route path="/admin/seller/:id" element={<SellerDetail />} />

            {/* Charts */}
            <Route path="/admin/chart/bar" element={<Barcharts />} />
            <Route path="/admin/chart/pie" element={<Piecharts />} />
            <Route path="/admin/chart/line" element={<Linecharts />} />
            {/* Apps */}
            <Route path="/admin/app/coupon" element={<Coupon />} />

            {/* Management */}
            <Route path="/admin/product/new" element={<NewProduct />} />

            <Route path="/admin/product/:id" element={<ProductManagement />} />

            <Route
              path="/admin/transaction/:id"
              element={<TransactionManagement />}
            />

            <Route path="/admin/discount/new" element={<NewDiscount />} />

            <Route
              path="/admin/discount/:id"
              element={<DiscountManagement />}
            />

            <Route
              path="/admin/seller-applications"
              element={<SellerApplications />}
            />
          </Route>

          {/* Seller Routes */}
          <Route
            element={
              <ProtectedRoute
                isAuthenticated={user ? true : false}
                sellerOnly={true}
                seller={user?.role === "seller"}
              />
            }
          >
            <Route path="/seller/dashboard" element={<SellerDashboard />} />
            <Route path="/seller/products" element={<ProductListing />} />
            <Route path="/seller/product/new" element={<SellerNewProduct />} />
            <Route path="/seller/product/:id" element={<EditProduct />} />
            <Route path="/seller/orders" element={<SellerOrders />} />
            <Route path="/seller/analytics" element={<SellerAnalytics />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      <Footer />
      <Toaster position="bottom-center" />
    </Router>
    </ThemeProvider>
  );
};

export default App;
