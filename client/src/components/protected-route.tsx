import { ReactElement } from "react";
import { Navigate, Outlet } from "react-router-dom";

interface Props {
  children?: ReactElement;
  isAuthenticated: boolean;
  adminOnly?: boolean;
  sellerOnly?: boolean;
  admin?: boolean;
  seller?: boolean;
  redirect?: string;
}

const ProtectedRoute = ({
  isAuthenticated,
  children,
  adminOnly,
  sellerOnly,
  admin,
  seller,
  redirect = "/",
}: Props) => {
  if (!isAuthenticated) return <Navigate to={redirect} />;

  if (adminOnly && !admin) return <Navigate to={redirect} />;
  
  if (sellerOnly && !seller) return <Navigate to={redirect} />;

  return children ? children : <Outlet />;
};

export default ProtectedRoute;