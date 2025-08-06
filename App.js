// React Frontend Application (App.js)
// This is a simplified structure. In a real application,
// you would break this into many smaller components.

import React, { useState, useEffect } from 'react';
// Tailwind CSS is assumed to be configured in your project
// For a quick setup, you can include its CDN in public/index.html:
// <script src="https://cdn.tailwindcss.com"></script>

// Base URL for your Flask API
const API_BASE_URL = 'http://127.0.0.1:5000/api';

// Main App Component
function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'

  // Function to show transient messages
  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 3000); // Message disappears after 3 seconds
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-800 flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 shadow-md">
        <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center">
          <h1 className="text-3xl font-bold mb-2 sm:mb-0">Fuel Inventory System</h1>
          <nav className="flex space-x-4">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
                activeTab === 'dashboard' ? 'bg-blue-700 shadow-lg' : 'hover:bg-blue-700'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('priceEntry')}
              className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
                activeTab === 'priceEntry' ? 'bg-blue-700 shadow-lg' : 'hover:bg-blue-700'
              }`}
            >
              Price Entry
            </button>
            <button
              onClick={() => setActiveTab('transactionEntry')}
              className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
                activeTab === 'transactionEntry' ? 'bg-blue-700 shadow-lg' : 'hover:bg-blue-700'
              }`}
            >
              Transaction Entry
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
                activeTab === 'reports' ? 'bg-blue-700 shadow-lg' : 'hover:bg-blue-700'
              }`}
            >
              Reports
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
        {message && (
          <div className={`p-3 mb-4 rounded-lg text-white ${messageType === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
            {message}
          </div>
        )}

        {activeTab === 'dashboard' && <Dashboard showMessage={showMessage} />}
        {activeTab === 'priceEntry' && <PriceEntry showMessage={showMessage} />}
        {activeTab === 'transactionEntry' && <TransactionEntry showMessage={showMessage} />}
        {activeTab === 'reports' && <Reports showMessage={showMessage} />}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white p-4 text-center text-sm">
        <p>&copy; {new Date().getFullYear()} Fuel Inventory Management System. All rights reserved.</p>
      </footer>
    </div>
  );
}

