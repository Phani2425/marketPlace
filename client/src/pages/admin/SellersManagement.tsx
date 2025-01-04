import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { FaSearch, FaSort, FaStore, FaStar, FaChartLine, FaUndo } from "react-icons/fa";
import axios from "axios";
import { toast } from "react-hot-toast";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import AdminSidebar from "../../components/admin/AdminSidebar";
import { Skeleton } from "../../components/loader";
import { RootState } from "../../redux/store";

interface SellerData {
  id: string;
  name: string;
  storeName: string;
  storeImage: string;
  rating: number;
  totalProducts: number;
  totalRevenue: number;
  totalOrders: number;
  status: "approved" | "blocked";
  joinedDate: string;
}

interface Filters {
  minRevenue: number;
  maxRevenue: number;
  minRating: number;
  status: string;
  productCount: string;
  joinedDate: string;
}

const SellersManagement = () => {
  const { user } = useSelector((state: RootState) => state.userReducer);
  const [loading, setLoading] = useState(true);
  const [sellers, setSellers] = useState<SellerData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<keyof SellerData>("rating");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filters, setFilters] = useState<Filters>({
    minRevenue: 0,
    maxRevenue: Infinity,
    minRating: 0,
    status: "all",
    productCount: "all",
    joinedDate: "all",
  });

  useEffect(() => {
    fetchSellers();
  }, [user]);

  const fetchSellers = async () => {
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_SERVER}/api/v1/admin/sellers?id=${user?._id}`
      );
      setSellers(data.sellers);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || "Error fetching sellers");
      } else {
        toast.error("Error fetching sellers");
      }
    } finally {
      setLoading(false);
    }
  };

  const getProductCountRange = (count: string) => {
    switch (count) {
      case "low":
        return { min: 0, max: 9 };
      case "medium":
        return { min: 10, max: 50 };
      case "high":
        return { min: 51, max: Infinity };
      default:
        return { min: 0, max: Infinity };
    }
  };

  const getJoinedDateRange = (range: string) => {
    const now = new Date();
    switch (range) {
      case "lastWeek":
        return new Date(now.setDate(now.getDate() - 7));
      case "lastMonth":
        return new Date(now.setMonth(now.getMonth() - 1));
      case "last3Months":
        return new Date(now.setMonth(now.getMonth() - 3));
      default:
        return new Date(0);
    }
  };

  const filteredAndSortedSellers = sellers
    .filter((seller) => {
      const matchesSearch =
        seller.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        seller.name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRevenue =
        seller.totalRevenue >= filters.minRevenue &&
        seller.totalRevenue <= filters.maxRevenue;

      const matchesRating = seller.rating >= filters.minRating;

      const matchesStatus =
        filters.status === "all" || seller.status === filters.status;

      const productRange = getProductCountRange(filters.productCount);
      const matchesProductCount =
        seller.totalProducts >= productRange.min &&
        seller.totalProducts <= productRange.max;

      const joinedDate = new Date(seller.joinedDate);
      const dateLimit = getJoinedDateRange(filters.joinedDate);
      const matchesJoinedDate = joinedDate >= dateLimit;

      return (
        matchesSearch &&
        matchesRevenue &&
        matchesRating &&
        matchesStatus &&
        matchesProductCount &&
        matchesJoinedDate
      );
    })
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
      }

      return sortOrder === "asc"
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });

  const columns: GridColDef[] = [
    {
      field: "storeName",
      headerName: "Store",
      flex: 2,
      renderCell: (params) => (
        <div className="seller-info">
          <div className="store-avatar">
            {params.row.storeImage ? (
              <img src={params.row.storeImage} alt={params.row.storeName} />
            ) : (
              <FaStore />
            )}
          </div>
          <div className="store-details">
            <h3>{params.row.storeName}</h3>
          </div>
        </div>
      ),
    },
    {
      field: "rating",
      headerName: "Rating",
      flex: 1,
      renderCell: (params) => (
        <div className="rating">
          <FaStar /> {params.value.toFixed(1)}
        </div>
      ),
    },
    {
      field: "totalProducts",
      headerName: "Products",
      flex: 1,
      type: "number",
    },
    {
      field: "totalRevenue",
      headerName: "Revenue",
      flex: 1,
      renderCell: (params) => (
        <span className="revenue">₹{params.value.toLocaleString()}</span>
      ),
    },
    {
      field: "status",
      headerName: "Status",
      flex: 1,
      renderCell: (params) => (
        <div className={`status-badge ${params.value}`}>{params.value}</div>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 1,
      renderCell: (params) => (
        <div className="actions">
          <Link to={`/admin/seller/${params.row.id}`} className="view-btn">
            <FaChartLine /> Analytics
          </Link>
        </div>
      ),
    },
  ];

  const resetFilters = () => {
    setSearchQuery("");
    setSortField("rating");
    setSortOrder("desc");
    setFilters({
      minRevenue: 0,
      maxRevenue: Infinity,
      minRating: 0,
      status: "all",
      productCount: "all",
      joinedDate: "all",
    });
  };

  return (
    <div className="admin-container">
      <AdminSidebar />
      <main className="sellers-management">
        <h1>Sellers Management</h1>

        <div className="controls-panel">
        <div className="controls-header">
          <div className="search-sort">
            <div className="search-bar">
              <FaSearch />
              <input
                type="text"
                placeholder="Search sellers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="sort-options">
              <select
                value={sortField}
                onChange={(e) =>
                  setSortField(e.target.value as keyof SellerData)
                }
              >
                <option value="rating">Rating</option>
                <option value="totalProducts">Products</option>
                <option value="totalRevenue">Revenue</option>
                <option value="totalOrders">Orders</option>
              </select>
              <button
                onClick={() =>
                  setSortOrder((order) => (order === "asc" ? "desc" : "asc"))
                }
              >
                <FaSort /> {sortOrder.toUpperCase()}
              </button>
            </div>
          </div>
          <button className="reset-btn" onClick={resetFilters}>
            <FaUndo /> Reset Filters
          </button>
          </div>

          <div className="filter-panel">
            <div className="filter-section">
              <h3>Revenue Range</h3>
              <div className="range-inputs">
                <input
                  type="number"
                  placeholder="Min Revenue"
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      minRevenue: Number(e.target.value) || 0,
                    }))
                  }
                />
                <input
                  type="number"
                  placeholder="Max Revenue"
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      maxRevenue: Number(e.target.value) || Infinity,
                    }))
                  }
                />
              </div>
            </div>

            <div className="filter-section">
              <h3>Minimum Rating</h3>
              <div className="rating-selector">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    className={filters.minRating === rating ? "active" : ""}
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        minRating: rating,
                      }))
                    }
                  >
                    {rating}⭐ & up
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-section">
              <h3>Status</h3>
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    status: e.target.value,
                  }))
                }
              >
                <option value="all">All</option>
                <option value="approved">Approved</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>

            <div className="filter-section">
              <h3>Product Count</h3>
              <select
                value={filters.productCount}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    productCount: e.target.value,
                  }))
                }
              >
                <option value="all">All</option>
                <option value="low">Low (&lt; 10)</option>
                <option value="medium">Medium (10-50)</option>
                <option value="high">High (&gt; 50)</option>
              </select>
            </div>

            <div className="filter-section">
              <h3>Joined Date</h3>
              <select
                value={filters.joinedDate}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    joinedDate: e.target.value,
                  }))
                }
              >
                <option value="all">All Time</option>
                <option value="lastWeek">Last Week</option>
                <option value="lastMonth">Last Month</option>
                <option value="last3Months">Last 3 Months</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <Skeleton length={10} />
        ) : (
          <DataGrid
            rows={filteredAndSortedSellers}
            columns={columns}
            initialState={{
              pagination: {
                paginationModel: {
                  pageSize: 10,
                },
              },
            }}
            pageSizeOptions={[10, 25, 50]}
            className="data-grid"
            autoHeight
            disableRowSelectionOnClick
          />
        )}
      </main>
    </div>
  );
};

export default SellersManagement;