// --- Dashboard Component ---
function Dashboard({ showMessage }) {
  const [inventory, setInventory] = useState([]);
  const [fluctuations, setFluctuations] = useState([]);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    fetchInventory();
    fetchFluctuations();
    fetchTransactions();
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/fuelinventory`);
      if (!response.ok) throw new Error('Failed to fetch inventory');
      const data = await response.json();
      setInventory(data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      showMessage('Failed to load inventory data.', 'error');
    }
  };

  const fetchFluctuations = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/pricefluctuations`);
      if (!response.ok) throw new Error('Failed to fetch price fluctuations');
      const data = await response.json();
      setFluctuations(data);
    } catch (error) {
      console.error('Error fetching fluctuations:', error);
      showMessage('Failed to load price fluctuation data.', 'error');
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/fueltransactions`);
      if (!response.ok) throw new Error('Failed to fetch transactions');
      const data = await response.json();
      setTransactions(data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      showMessage('Failed to load transaction data.', 'error');
    }
  };

  // Calculate total stock by fuel type for overview
  const totalStockByFuelType = inventory.reduce((acc, item) => {
    acc[item.fuelTypeName] = (acc[item.fuelTypeName] || 0) + item.currentStock;
    return acc;
  }, {});

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Current Fuel Stock Overview */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold mb-4 text-blue-700">Current Fuel Stock</h2>
        {Object.keys(totalStockByFuelType).length > 0 ? (
          <ul className="space-y-2">
            {Object.entries(totalStockByFuelType).map(([type, stock]) => (
              <li key={type} className="flex justify-between items-center text-lg">
                <span className="font-medium">{type}:</span>
                <span className="text-gray-700">{stock.toFixed(2)} Liters</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600">No fuel stock data available.</p>
        )}
      </div>

      {/* Recent Price Fluctuations */}
      <div className="bg-white p-6 rounded-lg shadow-lg col-span-1 md:col-span-2 lg:col-span-1">
        <h2 className="text-2xl font-semibold mb-4 text-blue-700">Recent Price Fluctuations</h2>
        {fluctuations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg overflow-hidden">
              <thead className="bg-gray-200">
                <tr>
                  <th className="py-2 px-3 text-left text-sm font-medium text-gray-600">Fuel Type</th>
                  <th className="py-2 px-3 text-left text-sm font-medium text-gray-600">Date</th>
                  <th className="py-2 px-3 text-left text-sm font-medium text-gray-600">Current Price</th>
                  <th className="py-2 px-3 text-left text-sm font-medium text-gray-600">Change</th>
                </tr>
              </thead>
              <tbody>
                {fluctuations.slice(0, 5).map((f) => (
                  <tr key={f.fluctuationID} className="border-b border-gray-200 last:border-b-0">
                    <td className="py-2 px-3 text-sm">{f.fuelTypeName}</td>
                    <td className="py-2 px-3 text-sm">{f.fluctuationDate}</td>
                    <td className="py-2 px-3 text-sm">{f.currentPrice.toFixed(2)}</td>
                    <td className={`py-2 px-3 text-sm ${f.fluctuationType === 'Increase' ? 'text-green-600' : f.fluctuationType === 'Decrease' ? 'text-red-600' : 'text-gray-500'}`}>
                      {f.fluctuationAmount ? `${f.fluctuationAmount.toFixed(2)} (${f.fluctuationType})` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-600">No recent price fluctuations.</p>
        )}
      </div>

      {/* Recent Transactions Summary */}
      <div className="bg-white p-6 rounded-lg shadow-lg col-span-1 md:col-span-2 lg:col-span-1">
        <h2 className="text-2xl font-semibold mb-4 text-blue-700">Recent Transactions</h2>
        {transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg overflow-hidden">
              <thead className="bg-gray-200">
                <tr>
                  <th className="py-2 px-3 text-left text-sm font-medium text-gray-600">ID</th>
                  <th className="py-2 px-3 text-left text-sm font-medium text-gray-600">Type</th>
                  <th className="py-2 px-3 text-left text-sm font-medium text-gray-600">Fuel</th>
                  <th className="py-2 px-3 text-left text-sm font-medium text-gray-600">Qty</th>
                  <th className="py-2 px-3 text-left text-sm font-medium text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 5).map((t) => (
                  <tr key={t.transactionID} className="border-b border-gray-200 last:border-b-0">
                    <td className="py-2 px-3 text-sm">{t.usageTransitionID.substring(0, 8)}...</td>
                    <td className="py-2 px-3 text-sm">{t.transactionType}</td>
                    <td className="py-2 px-3 text-sm">{t.fuelTypeName}</td>
                    <td className="py-2 px-3 text-sm">{t.quantity.toFixed(2)}</td>
                    <td className="py-2 px-3 text-sm">{new Date(t.transactionDate).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-600">No recent transactions.</p>
        )}
      </div>
    </div>
  );
}

// --- Price Entry Component ---
function PriceEntry({ showMessage }) {
  const [fuelTypes, setFuelTypes] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [townships, setTownships] = useState([]);
  const [sites, setSites] = useState([]);

  const [formData, setFormData] = useState({
    fuelTypeID: '',
    price: '',
    effectiveDate: '',
    supplierID: '',
    townshipID: '',
    siteID: '',
  });

  useEffect(() => {
    fetchMasterData();
  }, []);

  const fetchMasterData = async () => {
    try {
      const [fuelTypesRes, suppliersRes, townshipsRes, sitesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/fueltypes`),
        fetch(`${API_BASE_URL}/suppliers`),
        fetch(`${API_BASE_URL}/townships`),
        fetch(`${API_BASE_URL}/sites`),
      ]);

      const fuelTypesData = await fuelTypesRes.json();
      const suppliersData = await suppliersRes.json();
      const townshipsData = await townshipsRes.json();
      const sitesData = await sitesRes.json();

      setFuelTypes(fuelTypesData);
      setSuppliers(suppliersData);
      setTownships(townshipsData);
      setSites(sitesData);
    } catch (error) {
      console.error('Error fetching master data:', error);
      showMessage('Failed to load master data for price entry.', 'error');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value === '' ? null : value, // Set to null if empty string for optional fields
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/fuelprices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          fuelTypeID: parseInt(formData.fuelTypeID),
          price: parseFloat(formData.price),
          supplierID: formData.supplierID ? parseInt(formData.supplierID) : null,
          townshipID: formData.townshipID ? parseInt(formData.townshipID) : null,
          siteID: formData.siteID ? parseInt(formData.siteID) : null,
        }),
      });

      const result = await response.json();
      if (response.ok) {
        showMessage(result.message, 'success');
        setFormData({ // Reset form
          fuelTypeID: '', price: '', effectiveDate: '',
          supplierID: '', townshipID: '', siteID: '',
        });
      } else {
        showMessage(`Error: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('Error submitting price:', error);
      showMessage('An unexpected error occurred.', 'error');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6 text-blue-700 text-center">Fuel Price Entry</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="fuelTypeID" className="block text-sm font-medium text-gray-700 mb-1">Fuel Type <span className="text-red-500">*</span></label>
          <select
            id="fuelTypeID"
            name="fuelTypeID"
            value={formData.fuelTypeID || ''}
            onChange={handleChange}
            required
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">Select Fuel Type</option>
            {fuelTypes.map((type) => (
              <option key={type.fuelTypeID} value={type.fuelTypeID}>
                {type.fuelTypeName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">Price (MMK) <span className="text-red-500">*</span></label>
          <input
            type="number"
            id="price"
            name="price"
            value={formData.price}
            onChange={handleChange}
            step="0.01"
            required
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="effectiveDate" className="block text-sm font-medium text-gray-700 mb-1">Effective Date <span className="text-red-500">*</span></label>
          <input
            type="date"
            id="effectiveDate"
            name="effectiveDate"
            value={formData.effectiveDate}
            onChange={handleChange}
            required
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="supplierID" className="block text-sm font-medium text-gray-700 mb-1">Supplier (Optional)</label>
          <select
            id="supplierID"
            name="supplierID"
            value={formData.supplierID || ''}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">Select Supplier</option>
            {suppliers.map((supplier) => (
              <option key={supplier.supplierID} value={supplier.supplierID}>
                {supplier.supplierName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="townshipID" className="block text-sm font-medium text-gray-700 mb-1">Township (Optional)</label>
          <select
            id="townshipID"
            name="townshipID"
            value={formData.townshipID || ''}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">Select Township</option>
            {townships.map((township) => (
              <option key={township.townshipID} value={township.townshipID}>
                {township.townshipName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="siteID" className="block text-sm font-medium text-gray-700 mb-1">Site (Optional)</label>
          <select
            id="siteID"
            name="siteID"
            value={formData.siteID || ''}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">Select Site</option>
            {sites.map((site) => (
              <option key={site.siteID} value={site.siteID}>
                {site.siteName}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105"
        >
          Add Fuel Price
        </button>
      </form>
    </div>
  );
}

// --- Transaction Entry Component ---
function TransactionEntry({ showMessage }) {
  const [fuelTypes, setFuelTypes] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [sites, setSites] = useState([]);
  const [fuelPrices, setFuelPrices] = useState([]); // To fetch available fuel prices

  const [formData, setFormData] = useState({
    transactionType: '',
    sourceLocationType: '',
    sourceLocationID: '',
    destinationLocationType: '',
    destinationLocationID: '',
    fuelTypeID: '',
    quantity: '',
    transactionDate: new Date().toISOString().slice(0, 16), // Default to current date/time
    fuelPriceID: '',
    transportationCost: '0',
    loadingUnloadingCost: '0',
    otherCost: '0',
    notes: '',
  });

  useEffect(() => {
    fetchMasterData();
    fetchFuelPrices();
  }, []);

  const fetchMasterData = async () => {
    try {
      const [fuelTypesRes, suppliersRes, warehousesRes, sitesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/fueltypes`),
        fetch(`${API_BASE_URL}/suppliers`),
        fetch(`${API_BASE_URL}/warehouses`),
        fetch(`${API_BASE_URL}/sites`),
      ]);

      const fuelTypesData = await fuelTypesRes.json();
      const suppliersData = await suppliersRes.json();
      const warehousesData = await warehousesRes.json();
      const sitesData = await sitesRes.json();

      setFuelTypes(fuelTypesData);
      setSuppliers(suppliersData);
      setWarehouses(warehousesData);
      setSites(sitesData);
    } catch (error) {
      console.error('Error fetching master data:', error);
      showMessage('Failed to load master data for transaction entry.', 'error');
    }
  };

  const fetchFuelPrices = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/fuelprices`);
      if (!response.ok) throw new Error('Failed to fetch fuel prices');
      const data = await response.json();
      setFuelPrices(data);
    } catch (error) {
      console.error('Error fetching fuel prices:', error);
      showMessage('Failed to load fuel prices.', 'error');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        fuelTypeID: parseInt(formData.fuelTypeID),
        quantity: parseFloat(formData.quantity),
        sourceLocationID: parseInt(formData.sourceLocationID),
        destinationLocationID: parseInt(formData.destinationLocationID),
        fuelPriceID: formData.fuelPriceID ? parseInt(formData.fuelPriceID) : null,
        transportationCost: parseFloat(formData.transportationCost),
        loadingUnloadingCost: parseFloat(formData.loadingUnloadingCost),
        otherCost: parseFloat(formData.otherCost),
        transactionDate: new Date(formData.transactionDate).toISOString(), // Ensure ISO format for backend
      };

      const response = await fetch(`${API_BASE_URL}/fueltransactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (response.ok) {
        showMessage(result.message, 'success');
        setFormData({ // Reset form
          transactionType: '', sourceLocationType: '', sourceLocationID: '',
          destinationLocationType: '', destinationLocationID: '', fuelTypeID: '',
          quantity: '', transactionDate: new Date().toISOString().slice(0, 16),
          fuelPriceID: '', transportationCost: '0', loadingUnloadingCost: '0',
          otherCost: '0', notes: '',
        });
      } else {
        showMessage(`Error: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('Error submitting transaction:', error);
      showMessage('An unexpected error occurred.', 'error');
    }
  };

  // Helper to filter locations based on type
  const getLocationsForType = (type) => {
    if (type === 'Supplier') return suppliers;
    if (type === 'Warehouse') return warehouses;
    if (type === 'Site') return sites;
    return [];
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6 text-blue-700 text-center">Fuel Transaction Entry</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Transaction Type */}
        <div>
          <label htmlFor="transactionType" className="block text-sm font-medium text-gray-700 mb-1">Transaction Type <span className="text-red-500">*</span></label>
          <select
            id="transactionType"
            name="transactionType"
            value={formData.transactionType}
            onChange={handleChange}
            required
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">Select Transaction Type</option>
            <option value="Replenishment Process 1">Replenishment Process 1 (Supplier to WH/Site)</option>
            <option value="Replenishment Process 2">Replenishment Process 2 (Warehouse to Site)</option>
            <option value="Fuel Transfer Process">Fuel Transfer Process (Other Transfers)</option>
          </select>
        </div>

        {/* Source Location */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="sourceLocationType" className="block text-sm font-medium text-gray-700 mb-1">Source Type <span className="text-red-500">*</span></label>
            <select
              id="sourceLocationType"
              name="sourceLocationType"
              value={formData.sourceLocationType}
              onChange={handleChange}
              required
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">Select Source Type</option>
              <option value="Supplier">Supplier</option>
              <option value="Warehouse">Warehouse</option>
              <option value="Site">Site</option>
            </select>
          </div>
          <div>
            <label htmlFor="sourceLocationID" className="block text-sm font-medium text-gray-700 mb-1">Source Name <span className="text-red-500">*</span></label>
            <select
              id="sourceLocationID"
              name="sourceLocationID"
              value={formData.sourceLocationID}
              onChange={handleChange}
              required
              disabled={!formData.sourceLocationType}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-50"
            >
              <option value="">Select Source</option>
              {getLocationsForType(formData.sourceLocationType).map((loc) => (
                <option
                  key={loc.supplierID || loc.warehouseID || loc.siteID}
                  value={loc.supplierID || loc.warehouseID || loc.siteID}
                >
                  {loc.supplierName || loc.warehouseName || loc.siteName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Destination Location */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="destinationLocationType" className="block text-sm font-medium text-gray-700 mb-1">Destination Type <span className="text-red-500">*</span></label>
            <select
              id="destinationLocationType"
              name="destinationLocationType"
              value={formData.destinationLocationType}
              onChange={handleChange}
              required
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">Select Destination Type</option>
              <option value="Warehouse">Warehouse</option>
              <option value="Site">Site</option>
            </select>
          </div>
          <div>
            <label htmlFor="destinationLocationID" className="block text-sm font-medium text-gray-700 mb-1">Destination Name <span className="text-red-500">*</span></label>
            <select
              id="destinationLocationID"
              name="destinationLocationID"
              value={formData.destinationLocationID}
              onChange={handleChange}
              required
              disabled={!formData.destinationLocationType}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-50"
            >
              <option value="">Select Destination</option>
              {getLocationsForType(formData.destinationLocationType).map((loc) => (
                <option
                  key={loc.warehouseID || loc.siteID}
                  value={loc.warehouseID || loc.siteID}
                >
                  {loc.warehouseName || loc.siteName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Fuel Type & Quantity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="fuelTypeID" className="block text-sm font-medium text-gray-700 mb-1">Fuel Type <span className="text-red-500">*</span></label>
            <select
              id="fuelTypeID"
              name="fuelTypeID"
              value={formData.fuelTypeID}
              onChange={handleChange}
              required
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">Select Fuel Type</option>
              {fuelTypes.map((type) => (
                <option key={type.fuelTypeID} value={type.fuelTypeID}>
                  {type.fuelTypeName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">Quantity (Liters) <span className="text-red-500">*</span></label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              step="0.01"
              required
              min="0.01"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>

        {/* Transaction Date & Fuel Price */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="transactionDate" className="block text-sm font-medium text-gray-700 mb-1">Transaction Date & Time <span className="text-red-500">*</span></label>
            <input
              type="datetime-local"
              id="transactionDate"
              name="transactionDate"
              value={formData.transactionDate}
              onChange={handleChange}
              required
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="fuelPriceID" className="block text-sm font-medium text-gray-700 mb-1">Associated Fuel Price (Optional)</label>
            <select
              id="fuelPriceID"
              name="fuelPriceID"
              value={formData.fuelPriceID}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">Select Price (if applicable)</option>
              {fuelPrices
                .filter(fp => fp.fuelTypeID === parseInt(formData.fuelTypeID)) // Filter by selected fuel type
                .sort((a, b) => new Date(b.effectiveDate) - new Date(a.effectiveDate)) // Sort by latest date first
                .map((fp) => (
                  <option key={fp.fuelPriceID} value={fp.fuelPriceID}>
                    {fp.effectiveDate} - {fp.price.toFixed(2)} MMK {fp.supplierName ? `(${fp.supplierName})` : ''}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Cost Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="transportationCost" className="block text-sm font-medium text-gray-700 mb-1">Transportation Cost</label>
            <input
              type="number"
              id="transportationCost"
              name="transportationCost"
              value={formData.transportationCost}
              onChange={handleChange}
              step="0.01"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="loadingUnloadingCost" className="block text-sm font-medium text-gray-700 mb-1">Loading/Unloading Cost</label>
            <input
              type="number"
              id="loadingUnloadingCost"
              name="loadingUnloadingCost"
              value={formData.loadingUnloadingCost}
              onChange={handleChange}
              step="0.01"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="otherCost" className="block text-sm font-medium text-gray-700 mb-1">Other Cost</label>
            <input
              type="number"
              id="otherCost"
              name="otherCost"
              value={formData.otherCost}
              onChange={handleChange}
              step="0.01"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="3"
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          ></textarea>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105"
        >
          Record Transaction
        </button>
      </form>
    </div>
  );
}

// --- Reports Component (Placeholder) ---
function Reports({ showMessage }) {
  const [activeReport, setActiveReport] = useState('inventory');
  const [inventory, setInventory] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [priceFluctuations, setPriceFluctuations] = useState([]);

  useEffect(() => {
    // Fetch data for all reports when the component mounts
    fetchInventory();
    fetchTransactions();
    fetchPriceFluctuations();
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/fuelinventory`);
      if (!response.ok) throw new Error('Failed to fetch inventory');
      const data = await response.json();
      setInventory(data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      showMessage('Failed to load inventory data for reports.', 'error');
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/fueltransactions`);
      if (!response.ok) throw new Error('Failed to fetch transactions');
      const data = await response.json();
      setTransactions(data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      showMessage('Failed to load transaction data for reports.', 'error');
    }
  };

  const fetchPriceFluctuations = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/pricefluctuations`);
      if (!response.ok) throw new Error('Failed to fetch price fluctuations');
      const data = await response.json();
      setPriceFluctuations(data);
    } catch (error) {
      console.error('Error fetching price fluctuations:', error);
      showMessage('Failed to load price fluctuation data for reports.', 'error');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold mb-6 text-blue-700 text-center">Reports</h2>

      <div className="flex flex-wrap justify-center gap-4 mb-6">
        <button
          onClick={() => setActiveReport('inventory')}
          className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
            activeReport === 'inventory' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          Current Inventory
        </button>
        <button
          onClick={() => setActiveReport('transactions')}
          className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
            activeReport === 'transactions' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          All Transactions
        </button>
        <button
          onClick={() => setActiveReport('priceFluctuations')}
          className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
            activeReport === 'priceFluctuations' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          Price Fluctuations
        </button>
        {/* Add more buttons for other reports as needed */}
      </div>

      {activeReport === 'inventory' && (
        <div>
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Current Fuel Inventory</h3>
          {inventory.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fuel Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stock (Liters)</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {inventory.map((item) => (
                    <tr key={item.inventoryID}>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.fuelTypeName}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.locationType}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.locationName}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.currentStock.toFixed(2)}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(item.lastUpdated).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-600">No inventory data to display.</p>
          )}
        </div>
      )}

      {activeReport === 'transactions' && (
        <div>
          <h3 className="text-xl font-semibold mb-4 text-gray-800">All Fuel Transactions</h3>
          {transactions.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destination</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fuel</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cost</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((t) => (
                    <tr key={t.transactionID}>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{t.usageTransitionID.substring(0, 8)}...</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{t.transactionType}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{t.sourceLocationName} ({t.sourceLocationType})</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{t.destinationLocationName} ({t.destinationLocationType})</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{t.fuelTypeName}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{t.quantity.toFixed(2)}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(t.transactionDate).toLocaleString()}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{t.totalCost ? t.totalCost.toFixed(2) : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-600">No transaction data to display.</p>
          )}
        </div>
      )}

      {activeReport === 'priceFluctuations' && (
        <div>
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Fuel Price Fluctuations</h3>
          {priceFluctuations.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fuel Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Price</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Previous Price</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Change</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {priceFluctuations.map((f) => (
                    <tr key={f.fluctuationID}>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{f.fuelTypeName}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{f.fluctuationDate}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{f.currentPrice.toFixed(2)}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{f.previousPrice ? f.previousPrice.toFixed(2) : '-'}</td>
                      <td className={`px-4 py-4 whitespace-nowrap text-sm ${f.fluctuationAmount > 0 ? 'text-green-600' : f.fluctuationAmount < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                        {f.fluctuationAmount ? f.fluctuationAmount.toFixed(2) : '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{f.fluctuationType}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-600">No price fluctuation data to display.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
